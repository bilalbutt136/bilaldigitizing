import React from 'react';
import { AdminPortalClient } from '../admin-portal/AdminPortalClient';

export const metadata = {
  title: 'Master Admin Operations Control Desk | B Digitizing Studio',
  description: 'Manage digitizing orders, client directories, vector artwork processing, catalog CMS, and live support chat.',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminRoute() {
  return <AdminPortalClient />;
}
