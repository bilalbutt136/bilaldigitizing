import { getSiteBranding } from '../src/lib/branding/serverBranding';

export const revalidate = 300;

export default async function manifest() {
  const branding = await getSiteBranding();
  const appIcon = branding.app_icon_url || '/icon-512x512.png';

  return {
    name: 'BDigitizing – Embroidery & Vector Studio',
    short_name: 'BDigitizing',
    description: 'Professional Machine Embroidery Digitizing, Vector Art & Custom Patches with 4-8 Hour Express Turnaround.',
    start_url: '/?app=true',
    id: '/?app=true',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'window-controls-overlay'],
    orientation: 'portrait-primary',
    background_color: '#ffffff',
    theme_color: branding.theme_color || '#ffffff',
    icons: [
      {
        src: appIcon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: appIcon,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    categories: ['business', 'productivity', 'shopping'],
    shortcuts: [
      {
        name: 'New Order',
        short_name: 'New Order',
        description: 'Place a new digitizing or vector order',
        url: '/?app=true&tab=home',
        icons: [{ src: appIcon, sizes: '512x512', type: 'image/png' }]
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'Track active and completed orders',
        url: '/?app=true&tab=orders',
        icons: [{ src: appIcon, sizes: '512x512', type: 'image/png' }]
      },
      {
        name: 'Studio Inbox',
        short_name: 'Inbox',
        description: '24/7 Studio Chat & Realtime Support',
        url: '/?app=true&tab=inbox',
        icons: [{ src: appIcon, sizes: '512x512', type: 'image/png' }]
      }
    ]
  };
}
