import React from 'react';
import { ClientPortalClient } from './ClientPortalClient';

export const metadata = {
  title: 'Client Dashboard & Order Manager | B Digitizing Studio',
  description: 'Track embroidery digitizing orders, download machine files (.DST, .PES, .EMB), request revisions, and manage studio wallet credit.',
  robots: {
    index: false,
    follow: false
  }
};

export default function ClientPortalRoute() {
  return <ClientPortalClient />;
}
