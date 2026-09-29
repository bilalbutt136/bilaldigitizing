import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
// Legacy Stripe webhook path retained for backwards-compatible provider configuration.
// Processing delegates to the single canonical, idempotent handler.
import { POST as canonicalStripeWebhook } from '../../webhooks/stripe/route';

export const dynamic = 'force-dynamic';

async function POST_impl(request) {
  return canonicalStripeWebhook(request);
}

export const POST = withApiObservability(POST_impl);
