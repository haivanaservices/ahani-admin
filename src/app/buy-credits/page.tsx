'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard } from 'lucide-react';
import ConsumerCheckoutButton from '../../components/ConsumerCheckoutButton';

export default function BuyCreditsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Get Credits</h1>
      </header>

      <main className="flex-grow p-6 max-w-md mx-auto w-full flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-purple-900" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Ahani Personal Wallet</h2>
          <p className="text-slate-500 mt-2">Pay-as-you-go for personal document translations. Credits never expire.</p>
        </div>

        <div className="space-y-4">
          {/* Package 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-900">5 Scans</h3>
                <p className="text-slate-500 text-sm">Perfect for occasional mail</p>
              </div>
              <p className="text-2xl font-black text-purple-900">$1.99</p>
            </div>
            
            {/* Replace 'price_123' with your actual $1.99 Stripe Price ID */}
            <ConsumerCheckoutButton 
              priceId="price_123" 
              buttonText="Buy 5 Credits" 
            />
          </div>

          {/* Package 2 */}
          <div className="bg-purple-900 p-6 rounded-2xl border border-purple-800 shadow-lg flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Most Popular
            </div>
            <div className="flex justify-between items-center mt-2">
              <div>
                <h3 className="text-xl font-bold text-white">15 Scans</h3>
                <p className="text-purple-200 text-sm">Best value for active users</p>
              </div>
              <p className="text-2xl font-black text-white">$4.99</p>
            </div>
            
            {/* Replace 'price_456' with your actual $4.99 Stripe Price ID */}
            <ConsumerCheckoutButton 
              priceId="price_456" 
              buttonText="Buy 15 Credits" 
              highlight={true} 
            />
          </div>
        </div>
      </main>
    </div>
  );
}