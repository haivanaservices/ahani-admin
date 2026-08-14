import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function PendingReviewPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        
        <h1 className="text-2xl font-extrabold text-slate-900 mb-4">
          Account Pending Review
        </h1>
        
        <div className="space-y-4 text-slate-600 mb-8 leading-relaxed">
          <p>
            With respect, your organization's registration has been triggered for secondary inspection by our automated security systems.
          </p>
          <p>
            To ensure the security of the Ahani platform, a member of our compliance team will review your account and reach out to you shortly for further details to verify your organization.
          </p>
        </div>

        <Link 
          href="/" 
          className="inline-block w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}