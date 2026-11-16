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
  const [micError, setMicError] = useState<string | null>(null);
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
      // STOP RECORDING & PROCESS
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // START RECORDING (Exact native MediaRecorder init that worked previously)
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        onRecordingStop?.();
        setIsProcessing(true);

        stream.getTracks().forEach(track => track.stop());

        try {
          const actualMime = (mediaRecorder.mimeType || 'audio/mp4').split(';')[0];
          const ext = actualMime.includes('mp4') || actualMime.includes('m4a') || actualMime.includes('aac')
            ? 'm4a'
            : 'webm';

          const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
          if (audioBlob.size === 0) {
            throw new Error('Empty recording — speak for 1-2s then tap stop.');
          }

          const audioBase64 = await blobToBase64(audioBlob);

          const { data, error } = await supabase.functions.invoke('whisper-transcribe', {
            body: { audioBase64, fileExt: ext }
          });

          if (error) {
            const status = (error as any)?.context?.status || '';
            throw new Error(`Transcribe HTTP ${status || 'error'}: ${error.message}`);
          }
          if (data?.error) {
            throw new Error(data.error);
          }

          if (data?.text?.trim()) {
            onTranscriptionCompleted(data.text.trim());
          } else {
            setMicError('No speech detected. Tap mic and try again.');
          }
        } catch (err: any) {
          console.error('Error processing audio:', err);
          setMicError(err?.message || 'Voice transcription failed');
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      onRecordingStart?.();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setMicError('Allow microphone permission to ask questions.');
    }
  };

  return (
    <div className="flex flex-col items-center">
      {isProcessing ? (
        <div className="p-4 flex justify-center items-center">
          <Loader2 className="animate-spin text-purple-900" size={32} />
        </div>
      ) : (
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
      )}

      {isRecording && (
        <span className="text-[11px] font-bold text-red-600 mt-2">
          Tap red square to send
        </span>
      )}

      {micError && (
        <span className="text-xs font-bold text-red-600 mt-2 text-center max-w-[260px]">
          {micError}
        </span>
      )}
    </div>
  );
}