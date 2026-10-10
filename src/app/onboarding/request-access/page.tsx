'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Mail, User, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { sendAccessRequest } from './actions';

function RequestAccessContent() {
  const searchParams = useSearchParams();
  const agencyId = searchParams.get('agencyId');
  const agencyName = searchParams.get('agencyName') || 'Your Organization';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      formData.append('agencyId', agencyId || '');
      await sendAccessRequest(formData);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!agencyId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Invalid request parameters.</p>
          <Link href="/signup" className="text-blue-600 font-bold hover:underline">Return to Sign Up</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="bg-blue-500/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-extrabold">Workspace Exists</h1>
          <p className="text-blue-100 mt-2 text-sm">
            An active Ahani deployment was found for your domain.
          </p>
        </div>

        <div className="p-8">
          {isSuccess ? (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Request Sent!</h2>
              <p className="text-slate-500 mb-8 text-sm">
                We've notified the workspace owner for <strong>{agencyName}</strong>. Keep an eye on your inbox for an official invite link.
              </p>
              <Link href="/login" className="block w-full bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition">
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <p className="text-slate-600 text-sm mb-6 text-center">
                To keep your organization's data unified, duplicate workspaces are not permitted. Request an invite from the <strong>{agencyName}</strong> administrator below.
              </p>

              <form action={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Your Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input 
                      type="text" 
                      name="requesterName"
                      required
                      placeholder="Jane Doe" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Your Work Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input 
                      type="email" 
                      name="requesterEmail"
                      required
                      placeholder="jane@agency.gov" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition mt-2 disabled:opacity-70"
                >
                  {isSubmitting ? "Sending Request..." : "Request Access"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/signup" className="text-sm font-bold text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> Use a different email
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestAccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <RequestAccessContent />
    </Suspense>
  );
}