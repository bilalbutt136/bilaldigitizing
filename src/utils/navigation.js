'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function useNavigate() {
  const router = useRouter();
  return (path, options) => {
    if (typeof path === 'number') {
      if (path === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useLocation() {
  const pathname = usePathname() || '/';
  let search = '';
  try {
    const searchParams = useSearchParams();
    search = searchParams ? `?${searchParams.toString()}` : '';
  } catch (_) {
    search = '';
  }
  return {
    pathname,
    search,
    hash: ''
  };
}

export function Navigate({ to, replace }) {
  const navigate = useNavigate();
  if (typeof window !== 'undefined') {
    navigate(to, { replace });
  }
  return null;
}

export { Link };
