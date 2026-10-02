-- Final production security hardening found during the 2026-10-02 end-to-end audit.
-- Removes legacy public secrets, closes permissive RLS, removes stale admin
-- allowlists, and makes wallet settlement service-only and server-authoritative.

CREATE TABLE IF NOT EXISTS public.private_server_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.private_server_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_server_config FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_server_config TO service_role;

-- Move provider/webhook configuration out of the public site_config table.
INSERT INTO public.private_server_config (key, value, updated_at)
SELECT key, value::jsonb, timezone('utc'::text, now())
FROM public.site_config
WHERE key IN ('notification_webhook_secret', 'boltpayouts_config')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = EXCLUDED.updated_at;

-- Provider credentials are retained only in the service-role-only secret store.
DELETE FROM public.site_config
WHERE key IN (
  'boltpayouts_config',
  'notification_webhook_secret',
  'vapid_private_key',
  'push_subscriptions',
  'push_subscriptions_store'
);

-- site_config is public only for explicitly approved non-secret CMS keys.
DROP POLICY IF EXISTS "site_config_read_all" ON public.site_config;
DROP POLICY IF EXISTS "site_config_public_read" ON public.site_config;
DROP POLICY IF EXISTS "site_config_authenticated_write" ON public.site_config;

REVOKE ALL ON public.site_config FROM anon, authenticated;
GRANT SELECT ON public.site_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_config TO service_role;

CREATE POLICY "site_config_public_read"
ON public.site_config
FOR SELECT
TO anon, authenticated
USING (
  key IN (
    'site_settings',
    'announcement',
    'promotionalBanner',
    'promoCodes',
    'promotions',
    'service_discounts',
    'serviceDiscounts',
    'hero_slides',
    'hero_global_settings',
    'hero_service_text',
    'pricing',
    'contactInfo',
    'meta_pixel_id',
    'metaPixelId',
    'google_analytics_id',
    'googleAnalyticsId',
    'tiktok_pixel_id',
    'tiktokPixelId',
    'trust_features',
    'why_choose_us_steps',
    'vector_format_options',
    'portfolio_categories',
    'order_wizard_formats',
    'admin_notification_email',
    'admin_notification_emails',
    'notification_settings',
    'notification_sound_settings',
    'notification_sound_url',
    'autopilot_helpdesk',
    'faqs',
    'service_cms',
    'testimonials',
    'vapid_public_key',
    'vapid_subject',
    'notification_webhook_url'
  )
);

-- The admin whitelist itself is private. Authorization helpers are SECURITY
-- DEFINER and server APIs use service_role, so browser roles never need it.
DROP POLICY IF EXISTS "admins_read_policy" ON public.admins;
REVOKE ALL ON public.admins FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO service_role;

-- Remove stale hardcoded administrator identities and revocation bypasses.
CREATE OR REPLACE FUNCTION public.is_admin_identity()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.admins
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
END;
$$;

-- Keep the runtime MFA policy introduced in the previous migration.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN true;
  END IF;

  IF public.admin_mfa_required()
     AND coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN
    RETURN false;
  END IF;

  RETURN public.is_admin_identity();
END;
$$;

-- Notification rows contain customer/account data. Remove the legacy
-- anonymous FOR ALL policy and scope reads/updates to the owner or admin.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public and service access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_select_scoped" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_scoped" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_scoped" ON public.notifications;

REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;

CREATE POLICY "notifications_select_scoped"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR recipient_role = 'all'
  OR (
    public.current_user_email() <> ''
    AND lower(coalesce(recipient_email, '')) = public.current_user_email()
  )
);

CREATE POLICY "notifications_insert_scoped"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
  OR (
    public.current_user_email() <> ''
    AND lower(coalesce(recipient_email, '')) = public.current_user_email()
    AND coalesce(recipient_role, 'client') = 'client'
  )
);

