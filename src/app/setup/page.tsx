import { redirect } from 'next/navigation';
import { createClient } from '../../utils/supabase/server';
import Link from 'next/link';
import { FileText, ArrowRight, CheckCircle2 } from 'lucide-react';

// Adjust this import path to wherever your ProfileClient component lives!
import ProfileClient from '../dashboard/profile/ProfileClient';
export const instant = false;

export default async function SetupPage() {
  const supabase = await createClient();

  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch the newly created Profile and Agency Data
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      agency_id,
      agencies ( agency_name )
    `)
    .eq('id', user.id)
    .single();

  if (!profile || !profile.agency_id) {
    redirect('/login?error=Account provisioning incomplete');
  }

 // Handle whether Supabase returns the joined table as an array or a single object
  const agencyData = profile.agencies as any;
  const agencyName = Array.isArray(agencyData) 
    ? agencyData[0]?.agency_name 
    : agencyData?.agency_name || 'Your Agency';

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Navigation Bar - Wizard Style */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="font-extrabold text-xl tracking-tight text-slate-900">Ahani</div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <span className="text-blue-600 flex items-center gap-1">
            <CheckCircle2 size={16} /> Documents
          </span>
          <span className="mx-2 text-slate-300">/</span>
          <span>QR Campaign</span>
          <span className="mx-2 text-slate-300">/</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-12 px-6">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Welcome, {agencyName}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            To ensure citizens aren't billed for scanning official documents, the AI Bouncer needs to know what your forms look like. Upload up to 5 baseline documents below.
          </p>
        </div>

        {/* The Existing Uploader Component */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
          <ProfileClient 
            agencyId={profile.agency_id} 
            agencyName={agencyName}
            hasFingerprint={false}
          />
        </div>

        {/* The Action Bar to proceed to Step 2 */}
        <div className="mt-12 flex justify-end">
          <Link 
            href="/setup/qr"
            className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
          >
            Documents Saved. Continue to Step 2 <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}