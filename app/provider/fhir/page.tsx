'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fhirApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function FhirSyncPage() {
  const [status, setStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [limit, setLimit] = useState(50);
  const [fhirId, setFhirId] = useState('');
  const [singleResult, setSingleResult] = useState<any>(null);

  useEffect(() => {
    fhirApi.status().then(res => setStatus(res.data)).catch(() => setStatus({ connected: false }));
  }, []);

  async function syncBatch() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fhirApi.syncPatients(limit);
      setSyncResult({ success: true, ...res.data });
    } catch (e: any) {
      setSyncResult({ success: false, error: e.response?.data?.detail || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  }

  async function syncSingle() {
    if (!fhirId.trim()) return;
    setSyncing(true);
    setSingleResult(null);
    try {
      const res = await fhirApi.syncPatient(fhirId.trim());
      setSingleResult({ success: true, ...res.data });
    } catch (e: any) {
      setSingleResult({ success: false, error: e.response?.data?.detail || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">FHIR / SMART Health IT Sync</h1>
        <p className="text-sm text-slate-500 mt-0.5">Sync patient data from SMART Health IT FHIR R4 sandbox</p>
      </div>

      {/* Server status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={cn('rounded-2xl border p-5 mb-5', status?.connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
        <div className="flex items-center gap-3">
          <span className={cn('w-3 h-3 rounded-full flex-shrink-0', status?.connected ? 'bg-green-500' : 'bg-red-500')} />
          <div>
            <div className={cn('font-semibold text-sm', status?.connected ? 'text-green-700' : 'text-red-700')}>
              {status?.connected ? 'FHIR Server Connected' : 'FHIR Server Unavailable'}
            </div>
            {status?.connected && (
              <div className="text-xs text-slate-500 mt-0.5">
                {status.server} · FHIR {status.fhir_version} · {status.software}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-5">
        {/* Batch sync */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Batch Patient Sync</h2>
          <p className="text-xs text-slate-400 mb-4">Sync multiple patients from the FHIR server into OneClick</p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-600 font-medium">Max patients:</label>
            <select
              value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[10, 25, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button
            onClick={syncBatch}
            disabled={syncing || !status?.connected}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {syncing ? <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Syncing...</> : '⚡ Sync Patients'}
          </button>
          {syncResult && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={cn('mt-4 p-3 rounded-xl text-sm', syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
              {syncResult.success ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Created', value: syncResult.patients_created },
                    { label: 'Updated', value: syncResult.patients_updated },
                    { label: 'Skipped', value: syncResult.patients_skipped },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="text-xl font-bold">{s.value}</div>
                      <div className="text-xs opacity-70">{s.label}</div>
                    </div>
                  ))}
                </div>
              ) : <p>Error: {syncResult.error}</p>}
            </motion.div>
          )}
        </motion.div>

        {/* Single patient sync */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Single Patient Sync</h2>
          <p className="text-xs text-slate-400 mb-4">Sync one patient with full clinical data (conditions, meds, vitals, labs)</p>
          <div className="flex gap-3">
            <input
              value={fhirId}
              onChange={e => setFhirId(e.target.value)}
              placeholder="FHIR Patient ID (e.g. 9a82c90c-ba2d-4b36-...)"
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={syncSingle}
              disabled={syncing || !fhirId.trim() || !status?.connected}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >Sync</button>
          </div>
          {singleResult && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className={cn('mt-4 p-3 rounded-xl text-sm', singleResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
              {singleResult.success ? (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    ['Conditions', singleResult.conditions_created],
                    ['Meds', singleResult.medications_created],
                    ['Vitals', singleResult.vitals_created],
                    ['Labs', singleResult.labs_created],
                    ['CPT', singleResult.cpt_from_procedures],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="text-lg font-bold">{val ?? 0}</div>
                      <div className="opacity-70">{label}</div>
                    </div>
                  ))}
                </div>
              ) : <p>Error: {singleResult.error}</p>}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