CREATE POLICY "notifications_update_scoped"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  public.is_admin()
  OR (
    public.current_user_email() <> ''
    AND lower(coalesce(recipient_email, '')) = public.current_user_email()
  )
)
WITH CHECK (
  public.is_admin()
  OR (
    public.current_user_email() <> ''
    AND lower(coalesce(recipient_email, '')) = public.current_user_email()
  )
);

-- Email delivery audit rows can include addresses and payload context.
ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public and service access to email_notification_logs"
  ON public.email_notification_logs;
REVOKE ALL ON public.email_notification_logs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_notification_logs TO service_role;

-- Media library content is public-readable, but only a verified admin may mutate it.
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_assets_allow_insert" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_allow_update" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_allow_delete" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_admin_insert" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_admin_update" ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_admin_delete" ON public.media_assets;

REVOKE INSERT, UPDATE, DELETE ON public.media_assets FROM anon;
GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

CREATE POLICY "media_assets_admin_insert"
ON public.media_assets FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "media_assets_admin_update"
ON public.media_assets FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "media_assets_admin_delete"
ON public.media_assets FOR DELETE TO authenticated
USING (public.is_admin());

-- Align the database with fields already used by the paid custom-offer workflow.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS turnaround_time text,
  ADD COLUMN IF NOT EXISTS revisions_allowed text;

ALTER TABLE public.custom_offers
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

