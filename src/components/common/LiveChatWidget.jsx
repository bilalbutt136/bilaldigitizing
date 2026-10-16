'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppState } from '../../context/StateContext';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  LogIn
} from 'lucide-react';
import { subscribeToChatMessages, subscribeToConversations } from '../../services/supabaseService';
import { fetchChatUnreadCounts } from '../../services/chatUnreadService';

// Lazy-load the heavy chat engine so the launcher button renders immediately
const CustomerSupportChat = dynamic(() => import('../customer/CustomerSupportChat'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', color: '#64748b' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: '#6366f1', marginBottom: '0.75rem' }} />
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading BDigitizing Live Chat...</span>
    </div>
  )
});

export const LiveChatWidget = () => {
  const [mounted, setMounted] = useState(false);
  const {
    authUser,
    currentUser,
    siteSettings,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useAppState();

  const activeUser = authUser || currentUser;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const isAdmin = activeUser?.role === 'admin';

  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState('support');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [latestIncomingPreview, setLatestIncomingPreview] = useState(null);
  const previewTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Guest inquiry form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestService, setGuestService] = useState('Embroidery Digitizing');
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [sentMessages, setSentMessages] = useState([]);

  // WhatsApp link configuration
  const whatsappNumber = (
    siteSettings?.whatsapp ||
    siteSettings?.contactInfo?.whatsapp ||
    process.env.NEXT_PUBLIC_BUSINESS_PHONE ||
    '+1 (347) 915-4498'
  ).trim();
  const cleanWaNumber = whatsappNumber.replace(/[^0-9+]/g, '');

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Sync unread counts for logged-in users via Supabase Realtime
  useEffect(() => {
    if (!mounted) return;
    let isMounted = true;
    if (!userEmail && !isAdmin) {
      setUnreadCount(0);
      return;
    }

    const refreshCounts = async (force = false) => {
      try {
        const counts = await fetchChatUnreadCounts({ email: userEmail, isAdmin, force });
        if (isMounted) {
          setUnreadCount(counts.total || 0);
        }
      } catch {}
    };

    refreshCounts();
    const unsubscribeMessages = subscribeToChatMessages(() => refreshCounts(true));
    const unsubscribeConversations = subscribeToConversations(() => refreshCounts(true));

    const handleFocus = () => refreshCounts(true);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshCounts(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      unsubscribeMessages();
      unsubscribeConversations();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [mounted, userEmail, isAdmin]);

  // 2. Incoming message popup preview for closed state
  useEffect(() => {
    if (!mounted) return;
    const handleNewChatMessage = (event) => {
      const msg = event?.detail;
      if (!msg) return;

      const isFromAdmin = String(msg.sender).toLowerCase() === 'admin';
      if (!isAdmin && isFromAdmin && (!userEmail || msg.client_email?.toLowerCase().trim() === userEmail)) {
        if (!isOpen) {
          setLatestIncomingPreview(msg.text || (msg.attachments?.length ? `📎 ${msg.attachments[0].name}` : 'New message from studio'));
          if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
          previewTimerRef.current = setTimeout(() => {
            setLatestIncomingPreview(null);
          }, 8000);
        }
      }
    };

    window.addEventListener('bdigi_new_chat_message', handleNewChatMessage);
    return () => {
      window.removeEventListener('bdigi_new_chat_message', handleNewChatMessage);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [mounted, isAdmin, userEmail, isOpen]);

  // 3. Listen for global events to open live chat (e.g. from nav buttons or CTA)
  useEffect(() => {
    if (!mounted) return;
    const handleOpenLiveChat = (e) => {
      const requestedChannel = e?.detail?.channel;
      if (requestedChannel === 'inbox' || requestedChannel === 'support') {
        setActiveChannel(requestedChannel);
      }
      setIsOpen(true);
    };

    window.addEventListener('bdigi_open_live_chat', handleOpenLiveChat);
    return () => window.removeEventListener('bdigi_open_live_chat', handleOpenLiveChat);
  }, [mounted]);

  // 4. Close chat modal with Escape key or click outside on desktop
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 120);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleOpen = () => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        setLatestIncomingPreview(null);
      }
      return next;
    });
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleOpenAuth = () => {
    if (setAuthModalMode) setAuthModalMode('login');
    if (setIsAuthModalOpen) setIsAuthModalOpen(true);
  };

  // Submit guest inquiry
  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestEmail.trim() || !guestMessage.trim()) {
      setInquiryError('Please enter your email and message.');
      return;
    }

    setIsSubmittingInquiry(true);
    setInquiryError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName.trim() || guestEmail.split('@')[0] || 'Visitor',
          email: guestEmail.trim(),
          service: guestService || 'Embroidery Digitizing',
          subject: `Live Chat Inquiry: ${guestService || 'Embroidery Digitizing'}`,
          message: guestMessage.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send inquiry. Please try again or use WhatsApp.');
      }

      setInquirySuccess(true);
      setSentMessages(prev => [...prev, { text: guestMessage.trim(), time: new Date() }]);
      setGuestMessage('');
    } catch (err) {
      setInquiryError(err.message || 'Error sending message.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const handleApplyPrompt = (text) => {
    setGuestMessage(text);
  };

  if (!mounted) return null;

  return (
    <div className="live-chat-floating-root">
      {/* GLOBAL EMBED & POSITIONING STYLES */}
      <style dangerouslySetInnerHTML={{ __html: `
        .live-chat-floating-btn-wrap {
          position: fixed !important;
          bottom: max(24px, env(safe-area-inset-bottom, 24px));
          right: 24px;
          z-index: 9999999 !important;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .live-chat-floating-btn-wrap.is-hidden {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        html.mobile-app-active .live-chat-floating-btn-wrap,
        [data-mobile-mode="app"] .live-chat-floating-btn-wrap {
          bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
        }
        .live-chat-floating-container {
          position: fixed !important;
          bottom: 96px;
          right: 24px;
          width: min(420px, calc(100vw - 32px));
          height: min(600px, calc(100vh - 120px));
          z-index: 9999999 !important;
          background-color: #ffffff !important;
          background: #ffffff !important;
          opacity: 1 !important;
          backdrop-filter: none !important;
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08) !important;
        }
        [data-theme="dark"] .live-chat-floating-container,
        .dark .live-chat-floating-container {
          background-color: #0f172a !important;
          background: #0f172a !important;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08) !important;
        }
        html.mobile-app-active .live-chat-floating-container,
        [data-mobile-mode="app"] .live-chat-floating-container {
          bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;
        }
        @media (max-width: 640px) {
          .live-chat-floating-container {
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100vh !important;
            border-radius: 0 !important;
            background-color: #ffffff !important;
            background: #ffffff !important;
          }
          [data-theme="dark"] .live-chat-floating-container,
          .dark .live-chat-floating-container {
            background-color: #0f172a !important;
            background: #0f172a !important;
          }
        }
        .live-chat-floating-container .customer-chat-root {
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
          min-height: 0 !important;
          height: 100% !important;
          width: 100% !important;
          background-color: #ffffff !important;
          background: #ffffff !important;
        }
        [data-theme="dark"] .live-chat-floating-container .customer-chat-root,
        .dark .live-chat-floating-container .customer-chat-root {
          background-color: #0f172a !important;
          background: #0f172a !important;
        }
        .live-chat-body-solid {
          background-color: #f8fafc !important;
          background: #f8fafc !important;
        }
        [data-theme="dark"] .live-chat-body-solid,
        .dark .live-chat-body-solid {
          background-color: #090d16 !important;
          background: #090d16 !important;
        }
        @keyframes chatBounceGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .chat-floating-pulse {
          animation: chatBounceGentle 3s ease-in-out infinite;
        }
      `}} />

      {/* FLOATING CHAT WINDOW / MODAL */}
      {isOpen && (
        <div
          ref={containerRef}
          className="live-chat-floating-container flex flex-col bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200"
          style={{
            backgroundColor: '#ffffff',
            background: '#ffffff',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            opacity: 1
          }}
          role="dialog"
          aria-label="Live Customer Support Chat"
        >
          {activeUser ? (
            /* AUTHENTICATED USER LIVE CHAT */
            <div
              className="flex-1 flex flex-col min-h-0 w-full h-full relative"
              style={{
                backgroundColor: '#ffffff',
                background: '#ffffff'
              }}
            >
              <CustomerSupportChat
                defaultOrderId={null}
                chatType={activeChannel}
                onSwitchChannel={(ch) => setActiveChannel(ch)}
                onClose={handleClose}
              />
            </div>
          ) : (
            /* GUEST VISITOR EXPERIENCE */
            <div
              className="live-chat-body-solid flex-1 flex flex-col min-h-0 w-full h-full"
              style={{
                backgroundColor: '#f8fafc',
                background: '#f8fafc'
              }}
            >
              {/* GUEST HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                  padding: '0.85rem 1rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      BD
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #ffffff'
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                        BDigitizing Live Support
                      </h3>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.25)',
                        color: '#ffffff',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        padding: '0.05rem 0.35rem',
                        borderRadius: '6px'
                      }}>
                        Online
                      </span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#e0e7ff', marginTop: '0.1rem' }}>
                      Typically replies in minutes
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    type="button"
                    onClick={handleOpenAuth}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    title="Sign In"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      background: 'rgba(255,255,255,0.18)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '8px',
                      padding: '6px',
                      color: '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Close chat"
                    aria-label="Close chat"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* CHAT MESSAGES STREAM */}
              <div
                className="live-chat-body-solid"
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '0.9rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: '#f8fafc',
                  background: '#f8fafc'
                }}
              >
                {/* STUDIO WELCOME BUBBLE */}
                <div style={{
                  maxWidth: '88%',
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px 14px 14px 2px',
                  padding: '0.75rem 0.85rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <p style={{ fontSize: '0.82rem', color: '#1e293b', lineHeight: 1.45, margin: 0 }}>
                    👋 Hi there! Welcome to BDigitizing Studio. Need a quick quote, format help (.DST, .PES), or turnaround estimate? Type a message below or tap WhatsApp!
                  </p>
                </div>

                {/* QUICK CHIP TOPICS */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.1rem 0' }}>
                  {[
                    'Need quote for embroidery file (.DST/.PES)',
                    'Vector art conversion turnaround time',
                    'Custom patches pricing & minimum 50 pcs'
                  ].map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPrompt(prompt)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '16px',
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        color: '#4338ca',
                        cursor: 'pointer',
                        fontWeight: 600,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                        textAlign: 'left'
                      }}
                    >
                      💬 {prompt}
                    </button>
                  ))}
                </div>

                {/* USER SENT MESSAGES IN CONVERSATION */}
                {sentMessages.map((msg, idx) => (
                  <React.Fragment key={idx}>
                    <div style={{
                      maxWidth: '85%',
                      alignSelf: 'flex-end',
                      background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      borderRadius: '14px 14px 2px 14px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.82rem',
                      lineHeight: 1.4,
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)'
                    }}>
                      {msg.text}
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)', textAlign: 'right', marginTop: '0.2rem' }}>
                        Sent ✓
                      </div>
                    </div>

                    <div style={{
                      maxWidth: '88%',
                      alignSelf: 'flex-start',
                      background: '#ffffff',
                      backgroundColor: '#ffffff',
                      border: '1px solid #bbf7d0',
                      borderRadius: '14px 14px 14px 2px',
                      padding: '0.75rem 0.85rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#16a34a', fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                        <CheckCircle2 size={13} color="#16a34a" /> Message Received!
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, lineHeight: 1.4 }}>
                        Thank you! Our digitizers have received your inquiry. We will review it and reply to <strong>{guestEmail || 'your email'}</strong> shortly.
                      </p>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* COMPACT CHAT COMPOSER & WHATSAPP */}
              <div
                style={{
                  padding: '0.75rem 0.85rem',
                  borderTop: '1px solid #e2e8f0',
                  background: '#ffffff',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  flexShrink: 0
                }}
              >
                <form onSubmit={handleGuestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <input
                    type="email"
                    placeholder="Your Email (for reply) *"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    style={{
                      background: '#ffffff',
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.8rem',
                      color: '#0f172a',
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Type your message... *"
                      required
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      style={{
                        flex: 1,
                        background: '#ffffff',
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.82rem',
                        color: '#0f172a',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: isSubmittingInquiry ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)'
                      }}
                      title="Send message"
                      aria-label="Send message"
                    >
                      {isSubmittingInquiry ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                  {inquiryError && (
                    <div style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>
                      {inquiryError}
                    </div>
                  )}
                </form>

                {/* WHATSAPP INSTANT REACHOUT */}
                {cleanWaNumber && (
                  <a
                    href={`https://wa.me/${cleanWaNumber.replace(/^\+/, '')}?text=${encodeURIComponent('Hi BDigitizing Studio! I would like to inquire about embroidery digitizing & vector services.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      padding: '0.45rem',
                      color: '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <span>Prefer WhatsApp? Chat on WhatsApp</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FLOATING INCOMING MESSAGE PREVIEW (BALLOON) */}
      {!isOpen && latestIncomingPreview && (
        <div
          onClick={handleToggleOpen}
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            zIndex: 9999998,
            maxWidth: '300px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.65rem 0.9rem',
            borderRadius: '14px',
            boxShadow: '0 10px 25px -4px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.14)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
            flexShrink: 0
          }}>
            BD
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a5b4fc' }}>
              BDigitizing Support
            </div>
            <div style={{ fontSize: '0.75rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {latestIncomingPreview}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLatestIncomingPreview(null);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* FLOATING LAUNCHER BUTTON (EXACT MATCH TO USER SCREENSHOT) */}
      <div
        className={`live-chat-floating-btn-wrap ${isOpen ? 'is-hidden' : ''}`}
        style={isOpen ? { display: 'none', pointerEvents: 'none' } : undefined}
      >
        <button
          type="button"
          onClick={handleToggleOpen}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          aria-label={isOpen ? 'Close chat' : 'Open live support chat'}
          title={isOpen ? 'Close chat' : 'Live Chat (Online)'}
          style={{
            position: 'relative',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #4f46e5 100%)',
            boxShadow: '0 10px 25px -4px rgba(99, 102, 241, 0.5), 0 4px 6px -2px rgba(124, 58, 237, 0.3)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
            outline: 'none',
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* ICON: White Chat Message Bubble (or Close X when open) */}
          {isOpen ? (
            <X size={26} color="#ffffff" strokeWidth={2.4} />
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}

          {/* ONLINE INDICATOR GREEN DOT AT TOP-RIGHT (MATCHES SCREENSHOT) */}
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2.5px solid #ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#4ade80',
                opacity: 0.75,
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            />
          </span>

          {/* UNREAD MESSAGE COUNT BADGE */}
          {unreadCount > 0 && !isOpen && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                left: '-4px',
                minWidth: '20px',
                height: '20px',
                padding: '0 4px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                border: '2px solid #ffffff',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'chatBounceGentle 2s infinite',
                zIndex: 11
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* HOVER TOOLTIP */}
        {showTooltip && !isOpen && !latestIncomingPreview && (
          <div
            style={{
              position: 'absolute',
              bottom: '72px',
              right: '0',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.35rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            Live Chat • Online
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChatWidget;
