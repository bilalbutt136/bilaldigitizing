-- Migration: 20261007000001_email_support_and_attachments.sql
-- Purpose: Add email_type, target_email, and attachments to email_campaigns table

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS email_type text DEFAULT 'campaign',
  ADD COLUMN IF NOT EXISTS target_email text,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.email_campaigns.email_type IS
  'Distinguishes between support messages ("support") and promotional marketing broadcasts ("campaign").';

COMMENT ON COLUMN public.email_campaigns.target_email IS
  'Direct recipient email when sent in single/support mode.';

COMMENT ON COLUMN public.email_campaigns.attachments IS
  'JSON array of file attachments with name, url, size, and type.';
