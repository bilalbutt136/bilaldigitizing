-- =========================================================================
-- Migration: 20260925000002_email_campaigns.sql
-- Purpose  : Create email_campaigns table for admin promotional email tracking
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text,
  subject          text NOT NULL,
  from_address     text,
  recipient_mode   text DEFAULT 'all_clients',  -- 'test' | 'single' | 'all_clients'
  recipient_count  integer DEFAULT 0,
  sent_count       integer DEFAULT 0,
  fail_count       integer DEFAULT 0,
  status           text DEFAULT 'draft',         -- 'draft' | 'sent' | 'partial' | 'failed'
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Index for fast dashboard loading (latest campaigns first)
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at
  ON public.email_campaigns (created_at DESC);

-- RLS: Only service-role (admin API) can read/write campaign records
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; deny all other access by default
-- (No public or authenticated policy → only service_role key can access)

-- ── Add email_opt_out column to clients table if it does not exist ────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS email_opt_out boolean DEFAULT false;

COMMENT ON COLUMN public.clients.email_opt_out IS
  'When true, this client is excluded from bulk promotional email campaigns.';

COMMENT ON TABLE public.email_campaigns IS
  'Stores metadata and delivery stats for admin-sent promotional email campaigns.';
