import { UserPlus, Shield, Users } from 'lucide-react';

export default function TeamAccess() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Team Access Control</h1>
          <p className="text-slate-500 mt-1">Manage dashboard access, roles, and administrative authority.</p>
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Authorized Personnel</h2>
            <p className="text-sm text-slate-500">Only Executive Admins can add or remove team members.</p>
          </div>
          <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
            <UserPlus size={18} /> Add Admin
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Added</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50 transition">
              <td className="p-4">
                <p className="font-bold text-slate-900">Sarah Jenkins</p>
                <p className="text-xs text-slate-500">s.jenkins@alameda.gov</p>
              </td>
              <td className="p-4">
                <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded w-max">
                  <Shield size={14} /> Executive Admin
                </span>
              </td>
              <td className="p-4 text-sm text-slate-500">Oct 12, 2025</td>
              <td className="p-4 text-right text-sm font-bold text-slate-400">Owner</td>
            </tr>
            <tr className="hover:bg-slate-50 transition">
              <td className="p-4">
                <p className="font-bold text-slate-900">Marcus Chen</p>
                <p className="text-xs text-slate-500">m.chen@alameda.gov</p>
              </td>
              <td className="p-4">
                <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded w-max">
                  <Users size={14} /> Standard Admin
                </span>
              </td>
              <td className="p-4 text-sm text-slate-500">Jan 04, 2026</td>
              <td className="p-4 text-right">
                <button className="text-sm font-bold text-blue-600 hover:underline">Manage</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}