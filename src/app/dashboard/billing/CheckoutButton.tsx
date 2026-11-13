'use client';

import { useState } from 'react';
import { ArrowRight, PlusCircle, Loader2 } from 'lucide-react';

interface CheckoutButtonProps {
  agencyId: string;
  priceId: string | null;
  buttonText: string;
  isActive: boolean;
  highlight: boolean;
}

export default function CheckoutButton({
  agencyId,
  priceId,
  buttonText,
  isActive,
  highlight,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!priceId || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, agencyId }),
      });

      let data: { url?: string; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        // Fallback if server returned a non-JSON error response
      }

      if (!response.ok || !data.url) {
        setErrorMessage(data.error || 'Failed to initiate checkout. Please try again.');
        setLoading(false);
        return;
      }

      window.location.assign(data.url);
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  if (isActive) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition bg-slate-100 text-slate-400 cursor-not-allowed"
      >
        {buttonText}
      </button>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || !priceId}
        className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed ${
          highlight
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
        } disabled:opacity-50`}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Connecting to Stripe...
          </>
        ) : (
          <>
            {highlight && <PlusCircle size={18} />}
            {buttonText}
            {!highlight && <ArrowRight size={16} />}
          </>
        )}
      </button>

      {errorMessage && (
        <p className="mt-2 text-xs font-medium text-red-600 text-center">{errorMessage}</p>
      )}
    </div>
  );
}