-- ==============================================================================
-- MIGRATION: Complete Isolation of Inbox and Support Chat Flows
-- Date: 2026-09-07
-- Description:
-- 1. Adds explicit \chat_type\ ('inbox' | 'support') and \is_support\ columns
--    to both \conversations\ and \messages\ tables.
-- 2. Adds composite indexes for high-speed channel-filtered queries and sorting.
-- 3. Backfills all existing conversations and messages to ensure no cross-contamination.
-- ==============================================================================

-- 1. CONVERSATIONS TABLE ENHANCEMENTS
ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS is_support boolean DEFAULT false;

-- 2. MESSAGES TABLE ENHANCEMENTS
ALTER TABLE public.messages 
  ADD COLUMN IF NOT EXISTS chat_type text DEFAULT 'inbox',
  ADD COLUMN IF NOT EXISTS is_support boolean DEFAULT false;

-- 3. BACKFILL EXISTING CONVERSATIONS
-- Mark all support identifiers as chat_type = 'support'
UPDATE public.conversations
SET 
  chat_type = 'support',
  is_support = true
WHERE 
  id = 'general-support'
  OR id = 'support-guest'
  OR id = 'help-support'
  OR id LIKE 'support-%'
  OR lower(coalesce(order_title, '')) LIKE '%support%'
  OR lower(coalesce(client_company, '')) LIKE '%support%';

-- Mark all order and direct inbox identifiers as chat_type = 'inbox'
UPDATE public.conversations
SET 
  chat_type = 'inbox',
  is_support = false
WHERE 
  id LIKE 'inbox-%'
  OR id LIKE 'order-%'
  OR id LIKE 'direct-%'
  OR id LIKE 'chat-%'
  OR order_id IS NOT NULL;

-- 4. BACKFILL EXISTING MESSAGES
-- Mark all support messages as chat_type = 'support'
UPDATE public.messages
SET 
  chat_type = 'support',
  is_support = true
WHERE 
  conversation_id = 'general-support'
  OR conversation_id = 'support-guest'
  OR conversation_id = 'help-support'
  OR conversation_id LIKE 'support-%'
  OR thread_id = 'general-support'
  OR thread_id = 'support-guest'
  OR thread_id = 'help-support'
  OR thread_id LIKE 'support-%'
  OR (metadata->>'isSupport')::boolean IS TRUE
  OR (metadata->>'is_support')::boolean IS TRUE
  OR (metadata->>'channel')::text = 'support';

-- Mark all non-support messages as chat_type = 'inbox'
UPDATE public.messages
SET 
  chat_type = 'inbox',
  is_support = false
WHERE 
  NOT (
    conversation_id = 'general-support'
    OR conversation_id = 'support-guest'
    OR conversation_id = 'help-support'
    OR conversation_id LIKE 'support-%'
    OR thread_id = 'general-support'
    OR thread_id = 'support-guest'
    OR thread_id = 'help-support'
    OR thread_id LIKE 'support-%'
    OR (metadata->>'isSupport')::boolean IS TRUE
    OR (metadata->>'is_support')::boolean IS TRUE
    OR (metadata->>'channel')::text = 'support'
  );

-- 5. COMPOSITE INDEXES FOR HIGH-PERFORMANCE CHANNEL FILTERING
CREATE INDEX IF NOT EXISTS idx_conversations_chat_type_updated 
  ON public.conversations (chat_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_chat_type_email 
  ON public.conversations (chat_type, client_email);

CREATE INDEX IF NOT EXISTS idx_messages_chat_type_created 
  ON public.messages (chat_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conv_chat_type_created 
  ON public.messages (conversation_id, chat_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_email_chat_type_created 
  ON public.messages (client_email, chat_type, created_at DESC);
