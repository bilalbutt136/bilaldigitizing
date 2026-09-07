-- ==============================================================================
-- MIGRATION: 20_automated_email_notifications.sql
-- Description: Automated Email Notifications for New Messages & Orders
-- 1. Creates public.email_notification_logs for bulletproof audit & retry tracking.
-- 2. Sets up webhook secrets & endpoints in public.site_config.
-- 3. Configures triggers & asynchronous pg_net dispatch on public.messages and public.orders.
-- ==============================================================================

-- 1. ENABLE PG_NET EXTENSION (Supabase Asynchronous HTTP Client)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_net extension could not be initialized or already exists.';
END $$;

-- 2. AUDIT & RETRY QUEUE TABLE: public.email_notification_logs
CREATE TABLE IF NOT EXISTS public.email_notification_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL, -- 'new_message', 'new_order', 'order_status_update'
    recipient_email text NOT NULL,
    recipient_name text,
    sender_name text,
    subject text,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'rate_limited', 'bypassed'
    attempts integer DEFAULT 0,
    resend_id text,
    error_message text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist in case table was created with older schema
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS recipient_name text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS attempts integer DEFAULT 0;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS resend_id text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now());
ALTER TABLE public.email_notification_logs ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now());

-- High-performance indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_notification_logs (lower(recipient_email));
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_notification_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_notification_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON public.email_notification_logs (event_type);

-- Row Level Security
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'email_notification_logs' AND policyname = 'Allow public and service access to email_notification_logs'
    ) THEN
        CREATE POLICY "Allow public and service access to email_notification_logs" 
        ON public.email_notification_logs FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- 3. SEED DEFAULT WEBHOOK SETTINGS IN SITE_CONFIG
CREATE TABLE IF NOT EXISTS public.site_config (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.site_config (key, value, updated_at)
VALUES 
    ('notification_webhook_secret', '"bd_sec_live_notification_trigger_9831"', timezone('utc'::text, now())),
    ('notification_webhook_url', '"https://bilaldigitizing.vercel.app/api/send-notification"', timezone('utc'::text, now()))
ON CONFLICT (key) DO NOTHING;

-- 4. FUNCTION: Trigger Email Notification on New Message
CREATE OR REPLACE FUNCTION public.fn_notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_recipient_email text;
    v_recipient_name text := 'Customer';
    v_sender_name text;
    v_endpoint_url text := 'https://bilaldigitizing.vercel.app/api/send-notification';
    v_webhook_secret text := 'bd_sec_live_notification_trigger_9831';
    v_payload jsonb;
    v_admin_email text := 'shahidbutt59191@gmail.com';
    v_conv_record RECORD;
    v_clean_url text;
    v_clean_secret text;
BEGIN
    -- Read dynamic webhook URL and secret from site_config if present
    SELECT TRIM(BOTH '"' FROM value) INTO v_clean_url FROM public.site_config WHERE key = 'notification_webhook_url';
    IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
        v_endpoint_url := v_clean_url;
    END IF;

    SELECT TRIM(BOTH '"' FROM value) INTO v_clean_secret FROM public.site_config WHERE key = 'notification_webhook_secret';
    IF v_clean_secret IS NOT NULL AND length(v_clean_secret) > 4 THEN
        v_webhook_secret := v_clean_secret;
    END IF;

    -- Read dynamic admin notification email
    SELECT TRIM(BOTH '"' FROM value) INTO v_admin_email FROM public.site_config WHERE key = 'admin_notification_email';
    IF v_admin_email IS NULL OR length(v_admin_email) < 5 THEN
        v_admin_email := 'shahidbutt59191@gmail.com';
    END IF;

    -- Resolve sender name
    v_sender_name := COALESCE(NEW.sender_name, 'Client');

    -- Resolve recipient based on sender
    IF LOWER(COALESCE(NEW.sender, 'client')) = 'client' THEN
        -- Client sent message -> Notify Admin
        v_recipient_email := v_admin_email;
        v_recipient_name := 'Studio Admin';
    ELSE
        -- Admin / Support sent message -> Notify Client
        v_recipient_email := NEW.client_email;
        
        -- If client_email not directly on message, look up conversation
        IF v_recipient_email IS NULL OR v_recipient_email = '' THEN
            SELECT client_email, client_name INTO v_conv_record 
            FROM public.conversations 
            WHERE id = NEW.conversation_id 
            LIMIT 1;

            IF FOUND THEN
                v_recipient_email := v_conv_record.client_email;
                IF v_conv_record.client_name IS NOT NULL THEN
                    v_recipient_name := v_conv_record.client_name;
                END IF;
            END IF;
        END IF;
    END IF;

    -- Validate recipient email format before dispatch
    IF v_recipient_email IS NULL OR v_recipient_email NOT LIKE '%@%.%' THEN
        RETURN NEW;
    END IF;

    -- Construct payload
    v_payload := jsonb_build_object(
        'event', 'new_message',
        'message_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'sender', NEW.sender,
        'sender_name', v_sender_name,
        'recipient_email', v_recipient_email,
        'recipient_name', v_recipient_name,
        'client_email', NEW.client_email,
        'text', COALESCE(NEW.text, ''),
        'attachment_name', COALESCE(NEW.attachment_name, NEW.attachment),
        'attachment_url', NEW.attachment_url,
        'type', COALESCE(NEW.type, 'text'),
        'created_at', NEW.created_at
    );

    -- Asynchronous HTTP dispatch via pg_net (Safe, Non-Blocking)
    BEGIN
        PERFORM net.http_post(
            url := v_endpoint_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', v_webhook_secret
            ),
            body := v_payload,
            timeout_milliseconds := 5000
        );
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[fn_notify_new_message] Notice dispatching webhook: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger on public.messages
DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_new_message();

