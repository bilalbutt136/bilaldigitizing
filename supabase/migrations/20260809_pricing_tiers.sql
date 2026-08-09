-- Migration: Create Pricing Tiers Table
-- Allows dynamic pricing and service features

-- Drop table if it exists to ensure a clean slate since previous schema may conflict
DROP TABLE IF EXISTS public.pricing_tiers;

CREATE TABLE public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL CHECK (service_type IN ('embroidery', 'vector_art', 'patches')),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge_text TEXT,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    price_unit TEXT,
    turnaround_time TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    button_text TEXT DEFAULT 'Order Now',
    is_popular BOOLEAN DEFAULT false,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

-- Read access for everyone
CREATE POLICY pricing_tiers_read_all ON public.pricing_tiers FOR SELECT USING (true);

-- Write access for admins only
CREATE POLICY pricing_tiers_admin_write ON public.pricing_tiers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Pre-seed default values for Embroidery
INSERT INTO public.pricing_tiers (service_type, title, subtitle, badge_text, price, price_unit, turnaround_time, features, button_text, is_popular, display_order)
VALUES 
('embroidery', 'Standard Digitizing', 'For most logos and designs', 'Starting rate per design', 10.00, '/ design', '12-24 hr turnaround', '["DST, PES, EMB machine formats", "Free unlimited revisions", "Standard 12-24 hr turnaround", "Custom underlay & pull compensation"]'::jsonb, 'Order Digitizing', false, 1);

-- Pre-seed default values for Vector Art
INSERT INTO public.pricing_tiers (service_type, title, subtitle, badge_text, price, price_unit, turnaround_time, features, button_text, is_popular, display_order)
VALUES 
('vector_art', 'Vector Conversion', 'Raster to crisp vector', 'Starting flat rate', 15.00, '/ design', '12-24 hr turnaround', '["AI, EPS, SVG, PDF master formats", "100% Hand-drawn node paths", "Pantone spot color separation", "Zero auto-trace distortion"]'::jsonb, 'Order Vector Art', false, 1);

-- Pre-seed default values for Patches
INSERT INTO public.pricing_tiers (service_type, title, subtitle, badge_text, price, price_unit, turnaround_time, features, button_text, is_popular, display_order)
VALUES 
('patches', 'Custom Patches', 'Physical patches', 'Starting rate per patch', 1.50, '/ patch', '1-2 weeks', '["Embroidered, Woven, PVC & Leather", "Velcro, Iron-On, or Sew-On backing", "Free physical sample photo", "Express physical shipping worldwide"]'::jsonb, 'Order Custom Patches', false, 1);
