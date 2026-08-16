'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  addChatMessage, 
  createConversation, 
  subscribeToLiveMessages,
  addOrderMessageInSupabase 
} from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
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
  Download,
  X,
  FileText
} from 'lucide-react';

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

  const [mounted, setMounted] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState('general-support');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'orders' | 'support' | 'unread'
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  
  const chatFeedRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeUser = authUser || currentUser || {
    name: 'Client',
    email: 'client@studio.com',
    company: 'Studio Account'
  };

  const clientEmail = (activeUser.email || '').toLowerCase().trim();
  const clientName = activeUser.name || 'Client';
  const clientCompany = activeUser.company || 'Studio Client';

  // Build unified thread list combining general support and active order discussions with chat history
  const buildThreadList = (remoteConvs = []) => {
    const threadMap = new Map();

    // 1. General Studio Support Thread
    const generalId = 'general-support';
    const remoteGeneral = remoteConvs.find(c => c.id === generalId || (!c.orderId && !c.order_id && !c.id?.startsWith('order-')));
    
    const generalMessages = remoteGeneral?.messages || [
      {
        id: 'welcome-msg',
        sender: 'admin',
        senderName: 'Support',
        text: `Welcome ${clientName}! How can our support team assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    const genLastMsg = generalMessages[generalMessages.length - 1];
    const genLastTimestamp = genLastMsg?.timestamp || remoteGeneral?.updatedAt || remoteGeneral?.created_at;
    const genLastTime = genLastTimestamp && !isNaN(new Date(genLastTimestamp).getTime())
      ? new Date(genLastTimestamp).getTime()
      : 0;

    threadMap.set(generalId, {
      id: generalId,
      title: 'Support',
      orderId: 'Support',
      orderTitle: 'Live Studio Support',
      serviceType: 'general',
      serviceCategory: 'Support',
      status: 'online',
      unreadCount: remoteGeneral?.unreadCount || 0,
      messages: generalMessages,
      lastMessageTime: genLastTime,
      updatedAt: genLastTimestamp || new Date().toISOString()
    });

    // 2. Order-specific Threads ONLY for orders that have chat history (or currently targeted)
    const myOrders = Array.isArray(orders) ? orders.filter(o => {
      const ordEmail = (o.client_email || o.clientEmail || '').toLowerCase().trim();
      return !clientEmail || ordEmail === clientEmail || !ordEmail;
    }) : [];

    myOrders.forEach(ord => {
      const orderThreadId = `order-${ord.id}`;
      const remoteOrderConv = remoteConvs.find(c => c.id === orderThreadId || c.orderId === ord.id || c.order_id === ord.id);

      // Collect messages from order object and remote conversation
      const ordMessages = Array.isArray(ord.messages) ? ord.messages.map(m => ({
        id: m.id || `msg-${Math.random()}`,
        sender: m.senderRole === 'admin' ? 'admin' : (m.sender === 'admin' ? 'admin' : 'client'),
        senderName: m.senderRole === 'admin' || m.sender === 'admin' ? 'Support' : (m.sender || m.senderName || clientName),
        text: m.text || m.message || '',
        attachment: m.attachment || m.attachments?.[0]?.name || null,
        attachmentUrl: m.attachmentUrl || m.attachments?.[0]?.url || null,
        timestamp: m.timestamp ? (new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : 'Recent',
        rawTimestamp: m.timestamp || m.created_at
      })) : [];

      const remoteMsgs = Array.isArray(remoteOrderConv?.messages) ? remoteOrderConv.messages : [];
      const combinedMessages = [...ordMessages];
      
      remoteMsgs.forEach(rm => {
        if (!combinedMessages.some(m => m.id === rm.id || (m.text === rm.text && m.timestamp === rm.timestamp))) {
          combinedMessages.push(rm);
        }
      });

      const isTargetedOrder = initialOrderId && (initialOrderId === ord.id || initialOrderId === `order-${ord.id}`);
      const isCurrentlyActive = activeChatId === orderThreadId;
      const hasChatHistory = combinedMessages.length > 0;

      // Filter: only show orders that actually have messages or are actively opened
      if (!hasChatHistory && !isTargetedOrder && !isCurrentlyActive) {
        return;
      }

      const lastMsg = combinedMessages[combinedMessages.length - 1];
      const ordLastTimestamp = lastMsg?.rawTimestamp || lastMsg?.timestamp || remoteOrderConv?.updatedAt || ord.updatedAt || ord.createdAt;
      const ordLastTime = ordLastTimestamp && !isNaN(new Date(ordLastTimestamp).getTime())
        ? new Date(ordLastTimestamp).getTime()
        : 0;

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
        unreadCount: remoteOrderConv?.unreadCount || 0,
        messages: combinedMessages,
        lastMessageTime: ordLastTime,
        updatedAt: ordLastTimestamp || new Date().toISOString()
      });
    });

    // 3. Include any other remote conversations belonging to this client with messages
    remoteConvs.forEach(conv => {
      if (!threadMap.has(conv.id)) {
        const msgs = conv.messages || [];
        if (msgs.length === 0 && conv.id !== activeChatId) return;

        const lastMsg = msgs[msgs.length - 1];
        const convTimestamp = lastMsg?.timestamp || conv.updatedAt || conv.created_at;
        const convTime = convTimestamp && !isNaN(new Date(convTimestamp).getTime())
          ? new Date(convTimestamp).getTime()
          : 0;

        threadMap.set(conv.id, {
          id: conv.id,
          title: conv.orderTitle || conv.clientName || 'Support Thread',
          orderId: conv.orderId || 'Order Discussion',
          orderTitle: conv.orderTitle || 'Direct Support',
          serviceType: 'general',
          unreadCount: conv.unreadCount || 0,
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
        remoteConvs = await fetchConversations();
      } else {
        try {
          const saved = typeof window !== 'undefined' && localStorage.getItem('bdigi_admin_chats');
          if (saved) remoteConvs = JSON.parse(saved);
        } catch {}
      }

      if (isMounted) {
        const fullThreads = buildThreadList(remoteConvs);
        setConversations(fullThreads);

        // If an initial order was passed, select that thread immediately
        if (initialOrderId) {
          const targetId = initialOrderId.startsWith('order-') ? initialOrderId : `order-${initialOrderId}`;
          if (fullThreads.some(t => t.id === targetId)) {
            setActiveChatId(targetId);
          }
        } else if (!activeChatId && fullThreads[0]?.id) {
          setActiveChatId(fullThreads[0].id);
        }
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
          senderName: record.sender_name || (record.sender === 'admin' ? 'Master Digitizer' : clientName),
          text: record.text,
          attachment: record.attachment,
          timestamp: record.timestamp ? new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (newMsg.sender === 'admin' || newMsg.sender === 'support') {
          playNotificationSound('receive');
        }

        setConversations(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const msgTime = new Date(newMsg.timestamp).getTime() || Date.now();
          const updated = safePrev.map(thread => {
            if (thread.id === newMsg.conversation_id || (thread.rawOrderId && newMsg.conversation_id?.includes(thread.rawOrderId))) {
              const alreadyHas = (thread.messages || []).some(m => m.id === newMsg.id || (m.text === newMsg.text && m.timestamp === newMsg.timestamp));
              if (alreadyHas) return thread;
              return {
                ...thread,
                messages: [...(thread.messages || []), newMsg],
                unreadCount: activeChatId === thread.id ? 0 : (thread.unreadCount || 0) + (newMsg.sender === 'admin' ? 1 : 0),
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
          const exists = safePrev.some(c => c.id === conv.id);
          if (!exists) {
            const newThread = {
              id: conv.id,
              title: conv.order_title || conv.title || 'Support Thread',
              orderId: conv.order_id || 'Direct Discussion',
              orderTitle: conv.order_title || 'Support',
              serviceType: 'general',
              unreadCount: 0,
              messages: [],
              lastMessageTime: Date.now(),
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
  }, [orders, initialOrderId]);

  // Scroll messages to bottom on thread change or message arrival
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeChatId, conversations]);

  // Active chat thread
  const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0] || {
    id: 'general-support',
    title: 'B Digitizing Studio Live Support',
    orderId: 'General Inquiries',
    messages: []
  };

  // Filter conversations based on search and selected filterMode
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      (conv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (conv.orderTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'orders') return conv.id.startsWith('order-') || conv.rawOrderId;
    if (filterMode === 'support') return conv.id === 'general-support';
    if (filterMode === 'unread') return conv.unreadCount > 0;
    return true;
  });

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      conversation_id: activeChat.id,
      order_id: activeChat.rawOrderId || null,
      order_title: activeChat.orderTitle || activeChat.title || 'Discussion',
      client_email: clientEmail,
      sender: 'client',
      senderName: clientName,
      sender_name: clientName,
      text: messageInput.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : ''),
      attachment: attachedFile ? attachedFile.name : null,
      timestamp: new Date().toISOString()
    };

    // Optimistic state update in conversations list + sort by latest message time
    const nowTime = Date.now();
    const nowIso = new Date().toISOString();

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === activeChat.id) {
          return {
            ...conv,
            unreadCount: 0,
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
    playNotificationSound('send');
    showToast('Message sent to production studio team!', 'success');

    // Persistence to Supabase
    if (isSupabaseConfigured) {
      try {
        await addChatMessage(activeChat.id, newMsg);
      } catch (err) {
        console.warn('Persist chat message notice:', err);
      }
    }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
      showToast(`Attached file: ${file.name}`, 'info');
    }
  };

  if (!mounted) return null;

  return (
    <div style={{
      padding: 0,
      background: '#ffffff',
      border: '1.5px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Outer 2-Column Split Workspace */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        flex: 1,
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* ================= LEFT SIDEBAR: CONVERSATION LIST ================= */}
        <div style={{
          borderRight: '1.5px solid var(--border-color)',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          {/* Header & Filter Controls */}
          <div style={{ padding: '1.15rem 1rem 0.85rem', borderBottom: '1px solid var(--border-color)', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(255, 122, 0, 0.12)', color: 'var(--orange-600)', padding: '0.35rem', borderRadius: '8px' }}>
                  <MessageSquare size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                  Studio Messages
                </h3>
              </div>
              <span style={{ fontSize: '0.725rem', background: '#ecfdf5', color: '#059669', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                Live Active
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '0.65rem' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search orders or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', fontSize: '0.8rem', height: '34px', borderRadius: '8px' }}
              />
            </div>

            {/* Quick Filter Pill Buttons */}
            <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: filterMode === 'all' ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                  background: filterMode === 'all' ? 'var(--orange-500)' : '#ffffff',
                  color: filterMode === 'all' ? '#ffffff' : 'var(--navy-800)',
                  cursor: 'pointer'
                }}
              >
                All ({conversations.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('orders')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: filterMode === 'orders' ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                  background: filterMode === 'orders' ? 'var(--orange-500)' : '#ffffff',
                  color: filterMode === 'orders' ? '#ffffff' : 'var(--navy-800)',
                  cursor: 'pointer'
                }}
              >
                Orders ({conversations.filter(c => c.id.startsWith('order-')).length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('support')}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: filterMode === 'support' ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                  background: filterMode === 'support' ? 'var(--orange-500)' : '#ffffff',
                  color: filterMode === 'support' ? '#ffffff' : 'var(--navy-800)',
                  cursor: 'pointer'
                }}
              >
                Live Support
              </button>
            </div>

            {/* Optional Selector to Start Chat on an Order without History */}
            {(() => {
              const myOrdersList = Array.isArray(orders) ? orders.filter(o => {
                const ordEmail = (o.client_email || o.clientEmail || '').toLowerCase().trim();
                return !clientEmail || ordEmail === clientEmail || !ordEmail;
              }) : [];
              const availableOrdersToStart = myOrdersList.filter(ord => !conversations.some(c => c.id === `order-${ord.id}` || c.rawOrderId === ord.id));

              if (availableOrdersToStart.length === 0) return null;

              return (
                <div style={{ marginTop: '0.65rem' }}>
                  <select
                    className="form-control"
                    style={{
                      width: '100%',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px dashed var(--border-color)',
                      color: 'var(--navy-900)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onChange={(e) => {
                      const ordId = e.target.value;
                      if (ordId) {
                        const selectedOrd = myOrdersList.find(o => String(o.id) === String(ordId));
                        if (selectedOrd) {
                          const newThreadId = `order-${selectedOrd.id}`;
                          const newThread = {
                            id: newThreadId,
                            orderId: formatOrderId(selectedOrd.id),
                            rawOrderId: selectedOrd.id,
                            title: selectedOrd.title || `Order ${formatOrderId(selectedOrd.id)}`,
                            orderTitle: selectedOrd.title,
                            orderObj: selectedOrd,
                            serviceType: selectedOrd.type || selectedOrd.serviceCategory || 'embroidery',
                            serviceCategory: selectedOrd.serviceCategory || 'Embroidery Digitizing',
                            orderStatus: selectedOrd.status || 'submitted',
                            price: parseFloat(selectedOrd.price || 0),
                            artworkUrl: selectedOrd.artworkUrl || selectedOrd.image_url || selectedOrd.logo,
                            unreadCount: 0,
                            messages: [],
                            lastMessageTime: Date.now(),
                            updatedAt: new Date().toISOString()
                          };
                          setConversations(prev => [newThread, ...prev]);
                          setActiveChatId(newThreadId);
                        }
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>💬 + Discuss Another Order...</option>
                    {availableOrdersToStart.map(ord => (
                      <option key={ord.id} value={ord.id}>
                        {formatOrderId(ord.id)} — {ord.title || ord.serviceCategory || 'Order'}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}
          </div>

          {/* Conversation List Feed */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <FileText size={28} style={{ color: '#cbd5e1', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>No conversations found</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {filteredConversations.map(conv => {
                  const isActive = activeChat.id === conv.id;
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  const isOrderThread = conv.id.startsWith('order-') || conv.rawOrderId;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setActiveChatId(conv.id);
                        // Reset unread count locally
                        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                      }}
                      style={{
                        padding: '0.75rem 0.85rem',
                        borderRadius: '10px',
                        background: isActive ? '#ffffff' : 'transparent',
                        border: isActive ? '1.5px solid var(--orange-500)' : '1px solid transparent',
                        boxShadow: isActive ? '0 2px 8px rgba(249, 115, 22, 0.12)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {/* Service or Support Avatar Icon */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          {isOrderThread ? (
                            conv.artworkUrl ? (
                              <img
                                src={conv.artworkUrl}
                                alt={conv.title}
                                style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--orange-500)', background: '#fff' }}
                              />
                            ) : (
                              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--navy-900)', color: 'var(--orange-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                <Layers size={18} />
                              </div>
                            )
                          ) : (
                            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange-500), #ea580c)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', boxShadow: '0 2px 6px rgba(249, 115, 22, 0.3)' }}>
                              BD
                            </div>
                          )}

                          <span style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '2px solid #ffffff'
                          }} />
                        </div>

                        {/* Thread Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.825rem', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isOrderThread ? `${conv.serviceCategory || 'Embroidery Digitizing'} — #${conv.orderId}` : 'Support'}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {lastMessage?.timestamp || 'Live'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                            {isOrderThread ? (
                              <span style={{ fontSize: '0.65rem', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                                🧵 {conv.serviceCategory || 'Order'} #{conv.orderId}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800, flexShrink: 0 }}>
                                🟢 Support
                              </span>
                            )}
                            <span style={{ fontSize: '0.725rem', color: 'var(--navy-700)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {isOrderThread ? (conv.orderTitle || 'Production Discussion') : 'Live Studio Support'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lastMessage ? (
                              <span>
                                <strong>{lastMessage.sender === 'client' ? 'You: ' : 'Studio: '}</strong>
                                {lastMessage.text || (lastMessage.attachment ? '📎 File attached' : 'Message')}
                              </span>
                            ) : (
                              <span style={{ fontStyle: 'italic' }}>Start conversation...</span>
                            )}
                          </div>
                        </div>

                        {/* Unread Counter Badge */}
                        {conv.unreadCount > 0 && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 900,
                            background: 'var(--orange-500)',
                            color: '#ffffff',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            flexShrink: 0
                          }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANE: ACTIVE CHAT WORKSPACE ================= */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          background: '#ffffff'
        }}>
          {/* Active Conversation Top Header */}
          <div style={{
            padding: '0.9rem 1.5rem',
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
                {activeChat.artworkUrl ? (
                  <img
                    src={activeChat.artworkUrl}
                    alt={activeChat.title}
                    style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', border: '2px solid var(--orange-500)', background: '#fff' }}
                  />
                ) : (
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--orange-500), #ea580c)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.95rem' }}>
                    BD
                  </div>
                )}
                <span style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: '11px',
                  height: '11px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff'
                }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {activeChat.id === 'general-support' || !activeChat.rawOrderId 
                      ? 'Support' 
                      : `${activeChat.serviceCategory || 'Embroidery Digitizing'} — #${activeChat.orderId}`}
                  </h4>
                  {activeChat.id === 'general-support' || !activeChat.rawOrderId ? (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', border: '1px solid #10b981', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
                      🟢 Support
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(249, 115, 22, 0.25)', color: 'var(--orange-400)', border: '1px solid var(--orange-500)', padding: '0.1rem 0.45rem', borderRadius: '9999px', fontWeight: 800 }}>
                      🧵 {activeChat.serviceCategory || 'Order'} #{activeChat.orderId}
                    </span>
                  )}
                  {activeChat.orderStatus && (
                    <span className="badge badge-assigned" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                      {activeChat.orderStatus}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {activeChat.rawOrderId ? (
                    <>
                      <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>{activeChat.orderTitle || `${activeChat.serviceCategory} #${activeChat.orderId}`}</span>
                      <span>•</span>
                      <span>{activeChat.serviceCategory || 'Embroidery Digitizing'} Production Team</span>
                    </>
                  ) : (
                    <span>Direct Live Helpdesk with Master Digitizer & Production Staff</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Button for Order Brief */}
            {activeChat.orderObj && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ color: '#ffffff', borderColor: 'rgba(255, 255, 255, 0.3)', fontSize: '0.78rem', gap: '0.4rem' }}
                onClick={() => setSelectedOrderForDrawer(activeChat.orderObj)}
              >
                Inspect {activeChat.serviceCategory || 'Order'} #{activeChat.orderId} Details <ChevronRight size={14} />
              </button>
            )}
          </div>

          {/* Messages Feed */}
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
            {/* Thread Security Notice */}
            <div style={{ textAlign: 'center', margin: '0.25rem 0 0.75rem' }}>
              <span style={{
                fontSize: '0.725rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '0.3rem 0.85rem',
                borderRadius: '9999px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                🔒 End-to-End Realtime Production Channel • Connected to Senior Digitizer Desk
              </span>
            </div>

            {/* Message Bubbles */}
            {activeChat.messages?.map((msg, mIdx) => {
              const isClient = msg.sender === 'client' || msg.senderRole === 'client';

              return (
                <div
                  key={msg.id || mIdx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isClient ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    alignSelf: isClient ? 'flex-end' : 'flex-start'
                  }}
                >
                  {/* Sender Name & Role */}
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span>{isClient ? 'You' : 'Support'}</span>
                    {!isClient && (
                      <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.65rem', padding: '0.05rem 0.35rem', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: 800 }}>
                        Support
                      </span>
                    )}
                  </div>

                  {/* Message Bubble Body */}
                  <div style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: isClient ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isClient ? 'linear-gradient(135deg, var(--orange-600) 0%, var(--orange-500) 100%)' : '#ffffff',
                    color: isClient ? '#ffffff' : 'var(--navy-900)',
                    border: isClient ? 'none' : '1px solid var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    fontSize: '0.875rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {msg.text}

                    {/* Attachment Preview Box */}
                    {msg.attachment && (
                      <div style={{
                        marginTop: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        background: isClient ? 'rgba(0, 0, 0, 0.15)' : '#f8fafc',
                        border: isClient ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                          <Paperclip size={14} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.attachment}
                          </span>
                        </div>
                        {msg.attachmentUrl && (
                          <a
                            href={msg.attachmentUrl}
                            download={msg.attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: isClient ? '#ffffff' : 'var(--orange-600)', display: 'flex', alignItems: 'center' }}
                            title="Download Attachment"
                          >
                            <Download size={14} />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Clock size={10} />
                    <span>{msg.timestamp || 'Just now'}</span>
                    {isClient && <CheckCheck size={12} style={{ color: 'var(--orange-500)' }} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Reply Composer */}
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1.5px solid var(--border-color)',
            background: '#ffffff',
            flexShrink: 0
          }}>
            {/* Attachment Preview Banner */}
            {attachedFile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.85rem',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                marginBottom: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--navy-900)' }}>
                  <Paperclip size={14} style={{ color: 'var(--orange-500)' }} />
                  <strong>{attachedFile.name}</strong> ({attachedFile.size})
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.65rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={2}
                  placeholder={`Write a message to our senior production team regarding ${activeChat.orderId}... (Press Enter to send)`}
                  className="form-control"
                  style={{
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.45,
                    borderRadius: '10px',
                    resize: 'none',
                    border: '1.5px solid var(--border-color)'
                  }}
                />
              </div>

              {/* Attachment File Input */}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileAttach}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline"
                style={{ height: '42px', padding: '0 0.85rem', borderRadius: '10px' }}
                title="Attach artwork reference or machine file"
              >
                <Paperclip size={16} />
              </button>

              <button
                type="submit"
                disabled={!messageInput.trim() && !attachedFile}
                className="btn btn-primary-orange"
                style={{
                  height: '42px',
                  padding: '0 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  opacity: (!messageInput.trim() && !attachedFile) ? 0.4 : 1,
                  cursor: (!messageInput.trim() && !attachedFile) ? 'not-allowed' : 'pointer'
                }}
              >
                <Send size={16} /> Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
