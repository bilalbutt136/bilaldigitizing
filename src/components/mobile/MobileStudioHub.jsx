'use client';

import React from 'react';
import {
  ClipboardList,
  Headphones,
  MessageSquare,
  PlusCircle,
  Wallet
} from 'lucide-react';

export const MobileStudioHub = ({
  userName = 'Client',
  walletBalance = 0,
  activeOrdersCount = 0,
  unreadMessages = 0,
  unpaidOrdersCount = 0,
  isDark = false,
  onNewOrder,
  onOrders,
  onMessages,
  onWallet,
  onSupport
}) => {
  const firstName = String(userName || 'Client').trim().split(/\s+/)[0] || 'Client';
  const surface = isDark ? 'var(--color-surface, #111827)' : '#ffffff';
  const border = isDark ? 'var(--color-border, #334155)' : '#e2e8f0';
  const text = isDark ? 'var(--color-text-primary, #f8fafc)' : '#0f172a';
  const muted = isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b';

  const shortcuts = [
    {
      id: 'orders',
      label: 'My Orders',
      helper: activeOrdersCount > 0 ? `${activeOrdersCount} active now` : 'Track & download',
      icon: ClipboardList,
      badge: activeOrdersCount || null,
      onClick: onOrders
    },
    {
      id: 'messages',
      label: 'Messages',
      helper: unreadMessages > 0 ? `${unreadMessages} unread` : 'Inbox & offers',
      icon: MessageSquare,
      badge: unreadMessages || null,
      onClick: onMessages
    },
    {
      id: 'wallet',
      label: 'Wallet',
      helper: `$${Number(walletBalance || 0).toFixed(2)} balance`,
      icon: Wallet,
      badge: unpaidOrdersCount || null,
      onClick: onWallet
    },
    {
      id: 'support',
      label: 'Live Support',
      helper: 'Studio help 24/7',
      icon: Headphones,
      onClick: onSupport
    }
  ];

  return (
    <section
      aria-label="Studio quick actions"
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: '18px',
        padding: '0.9rem',
        boxShadow: isDark ? 'none' : '0 8px 24px rgba(15,23,42,0.05)'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #172033 100%)',
          borderRadius: '15px',
          padding: '0.9rem',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            right: '-42px',
            top: '-52px',
            background: 'rgba(16,185,129,0.13)'
          }}
        />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '0.66rem', fontWeight: 900, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Your Studio Hub
          </div>
          <div style={{ fontSize: '1.08rem', fontWeight: 900, marginTop: '0.15rem', letterSpacing: '-0.02em' }}>
            Hi {firstName}, what do you need today?
          </div>
          <div style={{ fontSize: '0.7rem', color: '#cbd5e1', lineHeight: 1.45, marginTop: '0.25rem' }}>
            Start new work or jump straight to an existing order, conversation, or balance.
          </div>
          <button
            type="button"
            onClick={onNewOrder}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              minHeight: '46px',
              border: 'none',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              fontSize: '0.84rem',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 5px 14px rgba(16,185,129,0.28)'
            }}
          >
            <PlusCircle size={18} /> Start a new order
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.65rem' }}>
        {shortcuts.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              style={{
                border: `1px solid ${border}`,
                borderRadius: '13px',
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                minHeight: '72px',
                padding: '0.65rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Icon size={17} style={{ color: '#059669' }} />
                {item.badge ? (
                  <span
                    style={{
                      minWidth: '19px',
                      height: '19px',
                      borderRadius: '999px',
                      padding: '0 4px',
                      background: item.id === 'wallet' ? '#fff7ed' : '#ecfdf5',
                      color: item.id === 'wallet' ? '#ea580c' : '#047857',
                      fontSize: '0.58rem',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: text }}>{item.label}</div>
                <div style={{ fontSize: '0.61rem', color: muted, marginTop: '0.08rem' }}>{item.helper}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MobileStudioHub;
