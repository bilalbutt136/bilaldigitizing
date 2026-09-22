'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, X, ArrowRight, Bell } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { playNotificationSound } from '../../utils/audioNotification';
import { useRouter } from 'next/navigation';

export const WhatsAppMessagePopup = () => {
  const router = useRouter();
  const { authUser, currentUser, setMobileTab, mobileMode, currentView } = useAppState();

  const activeUser = authUser || currentUser;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const isAdmin = activeUser?.role === 'admin' || currentView === 'admin';

  const [activeMessage, setActiveMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const dismissTimerRef = useRef(null);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setTimeout(() => {
      setActiveMessage(null);
    }, 300);
  }, []);

  const handleNewChatMessage = useCallback((event) => {
    const msg = event?.detail;
    if (!msg || !msg.sender) return;

    // Do NOT notify sender of their own outgoing message
    const isFromAdmin = String(msg.sender).toLowerCase() === 'admin';
    const isFromClient = String(msg.sender).toLowerCase() === 'client';

    if (isAdmin) {
      // Admin only gets notified when a CLIENT messages
      if (!isFromClient) return;
    } else {
      // Customer only gets notified when ADMIN replies to THEM
      if (!isFromAdmin) return;
      if (userEmail && msg.client_email && msg.client_email.toLowerCase().trim() !== userEmail) {
        return;
      }
    }

    // Play message chime
    try {
      playNotificationSound('chat', true);
    } catch {}

    // Phone vibration if supported
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]);
      }
    } catch {}

    // Show popup
    setActiveMessage(msg);
    setIsVisible(true);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      dismiss();
    }, 6000);
  }, [isAdmin, userEmail, dismiss]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('bdigi_new_chat_message', handleNewChatMessage);
    return () => {
      window.removeEventListener('bdigi_new_chat_message', handleNewChatMessage);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [handleNewChatMessage]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (!activeMessage) return;

    const convId = activeMessage.conversation_id || '';
    dismiss();

    if (mobileMode === 'app' && typeof setMobileTab === 'function') {
      setMobileTab('inbox');
      return;
    }

    if (isAdmin) {
      router.push(`/admin-portal?tab=inbox${convId ? `&chatId=${encodeURIComponent(convId)}` : ''}`);
    } else {
      router.push(`/client-portal?tab=inbox${convId ? `&chatId=${encodeURIComponent(convId)}` : ''}`);
    }
  };

  if (!activeMessage || !isVisible) return null;

  const senderDisplayName = activeMessage.sender === 'admin'
    ? 'Bilal Digitizing Support'
    : (activeMessage.sender_name || activeMessage.client_email?.split('@')[0] || 'Customer');

  const textPreview = activeMessage.text 
    ? activeMessage.text 
    : (activeMessage.attachments?.length ? `📎 ${activeMessage.attachments[0].name || 'Attachment'}` : 'New message');

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-30px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 999999,
        width: 'calc(100% - 24px)',
        maxWidth: '430px',
        background: '#0f172a',
        borderRadius: '16px',
        border: '1.5px solid rgba(255, 255, 255, 0.16)',
        boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
        padding: '0.85rem 1rem',
        cursor: 'pointer',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* Sender Avatar / WhatsApp Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
          flexShrink: 0
        }}>
          <MessageSquare size={20} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <h4 style={{
              margin: 0,
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {senderDisplayName}
            </h4>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0, fontWeight: 500 }}>
              now
            </span>
          </div>

          <p style={{
            margin: '0.2rem 0 0',
            fontSize: '0.78rem',
            color: '#cbd5e1',
            lineHeight: 1.35,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {textPreview}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
        <span style={{
          background: 'rgba(37, 211, 102, 0.2)',
          color: '#4ade80',
          fontSize: '0.7rem',
          fontWeight: 800,
          padding: '0.25rem 0.6rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          Reply <ArrowRight size={11} />
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '26px',
            height: '26px',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default WhatsAppMessagePopup;
