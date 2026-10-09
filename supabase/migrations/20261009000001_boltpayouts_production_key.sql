-- Migration to guarantee production BoltPayouts payment gateway configuration
-- is present in the service-only private_server_config store.

INSERT INTO public.private_server_config (key, value, updated_at)
VALUES (
  'boltpayouts_config',
  jsonb_build_object(
    'apiKey', 'cd14fcea-a2fe-4b9e-bd27-156ee291851f',
    'isActive', true
  ),
  timezone('utc'::text, now())
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;
