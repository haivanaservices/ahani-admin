'use client';

import { useState } from 'react';
import { ArrowRight, PlusCircle } from 'lucide-react';

interface CheckoutButtonProps {
  agencyId: string;
  priceId: string | null;
  buttonText: string;
  isActive: boolean;
  highlight: boolean;
}

export default function CheckoutButton({ agencyId, priceId, buttonText, isActive, highlight }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId) return; // For tiers that don't have a Stripe ID yet
    
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, agencyId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to initiate checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (isActive) {
    return (
      <button className="w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none">
        {buttonText}
      </button>
    );
  }

  return (
    <button 
      onClick={handleCheckout}
      disabled={loading || !priceId}
      className={`w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition ${
        highlight
          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
      } disabled:opacity-50`}
    >
      {highlight && <PlusCircle size={18} />}
      {loading ? 'Connecting to Stripe...' : buttonText}
      {!highlight && <ArrowRight size={16} />}
    </button>
  );
}