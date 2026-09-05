-- Migration: Seed Admin Email Notification Settings into site_config
-- Created: 2026-09-05

CREATE TABLE IF NOT EXISTS public.site_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- Seed default notification settings if not present
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
    'admin_notification_email',
    'shahidbutt59191@gmail.com',
    timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_config (key, value, updated_at)
VALUES (
    'notification_settings',
    '{"adminEmail":"shahidbutt59191@gmail.com","orderAlerts":true,"messageAlerts":true,"revisionAlerts":true,"deliveryAlerts":true,"updatedAt":"2026-09-05T00:00:00.000Z"}',
    timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;
