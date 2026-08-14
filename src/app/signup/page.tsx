"use client";

import { useState, Suspense } from 'react';
import { Building2, Mail, Lock, User, ShieldCheck, Zap, ShieldAlert } from 'lucide-react';
import { createAgencyAccount } from './actions';
import { useSearchParams } from 'next/navigation';

function SignupContent() {
  const searchParams = useSearchParams();
  const urlMessage = searchParams.get('message');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Client-side interceptor
  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError('');

    const email = formData.get('email') as string;
    const domain = email.split('@')[1]?.toLowerCase();
    
    // 1. The Pre-Flight Bouncer
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
    
    if (domain && publicDomains.includes(domain)) {
      setError("This registration page is strictly for provisioning new Agency Pilot workspaces. Please use an official organizational email to create an agency account.");
      setIsLoading(false);
      return; // Stops the form from submitting and wiping their data
    }

    // 2. If it's a custom domain, send it to the server action
    try {
      await createAgencyAccount(formData);
    } catch (err: any) {
      // Bulletproof Next.js redirect check (works on all versions)
      if (err?.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
        throw err;
      }
      
      console.error(err); // Prints the real error to your browser console just in case
      setError("Something went wrong processing your registration. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
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

          <form action={handleSubmit} className="space-y-5">
            
            {/* The Unmissable Error Box */}
            {error && (
              <div className="p-4 mb-4 text-sm text-red-900 rounded-xl bg-red-100 border-2 border-red-200 flex items-start gap-3 shadow-sm">
                <ShieldAlert className="shrink-0 text-red-600 mt-0.5" size={20} />
                <div>
                  <strong className="block font-bold text-red-800 mb-1">Registration Blocked</strong>
                  {error}
                </div>
              </div>
            )}

            {/* The Success Box */}
            {urlMessage && !error && (
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

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-sm mt-4 disabled:bg-blue-400"
            >
              {isLoading ? "Checking Domain..." : "Complete Setup & Start Pilot"}
            </button>

          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an active deployment? <a href="/login" className="text-blue-600 font-bold hover:underline">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Next.js requires Client Components using useSearchParams to be wrapped in a Suspense boundary
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-bold">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}