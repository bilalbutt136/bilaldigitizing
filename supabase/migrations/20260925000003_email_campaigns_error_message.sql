-- =========================================================================
-- Migration: 20260925000003_email_campaigns_error_message.sql
-- Purpose  : Add error_message column to email_campaigns for transparency
-- =========================================================================

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS error_message text;

COMMENT ON COLUMN public.email_campaigns.error_message IS
  'Human-readable error details if sending failed or partially failed.';
