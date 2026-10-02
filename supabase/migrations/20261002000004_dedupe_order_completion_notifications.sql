-- Make admin order-completion alerts canonical and clean up legacy duplicates.
-- Completion is a terminal lifecycle event, so only one admin notification per order is valid.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY order_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM public.notifications
  WHERE recipient_role = 'admin'
    AND order_id IS NOT NULL
    AND (
      lower(title) LIKE '%order completed%'
      OR lower(id) LIKE 'notif-comp-%'
    )
)
DELETE FROM public.notifications n
USING ranked r
WHERE n.id = r.id
  AND r.rn > 1;

DO $$
DECLARE
  rec record;
  desired_id text;
BEGIN
  FOR rec IN
    SELECT id, order_id
    FROM public.notifications
    WHERE recipient_role = 'admin'
      AND order_id IS NOT NULL
      AND (
        lower(title) LIKE '%order completed%'
        OR lower(id) LIKE 'notif-comp-%'
      )
  LOOP
    desired_id := 'notif-comp-' || rec.order_id || '-admin';

    IF rec.id <> desired_id
       AND NOT EXISTS (
         SELECT 1
         FROM public.notifications
         WHERE id = desired_id
       ) THEN
      UPDATE public.notifications
      SET id = desired_id,
          updated_at = timezone('utc'::text, now())
      WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;
