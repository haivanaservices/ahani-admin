import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'npm:openai';

// 1. Define explicit interfaces to fix Deno TS errors
interface Agency {
  agency_name: string;
  address: string | null;
  master_fingerprint_rules: {
    context_boosters?: string[];
  } | null;
}

interface CampaignQueryResponse {
  id: string;
  agency_id: string;
  agencies: Agency | Agency[] | null;
}

interface BouncerResult {
  is_approved: boolean;
  category: string | null;
  rejection_reason: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // --- 1. STRICT AUTHENTICATION ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized citizen request");

    // --- 2. HUMAN-SPEED RATE LIMIT (3-Second Lock) ---
    const { data: lastScan } = await supabase
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

    const { imageBase64, qrCodeId, targetLanguage } = await req.json();

    // 3. Fetch Agency Master Profile
    const { data: rawCampaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        id, 
        agency_id, 
        agencies ( agency_name, address, master_fingerprint_rules )
      `)
      .eq('qr_code_id', qrCodeId)
      .eq('status', 'ACTIVE')
      .single();

    if (campaignError || !rawCampaignData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive QR code.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignData = rawCampaignData as unknown as CampaignQueryResponse;
    const agencyRaw = campaignData.agencies;
    const agency: Agency | null = Array.isArray(agencyRaw) ? agencyRaw[0] : agencyRaw;
    const agencyId = campaignData.agency_id;
    const campaignId = campaignData.id;

    if (!agency) {
      return new Response(
        JSON.stringify({ error: 'Agency profile not found for this campaign.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 4. PRE-FLIGHT BUDGET CHECK (Layer 1 Shield) ---
    // Stops API draining by aborting before calling OpenAI if the agency is out of money
    const { data: subscription } = await supabase
      .from('annual_subscriptions')
      .select('scans_used, max_scans')
      .eq('agency_id', agencyId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!subscription || subscription.scans_used >= subscription.max_scans) {
      return new Response(
        JSON.stringify({ error: 'Agency budget depleted. Cannot process sponsored scan.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- 5. VELOCITY LOCK (Layer 2 Shield) ---
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentAgencyBills, error: countError } = await supabase
      .from('scan_logs')
      .select('*', { count: 'exact', head: true })
      .eq('citizen_id', user.id)
      .eq('billed_agency_id', agencyId)
      .gte('created_at', oneHourAgo);

    if (countError) throw new Error(`Velocity check failed: ${countError.message}`);

    if (recentAgencyBills !== null && recentAgencyBills >= 35) {
       return new Response(
         JSON.stringify({ error: 'Anti-Spam Lock: You have exceeded 35 sponsored scans per hour for this agency.' }),
         { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
    }

    // 6. Construct Weighted Bouncer Prompt
    const rules = agency.master_fingerprint_rules || {};
    const contextBoosters = Array.isArray(rules.context_boosters) ? rules.context_boosters : [];

    const systemPrompt = `
      You are a strict document verification bouncer for ${agency.agency_name}.
      The user is attempting to use a sponsored translation scan. 
      
      Evaluate the attached image against this specific agency fingerprint:
      DEALBREAKERS (Must hit at least 1):
      - Agency logo/seal for ${agency.agency_name} is visible.
      - Return address is ${agency.address || 'the official agency location'}.
      
      CONTEXT BOOSTERS (Must hit at least 2):
      ${
        contextBoosters.length > 0
          ? contextBoosters.map((r: string) => `- ${r}`).join('\n')
          : '- Standard bureaucratic headers or document numbers.'
      }
      
      Categorize the document into EXACTLY ONE of these categories:
      ['Notice of Action / Decision', 'Financial & Billing', 'Appointments & Scheduling', 'Request for Action / Info', 'Legal & Compliance', 'General Information'].
      
      Respond ONLY in strict JSON format:
      {
        "is_approved": boolean,
        "category": "string (from list above, or null if rejected)",
        "rejection_reason": "string (user-friendly reason if false, or null if true)"
      }
    `;

    // 7. Call GPT-4o Vision for Pre-Check
    const bouncerResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Verify this document.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ]
        }
      ]
    });

    const aiResult: BouncerResult = JSON.parse(bouncerResponse.choices[0].message.content || '{}');
    const processingTimeMs = Math.round(performance.now() - startTime);

    // --- 8. WRITE IMMUTABLE LEDGER RECEIPT ---
    const { data: scanLog, error: logError } = await supabase
      .from('scan_logs')
      .insert({
        citizen_id: user.id,
        billed_to: aiResult.is_approved ? 'agency_qr_session' : null,
        billed_agency_id: agencyId,
        campaign_id: campaignId,
        language_selected: targetLanguage,
        document_classification: aiResult.category || 'Unrecognized Document',
        processing_time_ms: processingTimeMs,
        outcome_status: aiResult.is_approved ? 'Success - Billed via QR Touchpoint' : 'Rejected - Bouncer Rules Failed',
        pii_retained: false
      })
      .select()
      .single();

    if (logError) throw logError;

    // --- 9. EXECUTE ATOMIC DEDUCTION (V2 RPC) ---
    // Only bill the agency if the AI bouncer actually approved the document
    if (aiResult.is_approved) {
      const { error: rpcError } = await supabase.rpc('process_scan_billing_v2', {
        p_billed_to: 'agency_qr_session',
        p_agency_id: agencyId,
        p_citizen_id: user.id,
        p_scan_log_id: scanLog?.id
      });

      if (rpcError) {
        return new Response(
          JSON.stringify({ error: `Billing failed: ${rpcError.message}` }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 10. Return Original Frontend Result
    if (!aiResult.is_approved) {
      return new Response(
        JSON.stringify({ success: false, message: aiResult.rejection_reason }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        category: aiResult.category,
        message: 'Document verified.' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});