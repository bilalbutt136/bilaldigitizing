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
import { playNotificationSound } from '../../utils/audioNotification';
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
  Zap
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

export const ClientChatInbox = ({ initialOrderId = null }) => {
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

  const canonicalChatId = useMemo(() => {
    if (activeChannel === 'support') {
      return clientEmail && !clientEmail.includes('guest@bdigitizing.pro')
        ? `support-${clientEmail}`
        : 'general-support';
    }
    return clientEmail && !clientEmail.includes('guest@bdigitizing.pro')
      ? `inbox-${clientEmail}`
      : 'inbox-client';
  }, [clientEmail, activeChannel]);

  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [isOrdersMenuOpen, setIsOrdersMenuOpen] = useState(false);

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

  // 1. Initial load of channel chat history from Supabase
  const loadChatHistory = async () => {
    setLoading(true);
    try {
      const email = clientEmail || '';
      const directMsgs = await fetchChatMessages(canonicalChatId, email);
      if (Array.isArray(directMsgs) && directMsgs.length > 0) {
        const sorted = [...directMsgs].sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
        setMessages(sorted);
      } else if (!email) {
        const guestMsgs = await fetchChatMessages('general-support', '');
        setMessages(Array.isArray(guestMsgs) ? guestMsgs : []);
      } else {
        setMessages(Array.isArray(directMsgs) ? directMsgs : []);
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
    loadChatHistory();
    if (canonicalChatId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_read_client_' + canonicalChatId, String(Date.now()));
      }
      markConversationAsRead(canonicalChatId, 'client', clientEmail);
    }
  }, [canonicalChatId, clientEmail]);

  // Sync if initialOrderId prop changes
  useEffect(() => {
    if (initialOrderId === 'help-support' || initialOrderId === 'support' || initialOrderId === 'general-support' || (initialOrderId && String(initialOrderId).startsWith('support-'))) {
      setActiveChannel('support');
    } else {
      setActiveChannel('inbox');
    }
  }, [initialOrderId]);

  const handleChannelSwitch = (channel) => {
    setActiveChannel(channel);
  };

  useEffect(() => {
    const unsubMessages = subscribeToLiveMessages((payload) => {
      if (!payload) return;
      const record = payload.new || payload.record || payload;
      if (!record) return;

      const recordConvId = String(record.conversation_id || '').toLowerCase().trim();
      const recordEmail = String(record.client_email || '').toLowerCase().trim();
      const cleanCustomerEmail = (clientEmail || '').toLowerCase().trim();

      const isForThisCustomer = 
        (cleanCustomerEmail && recordEmail && recordEmail === cleanCustomerEmail) ||
        (cleanCustomerEmail && recordConvId.includes(cleanCustomerEmail)) ||
        (recordConvId === String(canonicalChatId || '').toLowerCase().trim()) ||
        (!cleanCustomerEmail && (recordConvId === 'general-support' || recordConvId === 'support-guest' || recordConvId === 'inbox-client'));

      if (isForThisCustomer) {
        setMessages(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const existingIdx = safePrev.findIndex(m => 
            (m.id && record.id && m.id === record.id) ||
            (m.id && String(m.id).startsWith('msg-') && m.text === record.text && m.sender === record.sender && Math.abs(parseMessageTime(m) - parseMessageTime(record)) < 15000) ||
            (m.text && record.text && m.text === record.text && m.sender === record.sender && Math.abs(parseMessageTime(m) - parseMessageTime(record)) < 10000)
          );

          const formattedRecord = {
            id: record.id,
            conversation_id: canonicalChatId,
            sender: record.sender,
            senderName: record.sender_name || (record.sender === 'admin' ? 'Support' : clientName),
            sender_name: record.sender_name,
            text: record.text,
            attachment: record.attachment,
            attachment_url: record.attachment_url,
            attachment_name: record.attachment_name || record.attachment,
            attachment_size: record.attachment_size,
            attachment_type: record.attachment_type,
            reply_to: record.reply_to,
            offer_id: record.offer_id,
            offer_data: record.offer_data,
            is_read: record.is_read || false,
            timestamp: record.timestamp || record.created_at || new Date().toISOString()
          };

          let updated;
          if (existingIdx >= 0) {
            updated = [...safePrev];
            updated[existingIdx] = { ...updated[existingIdx], ...formattedRecord };
          } else {
            updated = [...safePrev, formattedRecord];
          }
          updated.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
          return updated;
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

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    // Auto-adjust height for smooth multi-line typing
    if (e.target) {
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 40), 120)}px`;
    }

    broadcastTypingStatus(canonicalChatId, clientName, 'client', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(canonicalChatId, clientName, 'client', false);
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const isMobileOrTouch = typeof window !== 'undefined' && (
        window.innerWidth <= 768 || 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );

      // On mobile / touch screens, Enter creates a new line in the message box.
      // On desktop keyboards, Enter sends the message and Shift+Enter creates a new line.
      if (!isMobileOrTouch && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
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

    const newMsg = {
      id: tempMsgId,
      conversation_id: canonicalChatId,
      client_email: clientEmail || 'guest@bdigitizing.pro',
      sender: 'client',
      senderName: clientName,
      sender_name: clientName,
      text: msgText,
      attachment: attachedFile ? attachedFile.name : null,
      attachment_url: attachedFile ? attachedFile.url : null,
      attachment_name: attachedFile ? attachedFile.name : null,
      attachment_size: attachedFile ? attachedFile.size : null,
      attachment_type: attachedFile ? attachedFile.format : null,
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

    setMessages(prev => [...prev, newMsg]);
    setMessageInput('');
    setAttachedFile(null);
    setReplyingTo(null);
    scrollToBottom('smooth');
    broadcastTypingStatus(canonicalChatId, clientName, 'client', false);

    try {
      await addChatMessage(canonicalChatId, newMsg);
    } catch (err) {
      console.error('Send message error:', err);
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
      if (uploadRes && (uploadRes.url || uploadRes.secure_url)) {
        setAttachedFile({
          name: file.name,
          url: uploadRes.secure_url || uploadRes.url,
          size: file.size,
          format: file.name.split('.').pop().toLowerCase()
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
      className="client-chat-inbox theme-light-enforced"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        maxHeight: '100%',
        flex: 1,
        background: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
    >
      
      {/* 1. TOP CHANNEL SELECTOR HEADER */}
      <div style={{
        padding: '0.65rem 1rem 0',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => handleChannelSwitch('inbox')}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #e2e8f0',
              borderBottom: activeChannel === 'inbox' ? '2.5px solid #059669' : '1px solid transparent',
              background: activeChannel === 'inbox' ? '#f0fdf4' : 'transparent',
              color: activeChannel === 'inbox' ? '#047857' : '#64748b',
              fontWeight: activeChannel === 'inbox' ? 900 : 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <MessageSquare size={14} style={{ color: activeChannel === 'inbox' ? '#059669' : '#64748b' }} />
            <span>Studio Digitizers</span>
          </button>

          <button
            type="button"
            onClick={() => handleChannelSwitch('support')}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '10px 10px 0 0',
              border: '1px solid #e2e8f0',
              borderBottom: activeChannel === 'support' ? '2.5px solid #059669' : '1px solid transparent',
              background: activeChannel === 'support' ? '#f0fdf4' : 'transparent',
              color: activeChannel === 'support' ? '#047857' : '#64748b',
              fontWeight: activeChannel === 'support' ? 900 : 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            <Headphones size={14} style={{ color: activeChannel === 'support' ? '#059669' : '#64748b' }} />
            <span>24/7 Help Desk</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', paddingBottom: '0.35rem' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 800 }}>
            Online
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
          background: '#f8fafc',
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
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #cbd5e1',
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
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
              {activeChannel === 'inbox' ? 'Studio Digitizer Chat' : 'Customer Support'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
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
            background: '#ffffff',
            borderRadius: '16px',
            width: 'fit-content',
            border: '1px solid #e2e8f0',
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
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} style={{ color: '#059669' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
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
        style={{
          padding: '0.65rem 0.85rem',
          background: '#ffffff',
          borderTop: '1.5px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          flexShrink: 0,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.03)',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
          accept="image/*,.pdf,.dst,.pes,.emb,.exp,.jef,.ai,.eps,.svg,.cdr"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAttachment}
          style={{
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            color: '#475569',
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

        {/* Textarea Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={messageInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? 'Type a reply...' : 'Type a message...'}
          className="chat-message-input"
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: '40px',
            maxHeight: '110px',
            borderRadius: '10px',
            border: '1.5px solid #cbd5e1',
            padding: '0.6rem 0.85rem',
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#0f172a',
            background: '#ffffff',
            backgroundColor: '#ffffff',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'none',
            lineHeight: 1.4,
            overflowY: 'auto',
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
          title="Send message"
        >
          <span>Send</span>
          <Send size={14} />
        </button>
      </form>

    </div>
  );
};

export default ClientChatInbox;