CREATE INDEX IF NOT EXISTS idx_custom_offers_payment_intent_id
  ON public.custom_offers (payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- Wallet mutations are server-only. Browser users must go through authenticated
-- APIs where order ownership and authoritative prices are checked.
CREATE OR REPLACE FUNCTION public.deposit_funds(
  p_client_email text,
  p_amount numeric,
  p_payment_method text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_auth_user_id uuid;
  v_new_balance numeric;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'Invalid deposit amount';
  END IF;

  UPDATE public.clients
  SET wallet_balance = coalesce(wallet_balance, 0) + p_amount,
      updated_at = now()
  WHERE lower(email) = lower(btrim(p_client_email))
  RETURNING id, user_id, wallet_balance
  INTO v_client_id, v_auth_user_id, v_new_balance;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  INSERT INTO public.transactions (
    user_id, client_email, type, amount, payment_method, description, created_at
  ) VALUES (
    coalesce(v_auth_user_id, v_client_id),
    lower(btrim(p_client_email)),
    'deposit',
    p_amount,
    coalesce(nullif(btrim(p_payment_method), ''), 'Manual Credit'),
    'Studio Wallet Deposit Top-up (+ $' || round(p_amount, 2) || ')',
    now()
  );

  RETURN v_new_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(
  p_client_email text,
  p_amount numeric,
  p_order_id text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_auth_user_id uuid;
  v_current_balance numeric;
  v_new_balance numeric;
  v_order_id text;
  v_order_email text;
  v_order_price numeric;
  v_payment_status text;
  v_order_status text;
  v_clean_order_id text;
  v_tx_id uuid;
  v_reference text;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF p_order_id IS NULL OR btrim(p_order_id) = '' THEN
    RAISE EXCEPTION 'Order ID is required';
  END IF;

  v_clean_order_id := regexp_replace(btrim(p_order_id), '^#+', '');

  SELECT id, client_email, coalesce(price, cost), payment_status, status
  INTO v_order_id, v_order_email, v_order_price, v_payment_status, v_order_status
  FROM public.orders
  WHERE id = btrim(p_order_id)
     OR id = v_clean_order_id
     OR id = '#' || v_clean_order_id
  ORDER BY CASE WHEN id = btrim(p_order_id) THEN 0 ELSE 1 END
  LIMIT 1
  FOR UPDATE;

  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF lower(coalesce(v_order_email, '')) <> lower(btrim(p_client_email)) THEN
    RAISE EXCEPTION 'Order does not belong to this client';
  END IF;

  IF v_order_price IS NULL OR v_order_price <= 0 THEN
    RAISE EXCEPTION 'Order has an invalid authoritative price';
  END IF;

  IF p_amount IS NULL OR abs(p_amount - v_order_price) > 0.005 THEN
    RAISE EXCEPTION 'Payment amount does not match authoritative order price';
  END IF;

  SELECT id, user_id, coalesce(wallet_balance, 0)
  INTO v_client_id, v_auth_user_id, v_current_balance
  FROM public.clients
  WHERE lower(email) = lower(btrim(p_client_email))
  LIMIT 1
  FOR UPDATE;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  IF lower(coalesce(v_payment_status, '')) = 'paid' THEN
    RETURN v_current_balance;
  END IF;

  IF v_current_balance < v_order_price THEN
    RAISE EXCEPTION 'Insufficient funds in wallet';
  END IF;

  v_reference := 'wallet:order:' || v_order_id;

  INSERT INTO public.transactions (
    user_id, client_email, type, amount, payment_method, description,
    provider_reference, created_at
  ) VALUES (
    coalesce(v_auth_user_id, v_client_id),
    lower(btrim(p_client_email)),
    'order_payment',
    -v_order_price,
    'Studio Wallet Credit',
    'Order Brief Payment for #' || regexp_replace(v_order_id, '^#+', '') ||
      ' (- $' || round(v_order_price, 2) || ')',
    v_reference,
    now()
  )
  ON CONFLICT (provider_reference) WHERE provider_reference IS NOT NULL DO NOTHING
  RETURNING id INTO v_tx_id;

  IF v_tx_id IS NULL THEN
    RETURN v_current_balance;
  END IF;

  UPDATE public.clients
  SET wallet_balance = wallet_balance - v_order_price,
      updated_at = now()
  WHERE id = v_client_id
  RETURNING wallet_balance INTO v_new_balance;

  UPDATE public.orders
  SET payment_status = 'paid',
      status = CASE
        WHEN v_order_status IN ('delivered', 'completed') THEN v_order_status
        ELSE 'in_progress'
      END,
      paid_at = coalesce(paid_at, now()),
      updated_at = now()
  WHERE id = v_order_id;

  RETURN v_new_balance;
END;
$$;

-- Exactly-once provider deposit settlement for webhook/status retries.
CREATE OR REPLACE FUNCTION public.settle_wallet_deposit_once(
  p_client_email text,
  p_amount numeric,
  p_payment_method text,
  p_provider_reference text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_auth_user_id uuid;
  v_current_balance numeric;
  v_new_balance numeric;
  v_tx_id uuid;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Service role required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_amount > 100000 THEN
    RAISE EXCEPTION 'Invalid deposit amount';
  END IF;

  IF p_provider_reference IS NULL OR btrim(p_provider_reference) = '' THEN
    RAISE EXCEPTION 'Provider reference is required';
  END IF;

  SELECT id, user_id, coalesce(wallet_balance, 0)
  INTO v_client_id, v_auth_user_id, v_current_balance
  FROM public.clients
  WHERE lower(email) = lower(btrim(p_client_email))
  LIMIT 1
  FOR UPDATE;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  INSERT INTO public.transactions (
    user_id, client_email, type, amount, payment_method, description,
    provider_reference, created_at
  ) VALUES (
    coalesce(v_auth_user_id, v_client_id),
    lower(btrim(p_client_email)),
    'deposit',
    p_amount,
    coalesce(nullif(btrim(p_payment_method), ''), 'Online Payment'),
    'Studio Wallet Deposit Top-up (+ $' || round(p_amount, 2) || ')',
    btrim(p_provider_reference),
    now()
  )
  ON CONFLICT (provider_reference) WHERE provider_reference IS NOT NULL DO NOTHING
  RETURNING id INTO v_tx_id;

  IF v_tx_id IS NULL THEN
    RETURN v_current_balance;
  END IF;

  UPDATE public.clients
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = now()
  WHERE id = v_client_id
  RETURNING wallet_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.deposit_funds(text, numeric, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_wallet_balance(text, numeric, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.settle_wallet_deposit_once(text, numeric, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.deposit_funds(text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_balance(text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.settle_wallet_deposit_once(text, numeric, text, text) TO service_role;

-- Notification triggers now read the webhook secret from private_server_config.
CREATE OR REPLACE FUNCTION public.fn_notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_recipient_email text;
  v_recipient_name text := 'Customer';
  v_sender_name text;
  v_endpoint_url text := 'https://bdigitizing.com/api/send-notification';
  v_webhook_secret text;
  v_payload jsonb;
  v_admin_email text := 'support@bdigitizing.com';
  v_conv_record record;
  v_clean_url text;
BEGIN
  SELECT trim(both '"' from value::text)
  INTO v_clean_url
  FROM public.site_config
  WHERE key = 'notification_webhook_url';

  IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
    v_endpoint_url := v_clean_url;
  END IF;

  SELECT trim(both '"' from value::text)
  INTO v_webhook_secret
  FROM public.private_server_config
  WHERE key = 'notification_webhook_secret';

  SELECT trim(both '"' from value::text)
  INTO v_admin_email
  FROM public.site_config
  WHERE key = 'admin_notification_email';

  IF v_admin_email IS NULL OR length(v_admin_email) < 5 THEN
    v_admin_email := 'support@bdigitizing.com';
  END IF;

  v_sender_name := coalesce(NEW.sender_name, 'Client');

  IF lower(coalesce(NEW.sender, 'client')) = 'client' THEN
    v_recipient_email := v_admin_email;
    v_recipient_name := 'Studio Admin';
  ELSE
    v_recipient_email := NEW.client_email;
    IF v_recipient_email IS NULL OR v_recipient_email = '' THEN
      SELECT client_email, client_name
      INTO v_conv_record
      FROM public.conversations
      WHERE id = NEW.conversation_id
      LIMIT 1;

      IF FOUND THEN
        v_recipient_email := v_conv_record.client_email;
        v_recipient_name := coalesce(v_conv_record.client_name, v_recipient_name);
      END IF;
    END IF;
  END IF;

  IF v_recipient_email IS NULL
     OR v_recipient_email NOT LIKE '%@%.%'
     OR v_recipient_email LIKE '%@guest.local'
     OR v_webhook_secret IS NULL
     OR length(v_webhook_secret) < 16 THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'event', 'new_message',
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'sender', NEW.sender,
    'sender_name', v_sender_name,
    'recipient_email', v_recipient_email,
    'recipient_name', v_recipient_name,
    'client_email', NEW.client_email,
    'text', coalesce(NEW.text, ''),
    'attachments', coalesce(NEW.attachments, '[]'::jsonb),
    'attachment_name', NEW.attachment_name,
    'attachment_url', NEW.attachment_url,
    'type', coalesce(NEW.type, 'text'),
    'created_at', NEW.created_at
  );

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
    RAISE WARNING 'fn_notify_new_message net.http_post error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_endpoint_url text := 'https://bdigitizing.com/api/send-notification';
  v_webhook_secret text;
  v_admin_email text := 'support@bdigitizing.com';
  v_payload jsonb;
  v_clean_url text;
BEGIN
  SELECT trim(both '"' from value::text)
  INTO v_clean_url
  FROM public.site_config
  WHERE key = 'notification_webhook_url';

  IF v_clean_url IS NOT NULL AND length(v_clean_url) > 8 THEN
    v_endpoint_url := v_clean_url;
  END IF;

  SELECT trim(both '"' from value::text)
  INTO v_webhook_secret
  FROM public.private_server_config
  WHERE key = 'notification_webhook_secret';

  SELECT trim(both '"' from value::text)
  INTO v_admin_email
  FROM public.site_config
  WHERE key = 'admin_notification_email';

  IF v_admin_email IS NULL OR length(v_admin_email) < 5 THEN
    v_admin_email := 'support@bdigitizing.com';
  END IF;

  IF v_webhook_secret IS NULL OR length(v_webhook_secret) < 16 THEN
    RETURN NEW;
  END IF;

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
$$;

NOTIFY pgrst, 'reload schema';
