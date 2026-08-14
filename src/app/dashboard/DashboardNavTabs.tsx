'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardNavTabs() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Overview', href: '/dashboard' },
    { name: 'Master Profile', href: '/dashboard/profile' },
    { name: 'Analytics', href: '/dashboard/analytics' },
    { name: 'Billing & Tiers', href: '/dashboard/billing' },
    { name: 'Team Access', href: '/dashboard/team' }, // Added new tab
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-6">
      <div className="max-w-7xl mx-auto flex space-x-8">
        {tabs.map((tab) => {
          const isActive = tab.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-4 text-sm font-bold border-b-2 transition-colors ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}