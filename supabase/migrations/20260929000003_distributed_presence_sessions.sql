-- Distributed presence fallback for multi-instance/serverless deployments.
-- Supabase Realtime Presence remains the low-latency path; this table provides
-- durable cross-instance heartbeats for REST fallback and last-seen recovery.

CREATE TABLE IF NOT EXISTS public.user_presence_sessions (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'client'
    CHECK (role IN ('client', 'admin', 'worker')),
  status text NOT NULL DEFAULT 'online'
    CHECK (status IN ('online', 'offline')),
  conversation_id text,
  last_seen_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at timestamptz NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '150 seconds'),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_sessions_active
  ON public.user_presence_sessions (expires_at DESC)
  WHERE status = 'online';

CREATE INDEX IF NOT EXISTS idx_user_presence_sessions_email
  ON public.user_presence_sessions (lower(email));

ALTER TABLE public.user_presence_sessions ENABLE ROW LEVEL SECURITY;

-- Presence writes/reads are routed through authenticated server APIs using
-- the service role. Browser clients use Supabase Realtime Presence directly.
REVOKE ALL ON TABLE public.user_presence_sessions FROM anon;
REVOKE ALL ON TABLE public.user_presence_sessions FROM authenticated;
GRANT ALL ON TABLE public.user_presence_sessions TO service_role;
