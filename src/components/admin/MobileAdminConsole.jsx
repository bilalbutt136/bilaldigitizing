'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Home,
  LogOut,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
  Zap
} from 'lucide-react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import AdminChatInbox from './AdminChatInbox';
import { fetchChatUnreadCounts } from '../../services/chatUnreadService';
import { subscribeToChatMessages, subscribeToConversations } from '../../services/supabaseService';
import { playMessageChimeForMessage } from '../../utils/audioNotification';
import { useAdminIdleSession } from '../../hooks/useAdminIdleSession';

const ACTIVE_STATUSES = new Set(['in_progress', 'digitizing', 'assigned', 'qc']);
const FINISHED_STATUSES = new Set(['delivered', 'completed']);
const NEW_STATUSES = new Set(['submitted', 'awaiting_payment', 'pending_payment', '']);

const normalizeStatus = order => String(order?.status || '').toLowerCase().trim();
const normalizePayment = order => String(order?.payment_status || order?.paymentStatus || '').toLowerCase().trim();

function isOrderPaid(order) {
  const payment = normalizePayment(order);
  return Boolean(
    order?.isPaid ||
    order?.paid ||
    order?.paid_at ||
    ['paid', 'completed', 'settled', 'verified', 'wallet'].includes(payment)
  );
}

function isRushOrder(order) {
  return Boolean(
    order?.is_rush ||
    order?.isRush ||
    String(order?.turnaround || '').toLowerCase().includes('rush') ||
    String(order?.title || '').toLowerCase().includes('rush') ||
    String(order?.notes || '').toLowerCase().includes('rush')
  );
}

function getStatusLabel(order) {
  const status = normalizeStatus(order);
  const labels = {
    submitted: 'New',
    awaiting_payment: 'Awaiting Payment',
    pending_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    digitizing: 'Digitizing',
    assigned: 'Assigned',
    qc: 'Quality Check',
    revision: 'Revision',
    cancellation_requested: 'Cancel Requested',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };
  return labels[status] || (status ? status.replaceAll('_', ' ') : 'New');
}

function formatShortTime(value) {
  if (!value) return 'Recent';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MobileMetric({ label, value, icon: Icon, onClick, accent = '#ea580c' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: 0,
        border: '1px solid var(--border-color, #e2e8f0)',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        padding: '0.9rem',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '0.7rem',
        cursor: 'pointer',
        boxShadow: '0 3px 12px rgba(15, 23, 42, 0.05)'
      }}
    >
      <span style={{
        width: '38px',
        height: '38px',
        borderRadius: '12px',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        background: `${accent}12`,
        color: accent
      }}>
        <Icon size={19} />
      </span>
      <span style={{ minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: '1.15rem', lineHeight: 1, color: 'var(--color-text-primary, #0f172a)' }}>
          {value}
        </strong>
        <span style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)' }}>
          {label}
        </span>
      </span>
    </button>
  );
}

