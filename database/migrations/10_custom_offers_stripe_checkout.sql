-- Migration: 10_custom_offers_stripe_checkout.sql
-- Description: Ensure custom_offers table has thread_id, customer_id, stripe_session_id, delivery_days, and proper indexes.

DO $$
BEGIN
    -- 1. Create custom_offers table if not exists
    CREATE TABLE IF NOT EXISTS public.custom_offers (
        id text PRIMARY KEY,
        conversation_id text,
        thread_id text,
        order_id text,
        customer_id text,
        created_by text DEFAULT 'admin',
        client_name text NOT NULL DEFAULT 'Client',
        client_email text NOT NULL,
        title text NOT NULL,
        description text,
        service_type text NOT NULL DEFAULT 'Embroidery Digitizing',
        price numeric(10, 2) NOT NULL DEFAULT 0.00,
        discount_amount numeric(10, 2) DEFAULT 0.00,
        final_price numeric(10, 2) NOT NULL DEFAULT 0.00,
        delivery_time_text text DEFAULT '1 Day',
        delivery_days integer DEFAULT 1,
        revisions_allowed text DEFAULT '2',
        expires_in_hours integer DEFAULT 24,
        expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
        requires_requirements boolean DEFAULT true,
        status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'paid', 'accepted', 'declined', 'expired', 'cancelled'
        stripe_session_id text,
        accepted_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- Ensure thread_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'thread_id'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN thread_id text;
    END IF;

    -- Ensure customer_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN customer_id text;
    END IF;

    -- Ensure stripe_session_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN stripe_session_id text;
    END IF;

    -- Ensure delivery_days column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'delivery_days'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN delivery_days integer DEFAULT 1;
    END IF;

    -- Ensure accepted_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custom_offers' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE public.custom_offers ADD COLUMN accepted_at timestamptz;
    END IF;

    -- Enable RLS
    ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;

    -- Ensure permissive RLS policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'custom_offers' AND policyname = 'Allow public and service access to custom_offers'
    ) THEN
        CREATE POLICY "Allow public and service access to custom_offers" 
        ON public.custom_offers FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;

    -- Add custom_offers to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_offers;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;
END $$;

-- High performance indexes
CREATE INDEX IF NOT EXISTS idx_custom_offers_conversation_id ON public.custom_offers (conversation_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_thread_id ON public.custom_offers (thread_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_stripe_session ON public.custom_offers (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_client_email ON public.custom_offers (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_custom_offers_order_id ON public.custom_offers (order_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_status ON public.custom_offers (status);
CREATE INDEX IF NOT EXISTS idx_custom_offers_created_at ON public.custom_offers (created_at DESC);

-- Ensure messages table supports custom offer types and metadata
ALTER TABLE public.messages 
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS offer_id TEXT,
    ADD COLUMN IF NOT EXISTS offer_data JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages (offer_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages (type);

