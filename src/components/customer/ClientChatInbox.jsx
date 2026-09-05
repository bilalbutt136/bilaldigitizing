'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  fetchChatMessages,
  addChatMessage, 
  subscribeToLiveMessages,
  markConversationAsRead,
  uploadFileToCloudinaryFull,
  broadcastTypingStatus,
  subscribeToTypingStatus
} from '../../services/supabaseService';
import { getGuestSessionId, getCanonicalThreadId } from '../../utils/sessionHelper';
import { playNotificationSound } from '../../utils/audioNotification';
import { useVisualViewport } from '../../hooks/useVisualViewport';
import WhatsAppChatMessage from '../common/WhatsAppChatMessage';
import {
  MessageSquare,
  Send,
  Paperclip,
  Clock,
  CheckCheck,
  X,
  FileText,
  Loader2,
  Reply,
  Headphones,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Inbox,
  User,
  ShieldCheck,
  Zap,
  ArrowLeft
} from 'lucide-react';

const parseMessageTime = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const formatChatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const isToday = new Date().toDateString() === d.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return 'Just now';
  }
};

export const ClientChatInbox = ({ initialOrderId = null, onBack = null }) => {
  const { 
    authUser, 
    currentUser, 
    isAuthenticated,
    orders = [], 
    setSelectedOrderForDrawer, 
    showToast,
    setIsAuthModalOpen,
    setAuthModalMode,
    formatOrderId = (id) => `#${String(id || '').substring(0, 6).toUpperCase()}`
  } = useAppState();

  const clientEmail = (authUser?.email || currentUser?.email || '').toLowerCase().trim();
  const clientName = authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || (clientEmail ? clientEmail.split('@')[0] : 'Guest Visitor');

  const isInitialSupport = initialOrderId === 'help-support' || initialOrderId === 'support' || initialOrderId === 'general-support' || (initialOrderId && String(initialOrderId).startsWith('support-'));
  const [activeChannel, setActiveChannel] = useState(isInitialSupport ? 'support' : 'inbox');

  const guestSessionId = typeof window !== 'undefined' ? getGuestSessionId() : 'guest_init';
  const canonicalChatId = useMemo(() => {
    return getCanonicalThreadId(activeChannel, clientEmail, guestSessionId);
  }, [clientEmail, activeChannel, guestSessionId]);

  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { keyboardOffset, isKeyboardOpen } = useVisualViewport();

  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      } else if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    });
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
      }
    }, 80);
  };

  useEffect(() => {
    if (isKeyboardOpen || isInputFocused) {
      scrollToBottom('smooth');
    }
  }, [isKeyboardOpen, isInputFocused]);

  // 1. Initial load of channel chat history from Supabase
  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const directMsgs = await fetchChatMessages(canonicalChatId, clientEmail);
      if (Array.isArray(directMsgs)) {
        const sorted = [...directMsgs].sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
        setMessages(sorted);
      }
    } catch (err) {
      console.warn('Load chat history notice:', err);
    } finally {
      setLoading(false);
      scrollToBottom('auto');
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      document.body.classList.add('chat-inbox-open');
    }
    loadChatHistory();
    if (canonicalChatId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_read_client_' + canonicalChatId, String(Date.now()));
      }
      markConversationAsRead(canonicalChatId, 'client', clientEmail);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('chat-inbox-open');
        document.body.classList.remove('chat-keyboard-active');
      }
    };
  }, [canonicalChatId, clientEmail]);

  // Sync if initialOrderId prop changes
  useEffect(() => {
    if (initialOrderId === 'help-support' || initialOrderId === 'support' || initialOrderId === 'general-support' || (initialOrderId && String(initialOrderId).startsWith('support-'))) {
      setActiveChannel('support');
    } else {
      setActiveChannel('inbox');
    }
  }, [initialOrderId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length > 2 ? 'smooth' : 'auto');
    }
  }, [messages.length, activeChannel]);

  const handleChannelSwitch = (channel) => {
    setActiveChannel(channel);
  };

  useEffect(() => {
    const unsubMessages = subscribeToLiveMessages((payload) => {
      if (!payload) return;
      const record = payload.new || payload.record || payload;
      if (!record) return;

      const recordConvId = String(record.conversation_id || record.thread_id || '').toLowerCase().trim();
      const recordThreadId = String(record.thread_id || record.conversation_id || '').toLowerCase().trim();
      const recordEmail = String(record.client_email || '').toLowerCase().trim();
      const cleanCustomerEmail = (clientEmail || '').toLowerCase().trim();
      const targetChatIdLower = String(canonicalChatId || '').toLowerCase().trim();

      // Extract offer data from any serialized container (offer_data, attachment, or text)
      let extractedOffer = record.offer_data || record.offer || null;
      if (typeof extractedOffer === 'string') {
        try { extractedOffer = JSON.parse(extractedOffer); } catch { extractedOffer = null; }
      }
      if (!extractedOffer && record.metadata) {
        const meta = typeof record.metadata === 'string' ? (() => { try { return JSON.parse(record.metadata); } catch { return null; } })() : record.metadata;
        if (meta?.offer_data) extractedOffer = meta.offer_data;
        else if (meta?.offer) extractedOffer = meta.offer;
        else if (meta?.id && String(meta.id).startsWith('off-')) extractedOffer = meta;
      }
      if (!extractedOffer && record.attachment && typeof record.attachment === 'string') {
        const trimmed = record.attachment.trim();
        if (trimmed.startsWith('{') && (trimmed.includes('"title"') || trimmed.includes('"price"'))) {
          try { extractedOffer = JSON.parse(trimmed); } catch {}
        }
      }
      if (!extractedOffer && record.text && record.text.includes('[OFFER_DATA:')) {
        try {
          const match = record.text.match(/\[OFFER_DATA:(\{.*?\})\]/s);
          if (match && match[1]) extractedOffer = JSON.parse(match[1]);
        } catch {}
      }

      // Check offer_data or metadata for client_email
      const offerEmail = String(extractedOffer?.client_email || record.client_email || record.metadata?.client_email || '').toLowerCase().trim();
      const matchesClientOrder = Array.isArray(orders) && orders.some(o => {
        const oId = String(o.id || '').toLowerCase().trim();
        return recordConvId === oId || recordConvId === `order-${oId}` || recordThreadId === oId || recordThreadId === `order-${oId}`;
      });

      const isForThisCustomer = 
        (cleanCustomerEmail && recordEmail && recordEmail === cleanCustomerEmail) ||
        (cleanCustomerEmail && offerEmail && offerEmail === cleanCustomerEmail) ||
        (cleanCustomerEmail && (recordConvId.includes(cleanCustomerEmail) || recordThreadId.includes(cleanCustomerEmail))) ||
        (cleanCustomerEmail && matchesClientOrder) ||
        (recordConvId === targetChatIdLower || recordThreadId === targetChatIdLower) ||
        (!cleanCustomerEmail && (
          recordConvId === 'general-support' || recordConvId === 'support-guest' || recordConvId === 'inbox-client' ||
          recordConvId.startsWith('support-guest_') || recordThreadId.startsWith('support-guest_') ||
          recordConvId === targetChatIdLower || recordThreadId === targetChatIdLower
        ));

      if (isForThisCustomer) {
        let attachObj = null;
        if (record.attachment && typeof record.attachment === 'string') {
          const trimmed = record.attachment.trim();
          if (trimmed.startsWith('{')) {
            try { attachObj = JSON.parse(trimmed); } catch {}
          }
        } else if (record.attachment && typeof record.attachment === 'object') {
          attachObj = record.attachment;
        }

        const resolvedOfferId = record.offer_id || extractedOffer?.id || (record.text && record.text.includes('off-') ? record.text.match(/off-[0-9a-z_-]+/i)?.[0] : null);

        const attachUrl = record.attachment_url || attachObj?.file_url || attachObj?.url || (typeof record.attachment === 'string' && (record.attachment.startsWith('http') || record.attachment.startsWith('/api/') || record.attachment.startsWith('blob:') || record.attachment.startsWith('data:')) ? record.attachment : null);
        let attachName = record.attachment_name || attachObj?.file_name || attachObj?.name || (extractedOffer ? `Custom Offer: ${extractedOffer.title}` : (typeof record.attachment === 'string' && !record.attachment.trim().startsWith('{') && !record.attachment.startsWith('http') ? record.attachment : null));
        if (!attachName || attachName.trim().startsWith('{')) {
          attachName = attachUrl ? decodeURIComponent(attachUrl.split('/').pop()?.split('?')[0] || '') : null;
        }
        const attachSize = record.attachment_size || attachObj?.file_size || attachObj?.size || null;
        const attachType = extractedOffer ? 'custom_offer' : (record.attachment_type || attachObj?.mime_type || attachObj?.type || attachObj?.format || null);

        const formattedRecord = {
          id: record.id,
          conversation_id: canonicalChatId,
          type: extractedOffer ? 'custom_offer' : (record.type || 'text'),
          sender: record.sender,
          senderName: record.sender_name || (record.sender === 'admin' ? 'Support' : clientName),
          sender_name: record.sender_name,
          text: record.text,
          attachment: record.attachment,
          attachment_url: attachUrl,
          attachment_name: attachName,
          attachment_size: attachSize,
          attachment_type: attachType,
          file_id: attachObj?.file_id || record.file_id || null,
          reply_to: record.reply_to,
          offer_id: resolvedOfferId,
          offer_data: extractedOffer,
          offer: extractedOffer,
          is_read: record.is_read || false,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        setMessages(prev => {
          const map = new Map();
          (prev || []).forEach(m => { if (m && m.id) map.set(m.id, m); });

          // Check if an offer with same offer_id or offer_data.id exists in thread
          const incomingOfferId = formattedRecord.offer_id || formattedRecord.offer_data?.id;

          for (const [k, v] of map.entries()) {
            // Remove optimistic match if exists
            if (
              k.startsWith('msg-') &&
              v.sender === formattedRecord.sender &&
              v.text === formattedRecord.text &&
              Math.abs(parseMessageTime(v) - parseMessageTime(formattedRecord)) < 15000
            ) {
              map.delete(k);
            }
            // If incoming is custom offer and an offer message with same offerId exists, replace it
            else if (
              incomingOfferId &&
              (v.offer_id === incomingOfferId || v.offer_data?.id === incomingOfferId)
            ) {
              map.delete(k);
            }
          }
          map.set(formattedRecord.id, formattedRecord);
          return Array.from(map.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
        });

        if (record.sender === 'admin') {
          playNotificationSound('chat');
          if (typeof window !== 'undefined') {
            localStorage.setItem('bdigi_read_client_' + canonicalChatId, String(Date.now()));
          }
          markConversationAsRead(canonicalChatId, 'client', clientEmail);
        }
        scrollToBottom('smooth');
      }
    });

    const unsubTyping = subscribeToTypingStatus((payload) => {
      if (!payload) return;
      const isTarget = payload.conversationId === canonicalChatId ||
        (payload.senderEmail && payload.senderEmail.toLowerCase().trim() === clientEmail);

      if (isTarget && payload.senderRole === 'admin') {
        setIsSupportTyping(Boolean(payload.isTyping));
        if (payload.isTyping) {
          scrollToBottom('smooth');
        }
      }
    });

    return () => {
      if (unsubMessages) unsubMessages();
      if (unsubTyping) unsubTyping();
    };
  }, [canonicalChatId, clientEmail, clientName, activeChannel]);

  // Real-time listener for offer status changes across tabs and WebSocket broadcasts
  useEffect(() => {
    const handleOfferStatusEvent = (e) => {
      const { offerId, status: newStatus, offer: freshOffer } = e.detail || {};
      if (!offerId || !newStatus) return;

      setMessages(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        let hasModified = false;
        const nextMsgs = safePrev.map(m => {
          const mOfferId = m.offer_id || m.offer_data?.id || m.offer?.id;
          const textMatches = typeof m.text === 'string' && m.text.includes(offerId);
          const attachMatches = typeof m.attachment === 'string' && m.attachment.includes(offerId);
          if (mOfferId === offerId || m.id === offerId || textMatches || attachMatches) {
            hasModified = true;
            const prevOfferData = typeof m.offer_data === 'object' && m.offer_data ? m.offer_data : {};
            const paymentStatus = freshOffer?.payment_status || (newStatus === 'paid' ? 'paid' : (prevOfferData.payment_status || (newStatus === 'accepted' ? 'pending' : 'unpaid')));
            const mergedOffer = {
              ...prevOfferData,
              ...(freshOffer || {}),
              id: offerId,
              status: newStatus,
              payment_status: paymentStatus,
              order_id: freshOffer?.order_id || prevOfferData.order_id || null,
              updated_at: new Date().toISOString()
            };
            let updatedText = m.text || '';
            if (updatedText.includes('[OFFER_DATA:')) {
              updatedText = updatedText.replace(/\[OFFER_DATA:(.*?)\]/, `[OFFER_DATA:${JSON.stringify(mergedOffer)}]`);
            }
            return {
              ...m,
              offer_id: offerId,
              offer_data: mergedOffer,
              offer: mergedOffer,
              text: updatedText
            };
          }
          return m;
        });

        if (hasModified) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(`bdigi_client_msgs_${canonicalChatId}`, JSON.stringify(nextMsgs));
            } catch {}
          }
          return nextMsgs;
        }
        return safePrev;
      });
    };

    window.addEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
    return () => window.removeEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
  }, [canonicalChatId]);

  // Auto-expanding textarea height adjustment logic (min 40px, max 150px)
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset to calculate true scrollHeight
      const minHeight = 40;
      const maxHeight = 150;
      const scrollH = textareaRef.current.scrollHeight;
      const nextHeight = Math.max(minHeight, Math.min(scrollH, maxHeight));
      textareaRef.current.style.height = `${nextHeight}px`;
      textareaRef.current.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageInput]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    broadcastTypingStatus(canonicalChatId, clientName, 'client', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(canonicalChatId, clientName, 'client', false);
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    const nowIso = new Date().toISOString();
    const tempMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const msgText = messageInput.trim();

    const serializedAttachment = attachedFile ? (attachedFile.url ? JSON.stringify({
      file_id: attachedFile.file_id || null,
      file_url: attachedFile.url,
      url: attachedFile.url,
      file_name: attachedFile.name,
      name: attachedFile.name,
      file_size: attachedFile.size,
      size: attachedFile.size,
      mime_type: attachedFile.format === 'pdf' ? 'application/pdf' : (attachedFile.mime_type || attachedFile.format),
      type: attachedFile.format
    }) : attachedFile.name) : null;

    const newMsg = {
      id: tempMsgId,
      conversation_id: canonicalChatId,
      client_email: clientEmail || 'guest@bdigitizing.pro',
      sender: 'client',
      senderName: clientName,
      sender_name: clientName,
      text: msgText,
      attachment: serializedAttachment,
      attachment_url: attachedFile ? attachedFile.url : null,
      attachment_name: attachedFile ? attachedFile.name : null,
      attachment_size: attachedFile ? attachedFile.size : null,
      attachment_type: attachedFile ? (attachedFile.format === 'pdf' ? 'application/pdf' : attachedFile.format) : null,
      file_id: attachedFile ? (attachedFile.file_id || null) : null,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        sender_name: replyingTo.senderName || replyingTo.sender_name || 'Support',
        text: replyingTo.text,
        attachment: replyingTo.attachment_name || replyingTo.attachment
      } : null,
      isSupport: activeChannel === 'support',
      timestamp: nowIso,
      created_at: nowIso,
      is_read: false
    };

    setMessages(prev => {
      const map = new Map();
      (prev || []).forEach(m => { if (m && m.id) map.set(m.id, m); });
      map.set(newMsg.id, newMsg);
      return Array.from(map.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
    });
    setMessageInput('');
    setAttachedFile(null);
    setReplyingTo(null);
    scrollToBottom('smooth');
    broadcastTypingStatus(canonicalChatId, clientName, 'client', false);

    try {
      if (activeChannel === 'support') {
        setIsSupportTyping(true);
      }
      const sendRes = await addChatMessage(canonicalChatId, newMsg);
      if (sendRes?.auto_reply) {
        const auto = sendRes.auto_reply;
        setTimeout(() => {
          setIsSupportTyping(false);
          setMessages(prev => {
            const map = new Map();
            (prev || []).forEach(m => { if (m && m.id) map.set(m.id, m); });
            map.set(auto.id, auto);
            return Array.from(map.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
          });
          scrollToBottom('smooth');
        }, 700);
      } else if (activeChannel === 'support') {
        setTimeout(() => setIsSupportTyping(false), 3000);
      }
    } catch (err) {
      console.error('Send message error:', err);
      setIsSupportTyping(false);
      if (showToast) showToast('Failed to deliver message. Retrying...', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      if (showToast) showToast('File size must be under 25MB.', 'error');
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const uploadRes = await uploadFileToCloudinaryFull(file);
      const fileUrl = uploadRes?.file_url || uploadRes?.secure_url || uploadRes?.url;
      if (uploadRes && fileUrl) {
        setAttachedFile({
          name: uploadRes.file_name || uploadRes.name || file.name,
          url: fileUrl,
          size: uploadRes.file_size || file.size,
          format: uploadRes.mime_type || uploadRes.format || file.name.split('.').pop().toLowerCase(),
          file_id: uploadRes.file_id || uploadRes.id || null
        });
        if (showToast) showToast(`Attached ${file.name}`, 'success');
      } else {
        throw new Error('Upload returned invalid URL');
      }
    } catch (err) {
      if (showToast) showToast('Failed to upload file. Please try again.', 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!mounted) return null;

  return (
    <div 
      className="client-chat-inbox"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        flex: 1,
        background: 'var(--color-surface, #ffffff)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      
      {/* 1. TOP CHANNEL SELECTOR HEADER */}
      <div style={{
        padding: '0.65rem 0.85rem',
        background: 'var(--color-surface, #ffffff)',
        borderBottom: '1.5px solid var(--color-border, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%'
      }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'var(--color-subtle, #f1f5f9)',
              border: '1.5px solid var(--color-border, #cbd5e1)',
              borderRadius: '10px',
              width: '38px',
              height: '38px',
              minWidth: '38px',
              minHeight: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-primary, #0f172a)',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            aria-label="Back to App"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* 2-Tab High-Contrast Segmented Switcher */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--color-subtle, #f1f5f9)',
          borderRadius: '12px',
          padding: '3px',
          gap: '3px',
          minWidth: 0,
          border: '1px solid var(--color-border, #e2e8f0)'
        }}>
          <button
            type="button"
            onClick={() => handleChannelSwitch('inbox')}
            style={{
              padding: '0.55rem 0.35rem',
              borderRadius: '9px',
              border: 'none',
              background: activeChannel === 'inbox' ? '#047857' : 'transparent',
              color: activeChannel === 'inbox' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              boxShadow: activeChannel === 'inbox' ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              minWidth: 0
            }}
          >
            <MessageSquare size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>Studio Digitizers</span>
          </button>

          <button
            type="button"
            onClick={() => handleChannelSwitch('support')}
            style={{
              padding: '0.55rem 0.35rem',
              borderRadius: '9px',
              border: 'none',
              background: activeChannel === 'support' ? '#047857' : 'transparent',
              color: activeChannel === 'support' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              boxShadow: activeChannel === 'support' ? '0 2px 6px rgba(4, 120, 87, 0.25)' : 'none',
              transition: 'all 0.2s ease',
              minWidth: 0
            }}
          >
            <Headphones size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>24/7 Help Desk</span>
          </button>
        </div>

        {/* Live Online Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '20px',
          padding: '0.35rem 0.55rem',
          flexShrink: 0
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px #10b981'
          }} />
          <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Live
          </span>
        </div>
      </div>

      {/* GUEST SIGN-IN BANNER (If not authenticated) */}
      {!isAuthenticated && !clientEmail && (
        <div style={{
          background: '#ecfdf5',
          borderBottom: '1px solid #a7f3d0',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#065f46',
          flexShrink: 0
        }}>
          <span>👋 Chatting as Guest. Sign in to save history across devices.</span>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0.2rem 0.55rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.7rem'
            }}
          >
            Sign In
          </button>
        </div>
      )}

      {/* 2. CHAT FEED CONTAINER */}
      <div 
        ref={chatFeedRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.85rem 1rem',
          background: 'var(--color-background, #f8fafc)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: '#64748b' }}>
            <Loader2 size={20} className="animate-spin" style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.85rem' }}>Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            padding: '2rem 1.25rem',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1.5px solid var(--color-border, #cbd5e1)',
            maxWidth: '320px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem auto'
            }}>
              {activeChannel === 'inbox' ? <MessageSquare size={24} /> : <Headphones size={24} />}
            </div>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.98rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
              {activeChannel === 'inbox' ? 'Studio Digitizer Chat' : 'Customer Support'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.4 }}>
              {activeChannel === 'inbox' ? 'Send an artwork file, request a quote, or ask our digitizers a question.' : 'How can we help you today? Send a message below.'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isClient = msg.sender === 'client';
            return (
              <WhatsAppChatMessage
                key={msg.id || index}
                message={msg}
                isMe={isClient}
                isClient={isClient}
                senderDisplayName={isClient ? 'You' : 'Studio Digitizer'}
                clientName={clientName}
                onReply={(m) => setReplyingTo(m)}
                formatTime={formatChatTime}
                themePreset="client"
                onOrderClick={(ordId) => {
                  if (orders && orders.length > 0) {
                    const found = orders.find(o => String(o.id) === String(ordId));
                    if (found) setSelectedOrderForDrawer(found);
                  }
                }}
              />
            );
          })
        )}

        {isSupportTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            width: 'fit-content',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            margin: '0.25rem 0'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669' }}>
              Studio Digitizer is typing
            </span>
            <span style={{ display: 'inline-flex', gap: '3px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#059669' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#059669' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#059669' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUOTED REPLY BAR */}
      {replyingTo && (
        <div style={{
          padding: '0.5rem 1rem',
          background: '#f0fdf4',
          borderTop: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexShrink: 0
        }}>
          <div style={{ borderLeft: '3.5px solid #059669', paddingLeft: '0.6rem', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Reply size={12} /> Replying to {replyingTo.senderName || replyingTo.sender_name || 'Studio Support'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment}` : 'Message')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857', padding: '4px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 4. ATTACHED FILE PREVIEW CHIP */}
      {attachedFile && (
        <div style={{
          padding: '0.5rem 1rem',
          background: 'var(--color-surface, #ffffff)',
          borderTop: '1px solid var(--color-border, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
              {attachedFile.name}
            </span>
            <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', fontWeight: 800, padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
              {attachedFile.format?.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 5. PROFESSIONAL WRITING & INPUT BAR */}
      <form 
        onSubmit={handleSendMessage}
        className="chat-input-bar-container"
        style={{
          padding: '0.65rem 0.85rem calc(0.65rem + env(safe-area-inset-bottom, 0px))',
          background: 'var(--color-surface, #ffffff)',
          borderTop: '1.5px solid var(--color-border, #e2e8f0)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.45rem',
          flexShrink: 0,
          boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.05)',
          boxSizing: 'border-box',
          width: '100%',
          position: 'relative',
          zIndex: 50
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
          accept="*/*"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAttachment}
          style={{
            background: 'var(--color-subtle, #f8fafc)',
            border: '1.5px solid var(--color-border, #cbd5e1)',
            color: 'var(--color-text-secondary, #475569)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isUploadingAttachment ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          title="Attach Image, PDF, Vector or Machine File"
        >
          {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" style={{ color: '#059669' }} /> : <Paperclip size={18} />}
        </button>

        {/* Textarea Input (16px minimum prevents iOS Safari auto-zoom) */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsInputFocused(true);
            if (typeof document !== 'undefined') {
              document.body.classList.add('chat-keyboard-active');
            }
            setTimeout(() => scrollToBottom('smooth'), 100);
            setTimeout(() => scrollToBottom('smooth'), 250);
            setTimeout(() => scrollToBottom('smooth'), 450);
          }}
          onBlur={() => {
            setIsInputFocused(false);
            if (typeof document !== 'undefined') {
              document.body.classList.remove('chat-keyboard-active');
            }
            setTimeout(() => scrollToBottom('smooth'), 150);
          }}
          placeholder="Type message..."
          className="chat-message-input"
          style={{
            flex: 1,
            minWidth: 0,
            height: '40px',
            minHeight: '40px',
            maxHeight: '150px',
            borderRadius: '10px',
            border: '1.5px solid var(--color-border, #cbd5e1)',
            padding: '0.55rem 0.85rem',
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--color-text-primary, #0f172a)',
            background: 'var(--color-surface, #ffffff)',
            backgroundColor: 'var(--color-surface, #ffffff)',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'none',
            lineHeight: 1.4,
            overflowY: 'hidden',
            fontFamily: 'inherit'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!messageInput.trim() && !attachedFile) || isUploadingAttachment}
          style={{
            height: '38px',
            padding: '0 0.95rem',
            borderRadius: '10px',
            background: (messageInput.trim() || attachedFile) ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#cbd5e1',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: (messageInput.trim() || attachedFile) ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            boxShadow: (messageInput.trim() || attachedFile) ? '0 3px 12px rgba(5, 150, 105, 0.3)' : 'none',
            transition: 'all 0.2s ease',
            opacity: ((!messageInput.trim() && !attachedFile) || isUploadingAttachment) ? 0.6 : 1
          }}
          title="Send message (Enter)"
        >
          <span>Send</span>
          <Send size={14} />
        </button>
      </form>

      {/* Keyboard Shortcut Hint Footer (Desktop Only) */}
      <div 
        className="chat-desktop-hint desktop-only"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.25rem 1.25rem 0.5rem',
          background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
          borderTop: 'none',
          fontSize: '0.68rem',
          color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          ⌨️ Press <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1', color: isDark ? '#ffffff' : 'inherit', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> to send
        </span>
        <span>
          <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1', color: isDark ? '#ffffff' : 'inherit', fontSize: '0.65rem', fontWeight: 700 }}>Shift</kbd> + <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1', color: isDark ? '#ffffff' : 'inherit', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> for new line
        </span>
      </div>

    </div>
  );
};

export default ClientChatInbox;
