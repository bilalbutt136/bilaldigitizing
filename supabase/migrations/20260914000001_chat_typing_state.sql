-- Migration: 20260914000001_chat_typing_state.sql
-- Add typing indicator timestamps to public.conversations

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS typing_client_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS typing_admin_at timestamptz;

-- Partial indexes for ultra-fast query execution without impacting write latency
CREATE INDEX IF NOT EXISTS idx_conversations_typing_client ON public.conversations (typing_client_at) WHERE typing_client_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_typing_admin ON public.conversations (typing_admin_at) WHERE typing_admin_at IS NOT NULL;
