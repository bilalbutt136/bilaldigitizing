-- Migration: 20260925000001_chat_presence_and_online_status.sql
-- 1. Ensure last_seen_at column exists in public.conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT timezone('utc'::text, now());

-- 2. Alter status column default to 'offline' (conversations are offline unless actively present)
ALTER TABLE public.conversations ALTER COLUMN status SET DEFAULT 'offline';

-- 3. Reset any stale conversations whose last activity was > 3 minutes ago to 'offline'
UPDATE public.conversations 
SET status = 'offline' 
WHERE status = 'online' 
  AND (last_message_at IS NULL OR last_message_at < NOW() - INTERVAL '3 minutes');

-- 4. Index for fast presence lookups
CREATE INDEX IF NOT EXISTS idx_conversations_last_seen_at ON public.conversations (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations (status);
