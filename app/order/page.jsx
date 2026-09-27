'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '../../src/context/StateContext';

function OrderHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openOrderWizard, protectedNavigate } = useAppState();

  useEffect(() => {
    const rawService = searchParams.get('service') || searchParams.get('type') || 'all';
    const service = rawService === 'vector-art' ? 'vector' : (rawService === 'patches' ? 'patch' : rawService);

    // Route to home seamlessly and trigger order wizard
    router.replace('/');
    setTimeout(() => {
      if (openOrderWizard) {
        openOrderWizard({ type: service });
      } else if (protectedNavigate) {
        protectedNavigate('customer', true, { type: service });
      }
    }, 100);
  }, [router, searchParams, openOrderWizard, protectedNavigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(249, 115, 22, 0.2)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', fontWeight: 600 }}>Loading order wizard...</p>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderHandler />
    </Suspense>
  );
}
