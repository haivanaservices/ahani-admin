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

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, qrCodeId, targetLanguage } = await req.json();

    // 2. Fetch Agency Master Profile
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

    // Cast response to explicit type
    const campaignData = rawCampaignData as unknown as CampaignQueryResponse;

    // Fix TS(2339): Handle whether PostgREST returned agencies as an array or object
    const agencyRaw = campaignData.agencies;
    const agency: Agency | null = Array.isArray(agencyRaw) ? agencyRaw[0] : agencyRaw;

    if (!agency) {
      return new Response(
        JSON.stringify({ error: 'Agency profile not found for this campaign.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rules = agency.master_fingerprint_rules || {};
    const contextBoosters = Array.isArray(rules.context_boosters) ? rules.context_boosters : [];

    // 3. Construct Weighted Bouncer Prompt
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

    // 4. Call GPT-4o Vision for Pre-Check
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
    const status = aiResult.is_approved ? 'approved' : 'rejected_by_bouncer';

    // 5. Execute Supabase RPC Transaction
    const { data: transactionData, error: transactionError } = await supabase.rpc('process_scan_transaction', {
      p_qr_code_id: qrCodeId,
      p_category: aiResult.category,
      p_language: targetLanguage,
      p_status: status,
      p_cost: aiResult.is_approved ? 0.0160 : 0.0023,
      p_rejection_reason: aiResult.rejection_reason
    });

    if (transactionError || !transactionData?.success) {
      return new Response(
        JSON.stringify({ error: transactionData?.error || 'Transaction failed. Agency budget may be depleted.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Return Result
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