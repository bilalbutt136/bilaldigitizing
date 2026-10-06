import React from 'react';
import { CustomPatchesClient } from './CustomPatchesClient';

export const metadata = {
  title: 'Custom Embroidered Patches | Velcro, Iron-On & Sew-On',
  description: 'Custom embroidered, woven, PVC and leather patches with digital proofing, backing options, 50-piece minimums, and worldwide shipping.',
  openGraph: {
    title: 'Custom Embroidered Patches | Velcro, Iron-On & Sew-On',
    description: 'Custom embroidered, woven, PVC and leather patches with digital proofing, backing options, 50-piece minimums, and worldwide shipping.'
  }
};

export default function CustomPatchesRoute() {
  return <CustomPatchesClient />;
}
