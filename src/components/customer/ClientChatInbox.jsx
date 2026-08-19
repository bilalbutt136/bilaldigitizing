'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  addChatMessage, 
  subscribeToLiveMessages,
  markConversationAsRead,
  uploadFileToCloudinaryFull,
  broadcastTypingStatus,
  subscribeToTypingStatus
} from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import WhatsAppChatMessage from '../common/WhatsAppChatMessage';
import {
  MessageSquare,
  Send,
  Search,
  Paperclip,
  ChevronRight,
  Sparkles,
  Layers,
  PenTool,
  Package,
  Clock,
  CheckCheck,
  X,
  FileText,
  Loader2,
  Reply
} from 'lucide-react';

// Format timestamp safely to human-readable string
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

const isSupportId = (id) => {
  if (!id) return false;
  return id === 'general-support' || String(id).startsWith('support-');
};

export const ClientChatInbox = ({ initialOrderId = null }) => {
  const { 
    authUser, 
    currentUser, 
    orders = [], 
    setOrders,
    setSelectedOrderForDrawer, 
    showToast,
    formatOrderId = (id) => `#${String(id || '').substring(0, 6).toUpperCase()}`
  } = useAppState();

  const activeUser = authUser || currentUser || {
    name: 'Client',
    email: 'client@studio.com',
    company: 'Studio Account'
  };

  const clientEmail = (activeUser.email || '').toLowerCase().trim();
  const clientName = activeUser.name || 'Client';

  const defaultSupportId = useMemo(() => {
    return clientEmail && clientEmail !== 'client@studio.com' && !clientEmail.includes('guest@bdigitizing.pro')
      ? `support-${clientEmail}`
      : 'general-support';
  }, [clientEmail]);

  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(initialOrderId ? (initialOrderId.startsWith('order-') ? initialOrderId : `order-${initialOrderId}`) : defaultSupportId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'orders' | 'support' | 'unread'
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, url, size, format }
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [mobileView, setMobileView] = useState(initialOrderId ? 'chat' : 'list');
  
  const chatFeedRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Build unified thread list combining general support and active order discussions with chat history
  const buildThreadList = (remoteConvs = [], existingThreads = []) => {
    const threadMap = new Map();
    const existingMap = new Map((existingThreads || []).map(t => [t.id, t]));

    // 1. General Studio Support Thread
    const generalId = defaultSupportId;
    
    // Find all support conversations in remoteConvs (both general-support and support-${clientEmail} or other support threads)
    const remoteSupportConvs = (remoteConvs || []).filter(c => 
      c.id === generalId || 
      c.id === 'general-support' || 
      isSupportId(c.id) ||
      (!c.orderId && !c.order_id && !c.id?.startsWith('order-'))
    );
    
    const existingSupport = (existingThreads || []).find(c => isSupportId(c.id) || c.id === generalId);
    
    // Aggregate all support messages from remote and local state
    const supportMessagesMap = new Map();
    
    // Add existing local messages first
    (existingSupport?.messages || []).forEach(m => {
      if (m && (m.id || m.text)) {
        const key = m.id || `${m.sender}-${m.text}-${m.timestamp}`;
        supportMessagesMap.set(key, m);
      }
    });

    // Add remote support messages
    remoteSupportConvs.forEach(rc => {
      (rc.messages || []).forEach(rm => {
        if (rm && (rm.id || rm.text)) {
          let matched = false;
          for (const [key, existingMsg] of supportMessagesMap.entries()) {
            if (existingMsg.id === rm.id || (existingMsg.text === rm.text && Math.abs(new Date(existingMsg.timestamp) - new Date(rm.timestamp)) < 5000)) {
              supportMessagesMap.set(key, rm);
              matched = true;
              break;
            }
          }
          if (!matched) {
            const key = rm.id || `${rm.sender}-${rm.text}-${rm.timestamp}`;
            supportMessagesMap.set(key, rm);
          }
        }
      });
    });

    let generalMessages = Array.from(supportMessagesMap.values());
    if (generalMessages.length === 0) {
      generalMessages = [
        {
          id: 'welcome-msg',
          conversation_id: generalId,
          sender: 'admin',
          senderName: 'Support',
          text: `Welcome ${clientName}! How can our support team assist you today?`,
          timestamp: new Date().toISOString()
        }
      ];
    }

    generalMessages.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

    const genLastMsg = generalMessages[generalMessages.length - 1];
    const genLastTimestamp = genLastMsg?.timestamp || existingSupport?.updatedAt || new Date().toISOString();
    const genLastTime = genLastTimestamp && !isNaN(new Date(genLastTimestamp).getTime())
      ? new Date(genLastTimestamp).getTime()
      : Date.now();

    const maxSupportUnread = Math.max(
      existingSupport?.clientUnreadCount ?? 0,
      ...remoteSupportConvs.map(c => c.clientUnreadCount ?? c.unreadCount ?? 0),
      0
    );

    threadMap.set(generalId, {
      id: generalId,
      title: 'Support',
      orderId: 'Support',
      orderTitle: 'Live Studio Support',
      serviceType: 'general',
      serviceCategory: 'Support',
      status: 'online',
      unreadCount: maxSupportUnread,
      clientUnreadCount: maxSupportUnread,
      messages: generalMessages,
      lastMessageTime: genLastTime,
      updatedAt: genLastTimestamp
    });

    // 2. Order-specific Threads ONLY for orders that have chat history (or currently targeted)
    const myOrders = Array.isArray(orders) ? orders.filter(o => {
      const ordEmail = (o.client_email || o.clientEmail || '').toLowerCase().trim();
      return !clientEmail || ordEmail === clientEmail || !ordEmail;
    }) : [];

    myOrders.forEach(ord => {
      const orderThreadId = `order-${ord.id}`;
      const remoteOrderConv = (remoteConvs || []).find(c => c.id === orderThreadId || c.orderId === ord.id || c.order_id === ord.id);
      const existingOrderThread = existingMap.get(orderThreadId);

      const orderMessagesMap = new Map();

      // Order messages from local state
      (existingOrderThread?.messages || []).forEach(m => {
        if (m) {
          const key = m.id || `${m.sender}-${m.text}-${m.timestamp}`;
          orderMessagesMap.set(key, m);
        }
      });

      // Order messages from order object
      if (Array.isArray(ord.messages)) {
        ord.messages.forEach(m => {
          const msgObj = {
            id: m.id || `msg-${Math.random()}`,
            conversation_id: orderThreadId,
            sender: m.senderRole === 'admin' ? 'admin' : (m.sender === 'admin' ? 'admin' : 'client'),
            senderName: m.senderRole === 'admin' || m.sender === 'admin' ? 'Support' : (m.sender || m.senderName || clientName),
            text: m.text || m.message || '',
            attachment: m.attachment || m.attachments?.[0]?.name || null,
            attachmentUrl: m.attachmentUrl || m.attachments?.[0]?.url || null,
            timestamp: m.timestamp || m.created_at || new Date().toISOString()
          };
          const key = msgObj.id || `${msgObj.sender}-${msgObj.text}`;
          if (!orderMessagesMap.has(key)) orderMessagesMap.set(key, msgObj);
        });
      }

      // Order messages from remote conversation
      (remoteOrderConv?.messages || []).forEach(rm => {
        if (rm && (rm.id || rm.text)) {
          let matched = false;
          for (const [key, existingMsg] of orderMessagesMap.entries()) {
            if (existingMsg.id === rm.id || (existingMsg.text === rm.text && Math.abs(new Date(existingMsg.timestamp) - new Date(rm.timestamp)) < 5000)) {
              orderMessagesMap.set(key, rm);
              matched = true;
              break;
            }
          }
          if (!matched) {
            const key = rm.id || `${rm.sender}-${rm.text}-${rm.timestamp}`;
            orderMessagesMap.set(key, rm);
          }
        }
      });

      const combinedMessages = Array.from(orderMessagesMap.values());
      combinedMessages.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

      const isTargetedOrder = initialOrderId && (initialOrderId === ord.id || initialOrderId === `order-${ord.id}`);
      const isCurrentlyActive = activeChatId === orderThreadId;
      const hasChatHistory = combinedMessages.length > 0;

      // Filter: only show orders that actually have messages or are actively opened
      if (!hasChatHistory && !isTargetedOrder && !isCurrentlyActive) {
        return;
      }

      const lastMsg = combinedMessages[combinedMessages.length - 1];
      const ordLastTimestamp = lastMsg?.timestamp || remoteOrderConv?.updatedAt || ord.updatedAt || ord.createdAt;
      const ordLastTime = ordLastTimestamp && !isNaN(new Date(ordLastTimestamp).getTime())
        ? new Date(ordLastTimestamp).getTime()
        : Date.now();

      const svcCategory = ord.serviceCategory || (ord.type === 'vector' ? 'Vector Tracing' : ord.type === 'patches' ? 'Custom Patches' : 'Embroidery Digitizing');
      const orderNumFormatted = formatOrderId(ord.id);

      threadMap.set(orderThreadId, {
        id: orderThreadId,
        orderId: orderNumFormatted,
        rawOrderId: ord.id,
        title: `${svcCategory} — #${orderNumFormatted}`,
        orderTitle: ord.title || `${svcCategory} #${orderNumFormatted}`,
        orderObj: ord,
        serviceType: ord.type || ord.serviceCategory || 'embroidery',
        serviceCategory: svcCategory,
        orderStatus: ord.status || 'submitted',
        price: parseFloat(ord.price || 0),
        artworkUrl: ord.artworkUrl || ord.image_url || ord.logo,
        unreadCount: remoteOrderConv?.clientUnreadCount ?? remoteOrderConv?.unreadCount ?? existingOrderThread?.unreadCount ?? 0,
        clientUnreadCount: remoteOrderConv?.clientUnreadCount ?? existingOrderThread?.clientUnreadCount ?? 0,
        messages: combinedMessages,
        lastMessageTime: ordLastTime,
        updatedAt: ordLastTimestamp || new Date().toISOString()
      });
    });

    // 3. Include any other remote conversations belonging to this client with messages
    (remoteConvs || []).forEach(conv => {
      if (!threadMap.has(conv.id) && !isSupportId(conv.id)) {
        const existingThread = existingMap.get(conv.id);
        const msgsMap = new Map();
        (existingThread?.messages || []).forEach(m => msgsMap.set(m.id || m.text, m));
        (conv.messages || []).forEach(rm => msgsMap.set(rm.id || rm.text, rm));

        const msgs = Array.from(msgsMap.values());
        msgs.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

        if (msgs.length === 0 && conv.id !== activeChatId) return;

        const lastMsg = msgs[msgs.length - 1];
        const convTimestamp = lastMsg?.timestamp || conv.updatedAt || conv.created_at;
        const convTime = convTimestamp && !isNaN(new Date(convTimestamp).getTime())
          ? new Date(convTimestamp).getTime()
          : Date.now();

        threadMap.set(conv.id, {
          id: conv.id,
          title: conv.orderTitle || conv.clientName || 'Support Thread',
          orderId: conv.orderId || 'Order Discussion',
          orderTitle: conv.orderTitle || 'Direct Support',
          serviceType: 'general',
          unreadCount: conv.clientUnreadCount ?? conv.unreadCount ?? 0,
          clientUnreadCount: conv.clientUnreadCount ?? 0,
          messages: msgs,
          lastMessageTime: convTime,
          updatedAt: convTimestamp || new Date().toISOString()
        });
      }
    });

    const threadList = Array.from(threadMap.values());
    
    // Sort strictly by latest message timestamp (descending)
    threadList.sort((a, b) => {
      const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      return timeB - timeA;
    });

    return threadList;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize and load conversations
  useEffect(() => {
    let isMounted = true;

    const loadChats = async () => {
      if (!isMounted) return;
      let remoteConvs = [];
      if (isSupabaseConfigured) {
        remoteConvs = await fetchConversations(clientEmail);
      }

      if (isMounted) {
        setConversations(prev => {
          const fullThreads = buildThreadList(remoteConvs, prev);
          // If an initial order was passed, select that thread immediately
          if (initialOrderId) {
            const targetId = initialOrderId.startsWith('order-') ? initialOrderId : `order-${initialOrderId}`;
            if (fullThreads.some(t => t.id === targetId)) {
              setActiveChatId(targetId);
            }
          } else if (!activeChatId || activeChatId === 'general-support') {
            setActiveChatId(fullThreads[0]?.id || defaultSupportId);
          }
          return fullThreads;
        });
      }
    };

    loadChats();

    // Supabase Realtime subscription for instant message push
    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (!record) return;

        const newMsg = {
          id: record.id,
          conversation_id: record.conversation_id,
          sender: record.sender,
          senderName: record.sender_name || (record.sender === 'admin' ? 'Support' : clientName),
          sender_name: record.sender_name,
          text: record.text,
          attachment: record.attachment,
          attachment_url: record.attachment_url || null,
          attachment_name: record.attachment_name || record.attachment || null,
          attachment_size: record.attachment_size || null,
          attachment_type: record.attachment_type || null,
          reply_to: record.reply_to || null,
          is_read: record.is_read || false,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        if (newMsg.sender === 'admin' || newMsg.sender === 'support') {
          playNotificationSound('receive');
        }

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const msgTime = new Date(newMsg.timestamp).getTime() || Date.now();

          const isMatchThread = (thread) => {
            if (thread.id === newMsg.conversation_id) return true;
            if (thread.rawOrderId && newMsg.conversation_id?.includes(thread.rawOrderId)) return true;
            if (isSupportId(thread.id) && isSupportId(newMsg.conversation_id)) return true;
            return false;
          };

          const exists = safePrev.some(isMatchThread);
          if (!exists) {
            const isOrder = newMsg.conversation_id?.startsWith('order-');
            const newThread = {
              id: newMsg.conversation_id,
              title: isOrder ? `Order Discussion` : 'Support',
              orderId: isOrder ? newMsg.conversation_id.replace('order-', '') : 'Support',
              orderTitle: isOrder ? `Order Discussion` : 'Live Studio Support',
              serviceType: isOrder ? 'embroidery' : 'general',
              unreadCount: newMsg.sender === 'admin' ? 1 : 0,
              clientUnreadCount: newMsg.sender === 'admin' ? 1 : 0,
              messages: [newMsg],
              lastMessageTime: msgTime,
              updatedAt: newMsg.timestamp
            };
            return [newThread, ...safePrev];
          }

          const updated = safePrev.map(thread => {
            if (isMatchThread(thread)) {
              const currentMsgs = thread.messages || [];
              const existsIndex = currentMsgs.findIndex(m => m.id === newMsg.id || (m.text === newMsg.text && Math.abs(new Date(m.timestamp) - new Date(newMsg.timestamp)) < 5000));
              
              let nextMsgs;
              if (existsIndex >= 0) {
                // Update optimistic message with confirmed server message
                nextMsgs = [...currentMsgs];
                nextMsgs[existsIndex] = { ...nextMsgs[existsIndex], ...newMsg };
              } else {
                nextMsgs = [...currentMsgs, newMsg];
              }

              return {
                ...thread,
                messages: nextMsgs,
                unreadCount: activeChatId === thread.id ? 0 : (thread.unreadCount || 0) + (newMsg.sender === 'admin' ? 1 : 0),
                clientUnreadCount: activeChatId === thread.id ? 0 : (thread.clientUnreadCount || 0) + (newMsg.sender === 'admin' ? 1 : 0),
                lastMessageTime: msgTime,
                updatedAt: new Date().toISOString()
              };
            }
            return thread;
          });

          // Sort by latest message time
          return [...updated].sort((a, b) => {
            const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
            const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
            return timeB - timeA;
          });
        });
      },
      (convPayload) => {
        if (!isMounted) return;
        const conv = convPayload.new || convPayload.record;
        if (!conv) return;

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safePrev.map(c => {
            if (c.id === conv.id || (isSupportId(c.id) && isSupportId(conv.id))) {
              return {
                ...c,
                unreadCount: conv.client_unread_count ?? c.unreadCount ?? 0,
                clientUnreadCount: conv.client_unread_count ?? c.clientUnreadCount ?? 0,
                updatedAt: conv.updated_at || c.updatedAt
              };
            }
            return c;
          });
        });
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [orders, initialOrderId, clientEmail, clientName, defaultSupportId]);

  // Active chat thread
  const activeChat = useMemo(() => {
    return conversations.find(c => 
      c.id === activeChatId ||
      (isSupportId(activeChatId) && isSupportId(c.id))
    ) || conversations[0] || {
      id: defaultSupportId,
      title: 'Support',
      orderId: 'Support',
      messages: []
    };
  }, [conversations, activeChatId, defaultSupportId]);

  // Scroll messages to bottom on thread change or message arrival
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeChatId, activeChat?.messages?.length]);

  // Helper to compute client unread count strictly for Support messages
  const getThreadUnreadCount = (conv) => {
    if (!conv) return 0;
    if (activeChatId === conv.id || (isSupportId(activeChatId) && isSupportId(conv.id))) return 0;
    if (typeof conv.clientUnreadCount === 'number' && conv.clientUnreadCount > 0) {
      return conv.clientUnreadCount;
    }
    const lastRead = typeof window !== 'undefined'
      ? parseInt(localStorage.getItem('bdigi_read_client_' + conv.id) || '0', 10)
      : 0;
    const msgs = conv.messages || [];
    return msgs.filter(m => {
      if (m.sender !== 'admin' && m.sender !== 'support' && m.sender !== 'staff') return false;
      const t = m.timestamp ? new Date(m.timestamp).getTime() : 0;
      return t > lastRead;
    }).length;
  };

  const handleSelectThread = (threadId) => {
    setActiveChatId(threadId);
    setMobileView('chat');
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_read_client_' + threadId, String(Date.now()));
      window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: threadId } }));
    }
    markConversationAsRead(threadId);
    setConversations(prev => prev.map(c => 
      (c.id === threadId || (isSupportId(c.id) && isSupportId(threadId))) 
        ? { ...c, unreadCount: 0, clientUnreadCount: 0 } 
        : c
    ));
  };

  // Auto-mark active conversation as read in Client Chat
  useEffect(() => {
    if (activeChat?.id) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_read_client_' + activeChat.id, String(Date.now()));
        window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: activeChat.id } }));
      }
      markConversationAsRead(activeChat.id);
      setConversations(prev => prev.map(c => 
        (c.id === activeChat.id || (isSupportId(c.id) && isSupportId(activeChat.id))) 
          ? { ...c, unreadCount: 0, clientUnreadCount: 0 } 
          : c
      ));
    }
  }, [activeChat?.id]);

  // Subscribe to live typing indicators from Admin
  useEffect(() => {
    let supportTypingTimer = null;
    const unsubTyping = subscribeToTypingStatus((payload) => {
      if (!payload || !activeChat?.id) return;
      const isTargetThread = payload.conversationId === activeChat.id || (isSupportId(payload.conversationId) && isSupportId(activeChat.id));
      if (isTargetThread && payload.senderRole === 'admin') {
        if (payload.isTyping) {
          setIsSupportTyping(true);
          if (supportTypingTimer) clearTimeout(supportTypingTimer);
          supportTypingTimer = setTimeout(() => {
            setIsSupportTyping(false);
          }, 3500);
        } else {
          setIsSupportTyping(false);
        }
      }
    });

    return () => {
      if (unsubTyping) unsubTyping();
      if (supportTypingTimer) clearTimeout(supportTypingTimer);
    };
  }, [activeChat?.id]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    const targetConvId = activeChat?.id || defaultSupportId;
    broadcastTypingStatus(targetConvId, clientName, 'client', true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(targetConvId, clientName, 'client', false);
    }, 2500);
  };

  // Filter conversations based on search and selected filterMode
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.orderTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const unreadNum = getThreadUnreadCount(conv);
    if (filterMode === 'orders') return conv.id.startsWith('order-') || conv.rawOrderId;
    if (filterMode === 'support') return isSupportId(conv.id);
    if (filterMode === 'unread') return unreadNum > 0;
    return true;
  });

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const targetConvId = activeChat?.id || defaultSupportId;
    const nowIso = new Date().toISOString();
    const nowTime = Date.now();

    const newMsg = {
      id: 'msg-' + nowTime + '-' + Math.random().toString(36).substring(2, 6),
      conversation_id: targetConvId,
      order_id: activeChat.rawOrderId || null,
      order_title: activeChat.orderTitle || activeChat.title || 'Discussion',
      client_email: clientEmail,
      sender: 'client',
      senderName: clientName,
      sender_name: clientName,
      text: messageInput.trim(),
      attachment: attachedFile ? attachedFile.name : null,
      attachment_url: attachedFile ? attachedFile.url : null,
      attachment_name: attachedFile ? attachedFile.name : null,
      attachment_size: attachedFile ? attachedFile.size : null,
      attachment_type: attachedFile ? attachedFile.format : null,
      reply_to: replyingTo ? {
        id: replyingTo.id,
        sender_name: replyingTo.senderName || replyingTo.sender_name || 'Studio Support',
        text: replyingTo.text,
        attachment: replyingTo.attachment_name || replyingTo.attachment,
        attachment_url: replyingTo.attachment_url
      } : null,
      timestamp: nowIso,
      created_at: nowIso
    };

    // Instant optimistic state update in conversations list
    setConversations(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const isTarget = (c) => c.id === targetConvId || (isSupportId(c.id) && isSupportId(targetConvId));
      const exists = safePrev.some(isTarget);

      if (!exists) {
        const newThread = {
          id: targetConvId,
          title: activeChat.title || 'Support',
          orderId: activeChat.orderId || 'Support',
          orderTitle: activeChat.orderTitle || 'Live Studio Support',
          serviceType: 'general',
          unreadCount: 0,
          clientUnreadCount: 0,
          messages: [newMsg],
          lastMessageTime: nowTime,
          updatedAt: nowIso
        };
        return [newThread, ...safePrev];
      }

      const updated = safePrev.map(conv => {
        if (isTarget(conv)) {
          return {
            ...conv,
            unreadCount: 0,
            clientUnreadCount: 0,
            messages: [...(conv.messages || []), newMsg],
            lastMessageTime: nowTime,
            updatedAt: nowIso
          };
        }
        return conv;
      });

      return [...updated].sort((a, b) => {
        const timeA = a.lastMessageTime || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
        const timeB = b.lastMessageTime || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
        return timeB - timeA;
      });
    });

    // Optimistic state update in orders context if order thread
    if (activeChat.rawOrderId && typeof setOrders === 'function') {
      try {
        setOrders(prev => (prev || []).map(o => {
          if (o.id === activeChat.rawOrderId) {
            return {
              ...o,
              messages: [...(o.messages || []), newMsg]
            };
          }
          return o;
        }));
      } catch {}
    }

    setMessageInput('');
    setAttachedFile(null);
    setReplyingTo(null);
    broadcastTypingStatus(targetConvId, clientName, 'client', false);
    playNotificationSound('send');
    showToast('Message sent to production studio team!', 'success');

    // Persistence to Supabase
    if (isSupabaseConfigured) {
      try {
        await addChatMessage(targetConvId, newMsg);
      } catch (err) {
        console.warn('Persist chat message notice:', err);
      }
    }
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAttachment(true);
    showToast(`Uploading ${file.name}...`, 'info');
    try {
      const uploaded = await uploadFileToCloudinaryFull(file, 'client-uploads', 'chat-attachments');
      if (uploaded && uploaded.url) {
        setAttachedFile({
          name: file.name,
          url: uploaded.url,
          size: uploaded.size || (file.size / 1024).toFixed(1) + ' KB',
          format: uploaded.format || file.name.split('.').pop()
        });
        showToast(`Ready: ${file.name}`, 'success');
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

  if (!mounted) return null;

  return (
    <div style={{
      padding: 0,
      background: 'var(--color-surface, #ffffff)',
      border: '1.5px solid var(--color-border)',
      borderRadius: '16px',
      overflow: 'hidden',
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)'
    }}>

      {/* Main Grid: Left Conversation Sidebar + Right Chat Canvas */}
      <div 
        className="chat-inbox-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          flex: 1,
          minHeight: 0,
          height: '100%',
          overflow: 'hidden'
        }}
      >

        {/* LEFT PANEL: THREAD LIST */}
        <div 
          className={`chat-threads-column ${mobileView === 'chat' ? 'hide-on-mobile-thread' : ''}`}
          style={{
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-subtle, #f8fafc)',
            overflow: 'hidden'
          }}
        >
          {/* Thread List Header & Search */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface, #ffffff)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--color-primary-light, rgba(249, 115, 22, 0.1))',
                  color: 'var(--color-primary, var(--orange-600))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={16} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary, var(--navy-950))', margin: 0 }}>
                  Conversations
                </h3>
              </div>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'var(--color-text-muted, var(--text-muted))',
                background: 'var(--color-subtle, #f1f5f9)',
                padding: '0.2rem 0.5rem',
                borderRadius: '6px'
              }}>
                {conversations.length} Threads
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders, threads..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                  fontSize: '0.825rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-surface, #ffffff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  outline: 'none'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'orders', label: 'Orders' },
                { id: 'support', label: 'Support' },
                { id: 'unread', label: 'Unread' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterMode(tab.id)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: 'none',
                    background: filterMode === tab.id ? 'var(--navy-900)' : '#f1f5f9',
                    color: filterMode === tab.id ? '#ffffff' : 'var(--navy-700)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                  {tab.id === 'unread' && conversations.filter(c => getThreadUnreadCount(c) > 0).length > 0 && (
                    <span style={{
                      marginLeft: '0.35rem',
                      background: 'var(--orange-500)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '0.05rem 0.35rem',
                      borderRadius: '999px'
                    }}>
                      {conversations.filter(c => getThreadUnreadCount(c) > 0).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Thread Cards List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <MessageSquare size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(thread => {
                const isActive = thread.id === activeChat.id || (isSupportId(thread.id) && isSupportId(activeChat.id));
                const unread = getThreadUnreadCount(thread);
                const lastMsg = (thread.messages || [])[(thread.messages || []).length - 1];
                const isOrder = Boolean(thread.rawOrderId || thread.id.startsWith('order-'));

                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: isActive ? 'var(--color-surface, #ffffff)' : 'transparent',
                      border: isActive ? '1.5px solid var(--color-primary, var(--orange-500))' : '1px solid transparent',
                      boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                      marginBottom: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--color-subtle, #f1f5f9)';
                    }}
                    onMouseOut={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      {/* Avatar / Icon */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: isOrder ? '#f0fdf4' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                        color: isOrder ? '#16a34a' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}>
                        {isOrder ? (
                          thread.serviceCategory?.includes('Vector') ? <PenTool size={16} /> :
                          thread.serviceCategory?.includes('Patch') ? <Package size={16} /> :
                          <Layers size={16} />
                        ) : (
                          <Sparkles size={16} style={{ color: 'var(--orange-400)' }} />
                        )}
                      </div>

                      {/* Content Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                          <span style={{
                            fontSize: '0.85rem',
                            fontWeight: unread > 0 ? 900 : 700,
                            color: 'var(--navy-950)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {thread.title}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', marginLeft: '0.4rem' }}>
                            {formatChatTime(lastMsg?.timestamp || thread.updatedAt)}
                          </span>
                        </div>

                        <p style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: unread > 0 ? 'var(--navy-900)' : 'var(--text-muted)',
                          fontWeight: unread > 0 ? 700 : 400,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {lastMsg ? (
                            <>{lastMsg.sender === 'client' ? 'You: ' : 'Support: '}{lastMsg.text || 'Attachment'}</>
                          ) : (
                            'Start a discussion...'
                          )}
                        </p>
                      </div>

                      {/* Unread Badge */}
                      {unread > 0 && (
                        <span style={{
                          background: 'var(--orange-500)',
                          color: '#ffffff',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          minWidth: '18px',
                          height: '18px',
                          borderRadius: '999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 0.3rem',
                          boxShadow: '0 2px 6px rgba(249, 115, 22, 0.4)'
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CHAT FEED & INPUT */}
        <div 
          className={`chat-messages-column ${mobileView === 'list' ? 'hide-on-mobile-chat' : ''}`}
          style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--color-surface, #ffffff)', overflow: 'hidden' }}
        >
          
          {/* Active Thread Header */}
          <div style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="mobile-only"
                onClick={() => setMobileView('list')}
                style={{
                  background: 'var(--color-subtle, #f1f5f9)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  color: 'var(--color-text-primary, var(--navy-900))',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexShrink: 0
                }}
                aria-label="Back to conversations"
              >
                ← All Chats
              </button>

              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: activeChat.rawOrderId ? '#f0fdf4' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: activeChat.rawOrderId ? '#16a34a' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                flexShrink: 0
              }}>
                {activeChat.rawOrderId ? (
                  activeChat.serviceCategory?.includes('Vector') ? <PenTool size={18} /> :
                  activeChat.serviceCategory?.includes('Patch') ? <Package size={18} /> :
                  <Layers size={18} />
                ) : (
                  <Sparkles size={18} style={{ color: 'var(--color-primary, #ff7a00)' }} />
                )}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text-primary, var(--navy-950))' }}>
                  {activeChat.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.7rem',
                    color: '#16a34a',
                    fontWeight: 700
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                    Live Studio Team
                  </span>
                  {activeChat.orderStatus && (
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: 'var(--color-subtle, #f1f5f9)',
                      color: 'var(--color-text-secondary, var(--navy-700))'
                    }}>
                      Status: {activeChat.orderStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* If Order Thread: Quick Action to open Order Drawer */}
            {activeChat.rawOrderId && (
              <button
                type="button"
                onClick={() => {
                  if (activeChat.orderObj && setSelectedOrderForDrawer) {
                    setSelectedOrderForDrawer(activeChat.orderObj);
                  }
                }}
                style={{
                  background: 'var(--color-subtle, #f8fafc)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--color-text-primary, var(--navy-900))',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                View Order Details <ChevronRight size={13} />
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div 
            ref={chatFeedRef}
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: 'var(--color-subtle, #f8fafc)'
            }}
          >
            {(activeChat.messages || []).length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', maxWidth: '280px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: 'var(--orange-500)'
                }}>
                  <MessageSquare size={22} />
                </div>
                <h5 style={{ margin: '0 0 0.35rem', color: 'var(--navy-950)', fontSize: '0.95rem' }}>Send a Message</h5>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Connect directly with our master digitizing and vector team.
                </p>
              </div>
            ) : (
              (activeChat.messages || []).map((msg, index) => {
                const isMe = msg.sender === 'client';

                return (
                  <WhatsAppChatMessage
                    key={msg.id || index}
                    message={msg}
                    isMe={isMe}
                    senderDisplayName={isMe ? 'You' : (msg.senderName || msg.sender_name || 'Studio Support')}
                    onReply={(m) => setReplyingTo(m)}
                    formatTime={formatChatTime}
                  />
                );
              })
            )}

            {/* LIVE TYPING INDICATOR (WhatsApp Style) */}
            {isSupportTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.45rem 0.85rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                width: 'fit-content',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                margin: '0.25rem 0'
              }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)' }}>
                  Studio Support is typing
                </span>
                <span style={{ display: 'inline-flex', gap: '3px' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                </span>
              </div>
            )}
          </div>

          {/* QUOTED REPLY PREVIEW BANNER (WhatsApp Style) */}
          {replyingTo && (
            <div style={{
              padding: '0.5rem 1.25rem',
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
                  <Reply size={12} /> Replying to {replyingTo.senderName || replyingTo.sender_name || 'Studio Support'}
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
              padding: '0.45rem 1.25rem',
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
              padding: '0.45rem 1.25rem',
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

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              flexShrink: 0
            }}
          >
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
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--color-subtle, #f8fafc)',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                color: 'var(--color-text-secondary, var(--navy-700))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isUploadingAttachment ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title="Attach Image, PDF, Vector or Embroidery File"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={handleInputChange}
              placeholder={replyingTo ? `Reply to ${replyingTo.senderName || 'Support'}...` : `Message ${activeChat.title}...`}
              style={{
                flex: 1,
                padding: '0.65rem 1rem',
                fontSize: '0.88rem',
                borderRadius: '10px',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                outline: 'none',
                background: 'var(--color-subtle, #ffffff)',
                color: 'var(--color-text-primary, var(--navy-950))'
              }}
            />

            <button
              type="submit"
              disabled={(!messageInput.trim() && !attachedFile) || isUploadingAttachment}
              className="btn btn-primary-orange"
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: ((!messageInput.trim() && !attachedFile) || isUploadingAttachment) ? 0.5 : 1,
                cursor: ((!messageInput.trim() && !attachedFile) || isUploadingAttachment) ? 'not-allowed' : 'pointer'
              }}
            >
              Send <Send size={15} />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
