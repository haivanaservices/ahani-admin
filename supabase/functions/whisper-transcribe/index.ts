// @ts-nocheck

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests from the web browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("=== STARTING WHISPER-TRANSCRIBE FUNCTION ===");

    // 1. Get the audio file URL sent from your Next.js app
    const { audioUrl } = await req.json();
    console.log("📥 Received audio URL:", audioUrl);
    
    // 2. Download the audio file from your Supabase Storage bucket
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // 3. Package it up for the OpenAI Whisper API
    const formData = new FormData();
    
    // CRITICAL WEB FIX: Change .m4a to .webm because web browsers record in WebM!
    formData.append("file", audioBlob, "audio.webm"); 
    formData.append("model", "whisper-1");
    // Whisper automatically detects the spoken language (Farsi, Spanish, English, etc.)

    // 4. Securely grab the API key
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    console.log("🤖 Sending audio to OpenAI Whisper...");

    // 5. Send it to OpenAI
    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`
      },
      body: formData,
    });

    const whisperData = await whisperResponse.json();

    if (whisperData.error) {
      throw new Error(whisperData.error.message);
    }

    console.log("✅ Transcription successful. Sending back to React.");

    // 6. Return the transcribed text back to Next.js
    return new Response(
      JSON.stringify({ text: whisperData.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("❌ CATCH BLOCK ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})