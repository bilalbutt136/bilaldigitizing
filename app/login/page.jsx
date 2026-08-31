'use client';

import React from 'react';
import { AuthModal } from '../../src/components/auth/AuthModal';

export default function LoginRoute() {
  return <AuthModal isStandalonePage={true} initialMode="login" />;
}
