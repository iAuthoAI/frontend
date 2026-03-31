'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { payerPortalApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function IntakeDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    payerPortalApi.getStats()
      .then(r => setStats(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error || !stats) return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
      <div className="text-4xl">⚠️</div>
      <div className="text-white/50 text-sm">Could not load dashboard. Check backend connection.</div>
      <button onClick={() => { setError(false); setLoading(true); payerPortalApi.getStats().then(r => setStats(r.data)).catch(() => setError(true)).finally(() => setLoading(false)); }}
        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors">
        Retry
      </button>
    </div>
  );

  const s = stats;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h1 className="text-white font-bold text-2xl mb-1">Dashboard</h1>
        <p className="text-white/40 text-sm">Real-time overview of authorization operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: s.total_requests, color: 'violet', icon: '📋', sub: 'All time' },
          { label: 'Pending Review', value: s.pending, color: 'yellow', icon: '⏳', sub: 'In queue now' },
          { label: 'Approved', value: s.approved, color: 'green', icon: '✅', sub: 'All time' },
          { label: 'Denied', value: s.denied, color: 'red', icon: '⊘', sub: 'All time' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-800/60 rounded-2xl border border-white/10 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{kpi.icon}</span>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                kpi.color === 'violet' ? 'bg-violet-500/20 text-violet-300' :
                kpi.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-300' :
                kpi.color === 'green' ? 'bg-green-500/20 text-green-300' :
                'bg-red-500/20 text-red-300'
              )}>{kpi.sub}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{kpi.value ?? 0}</div>
            <div className="text-white/40 text-xs">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Performance row */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-800/60 rounded-2xl border border-white/10 p-5 col-span-2">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>📊</span> Processing Performance
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'Avg Turnaround', value: `${s.avg_turnaround_minutes} min`, icon: '⏱' },
              { label: 'AI Auto-Processed', value: s.ai_auto_processed, icon: '🤖' },
              { label: 'SLA Accuracy', value: `${s.accuracy_rate}%`, icon: '🎯' },
            ].map(m => (
              <div key={m.label} className="text-center">
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{m.value}</div>
                <div className="text-white/40 text-xs">{m.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-slate-800/60 rounded-2xl border border-white/10 p-5">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <span>🤖</span> AI Agent
          </h2>
          <div className="flex items-center gap-2 mb-4">
            <span className={cn('w-2.5 h-2.5 rounded-full', s.ai_agent_online ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
            <span className={cn('text-sm font-semibold', s.ai_agent_online ? 'text-green-400' : 'text-red-400')}>
              {s.ai_agent_online ? 'Agent Online' : 'Agent Offline'}
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Auto-approvals rate', value: `${s.auto_approvals_pct}%` },
              { label: 'New requests', value: s.new_requests },
              { label: 'Urgent items', value: s.urgent_items },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-white/40 text-xs">{r.label}</span>
                <span className="text-white text-xs font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Approval rate bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-slate-800/60 rounded-2xl border border-white/10 p-5">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>📈</span> Approval Breakdown
        </h2>
        {s.total_requests > 0 ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${(s.approved / s.total_requests) * 100}%` }} />
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(s.denied / s.total_requests) * 100}%` }} />
                <div className="h-full bg-yellow-500 rounded-r-full transition-all" style={{ width: `${(s.pending / s.total_requests) * 100}%` }} />
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-white/60">Approved</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-white/60">Denied</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-white/60">Pending</span></div>
              </div>
            </div>
            <div className="text-white/30 text-xs text-right">
              {Math.round((s.approved / s.total_requests) * 100)}% approval rate across {s.total_requests} total requests
            </div>
          </>
        ) : (
          <div className="text-white/30 text-sm text-center py-4">No requests processed yet</div>
        )}
      </motion.div>
    </div>
  );
}
