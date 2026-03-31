'use client';

import { useRouter } from 'next/navigation';
import { getStoredUser, clearAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function PayerTopbar() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RV';

  return (
    <header className="bg-slate-900 border-b border-white/10 h-14 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PA requests, members, cases..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* SLA indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-300 border border-violet-500/30 bg-violet-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          SLA: 98.2%
        </div>

        {/* Secure badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-green-400 border border-green-500/30 bg-green-500/10">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Secure
        </div>

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
          🔔
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">5</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <div className="text-white text-sm font-semibold leading-tight">{user?.full_name || 'Reviewer'}</div>
            <div className="text-white/40 text-xs">iAuthoAI Ops</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
          <button onClick={handleLogout} className="text-white/40 hover:text-white transition-colors ml-1" title="Logout">⎋</button>
        </div>
      </div>
    </header>
  );
}
