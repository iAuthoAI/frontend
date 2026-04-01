'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api';
import { storeAuth } from '@/lib/auth';

type Portal = 'provider' | 'payer_intake' | 'payer_clinical' | 'payer_decision';

const PORTAL_OPTIONS = [
  { id: 'provider', label: 'Provider', sub: 'OneClick EMR', icon: '🏥', color: '#1e40af' },
  { id: 'payer_intake', label: 'Intake Review', sub: 'OneClick Payer Portal', icon: '📋', color: '#4f46e5' },
  { id: 'payer_clinical', label: 'Clinical Review', sub: 'OneClick Payer Portal', icon: '🩺', color: '#7c3aed' },
  { id: 'payer_decision', label: 'Decision Review', sub: 'OneClick Payer Portal', icon: '⚖️', color: '#a21caf' },
];

const DEMO_CREDS: Record<string, { email: string; pw: string }> = {
  provider: { email: 'dr.chen@metro.com', pw: 'OneClick@2026!' },
  payer_intake: { email: 'intake@bcbs.com', pw: 'OneClick@2026!' },
  payer_clinical: { email: 'clinical@bcbs.com', pw: 'OneClick@2026!' },
  payer_decision: { email: 'decision@bcbs.com', pw: 'OneClick@2026!' },
};

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portal, setPortal] = useState<Portal>('provider');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = searchParams.get('portal');
    if (p === 'payer') setPortal('payer_intake');
    else if (p === 'provider') setPortal('provider');
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      const data = res.data;
      storeAuth(data.access_token, {
        user_id: data.user_id,
        email: data.email,
        role: data.role,
        full_name: data.full_name,
        org_id: data.org_id,
      });
      if (data.role === 'provider') router.push('/provider');
      else if (data.role === 'payer_intake') router.push('/payer/intake');
      else if (data.role === 'payer_clinical') router.push('/payer/clinical');
      else if (data.role === 'payer_decision') router.push('/payer/decision');
      else router.push('/provider');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(p: Portal) {
    const creds = DEMO_CREDS[p];
    if (creds) { setEmail(creds.email); setPassword(creds.pw); }
    setPortal(p);
  }

  const isPayerPortal = portal !== 'provider';

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      {/* Left: branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-16">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-3xl mb-6"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
            1
          </div>
          <h1 className="text-4xl font-black text-white mb-3">OneClick</h1>
          <p className="text-white/40 text-sm mb-8">AI-Powered Prior Authorization Platform</p>
          <p className="text-white/60 text-lg leading-relaxed">
            The AI-native platform transforming prior authorization for hospitals and health plans nationwide.
          </p>
          <div className="mt-10 space-y-3">
            {['98.2% AI accuracy rate', 'HIPAA-compliant & SOC 2', 'FHIR R4 native integration', 'Real-time payer policy sync'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-white/60 text-sm">
                <span className="text-green-400">✓</span> {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Portal tabs */}
          <div className="rounded-2xl p-1.5 mb-8 flex gap-1"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => fillDemo('provider')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${portal === 'provider' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Provider
            </button>
            <button
              onClick={() => fillDemo('payer_intake')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${isPayerPortal ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Payer
            </button>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>

            {/* Portal selector (payer sub-roles) */}
            {isPayerPortal && (
              <div className="mb-6">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Select Portal Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['payer_intake', 'payer_clinical', 'payer_decision'] as Portal[]).map((p) => {
                    const opt = PORTAL_OPTIONS.find(o => o.id === p)!;
                    return (
                      <button
                        key={p}
                        onClick={() => fillDemo(p)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${portal === p ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white/80'}`}
                        style={portal === p ? { background: opt.color } : { background: 'rgba(255,255,255,0.05)' }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logo */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3"
                style={{ background: isPayerPortal ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                {portal === 'provider' ? '🏥' : '🛡️'}
              </div>
              <h2 className="text-xl font-bold text-white">
                {portal === 'provider' ? 'OneClick Provider' : 'OneClick Payer Portal'}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {portal === 'provider' ? 'Metro Medical Center' : 'Secure Payer Gateway'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">
                  {portal === 'provider' ? 'User ID / Email' : 'Work Email'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={portal === 'provider' ? 'Enter your ID' : 'agent@payer.com'}
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                />
              </div>

              {error && (
                <div className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                style={{ background: isPayerPortal ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-white/25 text-xs mt-5">Secured Access Only · HIPAA Compliant</p>

            {/* Demo hint */}
            <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-white/40 text-xs">Click Provider/Payer to auto-fill demo credentials</p>
              <p className="text-white/30 text-xs mt-1">Password: <span className="text-white/50 font-mono">OneClick@2026!</span></p>
            </div>
          </div>

          <p className="text-center text-white/20 text-xs mt-6">
            © 2026 OneClick. All rights reserved. HIPAA Compliant · SOC 2 Certified.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
