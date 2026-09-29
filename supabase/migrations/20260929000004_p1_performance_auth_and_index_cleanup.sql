-- P1 performance: consolidate trusted-role auth lookups and remove exact/redundant indexes.
-- The role resolver is service-role only; browser roles cannot call it directly.

CREATE INDEX IF NOT EXISTS idx_admins_email_lower
  ON public.admins (lower(email));

CREATE INDEX IF NOT EXISTS idx_clients_email_lower_auth
  ON public.clients (lower(email));

CREATE OR REPLACE FUNCTION public.resolve_trusted_user_access(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(p_email, '')));
  v_client_role text;
  v_client jsonb;
  v_worker jsonb;
BEGIN
  IF v_email = '' THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'is_worker', false,
      'worker_data', NULL
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE lower(a.email) = v_email
  ) THEN
    RETURN jsonb_build_object(
      'is_admin', true,
      'is_worker', false,
      'worker_data', NULL
    );
  END IF;

  SELECT c.role, to_jsonb(c)
  INTO v_client_role, v_client
  FROM public.clients c
  WHERE lower(c.email) = v_email
  LIMIT 1;

  IF lower(coalesce(v_client_role, '')) IN ('admin', 'staff') THEN
    RETURN jsonb_build_object(
      'is_admin', true,
      'is_worker', false,
      'worker_data', NULL
    );
  END IF;

  SELECT to_jsonb(wp)
  INTO v_worker
  FROM public.worker_profiles wp
  WHERE lower(wp.email) = v_email
    AND lower(coalesce(wp.status, '')) = 'active'
  LIMIT 1;

  IF v_worker IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'is_worker', true,
      'worker_data', v_worker
    );
  END IF;

  SELECT to_jsonb(w)
  INTO v_worker
  FROM public.workers w
  WHERE lower(w.email) = v_email
    AND lower(coalesce(w.status, '')) = 'active'
  LIMIT 1;

  IF v_worker IS NOT NULL THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'is_worker', true,
      'worker_data', v_worker
    );
  END IF;

  IF lower(coalesce(v_client_role, '')) = 'worker' THEN
    RETURN jsonb_build_object(
      'is_admin', false,
      'is_worker', true,
      'worker_data', v_client
    );
  END IF;

  RETURN jsonb_build_object(
    'is_admin', false,
    'is_worker', false,
    'worker_data', NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_trusted_user_access(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_trusted_user_access(text) FROM anon;
REVOKE ALL ON FUNCTION public.resolve_trusted_user_access(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_trusted_user_access(text) TO service_role;

-- Exact duplicates / fully covered indexes confirmed against live production stats.
-- Keep the more-used/canonical survivor in each pair.
DROP INDEX IF EXISTS public.idx_orders_user_id;                  -- keep orders_user_id_idx
DROP INDEX IF EXISTS public.idx_orders_worker_id;                -- keep orders_worker_id_idx
DROP INDEX IF EXISTS public.idx_orders_worker_status;            -- keep orders_worker_status_idx
DROP INDEX IF EXISTS public.idx_orders_created_at;               -- keep idx_orders_created_at_desc
DROP INDEX IF EXISTS public.idx_messages_client_email_lower;     -- keep idx_messages_client_email
DROP INDEX IF EXISTS public.idx_conversations_client_email_lower;-- keep idx_conversations_client_email
DROP INDEX IF EXISTS public.idx_custom_offers_conversation_id;   -- keep hot idx_custom_offers_conv_id
DROP INDEX IF EXISTS public.clients_email_idx;                   -- keep unique clients_email_key + lower auth index

-- status-only indexes are duplicate/redundant with each other and the
-- leftmost status column of idx_orders_status_created(status, created_at).
DROP INDEX IF EXISTS public.idx_orders_status;
DROP INDEX IF EXISTS public.orders_status_idx;
