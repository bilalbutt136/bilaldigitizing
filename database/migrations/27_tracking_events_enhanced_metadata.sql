-- Migration 27: Add metadata column and performance indexes to tracking_events
ALTER TABLE public.tracking_events ADD COLUMN IF NOT EXISTS metadata JSONB;
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_time ON public.tracking_events(event_time DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_name ON public.tracking_events(event_name);
