'use client';

import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { createClient } from '../utils/supabase/client';
import { Loader2, X } from 'lucide-react';

interface AhaniOtpModalProps {
  email: string;
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function AhaniOtpModal({ email, isOpen, onClose, onVerified }: AhaniOtpModalProps) {
  const supabase = createClient();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(6).fill(''));
      setErrorMessage(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (val: string, index: number) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setErrorMessage(null);

    if (cleanVal) {
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        inputRefs.current[index]?.blur();
        verifyCode(newDigits.join(''));
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = Array(6).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      inputRefs.current[5]?.blur();
      verifyCode(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const verifyCode = async (code: string) => {
    if (code.length !== 6) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });

      if (error) throw error;

      if (data.session) {
        onVerified();
      }
    } catch (err) {
      setErrorMessage('Invalid code. Please try again.');
      setDigits(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-extrabold text-purple-900 mb-2">Check your email</h2>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          We sent a 6-digit code to <br />
          <span className="font-bold text-slate-800">{email}</span>
        </p>

        {/* 6-Digit Inputs */}
        <div className="flex justify-between gap-2 mb-6">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleDigitChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={isLoading}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border bg-slate-50 outline-none transition ${
                errorMessage 
                  ? 'border-red-400 bg-red-50 text-red-700 focus:border-red-600'
                  : 'border-slate-200 focus:border-purple-900 focus:bg-white text-slate-900'
              }`}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-red-600 text-sm font-semibold text-center mb-4">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="py-4 flex justify-center">
            <Loader2 className="animate-spin text-purple-900" size={32} />
          </div>
        ) : (
          <button
            onClick={() => verifyCode(digits.join(''))}
            disabled={digits.join('').length !== 6}
            className="w-full bg-purple-900 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 hover:bg-purple-800 transition"
          >
            Verify Account
          </button>
        )}
      </div>
    </div>
  );
}