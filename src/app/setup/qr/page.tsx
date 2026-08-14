import { redirect } from 'next/navigation';
import { createClient } from '../../../utils/supabase/server';
import { createFirstCampaign } from './actions';
import { QrCode, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';

export default async function SetupQrPage() {
  const supabase = await createClient();

  // 1. Verify Auth & Fetch Agency ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.agency_id) redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Navigation Bar - Wizard Style */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="font-extrabold text-xl tracking-tight text-slate-900">Ahani</div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <span className="text-slate-400 flex items-center gap-1">
            <CheckCircle2 size={16} /> Documents
          </span>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-blue-600 flex items-center gap-1">
            <CheckCircle2 size={16} /> QR Campaign
          </span>
          <span className="mx-2 text-slate-300">/</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-16 px-6 text-center">
        <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <QrCode size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
          Create Your First Touchpoint
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10">
          Generate a secure routing link for your lobby or mailers. When citizens scan this code, the AI Bouncer instantly knows they belong to your agency.
        </p>

        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 p-8 text-left max-w-xl mx-auto">
          <form action={createFirstCampaign} className="space-y-6">
            
            {/* Hidden Input to pass the Agency ID */}
            <input type="hidden" name="agencyId" value={profile.agency_id} />

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Campaign Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin size={18} />
                </div>
                <input 
                  type="text" 
                  name="campaignName"
                  required
                  defaultValue="Main Lobby Desk"
                  placeholder="e.g. Main Lobby Desk, August PG&E Mailer..." 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow font-medium"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This helps you track scan volume by location later on.
              </p>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2"
            >
              Generate QR Link & Enter Dashboard <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}