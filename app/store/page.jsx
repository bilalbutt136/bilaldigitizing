import React from 'react';
import { StoreClient } from './StoreClient';

export const metadata = {
  title: 'Apparel & Patch Store | B Digitizing Studio',
  description: 'Shop custom embroidered heavyweight t-shirts, performance polos, and wholesale custom emblems.',
  openGraph: {
    title: 'Apparel & Patch Store | B Digitizing Studio',
    description: 'Shop custom embroidered heavyweight t-shirts, performance polos, and wholesale custom emblems.'
  }
};

export default function StoreRoute() {
  return <StoreClient />;
}
