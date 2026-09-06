import React from 'react';

export const metadata = {
  title: {
    default: 'Digitizing Task Portal',
    template: '%s | Digitizing Task Portal'
  },
  description: 'Production Task Portal & Digitizer Workstation',
  robots: {
    index: false,
    follow: false
  }
};

export default function WorkerPortalLayout({ children }) {
  return (
    <div className="worker-portal-isolated min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-orange-500 selection:text-white" style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {children}
    </div>
  );
}
