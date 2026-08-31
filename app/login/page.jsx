'use client';

import React from 'react';
import { AuthPageView } from '../../src/components/auth/AuthPageView';

export default function LoginRoute() {
  return <AuthPageView initialMode="login" />;
}
