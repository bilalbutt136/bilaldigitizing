'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchChatMessages, 
  addChatMessage, 
  markConversationAsRead, 
  subscribeToLiveMessages,
  broadcastTypingStatus,
  subscribeToTypingStatus
} from '../services/supabaseService';
import { playNotificationSound } from '../utils/audioNotification';

export const parseMessageTimestamp = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Custom React Hook for Managing Real-Time Chat Messages
 * Provides strict deduplication by ID, optimistic UI updates, WebSocket live sync, and audio alerts.
 */
export function useChatMessages({
  threadId,
  userRole = 'client', // 'client' | 'admin'
  userEmail = '',
  userName = '',
  onNewIncomingMessage = null
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimerRef = useRef(null);
  const activeThreadIdRef = useRef(threadId);

  useEffect(() => {
    activeThreadIdRef.current = threadId;
  }, [threadId]);

  // Helper to deduplicate and sort a list of messages by message ID and created timestamp
  const deduplicateAndSort = useCallback((msgList) => {
    if (!Array.isArray(msgList)) return [];
    const map = new Map();

    msgList.forEach(m => {
      if (!m) return;
      const id = String(m.id || `fallback-${m.timestamp || m.created_at}-${m.sender}-${m.text}`);
      
      // If message already exists in map, merge properties (e.g. status, attachment_url)
      if (map.has(id)) {
        map.set(id, { ...map.get(id), ...m });
      } else {
        // Also check if an optimistic temp msg with same text, sender and close timestamp exists
        let matchedTempKey = null;
        for (const [existingKey, existingMsg] of map.entries()) {
          if (
            existingKey.startsWith('msg-') &&
            existingMsg.sender === m.sender &&
            existingMsg.text === m.text &&
            Math.abs(parseMessageTimestamp(existingMsg) - parseMessageTimestamp(m)) < 15000
          ) {
            matchedTempKey = existingKey;
            break;
          }
        }

        if (matchedTempKey) {
          map.delete(matchedTempKey);
        }
        map.set(id, m);
      }
    });

    const sorted = Array.from(map.values());
    sorted.sort((a, b) => parseMessageTimestamp(a) - parseMessageTimestamp(b));
    return sorted;
  }, []);

  // Fetch full conversation history from database
  const loadMessages = useCallback(async (targetId = threadId) => {
    if (!targetId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchChatMessages(targetId, userEmail);
      if (Array.isArray(data)) {
        const sorted = deduplicateAndSort(data);
        setMessages(sorted);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn('[useChatMessages] loadMessages error:', err);
    } finally {
      setLoading(false);
    }
  }, [threadId, userEmail, deduplicateAndSort]);

  // Initial load and reload when threadId changes
  useEffect(() => {
    loadMessages(threadId);
    if (threadId) {
      markConversationAsRead(threadId, userRole, userEmail);
    }
  }, [threadId, userRole, userEmail, loadMessages]);

  // Subscribe to real-time incoming messages via Supabase Realtime / WebSockets
  useEffect(() => {
    if (!threadId) return;

    const unsubscribe = subscribeToLiveMessages((payload) => {
      const record = payload.new || payload.record || payload;
      if (!record) return;

      const recordConvId = String(record.conversation_id || '').toLowerCase().trim();
      const currentId = String(activeThreadIdRef.current || '').toLowerCase().trim();
      const recordEmail = String(record.client_email || '').toLowerCase().trim();
      const cleanEmail = String(userEmail || '').toLowerCase().trim();

      const isForActiveThread = 
        recordConvId === currentId ||
        (cleanEmail && recordEmail && recordEmail === cleanEmail) ||
        (currentId === 'general-support' && (recordConvId === 'general-support' || recordConvId === 'support-guest'));

      if (!isForActiveThread) return;

      const newMsg = {
        id: record.id,
        conversation_id: activeThreadIdRef.current,
        sender: record.sender,
        senderName: record.sender_name || (record.sender === 'admin' ? 'Support' : (userName || 'Customer')),
        sender_name: record.sender_name,
        text: record.text,
        attachment: record.attachment,
        attachment_url: record.attachment_url || null,
        attachment_name: record.attachment_name || record.attachment || null,
        attachment_size: record.attachment_size || null,
        attachment_type: record.attachment_type || null,
        reply_to: record.reply_to || null,
        offer_id: record.offer_id || record.offerId || null,
        offer_data: record.offer_data || record.offerData || null,
        is_read: userRole === 'admin' ? (record.sender !== 'admin') : (record.sender === 'admin'),
        timestamp: record.timestamp || record.created_at || new Date().toISOString(),
        created_at: record.created_at || record.timestamp || new Date().toISOString()
      };

      setMessages(prev => deduplicateAndSort([...prev, newMsg]));

      const isIncoming = (userRole === 'admin' && record.sender !== 'admin') ||
                         (userRole === 'client' && record.sender === 'admin');

      if (isIncoming) {
        playNotificationSound('receive');
        if (typeof onNewIncomingMessage === 'function') {
          onNewIncomingMessage(newMsg);
        }
        markConversationAsRead(activeThreadIdRef.current, userRole, userEmail);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [threadId, userRole, userEmail, userName, deduplicateAndSort, onNewIncomingMessage]);

  // Subscribe to typing indicator from other party
  useEffect(() => {
    if (!threadId) return;

    const unsubTyping = subscribeToTypingStatus((payload) => {
      if (!payload) return;
      const isTarget = payload.conversationId === threadId;
      const isOther = (userRole === 'admin' && payload.senderRole !== 'admin') ||
                      (userRole === 'client' && payload.senderRole === 'admin');

      if (isTarget && isOther) {
        if (payload.isTyping) {
          setIsOtherTyping(true);
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 3500);
        } else {
          setIsOtherTyping(false);
        }
      }
    });

    return () => {
      if (typeof unsubTyping === 'function') unsubTyping();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [threadId, userRole]);

  // Send message function with instant optimistic UI update
  const sendMessage = useCallback(async ({
    text = '',
    attachment = null,
    replyTo = null,
    offerData = null
  }) => {
    if (!text.trim() && !attachment && !offerData) return null;
    const activeId = activeThreadIdRef.current;
    if (!activeId) return null;

    const nowIso = new Date().toISOString();
    const tempId = `msg-${userRole}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newMsg = {
      id: tempId,
      conversation_id: activeId,
      client_email: userEmail || null,
      sender: userRole,
      senderName: userRole === 'admin' ? 'Support' : (userName || 'Customer'),
      sender_name: userRole === 'admin' ? 'Support' : (userName || 'Customer'),
      text: text.trim(),
      attachment: attachment ? attachment.name : null,
      attachment_url: attachment ? attachment.url : null,
      attachment_name: attachment ? attachment.name : null,
      attachment_size: attachment ? attachment.size : null,
      attachment_type: attachment ? attachment.format : null,
      reply_to: replyTo ? {
        id: replyTo.id,
        sender_name: replyTo.senderName || replyTo.sender_name || 'Participant',
        text: replyTo.text,
        attachment: replyTo.attachment_name || replyTo.attachment,
        attachment_url: replyTo.attachment_url
      } : null,
      offer_id: offerData?.id || null,
      offer_data: offerData || null,
      is_read: false,
      timestamp: nowIso,
      created_at: nowIso
    };

    // 1. Optimistic UI update with Map deduplication
    setMessages(prev => deduplicateAndSort([...prev, newMsg]));

    // 2. Broadcast typing stopped
    broadcastTypingStatus(activeId, userName || 'User', userRole, false);

    // 3. Persist to Supabase Database
    try {
      await addChatMessage(activeId, newMsg);
    } catch (err) {
      console.warn('[useChatMessages] send error:', err);
    }

    return newMsg;
  }, [userRole, userEmail, userName, deduplicateAndSort]);

  const sendTypingStatus = useCallback((isTyping) => {
    if (!threadId) return;
    broadcastTypingStatus(threadId, userName || 'User', userRole, isTyping);
  }, [threadId, userName, userRole]);

  return {
    messages,
    loading,
    isOtherTyping,
    sendMessage,
    sendTypingStatus,
    reloadMessages: loadMessages
  };
}

export default useChatMessages;
