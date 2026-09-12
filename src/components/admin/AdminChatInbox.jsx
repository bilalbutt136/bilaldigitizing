'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { createClient } from '../../lib/supabase/client';
import OfferCardMessage from '../common/OfferCardMessage';
import AdminCreateOfferModal from './AdminCreateOfferModal';
import {
  Search,
  ChevronDown,
  Star,
  Paperclip,
  Smile,
  Zap,
  Video,
  Send,
  Download,
  Sparkles,
  Tag,
  MoreHorizontal,
  X,
  FileText,
  Layers,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  Clock,
  Plus,
  Trash2,
  CornerDownLeft,
  Undo2
} from 'lucide-react';

const COMMON_EMOJIS = ['👋', '✅', '🧵', '✨', '👌', '🙏', '📁', '👕', '🧢', '🔥', '🚀', '💯'];

export default function AdminChatInbox() {
  const { authUser, orders = [] } = useAppState();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unread' | 'starred'
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Tabs: 'messages' | 'saved'
  const [activeTab, setActiveTab] = useState('messages');

  // Input & Attachments
  const [inputText, setInputText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // AI Polish State
  const [isPolishing, setIsPolishing] = useState(false);
  const [previousDraft, setPreviousDraft] = useState(null);

  // Quick Auto-Replies State
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [savedReplies, setSavedReplies] = useState([]);
  const [newReplyTitle, setNewReplyTitle] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isAddingReply, setIsAddingReply] = useState(false);

  // Custom Offer Modal State
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);

  // Typing state
  const [isClientTyping, setIsClientTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Emoji picker toggle
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 1. Fetch Conversations
  const fetchConversations = async (filter = activeFilter, query = searchQuery) => {
    try {
      let url = `/api/chat/conversations?filter=${filter}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.conversations) {
        setConversations(data.conversations);
        // If no conversation selected, select first one
        if (!activeConversationId && data.conversations.length > 0) {
          setActiveConversationId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.warn('[Admin Chat] Failed to load conversations:', err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  // 2. Fetch Messages for Active Conversation
  const fetchActiveMessages = async (convId) => {
    if (!convId) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(convId)}`);
      const data = await res.json();
      if (data?.messages) {
        setMessages(data.messages);
        scrollToBottom();
      }

      // Mark conversation as read for admin
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', conversationId: convId })
      });

      // Update local unread counter
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_admin_count: 0 } : c));
    } catch (err) {
      console.warn('[Admin Chat] Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // 3. Fetch Saved Replies
  const fetchSavedReplies = async () => {
    try {
      const res = await fetch('/api/chat/saved-replies');
      const data = await res.json();
      if (data?.replies) {
        setSavedReplies(data.replies);
      }
    } catch (err) {
      console.warn('[Admin Chat] Failed to load saved replies:', err);
    }
  };

  useEffect(() => {
    fetchConversations(activeFilter, searchQuery);
    fetchSavedReplies();
  }, [activeFilter]);

  useEffect(() => {
    if (activeConversationId) {
      fetchActiveMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Real-time polling & typing check
  useEffect(() => {
    if (!activeConversationId) return;

    const interval = setInterval(async () => {
      // Check typing
      try {
        const tRes = await fetch(`/api/chat/typing?conversationId=${encodeURIComponent(activeConversationId)}&forRole=admin`);
        const tData = await tRes.json();
        setIsClientTyping(Boolean(tData?.isTyping));
      } catch {}

      // Refresh messages quietly
      try {
        const mRes = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(activeConversationId)}`);
        const mData = await mRes.json();
        if (mData?.messages && mData.messages.length !== messages.length) {
          setMessages(mData.messages);
          scrollToBottom();
        }
      } catch {}
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConversationId, messages.length]);

  // Realtime Supabase Channel Subscription for instant push
  useEffect(() => {
    if (!activeConversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`chat-admin-${activeConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConversationId}`
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
  }, [activeConversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  // Active conversation details
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Extract all attachments across this conversation for the Top Gallery
  const allAttachments = useMemo(() => {
    const list = [];
    messages.forEach(msg => {
      if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          if (att?.url && !list.some(item => item.url === att.url)) {
            list.push({ ...att, messageId: msg.id, createdAt: msg.created_at });
          }
        });
      } else if (msg.attachment_url && !list.some(item => item.url === msg.attachment_url)) {
        list.push({
          name: msg.attachment_name || 'attachment',
          url: msg.attachment_url,
          size: msg.attachment_size || '',
          type: msg.attachment_type || '',
          messageId: msg.id,
          createdAt: msg.created_at
        });
      }
    });
    return list;
  }, [messages]);

  // Toggle Star Conversation
  const handleToggleStar = async (convId, e) => {
    e?.stopPropagation();
    const target = conversations.find(c => c.id === convId);
    if (!target) return;
    const newStar = !target.is_starred;

    // Optimistic update
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_starred: newStar } : c));

    try {
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleStar', conversationId: convId, isStarred: newStar })
      });
    } catch {
      // Revert on error
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, is_starred: !newStar } : c));
    }
  };

  // Handle Typing indicator broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    // Notify backend of typing
    if (activeConversationId) {
      if (!typingTimeoutRef.current) {
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: activeConversationId, senderRole: 'admin', isTyping: true })
        }).catch(() => {});
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        fetch('/api/chat/typing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: activeConversationId, senderRole: 'admin', isTyping: false })
        }).catch(() => {});
        typingTimeoutRef.current = null;
      }, 2500);
    }
  };

  // AI Polish Feature
  const handleAiPolish = async () => {
    if (!inputText.trim() || isPolishing) return;
    setIsPolishing(true);
    setPreviousDraft(inputText);

    try {
      const res = await fetch('/api/chat/ai-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await res.json();
      if (data?.polishedText) {
        setInputText(data.polishedText);
        showToast('✨ Message polished with Google Gemini!', 'success');
      } else if (data?.error) {
        showToast(data.error, 'error');
      }
    } catch (err) {
      showToast('Failed to polish message. Please try again.', 'error');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleUndoPolish = () => {
    if (previousDraft !== null) {
      setInputText(previousDraft);
      setPreviousDraft(null);
      showToast('Reverted to previous draft', 'info');
    }
  };

  // File Upload Handler
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'chat-attachments');
        formData.append('folder', 'chat');

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
          showToast(`Failed to upload ${file.name}: ${data?.error || 'Unknown error'}`, 'error');
        }
      } catch (err) {
        showToast(`Upload failed for ${file.name}`, 'error');
      }
    }

    setPendingAttachments(prev => [...prev, ...uploaded]);
    setIsUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (index) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && pendingAttachments.length === 0) || isSendingMessage || !activeConversationId) return;

    const messageText = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];

    setIsSendingMessage(true);
    setInputText('');
    setPendingAttachments([]);
    setPreviousDraft(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          client_email: activeConversation?.client_email || 'client@studio.com',
          sender: 'admin',
          sender_name: 'Bilal Digitizing Support',
          sender_email: authUser?.email || 'admin@bilaldigitizing.com',
          text: messageText,
          type: attachmentsToSend.length > 0 && !messageText ? 'attachment' : 'text',
          attachments: attachmentsToSend
        })
      });

      const data = await res.json();
      if (data?.message) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();

        // Update thread snippet in left sidebar
        setConversations(prev => prev.map(c => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              last_message: messageText || (attachmentsToSend.length > 0 ? `📎 ${attachmentsToSend[0].name}` : 'New message'),
              last_message_at: new Date().toISOString()
            };
          }
          return c;
        }));
      }
    } catch (err) {
      showToast('Failed to send message.', 'error');
      setInputText(messageText);
      setPendingAttachments(attachmentsToSend);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Batch "Download All" handler
  const handleDownloadAll = () => {
    if (allAttachments.length === 0) return;
    showToast(`Starting download of ${allAttachments.length} file(s)...`, 'info');
    allAttachments.forEach((att, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = att.url;
        link.download = att.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 450);
    });
  };

  // Quick Reply creation
  const handleSaveNewReply = async () => {
    if (!newReplyTitle.trim() || !newReplyContent.trim()) {
      showToast('Title and content are required.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/chat/saved-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newReplyTitle, content: newReplyContent })
      });
      const data = await res.json();
      if (data?.reply) {
        setSavedReplies(prev => [...prev, data.reply]);
        setNewReplyTitle('');
        setNewReplyContent('');
        setIsAddingReply(false);
        showToast('Saved auto-reply added!', 'success');
      }
    } catch {
      showToast('Failed to save auto-reply', 'error');
    }
  };

  // Time format helper (e.g. "25 minutes", "8 hours", "Yesterday")
  const formatThreadTime = (isoString) => {
    if (!isoString) return '';
    try {
      const diffSecs = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
      if (diffSecs < 60) return 'Just now';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} minutes`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hours`;
      const diffDays = Math.floor(diffSecs / 86400);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days`;
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };
  const formatRelativeTime = formatThreadTime;

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
  };

  // Helper for image detection
  const isImageAttachment = (name = '', url = '') => {
    const check = (name || url || '').split('?')[0].toLowerCase();
    return /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(check);
  };

  // Helper for file format icon badge
  const renderAttachmentIcon = (name = '') => {
    const ext = name.split('.').pop().toLowerCase();
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
          <ImageIcon size={20} />
        </div>
      );
    }
    if (['dst', 'pes', 'emb', 'exp', 'jef'].includes(ext)) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fff7ed', border: '1px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontWeight: 800, fontSize: '0.7rem' }}>
          {ext.toUpperCase()}
        </div>
      );
    }
    if (['ai', 'eps', 'svg', 'cdr'].includes(ext)) {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem' }}>
          {ext.toUpperCase()}
        </div>
      );
    }
    if (ext === 'pdf') {
      return (
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontWeight: 800, fontSize: '0.7rem' }}>
          PDF
        </div>
      );
    }
    return (
      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        <FileText size={20} />
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      maxHeight: '100%',
      minHeight: 0,
      flex: 1,
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      position: 'relative',
      fontFamily: 'inherit'
    }}>
      {/* TOAST ALERT */}
      {toast && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 999,
          background: toast.type === 'error' ? '#ef4444' : (toast.type === 'success' ? '#16a34a' : '#0f172a'),
          color: '#ffffff',
          padding: '0.65rem 1.15rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.message}
        </div>
      )}

      {/* ============================================================ */}
      {/* LEFT SIDEBAR: THREADS LIST (Exact match to Fiverr Reference)  */}
      {/* ============================================================ */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        flexShrink: 0,
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* SIDEBAR HEADER: FILTER DROPDOWN & SEARCH */}
        <div style={{
          padding: '0.9rem 1.1rem',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          flexShrink: 0
        }}>
          {/* Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '1rem',
                fontWeight: 700,
                color: '#0f172a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {activeFilter === 'all' && 'All messages'}
              {activeFilter === 'unread' && 'Unread'}
              {activeFilter === 'starred' && 'Starred'}
              <ChevronDown size={16} color="#64748b" />
            </button>

            {isFilterDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '120%',
                left: 0,
                zIndex: 100,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                width: '160px',
                overflow: 'hidden'
              }}>
                {[
                  { id: 'all', label: 'All messages' },
                  { id: 'unread', label: 'Unread' },
                  { id: 'starred', label: 'Starred' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setActiveFilter(opt.id);
                      setIsFilterDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.6rem 0.9rem',
                      background: activeFilter === opt.id ? '#f8fafc' : '#ffffff',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: activeFilter === opt.id ? 700 : 500,
                      color: activeFilter === opt.id ? '#ea580c' : '#1e293b',
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Icon / Bar Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={() => fetchConversations(activeFilter, searchQuery)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              title="Refresh inbox"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        {/* SEARCH INPUT BAR */}
        <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #f8fafc', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
            gap: '0.5rem'
          }}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchConversations(activeFilter, e.target.value);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                width: '100%',
                color: '#0f172a'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchConversations(activeFilter, '');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* CONVERSATION ITEMS LIST */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {isLoadingThreads && conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
              <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem', color: '#ea580c' }} />
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
              <p style={{ fontSize: '0.88rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>No conversations found</p>
              <span style={{ fontSize: '0.78rem' }}>When clients send messages or place orders, threads will appear here.</span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const hasUnread = (conv.unread_admin_count || 0) > 0;
              const lastTime = formatThreadTime(conv.last_message_at || conv.updated_at);

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  style={{
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    background: isSelected ? '#f8fafc' : '#ffffff',
                    borderLeft: isSelected ? '3.5px solid #0f172a' : '3.5px solid transparent',
                    borderBottom: '1px solid #f8fafc',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = '#ffffff'; }}
                >
                  {/* CLIENT AVATAR */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: isSelected ? '#fed7aa' : '#f1f5f9',
                      color: isSelected ? '#c2410c' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}>
                      {(conv.client_name || conv.client_email || 'C')[0].toUpperCase()}
                    </div>
                    {/* Active Status Dot */}
                    <span style={{
                      position: 'absolute',
                      bottom: '1px',
                      right: '1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid #ffffff'
                    }} />
                  </div>

                  {/* THREAD DETAILS */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{
                        fontWeight: hasUnread ? 800 : 700,
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.client_name || conv.client_email?.split('@')[0]}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0 }}>
                        {lastTime}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: hasUnread ? '#0f172a' : '#64748b',
                        fontWeight: hasUnread ? 700 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {conv.last_message_text || 'Active thread'}
                      </p>

                      {/* STAR TOGGLE & UNREAD BADGE */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {hasUnread && (
                          <span style={{
                            background: '#ea580c',
                            color: '#ffffff',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '10px'
                          }}>
                            {conv.unread_admin_count}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(conv.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                          title={conv.is_starred ? 'Unstar' : 'Star'}
                        >
                          <Star
                            size={15}
                            color={conv.is_starred ? '#f59e0b' : '#cbd5e1'}
                            fill={conv.is_starred ? '#f59e0b' : 'none'}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT PANE: ACTIVE CONVERSATION (Exact match to Reference)   */}
      {/* ============================================================ */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        minWidth: 0,
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {activeConversation ? (
          <>
            {/* TOP HEADER: CLIENT INFO & ACTIONS */}
            <div style={{
              padding: '0.85rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#fed7aa',
                    color: '#c2410c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.05rem'
                  }}>
                    {(activeConversation.client_name || activeConversation.client_email || 'C')[0].toUpperCase()}
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid #ffffff'
                  }} />
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0', lineHeight: 1.2 }}>
                    {activeConversation.client_name || activeConversation.client_email?.split('@')[0]}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {activeConversation.client_email} • <span style={{ color: '#22c55e', fontWeight: 600 }}>Active in Studio</span>
                  </div>
                </div>
              </div>

              {/* ACTION ICONS: TAG, STAR, MENU */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={(e) => handleToggleStar(activeConversation.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: activeConversation.is_starred ? '#f59e0b' : '#64748b' }}
                  title="Star conversation"
                >
                  <Star size={19} fill={activeConversation.is_starred ? '#f59e0b' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Client Email: ${activeConversation.client_email}`, 'info')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}
                  title="Tag / View Details"
                >
                  <Tag size={19} />
                </button>
                <button
                  type="button"
                  onClick={() => fetchActiveMessages(activeConversation.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#64748b' }}
                  title="Refresh conversation"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>

            {/* NAVIGATION TABS: MESSAGES | SAVED (Exact match to Reference) */}
            <div style={{
              display: 'flex',
              padding: '0 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              background: '#ffffff',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('messages')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: activeTab === 'messages' ? 800 : 600,
                  color: activeTab === 'messages' ? '#0f172a' : '#64748b',
                  border: 'none',
                  borderBottom: activeTab === 'messages' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                Messages
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.92rem',
                  fontWeight: activeTab === 'saved' ? 800 : 600,
                  color: activeTab === 'saved' ? '#0f172a' : '#64748b',
                  border: 'none',
                  borderBottom: activeTab === 'saved' ? '2.5px solid #0f172a' : '2.5px solid transparent',
                  background: 'none',
                  cursor: 'pointer'
                }}
              >
                Saved ({savedReplies.length})
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'saved' ? (
              /* SAVED AUTO-REPLIES TAB */
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      Studio Canned Responses & Auto-Replies
                    </h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Click any auto-reply template to immediately load it into your composer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingReply(!isAddingReply)}
                    className="btn btn-sm btn-navy"
                    style={{ fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Template
                  </button>
                </div>

                {isAddingReply && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                    <input
                      type="text"
                      placeholder="Template Title (e.g. Turnaround Time Info)"
                      value={newReplyTitle}
                      onChange={(e) => setNewReplyTitle(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.65rem', fontSize: '0.85rem' }}
                    />
                    <textarea
                      placeholder="Template Content..."
                      rows={3}
                      value={newReplyContent}
                      onChange={(e) => setNewReplyContent(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.65rem', fontSize: '0.85rem' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setIsAddingReply(false)} className="btn btn-sm btn-outline">Cancel</button>
                      <button type="button" onClick={handleSaveNewReply} className="btn btn-sm btn-primary-orange">Save Template</button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  {savedReplies.map(reply => (
                    <div
                      key={reply.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{reply.title}</h5>
                          {reply.shortcut && (
                            <span style={{ fontSize: '0.7rem', color: '#ea580c', background: '#fff7ed', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                              {reply.shortcut}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
                          {reply.content}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInputText(reply.content);
                          setActiveTab('messages');
                          showToast('Loaded into composer!', 'success');
                        }}
                        style={{
                          background: '#0f172a',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        Use in Chat <CornerDownLeft size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* MESSAGES TAB */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }}>
                {/* ATTACHED FILES GALLERY (Exact match to Reference Image) */}
                {allAttachments.length > 0 && (
                  <div style={{
                    padding: '0.75rem 1.5rem',
                    borderBottom: '1px solid #f1f5f9',
                    background: '#ffffff',
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={handleDownloadAll}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: '#2563eb',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        Download All ({allAttachments.length})
                      </button>
                    </div>

                    {/* HORIZONTAL CARDS GALLERY */}
                    <div style={{
                      display: 'flex',
                      gap: '0.85rem',
                      overflowX: 'auto',
                      paddingBottom: '0.4rem'
                    }}>
                      {allAttachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          download={att.name}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: '#ffffff',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem',
                            textDecoration: 'none',
                            minWidth: '180px',
                            maxWidth: '220px',
                            flexShrink: 0,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          {renderAttachmentIcon(att.name)}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {att.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Download size={11} /> {att.size || 'Ready'}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* MESSAGES STREAM (ONLY THIS INNER STREAM SCROLLS) */}
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  {isLoadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.5rem', color: '#ea580c' }} />
                      Loading message history...
                    </div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', margin: '0 0 0.35rem 0' }}>
                        Start of conversation with {activeConversation.client_name || activeConversation.client_email}
                      </p>
                      <span style={{ fontSize: '0.8rem' }}>Send a message, design files, or create a custom offer below.</span>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdminMsg = msg.sender === 'admin';
                      const isOffer = msg.type === 'custom_offer' || Boolean(msg.offer_id);

                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
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
                            <span style={{ fontWeight: 700, color: isAdminMsg ? '#0f172a' : '#475569' }}>
                              {isAdminMsg ? 'Me' : (msg.sender_name || 'Client')}
                            </span>
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>

                          {/* CUSTOM OFFER CARD RENDERING */}
                          {isOffer ? (
                            <OfferCardMessage
                              offer={msg.offer_data || { id: msg.offer_id, title: 'Custom Digitizing Offer' }}
                              isCustomerView={false}
                              showToast={showToast}
                            />
                          ) : (
                            /* STANDARD CHAT BUBBLE */
                            <div style={{
                              maxWidth: '75%',
                              background: isAdminMsg ? '#0f172a' : '#f1f5f9',
                              color: isAdminMsg ? '#ffffff' : '#0f172a',
                              padding: '0.75rem 1rem',
                              borderRadius: isAdminMsg ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                              wordBreak: 'break-word',
                              fontSize: '0.88rem',
                              lineHeight: 1.5
                            }}>
                              {msg.text && (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                  {msg.text}
                                </div>
                              )}

                              {/* ATTACHMENTS INSIDE BUBBLE */}
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
                                            border: isAdminMsg ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                                            background: isAdminMsg ? 'rgba(0,0,0,0.25)' : '#ffffff',
                                            maxWidth: '340px'
                                          }}
                                        >
                                          <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Click to view full size photo"
                                            style={{ display: 'block', background: '#00000008', textDecoration: 'none' }}
                                          >
                                            <img
                                              src={att.url}
                                              alt={att.name || 'Photo'}
                                              loading="lazy"
                                              style={{
                                                display: 'block',
                                                width: '100%',
                                                maxHeight: '260px',
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
                                            borderTop: isAdminMsg ? '1px solid rgba(255,255,255,0.1)' : '1px solid #f1f5f9'
                                          }}>
                                            <span style={{
                                              fontWeight: 600,
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              maxWidth: '180px',
                                              color: isAdminMsg ? '#e2e8f0' : '#475569'
                                            }}>
                                              {att.name}
                                            </span>
                                            <a
                                              href={att.url}
                                              download={att.name}
                                              target="_blank"
                                              rel="noreferrer"
                                              style={{
                                                color: isAdminMsg ? '#38bdf8' : '#ea580c',
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
                                          background: isAdminMsg ? 'rgba(255,255,255,0.12)' : '#ffffff',
                                          color: isAdminMsg ? '#ffffff' : '#0f172a',
                                          textDecoration: 'none',
                                          fontSize: '0.78rem',
                                          border: isAdminMsg ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0'
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
                  {isClientTyping && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      <span className="dot-typing" />
                      {activeConversation.client_name || 'Client'} is typing...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ============================================================ */}
                {/* BOTTOM COMPOSER (LOCKED AT BOTTOM, NEVER PUSHED OFF SCREEN)  */}
                {/* ============================================================ */}
                <div style={{
                  padding: '0.85rem 1.5rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#ffffff',
                  flexShrink: 0
                }}>
                  {/* PENDING ATTACHMENTS PREVIEW WITH PHOTO THUMBNAIL */}
                  {pendingAttachments.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                      {pendingAttachments.map((att, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
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
                            onClick={() => removePendingAttachment(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* UNDO AI POLISH BANNER */}
                  {previousDraft !== null && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#fff7ed',
                      border: '1px solid #ffedd5',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#9a3412',
                      marginBottom: '0.5rem'
                    }}>
                      <span>✨ Message polished with Google Gemini.</span>
                      <button
                        type="button"
                        onClick={handleUndoPolish}
                        style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Undo2 size={13} /> Undo
                      </button>
                    </div>
                  )}

                  {/* TEXTAREA INPUT */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      rows={2}
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      style={{
                        width: '100%',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: 'inherit',
                        lineHeight: 1.4,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* COMPOSER TOOLBAR */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.65rem'
                  }}>
                    {/* LEFT TOOLS: CLIP, EMOJI, QUICK RESPONSES, VIDEO, AI POLISH */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept=".dst,.pes,.emb,.exp,.jef,.ofm,.pxf,.vp3,.hus,.xxx,.art,.ai,.eps,.svg,.cdr,.pdf,.png,.jpg,.jpeg,.webp,.zip,.rar,.7z"
                      />

                      {/* Paperclip */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingFiles}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                        title="Attach embroidery, vector, or artwork files"
                      >
                        {isUploadingFiles ? <Loader2 size={18} className="spin-icon" color="#ea580c" /> : <Paperclip size={18} />}
                      </button>

                      {/* Emoji Picker Toggle */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                          title="Insert emoji"
                        >
                          <Smile size={18} />
                        </button>
                        {isEmojiPickerOpen && (
                          <div style={{
                            position: 'absolute',
                            bottom: '120%',
                            left: 0,
                            zIndex: 100,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                            padding: '0.5rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '0.35rem',
                            width: '180px'
                          }}>
                            {COMMON_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setInputText(prev => prev + emoji);
                                  setIsEmojiPickerOpen(false);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', padding: '4px' }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quick Responses / Auto-Replies (Lightning Bolt) */}
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => setIsQuickRepliesOpen(!isQuickRepliesOpen)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                          title="Quick responses & saved auto-replies"
                        >
                          <Zap size={18} />
                        </button>

                        {isQuickRepliesOpen && (
                          <div style={{
                            position: 'absolute',
                            bottom: '120%',
                            left: 0,
                            zIndex: 100,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                            width: '280px',
                            maxHeight: '260px',
                            overflowY: 'auto'
                          }}>
                            <div style={{ padding: '0.6rem 0.85rem', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase' }}>
                              Quick Saved Replies
                            </div>
                            {savedReplies.map(r => (
                              <div
                                key={r.id}
                                onClick={() => {
                                  setInputText(r.content);
                                  setIsQuickRepliesOpen(false);
                                }}
                                style={{
                                  padding: '0.65rem 0.85rem',
                                  borderBottom: '1px solid #f8fafc',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.15rem' }}>{r.title}</div>
                                <div style={{ color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Video Camera Icon */}
                      <button
                        type="button"
                        onClick={() => showToast('Studio live consultation call link created', 'info')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                        title="Start studio video meeting"
                      >
                        <Video size={18} />
                      </button>

                      {/* AI POLISH SPARKLE BUTTON (Key User Request) */}
                      <button
                        type="button"
                        onClick={handleAiPolish}
                        disabled={isPolishing || !inputText.trim()}
                        style={{
                          background: isPolishing ? '#fed7aa' : '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #ffedd5',
                          borderRadius: '6px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isPolishing || !inputText.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                        title="Polish typos and elevate draft to professional studio English with Google Gemini"
                      >
                        {isPolishing ? (
                          <>
                            <Loader2 size={13} className="spin-icon" /> Polishing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} /> AI Polish
                          </>
                        )}
                      </button>
                    </div>

                    {/* RIGHT CONTROLS: CREATE AN OFFER & SEND (Exact match to Reference) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {/* "Create an offer" Button */}
                      <button
                        type="button"
                        onClick={() => setIsCreateOfferModalOpen(true)}
                        style={{
                          background: '#ffffff',
                          color: '#0f172a',
                          border: '1.5px solid #0f172a',
                          borderRadius: '6px',
                          padding: '0.4rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        Create an offer
                      </button>

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isSendingMessage || (!inputText.trim() && pendingAttachments.length === 0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isSendingMessage || (!inputText.trim() && pendingAttachments.length === 0) ? 'not-allowed' : 'pointer',
                          color: (!inputText.trim() && pendingAttachments.length === 0) ? '#cbd5e1' : '#0f172a',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Send message (Enter)"
                      >
                        {isSendingMessage ? (
                          <Loader2 size={20} className="spin-icon" color="#ea580c" />
                        ) : (
                          <Send size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#94a3b8',
            padding: '2rem'
          }}>
            <h4 style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '0.4rem' }}>No Conversation Selected</h4>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Select a client thread from the sidebar to view messages.</p>
          </div>
        )}
      </div>

      {/* CREATE CUSTOM OFFER MODAL */}
      {isCreateOfferModalOpen && activeConversation && (
        <AdminCreateOfferModal
          isOpen={isCreateOfferModalOpen}
          onClose={() => setIsCreateOfferModalOpen(false)}
          conversationId={activeConversation.id}
          clientName={activeConversation.client_name}
          clientEmail={activeConversation.client_email}
          onOfferCreated={(createdOffer) => {
            setIsCreateOfferModalOpen(false);
            fetchActiveMessages(activeConversation.id);
            showToast('Custom offer dispatched to client!', 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
