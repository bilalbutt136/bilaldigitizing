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

  // Guest inquiry form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestService, setGuestService] = useState('Embroidery Digitizing');
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

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
    if (!guestName.trim() || !guestEmail.trim() || !guestMessage.trim()) {
      setInquiryError('Please complete your name, email and message.');
      return;
    }

    setIsSubmittingInquiry(true);
    setInquiryError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim(),
          service: guestService,
          subject: `Live Chat Inquiry: ${guestService}`,
          message: guestMessage.trim()
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send inquiry. Please try again or use WhatsApp.');
      }

      setInquirySuccess(true);
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
        }
        html.mobile-app-active .live-chat-floating-btn-wrap,
        [data-mobile-mode="app"] .live-chat-floating-btn-wrap {
          bottom: calc(76px + env(safe-area-inset-bottom, 0px)) !important;
        }
        .live-chat-floating-container {
          position: fixed !important;
          bottom: 96px;
          right: 24px;
          width: min(400px, calc(100vw - 32px));
          height: min(600px, calc(100vh - 120px));
          z-index: 9999999 !important;
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
          }
        }
        .live-chat-floating-container .customer-chat-root {
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
          min-height: 0 !important;
          height: 100% !important;
          width: 100% !important;
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
          className="live-chat-floating-container flex flex-col bg-white dark:bg-slate-900 sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200"
          style={{
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(0, 0, 0, 0.08)'
          }}
          role="dialog"
          aria-label="Live Customer Support Chat"
        >
          {activeUser ? (
            /* AUTHENTICATED USER LIVE CHAT */
            <div className="flex-1 flex flex-col min-h-0 w-full h-full relative">
              <CustomerSupportChat
                defaultOrderId={null}
                chatType={activeChannel}
                onSwitchChannel={(ch) => setActiveChannel(ch)}
                onClose={handleClose}
              />
            </div>
          ) : (
            /* GUEST VISITOR EXPERIENCE */
            <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-slate-50 dark:bg-slate-950">
              {/* GUEST HEADER */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  padding: '0.85rem 1rem',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
                      }}
                    >
                      BD
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-1px',
                        right: '-1px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #0f172a'
                      }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                        BDigitizing Live Support
                      </h3>
                      <ShieldCheck size={14} color="#38bdf8" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.18)',
                        color: '#4ade80',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '0.05rem 0.35rem',
                        borderRadius: '6px'
                      }}>
                        Online
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Typically replies in minutes
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
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
                  <X size={15} />
                </button>
              </div>

              {/* GUEST BODY (SCROLLABLE) */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* STUDIO GREETING BUBBLE */}
                <div style={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  borderRadius: '16px',
                  padding: '0.9rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#7c3aed',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800
                    }}>
                      BD
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                      Studio Representative
                    </span>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: 'auto' }}>
                      Just now
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.5, margin: 0 }}>
                    👋 Welcome! Our digitizers and vector artists are available 24/7. Need a quick quote, format guidance (.DST, .PES), or turnaround estimate? Send us a message below or sign in for real-time live chat.
                  </p>
                </div>

                {/* SIGN IN QUICK PROMPT */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
                  border: '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '14px',
                  padding: '0.8rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4338ca', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Sparkles size={14} color="#6366f1" /> Real-Time Live Chat
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Sign in with Google or Email in 5 seconds
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAuth}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
                      flexShrink: 0
                    }}
                  >
                    <LogIn size={13} /> Sign In
                  </button>
                </div>

                {/* QUICK CHIP QUESTIONS */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quick Inquiry Topics:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {[
                      'Need quote for embroidery file (.DST/.PES)',
                      'Vector art conversion turnaround time',
                      'Custom patches pricing & minimum 50 pcs',
                      'Do you offer 4-8 hour rush delivery?'
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPrompt(prompt)}
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          border: '1px solid var(--color-border, #cbd5e1)',
                          borderRadius: '16px',
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.72rem',
                          color: 'var(--color-text-secondary, #334155)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          textAlign: 'left'
                        }}
                      >
                        💬 {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INQUIRY FORM */}
                {inquirySuccess ? (
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '1.25rem 1rem',
                    textAlign: 'center',
                    color: '#15803d'
                  }}>
                    <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                      Message Received!
                    </h4>
                    <p style={{ fontSize: '0.78rem', margin: '0 0 1rem 0', color: '#166534', lineHeight: 1.4 }}>
                      Thank you! Our digitizing team has received your inquiry. We will review your request and reply to your email shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInquirySuccess(false)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #86efac',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#15803d',
                        cursor: 'pointer'
                      }}
                    >
                      Send Another Question
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGuestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Direct Message to Studio:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Your Name *"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          border: '1px solid var(--color-border, #cbd5e1)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.65rem',
                          fontSize: '0.78rem',
                          color: 'var(--color-text-primary, #0f172a)'
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Email Address *"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        style={{
                          background: 'var(--color-surface, #ffffff)',
                          border: '1px solid var(--color-border, #cbd5e1)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.65rem',
                          fontSize: '0.78rem',
                          color: 'var(--color-text-primary, #0f172a)'
                        }}
                      />
                    </div>

                    <select
                      value={guestService}
                      onChange={(e) => setGuestService(e.target.value)}
                      style={{
                        background: 'var(--color-surface, #ffffff)',
                        border: '1px solid var(--color-border, #cbd5e1)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.65rem',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-primary, #0f172a)'
                      }}
                    >
                      <option value="Embroidery Digitizing">Embroidery Digitizing (.DST, .PES, .EMB)</option>
                      <option value="Vector Art Tracing">Vector Art Tracing (.AI, .EPS, .SVG)</option>
                      <option value="Custom Patches">Custom Patches (Min 50 pcs)</option>
                      <option value="General Support">General Support & Turnaround</option>
                    </select>

                    <textarea
                      placeholder="Type your message, requirements, or file format question here... *"
                      required
                      rows={3}
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      style={{
                        background: 'var(--color-surface, #ffffff)',
                        border: '1px solid var(--color-border, #cbd5e1)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.65rem',
                        fontSize: '0.8rem',
                        color: 'var(--color-text-primary, #0f172a)',
                        resize: 'none'
                      }}
                    />

                    {inquiryError && (
                      <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                        {inquiryError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: isSubmittingInquiry ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      {isSubmittingInquiry ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Sending to Studio...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* WHATSAPP REACHOUT OPTION */}
                {cleanWaNumber && (
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border, #e2e8f0)',
                    textAlign: 'center'
                  }}>
                    <a
                      href={`https://wa.me/${cleanWaNumber.replace(/^\+/, '')}?text=${encodeURIComponent('Hi BDigitizing Studio! I would like to inquire about embroidery digitizing & vector services.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#16a34a',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Prefer WhatsApp? Chat on WhatsApp</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
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
      <div className="live-chat-floating-btn-wrap">
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
