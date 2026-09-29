import { withApiObservability } from '../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../src/lib/supabase/admin.js';

export const dynamic = 'force-dynamic';

async function GET_impl() {
  const startTime = Date.now();
  let databaseConnected = false;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('site_config').select('key').limit(1);
    databaseConnected = !error;
  } catch {
    databaseConnected = false;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = databaseConnected;

  return Response.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      database: {
        status: isHealthy ? 'connected' : 'unavailable',
        responseTimeMs
      }
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    }
  );
}

export const GET = withApiObservability(GET_impl);
