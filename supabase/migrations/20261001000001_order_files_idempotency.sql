-- Prevent duplicate durable file rows per order/type/URL.
-- Clean up exact duplicates first, keeping the earliest recorded row.

WITH ranked_order_files AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id, file_type, file_url
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.order_files
  WHERE file_url IS NOT NULL
    AND trim(file_url) <> ''
)
DELETE FROM public.order_files AS f
USING ranked_order_files AS r
WHERE f.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_files_order_type_url
  ON public.order_files (order_id, file_type, file_url)
  WHERE file_url IS NOT NULL
    AND trim(file_url) <> '';
