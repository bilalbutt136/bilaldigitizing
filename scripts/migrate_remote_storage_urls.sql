-- Migration: Update all legacy Supabase project references to active production project
-- Replaces old ref 'qkgvgrscjlijajuzouke' with active ref 'ffhjpbbwenolqaguqdiz'

-- 1. hero_slides
UPDATE public.hero_slides
SET banner_image = replace(banner_image, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE banner_image LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.hero_slides
SET trust_points = replace(trust_points::text, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')::jsonb
WHERE trust_points::text LIKE '%qkgvgrscjlijajuzouke%';

-- 2. home_page_settings
UPDATE public.home_page_settings
SET value = replace(value::text, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')::jsonb
WHERE value::text LIKE '%qkgvgrscjlijajuzouke%';

-- Normalize site_settings branding in home_page_settings
UPDATE public.home_page_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      value,
      '{logoUrl}',
      '"/logo.png"'
    ),
    '{headerLogoUrl}',
    '"/logo.png"'
  ),
  '{ogImageUrl}',
  '"/icon-512x512.png"'
)
WHERE key = 'site_settings';

-- 3. messages
UPDATE public.messages
SET attachment_url = replace(attachment_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE attachment_url LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.messages
SET attachments = replace(attachments::text, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')::jsonb
WHERE attachments::text LIKE '%qkgvgrscjlijajuzouke%';

-- 4. order_files
UPDATE public.order_files
SET file_url = replace(file_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE file_url LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.order_files
SET public_url = replace(public_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE public_url LIKE '%qkgvgrscjlijajuzouke%';

-- 5. orders
UPDATE public.orders
SET artwork_url = replace(artwork_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE artwork_url LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.orders
SET image_url = replace(image_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE image_url LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.orders
SET logo = replace(logo, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE logo LIKE '%qkgvgrscjlijajuzouke%';

UPDATE public.orders
SET notes = replace(notes, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE notes LIKE '%qkgvgrscjlijajuzouke%';

-- 6. portfolio
UPDATE public.portfolio
SET digitized_image = replace(digitized_image, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE digitized_image LIKE '%qkgvgrscjlijajuzouke%';

-- 7. worker_profiles
UPDATE public.worker_profiles
SET portfolio_sample_url = replace(portfolio_sample_url, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')
WHERE portfolio_sample_url LIKE '%qkgvgrscjlijajuzouke%';

-- 8. site_config
-- Sync site_settings from home_page_settings to restore clean structure
UPDATE public.site_config s
SET value = h.value
FROM public.home_page_settings h
WHERE s.key = 'site_settings' AND h.key = 'site_settings';

UPDATE public.site_config
SET value = replace(value::text, 'qkgvgrscjlijajuzouke', 'ffhjpbbwenolqaguqdiz')::jsonb
WHERE value::text LIKE '%qkgvgrscjlijajuzouke%';
