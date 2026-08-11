-- 03_add_category_to_services.sql
-- Add category column to public.services and normalize category values across catalog tables

-- 1. Ensure category column exists on public.services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category text DEFAULT 'embroidery';

-- 2. Populate categories for default services
UPDATE public.services SET category = 'embroidery' WHERE id = 'embroidery-digitizing' OR title ILIKE '%embroidery%';
UPDATE public.services SET category = 'vector-art' WHERE id = 'vector-tracing' OR title ILIKE '%vector%';
UPDATE public.services SET category = 'patches' WHERE id = 'custom-patches' OR title ILIKE '%patch%';
UPDATE public.services SET category = 'embroidery' WHERE category IS NULL OR category = '';

-- 3. Ensure pricing_cards have valid category values
UPDATE public.pricing_cards SET category = 'embroidery' WHERE category IS NULL OR category = '' OR category = 'all';

-- 4. Ensure patch_cards have category = 'patches'
UPDATE public.patch_cards SET category = 'patches' WHERE category IS NULL OR category = '';

-- 5. Normalize pricing_tiers service_type
UPDATE public.pricing_tiers SET service_type = 'vector-art' WHERE service_type = 'vector_art' OR service_type = 'vector';
UPDATE public.pricing_tiers SET service_type = 'patches' WHERE service_type = 'patch';
