import React from 'react';
import { EmbroideryClient } from './EmbroideryClient';

export const metadata = {
  title: 'Professional Embroidery Digitizing | DST, PES & EMB',
  description: 'Professional embroidery digitizing for commercial shops. Production-ready DST, PES and EMB files with fabric-specific pathing and free minor revisions.',
  openGraph: {
    title: 'Professional Embroidery Digitizing | DST, PES & EMB',
    description: 'Professional embroidery digitizing for commercial shops. Production-ready DST, PES and EMB files with fabric-specific pathing and free minor revisions.'
  }
};

export default function EmbroideryDigitizingRoute() {
  return <EmbroideryClient />;
}
