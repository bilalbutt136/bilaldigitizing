'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Package, 
  MessageSquare, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  PackageCheck, 
  AlertCircle, 
  Layers,
  Inbox,
  CheckCircle2,
  RotateCcw,
  XCircle,
  CreditCard,
  Zap
} from 'lucide-react';
import { fetchNotificationsFromSupabase, markNotificationAsReadInSupabase, subscribeToNotifications } from '../../services/supabaseService';
import { formatOrderId } from '../../context/StateContext';

export const ClientNotificationsView = ({ onNavigateToOrder, onNavigateToChat, userEmail, isAdmin = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotificationsFromSupabase();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    // Subscribe to live Supabase notifications table inserts
    const unsubscribeRealtime = subscribeToNotifications({
      userEmail,
      isAdmin,
      onNewNotification: (newNotif) => {
        setNotifications(prev => {
          // Deduplicate by ID
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [{ ...newNotif, is_read: false, read: false }, ...prev];
        });
      }
    });

    return () => {
      if (typeof unsubscribeRealtime === 'function') unsubscribeRealtime();
    };
  }, [userEmail, isAdmin, loadNotifications]);

  const handleMarkAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true, read: true } : n));
    try {
      await markNotificationAsReadInSupabase(id);
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    try {
      const unreadIds = notifications.filter(n => !n.is_read && !n.read).map(n => n.id);
      await Promise.all(unreadIds.map(id => markNotificationAsReadInSupabase(id)));
    } catch {}
  };

  const handleItemClick = (notif) => {
    handleMarkAsRead(notif.id);

    const orderId = notif.order_id || notif.orderId || notif.metadata?.order_id || notif.metadata?.orderId;
    const conversationId = notif.conversation_id || notif.conversationId || notif.metadata?.conversation_id;

    if (notif.type === 'message' || conversationId) {
      if (typeof onNavigateToChat === 'function') {
        onNavigateToChat(conversationId || (orderId ? `order-${orderId}` : null));
      }
    } else if (orderId) {
      if (typeof onNavigateToOrder === 'function') {
        onNavigateToOrder(orderId);
      }
    }
  };

  const getNotifIcon = (notif) => {
    const type = (notif.type || notif.category || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();

    if (type === 'error' || title.includes('cancelled') || title.includes('cancel')) {
      return <XCircle size={18} style={{ color: '#dc2626' }} />;
    }
    if (title.includes('payment') || title.includes('paid') || title.includes('💳')) {
      return <CreditCard size={18} style={{ color: '#059669' }} />;
    }
    if (title.includes('complete') || title.includes('✅') || title.includes('🎉')) {
      return <CheckCircle2 size={18} style={{ color: '#16a34a' }} />;
    }
    if (title.includes('modification') || title.includes('revision') || title.includes('🔄')) {
      return <RotateCcw size={18} style={{ color: '#d97706' }} />;
    }
    if (title.includes('files ready') || title.includes('delivered') || title.includes('📦') || title.includes('download')) {
      return <PackageCheck size={18} style={{ color: '#059669' }} />;
    }
    if (title.includes('production') || title.includes('in production') || title.includes('⚡')) {
      return <Zap size={18} style={{ color: '#2563eb' }} />;
    }
    if (type === 'message' || type.includes('message') || title.includes('message') || title.includes('💬')) {
      return <MessageSquare size={18} style={{ color: '#f97316' }} />;
    }
    if (type.includes('offer') || title.includes('offer') || title.includes('tag')) {
      return <Tag size={18} style={{ color: '#4f46e5' }} />;
    }
    if (title.includes('new order') || title.includes('placed') || title.includes('🎉') || title.includes('🚨')) {
      return <Sparkles size={18} style={{ color: '#7c3aed' }} />;
    }
    return <Package size={18} style={{ color: '#0284c7' }} />;
  };

  const getNotifBgColor = (notif) => {
    const type = (notif.type || '').toLowerCase();
    const title = (notif.title || '').toLowerCase();
    if (type === 'error') return { bg: '#fff1f2', border: '#fecaca', icon: '#fee2e2' };
    if (type === 'warning' || title.includes('modification') || title.includes('revision')) return { bg: '#fffbeb', border: '#fde68a', icon: '#fef3c7' };
    if (type === 'success') return { bg: '#f0fdf4', border: '#bbf7d0', icon: '#dcfce7' };
    if (type === 'message') return { bg: '#fff7ed', border: '#fed7aa', icon: '#ffedd5' };
    return { bg: '#fffcf6', border: '#fed7aa', icon: '#ffedd5' }; // unread default orange
  };


  const filteredNotifs = notifications.filter(n => {
    const isUnread = !n.is_read && !n.read;
    if (filter === 'unread') return isUnread;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header & Controls */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)'
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
              Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
              Live updates on orders, quotes, offers & messages
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: filter === 'all' ? '#ffffff' : 'transparent',
                color: filter === 'all' ? '#0f172a' : '#64748b',
                fontWeight: filter === 'all' ? 800 : 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: filter === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: filter === 'unread' ? '#ffffff' : 'transparent',
                color: filter === 'unread' ? '#ea580c' : '#64748b',
                fontWeight: filter === 'unread' ? 800 : 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                boxShadow: filter === 'unread' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filteredNotifs.length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Inbox size={36} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              No Notifications
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              {filter === 'unread' ? 'You have caught up with all your unread updates.' : 'When you receive orders, custom offers or messages, they will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map(notif => {
            const isUnread = !notif.is_read && !notif.read;
            const colors = getNotifBgColor(notif);
            const timeStr = notif.created_at || notif.timestamp
              ? (() => {
                  try {
                    const d = new Date(notif.created_at || notif.timestamp);
                    const isToday = new Date().toDateString() === d.toDateString();
                    return isToday
                      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch { return 'Recent'; }
                })()
              : 'Recent';

            return (
              <div
                key={notif.id || Math.random()}
                onClick={() => handleItemClick(notif)}
                style={{
                  background: isUnread ? colors.bg : '#ffffff',
                  border: isUnread ? `1.5px solid ${colors.border}` : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isUnread ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Icon Container */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isUnread ? colors.icon : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getNotifIcon(notif)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: '0.88rem',
                      fontWeight: isUnread ? 900 : 700,
                      color: isUnread ? '#0f172a' : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {notif.title || 'Studio Notification'}
                    </h5>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>
                      {timeStr}
                    </span>
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: isUnread ? '#334155' : '#64748b',
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {notif.message || notif.body || 'Tap to view details.'}
                  </p>
                </div>

                {/* Unread Dot & Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  {isUnread && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
                  )}
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default ClientNotificationsView;
