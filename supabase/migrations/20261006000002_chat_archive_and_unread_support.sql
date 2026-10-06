-- Migration: Add archive support to conversations table
-- Enables archiving conversations and filtering by archived state in inbox

ALTER TABLE IF EXISTS public.conversations
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_conversations_is_archived
  ON public.conversations(is_archived);

CREATE INDEX IF NOT EXISTS idx_conversations_client_archived
  ON public.conversations(client_email, is_archived);
