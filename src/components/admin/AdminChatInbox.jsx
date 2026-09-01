'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  addChatMessage, 
  markConversationAsRead, 
  subscribeToLiveMessages,
  uploadFileToCloudinaryFull,
  broadcastTypingStatus,
  subscribeToTypingStatus,
  getAdminThreadUnreadCount
} from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import WhatsAppChatMessage from '../common/WhatsAppChatMessage';
import AdminCreateOfferModal from './AdminCreateOfferModal';
import AdminConversationCard from './AdminConversationCard';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  ChevronRight,
  X,
  Loader2,
  Reply,
  Tag,
  Sparkles,
  Zap,
  Layers,
  Headphones,
  Inbox,
  LifeBuoy,
  ShoppingBag,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

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

// Helper to resolve real customer name, real email, and exact order type & number
export const resolveThreadInfo = (conv, orders = []) => {
  if (!conv) return { customerName: 'Customer', customerEmail: '', serviceCategory: 'Support', orderNum: '', isOrder: false, isDirectInbox: false, isSupport: true };

  const idStr = String(conv.id || '');
  const isSupportThread = idStr === 'general-support' || idStr.startsWith('support-');
  const isDirectInboxThread = !isSupportThread && (idStr.startsWith('inbox-') || idStr.startsWith('direct-'));
  const isOrderThread = !isSupportThread && !isDirectInboxThread && (idStr.startsWith('order-') || Boolean(conv.order_id || (conv.orderId && conv.orderId !== 'Support' && conv.orderId !== 'Customer Support' && conv.orderId !== 'Direct Chat')));

  const isOrder = isOrderThread;
  const isDirectInbox = isDirectInboxThread;
  const isSupport = isSupportThread || (!isOrder && !isDirectInbox);

  const rawId = isOrder ? (conv.order_id || conv.orderId || conv.id || '').replace('order-', '').replace('#', '').trim() : '';
  
  const matchOrd = isOrder && Array.isArray(orders) 
    ? orders.find(o => String(o.id) === String(rawId) || String(o.id).endsWith(String(rawId))) 
    : null;

  // Real Customer Name (no hardcoded "Support" or fake strings)
  let customerName = matchOrd?.client_name || matchOrd?.clientName;
  if (!customerName || customerName === 'Client' || customerName.includes('Admin') || customerName === 'Support' || customerName === 'Studio Support' || customerName === 'Master Digitizer Support') {
    const clientMsg = (conv.messages || []).find(m => m.sender !== 'admin' && m.senderName && m.senderName !== 'Client' && !m.senderName.includes('Admin') && m.senderName !== 'Support');
    if (clientMsg?.senderName) {
      customerName = clientMsg.senderName;
    } else if (conv.clientName && conv.clientName !== 'Client' && !conv.clientName.includes('Admin') && conv.clientName !== 'Support' && conv.clientName !== 'Studio Support' && conv.clientName !== 'Master Digitizer Support') {
      customerName = conv.clientName;
    } else if (conv.id && (conv.id.startsWith('support-guest_') || conv.id.startsWith('inbox-guest_'))) {
      const guestSub = conv.id.replace('support-guest_', '').replace('inbox-guest_', '').substring(0, 5).toUpperCase();
      customerName = `Guest Client (#${guestSub})`;
    } else {
      customerName = isSupport ? 'Guest Client' : 'Customer';
    }
  }

  // Real Customer Email (no hardcoded or fake strings)
  let customerEmail = matchOrd?.client_email || matchOrd?.clientEmail;
  if (!customerEmail || customerEmail === 'client@studio.com' || customerEmail.includes('guest@bdigitizing.pro')) {
    const clientEmailMsg = (conv.messages || []).find(m => m.client_email && m.client_email !== 'client@studio.com' && !m.client_email.includes('guest@bdigitizing.pro'));
    if (clientEmailMsg?.client_email) {
      customerEmail = clientEmailMsg.client_email;
    } else if (conv.clientEmail && conv.clientEmail !== 'client@studio.com' && !conv.clientEmail.includes('guest@bdigitizing.pro')) {
      customerEmail = conv.clientEmail;
    } else {
      customerEmail = '';
    }
  }

  const serviceCategory = matchOrd?.serviceCategory || matchOrd?.service_category || (matchOrd?.type === 'vector' ? 'Vector Tracing' : matchOrd?.type === 'patches' ? 'Custom Patches' : 'Embroidery Digitizing') || conv.serviceCategory || (isOrder ? 'Embroidery Digitizing' : 'Support');
  const orderNum = isOrder ? (rawId.length > 8 ? `#${rawId.substring(0, 6).toUpperCase()}` : `#${rawId.toUpperCase()}`) : '';

  return {
    isOrder,
    isDirectInbox,
    isSupport,
    rawId,
    matchOrd,
    customerName,
    customerEmail,
    serviceCategory,
    orderNum,
    orderSubtitle: isOrder ? `${serviceCategory} — ${orderNum}` : (isDirectInbox ? 'Direct Inbox' : 'Live Support'),
    orderTitle: matchOrd?.title || conv.orderTitle || conv.title || (isOrder ? `${serviceCategory} ${orderNum}` : (isDirectInbox ? `Direct Chat — ${customerName}` : 'Live Support'))
  };
};

