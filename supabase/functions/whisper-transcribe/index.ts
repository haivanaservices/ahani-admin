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

    // 1. Get the audio payload sent from your Next.js app
    const { audioUrl, audioBase64, fileExt, mimeType } = await req.json();

    let audioBlob: Blob | null = null;
    const ext = fileExt || (audioUrl?.split('.').pop()?.split('?')[0]) || 'webm';
    const resolvedMime = mimeType || (ext === 'mp4' ? 'audio/mp4' : ext === 'm4a' ? 'audio/m4a' : 'audio/webm');

    // 2. Download from Supabase Storage if audioUrl is provided, otherwise decode base64 fallback
    if (audioUrl) {
      console.log("📥 Fetching audio URL:", audioUrl);
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        const rawBuffer = await audioResponse.arrayBuffer();
        audioBlob = new Blob([rawBuffer], { type: resolvedMime });
      } else {
        console.warn(`⚠️ Storage fetch returned ${audioResponse.status}; checking base64 fallback.`);
      }
    }

    if (!audioBlob && audioBase64) {
      console.log("📥 Decoding direct base64 audio payload...");
      const binaryStr = atob(audioBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      audioBlob = new Blob([bytes], { type: resolvedMime });
    }

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error("Could not retrieve recorded audio payload.");
    }

    // 3. Package it up for the OpenAI Whisper API with the device's true extension (.mp4/.m4a on iOS, .webm on Android/Chrome)
    const formData = new FormData();
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");

    // 4. Securely grab the API key
    const openAiKey = Deno.env.get('OPENAI_API_KEY');

    console.log(`🤖 Sending audio.${ext} (${audioBlob.size} bytes) to OpenAI Whisper...`);

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

    console.log("✅ Transcription successful:", whisperData.text);

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