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
  status: string;
  clinical_criteria_met: boolean | null;
};

const CRITERIA_CHECKS = [
  { id: 'medical_necessity', label: 'Medical Necessity Established', key: 'medical_necessity' },
  { id: 'conservative_therapy', label: 'Conservative Therapy Attempted', key: 'conservative_therapy' },
  { id: 'clinical_guidelines', label: 'Meets Clinical Guidelines', key: 'clinical_guidelines' },
  { id: 'documentation_complete', label: 'Documentation Complete', key: 'documentation_complete' },
  { id: 'appropriate_level', label: 'Appropriate Level of Care', key: 'appropriate_level' },
];

export default function ClinicalPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [criteria, setCriteria] = useState<Record<string, boolean>>({});
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<'approve' | 'deny' | 'peer_review' | null>(null);

  useEffect(() => { loadQueue(); }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await payerPortalApi.getClinicalQueue();
      setQueue(res.data.queue || []);
    } catch {
      setQueue(MOCK_QUEUE);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setReviewing(true);
    setCriteria({});
    setClinicalNotes('');
    setRecommendation(null);
    try {
      const res = await payerPortalApi.getClinicalReview(id);
      setSelected(res.data);
    } catch {
      const mock = MOCK_QUEUE.find((q) => q.id === id);
      if (mock) setSelected(buildMockDetail(mock));
    } finally {
      setReviewing(false);
    }
  }

  async function handleSubmit() {
    if (!selected || !recommendation) return;
    setActionLoading(true);
    try {
      await payerPortalApi.reviewClinical(selected.id, {
        recommendation,
        criteria_met: criteria,
        clinical_notes: clinicalNotes,
      });
      await loadQueue();
      setSelected(null);
    } catch {
      setQueue((q) => q.filter((i) => i.id !== selected.id));
      setSelected(null);
    } finally {
      setActionLoading(false);
    }
  }

  const allCriteriaMet = CRITERIA_CHECKS.every((c) => criteria[c.key]);
  const criteriaMeetCount = CRITERIA_CHECKS.filter((c) => criteria[c.key]).length;

  return (
    <div className="flex h-full">
      {/* Queue */}
      <div className="w-[400px] flex-shrink-0 border-r border-white/10 flex flex-col bg-slate-900/50">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-bold text-lg">Clinical Review</h1>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-500/30">
              {queue.length} in queue
            </span>
          </div>
          <div className="text-white/40 text-xs">
            Review clinical criteria and medical necessity for each PA request.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">No cases in clinical review</div>
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
                    ? 'bg-blue-600/20 border-blue-500/50'
                    : 'bg-white/3 hover:bg-white/6 border-white/5 hover:border-white/10'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <div className="text-white font-semibold text-sm">{item.patient_name}</div>
                    <div className="text-white/40 text-xs font-mono">{item.request_number}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge priority={item.priority} />
                    {item.ai_score !== null && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        item.ai_score >= 70 ? 'bg-green-500/20 text-green-400' :
                          item.ai_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                      )}>AI {item.ai_score}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{item.cpt_code}</span>
                  <span>{item.service_type}</span>
                  <span className="ml-auto">{item.days_pending}d</span>
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
              <div className="text-6xl mb-4">🩺</div>
              <div className="text-white/50 text-lg font-semibold mb-2">Select a case to review</div>
              <div className="text-white/30 text-sm max-w-xs">
                Evaluate clinical criteria and medical necessity for PA requests forwarded from intake.
              </div>
            </motion.div>
          ) : reviewing ? (
            <motion.div key="loading" className="flex items-center justify-center h-full">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </motion.div>
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

              {/* Clinical Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4 col-span-2">
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>📋</span> Clinical Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-white/40 text-[10px] mb-1 uppercase">Diagnosis</div>
                      <div className="text-white/80 text-sm">{selected.service?.diagnosis}</div>
                      <div className="text-white/40 text-xs font-mono">{selected.service?.icd10}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] mb-1 uppercase">Service</div>
                      <div className="text-white/80 text-sm">{selected.service?.description}</div>
                      <div className="text-white/40 text-xs font-mono">{selected.service?.cpt_code}</div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] mb-1 uppercase">Clinical Notes</div>
                      <div className="text-white/70 text-xs leading-relaxed">{selected.clinical_info?.notes?.slice(0, 100)}...</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {selected.ai_analysis && (
                <div className="bg-slate-800/60 rounded-2xl border border-violet-500/20 p-4">
                  <h3 className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span>🤖</span> AI Clinical Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-white/40 text-[10px] mb-2 uppercase">Gaps Identified</div>
                      <div className="space-y-1">
                        {(selected.ai_analysis.gaps || []).map((gap: string, i: number) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs text-red-400">
                            <span className="mt-0.5">⚠</span> {gap}
                          </div>
                        ))}
                        {(!selected.ai_analysis.gaps || selected.ai_analysis.gaps.length === 0) && (
                          <div className="text-green-400 text-xs">✓ No critical gaps found</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[10px] mb-2 uppercase">AI Suggestions</div>
                      <div className="space-y-1">
                        {(selected.ai_analysis.suggestions || []).map((s: string, i: number) => (
                          <div key={i} className="text-xs text-white/60">• {s}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Criteria Checklist */}
              <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <span>☑️</span> Clinical Criteria Assessment
                  </h3>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    allCriteriaMet ? 'bg-green-500/20 text-green-400' :
                      criteriaMeetCount > 2 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                  )}>
                    {criteriaMeetCount}/{CRITERIA_CHECKS.length} met
                  </span>
                </div>
                <div className="space-y-2">
                  {CRITERIA_CHECKS.map((check) => (
                    <label key={check.id} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => setCriteria((prev) => ({ ...prev, [check.key]: !prev[check.key] }))}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                          criteria[check.key]
                            ? 'bg-green-500 border-green-500'
                            : 'border-white/20 group-hover:border-white/40'
                        )}
                      >
                        {criteria[check.key] && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="text-white/70 text-sm group-hover:text-white/90 transition-colors">
                        {check.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clinical Review Notes */}
              <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>📝</span> Clinical Review Notes
                </h3>
                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Document your clinical review findings and rationale..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Recommendation */}
              <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
                <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>⚖️</span> Clinical Recommendation
                </h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { value: 'approve' as const, label: 'Recommend Approval', color: 'green', icon: '✓' },
                    { value: 'peer_review' as const, label: 'Peer Review Required', color: 'yellow', icon: '👥' },
                    { value: 'deny' as const, label: 'Recommend Denial', color: 'red', icon: '⊘' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRecommendation(opt.value)}
                      className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1',
                        recommendation === opt.value
                          ? opt.color === 'green'
                            ? 'bg-green-500/30 border-green-500/60 text-green-300'
                            : opt.color === 'yellow'
                              ? 'bg-yellow-500/30 border-yellow-500/60 text-yellow-300'
                              : 'bg-red-500/30 border-red-500/60 text-red-300'
                          : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                      )}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <span className="text-[11px] text-center leading-tight">{opt.label}</span>
                    </motion.button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={!recommendation || actionLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Clinical Review →'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    stat: 'bg-red-500/20 text-red-400 border-red-500/40',
    urgent: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    routine: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    standard: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
  };
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize', map[priority] || map.routine)}>
      {priority}
    </span>
  );
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

