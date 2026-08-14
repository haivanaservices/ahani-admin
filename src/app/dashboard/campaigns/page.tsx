import Link from 'next/link';

export default function CampaignsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 mb-3 inline-flex items-center gap-1">
            &larr; Back to Overview
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Campaigns</h1>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2">
          <span className="text-lg leading-none">+</span> New Campaign
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-5 font-semibold">Campaign Name</th>
                <th className="p-5 font-semibold">Status</th>
                <th className="p-5 font-semibold">Total Scans</th>
                <th className="p-5 font-semibold">Date Created</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="p-5 font-bold text-slate-900">Q3 Medical Billing Updates</td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-extrabold tracking-wide">ACTIVE</span>
                </td>
                <td className="p-5 font-medium text-slate-600">842</td>
                <td className="p-5 text-slate-500">Aug 01, 2026</td>
                <td className="p-5 text-right">
                  <button className="text-slate-900 hover:text-slate-600 font-bold text-sm underline decoration-slate-300 underline-offset-4">
                    Download QR
                  </button>
                </td>
              </tr>
              
              <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="p-5 font-bold text-slate-900">Annual Policy Renewal Notice</td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-extrabold tracking-wide">ACTIVE</span>
                </td>
                <td className="p-5 font-medium text-slate-600">406</td>
                <td className="p-5 text-slate-500">Jul 15, 2026</td>
                <td className="p-5 text-right">
                  <button className="text-slate-900 hover:text-slate-600 font-bold text-sm underline decoration-slate-300 underline-offset-4">
                    Download QR
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}