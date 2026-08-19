-- Migration: 09_notifications_and_chat_sync.sql
-- Description: Create notifications table and ensure realtime publication for notifications, orders, messages, and conversations

DO $$
BEGIN
    -- 1. Create notifications table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.notifications (
        id text PRIMARY KEY,
        user_id text,
        recipient_role text DEFAULT 'admin', -- 'admin', 'client', 'all'
        recipient_email text,
        title text NOT NULL,
        message text,
        type text DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
        link text,
        order_id text,
        read boolean DEFAULT false,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- 2. Add columns if table existed previously with older schema
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'order_id'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN order_id text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'recipient_role'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN recipient_role text DEFAULT 'admin';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'recipient_email'
    ) THEN
        ALTER TABLE public.notifications ADD COLUMN recipient_email text;
    END IF;
END $$;

-- 3. Create high-performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON public.notifications (lower(recipient_email));
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON public.notifications (recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- 4. Enable RLS (Row Level Security) with permissive service role policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Allow public and service access to notifications'
    ) THEN
        CREATE POLICY "Allow public and service access to notifications" 
        ON public.notifications FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Add tables to supabase_realtime publication if not already added
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;
END $$;
