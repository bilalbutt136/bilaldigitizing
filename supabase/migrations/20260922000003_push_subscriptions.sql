-- Push Notifications Subscription Storage for Web Push & Mobile Lock Screen Alerts
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    role TEXT DEFAULT 'client',
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for speedy lookups by user and role
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON public.push_subscriptions (user_email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_role ON public.push_subscriptions (role);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions (endpoint);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public/authenticated insert & upsert
DROP POLICY IF EXISTS "Allow anon and auth users to manage push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow anon and auth users to manage push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_push_subscriptions_modtime ON public.push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_modtime
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_modtime();
