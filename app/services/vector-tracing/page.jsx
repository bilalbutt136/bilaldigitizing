import React from 'react';
import { VectorClient } from './VectorClient';

export const metadata = {
  title: 'Raster to Scalable Vector Tracing Services | B Digitizing Studio',
  description: 'Convert low-res JPG, PNG, or hand sketches into clean, infinitely scalable AI, EPS, SVG vector graphics for screen printing & vinyl.',
  openGraph: {
    title: 'Raster to Scalable Vector Tracing Services | B Digitizing Studio',
    description: 'Convert low-res JPG, PNG, or hand sketches into clean, infinitely scalable AI, EPS, SVG vector graphics for screen printing & vinyl.'
  }
};

export default function VectorTracingPage() {
  return <VectorClient />;
}
