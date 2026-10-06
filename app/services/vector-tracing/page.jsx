import React from 'react';
import { VectorClient } from './VectorClient';

export const metadata = {
  title: 'Vector Art Conversion Service | AI, EPS & SVG',
  description: 'Convert low-res JPG, PNG, or hand sketches into clean, infinitely scalable AI, EPS, SVG vector graphics for screen printing & vinyl.',
  openGraph: {
    title: 'Vector Art Conversion Service | AI, EPS & SVG',
    description: 'Convert low-res JPG, PNG, or hand sketches into clean, infinitely scalable AI, EPS, SVG vector graphics for screen printing & vinyl.'
  }
};

export default function VectorTracingPage() {
  return <VectorClient />;
}
