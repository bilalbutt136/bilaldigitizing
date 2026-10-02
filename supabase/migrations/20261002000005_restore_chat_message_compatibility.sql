-- Restore compatibility columns that existed before the chat table rebuild.
-- Older offer/payment paths still write these fields, so keep them nullable while
-- the primary chat API uses a smaller canonical projection.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS thread_id text,
  ADD COLUMN IF NOT EXISTS guest_id text,
  ADD COLUMN IF NOT EXISTS attachment text,
  ADD COLUMN IF NOT EXISTS file_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS is_autopilot boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_pilot boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT timezone('utc'::text, now());

UPDATE public.messages
SET thread_id = conversation_id
WHERE thread_id IS NULL
  AND conversation_id IS NOT NULL;

UPDATE public.messages
SET timestamp = created_at
WHERE timestamp IS NULL
  AND created_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_thread_id
  ON public.messages (thread_id);

CREATE INDEX IF NOT EXISTS idx_messages_status
  ON public.messages (status);
