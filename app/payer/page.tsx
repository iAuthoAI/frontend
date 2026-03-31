'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function PayerRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login?portal=payer');
      return;
    }
    if (user.role === 'payer_intake') router.replace('/payer/intake');
    else if (user.role === 'payer_clinical') router.replace('/payer/clinical');
    else if (user.role === 'payer_decision') router.replace('/payer/decision');
    else router.replace('/payer/intake');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
    </div>
  );
}
