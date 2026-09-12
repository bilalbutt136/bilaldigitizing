-- Migration: 26_clean_and_isolate_inbox_support_threads.sql
-- Description: Migrates legacy 'conv-' threads to 'inbox-', removes obsolete duplicates, and strictly isolates inbox and support threads.

-- 1. Migrate messages with legacy 'conv-' prefix to 'inbox-'
UPDATE public.messages
SET conversation_id = replace(conversation_id, 'conv-', 'inbox-'),
    thread_id = replace(thread_id, 'conv-', 'inbox-')
WHERE conversation_id LIKE 'conv-%'
   OR thread_id LIKE 'conv-%';

-- 2. Migrate custom_offers with legacy 'conv-' prefix to 'inbox-'
UPDATE public.custom_offers
SET conversation_id = replace(conversation_id, 'conv-', 'inbox-'),
    thread_id = replace(thread_id, 'conv-', 'inbox-')
WHERE conversation_id LIKE 'conv-%'
   OR thread_id LIKE 'conv-%';

-- 3. Delete obsolete 'conv-' rows from conversations table
DELETE FROM public.conversations
WHERE id LIKE 'conv-%';

-- 4. Ensure all inbox threads have the 'inbox' tag
UPDATE public.conversations
SET tags = ARRAY['inbox']
WHERE (id LIKE 'inbox-%' OR tags IS NULL OR cardinality(tags) = 0)
  AND id NOT LIKE 'support-%'
  AND id != 'general-support'
  AND id != 'help-support';

-- 5. Ensure all support threads have the 'support' tag
UPDATE public.conversations
SET tags = ARRAY['support']
WHERE id LIKE 'support-%'
   OR id = 'general-support'
   OR id = 'help-support';
