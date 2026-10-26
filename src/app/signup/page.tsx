"use client";

import { useState, Suspense } from 'react';
import { Building2, Mail, Lock, User, ShieldCheck, Zap, ShieldAlert, MapPin, Loader2, X } from 'lucide-react';
import { createAgencyAccount } from './actions';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlMessage = searchParams.get('message');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // FIX: Switched to standard form event to prevent automatic resetting
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Stops the browser from clearing the form
    
    const formData = new FormData(e.currentTarget);
    
    setIsLoading(true);
    setError('');

    // 1. The Terms & Privacy Bouncer
    const termsAccepted = formData.get('termsAccepted');
    if (!termsAccepted) {
      setError("You must read and accept the Terms of Service and Privacy Policy to initiate a pilot.");
      setIsLoading(false);
      return;
    }

    const email = formData.get('email') as string;
    const domain = email.split('@')[1]?.toLowerCase();
    
    // 2. The Pre-Flight Domain Bouncer
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    
    if (domain && publicDomains.includes(domain)) {
      setError("This registration page is strictly for provisioning new Agency Pilot workspaces. Please use an official organizational email to create an agency account.");
      setIsLoading(false);
      return;
    }

    // 3. If it passes all checks, send it to the server action
    try {
      await createAgencyAccount(formData);
      
      // If we get here, the account was created and the 6-digit code was sent!
      setRegisteredEmail(email);
      setShowOtpModal(true);
      setIsLoading(false);
      
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
        setRegisteredEmail(email);
        setShowOtpModal(true);
        setIsLoading(false);
        return;
      }
      
      console.error(err);
      setError("Something went wrong processing your registration. Please try again.");
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code exactly as it appears in your email.");
      return;
    }

    setIsVerifying(true);
    setError('');
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: registeredEmail,
      token: otpCode,
      type: 'signup'
    });

    if (verifyError) {
      setError(verifyError.message || "Invalid or expired verification code.");
      setIsVerifying(false);
    } else {
      router.push('/dashboard'); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Left Side: Trust & Value Prop */}
      <div className="md:w-5/12 bg-slate-900 text-white p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <div className="bg-blue-600 p-2 rounded-xl">
              <ShieldCheck size={28} />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">Ahani</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            Launch your Title VI <br />
            Language Pilot.
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-md">
            Skip the procurement committee. Create your secure workspace and initiate your agency pilot instantly.
          </p>

          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <div className="bg-slate-800 p-3 rounded-lg text-blue-400 shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Instant Provisioning</h3>
                <p className="text-slate-400 text-sm mt-1">Your isolated database and QR routing engine spin up in seconds.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="bg-slate-800 p-3 rounded-lg text-green-400 shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Zero Friction</h3>
                <p className="text-slate-400 text-sm mt-1">No credit card required. No sales calls. Test with real citizens today.</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-slate-500 text-sm mt-12">
          © 2026 Ahani Technologies. SOC2 Compliant.
        </p>
      </div>

      {/* Right Side: The Registration Form */}
      <div className="md:w-7/12 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Register for an Agency Pilot</h2>
          <p className="text-slate-500 mb-8">Please use an official organizational email (.gov, .org, etc).</p>

          {/* FIX: Changed from action={handleSubmit} to onSubmit={handleSubmit} */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* The Unmissable Error Box */}
            {error && !showOtpModal && (
              <div className="p-4 mb-4 text-sm text-red-900 rounded-xl bg-red-100 border-2 border-red-200 flex items-start gap-3 shadow-sm">
                <ShieldAlert className="shrink-0 text-red-600 mt-0.5" size={20} />
                <div>
                  <strong className="block font-bold text-red-800 mb-1">Registration Blocked</strong>
                  {error}
                </div>
              </div>
            )}

            {/* The Success Box */}
            {urlMessage && !error && !showOtpModal && (
              <div className="p-4 mb-4 text-sm text-green-900 rounded-xl bg-green-50 border-2 border-green-200">
                {urlMessage}
              </div>
            )}

            {/* Agency Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Agency or Department Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 size={18} />
                </div>
                <input 
                  type="text" 
                  name="agencyName"
                  required
                  placeholder="e.g. Alameda County Social Services" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Agency Address */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Agency Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={18} />
                </div>
                <input 
                  type="text" 
                  name="agencyAddress"
                  required
                  placeholder="123 Main St, Suite 100, City, State ZIP" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Your Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="fullName"
                  required
                  placeholder="Jane Doe" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Work Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="director@agency.gov" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Secure Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start mt-2">
              <div className="flex items-center h-5">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-600 focus:ring-2 cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="termsAccepted" className="font-medium text-slate-700 cursor-pointer">
                  I have read and agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>.
                </label>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-sm mt-4 disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {isLoading ? <><Loader2 className="animate-spin" size={20} /> Provisioning...</> : "Complete Setup & Start Pilot"}
            </button>

          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an active deployment? <a href="/login" className="text-blue-600 font-bold hover:underline">Sign In</a>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md mx-auto rounded-3xl p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowOtpModal(false)} 
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 mb-6 text-sm">
                We've sent a 6-digit confirmation code to <span className="font-bold text-slate-800">{registeredEmail}</span>. Enter it below to activate your pilot.
              </p>

              {error && (
                <div className="p-3 mb-4 text-sm text-red-900 rounded-lg bg-red-100 border border-red-200 text-left">
                  {error}
                </div>
              )}

              <input 
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono text-3xl border border-slate-300 rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-blue-600 mb-4"
              />

              <button 
                onClick={handleVerifyOtp}
                disabled={isVerifying || otpCode.length !== 6}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Launch Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}