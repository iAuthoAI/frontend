'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, isPayerRole } from '@/lib/auth';
import PayerSidebar from '@/components/payer/PayerSidebar';
import PayerTopbar from '@/components/payer/PayerTopbar';

export default function PayerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !isPayerRole(user)) {
      router.replace('/login?portal=payer');
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <PayerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <PayerTopbar />
        <main className="flex-1 overflow-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
