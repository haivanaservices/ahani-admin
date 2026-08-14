import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NewCampaignModal from './NewCampaignModal';
import CampaignTable from './CampaignTable';

export default async function DashboardOverview() {
  const supabase = await createClient();
  
  // 1. Identify the user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch their Profile to get the agency_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile?.agency_id) redirect('/login');

  // 3. Fetch the real Agency and Subscription data
  const { data: agency } = await supabase
    .from('agencies')
    .select('agency_name')
    .eq('id', profile.agency_id)
    .single();

  const { data: subscription } = await supabase
    .from('annual_subscriptions')
    .select('plan_tier, max_scans, scans_used')
    .eq('agency_id', profile.agency_id)
    .single();

  // 4. Dynamic Math & Formatting
  const maxScans = subscription?.max_scans || 0;
  const scansUsed = subscription?.scans_used || 0;
  const scansRemaining = maxScans - scansUsed;
  const usagePercentage = maxScans > 0 ? Math.min(100, Math.round((scansUsed / maxScans) * 100)) : 0;
  
  // $6 average cost per handled support call deflection
  const costSavings = scansUsed * 6;

  // Format the tier name for display
  const getTierDisplay = (tier?: string) => {
    switch(tier) {
      case 'free_pilot': return 'Self-Serve Pilot';
      case 'clinic': return 'Single Clinic';
      case 'department': return 'Department Tier';
      case 'county': return 'County Tier';
      default: return 'Active Plan';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Dynamic Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {agency?.agency_name || 'Agency Overview'}
          </h1>
          <p className="text-slate-500 mt-1">Real-time metrics for your Title VI language access campaigns.</p>
        </div>
        <NewCampaignModal />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* LIVE Quota Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-500">Annual Scan Quota</p>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                {getTierDisplay(subscription?.plan_tier)}
              </span>
            </div>
            <p className="text-4xl font-extrabold text-slate-900 mt-2">
              {scansUsed.toLocaleString()} <span className="text-lg font-medium text-slate-400">/ {maxScans.toLocaleString()}</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">scans used</p>
          </div>
          
          <div className="mt-8">
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${usagePercentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`} 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Dynamic Depletion Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Estimated Depletion</p>
            <p className="text-sm text-slate-400 mb-4">Based on current run rate</p>
            <p className="text-3xl font-extrabold text-slate-900">
              {scansUsed === 0 ? 'Evaluating...' : `${Math.max(1, Math.round(scansRemaining / (scansUsed / 30)))} Days`}
            </p>
          </div>
          <Link href="/dashboard/billing" className="text-sm font-bold text-blue-600 hover:underline mt-6 inline-block">
            Top up quota →
          </Link>
        </div>

        {/* Dynamic Cost Savings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-bold text-slate-500">Estimated Cost Savings</p>
            <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded">High ROI</span>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            By providing instant audio translations, Ahani has deflected an estimated {scansUsed.toLocaleString()} calls from your support center.
          </p>
          <p className="text-4xl font-extrabold text-green-600">
            ${costSavings.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            *Calculated using an industry average of $6.00 per handled support call.
          </p>
        </div>

      </div>

      {/* Campaign Ledger Table */}
      <CampaignTable agencyId={profile.agency_id} />

    </div>
  );
}