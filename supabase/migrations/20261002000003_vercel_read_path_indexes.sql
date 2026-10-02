-- Reduce hot read latency for Vercel serverless chat/admin workloads.
-- These indexes match the production filters/orderings used by the API routes.

CREATE INDEX IF NOT EXISTS idx_conversations_client_last_message
  ON public.conversations (lower(client_email), last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_unread_admin_last_message
  ON public.conversations (last_message_at DESC)
  WHERE unread_admin_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_unread_client_last_message
  ON public.conversations (lower(client_email), last_message_at DESC)
  WHERE unread_client_count > 0;

CREATE INDEX IF NOT EXISTS idx_clients_created_at_desc
  ON public.clients (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_sessions_online_expiry_seen
  ON public.user_presence_sessions (expires_at DESC, last_seen_at DESC)
  WHERE status = 'online';
