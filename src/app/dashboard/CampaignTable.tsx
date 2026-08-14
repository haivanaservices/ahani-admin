import { createClient } from '../../utils/supabase/server';
import { QrCode, MoreHorizontal, ExternalLink } from 'lucide-react';

export default async function CampaignTable({ agencyId }: { agencyId: string }) {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  // 1. The Beautiful Empty State
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8 p-16 text-center border-dashed">
        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
          <QrCode size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Touchpoints</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
          You haven't generated any QR campaigns yet. Click the "+ New Campaign" button at the top to create your first routing link.
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
              <th className="p-4 font-bold">Total Scans</th>
              <th className="p-4 font-bold">Status</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-slate-50 transition group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                      <QrCode size={18} />
                    </div>
                    <span className="font-bold text-slate-900">{campaign.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500 font-mono">
                  {campaign.qr_code_url ? (
                    <div className="flex items-center gap-2">
                      <span className="truncate w-32">{campaign.qr_code_url.split('scan/')[1]}</span>
                      <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition cursor-pointer hover:text-blue-600" />
                    </div>
                  ) : (
                    'Pending...'
                  )}
                </td>
                <td className="p-4">
                  <span className="font-bold text-slate-900">{campaign.total_scans || 0}</span>
                </td>
                <td className="p-4">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                    {campaign.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="p-2 text-slate-400 hover:text-slate-900 transition rounded-lg hover:bg-slate-100">
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}