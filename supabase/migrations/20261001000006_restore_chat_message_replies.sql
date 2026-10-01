-- Restore WhatsApp-style per-message reply metadata on the canonical messages table.
-- The chat table was recreated in later migrations and production no longer had this legacy column.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to jsonb;

COMMENT ON COLUMN public.messages.reply_to IS
  'Server-verified snapshot of the referenced message: id, sender, sender_name, text, type, attachment_name.';
