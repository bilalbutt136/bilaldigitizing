'use client';

import React, { useEffect } from 'react';
import { AuthModal } from '../../src/components/auth/AuthModal';
import { useAppState } from '../../src/context/StateContext';
import { useRouter } from 'next/navigation';

export default function SignupRoute() {
  const { mobileMode } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (mobileMode === 'app') {
      router.replace('/?app=true&tab=signup');
    }
  }, [mobileMode, router]);

  if (mobileMode === 'app') {
    return null;
  }

  return <AuthModal isStandalonePage={true} initialMode="signup" />;
}
