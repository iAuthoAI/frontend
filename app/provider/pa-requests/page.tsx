'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { paApi } from '@/lib/api';
import { cn, formatDate, getStatusColor, getStatusLabel, getAIScoreColor, getAIScoreBg } from '@/lib/utils';

const FILTERS = ['All', 'Draft', 'Submitted', 'Intake Review', 'Clinical Review', 'Decision Pending', 'Approved', 'Denied'];

const STATUS_MAP: Record<string, string> = {
  'All': '',
  'Draft': 'draft',
  'Submitted': 'submitted',
  'Intake Review': 'intake_review',
  'Clinical Review': 'clinical_review',
  'Decision Pending': 'decision_pending',
  'Approved': 'approved',
  'Denied': 'denied',
};

export default function PaRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    setLoading(true);
    try {
      const params: any = {};
      if (STATUS_MAP[filter]) params.status = STATUS_MAP[filter];
      const res = await paApi.list(params);
      const data = res.data;
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      setRequests(MOCK_REQUESTS);
      setTotal(MOCK_REQUESTS.length);
    } finally {
      setLoading(false);
    }
  }

  const filtered = search
    ? requests.filter(r =>
        r.request_number?.toLowerCase().includes(search.toLowerCase()) ||
        r.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.cpt_code?.includes(search) ||
        r.icd10_primary?.includes(search)
      )
    : requests;

  const stats = {
    total: requests.length,
    pending: requests.filter(r => ['submitted', 'intake_review', 'clinical_review', 'decision_pending'].includes(r.status)).length,
    approved: requests.filter(r => r.status === 'approved').length,
    denied: requests.filter(r => r.status === 'denied').length,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Prior Authorization Requests</h1>
          <p className="text-sm text-slate-500 mt-0.5">{total} total requests</p>
        </div>
        <button
          onClick={() => router.push('/provider/pa-requests/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <span>+</span> New PA Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Pending Review', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
          { label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'Denied', value: stats.denied, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('rounded-xl border p-4', s.bg)}
          >
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100">
          <div className="flex gap-1 flex-1 overflow-x-auto">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient, code, PA#..."
            className="w-56 px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['PA #', 'Patient', 'Service', 'Diagnosis', 'Payer', 'Status', 'AI Score', 'Submitted', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req, i) => (
                <motion.tr
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  onClick={() => router.push(`/provider/pa-requests/${req.id}`)}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-indigo-600 font-semibold">{req.request_number}</span>
                    <div className={cn('text-xs font-semibold mt-0.5', req.priority === 'urgent' ? 'text-red-500' : req.priority === 'stat' ? 'text-red-600' : 'text-slate-400')}>
                      {req.priority?.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-700">{req.patient_name}</div>
                    <div className="text-xs text-slate-400">{req.member_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono text-slate-700">{req.cpt_code}</div>
                    <div className="text-xs text-slate-500 max-w-32 truncate">{req.cpt_description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono text-slate-700">{req.icd10_primary}</div>
                    <div className="text-xs text-slate-500 max-w-32 truncate">{req.icd10_primary_desc}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{req.payer_name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', getStatusColor(req.status))}>
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.ai_score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full w-12">
                          <div className={cn('h-1.5 rounded-full', getAIScoreBg(req.ai_score))} style={{ width: `${req.ai_score}%` }} />
                        </div>
                        <span className={cn('text-xs font-bold', getAIScoreColor(req.ai_score))}>{req.ai_score}</span>
                      </div>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDate(req.submitted_at || req.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      className="px-3 py-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
                      onClick={e => { e.stopPropagation(); router.push(`/provider/pa-requests/${req.id}`); }}
                    >
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">No PA requests found</p>
            <button onClick={() => router.push('/provider/pa-requests/new')} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              Create First Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const MOCK_REQUESTS = [
  {
    id: '1', request_number: 'PA-2026-0001', patient_name: 'Babara Rice', member_id: 'BCBS-000101',
    cpt_code: '44970', cpt_description: 'Laparoscopic appendectomy', icd10_primary: 'K35.80',
    icd10_primary_desc: 'Acute appendicitis', payer_name: 'BlueCross BlueShield',
    status: 'clinical_review', priority: 'urgent', ai_score: 87, submitted_at: new Date().toISOString(),
  },
  {
    id: '2', request_number: 'PA-2026-0002', patient_name: 'Harland DuBuque', member_id: 'BCBS-000202',
    cpt_code: '27447', cpt_description: 'Total knee arthroplasty', icd10_primary: 'M17.11',
    icd10_primary_desc: 'Primary osteoarthritis, right knee', payer_name: 'BlueCross BlueShield',
    status: 'submitted', priority: 'routine', ai_score: 74, submitted_at: new Date().toISOString(),
  },
];
