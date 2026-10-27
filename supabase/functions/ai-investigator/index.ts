// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  try {
    // --- 1. WEBHOOK AUTHENTICATION SHIELD ---
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== 'ahani_webhook_secure_992') {
      return new Response(JSON.stringify({ error: "Unauthorized webhook invocation" }), { status: 401 });
    }

    const payload = await req.json();
    
    // We only care about the actual user record from the webhook
    const user = payload.record;
    if (!user || !user.email) {
      return new Response("No user record found", { status: 400 });
    }

    const userId = user.id;
    const email = user.email;
    const domain = email.split('@')[1].toLowerCase();

    // --- 2. VIP Whitelist Check (.gov, .edu, .mil) ---
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      await supabase.from('profile_security').upsert({ 
        user_id: userId,
        is_verified_enterprise: true, 
        trust_score: 100, 
        ai_investigator_notes: "Auto-approved government/education domain." 
      });
      
      // UNLOCK SUBSCRIPTION: Instantly grant the 1000 scans to the agency
      await supabase.from('annual_subscriptions')
        .update({ 
          max_scans: 1000,
          plan_tier: 'VIP_Pilot'
        })
        .eq('agency_id', userId);

      return new Response(JSON.stringify({ status: "auto-approved VIP" }), { status: 200 });
    }

    // --- 3. The Web Search (Tavily API) ---
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: Deno.env.get('TAVILY_API_KEY'),
        query: `Who owns the domain ${domain}? Is it a legitimate enterprise, hospital, or government organization?`,
        include_raw_content: true,
        max_results: 3
      })
    });
    
    const searchData = await tavilyRes.json();
    const searchContext = searchData.results?.map((r: any) => r.content).join('\n\n') || "No results found.";

    // --- 4. The AI Investigator Prompt ---
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Act as a corporate fraud investigator. I am providing you with web search results for the domain '${domain}'. 
          Determine if this is a legitimate, established organization (like a hospital, government agency, or real enterprise) OR a fake/shell website.
          Return a strict JSON object: { "is_legitimate": boolean, "confidence_score": 0-100, "reason": "brief explanation" }`
        },
        {
          role: "user",
          content: searchContext
        }
      ]
    });

    const aiVerdict = JSON.parse(response.choices[0].message.content || '{}');

    // --- 5. Update the Profile with the Verdict ---
    await supabase.from('profile_security').upsert({ 
      user_id: userId,
      is_verified_enterprise: aiVerdict.is_legitimate || false, 
      trust_score: aiVerdict.confidence_score || 0, 
      ai_investigator_notes: aiVerdict.reason || "AI evaluation failed."
    });

    // --- 6. UNLOCK SUBSCRIPTION (IF LEGITIMATE) OR SEND ADMIN ALERT (IF SUSPICIOUS) ---
    if (aiVerdict.is_legitimate === true && aiVerdict.confidence_score >= 75) {
      
      // UNLOCK SUBSCRIPTION: The AI verified this is a real enterprise
      await supabase.from('annual_subscriptions')
        .update({ 
          max_scans: 1000,
          plan_tier: 'Verified_Pilot'
        })
        .eq('agency_id', userId);

    } else {
      // DO NOT UNLOCK SUBSCRIPTION. Send the admin alert.
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Ahani Alerts <notifications@ahani.ai>",
          to: ["ahaniservices@gmail.com"],
          subject: `🚨 Action Required: Suspicious Signup (${domain})`,
          html: `
            <h2>Suspicious Agency Registration</h2>
            <p>A new user registered, but the AI investigator flagged them as suspicious. <strong>Their max_scans remains locked at 0.</strong></p>
            <ul>
              <li><strong>User Email:</strong> ${email}</li>
              <li><strong>AI Trust Score:</strong> ${aiVerdict.confidence_score}/100</li>
              <li><strong>AI Reasoning:</strong> ${aiVerdict.reason}</li>
            </ul>
            <p>If this is a legitimate customer, log in to Supabase and manually update their annual_subscriptions table to 1000 max_scans.</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify(aiVerdict), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});