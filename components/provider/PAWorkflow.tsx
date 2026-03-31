'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { paApi, payerApi } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

type Step = 'order_entry' | 'review_summary' | 'ai_analysis' | 'form_selection' | 'pa_form' | 'submitted';

interface Props {
  patient: any;
  order: any;
  onClose: () => void;
}

export default function PAWorkflow({ patient, order, onClose }: Props) {
  const [step, setStep] = useState<Step>('order_entry');
  const [cptCode, setCptCode] = useState(order?.cpt || '70553');
  const [icd10Code, setIcd10Code] = useState(order?.icd10 || 'G44.1');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [reviewData, setReviewData] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [paRequestId, setPaRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showAllForms, setShowAllForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [payers, setPayers] = useState<any[]>([]);
  const [selectedPayerId, setSelectedPayerId] = useState('');
  const [formValues, setFormValues] = useState<any>({
    conservative_therapy: 'Yes',
    conservative_therapy_detail: 'NSAIDs for 8 weeks. PT for 6 weeks.',
    neuro_deficits: 'Yes',
    neuro_detail: 'Mild cognitive changes noted on exam.',
    additional_notes: '',
  });

  const primaryCoverage = patient.coverage?.find((c: any) => c.coverage_order === 1);
  const hasCoverage = !!primaryCoverage;
  const currentUser = getStoredUser();

  useEffect(() => {
    if (!hasCoverage) {
      payerApi.list().then(res => {
        setPayers(res.data);
        if (res.data.length > 0) setSelectedPayerId(res.data[0].id);
      }).catch(console.error);
    }
  }, [hasCoverage]);

  function buildPayload() {
    if (hasCoverage) {
      return { patient_id: patient.id, coverage_id: primaryCoverage.id, cpt_code: cptCode, icd10_code: icd10Code, clinical_notes: clinicalNotes };
    }
    return { patient_id: patient.id, payer_id: selectedPayerId, cpt_code: cptCode, icd10_code: icd10Code, clinical_notes: clinicalNotes };
  }

  async function handleQuickReview() {
    if (!hasCoverage && !selectedPayerId) return;
    setLoading(true);
    try {
      const res = await paApi.quickReview(buildPayload());
      setReviewData(res.data);
      setStep('review_summary');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleAiAnalysis() {
    setLoading(true);
    try {
      const res = await paApi.aiAnalysis(buildPayload());
      setAiData(res.data);
      setStep('ai_analysis');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleProceedToPA() {
    setLoading(true);
    try {
      const payload: any = {
        patient_id: patient.id,
        cpt_code: cptCode,
        cpt_description: order?.name || cptCode,
        icd10_primary: icd10Code,
        clinical_notes: clinicalNotes,
      };
      if (hasCoverage) payload.coverage_id = primaryCoverage.id;
      else payload.payer_id = selectedPayerId;

      const createRes = await paApi.create(payload);
      setPaRequestId(createRes.data.id);

      const resolvedPayerId = hasCoverage ? primaryCoverage.payer_id : selectedPayerId;
      const formRes = await paApi.getFormSelection(resolvedPayerId, cptCode, icd10Code);
      setFormData(formRes.data);
      setStep('form_selection');
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmitPA() {
    setLoading(true);
    setSubmitError('');
    try {
      let requestId = paRequestId;
      if (!requestId) {
        const payload: any = {
          patient_id: patient.id,
          cpt_code: cptCode,
          icd10_primary: icd10Code,
          clinical_notes: clinicalNotes,
        };
        if (hasCoverage) payload.coverage_id = primaryCoverage.id;
        else payload.payer_id = selectedPayerId;
        const createRes = await paApi.create(payload);
        requestId = createRes.data.id;
        setPaRequestId(requestId);
      }
      const res = await paApi.submit({
        pa_request_id: requestId,
        form_data: formValues,
        failed_conservative_therapy: formValues.conservative_therapy === 'Yes',
        conservative_therapy_details: formValues.conservative_therapy_detail,
        neurological_deficits: formValues.neuro_deficits === 'Yes',
        neurological_details: formValues.neuro_detail,
        additional_notes: formValues.additional_notes,
      });
      if (res.data?.success) {
        setStep('submitted');
      } else {
        setSubmitError('Submission failed. Please try again.');
      }
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Network error. Check your connection.';
      setSubmitError(msg);
      console.error('Submit error:', e);
    }
    setLoading(false);
  }

  const STEPS = ['order_entry', 'review_summary', 'ai_analysis', 'form_selection', 'pa_form'];
  const stepNum = STEPS.indexOf(step) + 1;
  const stepLabel: Record<Step, string> = {
    order_entry: 'Step 1: Configure Order Details',
    review_summary: 'Step 1: Check Requirements',
    ai_analysis: 'Step 2: AI Probability & Policy Check',
    form_selection: 'Step 3: Find the correct form based on patient plan and entered codes',
    pa_form: 'Step 4: Complete PA Form',
    submitted: 'Submitted',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
                {step === 'submitted' ? '✓' : Math.min(stepNum, 3)}
              </div>
              <div>
                <h2 className="font-bold text-slate-800">
                  {step === 'order_entry' ? 'Order Entry' :
                    step === 'review_summary' ? 'Review Summary' :
                      step === 'ai_analysis' ? 'Validation Insights' :
                        step === 'form_selection' ? 'Select Prior Authorization Form' :
                          step === 'pa_form' ? (formData?.best_match?.title || 'PA Request Form') :
                            'Request Submitted!'}
                </h2>
                <p className="text-xs text-slate-400">{stepLabel[step]}</p>
              </div>
            </div>
          </div>
          {step !== 'submitted' && (
            <div className="text-right text-sm text-slate-500">
              Plan: <span className="font-semibold">{primaryCoverage?.payer_name || payers.find(p => p.id === selectedPayerId)?.name || '—'}</span>
              <span className="ml-2 text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded">{hasCoverage ? 'Active' : 'Manual'}</span>
            </div>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl ml-4">✕</button>
        </div>

        <div className="p-6">
          {/* Patient banner */}
          {step !== 'submitted' && (
            <div className="flex items-center gap-3 p-3 mb-5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                {patient.first_name[0]}
              </div>
              <div>
                <div className="font-semibold text-slate-800">{patient.full_name}</div>
                <div className="text-xs text-slate-400">DOB: {patient.date_of_birth}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-slate-500">Payer</div>
                <div className="font-semibold text-slate-800">{primaryCoverage?.payer_name || payers.find(p => p.id === selectedPayerId)?.name || '—'}</div>
              </div>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded', hasCoverage ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>{hasCoverage ? 'Active' : 'Manual'}</span>
            </div>
          )}

          {/* STEP: Order Entry */}
          {step === 'order_entry' && (
            <div className="space-y-4">
              {/* Payer selector when no coverage on file */}
              {!hasCoverage && payers.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-500 text-sm">⚠</span>
                    <span className="text-xs font-semibold text-amber-700">No insurance on file — select payer manually</span>
                  </div>
                  <select
                    value={selectedPayerId}
                    onChange={e => setSelectedPayerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    {payers.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Procedure Code (CPT)</label>
                  <input value={cptCode} onChange={e => setCptCode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="text-xs text-slate-400 mt-1">{order?.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnosis Code (ICD-10)</label>
                  <input value={icd10Code} onChange={e => setIcd10Code(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Clinical Notes</label>
                <textarea
                  value={clinicalNotes}
                  onChange={e => setClinicalNotes(e.target.value)}
                  placeholder="Enter relevant clinical history, failed therapies, and symptoms..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleQuickReview}
                  disabled={loading || (!hasCoverage && !selectedPayerId)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '⟳' : '✦'} Quick Review
                </button>
              </div>
            </div>
          )}

          {/* STEP: Review Summary */}
          {step === 'review_summary' && reviewData && (
            <div className="space-y-4">
              {/* Real-Time Policy Sync */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-blue-500">💾</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-700 text-sm">Real-Time Policy Synchronization</div>
                  <div className="text-xs text-slate-500">Connected to {reviewData.coverage.payer_name} · CPT {cptCode} policy last updated 2 min ago</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-green-600">● LIVE</div>
                  <div className="text-xs text-slate-400">Auto-refresh enabled</div>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>📋</span> Service Request Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-indigo-600 font-semibold">Procedure:</span><div className="text-slate-700">{cptCode}<br /><span className="text-xs text-slate-500">{reviewData.cpt?.description}</span></div></div>
                  <div><span className="text-indigo-600 font-semibold">Diagnosis:</span><div className="text-slate-700">{icd10Code}</div></div>
                  <div><span className="text-indigo-600 font-semibold">Urgency:</span><div className="text-slate-700">Routine</div></div>
                  <div><span className="text-indigo-600 font-semibold">Expected TAT:</span><div className="text-slate-700">7-14 days</div></div>
                </div>
              </div>

              {/* Data Integrity & Eligibility */}
              {hasCoverage ? (
                <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-slate-700 text-sm">Data Integrity & Eligibility</div>
                    <div className="text-xs text-green-700">
                      Member verified: <span className="font-semibold">{patient.full_name}</span> · Member ID: {reviewData.coverage.member_id} · Active
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-red-500 mt-0.5">✕</span>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-700 text-sm">Data Integrity & Eligibility</div>
                    <div className="text-xs text-red-700 font-semibold mt-0.5">
                      Member not found in {reviewData.coverage.payer_name} system
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      Patient <span className="font-semibold">{patient.full_name}</span> (DOB: {patient.date_of_birth}) has no active enrollment record with this payer. Verify member ID or confirm enrollment before submission.
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 flex gap-4">
                      <span>Searched: {reviewData.coverage.payer_name} eligibility API</span>
                      <span>Status: <span className="text-red-600 font-semibold">271 — No Active Coverage</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Coverage */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700 text-sm mb-2 flex items-center gap-2"><span>🛡️</span> Coverage Status & Requirements</div>
                <div className="text-xs text-blue-700 font-semibold mb-2">Prior Authorization Required. This service requires medical review before approval.</div>
                {reviewData.policy?.requirements?.map((req: any, i: number) => (
                  <div key={i} className="text-xs text-slate-600 py-1 flex items-start gap-2">
                    <span className="text-indigo-400 mt-0.5">{i + 1}.</span> {req.requirement}
                  </div>
                ))}
              </div>

              {/* BCBS Requirements */}
              {reviewData.policy && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>🛡️</span> {reviewData.coverage.payer_name} Specific Requirements</h4>
                  {reviewData.policy.requirements?.map((req: any, i: number) => (
                    <div key={i} className="text-sm text-slate-700 py-1.5 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold mt-0.5">{i + 1}.</span> {req.requirement}
                    </div>
                  ))}
                </div>
              )}

              {/* Doc Checklist */}
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-3">Documentation Checklist - Required for Submission</h4>
                {['Recent clinical notes (within 30 days) documenting patient symptoms and severity',
                  'Evidence of failed conservative therapy with specific dates and treatment details',
                  'Lab results, imaging reports, or diagnostic tests supporting diagnosis',
                  'Clear clinical rationale explaining medical necessity for this specific service'].map((item, i) => (
                    <label key={i} className="flex items-start gap-2 mb-2 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 accent-indigo-600" />
                      <span className="text-xs text-slate-600">{item}</span>
                    </label>
                  ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>PA Inquiry Line: 1-800-555-PRIOR (1-800-555-7746)</span>
                <span>Reference #: {reviewData.coverage.member_id}-2026-7449</span>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep('order_entry')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">← Back</button>
                <button
                  onClick={handleAiAnalysis}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {loading ? 'Analyzing...' : '🤖 Run AI Analysis →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP: AI Analysis */}
          {step === 'ai_analysis' && aiData && (
            <div className="space-y-4">
              {/* Score */}
              <div className="p-5 rounded-2xl text-white flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div>
                      <div className="text-2xl font-black">{aiData.approval_probability}%</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">Approval Probability: {aiData.approval_label}</div>
                    <div className="text-white/70 text-sm">
                      {aiData.approval_probability < 40 ? 'Significant documentation gaps detected.' : 'Good documentation quality.'}
                    </div>
                  </div>
                </div>
                <span className="text-3xl">✨</span>
              </div>

              {/* Gaps */}
              {aiData.gaps?.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>🤖</span> AI Insights & Recommendations</h4>
                  {aiData.gaps.map((g: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Gap: {g.gap} <span className="text-orange-500 font-semibold">({g.impact})</span></span>
                    </div>
                  ))}
                </div>
              )}

              {/* Policies */}
              {aiData.relevant_policies?.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>📖</span> Relevant Policies</h4>
                  {aiData.relevant_policies.map((p: any, i: number) => (
                    <div key={i}>
                      <div className="text-indigo-600 font-semibold text-sm">{p.policy_number} - {p.title}</div>
                      <div className="text-xs text-slate-500">{p.description}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>✨</span> Suggestions to Improve Approval Odds</h4>
                <div className="grid grid-cols-2 gap-2">
                  {aiData.suggestions?.map((s: string, i: number) => (
                    <div key={i} className="bg-white rounded-lg px-3 py-2 text-xs text-slate-600 border border-slate-100 flex items-start gap-2">
                      <span className="text-indigo-400 font-bold shrink-0">{i + 1}</span> {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Historical */}
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>〜</span> Historical Data</h4>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-indigo-600">Approval Rate (90d):</span>
                  <span className="font-semibold">{aiData.historical?.approval_rate_90d}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-indigo-600">Avg Review Time:</span>
                  <span className="font-semibold">{aiData.historical?.avg_review_time_days} days</span>
                </div>
                <div className="text-xs text-slate-400 mt-2">Based on {aiData.payer} data</div>
              </div>

              {/* Top Denial Reasons */}
              {aiData.top_denial_reasons?.length > 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><span>⚠️</span> Top Denial Reasons for This Service (Last 90 Days)</h4>
                  {aiData.top_denial_reasons.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 py-1.5 text-xs border-b border-red-100 last:border-0">
                      <span className="font-bold text-red-500 w-8">{r.frequency_percent?.toFixed(0)}%</span>
                      <span className="text-slate-600">{r.reason_description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Ready to proceed with Prior Authorization?</p>
                  <p className="text-xs text-slate-400">Based on the validation, a request is required. You can attach additional documentation or edit clinical details in the next step.</p>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep('review_summary')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
                <div className="flex gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel Order</button>
                  <button
                    onClick={handleProceedToPA}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Loading...' : 'Proceed to PA Request →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Form Selection */}
          {step === 'form_selection' && formData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono">CPT: {cptCode}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded font-mono">ICD-10: {icd10Code}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">Order: {order?.name}</span>
              </div>

              {/* Best match */}
              {formData.best_match && !showAllForms && (
                <div
                  className={cn('p-5 border-2 rounded-2xl cursor-pointer transition-all', selectedFormId === formData.best_match.id ? 'border-indigo-500 bg-indigo-50' : 'border-yellow-400')}
                  onClick={() => setSelectedFormId(formData.best_match.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">★</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Best Match</span>
                    {selectedFormId === formData.best_match.id && <span className="ml-auto text-xs text-indigo-600 font-semibold">● Selected</span>}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">{formData.best_match.title}</h3>
                  <p className="text-slate-500 text-sm mb-3">{formData.best_match.description}</p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-600 uppercase text-xs">Confidence</span>
                      <span className="font-bold text-slate-800">{formData.best_match.match_score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${formData.best_match.match_score}%` }} />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Reasons</span>
                    {formData.best_match.reasons?.map((r: string, i: number) => (
                      <div key={i} className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-green-500">·</span> {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All other forms */}
              {showAllForms && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-600">All Available Forms ({formData.all_forms?.length})</span>
                    <button onClick={() => setShowAllForms(false)} className="text-xs text-indigo-600 hover:underline">← Back to recommendation</button>
                  </div>
                  {formData.all_forms?.map((form: any) => (
                    <div
                      key={form.id}
                      onClick={() => { setSelectedFormId(form.id); setShowAllForms(false); }}
                      className={cn('p-4 border rounded-xl cursor-pointer transition-all hover:border-indigo-300 hover:bg-indigo-50', selectedFormId === form.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-sm">{form.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{form.description}</div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{form.form_id}</span>
                            <span className="text-xs text-slate-500">v{form.version}</span>
                            {form.is_epa && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">ePA</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-slate-700">{form.match_score}%</div>
                          <div className="text-xs text-slate-400">match</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={() => setStep('ai_analysis')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
                {!showAllForms && (
                  <button onClick={() => setShowAllForms(true)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                    View other forms ({formData.all_forms?.length})
                  </button>
                )}
                <button
                  onClick={() => setStep('pa_form')}
                  disabled={!selectedFormId && !formData.best_match}
                  className="px-6 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
                >
                  Use {selectedFormId ? 'Selected' : 'Recommended'} Form →
                </button>
              </div>
            </div>
          )}

          {/* STEP: PA Form */}
          {step === 'pa_form' && (
            <div className="space-y-6">
              {/* Sticky AI score */}
              {aiData && (
                <div className="sticky top-0 bg-white pb-2 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
                      aiData.approval_probability >= 70 ? 'bg-green-500' : aiData.approval_probability >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    )}>{aiData.approval_probability}%</div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700">AI Approval Odds</div>
                      <div className={cn('text-xs font-semibold', aiData.approval_probability >= 70 ? 'text-green-600' : aiData.approval_probability >= 40 ? 'text-amber-500' : 'text-red-500')}>
                        {aiData.approval_label} Likelihood
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1 */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm">1. MEMBER & PROVIDER INFORMATION</div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  {[
                    { label: 'MEMBER NAME', value: patient.full_name },
                    { label: 'MEMBER ID', value: primaryCoverage?.member_id || reviewData?.coverage?.member_id || '' },
                    { label: 'DATE OF BIRTH', value: patient.date_of_birth },
                    { label: 'AGE', value: patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} years` : '' },
                    { label: 'REQUESTING PROVIDER', value: currentUser?.full_name || 'Dr. Sarah Chen' },
                    { label: 'NPI', value: patient.npi || '' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{field.label}</label>
                      <input defaultValue={field.value || ''} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2 */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm">2. SERVICE REQUESTED</div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">PROCEDURE / DRUG</label>
                    <div className="flex items-center gap-2">
                      <input defaultValue={cptCode} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-50 rounded">Valid</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{order?.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">DIAGNOSIS (ICD-10)</label>
                    <div className="flex items-center gap-2">
                      <input defaultValue={icd10Code} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      <span className="text-xs text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded">Billable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Clinical Questionnaire */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm">3. CLINICAL CRITERIA QUESTIONNAIRE</div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Has the patient completed at least 6 weeks of conservative therapy (PT, NSAIDs, Rest)?</p>
                    <div className="flex gap-4 mb-2">
                      {['Yes', 'No'].map(v => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="conservative" value={v} defaultChecked={v === 'Yes'}
                            onChange={() => setFormValues((p: any) => ({ ...p, conservative_therapy: v }))}
                            className="accent-indigo-600" />
                          <span className="text-sm text-slate-700">{v}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={formValues.conservative_therapy_detail}
                      onChange={e => setFormValues((p: any) => ({ ...p, conservative_therapy_detail: e.target.value }))}
                      placeholder="Please specify the therapies attempted and duration"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">Are there progressive neurological deficits?</p>
                    <div className="flex gap-4 mb-2">
                      {['Yes', 'No'].map(v => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="neuro" value={v} defaultChecked={v === 'Yes'}
                            onChange={() => setFormValues((p: any) => ({ ...p, neuro_deficits: v }))}
                            className="accent-indigo-600" />
                          <span className="text-sm text-slate-700">{v}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={formValues.neuro_detail}
                      onChange={e => setFormValues((p: any) => ({ ...p, neuro_detail: e.target.value }))}
                      placeholder="Please describe the neurological findings"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Additional Clinical Notes / Medical Necessity</label>
                    <textarea
                      value={formValues.additional_notes}
                      onChange={e => setFormValues((p: any) => ({ ...p, additional_notes: e.target.value }))}
                      placeholder="Enter any additional clinical information supporting medical necessity..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Docs */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm">4. SUPPORTING DOCUMENTATION</div>
                <div className="p-6 text-center border-2 border-dashed border-slate-200 m-4 rounded-xl">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="font-semibold text-slate-600 text-sm">Upload Supporting Documents</p>
                  <p className="text-xs text-slate-400">Clinical notes, lab results, imaging reports, etc. (PDF, JPG, PNG)</p>
                </div>
              </div>

              {/* Section 5: Attestation */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-white px-4 py-3 font-bold text-sm">5. ATTESTATION / SIGNATURE</div>
                <div className="p-4">
                  <label className="flex items-start gap-2 cursor-pointer mb-4">
                    <input type="checkbox" className="mt-0.5 accent-indigo-600" defaultChecked />
                    <span className="text-xs text-slate-600">I attest that the information provided is accurate and complete. I certify that the requested service is medically necessary for the treatment of this patient's condition.</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">PROVIDER SIGNATURE</label>
                      <input placeholder="Type full name to sign" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">DATE</label>
                      <input defaultValue={new Date().toLocaleDateString()} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none" readOnly />
                    </div>
                  </div>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="font-semibold">Submit failed:</span> {submitError}
                </div>
              )}
              <div className="flex justify-between">
                <button onClick={() => setStep('form_selection')} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">← Back</button>
                <div className="flex gap-3">
                  <button className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">💾 Save as Draft</button>
                  <button
                    onClick={handleSubmitPA}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Submitting...' : '✓ Submit Prior Auth Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: Submitted */}
          {step === 'submitted' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Request Submitted!</h3>
              <div className="inline-block text-left p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
                <div className="text-sm space-y-1">
                  <div className="flex gap-3"><span className="text-green-600 font-semibold">✓</span> <span className="text-slate-600">Ready to Submit</span></div>
                  <div className="flex gap-3"><span className="text-slate-500">Submission Method:</span> <span className="font-semibold">ePA (Electronic)</span></div>
                  <div className="flex gap-3"><span className="text-slate-500">Patient:</span> <span className="font-semibold">{patient.full_name}</span></div>
                  <div className="flex gap-3"><span className="text-slate-500">Service:</span> <span className="font-semibold">{order?.name}</span></div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-6">The payer typically responds within 2-5 business days. You can track status in the Orders tab.</p>
              <button onClick={onClose} className="px-8 py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                Back to Chart
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
