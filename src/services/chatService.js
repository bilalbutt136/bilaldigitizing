import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import { playNotificationSound } from '../utils/audioNotification';

/**
 * High Performance Normalized Chat Service Layer
 * Supports PostgreSQL Supabase schema: conversations, conversation_participants, messages
 */

let sharedRealtimeChannel = null;
const messageListeners = new Set();
const conversationListeners = new Set();
const typingListeners = new Set();

/**
 * Initialize or get the shared Realtime WebSocket Channel
 */
export function getChatRealtimeChannel() {
  if (!isSupabaseConfigured || !supabase) return null;

  if (!sharedRealtimeChannel) {
    sharedRealtimeChannel = supabase.channel('bdigi-chat-hub-v3', {
      config: {
        broadcast: { self: false } // Never echo outgoing broadcasts back to sender
      }
    });

    // 1. WebSocket Broadcast: Instant Cross-Tab Delivery
    sharedRealtimeChannel.on('broadcast', { event: 'new_message' }, (event) => {
      if (event.payload) {
        messageListeners.forEach(fn => {
          try { fn({ eventType: 'INSERT', new: event.payload, record: event.payload }); } catch (err) {}
        });
      }
    });

    sharedRealtimeChannel.on('broadcast', { event: 'typing' }, (event) => {
      if (event.payload) {
        typingListeners.forEach(fn => {
          try { fn(event.payload); } catch (err) {}
        });
      }
    });

    // 2. Postgres Change Replication: INSERT & UPDATE
    sharedRealtimeChannel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        messageListeners.forEach(fn => {
          try { fn(payload); } catch (err) {}
        });
      }
    );

    sharedRealtimeChannel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      (payload) => {
        conversationListeners.forEach(fn => {
          try { fn(payload); } catch (err) {}
        });
      }
    );

    sharedRealtimeChannel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'CLOSED' || status === 'TIMED_OUT') {
        console.warn(`[Chat Realtime] Channel status: ${status}`, err?.message || '');
        if (sharedRealtimeChannel && supabase) {
          try { supabase.removeChannel(sharedRealtimeChannel); } catch {}
          sharedRealtimeChannel = null;
        }
        setTimeout(() => getChatRealtimeChannel(), 2000);
      }
    });

    // Window focus & online auto-recovery
    if (typeof window !== 'undefined' && !window.__bdigi_chat_hub_init) {
      window.__bdigi_chat_hub_init = true;
      const handleReconnect = () => {
        if (!sharedRealtimeChannel || sharedRealtimeChannel.state === 'closed' || sharedRealtimeChannel.state === 'errored') {
          if (sharedRealtimeChannel && supabase) {
            try { supabase.removeChannel(sharedRealtimeChannel); } catch {}
            sharedRealtimeChannel = null;
          }
          getChatRealtimeChannel();
        }
      };
      window.addEventListener('focus', handleReconnect);
      window.addEventListener('online', handleReconnect);
    }
  }

  return sharedRealtimeChannel;
}

/**
 * Fetch active conversations for a user with unread counts
 */
export async function fetchUserInbox({ userEmail = '', userId = '', userRole = 'client' } = {}) {
  try {
    const cleanEmail = (userEmail || '').toLowerCase().trim();
    const cleanId = (userId || '').trim();
    
    const params = new URLSearchParams();
    if (cleanEmail) params.append('email', cleanEmail);
    if (cleanId) params.append('userId', cleanId);
    if (userRole) params.append('role', userRole);

    const res = await fetch(`/api/chat/messages?action=inbox&${params.toString()}`, {
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.conversations || [];
  } catch (err) {
    console.warn('[chatService.fetchUserInbox] fallback notice:', err.message);
    return [];
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function fetchConversationMessages(conversationId, { limit = 100 } = {}) {
  if (!conversationId) return [];
  try {
    const res = await fetch(`/api/chat/messages?action=messages&conversationId=${encodeURIComponent(conversationId)}&limit=${limit}`, {
      headers: { 'Cache-Control': 'no-cache' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    console.warn('[chatService.fetchConversationMessages] notice:', err.message);
    return [];
  }
}

/**
 * Send a chat message (via Next.js API route + Realtime broadcast)
 */
export async function sendChatMessage(payload) {
  if (!payload || !payload.content?.trim() && (!payload.attachments || payload.attachments.length === 0)) {
    throw new Error('Message content or attachment is required.');
  }

  const res = await fetch('/api/chat/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to send message (${res.status})`);
  }

  const result = await res.json();
  const sentMessage = result.message;

  // Broadcast to other tabs & devices
  try {
    const channel = getChatRealtimeChannel();
    if (channel && sentMessage) {
      channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: sentMessage
      });
    }
  } catch (bErr) {
    console.warn('[chatService.sendChatMessage broadcast notice]:', bErr);
  }

  return sentMessage;
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(conversationId, userId, userRole = 'client') {
  if (!conversationId || !userId) return false;
  try {
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'markRead',
        conversationId,
        userId,
        role: userRole
      })
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Broadcast user typing state
 */
export function broadcastTypingState(conversationId, userId, userName, userRole, isTyping = true) {
  try {
    const channel = getChatRealtimeChannel();
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversation_id: conversationId,
          user_id: userId,
          user_name: userName,
          user_role: userRole,
          is_typing: isTyping,
          timestamp: Date.now()
        }
      });
    }
  } catch {}
}

/**
 * Subscribe to live chat events (Messages, Inbox changes, Typing)
 */
export function subscribeToChatEvents({ onNewMessage, onConversationUpdate, onTyping } = {}) {
  if (onNewMessage) messageListeners.add(onNewMessage);
  if (onConversationUpdate) conversationListeners.add(onConversationUpdate);
  if (onTyping) typingListeners.add(onTyping);

  getChatRealtimeChannel();

  return () => {
    if (onNewMessage) messageListeners.delete(onNewMessage);
    if (onConversationUpdate) conversationListeners.delete(onConversationUpdate);
    if (onTyping) typingListeners.delete(onTyping);
  };
}
