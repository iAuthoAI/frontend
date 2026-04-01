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
  submitted_at: string;
  days_pending: number;
  ai_score: number | null;
  status: string;
};

type ReviewDetail = {
  id: string;
  request_number: string;
  patient: { name: string; dob: string; member_id: string; group_id: string; plan_name: string };
  provider: { name: string; npi: string; specialty: string; phone: string };
  service: { cpt_code: string; description: string; icd10: string; diagnosis: string; units: number; start_date: string };
  clinical_info: { notes: string; urgency: string };
  documents: { name: string; type: string; uploaded_at: string }[];
  ai_score: number | null;
  status: string;
  submitted_at: string;
};

export default function IntakePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'urgent' | 'standard'>('all');

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await payerPortalApi.getIntakeQueue();
      setQueue(res.data.queue || []);
    } catch {
      // Use mock data if API fails
      setQueue(MOCK_QUEUE);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(id: string) {
    setReviewing(true);
    try {
      const res = await payerPortalApi.getIntakeReview(id);
      setSelected(res.data);
    } catch {
      const mock = MOCK_QUEUE.find((q) => q.id === id);
      if (mock) setSelected(buildMockDetail(mock));
    } finally {
      setReviewing(false);
    }
  }

  async function handleAction(action: 'forward_clinical' | 'request_info' | 'deny') {
    if (!selected) return;
    setActionLoading(true);
    try {
      await payerPortalApi.reviewIntake(selected.id, { action, notes: actionNote });
      await loadQueue();
      setSelected(null);
      setActionNote('');
    } catch {
      // optimistic update
      setQueue((q) => q.filter((i) => i.id !== selected.id));
      setSelected(null);
    } finally {
      setActionLoading(false);
    }
  }

  const filtered = queue.filter((q) => {
    if (filter === 'urgent') return q.priority === 'urgent' || q.priority === 'stat';
    if (filter === 'standard') return q.priority === 'routine' || q.priority === 'standard';
    return true;
  });

  const stats = {
    total: queue.length,
    urgent: queue.filter((q) => q.priority === 'urgent' || q.priority === 'stat').length,
    avgDays: queue.length ? (queue.reduce((s, q) => s + (q.days_pending || 0), 0) / queue.length).toFixed(1) : '0',
  };

  return (
    <div className="flex h-full">
      {/* Queue panel */}
      <div className="w-[420px] flex-shrink-0 border-r border-white/10 flex flex-col bg-slate-900/50">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white font-bold text-lg">Intake Queue</h1>
            <span className="bg-violet-500/20 text-violet-300 text-xs font-bold px-2.5 py-1 rounded-full border border-violet-500/30">
              {queue.length} pending
            </span>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Urgent', value: stats.urgent, color: 'text-red-400' },
              { label: 'Avg Days', value: stats.avgDays, color: 'text-yellow-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 rounded-lg px-2 py-1.5 text-center">
                <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
                <div className="text-white/40 text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1">
            {(['all', 'urgent', 'standard'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all',
                  filter === f ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">Queue is empty</div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => loadDetail(item.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl transition-all border',
                    selected?.id === item.id
                      ? 'bg-violet-600/20 border-violet-500/50'
                      : 'bg-white/3 hover:bg-white/6 border-white/5 hover:border-white/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="text-white font-semibold text-sm">{item.patient_name}</div>
                      <div className="text-white/40 text-xs">MBR: {item.member_id}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <PriorityBadge priority={item.priority} />
                      {item.ai_score !== null && (
                        <span className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded',
                          item.ai_score >= 70 ? 'bg-green-500/20 text-green-400' :
                            item.ai_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                        )}>
                          AI {item.ai_score}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/50">
                    <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded">{item.cpt_code}</span>
                    <span>{item.service_type}</span>
                    <span className="ml-auto">{item.days_pending}d pending</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-1">{item.payer_name} · {item.request_number}</div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center px-8"
            >
              <div className="text-6xl mb-4">📥</div>
              <div className="text-white/50 text-lg font-semibold mb-2">Select a request to review</div>
              <div className="text-white/30 text-sm max-w-xs">
                Click on any PA request in the queue to view details and begin intake review.
              </div>
            </motion.div>
          ) : reviewing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-white font-bold text-xl">{selected.patient?.name}</h2>
                    <PriorityBadge priority={(queue.find(q => q.id === selected.id)?.priority) || 'routine'} />
                  </div>
                  <div className="text-white/50 text-sm font-mono">{selected.request_number}</div>
                </div>
                {selected.ai_score !== null && (
                  <div className="text-center">
                    <AIScoreGauge score={selected.ai_score} />
                    <div className="text-white/40 text-[10px] mt-1">AI Approval Score</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Member Info */}
                <DetailCard title="Member Information" icon="👤">
                  <Row label="Name" value={selected.patient?.name} />
                  <Row label="DOB" value={selected.patient?.dob} />
                  <Row label="Member ID" value={selected.patient?.member_id} mono />
                  <Row label="Group ID" value={selected.patient?.group_id} mono />
                  <Row label="Plan" value={selected.patient?.plan_name} />
                </DetailCard>

                {/* Provider Info */}
                <DetailCard title="Requesting Provider" icon="🏥">
                  <Row label="Provider" value={selected.provider?.name} />
                  <Row label="NPI" value={selected.provider?.npi} mono />
                  <Row label="Specialty" value={selected.provider?.specialty} />
                  <Row label="Phone" value={selected.provider?.phone} />
                </DetailCard>

                {/* Service Info */}
                <DetailCard title="Service Requested" icon="💊">
                  <Row label="CPT Code" value={selected.service?.cpt_code} mono />
                  <Row label="Description" value={selected.service?.description} />
                  <Row label="ICD-10" value={selected.service?.icd10} mono />
                  <Row label="Diagnosis" value={selected.service?.diagnosis} />
                  <Row label="Units" value={String(selected.service?.units)} />
                  <Row label="Start Date" value={selected.service?.start_date} />
                </DetailCard>

                {/* Clinical Notes */}
                <DetailCard title="Clinical Information" icon="📋">
                  <Row label="Urgency" value={selected.clinical_info?.urgency || 'Routine'} />
                  <div className="mt-2">
                    <div className="text-white/40 text-[10px] uppercase mb-1">Clinical Notes</div>
                    <div className="text-white/70 text-xs leading-relaxed bg-white/5 rounded-lg p-2 max-h-24 overflow-y-auto">
                      {selected.clinical_info?.notes || 'No clinical notes provided.'}
                    </div>
                  </div>
                </DetailCard>
              </div>

              {/* Documents */}
              {selected.documents && selected.documents.length > 0 && (
                <DetailCard title="Supporting Documents" icon="📎">
                  <div className="grid grid-cols-2 gap-2">
                    {selected.documents.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="text-white/80 text-xs font-medium">{doc.name}</div>
                          <div className="text-white/30 text-[10px]">{doc.type} · {doc.uploaded_at}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailCard>
              )}

              {/* Intake Actions */}
              <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <span>✍️</span> Intake Decision
                </h3>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Add intake notes (optional)..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-violet-500 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('forward_clinical')}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? '...' : '→ Forward to Clinical'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('request_info')}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    ↩ Request Info
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction('deny')}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    ⊘ Deny
                  </motion.button>
                </div>
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

function AIScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';
  const circumference = 2 * Math.PI * 20;
  const progress = (score / 100) * circumference;
  return (
    <div className="relative w-14 h-14">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="24" cy="24" r="20" fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold text-xs">{score}%</span>
      </div>
    </div>
  );
}

function DetailCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/60 rounded-2xl border border-white/10 p-4">
      <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-white/40 text-xs">{label}</span>
      <span className={cn('text-white/80 text-xs text-right', mono && 'font-mono')}>{value || '—'}</span>
    </div>
  );
}

// Mock data
const MOCK_QUEUE: QueueItem[] = [
  { id: '1', request_number: 'PA-2026-001234', patient_name: 'Johnson, Sarah M.', member_id: 'BCB123456789', payer_name: 'Blue Cross Blue Shield', service_type: 'MRI Brain w/ Contrast', cpt_code: '70553', priority: 'urgent', submitted_at: '2026-03-27T08:00:00Z', days_pending: 2, ai_score: 78, status: 'intake_review' },
  { id: '2', request_number: 'PA-2026-001235', patient_name: 'Williams, Robert K.', member_id: 'AET987654321', payer_name: 'Aetna', service_type: 'Cardiac Cath', cpt_code: '93458', priority: 'stat', submitted_at: '2026-03-27T09:30:00Z', days_pending: 0, ai_score: 45, status: 'intake_review' },
  { id: '3', request_number: 'PA-2026-001236', patient_name: 'Martinez, Elena R.', member_id: 'UHC456789012', payer_name: 'UnitedHealthcare', service_type: 'Spinal Fusion Surgery', cpt_code: '22612', priority: 'routine', submitted_at: '2026-03-25T14:00:00Z', days_pending: 2, ai_score: 62, status: 'intake_review' },
  { id: '4', request_number: 'PA-2026-001237', patient_name: 'Thompson, James L.', member_id: 'CIG321654987', payer_name: 'Cigna', service_type: 'Knee Replacement', cpt_code: '27447', priority: 'routine', submitted_at: '2026-03-24T11:00:00Z', days_pending: 3, ai_score: 85, status: 'intake_review' },
  { id: '5', request_number: 'PA-2026-001238', patient_name: 'Anderson, Patricia W.', member_id: 'HUM789012345', payer_name: 'Humana', service_type: 'Chemotherapy Admin', cpt_code: '96413', priority: 'urgent', submitted_at: '2026-03-27T07:00:00Z', days_pending: 1, ai_score: 91, status: 'intake_review' },
];

function buildMockDetail(item: QueueItem): ReviewDetail {
  return {
    id: item.id,
    request_number: item.request_number,
    patient: { name: item.patient_name, dob: '1978-04-15', member_id: item.member_id, group_id: 'GRP-00123', plan_name: item.payer_name + ' PPO Plus' },
    provider: { name: 'Dr. Michael Chen, MD', npi: '1234567890', specialty: 'Internal Medicine', phone: '(555) 867-5309' },
    service: { cpt_code: item.cpt_code, description: item.service_type, icd10: 'M54.5', diagnosis: 'Low back pain with radiculopathy', units: 1, start_date: '2026-04-01' },
    clinical_info: { notes: 'Patient has tried conservative therapy for 6 months without improvement. Clinical necessity supported by imaging results showing significant stenosis.', urgency: item.priority === 'stat' ? 'Emergent' : item.priority === 'urgent' ? 'Urgent' : 'Routine' },
    documents: [],
    ai_score: item.ai_score,
    status: item.status,
    submitted_at: item.submitted_at,
  };
}
