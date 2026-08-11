'use client';

import React, { useEffect, useState } from 'react';
import { useAppState } from '../../src/context/StateContext';

export default function OrderPage() {
  const { setIsOrderWizardOpen, setOrderWizardInitialData, isAuthInitialized } = useAppState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isAuthInitialized) {
      const urlParams = new URLSearchParams(window.location.search);
      const type = urlParams.get('type') || 'all';
      setOrderWizardInitialData({ type });
      setIsOrderWizardOpen(true);
      setIsReady(true);
    }
  }, [isAuthInitialized, setIsOrderWizardOpen, setOrderWizardInitialData]);

  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--navy-950, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Loading Order Configuration...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950, #0f172a)' }}>
      {/* OrderWizardModal is globally rendered in layout.jsx and will display here */}
    </div>
  );
}
