'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import ConsumerCheckoutButton from '../../components/ConsumerCheckoutButton';
import AhaniOtpModal from '../../components/AhaniOtpModal';

export default function BuyCreditsPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth & Balance State
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // OTP State
  const [emailInput, setEmailInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    setIsCheckingAuth(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setCurrentUserEmail(user.email || null);
      fetchUserCredits();
    } else {
      setCurrentUserEmail(null);
    }
    setIsCheckingAuth(false);
  };

  const fetchUserCredits = async () => {
    try {
      const { data } = await supabase.rpc('get_total_balance');
      if (data !== null) setCreditBalance(data);
    } catch (e) {
      console.error('Failed fetching credits:', e);
    }
  };

  const handleInitiateOtp = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    setIsSendingOtp(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput.trim(),
        options: { shouldCreateUser: true }
      });

      if (error) throw error;
      setShowOtpModal(true);
    } catch (err: any) {
      alert(err.message || 'Error sending code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpVerified = async () => {
    setShowOtpModal(false);
    await checkUserSession(); // Re-check session to reveal the Stripe buttons
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans">
      
      {/* Preserved Header */}
      <header className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-slate-900 transition">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Get Credits</h1>
      </header>

      <main className="flex-grow p-6 max-w-md mx-auto w-full flex flex-col justify-center">
        
        {/* Preserved Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={32} className="text-purple-900" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Ahani Personal Wallet</h2>
          <p className="text-slate-500 mt-2">Pay-as-you-go for personal document translations. Credits never expire.</p>
        </div>

        {isCheckingAuth ? (
          <div className="flex flex-col items-center justify-center space-y-4 text-purple-900 py-10">
            <Loader2 className="animate-spin" size={40} />
            <p className="font-bold animate-pulse">Loading wallet...</p>
          </div>
        ) : !currentUserEmail ? (

          /* UNAUTHENTICATED STATE: The OTP Gatekeeper */
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Link your email to continue</h3>
            <p className="text-sm text-slate-500 mb-4">We use your email to securely store your credits. No password required.</p>
            
            <div className="space-y-3">
              <input 
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-900"
                onKeyDown={(e) => e.key === 'Enter' && handleInitiateOtp()}
              />
              <button 
                onClick={handleInitiateOtp}
                disabled={isSendingOtp || !emailInput.includes('@')}
                className="w-full bg-purple-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-purple-800 transition"
              >
                {isSendingOtp ? <Loader2 className="animate-spin" size={20} /> : 'Send Verification Code'}
              </button>
            </div>
          </div>

        ) : (

          /* AUTHENTICATED STATE: Show Balance and Preserved Package Cards */
          <div className="space-y-6">
            
            {/* Added: Small Current Balance Indicator */}
            <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Balance</p>
                <p className="text-sm text-slate-600 truncate max-w-[200px]">{currentUserEmail}</p>
              </div>
              <p className="text-2xl font-black text-purple-900">
                {creditBalance !== null ? creditBalance : '-'} <span className="text-sm text-slate-500 font-medium">credits</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* Preserved Package 1 */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">5 Scans</h3>
                    <p className="text-slate-500 text-sm">Perfect for occasional mail</p>
                  </div>
                  <p className="text-2xl font-black text-purple-900">$1.99</p>
                </div>
                
                <ConsumerCheckoutButton 
                  priceId="price_1UUIPXF94hMxkhyPbEJ8PK91" 
                  buttonText="Buy 5 Credits" 
                />
              </div>

              {/* Preserved Package 2 */}
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
                
                <ConsumerCheckoutButton 
                  priceId="price_1UUIPXF94hMxkhyPoASiS0Ue" 
                  buttonText="Buy 15 Credits" 
                  highlight={true} 
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* OTP Verification Modal */}
      <AhaniOtpModal 
        email={emailInput}
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
      />
    </div>
  );
}