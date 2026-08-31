'use client';

import React from 'react';
import { AuthModal } from '../../src/components/auth/AuthModal';

export default function ResetPasswordRoute() {
  return <AuthModal isStandalonePage={true} initialMode="forgot" />;
}
