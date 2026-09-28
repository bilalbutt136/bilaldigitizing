'use client';

import React from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  Headphones,
  MessageSquare,
  PlusCircle,
  Sparkles,
  Wallet,
  Zap
} from 'lucide-react';
import { formatOrderId } from '../../context/StateContext';

export const CustomerMobileCommandCenter = ({
  activeUser,
  walletBalance = 0,
  activeOrders = [],
  completedOrders = [],
  unpaidOrders = [],
  unreadInboxCount = 0,
  unreadSupportCount = 0,
  unreadNotificationsCount = 0,
  isDark = false,
  onNewOrder,
  onOpenOrders,
  onOpenInbox,
  onOpenWallet,
  onOpenSupport,
  onOpenNotifications,
  onTrackOrder
}) => {
  const firstName = String(activeUser?.name || 'Client').trim().split(/\s+/)[0] || 'Client';
  const topOrder = activeOrders[0] || null;
  const messageCount = Number(unreadInboxCount || 0) + Number(unreadSupportCount || 0);

  const surface = isDark ? 'var(--color-surface, #111827)' : '#ffffff';
  const pageText = isDark ? 'var(--color-text-primary, #f8fafc)' : '#0f172a';
  const muted = isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b';
  const border = isDark ? 'var(--color-border, #334155)' : '#e2e8f0';

  const quickActions = [
    {
      id: 'orders',
      label: 'Track orders',
      helper: activeOrders.length ? `${activeOrders.length} active` : 'View all work',
      icon: ClipboardList,
      badge: activeOrders.length || null,
      onClick: onOpenOrders
    },
    {
      id: 'messages',
      label: 'Messages',
      helper: messageCount ? `${messageCount} unread` : 'Inbox & offers',
      icon: MessageSquare,
      badge: messageCount || null,
      onClick: onOpenInbox
    },
    {
      id: 'wallet',
      label: 'Wallet',
      helper: `$${Number(walletBalance || 0).toFixed(2)} available`,
      icon: Wallet,
      onClick: onOpenWallet
    },
    {
      id: 'support',
      label: 'Live support',
      helper: 'Studio team 24/7',
      icon: Headphones,
      badge: unreadSupportCount || null,
      onClick: onOpenSupport
    }
  ];

  return (
    <section className="mobile-only customer-mobile-command-center" style={{ marginBottom: '1rem' }}>
      <div
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #172033 58%, #1f2937 100%)',
          borderRadius: '20px',
          padding: '1rem',
          color: '#ffffff',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            right: '-55px',
            top: '-65px',
            background: 'rgba(249,115,22,0.14)'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fdba74', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Your production studio
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.15, marginTop: '0.18rem', letterSpacing: '-0.02em' }}>
                Welcome back, {firstName}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '0.3rem', lineHeight: 1.45 }}>
                Place an order, track production, message the studio, or manage your balance from one place.
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label="Open notifications"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '13px',
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    minWidth: '17px',
                    height: '17px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.56rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #0f172a'
                  }}
                >
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.72fr', gap: '0.55rem', marginTop: '0.95rem' }}>
            <button
              type="button"
              onClick={onNewOrder}
              style={{
                border: 'none',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                minHeight: '48px',
                padding: '0.7rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                fontSize: '0.86rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(234,88,12,0.3)'
              }}
            >
              <PlusCircle size={18} /> Start new order
            </button>
            <button
              type="button"
              onClick={onOpenOrders}
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                minHeight: '48px',
                padding: '0.7rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Orders <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.85rem',
          borderRadius: '16px',
          background: unpaidOrders.length > 0
            ? (isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed')
            : activeOrders.length > 0
              ? (isDark ? 'rgba(16,185,129,0.10)' : '#f0fdf4')
              : surface,
          border: unpaidOrders.length > 0
            ? '1px solid rgba(249,115,22,0.35)'
            : activeOrders.length > 0
              ? '1px solid rgba(16,185,129,0.28)'
              : `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: unpaidOrders.length > 0 ? '#f97316' : activeOrders.length > 0 ? '#10b981' : '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {unpaidOrders.length > 0 ? <Wallet size={19} /> : activeOrders.length > 0 ? <Zap size={19} /> : <Sparkles size={19} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.76rem', fontWeight: 900, color: pageText }}>
            {unpaidOrders.length > 0
              ? `${unpaidOrders.length} order${unpaidOrders.length > 1 ? 's' : ''} waiting for payment`
              : activeOrders.length > 0
                ? `${activeOrders.length} order${activeOrders.length > 1 ? 's' : ''} currently in production`
                : 'Ready for your first studio order'}
          </div>
          <div style={{ fontSize: '0.68rem', color: muted, marginTop: '0.1rem', lineHeight: 1.35 }}>
            {unpaidOrders.length > 0
              ? 'Complete payment to move production forward.'
              : topOrder
                ? `${formatOrderId(topOrder.id)} • ${topOrder.title || 'Production order'}`
                : 'Upload artwork and choose your service in a few guided steps.'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (topOrder && unpaidOrders.length === 0 && typeof onTrackOrder === 'function') onTrackOrder(topOrder);
            else if (unpaidOrders.length > 0) onOpenOrders?.();
            else onNewOrder?.();
          }}
          style={{
            border: 'none',
            background: 'transparent',
            color: unpaidOrders.length > 0 ? '#ea580c' : activeOrders.length > 0 ? '#059669' : '#f97316',
            fontWeight: 900,
            fontSize: '0.72rem',
            padding: '0.4rem',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {unpaidOrders.length > 0 ? 'Pay / view' : activeOrders.length > 0 ? 'Track' : 'Start'}
        </button>
      </div>

      <div style={{ marginTop: '0.9rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 900, color: muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Quick access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                style={{
                  minHeight: '78px',
                  border: `1px solid ${border}`,
                  borderRadius: '15px',
                  background: surface,
                  padding: '0.75rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: isDark ? 'none' : '0 2px 8px rgba(15,23,42,0.035)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Icon size={18} style={{ color: '#f97316' }} />
                  {action.badge ? (
                    <span style={{ minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '999px', background: '#fff7ed', color: '#ea580c', fontSize: '0.62rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {action.badge}
                    </span>
                  ) : null}
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 900, color: pageText }}>{action.label}</div>
                  <div style={{ fontSize: '0.65rem', color: muted, marginTop: '0.08rem' }}>{action.helper}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', marginTop: '0.8rem' }}>
        {[
          { label: 'Active', value: activeOrders.length, icon: Zap },
          { label: 'Completed', value: completedOrders.length, icon: CheckCircle2 },
          { label: 'Balance', value: `$${Number(walletBalance || 0).toFixed(0)}`, icon: Wallet }
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{ border: `1px solid ${border}`, borderRadius: '13px', background: surface, padding: '0.6rem 0.45rem', textAlign: 'center' }}>
              <Icon size={15} style={{ color: '#f97316', marginBottom: '0.2rem' }} />
              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: pageText }}>{item.value}</div>
              <div style={{ fontSize: '0.58rem', color: muted, fontWeight: 700, marginTop: '0.06rem' }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {activeOrders.length === 0 && completedOrders.length === 0 && (
        <div style={{ marginTop: '0.85rem', background: surface, border: `1px solid ${border}`, borderRadius: '16px', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: pageText }}>How your first order works</div>
          <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.65rem' }}>
            {[
              ['1', 'Upload artwork', 'Send your logo or design and choose the service.'],
              ['2', 'Studio production', 'Track progress and message the team from your phone.'],
              ['3', 'Download files', 'Receive your production-ready files when completed.']
            ].map(([step, title, copy]) => (
              <div key={step} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '8px', background: '#fff7ed', color: '#ea580c', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step}</div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 900, color: pageText }}>{title}</div>
                  <div style={{ fontSize: '0.65rem', color: muted, lineHeight: 1.4, marginTop: '0.05rem' }}>{copy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default CustomerMobileCommandCenter;
