import React from 'react';
import { CustomPatchesClient } from './CustomPatchesClient';

export const metadata = {
  title: 'Custom Embroidered, Woven & PVC Patches | B Digitizing Studio',
  description: 'Order custom physical embroidered emblems, merrowed border patches, 3D raised PVC rubber, and debossed genuine leather emblems.',
  openGraph: {
    title: 'Custom Embroidered, Woven & PVC Patches | B Digitizing Studio',
    description: 'Order custom physical embroidered emblems, merrowed border patches, 3D raised PVC rubber, and debossed genuine leather emblems.'
  }
};

export default function CustomPatchesRoute() {
  return <CustomPatchesClient />;
}