function MobileOrderCard({ order, onOpen, onStart, isStarting }) {
  const status = normalizeStatus(order);
  const paid = isOrderPaid(order);
  const rush = isRushOrder(order);
  const canStart = paid && (status === 'submitted' || status === '');
  const client = order?.clientName || order?.client_name || order?.clientEmail || order?.client_email || 'Client';
  const title = order?.title || order?.service_type || order?.serviceCategory || order?.service_category || 'Production Order';
  const priceRaw = Number(order?.price ?? order?.totalPrice ?? order?.total_price ?? 0);
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? `$${priceRaw.toFixed(2)}` : null;

  return (
    <article style={{
      background: 'var(--bg-card, #ffffff)',
      border: rush ? '1.5px solid #fb923c' : '1px solid var(--border-color, #e2e8f0)',
      borderRadius: '16px',
      padding: '0.9rem',
      boxShadow: '0 3px 12px rgba(15, 23, 42, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.7rem' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <strong style={{ fontSize: '0.82rem', color: 'var(--color-text-primary, #0f172a)' }}>
              {formatOrderId(order?.id)}
            </strong>
            <span style={{
              padding: '0.16rem 0.42rem',
              borderRadius: '999px',
              fontSize: '0.64rem',
              fontWeight: 800,
              background: paid ? '#ecfdf5' : '#fff7ed',
              color: paid ? '#047857' : '#c2410c'
            }}>
              {paid ? 'PAID' : 'UNPAID'}
            </span>
            {rush && (
              <span style={{
                padding: '0.16rem 0.42rem',
                borderRadius: '999px',
                fontSize: '0.64rem',
                fontWeight: 900,
                background: '#ffedd5',
                color: '#c2410c'
              }}>
                RUSH
              </span>
            )}
          </div>
          <div style={{
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--color-text-primary, #0f172a)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </div>
          <div style={{
            marginTop: '0.28rem',
            fontSize: '0.74rem',
            color: 'var(--text-muted, #64748b)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {client}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {price && <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>{price}</div>}
          <div style={{ marginTop: '0.25rem', fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
            {formatShortTime(order?.createdAt || order?.created_at)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginTop: '0.8rem' }}>
        <span style={{
          minWidth: 0,
          fontSize: '0.7rem',
          fontWeight: 800,
          color: status === 'revision' ? '#b45309' : '#475569',
          textTransform: 'capitalize'
        }}>
          {getStatusLabel(order)}
        </span>
        <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
          {canStart && (
            <button
              type="button"
              onClick={() => onStart(order)}
              disabled={isStarting}
              style={{
                border: '1px solid #fed7aa',
                background: '#fff7ed',
                color: '#c2410c',
                borderRadius: '9px',
                padding: '0.48rem 0.7rem',
                fontSize: '0.72rem',
                fontWeight: 900,
                cursor: isStarting ? 'wait' : 'pointer'
              }}
            >
              {isStarting ? 'Starting…' : 'Start'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpen(order)}
            style={{
              border: 0,
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '9px',
              padding: '0.5rem 0.72rem',
              fontSize: '0.72rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {FINISHED_STATUSES.has(status) ? 'Open' : 'Open / Deliver'}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MobileAdminConsole() {
  const navigate = useNavigate();
  const {
    orders = [],
    notifications = [],
    unreadNotificationsCount = 0,
    authUser,
    refreshOrders,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    openOrderTrackerDrawer,
    updateOrderStatus,
    logout,
    setCurrentView,
    siteSettings = {}
  } = useAppState();

  const [activeTab, setActiveTab] = useState('home');
  const [orderFilter, setOrderFilter] = useState('new');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startingOrderId, setStartingOrderId] = useState(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const loadChatUnread = useCallback(async (force = false) => {
    try {
      const counts = await fetchChatUnreadCounts({
        email: authUser?.email || '',
        isAdmin: true,
        force
      });
      setChatUnreadCount(Number(counts?.total || 0));
    } catch {}
  }, [authUser?.email]);

  useEffect(() => {
    document.body.classList.add('mobile-admin-console-active');
    return () => document.body.classList.remove('mobile-admin-console-active');
  }, []);

  useEffect(() => {
    if (setCurrentView) setCurrentView('admin');

    refreshOrders?.({ force: true });
    refreshNotifications?.(authUser?.email || null, true);
    loadChatUnread(true);
  }, [authUser?.email, loadChatUnread, refreshNotifications, refreshOrders, setCurrentView]);

  useEffect(() => {
    const unsubscribeMessages = subscribeToChatMessages(payload => {
      const message = payload?.new || payload?.record;
      if (message?.sender === 'client') {
        playMessageChimeForMessage(message.id, false, { role: 'admin', isAdmin: true });
      }
      loadChatUnread(true);
    });
    const unsubscribeConversations = subscribeToConversations(() => loadChatUnread(true));

    return () => {
      unsubscribeMessages?.();
      unsubscribeConversations?.();
    };
  }, [loadChatUnread]);

  const handleIdleExpired = useCallback(() => {
    navigate('/secure-admin-login?reason=idle', { replace: true });
  }, [navigate]);

  useAdminIdleSession({
    enabled: Boolean(authUser?.role === 'admin'),
    timeoutValue: siteSettings?.sessionTimeout || '30m',
    logout,
    onExpired: handleIdleExpired
  });

  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);
  const newOrders = useMemo(
    () => safeOrders.filter(order => NEW_STATUSES.has(normalizeStatus(order)) && normalizeStatus(order) !== 'cancelled'),
    [safeOrders]
  );
  const paidNewOrders = useMemo(() => newOrders.filter(isOrderPaid), [newOrders]);
  const activeOrders = useMemo(
    () => safeOrders.filter(order => ACTIVE_STATUSES.has(normalizeStatus(order))),
    [safeOrders]
  );
  const revisionOrders = useMemo(
    () => safeOrders.filter(order => normalizeStatus(order) === 'revision'),
    [safeOrders]
  );
  const deliveredOrders = useMemo(
    () => safeOrders.filter(order => FINISHED_STATUSES.has(normalizeStatus(order))),
    [safeOrders]
  );
  const priorityOrders = useMemo(() => {
    return safeOrders
      .filter(order => {
        const status = normalizeStatus(order);
        return status === 'revision' || status === 'qc' || (NEW_STATUSES.has(status) && isOrderPaid(order)) || isRushOrder(order);
      })
      .sort((a, b) => new Date(b?.createdAt || b?.created_at || 0).getTime() - new Date(a?.createdAt || a?.created_at || 0).getTime())
      .slice(0, 4);
  }, [safeOrders]);

  const visibleOrders = useMemo(() => {
    if (orderFilter === 'active') return [...revisionOrders, ...activeOrders];
    if (orderFilter === 'delivered') return deliveredOrders;
    return newOrders;
  }, [activeOrders, deliveredOrders, newOrders, orderFilter, revisionOrders]);

  const sortedNotifications = useMemo(() => {
    return [...(Array.isArray(notifications) ? notifications : [])]
      .sort((a, b) => new Date(b?.created_at || b?.timestamp || 0).getTime() - new Date(a?.created_at || a?.timestamp || 0).getTime())
      .slice(0, 40);
  }, [notifications]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshOrders?.({ force: true }),
        refreshNotifications?.(authUser?.email || null, true),
        loadChatUnread(true)
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [authUser?.email, isRefreshing, loadChatUnread, refreshNotifications, refreshOrders]);

  const handleOpenOrder = useCallback((order) => {
    if (setCurrentView) setCurrentView('admin');
    openOrderTrackerDrawer?.(order);
  }, [openOrderTrackerDrawer, setCurrentView]);

  const handleStartOrder = useCallback(async (order) => {
    if (!order?.id || !isOrderPaid(order)) return;
    const confirmed = window.confirm(`Start production for ${formatOrderId(order.id)}?`);
    if (!confirmed) return;

    setStartingOrderId(String(order.id));
    try {
      await updateOrderStatus?.(order.id, 'in_progress', {
        paymentStatus: 'paid',
        payment_status: 'paid'
      });
      await refreshOrders?.({ force: true });
    } finally {
      setStartingOrderId(null);
    }
  }, [refreshOrders, updateOrderStatus]);

  const handleNotificationOpen = useCallback((notification) => {
    if (notification?.id) markNotificationAsRead?.(notification.id);
    const orderId = notification?.order_id || notification?.orderId;
    if (orderId) {
      const found = safeOrders.find(order => String(order?.id || '').replace(/^#+/, '') === String(orderId).replace(/^#+/, ''));
      handleOpenOrder(found || orderId);
    }
  }, [handleOpenOrder, markNotificationAsRead, safeOrders]);

  const handleLogout = useCallback(async () => {
    await logout?.();
    navigate('/secure-admin-login', { replace: true });
  }, [logout, navigate]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'orders', label: 'Orders', icon: ClipboardList, badge: paidNewOrders.length + revisionOrders.length },
    { id: 'chat', label: 'Chat', icon: MessageSquare, badge: chatUnreadCount },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadNotificationsCount }
  ];

  return (
    <div className="mobile-admin-console" style={{
      width: '100%',
      minHeight: '100svh',
      background: 'var(--bg-main, #f8fafc)',
      color: 'var(--color-text-primary, #0f172a)',
      paddingBottom: 'calc(78px + env(safe-area-inset-bottom, 0px))'
    }}>
      <style>{`
        @media (max-width: 900px) {
          body.mobile-admin-console-active .website-header-zone {
            display: none !important;
          }
          body.mobile-admin-console-active .website-main-zone {
            min-height: 100svh !important;
          }
        }
      `}</style>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(15, 23, 42, 0.97)',
        color: '#ffffff',
        padding: 'calc(0.8rem + env(safe-area-inset-top, 0px)) 0.9rem 0.8rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <span style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              flexShrink: 0
            }}>
              <ShieldCheck size={21} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 900 }}>Mobile Admin</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {authUser?.email || 'Secure operations'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh mobile admin data"
              style={{ width: '38px', height: '38px', borderRadius: '11px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', display: 'grid', placeItems: 'center' }}
            >
              <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              style={{ width: '38px', height: '38px', borderRadius: '11px', border: '1px solid #7f1d1d', background: '#450a0a', color: '#fecaca', display: 'grid', placeItems: 'center' }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: activeTab === 'chat' ? '0.75rem 0.55rem' : '0.9rem'
      }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <section>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
                Today at a glance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.65rem' }}>
                <MobileMetric label="New paid" value={paidNewOrders.length} icon={PackageCheck} onClick={() => { setOrderFilter('new'); setActiveTab('orders'); }} />
                <MobileMetric label="Active" value={activeOrders.length} icon={Clock3} accent="#2563eb" onClick={() => { setOrderFilter('active'); setActiveTab('orders'); }} />
                <MobileMetric label="Revisions" value={revisionOrders.length} icon={RotateCcw} accent="#b45309" onClick={() => { setOrderFilter('active'); setActiveTab('orders'); }} />
                <MobileMetric label="Unread chat" value={chatUnreadCount} icon={MessageSquare} accent="#7c3aed" onClick={() => setActiveTab('chat')} />
              </div>
            </section>

            <section style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '18px',
              padding: '1rem',
              color: '#ffffff',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '0.9rem',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 800 }}>MOBILE OPERATIONS</div>
                <div style={{ marginTop: '0.28rem', fontSize: '0.92rem', fontWeight: 900 }}>
                  Orders, chat, alerts & deliveries only
                </div>
                <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  Full settings, CMS, staff tools and reporting stay on desktop.
                </div>
              </div>
              <Zap size={28} color="#fb923c" />
            </section>

            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 900 }}>Priority work</div>
                <button type="button" onClick={() => { setOrderFilter('active'); setActiveTab('orders'); }} style={{ border: 0, background: 'none', color: '#ea580c', fontSize: '0.72rem', fontWeight: 900 }}>
                  View orders
                </button>
              </div>
              {priorityOrders.length === 0 ? (
                <div style={{ padding: '1.1rem', textAlign: 'center', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '14px', color: 'var(--text-muted, #64748b)', fontSize: '0.78rem' }}>
                  No urgent order action right now.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {priorityOrders.map(order => (
                    <MobileOrderCard
                      key={order.id}
                      order={order}
                      onOpen={handleOpenOrder}
                      onStart={handleStartOrder}
                      isStarting={String(startingOrderId) === String(order.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'orders' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900 }}>Orders</div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
                  Receive, start, review and deliver from your phone.
                </div>
              </div>
              <Truck size={22} color="#ea580c" />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.4rem',
              marginBottom: '0.75rem',
              background: 'var(--bg-card, #ffffff)',
              padding: '0.35rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color, #e2e8f0)'
            }}>
              {[
                { id: 'new', label: `New ${newOrders.length}` },
                { id: 'active', label: `Work ${activeOrders.length + revisionOrders.length}` },
                { id: 'delivered', label: `Done ${deliveredOrders.length}` }
              ].map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setOrderFilter(filter.id)}
                  style={{
                    border: 0,
                    borderRadius: '9px',
                    padding: '0.55rem 0.25rem',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    background: orderFilter === filter.id ? '#0f172a' : 'transparent',
                    color: orderFilter === filter.id ? '#ffffff' : 'var(--text-muted, #64748b)'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {visibleOrders.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted, #64748b)', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '16px' }}>
                <CheckCircle2 size={28} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>Nothing in this queue.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {visibleOrders.map(order => (
                  <MobileOrderCard
                    key={order.id}
                    order={order}
                    onOpen={handleOpenOrder}
                    onStart={handleStartOrder}
                    isStarting={String(startingOrderId) === String(order.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'chat' && (
          <section style={{
            height: 'calc(100svh - 72px - 78px - env(safe-area-inset-top, 0px) - 1.5rem)',
            minHeight: '520px',
            maxHeight: '760px'
          }}>
            <AdminChatInbox compactMobile initialChannel="inbox" />
          </section>
        )}

        {activeTab === 'alerts' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900 }}>Notifications</div>
                <div style={{ marginTop: '0.2rem', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
                  Order and studio alerts only.
                </div>
              </div>
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsAsRead?.()}
                  style={{ border: 0, background: 'none', color: '#ea580c', fontSize: '0.7rem', fontWeight: 900 }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {sortedNotifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted, #64748b)', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '16px' }}>
                <Bell size={28} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>No notifications yet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {sortedNotifications.map(notification => {
                  const unread = !notification?.read && !notification?.is_read;
                  const hasOrder = Boolean(notification?.order_id || notification?.orderId);
                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => handleNotificationOpen(notification)}
                      style={{
                        width: '100%',
                        border: unread ? '1.5px solid #fb923c' : '1px solid var(--border-color, #e2e8f0)',
                        background: unread ? '#fff7ed' : 'var(--bg-card, #ffffff)',
                        borderRadius: '14px',
                        padding: '0.8rem',
                        textAlign: 'left',
                        display: 'flex',
                        gap: '0.65rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <span style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        background: unread ? '#ffedd5' : '#f1f5f9',
                        color: unread ? '#c2410c' : '#64748b'
                      }}>
                        <Bell size={16} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: unread ? 900 : 800, color: 'var(--color-text-primary, #0f172a)' }}>
                          {notification?.title || 'Notification'}
                        </span>
                        {notification?.message && (
                          <span style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.7rem', lineHeight: 1.4, color: 'var(--text-muted, #64748b)' }}>
                            {notification.message}
                          </span>
                        )}
                        <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.64rem', color: '#94a3b8', fontWeight: 700 }}>
                          {formatShortTime(notification?.created_at || notification?.timestamp)}{hasOrder ? ' • Tap to open order' : ''}
                        </span>
                      </span>
                      {hasOrder && <ChevronRight size={16} color="#94a3b8" style={{ flexShrink: 0, marginTop: '0.25rem' }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <nav
        aria-label="Mobile admin navigation"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: 0,
          zIndex: 40,
          width: '100%',
          maxWidth: '680px',
          padding: '0.45rem 0.55rem calc(0.45rem + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(255,255,255,0.97)',
          borderTop: '1px solid #e2e8f0',
          backdropFilter: 'blur(14px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '0.25rem'
        }}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              style={{
                position: 'relative',
                border: 0,
                background: active ? '#fff7ed' : 'transparent',
                color: active ? '#ea580c' : '#64748b',
                borderRadius: '12px',
                padding: '0.5rem 0.2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.62rem',
                fontWeight: 900
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon size={19} />
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-7px',
                    right: '-10px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 900,
                    lineHeight: 1
                  }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
