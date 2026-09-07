'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Paperclip, 
  MessageSquare, 
  Clock, 
  CheckCheck, 
  Download, 
  ExternalLink, 
  FileCode, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCw, 
  User, 
  ShieldCheck, 
  Scissors 
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabaseClient';
import { uploadFileToCloudinaryFull, broadcastLiveMessage, subscribeToLiveMessages } from '../../services/supabaseService';

export const OrderChatModal = ({ 
  order, 
  isOpen, 
  onClose, 
  currentUserRole = 'admin', 
  currentUserName = '',
  showToast 
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const orderId = order?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (isBackground = false) => {
    if (!orderId) return;
    if (!isBackground) setIsLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetchOrderMessages',
          payload: { orderId }
        })
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.warn('Fetch order messages error:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!isOpen || !orderId) return;

    fetchMessages();

    // 1. Supabase Realtime channel
    let channel = null;
    try {
      if (supabaseClient) {
        channel = supabaseClient
          .channel(`order-chat-${orderId}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`
          }, (payload) => {
            if (payload?.new) {
              setMessages(prev => {
                const exists = prev.some(m => m.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new];
              });
              setTimeout(scrollToBottom, 100);
            }
          })
          .subscribe();
      }
    } catch (realtimeErr) {
      console.warn('Realtime subscription notice:', realtimeErr);
    }

    // 2. Realtime WebSocket Broadcast subscription via shared live hub
    const unsubBroadcast = subscribeToLiveMessages((msgPayload) => {
      const p = msgPayload?.new || msgPayload?.record;
      if (p && (String(p.order_id) === String(orderId) || String(p.conversation_id) === `order-${orderId}`)) {
        setMessages(prev => {
          if (prev.some(m => m.id === p.id)) return prev;
          return [...prev, {
            id: p.id,
            order_id: orderId,
            message: p.text || p.message || '',
            sender_name: p.sender_name || p.senderName || 'Staff',
            sender_role: p.sender_role || p.sender || 'admin',
            is_staff: p.is_staff ?? (p.sender === 'admin' || p.sender === 'worker'),
            attachment_url: p.attachment_url,
            attachment_name: p.attachment_name,
            attachment_size: p.attachment_size,
            created_at: p.created_at || p.timestamp || new Date().toISOString()
          }];
        });
        setTimeout(scrollToBottom, 100);
      }
    });

    // 3. Periodic background poll (every 6 seconds)
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 6000);

    return () => {
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
      if (unsubBroadcast) unsubBroadcast();
      clearInterval(interval);
    };
  }, [isOpen, orderId]);

  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [messages.length, isLoading]);

  if (!isOpen || !order) return null;

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText && !selectedFile) return;

    setIsSending(true);
    let attachmentUrl = null;
    let attachmentName = null;
    let attachmentSize = null;

    try {
      // Upload file if selected
      if (selectedFile) {
        setIsUploadingAttachment(true);
        try {
          const uploadRes = await uploadFileToCloudinaryFull(selectedFile);
          if (uploadRes?.url) {
            attachmentUrl = uploadRes.url;
            attachmentName = selectedFile.name;
            attachmentSize = `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;
          }
        } catch (uploadErr) {
          console.warn('Attachment upload fallback notice:', uploadErr);
        } finally {
          setIsUploadingAttachment(false);
        }
      }

      // Optimistic message
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        order_id: orderId,
        sender: currentUserRole,
        sender_role: currentUserRole,
        sender_name: currentUserName || (currentUserRole === 'admin' ? 'Production Manager' : (currentUserRole === 'worker' ? 'Assigned Digitizer' : 'Client')),
        message: cleanText,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, optimisticMsg]);
      setInputText('');
      setSelectedFile(null);
      setTimeout(scrollToBottom, 50);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMessage',
          payload: {
            order_id: orderId,
            message: cleanText,
            sender_name: optimisticMsg.sender_name,
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            attachment_size: attachmentSize
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to deliver message.');
      }

      // Replace optimistic message with actual DB row
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));
        broadcastLiveMessage({
          id: data.message.id || optimisticMsg.id,
          order_id: orderId,
          conversation_id: `order-${orderId}`,
          sender: currentUserRole,
          sender_role: currentUserRole,
          sender_name: optimisticMsg.sender_name,
          is_staff: currentUserRole === 'admin' || currentUserRole === 'worker',
          text: cleanText,
          message: cleanText,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_size: attachmentSize,
          created_at: data.message.created_at || new Date().toISOString()
        });
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not send message.', 'error');
    } finally {
      setIsSending(false);
      setIsUploadingAttachment(false);
    }
  };

  const getRoleBadge = (role, senderName) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin' || r === 'support' || r === 'staff') {
      return (
        <span style={{
          background: 'rgba(249, 115, 22, 0.15)',
          color: '#f97316',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '0.1rem 0.4rem',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem'
        }}>
          <ShieldCheck size={10} /> Production Manager
        </span>
      );
    }
    if (r === 'worker' || r === 'digitizer') {
      return (
        <span style={{
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          fontSize: '0.68rem',
          fontWeight: 800,
          padding: '0.1rem 0.4rem',
          borderRadius: '4px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem'
        }}>
          <Scissors size={10} /> Assigned Artist
        </span>
      );
    }
    return (
      <span style={{
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#34d399',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        fontSize: '0.68rem',
        fontWeight: 800,
        padding: '0.1rem 0.4rem',
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.2rem'
      }}>
        <User size={10} /> Client
      </span>
    );
  };

  const formatPlacementTiming = (dt) => {
    if (!dt) return 'Recently';
    try {
      const d = new Date(dt);
      if (isNaN(d.getTime())) return String(dt);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' at ' + d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(dt);
    }
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          height: '85vh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.25rem',
          background: '#0f172a',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                background: '#f97316',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '0.15rem 0.55rem',
                borderRadius: '5px'
              }}>
                {formatOrderId(order.id)}
              </span>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                Order Discussion: {order.title || 'Task Thread'}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} style={{ color: '#f97316' }} /> Placed: <strong style={{ color: '#cbd5e1' }}>{formatPlacementTiming(order.created_at || order.date)}</strong>
              </span>
              <span>•</span>
              <span>Status: <strong style={{ color: '#38bdf8' }}>{order.worker_status || order.status || 'Active'}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fetchMessages(false)}
              title="Refresh conversation"
              style={{
                background: '#334155',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Thread History */}
        <div style={{
          flex: 1,
          padding: '1.25rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#131d2e'
        }}>
          {isLoading ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8' }}>
              <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#f97316' }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Loading order messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b', maxWidth: '320px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <MessageSquare size={26} style={{ color: '#94a3b8' }} />
              </div>
              <h4 style={{ margin: '0 0 0.25rem 0', color: '#cbd5e1', fontSize: '0.95rem', fontWeight: 800 }}>
                No messages on this order yet
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem' }}>
                Use this chat to communicate specific details, questions, or updates regarding Order {formatOrderId(order.id)}.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const senderRole = (msg.sender_role || msg.sender || '').toLowerCase();
              const isMe = (currentUserRole === 'admin' && senderRole === 'admin') ||
                           (currentUserRole === 'worker' && senderRole === 'worker') ||
                           (currentUserRole === 'client' && senderRole === 'client');

              const hasAttachment = Boolean(msg.attachment_url || msg.attachment);
              const attachmentUrl = msg.attachment_url || (typeof msg.attachment === 'string' && msg.attachment.startsWith('http') ? msg.attachment : null);
              const isImage = attachmentUrl && (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(attachmentUrl) || attachmentUrl.includes('/artwork/'));

              return (
                <div 
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    alignSelf: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Sender Name & Role Label */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem', padding: '0 0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                      {msg.sender_name || 'Team Member'}
                    </span>
                    {getRoleBadge(msg.sender_role || msg.sender, msg.sender_name)}
                  </div>

                  {/* Message Bubble */}
                  <div style={{
                    background: isMe ? '#f97316' : '#1e293b',
                    color: isMe ? '#ffffff' : '#f1f5f9',
                    border: isMe ? 'none' : '1px solid #334155',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    padding: '0.75rem 1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    fontSize: '0.875rem',
                    lineHeight: 1.45,
                    wordBreak: 'break-word'
                  }}>
                    {msg.message || msg.text}

                    {/* Attachment Preview / Link */}
                    {hasAttachment && (
                      <div style={{ marginTop: '0.6rem', borderTop: isMe ? '1px solid rgba(255,255,255,0.2)' : '1px solid #334155', paddingTop: '0.5rem' }}>
                        {isImage ? (
                          <div style={{ borderRadius: '8px', overflow: 'hidden', maxWidth: '240px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img 
                              src={attachmentUrl} 
                              alt="Attachment preview" 
                              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '180px', objectFit: 'contain' }}
                            />
                            <div style={{ padding: '0.4rem 0.6rem', background: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                                {msg.attachment_name || 'Image Preview'}
                              </span>
                              <a 
                                href={attachmentUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                download
                                style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 700 }}
                              >
                                <Download size={12} /> Save
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            background: isMe ? 'rgba(0,0,0,0.15)' : '#0f172a',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                              <FileCode size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                              <span style={{ fontSize: '0.78rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {msg.attachment_name || 'Production File Attachment'}
                              </span>
                            </div>
                            {attachmentUrl && (
                              <a 
                                href={attachmentUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                download
                                style={{ color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', textDecoration: 'none', fontWeight: 700 }}
                              >
                                <Download size={12} /> Download
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.25rem', padding: '0 0.25rem' }}>
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sent'}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <div style={{
          padding: '0.85rem 1.15rem',
          background: '#0f172a',
          borderTop: '1px solid #334155'
        }}>
          {selectedFile && (
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '0.4rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.78rem'
            }}>
              <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Paperclip size={13} /> {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach reference image or document"
              style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.6rem',
                color: selectedFile ? '#38bdf8' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type a message regarding ${formatOrderId(order.id)}...`}
              disabled={isSending || isUploadingAttachment}
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.65rem 0.95rem',
                fontSize: '0.875rem',
                color: '#ffffff',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isSending || isUploadingAttachment}
              style={{
                background: (inputText.trim() || selectedFile) && !isSending ? '#f97316' : '#475569',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: (inputText.trim() || selectedFile) && !isSending ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send size={15} /> Send
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
