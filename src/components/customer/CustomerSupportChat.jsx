'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { createClient } from '../../lib/supabase/client';
import OfferCardMessage from '../common/OfferCardMessage';
import { downloadFileDirectly, openFileInNewTab } from '../../utils/fileDownloader';
import { playMessageChime, playMessageChimeForMessage, playCustomerChime, stopNotificationSound, unlockAudioContext } from '../../utils/audioNotification';
import { trackUserPresence, untrackUserPresence } from '../../services/presenceService';
import {
  Send,
  Paperclip,
  X,
  Loader2,
  FileText,
  Download,
  Check,
  CheckCheck,
  Headphones,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Clock,
  MessageSquare,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';

const formatChatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatChatDateHeader = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  }
};

export default function CustomerSupportChat({ 
  defaultOrderId = null, 
  initialTopic = '',
  chatType = 'inbox' // 'inbox' | 'support'
}) {
  const { authUser, currentUser } = useAppState();

  const user = authUser || currentUser || {};
  const userEmail = (user?.email || '').toLowerCase().trim();
  const userName = user?.name || userEmail.split('@')[0] || 'Valued Client';

  const defaultConvPrefix = chatType === 'support' ? 'support' : 'inbox';
  const [conversationId, setConversationId] = useState(() => {
    return userEmail ? `${defaultConvPrefix}-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `${defaultConvPrefix}-guest`;
  });

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState(initialTopic ? `Hi, I have a question regarding: ${initialTopic}` : '');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Typing state
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const isTypingActiveRef = useRef(false);
  const adminTypingDismissRef = useRef(null);
  const channelRef = useRef(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sound alert state & toggle
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bdigi_audio_enabled') !== 'false';
    }
    return true;
  });

  const handleToggleSound = () => {
    const nextVal = !isAudioEnabled;
    setIsAudioEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_audio_enabled', String(nextVal));
    }
    if (nextVal) {
      unlockAudioContext();
      playCustomerChime(true);
      showToast('🔔 Gentle message chime active & tested!', 'success');
    } else {
      showToast('🔕 Message chime muted.', 'info');
    }
  };

  const [downloadingFileUrl, setDownloadingFileUrl] = useState(null);

  const handleDownloadFile = async (att, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!att?.url) return;
    try {
      setDownloadingFileUrl(att.url);
      showToast(`Downloading ${att.name || 'file'}...`, 'info');
      await downloadFileDirectly(att.url, att.name);
      showToast(`Downloaded ${att.name || 'file'} successfully!`, 'success');
    } catch (err) {
      console.error('[Chat] Download error:', err);
      showToast(`Failed to download ${att.name || 'file'}.`, 'error');
    } finally {
      setDownloadingFileUrl(null);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const adjustTextareaHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextH = Math.min(Math.max(el.scrollHeight, 42), 140);
    el.style.height = `${nextH}px`;
    // Prevent ugly scrollbars when text fits within bounds
    if (el.scrollHeight > 138) {
      el.style.overflowY = 'auto';
    } else {
      el.style.overflowY = 'hidden';
    }
  };

  // AI Polish Feature
  const [isPolishing, setIsPolishing] = useState(false);
  const handleAiPolish = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!inputText.trim() || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await fetch('/api/chat/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, target: 'chat' })
      });
      const data = await res.json();
      if (data?.polishedText) {
        setInputText(data.polishedText);
        setTimeout(() => {
          if (textareaRef.current) {
            adjustTextareaHeight(textareaRef.current);
          }
        }, 50);
        showToast('✨ Message polished with Google Gemini!', 'success');
      }
    } catch {
      showToast('Could not polish message.', 'error');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleInputFocus = () => {
    stopNotificationSound();
    scrollToBottom();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bdigi_chat_focus', { detail: { focused: true } }));
    }
  };

  const handleInputBlur = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      broadcastTyping(false);
    }
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (!document.activeElement?.closest('.customer-chat-composer')) {
          window.dispatchEvent(new CustomEvent('bdigi_chat_focus', { detail: { focused: false } }));
        }
      }, 120);
    }
  };

  // Re-adjust height if inputText changes from presets
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [inputText]);

  const isImageAttachment = (name = '', url = '') => {
    const check = (name || url || '').split('?')[0].toLowerCase();
    return /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(check);
  };

  // 1. Initialize or Fetch Conversation
  const initConversation = async (targetId) => {
    if (!userEmail) {
      setIsLoading(false);
      return;
    }

    const prefix = chatType === 'support' ? 'support' : 'inbox';
    const convIdToUse = targetId || conversationId || (userEmail ? `${prefix}-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `${prefix}-guest`);

    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getOrCreate',
          conversationId: convIdToUse,
          clientEmail: userEmail,
          clientName: userName,
          orderId: defaultOrderId,
          chatType
        })
      });
      const data = await res.json();
      const resolvedId = data?.conversation?.id || convIdToUse;
      if (resolvedId) {
        setConversationId(resolvedId);
        fetchMessages(resolvedId);
      }
    } catch (err) {
      console.warn('[Customer Chat] Init error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch Messages
  const fetchMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(convId)}&clientEmail=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data?.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }

      // Mark messages as read for client
      stopNotificationSound();
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', conversationId: convId })
      });
    } catch (err) {
      console.warn('[Customer Chat] Fetch messages error:', err);
    }
  };

  useEffect(() => {
    const prefix = chatType === 'support' ? 'support' : 'inbox';
    const nextId = userEmail ? `${prefix}-${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : `${prefix}-guest`;
    setConversationId(nextId);
    setMessages([]);
    setIsLoading(true);
    initConversation(nextId);
  }, [userEmail, chatType]);

  // Handle return from Stripe or Gateway payment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const returnedOfferId = params.get('offerId');
    const returnedOrderId = params.get('orderId');

    if (paymentStatus === 'success' && (returnedOfferId || returnedOrderId)) {
      showToast('🎉 Payment successful! Updating your custom offer and order...', 'success');
      fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'payOffer',
          payload: { offerId: returnedOfferId, orderId: returnedOrderId }
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data?.offer) {
          setMessages(prev => prev.map(m => {
            if (m.offer_id === returnedOfferId || m.id === returnedOfferId) {
              return { ...m, offer_data: data.offer };
            }
            return m;
          }));
        }
        if (conversationId) {
          fetchMessages(conversationId);
        }
      })
      .catch(err => console.warn('Payment success callback notice:', err));

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('payment');
      newUrl.searchParams.delete('offerId');
      newUrl.searchParams.delete('session_id');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [conversationId]);

  // Realtime Polling & Silent Sync
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      // Check admin typing as secondary fallback (only updates if actively typing)
      try {
        const tRes = await fetch(`/api/chat/typing?conversationId=${encodeURIComponent(conversationId)}&forRole=client`);
        const tData = await tRes.json();
        if (tData?.isTyping) {
          setIsAdminTyping(true);
          clearTimeout(adminTypingDismissRef.current);
          adminTypingDismissRef.current = setTimeout(() => {
            setIsAdminTyping(false);
          }, 3500);
        }
      } catch {}

      // Refresh messages quietly without clearing pending messages or flashing duplicates
      try {
        const mRes = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}&clientEmail=${encodeURIComponent(userEmail)}`);
        const mData = await mRes.json();
        if (Array.isArray(mData?.messages)) {
          setMessages(prev => {
            // Keep any pending optimistic messages that the server hasn't saved yet
            const pendingMessages = prev.filter(m => 
              (m.isPending || String(m.id).startsWith('temp-')) &&
              !mData.messages.some(sm => 
                sm.id === m.id || 
                (sm.sender === m.sender && (sm.text || '').trim() === (m.text || '').trim())
              )
            );

            const nonPendingPrev = prev.filter(m => !m.isPending && !String(m.id).startsWith('temp-'));
            const isUnchanged = nonPendingPrev.length === mData.messages.length &&
              mData.messages.every((sm, i) => nonPendingPrev[i]?.id === sm.id) &&
              pendingMessages.length === (prev.length - nonPendingPrev.length);

            if (isUnchanged) return prev;

            if (mData.messages.length > nonPendingPrev.length) {
              const newArrivals = mData.messages.slice(nonPendingPrev.length);
              newArrivals.forEach(m => {
                if (m.sender !== 'client') {
                  playMessageChimeForMessage(m.id, false, { role: 'customer', isAdmin: false });
                }
              });
            }

            return [...mData.messages, ...pendingMessages];
          });
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [conversationId, messages.length, userEmail]);

  // Supabase Realtime Subscription & Broadcast Channel
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`chat-room-${conversationId}`, {
        config: { broadcast: { self: false } }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new) {
          if (payload.new.sender !== 'client') {
            playMessageChimeForMessage(payload.new.id, false, { role: 'customer', isAdmin: false });
          }
          setMessages(prev => {
            // 1. If already present by real DB id, do nothing
            if (prev.some(m => m.id === payload.new.id)) return prev;

            // 2. If this is a client message, check if there is an optimistic pending message to reconcile
            if (payload.new.sender === 'client') {
              const pendingIdx = prev.findIndex(m => 
                (m.isPending || String(m.id).startsWith('temp-')) &&
                (m.text || '').trim() === (payload.new.text || '').trim()
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = payload.new;
                return next;
              }
            }

            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.role === 'admin') {
          const active = Boolean(payload.isTyping);
          setIsAdminTyping(active);
          clearTimeout(adminTypingDismissRef.current);
          if (active) {
            adminTypingDismissRef.current = setTimeout(() => {
              setIsAdminTyping(false);
            }, 3500);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      clearTimeout(adminTypingDismissRef.current);
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Real-time client presence tracking while chat session is open
  useEffect(() => {
    if (!userEmail) return;
    const cleanEmail = userEmail.toLowerCase().trim();

    trackUserPresence({
      email: cleanEmail,
      name: userName,
      role: 'client',
      conversationId
    });

    const interval = setInterval(() => {
      trackUserPresence({
        email: cleanEmail,
        name: userName,
        role: 'client',
        conversationId
      });
    }, 45000);

    return () => {
      clearInterval(interval);
      untrackUserPresence(cleanEmail);
    };
  }, [userEmail, userName, conversationId]);

  // Broadcast typing helper with immediate WebSocket dispatch & API backup
  const broadcastTyping = useCallback((isTyping) => {
    if (!conversationId) return;
    const typingBool = Boolean(isTyping);

    // 1. Instant WebSocket Realtime broadcast (<30ms)
    try {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            role: 'client',
            isTyping: typingBool,
            conversationId,
            timestamp: Date.now()
          }
        });
      }
    } catch (err) {
      console.warn('Realtime client typing broadcast notice:', err);
    }

    // 2. Serverless API sync fallback
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, senderRole: 'client', isTyping: typingBool })
    }).catch(() => {});
  }, [conversationId]);

  // Typing notification
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    adjustTextareaHeight(e.target);
    if (conversationId) {
      if (!isTypingActiveRef.current) {
        isTypingActiveRef.current = true;
        broadcastTyping(true);
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingActiveRef.current = false;
        broadcastTyping(false);
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    // Detect mobile / touch devices (Android virtual keyboard, iOS, tablets)
    const isTouchOrMobile = typeof window !== 'undefined' && (
      window.innerWidth <= 768 ||
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
    );

    if (e.key === 'Enter') {
      if (isTouchOrMobile) {
        // On mobile virtual keyboards (the blue Return key):
        // Allow default behavior to insert a newline instead of dispatching the message!
        setTimeout(() => {
          if (textareaRef.current) {
            adjustTextareaHeight(textareaRef.current);
          }
        }, 10);
        return;
      }

      // On desktop physical keyboard: Enter sends message, Shift+Enter inserts newline
      if (!e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    }
  };

  // Upload file
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'chat-attachments');
        formData.append('folder', 'customer');

        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data?.success && data?.url) {
          const sizeKb = (file.size / 1024).toFixed(1);
          const sizeLabel = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;
          uploaded.push({
            name: file.name,
            url: data.url,
            size: sizeLabel,
            type: file.type || 'application/octet-stream'
          });
        } else {
          showToast(`Failed to upload ${file.name}: ${data?.error || 'Error'}`, 'error');
        }
      } catch {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }

    setPendingAttachments(prev => [...prev, ...uploaded]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && pendingAttachments.length === 0) || isSending || !conversationId) return;

    // Immediately cancel and broadcast typing cessation
    clearTimeout(typingTimeoutRef.current);
    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      broadcastTyping(false);
    }

    const messageText = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];

    stopNotificationSound();
    setIsSending(true);
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Optimistic message placeholder so message displays instantly on screen
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const optimisticMessage = {
      id: tempId,
      conversation_id: conversationId,
      client_email: userEmail,
      sender: 'client',
      sender_name: userName,
      sender_email: userEmail,
      text: messageText,
      type: attachmentsToSend.length > 0 && !messageText ? 'attachment' : 'text',
      attachments: attachmentsToSend,
      created_at: new Date().toISOString(),
      is_read: false,
      isPending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          client_email: userEmail,
          sender: 'client',
          sender_name: userName,
          sender_email: userEmail,
          text: messageText,
          type: attachmentsToSend.length > 0 && !messageText ? 'attachment' : 'text',
          attachments: attachmentsToSend
        })
      });

      const data = await res.json();
      if (data?.message) {
        setMessages(prev => {
          // If Realtime already added or reconciled the message with data.message.id:
          const alreadyExists = prev.some(m => m.id === data.message.id);
          if (alreadyExists) {
            // Remove the temporary optimistic placeholder so no duplicate remains
            return prev.filter(m => m.id !== tempId);
          }
          // Otherwise, replace the temp message with the real one
          return prev.map(m => m.id === tempId ? data.message : m);
        });
        scrollToBottom();
      } else {
        throw new Error(data?.error || 'Failed to dispatch message.');
      }
    } catch (err) {
      showToast(err?.message || 'Failed to send message.', 'error');
      // Remove failed optimistic message and restore inputs so user can retry
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(messageText);
      setPendingAttachments(attachmentsToSend);
    } finally {
      setIsSending(false);
    }
  };

  // Guaranteed deduplication of messages by unique ID and content fingerprint (order-independent)
  const uniqueMessages = useMemo(() => {
    const confirmedIds = new Set();
    const confirmedFingerprints = new Set();

    // Pass 1: Catalog all confirmed non-temporary messages
    for (const msg of messages) {
      if (!msg) continue;
      const isTemp = Boolean(msg.isPending || String(msg.id || '').startsWith('temp-'));
      if (!isTemp) {
        if (msg.id) confirmedIds.add(msg.id);
        const textKey = (msg.text || '').trim();
        const contentFingerprint = `${msg.sender || ''}:::${textKey}:::${(msg.attachments || []).length}`;
        if (textKey || (msg.attachments && msg.attachments.length > 0)) {
          confirmedFingerprints.add(contentFingerprint);
        }
      }
    }

    // Pass 2: Filter duplicates, ensuring optimistic messages never duplicate confirmed ones
    const result = [];
    const seenFinalIds = new Set();
    const seenTempFingerprints = new Set();

    for (const msg of messages) {
      if (!msg) continue;
      const isTemp = Boolean(msg.isPending || String(msg.id || '').startsWith('temp-'));
      const textKey = (msg.text || '').trim();
      const contentFingerprint = `${msg.sender || ''}:::${textKey}:::${(msg.attachments || []).length}`;

      if (!isTemp) {
        if (msg.id && seenFinalIds.has(msg.id)) continue;
        if (msg.id) seenFinalIds.add(msg.id);
        result.push(msg);
      } else {
        // If confirmed message with same content already exists anywhere in the thread, discard the optimistic duplicate!
        if (confirmedFingerprints.has(contentFingerprint)) {
          continue;
        }
        if (seenTempFingerprints.has(contentFingerprint)) {
          continue;
        }
        seenTempFingerprints.add(contentFingerprint);
        if (msg.id) seenFinalIds.add(msg.id);
        result.push(msg);
      }
    }
    return result;
  }, [messages]);

  return (
    <div className="customer-chat-root">
      <style dangerouslySetInnerHTML={{__html: `
        .customer-chat-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          flex: 1;
          background: #ffffff;
          position: relative;
          overflow: hidden;
          font-family: inherit;
          box-sizing: border-box;
        }
        @media (min-width: 1025px) {
          .customer-chat-root {
            border-radius: 16px;
            border: 1.5px solid #e2e8f0;
            box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);
            min-height: 520px;
          }
          .customer-chat-composer {
            border-radius: 0 0 16px 16px;
          }
        }
        @media (max-width: 1024px) {
          .customer-chat-root {
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            min-height: 0 !important;
            height: 100% !important;
            width: 100% !important;
          }
          .customer-chat-composer {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-bottom: none !important;
          }
        }
        .customer-chat-stream::-webkit-scrollbar {
          width: 5px;
        }
        .customer-chat-stream::-webkit-scrollbar-track {
          background: transparent;
        }
        .customer-chat-stream::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        .customer-chat-stream::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 88, 12, 0.4);
        }
        .customer-chat-input {
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
        }
        .customer-chat-input::-webkit-scrollbar {
          width: 4px;
        }
        .customer-chat-input::-webkit-scrollbar-track {
          background: transparent;
        }
        .customer-chat-input::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 4px;
        }
        .customer-chat-input:focus {
          border-color: #ea580c !important;
          background-color: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12) !important;
        }
        .customer-chat-composer button:active {
          transform: scale(0.95);
        }
        .dot-typing {
          position: relative;
          width: 5px;
          height: 5px;
          border-radius: 5px;
          background-color: #ea580c;
          color: #ea580c;
          animation: dotPulse 1.4s infinite linear;
          display: inline-block;
          margin-right: 14px;
        }
        @keyframes dotPulse {
          0% { box-shadow: 8px 0 0 -4px #ea580c; }
          30% { box-shadow: 8px 0 0 2px #ea580c; }
          60%, 100% { box-shadow: 8px 0 0 -4px #ea580c; }
        }
      `}} />

      {/* TOAST ALERT */}
      {toast && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 999,
          background: toast.type === 'error' ? '#ef4444' : (toast.type === 'success' ? '#16a34a' : '#0f172a'),
          color: '#ffffff',
          padding: '0.55rem 1rem',
          borderRadius: '8px',
          fontSize: '0.82rem',
          fontWeight: 600,
          boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      {/* CHAT HEADER */}
      <div 
        style={{
          padding: '0.75rem 1rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.05rem',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
            }}>
              BD
            </div>
            <span style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0f172a'
            }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'nowrap' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {chatType === 'support' ? '24/7 Studio Support Desk' : 'Studio Digitizing Desk'}
              </h3>
              <ShieldCheck size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
              <span style={{
                background: 'rgba(34, 197, 94, 0.18)',
                color: '#4ade80',
                fontSize: '0.58rem',
                fontWeight: 900,
                padding: '0.08rem 0.35rem',
                borderRadius: '6px',
                letterSpacing: '0.03em',
                flexShrink: 0
              }}>
                ONLINE
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '0.1rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chatType === 'support' 
                ? 'Active 24/7 • Orders & Revision Assistance'
                : 'Direct with Digitizers • Custom Offers & Stitch Quotes'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleToggleSound}
            style={{
              background: isAudioEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.08)',
              border: isAudioEnabled ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px 9px',
              color: isAudioEnabled ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              transition: 'all 0.15s ease'
            }}
            title={isAudioEnabled ? "Sound enabled (Click to test chime or mute)" : "Sound muted (Click to enable)"}
          >
            {isAudioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{isAudioEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchMessages(conversationId)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px 8px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.72rem',
              fontWeight: 700
            }}
            title="Refresh chat messages"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div 
        className="customer-chat-stream"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          background: '#f8fafc',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', margin: 'auto' }}>
            <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem', color: '#ea580c' }} />
            Connecting to Studio Digitizing Desk...
          </div>
        ) : uniqueMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b', margin: 'auto' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.15)',
              border: '1px solid #fed7aa'
            }}>
              {chatType === 'support' ? <Headphones size={26} /> : <MessageSquare size={26} />}
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
              {chatType === 'support' ? '24/7 Studio Customer Support' : 'BDigitizing Live Chat'}
            </h4>
            <p style={{ fontSize: '0.82rem', margin: '0 0 1.25rem', maxWidth: '380px', marginInline: 'auto', color: '#64748b', lineHeight: 1.5 }}>
              {chatType === 'support'
                ? 'Need assistance with an existing order, stitch simulation, format conversion, or urgent revision? Our team is standing by 24/7.'
                : 'Directly discuss stitch designs, vector conversions, patches, and custom turnaround times with our expert digitizers.'}
            </p>

            {/* QUICK PROMPT CHIPS */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', maxWidth: '420px', margin: '0 auto' }}>
              {[
                chatType === 'support' ? 'Need help with an existing order' : 'Need quote for embroidery file',
                chatType === 'support' ? 'How do I request a revision?' : 'Vector art conversion turnaround time',
                chatType === 'support' ? 'File format questions (.DST, .PES)' : 'Do you offer 4-8 hour rush delivery?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputText(chip);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      adjustTextareaHeight(textareaRef.current);
                    }
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.76rem',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  💬 {chip}
                </button>
              ))}
            </div>
          </div>
        ) : (
          uniqueMessages.map((msg, index) => {
            const isClient = msg.sender === 'client';
            const isOffer = msg.type === 'custom_offer' || Boolean(msg.offer_id);
            const prevMsg = index > 0 ? uniqueMessages[index - 1] : null;
            const isSameSender = prevMsg && prevMsg.sender === msg.sender && !msg.offer_id && !prevMsg.offer_id;
            const timeDiff = prevMsg ? Math.abs(new Date(msg.created_at) - new Date(prevMsg.created_at)) : Infinity;
            const isGrouped = isSameSender && timeDiff < 3 * 60 * 1000;
            const showDateDivider = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <React.Fragment key={msg.id || index}>
                {/* DATE DIVIDER */}
                {showDateDivider && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '0.65rem 0' }}>
                    <span style={{
                      background: '#e2e8f0',
                      color: '#475569',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.75rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                    }}>
                      {formatChatDateHeader(msg.created_at)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isClient ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                    marginTop: isGrouped ? '0.15rem' : '0.55rem'
                  }}
                >
                  {/* SENDER LABEL (ONLY ON FIRST MESSAGE IN A GROUP) */}
                  {!isGrouped && !isOffer && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.15rem',
                      paddingLeft: isClient ? 0 : '0.35rem',
                      paddingRight: isClient ? '0.35rem' : 0,
                      fontSize: '0.7rem',
                      color: '#94a3b8'
                    }}>
                      <span style={{ fontWeight: 700, color: isClient ? '#ea580c' : '#334155' }}>
                        {isClient ? 'You' : 'BDigitizing'}
                      </span>
                    </div>
                  )}

                  {/* CUSTOM OFFER CARD */}
                  {isOffer ? (
                    <OfferCardMessage
                      offer={msg.offer_data || { id: msg.offer_id, title: 'Custom Studio Offer' }}
                      isCustomerView={true}
                      onOfferAccepted={(updatedOffer) => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, offer_data: updatedOffer } : m));
                      }}
                      onOfferDeclined={(updatedOffer) => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, offer_data: updatedOffer } : m));
                      }}
                      showToast={showToast}
                    />
                  ) : (
                    /* REGULAR MESSAGE BUBBLE */
                    <div style={{
                      maxWidth: '85%',
                      background: isClient ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)' : '#ffffff',
                      color: isClient ? '#ffffff' : '#0f172a',
                      padding: '0.65rem 0.95rem',
                      borderRadius: isClient
                        ? (isGrouped ? '16px 6px 6px 16px' : '16px 16px 4px 16px')
                        : (isGrouped ? '6px 16px 16px 6px' : '16px 16px 16px 4px'),
                      boxShadow: isClient ? '0 2px 8px rgba(234, 88, 12, 0.22)' : '0 1px 4px rgba(15, 23, 42, 0.05)',
                      border: isClient ? 'none' : '1px solid #e2e8f0',
                      wordBreak: 'break-word',
                      fontSize: '0.88rem',
                      lineHeight: 1.45,
                      position: 'relative'
                    }}>
                      {msg.text && (
                        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.text}
                        </div>
                      )}

                      {/* ATTACHMENTS */}
                      {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                        <div style={{ marginTop: msg.text ? '0.55rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {msg.attachments.map((att, aIdx) => {
                            const isImg = isImageAttachment(att.name, att.url);
                            const isDownloading = downloadingFileUrl === att.url;

                            if (isImg) {
                              return (
                                <div
                                  key={aIdx}
                                  style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: isClient ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2e8f0',
                                    background: isClient ? 'rgba(0,0,0,0.18)' : '#f8fafc',
                                    maxWidth: '320px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                  }}
                                >
                                  {/* DIRECT VIEW ON CLICK */}
                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Click to open full image directly"
                                    style={{ display: 'block', textDecoration: 'none', background: '#00000008' }}
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.name || 'Image'}
                                      loading="lazy"
                                      style={{
                                        display: 'block',
                                        width: '100%',
                                        maxHeight: '220px',
                                        objectFit: 'cover',
                                        cursor: 'pointer'
                                      }}
                                    />
                                  </a>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.4rem 0.65rem',
                                    fontSize: '0.72rem',
                                    gap: '0.5rem',
                                    borderTop: isClient ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
                                    background: isClient ? 'rgba(0,0,0,0.22)' : '#ffffff'
                                  }}>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div style={{
                                        fontWeight: 600,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        color: isClient ? '#ffffff' : '#334155'
                                      }}>
                                        {att.name}
                                      </div>
                                      {att.size && (
                                        <div style={{ fontSize: '0.62rem', opacity: 0.8, color: isClient ? '#e2e8f0' : '#64748b' }}>
                                          {att.size}
                                        </div>
                                      )}
                                    </div>

                                    {/* Action buttons: Direct view (Open) and Functional Download */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                      <button
                                        type="button"
                                        onClick={() => openFileInNewTab(att.url, att.name)}
                                        style={{
                                          color: isClient ? '#ffffff' : '#475569',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.2rem',
                                          cursor: 'pointer',
                                          border: isClient ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
                                          fontWeight: 700,
                                          fontSize: '0.68rem',
                                          padding: '0.22rem 0.45rem',
                                          borderRadius: '5px',
                                          background: isClient ? 'rgba(255,255,255,0.15)' : '#f1f5f9'
                                        }}
                                        title="Open image directly in new tab"
                                      >
                                        <ExternalLink size={11} /> Open
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => handleDownloadFile(att, e)}
                                        disabled={isDownloading}
                                        style={{
                                          color: isClient ? '#ea580c' : '#ffffff',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.25rem',
                                          fontWeight: 800,
                                          fontSize: '0.68rem',
                                          padding: '0.22rem 0.55rem',
                                          borderRadius: '5px',
                                          border: 'none',
                                          cursor: isDownloading ? 'wait' : 'pointer',
                                          background: isClient ? '#ffffff' : 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                                          boxShadow: isClient ? '0 1px 4px rgba(0,0,0,0.12)' : '0 2px 6px rgba(234, 88, 12, 0.25)',
                                          transition: 'all 0.15s ease'
                                        }}
                                        title="Download image directly to device"
                                      >
                                        {isDownloading ? <Loader2 size={11} className="spin-icon" /> : <Download size={11} />}
                                        {isDownloading ? 'Saving...' : 'Download'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            const ext = (att.name || '').split('.').pop()?.toUpperCase() || 'FILE';

                            return (
                              <div
                                key={aIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '0.55rem',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '9px',
                                  background: isClient ? 'rgba(255,255,255,0.18)' : '#f8fafc',
                                  color: isClient ? '#ffffff' : '#0f172a',
                                  border: isClient ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2e8f0',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  maxWidth: '350px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                                  <div style={{
                                    padding: '0.15rem 0.38rem',
                                    borderRadius: '4px',
                                    background: isClient ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                                    color: isClient ? '#ffffff' : '#0f172a',
                                    fontSize: '0.62rem',
                                    fontWeight: 900,
                                    letterSpacing: '0.03em',
                                    flexShrink: 0
                                  }}>
                                    {ext}
                                  </div>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{
                                      fontWeight: 600,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: '0.78rem'
                                    }} title={att.name}>
                                      {att.name}
                                    </div>
                                    {att.size && (
                                      <div style={{ fontSize: '0.64rem', opacity: 0.8, color: isClient ? '#e2e8f0' : '#64748b' }}>
                                        {att.size}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => openFileInNewTab(att.url, att.name)}
                                    style={{
                                      color: isClient ? '#ffffff' : '#475569',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.2rem',
                                      cursor: 'pointer',
                                      fontWeight: 700,
                                      fontSize: '0.68rem',
                                      padding: '0.22rem 0.45rem',
                                      borderRadius: '5px',
                                      background: isClient ? 'rgba(255,255,255,0.15)' : '#ffffff',
                                      border: isClient ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Open file directly in new tab"
                                  >
                                    <ExternalLink size={11} /> Open
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleDownloadFile(att, e)}
                                    disabled={isDownloading}
                                    style={{
                                      color: isClient ? '#ea580c' : '#ffffff',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontWeight: 800,
                                      fontSize: '0.68rem',
                                      padding: '0.22rem 0.55rem',
                                      borderRadius: '5px',
                                      border: 'none',
                                      cursor: isDownloading ? 'wait' : 'pointer',
                                      background: isClient ? '#ffffff' : 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                                      boxShadow: isClient ? '0 1px 4px rgba(0,0,0,0.12)' : '0 2px 6px rgba(234, 88, 12, 0.25)',
                                      transition: 'all 0.15s ease'
                                    }}
                                    title="Download file directly to device"
                                  >
                                    {isDownloading ? <Loader2 size={11} className="spin-icon" /> : <Download size={11} />}
                                    {isDownloading ? 'Saving...' : 'Download'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* BUBBLE FOOTER: TIMESTAMP + CHECKMARKS */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.25rem',
                        marginTop: msg.text ? '0.25rem' : '0.15rem',
                        fontSize: '0.64rem',
                        color: isClient ? 'rgba(255, 255, 255, 0.85)' : '#94a3b8'
                      }}>
                        <span>{formatChatTime(msg.created_at)}</span>
                        {isClient && <CheckCheck size={12} style={{ color: 'rgba(255, 255, 255, 0.95)' }} />}
                      </div>
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {isAdminTyping && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '0.35rem 0.75rem',
            borderRadius: '16px',
            color: '#64748b',
            fontSize: '0.76rem',
            fontWeight: 600,
            alignSelf: 'flex-start',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            marginTop: '0.35rem'
          }}>
            <span className="dot-typing" />
            Digitizer Support is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* PENDING ATTACHMENTS PREVIEW */}
      {pendingAttachments.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              {isImageAttachment(att.name, att.url) && (
                <img
                  src={att.url}
                  alt=""
                  style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }}
                />
              )}
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{att.name}</span>
              <button
                type="button"
                onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT COMPOSER */}
      <form
        onSubmit={handleSendMessage}
        className="customer-chat-composer"
        style={{
          padding: '0.65rem 0.85rem',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.55rem',
          flexShrink: 0,
          boxShadow: '0 -2px 10px rgba(15, 23, 42, 0.03)',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".dst,.pes,.emb,.exp,.jef,.ai,.eps,.svg,.cdr,.pdf,.png,.jpg,.jpeg,.webp,.zip"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isUploading ? 'wait' : 'pointer',
            color: '#475569',
            flexShrink: 0,
            marginBottom: '1px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!isUploading) {
              e.currentTarget.style.background = '#e2e8f0';
              e.currentTarget.style.color = '#0f172a';
            }
          }}
          onMouseLeave={(e) => {
            if (!isUploading) {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#475569';
            }
          }}
          title="Attach artwork, logo, or stitch file"
          aria-label="Attach file"
        >
          {isUploading ? <Loader2 size={18} className="spin-icon" color="#ea580c" /> : <Paperclip size={18} />}
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          enterKeyHint="enter"
          placeholder={chatType === 'support' ? "Describe your question or issue..." : "Type a message or inquiry..."}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="customer-chat-input"
          style={{
            flex: 1,
            border: '1.5px solid #cbd5e1',
            background: '#f8fafc',
            borderRadius: '22px',
            padding: '0.62rem 1.05rem',
            fontSize: '0.95rem',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: '42px',
            maxHeight: '140px',
            lineHeight: 1.45,
            boxSizing: 'border-box',
            overflowY: 'hidden',
            color: '#0f172a',
            transition: 'border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease'
          }}
        />

        {inputText.trim().length > 0 && (
          <button
            type="button"
            onClick={handleAiPolish}
            disabled={isPolishing}
            style={{
              background: isPolishing ? '#fed7aa' : '#fff7ed',
              color: '#ea580c',
              border: '1px solid #ffedd5',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isPolishing ? 'wait' : 'pointer',
              flexShrink: 0,
              marginBottom: '1px',
              transition: 'all 0.15s ease'
            }}
            title="Polish typos and elevate draft with AI"
            aria-label="AI Polish"
          >
            {isPolishing ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
          </button>
        )}

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && pendingAttachments.length === 0)}
          style={{
            background: (!inputText.trim() && pendingAttachments.length === 0)
              ? '#f1f5f9'
              : 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
            color: (!inputText.trim() && pendingAttachments.length === 0) ? '#94a3b8' : '#ffffff',
            border: (!inputText.trim() && pendingAttachments.length === 0) ? '1.5px solid #e2e8f0' : 'none',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!inputText.trim() && pendingAttachments.length === 0) ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            marginBottom: '1px',
            boxShadow: (!inputText.trim() && pendingAttachments.length === 0) ? 'none' : '0 3px 12px rgba(234, 88, 12, 0.35)',
            transform: (!inputText.trim() && pendingAttachments.length === 0) ? 'none' : 'translateY(-1px)',
            transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          aria-label="Send message"
        >
          {isSending ? <Loader2 size={17} className="spin-icon" /> : <Send size={17} style={{ marginLeft: '1px' }} />}
        </button>
      </form>
    </div>
  );
}
