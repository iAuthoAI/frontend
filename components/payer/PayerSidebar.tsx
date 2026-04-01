'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV_INTAKE = [
  { label: 'Intake Queue', href: '/payer/intake', icon: '📥' },
  { label: 'Dashboard', href: '/payer/intake/dashboard', icon: '📊' },
];

const NAV_CLINICAL = [
  { label: 'Clinical Queue', href: '/payer/clinical', icon: '🩺' },
  { label: 'Dashboard', href: '/payer/clinical/dashboard', icon: '📊' },
];

const NAV_DECISION = [
  { label: 'Decision Queue', href: '/payer/decision', icon: '⚖️' },
  { label: 'Dashboard', href: '/payer/decision/dashboard', icon: '📊' },
];

const NAV_ADMIN = [
  { label: 'Intake Queue', href: '/payer/intake', icon: '📥' },
  { label: 'Clinical Queue', href: '/payer/clinical', icon: '🩺' },
  { label: 'Decision Queue', href: '/payer/decision', icon: '⚖️' },
  { label: 'Analytics', href: '/payer/analytics', icon: '📈' },
];

export default function PayerSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const getNav = () => {
    if (!user) return NAV_INTAKE;
    if (user.role === 'payer_intake') return NAV_INTAKE;
    if (user.role === 'payer_clinical') return NAV_CLINICAL;
    if (user.role === 'payer_decision') return NAV_DECISION;
    return NAV_ADMIN;
  };

  const nav = getNav();

  const roleLabel = {
    payer_intake: 'Intake Specialist',
    payer_clinical: 'Clinical Reviewer',
    payer_decision: 'Decision Authority',
    admin: 'Administrator',
  }[user?.role || ''] || 'Reviewer';

  return (
    <aside className="w-60 bg-slate-900 flex flex-col h-full flex-shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
          >
            1
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">OneClick</div>
            <div className="text-violet-400 text-[10px] font-semibold tracking-widest uppercase">Payer Portal</div>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-300 text-xs font-semibold">{roleLabel}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-2 mb-3">Workqueue</p>
        {nav.map((item) => {
          const active = pathname === item.href || (item.href.split('/').length > 2 && pathname.startsWith(item.href));
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                active
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <span>📋</span> Policies
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all">
          <span>⚙️</span> Settings
        </button>
      </div>
    </aside>
  );
}
