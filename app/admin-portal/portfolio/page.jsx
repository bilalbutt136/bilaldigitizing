import React from 'react';
import { PortfolioUploaderClient } from './PortfolioUploaderClient';

export const metadata = {
  title: 'Portfolio Uploader | Operations Desk',
  description: 'Upload images to the public portfolio.',
  robots: {
    index: false,
    follow: false
  }
};

export default function PortfolioUploadRoute() {
  return <PortfolioUploaderClient />;
}
