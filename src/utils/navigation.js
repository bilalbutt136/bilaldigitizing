'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function useNavigate() {
  const router = useRouter();

  useEffect(() => {
    const handleNavEvent = (e) => {
      const targetPath = e.detail?.path;
      if (typeof targetPath === 'string') {
        try {
          if (e.detail?.replace) router.replace(targetPath);
          else router.push(targetPath);
        } catch {
          if (typeof window !== 'undefined') window.location.href = targetPath;
        }
      }
    };
    window.addEventListener('bdigi_navigate', handleNavEvent);
    return () => window.removeEventListener('bdigi_navigate', handleNavEvent);
  }, [router]);

  return useCallback((path, options) => {
    if (typeof path === 'number') {
      if (path === -1) {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
      }
      return;
    }
    if (typeof path === 'string') {
      try {
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }
    }
  }, [router]);
}

export function navigateTo(path, options = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('bdigi_navigate', { detail: { path, ...options } }));
}

export function useLocation() {
  const pathname = usePathname() || '/';
  const search = typeof window !== 'undefined' ? (window.location.search || '') : '';
  const hash = typeof window !== 'undefined' ? (window.location.hash || '') : '';
  return {
    pathname,
    search,
    hash
  };
}

export function openExternalLink(url) {
  if (typeof window === 'undefined' || !url) return;
  const targetUrl = String(url).trim();

  // 1. Capacitor / Cordova native in-app browser
  if (window.Capacitor?.Plugins?.Browser?.open) {
    try {
      window.Capacitor.Plugins.Browser.open({ url: targetUrl });
      return;
    } catch {}
  }

  // 2. Standalone PWA / TWA / WebView mode: Use '_system' target to launch in system browser (Chrome/Safari)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator?.standalone === true ||
    document.documentElement?.classList?.contains('mobile-app-active')
  );

  if (isStandalone) {
    try {
      window.open(targetUrl, '_system', 'noopener,noreferrer');
      return;
    } catch {}
  }

  // 3. Standard web browser tab
  try {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  } catch {
    window.location.href = targetUrl;
  }
}

export function Navigate({ to, replace }) {
  const navigate = useNavigate();
  useEffect(() => {
    if (to) {
      navigate(to, { replace });
    }
  }, [to, replace, navigate]);
  return null;
}

export { Link };
