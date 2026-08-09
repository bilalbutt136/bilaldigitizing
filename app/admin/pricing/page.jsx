import React from 'react';
import { PricingManagerClient } from './PricingManagerClient';

export const metadata = {
  title: 'Dynamic Pricing Management | Admin Portal',
  robots: {
    index: false,
    follow: false
  }
};

export default function PricingAdminRoute() {
  return <PricingManagerClient />;
}
