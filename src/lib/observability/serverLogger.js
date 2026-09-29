import { getRequestContext } from './requestContext.js';

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|password|secret|token|api[_-]?key|private[_-]?key|session|card|cvv|email)/i;
const MAX_STRING_LENGTH = 1200;
const MAX_DEPTH = 4;

function safeString(value) {
  const text = String(value ?? '');
  return text.length > MAX_STRING_LENGTH
    ? text.slice(0, MAX_STRING_LENGTH) + '…'
    : text;
}

function redact(value, depth = 0, key = '') {
  if (SENSITIVE_KEY_PATTERN.test(key)) return '[REDACTED]';
  if (value == null) return value;
  if (depth > MAX_DEPTH) return '[TRUNCATED]';

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map(item => redact(item, depth + 1));
  }

  if (typeof value === 'object') {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value).slice(0, 50)) {
      result[childKey] = redact(childValue, depth + 1, childKey);
    }
    return result;
  }

  if (typeof value === 'string') return safeString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return safeString(value);
}

export function serializeError(error) {
  if (!error) return null;

  const serialized = {
    name: safeString(error.name || 'Error'),
    message: safeString(error.message || error),
    code: error.code ? safeString(error.code) : undefined
  };

  if (process.env.NODE_ENV !== 'production' && error.stack) {
    serialized.stack = safeString(error.stack);
  }

  return serialized;
}

function writeLog(level, event, fields = {}) {
  const context = getRequestContext();
  const now = Date.now();

  const record = {
    timestamp: new Date(now).toISOString(),
    level,
    event,
    requestId: context?.requestId || null,
    method: context?.method || null,
    route: context?.route || null,
    elapsedMs: context?.startedAtMs ? now - context.startedAtMs : null,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    ...redact(fields)
  };

  const line = JSON.stringify(record);

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  return record;
}

export function logServerInfo(event, fields) {
  return writeLog('info', event, fields);
}

export function logServerWarn(event, fields) {
  return writeLog('warn', event, fields);
}

export function logServerError(event, error, fields = {}) {
  return writeLog('error', event, {
    ...fields,
    error: serializeError(error)
  });
}

export function logServerCaughtError(error, fields = {}) {
  return writeLog('warn', 'api.best_effort_operation_failed', {
    ...fields,
    error: serializeError(error)
  });
}
