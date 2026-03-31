'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { codesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

type CodeType = 'icd10' | 'cpt' | 'hcpcs';

const TABS: { id: CodeType; label: string; placeholder: string; color: string }[] = [
  { id: 'icd10', label: 'ICD-10-CM', placeholder: 'Search diagnosis codes (e.g. diabetes, E11, hypertension)...', color: 'bg-blue-600' },
  { id: 'cpt', label: 'CPT', placeholder: 'Search procedure codes (e.g. appendectomy, 44970, office visit)...', color: 'bg-indigo-600' },
  { id: 'hcpcs', label: 'HCPCS', placeholder: 'Search HCPCS codes (e.g. ambulance, wheelchair, A0021)...', color: 'bg-purple-600' },
];

export default function CodeSearchPage() {
  const [activeTab, setActiveTab] = useState<CodeType>('icd10');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const search = useCallback(async (q: string, type: CodeType) => {
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      let res;
      if (type === 'icd10') res = await codesApi.searchIcd10(q, 30);
      else if (type === 'cpt') res = await codesApi.searchCpt(q, 30);
      else res = await codesApi.searchHcpcs(q, 30);
      setResults(Array.isArray(res.data) ? res.data : res.data?.codes || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (v.length >= 2) {
      const timer = setTimeout(() => search(v, activeTab), 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setSearched(false);
    }
  }

  function switchTab(tab: CodeType) {
    setActiveTab(tab);
    setResults([]);
    setSearched(false);
    setQuery('');
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }

  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Medical Code Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search 97,584 ICD-10 · 9,720 CPT · 8,725 HCPCS codes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === t.id ? `${t.color} text-white shadow-lg` : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search box */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</div>
        <input
          value={query}
          onChange={handleInput}
          onKeyDown={e => e.key === 'Enter' && query.length >= 2 && search(query, activeTab)}
          placeholder={tab.placeholder}
          className="w-full pl-12 pr-4 py-3.5 text-sm border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && !loading && results.length === 0 && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">🔍</div>
            <p>No results found for "{query}"</p>
            <p className="text-xs mt-1">Try different keywords or a shorter code prefix</p>
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">{results.length} results</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{tab.label}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {results.map((item, i) => (
                <motion.div
                  key={item.id || item.code}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 group transition-colors"
                >
                  {/* Code badge */}
                  <div className={cn('flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-white', tab.color)}>
                    {item.code}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{item.description}</div>
                    {item.short_description && item.short_description !== item.description && (
                      <div className="text-xs text-slate-400 truncate">{item.short_description}</div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {activeTab === 'icd10' && item.billable && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-semibold">Billable</span>
                    )}
                    {activeTab === 'cpt' && item.rvu != null && (
                      <span className="text-xs text-slate-400">RVU: {item.rvu}</span>
                    )}
                    {/* Copy button */}
                    <button
                      onClick={() => copyCode(item.code)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 font-semibold"
                    >
                      {copied === item.code ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!searched && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Common Diagnoses', codes: ['E11.9 – Type 2 diabetes', 'I10 – Essential hypertension', 'J18.9 – Pneumonia', 'M17.11 – Knee osteoarthritis', 'K35.80 – Acute appendicitis'] },
              { label: 'Common CPT', codes: ['99213 – Office visit, est. pt', '27447 – Total knee replacement', '44970 – Laparoscopic appendectomy', '70553 – MRI Brain w/ contrast', '93000 – ECG with interpretation'] },
              { label: 'Common HCPCS', codes: ['A0021 – Ambulance service', 'E0100 – Cane, includes canes', 'J0120 – Tetracycline injection', 'K0001 – Standard wheelchair', 'L0120 – Cervical, flexible'] },
            ].map(group => (
              <div key={group.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{group.label}</h3>
                <div className="space-y-2">
                  {group.codes.map(c => {
                    const [code] = c.split(' – ');
                    return (
                      <button
                        key={c}
                        onClick={() => { setQuery(code); search(code, activeTab); setSearched(true); }}
                        className="block w-full text-left text-xs text-slate-600 hover:text-indigo-600 transition-colors py-0.5"
                      >
                        <span className="font-mono font-semibold">{c}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
