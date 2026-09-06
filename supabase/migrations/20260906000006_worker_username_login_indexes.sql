-- ==============================================================================
-- Migration: 20260906000006_worker_username_login_indexes.sql
-- Optimizes username-to-email resolution for worker authentication
-- ==============================================================================

CREATE INDEX IF NOT EXISTS worker_profiles_name_lower_idx ON public.worker_profiles (lower(name));
CREATE INDEX IF NOT EXISTS workers_name_lower_idx ON public.workers (lower(name));
