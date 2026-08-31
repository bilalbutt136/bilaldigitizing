'use client';

import React from 'react';
import { AuthPageView } from '../../src/components/auth/AuthPageView';

export default function ResetPasswordRoute() {
  return <AuthPageView initialMode="forgot" />;
}
