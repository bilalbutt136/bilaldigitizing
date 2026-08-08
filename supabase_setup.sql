-- ==========================================
-- SUPABASE DATABASE SETUP & FIX SCRIPT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create missing CMS tables (Fixes 404 errors)
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id text PRIMARY KEY,
    label text,
    badge text,
    title text,
    highlight text,
    description text,
    "primaryCta" text,
    "secondaryCta" text,
    preview_after text,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id text PRIMARY KEY,
    title text,
    rate text,
    features jsonb,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.patch_cards (
    id text PRIMARY KEY,
    title text,
    rate text,
    features jsonb,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id text PRIMARY KEY,
    title text,
    category text,
    image text,
    details text,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.digitizers (
    id text PRIMARY KEY,
    name text,
    status text,
    capacity integer,
    avatar text,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.cms_content (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Fix Clients Table RLS Policies (Fixes 403 / RLS Insert errors)
-- First ensure RLS is enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own client record during signup
CREATE POLICY "Users can insert their own client record" 
ON public.clients FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own client record
CREATE POLICY "Users can view their own client record" 
ON public.clients FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to update their own client record
CREATE POLICY "Users can update their own client record" 
ON public.clients FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow admins full access to clients table
CREATE POLICY "Admins have full access to clients" 
ON public.clients FOR ALL 
USING (auth.role() = 'authenticated');

-- 3. Open CMS tables for reading by anyone (public website)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.hero_slides FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.hero_slides FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.pricing_tiers FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.patch_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.patch_cards FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.patch_cards FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.portfolio_items FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.digitizers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.digitizers FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.digitizers FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.cms_content FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON public.cms_content FOR ALL USING (auth.role() = 'authenticated');
