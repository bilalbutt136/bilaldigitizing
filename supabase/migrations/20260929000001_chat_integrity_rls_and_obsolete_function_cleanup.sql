-- Production integrity, performance, and RLS hardening discovered during the 2026-09-29 audit.
-- Browser clients keep scoped SELECT access for Supabase Realtime; all chat writes stay server-routed.

-- 1. Remove a stale helper created when conversation IDs were UUIDs.
-- The current conversations table uses text IDs and separate admin/client unread counters.
DROP FUNCTION IF EXISTS public.increment_unread_count(uuid);
DROP FUNCTION IF EXISTS public.increment_unread_count(text);

-- 2. Harden the shared admin predicate.
-- user_metadata is intentionally NOT trusted because end users can modify it.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  IF lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'bilalsadiq612@gmail.com',
    'bilalbutt136@gmail.com',
    'admin@bdigitizing.com',
    'support@bdigitizing.com'
  ) THEN
    RETURN true;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ) THEN
    RETURN true;
  END IF;

  IF coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
     OR coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin'), 'false') = 'true' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- 3. Replace permissive chat policies left by the September chat-table rebuild.
DROP POLICY IF EXISTS "Conversations access policy" ON public.conversations;
DROP POLICY IF EXISTS "Messages access policy" ON public.messages;
DROP POLICY IF EXISTS "Saved replies access policy" ON public.saved_replies;

DROP POLICY IF EXISTS "Authenticated users can read own conversations" ON public.conversations;
CREATE POLICY "Authenticated users can read own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  lower(client_email) = public.current_user_email()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Authenticated users can read own messages" ON public.messages;
CREATE POLICY "Authenticated users can read own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  lower(client_email) = public.current_user_email()
  OR public.is_admin()
);

DROP POLICY IF EXISTS "Admins can read saved replies" ON public.saved_replies;
CREATE POLICY "Admins can read saved replies"
ON public.saved_replies
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 4. Match indexes to the case-insensitive ownership predicates and hot unread inbox filters.
CREATE INDEX IF NOT EXISTS idx_conversations_client_email_lower
  ON public.conversations (lower(client_email));

CREATE INDEX IF NOT EXISTS idx_messages_client_email_lower
  ON public.messages (lower(client_email));

CREATE INDEX IF NOT EXISTS idx_conversations_unread_admin_last_message
  ON public.conversations (last_message_at DESC)
  WHERE unread_admin_count > 0;

CREATE INDEX IF NOT EXISTS idx_conversations_unread_client_last_message
  ON public.conversations (last_message_at DESC)
  WHERE unread_client_count > 0;
