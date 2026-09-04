import { createAdminClient } from '../../../src/lib/supabase/admin.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbError = null;

  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await supabase.from('site_config').select('key').limit(1);
      if (!error) {
        dbStatus = 'connected';
      } else {
        dbError = error.message;
      }
    }
  } catch (err) {
    dbError = err.message;
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus === 'connected';

  const services = {
    database: dbStatus === 'connected',
    auth: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    geminiAi: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY),
    resendEmail: Boolean(process.env.RESEND_API_KEY),
    stripePayments: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    cloudinaryStorage: Boolean(process.env.CLOUDINARY_API_SECRET && process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY),
  };

  return Response.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      environment: process.env.NODE_ENV || 'production',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      database: {
        status: dbStatus,
        responseTimeMs,
        ...(dbError ? { error: dbError } : {}),
      },
      services,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
