'use client';

import React from 'react';
import { AuthModal } from '../../src/components/auth/AuthModal';

export default function SignupRoute() {
  return <AuthModal isStandalonePage={true} initialMode="signup" />;
}
