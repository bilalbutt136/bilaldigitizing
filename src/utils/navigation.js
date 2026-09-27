'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export function useNavigate() {
  const router = useRouter();
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
      } catch (err) {
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }
    }
  }, [router]);
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
