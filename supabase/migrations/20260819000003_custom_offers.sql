-- Migration: 20260819000003_custom_offers.sql
-- Description: Create custom_offers table, add offer fields to messages, and configure realtime publication

DO $$
BEGIN
    -- 1. Create custom_offers table if not exists
    CREATE TABLE IF NOT EXISTS public.custom_offers (
        id text PRIMARY KEY,
        conversation_id text NOT NULL,
        order_id text,
        created_by text DEFAULT 'admin',
        client_name text NOT NULL,
        client_email text NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        service_type text NOT NULL DEFAULT 'Embroidery Digitizing',
        price numeric(10, 2) NOT NULL DEFAULT 0.00,
        discount_amount numeric(10, 2) DEFAULT 0.00,
        final_price numeric(10, 2) NOT NULL DEFAULT 0.00,
        delivery_time_text text DEFAULT '1 Day',
        delivery_days integer DEFAULT 1,
        revisions_allowed text DEFAULT '2',
        expires_in_hours integer DEFAULT 24,
        expires_at timestamptz NOT NULL,
        requires_requirements boolean DEFAULT true,
        status text NOT NULL DEFAULT 'sent', -- 'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'cancelled'
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    );

    -- 2. Add offer columns to messages table if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'offer_id'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN offer_id text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'offer_data'
    ) THEN
        ALTER TABLE public.messages ADD COLUMN offer_data jsonb;
    END IF;

    -- 3. Add offer columns to order_messages table if not present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'offer_id'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN offer_id text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'order_messages' AND column_name = 'offer_data'
    ) THEN
        ALTER TABLE public.order_messages ADD COLUMN offer_data jsonb;
    END IF;
END $$;

-- 4. Create high-performance indexes
CREATE INDEX IF NOT EXISTS idx_custom_offers_conversation_id ON public.custom_offers (conversation_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_client_email ON public.custom_offers (lower(client_email));
CREATE INDEX IF NOT EXISTS idx_custom_offers_order_id ON public.custom_offers (order_id);
CREATE INDEX IF NOT EXISTS idx_custom_offers_status ON public.custom_offers (status);
CREATE INDEX IF NOT EXISTS idx_custom_offers_created_at ON public.custom_offers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_offer_id ON public.messages (offer_id);

-- 5. Enable Row Level Security (RLS) with permissive access
ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'custom_offers' AND policyname = 'Allow public and service access to custom_offers'
    ) THEN
        CREATE POLICY "Allow public and service access to custom_offers" 
        ON public.custom_offers FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 6. Add custom_offers to supabase_realtime publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_offers;
    EXCEPTION WHEN duplicate_object THEN
        -- already added, ignore
    END;
END $$;
