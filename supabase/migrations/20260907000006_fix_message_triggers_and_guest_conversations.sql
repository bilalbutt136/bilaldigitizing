-- Migration: 20260907000006_fix_message_triggers_and_guest_conversations.sql
-- Description: Fix btrim(jsonb, unknown) error on message and order triggers, and allow nullable client_email on conversations for guest users.

-- 1. Allow nullable client_email on conversations for anonymous/guest sessions
ALTER TABLE public.conversations ALTER COLUMN client_email DROP NOT NULL;

-- 2. Drop and recreate fn_notify_new_message with value::text cast
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
    SELECT TRIM(BOTH '"' FROM value::text) INTO v_clean_url FROM public.site_config WHERE key = 'notification_webhook_url';
    IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
        v_endpoint_url := v_clean_url;
    END IF;

    SELECT TRIM(BOTH '"' FROM value::text) INTO v_clean_secret FROM public.site_config WHERE key = 'notification_webhook_secret';
    IF v_clean_secret IS NOT NULL AND length(v_clean_secret) > 4 THEN
        v_webhook_secret := v_clean_secret;
    END IF;

    -- Read dynamic admin notification email
    SELECT TRIM(BOTH '"' FROM value::text) INTO v_admin_email FROM public.site_config WHERE key = 'admin_notification_email';
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

    -- Validate recipient email format before dispatch (ignore guest local placeholders)
    IF v_recipient_email IS NULL OR v_recipient_email NOT LIKE '%@%.%' OR v_recipient_email LIKE '%@guest.local' THEN
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
        'text', COALESCE(NEW.text, ''),
        'attachment_name', NEW.attachment_name,
        'created_at', NEW.created_at
    );

    -- Asynchronous HTTP dispatch via pg_net if available
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            PERFORM net.http_post(
                url := v_endpoint_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'x-webhook-secret', v_webhook_secret
                ),
                body := v_payload
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Non-blocking: failures in background notification dispatch never abort message saving
        RAISE WARNING 'fn_notify_new_message net.http_post error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate fn_notify_new_order with value::text cast
CREATE OR REPLACE FUNCTION public.fn_notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
    v_endpoint_url text := 'https://bilaldigitizing.vercel.app/api/send-notification';
    v_webhook_secret text := 'bd_sec_live_notification_trigger_9831';
    v_payload jsonb;
    v_admin_email text := 'shahidbutt59191@gmail.com';
    v_clean_url text;
    v_clean_secret text;
BEGIN
    -- Read dynamic webhook URL and secret from site_config if present
    SELECT TRIM(BOTH '"' FROM value::text) INTO v_clean_url FROM public.site_config WHERE key = 'notification_webhook_url';
    IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
        v_endpoint_url := v_clean_url;
    END IF;

    SELECT TRIM(BOTH '"' FROM value::text) INTO v_clean_secret FROM public.site_config WHERE key = 'notification_webhook_secret';
    IF v_clean_secret IS NOT NULL AND length(v_clean_secret) > 4 THEN
        v_webhook_secret := v_clean_secret;
    END IF;

    -- Read dynamic admin notification email
    SELECT TRIM(BOTH '"' FROM value::text) INTO v_admin_email FROM public.site_config WHERE key = 'admin_notification_email';
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

    -- Asynchronous HTTP dispatch via pg_net if available
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            PERFORM net.http_post(
                url := v_endpoint_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'x-webhook-secret', v_webhook_secret
                ),
                body := v_payload
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'fn_notify_new_order net.http_post error: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
