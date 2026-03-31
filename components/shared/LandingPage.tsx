'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STATS = [
  { value: '98.2%', label: 'AI Accuracy' },
  { value: '< 45min', label: 'Avg Turnaround' },
  { value: '42%', label: 'Auto-Approvals' },
  { value: '10,000+', label: 'PA/month' },
];

const FEATURES = [
  { icon: '⚡', title: 'Real-Time AI Scoring', desc: 'Instant approval probability powered by Claude AI — before you submit.' },
  { icon: '🔗', title: 'FHIR-Native EMR Integration', desc: 'Connect to Epic, SMART Health IT, DrChrono, and more with one click.' },
  { icon: '🛡️', title: 'HIPAA-Compliant Audit Trail', desc: 'Every action logged, encrypted, and auditable. Zero compliance gaps.' },
  { icon: '📊', title: 'Payer Intelligence Engine', desc: 'Know denial reasons before they happen. 90-day trend analysis per payer.' },
  { icon: '🤖', title: 'AI Auto-Processing', desc: 'High-confidence requests approved automatically — freeing your team.' },
  { icon: '📋', title: 'Smart Form Matching', desc: 'AI selects the right PA form with 90%+ confidence. CPT + ICD-10 matched.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [crystalPhase, setCrystalPhase] = useState(0);

  useEffect(() => {
    // Crystal opening sequence
    const t1 = setTimeout(() => setCrystalPhase(1), 300);
    const t2 = setTimeout(() => setCrystalPhase(2), 1200);
    const t3 = setTimeout(() => setLoaded(true), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Crystal Opening Animation */}
      <AnimatePresence>
        {crystalPhase < 2 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63)' }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {/* Crystal Glass Box */}
            <motion.div
              initial={{ scale: 0, rotateY: -180, opacity: 0 }}
              animate={crystalPhase >= 1 ? { scale: 1, rotateY: 0, opacity: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
              style={{ perspective: 1000 }}
            >
              {/* Outer glow rings */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-3xl"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={crystalPhase >= 1 ? { scale: 1 + i * 0.3, opacity: 0.15 / i } : {}}
                  transition={{ delay: 0.3 + i * 0.1, duration: 1.2 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(167,139,250,0.5))',
                    filter: 'blur(8px)',
                    borderRadius: 24 + i * 8,
                  }}
                />
              ))}

              {/* Main crystal */}
              <motion.div
                className="relative w-48 h-48 rounded-3xl flex flex-col items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 0 80px rgba(99,102,241,0.6), inset 0 0 30px rgba(255,255,255,0.1)',
                }}
                animate={crystalPhase >= 1 ? { rotate: [0, 3, -3, 0] } : {}}
                transition={{ delay: 0.8, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {/* Facets */}
                <div className="absolute top-3 left-3 w-8 h-8 rounded-full opacity-40"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)' }} />
                <div className="absolute bottom-6 right-4 w-5 h-5 rounded-full opacity-25"
                  style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.6), transparent)' }} />

                <motion.div
                  className="text-5xl font-black text-white"
                  style={{ textShadow: '0 0 30px rgba(167,139,250,0.8)' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ delay: 0.9, duration: 1.5, repeat: Infinity }}
                >
                  1
                </motion.div>
                <div className="text-white/80 text-sm font-semibold tracking-widest mt-1">ONECLICK</div>
              </motion.div>
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="absolute bottom-24 text-center"
              initial={{ opacity: 0 }}
              animate={crystalPhase >= 1 ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
            >
              <p className="text-white/60 text-sm tracking-widest uppercase">Initializing OneClick by Interon</p>
              <div className="mt-3 w-48 h-0.5 mx-auto rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <motion.div
                  className="h-full rounded"
                  style={{ background: 'linear-gradient(90deg, #6366f1, #a78bfa)' }}
                  initial={{ width: '0%' }}
                  animate={crystalPhase >= 1 ? { width: '100%' } : {}}
                  transition={{ duration: 1.4, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <AnimatePresence>
        {loaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* NAV */}
            <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between"
              style={{ background: 'rgba(15,12,41,0.6)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-lg"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>1</div>
                <span className="text-white font-bold text-lg tracking-tight">OneClick</span>
                <span className="text-white/30 text-xs ml-1">by Interon</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  Get Started
                </button>
              </div>
            </nav>

            {/* HERO */}
            <section className="min-h-screen flex items-center justify-center px-6 pt-20">
              <div className="max-w-5xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  AI Agent Online · 98.2% Accuracy This Week
                </motion.div>

                {/* Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.7 }}
                  className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
                >
                  Prior Auth,{' '}
                  <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Reimagined
                  </span>
                  <br />
                  for the AI Era
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                  OneClick by Interon is the first fully AI-native prior authorization platform.
                  From submission to decision — automated, intelligent, and blazing fast.
                </motion.p>

                {/* CTAs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <button
                    onClick={() => router.push('/login?portal=provider')}
                    className="group px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                      boxShadow: '0 0 30px rgba(79,70,229,0.4)',
                    }}
                  >
                    Provider Portal
                    <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                  <button
                    onClick={() => router.push('/login?portal=payer')}
                    className="group px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all hover:scale-105"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    Payer Portal
                    <span className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6"
                >
                  {STATS.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.65 + i * 0.1 }}
                      className="rounded-2xl p-5 text-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="text-3xl font-black text-white">{s.value}</div>
                      <div className="text-white/40 text-sm mt-1">{s.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>

            {/* FEATURES */}
            <section className="py-24 px-6">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl font-black text-white mb-4">
                    Built different. Built for{' '}
                    <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      scale
                    </span>
                  </h2>
                  <p className="text-white/50 text-lg">Every hospital. Every payer. Every hand.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {FEATURES.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="p-6 rounded-2xl group hover:scale-105 transition-transform cursor-default"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div className="text-3xl mb-4">{f.icon}</div>
                      <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* WORKFLOW SECTION */}
            <section className="py-24 px-6">
              <div className="max-w-4xl mx-auto text-center">
                <motion.h2
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-4xl font-black text-white mb-16"
                >
                  The PA journey, end-to-end
                </motion.h2>

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  {[
                    { step: '01', label: 'Order Placed', sub: 'Provider submits via EMR', color: '#6366f1' },
                    { step: '02', label: 'AI Review', sub: 'Policy matched in <1s', color: '#8b5cf6' },
                    { step: '03', label: 'Intake Check', sub: 'Eligibility verified', color: '#a855f7' },
                    { step: '04', label: 'Clinical Review', sub: 'Criteria validated', color: '#d946ef' },
                    { step: '05', label: 'Decision', sub: 'Approved or denied', color: '#ec4899' },
                  ].map((s, i) => (
                    <motion.div
                      key={s.step}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg mb-3"
                        style={{ background: s.color, boxShadow: `0 0 20px ${s.color}66` }}>
                        {s.step}
                      </div>
                      <div className="text-white font-semibold text-sm">{s.label}</div>
                      <div className="text-white/40 text-xs mt-1">{s.sub}</div>
                      {i < 4 && <div className="hidden md:block absolute" style={{ width: 40 }} />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 px-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-3xl mx-auto text-center rounded-3xl p-16"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))',
                  border: '1px solid rgba(99,102,241,0.3)',
                }}
              >
                <h2 className="text-4xl font-black text-white mb-4">Ready to go viral?</h2>
                <p className="text-white/60 text-lg mb-8">Join every hospital and payer on OneClick. The platform that changes how healthcare works.</p>
                <button
                  onClick={() => router.push('/login')}
                  className="px-10 py-4 rounded-2xl font-bold text-white text-lg hover:scale-105 transition-transform"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 40px rgba(79,70,229,0.5)' }}
                >
                  Enter OneClick →
                </button>
              </motion.div>
            </section>

            {/* FOOTER */}
            <footer className="py-8 px-6 text-center border-t border-white/5">
              <p className="text-white/25 text-sm">
                © 2026 OneClick by Interon · Powered by{' '}
                <span className="text-white/40 font-semibold">Interon IT</span>
                {' '}· HIPAA Compliant · SOC 2 Type II
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
