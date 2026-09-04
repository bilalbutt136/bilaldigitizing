'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import { playNotificationSound } from '../../utils/audioNotification';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  fetchConversations, 
  fetchChatMessages,
  addChatMessage, 
  subscribeToLiveMessages, 
  markConversationAsRead,
  uploadFileToCloudinaryFull,
  broadcastTypingStatus,
  subscribeToTypingStatus
} from '../../services/supabaseService';
import { getGuestSessionId, getCanonicalThreadId } from '../../utils/sessionHelper';
import WhatsAppChatMessage from '../common/WhatsAppChatMessage';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Minimize2,
  Maximize2,
  Loader2,
  Reply
} from 'lucide-react';

// Format timestamp safely to human-readable string
const parseMessageTime = (msg) => {
  if (!msg) return 0;
  const raw = msg.timestamp || msg.created_at || msg.createdAt || msg.time;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const parsed = new Date(raw).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

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

export const ClientLiveChatWidget = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { authUser, currentUser, isAuthenticated, showToast, activeCustomerTab } = useAppState();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null); // { name, url, size, format }
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSupportTyping, setIsSupportTyping] = useState(false);
  const [chats, setChats] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Exclude floating chat widget on admin portal and when customer is inside the dedicated full-screen Chat Inbox / Support tab
  const isExcluded = authUser?.role === 'admin' || 
    (typeof window !== 'undefined' && (
      window.location.pathname.startsWith('/admin') || 
      window.location.pathname.startsWith('/secure-admin-login') ||
      (window.location.pathname.startsWith('/client-portal') && (
        activeCustomerTab === 'support' || 
        activeCustomerTab === 'inbox' || 
        activeCustomerTab === 'help-support' ||
        window.location.search.includes('tab=support') || 
        window.location.search.includes('tab=inbox') ||
        window.location.search.includes('tab=help-support')
      ))
    ));

  const activeUser = authUser || currentUser || {
    name: 'Guest Client',
    email: 'guest@bdigitizing.pro',
    company: 'Public Visitor'
  };

  const cleanName = (activeUser?.name || 'Client').replace(/\s*\(ADMIN\)/gi, '').trim();
  const clientEmail = (activeUser?.email || 'guest@bdigitizing.pro').toLowerCase().trim();
  const clientCompany = activeUser?.company || `${cleanName}'s Account`;
  const avatarUrl = activeUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0f172a&color=fff`;

  const guestSessionId = typeof window !== 'undefined' ? getGuestSessionId() : 'guest_init';
  const targetConvId = useMemo(() => {
    return getCanonicalThreadId('support', clientEmail, guestSessionId);
  }, [clientEmail, guestSessionId]);

  const cacheKey = `bdigi_live_support_widget_cache_${clientEmail || guestSessionId}`;

  // Instant local cache hydration on mount for zero-latency load on refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChats(parsed.filter(c => isSupportId(c.id)));
          }
        }
      } catch {}
    }
  }, [cacheKey]);

  // Live typing subscription from admin
  useEffect(() => {
    let supportTypingTimer = null;
    const unsubTyping = subscribeToTypingStatus((payload) => {
      if (!payload) return;
      const isTargetThread = payload.conversationId === targetConvId || isSupportId(payload.conversationId);
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
  }, [targetConvId]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessageInput(val);

    if (e.target) {
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 36), 110)}px`;
    }

    broadcastTypingStatus(targetConvId, cleanName, 'client', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStatus(targetConvId, cleanName, 'client', false);
    }, 2500);
  };

  useEffect(() => {
    if (!mounted || isExcluded) return;
    let isMounted = true;

    const loadChats = async () => {
      if (!isMounted) return;
      if (isSupabaseConfigured) {
        try {
          const directMsgs = await fetchChatMessages(targetConvId, clientEmail);
          if (Array.isArray(directMsgs) && isMounted) {
            const sorted = [...directMsgs].sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
            const threadObj = {
              id: targetConvId,
              clientName: cleanName,
              clientEmail: clientEmail,
              company: clientCompany,
              avatar: avatarUrl,
              status: 'online',
              unreadCount: 0,
              clientUnreadCount: 0,
              messages: sorted,
              createdAt: sorted[0]?.timestamp || new Date().toISOString(),
              updatedAt: sorted[sorted.length - 1]?.timestamp || new Date().toISOString()
            };

            setChats([threadObj]);

            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(cacheKey, JSON.stringify([threadObj]));
              } catch {}
            }
          }
        } catch (err) {
          console.warn('[LiveChatWidget] loadChats error:', err);
        }
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

        const recordConvId = String(record.conversation_id || record.thread_id || '').toLowerCase().trim();
        const recordThreadId = String(record.thread_id || record.conversation_id || '').toLowerCase().trim();
        const recordEmail = String(record.client_email || '').toLowerCase().trim();
        const cleanCustomerEmail = (clientEmail || '').toLowerCase().trim();
        const targetConvIdLower = String(targetConvId || '').toLowerCase().trim();

        const offerEmail = String(record.offer_data?.client_email || record.metadata?.client_email || '').toLowerCase().trim();
        const isForThisUser = (cleanCustomerEmail && recordEmail && recordEmail === cleanCustomerEmail) ||
          (cleanCustomerEmail && offerEmail && offerEmail === cleanCustomerEmail) ||
          (cleanCustomerEmail && (recordConvId.includes(cleanCustomerEmail) || recordThreadId.includes(cleanCustomerEmail))) ||
          (recordConvId === targetConvIdLower || recordThreadId === targetConvIdLower) ||
          isSupportId(recordConvId) ||
          isSupportId(recordThreadId);

        if (!isForThisUser) {
          return;
        }

        const newMsg = {
          id: record.id,
          conversation_id: record.conversation_id,
          sender: record.sender,
          senderName: record.sender === 'admin' ? 'Support' : (record.sender_name || cleanName),
          sender_name: record.sender_name,
          text: record.text,
          attachment: record.attachment,
          attachment_url: record.attachment_url || null,
          attachment_name: record.attachment_name || record.attachment || null,
          attachment_size: record.attachment_size || null,
          attachment_type: record.attachment_type || null,
          reply_to: record.reply_to || null,
          offer_id: record.offer_id || record.offerId || null,
          offer_data: record.offer_data || record.offerData || null,
          is_read: record.is_read || false,
          timestamp: record.timestamp || record.created_at || new Date().toISOString()
        };

        if (newMsg.sender === 'admin' || newMsg.sender === 'support') {
          playNotificationSound('receive');
        }

        setChats(prev => {
          const safePrev = Array.isArray(prev) ? prev.filter(c => isSupportId(c.id)) : [];
          const isTargetConv = (c) => isSupportId(c.id) && (
            c.id === newMsg.conversation_id || 
            c.id === targetConvId ||
            (isSupportId(c.id) && isSupportId(newMsg.conversation_id))
          );
          const exists = safePrev.some(isTargetConv);

          let nextChats;
          if (!exists) {
            const newThread = {
              id: newMsg.conversation_id,
              clientName: newMsg.senderName || cleanName,
              clientEmail: clientEmail,
              company: clientCompany,
              avatar: avatarUrl,
              status: 'online',
              unreadCount: 0,
              clientUnreadCount: 0,
              messages: [newMsg],
              createdAt: newMsg.timestamp,
              updatedAt: newMsg.timestamp
            };
            nextChats = [newThread, ...safePrev];
          } else {
            nextChats = safePrev.map(c => {
              if (isTargetConv(c)) {
                const currentMsgs = c.messages || [];
                const incomingOfferId = newMsg.offer_id || newMsg.offer_data?.id;
                const existsIndex = currentMsgs.findIndex(m => 
                  (m.id && newMsg.id && m.id === newMsg.id) ||
                  (incomingOfferId && (m.offer_id === incomingOfferId || m.offer_data?.id === incomingOfferId)) ||
                  (m.text === newMsg.text && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 5000)
                );
                let nextMsgs;
                if (existsIndex >= 0) {
                  nextMsgs = [...currentMsgs];
                  nextMsgs[existsIndex] = { ...nextMsgs[existsIndex], ...newMsg };
                } else {
                  nextMsgs = [...currentMsgs, newMsg];
                }
                nextMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));

                return {
                  ...c,
                  messages: nextMsgs,
                  unreadCount: isOpen ? 0 : (c.unreadCount || 0) + (newMsg.sender === 'admin' ? 1 : 0),
                  clientUnreadCount: isOpen ? 0 : (c.clientUnreadCount || 0) + (newMsg.sender === 'admin' ? 1 : 0),
                  updatedAt: newMsg.timestamp
                };
              }
              return c;
            });
          }

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(nextChats));
            } catch {}
          }

          return nextChats;
        });
      },
      (convPayload) => {
        if (!isMounted) return;
        const conv = convPayload.new || convPayload.record;
        if (!conv || !isSupportId(conv.id)) return;

        setChats(prev => {
          const safePrev = Array.isArray(prev) ? prev.filter(c => isSupportId(c.id)) : [];
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
  }, [mounted, isExcluded, clientEmail, cleanName, clientCompany, targetConvId, isOpen]);

  // Real-time listener for offer status changes across tabs
  useEffect(() => {
    if (!mounted || isExcluded) return;

    const handleOfferStatusEvent = (e) => {
      const { offerId, status: newStatus, offer: freshOffer } = e.detail || {};
      if (!offerId || !newStatus) return;

      setChats(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.map(conv => {
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
      });
    };

    window.addEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
    return () => window.removeEventListener('bdigi_offer_status_change', handleOfferStatusEvent);
  }, [mounted, isExcluded]);

  // Real-time Event Listener for opening chat programmatically
  useEffect(() => {
    if (!mounted || isExcluded) return;

    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener('bdigi_open_chat', handleOpenChat);
    return () => {
      window.removeEventListener('bdigi_open_chat', handleOpenChat);
    };
  }, [mounted, isExcluded]);

  // Safely resolve the active chat thread for regular support chat, strictly isolating support messages
  const safeChats = Array.isArray(chats) ? chats.filter(c => isSupportId(c.id)) : [];
  const supportConvs = safeChats.filter(c => 
    isSupportId(c.id) && (
      c.id === targetConvId ||
      (isSupportId(c.id) && isSupportId(targetConvId)) ||
      (clientEmail && (c.clientEmail || '').toLowerCase().trim() === clientEmail)
    )
  );

  const aggregatedSupportMessagesMap = new Map();
  supportConvs.forEach(conv => {
    (conv.messages || []).forEach(m => {
      if (m && (m.id || m.text)) {
        const key = m.id || `${m.sender}-${m.text}-${m.timestamp}`;
        aggregatedSupportMessagesMap.set(key, m);
      }
    });
  });

  const combinedSupportMessages = Array.from(aggregatedSupportMessagesMap.values());
  combinedSupportMessages.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  const clientThread = {
    id: targetConvId,
    clientName: cleanName,
    clientEmail: clientEmail,
    clientCompany: clientCompany,
    orderId: 'General Inquiries',
    orderTitle: 'Live Support',
    status: 'online',
    messages: combinedSupportMessages
  };

  const unreadCount = !isOpen
    ? (clientThread.messages || []).filter(m => {
        const isAdmin = m.sender === 'admin' || m.sender === 'support';
        if (!isAdmin) return false;
        const lastRead = typeof window !== 'undefined' ? parseInt(localStorage.getItem('bdigi_read_client_' + clientThread.id) || '0', 10) : 0;
        const msgTime = m.timestamp && !isNaN(new Date(m.timestamp).getTime()) ? new Date(m.timestamp).getTime() : 0;
        return msgTime > lastRead;
      }).length
    : 0;

  const chatFeedRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-expanding textarea height adjustment logic (min 38px, max 140px)
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset to calculate true scrollHeight
      const minHeight = 38;
      const maxHeight = 140;
      const scrollH = textareaRef.current.scrollHeight;
      const nextHeight = Math.max(minHeight, Math.min(scrollH, maxHeight));
      textareaRef.current.style.height = `${nextHeight}px`;
      textareaRef.current.style.overflowY = scrollH > maxHeight ? 'auto' : 'hidden';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [messageInput]);

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

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('smooth');
      if (isSupabaseConfigured) {
        fetchChatMessages(targetConvId, clientEmail).then(directMsgs => {
          if (Array.isArray(directMsgs)) {
            const sorted = [...directMsgs].sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
            const threadObj = {
              id: targetConvId,
              clientName: cleanName,
              clientEmail: clientEmail,
              company: clientCompany,
              avatar: avatarUrl,
              status: 'online',
              unreadCount: 0,
              clientUnreadCount: 0,
              messages: sorted,
              createdAt: sorted[0]?.timestamp || new Date().toISOString(),
              updatedAt: sorted[sorted.length - 1]?.timestamp || new Date().toISOString()
            };
            setChats([threadObj]);
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(cacheKey, JSON.stringify([threadObj]));
              } catch {}
            }
          }
        }).catch(() => {});
      }
      if (clientThread?.id) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bdigi_read_client_' + clientThread.id, String(Date.now()));
          window.dispatchEvent(new CustomEvent('bdigi_read_update', { detail: { conversation_id: clientThread.id } }));
        }
        markConversationAsRead(clientThread.id);
        setChats(prev => (Array.isArray(prev) ? prev : []).map(c => 
          (c.id === clientThread.id || (isSupportId(c.id) && isSupportId(clientThread.id))) 
            ? { ...c, unreadCount: 0, clientUnreadCount: 0 } 
            : c
        ));
      }
    }
  }, [isOpen, clientThread?.id, clientThread?.messages?.length, isSupportTyping, replyingTo]);

  // Mount Guard: Don't render until mounted or if on excluded screen
  if (!mounted || isExcluded) {
    return null;
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const convId = clientThread.id || targetConvId;
    const nowIso = new Date().toISOString();

    // Track Meta Pixel Contact Event with Customer Identity
    import('../common/MetaPixelTracker').then(({ trackMetaEvent }) => {
      const custRole = clientEmail ? `${cleanName || 'Customer'} (${clientEmail})` : null;
      trackMetaEvent('Contact', {
        content_name: 'Client Live Chat',
        category: 'Customer Support Inquiry'
      }, custRole);
    }).catch(() => {});

    const newMsg = {
      id: 'msg-client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      conversation_id: convId,
      sender: 'client',
      senderName: cleanName,
      sender_name: cleanName,
      client_email: clientEmail,
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

    setChats(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const isTarget = (c) => c.id === convId || (isSupportId(c.id) && isSupportId(convId)) || (clientEmail && (c.clientEmail || '').toLowerCase().trim() === clientEmail);
      const exists = safePrev.some(isTarget);

      let nextChats;
      if (exists) {
        nextChats = safePrev.map(c => {
          if (isTarget(c)) {
            const alreadyHas = (c.messages || []).some(m => m.id === newMsg.id || (m.text === newMsg.text && Math.abs(parseMessageTime(m) - parseMessageTime(newMsg)) < 2000));
            if (alreadyHas) return c;
            const updatedMsgs = [...(c.messages || []), newMsg];
            updatedMsgs.sort((a, b) => parseMessageTime(a) - parseMessageTime(b));
            return {
              ...c,
              unreadCount: 0,
              clientUnreadCount: 0,
              messages: updatedMsgs,
              updatedAt: nowIso
            };
          }
          return c;
        });
      } else {
        const newThread = {
          id: convId,
          clientName: cleanName,
          clientEmail: clientEmail,
          company: clientCompany,
          avatar: avatarUrl,
          orderId: 'General Inquiries',
          orderTitle: 'Live Digitizer & Studio Helpdesk',
          status: 'online',
          unreadCount: 0,
          clientUnreadCount: 0,
          messages: [newMsg],
          updatedAt: nowIso
        };
        nextChats = [newThread, ...safePrev];
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(nextChats));
        } catch {}
      }

      return nextChats;
    });

    if (isSupabaseConfigured) {
      try {
        await addChatMessage(convId, newMsg);
      } catch (err) {
        console.warn('Persist widget message notice:', err);
      }
    }

    setMessageInput('');
    setAttachedFile(null);
    setReplyingTo(null);
    broadcastTypingStatus(convId, cleanName, 'client', false);
    showToast('Message sent to Support!', 'success');
    scrollToBottom('smooth');
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
            bottom: (typeof window !== 'undefined' && window.location.pathname.startsWith('/client-portal'))
              ? 'clamp(80px, 12vw, 95px)'
              : 'clamp(20px, 3vw, 28px)',
            right: 'clamp(20px, 3vw, 28px)',
            zIndex: 8500,
            width: 'clamp(52px, 12vw, 60px)',
            height: 'clamp(52px, 12vw, 60px)',
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
            <X size={22} style={{ color: '#ffffff' }} />
          ) : (
            <>
              <MessageSquare size={22} style={{ color: '#ffffff' }} />
              {unreadCount > 0 ? (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  minWidth: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                }}>
                  {unreadCount}
                </span>
              ) : (
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
              )}
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
            bottom: 'clamp(75px, 12vw, 90px)',
            right: 'clamp(10px, 2vw, 24px)',
            zIndex: 8800,
            width: 'min(380px, calc(100vw - 20px))',
            maxWidth: 'calc(100vw - 20px)',
            height: isMinimized ? '60px' : 'min(520px, calc(100dvh - 100px))',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 45px rgba(0, 0, 0, 0.22)',
            border: '1.5px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'height 0.25s ease'
          }}
        >
          {/* Header Bar */}
          <div style={{
            padding: '0.85rem 1.15rem',
            background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
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
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.1 }}>
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

                {(clientThread.messages || []).map((msg, index) => {
                  const isClient = msg.sender === 'client';
                  return (
                    <WhatsAppChatMessage
                      key={msg.id || index}
                      message={msg}
                      isMe={isClient}
                      senderDisplayName={isClient ? 'You' : 'Support'}
                      onReply={(m) => setReplyingTo(m)}
                      formatTime={formatChatTime}
                      themePreset="client"
                      onOrderClick={(ordId) => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/client-portal?tab=orders&orderId=${ordId}`;
                        }
                      }}
                    />
                  );
                })}

                {/* LIVE TYPING INDICATOR */}
                {isSupportTyping && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.75rem',
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    width: 'fit-content',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    margin: '0.2rem 0'
                  }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)' }}>
                      Support is typing
                    </span>
                    <span style={{ display: 'inline-flex', gap: '3px' }}>
                      <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                      <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                      <span style={{ width: '3.5px', height: '3.5px', borderRadius: '50%', background: 'var(--color-primary, #ea580c)' }}></span>
                    </span>
                  </div>
                )}

                {/* Auto-scroll end anchor */}
                <div ref={messagesEndRef} style={{ height: '1px', flexShrink: 0, marginTop: '2px' }} />
              </div>

              {/* QUOTED REPLY PREVIEW BANNER */}
              {replyingTo && (
                <div style={{
                  padding: '0.4rem 0.85rem',
                  background: '#fff7ed',
                  borderTop: '1px solid #fed7aa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <div style={{ borderLeft: '3px solid var(--color-primary, #ff7a00)', paddingLeft: '0.5rem', minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Reply size={11} /> Replying to {replyingTo.senderName || replyingTo.sender_name || 'Support'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {replyingTo.text || (replyingTo.attachment ? `📎 ${replyingTo.attachment}` : 'Media file')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary, #ea580c)', padding: '2px' }}
                    title="Cancel reply"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* UPLOADING ATTACHMENT SPINNER */}
              {isUploadingAttachment && (
                <div style={{
                  padding: '0.35rem 0.85rem',
                  background: '#eff6ff',
                  borderTop: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#1d4ed8',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Uploading attachment...
                </div>
              )}

              {/* Attached File Preview */}
              {attachedFile && !isUploadingAttachment && (
                <div style={{
                  padding: '0.35rem 0.85rem',
                  background: '#f0fdf4',
                  borderTop: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.72rem',
                  color: '#15803d',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Paperclip size={12} />
                    <span>Ready: <strong>{attachedFile.name}</strong></span>
                  </div>
                  <button type="button" onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', padding: 0 }}>
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} style={{ padding: '0.65rem 0.85rem', borderTop: '1px solid var(--border-color)', background: '#ffffff' }}>
                <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-end' }}>
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
                      background: '#f1f5f9',
                      border: '1.5px solid var(--border-color)',
                      color: 'var(--navy-700)',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
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

                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="form-control"
                    placeholder="Type message..."
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    style={{
                      flex: 1,
                      height: '38px',
                      minHeight: '38px',
                      maxHeight: '140px',
                      fontSize: '16px',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      resize: 'none',
                      lineHeight: 1.4,
                      overflowY: 'hidden',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    disabled={(!messageInput.trim() && !attachedFile) || isUploadingAttachment}
                    style={{
                      height: '36px',
                      padding: '0 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.85rem',
                      opacity: ((!messageInput.trim() && !attachedFile) || isUploadingAttachment) ? 0.5 : 1,
                      cursor: ((!messageInput.trim() && !attachedFile) || isUploadingAttachment) ? 'not-allowed' : 'pointer'
                    }}
                    title="Send Message (Enter)"
                  >
                    <Send size={15} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem', padding: '0 0.15rem' }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    Press <kbd style={{ padding: '0.05rem 0.3rem', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.62rem', fontWeight: 700 }}>Enter</kbd> to send
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <kbd style={{ padding: '0.05rem 0.3rem', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.62rem', fontWeight: 700 }}>Shift</kbd> + <kbd style={{ padding: '0.05rem 0.3rem', borderRadius: '3px', background: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.62rem', fontWeight: 700 }}>Enter</kbd> for new line
                  </span>
                </div>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
