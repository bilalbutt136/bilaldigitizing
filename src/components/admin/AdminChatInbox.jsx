'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { playNotificationSound, testPlayRingtone } from '../../utils/audioNotification';
import {
  MessageSquare,
  Send,
  Search,
  User,
  CheckCheck,
  Paperclip,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  ChevronRight,
  Zap,
  CheckCircle2,
  RefreshCw,
  X,
  Filter,
  Volume2,
  ArrowLeft,
  Download
} from 'lucide-react';

const INITIAL_CONVERSATIONS = [];

// Helper to clean and deduplicate conversation threads by client email
const deduplicateThreads = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const map = new Map();
  rawList.forEach(conv => {
    // Purge mock dummy contacts from legacy storage if they have no real messages
    const name = (conv.clientName || '').toLowerCase();
    const cleanMessages = (conv.messages || []).filter(m =>
      m.id && !['m1', 'm2', 'm3', 'msg-welcome', 'msg-welcome-1'].includes(m.id)
    );

    if (['sarah jenkins', 'michael chang', 'david miller', 'elena rostova'].includes(name) && cleanMessages.length === 0) {
      return;
    }

    if (cleanMessages.length === 0 && conv.id && ['chat-1', 'chat-2', 'chat-3', 'chat-4'].includes(conv.id)) {
      return;
    }

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

  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_admin_chats');
      const parsed = saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
      return deduplicateThreads(parsed);
    } catch {
      return deduplicateThreads(INITIAL_CONVERSATIONS);
    }
  });

  const [activeChatId, setActiveChatId] = useState('chat-1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unread'
  const [replyInput, setReplyInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [mobilePane, setMobilePane] = useState('list'); // 'list' | 'chat'

  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const instanceId = useRef('admin-' + Math.random().toString(36).substring(2, 9));
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Save & Broadcast to localStorage and real-time custom event listeners
  useEffect(() => {
    try {
      const newStr = JSON.stringify(conversations);
      const savedStr = localStorage.getItem('bdigi_admin_chats');
      if (newStr !== savedStr) {
        localStorage.setItem('bdigi_admin_chats', newStr);
        window.dispatchEvent(new CustomEvent('bdigi_chat_update', {
          detail: { chats: conversations, senderId: instanceId.current }
        }));
      }
    } catch (err) {
      console.warn('Error saving chats to storage:', err);
    }
  }, [conversations]);

  // Real-time Event Listener for incoming client messages across tabs and windows
  useEffect(() => {
    const syncChats = (e) => {
      let incomingChats = null;
      let senderId = null;

      if (e.type === 'bdigi_chat_update' && e.detail) {
        if (Array.isArray(e.detail)) {
          incomingChats = e.detail;
        } else if (e.detail.chats) {
          incomingChats = e.detail.chats;
          senderId = e.detail.senderId;
        }
      } else if (e.key === 'bdigi_admin_chats' && e.newValue) {
        try {
          incomingChats = JSON.parse(e.newValue);
        } catch (_) { }
      }

      if (!incomingChats) return;
      if (senderId === instanceId.current) return; // Prevent self-looping

      const incomingStr = JSON.stringify(incomingChats);
      const currentStr = JSON.stringify(conversationsRef.current);

      if (incomingStr !== currentStr) {
        const deduped = deduplicateThreads(incomingChats);
        conversationsRef.current = deduped;
        setConversations(deduped);
        playNotificationSound('ringtone');
      }
    };

    window.addEventListener('storage', syncChats);
    window.addEventListener('bdigi_chat_update', syncChats);
    return () => {
      window.removeEventListener('storage', syncChats);
      window.removeEventListener('bdigi_chat_update', syncChats);
    };
  }, []);

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
  }, [activeChatId, conversations, mobilePane]);

  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0] || null;
  const currentActiveChatId = activeChat ? activeChat.id : activeChatId;

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
    setMobilePane('chat');
    // Clear unread count for selected chat
    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!replyInput.trim() && !attachedFile) return;
    if (!currentActiveChatId) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'admin',
      senderName: 'Support Agent (You)',
      text: replyInput.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : ''),
      attachment: attachedFile ? attachedFile.name : null,
      fileUrl: attachedFile?.url || null,
      fileType: attachedFile?.type || null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

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
      const fileUrl = URL.createObjectURL(file);
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        url: fileUrl,
        type: file.type
      });
      showToast(`Attached ${file.name} to message`, 'info');
    }
  };

  const handleDownloadAttachment = (msg) => {
    const fileName = msg.attachment || 'attached_file';

    if (msg.fileUrl) {
      const link = document.createElement('a');
      link.href = msg.fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloading ${fileName}...`, 'success');
      return;
    }

    const isImage = fileName.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i);
    if (isImage) {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 600, 400);
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Bilal Digitizing - Chat Attachment', 40, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText(`File: ${fileName}`, 40, 160);
      ctx.fillText(`Timestamp: ${msg.timestamp || 'Recent'}`, 40, 200);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast(`Downloaded ${fileName}`, 'success');
      }, 'image/png');
      return;
    }

    const content = `Attachment: ${fileName}\nMessage Text: ${msg.text || ''}\nTimestamp: ${msg.timestamp || ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Downloaded ${fileName}`, 'success');
  };

  return (
    <div className="card" style={{ padding: 0, background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)' }}>

      {/* Inbox Outer Layout */}
      <div className="admin-chat-container">

        {/* ================= LEFT SIDEBAR CONVERSATIONS LIST ================= */}
        <div className={`admin-chat-sidebar-pane ${mobilePane === 'chat' ? 'admin-chat-pane-hidden-mobile' : ''}`} style={{
          borderRight: '1.5px solid var(--border-color)',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>

          {/* Header & Search Bar */}
          <div style={{ padding: '1.15rem 1rem 0.85rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} style={{ color: 'var(--orange-500)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Client Inbox
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={testPlayRingtone}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.725rem', gap: '0.25rem' }}
                  title="Test Ringtone Audio"
                >
                  <Volume2 size={13} style={{ color: 'var(--orange-500)' }} /> Ringtone
                </button>

                <span style={{ fontSize: '0.725rem', background: '#fff7ed', color: 'var(--orange-600)', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '9999px', border: '1px solid var(--orange-300)' }}>
                  {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)} Unread
                </span>
              </div>
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
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active chat threads found.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = activeChat && conv.id === activeChat.id;
                const lastMsg = conv.messages[conv.messages.length - 1] || {};

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv.id)}
                    style={{
                      padding: '0.9rem 1rem',
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
                          style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          background: conv.status === 'online' ? '#10b981' : '#94a3b8',
                          border: '2px solid #ffffff'
                        }} />
                      </div>

                      {/* Info & Last Message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.15rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {conv.clientName}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {lastMsg.timestamp || ''}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.725rem', color: 'var(--navy-700)', fontWeight: 600, marginBottom: '0.2rem' }}>
                          {conv.clientCompany} • <span style={{ color: 'var(--orange-600)' }}>{conv.orderId}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{
                            fontSize: '0.76rem',
                            color: conv.unreadCount > 0 ? 'var(--navy-900)' : 'var(--text-muted)',
                            fontWeight: conv.unreadCount > 0 ? 700 : 400,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '170px'
                          }}>
                            {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text || 'No messages yet'}
                          </p>

                          {conv.unreadCount > 0 && (
                            <span style={{
                              background: 'var(--orange-500)',
                              color: '#ffffff',
                              fontSize: '0.65rem',
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
        <div className={`admin-chat-main-pane ${mobilePane === 'list' ? 'admin-chat-pane-hidden-mobile' : ''}`} style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', height: '100%', overflow: 'hidden' }}>

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
                padding: '0.85rem 1.25rem',
                borderBottom: '1.5px solid var(--border-color)',
                background: 'var(--navy-950)',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.65rem',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobilePane('list')}
                    className="mobile-only"
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '0.35rem 0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ArrowLeft size={15} /> Back
                  </button>

                  <div style={{ position: 'relative' }}>
                    <img
                      src={activeChat.avatar}
                      alt={activeChat.clientName}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--orange-500)' }}
                    />
                    <span style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '11px',
                      height: '11px',
                      borderRadius: '50%',
                      background: activeChat.status === 'online' ? '#10b981' : '#94a3b8',
                      border: '2px solid #ffffff'
                    }} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {activeChat.clientName}
                      </h4>
                      <span style={{ fontSize: '0.68rem', background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', padding: '0.12rem 0.45rem', borderRadius: '9999px', fontWeight: 700 }}>
                        {activeChat.clientCompany}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>✉️ {activeChat.clientEmail}</span>
                      <span>•</span>
                      <span style={{ color: '#f97316', fontWeight: 700 }}>Order: {activeChat.orderId}</span>
                    </div>
                  </div>
                </div>

                {/* Header Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
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
                  padding: '1.25rem',
                  overflowY: 'auto',
                  minHeight: 0,
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                {/* System Info Banner */}
                <div style={{ textAlign: 'center', margin: '0.25rem 0 0.75rem' }}>
                  <span style={{
                    fontSize: '0.725rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    padding: '0.3rem 0.85rem',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}>
                    🔒 End-to-End Encrypted Customer Support Channel • Order {activeChat.orderId}
                  </span>
                </div>

                {/* Empty Chat State Placeholder */}
                {activeChat.messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fff7ed', color: 'var(--orange-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <MessageSquare size={24} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                      No messages yet
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
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
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.2rem',
                        fontWeight: 700,
                        padding: '0 0.2rem'
                      }}>
                        {msg.senderName} • {msg.timestamp}
                      </div>

                      <div style={{
                        maxWidth: '80%',
                        padding: '0.8rem 1.05rem',
                        borderRadius: isAdmin ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                        background: isAdmin ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
                        color: isAdmin ? '#ffffff' : 'var(--navy-900)',
                        border: isAdmin ? '1.5px solid #0f172a' : '1.5px solid var(--border-color)',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5
                      }}>
                        {msg.text}

                        {msg.attachment && (
                          <div style={{
                            marginTop: '0.6rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '10px',
                            background: isAdmin ? 'rgba(255, 255, 255, 0.12)' : '#f1f5f9',
                            border: isAdmin ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0, flex: 1 }}>
                              <Paperclip size={15} style={{ color: isAdmin ? '#f97316' : 'var(--orange-600)', flexShrink: 0 }} />
                              <span style={{
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: isAdmin ? '#ffffff' : 'var(--navy-900)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {msg.attachment}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(msg)}
                              style={{
                                background: isAdmin ? 'var(--orange-500)' : 'var(--navy-900)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.28rem 0.65rem',
                                fontSize: '0.725rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                transition: 'all 0.15s ease',
                                flexShrink: 0
                              }}
                              title={`Download ${msg.attachment}`}
                            >
                              <Download size={13} /> Download
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Messaging Input Area */}
              <form onSubmit={handleSendMessage} style={{
                padding: '0.85rem 1.25rem 1rem',
                borderTop: '1.5px solid var(--border-color)',
                background: '#ffffff',
                flexShrink: 0,
                position: 'sticky',
                bottom: 0,
                zIndex: 10
              }}>
                {attachedFile && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#fff7ed',
                    border: '1px solid var(--orange-400)',
                    color: 'var(--orange-800)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.65rem',
                    borderRadius: '9999px',
                    marginBottom: '0.55rem'
                  }}>
                    <Paperclip size={13} /> Attached: {attachedFile.name} ({attachedFile.size})
                    <button type="button" onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                      <X size={13} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
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
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Attach Proof / File"
                  >
                    <Paperclip size={17} />
                  </button>

                  <input
                    type="text"
                    className="form-control"
                    placeholder={`Type message reply to ${activeChat.clientName}...`}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    style={{ flex: 1, height: '40px', fontSize: '0.875rem' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{ height: '40px', padding: '0 1.25rem', fontWeight: 800, gap: '0.4rem', flexShrink: 0 }}
                  >
                    <Send size={15} /> Send
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
