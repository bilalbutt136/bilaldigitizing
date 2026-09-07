'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  fetchChatMessages,
  addChatMessage, 
  markConversationAsRead, 
  markConversationAsUnread,
  subscribeToLiveMessages,
  uploadFileToCloudinaryFull,
  broadcastTypingStatus,
  subscribeToTypingStatus,
  getAdminThreadUnreadCount,
  createCustomOffer
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
  RotateCcw,
  Bot,
  Check,
  CheckCheck,
  Mail,
  MailCheck,
  ArrowUp
} from 'lucide-react';

const formatChatTime = (timestamp) => {
  if (!timestamp) return 'Just now';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    const now = new Date();
    const isToday = now.toDateString() === d.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === d.toDateString();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isToday) {
      return timeStr;
    }
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
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
  const raw = msg.created_at || msg.timestamp || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeEmail = (e) => {
  if (!e) return '';
  const s = String(e).toLowerCase().trim();
  if (s === 'client@studio.com' || s.includes('guest@bdigitizing.pro')) return '';
  return s;
};

const isSupportConversation = (id) => {
  if (!id) return false;
  const lower = String(id).toLowerCase().trim();
  return lower === 'general-support' || lower === 'support-guest' || lower === 'help-support' || lower.startsWith('support-');
};

