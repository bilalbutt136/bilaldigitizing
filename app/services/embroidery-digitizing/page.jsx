import React from 'react';
import { EmbroideryClient } from './EmbroideryClient';

export const metadata = {
  title: 'Commercial Embroidery Digitizing Services | B Digitizing Studio',
  description: 'Production-ready embroidery machine files engineered for Tajima, Brother, Melco, Janome & Barudan machines with 4-12 hour turnaround.',
  openGraph: {
    title: 'Commercial Embroidery Digitizing Services | B Digitizing Studio',
    description: 'Production-ready embroidery machine files engineered for Tajima, Brother, Melco, Janome & Barudan machines with 4-12 hour turnaround.'
  }
};

export default function EmbroideryDigitizingRoute() {
  return <EmbroideryClient />;
}
