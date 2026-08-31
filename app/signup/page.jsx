'use client';

import React from 'react';
import { AuthPageView } from '../../src/components/auth/AuthPageView';

export default function SignupRoute() {
  return <AuthPageView initialMode="signup" />;
}
