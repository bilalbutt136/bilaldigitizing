import { createAdminClient } from './supabase/admin.js';

const cleanText = (value, max = 220) => String(value || '').trim().slice(0, max);

export const notificationIdForMessage = (messageId) =>
  `notif-chat-${String(messageId || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 160)}`;

export const resolveAdminMessageLink = (conversationId) => {
  const cleanId = String(conversationId || '').trim();
  const tab = cleanId.startsWith('support-') ? 'support' : 'inbox';
  return cleanId
    ? `/admin-portal?tab=${tab}&conversationId=${encodeURIComponent(cleanId)}`
    : `/admin-portal?tab=${tab}`;
};

const buildAdminMessageNotification = ({
  messageId,
  conversationId,
  senderName = 'Customer',
  clientEmail = '',
  messageText = '',
  createdAt = null
} = {}) => {
  const cleanMessageId = String(messageId || '').trim();
  const cleanConversationId = String(conversationId || '').trim();
  if (!cleanMessageId || !cleanConversationId) return null;

  const nowIso = new Date().toISOString();
  const cleanName = cleanText(senderName, 100) || 'Customer';
  const cleanEmail = cleanText(clientEmail, 254);
  const snippet = cleanText(messageText, 220) || 'Sent an attachment or new inquiry.';

  return {
    id: notificationIdForMessage(cleanMessageId),
    recipient_role: 'admin',
    recipient_email: null,
    title: `New message from ${cleanName}`,
    message: cleanEmail ? `${snippet} · ${cleanEmail}` : snippet,
    type: 'info',
    link: resolveAdminMessageLink(cleanConversationId),
    read: false,
    created_at: createdAt || nowIso,
    updated_at: nowIso
  };
};

export async function ensureAdminMessageNotification(input = {}) {
  const payload = buildAdminMessageNotification(input);
  if (!payload) {
    return { success: false, skipped: true, reason: 'missing_message_or_conversation_id' };
  }

  const db = createAdminClient();
  const { data: existing, error: existingError } = await db
    .from('notifications')
    .select('id, title, link, read')
    .eq('id', payload.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Unable to inspect admin message notification: ${existingError.message}`);
  }

  if (existing) {
    return { success: true, existing: true, notification: existing };
  }

  const { data, error } = await db
    .from('notifications')
    .insert([payload])
    .select('id, title, link, read')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: true, existing: true, notification: { id: payload.id } };
    }
    throw new Error(`Unable to persist admin message notification: ${error.message}`);
  }

  return { success: true, notification: data };
}

export async function reconcileAdminMessageNotifications({ limit = 150 } = {}) {
  const db = createAdminClient();
  const safeLimit = Math.min(300, Math.max(20, Number(limit) || 150));
  const recoveryWindowStart = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString();

  const { data: messages, error: messageError } = await db
    .from('messages')
    .select('id, conversation_id, client_email, sender, sender_name, text, created_at')
    .eq('sender', 'client')
    .gte('created_at', recoveryWindowStart)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (messageError) {
    throw new Error(`Unable to inspect recent customer messages: ${messageError.message}`);
  }

  const payloads = (messages || [])
    .map((message) => buildAdminMessageNotification({
      messageId: message.id,
      conversationId: message.conversation_id,
      senderName: message.sender_name || 'Customer',
      clientEmail: message.client_email || '',
      messageText: message.text || '',
      createdAt: message.created_at
    }))
    .filter(Boolean);

  if (payloads.length === 0) {
    return { checked: 0, recovered: 0, failed: 0 };
  }

  const ids = payloads.map((payload) => payload.id);
  const { data: existingRows, error: existingError } = await db
    .from('notifications')
    .select('id')
    .in('id', ids);

  if (existingError) {
    throw new Error(`Unable to inspect existing admin alerts: ${existingError.message}`);
  }

  const existingIds = new Set((existingRows || []).map((row) => row.id));
  const missing = payloads.filter((payload) => !existingIds.has(payload.id));

  if (missing.length === 0) {
    return { checked: payloads.length, recovered: 0, failed: 0 };
  }

  const { error: insertError } = await db
    .from('notifications')
    .upsert(missing, { onConflict: 'id', ignoreDuplicates: true });

  if (insertError) {
    throw new Error(`Unable to recover missing admin alerts: ${insertError.message}`);
  }

  return {
    checked: payloads.length,
    recovered: missing.length,
    failed: 0
  };
}
