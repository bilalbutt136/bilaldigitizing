'use client';

import { useEffect } from 'react';

const ADMIN_ACTIVITY_KEY = 'bdigi_admin_last_activity';

function parseAdminIdleTimeout(value) {
  const raw = String(value || 'never').trim().toLowerCase();
  if (raw === 'never' || raw === 'disabled' || raw === 'none' || raw === 'off' || raw === '30m') {
    // 30m was the old aggressive default that caused unexpected auto-logouts.
    // Return Infinity so the admin remains permanently active and receives messages uninterrupted.
    return Infinity;
  }

  const match = raw.match(/^(\d+)(m|h|d)$/);
  if (!match) return Infinity;

  const amount = Math.max(1, Number(match[1]));
  const multiplier = match[2] === 'd'
    ? 24 * 60 * 60 * 1000
    : (match[2] === 'h' ? 60 * 60 * 1000 : 60 * 1000);

  return amount * multiplier;
}

export function useAdminIdleSession({
  enabled,
  timeoutValue = 'never',
  logout,
  onExpired
}) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    const timeoutMs = parseAdminIdleTimeout(timeoutValue);
    if (!Number.isFinite(timeoutMs) || timeoutMs === Infinity || timeoutMs <= 0) {
      // Idle timeout disabled: keep administrator session continuously active
      return undefined;
    }

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
