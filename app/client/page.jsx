import React from 'react';
import { ClientPortalClient } from '../client-portal/ClientPortalClient';

export const metadata = {
  title: 'Client Portal & Order Management Desk | B Digitizing Studio',
  description: 'Client portal for managing digitizing orders, vector redraws, file downloads, and wallet balance.'
};

export default function ClientRoute() {
  return <ClientPortalClient />;
}
