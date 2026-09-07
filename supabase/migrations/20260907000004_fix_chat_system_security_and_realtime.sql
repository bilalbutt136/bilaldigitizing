-- Migration: 20260907000004_fix_chat_system_security_and_realtime.sql
-- Description: Add order_messages to realtime publication and secure messages/conversations RLS

-- 1. Ensure order_messages is in the supabase_realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'order_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
    END IF;
END $$;

ALTER TABLE public.order_messages REPLICA IDENTITY FULL;

-- 2. Drop the insecure universal open policies
DROP POLICY IF EXISTS messages_universal_select ON public.messages;
DROP POLICY IF EXISTS conversations_universal_all ON public.conversations;

-- 3. Ensure Row Level Security is active
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 4. Secure SELECT policy for messages
DROP POLICY IF EXISTS messages_secure_select ON public.messages;
CREATE POLICY messages_secure_select ON public.messages
    FOR SELECT
    USING (
        -- Service role / superuser bypass
        auth.role() = 'service_role'
        OR
        -- Authenticated client can read their own messages
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND (
                lower(client_email) = lower(auth.jwt() ->> 'email')
                OR lower(sender) = lower(auth.jwt() ->> 'email')
            )
        )
        OR
        -- Staff, Admin, or Digitizer access
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    );

-- 5. Secure INSERT policy for messages
DROP POLICY IF EXISTS messages_secure_insert ON public.messages;
CREATE POLICY messages_secure_insert ON public.messages
    FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND lower(client_email) = lower(auth.jwt() ->> 'email')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    );

-- 6. Secure UPDATE policy for messages (e.g. marking as read)
DROP POLICY IF EXISTS messages_secure_update ON public.messages;
CREATE POLICY messages_secure_update ON public.messages
    FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND lower(client_email) = lower(auth.jwt() ->> 'email')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    );

-- 7. Secure policies for conversations
DROP POLICY IF EXISTS conversations_secure_select ON public.conversations;
CREATE POLICY conversations_secure_select ON public.conversations
    FOR SELECT
    USING (
        auth.role() = 'service_role'
        OR
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND lower(client_email) = lower(auth.jwt() ->> 'email')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    );

DROP POLICY IF EXISTS conversations_secure_all ON public.conversations;
CREATE POLICY conversations_secure_all ON public.conversations
    FOR ALL
    USING (
        auth.role() = 'service_role'
        OR
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND lower(client_email) = lower(auth.jwt() ->> 'email')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR
        (
            auth.jwt() ->> 'email' IS NOT NULL 
            AND lower(client_email) = lower(auth.jwt() ->> 'email')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE lower(u.email) = lower(auth.jwt() ->> 'email') 
            AND u.role IN ('admin', 'staff', 'super_admin', 'worker', 'digitizer')
        )
    );
