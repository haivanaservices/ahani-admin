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
    console.log("=== STARTING READ-MAIL FUNCTION ===");

    // Extract the new use_personal_credits flag from the React frontend
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

    let billedTo = 'citizen';
    let matchedAgencyId = null;
    let userEmail = null;

    // 2. SECURELY IDENTIFY THE USER
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        
        if (userData?.user?.email && !userError) {
          userEmail = userData.user.email;
          console.log(`👤 Verified User Email: ${userEmail}`);
        }
      } catch (e) {
        console.log("Anonymous user detected, skipping auth extraction.");
      }
    }

    // 3. ATTEMPT AGENCY MATCHING FIRST (Untouched Logic)
    if (saved_qr_codes && Array.isArray(saved_qr_codes) && saved_qr_codes.length > 0) {
      const clean_qr_codes = saved_qr_codes.map((code: string) => {
        const match = code.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return match ? match[0] : code;
      });

      console.log(`🔍 Fetching DNA Profiles from database...`);

      const { data: campaigns, error: campaignError } = await supabase
        .from('campaigns')
        .select('agency_id, fingerprint_rules')
        .in('id', clean_qr_codes); 

      if (campaigns && campaigns.length > 0) {
        let profilesText = "";
        campaigns.forEach(c => {
           profilesText += `Agency ID: ${c.agency_id}\nProfile DNA: ${JSON.stringify(c.fingerprint_rules)}\n\n`;
        });

        const matcherPrompt = `You are a forensic document auditor. Analyze the attached document and compare it against the following established Agency DNA Profiles:
${profilesText}
CRITICAL OPTICAL INSTRUCTIONS:
- You must completely ignore any Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels. 
- Look strictly past the optical distortion to extract the underlying text of the document.

If the document strongly aligns with the "Contextual Spirit" and contains even ONE or TWO definitive "Core Entities", it is a definitive match (Score 85-100). 

Respond strictly with a valid JSON object in this format:
{
  "matched_agency_id": "the exact Agency ID if a match is found (score >= 75), or null if no match",
  "confidence_score": <integer 0-100>,
  "reasoning": "One concise sentence explaining why it matched or failed"
}`;

        const matcherCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', 
          messages: [
            { role: 'system', content: matcherPrompt },
            { role: 'user', content: [{ type: 'image_url', image_url: { url: urlData.signedUrl, detail: 'high' } }] }
          ],
          max_tokens: 300,
          response_format: { type: 'json_object' } 
        });

        try {
          const aiResponseText = matcherCompletion.choices[0].message.content || "{}";
          const matchResult = JSON.parse(aiResponseText);

          if (matchResult.matched_agency_id && matchResult.confidence_score >= 75) {
            console.log("✅ MATCH SUCCESS! Routing to Agency Billing.");
            matchedAgencyId = matchResult.matched_agency_id;
            billedTo = 'agency';
          }
        } catch (parseError) {
          console.error("❌ Failed to parse AI Matcher JSON");
        }
      }
    }

    // 4. THE BOUNCER: CONSUMER PAYMENT DEDUCTION
    if (!matchedAgencyId) {
      console.log("🛑 BOUNCER: No Agency match established.");
      
      // If the frontend didn't explicitly request personal credit usage, prompt them.
      if (!use_personal_credits && !allow_citizen_billing) {
         console.log("🛑 BOUNCER: use_personal_credits is FALSE. Throwing 404 to prompt payment choice.");
         return new Response(JSON.stringify({ 
           error: 'No matching agency found. Prompting user for payment choice.' 
         }), { 
           status: 404,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         });
      }

      // They want to pay. Verify identity and deduct credit atomically.
      if (!userEmail) {
         console.log("🛑 BOUNCER: Missing user email. Cannot process personal credits.");
         return new Response(JSON.stringify({ error: 'Unauthorized. Please link your wallet.' }), { status: 401, headers: corsHeaders });
      }

      console.log(`💸 Attempting to deduct 1 credit from ${userEmail}...`);
      const { data: approved, error: deductionError } = await supabase.rpc('spend_consumer_credit', { user_email: userEmail });

      if (!approved || deductionError) {
         console.log("❌ Deduction failed. Insufficient funds.", deductionError);
         return new Response(JSON.stringify({ 
           error: 'Insufficient personal credits.' 
         }), { 
           status: 402, 
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         });
      }
      
      console.log("🟢 BOUNCER: Credit successfully deducted! Proceeding with Citizen Billing.");
      billedTo = 'citizen';
    }

    // 5. TRANSLATION & AUDIO ENGINE (Untouched)
    console.log("🗣️ Starting Translation & Audio Engine...");
    const lang = targetLanguage || 'English';
    let systemPrompt = "";
    let userPrompt = "";

    if (question) {
      systemPrompt = `You are a strict, direct executive assistant. Answer the user's question based on the document provided.
CRITICAL OPTICAL INSTRUCTIONS: Ignore Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels.
CRITICAL INSTRUCTION: Do NOT include conversational filler like "The document says". Answer directly and concisely.
Write your entire response natively in ${lang}. Write numbers and dates as full words. Ignore formatting dots, lines, and underscores.`;
      userPrompt = `Please answer this question based on the document: "${question}"`;
    } 
    else {
      systemPrompt = `You are a strict, highly efficient executive assistant for a non-native English speaker. Read the attached document and immediately tell the user what they need to know in ${lang}.
CRITICAL OPTICAL INSTRUCTIONS: Ignore Moiré patterns, wavy interference lines, RGB pixel grids, screen glare, or monitor bezels.
CRITICAL FORMATTING INSTRUCTIONS: NO conversational filler. 
Format your exact response in these 3 parts (translate labels into ${lang}):
STATUS: [URGENT / ACTION NEEDED / NO ACTION NEEDED / JUNK MAIL]
SUMMARY: [Exactly 1 concise sentence explaining what this is.]
KEY DETAILS:
- [Detail 1]
- [Detail 2]`;
      userPrompt = `Analyze this document.`;
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
    });

    const rawText = chatCompletion.choices[0].message.content || "";
    const cleanText = rawText.replace(/\.{2,}/g, '. ').replace(/_{2,}/g, ' ').replace(/-{2,}/g, ' ').replace(/…/g, '. ').trim();

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