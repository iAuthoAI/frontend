'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getStoredUser, clearAuth } from '@/lib/auth';

const NAV = [
  { label: 'Schedule', href: '/provider', icon: '📅', exact: true },
  { label: 'Patient List', href: '/provider/patients', icon: '👥' },
  { label: 'PA Requests', href: '/provider/pa-requests', icon: '📋' },
  { label: 'Notifications', href: '/provider/notifications', icon: '🔔', badge: true },
  { label: 'Code Search', href: '/provider/codes', icon: '🔍' },
  { label: 'FHIR Sync', href: '/provider/fhir', icon: '⚡' },
];

export default function ProviderSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
          >1</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">OneClick</div>
            <div className="text-white/30 text-[10px] uppercase tracking-widest">Provider Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-2 mb-3">My Activities</p>
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  2
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'DR'}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-semibold truncate">{user?.full_name || 'Provider'}</div>
            <div className="text-white/30 text-[10px] truncate capitalize">{user?.role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span>⎋</span> Logout
        </button>
      </div>
    </aside>
  );
}
