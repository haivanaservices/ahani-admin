'use client';

import { useState } from 'react';
import { ArrowRight, PlusCircle, Loader2 } from 'lucide-react';

interface ConsumerCheckoutButtonProps {
  priceId: string | null;
  buttonText: string;
  highlight?: boolean;
}

export default function ConsumerCheckoutButton({ priceId, buttonText, highlight = false }: ConsumerCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId) return; 
    
    setLoading(true);
    try {
      const response = await fetch('/api/checkout-consumer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to initiate checkout. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      alert('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={loading || !priceId}
      className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition ${
        highlight
          ? 'bg-purple-900 text-white hover:bg-purple-800 shadow-md'
          : 'bg-white text-purple-900 border-2 border-purple-900 hover:bg-slate-50 shadow-sm'
      } disabled:opacity-50`}
    >
      {highlight && !loading && <PlusCircle size={18} />}
      {loading ? <Loader2 className="animate-spin" size={20} /> : buttonText}
      {!highlight && !loading && <ArrowRight size={16} />}
    </button>
  );
}