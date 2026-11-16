// @ts-nocheck

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function detectAudioFormat(bytes: Uint8Array, fallbackExt = 'webm') {
  // iOS Safari / WebKit MP4 or M4A container has 'ftyp' at bytes 4..7
  if (bytes.length > 8 && bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return { ext: 'm4a', mime: 'audio/mp4' };
  }
  // WebM / Matroska EBML header: 1A 45 DF A3
  if (bytes.length > 4 && bytes[0] === 0x1A && bytes[1] === 0x45 && bytes[2] === 0xDF && bytes[3] === 0xA3) {
    return { ext: 'webm', mime: 'audio/webm' };
  }
  // Ogg container: 'OggS'
  if (bytes.length > 4 && bytes[0] === 0x4F && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { ext: 'ogg', mime: 'audio/ogg' };
  }
  return {
    ext: fallbackExt,
    mime: fallbackExt === 'mp4' || fallbackExt === 'm4a' ? 'audio/mp4' : 'audio/webm'
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("=== STARTING WHISPER-TRANSCRIBE FUNCTION ===");

    const { audioUrl, audioBase64, fileExt } = await req.json();
    let bytes: Uint8Array | null = null;

    if (audioUrl) {
      console.log("📥 Downloading audioUrl:", audioUrl);
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Storage fetch failed with status ${audioResponse.status}`);
      }
      bytes = new Uint8Array(await audioResponse.arrayBuffer());
    } else if (audioBase64) {
      console.log("📥 Decoding direct base64 audio...");
      const binaryStr = atob(audioBase64);
      bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
    }

    if (!bytes || bytes.length === 0) {
      throw new Error("Empty audio payload received.");
    }

    const detected = detectAudioFormat(bytes, fileExt || 'webm');
    const audioBlob = new Blob([bytes], { type: detected.mime });

    const formData = new FormData();
    formData.append("file", audioBlob, `audio.${detected.ext}`);
    formData.append("model", "whisper-1");

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    console.log(`🤖 Sending audio.${detected.ext} (${bytes.length} bytes) to OpenAI Whisper...`);

    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openAiKey}` },
      body: formData,
    });

    const whisperData = await whisperResponse.json();
    if (whisperData.error) {
      throw new Error(whisperData.error.message);
    }

    console.log("✅ Transcription successful:", whisperData.text);

    return new Response(
      JSON.stringify({ text: whisperData.text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ CATCH BLOCK ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});