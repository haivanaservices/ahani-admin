import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../actions';
import DashboardNavTabs from './DashboardNavTabs'; // We'll render client tabs here

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // UPDATED: Added is_verified_enterprise to the select statement
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type, agency_id, is_verified_enterprise')
    .eq('id', user.id)
    .single();

  // NEW: The Hard Block logic
  // If the AI explicitly marked them as false, boot them to the review page
  if (profile && profile.is_verified_enterprise === false) {
    redirect('/pending-review');
  }

  const isEnterprise = profile?.account_type === 'enterprise';

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      
      {/* Top Header */}
      <header className="w-full px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image alt="Ahani Logo" className="rounded-full" height={32} src="/image_4fbdd3.png" width={32} />
            <span className="text-xl font-bold tracking-tight">Ahani Admin</span>
          </Link>
          
          {isEnterprise && (
            <span className="ml-4 px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md border border-slate-200">
              Enterprise Workspace
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {!isEnterprise && (
            <Link 
              href="/dashboard/billing"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Top Up Quota
            </Link>
          )}

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            
            <form action={signOut}>
              <button 
                type="submit" 
                className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Secondary Navigation Bar (The 4 Tabs) */}
      <DashboardNavTabs />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}