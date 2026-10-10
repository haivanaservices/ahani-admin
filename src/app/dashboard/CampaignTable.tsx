import { createClient } from '../../utils/supabase/server';
import { QrCode, ExternalLink, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteCampaign } from '../actions';
import CampaignActionMenu from './components/CampaignActionMenu';

export default async function CampaignTable({ agencyId }: { agencyId: string }) {
  const supabase = await createClient();

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
  }

  // 1. The Beautiful Empty State (Tinted red to indicate action required)
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden mt-8 p-16 text-center border-dashed relative">
        <div className="absolute top-0 left-0 w-1 bg-red-500 h-full"></div>
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <QrCode size={32} className="text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Touchpoints</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          You haven't generated any QR campaigns yet. Click the "+ New Campaign" button at the top to create your first routing link and complete setup.
        </p>
      </div>
    );
  }

  // 2. The Populated Table (Only shows if campaigns exist)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Active Touchpoints</h2>
          <p className="text-sm text-slate-500">Manage your live QR codes and routing links.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-xs uppercase text-slate-500">
              <th className="p-4 font-bold">Campaign Name</th>
              <th className="p-4 font-bold">Routing ID</th>
              <th className="p-4 font-bold">Samples</th>
              <th className="p-4 font-bold">Total Scans</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => {
              // The logic determining if the user needs to finish setup
              const isMissingSamples = (campaign.samples_count || 0) < 5;

              return (
                <tr 
                  key={campaign.id} 
                  className={`group transition ${isMissingSamples ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50'}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`${isMissingSamples ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'} p-2 rounded-lg`}>
                        {isMissingSamples ? <AlertCircle size={18} /> : <QrCode size={18} />}
                      </div>
                      <span className="font-bold text-slate-900">{campaign.name}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-sm text-slate-500 font-mono">
                    {campaign.qr_code_url && !isMissingSamples ? (
                      <div className="flex items-center gap-2">
                        <span className="truncate w-32">{campaign.qr_code_url.split('scan/')[1]}</span>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition cursor-pointer hover:text-blue-600" />
                      </div>
                    ) : (
                      <span className={isMissingSamples ? "text-red-400 italic" : ""}>
                        {isMissingSamples ? 'Setup required...' : 'Pending...'}
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <span className={`font-bold text-sm ${isMissingSamples ? 'text-red-600' : 'text-slate-600'}`}>
                      {campaign.samples_count || 0} / 5
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-slate-900">{campaign.total_scans || 0}</span>
                  </td>
                  
                  <td className="p-4">
                    {isMissingSamples ? (
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                        Setup Incomplete
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200">
                        {campaign.status}
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {isMissingSamples ? (
                        <>
                          {/* INCOMPLETE CAMPAIGN: Show Resume + Delete */}
                          <Link 
                            href={`/dashboard/setup/${campaign.id}`} 
                            className="text-red-600 font-bold hover:text-red-800 text-sm whitespace-nowrap px-2"
                          >
                            Resume Setup &rarr;
                          </Link>
                          <form action={deleteCampaign} className="inline-block">
                            <input type="hidden" name="campaignId" value={campaign.id} />
                            <button 
                              type="submit" 
                              className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition flex items-center justify-center"
                              title="Delete Campaign"
                            >
                              <Trash2 size={18} />
                            </button>
                          </form>
                        </>
                      ) : (
                        /* ACTIVE CAMPAIGN: Show Sleek Dropdown Menu */
                        <CampaignActionMenu 
                          campaignId={campaign.id} 
                          campaignName={campaign.name} 
                          qrUrl={campaign.qr_code_url || ''} 
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}