const parseMessageTime = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to clean, deduplicate, and sort conversation threads by latest message time
const deduplicateThreads = (rawList) => {
  if (!Array.isArray(rawList)) return [];
  const map = new Map();

  rawList.forEach(conv => {
    if (!conv) return;
    const cleanMessages = (conv.messages || []).filter(m => m && (m.id || m.text));
    cleanMessages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));

    const isDirectInbox = conv.id?.startsWith('inbox-') || conv.id?.startsWith('direct-');
    const isOrder = conv.id?.startsWith('order-') || Boolean(conv.orderId && conv.orderId !== 'Support' && conv.orderId !== 'Customer Support' && conv.orderId !== 'General Inquiries' && conv.orderId !== 'Direct Chat');
    const rawOrdId = isOrder ? (conv.orderId || conv.id || '').replace('order-', '').replace('#', '').trim() : null;

    let key = '';
    let unifiedId = conv.id;

    if (isOrder && rawOrdId) {
      key = `order_${rawOrdId.toLowerCase()}`;
      unifiedId = `order-${rawOrdId}`;
    } else if (isDirectInbox) {
      let clientEmail = (conv.clientEmail || conv.client_email || '').toLowerCase().trim();
      if (!clientEmail || clientEmail === 'client@studio.com' || clientEmail.includes('guest@bdigitizing.pro')) {
        const emailMsg = cleanMessages.find(m => m.client_email && m.client_email !== 'client@studio.com' && !m.client_email.includes('guest@bdigitizing.pro'));
        if (emailMsg?.client_email) clientEmail = emailMsg.client_email.toLowerCase().trim();
      }
      if (!clientEmail && conv.id) {
        clientEmail = conv.id.replace('inbox-', '').replace('direct-', '').toLowerCase().trim();
      }
      key = `inbox_${clientEmail || 'client'}`;
      unifiedId = `inbox-${clientEmail || 'client'}`;
    } else {
      // Support thread
      let clientEmail = (conv.clientEmail || conv.client_email || '').toLowerCase().trim();
      if (!clientEmail || clientEmail === 'client@studio.com' || clientEmail.includes('guest@bdigitizing.pro')) {
        const emailMsg = cleanMessages.find(m => m.client_email && m.client_email !== 'client@studio.com' && !m.client_email.includes('guest@bdigitizing.pro'));
        if (emailMsg?.client_email) clientEmail = emailMsg.client_email.toLowerCase().trim();
      }

      if (clientEmail && clientEmail !== 'client@studio.com' && !clientEmail.includes('guest@bdigitizing.pro')) {
        key = `support_${clientEmail}`;
        unifiedId = `support-${clientEmail}`;
      } else if (conv.id && (conv.id.startsWith('support-guest_') || conv.id.startsWith('support-guest-'))) {
        const sessionId = conv.id.replace('support-', '').toLowerCase().trim();
        key = `support_${sessionId}`;
        unifiedId = conv.id;
      } else if (conv.id && conv.id.startsWith('support-') && conv.id !== 'support-guest') {
        key = `support_${conv.id.replace('support-', '').toLowerCase().trim()}`;
        unifiedId = conv.id;
      } else {
        key = 'support_general';
        unifiedId = 'general-support';
      }
    }

    const lastMsg = cleanMessages[cleanMessages.length - 1];
    const lastTime = lastMsg ? parseMessageTime(lastMsg) : (conv.updatedAt ? new Date(conv.updatedAt).getTime() : 0);
    const convUnread = conv.adminUnreadCount ?? conv.unreadCount ?? 0;

    if (!map.has(key)) {
      map.set(key, { 
        ...conv, 
        id: unifiedId,
        unreadCount: convUnread, 
        adminUnreadCount: convUnread,
        messages: cleanMessages,
        lastMessageTime: lastTime
      });
    } else {
      const existing = map.get(key);
      // Map deduplication for messages
      const msgMap = new Map();
      (existing.messages || []).forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
      cleanMessages.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
      
      const combinedMessages = Array.from(msgMap.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
      const updatedLastMsg = combinedMessages[combinedMessages.length - 1];
      const updatedLastTime = updatedLastMsg ? parseMessageTime(updatedLastMsg) : (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0);

      const combinedUnread = Math.max(existing.adminUnreadCount || 0, convUnread);

      const resolvedName = (existing.clientName && !['Customer', 'Client', 'Support', 'Admin'].includes(existing.clientName)) 
        ? existing.clientName 
        : ((conv.clientName && !['Customer', 'Client', 'Support', 'Admin'].includes(conv.clientName)) ? conv.clientName : existing.clientName);
      const resolvedEmail = (existing.clientEmail && existing.clientEmail !== 'client@studio.com') 
        ? existing.clientEmail 
        : (conv.clientEmail || existing.clientEmail);

      map.set(key, {
        ...existing,
        id: unifiedId,
        clientName: resolvedName,
        clientEmail: resolvedEmail,
        unreadCount: combinedUnread,
        adminUnreadCount: combinedUnread,
        messages: combinedMessages,
        lastMessageTime: Math.max(existing.lastMessageTime || 0, updatedLastTime),
        updatedAt: updatedLastMsg?.timestamp || existing.updatedAt
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
};

export const AdminChatInbox = () => {
  const { showToast, setSelectedOrderForDrawer, orders = [] } = useAppState();

  const [conversations, setConversations] = useState([]);
  const cacheKey = 'bdigi_admin_inbox_cache';

  const [activeChatId, setActiveChatId] = useState(null);
  const [activeSection, setActiveSection] = useState('inbox'); // 'inbox' (Customer Inbox) | 'support' (Support)
  const [subFilter, setSubFilter] = useState('all'); // 'all' | 'unread'
  const [searchTerm, setSearchTerm] = useState('');
  const [replyInput, setReplyInput] = useState('');
  const [isRefiningAI, setIsRefiningAI] = useState(false);
  const [isGeneratingSmartReply, setIsGeneratingSmartReply] = useState(false);
  const [undoDraft, setUndoDraft] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null); // { name, url, size, format }
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Instant local cache hydration on mount for zero-latency load on refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setConversations(parsed);
            if (parsed[0]?.id) setActiveChatId(parsed[0].id);
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadChats = async () => {
      if (!isMounted) return;
      const data = await fetchConversations();
      if (isMounted) {
        if (data && data.length > 0) {
          const fresh = deduplicateThreads(data);
          setConversations(fresh);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(fresh));
            } catch {}
          }
          if (!activeChatId && fresh[0]?.id) {
            setActiveChatId(fresh[0].id);
          }
        } else {
          setConversations([]);
          setActiveChatId(null);
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem(cacheKey);
            } catch {}
          }
        }
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
          attachment_url: record.attachment_url,
          attachment_name: record.attachment_name,
          attachment_size: record.attachment_size,
          attachment_type: record.attachment_type,
          reply_to: record.reply_to,
          offer_id: record.offer_id || record.offerId || null,
          offer_data: record.offer_data || record.offerData || null,
          is_read: record.is_read || false,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        if (newMsg.sender === 'client') {
          playNotificationSound('receive');
        }

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const exists = safePrev.some(c => c.id === newMsg.conversation_id);
          if (!exists) {
            // New conversation thread initiated - prepend locally
            const newThread = {
              id: newMsg.conversation_id,
              clientName: newMsg.senderName || 'Customer',
              clientEmail: '',
              clientCompany: 'Customer',
              orderId: 'Support',
              orderTitle: 'Live Support',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
              status: 'online',
              unreadCount: newMsg.sender === 'client' ? 1 : 0,
              adminUnreadCount: newMsg.sender === 'client' ? 1 : 0,
              messages: [newMsg],
              lastMessageTime: Date.now(),
              updatedAt: new Date().toISOString()
            };
            return [newThread, ...safePrev];
          }

          const updated = safePrev.map(conv => {
            if (conv.id === newMsg.conversation_id) {
              const currentMsgs = conv.messages || [];
              const existsIndex = currentMsgs.findIndex(m => 
                (m.id && newMsg.id && m.id === newMsg.id) || 
                (m.id && String(m.id).startsWith('msg-') && m.text === newMsg.text && m.sender === newMsg.sender && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 15000) ||
                (m.text && newMsg.text && m.text === newMsg.text && m.sender === newMsg.sender && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 10000)
              );
              
              let nextMsgs;
              if (existsIndex >= 0) {
                nextMsgs = [...currentMsgs];
                nextMsgs[existsIndex] = { ...nextMsgs[existsIndex], ...newMsg };
              } else {
                nextMsgs = [...currentMsgs, newMsg];
              }
              nextMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
              
              const isCurrentlyOpen = activeChatId === conv.id;
              return {
                ...conv,
                clientName: conv.clientName || newMsg.senderName,
                unreadCount: isCurrentlyOpen ? 0 : (conv.unreadCount || 0) + (newMsg.sender === 'client' ? 1 : 0),
                adminUnreadCount: isCurrentlyOpen ? 0 : (conv.adminUnreadCount || 0) + (newMsg.sender === 'client' ? 1 : 0),
                messages: nextMsgs,
                lastMessageTime: Date.now(),
                updatedAt: new Date().toISOString()
              };
            }
            return conv;
          });

          const deduplicated = deduplicateThreads(updated);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(deduplicated));
            } catch {}
          }
          return deduplicated;
        });
      },
      (convPayload) => {
        if (!isMounted) return;
        const fresh = convPayload.new || convPayload.record;
        if (!fresh) return;

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(c => {
            if (c.id === fresh.id) {
              return {
                ...c,
                unreadCount: activeChatId === fresh.id ? 0 : (fresh.admin_unread_count ?? fresh.unread_count ?? c.unreadCount),
                adminUnreadCount: activeChatId === fresh.id ? 0 : (fresh.admin_unread_count ?? fresh.unread_count ?? c.adminUnreadCount),
                clientName: fresh.client_name || c.clientName,
                clientEmail: fresh.client_email || c.clientEmail,
                status: fresh.status || c.status,
                updatedAt: fresh.updated_at || c.updatedAt
              };
            }
            return c;
          });
          return deduplicateThreads(updated);
        });
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeChatId]);

  // Listen for real-time offer status changes across tabs and backend events
  useEffect(() => {
    const handleOfferStatusEvent = (e) => {
      const { offerId, status: newStatus, offer: freshOffer } = e.detail || {};
      if (!offerId || !newStatus) return;

      setConversations(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const updated = safePrev.map(conv => {
          let hasModified = false;
          const nextMsgs = (conv.messages || []).map(m => {
            const mOfferId = m.offer_id || m.offer_data?.id || m.offer?.id;
            if (mOfferId === offerId || m.id === offerId) {
              hasModified = true;
              const prevOfferData = typeof m.offer_data === 'object' ? (m.offer_data || {}) : {};
              const mergedOffer = {
                ...prevOfferData,
                ...(freshOffer || {}),
                status: newStatus,
                updated_at: new Date().toISOString()
              };
              return {
                ...m,
                offer_data: mergedOffer,
                offer: mergedOffer
              };
            }
            return m;
          });

          if (hasModified) {
            return {
              ...conv,
              messages: nextMsgs,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });

        const deduplicated = deduplicateThreads(updated);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(deduplicated));
          } catch {}
        }
        return deduplicated;
      });
    };

    window.addEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
    return () => window.removeEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
  }, []);

  // Derive currently active conversation object with safety fallbacks
  const currentActiveChatId = activeChatId || (conversations.length > 0 ? conversations[0].id : null);
  
  const activeChat = conversations.find(c => c.id === currentActiveChatId) || (conversations.length > 0 ? conversations[0] : {
    id: 'placeholder',
    clientName: 'Live Customer Support',
    messages: []
  });

  const activeInfo = resolveThreadInfo(activeChat, orders);

  // Subscribe to live typing indicators from client
  useEffect(() => {
    let clientTypingTimer = null;
    const unsubTyping = subscribeToTypingStatus((payload) => {
      if (!payload || !currentActiveChatId) return;
      const isTargetThread = payload.conversationId === currentActiveChatId;
      if (isTargetThread && payload.senderRole === 'client') {
        if (payload.isTyping) {
          setIsClientTyping(true);
          if (clientTypingTimer) clearTimeout(clientTypingTimer);
          clientTypingTimer = setTimeout(() => {
            setIsClientTyping(false);
          }, 3500);
        } else {
          setIsClientTyping(false);
        }
      }
    });

    return () => {
      if (unsubTyping) unsubTyping();
      if (clientTypingTimer) clearTimeout(clientTypingTimer);
    };
  }, [currentActiveChatId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setReplyInput(val);

    if (currentActiveChatId) {
      broadcastTypingStatus(currentActiveChatId, 'Studio Support', 'admin', true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTypingStatus(currentActiveChatId, 'Studio Support', 'admin', false);
      }, 2500);
    }
  };

  const scrollToBottom = () => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
    requestAnimationFrame(() => {
      if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    });
    setTimeout(() => {
      if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    }, 50);
  };

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
  }, [replyInput]);

  // Auto-scroll chat feed on new messages, thread switch, or typing state
  useEffect(() => {
    scrollToBottom();
  }, [currentActiveChatId, activeChat?.messages?.length, isClientTyping, replyingTo]);

  // Mark active conversation read when opening
  useEffect(() => {
    if (currentActiveChatId && isSupabaseConfigured) {
      const targetConv = conversations.find(c => c.id === currentActiveChatId);
      const email = targetConv?.clientEmail || '';

      markConversationAsRead(currentActiveChatId, 'admin', email);

      setConversations(prev => {
        const updated = prev.map(c => 
          (c.id === currentActiveChatId || (email && c.clientEmail === email))
            ? {
                ...c,
                unreadCount: 0,
                adminUnreadCount: 0,
                messages: (c.messages || []).map(m => (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin') ? { ...m, is_read: true } : m)
              } 
            : c
        );
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    }
  }, [currentActiveChatId]);

  // Helper to compute admin unread count strictly for client messages
  const getThreadUnreadCount = (conv) => {
    return getAdminThreadUnreadCount(conv, activeChatId);
  };

  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    setMobileView('chat');
    const targetConv = conversations.find(c => c.id === chatId);
    const email = targetConv?.clientEmail || '';

    // 1. Instant optimistic local UI update
    setConversations(prev => {
      const updated = prev.map(c => 
        (c.id === chatId || (email && c.clientEmail === email))
          ? {
              ...c,
              unreadCount: 0,
              adminUnreadCount: 0,
              messages: (c.messages || []).map(m => (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin') ? { ...m, is_read: true } : m)
            } 
          : c
      );
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    // 2. Trigger background DB update & global broadcast
    markConversationAsRead(chatId, 'admin', email);

    // 3. Fetch latest full message stream for this specific thread
    if (isSupabaseConfigured) {
      try {
        const freshMsgs = await fetchChatMessages(chatId, email);
        if (Array.isArray(freshMsgs) && freshMsgs.length > 0) {
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === chatId || (email && c.clientEmail === email)) {
                const msgMap = new Map();
                (c.messages || []).forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
                freshMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
                const merged = Array.from(msgMap.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
                return { ...c, messages: merged };
              }
              return c;
            });
            return deduplicateThreads(updated);
          });
        }
      } catch (err) {
        console.warn('Fetch chat messages on select notice:', err);
      }
    }
  };

  const isSupportThread = (c) => {
    if (!c) return false;
    if (c.isSupport === true) return true;
    const idStr = String(c.id || '').toLowerCase();
    return idStr === 'general-support' || idStr === 'support-guest' || idStr.startsWith('support-');
  };

  const inboxConversationsCount = useMemo(() => {
    return conversations.filter(c => !isSupportThread(c)).length;
  }, [conversations]);

  const supportConversationsCount = useMemo(() => {
    return conversations.filter(c => isSupportThread(c)).length;
  }, [conversations]);

  const inboxUnreadTotal = useMemo(() => {
    return conversations
      .filter(c => !isSupportThread(c))
      .reduce((sum, c) => sum + getAdminThreadUnreadCount(c, activeChatId), 0);
  }, [conversations, activeChatId]);

  const supportUnreadTotal = useMemo(() => {
    return conversations
      .filter(c => isSupportThread(c))
      .reduce((sum, c) => sum + getAdminThreadUnreadCount(c, activeChatId), 0);
  }, [conversations, activeChatId]);

  const unreadTotal = useMemo(() => {
    return activeSection === 'inbox' ? inboxUnreadTotal : supportUnreadTotal;
  }, [activeSection, inboxUnreadTotal, supportUnreadTotal]);

  const unreadThreadsCount = useMemo(() => {
    return conversations
      .filter(c => (activeSection === 'inbox' ? !isSupportThread(c) : isSupportThread(c)))
      .filter(c => getAdminThreadUnreadCount(c, activeChatId) > 0).length;
  }, [conversations, activeSection, activeChatId]);

  // Switch active conversation when switching section if current is not in section
  const handleSectionSwitch = (section) => {
    setActiveSection(section);
    const candidates = conversations.filter(c => section === 'inbox' ? !isSupportThread(c) : isSupportThread(c));
    if (candidates.length > 0) {
      const currentIsCandidate = candidates.some(c => c.id === activeChatId);
      if (!currentIsCandidate) {
        handleSelectChat(candidates[0].id);
      }
    } else {
      setActiveChatId(null);
    }
  };

  // Filter conversations list based on activeSection, subFilter, and search
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const isSupport = isSupportThread(conv);

      // Strict Channel Separation
      if (activeSection === 'inbox' && isSupport) return false;
      if (activeSection === 'support' && !isSupport) return false;

      if (subFilter === 'unread') {
        if (getAdminThreadUnreadCount(conv, activeChatId) === 0) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const info = resolveThreadInfo(conv, orders);
      return (
        (conv.clientName || '').toLowerCase().includes(term) ||
        (conv.clientEmail || '').toLowerCase().includes(term) ||
        (info.customerName || '').toLowerCase().includes(term) ||
        (info.customerEmail || '').toLowerCase().includes(term) ||
        (conv.messages || []).some(m => (m.text || '').toLowerCase().includes(term))
      );
    });
  }, [conversations, activeSection, subFilter, searchTerm, orders, activeChatId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!replyInput.trim() && !attachedFile) return;
    if (!currentActiveChatId) return;

    const targetCustomerEmail = (activeInfo?.customerEmail || activeChat?.clientEmail || (currentActiveChatId ? currentActiveChatId.replace('support-', '').replace('inbox-', '').replace('direct-', '').replace('chat-', '') : '')).toLowerCase().trim();

    const nowIso = new Date().toISOString();
    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      conversation_id: currentActiveChatId,
      client_email: targetCustomerEmail || null,
      sender: 'admin',
      senderName: 'Support',
      sender_name: 'Support',
      text: replyInput.trim(),
      attachment: attachedFile ? attachedFile.name : null,
      attachment_url: attachedFile ? attachedFile.url : null,
      attachment_name: attachedFile ? attachedFile.name : null,
      attachment_size: attachedFile ? attachedFile.size : null,
      attachment_type: attachedFile ? attachedFile.format : null,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        sender_name: replyingTo.senderName || replyingTo.sender_name || (activeInfo?.customerName || 'Customer'),
        text: replyingTo.text,
        attachment: replyingTo.attachment_name || replyingTo.attachment,
        attachment_url: replyingTo.attachment_url
      } : null,
      isSupport: activeSection === 'support' || isSupportThread(activeChat),
      timestamp: nowIso,
      created_at: nowIso
    };

    // Optimistic UI update
    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === currentActiveChatId) {
          const nextMsgs = [...(conv.messages || []), newMsg];
          nextMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
          return {
            ...conv,
            unreadCount: 0,
            adminUnreadCount: 0,
            messages: nextMsgs,
            updatedAt: nowIso,
            lastMessageTime: Date.now()
          };
        }
        return conv;
      });

      const deduplicated = deduplicateThreads(updated);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(deduplicated));
        } catch {}
      }
      return deduplicated;
    });

    setReplyInput('');
    setAttachedFile(null);
    setReplyingTo(null);
    setUndoDraft(null);
    broadcastTypingStatus(currentActiveChatId, 'Studio Support', 'admin', false);
    showToast(`Reply sent to ${activeInfo.customerName || 'Customer'}!`, 'success');
    scrollToBottom('smooth');

    if (isSupabaseConfigured) {
      try {
        await addChatMessage(currentActiveChatId, newMsg);
      } catch (err) {
        console.warn('Admin persist message notice:', err);
      }
    }
  };

  const handleSmartReply = async () => {
    if (isGeneratingSmartReply) return;
    const threadMsgs = activeChat?.messages || [];
    if (threadMsgs.length === 0) {
      showToast('No messages in this thread yet to generate a reply from', 'info');
      return;
    }

    // Extract latest customer inquiry message
    const reversed = [...threadMsgs].reverse();
    const lastCustomerMsg = reversed.find(m => m && (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin'));
    const latestMessageText = lastCustomerMsg ? String(lastCustomerMsg.text || '').trim() : String(threadMsgs[threadMsgs.length - 1]?.text || '').trim();
    const clientDisplayName = activeInfo?.customerName || activeChat?.clientName || 'Client';

    try {
      setIsGeneratingSmartReply(true);
      const currentDraft = (replyInput || '').trim();
      if (currentDraft) setUndoDraft(currentDraft);

      const response = await fetch('/api/ai/smart-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: threadMsgs,
          conversationHistory: threadMsgs,
          latestMessage: latestMessageText,
          customerName: clientDisplayName,
          clientName: clientDisplayName,
          serviceCategory: activeInfo?.serviceCategory || 'Embroidery Digitizing'
        })
      });
      const data = await response.json();
      const generated = data?.replyText || data?.smartReply;
      if (response.ok && generated) {
        if (currentDraft) setUndoDraft(currentDraft);
        setReplyInput(generated);
        showToast('⚡ Smart Reply generated!', 'success');
      } else {
        console.error('Smart reply failed:', data?.error);
        showToast(data?.error || 'Failed to generate smart reply', 'error');
      }
    } catch (err) {
      console.error('Smart Reply error:', err);
      showToast('Smart Reply service unavailable', 'error');
    } finally {
      setIsGeneratingSmartReply(false);
    }
  };

  const handlePolishDraft = async () => {
    const draft = (replyInput || '').trim();
    if (!draft || isRefiningAI) return;
    try {
      setIsRefiningAI(true);
      const response = await fetch('/api/ai/refine-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: draft, text: draft })
      });
      const data = await response.json();
      const polished = data?.refinedText || data?.refinedMessage || data?.polishedResult;
      if (response.ok && polished) {
        setUndoDraft(draft);
        setReplyInput(polished);
        setTimeout(() => {
          adjustTextareaHeight();
        }, 10);
        showToast('✨ Message polished with AI!', 'success');
      } else {
        console.error('Polish failed:', data?.error);
        showToast(data?.error || 'Failed to polish message with AI', 'error');
      }
    } catch (err) {
      console.error('Network error during AI polish:', err);
      showToast('Network error during AI polish', 'error');
    } finally {
      setIsRefiningAI(false);
    }
  };

  const handleAIPolish = handlePolishDraft;

  const handleUndoAIPolish = () => {
    if (undoDraft !== null) {
      setReplyInput(undoDraft);
      setUndoDraft(null);
      setTimeout(() => {
        adjustTextareaHeight();
      }, 10);
      showToast('Reverted to original draft', 'info');
    }
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    showToast(`Uploading ${file.name}...`, 'info');
    try {
      const uploaded = await uploadFileToCloudinaryFull(file, 'admin-deliveries', 'chat-attachments');
      if (uploaded && uploaded.url) {
        setAttachedFile({
          name: file.name,
          url: uploaded.url,
          size: uploaded.size || (file.size / 1024).toFixed(1) + ' KB',
          format: uploaded.format || file.name.split('.').pop()
        });
        showToast(`Ready to send: ${file.name}`, 'success');
      } else {
        showToast('Failed to upload file. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Error uploading attachment: ' + err.message, 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div style={{ 
      padding: 0, 
      background: 'var(--color-surface, #ffffff)', 
      border: '1.5px solid var(--color-border)', 
      borderRadius: 'var(--radius-lg)', 
      overflow: 'hidden',
      flex: 1,
      height: '100%',
      maxHeight: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)'
    }}>

      {/* Inbox Outer Layout */}
      <div 
        className="chat-inbox-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '290px 1fr', 
          height: '100%', 
          maxHeight: '100%',
          minHeight: 0, 
          overflow: 'hidden',
          flex: 1
        }}
      >

        {/* Sidebar / Left Column: Conversations Directory */}
        <div 
          className={`chat-threads-column ${mobileView === 'chat' ? 'hide-on-mobile-thread' : ''}`}
          style={{
            borderRight: '1.5px solid var(--color-border)',
            background: 'var(--color-subtle, #f8fafc)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '0.85rem 1rem', borderBottom: '1.5px solid var(--color-border)', background: 'var(--color-surface, #ffffff)' }}>
            
            {/* Top Channel Switcher: Customer Inbox vs Support Queue */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              marginBottom: '0.75rem',
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '10px'
            }}>
              <button
                type="button"
                onClick={() => handleSectionSwitch('inbox')}
                style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeSection === 'inbox' ? 'var(--color-surface)' : 'transparent',
                  color: activeSection === 'inbox' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: activeSection === 'inbox' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  fontWeight: activeSection === 'inbox' ? 900 : 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Inbox size={13} />
                <span>Inbox ({inboxConversationsCount})</span>
                {inboxUnreadTotal > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '0.05rem 0.35rem',
                    borderRadius: '9999px'
                  }}>
                    {inboxUnreadTotal}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSectionSwitch('support')}
                style={{
                  padding: '0.45rem 0.5rem',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeSection === 'support' ? 'var(--color-surface)' : 'transparent',
                  color: activeSection === 'support' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: activeSection === 'support' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  fontWeight: activeSection === 'support' ? 900 : 700,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Headphones size={13} />
                <span>Support ({supportConversationsCount})</span>
                {supportUnreadTotal > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    padding: '0.05rem 0.35rem',
                    borderRadius: '9999px'
                  }}>
                    {supportUnreadTotal}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Sub-Filter Bar */}
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, var(--text-muted))' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeSection === 'inbox' ? "Search customer inboxes..." : "Search support inquiries..."}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  fontSize: '0.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Sub-Filters: All | Unread + Purge Local Cache Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${subFilter === 'all' ? 'btn-primary-orange' : 'btn-outline'}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '6px'
                  }}
                  onClick={() => setSubFilter('all')}
                >
                  All ({activeSection === 'inbox' ? inboxConversationsCount : supportConversationsCount})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${subFilter === 'unread' ? 'btn-primary-orange' : 'btn-outline'}`}
                  style={{
                    padding: '0.2rem 0.55rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    borderRadius: '6px'
                  }}
                  onClick={() => setSubFilter('unread')}
                >
                  Unread ({unreadThreadsCount})
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.removeItem(cacheKey);
                      localStorage.removeItem('bdigi_admin_inbox_cache');
                    } catch {}
                  }
                  showToast('Syncing live database...', 'info');
                  const fresh = await fetchConversations();
                  if (fresh && fresh.length > 0) {
                    setConversations(deduplicateThreads(fresh));
                  } else {
                    setConversations([]);
                    setActiveChatId(null);
                  }
                  showToast('Database sync complete ✨', 'success');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.2rem 0.35rem',
                  borderRadius: '4px'
                }}
                title="Force refresh & purge local cache"
              >
                <RotateCcw size={11} /> Sync DB
              </button>
            </div>
          </div>

          {/* Conversations Thread Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MessageSquare size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {subFilter === 'unread' ? 'No unread conversations' : 'No conversations found'}
                </p>
                {subFilter === 'unread' && (
                  <button
                    type="button"
                    onClick={() => setSubFilter('all')}
                    style={{
                      marginTop: '0.75rem',
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-primary, #ea580c)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    View All Messages
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeChatId;
                const info = resolveThreadInfo(conv, orders);
                const threadUnread = getThreadUnreadCount(conv);

                return (
                  <AdminConversationCard
                    key={conv.id}
                    conversation={conv}
                    isActive={isActive}
                    unreadCount={threadUnread}
                    threadInfo={info}
                    onSelect={handleSelectChat}
                    formatTime={formatChatTime}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Chat Feed / Right Canvas */}
        {activeChat ? (
          <div 
            className={`chat-messages-column ${mobileView === 'list' ? 'hide-on-mobile-chat' : ''}`}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%', 
              maxHeight: '100%',
              minHeight: 0, 
              flex: 1,
              background: 'var(--color-surface, #ffffff)', 
              overflow: 'hidden' 
            }}
          >
            {/* Header Canvas */}
            <div style={{
              padding: '0.65rem 0.85rem',
              borderBottom: '1.5px solid var(--color-border)',
              background: 'var(--color-surface, #ffffff)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  className="mobile-only"
                  onClick={() => setMobileView('list')}
                  style={{
                    background: 'var(--color-subtle, #f1f5f9)',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    color: 'var(--color-text-primary, var(--navy-900))',
                    borderRadius: '8px',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    flexShrink: 0
                  }}
                  aria-label="Back to conversations list"
                >
                  ← Back
                </button>

                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {activeInfo.isOrder ? (
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--navy-900)', color: 'var(--orange-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.75rem', border: '1.5px solid var(--orange-500)' }}>
                      {activeInfo.orderNum ? activeInfo.orderNum.substring(0, 5) : 'ORD'}
                    </div>
                  ) : (
                    <img
                      src={activeChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeInfo.customerName)}&background=0f172a&color=fff`}
                      alt={activeInfo.customerName}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                    />
                  )}
                  <span style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: activeChat.status === 'online' ? '#10b981' : '#94a3b8',
                    border: '2px solid var(--color-surface, #ffffff)'
                  }} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text-primary, var(--navy-950))', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeInfo.customerName}
                    </h3>
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '0.05rem 0.4rem',
                      borderRadius: '4px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      Direct WhatsApp Chat
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeInfo.customerEmail && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--navy-800)', fontWeight: 600 }}>{activeInfo.customerEmail}</span>
                    )}
                    {activeChat.orders && activeChat.orders.length > 0 && (
                      <span style={{ color: 'var(--orange-600)', fontWeight: 700 }}>
                        • {activeChat.orders.length} {activeChat.orders.length === 1 ? 'Order' : 'Orders'} Total
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Customer Orders dropdown / trigger */}
              {activeChat.orders && activeChat.orders.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeChat.orders?.[0] && setSelectedOrderForDrawer) {
                        setSelectedOrderForDrawer(activeChat.orders[0]);
                      }
                    }}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 800, padding: '0.35rem 0.55rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                  >
                    <ShoppingBag size={12} className="text-orange-500" />
                    <span>Latest #{String(activeChat.orders[0].id).substring(0, 6).toUpperCase()}</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Messages Feed */}
            <div 
              ref={chatFeedRef}
              style={{
                flex: 1,
                minHeight: 0,
                padding: '1rem 1.25rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                background: 'var(--color-subtle, #f8fafc)'
              }}
            >
              {activeChat.messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>No messages yet in this conversation</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Type a reply below to reach out to the customer.</p>
                </div>
              ) : null}

              {/* Message Bubbles */}
              {activeChat.messages.map((msg, index) => {
                const isAdmin = msg.sender === 'admin';

                return (
                  <WhatsAppChatMessage
                    key={msg.id || index}
                    message={msg}
                    isMe={isAdmin}
                    senderDisplayName={isAdmin ? 'Support' : (activeInfo.customerName || msg.senderName || msg.sender_name || 'Customer')}
                    onReply={(m) => setReplyingTo(m)}
                    formatTime={formatChatTime}
                    themePreset="admin"
                    onOrderClick={(ordId) => {
                      if (activeInfo.matchOrd) {
                        setSelectedOrderForDrawer(activeInfo.matchOrd);
                      }
                    }}
                  />
                );
              })}

              {/* CLIENT LIVE TYPING INDICATOR */}
              {isClientTyping && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.85rem',
                  background: 'var(--color-surface, #ffffff)',
                  borderRadius: '16px',
                  border: '1.5px solid var(--color-border)',
                  width: 'fit-content',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  margin: '0.25rem 0'
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)' }}>
                    {activeInfo.customerName || 'Customer'} is typing
                  </span>
                  <span style={{ display: 'inline-flex', gap: '3px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* QUOTED REPLY BANNER (WhatsApp Style) */}
            {replyingTo && (
              <div style={{
                padding: '0.5rem 1.5rem',
                background: 'var(--color-primary-light)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                <div style={{ borderLeft: '3.5px solid var(--color-primary)', paddingLeft: '0.6rem', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Reply size={12} /> Replying to {replyingTo.senderName || replyingTo.sender_name || (activeInfo.customerName || 'Customer')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment}` : 'Media file')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: '4px' }}
                  title="Cancel reply"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* UPLOADING ATTACHMENT SPINNER */}
            {isUploadingAttachment && (
              <div style={{
                padding: '0.45rem 1.5rem',
                background: '#eff6ff',
                borderTop: '1px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#1d4ed8',
                fontSize: '0.76rem',
                fontWeight: 700
              }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading attachment to secure studio storage...
              </div>
            )}

            {/* Attached File Preview */}
            {attachedFile && !isUploadingAttachment && (
              <div style={{
                padding: '0.45rem 1.5rem',
                background: '#f0fdf4',
                borderTop: '1px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.76rem',
                color: '#15803d',
                fontWeight: 700
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Paperclip size={14} />
                  <span>Ready to send: <strong>{attachedFile.name}</strong> ({attachedFile.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }}
                  title="Remove attachment"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Messaging Input Area */}
            <form 
              onSubmit={handleSendMessage} 
              style={{ 
                padding: '0.65rem 1rem 0.6rem 1rem', 
                background: '#ffffff', 
                borderTop: '1px solid #e2e8f0', 
                flexShrink: 0, 
                position: 'sticky', 
                bottom: 0, 
                zIndex: 30, 
                boxShadow: '0 -2px 10px rgba(0,0,0,0.03)' 
              }}
            >
              {/* AI Action Toolbar (Side-by-Side: ⚡ Smart Reply + ✨ Polish with AI) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '0.45rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {/* Smart Auto Reply Button */}
                  <button
                    type="button"
                    onClick={handleSmartReply}
                    disabled={isGeneratingSmartReply}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.75rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#b45309',
                      background: isGeneratingSmartReply ? '#fef3c7' : '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      cursor: isGeneratingSmartReply ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(180, 83, 9, 0.05)'
                    }}
                    onMouseEnter={(e) => { if (!isGeneratingSmartReply) e.currentTarget.style.background = '#fef3c7'; }}
                    onMouseLeave={(e) => { if (!isGeneratingSmartReply) e.currentTarget.style.background = '#fffbeb'; }}
                    title="Read conversation context and auto-generate a tailored client response"
                  >
                    {isGeneratingSmartReply ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-amber-600" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} className="text-amber-500 fill-amber-500" />
                        <span>⚡ Smart Reply</span>
                      </>
                    )}
                  </button>

                  {/* AI Polish Draft Button */}
                  <button
                    type="button"
                    onClick={handleAIPolish}
                    disabled={!replyInput.trim() || isRefiningAI}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.75rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: replyInput.trim() ? '#4338ca' : '#94a3b8',
                      background: replyInput.trim() ? '#eef2ff' : '#f8fafc',
                      border: replyInput.trim() ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: replyInput.trim() && !isRefiningAI ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      boxShadow: replyInput.trim() ? '0 1px 2px rgba(67, 56, 202, 0.08)' : 'none'
                    }}
                    onMouseEnter={(e) => { if (replyInput.trim() && !isRefiningAI) e.currentTarget.style.background = '#e0e7ff'; }}
                    onMouseLeave={(e) => { if (replyInput.trim() && !isRefiningAI) e.currentTarget.style.background = '#eef2ff'; }}
                    title="Transform current draft into polished, native US customer service English"
                  >
                    {isRefiningAI ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-indigo-600" />
                        <span>Polishing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className={replyInput.trim() ? 'text-indigo-600' : 'text-slate-400'} />
                        <span>✨ Polish with AI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Custom Offer Button (Only in Normal Customer Inbox, never in Support) */}
                {(!activeChat?.isSupport && !isSupportThread(activeChat)) && (
                  <button
                    type="button"
                    onClick={() => setIsOfferModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Create & Send Custom Offer"
                  >
                    <Tag size={12} className="text-indigo-600" />
                    <span>Create Offer</span>
                  </button>
                )}
              </div>

              {/* Input Row: Attachment + Textarea + Send */}
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-end', width: '100%' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttach}
                  style={{ display: 'none' }}
                  accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.ai,.eps,.dst,.pes,.emb,.zip,.rar"
                />

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
                  {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" style={{ color: '#ea580c' }} /> : <Paperclip size={18} />}
                </button>

                <textarea
                  ref={textareaRef}
                  className="chat-message-input"
                  rows={1}
                  placeholder={replyingTo ? 'Type a reply...' : 'Type a message...'}
                  value={replyInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '40px',
                    minHeight: '40px',
                    maxHeight: '150px',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#0f172a',
                    background: '#ffffff',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '10px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.4,
                    overflowY: 'hidden',
                    fontFamily: 'inherit'
                  }}
                />

                <button
                  type="submit"
                  disabled={(!replyInput.trim() && !attachedFile) || isUploadingAttachment}
                  style={{
                    height: '40px',
                    padding: '0 1rem',
                    borderRadius: '10px',
                    background: (replyInput.trim() || attachedFile) ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#cbd5e1',
                    border: 'none',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: (replyInput.trim() || attachedFile) ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                    boxShadow: (replyInput.trim() || attachedFile) ? '0 3px 12px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    opacity: ((!replyInput.trim() && !attachedFile) || isUploadingAttachment) ? 0.6 : 1
                  }}
                  title="Send message (Enter)"
                >
                  <span>Send</span>
                  <Send size={14} />
                </button>
              </div>

              {/* Keyboard Shortcut & Undo Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.35rem',
                marginTop: '0.35rem',
                padding: '0 0.15rem',
                fontSize: '0.68rem',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    ⌨️ Press <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> to send
                  </span>
                  <span>
                    <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Shift</kbd> + <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> for new line
                  </span>
                </div>

                {undoDraft && (
                  <button
                    type="button"
                    onClick={handleUndoAIPolish}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      color: '#4f46e5',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    title="Undo AI refinement and restore original draft"
                  >
                    <RotateCcw size={11} />
                    <span>Undo AI Polish</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a conversation thread to view messages
          </div>
        )}
      </div>

      {/* Admin Create Custom Offer Modal */}
      {isOfferModalOpen && (
        <AdminCreateOfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          conversationId={currentActiveChatId}
          clientName={activeInfo.customerName || 'Customer'}
          clientEmail={activeInfo.customerEmail || ''}
          onOfferCreated={(newOffer, newMsg) => {
            if (newMsg) {
              setConversations(prev => {
                const updated = prev.map(conv => {
                  if (conv.id === currentActiveChatId) {
                    return {
                      ...conv,
                      messages: [...(conv.messages || []), newMsg],
                      updatedAt: new Date().toISOString(),
                      lastMessageTime: Date.now()
                    };
                  }
                  return conv;
                });
                const deduplicated = deduplicateThreads(updated);
                if (typeof window !== 'undefined') {
                  try {
                    localStorage.setItem(cacheKey, JSON.stringify(deduplicated));
                  } catch {}
                }
                return deduplicated;
              });
              scrollToBottom('smooth');
            }
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
};
