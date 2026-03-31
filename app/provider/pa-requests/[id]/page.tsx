'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { paApi } from '@/lib/api';
import { cn, formatDate, getStatusColor, getStatusLabel, getAIScoreColor, getAIScoreBg } from '@/lib/utils';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
api.interceptors.request.use(cfg => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) cfg.headers!.Authorization = `Bearer ${token}`;
  return cfg;
});

export default function PaRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [pa, setPa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resubmitNote, setResubmitNote] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);

  useEffect(() => {
    paApi.get(id)
      .then(res => setPa(res.data))
      .catch(() => setPa(MOCK_PA))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );
  if (!pa) return <div className="p-8 text-slate-500">PA request not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">←</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">{pa.request_number}</h1>
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', getStatusColor(pa.status))}>
              {getStatusLabel(pa.status)}
            </span>
            {pa.priority === 'urgent' && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">⚡ URGENT</span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Submitted {formatDate(pa.submitted_at || pa.created_at)}</p>
        </div>
        {pa.status === 'draft' && (
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Submit PA
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left column */}
        <div className="col-span-2 space-y-5">
          {/* Patient + Service */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Service Request</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient</div>
                <div className="text-sm font-semibold text-slate-800">{pa.patient_name || pa.patient?.full_name}</div>
                <div className="text-xs text-slate-500">Member ID: {pa.member_id || pa.coverage?.member_id}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payer</div>
                <div className="text-sm font-semibold text-slate-800">{pa.payer_name}</div>
                <div className="text-xs text-slate-500">{pa.plan_name || pa.plan?.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CPT Code</div>
                <div className="text-sm font-mono font-bold text-indigo-600">{pa.cpt_code}</div>
                <div className="text-xs text-slate-500">{pa.cpt_description}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Diagnosis</div>
                <div className="text-sm font-mono font-bold text-slate-700">{pa.icd10_primary}</div>
                <div className="text-xs text-slate-500">{pa.icd10_primary_desc}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Service Date</div>
                <div className="text-sm text-slate-700">{formatDate(pa.service_date)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Facility</div>
                <div className="text-sm text-slate-700">{pa.service_facility || 'Metro Medical Center'}</div>
              </div>
            </div>
          </motion.div>

          {/* Clinical Justification */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-3">Clinical Justification</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{pa.clinical_justification || '—'}</p>
            {pa.clinical_notes && (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2">Clinical Notes</div>
                <p className="text-sm text-slate-600 leading-relaxed">{pa.clinical_notes}</p>
              </>
            )}
          </motion.div>

          {/* AI Analysis */}
          {pa.ai_analysis && Object.keys(pa.ai_analysis).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-indigo-500">✦</span>
                <h2 className="font-semibold text-slate-700">AI Analysis</h2>
                {pa.ai_score != null && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="w-20 h-2 bg-white rounded-full overflow-hidden">
                      <div className={cn('h-2 rounded-full', getAIScoreBg(pa.ai_score))} style={{ width: `${pa.ai_score}%` }} />
                    </div>
                    <span className={cn('text-sm font-bold', getAIScoreColor(pa.ai_score))}>{pa.ai_score}/100</span>
                  </div>
                )}
              </div>
              {pa.ai_analysis.summary && <p className="text-sm text-slate-600 mb-3">{pa.ai_analysis.summary}</p>}
              {(pa.ai_gaps || []).length > 0 && (
                <>
                  <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-2">Documentation Gaps</div>
                  <ul className="space-y-1">
                    {pa.ai_gaps.map((gap: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-orange-400 mt-0.5">⚠</span>
                        {typeof gap === 'string' ? gap : gap?.gap || ''}
                        {gap?.impact && <span className="ml-1 text-xs font-semibold text-orange-500">({gap.impact})</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {(pa.ai_suggestions || []).length > 0 && (
                <>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 mt-3">Suggestions</div>
                  <ul className="space-y-1">
                    {pa.ai_suggestions.map((s: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-green-500 mt-0.5">✓</span> {typeof s === 'string' ? s : s?.suggestion || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Right column - Timeline + Decision */}
        <div className="space-y-5">
          {/* Status Timeline */}
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Status Timeline</h2>
            <div className="space-y-3">
              {getTimeline(pa).map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', step.done ? 'bg-indigo-500' : 'bg-slate-200')} />
                  <div>
                    <div className={cn('text-xs font-semibold', step.done ? 'text-slate-700' : 'text-slate-400')}>{step.label}</div>
                    {step.date && <div className="text-xs text-slate-400">{formatDate(step.date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Decision (if approved/denied) */}
          {['approved', 'denied', 'partial_approval'].includes(pa.status) && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className={cn('rounded-2xl border p-5', pa.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
              <h2 className={cn('font-semibold mb-2', pa.status === 'approved' ? 'text-green-700' : 'text-red-700')}>
                {pa.status === 'approved' ? '✅ Approved' : '⊘ Denied'}
              </h2>
              {pa.decision_reason && <p className="text-sm text-slate-600">{pa.decision_reason}</p>}
              {pa.approved_from && (
                <div className="mt-2 text-xs text-slate-500">
                  Auth period: {formatDate(pa.approved_from)} – {formatDate(pa.approved_through)}
                </div>
              )}
            </motion.div>
          )}

          {/* Payer Reference */}
          {pa.payer_reference_number && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Payer Reference #</div>
              <div className="font-mono text-sm text-slate-700">{pa.payer_reference_number}</div>
            </div>
          )}

          {/* Action Required — Resubmit */}
          {pa.status === 'action_required' && (
            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5">
              <h2 className="font-semibold text-orange-700 mb-1">⚠ Additional Info Required</h2>
              <p className="text-sm text-orange-600 mb-3">The payer has requested more information. Add details below and resubmit.</p>
              {!showResubmit ? (
                <button
                  onClick={() => setShowResubmit(true)}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Respond & Resubmit
                </button>
              ) : (
                <>
                  <textarea
                    value={resubmitNote}
                    onChange={e => setResubmitNote(e.target.value)}
                    placeholder="Add additional clinical information or documentation details..."
                    rows={4}
                    className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-3"
                  />
                  <button
                    disabled={resubmitting}
                    onClick={async () => {
                      setResubmitting(true);
                      try {
                        await api.post(`/api/pa-requests/${pa.id}/resubmit`, { additional_notes: resubmitNote });
                        setPa((prev: any) => ({ ...prev, status: 'submitted' }));
                        setShowResubmit(false);
                        setResubmitNote('');
                      } finally {
                        setResubmitting(false);
                      }
                    }}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    {resubmitting ? 'Resubmitting...' : '↑ Resubmit to Payer'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2">
            <h2 className="font-semibold text-slate-700 mb-3">Actions</h2>
            <button className="w-full px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
              📄 Download PA Letter
            </button>
            <button className="w-full px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left">
              📎 Upload Supporting Docs
            </button>
            {pa.status === 'denied' && (
              <button className="w-full px-3 py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors text-left font-semibold">
                ↩ Submit Appeal
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeline(pa: any) {
  const allStatuses = ['draft', 'submitted', 'intake_review', 'clinical_review', 'decision_pending', 'approved'];
  const currentIdx = allStatuses.indexOf(pa.status);
  return [
    { label: 'Draft Created', done: true, date: pa.created_at },
    { label: 'Submitted', done: currentIdx >= 1, date: pa.submitted_at },
    { label: 'Intake Review', done: currentIdx >= 2, date: pa.intake_started_at },
    { label: 'Clinical Review', done: currentIdx >= 3, date: pa.clinical_started_at },
    { label: 'Decision', done: currentIdx >= 4, date: pa.decision_at },
  ];
}

const MOCK_PA = {
  id: '1', request_number: 'PA-2026-0001', patient_name: 'Babara Rice', member_id: 'BCBS-000101',
  payer_name: 'BlueCross BlueShield', plan_name: 'BCBS PPO Gold',
  cpt_code: '44970', cpt_description: 'Laparoscopic appendectomy',
  icd10_primary: 'K35.80', icd10_primary_desc: 'Acute appendicitis without abscess',
  service_date: '2026-04-01', service_facility: 'Metro Medical Center',
  status: 'clinical_review', priority: 'urgent',
  clinical_justification: 'Patient presents with acute appendicitis confirmed by CT scan. WBC elevated at 14,000. Surgical intervention required.',
  ai_score: 87, ai_confidence: 92.5, ai_analysis: { summary: 'High probability of approval based on clinical criteria.' },
  ai_gaps: ['Pathology report not attached', 'Pre-auth form signature missing'],
  ai_suggestions: ['Attach CT scan report', 'Include surgeon credentials'],
  created_at: new Date().toISOString(), submitted_at: new Date().toISOString(),
};