const MOCK_QUEUE: QueueItem[] = [
  { id: '1', request_number: 'PA-2026-001220', patient_name: 'Davis, Michael T.', member_id: 'BCB111222333', payer_name: 'Blue Cross', service_type: 'Spinal Surgery', cpt_code: '22612', priority: 'urgent', days_pending: 3, ai_score: 52, status: 'clinical_review', clinical_criteria_met: null },
  { id: '2', request_number: 'PA-2026-001221', patient_name: 'Lee, Jennifer C.', member_id: 'AET444555666', payer_name: 'Aetna', service_type: 'Bariatric Surgery', cpt_code: '43644', priority: 'routine', days_pending: 5, ai_score: 71, status: 'clinical_review', clinical_criteria_met: null },
  { id: '3', request_number: 'PA-2026-001222', patient_name: 'Brown, William R.', member_id: 'UHC777888999', payer_name: 'UHC', service_type: 'PET Scan', cpt_code: '78816', priority: 'urgent', days_pending: 1, ai_score: 38, status: 'clinical_review', clinical_criteria_met: null },
];

function buildMockDetail(item: QueueItem): any {
  return {
    id: item.id,
    request_number: item.request_number,
    patient: { name: item.patient_name, dob: '1965-09-22', member_id: item.member_id, plan_name: item.payer_name + ' PPO' },
    provider: { name: 'Dr. Sarah Kim, MD', npi: '9876543210', specialty: 'Orthopedic Surgery' },
    service: { cpt_code: item.cpt_code, description: item.service_type, icd10: 'M47.816', diagnosis: 'Spondylosis with radiculopathy, lumbar region', units: 1, start_date: '2026-04-10' },
    clinical_info: { notes: 'Patient presents with chronic low back pain (>12 months), failed conservative management including PT (6 weeks), NSAIDs, and epidural steroid injections. MRI confirms moderate-to-severe stenosis at L4-L5.', urgency: item.priority === 'urgent' ? 'Urgent' : 'Routine' },
    ai_score: item.ai_score ?? 0,
    ai_analysis: {
      gaps: (item.ai_score ?? 100) < 60 ? ['Conservative therapy duration unclear', 'BMI not documented'] : [],
      suggestions: ['Confirm PT duration ≥ 6 weeks', 'Attach MRI report from last 6 months', 'Document failed epidural steroid injections'],
    },
    status: item.status,
  };
}
