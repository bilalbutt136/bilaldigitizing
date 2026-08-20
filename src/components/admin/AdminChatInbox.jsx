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
  subscribeToTypingStatus
} from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import WhatsAppChatMessage from '../common/WhatsAppChatMessage';
import AdminCreateOfferModal from './AdminCreateOfferModal';
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

  // Real Customer Name (no hardcoded or fake strings)
  let customerName = matchOrd?.client_name || matchOrd?.clientName;
  if (!customerName || customerName === 'Client' || customerName.includes('Admin') || customerName === 'Master Digitizer Support') {
    const clientMsg = (conv.messages || []).find(m => m.sender === 'client' && m.senderName && m.senderName !== 'Client' && !m.senderName.includes('Admin'));
    if (clientMsg?.senderName) {
      customerName = clientMsg.senderName;
    } else if (conv.clientName && conv.clientName !== 'Client' && !conv.clientName.includes('Admin') && conv.clientName !== 'Master Digitizer Support') {
      customerName = conv.clientName;
    } else {
      customerName = 'Customer';
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
      // Support thread: Extract real customer email from conv or its messages
      let clientEmail = (conv.clientEmail || conv.client_email || '').toLowerCase().trim();
      if (!clientEmail || clientEmail === 'client@studio.com' || clientEmail.includes('guest@bdigitizing.pro')) {
        const emailMsg = cleanMessages.find(m => m.client_email && m.client_email !== 'client@studio.com' && !m.client_email.includes('guest@bdigitizing.pro'));
        if (emailMsg?.client_email) clientEmail = emailMsg.client_email.toLowerCase().trim();
      }

      if (clientEmail && clientEmail !== 'client@studio.com' && !clientEmail.includes('guest@bdigitizing.pro')) {
        key = `support_${clientEmail}`;
        unifiedId = `support-${clientEmail}`;
      } else if (conv.id && conv.id.startsWith('support-') && !conv.id.startsWith('support-guest')) {
        key = `support_${conv.id.replace('support-', '').toLowerCase().trim()}`;
        unifiedId = conv.id;
      } else {
        key = 'general-support';
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
      const combinedMessages = [...(existing.messages || [])];
      cleanMessages.forEach(m => {
        if (!combinedMessages.some(ex => 
          (ex.id && m.id && ex.id === m.id) || 
          (ex.text && m.text && ex.text === m.text && ex.sender === m.sender && Math.abs(parseMessageTime(ex) - parseMessageTime(m)) < 20000) ||
          (ex.attachment_url && m.attachment_url && ex.attachment_url === m.attachment_url)
        )) {
          combinedMessages.push(m);
        }
      });
      combinedMessages.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
      const updatedLastMsg = combinedMessages[combinedMessages.length - 1];
      const updatedLastTime = updatedLastMsg ? parseMessageTime(updatedLastMsg) : (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0);

      const combinedUnread = Math.max(existing.adminUnreadCount || 0, convUnread);

      const resolvedName = (existing.clientName && existing.clientName !== 'Customer' && existing.clientName !== 'Client') 
        ? existing.clientName 
        : (conv.clientName || existing.clientName);
      const resolvedEmail = (existing.clientEmail && existing.clientEmail !== 'client@studio.com') 
        ? existing.clientEmail 
        : (conv.clientEmail || existing.clientEmail);

      map.set(key, {
        ...existing,
        id: unifiedId,
        clientName: resolvedName,
        clientEmail: resolvedEmail,
        messages: combinedMessages,
        unreadCount: combinedUnread,
        adminUnreadCount: combinedUnread,
        lastMessageTime: updatedLastTime
      });
    }
  });

  const list = Array.from(map.values());
  list.sort((a, b) => {
    const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    return timeB - timeA;
  });
  return list;
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
  const [attachedFile, setAttachedFile] = useState(null); // { name, url, size, format }
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
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
              const existsIndex = currentMsgs.findIndex(m => m.id === newMsg.id || (m.text === newMsg.text && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 5000));
              
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
      } else if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    }, 60);
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
      } else if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    }, 220);
  };

  // Auto-scroll chat feed on new messages, thread switch, or typing state
  useEffect(() => {
    scrollToBottom('smooth');
  }, [currentActiveChatId, activeChat?.messages?.length, isClientTyping, replyingTo]);

  // Mark active conversation read when opening
  useEffect(() => {
    if (currentActiveChatId && isSupabaseConfigured) {
      const targetConv = conversations.find(c => c.id === currentActiveChatId);
      const email = targetConv?.clientEmail || '';
      const now = Date.now();

      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_read_admin_' + currentActiveChatId, String(now));
        if (email) localStorage.setItem('bdigi_read_admin_chat-' + email, String(now));
        window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: currentActiveChatId, role: 'admin' } }));
      }

      markConversationAsRead(currentActiveChatId, 'admin', email);

      setConversations(prev => prev.map(c => 
        (c.id === currentActiveChatId || (email && c.clientEmail === email))
          ? {
              ...c,
              unreadCount: 0,
              adminUnreadCount: 0,
              messages: (c.messages || []).map(m => m.sender === 'client' ? { ...m, is_read: true } : m)
            } 
          : c
      ));
    }
  }, [currentActiveChatId]);

  // Helper to compute admin unread count strictly for client messages
  const getThreadUnreadCount = (conv) => {
    if (!conv) return 0;
    if (activeChatId === conv.id || currentActiveChatId === conv.id) return 0;
    
    const lastRead = typeof window !== 'undefined' ? Math.max(
      parseInt(localStorage.getItem('bdigi_read_admin_' + conv.id) || '0', 10),
      conv.clientEmail ? parseInt(localStorage.getItem('bdigi_read_admin_chat-' + conv.clientEmail) || '0', 10) : 0
    ) : 0;

    const msgs = conv.messages || [];
    const unreadMsgs = msgs.filter(m => {
      if (m.sender !== 'client') return false;
      if (m.is_read === true || m.is_read === 'true') return false;
      const msgTime = parseMessageTime(m);
      return msgTime > lastRead;
    });

    return unreadMsgs.length;
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setMobileView('chat');
    const targetConv = conversations.find(c => c.id === chatId);
    const email = targetConv?.clientEmail || '';
    const now = Date.now();

    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_read_admin_' + chatId, String(now));
      if (email) localStorage.setItem('bdigi_read_admin_chat-' + email, String(now));
      window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: chatId, role: 'admin' } }));
    }

    markConversationAsRead(chatId, 'admin', email);

    setConversations(prev => prev.map(c => 
      (c.id === chatId || (email && c.clientEmail === email))
        ? {
            ...c,
            unreadCount: 0,
            adminUnreadCount: 0,
            messages: (c.messages || []).map(m => m.sender === 'client' ? { ...m, is_read: true } : m)
          } 
        : c
    ));
  };

  const unreadTotal = useMemo(() => {
    return conversations.reduce((sum, c) => sum + getThreadUnreadCount(c), 0);
  }, [conversations, activeChatId, currentActiveChatId]);

  // Filter conversations list based on subFilter and search
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const info = resolveThreadInfo(conv, orders);

      if (subFilter === 'unread') {
        if (getThreadUnreadCount(conv) === 0) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (conv.clientName || '').toLowerCase().includes(term) ||
        (conv.clientEmail || '').toLowerCase().includes(term) ||
        (info.customerName || '').toLowerCase().includes(term) ||
        (info.customerEmail || '').toLowerCase().includes(term) ||
        (conv.messages || []).some(m => (m.text || '').toLowerCase().includes(term))
      );
    });
  }, [conversations, subFilter, searchTerm, orders]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!replyInput.trim() && !attachedFile) return;
    if (!currentActiveChatId) return;

    const nowIso = new Date().toISOString();
    const newMsg = {
      id: 'msg-' + Date.now(),
      conversation_id: currentActiveChatId,
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
        sender_name: replyingTo.senderName || replyingTo.sender_name || (activeInfo.customerName || 'Customer'),
        text: replyingTo.text,
        attachment: replyingTo.attachment_name || replyingTo.attachment,
        attachment_url: replyingTo.attachment_url
      } : null,
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
    broadcastTypingStatus(currentActiveChatId, 'Studio Support', 'admin', false);
    playNotificationSound('send');
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
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)'
    }}>

      {/* Inbox Outer Layout */}
      <div 
        className="chat-inbox-grid"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '340px 1fr', 
          height: '100%', 
          minHeight: 0, 
          overflow: 'hidden' 
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
            
            {/* Header: WhatsApp Style Customer List */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0.2rem 0.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <MessageSquare size={16} className="text-orange-500" />
                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                  Customer Chats
                </span>
                <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: 'var(--navy-700)', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontWeight: 800 }}>
                  {conversations.length}
                </span>
              </div>
              {unreadTotal > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  padding: '0.1rem 0.45rem',
                  borderRadius: '9999px'
                }}>
                  {unreadTotal} Unread
                </span>
              )}
            </div>

            {/* Search & Sub-Filter Bar */}
            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, var(--text-muted))' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers, emails, messages..."
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
                  All ({conversations.length})
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
                  Unread ({unreadTotal})
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
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MessageSquare size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                <p style={{ margin: 0 }}>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeChatId;
                const info = resolveThreadInfo(conv, orders);
                const lastMsg = (conv.messages || [])[(conv.messages || []).length - 1] || {};
                const threadUnread = getThreadUnreadCount(conv);

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv.id)}
                    style={{
                      padding: '0.85rem',
                      marginBottom: '0.35rem',
                      borderRadius: '10px',
                      border: isActive ? '1.5px solid var(--color-primary, var(--orange-500))' : '1px solid transparent',
                      background: isActive ? 'var(--color-surface, #ffffff)' : 'transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(249, 115, 22, 0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                      {/* Avatar / Initials */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={conv.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.customerName)}&background=0f172a&color=fff`}
                          alt={info.customerName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--border-color)' }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: conv.status === 'online' ? '#10b981' : '#94a3b8',
                          border: '2px solid #ffffff'
                        }} />
                      </div>

                      {/* Info & Last Message */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {info.customerName}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '0.35rem' }}>
                            {formatChatTime(lastMsg.timestamp)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          {info.customerEmail && (
                            <span style={{ fontSize: '0.725rem', color: 'var(--navy-700)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {info.customerEmail}
                            </span>
                          )}
                          {conv.orders && conv.orders.length > 0 && (
                            <span style={{ fontSize: '0.65rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                              📦 {conv.orders.length} {conv.orders.length === 1 ? 'Order' : 'Orders'}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{
                            fontSize: '0.78rem',
                            color: threadUnread > 0 ? 'var(--navy-900)' : 'var(--text-muted)',
                            fontWeight: threadUnread > 0 ? 700 : 400,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '175px'
                          }}>
                            {lastMsg.sender === 'admin' ? 'You: ' : ''}{lastMsg.text || (lastMsg.attachment ? `📎 Attachment` : 'No messages yet')}
                          </p>

                          {threadUnread > 0 && (
                            <span style={{
                              background: '#ef4444',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              minWidth: '18px',
                              height: '18px',
                              borderRadius: '9999px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 4px',
                              flexShrink: 0
                            }}>
                              {threadUnread}
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

        {/* Chat Feed / Right Canvas */}
        {activeChat ? (
          <div 
            className={`chat-messages-column ${mobileView === 'list' ? 'hide-on-mobile-chat' : ''}`}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%', 
              minHeight: 0, 
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
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
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
                background: '#fff7ed',
                borderTop: '1px solid #fed7aa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                <div style={{ borderLeft: '3.5px solid var(--color-primary, #ff7a00)', paddingLeft: '0.6rem', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Reply size={12} /> Replying to {replyingTo.senderName || replyingTo.sender_name || (activeInfo.customerName || 'Customer')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment}` : 'Media file')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary, #ea580c)', padding: '4px' }}
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
            <form onSubmit={handleSendMessage} style={{ padding: '0.65rem 0.85rem', borderTop: '1.5px solid var(--color-border)', background: 'var(--color-surface, #ffffff)', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', width: '100%' }}>
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
                    background: 'var(--color-subtle, #f1f5f9)',
                    border: '1.5px solid var(--color-border)',
                    color: 'var(--color-text-secondary, var(--navy-700))',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isUploadingAttachment ? 'not-allowed' : 'pointer',
                    flexShrink: 0
                  }}
                  title="Attach Image, PDF, Vector or Machine File"
                >
                  <Paperclip size={16} />
                </button>

                {/* Custom Offer Button */}
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(99, 102, 241, 0.15))',
                    border: '1.5px solid rgba(99, 102, 241, 0.4)',
                    color: '#4f46e5',
                    padding: '0 0.55rem',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  title="Create & Send Custom Offer"
                >
                  <Tag size={13} className="text-indigo-600" />
                  <span>Offer</span>
                </button>

                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    replyingTo 
                      ? `Reply to ${replyingTo.senderName || 'Customer'}...` 
                      : 'Type a message...'
                  }
                  value={replyInput}
                  onChange={handleInputChange}
                  style={{ flex: 1, minWidth: 0, height: '36px', fontSize: '0.85rem', padding: '0 0.75rem', borderRadius: '8px', boxSizing: 'border-box' }}
                />

                <button
                  type="submit"
                  className="btn btn-primary-orange"
                  disabled={(!replyInput.trim() && !attachedFile) || isUploadingAttachment}
                  style={{
                    height: '36px',
                    padding: '0 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    flexShrink: 0,
                    opacity: ((!replyInput.trim() && !attachedFile) || isUploadingAttachment) ? 0.5 : 1,
                    cursor: ((!replyInput.trim() && !attachedFile) || isUploadingAttachment) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span>Send</span> <Send size={13} />
                </button>
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
