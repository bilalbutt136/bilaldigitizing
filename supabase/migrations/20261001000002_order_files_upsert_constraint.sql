-- PostgREST/Supabase upsert conflict inference requires a non-partial
-- unique index for onConflict: 'order_id,file_type,file_url'.

DROP INDEX IF EXISTS public.uq_order_files_order_type_url;

CREATE UNIQUE INDEX IF NOT EXISTS uq_order_files_order_type_url
  ON public.order_files (order_id, file_type, file_url);
