import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // We only care about the actual user record from the webhook
    const user = payload.record;
    if (!user || !user.email) {
      return new Response("No user record found", { status: 400 });
    }

    const userId = user.id;
    const email = user.email;
    const domain = email.split('@')[1].toLowerCase();

    // 1. VIP Whitelist Check
    if (domain.endsWith('.gov') || domain.endsWith('.edu') || domain.endsWith('.mil')) {
      await supabase.from('profiles').update({ 
        is_verified_enterprise: true, 
        trust_score: 100, 
        ai_investigator_notes: "Auto-approved government/education domain." 
      }).eq('id', userId);
      return new Response(JSON.stringify({ status: "auto-approved VIP" }), { status: 200 });
    }

    // 2. The Web Search (Tavily API)
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

    // 3. The AI Investigator Prompt
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

    // 4. Update the Profile with the Verdict
    await supabase.from('profiles').update({ 
      is_verified_enterprise: aiVerdict.is_legitimate || false, 
      trust_score: aiVerdict.confidence_score || 0, 
      ai_investigator_notes: aiVerdict.reason || "AI evaluation failed."
    }).eq('id', userId);

    return new Response(JSON.stringify(aiVerdict), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});