import { createRequestContext, runWithRequestContext } from './requestContext.js';
import {
  logServerError,
  logServerInfo,
  logServerWarn
} from './serverLogger.js';

export { logServerCaughtError } from './serverLogger.js';

const DEFAULT_SLOW_REQUEST_MS = 1500;

function getSlowRequestThreshold() {
  const configured = Number(process.env.OBSERVABILITY_SLOW_REQUEST_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_SLOW_REQUEST_MS;
}

function attachObservabilityHeaders(response, requestId, durationMs) {
  if (!response?.headers?.set) return response;

  try {
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-response-time-ms', String(durationMs));
    response.headers.set('server-timing', `app;dur=${durationMs}`);
  } catch {
    // Some framework-generated responses may expose immutable headers.
  }

  return response;
}

export function withApiObservability(handler) {
  if (typeof handler !== 'function') {
    throw new TypeError('withApiObservability requires a route handler function.');
  }

  return async function observedApiHandler(request, ...args) {
    const context = createRequestContext(request);

    return runWithRequestContext(context, async () => {
      const startedAt = performance.now();

      try {
        const response = await handler(request, ...args);
        const durationMs = Number((performance.now() - startedAt).toFixed(1));
        const statusCode = Number(response?.status || 200);
        const fields = {
          statusCode,
          durationMs,
          slow: durationMs >= getSlowRequestThreshold()
        };

        if (statusCode >= 500) {
          logServerError(
            'api.request.completed_with_server_error',
            new Error(`HTTP ${statusCode}`),
            fields
          );
        } else if (fields.slow) {
          logServerWarn('api.request.slow', fields);
        } else {
          logServerInfo('api.request.completed', fields);
        }

        return attachObservabilityHeaders(response, context.requestId, durationMs);
      } catch (error) {
        const durationMs = Number((performance.now() - startedAt).toFixed(1));
        logServerError('api.request.unhandled_exception', error, { durationMs });
        throw error;
      }
    });
  };
}
