-- Migration: 20260922000002_push_subscriptions.sql
-- Description: Create push_subscriptions table for Native Mobile & Desktop Web Push Notifications

DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.push_subscriptions (
        id text PRIMARY KEY,
        user_id text,
        user_email text,
        role text DEFAULT 'client', -- 'admin', 'client', 'guest'
        endpoint text UNIQUE NOT NULL,
        p256dh text NOT NULL,
        auth text NOT NULL,
        user_agent text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'push_subscriptions' AND column_name = 'user_email'
    ) THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN user_email text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'push_subscriptions' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.push_subscriptions ADD COLUMN role text DEFAULT 'client';
    END IF;
END $$;

-- High-performance indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON public.push_subscriptions (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON public.push_subscriptions (role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON public.push_subscriptions (created_at DESC);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Allow public and service access to push_subscriptions'
    ) THEN
        CREATE POLICY "Allow public and service access to push_subscriptions" 
        ON public.push_subscriptions FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
