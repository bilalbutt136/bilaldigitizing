-- Migration: 05_packages_full_control.sql
-- Description: Complete Admin Control for Services & Packages

-- 1. Ensure pricing_tiers columns exist
ALTER TABLE public.pricing_tiers
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '$',
  ADD COLUMN IF NOT EXISTS button_link TEXT DEFAULT '/order',
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update service_type check constraint to be flexible
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pricing_tiers_service_type_check'
  ) THEN
    ALTER TABLE public.pricing_tiers DROP CONSTRAINT pricing_tiers_service_type_check;
  END IF;
END $$;

-- 3. Ensure RLS policies are permissive for public read and authenticated/admin write
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_tiers' AND policyname = 'pricing_tiers_read_all'
  ) THEN
    CREATE POLICY pricing_tiers_read_all ON public.pricing_tiers FOR SELECT USING (true);
  END IF;
END $$;
