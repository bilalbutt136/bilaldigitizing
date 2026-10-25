'use client';

import { useEffect, useState } from 'react';

// Read an uncached, read-only snapshot instead of stale SSR catalog settings.
// Request again whenever the visitor returns to the tab.
export function useLivePromotion() {
  const [state, setState] = useState({ settings: null, loading: true, error: false });

  useEffect(() => {
    let mounted = true;
    let generation = 0;
    const refresh = async () => {
      const ticket = ++generation;
      try {
        const response = await fetch('/api/promotions/active', { cache: 'no-store' });
        if (!response.ok) throw new Error('Promotion unavailable');
        const settings = await response.json();
        if (mounted && ticket === generation) setState({ settings, loading: false, error: false });
      } catch {
        if (mounted && ticket === generation) setState({ settings: null, loading: false, error: true });
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('bdigi_promotions_sync', refresh);
    return () => {
      mounted = false;
      ++generation;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('bdigi_promotions_sync', refresh);
    };
  }, []);

  return state;
}
