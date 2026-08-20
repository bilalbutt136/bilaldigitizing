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
  Inbox
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
    orders = [], 
    setSelectedOrderForDrawer, 
    showToast,
    formatOrderId = (id) => `#${String(id || '').substring(0, 6).toUpperCase()}`
  } = useAppState();

  const activeUser = authUser || currentUser || {
    name: 'Client',
    email: 'client@studio.com',
    company: 'Studio Account'
  };

  const clientEmail = (activeUser.email || '').toLowerCase().trim();
  const clientName = activeUser.name || 'Client';

  const isInitialSupport = initialOrderId === 'support' || initialOrderId === 'general-support' || (initialOrderId && String(initialOrderId).startsWith('support-'));
  const [activeChannel, setActiveChannel] = useState(isInitialSupport ? 'support' : 'inbox');

  const canonicalChatId = useMemo(() => {
    if (activeChannel === 'support') {
      return clientEmail && clientEmail !== 'client@studio.com' && !clientEmail.includes('guest@bdigitizing.pro')
        ? `support-${clientEmail}`
        : 'general-support';
    }
    return clientEmail && clientEmail !== 'client@studio.com' && !clientEmail.includes('guest@bdigitizing.pro')
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

  const loadChatHistory = async () => {
    if (!clientEmail) return;
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
    loadChatHistory();
    if (canonicalChatId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_read_client_' + canonicalChatId, String(Date.now()));
      }
      markConversationAsRead(canonicalChatId, 'client', clientEmail);
    }
  }, [canonicalChatId, clientEmail]);

  useEffect(() => {
    if (initialOrderId === 'support' || initialOrderId === 'general-support' || (initialOrderId && String(initialOrderId).startsWith('support-'))) {
      setActiveChannel('support');
    } else if (initialOrderId && initialOrderId !== 'inbox') {
      setActiveChannel('inbox');
      const ordNum = formatOrderId(initialOrderId);
      const tag = `[Regarding Order ${ordNum}] `;
      setMessageInput(prev => prev.includes(tag) ? prev : `${tag}${prev}`);
    }
  }, [initialOrderId, formatOrderId]);

  useEffect(() => {
    const unsubMessages = subscribeToLiveMessages((payload) => {
      if (!payload) return;
      const record = payload.new || payload.record || payload;
      if (!record) return;

      const recordConvId = String(record.conversation_id || '').toLowerCase();
      const isSupportRecord = recordConvId.startsWith('support-') || recordConvId === 'general-support' || recordConvId === 'support-guest' || record.isSupport === true;

      if (activeChannel === 'support' && !isSupportRecord) return;
      if (activeChannel === 'inbox' && isSupportRecord) return;

      const isForThisCustomer = recordConvId === canonicalChatId ||
        (activeChannel === 'inbox' && (recordConvId === `inbox-${clientEmail}` || recordConvId === `direct-${clientEmail}`)) ||
        (activeChannel === 'support' && recordConvId === `support-${clientEmail}`) ||
        (record.client_email && record.client_email.toLowerCase().trim() === clientEmail);

      if (isForThisCustomer) {
        setMessages(prev => {
          if (prev.some(m => m.id === record.id)) {
            return prev.map(m => m.id === record.id ? { ...m, ...record } : m);
          }
          const updated = [...prev, {
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
          }];
          updated.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
          return updated;
        });

        if (record.sender === 'admin') {
          playNotificationSound();
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

    broadcastTypingStatus(canonicalChatId, clientName, 'client', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(canonicalChatId, clientName, 'client', false);
    }, 2500);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const nowIso = new Date().toISOString();
    const tempMsgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const msgText = messageInput.trim();

    const newMsg = {
      id: tempMsgId,
      conversation_id: canonicalChatId,
      client_email: clientEmail,
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
      await addChatMessage(canonicalChatId, newMsg, activeUser);
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
      if (uploadRes && uploadRes.url) {
        setAttachedFile({
          name: file.name,
          url: uploadRes.url,
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      minHeight: '520px',
      maxHeight: '880px',
      background: 'var(--color-surface, #ffffff)',
      borderRadius: '16px',
      border: '1.5px solid var(--color-border)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '0.65rem 1.25rem 0',
        background: '#f8fafc',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveChannel('inbox')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: '1px solid var(--color-border)',
              borderBottom: activeChannel === 'inbox' ? '2px solid #ea580c' : '1px solid transparent',
              background: activeChannel === 'inbox' ? '#ffffff' : 'transparent',
              color: activeChannel === 'inbox' ? '#ea580c' : 'var(--navy-700)',
              fontWeight: activeChannel === 'inbox' ? 900 : 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Inbox size={15} />
            <span>Customer Inbox (Orders & Offers)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('support')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px 8px 0 0',
              border: '1px solid var(--color-border)',
              borderBottom: activeChannel === 'support' ? '2px solid #ea580c' : '1px solid transparent',
              background: activeChannel === 'support' ? '#ffffff' : 'transparent',
              color: activeChannel === 'support' ? '#ea580c' : 'var(--navy-700)',
              fontWeight: activeChannel === 'support' ? 900 : 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Headphones size={15} />
            <span>24/7 Support Helpdesk</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadChatHistory}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem'
          }}
          title="Refresh messages"
        >
          <RotateCcw size={12} /> Sync
        </button>
      </div>

      <div style={{
        padding: '0.75rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: activeChannel === 'inbox' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ecfdf5',
              color: activeChannel === 'inbox' ? '#ffffff' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.9rem',
              border: activeChannel === 'inbox' ? '2px solid #ea580c' : '2px solid #10b981'
            }}>
              {activeChannel === 'inbox' ? 'BD' : <Headphones size={18} />}
            </div>
            <span style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #ffffff'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                {activeChannel === 'inbox' ? 'Studio Management & Digitizing Team' : '24/7 Live Customer Support'}
              </h3>
              <span style={{
                fontSize: '0.65rem',
                background: activeChannel === 'inbox' ? '#fff7ed' : '#ecfdf5',
                color: activeChannel === 'inbox' ? '#ea580c' : '#059669',
                border: `1px solid ${activeChannel === 'inbox' ? '#fed7aa' : '#a7f3d0'}`,
                padding: '0.05rem 0.4rem',
                borderRadius: '9999px',
                fontWeight: 800
              }}>
                {activeChannel === 'inbox' ? 'Private Studio Inbox' : 'Support Helpdesk'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: '0.1rem' }}>
              ● Online • Instant Replies
            </div>
          </div>
        </div>

        {activeChannel === 'inbox' && orders && orders.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsOrdersMenuOpen(prev => !prev)}
              style={{
                background: '#f8fafc',
                border: '1.5px solid var(--color-border)',
                color: 'var(--navy-800)',
                padding: '0.35rem 0.7rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              <ShoppingBag size={14} className="text-orange-500" />
              <span>Reference Order ({orders.length})</span>
              <ChevronDown size={13} />
            </button>

            {isOrdersMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '280px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1.5px solid var(--color-border)',
                padding: '0.5rem',
                zIndex: 50,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', padding: '0.35rem 0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                  Click an order to reference in chat:
                </div>
                {orders.map(ord => {
                  const ordNum = formatOrderId(ord.id);
                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        const tag = `[Regarding Order ${ordNum} - ${ord.title || ord.service_category || 'Digitizing'}] `;
                        setMessageInput(prev => prev.includes(tag) ? prev : `${tag}${prev}`);
                        setIsOrdersMenuOpen(false);
                      }}
                      style={{
                        padding: '0.5rem 0.6rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <strong style={{ color: 'var(--navy-900)' }}>{ordNum}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ord.title || ord.service_category || 'Embroidery'}</div>
                      </div>
                      <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: '#ea580c', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                        Add Tag
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div 
        ref={chatFeedRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          background: '#efeae2',
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 0)',
          backgroundSize: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        <div style={{
          margin: '0.25rem auto 0.75rem auto',
          padding: '0.35rem 0.9rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          fontSize: '0.72rem',
          color: 'var(--navy-800)',
          fontWeight: 700,
          textAlign: 'center',
          maxWidth: '420px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)'
        }}>
          {activeChannel === 'inbox' 
            ? '🔒 Private Customer Inbox with Studio Digitizers & Management.'
            : '🎧 24/7 Live Support Helpdesk for inquiries & technical assistance.'}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="animate-spin text-orange-500" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            padding: '2.5rem 1.5rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid var(--color-border)',
            maxWidth: '380px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
          }}>
            {activeChannel === 'inbox' ? (
              <>
                <MessageSquare size={36} className="text-orange-500" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                  Start Studio Conversation
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Ask questions, request custom quotes, or discuss artwork revisions with our master digitizing team.
                </p>
              </>
            ) : (
              <>
                <Headphones size={36} className="text-emerald-500" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                  Customer Support Helpdesk
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  How can our support team assist you today? Leave your question below.
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg, index) => {
            const isClient = msg.sender === 'client';
            return (
              <WhatsAppChatMessage
                key={msg.id || index}
                message={msg}
                isClient={isClient}
                clientName={clientName}
                onReply={(m) => setReplyingTo(m)}
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            margin: '0.25rem 0'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ea580c' }}>
              Studio Support is typing
            </span>
            <span style={{ display: 'inline-flex', gap: '3px' }}>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ea580c' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ea580c' }} />
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ea580c' }} />
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyingTo && (
        <div style={{
          padding: '0.5rem 1.25rem',
          background: '#fff7ed',
          borderTop: '1px solid #fed7aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexShrink: 0
        }}>
          <div style={{ borderLeft: '3.5px solid #ea580c', paddingLeft: '0.6rem', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Reply size={12} /> Replying to {replyingTo.senderName || replyingTo.sender_name || 'Support'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment}` : 'Attachment')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', padding: '4px' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {attachedFile && (
        <div style={{
          padding: '0.5rem 1.25rem',
          background: '#f8fafc',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} className="text-orange-500" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              {attachedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAttachedFile(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <form 
        onSubmit={handleSendMessage}
        style={{
          padding: '0.75rem 1.25rem',
          background: '#ffffff',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          flexShrink: 0
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload}
          accept="image/*,.pdf,.dst,.pes,.emb,.exp,.jef,.ai,.eps,.svg,.cdr"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAttachment}
          style={{
            background: '#f1f5f9',
            border: 'none',
            color: 'var(--navy-700)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isUploadingAttachment ? 'not-allowed' : 'pointer',
            flexShrink: 0
          }}
          title="Attach Image, PDF, Vector or Machine File"
        >
          {isUploadingAttachment ? <Loader2 size={17} className="animate-spin text-orange-500" /> : <Paperclip size={17} />}
        </button>

        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder={activeChannel === 'inbox' ? 'Type a message to Studio Digitizers...' : 'Type a question to 24/7 Support...'}
          style={{
            flex: 1,
            height: '42px',
            borderRadius: '24px',
            border: '1.5px solid var(--color-border)',
            padding: '0 1.15rem',
            fontSize: '0.85rem',
            color: 'var(--navy-950)',
            background: '#f8fafc',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={!messageInput.trim() && !attachedFile}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: (messageInput.trim() || attachedFile) ? '#ea580c' : '#94a3b8',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (messageInput.trim() || attachedFile) ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
