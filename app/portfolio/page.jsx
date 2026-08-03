import React from 'react';
import { PortfolioClient } from './PortfolioClient';

export const metadata = {
  title: 'Embroidery & Vector Portfolio Showcase | B Digitizing Studio',
  description: 'Explore high-density embroidery digitizing sew-outs, 3D raised cap foam samples, and crisp vector artwork transformations.',
  openGraph: {
    title: 'Embroidery & Vector Portfolio Showcase | B Digitizing Studio',
    description: 'Explore high-density embroidery digitizing sew-outs, 3D raised cap foam samples, and crisp vector artwork transformations.'
  }
};

export default function PortfolioRoute() {
  return <PortfolioClient />;
}
