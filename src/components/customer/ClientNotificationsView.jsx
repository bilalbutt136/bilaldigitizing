'use client';

import React, { useState } from 'react';
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
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import { handleNotificationClick, parseNotificationTarget } from '../../utils/notificationRouter';

export const ClientNotificationsView = ({ onNavigateToOrder, onNavigateToChat, userEmail, isAdmin = false }) => {
  const navigate = useNavigate();
  const {
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount = 0,
    openOrderTrackerDrawer,
    setSelectedOrderForDrawer,
    orders = [],
    authUser,
    currentUser,
    isAuthenticated,
    setActiveAdminTab,
    setActiveCustomerTab,
    protectedNavigate,
    currentView,
    mobileMode
  } = useAppState();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const handleMarkAsRead = (id) => {
    if (markNotificationAsRead) markNotificationAsRead(id);
  };

  const handleMarkAllRead = () => {
    if (markAllNotificationsAsRead) markAllNotificationsAsRead();
  };

  const handleItemClick = (notif) => {
    if (notif.id) handleMarkAsRead(notif.id);

    const target = parseNotificationTarget(notif, orders);

    if (target.type === 'message' || target.type === 'offer') {
      if (typeof onNavigateToChat === 'function') {
        onNavigateToChat(target.conversationId || (target.orderId ? `order-${target.orderId}` : null));
      } else {
        handleNotificationClick(notif, {
          markNotificationAsRead,
          authUser,
          currentUser,
          isAuthenticated,
          orders,
          openOrderTrackerDrawer,
          setSelectedOrderForDrawer,
          setActiveAdminTab,
          setActiveCustomerTab,
          navigate,
          protectedNavigate,
          currentView: isAdmin ? 'admin' : (currentView || 'customer'),
          mobileMode
        });
      }
    } else if (target.type === 'order' || target.orderId) {
      if (typeof onNavigateToOrder === 'function') {
        onNavigateToOrder(target.matchedOrder || target.orderId);
      }
      if (openOrderTrackerDrawer) {
        openOrderTrackerDrawer(target.matchedOrder || target.orderId);
      } else if (setSelectedOrderForDrawer) {
        setSelectedOrderForDrawer(target.matchedOrder || { 
          id: String(target.orderId).startsWith('#') ? target.orderId : `#${target.orderId}`, 
          title: `Order #${String(target.orderId).replace(/^#+/, '')}`, 
          status: 'in_progress' 
        });
      }
      if (typeof setActiveCustomerTab === 'function') {
        setActiveCustomerTab('orders');
      }
      if (typeof setActiveAdminTab === 'function' && (isAdmin || authUser?.role === 'admin')) {
        setActiveAdminTab('orders');
      }
    } else {
      handleNotificationClick(notif, {
        markNotificationAsRead,
        authUser,
        currentUser,
        isAuthenticated,
        orders,
        openOrderTrackerDrawer,
        setSelectedOrderForDrawer,
        setActiveAdminTab,
        setActiveCustomerTab,
        navigate,
        protectedNavigate,
        currentView: isAdmin ? 'admin' : (currentView || 'customer'),
        mobileMode
      });
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
    if (type === 'error') return { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)', icon: 'rgba(239, 68, 68, 0.15)' };
    if (type === 'warning' || title.includes('modification') || title.includes('revision')) return { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', icon: 'rgba(245, 158, 11, 0.15)' };
    if (type === 'success') return { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)', icon: 'rgba(16, 185, 129, 0.15)' };
    return { bg: 'var(--color-primary-light)', border: 'var(--color-primary)', icon: 'var(--color-primary-light)' };
  };

  const filteredNotifs = notifications.filter(n => {
    const isUnread = !n.is_read && !n.read;
    if (filter === 'unread') return isUnread;
    return true;
  });

  const unreadCount = unreadNotificationsCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header & Controls */}
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        border: '1.5px solid var(--color-border)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm, 0 2px 8px rgba(0,0,0,0.03))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
            color: 'var(--color-text-on-primary, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--color-primary-glow)'
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
              Notifications
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)' }}>
              Live updates on orders, quotes, offers & messages
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--color-subtle, #f1f5f9)', padding: '3px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '0.3rem 0.65rem',
                borderRadius: '6px',
                border: 'none',
                background: filter === 'all' ? 'var(--color-surface, #ffffff)' : 'transparent',
                color: filter === 'all' ? 'var(--color-text-primary, #0f172a)' : 'var(--color-text-muted, #64748b)',
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
                background: filter === 'unread' ? 'var(--color-surface, #ffffff)' : 'transparent',
                color: filter === 'unread' ? 'var(--color-primary)' : 'var(--color-text-muted, #64748b)',
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
                background: 'var(--color-subtle, #f8fafc)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary, #334155)',
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
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '16px',
            border: '1.5px solid var(--color-border)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--color-text-muted, #64748b)'
          }}>
            <Inbox size={36} style={{ color: 'var(--color-text-muted, #94a3b8)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
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
                  background: isUnread ? colors.bg : 'var(--color-surface, #ffffff)',
                  border: isUnread ? `1.5px solid ${colors.border}` : '1px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isUnread ? 'var(--shadow-sm)' : 'none',
                  position: 'relative'
                }}
              >
                {/* Icon Container */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isUnread ? colors.icon : 'var(--color-subtle, #f1f5f9)',
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
                      color: isUnread ? 'var(--color-text-primary, #0f172a)' : 'var(--color-text-secondary, #334155)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {notif.title || 'Studio Notification'}
                    </h5>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted, #94a3b8)', flexShrink: 0, marginLeft: '0.5rem' }}>
                      {timeStr}
                    </span>
                  </div>

                  <p style={{
                    margin: 0,
                    fontSize: '0.78rem',
                    color: isUnread ? 'var(--color-text-secondary, #334155)' : 'var(--color-text-muted, #64748b)',
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                  )}
                  <ChevronRight size={16} style={{ color: 'var(--color-text-muted, #94a3b8)' }} />
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
