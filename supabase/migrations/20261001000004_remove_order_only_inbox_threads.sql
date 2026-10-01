-- Remove Inbox threads that were created by order lifecycle events without any
-- real chat message. Real conversations are preserved because they have messages.
DELETE FROM public.conversations AS c
WHERE (
    c.id LIKE 'order-%'
    OR (
      c.id LIKE 'inbox-%'
      AND c.last_message LIKE 'Order #% placed for %'
    )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.messages AS m
    WHERE m.conversation_id = c.id
  );
