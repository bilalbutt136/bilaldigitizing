'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAppState } from '../../context/StateContext';
import { createClient } from '../../lib/supabase/client';
import OfferCardMessage from '../common/OfferCardMessage';
import AdminCreateOfferModal from './AdminCreateOfferModal';
import { downloadFileDirectly, openFileInNewTab } from '../../utils/fileDownloader';
import { playMessageChime, playMessageChimeForMessage, stopNotificationSound, unlockAudioContext } from '../../utils/audioNotification';
import { subscribeToPresence, syncPresenceFromRest } from '../../services/presenceService';
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
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  Clock,
  Plus,
  Trash2,
  CornerDownLeft,
  Undo2,
  ExternalLink,
  Volume2,
  VolumeX
} from 'lucide-react';

const COMMON_EMOJIS = ['👋', '✅', '🧵', '✨', '👌', '🙏', '📁', '👕', '🧢', '🔥', '🚀', '💯'];

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

export default function AdminChatInbox({ initialChannel = 'inbox' }) {
  const { authUser, orders = [] } = useAppState();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Channel filter: 'inbox' | 'support' (Strictly isolated channels, no 'all')
  const [activeChannel, setActiveChannel] = useState(initialChannel === 'support' ? 'support' : 'inbox');

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
  const isTypingActiveRef = useRef(false);
  const clientTypingDismissRef = useRef(null);
  const channelRef = useRef(null);

  // Live Online Presence State (Set of active client emails)
  const [onlineEmails, setOnlineEmails] = useState(new Set());

  // Evaluates whether a conversation client is currently online
  const isClientOnline = useCallback((conv) => {
    if (!conv) return false;
    const email = (conv.client_email || '').toLowerCase().trim();
    if (email && onlineEmails.has(email)) return true;

    // Fallback: check database status column with strict 2.5 minute window
    if (conv.status === 'online' || conv.is_online === true) {
      const lastActive = conv.last_seen_at || conv.last_message_at || conv.updated_at;
      if (lastActive) {
        const diffMs = Date.now() - new Date(lastActive).getTime();
        if (diffMs < 2.5 * 60 * 1000) return true;
      }
    }
    return false;
  }, [onlineEmails]);

  // Formats human-friendly last seen timestamp for offline clients
  const formatLastSeen = useCallback((dateStr) => {
    if (!dateStr) return 'Offline';
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      if (isNaN(diffMs) || diffMs < 0) return 'Offline';

      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHr / 24);

      if (diffSec < 90) return 'Active just now';
      if (diffMin < 60) return `Active ${diffMin}m ago`;
      if (diffHr < 24) return `Active ${diffHr}h ago`;
      if (diffDay === 1) return 'Active yesterday';
      if (diffDay < 7) return `Active ${diffDay}d ago`;
      return `Active ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } catch {
      return 'Offline';
    }
  }, []);

  // Emoji picker toggle
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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
      console.error('[Admin Chat] Download error:', err);
      showToast(`Failed to download ${att.name || 'file'}.`, 'error');
    } finally {
      setDownloadingFileUrl(null);
    }
  };

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const adjustTextareaHeight = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    const nextH = Math.min(Math.max(el.scrollHeight, 48), 180);
    el.style.height = `${nextH}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [inputText]);

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
      playMessageChime(true);
      showToast('🔔 Admin audio alerts active & chime tested loud and clear!', 'success');
    } else {
      showToast('🔕 Admin audio alerts muted.', 'info');
    }
  };

  // Channel unread counts: { inbox: number, support: number }
  const [channelUnreadCounts, setChannelUnreadCounts] = useState({ inbox: 0, support: 0 });

  const fetchChannelUnreadCounts = useCallback(async () => {
    try {
      const [inboxRes, supportRes] = await Promise.all([
        fetch('/api/chat/conversations?filter=unread&channel=inbox'),
        fetch('/api/chat/conversations?filter=unread&channel=support')
      ]);
      const [inboxData, supportData] = await Promise.all([inboxRes.json(), supportRes.json()]);

      const inboxTotal = (inboxData?.conversations || []).reduce((sum, c) => sum + (c.unread_admin_count || 0), 0);
      const supportTotal = (supportData?.conversations || []).reduce((sum, c) => sum + (c.unread_admin_count || 0), 0);

      setChannelUnreadCounts({ inbox: inboxTotal, support: supportTotal });
    } catch {}
  }, []);

  useEffect(() => {
    if (initialChannel) {
      setActiveChannel(initialChannel === 'support' ? 'support' : 'inbox');
    }
  }, [initialChannel]);

  // 1. Fetch Conversations
  const fetchConversations = async (filter = activeFilter, query = searchQuery, channel = activeChannel, silent = false) => {
    try {
      const targetChannel = channel === 'support' ? 'support' : 'inbox';
      let url = `/api/chat/conversations?filter=${filter}&channel=${targetChannel}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data?.conversations) {
        setConversations(data.conversations);
        if (!silent) {
          // If current active conversation is not in this channel's list, select first one or reset
          if (data.conversations.length > 0) {
            if (!activeConversationId || !data.conversations.some(c => c.id === activeConversationId)) {
              setActiveConversationId(data.conversations[0].id);
            }
          } else {
            setActiveConversationId(null);
            setMessages([]);
          }
        }
      }
      fetchChannelUnreadCounts();
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

      // Mark conversation as read for admin and stop any ringing notification tune
      stopNotificationSound();
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', conversationId: convId })
      });

      // Update local unread counter
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_admin_count: 0 } : c));
      fetchChannelUnreadCounts();
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
    fetchConversations(activeFilter, searchQuery, activeChannel);
    fetchSavedReplies();
    fetchChannelUnreadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeChannel]);

  useEffect(() => {
    if (activeConversationId) {
      fetchActiveMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Real-time polling & silent sync
  useEffect(() => {
    const interval = setInterval(async () => {
      // 1. Silent sync for active conversation messages
      if (activeConversationId) {
        try {
          const tRes = await fetch(`/api/chat/typing?conversationId=${encodeURIComponent(activeConversationId)}&forRole=admin`);
          const tData = await tRes.json();
          if (tData?.isTyping) {
            setIsClientTyping(true);
            clearTimeout(clientTypingDismissRef.current);
            clientTypingDismissRef.current = setTimeout(() => {
              setIsClientTyping(false);
            }, 3500);
          }
        } catch {}

        try {
          const mRes = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(activeConversationId)}`);
          const mData = await mRes.json();
          if (mData?.messages && mData.messages.length !== messages.length) {
            setMessages(mData.messages);
            scrollToBottom();
          }
        } catch {}
      }

      // 2. Silent sync for channel threads
      try {
        const targetChannel = activeChannel === 'support' ? 'support' : 'inbox';
        let url = `/api/chat/conversations?filter=${activeFilter}&channel=${targetChannel}`;
        if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
        const cRes = await fetch(url);
        const cData = await cRes.json();
        if (cData?.conversations) {
          setConversations(cData.conversations);
        }
      } catch {}

      // 3. Keep badges fresh
      fetchChannelUnreadCounts();
    }, 4000);

    return () => clearInterval(interval);
  }, [activeConversationId, messages.length, activeChannel, activeFilter, searchQuery, fetchChannelUnreadCounts]);

  // Global Realtime Supabase Channel Subscription for instant push & broadcast
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // 1. Dedicated active room channel for instant messages and typing
    let activeChannelSub = null;
    if (activeConversationId) {
      activeChannelSub = supabase
        .channel(`chat-room-${activeConversationId}`, {
          config: { broadcast: { self: false } }
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`
        }, (payload) => {
          if (payload.new) {
            // When message arrives in the currently active conversation, stop any ringing tune
            stopNotificationSound();
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            scrollToBottom();
          }
        })
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload?.role === 'client') {
            const active = Boolean(payload.isTyping);
            setIsClientTyping(active);
            clearTimeout(clientTypingDismissRef.current);
            if (active) {
              clientTypingDismissRef.current = setTimeout(() => {
                setIsClientTyping(false);
              }, 3500);
            }
          }
        })
        .subscribe();

      channelRef.current = activeChannelSub;
    }

    // 2. Global listener across ALL messages & conversations
    // Strictly plays ONLY ONE chime per message and stops immediately if active thread is viewed
    const globalSub = supabase
      .channel('admin-global-chat-monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (payload.new && payload.new.sender === 'client') {
          // If this message belongs to the conversation currently open in front of admin:
          if (payload.new.conversation_id === activeConversationId) {
            stopNotificationSound();
            fetch('/api/chat/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'markRead', conversationId: activeConversationId })
            }).catch(() => {});
          } else {
            // Customer messaged a different thread: ring exactly ONCE with message ID deduplication!
            playMessageChimeForMessage(payload.new.id);
          }

          // Refresh conversations and unread badges immediately
          fetchConversations(activeFilter, searchQuery, activeChannel, true);
          fetchChannelUnreadCounts();
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        fetchConversations(activeFilter, searchQuery, activeChannel, true);
        fetchChannelUnreadCounts();
      })
      .subscribe();

    return () => {
      clearTimeout(clientTypingDismissRef.current);
      channelRef.current = null;
      if (activeChannelSub) supabase.removeChannel(activeChannelSub);
      supabase.removeChannel(globalSub);
    };
  }, [activeConversationId, activeChannel, activeFilter, searchQuery, fetchChannelUnreadCounts]);

  // Dedicated Presence Subscription via shared presenceService (crash-proof)
  useEffect(() => {
    const unsubscribePresence = subscribeToPresence((onlineSet) => {
      setOnlineEmails(onlineSet);
    });

    syncPresenceFromRest();
    const interval = setInterval(syncPresenceFromRest, 15000);

    return () => {
      unsubscribePresence();
      clearInterval(interval);
    };
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior
        });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }
    }, 50);
  };

  // Auto-scroll whenever messages change or load finishes
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isLoadingMessages]);

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

  // Active conversation details
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

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

  // Broadcast typing helper with immediate WebSocket dispatch & API backup
  const broadcastTyping = useCallback((isTyping) => {
    if (!activeConversationId) return;
    const typingBool = Boolean(isTyping);

    // 1. Instant WebSocket Realtime broadcast (<30ms)
    try {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            role: 'admin',
            isTyping: typingBool,
            conversationId: activeConversationId,
            timestamp: Date.now()
          }
        });
      }
    } catch (err) {
      console.warn('Realtime admin typing broadcast notice:', err);
    }

    // 2. Serverless API sync fallback
    fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConversationId, senderRole: 'admin', isTyping: typingBool })
    }).catch(() => {});
  }, [activeConversationId]);

  // Handle Typing indicator broadcast
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    adjustTextareaHeight(e.target);

    if (activeConversationId) {
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

    // Immediately cancel and broadcast typing cessation
    clearTimeout(typingTimeoutRef.current);
    if (isTypingActiveRef.current) {
      isTypingActiveRef.current = false;
      broadcastTyping(false);
    }

    const messageText = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];

    stopNotificationSound();
    setIsSendingMessage(true);
    setInputText('');
    setPendingAttachments([]);
    setPreviousDraft(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversationId,
          client_email: activeConversation?.client_email || 'client@studio.com',
          sender: 'admin',
          sender_name: 'BDigitizing Support',
          sender_email: authUser?.email || 'admin@bdigitizing.com',
          text: messageText,
          type: attachmentsToSend.length > 0 && !messageText ? 'attachment' : 'text',
          attachments: attachmentsToSend
        })
      });

      const data = await res.json();
      if (data?.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
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
    stopNotificationSound();
    setActiveConversationId(convId);
  };

  // Helper for image detection
  const isImageAttachment = (name = '', url = '') => {
    const check = (name || url || '').split('?')[0].toLowerCase();
    return /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(check);
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

        {/* CHANNEL TABS: INBOX & OFFERS vs 24/7 SUPPORT DESK (Strict Channel Separation) */}
        <div style={{
          display: 'flex',
          gap: '0.45rem',
          padding: '0.45rem 1rem',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => {
              if (activeChannel !== 'inbox') {
                setActiveChannel('inbox');
                setMessages([]);
                setActiveConversationId(null);
                fetchConversations(activeFilter, searchQuery, 'inbox');
              }
            }}
            style={{
              flex: 1,
              padding: '0.45rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: activeChannel === 'inbox' ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
              background: activeChannel === 'inbox' ? '#fff7ed' : '#ffffff',
              color: activeChannel === 'inbox' ? '#ea580c' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>📥</span>
            <span>Inbox & Offers</span>
            {channelUnreadCounts.inbox > 0 && (
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '0.1rem 0.35rem',
                borderRadius: '8px',
                lineHeight: 1
              }}>
                {channelUnreadCounts.inbox}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeChannel !== 'support') {
                setActiveChannel('support');
                setMessages([]);
                setActiveConversationId(null);
                fetchConversations(activeFilter, searchQuery, 'support');
              }
            }}
            style={{
              flex: 1,
              padding: '0.45rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: activeChannel === 'support' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: activeChannel === 'support' ? '#eff6ff' : '#ffffff',
              color: activeChannel === 'support' ? '#2563eb' : '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🎧</span>
            <span>Support Desk</span>
            {channelUnreadCounts.support > 0 && (
              <span style={{
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '0.1rem 0.35rem',
                borderRadius: '8px',
                lineHeight: 1
              }}>
                {channelUnreadCounts.support}
              </span>
            )}
          </button>
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
              <p style={{ fontSize: '0.88rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>
                {activeChannel === 'support' ? 'No support tickets found' : 'No inbox conversations found'}
              </p>
              <span style={{ fontSize: '0.78rem' }}>
                {activeChannel === 'support'
                  ? 'Client inquiries submitted via 24/7 Support Desk will appear here.'
                  : 'Direct client inquiries, orders, and custom offers will appear here.'}
              </span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              const hasUnread = (conv.unread_admin_count || 0) > 0;
              const lastTime = formatThreadTime(conv.last_message_at || conv.updated_at);
              const isOnline = isClientOnline(conv);

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
                    {/* Active Status Dot - ONLY when client is online */}
                    {isOnline && (
                      <span
                        title="Online now"
                        style={{
                          position: 'absolute',
                          bottom: '1px',
                          right: '1px',
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 4px rgba(34, 197, 94, 0.6)'
                        }}
                      />
                    )}
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
                  {isClientOnline(activeConversation) && (
                    <span
                      title="Online now"
                      style={{
                        position: 'absolute',
                        bottom: '1px',
                        right: '1px',
                        width: '11px',
                        height: '11px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 5px rgba(34, 197, 94, 0.6)'
                      }}
                    />
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem 0', lineHeight: 1.2 }}>
                    {activeConversation.client_name || activeConversation.client_email?.split('@')[0]}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {activeConversation.client_email} • {isClientOnline(activeConversation) ? (
                      <span style={{ color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                        Online now
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                        {formatLastSeen(activeConversation.last_seen_at || activeConversation.last_message_at || activeConversation.updated_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION ICONS: SOUND, TAG, STAR, REFRESH */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleToggleSound}
                  style={{
                    background: isAudioEnabled ? '#ecfdf5' : '#f1f5f9',
                    border: isAudioEnabled ? '1px solid #a7f3d0' : '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    color: isAudioEnabled ? '#059669' : '#64748b',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease'
                  }}
                  title={isAudioEnabled ? "Admin sound alerts enabled (Click to test chime or mute)" : "Admin sound alerts muted (Click to enable)"}
                >
                  {isAudioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  <span>{isAudioEnabled ? 'Sound ON' : 'Muted'}</span>
                </button>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
                {/* MESSAGES STREAM (ONLY THIS INNER STREAM SCROLLS) */}
                <div
                  ref={messagesContainerRef}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    scrollBehavior: 'smooth'
                  }}
                >
                  {isLoadingMessages ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
                      <Loader2 size={24} className="spin-icon" style={{ color: '#ea580c', marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading message history...</span>
                    </div>
                  ) : uniqueMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', margin: '0 0 0.35rem 0' }}>
                        Start of conversation with {activeConversation.client_name || activeConversation.client_email}
                      </p>
                      <span style={{ fontSize: '0.8rem' }}>Send a message, design files, or create a custom offer below.</span>
                    </div>
                  ) : (
                    uniqueMessages.map((msg, index) => {
                      const isAdminMsg = msg.sender === 'admin';
                      const isOffer = msg.type === 'custom_offer' || Boolean(msg.offer_id);

                      const prevMsg = uniqueMessages[index - 1];
                      const nextMsg = uniqueMessages[index + 1];

                      // Date header logic
                      const currDate = new Date(msg.created_at).toDateString();
                      const prevDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                      const showDateHeader = currDate !== prevDate;

                      // Grouping logic: same sender and sent within 5 minutes
                      const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender || showDateHeader ||
                        (new Date(msg.created_at) - new Date(prevMsg.created_at) > 5 * 60 * 1000);
                      const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender ||
                        (new Date(nextMsg.created_at).toDateString() !== currDate) ||
                        (new Date(nextMsg.created_at) - new Date(msg.created_at) > 5 * 60 * 1000);

                      const timeString = new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                      return (
                        <React.Fragment key={msg.id || index}>
                          {/* Calendar Day Separator */}
                          {showDateHeader && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem 0 0.5rem 0', userSelect: 'none' }}>
                              <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }} />
                              <span style={{
                                padding: '0.2rem 0.75rem',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: '#64748b',
                                background: '#ffffff',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                margin: '0 0.75rem',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                              }}>
                                {formatChatDateHeader(msg.created_at)}
                              </span>
                              <div style={{ height: '1px', background: '#e2e8f0', flex: 1 }} />
                            </div>
                          )}

                          {/* Message Row with Correct Flex Alignment & Spacing */}
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                              marginTop: showDateHeader ? '0.35rem' : isFirstInGroup ? '0.75rem' : '0.25rem'
                            }}
                          >
                            {/* Sender Label: Show for customer if first in group */}
                            {!isAdminMsg && isFirstInGroup && (
                              <div style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: '#64748b',
                                marginBottom: '0.25rem',
                                paddingLeft: '0.35rem',
                                userSelect: 'none'
                              }}>
                                {msg.sender_name || activeConversation?.client_name || 'Client'}
                              </div>
                            )}

                            {/* Custom Offer Card Rendering */}
                            {isOffer ? (
                              <div style={{ maxWidth: '90%', width: '420px' }}>
                                <OfferCardMessage
                                  offer={msg.offer_data || { id: msg.offer_id, title: 'Custom Digitizing Offer' }}
                                  isCustomerView={false}
                                  showToast={showToast}
                                />
                              </div>
                            ) : (
                              /* Standard Clean Chat Bubble */
                              <div
                                style={{
                                  maxWidth: '75%',
                                  background: isAdminMsg ? '#0f172a' : '#ffffff',
                                  color: isAdminMsg ? '#ffffff' : '#0f172a',
                                  padding: '0.75rem 1rem',
                                  borderRadius: isAdminMsg ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  boxShadow: isAdminMsg
                                    ? '0 2px 6px rgba(15, 23, 42, 0.12)'
                                    : '0 1px 4px rgba(0, 0, 0, 0.05)',
                                  border: isAdminMsg ? '1px solid #1e293b' : '1px solid #e2e8f0',
                                  wordBreak: 'break-word',
                                  fontSize: '0.88rem',
                                  lineHeight: 1.5,
                                  position: 'relative'
                                }}
                              >
                                {/* Message Text */}
                                {msg.text && (
                                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text' }}>
                                    {msg.text}
                                  </div>
                                )}

                                {/* Attachments inside bubble */}
                                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                  <div style={{ marginTop: msg.text ? '0.65rem' : 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                                              border: isAdminMsg ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
                                              background: isAdminMsg ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                                              maxWidth: '340px',
                                              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                                            }}
                                          >
                                            <a
                                              href={att.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              title="Click to open full photo directly"
                                              style={{ display: 'block', background: 'rgba(0,0,0,0.04)', textDecoration: 'none' }}
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
                                              padding: '0.45rem 0.65rem',
                                              fontSize: '0.72rem',
                                              gap: '0.5rem',
                                              borderTop: isAdminMsg ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0',
                                              background: isAdminMsg ? 'rgba(0,0,0,0.18)' : '#ffffff'
                                            }}>
                                              <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{
                                                  fontWeight: 600,
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  fontSize: '0.78rem',
                                                  color: isAdminMsg ? '#f1f5f9' : '#1e293b'
                                                }}>
                                                  {att.name}
                                                </div>
                                                {att.size && (
                                                  <div style={{ fontSize: '0.65rem', opacity: 0.75, color: isAdminMsg ? '#94a3b8' : '#64748b' }}>
                                                    {att.size}
                                                  </div>
                                                )}
                                              </div>

                                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                                <a
                                                  href={att.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '5px',
                                                    textDecoration: 'none',
                                                    color: isAdminMsg ? '#ffffff' : '#334155',
                                                    background: isAdminMsg ? 'rgba(255,255,255,0.15)' : '#f1f5f9'
                                                  }}
                                                  title="Open image directly in new tab"
                                                >
                                                  <ExternalLink size={11} /> Open
                                                </a>

                                                <button
                                                  type="button"
                                                  onClick={(e) => handleDownloadFile(att, e)}
                                                  disabled={isDownloading}
                                                  style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    fontSize: '0.68rem',
                                                    fontWeight: 700,
                                                    padding: '0.25rem 0.55rem',
                                                    borderRadius: '5px',
                                                    border: 'none',
                                                    color: '#ffffff',
                                                    background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                                                    cursor: isDownloading ? 'wait' : 'pointer',
                                                    boxShadow: '0 1px 2px rgba(234, 88, 12, 0.25)'
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
                                            gap: '0.65rem',
                                            padding: '0.55rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            maxWidth: '350px',
                                            background: isAdminMsg ? 'rgba(255,255,255,0.08)' : '#f8fafc',
                                            border: isAdminMsg ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                          }}
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                                            <span style={{
                                              padding: '0.2rem 0.4rem',
                                              borderRadius: '4px',
                                              fontSize: '0.62rem',
                                              fontWeight: 800,
                                              letterSpacing: '0.04em',
                                              flexShrink: 0,
                                              background: isAdminMsg ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                                              color: isAdminMsg ? '#ffffff' : '#334155'
                                            }}>
                                              {ext}
                                            </span>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                              <div style={{
                                                fontWeight: 600,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.78rem',
                                                color: isAdminMsg ? '#f1f5f9' : '#0f172a'
                                              }} title={att.name}>
                                                {att.name}
                                              </div>
                                              {att.size && (
                                                <div style={{ fontSize: '0.65rem', opacity: 0.75, color: isAdminMsg ? '#94a3b8' : '#64748b' }}>
                                                  {att.size}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                                            <a
                                              href={att.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '5px',
                                                textDecoration: 'none',
                                                color: isAdminMsg ? '#ffffff' : '#334155',
                                                background: isAdminMsg ? 'rgba(255,255,255,0.15)' : '#f1f5f9'
                                              }}
                                              title="Open file directly in new tab"
                                            >
                                              <ExternalLink size={11} /> Open
                                            </a>

                                            <button
                                              type="button"
                                              onClick={(e) => handleDownloadFile(att, e)}
                                              disabled={isDownloading}
                                              style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.55rem',
                                                borderRadius: '5px',
                                                border: 'none',
                                                color: '#ffffff',
                                                background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                                                cursor: isDownloading ? 'wait' : 'pointer',
                                                boxShadow: '0 1px 2px rgba(234, 88, 12, 0.25)'
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

                                {/* Bubble Footer: Timestamp & Read Receipts */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: isAdminMsg ? 'flex-end' : 'flex-start',
                                  gap: '0.3rem',
                                  marginTop: '0.35rem',
                                  fontSize: '0.68rem',
                                  color: isAdminMsg ? 'rgba(255, 255, 255, 0.65)' : '#94a3b8',
                                  userSelect: 'none'
                                }}>
                                  <span>{timeString}</span>
                                  {isAdminMsg && (
                                    <CheckCheck size={13} style={{ color: '#34d399', flexShrink: 0 }} />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}

                  {/* TYPING INDICATOR */}
                  {isClientTyping && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#64748b',
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      padding: '0.25rem 0.5rem'
                    }}>
                      <span className="dot-typing" />
                      <span>{activeConversation.client_name || 'Client'} is typing...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} style={{ height: '4px', flexShrink: 0 }} />
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

                  {/* TEXTAREA INPUT (Item 1: Auto-resize) */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={handleInputChange}
                      onFocus={stopNotificationSound}
                      onClick={stopNotificationSound}
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
                        minHeight: '48px',
                        maxHeight: '180px',
                        lineHeight: 1.4,
                        boxSizing: 'border-box',
                        overflowY: 'auto'
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
                      {/* "Create an offer" Button (Strictly for Inbox & Offers channel) */}
                      {activeChannel === 'inbox' && (
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
                      )}

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
          onOfferCreated={(createdOffer, createdMessage) => {
            setIsCreateOfferModalOpen(false);
            if (createdMessage) {
              setMessages(prev => {
                if (prev.some(m => m.id === createdMessage.id)) return prev;
                return [...prev, createdMessage];
              });
            }
            fetchActiveMessages(activeConversation.id);
            fetchConversations(activeFilter, searchQuery, activeChannel);
            showToast('Custom offer dispatched to client!', 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
