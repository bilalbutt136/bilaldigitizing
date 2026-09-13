'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { createClient } from '../../lib/supabase/client';
import OfferCardMessage from '../common/OfferCardMessage';
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
  Clock
} from 'lucide-react';

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

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  const adjustTextareaHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextH = Math.min(Math.max(el.scrollHeight, 40), 160);
    el.style.height = `${nextH}px`;
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

  // Realtime Polling & Typing check
  useEffect(() => {
    if (!conversationId) return;

    const interval = setInterval(async () => {
      // Check admin typing
      try {
        const tRes = await fetch(`/api/chat/typing?conversationId=${encodeURIComponent(conversationId)}&forRole=client`);
        const tData = await tRes.json();
        setIsAdminTyping(Boolean(tData?.isTyping));
      } catch {}

      // Refresh messages quietly
      try {
        const mRes = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}&clientEmail=${encodeURIComponent(userEmail)}`);
        const mData = await mRes.json();
        if (mData?.messages && mData.messages.length !== messages.length) {
          setMessages(mData.messages);
          scrollToBottom();
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [conversationId, messages.length, userEmail]);

  // Supabase Realtime Subscription
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`chat-client-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        if (payload.new) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Typing notification
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    adjustTextareaHeight(e.target);
    if (conversationId) {
      if (!typingTimeoutRef.current) {
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, senderRole: 'client', isTyping: true })
        }).catch(() => {});
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, senderRole: 'client', isTyping: false })
        }).catch(() => {});
        typingTimeoutRef.current = null;
      }, 2500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
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

    const messageText = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];

    setIsSending(true);
    setInputText('');
    setPendingAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    } catch {
      showToast('Failed to send message.', 'error');
      setInputText(messageText);
      setPendingAttachments(attachmentsToSend);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '580px',
      maxHeight: '100%',
      flex: 1,
      background: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
      position: 'relative',
      fontFamily: 'inherit'
    }}>
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

      {/* HEADER */}
      <div style={{
        padding: '0.9rem 1.25rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ea580c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.1rem'
            }}>
              BD
            </div>
            <span style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0f172a'
            }} />
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {chatType === 'support' ? '24/7 Studio Customer Support' : 'Studio Inbox & Custom Offers'} <ShieldCheck size={14} color="#38bdf8" />
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.1rem 0 0' }}>
              {chatType === 'support' 
                ? 'Online • Support Team Active 24/7 • Order & Revisions Help'
                : 'Direct Chat with Digitizers • Custom Offers & Stitch Quotes'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages(conversationId)}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', color: '#ffffff', cursor: 'pointer' }}
          title="Refresh chat"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* CHAT MESSAGES STREAM */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        background: '#f8fafc'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem', color: '#ea580c' }} />
            Connecting to Studio Digitizing Desk...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Headphones size={24} />
            </div>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Welcome to Bilal Digitizing Live Support
            </h4>
            <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '380px', marginInline: 'auto' }}>
              Have questions about an embroidery stitch file, vector artwork conversion, or need a rush quote? Type below and our team will assist you immediately.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isClient = msg.sender === 'client';
            const isOffer = msg.type === 'custom_offer' || Boolean(msg.offer_id);

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isClient ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                {/* SENDER LABEL & TIME */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.72rem',
                  color: '#94a3b8'
                }}>
                  <span style={{ fontWeight: 700, color: isClient ? '#ea580c' : '#0f172a' }}>
                    {isClient ? 'You' : 'Bilal Digitizing'}
                  </span>
                  <span>•</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>

                {/* CUSTOM OFFER CARD RENDERING */}
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
                    maxWidth: '80%',
                    background: isClient ? '#ea580c' : '#ffffff',
                    color: isClient ? '#ffffff' : '#0f172a',
                    padding: '0.75rem 1rem',
                    borderRadius: isClient ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                    border: isClient ? 'none' : '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                    fontSize: '0.88rem',
                    lineHeight: 1.5
                  }}>
                    {msg.text && <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>}

                    {/* ATTACHMENTS */}
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div style={{ marginTop: msg.text ? '0.65rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {msg.attachments.map((att, aIdx) => {
                          const isImg = isImageAttachment(att.name, att.url);
                          if (isImg) {
                            return (
                              <div
                                key={aIdx}
                                style={{
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  border: isClient ? '1px solid rgba(255,255,255,0.3)' : '1px solid #e2e8f0',
                                  background: isClient ? 'rgba(0,0,0,0.15)' : '#ffffff',
                                  maxWidth: '340px'
                                }}
                              >
                                <a
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Click to view full image"
                                  style={{ display: 'block', background: '#00000008', textDecoration: 'none' }}
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name || 'Image'}
                                    loading="lazy"
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      maxHeight: '250px',
                                      objectFit: 'contain',
                                      cursor: 'pointer',
                                      borderRadius: '8px 8px 0 0'
                                    }}
                                  />
                                </a>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.35rem 0.6rem',
                                  fontSize: '0.72rem',
                                  borderTop: isClient ? '1px solid rgba(255,255,255,0.15)' : '1px solid #f1f5f9'
                                }}>
                                  <span style={{
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '180px',
                                    color: isClient ? '#ffffff' : '#475569'
                                  }}>
                                    {att.name}
                                  </span>
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: isClient ? '#ffffff' : '#ea580c',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      textDecoration: 'none',
                                      fontWeight: 700
                                    }}
                                  >
                                    <Download size={12} /> {att.size || 'Download'}
                                  </a>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <a
                              key={aIdx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              download={att.name}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                background: isClient ? 'rgba(255,255,255,0.15)' : '#f8fafc',
                                color: isClient ? '#ffffff' : '#0f172a',
                                textDecoration: 'none',
                                fontSize: '0.78rem',
                                border: isClient ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0'
                              }}
                            >
                              <Download size={13} />
                              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {att.name}
                              </span>
                              {att.size && <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>({att.size})</span>}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* TYPING INDICATOR */}
        {isAdminTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
            <span className="dot-typing" />
            Bilal Digitizing Support is typing...
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
        style={{
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '0.65rem',
          flexShrink: 0
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '8px 4px', marginBottom: '4px' }}
          title="Attach artwork, logo, or stitch file"
        >
          {isUploading ? <Loader2 size={20} className="spin-icon" color="#ea580c" /> : <Paperclip size={20} />}
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={chatType === 'support' ? "Describe your question or issue to support..." : "Type a message or project inquiry..."}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: '1.5px solid #e2e8f0',
            borderRadius: '20px',
            padding: '0.65rem 1.15rem',
            fontSize: '0.88rem',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'none',
            minHeight: '40px',
            maxHeight: '160px',
            lineHeight: 1.4,
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}
        />

        <button
          type="submit"
          disabled={isSending || (!inputText.trim() && pendingAttachments.length === 0)}
          style={{
            background: (!inputText.trim() && pendingAttachments.length === 0) ? '#cbd5e1' : '#ea580c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!inputText.trim() && pendingAttachments.length === 0) ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            marginBottom: '3px'
          }}
        >
          {isSending ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
