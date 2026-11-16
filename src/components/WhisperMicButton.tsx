'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { createClient } from '../utils/supabase/client'; 

interface WhisperMicButtonProps {
  onTranscriptionCompleted: (text: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export default function WhisperMicButton({ 
  onTranscriptionCompleted,
  onRecordingStart,
  onRecordingStop
}: WhisperMicButtonProps) {
  const [supabase] = useState(() => createClient());
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const toggleRecording = async () => {
    if (isProcessing) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const preferredMime =
          typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
                ? 'audio/mp4'
                : '';

        const mediaRecorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setIsRecording(false);
          onRecordingStop?.();
          setIsProcessing(true);
          
          stream.getTracks().forEach(track => track.stop());

          const actualMime = (mediaRecorder.mimeType || preferredMime || 'audio/webm').split(';')[0];
          const ext = actualMime.includes('mp4')
            ? 'mp4'
            : actualMime.includes('m4a') || actualMime.includes('aac')
              ? 'm4a'
              : actualMime.includes('ogg')
                ? 'ogg'
                : 'webm';

          const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });

          try {
            if (audioBlob.size === 0) {
              throw new Error('No audio captured. Tap the mic, speak, then tap stop.');
            }

            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const audioBase64 = await blobToBase64(audioBlob);

            const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
              ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
              body: {
                audioBase64,
                fileExt: ext,
                mimeType: actualMime
              }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data?.text?.trim()) {
              onTranscriptionCompleted(data.text.trim());
            } else {
              alert('Could not hear a question clearly. Please tap the mic and try again.');
            }
          } catch (err: any) {
            console.error('Error processing audio:', err);
            alert(`Voice transcription error: ${err?.message || 'Check whisper-transcribe JWT setting'}`);
          } finally {
            setIsProcessing(false);
          }
        };

        mediaRecorder.start(250);
        setIsRecording(true);
        onRecordingStart?.();
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
      type="button"
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