'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppState } from '../../context/StateContext';
import {
  X,
  Send,
  Loader2,
  CheckCircle2,
  Headphones,
  Paperclip
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
  const [latestIncomingPreview, setLatestIncomingPreview] = useState(null);
  const previewTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Guest inquiry form state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestService, setGuestService] = useState('Embroidery Digitizing');
  const [guestMessage, setGuestMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [sentMessages, setSentMessages] = useState([]);

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

      setSentMessages(prev => [...prev, { text: guestMessage.trim(), email: guestEmail.trim() }]);
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

  if (!mounted || activeUser) return null;

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

        /* Clean, professional floating chat launcher */
        .live-chat-floating-btn-wrap {
          bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          right: 24px;
        }
        .live-chat-launcher {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          padding: 0;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 10px 24px -2px rgba(29, 78, 216, 0.38), 0 3px 8px -1px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .live-chat-launcher:hover {
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 14px 28px -2px rgba(29, 78, 216, 0.48), 0 4px 10px -1px rgba(15, 23, 42, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .live-chat-launcher:active { transform: scale(.96); }
        .live-chat-launcher:focus-visible,
        .live-chat-guest-header button:focus-visible,
        .live-chat-guest-chip:focus-visible,
        .live-chat-send:focus-visible,
        .live-chat-whatsapp:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.45);
          outline-offset: 3px;
        }
        .live-chat-unread-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          padding: 0 5px;
          border: 2px solid white;
          border-radius: 10px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.45);
        }
        .live-chat-floating-container {
          bottom: calc(100px + env(safe-area-inset-bottom, 0px));
          right: 24px;
          width: min(376px, calc(100vw - 32px));
          height: min(530px, calc(100dvh - 128px));
          border: 1px solid #e2e8f0 !important;
          border-radius: 18px !important;
          box-shadow: 0 16px 48px rgba(15, 23, 42, .18), 0 4px 12px rgba(15, 23, 42, .06) !important;
        }
        .live-chat-guest {
          background: #fff !important;
          color: #172033;
        }
        .live-chat-guest-header {
          display: flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 11px;
          padding: 16px;
          background: #fff;
          border-bottom: 1px solid #edf0f5;
        }
        .live-chat-guest-avatar {
          position: relative;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 13px;
          background: #eff6ff;
          color: #1d4ed8;
        }
        .live-chat-guest-avatar::after {
          content: '';
          position: absolute;
          right: -2px;
          bottom: -1px;
          width: 11px;
          height: 11px;
          border: 2px solid white;
          border-radius: 50%;
          background: #10b981;
        }
        .live-chat-header-copy { min-width: 0; flex: 1; }
        .live-chat-header-copy h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.3;
          color: #172033;
        }
        .live-chat-header-copy p {
          margin: 3px 0 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }
        .live-chat-header-actions { display: flex; align-items: center; gap: 7px; }
        .live-chat-signin {
          border: 0;
          padding: 7px 5px;
          background: transparent;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 650;
          cursor: pointer;
          white-space: nowrap;
        }
        .live-chat-close {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
        }
        .live-chat-close:hover { background: #f1f5f9; color: #0f172a; }
        .live-chat-guest-messages {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          min-height: 0;
          padding: 16px 16px;
          background: #f8fafc;
        }
        .live-chat-welcome {
          align-self: flex-start;
          max-width: 94%;
          margin: 0;
          padding: 13px 15px;
          border: 1px solid #e9eef5;
          border-radius: 14px 14px 14px 4px;
          background: #fff;
          color: #334155;
          font-size: 13px;
          line-height: 1.6;
        }
        .live-chat-sent-message {
          align-self: flex-end;
          max-width: 90%;
          padding: 10px 13px;
          border-radius: 14px 14px 4px 14px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          color: #fff;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }
        .live-chat-received-message {
          align-self: flex-start;
          max-width: 94%;
          padding: 12px 14px;
          border: 1px solid #dcefe6;
          border-radius: 14px 14px 14px 4px;
          background: #fff;
          color: #334155;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .live-chat-received-message strong {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          color: #15803d;
          font-weight: 650;
        }
        .live-chat-composer {
          flex: 0 0 auto;
          padding: 10px 14px 12px;
          border-top: 1px solid #edf0f5;
          background: #ffffff;
        }
        [data-theme="dark"] .live-chat-composer,
        .dark .live-chat-composer {
          background: #0f172a;
          border-top-color: #1e293b;
        }
        .live-chat-quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .live-chat-guest-chip {
          padding: 5px 11px;
          border: 1px solid #dbe4f4;
          border-radius: 999px;
          background: #ffffff;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all .15s ease;
        }
        .live-chat-guest-chip:hover {
          border-color: #2563eb;
          color: #1e40af;
          background: #eff6ff;
          transform: translateY(-1px);
        }
        [data-theme="dark"] .live-chat-guest-chip,
        .dark .live-chat-guest-chip {
          background: #1e293b;
          border-color: #334155;
          color: #60a5fa;
        }
        .live-chat-guest-form { display: flex; flex-direction: column; gap: 7px; }
        .live-chat-guest-field {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          padding: 9px 12px;
          border: 1px solid #dce3ec;
          border-radius: 9px;
          background: #f8fafc;
          color: #0f172a;
          font: inherit;
          font-size: 13px;
          line-height: 1.45;
          outline: none;
          transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
        }
        .live-chat-guest-field::placeholder { color: #94a3b8; }
        .live-chat-guest-field:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
        }
        [data-theme="dark"] .live-chat-guest-field,
        .dark .live-chat-guest-field {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        .live-chat-guest-email {
          padding: 7px 11px;
          font-size: 12px;
        }
        .live-chat-guest-message-row { display: flex; gap: 8px; align-items: flex-end; }
        .live-chat-guest-message-row textarea {
          flex: 1 1 auto;
          resize: none;
          min-height: 44px;
          max-height: 110px;
          padding: 9px 12px;
          border-radius: 10px;
        }
        .live-chat-send {
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          height: 44px;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
          color: #ffffff;
          cursor: pointer;
          transition: transform .15s ease, opacity .15s ease, box-shadow .15s ease;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.22);
        }
        .live-chat-send:hover:not(:disabled) {
          background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.32);
        }
        .live-chat-send:disabled { opacity: .65; cursor: wait; }
        .live-chat-form-error { margin: 0; color: #b91c1c; font-size: 12px; }
        @media (max-width: 640px) {
          .live-chat-floating-btn-wrap { right: 20px; bottom: calc(20px + env(safe-area-inset-bottom, 0px)); }
          .live-chat-floating-container {
            top: auto !important;
            left: auto !important;
            right: 12px !important;
            bottom: calc(94px + env(safe-area-inset-bottom, 0px)) !important;
            width: calc(100vw - 24px) !important;
            height: min(510px, calc(100dvh - 114px)) !important;
            max-height: calc(100dvh - 114px) !important;
            border-radius: 18px !important;
          }
          html.mobile-app-active .live-chat-floating-container,
          [data-mobile-mode="app"] .live-chat-floating-container {
            bottom: calc(152px + env(safe-area-inset-bottom, 0px)) !important;
            height: min(470px, calc(100dvh - 174px)) !important;
            max-height: calc(100dvh - 174px) !important;
          }
          .live-chat-guest-header { padding: 13px 14px; }
          .live-chat-guest-messages { padding: 16px 14px; }
          .live-chat-composer { padding: 12px 14px 14px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .live-chat-launcher { transition: none; }
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
            <div className="live-chat-guest flex-1 flex flex-col min-h-0 w-full h-full">
              <header className="live-chat-guest-header" style={{
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '11px',
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                    }}>
                      BD
                    </div>
                    <span style={{
                      position: 'absolute',
                      bottom: '-1px',
                      right: '-1px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#22c55e',
                      border: '2px solid #0f172a'
                    }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 900, margin: 0, color: '#ffffff', whiteSpace: 'nowrap' }}>
                        BDigitizing Support
                      </h3>
                      <span style={{
                        background: 'rgba(34, 197, 94, 0.18)',
                        color: '#4ade80',
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '6px',
                        letterSpacing: '0.03em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button type="button" className="live-chat-signin" onClick={handleOpenAuth}>Sign in</button>
                  <button type="button" className="live-chat-close" onClick={handleClose} aria-label="Close chat" title="Close chat">
                    <X size={18} />
                  </button>
                </div>
              </header>

              <div className="live-chat-guest-messages" aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 1.25rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '380px', margin: '0 auto' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.85rem',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)',
                    border: '1px solid #fed7aa'
                  }}>
                    <Headphones size={26} color="#2563eb" />
                  </div>

                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                    24/7 Studio Customer Support
                  </h4>

                  <p style={{ fontSize: '0.82rem', margin: '0 0 1.25rem', color: '#64748b', lineHeight: 1.5 }}>
                    Need assistance with an existing order, stitch simulation, format conversion, or urgent revision? Our team is standing by 24/7.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', margin: '0 auto' }}>
                    {[
                      'Need help with an existing order',
                      'How do I request a revision?',
                      'File format questions (.DST, .PES)'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPrompt(chip)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '20px',
                          padding: '0.42rem 1.15rem',
                          fontSize: '0.78rem',
                          color: '#334155',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          width: '100%',
                          maxWidth: '280px',
                          justifyContent: 'center'
                        }}
                      >
                        <span>💬</span> {chip}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'none' }}>
                    <button type="button" className="live-chat-guest-chip" onClick={() => handleApplyPrompt('Need quote for embroidery file (.DST/.PES)')}>Get a quote</button>
                    <button type="button" className="live-chat-guest-chip" onClick={() => handleApplyPrompt('Vector art conversion turnaround time')}>Turnaround time</button>
                  </div>
                </div>

                {sentMessages.map((msg, idx) => (
                  <React.Fragment key={idx}>
                    <div className="live-chat-sent-message">{msg.text}</div>
                    <div className="live-chat-received-message">
                      <strong><CheckCircle2 size={15} /> Message received</strong>
                      Thanks for reaching out. We'll reply to {msg.email} as soon as we can.
                    </div>
                  </React.Fragment>
                ))}
              </div>

              <div className="live-chat-composer" style={{ padding: '0.75rem 1rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <form onSubmit={handleGuestSubmit} className="live-chat-guest-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!guestEmail && (
                    <input
                      className="live-chat-guest-field live-chat-guest-email"
                      type="email"
                      autoComplete="email"
                      aria-label="Your email for reply"
                      placeholder="Your email address (for reply)..."
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      style={{
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.82rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        outline: 'none'
                      }}
                    />
                  )}
                  <div className="live-chat-guest-message-row" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <button
                      type="button"
                      onClick={() => handleApplyPrompt('Need quote for embroidery file (.DST/.PES)')}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#475569',
                        flexShrink: 0
                      }}
                      title="Attach file (available upon sign-in or quote request)"
                      aria-label="Attach file"
                    >
                      <Paperclip size={18} />
                    </button>

                    <textarea
                      className="live-chat-guest-field"
                      rows={1}
                      aria-label="Your message"
                      placeholder="Describe your question or issue..."
                      required
                      value={guestMessage}
                      onChange={(e) => setGuestMessage(e.target.value)}
                      style={{
                        flex: 1,
                        border: '1.5px solid #cbd5e1',
                        background: '#f8fafc',
                        borderRadius: '22px',
                        padding: '0.62rem 1.05rem',
                        fontSize: '0.92rem',
                        outline: 'none',
                        resize: 'none',
                        minHeight: '42px',
                        maxHeight: '100px',
                        boxSizing: 'border-box'
                      }}
                    />

                    <button
                      className="live-chat-send"
                      type="submit"
                      disabled={isSubmittingInquiry}
                      aria-label="Send message"
                      title="Send message"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isSubmittingInquiry ? 'wait' : 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      {isSubmittingInquiry ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {inquiryError && <p className="live-chat-form-error" role="alert" style={{ margin: 0, color: '#dc2626', fontSize: '0.75rem' }}>{inquiryError}</p>}
                </form>
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

      {/* MINIMAL FLOATING SUPPORT BUTTON */}
      <div
        className={'live-chat-floating-btn-wrap' + (isOpen ? ' is-hidden' : '')}
        style={isOpen ? { display: 'none', pointerEvents: 'none' } : undefined}
      >
        <button
          type="button"
          className="live-chat-launcher"
          onClick={handleToggleOpen}
          aria-label="Open support chat"
          title="Chat with BDigitizing Support"
          aria-haspopup="dialog"
          aria-expanded={false}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadCount > 0 && (
            <span className="live-chat-unread-badge" aria-label={unreadCount + ' unread messages'}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default LiveChatWidget;
