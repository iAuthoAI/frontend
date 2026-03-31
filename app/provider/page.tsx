'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { scheduleApi } from '@/lib/api';
import { cn, getStatusColor } from '@/lib/utils';

export default function ProviderSchedulePage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([scheduleApi.getToday(), scheduleApi.getDashboard()])
      .then(([sched, dash]) => {
        setData(sched.data);
        setDashboard(dash.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const appointments = data?.appointments || [];
  const stats = dashboard?.stats || {};
  const alerts = (dashboard?.alerts || []).filter(Boolean);

  const authStatusStyle = (status: string | null) => {
    if (!status) return '';
    const map: Record<string, string> = {
      Expiring: 'text-orange-500',
      Verified: 'text-green-600',
      Denied: 'text-red-500',
      Appeal: 'text-red-500',
      'Action Required': 'text-orange-500',
      'Intake Review': 'text-cyan-600',
      'Clinical Review': 'text-purple-600',
      'Decision Pending': 'text-yellow-600',
    };
    return map[status] || 'text-gray-500';
  };

  return (
    <div className="p-6">
      {/* Daily Auth Outlook */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="text-indigo-500">✦</span> Daily Auth Outlook
          </h2>
          <span className="text-xs text-slate-400">AI LAST UPDATED: 08:00 AM</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((alert: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
            >
              <span className="text-xl mt-0.5">
                {alert.type === 'expiring' ? '⚠️' : alert.type === 'high_prob' ? '⚡' : '✅'}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {alert.type === 'expiring' ? `${stats.expiring_auths || 2} Prior Auths Expiring` :
                    alert.type === 'high_prob' ? `${stats.high_prob_approvals || 3} High-Prob Approvals` :
                      '1 Appeal Ready'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
              </div>
            </motion.div>
          ))}
          {alerts.length === 0 && (
            <div className="col-span-3 text-center text-slate-400 py-4 text-sm">No active alerts</div>
          )}
        </div>
      </motion.div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-800">My Schedule</h2>
            <span className="text-slate-400 text-sm">Today</span>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
              {appointments.length} Patients
            </span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Dept View</button>
            <button className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Refresh</button>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-100">
              {['TIME', 'STAT', 'PATIENT NAME / MRN', 'AGE/SEX', 'CHIEF COMPLAINT', 'ROOM', 'VITALS', 'AUTH STATUS', 'NOTES'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt: any, i: number) => {
              const p = appt.patient;
              return (
                <motion.tr
                  key={appt.appointment_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  onClick={() => router.push(`/provider/patients/${p.id}`)}
                >
                  <td className="px-4 py-4 text-sm text-slate-600 font-mono">{appt.scheduled_time}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      'text-xs font-semibold px-2 py-1 rounded-md',
                      appt.appointment_type === 'Admitted' ? 'bg-green-100 text-green-700' :
                        appt.appointment_type === 'ED' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                    )}>
                      {appt.appointment_type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-indigo-600 text-sm hover:underline">
                      {p.last_name}, {p.first_name}
                    </div>
                    <div className="text-xs text-slate-400">{p.mrn}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{p.age} / {p.gender === 'female' ? 'F' : 'M'}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{appt.chief_complaint}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{appt.room}</td>
                  <td className="px-4 py-4">
                    {appt.vitals ? (
                      <div>
                        <div className="text-xs text-slate-500">HR: {appt.vitals.hr}</div>
                        <div className={cn('text-xs font-semibold', appt.vitals.bp_elevated ? 'text-red-500' : 'text-slate-600')}>
                          BP: {appt.vitals.bp}
                        </div>
                      </div>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {appt.auth_status ? (
                      <span className={cn('text-xs font-semibold', authStatusStyle(appt.auth_status))}>
                        {appt.auth_status === 'Expiring' ? '⚠️ ' : appt.auth_status === 'Denied' ? '⊘ ' :
                          appt.auth_status === 'Verified' ? '✓ ' : ''}{appt.auth_status}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">···</button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {appointments.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📅</div>
            <p>No appointments scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  );
}
