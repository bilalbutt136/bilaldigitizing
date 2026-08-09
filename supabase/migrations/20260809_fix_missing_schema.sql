-- Fix Missing Columns in Catalog Tables for Supabase Upserts & Sorting

ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.pricing_cards ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.pricing_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.patch_cards ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.patch_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.patch_cards ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.portfolio ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.sew_outs ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.sew_outs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.hero_slides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.digitizers ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.digitizers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create Tracking Events Table
CREATE TABLE IF NOT EXISTS public.tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_role TEXT,
    source TEXT,
    traffic_source TEXT,
    value TEXT,
    page_path TEXT,
    event_time TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
-- Anyone can insert a tracking event (public analytics)
CREATE POLICY tracking_events_insert_all ON public.tracking_events FOR INSERT WITH CHECK (true);
-- Only admins can read tracking events
CREATE POLICY tracking_events_read_admin ON public.tracking_events FOR SELECT USING (public.is_admin());

-- Create Store Products Table (if not exists)
CREATE TABLE IF NOT EXISTS public.store_products (
    id TEXT PRIMARY KEY,
    category TEXT,
    title TEXT,
    price TEXT,
    unit TEXT,
    min_quantity INT DEFAULT 1,
    badge TEXT,
    status TEXT DEFAULT 'active',
    image TEXT,
    description TEXT,
    sizes TEXT[],
    colors TEXT[],
    features TEXT[],
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY store_products_read_all ON public.store_products FOR SELECT USING (true);
