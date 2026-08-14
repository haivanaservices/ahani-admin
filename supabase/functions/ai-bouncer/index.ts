import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai"; // <-- Swapped to OpenAI

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. Start the Title VI Latency Timer
  const startTime = performance.now(); 

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized citizen request");

    const { imageBase64, targetLanguage, activeCampaignId } = await req.json();

    let billedTo = '';
    let billedAgencyId = null;
    let documentFingerprint = null;
    
    // NEW: Prepare Auditor Variables
    let documentClassification = 'Unrecognized Document'; 
    let outcomeStatus = 'Pending'; 

    if (activeCampaignId) {
      // SCENARIO A: The Hallway Scan (Skip AI, bill directly)
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('agency_id')
        .eq('id', activeCampaignId)
        .single();
        
      if (campaignError) throw new Error(`Campaign query error: ${campaignError.message}`);
      if (!campaign) throw new Error("Campaign not found");
        
      billedTo = 'agency_qr_session';
      billedAgencyId = campaign.agency_id;
      
      // NEW: Since we skipped AI, log it as a verified touchpoint
      documentClassification = 'Verified via QR Campaign'; 
      outcomeStatus = 'Success - Billed via Touchpoint'; 
      
    } else {
      // SCENARIO B & C: The Couch Scan (AI Verification)
      
      const openai = new OpenAI({ 
        apiKey: Deno.env.get('OPENAI_API_KEY') 
      });

      const { data: agencies, error: agenciesError } = await supabaseAdmin
        .from('agencies')
        .select('id, agency_name, master_fingerprint_rules')
        .not('master_fingerprint_rules', 'is', null);
        
      if (agenciesError) throw new Error(`Failed to load fingerprints: ${agenciesError.message}`);

      // OPENAI PROMPT
      const prompt = `
        You are an AI document verification system. 
        Analyze this document image. Compare it against this JSON list of agency fingerprints: 
        ${JSON.stringify(agencies)}
        
        If it matches an agency's primary markers and scores above their passing threshold, 
        return ONLY a JSON object exactly like this: {"match": true, "agency_id": "uuid-here", "fingerprint": "DMV_Form_A", "classification": "Notice of Action (or document title)"}
        
        If no match is found, return ONLY: {"match": false, "classification": "Unrecognized Document"}
      `;

      // OPENAI VISION REQUEST
      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        response_format: { type: "json_object" }, // Forces strict JSON output
        messages: [
          {
            role: "system",
            content: "You are an AI document verification system. You output strict JSON."
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ]
      });
      
      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Capture the classification for the auditor
      documentClassification = aiResponse.classification || 'Unknown Document';

      if (aiResponse.match) {
        billedTo = 'agency_fingerprint_match';
        billedAgencyId = aiResponse.agency_id;
        documentFingerprint = aiResponse.fingerprint;
        outcomeStatus = 'Success - Fingerprint Match';
      } else {
        billedTo = 'citizen_free'; 
        outcomeStatus = 'Rejected - Security Fail';
      }
    }

    // 2. Stop the Latency Timer
    const processingTimeMs = Math.round(performance.now() - startTime);

    // WRITE THE LEDGER RECEIPT
    const { data: scanLog, error: logError } = await supabaseAdmin
      .from('scan_logs')
      .insert({
        citizen_id: user.id,
        billed_to: billedTo,
        billed_agency_id: billedAgencyId,
        campaign_id: activeCampaignId || null,
        language_selected: targetLanguage,
        document_fingerprint_matched: documentFingerprint,
        
        // --- THE 4 NEW AUDITOR COLUMNS ---
        document_classification: documentClassification,
        processing_time_ms: processingTimeMs,
        outcome_status: outcomeStatus,
        pii_retained: false
      })
      .select()
      .single();

    if (logError) throw logError;
    if (!scanLog) throw new Error("Failed to generate ledger receipt");

    // EXECUTE THE ATOMIC DEDUCTION
    const { error: rpcError } = await supabaseAdmin.rpc('process_scan_billing', {
      p_citizen_id: user.id,
      p_billed_to: billedTo,
      p_agency_id: billedAgencyId
    });

    if (rpcError) throw new Error(`Billing failed: ${rpcError.message}`);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        ledger_receipt: scanLog.id,
        classification_extracted: documentClassification 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});