-- 5. FUNCTION: Trigger Email Notification on New Order
CREATE OR REPLACE FUNCTION public.fn_notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    v_endpoint_url text := 'https://bilaldigitizing.vercel.app/api/send-notification';
    v_webhook_secret text := 'bd_sec_live_notification_trigger_9831';
    v_admin_email text := 'shahidbutt59191@gmail.com';
    v_payload jsonb;
    v_clean_url text;
    v_clean_secret text;
BEGIN
    -- Read dynamic webhook URL and secret from site_config if present
    SELECT TRIM(BOTH '"' FROM value) INTO v_clean_url FROM public.site_config WHERE key = 'notification_webhook_url';
    IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
        v_endpoint_url := v_clean_url;
    END IF;

    SELECT TRIM(BOTH '"' FROM value) INTO v_clean_secret FROM public.site_config WHERE key = 'notification_webhook_secret';
    IF v_clean_secret IS NOT NULL AND length(v_clean_secret) > 4 THEN
        v_webhook_secret := v_clean_secret;
    END IF;

    -- Read dynamic admin notification email
    SELECT TRIM(BOTH '"' FROM value) INTO v_admin_email FROM public.site_config WHERE key = 'admin_notification_email';
    IF v_admin_email IS NULL OR length(v_admin_email) < 5 THEN
        v_admin_email := 'shahidbutt59191@gmail.com';
    END IF;

    -- Construct payload
    v_payload := jsonb_build_object(
        'event', 'new_order',
        'order_id', NEW.id,
        'client_name', NEW.client_name,
        'client_email', NEW.client_email,
        'admin_email', v_admin_email,
        'service_category', NEW.service_category,
        'service_type', NEW.service_type,
        'placement_type', NEW.placement_type,
        'price', NEW.price,
        'notes', NEW.notes,
        'dimensions', NEW.dimensions,
        'created_at', NEW.created_at
    );

    -- Asynchronous HTTP dispatch via pg_net (Safe, Non-Blocking)
    BEGIN
        PERFORM net.http_post(
            url := v_endpoint_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'x-webhook-secret', v_webhook_secret
            ),
            body := v_payload,
            timeout_milliseconds := 5000
        );
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '[fn_notify_new_order] Notice dispatching webhook: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Trigger on public.orders
DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_new_order();
