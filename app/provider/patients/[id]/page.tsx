'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { patientApi } from '@/lib/api';
import { cn, formatDate, calcAge, getStatusColor, getStatusLabel } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import PAWorkflow from '@/components/provider/PAWorkflow';

const TABS = ['Summary', 'Chart Review', 'Orders', 'Notes', 'Flowsheets', 'Meds', 'Labs'];

export default function PatientChartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Summary');
  const [loading, setLoading] = useState(true);
  const [showPAWorkflow, setShowPAWorkflow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    patientApi.get(id).then(res => setPatient(res.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const currentUser = getStoredUser();

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!patient) return <div className="p-8 text-slate-500">Patient not found</div>;

  const age = calcAge(patient.date_of_birth);
  const primaryCoverage = patient.coverage?.find((c: any) => c.coverage_order === 1);
  const allergies = patient.allergies || [];

  return (
    <div className="flex flex-col h-full">
      {/* Patient Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span>{patient.mrn}</span>
              <span>·</span>
              <span>{age}yo {patient.gender === 'female' ? 'F' : 'M'}</span>
              <span>·</span>
              <span>DOB: {patient.date_of_birth}</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            {allergies.length > 0 && (
              <div>
                <span className="text-slate-500 font-semibold text-xs uppercase">Allergies</span>
                <div className="text-red-600 font-semibold">
                  {allergies.map((a: any) => `${a.allergen} (${a.reaction})`).join(', ')}
                </div>
              </div>
            )}
            <div>
              <span className="text-slate-500 font-semibold text-xs uppercase">LOC</span>
              <div className="text-slate-800 font-semibold">{patient.latest_vitals ? '302-A' : '—'}</div>
            </div>
            <div>
              <span className="text-slate-500 font-semibold text-xs uppercase">Code Status</span>
              <div className="text-slate-800 font-semibold">{patient.code_status}</div>
            </div>
            <div>
              <span className="text-slate-500 font-semibold text-xs uppercase">Attending</span>
              <div className="text-slate-800 font-semibold">{currentUser?.full_name || 'Dr. Smith'}</div>
            </div>
            <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 -mb-3.5">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all',
                activeTab === tab
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 border-transparent hover:text-slate-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50">
        {activeTab === 'Summary' && (
          <div className="grid grid-cols-2 gap-5">
            {/* Vitals */}
            {patient.latest_vitals && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <span className="text-indigo-500">〜</span> Vitals (Last Filed)
                </h3>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[
                    { label: 'BP', value: patient.latest_vitals.bp, unit: 'mmHg', warn: patient.latest_vitals.bp?.includes('/') && parseInt(patient.latest_vitals.bp) > 140 },
                    { label: 'PULSE', value: patient.latest_vitals.hr, unit: 'bpm' },
                    { label: 'TEMP', value: patient.latest_vitals.temp, unit: '°F' },
                    { label: 'RR', value: patient.latest_vitals.rr, unit: '' },
                    { label: 'SPO2', value: patient.latest_vitals.spo2, unit: '%' },
                  ].map((v) => (
                    <div key={v.label}>
                      <div className={cn('text-xl font-bold', v.warn ? 'text-red-500' : 'text-slate-800')}>{v.value || '—'}</div>
                      <div className="text-xs text-slate-400">{v.unit}</div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">{v.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Insurance */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span>🛡️</span> Insurance & Coverage
              </h3>
              {patient.coverage?.map((cov: any, i: number) => (
                <div key={i} className={cn('p-3 rounded-lg mb-2', cov.is_selected_for_pa ? 'border-2 border-green-500 bg-green-50' : 'border border-slate-100 bg-slate-50')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">{cov.payer_name}</div>
                      <div className="text-xs text-indigo-600">{cov.coverage_order === 1 ? 'Primary Coverage' : 'Secondary Coverage'}</div>
                    </div>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', cov.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                      {cov.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 grid grid-cols-2 gap-1">
                    <span>Plan: <strong className="text-slate-700">{cov.plan_name}</strong></span>
                    <span>Member ID: <strong className="text-slate-700">{cov.member_id}</strong></span>
                    <span>Copay: <strong className="text-slate-700">${cov.copay}</strong></span>
                  </div>
                  {cov.is_selected_for_pa && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <span>✓</span> Selected for PA requests
                    </div>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Recent Labs */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <span>🧪</span> Recent Labs (24h)
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase">
                    <th className="text-left pb-2">Test</th>
                    <th className="text-left pb-2">Value</th>
                    <th className="text-left pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(patient.recent_labs || []).map((lab: any, i: number) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-1.5 text-slate-600">{lab.test_name}</td>
                      <td className={cn('py-1.5 font-semibold', lab.is_abnormal ? 'text-red-500' : 'text-slate-800')}>
                        {lab.result_value} {lab.result_unit}
                        {lab.abnormal_flag && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1 rounded">{lab.abnormal_flag}</span>}
                      </td>
                      <td className="py-1.5 text-slate-400 text-xs">Today {new Date(lab.resulted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* Recent Notes */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2"><span>📋</span> Recent Notes</h3>
                <button className="text-xs text-indigo-600 font-semibold hover:underline">+ New Note</button>
              </div>
              {(patient.recent_notes || []).map((note: any, i: number) => (
                <div key={i} className="border-b border-slate-50 pb-3 mb-3 last:border-0 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-600 text-sm">{note.note_type}</span>
                    <span className="text-xs text-slate-400">{formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{note.excerpt}</p>
                </div>
              ))}
            </motion.div>

            {/* Active Problems */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Active Problems</h3>
                <button className="text-xs text-indigo-600 font-semibold hover:underline">+ Add</button>
              </div>
              {(patient.active_problems || []).map((p: any, i: number) => (
                <div key={i} className="py-1.5 text-sm text-slate-700">{p.problem_name}</div>
              ))}
            </motion.div>

            {/* Medications */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Active Medications</h3>
                <button className="text-xs text-indigo-600 font-semibold hover:underline">+ Reorder</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase">
                    <th className="text-left pb-2">Medication</th>
                    <th className="text-left pb-2">Dose</th>
                    <th className="text-left pb-2">Freq</th>
                  </tr>
                </thead>
                <tbody>
                  {(patient.medications || []).map((m: any, i: number) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="py-1.5 text-indigo-600 font-medium">{m.name}</td>
                      <td className="py-1.5 text-slate-700">{m.dose} {m.route}</td>
                      <td className="py-1.5 text-slate-500">{m.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div>
            {/* Payer banner */}
            {primaryCoverage && (
              <div className="flex items-center gap-3 p-3 mb-5 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-indigo-500">🛡️</span>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Selected Payer for PA Requests</div>
                  <div className="font-bold text-slate-800">{primaryCoverage.payer_code}</div>
                </div>
                <div className="ml-auto text-right text-xs text-slate-500">
                  <div>Plan: {primaryCoverage.plan_type}</div>
                  <div>Member ID: {primaryCoverage.member_id}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              {/* New Order Entry */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">New Order Entry</h3>
                <input placeholder="Search for new orders..." className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 mb-4" />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Favorites - Imaging</p>
                  {[
                    { name: 'MRI Brain w/o Contrast', cpt: '70551', icd10: 'G44.1' },
                    { name: 'CT Abdomen/Pelvis w/ Contrast', cpt: '74178', icd10: 'R10.9' },
                    { name: 'X-Ray Chest PA & Lat', cpt: '71046', icd10: 'J18.9' },
                  ].map(order => (
                    <button
                      key={order.name}
                      onClick={() => { setShowPAWorkflow(true); setSelectedOrder(order); }}
                      className="flex items-center gap-2 w-full py-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <span className="text-indigo-400">+</span> {order.name}
                    </button>
                  ))}
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Specialty Medications</p>
                  {[
                    { name: 'Remicade (Infliximab) 10mg/kg', cpt: 'J1745', icd10: 'M05.79' },
                    { name: 'Humira (Adalimumab) 40mg Pen', cpt: 'J0135', icd10: 'M05.79' },
                    { name: 'Keytruda (Pembrolizumab) 200mg', cpt: 'J9271', icd10: 'C34.10' },
                  ].map(order => (
                    <button
                      key={order.name}
                      onClick={() => { setShowPAWorkflow(true); setSelectedOrder(order); }}
                      className="flex items-center gap-2 w-full py-1.5 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <span className="text-indigo-400">+</span> {order.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Orders */}
              <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-700 mb-4">Active Orders</h3>
                <PatientOrders patientId={id} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Chart Review' && <ChartReviewTab patient={patient} />}
        {activeTab === 'Notes' && <NotesTab patient={patient} />}
        {activeTab === 'Flowsheets' && <FlowsheetsTab patient={patient} />}
        {activeTab === 'Meds' && <MedsTab patient={patient} />}
        {activeTab === 'Labs' && <LabsTab patient={patient} />}
      </div>

      {/* PA Workflow Modal */}
      <AnimatePresence>
        {showPAWorkflow && (
          <PAWorkflow
            patient={patient}
            order={selectedOrder}
            onClose={() => setShowPAWorkflow(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PatientOrders({ patientId }: { patientId: string }) {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    patientApi.getPaRequests(patientId).then(res => setOrders(res.data.requests || [])).catch(console.error);
  }, [patientId]);

  const statusLabel: Record<string, string> = {
    intake_review: 'Intake Review',
    clinical_review: 'Clinical Review',
    decision_pending: 'Decision Pending',
    approved: 'Approved',
    denied: 'Denied',
    action_required: 'Action Required',
    submitted: 'Submitted',
  };

  const statusColor: Record<string, string> = {
    intake_review: 'bg-cyan-100 text-cyan-700',
    clinical_review: 'bg-purple-100 text-purple-700',
    decision_pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-600',
    action_required: 'bg-orange-100 text-orange-600',
    submitted: 'bg-blue-100 text-blue-600',
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
        <span>Status</span><span className="col-span-2">Order Name</span><span>Date</span>
      </div>
      {orders.length === 0 && (
        <div className="text-slate-400 text-sm py-4 text-center">No active orders</div>
      )}
      {orders.map((o: any) => (
        <div key={o.id} className="grid grid-cols-4 gap-2 py-2 border-b border-slate-50 items-center">
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-md w-fit', statusColor[o.status] || 'bg-gray-100 text-gray-600')}>
            {statusLabel[o.status] || o.status}
          </span>
          <span className="col-span-2 text-sm text-slate-700">{o.cpt_description || o.cpt_code}</span>
          <span className="text-xs text-slate-400">{o.submitted_at ? new Date(o.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : formatDate(o.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Chart Review Tab ──────────────────────────────────────────────────────────
function ChartReviewTab({ patient }: { patient: any }) {
  const problems = patient.active_problems || [];
  const coverage = patient.coverage || [];
  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">Problem List</h3>
          <button className="text-xs text-indigo-600 font-semibold hover:underline">+ Add Problem</button>
        </div>
        {problems.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No problems recorded</p>
        ) : (
          <div className="space-y-2">
            {problems.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-700">{p.problem_name}</div>
                  {p.icd10_code && <div className="text-xs font-mono text-slate-400">{p.icd10_code}</div>}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold', p.status === 'active' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500')}>
                  {p.status || 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4">Insurance Coverage</h3>
        {coverage.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No coverage on file</p>
        ) : (
          <div className="space-y-3">
            {coverage.map((c: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700">{c.payer_name}</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', c.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500')}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">Member: {c.member_id} · Group: {c.group_number || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3">Allergies</h3>
        {(patient.allergies || []).length === 0 ? (
          <div className="text-sm text-green-600 font-semibold">✓ No Known Allergies</div>
        ) : (
          <div className="space-y-2">
            {patient.allergies.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                <span className="text-sm text-slate-700">{a.allergen}</span>
                <span className="text-xs text-red-500">→ {a.reaction}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-3">Demographics</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Date of Birth', patient.date_of_birth],
            ['Gender', patient.gender],
            ['Phone', patient.phone || '—'],
            ['Email', patient.email || '—'],
            ['Address', patient.address_line1 || '—'],
            ['City/State', patient.city ? `${patient.city}, ${patient.state} ${patient.zip}` : '—'],
          ].map(([label, val]) => (
            <div key={label as string}>
              <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
              <div className="text-slate-700 font-medium truncate">{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({ patient }: { patient: any }) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Progress Note');
  const notes = patient.recent_notes || [];
  return (
    <div className="grid grid-cols-5 gap-5">
      <div className="col-span-3">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">New Note</h3>
          <select value={noteType} onChange={e => setNoteType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 mb-3">
            {['Progress Note', 'H&P', 'Discharge Summary', 'Operative Note', 'Consult Note'].map(t => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
            placeholder="Begin typing your note here..." rows={8}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <div className="flex justify-end gap-2 mt-3">
            <button className="px-3 py-1.5 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Save Draft</button>
            <button className="px-4 py-1.5 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">Sign & Save</button>
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Recent Notes</h3>
          {notes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No notes recorded</p>
          ) : (
            <div className="space-y-3">
              {notes.map((n: any, i: number) => (
                <div key={i} className="border-b border-slate-50 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600">{n.note_type}</span>
                    <span className="text-xs text-slate-400">{formatDate(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.excerpt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Flowsheets Tab ────────────────────────────────────────────────────────────
function FlowsheetsTab({ patient }: { patient: any }) {
  const vitals = patient.latest_vitals;
  const rows = [
    { label: 'Blood Pressure', value: vitals?.bp, unit: 'mmHg', normal: '120/80', icon: '❤️' },
    { label: 'Heart Rate', value: vitals?.hr, unit: 'bpm', normal: '60–100', icon: '💓' },
    { label: 'Temperature', value: vitals?.temp, unit: '°F', normal: '98.6', icon: '🌡️' },
    { label: 'Respiratory Rate', value: vitals?.rr, unit: '/min', normal: '12–20', icon: '🫁' },
    { label: 'SpO2', value: vitals?.spo2, unit: '%', normal: '>95', icon: '🩸' },
    { label: 'Weight', value: vitals?.weight, unit: 'kg', normal: '—', icon: '⚖️' },
    { label: 'BMI', value: vitals?.bmi, unit: '', normal: '18.5–24.9', icon: '📊' },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700">Vital Signs Flowsheet</h3>
        <span className="text-xs text-slate-400">Most recent values</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {['Vital', 'Latest Value', 'Normal Range', 'Status'].map(h => (
              <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((v, i) => (
            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 text-sm text-slate-700 font-medium"><span className="mr-2">{v.icon}</span>{v.label}</td>
              <td className="px-5 py-3">
                {v.value != null ? (
                  <span className="font-semibold text-slate-800">{v.value} <span className="text-xs text-slate-400 font-normal">{v.unit}</span></span>
                ) : <span className="text-slate-300">—</span>}
              </td>
              <td className="px-5 py-3 text-xs text-slate-400">{v.normal}</td>
              <td className="px-5 py-3">
                {v.value != null
                  ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-600">Normal</span>
                  : <span className="text-xs text-slate-300">Not recorded</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Meds Tab ──────────────────────────────────────────────────────────────────
function MedsTab({ patient }: { patient: any }) {
  const meds = patient.medications || [];
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700">Active Medications</h3>
        <button className="px-3 py-1.5 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">+ Order Medication</button>
      </div>
      {meds.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><div className="text-4xl mb-3">💊</div><p>No active medications on file</p></div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Medication', 'Dose', 'Route', 'Frequency', 'Status'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meds.map((m: any, i: number) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-semibold text-indigo-600 text-sm">{m.name}</div>
                  {m.rxnorm_code && <div className="text-xs text-slate-400 font-mono">RxNorm: {m.rxnorm_code}</div>}
                </td>
                <td className="px-5 py-3 text-sm text-slate-700">{m.dose || '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{m.route || '—'}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{m.frequency || m.dosage || '—'}</td>
                <td className="px-5 py-3">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    m.status === 'active' || !m.status ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500')}>
                    {m.status || 'Active'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Labs Tab ──────────────────────────────────────────────────────────────────
function LabsTab({ patient }: { patient: any }) {
  const labs = patient.recent_labs || [];
  const [filter, setFilter] = useState<'all' | 'abnormal'>('all');
  const displayed = filter === 'abnormal' ? labs.filter((l: any) => l.is_abnormal) : labs;
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-700">Laboratory Results</h3>
        <div className="flex gap-2">
          {(['all', 'abnormal'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1 text-xs rounded-lg font-semibold transition-all capitalize',
                filter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100')}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><div className="text-4xl mb-3">🧪</div><p>{filter === 'abnormal' ? 'No abnormal results' : 'No lab results on file'}</p></div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Test Name', 'Result', 'Reference Range', 'Flag', 'Date'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((lab: any, i: number) => (
              <tr key={i} className={cn('border-b border-slate-50 hover:bg-slate-50 transition-colors', lab.is_abnormal && 'bg-red-50/30')}>
                <td className="px-5 py-3 text-sm text-slate-700 font-medium">{lab.test_name}</td>
                <td className="px-5 py-3">
                  <span className={cn('font-bold text-sm', lab.is_abnormal ? 'text-red-600' : 'text-slate-800')}>
                    {lab.result_value} <span className="text-xs font-normal text-slate-400">{lab.result_unit}</span>
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">{lab.reference_range || '—'}</td>
                <td className="px-5 py-3">
                  {lab.abnormal_flag
                    ? <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', ['H','HH'].includes(lab.abnormal_flag) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600')}>{lab.abnormal_flag}</span>
                    : <span className="text-xs text-green-500 font-semibold">Normal</span>}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">{formatDate(lab.resulted_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
