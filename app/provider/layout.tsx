'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import ProviderSidebar from '@/components/provider/ProviderSidebar';
import ProviderTopbar from '@/components/provider/ProviderTopbar';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push('/login'); return; }
    if (!['provider', 'admin', 'super_admin'].includes(user.role)) { router.push('/login'); return; }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <ProviderSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProviderTopbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
