import React from 'react';
import { SecureAdminLoginClient } from './SecureAdminLoginClient';

export const metadata = {
  title: 'Administrator Operations Access | B Digitizing Studio',
  description: 'Restricted Studio Digitizing & Admin Control Operations Access Portal.',
  robots: {
    index: false,
    follow: false
  }
};

export default function SecureAdminLoginRoute() {
  return <SecureAdminLoginClient />;
}
