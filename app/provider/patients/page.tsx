'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { patientApi } from '@/lib/api';
import { cn, calcAge } from '@/lib/utils';

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
  dob: string;
  gender: string;
  phone: string;
  primary_payer?: string;
  active_pa_count?: number;
  last_visit?: string;
};

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    patientApi.list()
      .then((res) => setPatients(res.data.patients || res.data || []))
      .catch(() => setPatients(MOCK_PATIENTS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q ||
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.mrn?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800 font-bold text-xl">Patient List</h1>
          <p className="text-slate-500 text-sm mt-0.5">{patients.length} patients in your panel</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or MRN..."
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 w-64"
            />
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            + New Patient
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              {['PATIENT', 'MRN', 'AGE / SEX', 'PHONE', 'INSURANCE', 'ACTIVE PA', 'LAST VISIT', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-slate-400">No patients found</td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => router.push(`/provider/patients/${p.id}`)}
                  className="border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {p.first_name?.[0]}{p.last_name?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-indigo-700">{p.last_name}, {p.first_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 font-mono">{p.mrn}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{calcAge(p.dob)} / {p.gender === 'female' ? 'F' : 'M'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.primary_payer || '—'}</td>
                  <td className="px-4 py-3">
                    {(p.active_pa_count ?? 0) > 0 ? (
                      <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {p.active_pa_count} active
                      </span>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.last_visit || '—'}</td>
                  <td className="px-4 py-3">
                    <button className="text-slate-300 hover:text-slate-500 transition-colors">···</button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MOCK_PATIENTS: Patient[] = [
  { id: '1', first_name: 'Sarah', last_name: 'Johnson', mrn: 'MRN-001234', dob: '1985-03-15', gender: 'female', phone: '(555) 234-5678', primary_payer: 'Blue Cross Blue Shield', active_pa_count: 1, last_visit: '2026-03-20' },
  { id: '2', first_name: 'Robert', last_name: 'Williams', mrn: 'MRN-001235', dob: '1958-07-22', gender: 'male', phone: '(555) 345-6789', primary_payer: 'Medicare', active_pa_count: 2, last_visit: '2026-03-18' },
  { id: '3', first_name: 'Elena', last_name: 'Martinez', mrn: 'MRN-001236', dob: '1972-11-08', gender: 'female', phone: '(555) 456-7890', primary_payer: 'UnitedHealthcare', active_pa_count: 0, last_visit: '2026-03-10' },
  { id: '4', first_name: 'James', last_name: 'Thompson', mrn: 'MRN-001237', dob: '1945-05-30', gender: 'male', phone: '(555) 567-8901', primary_payer: 'Cigna', active_pa_count: 1, last_visit: '2026-03-05' },
  { id: '5', first_name: 'Patricia', last_name: 'Anderson', mrn: 'MRN-001238', dob: '1963-09-14', gender: 'female', phone: '(555) 678-9012', primary_payer: 'Humana', active_pa_count: 3, last_visit: '2026-03-25' },
];
