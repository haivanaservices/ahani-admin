import { UserPlus, Shield, Users, ArrowRightLeft, Trash2, Mail, XCircle } from 'lucide-react';
import { createClient } from '../../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { inviteAdmin, transferOwnership, removeAdmin, revokeInvite } from './actions';

export default async function TeamAccess() {
  const supabase = await createClient();

  // 1. Verify Auth & Get Current User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch profile data to check account_type and agency
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('id, agency_id, account_type')
    .eq('id', user.id)
    .single();

  // Gracefully redirect to login if profile or agency data is missing
  if (!currentUserProfile || !currentUserProfile.agency_id) {
    redirect('/login');
  }

  const isOwner = currentUserProfile.account_type === 'owner';

  // 3. Fetch all team members (Active & Pending) using our secure RPC
  const { data: teamMembers, error } = await supabase.rpc('get_agency_team_members');

  if (error) {
    console.error('Error fetching team members:', error.message);
  }

  const members = teamMembers || [];

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
        
        {/* Header & Invite Form */}
        <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Authorized Personnel</h2>
            <p className="text-sm text-slate-500">Only the Workspace Owner can manage team members.</p>
          </div>
          
          {/* Only show the invite form if they are the Owner */}
          {isOwner && (
            <form action={inviteAdmin} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="Coworker's email..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button 
                type="submit"
                className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm shrink-0"
              >
                <UserPlus size={16} /> Invite
              </button>
            </form>
          )}
        </div>

        {/* Dynamic Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500 bg-white">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Joined / Invited</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              
              {members.map((member: any) => {
                const isCurrentUser = member.id === currentUserProfile.id;
                const isPending = member.status === 'Pending';
                
                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{member.email}</p>
                      <p className="text-xs text-slate-500">ID: {member.id.split('-')[0]}...</p>
                    </td>
                    
                    <td className="p-4">
                      {member.account_type === 'owner' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded w-max border border-purple-200">
                          <Shield size={14} /> Workspace Owner
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded w-max border border-slate-200">
                          <Users size={14} /> Standard Admin
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="p-4 text-right">
                      {isCurrentUser ? (
                        <span className="text-sm font-bold text-slate-400">Current User</span>
                      ) : isOwner ? (
                        <div className="flex justify-end gap-2">
                          
                          {/* If Pending, allow revoking the invite */}
                          {isPending ? (
                            <form action={revokeInvite}>
                              <input type="hidden" name="userId" value={member.id} />
                              <button 
                                type="submit"
                                title="Revoke Pending Invite"
                                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
                              >
                                <XCircle size={14} /> Revoke
                              </button>
                            </form>
                          ) : (
                            <>
                              {/* Transfer Ownership Form */}
                              <form action={transferOwnership}>
                                <input type="hidden" name="userId" value={member.id} />
                                <button 
                                  type="submit"
                                  title="Transfer Ownership"
                                  className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
                                >
                                  <ArrowRightLeft size={14} /> Transfer
                                </button>
                              </form>

                              {/* Remove Admin Form */}
                              <form action={removeAdmin}>
                                <input type="hidden" name="userId" value={member.id} />
                                <button 
                                  type="submit"
                                  title="Remove Access"
                                  className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                                >
                                  <Trash2 size={14} /> Remove
                                </button>
                              </form>
                            </>
                          )}

                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}