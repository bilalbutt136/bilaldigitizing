-- Migration 04: Seed default contact info and promotion settings into site_config
CREATE TABLE IF NOT EXISTS public.site_config (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'site_config' AND policyname = 'site_config_read_all'
  ) THEN
    CREATE POLICY "site_config_read_all" ON public.site_config FOR SELECT USING (true);
  END IF;
END $$;

-- Default contact info
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'contactInfo',
  '{"email": "orders@bdigitizing-pro.com", "phone": "+1 (347) 915-4498", "whatsapp": "+1 (347) 915-4498", "businessHours": "24/7 Support — 365 Days", "address": "", "facebook": "", "instagram": "", "twitter": "", "linkedin": ""}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Default announcement bar settings
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'announcement',
  '{"enabled": false, "text": "", "linkUrl": "", "linkText": "", "bgColor": "#ff7a00", "textColor": "#ffffff"}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Default promotional banner settings
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
  'promotionalBanner',
  '{"enabled": false, "title": "", "description": "", "ctaText": "", "ctaLink": "", "bgColor": "#1e293b"}'::jsonb,
  NOW()
)
ON CONFLICT (key) DO NOTHING;
