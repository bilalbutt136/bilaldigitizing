'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { playNotificationSound } from '../../utils/audioNotification';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { fetchConversations, addChatMessage, createConversation, subscribeToLiveMessages } from '../../services/supabaseService';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Minimize2,
  Maximize2
} from 'lucide-react';

export const ClientLiveChatWidget = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { authUser, currentUser, showToast } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [chats, setChats] = useState([]);

  // Check if admin user or admin page to avoid mounting customer chat on admin screens
  const isExcluded = authUser?.role === 'admin' || 
    (typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/admin') || 
      window.location.pathname.startsWith('/secure-admin-login')
    ));

  useEffect(() => {
    if (!mounted || isExcluded) return;
    let isMounted = true;

    const loadChats = async () => {
      if (!isMounted) return;
      if (isSupabaseConfigured) {
        const data = await fetchConversations();
        if (data && data.length > 0 && isMounted) {
          setChats(data);
        }
      } else {
        try {
          const saved = typeof window !== 'undefined' && localStorage.getItem('bdigi_admin_chats');
          if (saved && isMounted) setChats(JSON.parse(saved));
        } catch {}
      }
    };

    // Initial load once on mount
    loadChats();

    // Supabase Realtime Live Message Subscription
    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (!record) return;

        const newMsg = {
          id: record.id,
          conversation_id: record.conversation_id,
          sender: record.sender,
          senderName: record.sender_name || (record.sender === 'admin' ? 'Master Digitizer' : cleanName),
          text: record.text,
          attachment: record.attachment,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        if (newMsg.sender === 'admin' || newMsg.sender === 'support') {
          playNotificationSound('receive');
        }

        setChats(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const isTargetConv = (c) => c.id === newMsg.conversation_id || (newMsg.conversation_id === 'general-support' && (c.id === 'general-support' || !c.orderId));
          const exists = safePrev.some(isTargetConv);

          if (!exists) {
            const newThread = {
              id: newMsg.conversation_id,
              clientName: newMsg.senderName || 'Client',
              clientEmail: clientEmail,
              clientCompany: clientCompany,
              orderId: 'General Inquiries',
              orderTitle: 'Live Support',
              status: 'online',
              unreadCount: 0,
              messages: [newMsg],
              updatedAt: newMsg.timestamp
            };
            return [newThread, ...safePrev];
          }

          return safePrev.map(c => {
            if (isTargetConv(c)) {
              const alreadyHas = (c.messages || []).some(m => m.id === newMsg.id || (m.text === newMsg.text && m.timestamp === newMsg.timestamp));
              if (alreadyHas) return c;
              return {
                ...c,
                messages: [...(c.messages || []), newMsg],
                updatedAt: newMsg.timestamp
              };
            }
            return c;
          });
        });
      },
      (convPayload) => {
        if (!isMounted) return;
        const conv = convPayload.new || convPayload.record;
        if (!conv) return;

        setChats(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const exists = safePrev.some(c => c.id === conv.id);
          if (!exists) {
            const newThread = {
              id: conv.id,
              clientName: conv.client_name || 'Client',
              clientEmail: conv.client_email || '',
              clientCompany: conv.client_company || 'Studio Client',
              orderId: conv.order_id || 'Support',
              orderTitle: conv.order_title || 'Direct Support',
              status: 'online',
              unreadCount: 0,
              messages: [],
              updatedAt: conv.created_at || new Date().toISOString()
            };
            return [newThread, ...safePrev];
          }
          return safePrev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
        });
      }
    );
    
    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [mounted, isExcluded]);

  // Real-time Event Listener for incoming admin replies across tabs and windows
  useEffect(() => {
    if (!mounted || isExcluded) return;
    const syncChats = (e) => {
      if (e.type === 'bdigi_chat_update' && e.detail) {
        setChats(e.detail);
        playNotificationSound('receive');
      } else if (e.key === 'bdigi_admin_chats' && e.newValue) {
        try {
          setChats(JSON.parse(e.newValue));
          playNotificationSound('receive');
        } catch { }
      }
    };

    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('storage', syncChats);
    window.addEventListener('bdigi_chat_update', syncChats);
    window.addEventListener('bdigi_open_chat', handleOpenChat);
    return () => {
      window.removeEventListener('storage', syncChats);
      window.removeEventListener('bdigi_chat_update', syncChats);
      window.removeEventListener('bdigi_open_chat', handleOpenChat);
    };
  }, [mounted, isExcluded]);

  const activeUser = authUser || currentUser || {
    name: 'Guest Client',
    email: 'guest@bdigitizing.pro',
    company: 'Public Visitor'
  };

  const cleanName = (activeUser?.name || 'Client').replace(/\s*\(ADMIN\)/gi, '').trim();
  const clientEmail = (activeUser?.email || 'guest@bdigitizing.pro').toLowerCase().trim();
  const clientCompany = activeUser?.company || `${cleanName}'s Account`;
  const avatarUrl = activeUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0f172a&color=fff`;

  // Safely resolve the active chat thread for regular support chat
  const safeChats = Array.isArray(chats) ? chats : [];
  const clientThread = safeChats.find(c => 
    c.id === 'general-support' || 
    (clientEmail && (c.clientEmail || '').toLowerCase().trim() === clientEmail) ||
    (!c.orderId && !c.order_id && !c.id?.startsWith('order-'))
  ) || {
    id: 'general-support',
    messages: []
  };

  const chatFeedRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chats]);

  // Mount Guard: Don't render until mounted or if on excluded screen
  if (!mounted || isExcluded) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const targetConvId = clientThread.id || 'general-support';
    const nowIso = new Date().toISOString();

    const newMsg = {
      id: 'msg-client-' + Date.now(),
      conversation_id: targetConvId,
      sender: 'client',
      senderName: cleanName,
      sender_name: cleanName,
      client_email: clientEmail,
      text: messageInput.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : ''),
      attachment: attachedFile ? attachedFile.name : null,
      timestamp: nowIso
    };

    setChats(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some(c => c.id === targetConvId || (clientEmail && (c.clientEmail || '').toLowerCase().trim() === clientEmail));

      if (exists) {
        return safePrev.map(c => {
          if (c.id === targetConvId || (clientEmail && (c.clientEmail || '').toLowerCase().trim() === clientEmail)) {
            return {
              ...c,
              unreadCount: 0,
              messages: [...(c.messages || []), newMsg],
              updatedAt: nowIso
            };
          }
          return c;
        });
      }

      const newThread = {
        id: targetConvId,
        clientName: cleanName,
        clientEmail: clientEmail,
        company: clientCompany,
        avatar: avatarUrl,
        orderId: 'General Inquiries',
        orderTitle: 'Live Digitizer & Studio Helpdesk',
        status: 'online',
        unreadCount: 0,
        messages: [newMsg],
        updatedAt: nowIso
      };
      return [newThread, ...safePrev];
    });

    try {
      localStorage.setItem('bdigi_admin_chats', JSON.stringify(chats));
      window.dispatchEvent(new CustomEvent('bdigi_chat_update', { detail: chats }));
    } catch { }

    if (isSupabaseConfigured) {
      try {
        await addChatMessage(targetConvId, newMsg);
      } catch (err) {
        console.warn('Persist widget message notice:', err);
      }
    }

    playNotificationSound('send');
    setMessageInput('');
    setAttachedFile(null);
    showToast('Message sent to Master Digitizer Support!', 'success');
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
      showToast(`Attached ${file.name} to message`, 'info');
    }
  };

  return (
    <>
      {/* Standalone Circular Floating Action Button */}
      {!isOpen && (
        <button
          id="floating-chat-trigger"
          type="button"
          className="live-chat-floating-button floating-chat-trigger"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 8500,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange-500) 0%, #ea580c 100%)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 10px 28px rgba(249, 115, 22, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'scale(1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 14px 34px rgba(249, 115, 22, 0.6), 0 6px 16px rgba(0, 0, 0, 0.25)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(249, 115, 22, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2)';
          }}
          aria-label="Toggle Live Support Chat"
        >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isOpen ? (
            <X size={24} style={{ color: '#ffffff' }} />
          ) : (
            <>
              <MessageSquare size={24} style={{ color: '#ffffff' }} />
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #1d4ed8'
              }} />
            </>
          )}
        </div>
      </button>
      )}

      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div 
          className="floating-chat-window"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            zIndex: 8800,
            width: '360px',
          height: isMinimized ? '60px' : '520px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.22)',
          border: '1.5px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'height 0.25s ease'
        }}>
          {/* Header Bar */}
          <div style={{
            padding: '0.85rem 1.15rem',
            background: 'var(--navy-950)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}>
            <div
              onClick={() => setIsMinimized(!isMinimized)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'var(--orange-500)',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem'
                }}>
                  💬
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
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', leading: 1.1 }}>
                  Bilal Digitizing Support
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                  ● Online • Real-Time Assistance
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Feed Container */}
              <div
                ref={chatFeedRef}
                style={{
                  flex: 1,
                  padding: '1rem',
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ textAlign: 'center', margin: '0.25rem 0 0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px'
                  }}>
                    🔒 Dedicated Direct Support Channel
                  </span>
                </div>

                {(clientThread.messages || []).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff7ed', color: 'var(--orange-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <MessageSquare size={20} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                      Live Digitizer Support
                    </div>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.25rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Ask questions, request custom embroidery quotes, or discuss active orders in real time.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                      {[
                        '🧵 I need a custom embroidery digitizing quote',
                        '⏱️ What are standard and rush turnaround times?',
                        '📦 Inquire about active digitizing or patch order',
                        '💬 Connect with Senior Digitizing Technician'
                      ].map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setMessageInput(prompt);
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.78rem',
                            color: 'var(--navy-800)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = 'var(--orange-500)';
                            e.currentTarget.style.color = 'var(--orange-600)';
                            e.currentTarget.style.background = '#fff7ed';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.color = 'var(--navy-800)';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(clientThread.messages || []).map((msg) => {
                  const isClient = msg.sender === 'client';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isClient ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.15rem',
                        fontWeight: 700,
                        padding: '0 0.2rem'
                      }}>
                        {msg.senderName} • {msg.timestamp}
                      </div>

                      <div style={{
                        maxWidth: '82%',
                        padding: '0.7rem 0.95rem',
                        borderRadius: isClient ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isClient ? 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)' : '#ffffff',
                        color: isClient ? '#ffffff' : 'var(--navy-900)',
                        border: isClient ? 'none' : '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        fontSize: '0.85rem',
                        lineHeight: 1.45
                      }}>
                        {msg.text}

                        {msg.attachment && (
                          <div style={{
                            marginTop: '0.4rem',
                            paddingTop: '0.4rem',
                            borderTop: isClient ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <Paperclip size={13} /> {msg.attachment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff' }}>
                {attachedFile && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#fff7ed',
                    border: '1px solid var(--orange-300)',
                    color: 'var(--orange-800)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    marginBottom: '0.45rem'
                  }}>
                    <Paperclip size={12} /> {attachedFile.name}
                    <button type="button" onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileAttach}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid var(--border-color)',
                      color: 'var(--navy-700)',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Attach File"
                  >
                    <Paperclip size={16} />
                  </button>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{ height: '36px', width: '36px', padding: 0, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      )}
    </>
  );
};
