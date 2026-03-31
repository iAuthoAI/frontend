'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { payerPortalApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type QueueItem = {
  id: string;
  request_number: string;
  patient_name: string;
  member_id: string;
  payer_name: string;
  service_type: string;
  cpt_code: string;
  priority: string;
  days_pending: number;
  ai_score: number | null;
  clinical_recommendation: 'approve' | 'deny' | 'peer_review' | null;
};

const DENIAL_REASONS = [
  'Not medically necessary per payer guidelines',
  'Experimental or investigational service',
  'Duplicate request / service already authorized',
  'Benefit not covered under member plan',
  'Incomplete clinical documentation',
  'Conservative therapy not attempted',
  'Out-of-network provider',
  'Prior auth not required for this service',
];

export default function DecisionPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'denied' | 'partial' | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [authUnits, setAuthUnits] = useState('');
  const [authStartDate, setAuthStartDate] = useState('');
  const [authEndDate, setAuthEndDate] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [finalized, setFinalized] = useState<string | null>(null);

  useEffect(() => { loadQueue(); }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await payerPortalApi.getDecisionQueue();
      setQueue(res.data.queue || []);
    } catch {
      setQueue(MOCK_QUEUE);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setReviewing(true);
    setDecision(null);
    setDenialReason('');
    setDecisionNotes('');
    setAuthUnits('1');
    setAuthStartDate('2026-04-01');
    setAuthEndDate('2026-06-30');
    setFinalized(null);
    try {
      const res = await payerPortalApi.getDecisionReview(id);
      setSelected(res.data);
    } catch {
      const mock = MOCK_QUEUE.find((q) => q.id === id);
      if (mock) setSelected(buildMockDetail(mock));
    } finally {
      setReviewing(false);
    }
  }

  async function handleFinalize() {
    if (!selected || !decision) return;
    if (decision === 'denied' && !denialReason) return;
    setActionLoading(true);
    try {
      await payerPortalApi.reviewDecision(selected.id, {
        decision,
        denial_reason: denialReason || undefined,
        auth_units: authUnits ? Number(authUnits) : undefined,
        auth_start_date: authStartDate || undefined,
        auth_end_date: authEndDate || undefined,
        decision_notes: decisionNotes,
      });
      setFinalized(decision);
      await loadQueue();
    } catch {
      setFinalized(decision);
      setQueue((q) => q.filter((i) => i.id !== selected.id));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Queue */}
      <div className="w-[400px] flex-shrink-0 border-r border-white/10 flex flex-col bg-slate-900/50">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white font-bold text-lg">Decision Queue</h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              {queue.length} pending
            </span>
          </div>
          <p className="text-white/40 text-xs">Final authorization decisions — approvals, denials, and partial approvals.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">Decision queue is empty</div>
          ) : (
            queue.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => loadDetail(item.id)}
                className={cn(
                  'w-full text-left p-3 rounded-xl transition-all border',
                  selected?.id === item.id
                    ? 'bg-emerald-600/20 border-emerald-500/50'
                    : 'bg-white/3 hover:bg-white/6 border-white/5 hover:border-white/10'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-white font-semibold text-sm">{item.patient_name}</div>
                    <div className="text-white/40 text-xs font-mono">{item.request_number}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ClinicalRecBadge rec={item.clinical_recommendation} />
                    {item.ai_score !== null && (
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                        item.ai_score >= 70 ? 'bg-green-500/20 text-green-400' :
                          item.ai_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                      )}>AI {item.ai_score}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{item.cpt_code}</span>
                  <span className="truncate">{item.service_type}</span>
                  <span className="ml-auto flex-shrink-0">{item.days_pending}d</span>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center px-8"
            >
              <div className="text-6xl mb-4">⚖️</div>
              <div className="text-white/50 text-lg font-semibold mb-2">Select a case to decide</div>
              <div className="text-white/30 text-sm max-w-xs">
                Review clinically assessed requests and issue final authorization decisions.
              </div>
            </motion.div>
          ) : reviewing ? (
            <motion.div key="loading" className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </motion.div>
          ) : finalized ? (
            <FinalizedConfirmation decision={finalized} requestNumber={selected.request_number} onNext={() => { setSelected(null); setFinalized(null); }} />
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white font-bold text-xl mb-1">{selected.patient?.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span className="font-mono">{selected.request_number}</span>
                    <span>·</span>
                    <span>{selected.service?.cpt_code} — {selected.service?.description}</span>
                  </div>
                </div>
                {selected.ai_score !== null && (
                  <div className="text-center">
                    <AIScoreRing score={selected.ai_score} />
                    <div className="text-white/40 text-[10px] mt-1">AI Score</div>
                  </div>
                )}
              </div>

              {/* Clinical recommendation banner */}
              {selected.clinical_recommendation && (
                <div className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  selected.clinical_recommendation === 'approve'
                    ? 'bg-green-500/10 border-green-500/30'
                    : selected.clinical_recommendation === 'peer_review'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                )}>
                  <span className="text-2xl">
                    {selected.clinical_recommendation === 'approve' ? '✅' : selected.clinical_recommendation === 'peer_review' ? '👥' : '⚠️'}
                  </span>
                  <div>
                    <div className={cn('font-semibold text-sm',
                      selected.clinical_recommendation === 'approve' ? 'text-green-400' :
                        selected.clinical_recommendation === 'peer_review' ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      Clinical Recommendation: {selected.clinical_recommendation === 'approve' ? 'Approve' : selected.clinical_recommendation === 'peer_review' ? 'Peer Review Required' : 'Deny'}
                    </div>
                    <div className="text-white/50 text-xs">Reviewed by {selected.clinical_reviewer || 'Clinical Team'} · {selected.clinical_review_date || 'Today'}</div>
                  </div>
                </div>
              )}

              {/* Case Summary */}
              <div className="grid grid-cols-3 gap-3">
                <CaseCard label="Member" icon="👤" lines={[selected.patient?.name, selected.patient?.member_id, selected.patient?.plan_name]} />
                <CaseCard label="Provider" icon="🏥" lines={[selected.provider?.name, `NPI: ${selected.provider?.npi}`, selected.provider?.specialty]} />
                <CaseCard label="Service" icon="💊" lines={[selected.service?.description, `CPT: ${selected.service?.cpt_code}`, `ICD: ${selected.service?.icd10}`]} />
              </div>

              {/* Decision Selection */}
              <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span>🏛️</span> Final Authorization Decision
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { value: 'approved' as const, label: 'Approve', sublabel: 'Full authorization granted', icon: '✅', color: 'green' },
                    { value: 'partial' as const, label: 'Partial Approve', sublabel: 'Modified authorization', icon: '⚡', color: 'yellow' },
                    { value: 'denied' as const, label: 'Deny', sublabel: 'Authorization denied', icon: '⊘', color: 'red' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDecision(opt.value)}
                      className={cn(
                        'py-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-2',
                        decision === opt.value
                          ? opt.color === 'green'
                            ? 'bg-green-500/30 border-green-500 text-green-300 shadow-lg shadow-green-500/10'
                            : opt.color === 'yellow'
                              ? 'bg-yellow-500/30 border-yellow-500 text-yellow-300 shadow-lg shadow-yellow-500/10'
                              : 'bg-red-500/30 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                      )}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div>
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-[10px] opacity-70 font-normal">{opt.sublabel}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Authorization details (if approve/partial) */}
                <AnimatePresence>
                  {(decision === 'approved' || decision === 'partial') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                        <div className="text-green-400 text-xs font-semibold uppercase mb-3">Authorization Details</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-white/40 text-xs block mb-1">Auth Units</label>
                            <input
                              type="number"
                              value={authUnits}
                              onChange={(e) => setAuthUnits(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs block mb-1">Start Date</label>
                            <input
                              type="date"
                              value={authStartDate}
                              onChange={(e) => setAuthStartDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-white/40 text-xs block mb-1">End Date</label>
                            <input
                              type="date"
                              value={authEndDate}
                              onChange={(e) => setAuthEndDate(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {decision === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <div className="text-red-400 text-xs font-semibold uppercase mb-3">Denial Reason (Required)</div>
                        <div className="space-y-2">
                          {DENIAL_REASONS.map((reason) => (
                            <label key={reason} className="flex items-center gap-2 cursor-pointer group">
                              <div
                                onClick={() => setDenialReason(reason)}
                                className={cn(
                                  'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                                  denialReason === reason
                                    ? 'border-red-400 bg-red-400'
                                    : 'border-white/20 group-hover:border-white/40'
                                )}
                              >
                                {denialReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="text-white/70 text-xs group-hover:text-white/90">{reason}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Decision Notes */}
                <textarea
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="Decision notes and rationale (required for denials)..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-emerald-500 resize-none mb-4"
                />

                {/* Finalize button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleFinalize}
                  disabled={!decision || (decision === 'denied' && !denialReason) || actionLoading}
                  className={cn(
                    'w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed',
                    decision === 'approved' || decision === 'partial'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/20'
                      : decision === 'denied'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-white/10 text-white/50'
                  )}
                >
                  {actionLoading ? 'Finalizing...' :
                    decision === 'approved' ? '✅ Finalize Approval' :
                      decision === 'partial' ? '⚡ Finalize Partial Approval' :
                        decision === 'denied' ? '⊘ Finalize Denial' :
                          'Select a Decision Above'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FinalizedConfirmation({ decision, requestNumber, onNext }: { decision: string; requestNumber: string; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center h-full text-center px-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-7xl mb-6"
      >
        {decision === 'approved' ? '✅' : decision === 'partial' ? '⚡' : '📋'}
      </motion.div>
      <h2 className="text-white font-bold text-2xl mb-2">
        {decision === 'approved' ? 'Authorization Approved!' : decision === 'partial' ? 'Partial Authorization Issued' : 'Authorization Denied'}
      </h2>
      <p className="text-white/50 text-sm mb-2">{requestNumber}</p>
      <p className="text-white/40 text-sm mb-8 max-w-xs">
        {decision === 'approved' || decision === 'partial'
          ? 'The provider and member will be notified. Authorization letter has been generated.'
          : 'Denial letter and appeal rights have been generated and will be sent to the provider.'}
      </p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
      >
        Next Case →
      </motion.button>
    </motion.div>
  );
}

function ClinicalRecBadge({ rec }: { rec: 'approve' | 'deny' | 'peer_review' | null }) {
  if (!rec) return null;
  const map = {
    approve: 'bg-green-500/20 text-green-400 border-green-500/40',
    deny: 'bg-red-500/20 text-red-400 border-red-500/40',
    peer_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  };
  const label = { approve: 'Rec: Approve', deny: 'Rec: Deny', peer_review: 'Peer Review' };
  return <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border', map[rec])}>{label[rec]}</span>;
}

function AIScoreRing({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const c = 2 * Math.PI * 20;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-xs">{score}%</span>
      </div>
    </div>
  );
}

function CaseCard({ label, icon, lines }: { label: string; icon: string; lines: (string | undefined)[] }) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-white/10 p-3">
      <div className="text-white/40 text-[10px] uppercase mb-2 flex items-center gap-1">{icon} {label}</div>
      {lines.map((line, i) => (
        <div key={i} className={cn('text-xs', i === 0 ? 'text-white/80 font-semibold' : 'text-white/40 font-mono')}>{line || '—'}</div>
      ))}
    </div>
  );
}

const MOCK_QUEUE: QueueItem[] = [
  { id: '1', request_number: 'PA-2026-001210', patient_name: 'Garcia, Rosa M.', member_id: 'BCB999888777', payer_name: 'Blue Cross', service_type: 'Hip Replacement', cpt_code: '27130', priority: 'routine', days_pending: 6, ai_score: 88, clinical_recommendation: 'approve' },
  { id: '2', request_number: 'PA-2026-001211', patient_name: 'Wilson, Charles B.', member_id: 'AET666555444', payer_name: 'Aetna', service_type: 'Bariatric Surgery', cpt_code: '43644', priority: 'routine', days_pending: 8, ai_score: 34, clinical_recommendation: 'deny' },
  { id: '3', request_number: 'PA-2026-001212', patient_name: 'Taylor, Amanda K.', member_id: 'UHC333222111', payer_name: 'UHC', service_type: 'Spinal Cord Stimulator', cpt_code: '63685', priority: 'urgent', days_pending: 4, ai_score: 61, clinical_recommendation: 'peer_review' },
];

function buildMockDetail(item: QueueItem): any {
  return {
    ...item,
    patient: { name: item.patient_name, member_id: item.member_id, plan_name: item.payer_name + ' PPO Gold' },
    provider: { name: 'Dr. James Park, MD', npi: '1122334455', specialty: 'Orthopedic Surgery' },
    service: { cpt_code: item.cpt_code, description: item.service_type, icd10: 'M16.11', diagnosis: 'Primary osteoarthritis, hip', units: 1, start_date: '2026-04-15' },
    clinical_recommendation: item.clinical_recommendation,
    clinical_reviewer: 'Dr. Lisa Torres, MD',
    clinical_review_date: '2026-03-26',
    ai_score: item.ai_score,
  };
}
