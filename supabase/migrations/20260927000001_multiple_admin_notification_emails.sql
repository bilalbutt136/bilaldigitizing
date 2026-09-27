-- Migration: Seed and Support Multiple Admin Notification Emails in site_config
-- Created: 2026-09-27

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

-- Seed default admin_notification_emails if not present
INSERT INTO public.site_config (key, value, updated_at)
VALUES (
    'admin_notification_emails',
    '["bilalsadiq612@gmail.com"]',
    timezone('utc'::text, now())
)
ON CONFLICT (key) DO NOTHING;
