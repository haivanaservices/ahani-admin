'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { createClient } from '../utils/supabase/client'; 

export default function WhisperMicButton({ onTranscriptionCompleted }: { onTranscriptionCompleted: (text: string) => void }) {
  const supabase = createClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const toggleRecording = async () => {
    if (isProcessing) return; // Ignore taps while AI is transcribing

    if (isRecording) {
      // STOP RECORDING & PROCESS
      mediaRecorderRef.current?.stop();
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          setIsProcessing(true);
          // Kill the microphone red dot in the browser tab
          stream.getTracks().forEach(track => track.stop());

          // Web browsers record as webm natively, which OpenAI Whisper supports natively
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const fileName = `intake_${Date.now()}.webm`;

          try {
            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
              .from('audio_intake')
              .upload(fileName, audioBlob, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('audio_intake')
              .getPublicUrl(fileName);

            // 2. Invoke the Edge Function
            const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
              body: { audioUrl: publicUrl }
            });

            if (error) throw error;

            // 3. Pass the transcribed text back to your UI
            if (data && data.text) {
              onTranscriptionCompleted(data.text);
            }
          } catch (err) {
            console.error('Error processing audio:', err);
          } finally {
            setIsProcessing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Please allow microphone permissions to use voice follow-ups.');
      }
    }
  };

  if (isProcessing) {
    return (
      <div className="p-4 flex justify-center items-center">
        <Loader2 className="animate-spin text-purple-900" size={32} />
      </div>
    );
  }

  return (
    <button
      onClick={toggleRecording}
      className={`p-6 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${
        isRecording 
          ? 'bg-red-500 text-white animate-pulse scale-110 shadow-red-500/50' 
          : 'bg-purple-900 text-white hover:bg-purple-800 shadow-black/10'
      }`}
    >
      {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
    </button>
  );
}