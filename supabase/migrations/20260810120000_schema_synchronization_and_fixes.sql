-- Migration: 20260810120000_schema_synchronization_and_fixes.sql
-- Description: Synchronize schema with application codebase, fix column mismatches, drop legacy tables, and tighten RLS.

-- 1. Add order_id to public.invoices if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'order_id'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN order_id text;
        CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
    END IF;
END $$;

-- 2. Add updated_at to public.clients if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- 3. Enhance public.order_messages with sender_role and attachments JSONB support, and ensure sender_name has a default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'sender_role'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN sender_role text DEFAULT 'client';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'attachments'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
    END IF;

    ALTER TABLE public.order_messages ALTER COLUMN sender_name SET DEFAULT 'Client';
END $$;

-- 4. Drop obsolete / dead legacy tables if they exist
DROP TABLE IF EXISTS public.portfolio_items CASCADE;
DROP TABLE IF EXISTS public.test_table CASCADE;

-- 5. Seed Master Admin in public.admins if missing
INSERT INTO public.admins (email, name)
VALUES ('shahidbutt59191@gmail.com', 'Shahid Butt')
ON CONFLICT (email) DO UPDATE 
SET name = COALESCE(public.admins.name, EXCLUDED.name);

-- 6. Tighten Row Level Security (RLS) on sensitive messaging tables

-- Conversations RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on conversations" ON public.conversations;
DROP POLICY IF EXISTS conversations_access_policy ON public.conversations;

CREATE POLICY conversations_access_policy ON public.conversations
    FOR ALL
    USING (
        public.is_admin() OR 
        lower(client_email) = public.current_user_email()
    )
    WITH CHECK (
        public.is_admin() OR 
        lower(client_email) = public.current_user_email()
    );

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on messages" ON public.messages;
DROP POLICY IF EXISTS messages_access_policy ON public.messages;

CREATE POLICY messages_access_policy ON public.messages
    FOR ALL
    USING (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (lower(c.client_email) = public.current_user_email() OR public.is_admin())
        )
    )
    WITH CHECK (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (lower(c.client_email) = public.current_user_email() OR public.is_admin())
        )
    );

-- Order Messages RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read/write on order_messages" ON public.order_messages;
DROP POLICY IF EXISTS order_messages_secure_access ON public.order_messages;

CREATE POLICY order_messages_secure_access ON public.order_messages
    FOR ALL
    USING (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_messages.order_id
            AND (o.user_id = auth.uid() OR lower(o.client_email) = public.current_user_email())
        )
    )
    WITH CHECK (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_messages.order_id
            AND (o.user_id = auth.uid() OR lower(o.client_email) = public.current_user_email())
        )
    );
