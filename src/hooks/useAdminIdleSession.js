'use client';

import { useEffect } from 'react';

const ADMIN_ACTIVITY_KEY = 'bdigi_admin_last_activity';

function parseAdminIdleTimeout(value) {
  const raw = String(value || '30m').trim().toLowerCase();
  const match = raw.match(/^(\d+)(m|h|d)$/);
  if (!match) return 30 * 60 * 1000;

  const amount = Math.max(1, Number(match[1]));
  const multiplier = match[2] === 'd'
    ? 24 * 60 * 60 * 1000
    : (match[2] === 'h' ? 60 * 60 * 1000 : 60 * 1000);

  return amount * multiplier;
}

export function useAdminIdleSession({
  enabled,
  timeoutValue = '30m',
  logout,
  onExpired
}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const timeoutMs = parseAdminIdleTimeout(timeoutValue);
    let lastActivity = Date.now();
    let expiring = false;

    try {
      const stored = Number(sessionStorage.getItem(ADMIN_ACTIVITY_KEY) || 0);
      if (Number.isFinite(stored) && stored > 0) lastActivity = stored;
      else sessionStorage.setItem(ADMIN_ACTIVITY_KEY, String(lastActivity));
    } catch {}

    const expireSession = async () => {
      if (expiring) return;
      expiring = true;
      try {
        sessionStorage.removeItem(ADMIN_ACTIVITY_KEY);
      } catch {}

      if (typeof logout === 'function') {
        await logout();
      }
      if (typeof onExpired === 'function') {
        onExpired();
      }
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= timeoutMs) {
        expireSession();
        return true;
      }
      return false;
    };

    const recordActivity = () => {
      if (checkIdle()) return;
      lastActivity = Date.now();
      try {
        sessionStorage.setItem(ADMIN_ACTIVITY_KEY, String(lastActivity));
      } catch {}
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkIdle();
    };

    const intervalId = window.setInterval(checkIdle, 30_000);
    window.addEventListener('pointerdown', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('touchstart', recordActivity, { passive: true });
    window.addEventListener('focus', checkIdle);
    document.addEventListener('visibilitychange', handleVisibility);

    checkIdle();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pointerdown', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('focus', checkIdle);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, timeoutValue, logout, onExpired]);
}

export { ADMIN_ACTIVITY_KEY, parseAdminIdleTimeout };
