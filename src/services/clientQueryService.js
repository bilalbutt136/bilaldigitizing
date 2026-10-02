import { QueryClient } from '@tanstack/query-core';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1
    }
  }
});

function canUseFreshNetwork() {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

export async function fetchClientQuery({
  key,
  queryFn,
  staleTime = 60_000,
  force = false,
  networkWhenHidden = false
}) {
  const queryKey = Array.isArray(key) ? key : [String(key || '')];

  if (!networkWhenHidden && !canUseFreshNetwork()) {
    const cached = queryClient.getQueryData(queryKey);
    if (cached !== undefined) return cached;
  }

  if (force) {
    await queryClient.invalidateQueries({ queryKey, exact: true });
  }

  return queryClient.fetchQuery({
    queryKey,
    queryFn,
    staleTime
  });
}

export function setClientQueryData(key, updater) {
  const queryKey = Array.isArray(key) ? key : [String(key || '')];
  return queryClient.setQueryData(queryKey, updater);
}

export function invalidateClientQuery(key) {
  const queryKey = Array.isArray(key) ? key : [String(key || '')];
  return queryClient.invalidateQueries({ queryKey, exact: true });
}

export function clearClientQueryCache() {
  queryClient.clear();
}
