-- Migration 04: Seed default contact info and promotion settings into site_config
-- These are key-value pairs that the admin can manage from the CMS

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
