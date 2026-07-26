import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { playNotificationSound } from '../../utils/audioNotification';
import { 
  MessageSquare, 
  X, 
  Send, 
  Paperclip, 
  User, 
  Zap, 
  Clock, 
  CheckCheck, 
  Sparkles, 
  ShieldCheck, 
  Minimize2,
  Maximize2
} from 'lucide-react';

export const ClientLiveChatWidget = () => {
  const { authUser, currentUser, showToast } = useAppState();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  const activeUser = authUser || currentUser || {
    name: 'Shahid Butt',
    email: 'shahidbutt59191@gmail.com',
    company: 'Apex Apparel'
  };

  const cleanName = (activeUser?.name || 'Client').replace(/\s*\(ADMIN\)/gi, '').trim();
  const clientEmail = (activeUser?.email || 'client@example.com').toLowerCase().trim();
  const clientCompany = activeUser?.company || `${cleanName}'s Account`;
  const avatarUrl = activeUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0f172a&color=fff`;

  const chatFeedRef = useRef(null);
  const fileInputRef = useRef(null);

  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_admin_chats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Real-time Event Listener for incoming admin replies across tabs and windows
  useEffect(() => {
    const syncChats = (e) => {
      if (e.type === 'bdigi_chat_update' && e.detail) {
        setChats(e.detail);
        playNotificationSound('receive');
      } else if (e.key === 'bdigi_admin_chats' && e.newValue) {
        try {
          setChats(JSON.parse(e.newValue));
          playNotificationSound('receive');
        } catch (_) {}
      }
    };

    window.addEventListener('storage', syncChats);
    window.addEventListener('bdigi_chat_update', syncChats);
    return () => {
      window.removeEventListener('storage', syncChats);
      window.removeEventListener('bdigi_chat_update', syncChats);
    };
  }, []);

  // Find or create current client's chat thread
  let clientThread = chats.find(c => (c.clientEmail || '').toLowerCase().trim() === clientEmail) || {
    id: `chat-${clientEmail}`,
    clientName: cleanName,
    clientCompany: clientCompany,
    clientEmail: clientEmail,
    avatar: avatarUrl,
    status: 'online',
    orderId: '#Support',
    orderTitle: 'Live Support Inquiry',
    unreadCount: 0,
    messages: []
  };

  const scrollToBottom = () => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chats]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() && !attachedFile) return;

    const newMsg = {
      id: 'msg-client-' + Date.now(),
      sender: 'client',
      senderName: cleanName,
      text: messageInput.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : ''),
      attachment: attachedFile ? attachedFile.name : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let updatedChats = [...chats];
    const threadIdx = updatedChats.findIndex(c => (c.clientEmail || '').toLowerCase().trim() === clientEmail);

    if (threadIdx >= 0) {
      updatedChats[threadIdx] = {
        ...updatedChats[threadIdx],
        clientName: cleanName,
        clientCompany: clientCompany,
        clientEmail: clientEmail,
        avatar: avatarUrl,
        unreadCount: (updatedChats[threadIdx].unreadCount || 0) + 1,
        messages: [...(updatedChats[threadIdx].messages || []), newMsg]
      };
    } else {
      const newThread = {
        ...clientThread,
        clientName: cleanName,
        clientCompany: clientCompany,
        clientEmail: clientEmail,
        avatar: avatarUrl,
        unreadCount: 1,
        messages: [newMsg]
      };
      updatedChats = [newThread, ...updatedChats];
    }

    setChats(updatedChats);
    try {
      localStorage.setItem('bdigi_admin_chats', JSON.stringify(updatedChats));
      window.dispatchEvent(new CustomEvent('bdigi_chat_update', { detail: updatedChats }));
    } catch (_) {}

    setMessageInput('');
    setAttachedFile(null);
    playNotificationSound('send');
    showToast('Message sent to Master Digitizer Support!', 'success');
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
      showToast(`Attached ${file.name} to message`, 'info');
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1900,
            background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--orange-500) 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.85rem 1.35rem',
            borderRadius: '9999px',
            boxShadow: '0 8px 28px rgba(249, 115, 22, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontWeight: 800,
            fontSize: '0.925rem',
            transition: 'all 0.2s ease-in-out',
            transform: 'scale(1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ position: 'relative' }}>
            <MessageSquare size={20} />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #ffffff'
            }} />
          </div>
          <span>Live Support Chat</span>
        </button>
      )}

      {/* Floating Chat Window Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 2000,
          width: '360px',
          height: isMinimized ? '60px' : '520px',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 45px rgba(0, 0, 0, 0.22)',
          border: '1.5px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'height 0.25s ease'
        }}>
          {/* Header Bar */}
          <div style={{
            padding: '0.85rem 1.15rem',
            background: 'var(--navy-950)',
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
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', leading: 1.1 }}>
                  Master Digitizer Support
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

                {clientThread.messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#fff7ed', color: 'var(--orange-500)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                      <MessageSquare size={20} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--navy-900)' }}>
                      Start a Conversation
                    </div>
                    <div style={{ fontSize: '0.78rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                      Type your message or attach artwork files below to chat live with our digitizers.
                    </div>
                  </div>
                )}

                {clientThread.messages.map((msg) => {
                  const isClient = msg.sender === 'client';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isClient ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        fontSize: '0.68rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.15rem',
                        fontWeight: 700,
                        padding: '0 0.2rem'
                      }}>
                        {msg.senderName} • {msg.timestamp}
                      </div>

                      <div style={{
                        maxWidth: '82%',
                        padding: '0.7rem 0.95rem',
                        borderRadius: isClient ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        background: isClient ? 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)' : '#ffffff',
                        color: isClient ? '#ffffff' : 'var(--navy-900)',
                        border: isClient ? 'none' : '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        fontSize: '0.85rem',
                        lineHeight: 1.45
                      }}>
                        {msg.text}

                        {msg.attachment && (
                          <div style={{
                            marginTop: '0.4rem',
                            paddingTop: '0.4rem',
                            borderTop: isClient ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <Paperclip size={13} /> {msg.attachment}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', background: '#ffffff' }}>
                {attachedFile && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#fff7ed',
                    border: '1px solid var(--orange-300)',
                    color: 'var(--orange-800)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    marginBottom: '0.45rem'
                  }}>
                    <Paperclip size={12} /> {attachedFile.name}
                    <button type="button" onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileAttach} 
                    style={{ display: 'none' }} 
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid var(--border-color)',
                      color: 'var(--navy-700)',
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                    title="Attach File"
                  >
                    <Paperclip size={16} />
                  </button>

                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Type message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    style={{ flex: 1, height: '36px', fontSize: '0.85rem' }}
                  />

                  <button
                    type="submit"
                    className="btn btn-primary-orange"
                    style={{ height: '36px', width: '36px', padding: 0, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Send size={15} />
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      )}
    </>
  );
};
