'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { fetchConversations, addChatMessage, markConversationAsRead, subscribeToLiveMessages } from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  ChevronRight,
  X
} from 'lucide-react';

// Helper to clean and deduplicate conversation threads by client email
const deduplicateThreads = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const map = new Map();
  rawList.forEach(conv => {
    const cleanMessages = (conv.messages || []).filter(m => m.id);

    const key = (conv.clientEmail || conv.clientName || conv.id || '').toLowerCase().trim();
    if (!key) return;

    if (!map.has(key)) {
      map.set(key, { ...conv, unreadCount: cleanMessages.length > 0 ? conv.unreadCount : 0, messages: cleanMessages });
    } else {
      const existing = map.get(key);
      const combinedMessages = [...(existing.messages || [])];
      cleanMessages.forEach(m => {
        if (!combinedMessages.some(ex => ex.id === m.id || (ex.text === m.text && ex.timestamp === m.timestamp))) {
          combinedMessages.push(m);
        }
      });
      map.set(key, {
        ...existing,
        messages: combinedMessages,
        unreadCount: combinedMessages.length > 0 ? Math.max(existing.unreadCount || 0, conv.unreadCount || 0) : 0
      });
    }
  });
  return Array.from(map.values());
};

export const AdminChatInbox = () => {
  const { showToast, setSelectedOrderForDrawer, orders = [] } = useAppState();

  const [conversations, setConversations] = useState([]);

  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'
  const [replyInput, setReplyInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadChats = async () => {
      if (!isMounted) return;
      const data = await fetchConversations();
      if (data && data.length > 0 && isMounted) {
        setConversations(deduplicateThreads(data));
      }
    };
    
    // Initial fetch once
    loadChats();
    
    // Realtime PostgreSQL subscription for instant message delivery
    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (!record) return;

        const newMsg = {
          id: record.id,
          conversation_id: record.conversation_id,
          sender: record.sender,
          senderName: record.sender_name,
          text: record.text,
          attachment: record.attachment,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        if (newMsg.sender === 'client') {
          playNotificationSound('receive');
        }

        setConversations(prev => {
          const exists = prev.some(c => c.id === newMsg.conversation_id);
          if (!exists) {
            // New conversation thread initiated, fetch latest
            loadChats();
            return prev;
          }

          return prev.map(c => {
            if (c.id === newMsg.conversation_id) {
              const alreadyHas = (c.messages || []).some(m => m.id === newMsg.id || (m.text === newMsg.text && m.timestamp === newMsg.timestamp));
              if (alreadyHas) return c;
              return {
                ...c,
                messages: [...(c.messages || []), newMsg],
                unreadCount: activeChatId === c.id ? 0 : (c.unreadCount || 0) + (newMsg.sender === 'client' ? 1 : 0),
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

        setConversations(prev => {
          const exists = prev.some(c => c.id === conv.id);
          if (!exists) {
            loadChats();
            return prev;
          }
          return prev.map(c => c.id === conv.id ? { ...c, ...conv } : c);
        });
      }
    );

    // Cross-tab and window event listener for instant local sync
    const handleLocalSync = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setConversations(deduplicateThreads(e.detail));
      }
    };
    window.addEventListener('bdigi_chat_update', handleLocalSync);

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('bdigi_chat_update', handleLocalSync);
    };
  }, [activeChatId]);

  // Internal auto-scroll chat feed to bottom without scrolling parent window
  const scrollToBottom = () => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, conversations]);

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0] || null;
  const currentActiveChatId = activeChat ? activeChat.id : activeChatId;

  // Auto-mark active chat as read
  useEffect(() => {
    if (activeChat && activeChat.unreadCount > 0) {
      markConversationAsRead(activeChat.id);
      setConversations(prev => prev.map(c => 
        c.id === activeChat.id ? { ...c, unreadCount: 0 } : c
      ));
    }
  }, [activeChat]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = (conv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.clientCompany || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.orderId || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterMode === 'unread') {
      return matchesSearch && conv.unreadCount > 0;
    }
    return matchesSearch;
  });

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!replyInput.trim() && !attachedFile) return;
    if (!currentActiveChatId) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'admin',
      senderName: 'Support Agent (You)',
      text: replyInput.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : ''),
      attachment: attachedFile ? attachedFile.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const saved = await addChatMessage(currentActiveChatId, newMsg);
    if (!saved) {
      showToast('Error sending message', 'error');
      return;
    }

    setConversations(prev => prev.map(conv => {
      if (conv.id === currentActiveChatId) {
        return {
          ...conv,
          unreadCount: 0,
          messages: [...(conv.messages || []), newMsg]
        };
      }
      return conv;
    }));

    setReplyInput('');
    setAttachedFile(null);
    playNotificationSound('send');
    showToast(`Reply sent to ${activeChat.clientName}!`, 'success');
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
    <div className="card" style={{ padding: 0, background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

      {/* Inbox Outer Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        height: '640px',
        maxHeight: 'calc(100vh - 180px)',
        overflow: 'hidden'
      }}>

        {/* ================= LEFT SIDEBAR CONVERSATIONS LIST ================= */}
        <div style={{
          borderRight: '1.5px solid var(--border-color)',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>

          {/* Header & Search Bar */}
          <div style={{ padding: '1.25rem 1rem 1rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} style={{ color: 'var(--orange-500)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Client Inbox
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', background: '#fff7ed', color: 'var(--orange-600)', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '9999px', border: '1px solid var(--orange-300)' }}>
                {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} Unread
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search client, company, or order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.1rem', fontSize: '0.825rem', height: '36px' }}
              />
            </div>

            {/* Unread Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'all' ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setFilterMode('all')}
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                All Chats ({conversations.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterMode === 'unread' ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setFilterMode('unread')}
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                Unread ({conversations.filter(c => c.unreadCount > 0).length})
              </button>
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div style={{ overflowY: 'auto', flex: 1, overscrollBehavior: 'contain' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active chat threads found.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeChat.id;
                const lastMsg = conv.messages[conv.messages.length - 1] || {};

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv.id)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid var(--border-color)',
                      background: isActive ? '#ffffff' : 'transparent',
                      borderLeft: isActive ? '4px solid var(--orange-500)' : '4px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {/* Avatar & Online Dot */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={conv.avatar}
                          alt={conv.clientName}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: conv.status === 'online' ? '#10b981' : '#94a3b8',
                          border: '2px solid #ffffff'
                        }} />
                      </div>

                      {/* Info & Last Message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.clientName}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {lastMsg.timestamp || ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--navy-700)', fontWeight: 600, marginBottom: '0.25rem' }}>
                          {conv.clientCompany} • <span style={{ color: 'var(--orange-600)' }}>{conv.orderId}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{
                            fontSize: '0.78rem',
                            color: conv.unreadCount > 0 ? 'var(--navy-900)' : 'var(--text-muted)',
                            fontWeight: conv.unreadCount > 0 ? 700 : 400,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '180px'
                          }}>
                            {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text || 'No messages yet'}
                          </p>

                          {conv.unreadCount > 0 && (
                            <span style={{
                              background: 'var(--orange-500)',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>


        {/* ================= RIGHT MESSAGING WINDOW ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', height: '100%', overflow: 'hidden' }}>

          {!activeChat ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#fff7ed', color: 'var(--orange-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 14px rgba(249, 115, 22, 0.2)' }}>
                <MessageSquare size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                No Active Client Support Conversations
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.55 }}>
                Chat threads will appear here automatically in real-time when registered clients initiate a message or support request from their portal.
              </p>
            </div>
          ) : (
            <>
              {/* Header Bar */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1.5px solid var(--border-color)',
                background: 'var(--navy-950)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ position: 'relative' }}>
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.clientName}
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--orange-500)' }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: activeChat.status === 'online' ? '#10b981' : '#94a3b8',
                      border: '2px solid #ffffff'
                    }} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {activeChat.clientName}
                      </h4>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontWeight: 700 }}>
                        {activeChat.clientCompany}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✉️ {activeChat.clientEmail}</span>
                      <span>•</span>
                      <span style={{ color: '#f97316', fontWeight: 700 }}>Active Order: {activeChat.orderId}</span>
                    </div>
                  </div>
                </div>

                {/* Header Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', fontSize: '0.78rem' }}
                    onClick={() => {
                      const matchOrd = orders.find(o => o.id === activeChat.orderId.replace('#', '')) || { id: activeChat.orderId, title: activeChat.orderTitle, clientName: activeChat.clientName };
                      setSelectedOrderForDrawer(matchOrd);
                    }}
                  >
                    Inspect Brief {activeChat.orderId} <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Messages Feed Container */}
              <div
                ref={chatFeedRef}
                style={{
                  flex: 1,
                  padding: '1.5rem',
                  overflowY: 'auto',
                  overscrollBehavior: 'contain',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* System Info Banner */}
                <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '0.35rem 0.95rem',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}>
                    🔒 End-to-End Encrypted Customer Support Channel • Order {activeChat.orderId}
                  </span>
                </div>

                {/* Empty Chat State Placeholder */}
                {activeChat.messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff7ed', color: 'var(--orange-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <MessageSquare size={26} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy-900)' }}>
                      No messages yet
                    </div>
                    <div style={{ fontSize: '0.825rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                      Type a reply below to start direct communication with {activeChat.clientName}.
                    </div>
                  </div>
                )}

                {/* Message Bubbles */}
                {activeChat.messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isAdmin ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.25rem',
                        fontWeight: 700,
                        padding: '0 0.25rem'
                      }}>
                        {msg.senderName} • {msg.timestamp}
                      </div>

                      <div style={{
                        maxWidth: '75%',
                        padding: '0.85rem 1.15rem',
                        borderRadius: isAdmin ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        background: isAdmin ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
                        color: isAdmin ? '#ffffff' : 'var(--navy-900)',
                        border: isAdmin ? '1.5px solid #0f172a' : '1.5px solid var(--border-color)',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.05)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5
                      }}>
                        {msg.text}

                        {msg.attachment && (
                          <div style={{
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: isAdmin ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: isAdmin ? '#f97316' : 'var(--navy-900)'
                          }}>
                            <Paperclip size={14} /> {msg.attachment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Messaging Input Area */}
              <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem 1.25rem', borderTop: '1.5px solid var(--border-color)', background: '#ffffff' }}>
                {attachedFile && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#fff7ed',
                    border: '1px solid var(--orange-400)',
                    color: 'var(--orange-800)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    marginBottom: '0.65rem'
                  }}>
                    <Paperclip size={14} /> Attached: {attachedFile.name} ({attachedFile.size})
                    <button type="button" onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                      border: '1.5px solid var(--border-color)',
                      color: 'var(--navy-700)',
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Attach Proof / File"
                  >
                    <Paperclip size={18} />
                  </button>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Type message reply to ${activeChat.clientName}...`}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    style={{ flex: 1, height: '42px', fontSize: '0.9rem' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{ height: '42px', padding: '0 1.35rem', fontWeight: 800, gap: '0.4rem', flexShrink: 0 }}
                  >
                    <Send size={16} /> Send Reply
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
