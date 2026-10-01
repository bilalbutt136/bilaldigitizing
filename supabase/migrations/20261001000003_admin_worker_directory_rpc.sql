-- Collapse the admin worker directory into one server-only database round trip.
-- The API route caches this RPC briefly, so repeated admin portal renders do not
-- fan out across worker_profiles, workers, orders and worker_earnings.

CREATE OR REPLACE FUNCTION public.get_admin_worker_directory()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH worker_keys AS (
    SELECT
      COALESCE(lower(email), id::text) AS worker_key,
      id::text AS worker_id,
      lower(email) AS email_key
    FROM public.worker_profiles
    UNION
    SELECT
      COALESCE(lower(email), id::text) AS worker_key,
      id::text AS worker_id,
      lower(email) AS email_key
    FROM public.workers
  ),
  order_stats AS (
    SELECT
      worker_id::text AS worker_id,
      count(*)::int AS assigned_orders_count,
      count(*) FILTER (
        WHERE lower(COALESCE(worker_status, '')) = 'completed'
           OR lower(COALESCE(status, '')) = 'completed'
      )::int AS completed_orders_count
    FROM public.orders
    WHERE worker_id IS NOT NULL
    GROUP BY worker_id
  ),
  earning_stats AS (
    SELECT
      worker_id::text AS worker_id,
      COALESCE(sum(amount) FILTER (WHERE lower(COALESCE(status, '')) = 'paid'), 0)::numeric AS total_earned,
      COALESCE(sum(amount) FILTER (WHERE lower(COALESCE(status, '')) = 'pending'), 0)::numeric AS pending_payout
    FROM public.worker_earnings
    WHERE worker_id IS NOT NULL
    GROUP BY worker_id
  ),
  merged AS (
    SELECT
      COALESCE(p.id::text, w.id::text, k.worker_id, k.worker_key) AS id,
      COALESCE(p.name, w.name, split_part(COALESCE(p.email, w.email, k.email_key, ''), '@', 1)) AS name,
      lower(COALESCE(p.email, w.email, k.email_key, '')) AS email,
      COALESCE(p.phone, w.phone) AS phone,
      COALESCE(p.primary_software, w.specialty, 'Embroidery Digitizer') AS specialty,
      COALESCE(p.experience_years, 1) AS experience_years,
      COALESCE(p.primary_software, 'Wilcom') AS primary_software,
      p.portfolio_sample_url,
      p.portfolio_file_name,
      p.bio,
      COALESCE(p.status, w.status, 'Pending') AS status,
      p.rejection_reason,
      COALESCE(es.total_earned, p.total_earned, 0)::numeric AS total_earned,
      COALESCE(es.pending_payout, p.pending_payout, 0)::numeric AS pending_payout,
      COALESCE(os.assigned_orders_count, w.assigned_orders_count, 0)::int AS assigned_orders_count,
      COALESCE(os.completed_orders_count, w.completed_orders_count, 0)::int AS completed_orders_count,
      COALESCE(p.created_at, w.created_at) AS created_at,
      COALESCE(p.updated_at, w.updated_at, p.created_at, w.created_at) AS updated_at
    FROM worker_keys k
    LEFT JOIN LATERAL (
      SELECT p1.*
      FROM public.worker_profiles p1
      WHERE (k.worker_id IS NOT NULL AND p1.id::text = k.worker_id)
         OR (k.email_key IS NOT NULL AND lower(p1.email) = k.email_key)
      ORDER BY p1.updated_at DESC NULLS LAST, p1.created_at DESC NULLS LAST
      LIMIT 1
    ) p ON true
    LEFT JOIN LATERAL (
      SELECT w1.*
      FROM public.workers w1
      WHERE (k.worker_id IS NOT NULL AND w1.id::text = k.worker_id)
         OR (k.email_key IS NOT NULL AND lower(w1.email) = k.email_key)
      ORDER BY w1.updated_at DESC NULLS LAST, w1.created_at DESC NULLS LAST
      LIMIT 1
    ) w ON true
    LEFT JOIN order_stats os
      ON os.worker_id = COALESCE(p.id::text, w.id::text, k.worker_id)
    LEFT JOIN earning_stats es
      ON es.worker_id = COALESCE(p.id::text, w.id::text, k.worker_id)
  )
  SELECT COALESCE(
    jsonb_agg(to_jsonb(merged) ORDER BY lower(COALESCE(name, email, id))),
    '[]'::jsonb
  )
  FROM merged;
$$;

REVOKE ALL ON FUNCTION public.get_admin_worker_directory() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_worker_directory() FROM anon;
REVOKE ALL ON FUNCTION public.get_admin_worker_directory() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_worker_directory() TO service_role;
