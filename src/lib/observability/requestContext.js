import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';

const requestContextStorage = new AsyncLocalStorage();
const SAFE_REQUEST_ID = /^[a-zA-Z0-9._:-]{8,128}$/;

function cleanRequestId(value) {
  const candidate = String(value || '').trim();
  return SAFE_REQUEST_ID.test(candidate) ? candidate : null;
}

export function resolveRequestId(request) {
  const headers = request?.headers;
  const incoming =
    cleanRequestId(headers?.get?.('x-request-id')) ||
    cleanRequestId(headers?.get?.('x-correlation-id'));

  return incoming || crypto.randomUUID();
}

export function createRequestContext(request) {
  let pathname = null;
  try {
    pathname = request?.url ? new URL(request.url).pathname : null;
  } catch {
    pathname = null;
  }

  return {
    requestId: resolveRequestId(request),
    method: String(request?.method || 'UNKNOWN').toUpperCase(),
    route: pathname || 'unknown',
    startedAtMs: Date.now()
  };
}

export function runWithRequestContext(context, callback) {
  return requestContextStorage.run(context, callback);
}

export function getRequestContext() {
  return requestContextStorage.getStore() || null;
}
