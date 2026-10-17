export const maxDuration = 60;
import { createClient } from '../../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import SetupClient from './SetupClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function CampaignSetupPage({ params }: { params: any }) {
  // Safely unwrap params (future-proofs for Next.js 15 as well)
  const resolvedParams = await Promise.resolve(params);
  const campaignId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  // Add 'error' to the fetch so we can see exactly what Supabase says
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', campaignId)
    .single();

  // If there's an error, print it clearly to the screen!
  if (error || !campaign) {
    return (
      <div className="max-w-4xl mx-auto p-8 mt-10 bg-red-50 border border-red-200 rounded-2xl text-center">
        <h1 className="text-2xl font-bold text-red-700 mb-2">Error Loading Campaign</h1>
        <p className="text-red-600 mb-4">
          Next.js tried to load it, but Supabase returned an error:
          <br />
          <strong className="text-lg">{error?.message || "No row found"}</strong>
        </p>
        <p className="text-xs text-red-400 mt-2 font-mono">Attempted ID: {campaignId}</p>
        <div className="mt-8">
          <Link href="/dashboard" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition mb-6 gap-2">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <h1 className="text-3xl font-extrabold text-slate-900">Campaign Fingerprinting</h1>
      <p className="text-slate-500 mt-2">Step 2: Train the verification model for the <strong>{campaign.name}</strong> campaign.</p>

      <SetupClient campaignId={campaign.id} campaignName={campaign.name} />
    </div>
  );
}