// Robust matcher to link messages or thread IDs to their parent conversation
export const matchesConversation = (conv, targetIdOrMsg) => {
  if (!conv || !targetIdOrMsg) return false;
  const cId = String(conv.id || '').toLowerCase().trim();

  if (typeof targetIdOrMsg === 'string') {
    const tId = targetIdOrMsg.toLowerCase().trim();
    if (cId === tId) return true;
    const cClean = cId.replace(/^(inbox-|support-|order-|direct-|chat-)/, '');
    const tClean = tId.replace(/^(inbox-|support-|order-|direct-|chat-)/, '');
    if (cClean && tClean && cClean === tClean) return true;
    const cEmail = normalizeEmail(conv.clientEmail);
    if (cEmail && (tId.includes(cEmail) || tClean === cEmail)) return true;
    return false;
  }

  const msg = targetIdOrMsg;
  const mConvId = String(msg.conversation_id || msg.thread_id || '').toLowerCase().trim();
  if (cId === mConvId) return true;

  const cEmail = normalizeEmail(conv.clientEmail || conv.client_email);
  const mEmail = normalizeEmail(msg.client_email || (mConvId.includes('@') ? mConvId.replace(/^(inbox-|support-|direct-|chat-|user_)/, '') : ''));

  const isMsgSupport = isSupportConversation(mConvId) || msg.isSupport === true;
  const isConvSupport = isSupportConversation(cId) || conv.isSupport === true;

  if (cEmail && mEmail && cEmail === mEmail && isMsgSupport === isConvSupport) {
    return true;
  }

  // Order threads match
  const cOrd = cId.replace('order-', '').replace('#', '');
  const mOrd = mConvId.replace('order-', '').replace('#', '');
  if (cOrd && mOrd && cOrd === mOrd) return true;

  // Guest thread match
  if (cId.includes('guest_') && mConvId.includes('guest_')) {
    const cG = cId.replace(/^(support-|inbox-)/, '');
    const mG = mConvId.replace(/^(support-|inbox-)/, '');
    if (cG === mG) return true;
  }

  return false;
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
      let clientEmail = normalizeEmail(conv.clientEmail || conv.client_email);
      if (!clientEmail) {
        const emailMsg = cleanMessages.find(m => normalizeEmail(m.client_email));
        if (emailMsg?.client_email) clientEmail = normalizeEmail(emailMsg.client_email);
      }
      if (!clientEmail && conv.id) {
        clientEmail = normalizeEmail(conv.id.replace('inbox-', '').replace('direct-', ''));
      }
      key = `inbox_${clientEmail || 'client'}`;
      unifiedId = `inbox-${clientEmail || 'client'}`;
    } else {
      // Support thread
      let clientEmail = normalizeEmail(conv.clientEmail || conv.client_email);
      if (!clientEmail) {
        const emailMsg = cleanMessages.find(m => normalizeEmail(m.client_email));
        if (emailMsg?.client_email) clientEmail = normalizeEmail(emailMsg.client_email);
      }

      if (clientEmail) {
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
    const lastTime = Math.max(conv.lastMessageTime || 0, lastMsg ? parseMessageTime(lastMsg) : (conv.updatedAt ? new Date(conv.updatedAt).getTime() : 0));
    const convUnread = conv.adminUnreadCount ?? conv.unreadCount ?? 0;
    const initialSnippet = conv.lastMessage || conv.last_message || (lastMsg ? (lastMsg.text || (lastMsg.attachment_name ? `📎 ${lastMsg.attachment_name}` : (lastMsg.offer_data || lastMsg.offer_id ? '📋 Custom Design Offer' : 'New Message'))) : '');

    if (!map.has(key)) {
      map.set(key, { 
        ...conv, 
        id: unifiedId,
        lastMessage: initialSnippet,
        last_message: initialSnippet,
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
      const updatedLastTime = Math.max(
        existing.lastMessageTime || 0,
        conv.lastMessageTime || 0,
        updatedLastMsg ? parseMessageTime(updatedLastMsg) : (existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0)
      );

      const combinedUnread = Math.max(existing.adminUnreadCount || 0, convUnread);

      const resolvedName = (existing.clientName && !['Customer', 'Client', 'Support', 'Admin'].includes(existing.clientName)) 
        ? existing.clientName 
        : ((conv.clientName && !['Customer', 'Client', 'Support', 'Admin'].includes(conv.clientName)) ? conv.clientName : existing.clientName);
      const resolvedEmail = (existing.clientEmail && existing.clientEmail !== 'client@studio.com') 
        ? existing.clientEmail 
        : (conv.clientEmail || existing.clientEmail);

      const updatedSnippet = conv.lastMessage || conv.last_message || (updatedLastMsg ? (updatedLastMsg.text || (updatedLastMsg.attachment_name ? `📎 ${updatedLastMsg.attachment_name}` : (updatedLastMsg.offer_data || updatedLastMsg.offer_id ? '📋 Custom Design Offer' : 'New Message'))) : existing.lastMessage);

      map.set(key, {
        ...existing,
        id: unifiedId,
        clientName: resolvedName,
        clientEmail: resolvedEmail,
        lastMessage: updatedSnippet,
        last_message: updatedSnippet,
        unreadCount: combinedUnread,
        adminUnreadCount: combinedUnread,
        messages: combinedMessages,
        lastMessageTime: updatedLastTime,
        updatedAt: updatedLastMsg?.timestamp || updatedLastMsg?.created_at || existing.updatedAt
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
};

export const AdminChatInbox = () => {
  const { showToast, setSelectedOrderForDrawer, orders = [] } = useAppState();

  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
  const [pendingAiOffer, setPendingAiOffer] = useState(null);
  const [isSubmittingAiOffer, setIsSubmittingAiOffer] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Independent Auto-Pilot settings per channel/department
  // Channel 1: 'helpdesk' (24/7 Help Desk) -> Autonomous AI Auto-Pilot (Defaults to ON)
  // Channel 2: 'digitizer' (Studio Digitizer / Direct Inbox) -> 100% MANUAL Mode (Auto-Pilot ALWAYS Disabled)
  const DEFAULT_CHANNEL_AUTOPILOT = {
    helpdesk: true,
    digitizer: false
  };

  const [channelAutoPilot, setChannelAutoPilot] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bdigi_admin_channel_autopilot');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            helpdesk: parsed.helpdesk ?? true,
            digitizer: false // Strict enforcement: Direct inbox is always manual
          };
        }
      } catch {}
    }
    return DEFAULT_CHANNEL_AUTOPILOT;
  });

  const channelAutoPilotRef = useRef(channelAutoPilot);
  const processedAutoRepliesRef = useRef(new Set());
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    channelAutoPilotRef.current = channelAutoPilot;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bdigi_admin_channel_autopilot', JSON.stringify(channelAutoPilot));
      } catch {}
    }
  }, [channelAutoPilot]);

  // Autonomous AI Responder for incoming customer inquiries
  // Note: 24/7 Live Support AI auto-replies are generated server-side in /api/chat/send.
  // Client-side auto-generation is intentionally disabled to eliminate race conditions and duplicate replies across admin tabs.
  const triggerAutoPilotReply = async (_newMsg) => {
    return;
  };

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
    const loadChats = async (isInitial = true) => {
      if (!isMounted) return;
      if (isInitial && (!conversationsRef.current || conversationsRef.current.length === 0)) {
        setIsLoadingConversations(true);
      }
      try {
        const data = await fetchConversations();
        if (isMounted) {
          if (data && data.length > 0) {
            const fresh = deduplicateThreads(data);

            setConversations(prevList => {
              const currentList = Array.isArray(prevList) && prevList.length > 0 ? prevList : (conversationsRef.current || []);

              // Non-destructive merge: preserve any recent in-flight or live messages
              const mergedList = fresh.map(freshConv => {
                const existing = currentList.find(c => matchesConversation(c, freshConv.id) || (freshConv.clientEmail && c.clientEmail === freshConv.clientEmail));
                if (!existing) return freshConv;

                const msgMap = new Map();
                (freshConv.messages || []).forEach(m => { if (m?.id) msgMap.set(m.id, m); });

                (existing.messages || []).forEach(m => {
                  if (!m?.id) return;
                  if (!msgMap.has(m.id)) {
                    const mTime = parseMessageTime(m);
                    // Keep recent messages from the last 60 seconds that might still be syncing
                    if (Date.now() - mTime < 60000) {
                      msgMap.set(m.id, m);
                    }
                  }
                });

                const mergedMessages = Array.from(msgMap.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
                const lastMsg = mergedMessages[mergedMessages.length - 1];

                return {
                  ...freshConv,
                  clientName: (freshConv.clientName && !['Customer', 'Client', 'Support', 'Guest Client'].includes(freshConv.clientName)) ? freshConv.clientName : (existing.clientName || freshConv.clientName),
                  clientEmail: freshConv.clientEmail || existing.clientEmail || '',
                  messages: mergedMessages,
                  lastMessageTime: Math.max(freshConv.lastMessageTime || 0, existing.lastMessageTime || 0, lastMsg ? parseMessageTime(lastMsg) : 0)
                };
              });

              // Also include any local-only threads that aren't in fresh yet
              currentList.forEach(existing => {
                const inFresh = mergedList.some(f => matchesConversation(f, existing.id));
                if (!inFresh && (existing.messages || []).length > 0) {
                  const lastMsg = existing.messages[existing.messages.length - 1];
                  if (Date.now() - parseMessageTime(lastMsg) < 60000) {
                    mergedList.push(existing);
                  }
                }
              });

              const finalized = deduplicateThreads(mergedList);

              // Preserve active chat selection seamlessly
              if (activeChatIdRef.current) {
                const stillMatches = finalized.find(c => matchesConversation(c, activeChatIdRef.current));
                if (stillMatches && stillMatches.id !== activeChatIdRef.current) {
                  setActiveChatId(stillMatches.id);
                }
              } else if (!activeChatIdRef.current && finalized[0]?.id) {
                setActiveChatId(finalized[0].id);
              }

              if (typeof window !== 'undefined') {
                try { localStorage.setItem(cacheKey, JSON.stringify(finalized)); } catch {}
              }
              return finalized;
            });
          } else if (isInitial && (!conversationsRef.current || conversationsRef.current.length === 0)) {
            setConversations([]);
            setActiveChatId(null);
            if (typeof window !== 'undefined') {
              try { localStorage.removeItem(cacheKey); } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Load chats error:', err);
      } finally {
        if (isMounted && isInitial) {
          setIsLoadingConversations(false);
        }
      }
    };
    
    // Initial fetch
    loadChats(true);

    // 15-second silent background poll to ensure absolute 100% data consistency
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadChats(false);
      }
    }, 15000);
    
    // Realtime PostgreSQL subscription for instant message delivery
    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (!record) return;

        // Extract offer data from any serialized container (offer_data, attachment, or text)
        let extractedOffer = record.offer_data || record.offerData || record.offer || null;
        if (typeof extractedOffer === 'string') {
          try { extractedOffer = JSON.parse(extractedOffer); } catch { extractedOffer = null; }
        }
        if (!extractedOffer && record.metadata) {
          const meta = typeof record.metadata === 'string' ? (() => { try { return JSON.parse(record.metadata); } catch { return null; } })() : record.metadata;
          if (meta?.offer_data) extractedOffer = meta.offer_data;
          else if (meta?.offer) extractedOffer = meta.offer;
          else if (meta?.id && String(meta.id).startsWith('off-')) extractedOffer = meta;
        }
        if (!extractedOffer && record.attachment && typeof record.attachment === 'string') {
          const trimmed = record.attachment.trim();
          if (trimmed.startsWith('{') && (trimmed.includes('"title"') || trimmed.includes('"price"'))) {
            try { extractedOffer = JSON.parse(trimmed); } catch {}
          }
        }
        if (!extractedOffer && record.text && record.text.includes('[OFFER_DATA:')) {
          try {
            const match = record.text.match(/\[OFFER_DATA:(\{.*?\})\]/s);
            if (match && match[1]) extractedOffer = JSON.parse(match[1]);
          } catch {}
        }
        let attachObj = null;
        if (record.attachment && typeof record.attachment === 'string') {
          const trimmed = record.attachment.trim();
          if (trimmed.startsWith('{')) {
            try { attachObj = JSON.parse(trimmed); } catch {}
          }
        } else if (record.attachment && typeof record.attachment === 'object') {
          attachObj = record.attachment;
        }

        const attachUrl = record.attachment_url || attachObj?.file_url || attachObj?.url || (typeof record.attachment === 'string' && (record.attachment.startsWith('http') || record.attachment.startsWith('/api/') || record.attachment.startsWith('blob:') || record.attachment.startsWith('data:')) ? record.attachment : null);
        let attachName = record.attachment_name || attachObj?.file_name || attachObj?.name || (extractedOffer ? `Custom Offer: ${extractedOffer.title}` : (typeof record.attachment === 'string' && !record.attachment.trim().startsWith('{') && !record.attachment.startsWith('http') ? record.attachment : null));
        if (!attachName || attachName.trim().startsWith('{')) {
          attachName = attachUrl ? decodeURIComponent(attachUrl.split('/').pop()?.split('?')[0] || '') : null;
        }
        const attachSize = record.attachment_size || attachObj?.file_size || attachObj?.size || null;
        const attachType = extractedOffer ? 'custom_offer' : (record.attachment_type || attachObj?.mime_type || attachObj?.type || attachObj?.format || null);

        const newMsg = {
          id: record.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: record.conversation_id,
          thread_id: record.conversation_id,
          client_email: normalizeEmail(record.client_email),
          type: extractedOffer ? 'custom_offer' : (record.type || 'text'),
          sender: record.sender,
          senderName: record.sender_name,
          sender_name: record.sender_name,
          text: record.text,
          attachment: record.attachment,
          attachment_url: attachUrl,
          attachment_name: attachName,
          attachment_size: attachSize,
          attachment_type: attachType,
          file_id: attachObj?.file_id || record.file_id || null,
          reply_to: record.reply_to,
          offer_id: extractedOffer?.id || record.offer_id || null,
          offer_data: extractedOffer,
          offer: extractedOffer,
          is_read: record.is_read || false,
          is_autopilot: record.is_autopilot || record.auto_pilot || false,
          auto_pilot: record.is_autopilot || record.auto_pilot || false,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        // ─────────────────────────────────────────────────────────────
        // STRICT NOTIFICATION GUARDS — all 3 must pass before any toast/sound fires
        const isInsertEvent = (msgPayload.eventType === 'INSERT') || (!msgPayload.eventType && !!msgPayload.new);
        
        if (isInsertEvent) {
          const msgTs = new Date(record.created_at || record.timestamp || 0).getTime();
          const nowMs = Date.now();
          const isRecentEnough = !isNaN(msgTs) && (nowMs - msgTs) < 30_000;
          const isIncomingFromCustomer = newMsg.sender === 'client' || newMsg.sender === 'customer' || (newMsg.sender && newMsg.sender !== 'admin');

          if (isRecentEnough && isIncomingFromCustomer) {
            const isCurrentlyOpen = activeChatIdRef.current && (
              activeChatIdRef.current === newMsg.conversation_id ||
              matchesConversation({ id: activeChatIdRef.current, clientEmail: newMsg.client_email }, newMsg)
            );

            if (isCurrentlyOpen) {
              // Conversation is open in view — soft chime & smooth scroll
              playNotificationSound('receive');
            }
            // Background notifications and audio dings are handled globally by StateContext.jsx
          }
        }

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const existingIdx = safePrev.findIndex(c => matchesConversation(c, newMsg));

          const isCurrentlyOpen = (activeChatIdRef.current && existingIdx >= 0 && matchesConversation(safePrev[existingIdx], activeChatIdRef.current)) ||
                                  (activeChatIdRef.current === newMsg.conversation_id);

          if (existingIdx >= 0) {
            const targetConv = safePrev[existingIdx];
            const currentMsgs = targetConv.messages || [];
            const incomingOfferId = newMsg.offer_id || newMsg.offer_data?.id;
            
            const msgExistsIndex = currentMsgs.findIndex(m => 
              (m.id && newMsg.id && m.id === newMsg.id) || 
              (incomingOfferId && (m.offer_id === incomingOfferId || m.offer_data?.id === incomingOfferId)) ||
              (m.id && String(m.id).startsWith('msg-') && m.text === newMsg.text && m.sender === newMsg.sender && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 15000) ||
              (m.text && newMsg.text && m.text === newMsg.text && m.sender === newMsg.sender && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 10000)
            );
            
            let nextMsgs;
            if (msgExistsIndex >= 0) {
              nextMsgs = [...currentMsgs];
              nextMsgs[msgExistsIndex] = { ...nextMsgs[msgExistsIndex], ...newMsg };
            } else {
              nextMsgs = [...currentMsgs, newMsg];
            }
            
            nextMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));

            const isCustomerMsg = newMsg.sender === 'client' || newMsg.sender === 'customer' || newMsg.sender !== 'admin';
            const resolvedClientName = targetConv.clientName && !['Customer', 'Client', 'Support', 'Guest Client'].includes(targetConv.clientName) 
              ? targetConv.clientName 
              : (newMsg.senderName || targetConv.clientName);

            const msgTime = parseMessageTime(newMsg) || Date.now();
            let snippet = newMsg.text || '';
            if (!snippet) {
              if (newMsg.attachment_name || newMsg.attachment) {
                snippet = `📎 ${newMsg.attachment_name || newMsg.attachment}`;
              } else if (newMsg.offer_data || newMsg.offer_id) {
                snippet = '📋 Custom Design Offer';
              } else {
                snippet = 'New Message';
              }
            } else if (snippet.includes('[OFFER_DATA:')) {
              snippet = '📋 Custom Design Offer';
            }

            const updatedConv = {
              ...targetConv,
              clientName: resolvedClientName,
              clientEmail: targetConv.clientEmail || newMsg.client_email || '',
              unreadCount: (targetConv.unreadCount || 0) + (isCustomerMsg ? 1 : 0),
              adminUnreadCount: (targetConv.adminUnreadCount || 0) + (isCustomerMsg ? 1 : 0),
              admin_unread_count: (targetConv.admin_unread_count || 0) + (isCustomerMsg ? 1 : 0),
              messages: nextMsgs,
              lastMessage: snippet,
              last_message: snippet,
              lastMessageTime: Math.max(targetConv.lastMessageTime || 0, msgTime),
              last_message_time: Math.max(targetConv.lastMessageTime || 0, msgTime),
              updatedAt: newMsg.created_at || newMsg.timestamp || new Date().toISOString()
            };

            const nextList = [...safePrev];
            nextList.splice(existingIdx, 1);
            nextList.unshift(updatedConv);
            const deduplicated = deduplicateThreads(nextList);
            if (typeof window !== 'undefined') {
              try { localStorage.setItem(cacheKey, JSON.stringify(deduplicated)); } catch {}
            }
            return deduplicated;
          } else {
            // New conversation thread initiated
            const newConvId = String(newMsg.conversation_id || '').toLowerCase();
            const isNewSupport = isSupportConversation(newConvId) || newMsg.isSupport === true;
            const newClientEmail = normalizeEmail(newMsg.client_email);
            const newClientName = newMsg.senderName || (newClientEmail ? newClientEmail.split('@')[0] : (isNewSupport ? 'Guest Client' : 'Customer'));

            let canonicalNewId = newMsg.conversation_id;
            if (isNewSupport) {
              canonicalNewId = newClientEmail ? `support-${newClientEmail}` : (newConvId.startsWith('support-') ? newConvId : `support-${newConvId}`);
            } else {
              canonicalNewId = newClientEmail ? `inbox-${newClientEmail}` : (newConvId.startsWith('inbox-') ? newConvId : `inbox-${newConvId}`);
            }

            let snippet = newMsg.text || '';
            if (!snippet) {
              if (newMsg.attachment_name || newMsg.attachment) {
                snippet = `📎 ${newMsg.attachment_name || newMsg.attachment}`;
              } else if (newMsg.offer_data || newMsg.offer_id) {
                snippet = '📋 Custom Design Offer';
              } else {
                snippet = 'New Message';
              }
            } else if (snippet.includes('[OFFER_DATA:')) {
              snippet = '📋 Custom Design Offer';
            }

            const msgTime = parseMessageTime(newMsg) || Date.now();
            const newThread = {
              id: canonicalNewId,
              clientName: newClientName,
              clientEmail: newClientEmail,
              clientCompany: isNewSupport ? 'Live Support' : 'Studio Client',
              orderId: isNewSupport ? 'Support' : 'Direct Chat',
              orderTitle: isNewSupport ? 'Live Support' : 'Direct Inbox',
              isSupport: isNewSupport,
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newClientName)}&background=0f172a&color=fff&bold=true`,
              status: 'online',
              unreadCount: newMsg.sender === 'client' || newMsg.sender !== 'admin' ? 1 : 0,
              adminUnreadCount: newMsg.sender === 'client' || newMsg.sender !== 'admin' ? 1 : 0,
              admin_unread_count: newMsg.sender === 'client' || newMsg.sender !== 'admin' ? 1 : 0,
              messages: [newMsg],
              lastMessage: snippet,
              last_message: snippet,
              lastMessageTime: msgTime,
              last_message_time: msgTime,
              updatedAt: newMsg.created_at || newMsg.timestamp || new Date().toISOString()
            };

            const deduplicated = deduplicateThreads([newThread, ...safePrev]);
            if (typeof window !== 'undefined') {
              try { localStorage.setItem(cacheKey, JSON.stringify(deduplicated)); } catch {}
            }
            return deduplicated;
          }
        });

        if (activeChatIdRef.current && (newMsg.conversation_id === activeChatIdRef.current || matchesConversation({ id: activeChatIdRef.current }, newMsg))) {
          setTimeout(() => scrollToBottom('smooth'), 50);
        }
      },
      (convPayload) => {
        if (!isMounted) return;
        const fresh = convPayload.new || convPayload.record;
        if (!fresh) return;

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(c => {
            if (matchesConversation(c, fresh.id)) {
              return {
                ...c,
                unreadCount: fresh.admin_unread_count ?? fresh.unread_count ?? c.unreadCount,
                adminUnreadCount: fresh.admin_unread_count ?? fresh.unread_count ?? c.adminUnreadCount,
                admin_unread_count: fresh.admin_unread_count ?? fresh.unread_count ?? c.admin_unread_count,
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
      clearInterval(pollInterval);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

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
            const textMatches = typeof m.text === 'string' && m.text.includes(offerId);
            const attachMatches = typeof m.attachment === 'string' && m.attachment.includes(offerId);
            if (mOfferId === offerId || m.id === offerId || textMatches || attachMatches) {
              hasModified = true;
              const prevOfferData = typeof m.offer_data === 'object' && m.offer_data ? m.offer_data : {};
              const mergedOffer = {
                ...prevOfferData,
                ...(freshOffer || {}),
                id: offerId,
                status: newStatus,
                payment_status: freshOffer?.payment_status || (newStatus === 'paid' ? 'paid' : (prevOfferData.payment_status || (newStatus === 'accepted' ? 'pending' : 'unpaid'))),
                order_id: freshOffer?.order_id || prevOfferData.order_id || null,
                updated_at: new Date().toISOString()
              };
              let updatedText = m.text || '';
              if (updatedText.includes('[OFFER_DATA:')) {
                updatedText = updatedText.replace(/\[OFFER_DATA:(.*?)\]/, `[OFFER_DATA:${JSON.stringify(mergedOffer)}]`);
              }
              return {
                ...m,
                offer_id: offerId,
                offer_data: mergedOffer,
                offer: mergedOffer,
                text: updatedText
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
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: behavior === 'smooth' ? 'smooth' : 'auto'
      });
    }
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({
          behavior: behavior === 'smooth' ? 'smooth' : 'auto',
          block: 'end'
        });
      } catch {}
    }
    requestAnimationFrame(() => {
      if (chatFeedRef.current) {
        chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
      }
    });
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

  // Helper to compute admin unread count strictly for client messages
  const getThreadUnreadCount = (conv) => {
    return getAdminThreadUnreadCount(conv);
  };

  const handleSelectChat = async (chatId) => {
    setActiveChatId(chatId);
    setPendingAiOffer(null);
    setMobileView('chat');
    const targetConv = conversations.find(c => c.id === chatId);
    const email = targetConv?.clientEmail || '';

    // Fetch latest message stream for this specific thread without auto-marking as read
    if (isSupabaseConfigured) {
      try {
        const freshMsgs = await fetchChatMessages(chatId, email, null, 100);
        if (Array.isArray(freshMsgs) && freshMsgs.length > 0) {
          setHasMoreMessages(freshMsgs.length >= 100);
          setConversations(prev => {
            const updated = prev.map(c => {
              if (c.id === chatId || (email && c.clientEmail === email)) {
                const msgMap = new Map();
                (c.messages || []).forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
                freshMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
                const merged = Array.from(msgMap.values())
                  .sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
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

  const handleExplicitMarkAsRead = async (chatId = currentActiveChatId) => {
    if (!chatId) return;
    const targetConv = conversations.find(c => c.id === chatId);
    const email = targetConv?.clientEmail || '';

    // Optimistic UI update
    setConversations(prev => {
      const updated = prev.map(c => 
        (c.id === chatId || (email && c.clientEmail === email))
          ? {
              ...c,
              unreadCount: 0,
              adminUnreadCount: 0,
              admin_unread_count: 0,
              messages: (c.messages || []).map(m => (m.sender === 'client' || m.sender === 'customer' || m.sender !== 'admin') ? { ...m, is_read: true } : m)
            } 
          : c
      );
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(cacheKey, JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      await markConversationAsRead(chatId, 'admin', email);
    }
    showToast('✓ Thread marked as read', 'success');
  };

  const handleExplicitMarkAsUnread = async (chatId = currentActiveChatId) => {
    if (!chatId) return;
    const targetConv = conversations.find(c => c.id === chatId);
    const email = targetConv?.clientEmail || '';

    // Optimistic UI update
    setConversations(prev => {
      const updated = prev.map(c => 
        (c.id === chatId || (email && c.clientEmail === email))
          ? {
              ...c,
              unreadCount: 1,
              adminUnreadCount: 1,
              admin_unread_count: 1,
              messages: (c.messages || []).map((m, idx, arr) => (idx === arr.length - 1 && m.sender !== 'admin') ? { ...m, is_read: false } : m)
            } 
          : c
      );
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(cacheKey, JSON.stringify(updated)); } catch {}
      }
      return updated;
    });

    if (isSupabaseConfigured) {
      await markConversationAsUnread(chatId, 'admin', email);
    }
    showToast('✉ Thread marked as unread', 'info');
  };

  const handleLoadEarlierMessages = async () => {
    if (isLoadingEarlier || !currentActiveChatId) return;
    const targetConv = conversations.find(c => c.id === currentActiveChatId);
    const msgs = targetConv?.messages || [];
    if (msgs.length === 0) return;

    const oldestMsg = msgs[0];
    const oldestTimestamp = oldestMsg.created_at || oldestMsg.timestamp;
    if (!oldestTimestamp) return;

    try {
      setIsLoadingEarlier(true);
      const email = targetConv?.clientEmail || '';
      
      const container = chatFeedRef.current;
      const prevScrollHeight = container ? container.scrollHeight : 0;

      const earlierMsgs = await fetchChatMessages(currentActiveChatId, email, null, 50, oldestTimestamp);

      if (Array.isArray(earlierMsgs) && earlierMsgs.length > 0) {
        setHasMoreMessages(earlierMsgs.length >= 50);
        setConversations(prev => {
          const updated = prev.map(c => {
            if (c.id === currentActiveChatId || (email && c.clientEmail === email)) {
              const msgMap = new Map();
              earlierMsgs.forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              (c.messages || []).forEach(m => { if (m && m.id) msgMap.set(m.id, m); });
              const merged = Array.from(msgMap.values()).sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
              return { ...c, messages: merged };
            }
            return c;
          });
          return deduplicateThreads(updated);
        });

        // Restore scroll position so content doesn't jump
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight;
          }
        }, 30);
      } else {
        setHasMoreMessages(false);
        showToast('Reached beginning of message history', 'info');
      }
    } catch (err) {
      console.warn('Error loading earlier messages:', err);
    } finally {
      setIsLoadingEarlier(false);
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
      .reduce((sum, c) => sum + getAdminThreadUnreadCount(c), 0);
  }, [conversations]);

  const supportUnreadTotal = useMemo(() => {
    return conversations
      .filter(c => isSupportThread(c))
      .reduce((sum, c) => sum + getAdminThreadUnreadCount(c), 0);
  }, [conversations]);

  const unreadTotal = useMemo(() => {
    return activeSection === 'inbox' ? inboxUnreadTotal : supportUnreadTotal;
  }, [activeSection, inboxUnreadTotal, supportUnreadTotal]);

  const unreadThreadsCount = useMemo(() => {
    return conversations
      .filter(c => (activeSection === 'inbox' ? !isSupportThread(c) : isSupportThread(c)))
      .filter(c => getAdminThreadUnreadCount(c) > 0).length;
  }, [conversations, activeSection]);

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

  // Filter and sort conversations list (always newest at the very top)
  const filteredConversations = useMemo(() => {
    const list = conversations.filter(conv => {
      const isSupport = isSupportThread(conv);

      // Strict Channel Separation
      if (activeSection === 'inbox' && isSupport) return false;
      if (activeSection === 'support' && !isSupport) return false;

      if (subFilter === 'unread') {
        if (getAdminThreadUnreadCount(conv) === 0) return false;
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

    return list.sort((a, b) => {
      const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [conversations, activeSection, subFilter, searchTerm, orders]);

  // Current active channel ('helpdesk' vs 'digitizer')
  const currentChannelType = (activeChat?.isSupport || isSupportThread(activeChat) || activeSection === 'support') ? 'helpdesk' : 'digitizer';
  const isHelpDeskActive = currentChannelType === 'helpdesk';
  const isHelpDeskAutoPilotOn = Boolean(channelAutoPilot.helpdesk);

  const toggleHelpDeskAutoPilot = async () => {
    const nextVal = !channelAutoPilot.helpdesk;
    setChannelAutoPilot(prev => ({
      ...prev,
      helpdesk: nextVal,
      digitizer: false
    }));
    showToast(`🤖 24/7 Help Desk Auto-Pilot ${nextVal ? 'enabled (Autonomous AI Mode)' : 'disabled (Manual Mode)'}`, nextVal ? 'success' : 'info');
    try {
      await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: [{ key: 'autopilot_helpdesk', value: nextVal }] })
      });
    } catch {}
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Shift + P => Polish with AI
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      handleAIPolish();
      return;
    }
    // Ctrl/Cmd + Shift + S => Smart Reply
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      handleSmartReply();
      return;
    }
    // Enter without Shift => Send Message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (isSending) return;
    if (!replyInput.trim() && !attachedFile) return;
    if (!currentActiveChatId) return;

    const draftText = replyInput;
    const draftFile = attachedFile;
    const draftReplyTo = replyingTo;

    setIsSending(true);

    const targetCustomerEmail = (activeInfo?.customerEmail || activeChat?.clientEmail || (currentActiveChatId ? currentActiveChatId.replace('support-', '').replace('inbox-', '').replace('direct-', '').replace('chat-', '') : '')).toLowerCase().trim();

    const nowIso = new Date().toISOString();
    const serializedAttachment = attachedFile ? (attachedFile.url ? JSON.stringify({
      file_id: attachedFile.file_id || null,
      file_url: attachedFile.url,
      url: attachedFile.url,
      file_name: attachedFile.name,
      name: attachedFile.name,
      file_size: attachedFile.size,
      size: attachedFile.size,
      mime_type: attachedFile.format === 'pdf' ? 'application/pdf' : (attachedFile.mime_type || attachedFile.format),
      type: attachedFile.format
    }) : attachedFile.name) : null;

    const newMsg = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      conversation_id: currentActiveChatId,
      client_email: targetCustomerEmail || null,
      sender: 'admin',
      senderName: 'Support',
      sender_name: 'Support',
      text: replyInput.trim(),
      attachment: serializedAttachment,
      attachment_url: attachedFile ? attachedFile.url : null,
      attachment_name: attachedFile ? attachedFile.name : null,
      attachment_size: attachedFile ? attachedFile.size : null,
      attachment_type: attachedFile ? (attachedFile.format === 'pdf' ? 'application/pdf' : attachedFile.format) : null,
      file_id: attachedFile ? (attachedFile.file_id || null) : null,
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

    let outgoingSnippet = newMsg.text || '';
    if (!outgoingSnippet) {
      if (newMsg.attachment_name || newMsg.attachment) {
        outgoingSnippet = `📎 ${newMsg.attachment_name || newMsg.attachment}`;
      } else {
        outgoingSnippet = 'Attachment';
      }
    }

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
            lastMessage: outgoingSnippet,
            last_message: outgoingSnippet,
            updatedAt: nowIso,
            lastMessageTime: Date.now(),
            last_message_time: Date.now()
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
    playNotificationSound('send');
    showToast(`Reply sent to ${activeInfo.customerName || 'Customer'}!`, 'success');
    scrollToBottom('smooth');

    try {
      if (isSupabaseConfigured) {
        await addChatMessage(currentActiveChatId, newMsg);
      }
    } catch (err) {
      console.error('Admin persist message error:', err);
      // Restore user draft inputs so message is not lost
      setReplyInput(draftText);
      setAttachedFile(draftFile);
      setReplyingTo(draftReplyTo);
      // Rollback optimistic state
      setConversations(prev => prev.map(c => {
        if (c.id === currentActiveChatId) {
          return {
            ...c,
            messages: (c.messages || []).filter(m => m.id !== newMsg.id)
          };
        }
        return c;
      }));
      showToast('Failed to deliver message: ' + (err?.message || 'Server connection error'), 'error');
    } finally {
      setIsSending(false);
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

    const lastAttachedImg = lastCustomerMsg?.attachment_url || (typeof lastCustomerMsg?.attachment === 'string' && lastCustomerMsg.attachment.startsWith('http') ? lastCustomerMsg.attachment : null);

    try {
      setIsGeneratingSmartReply(true);
      const currentDraft = (replyInput || '').trim();
      if (currentDraft) setUndoDraft(currentDraft);

      const response = await fetch('/api/ai/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: threadMsgs.map(m => ({ 
            sender: m.sender, 
            text: m.text, 
            attachment_url: m.attachment_url,
            attachment_name: m.attachment_name
          })),
          customerName: clientDisplayName,
          latestMessage: latestMessageText,
          imageUrl: lastAttachedImg,
          channelType: currentChannelType,
          isSupport: currentChannelType === 'helpdesk'
        })
      });
      const data = await response.json();
      const generated = data?.replyText || data?.smartReply;
      if (response.ok && (generated || data?.shouldCreateOffer)) {
        if (currentDraft) setUndoDraft(currentDraft);
        if (generated) setReplyInput(generated);

        if (data.shouldCreateOffer && data.offerDetails?.title && data.offerDetails?.price) {
          setPendingAiOffer(data.offerDetails);
          showToast(`⚡ AI prepared a Custom Offer ($${data.offerDetails.price}) ready to attach!`, 'success');
        } else {
          setPendingAiOffer(null);
          showToast('⚡ Smart Reply generated!', 'success');
        }

        setTimeout(() => {
          adjustTextareaHeight();
        }, 10);
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

  const handleSendPendingAiOffer = async () => {
    if (!pendingAiOffer || !currentActiveChatId) return;
    setIsSubmittingAiOffer(true);
    try {
      const offerPayload = {
        conversation_id: currentActiveChatId,
        client_name: activeInfo?.customerName || activeChat?.clientName || 'Customer',
        client_email: activeInfo?.customerEmail || activeChat?.clientEmail || '',
        title: String(pendingAiOffer.title).trim(),
        description: String(pendingAiOffer.description || 'Production-ready embroidery or vector files crafted to exact technical specifications.').trim(),
        service_type: pendingAiOffer.service_type || 'Embroidery Digitizing',
        price: parseFloat(pendingAiOffer.price) || 25,
        discount_amount: 0,
        final_price: parseFloat(pendingAiOffer.price) || 25,
        delivery_time_text: `${pendingAiOffer.deliveryDays || 1} Day${(pendingAiOffer.deliveryDays || 1) > 1 ? 's' : ''}`,
        delivery_days: parseInt(pendingAiOffer.deliveryDays, 10) || 1,
        revisions_allowed: '99',
        expires_in_hours: 24,
        requires_requirements: true
      };

      const res = await createCustomOffer(offerPayload);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(`Custom offer sent to ${offerPayload.client_name}!`, 'success');
        setPendingAiOffer(null);
        if (replyInput.trim()) {
          handleSendMessage();
        }
      }
    } catch {
      showToast('Failed to create custom offer. Please try again.', 'error');
    } finally {
      setIsSubmittingAiOffer(false);
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
      const fileUrl = uploaded?.file_url || uploaded?.secure_url || uploaded?.url;
      if (uploaded && fileUrl) {
        setAttachedFile({
          name: uploaded.file_name || uploaded.name || file.name,
          url: fileUrl,
          size: uploaded.file_size || uploaded.size || (file.size / 1024).toFixed(1) + ' KB',
          format: uploaded.mime_type || uploaded.format || file.name.split('.').pop(),
          file_id: uploaded.file_id || uploaded.id || null
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
                title="Studio Digitizer Direct Inbox (100% Manual Admin Mode)"
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
                title={`24/7 Live Support Queue (Auto-Pilot: ${channelAutoPilot.helpdesk ? 'ON' : 'OFF'})`}
              >
                <Headphones size={13} />
                <span>Support ({supportConversationsCount})</span>
                {channelAutoPilot.helpdesk && (
                  <span style={{ fontSize: '0.65rem' }} title="Auto-Pilot Active">🤖</span>
                )}
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
            {isLoadingConversations && filteredConversations.length === 0 ? (
              <div style={{ padding: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '10px',
                      background: 'var(--color-bg-secondary, rgba(255,255,255,0.04))',
                      border: '1px solid var(--color-border, rgba(255,255,255,0.06))',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'center',
                      opacity: 0.7
                    }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--color-border, #e2e8f0)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ width: '55%', height: '12px', borderRadius: '4px', background: 'var(--color-border, #e2e8f0)' }} />
                      <div style={{ width: '85%', height: '10px', borderRadius: '4px', background: 'var(--color-border, #cbd5e1)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
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
                    onMarkAsRead={handleExplicitMarkAsRead}
                    onMarkAsUnread={handleExplicitMarkAsUnread}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                {/* Explicit Manual Read Status Controls */}
                {(() => {
                  const activeUnreadCount = getAdminThreadUnreadCount(activeChat);
                  return activeUnreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleExplicitMarkAsRead(currentActiveChatId)}
                      title="Mark this conversation as read"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.35)',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                      <span>Mark as Read ({activeUnreadCount})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleExplicitMarkAsUnread(currentActiveChatId)}
                      title="Mark this conversation as unread to follow up later"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'var(--color-surface, #ffffff)',
                        color: 'var(--color-text-secondary, #64748b)',
                        border: '1px solid var(--color-border, #cbd5e1)',
                        borderRadius: '20px',
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Mail size={12} />
                      <span>Mark Unread</span>
                    </button>
                  );
                })()}

                {/* 🤖 24/7 Help Desk Auto-Pilot AI Toggle Switch */}
                {isHelpDeskActive ? (
                  <button
                    type="button"
                    onClick={toggleHelpDeskAutoPilot}
                    title={`24/7 Help Desk Auto-Pilot (${isHelpDeskAutoPilotOn ? 'ON' : 'OFF'}). When enabled, incoming customer inquiries in 24/7 Live Support are answered autonomously by AI.`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: isHelpDeskAutoPilotOn ? '#ecfdf5' : '#f8fafc',
                      border: isHelpDeskAutoPilotOn ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '0.22rem 0.55rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isHelpDeskAutoPilotOn ? '0 1px 4px rgba(16, 185, 129, 0.2)' : 'none'
                    }}
                  >
                    <Bot size={13} className={isHelpDeskAutoPilotOn ? 'text-emerald-600' : 'text-slate-400'} />
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      color: isHelpDeskAutoPilotOn ? '#065f46' : '#64748b' 
                    }}>
                      Auto-Pilot
                    </span>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isHelpDeskAutoPilotOn ? '#10b981' : '#e2e8f0',
                      color: isHelpDeskAutoPilotOn ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      {isHelpDeskAutoPilotOn && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff', animation: 'pulse 1.5s infinite' }} />}
                      {isHelpDeskAutoPilotOn ? 'ON' : 'OFF'}
                    </span>
                  </button>
                ) : (
                  <div
                    title="Studio Digitizer Direct Inbox: 100% Manual Mode. Auto-Pilot is disabled for direct customer threads so digitizers have complete manual control over quotes and replies."
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '20px',
                      padding: '0.22rem 0.55rem',
                      userSelect: 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem' }}>🛡️</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 700, 
                      color: '#64748b' 
                    }}>
                      Manual Mode
                    </span>
                  </div>
                )}

                {/* View Customer Orders dropdown / trigger */}
                {activeChat.orders && activeChat.orders.length > 0 && (
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
                )}
              </div>
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
              {/* Pagination: Load Earlier Messages Button */}
              {hasMoreMessages && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0 0.75rem 0' }}>
                  <button
                    type="button"
                    onClick={handleLoadEarlierMessages}
                    disabled={isLoadingEarlier}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-primary, #ea580c)',
                      border: '1.5px solid var(--color-border, #cbd5e1)',
                      borderRadius: '20px',
                      padding: '0.35rem 0.95rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: isLoadingEarlier ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isLoadingEarlier ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-orange-500" />
                        <span>Loading message history...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUp size={13} />
                        <span>Load Earlier Messages</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeChat.messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                  <p style={{ fontWeight: 700, margin: 0 }}>No messages yet in this conversation</p>
                  <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Type a reply below to reach out to the customer.</p>
                </div>
              ) : null}

              {/* Message Bubbles */}
              {(() => {
                const msgs = activeChat.messages || [];
                const firstUnreadIndex = msgs.findIndex(m => 
                  (m.sender === 'client' || m.sender === 'customer' || (m.sender && m.sender !== 'admin')) && 
                  m.is_read !== true && 
                  m.is_read !== 'true'
                );

                return msgs.map((msg, index) => {
                  const isAdmin = msg.sender === 'admin';
                  const isFirstUnread = index === firstUnreadIndex;

                  return (
                    <React.Fragment key={msg.id || index}>
                      {isFirstUnread && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem',
                            margin: '0.85rem 0 0.6rem 0',
                            position: 'relative'
                          }}
                        >
                          <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to right, transparent, #3b82f6, transparent)' }} />
                          <span
                            style={{
                              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontWeight: 900,
                              padding: '0.22rem 0.8rem',
                              borderRadius: '9999px',
                              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase'
                            }}
                          >
                            <span>⚡</span>
                            <span>New Unread Messages</span>
                          </span>
                          <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to right, transparent, #3b82f6, transparent)' }} />
                        </div>
                      )}

                      <WhatsAppChatMessage
                        message={msg}
                        isMe={isAdmin}
                        senderDisplayName={isAdmin ? 'Support' : (activeInfo.customerName || msg.senderName || msg.sender_name || 'Customer')}
                        onReply={(m) => setReplyingTo(m)}
                        formatTime={formatChatTime}
                        themePreset="admin"
                        onOrderClick={(ordId) => {
                          if (!ordId) return;
                          const cleanId = String(ordId).replace('#', '').trim();
                          const found = Array.isArray(orders) ? orders.find(o => String(o.id) === cleanId || String(o.id).endsWith(cleanId)) : null;
                          if (found) {
                            setSelectedOrderForDrawer(found);
                          } else if (activeInfo.matchOrd) {
                            setSelectedOrderForDrawer(activeInfo.matchOrd);
                          } else {
                            setSelectedOrderForDrawer({ id: cleanId });
                          }
                        }}
                      />
                    </React.Fragment>
                  );
                });
              })()}

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
              {/* ⚡ Pending AI Custom Offer Banner */}
              {pendingAiOffer && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1.5px solid #6ee7b7',
                  borderRadius: '10px',
                  padding: '0.45rem 0.75rem',
                  marginBottom: '0.5rem',
                  gap: '0.5rem',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                    <Tag size={14} className="text-emerald-600 flex-shrink-0" />
                    <div style={{ fontSize: '0.74rem', color: '#065f46', lineHeight: 1.25 }}>
                      <strong style={{ fontWeight: 800 }}>⚡ Ready to Send Offer:</strong> {pendingAiOffer.title}{' '}
                      <span style={{ background: '#10b981', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                        ${pendingAiOffer.price}
                      </span>{' '}
                      <span style={{ color: '#047857', fontWeight: 600 }}>({pendingAiOffer.deliveryDays || 1}d delivery)</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={handleSendPendingAiOffer}
                      disabled={isSubmittingAiOffer}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.28rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: isSubmittingAiOffer ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      {isSubmittingAiOffer ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      <span>Send Offer Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAiOffer(null)}
                      title="Dismiss Offer"
                      style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '3px' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Toolbar (Single unified container: ⚡ Smart Reply + ✨ Polish with AI + 🤖 Auto-Pilot + 🏷️ Create Offer) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                marginBottom: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {/* 1. ⚡ Smart Reply Button */}
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
                  title="Read conversation context and auto-generate a tailored client response (Ctrl+Shift+S)"
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

                {/* 2. ✨ Polish Draft Button */}
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
                  title="Transform current draft into polished, native US customer service English (Ctrl+Shift+P)"
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

                {/* Subtle Divider / Spacer */}
                {(!activeChat?.isSupport && !isSupportThread(activeChat)) && (
                  <div style={{ width: '1px', height: '18px', background: '#e2e8f0', margin: '0 0.15rem' }} />
                )}

                {/* 3. 🏷️ Create Offer Button (Only in Normal Customer Inbox, never in Support) */}
                {(!activeChat?.isSupport && !isSupportThread(activeChat)) && (
                  <button
                    type="button"
                    onClick={() => setIsOfferModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.75rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#4f46e5',
                      background: '#f5f3ff',
                      border: '1px solid #ddd6fe',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(79, 70, 229, 0.06)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#ede9fe'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}
                    title="Create & Send Custom Offer"
                  >
                    <Tag size={13} className="text-indigo-600" />
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
                  accept="*/*"
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
                  placeholder="Type message..."
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
                  disabled={(!replyInput.trim() && !attachedFile) || isUploadingAttachment || isSending}
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
                    cursor: ((replyInput.trim() || attachedFile) && !isSending) ? 'pointer' : 'not-allowed',
                    flexShrink: 0,
                    boxShadow: (replyInput.trim() || attachedFile) ? '0 3px 12px rgba(234, 88, 12, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    opacity: ((!replyInput.trim() && !attachedFile) || isUploadingAttachment || isSending) ? 0.6 : 1
                  }}
                  title="Send message (Enter)"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <Send size={14} />
                    </>
                  )}
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
                    ⌨️ <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> Send
                  </span>
                  <span>
                    <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Shift</kbd>+<kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Enter</kbd> New line
                  </span>
                  <span>
                    <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Ctrl</kbd>+<kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Shift</kbd>+<kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>P</kbd> Polish
                  </span>
                  <span>
                    <kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Ctrl</kbd>+<kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>Shift</kbd>+<kbd style={{ padding: '0.05rem 0.35rem', borderRadius: '4px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.65rem', fontWeight: 700 }}>S</kbd> Smart Reply
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
          clientEmail={activeInfo.customerEmail || activeChat?.clientEmail || ''}
          onOfferCreated={(newOffer, newMsg) => {
            if (newMsg || newOffer) {
              const incomingOfferId = newOffer?.id || newMsg?.offer_id || newMsg?.offer_data?.id;
              const hydratedMsg = newMsg ? {
                ...newMsg,
                offer_id: incomingOfferId,
                offer_data: newOffer || newMsg?.offer_data,
                offer: newOffer || newMsg?.offer_data
              } : null;

              setConversations(prev => {
                const safePrev = Array.isArray(prev) ? prev : [];
                const updated = safePrev.map(conv => {
                  const matchesId = conv.id === currentActiveChatId || (hydratedMsg?.conversation_id && conv.id === hydratedMsg.conversation_id) || (newOffer?.conversation_id && conv.id === newOffer.conversation_id);
                  const matchesEmail = conv.clientEmail && (newOffer?.client_email === conv.clientEmail || hydratedMsg?.client_email === conv.clientEmail);

                  if (matchesId || matchesEmail) {
                    const currentMsgs = conv.messages || [];
                    let nextMsgs;
                    if (hydratedMsg) {
                      const exists = currentMsgs.some(m => 
                        (m.id && hydratedMsg.id && m.id === hydratedMsg.id) ||
                        (incomingOfferId && (m.offer_id === incomingOfferId || m.offer_data?.id === incomingOfferId))
                      );

                      if (exists) {
                        nextMsgs = currentMsgs.map(m => {
                          if ((m.id && hydratedMsg.id && m.id === hydratedMsg.id) || (incomingOfferId && (m.offer_id === incomingOfferId || m.offer_data?.id === incomingOfferId))) {
                            return { ...m, ...hydratedMsg };
                          }
                          return m;
                        });
                      } else {
                        nextMsgs = [...currentMsgs, hydratedMsg];
                      }
                    } else {
                      nextMsgs = currentMsgs;
                    }

                    return {
                      ...conv,
                      messages: nextMsgs,
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

              if (typeof window !== 'undefined' && newOffer) {
                window.dispatchEvent(new CustomEvent('bdigi_offer_status_change', {
                  detail: { offerId: incomingOfferId, status: newOffer.status || 'pending', offer: newOffer }
                }));
              }

              scrollToBottom('smooth');
            }
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
};
