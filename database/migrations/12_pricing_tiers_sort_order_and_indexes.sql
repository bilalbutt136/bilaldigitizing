-- Migration: 12_pricing_tiers_sort_order_and_indexes.sql
-- Description: Synchronize pricing_tiers sort_order and display_order, add performance indexes across high-traffic tables.

DO $$
BEGIN
    -- 1. Ensure sort_order column exists on pricing_tiers and syncs with display_order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'pricing_tiers' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE public.pricing_tiers ADD COLUMN sort_order integer DEFAULT 0;
        UPDATE public.pricing_tiers SET sort_order = COALESCE(display_order, 0);
    END IF;

    -- Ensure display_order exists if table was created with sort_order
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'pricing_tiers' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE public.pricing_tiers ADD COLUMN display_order integer DEFAULT 0;
        UPDATE public.pricing_tiers SET display_order = COALESCE(sort_order, 0);
    END IF;
END $$;

-- 2. Performance indexes on pricing_tiers
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_sort_order ON public.pricing_tiers (sort_order);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_display_order ON public.pricing_tiers (display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_service_type ON public.pricing_tiers (service_type);

-- 3. Composite & lookup indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_client_email_status ON public.orders (lower(client_email), status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);

-- 4. Lookup indexes for messages & conversations
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages (is_read);

-- 5. Indexes for custom offers & notifications
CREATE INDEX IF NOT EXISTS idx_custom_offers_status ON public.custom_offers (status);
CREATE INDEX IF NOT EXISTS idx_custom_offers_expires_at ON public.custom_offers (expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications (lower(recipient_email), read) WHERE read = false;
