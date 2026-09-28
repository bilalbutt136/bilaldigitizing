// Legacy Stripe webhook path retained for backwards-compatible provider configuration.
// Processing delegates to the single canonical, idempotent handler.
import { POST as canonicalStripeWebhook } from '../../webhooks/stripe/route';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  return canonicalStripeWebhook(request);
}
