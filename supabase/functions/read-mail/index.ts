// @ts-nocheck
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js';
import { Buffer } from 'node:buffer';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

// We use the Service Role key here to securely execute backend RPCs
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  // 1. MUST HAVE CORS FOR WEB BROWSER COMPATIBILITY
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const executionStartTime = Date.now();
    console.log("=== STARTING READ-MAIL FUNCTION ===");

    const { 
      filePath, 
      targetLanguage, 
      generateAudio, 
      question, 
      saved_qr_codes,
      allow_citizen_billing,
      use_personal_credits 
    } = await req.json();

    console.log("📥 Payload received | targetLanguage:", targetLanguage, "| use_personal_credits:", use_personal_credits);

    if (!filePath) {
      console.error("❌ ERROR: No file path provided.");
      return new Response(JSON.stringify({ error: 'No file path provided' }), { status: 400, headers: corsHeaders });
    }

    const { data: urlData, error: urlError } = await supabase.storage
      .from('ephemeral_scans')
      .createSignedUrl(filePath, 60);

    if (urlError) throw urlError;

    // FIX 1: Changed 'citizen' to 'citizen_paid' to pass ENUM validation
    let billedTo = 'citizen_paid'; 
    let matchedAgencyId = null;
    let targetCampaignId = null;
    let userEmail = null;
    let userId = null;

    // 2. SECURELY IDENTIFY THE USER
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        
        if (userData?.user?.id && !userError) {
          userId = userData.user.id;
          userEmail = userData.user.email;
          console.log(`👤 Verified User: ${userEmail} (${userId})`);
        }
      } catch (e) {
        console.log("Anonymous user detected, skipping auth extraction.");
      }
    }

    // 3. ATTEMPT AGENCY MATCHING FIRST (With new Highest-Score Campaign Routing)
    if (saved_qr_codes && Array.isArray(saved_qr_codes) && saved_qr_codes.length > 0) {
      const clean_qr_codes = saved_qr_codes.map((code: string) => {
        const match = code.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return match ? match[0] : code;
      });

      console.log(`🔍 Fetching DNA Profiles from database...`);

      // Find which agencies these QRs belong to first
      const { data: initialCampaigns } = await supabase
        .from('campaigns')
        .select('agency_id')
        .in('id', clean_qr_codes); 

      if (initialCampaigns && initialCampaigns.length > 0) {
        const agencyIds = [...new Set(initialCampaigns.map(c => c.agency_id))];
        
        // Fetch ALL campaigns for these agencies, ordered newest-first for the automatic tie-breaker
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, agency_id, name, fingerprint_rules')
          .in('agency_id', agencyIds)
          .order('created_at', { ascending: false });

        if (campaigns && campaigns.length > 0) {
          let profilesText = "";
          campaigns.forEach(c => {
             profilesText += `Campaign ID: ${c.id}\nAgency ID: ${c.agency_id}\nCampaign Name: ${c.name}\nProfile DNA: ${JSON.stringify(c.fingerprint_rules)}\n\n`;
          });

          const matcherPrompt = `You are a forensic document auditor. Analyze the attached document and compare it against the following established Agency DNA Profiles and their Campaigns:
${profilesText}
CRITICAL OPTICAL INSTRUCTIONS:
- You must completely ignore any Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels. 
- Look strictly past the optical distortion to extract the underlying text of the document.

Score the document against EVERY Campaign ID provided. If it aligns with the contextual spirit and contains definitive core entities, give it a high score (85-100).

Respond strictly with a valid JSON object in this format:
{
  "matched_agency_id": "the exact Agency ID if a match is found (score >= 75), or null if no match",
  "campaign_scores": { "exact_campaign_id": <integer 0-100> },
  "confidence_score": <overall integer 0-100>,
  "reasoning": "One concise sentence explaining why it matched or failed"
}`;

          const matcherCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', 
            messages: [
              { role: 'system', content: matcherPrompt },
              { role: 'user', content: [{ type: 'image_url', image_url: { url: urlData.signedUrl, detail: 'high' } }] }
            ],
            max_tokens: 300,
            response_format: { type: 'json_object' } // Force JSON to prevent parsing crashes
          });

          try {
            const aiResponseText = matcherCompletion.choices[0].message.content || "{}";
            console.log(`🤖 AI Raw JSON Response:\n`, aiResponseText);

            const matchResult = JSON.parse(aiResponseText);
            console.log(`📊 Parsed Result -> Agency: ${matchResult.matched_agency_id} | Score: ${matchResult.confidence_score} | Reason: ${matchResult.reasoning}`);

            if (matchResult.matched_agency_id && matchResult.confidence_score >= 75) {
              console.log("✅ MATCH SUCCESS! Score meets threshold (>= 75). Checking Agency Quota...");
              
              const { data: subData } = await supabase
                .from('annual_subscriptions')
                .select('scans_used, max_scans')
                .eq('agency_id', matchResult.matched_agency_id)
                .eq('is_active', true)
                .maybeSingle();

              if (subData && subData.scans_used >= subData.max_scans) {
                console.log("⚠️ Agency quota is depleted! Revoking match and falling back to Citizen Billing.");
              } else {
                console.log("🟢 Agency has available scans. Proceeding with agency billing.");
                
                matchedAgencyId = matchResult.matched_agency_id;
                targetCampaignId = null;
                
                // Route to the highest scoring campaign (ordered newest-first automatically handles ties)
                let highestScore = -1;
                if (matchResult.campaign_scores) {
                  for (const c of campaigns) {
                    const score = matchResult.campaign_scores[c.id] || 0;
                    if (score > highestScore && score >= 75) {
                      highestScore = score;
                      targetCampaignId = c.id;
                    }
                  }
                }

                // Fallback to their primary campaign if scoring failed but the agency matched
                if (!targetCampaignId) {
                  const matchedCampaignObj = campaigns.find(c => c.agency_id === matchedAgencyId);
                  targetCampaignId = matchedCampaignObj ? matchedCampaignObj.id : null;
                }
                
                billedTo = 'agency_fingerprint_match';

                await supabase.rpc('process_scan_billing', {
                  p_billed_to: 'agency_fingerprint_match',
                  p_agency_id: matchedAgencyId,
                  p_citizen_id: null
                });
                
                if (targetCampaignId) {
                   const matchedCampaign = campaigns.find(c => c.id === targetCampaignId);
                   if (matchedCampaign) {
                     await supabase.from('campaigns')
                      .update({ total_scans: (matchedCampaign.total_scans || 0) + 1 })
                      .eq('id', targetCampaignId);
                   }
                }
              }
            } else {
              console.log("❌ MATCH REJECTED: Score below 75 or missing matched_agency_id.");
            }
          } catch (parseError) {
            console.error("❌ Failed to parse AI Matcher JSON:", parseError);
          }
        }
      }
    }

    // 4. THE BOUNCER: CONSUMER PAYMENT DEDUCTION
    if (!matchedAgencyId) {
      console.log("🛑 BOUNCER: No Agency match established.");

      if (!userId) {
         console.log("🛑 BOUNCER: Missing user ID. Cannot process personal credits.");
         return new Response(JSON.stringify({ error: 'Unauthorized. Please link your wallet.' }), { status: 401, headers: corsHeaders });
      }

      const { data: walletData } = await supabase
        .from('citizen_wallets')
        .select('monthly_free_scans_used, monthly_free_scans_max, purchased_credits')
        .eq('citizen_id', userId)
        .single();

      const wallet = walletData || { monthly_free_scans_max: 0, monthly_free_scans_used: 0, purchased_credits: 0 };
      const freeScansLeft = Math.max(0, wallet.monthly_free_scans_max - wallet.monthly_free_scans_used);
      const paidCredits = wallet.purchased_credits || 0;

      let deductionType = '';

      if (freeScansLeft > 0) {
        console.log(`🎁 User has ${freeScansLeft} free scans left. Utilizing free tier.`);
        deductionType = 'free';
      } else {
        console.log(`💳 Out of free scans. Checking purchased credits (Balance: ${paidCredits}).`);
        
        if (!use_personal_credits && !allow_citizen_billing) {
           console.log("🛑 BOUNCER: use_personal_credits is FALSE. Throwing 404 to prompt payment choice.");
           return new Response(JSON.stringify({ 
             error: 'No matching agency found. Prompting user for payment choice.' 
           }), { 
             status: 404,
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
           });
        }

        if (paidCredits > 0) {
          deductionType = 'paid';
        } else {
           console.log("❌ Deduction failed. Insufficient funds.");
           return new Response(JSON.stringify({ 
             error: 'Insufficient personal credits.' 
           }), { 
             status: 402, 
             headers: { ...corsHeaders, 'Content-Type': 'application/json' }
           });
        }
      }

      console.log(`💸 Attempting to deduct 1 '${deductionType}' credit from ${userId}...`);
      
      const { error: deductionError } = await supabase.rpc('process_consumer_scan_deduction', { 
        p_citizen_id: userId,
        p_deduction_type: deductionType
      });

      if (deductionError) {
         console.log("❌ Deduction RPC failed.", deductionError);
         return new Response(JSON.stringify({ error: 'Failed to deduct credit.' }), { status: 500, headers: corsHeaders });
      }
      
      console.log("🟢 BOUNCER: Credit successfully deducted! Proceeding with Citizen Billing.");
      billedTo = deductionType === 'free' ? 'citizen_free' : 'citizen_paid';
    }

    // 5. TRANSLATION & AUDIO ENGINE (With Analytics Buckets)
    console.log("🗣️ Starting Translation & Audio Engine...");
    const lang = targetLanguage || 'English';
    let systemPrompt = "";
    let userPrompt = "";

    const universalBuckets = `
UNIVERSAL DOCUMENT BUCKETS (Categorize the OVERALL DOCUMENT into ONE of these):
1. "General Information & Rights"
2. "Action Required / Forms"
3. "Financial & Billing"
4. "Status Decision & Eligibility"
5. "Appointments & Scheduling"

FRICTION HEATMAP BUCKETS (If the user asks a question, categorize the QUESTION'S INTENT into ONE of these exact strings):
- "payment_fee" (Question asks about money, costs, fines, fees, owing, or paying)
- "deadline_urgency" (Question asks about due dates, deadlines, timeframes, or "when")
- "contact_location" (Question asks about addresses, phone numbers, offices, or "where")
- "benefit_impact" (Question asks about eligibility, status, approvals, denials, or "what this means")
- "action_required" (Question asks about what to do next, how to fill it out, or general instructions)
`;

    if (question) {
      systemPrompt = `You are a strict, direct executive assistant. Answer the user's question based on the document provided.
CRITICAL OPTICAL INSTRUCTIONS: Ignore Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels.
CRITICAL LANGUAGE INSTRUCTION: You MUST write your translation natively in ${lang}. DO NOT output any English unless ${lang} is English. If the document is in English, translate your answer to ${lang}.
CRITICAL FORMATTING INSTRUCTION: Do NOT include conversational filler like "The document says". Answer directly and concisely. Write numbers and dates as full words. Ignore formatting dots, lines, and underscores.
${universalBuckets}
You MUST respond strictly with a valid JSON object in this format:
{
  "translation": "Your direct answer natively in ${lang}",
  "document_classification": "One of the 5 Universal Document Buckets",
  "is_follow_up_question": true,
  "friction_category": "One of the 5 Friction Heatmap Buckets"
}`;
      userPrompt = `Please answer this question based on the document: "${question}"`;
    } 
    else {
      systemPrompt = `You are a strict, highly efficient executive assistant for a non-native English speaker. Read the attached document and extract the information.
CRITICAL OPTICAL INSTRUCTIONS: Ignore Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels.
CRITICAL LANGUAGE INSTRUCTION: You MUST translate and output your entire translation natively in ${lang}. DO NOT write in English unless ${lang} is English.
${universalBuckets}
You MUST respond strictly with a valid JSON object in this format:
{
  "translation": "[TRANSLATE 'STATUS' TO ${lang}]: [URGENT / ACTION NEEDED / NO ACTION NEEDED / JUNK MAIL]\\n[TRANSLATE 'SUMMARY' TO ${lang}]: [Exactly 1 concise sentence]\\n[TRANSLATE 'KEY DETAILS' TO ${lang}]:\\n- [Detail 1]\\n- [Detail 2]",
  "document_classification": "One of the 5 Universal Document Buckets",
  "is_follow_up_question": false,
  "friction_category": null
}`;
      userPrompt = `Analyze this document and translate the results to ${lang}.`;
    }

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: urlData.signedUrl, detail: 'high' } }
          ] 
        }
      ],
      max_tokens: 500, 
      response_format: { type: 'json_object' } // Force JSON to prevent text chunk parsing errors
    });

    const rawText = chatCompletion.choices[0].message.content || "{}";
    let aiPayload: any = {};
    try {
      aiPayload = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse Translation JSON", e);
    }

    // Extract the translation string for the UI and Audio engine
    const cleanText = (aiPayload.translation || "").replace(/\.{2,}/g, '. ').replace(/_{2,}/g, ' ').replace(/-{2,}/g, ' ').replace(/…/g, '. ').trim();

    let audioBase64 = null;
    if (generateAudio && cleanText) {
      console.log("🎙️ Generating TTS audio payload...");
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'nova', 
        input: cleanText, 
      });
      const buffer = await mp3.arrayBuffer();
      audioBase64 = Buffer.from(buffer).toString('base64');
    }

   // 6. TELEMETRY & LOGGING (Run securely before returning)
    const processingTimeMs = Date.now() - executionStartTime;
    
    // Map the Friction Heatmap bucket to the category column, or fallback to General Information
    // FIX: The database 'category' column has strict DB constraints. We MUST use these exact strings!
    const documentCategory = question ? 'Request for Action / Info' : 'General Information';

    // WORKAROUND: Since 'document_classification' is unrestricted free-text, we will store the friction bucket here for follow-up questions!
    const documentClassification = question 
      ? (aiPayload.friction_category || 'action_required')
      : (aiPayload.document_classification || 'UnrecognizedDocument');

    if (!targetCampaignId && matchedAgencyId) {
      const { data: fallbackCampaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('agency_id', matchedAgencyId)
        .limit(1)
        .maybeSingle();
      if (fallbackCampaign) targetCampaignId = fallbackCampaign.id;
    }

    console.log(`📝 Writing to scan_logs... (${processingTimeMs}ms)`);
    
    const { error: logError } = await supabase.from('scan_logs').insert({
      agency_id: matchedAgencyId,
      campaign_id: targetCampaignId,
      citizen_id: userId,
      category: documentCategory,
      
      target_language: targetLanguage || 'English',
      language_selected: targetLanguage || 'English',
      language_code: targetLanguage || 'English', 
      
      status: 'approved',
      outcome_status: 'Delivered', 
      
      // AI driven taxonomy categories for Analytics
      document_classification: documentClassification,
      pii_retained: false, 
      
      billed_to: billedTo,
      processing_time_ms: processingTimeMs,
      document_fingerprint_matched: matchedAgencyId ? 'yes' : 'no'
    });

    if (logError) {
      console.error("❌ Failed to write to scan_logs:", logError);
    } else {
      console.log("✅ Successfully logged to scan_logs");
    }

    console.log(`✅ FUNCTION COMPLETE. Billed to: ${billedTo}`);
    return new Response(JSON.stringify({ 
      result: cleanText, 
      audioBase64: audioBase64,
      billed_to: billedTo
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("❌ FATAL CATCH BLOCK ERROR:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});