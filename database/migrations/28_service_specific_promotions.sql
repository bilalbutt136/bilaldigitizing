-- Migration 28: Granular Service-Specific Promotional Discounts
-- Adds support for individual, service-level discount management in site_config and orders

-- 1. Ensure orders table has first-class columns for discount tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS applied_promo_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_breakdown JSONB DEFAULT '{}'::jsonb;

-- 2. Seed default granular service promotional discount rates into site_config
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'service_discounts',
  '{"embroidery": 20, "vector": 10, "patch": 5, "enabled": true}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- 3. Also register serviceDiscounts key alias for seamless camelCase / snake_case compatibility
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'serviceDiscounts',
  '{"embroidery": 20, "vector": 10, "patch": 5, "enabled": true}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
