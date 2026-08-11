-- Migration: Create CMS Tables for Home Page

-- 1. home_page_settings (Key-Value Store)
CREATE TABLE IF NOT EXISTS public.home_page_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.home_page_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.home_page_settings FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.home_page_settings FOR ALL USING (auth.role() = 'authenticated'::text);

-- 2. home_page_slides (Hero Showcases)
CREATE TABLE IF NOT EXISTS public.home_page_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key TEXT NOT NULL,
    preview_title TEXT,
    preview_tag TEXT,
    preview_tag_after TEXT,
    preview_before_img TEXT,
    preview_after_img TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.home_page_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.home_page_slides FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.home_page_slides FOR ALL USING (auth.role() = 'authenticated'::text);

-- 3. trust_stats
CREATE TABLE IF NOT EXISTS public.trust_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    icon TEXT,
    suffix TEXT,
    is_static BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trust_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.trust_stats FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.trust_stats FOR ALL USING (auth.role() = 'authenticated'::text);

-- 4. trust_features (Why Choose Us Cards)
CREATE TABLE IF NOT EXISTS public.trust_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.trust_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.trust_features FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.trust_features FOR ALL USING (auth.role() = 'authenticated'::text);

-- 5. workflow_steps
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL, -- 'embroidery', 'vector', 'patch'
    step_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.workflow_steps FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.workflow_steps FOR ALL USING (auth.role() = 'authenticated'::text);

-- 6. pricing_static_cards (The 3 main cards on 'All Services')
CREATE TABLE IF NOT EXISTS public.pricing_static_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key TEXT NOT NULL,
    title TEXT NOT NULL,
    price_value TEXT,
    price_label TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    button_text TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pricing_static_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.pricing_static_cards FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.pricing_static_cards FOR ALL USING (auth.role() = 'authenticated'::text);

-- 7. pricing_tiers (The specific packages)
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL, -- 'embroidery', 'vector', 'patch'
    tier_name TEXT NOT NULL,
    price TEXT,
    turnaround TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    popular BOOLEAN DEFAULT false,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.pricing_tiers FOR ALL USING (auth.role() = 'authenticated'::text);

-- 8. vector_format_options
CREATE TABLE IF NOT EXISTS public.vector_format_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vector_format_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.vector_format_options FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.vector_format_options FOR ALL USING (auth.role() = 'authenticated'::text);

-- Seed some default values into home_page_settings to prevent breaking the frontend before Admin sets them up
INSERT INTO public.home_page_settings (key, value) VALUES
('hero_title', '"Premium Embroidery, Vector Art & Patches"'),
('hero_rotating_texts', '"Commercial Embroidery, Scalable Vector Art, Custom Physical Patches"'),
('hero_badge_1', '"1,200+ Clients"'),
('hero_badge_2', '"45+ Countries"'),
('hero_badge_3', '"4-Hr Express"'),
('hero_badge_4', '"100% Guaranteed"'),
('tab_all', '"All Services"'),
('tab_embroidery', '"Embroidery"'),
('tab_vector', '"Vector Art"'),
('tab_patches', '"Patches"'),
('why_title', '"Why Choose BDigitizing?"'),
('why_sub', '"Industry-leading quality, unmatched speed..."'),
('workflow_pill', '"Seamless Step-by-Step Process"'),
('workflow_title', '"How It Works"'),
('port_pill', '"Our Work"'),
('port_title', '"Crafted with Precision"'),
('port_desc', '"Explore a curated selection of our finest..."'),
('port_btn', '"View Full Portfolio"'),
('test_pill', '"Client Verification"'),
('test_title', '"Trusted by 1,200+ Apparel Decorators"'),
('faq_title', '"Frequently Asked Questions"'),
('price_pill', '"Clear & Transparent Pricing"'),
('price_title', '"Choose Your Service/Package"'),
('price_footer', '"Prices are per design. Mixing services?..."'),
('cta_pill', '"🚀 Ready to Get Started?"'),
('cta_title', '"Transform Your Designs Into..."'),
('cta_btn1', '"Start Digitizing Now"'),
('cta_btn2', '"Get Free Quote"'),
('emb_pill', '"Dedicated Embroidery Digitizing Studio"'),
('emb_title', '"Custom Embroidery Digitizing Services"'),
('vec_pill', '"Dedicated Vector Redraw Studio"'),
('vec_title', '"Custom Vector Art Conversion & Redraws"'),
('patch_pill', '"DEDICATED CUSTOM PATCHES & EMBLEMS STUDIO"'),
('patch_title', '"Custom Woven, Embroidered & 3D PVC Patches"')
ON CONFLICT (key) DO NOTHING;
