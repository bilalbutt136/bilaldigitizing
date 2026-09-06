'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchUserInbox, 
  fetchConversationMessages, 
  sendChatMessage as apiSendChatMessage, 
  markConversationAsRead,
  subscribeToChatEvents,
  broadcastTypingState 
} from '../services/chatService';
import { playNotificationSound } from '../utils/audioNotification';

export function useChatInbox({
  currentUser = null,
  activeConversationId = null,
  onSelectConversation = null,
  showToast = null
} = {}) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChatId, setActiveChatId] = useState(activeConversationId);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTypingRemote, setIsTypingRemote] = useState(false);
  const [typingUser, setTypingUser] = useState('');

  const activeChatIdRef = useRef(activeChatId);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (activeConversationId !== undefined) {
      setActiveChatId(activeConversationId);
    }
  }, [activeConversationId]);

  // 1. Scroll to bottom helper
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // 2. Load Inbox List
  const loadInbox = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingConversations(true);
    try {
      const inboxList = await fetchUserInbox({
        userEmail: currentUser?.email || '',
        userId: currentUser?.id || currentUser?.email || 'guest',
        userRole: currentUser?.role || 'client'
      });
      setConversations(inboxList || []);

      // If no active chat selected yet, auto-select first one if available
      if (!activeChatIdRef.current && inboxList && inboxList.length > 0) {
        const firstId = inboxList[0].id;
        setActiveChatId(firstId);
        if (onSelectConversation) onSelectConversation(firstId);
      }
    } catch (err) {
      console.warn('[useChatInbox.loadInbox error]:', err);
    } finally {
      if (!silent) setIsLoadingConversations(false);
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.role, onSelectConversation]);

  // 3. Load Active Conversation Messages
  const loadMessages = useCallback(async (convId = activeChatId) => {
    if (!convId) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    try {
      const msgs = await fetchConversationMessages(convId);
      setMessages(msgs || []);
      setTimeout(() => scrollToBottom('auto'), 80);

      // Mark read
      if (currentUser?.id || currentUser?.email) {
        markConversationAsRead(convId, currentUser?.id || currentUser?.email, currentUser?.role || 'client');
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c));
      }
    } catch (err) {
      console.warn('[useChatInbox.loadMessages error]:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeChatId, currentUser?.email, currentUser?.id, currentUser?.role, scrollToBottom]);

  // Initial load & active chat changes
  useEffect(() => {
    loadInbox(false);
  }, [loadInbox]);

  useEffect(() => {
    if (activeChatId) {
      loadMessages(activeChatId);
    }
  }, [activeChatId, loadMessages]);

  // 4. Send Message with Optimistic UI Update & Error Rollback
  const sendMessage = useCallback(async ({ content, attachments = [], replyTo = null, metadata = {} }) => {
    if (isSending) return false;
    const cleanContent = (content || '').trim();
    if (!cleanContent && (!attachments || attachments.length === 0)) return false;

    setIsSending(true);

    const tempId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeChatId,
      sender_id: currentUser?.id || currentUser?.email || 'guest',
      sender_email: currentUser?.email || 'guest@bdigitizing-pro.com',
      sender_name: currentUser?.name || currentUser?.full_name || 'Me',
      sender_role: currentUser?.role || 'client',
      content: cleanContent,
      attachments,
      reply_to: replyTo,
      metadata,
      is_optimistic: true,
      created_at: new Date().toISOString()
    };

    // Optimistic append
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom('smooth'), 50);

    try {
      const payload = {
        conversation_id: activeChatId,
        sender_id: currentUser?.id || currentUser?.email || 'guest',
        sender_email: currentUser?.email || 'guest@bdigitizing-pro.com',
        sender_name: currentUser?.name || currentUser?.full_name || 'Me',
        sender_role: currentUser?.role || 'client',
        content: cleanContent,
        attachments,
        reply_to: replyTo,
        metadata
      };

      const serverMsg = await apiSendChatMessage(payload);

      // Replace optimistic message with confirmed server message
      setMessages(prev => prev.map(m => m.id === tempId ? serverMsg : m));
      playNotificationSound('send');

      // Update last message in conversation list
      setConversations(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            last_message_preview: cleanContent || (attachments.length > 0 ? 'Attachment' : ''),
            last_message_at: serverMsg.created_at || new Date().toISOString()
          };
        }
        return c;
      }));

      return true;
    } catch (err) {
      console.error('[useChatInbox.sendMessage error]:', err);
      // Mark optimistic message as errored
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, is_optimistic: false, error: err.message } : m));
      if (showToast) showToast(`Failed to deliver message: ${err.message}`, 'error');
      return false;
    } finally {
      setIsSending(false);
    }
  }, [activeChatId, currentUser, isSending, scrollToBottom, showToast]);

  // 5. Send Typing Status
  const sendTyping = useCallback((isTyping = true) => {
    if (!activeChatId) return;
    broadcastTypingState(
      activeChatId,
      currentUser?.id || currentUser?.email || 'guest',
      currentUser?.name || currentUser?.full_name || 'User',
      currentUser?.role || 'client',
      isTyping
    );
  }, [activeChatId, currentUser]);

  // 6. Realtime Subscriptions with Strict Notification Guards
  useEffect(() => {
    const unsub = subscribeToChatEvents({
      onNewMessage: (payload) => {
        const newMsg = payload?.new || payload?.record || payload;
        if (!newMsg || !newMsg.conversation_id) return;

        const isSelf = newMsg.sender_id === (currentUser?.id || currentUser?.email) ||
                       (currentUser?.email && newMsg.sender_email?.toLowerCase() === currentUser.email.toLowerCase());

        // If message belongs to active open chat
        if (activeChatIdRef.current === newMsg.conversation_id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id || (m.is_optimistic && m.content === newMsg.content && m.sender_id === newMsg.sender_id))) {
              return prev.map(m => (m.is_optimistic && m.content === newMsg.content) ? newMsg : m);
            }
            return [...prev, newMsg];
          });
          setTimeout(() => scrollToBottom('smooth'), 50);

          if (!isSelf) {
            playNotificationSound('receive');
            markConversationAsRead(newMsg.conversation_id, currentUser?.id || currentUser?.email, currentUser?.role || 'client');
          }
        } else if (!isSelf) {
          // Background conversation - play loud chime and show toast
          const msgAge = Date.now() - new Date(newMsg.created_at || Date.now()).getTime();
          if (msgAge < 30000) {
            playNotificationSound('notification');
            if (showToast) {
              showToast(`New message from ${newMsg.sender_name || 'Customer'}`, 'info');
            }
          }
        }

        // Always update inbox list ordering & preview
        setConversations(prev => {
          const exists = prev.some(c => c.id === newMsg.conversation_id);
          if (exists) {
            return prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                const isCurrent = activeChatIdRef.current === c.id;
                return {
                  ...c,
                  last_message_preview: newMsg.content || 'Attachment',
                  last_message_at: newMsg.created_at,
                  unread_count: isCurrent || isSelf ? 0 : (c.unread_count || 0) + 1
                };
              }
              return c;
            }).sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
          } else {
            // New conversation thread arrived
            loadInbox(true);
            return prev;
          }
        });
      },

      onConversationUpdate: () => {
        loadInbox(true);
      },

      onTyping: (typePayload) => {
        if (!typePayload || typePayload.conversation_id !== activeChatIdRef.current) return;
        if (typePayload.user_id === (currentUser?.id || currentUser?.email)) return;

        if (typePayload.is_typing) {
          setIsTypingRemote(true);
          setTypingUser(typePayload.user_name || 'Someone');
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTypingRemote(false);
          }, 3000);
        } else {
          setIsTypingRemote(false);
        }
      }
    });

    // 20s Silent Background Poll for resilience
    const pollInterval = setInterval(() => {
      loadInbox(true);
    }, 20000);

    return () => {
      unsub();
      clearInterval(pollInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUser?.email, currentUser?.id, currentUser?.role, loadInbox, scrollToBottom, showToast]);

  return {
    conversations,
    messages,
    activeChatId,
    setActiveChatId: (id) => {
      setActiveChatId(id);
      if (onSelectConversation) onSelectConversation(id);
    },
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    isTypingRemote,
    typingUser,
    messagesEndRef,
    loadInbox,
    loadMessages,
    sendMessage,
    sendTyping,
    scrollToBottom
  };
}
