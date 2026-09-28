-- Security audit hardening: payment webhook idempotency and push subscription isolation.

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    event_id text PRIMARY KEY,
    provider text NOT NULL DEFAULT 'stripe',
    event_type text NOT NULL,
    status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed', 'failed')),
    attempts integer NOT NULL DEFAULT 1,
    last_error text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_status
    ON public.payment_webhook_events (status, updated_at DESC);

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_webhook_events FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.private_server_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.private_server_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_server_config FROM anon, authenticated;

ALTER TABLE public.transactions
    ADD COLUMN IF NOT EXISTS provider_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_provider_reference_unique
    ON public.transactions (provider_reference)
    WHERE provider_reference IS NOT NULL;

-- Push subscriptions are managed only through authenticated server routes using service-role access.
DROP POLICY IF EXISTS "Allow anon and auth users to manage push subscriptions"
    ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can manage push subscriptions"
    ON public.push_subscriptions;
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;


-- Deployment-wide atomic rate limiting for serverless API routes.
CREATE TABLE IF NOT EXISTS public.distributed_rate_limits (
    identifier text PRIMARY KEY,
    request_count integer NOT NULL DEFAULT 0,
    reset_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.distributed_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.distributed_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
    p_identifier text,
    p_max_requests integer,
    p_window_ms integer
)
RETURNS TABLE (
    allowed boolean,
    remaining integer,
    reset_epoch bigint,
    retry_after integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_count integer;
    v_reset timestamptz;
    v_window interval;
BEGIN
    IF p_identifier IS NULL OR btrim(p_identifier) = '' THEN
        RAISE EXCEPTION 'rate-limit identifier is required';
    END IF;
    IF p_max_requests < 1 OR p_window_ms < 1000 THEN
        RAISE EXCEPTION 'invalid rate-limit parameters';
    END IF;

    v_window := (p_window_ms::text || ' milliseconds')::interval;

    INSERT INTO public.distributed_rate_limits(identifier, request_count, reset_at, updated_at)
    VALUES (left(p_identifier, 512), 1, v_now + v_window, v_now)
    ON CONFLICT (identifier) DO UPDATE
    SET request_count = CASE
            WHEN public.distributed_rate_limits.reset_at <= v_now THEN 1
            ELSE public.distributed_rate_limits.request_count + 1
        END,
        reset_at = CASE
            WHEN public.distributed_rate_limits.reset_at <= v_now THEN v_now + v_window
            ELSE public.distributed_rate_limits.reset_at
        END,
        updated_at = v_now
    RETURNING request_count, reset_at INTO v_count, v_reset;

    RETURN QUERY SELECT
        v_count <= p_max_requests,
        GREATEST(p_max_requests - v_count, 0),
        floor(extract(epoch FROM v_reset))::bigint,
        CASE
            WHEN v_count > p_max_requests
            THEN GREATEST(1, ceil(extract(epoch FROM (v_reset - v_now)))::integer)
            ELSE 0
        END;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

-- Service-role access is explicit; anon/authenticated roles remain blocked.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_webhook_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.private_server_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributed_rate_limits TO service_role;

