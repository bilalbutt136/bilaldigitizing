'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppState } from '../../src/context/StateContext';

function PricingRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
    const cat = searchParams ? searchParams.get('cat') : null;

    if (cat === 'patches') {
      router.replace('/custom-patches');
    } else if (cat === 'vector') {
      router.replace('/services/vector-tracing');
    } else {
      router.replace('/services/embroidery-digitizing');
    }
  }, [router, searchParams, setCurrentView]);

  return (
    <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>
      Redirecting to Pricing Rates...
    </div>
  );
}

export default function PricingRedirectRoute() {
  return (
    <Suspense fallback={<div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8' }}>Loading Pricing...</div>}>
      <PricingRedirectContent />
    </Suspense>
  );
}

