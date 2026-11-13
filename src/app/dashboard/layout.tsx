import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '../../utils/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from '../actions';
import DashboardNavTabs from './DashboardNavTabs';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('DashboardLayout profile fetch error:', profileError.message);
  }

  if (profile && profile.is_verified_enterprise === false) {
    redirect('/pending-review');
  }

  const accountType = String(profile?.account_type || '').trim().toLowerCase();

  // Kick removed admins ('individual' / no agency) back to login
  if (profile && (!profile.agency_id || accountType === 'individual')) {
    redirect('/login?error=No+active+workspace+assigned');
  }

  const isOwner = Boolean(profile?.agency_id) && accountType === 'owner';

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900">
      {/* Top Header */}
      <header className="w-full px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              alt="Ahani Logo"
              className="rounded-full"
              height={32}
              src="/image_4fbdd3.png"
              width={32}
            />
            <span className="text-xl font-bold tracking-tight">Ahani Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard/billing"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Top Up Quota
          </Link>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {user.email?.charAt(0).toUpperCase() || 'A'}
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

      {/* Secondary Navigation Bar */}
      <DashboardNavTabs isOwner={isOwner} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}