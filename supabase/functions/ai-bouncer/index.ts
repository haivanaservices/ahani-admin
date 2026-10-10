import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai";

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

    // --- STRICT AUTHENTICATION ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized citizen request");

    // --- HUMAN-SPEED RATE LIMIT (3-Second Lock) ---
    const { data: lastScan } = await supabaseAdmin
      .from('scan_logs')
      .select('created_at')
      .eq('citizen_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastScan) {
      const timeSinceLastScan = Date.now() - new Date(lastScan.created_at).getTime();
      if (timeSinceLastScan < 3000) {
        throw new Error("Rate limit exceeded. Please wait a few seconds between scans.");
      }
    }

    const { imageBase64, targetLanguage, activeCampaignId } = await req.json();

    let billedTo = '';
    let billedAgencyId = null;
    let documentFingerprint = null;
    let documentClassification = 'Unrecognized Document';
    let outcomeStatus = 'Pending';
    let aiReasoning = null; // Captures why the document matched for auditing

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
      documentClassification = 'Verified via QR Campaign';
      outcomeStatus = 'Success - Billed via Touchpoint';
    } else {
      // SCENARIO B & C: The Couch Scan (AI Verification)
      // --- PRE-FLIGHT WALLET CHECK ---
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from('citizen_wallets')
        .select('monthly_free_scans_used, monthly_free_scans_max, is_premium')
        .eq('citizen_id', user.id)
        .single();

      if (walletError || !wallet) throw new Error("Citizen wallet not found");
      const hasCapacity = wallet.is_premium || (wallet.monthly_free_scans_used < wallet.monthly_free_scans_max);
      if (!hasCapacity) {
        throw new Error("You have no free scans remaining. Please upgrade to continue scanning unrecognized documents.");
      }

      const openai = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY')
      });

      // --- LAYER 1 FIREWALL: Only pull fingerprints for funded agencies ---
      const { data: agencies, error: agenciesError } = await supabaseAdmin
        .rpc('get_funded_fingerprints');
      if (agenciesError) throw new Error(`Failed to load fingerprints: ${agenciesError.message}`);
      if (!agencies || agencies.length === 0) {
        // No agencies have budget. Force a citizen-paid fallback without spending OpenAI API credits.
        throw new Error("No agencies are currently accepting direct billing. Please check back later.");
      }

      // --- OPENAI PROMPT & VISION REQUEST (CONTEXTUAL UPGRADE) ---
      const prompt = `
        You are a forensic document auditor for a government language access platform.
        Analyze the attached document image and compare it against this JSON list of established Agency DNA Profiles:
        ${JSON.stringify(agencies)}
        
        Evaluate the document using these 3 vectors:
        1. Core Entities: Do explicit names, addresses, or form codes match?
        2. Linguistic Markers: Does the legal jargon, statutory phrasing, or tone align?
        3. Contextual Spirit: Does the underlying subject matter match what the agency does? (Crucial for multi-page documents missing a logo).
        
        If the document's context matches an agency profile and scores above their passing_score threshold (e.g. 75), return ONLY this strict JSON:
        { "match": true, "agency_id": "the-matching-uuid", "fingerprint": "matched-core-element", "classification": "Document Title/Type", "confidence_score": 85, "reasoning": "short explanation of why it matched based on context" }
        
        If no match is found, return ONLY:
        { "match": false, "classification": "Unrecognized Document", "confidence_score": 0, "reasoning": "Did not match the linguistic markers or spirit of any funded agency profile" }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are an AI forensic document verification system. You output strict JSON."
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
      documentClassification = aiResponse.classification || 'Unknown Document';
      aiReasoning = aiResponse.reasoning;

      if (aiResponse.match) {
        // --- LAYER 2 FIREWALL: VELOCITY LOCK ---
        // Allow up to 35 scans per hour to accommodate multi-page packets
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentAgencyBills, error: countError } = await supabaseAdmin
          .from('scan_logs')
          .select('*', { count: 'exact', head: true })
          .eq('citizen_id', user.id)
          .eq('billed_agency_id', aiResponse.agency_id)
          .gte('created_at', oneHourAgo);

        if (countError) throw new Error(`Velocity check failed: ${countError.message}`);

        if (recentAgencyBills !== null && recentAgencyBills >= 35) {
          // Lock triggered: Force bill to the citizen instead of the agency
          billedTo = 'citizen_free';
          outcomeStatus = 'Rejected - Anti-Spam Velocity Lock (35/hr exceeded)';
        } else {
          // Safe to bill the agency
          billedTo = 'agency_fingerprint_match';
          billedAgencyId = aiResponse.agency_id;
          documentFingerprint = aiResponse.fingerprint;
          outcomeStatus = `Success - Match (Score: ${aiResponse.confidence_score || 100})`;
        }
      } else {
        billedTo = 'citizen_free';
        outcomeStatus = `Rejected - Security Fail. Reason: ${aiResponse.reasoning || 'No match'}`;
      }
    }

    // 2. Stop the Latency Timer
    const processingTimeMs = Math.round(performance.now() - startTime);

    // --- WRITE THE LEDGER RECEIPT ---
    const { data: scanLog, error: logError } = await supabaseAdmin
      .from('scan_logs')
      .insert({
        citizen_id: user.id,
        billed_to: billedTo,
        billed_agency_id: billedAgencyId,
        campaign_id: activeCampaignId || null,
        language_selected: targetLanguage,
        document_fingerprint_matched: documentFingerprint,
        document_classification: documentClassification,
        processing_time_ms: processingTimeMs,
        outcome_status: outcomeStatus,
        pii_retained: false
      })
      .select()
      .single();

    if (logError) throw logError;
    if (!scanLog) throw new Error("Failed to generate ledger receipt");

    // --- EXECUTE THE ATOMIC DEDUCTION ---
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
        classification_extracted: documentClassification,
        ai_reasoning: aiReasoning
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