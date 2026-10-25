import HomePageClient from '../../src/components/public/HomePageClient';

// A shareable, SEO-friendly URL for the Embroidery Digitizing homepage tab.
// The existing /services/embroidery-digitizing route keeps its separate pricing page.
export const metadata = {
  title: 'Embroidery Digitizing Services | DST, PES & EMB',
  description: 'Factory-grade embroidery digitizing with manual stitch pathing, commercial-ready DST, PES and EMB files, and professional sew-out samples.',
  alternates: {
    canonical: '/embroidery-digitizing-studio'
  },
  openGraph: {
    title: 'Embroidery Digitizing Services | DST, PES & EMB',
    description: 'Manual embroidery digitizing, optimized sew-outs, and machine-ready DST, PES and EMB files.',
    url: '/embroidery-digitizing-studio'
  }
};

export default function EmbroideryDigitizingLandingPage() {
  return <HomePageClient initialServiceTab="embroidery" />;
}
