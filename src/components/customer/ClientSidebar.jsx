'use client';

import React from 'react';
import { 
  LayoutDashboard,
  Layers, 
  PenTool,
  Package, 
  User, 
  MessageSquare, 
  Settings, 
  LogOut, 
  Wallet,
  PlusCircle,
  Bell,
  ClipboardList,
  Headphones
} from 'lucide-react';

export const ClientSidebar = ({
  activeTab,
  setActiveTab,
  activeUser,
  walletBalance = 0,
  digitizingCount = 0,
  vectorCount = 0,
  patchCount = 0,
  _storeCount = 0,
  unreadChatCount = 0,
  unreadNotifCount = 0,
  unpaidCount = 0,
  onOpenDepositModal,
  onOpenLiveSupport,
  onLogout
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const displayWallet = Number(walletBalance) || 0;
  const userName = activeUser?.name || 'Customer Account';
  const userCompany = activeUser?.company || 'Studio Client';
  const userInitial = (userName[0] || 'C').toUpperCase();

  const sections = [
    {
      title: 'WORKSPACE',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
        },
        {
          id: 'orders',
          label: 'My Orders',
          icon: ClipboardList,
          badge: (digitizingCount + vectorCount + patchCount) > 0 ? (digitizingCount + vectorCount + patchCount) : null
        },
        { 
          id: 'support', 
          label: 'Inbox', 
          icon: MessageSquare, 
          badge: unreadChatCount > 0 ? unreadChatCount : null,
          liveDot: true 
        },
        { 
          id: 'help-support', 
          label: 'Customer Support', 
          icon: Headphones, 
          badge: null
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          badge: unreadNotifCount > 0 ? unreadNotifCount : null,
          isUnread: unreadNotifCount > 0
        }
      ]
    },
    {
      title: 'DIGITAL STUDIO SERVICES',
      items: [
        { 
          id: 'digitizing', 
          label: 'Embroidery Digitizing', 
          icon: Layers, 
          badge: digitizingCount 
        },
        { 
          id: 'vector', 
          label: 'Vector Art Conversion', 
          icon: PenTool, 
          badge: vectorCount 
        },
        { 
          id: 'patches', 
          label: 'Custom Patches & Goods', 
          icon: Package, 
          badge: patchCount 
        }
      ]
    },
    {
      title: 'ACCOUNT & MANAGEMENT',
      items: [
        { id: 'profile', label: 'Account & Profile', icon: User },
        { id: 'settings', label: 'Preferences & Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside
      className="client-sidebar-saas"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.15rem 0.85rem',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: '90px',
        height: (activeTab === 'support' || activeTab === 'help-support') ? '100%' : 'calc(100vh - 110px)',
        maxHeight: (activeTab === 'support' || activeTab === 'help-support') ? '100%' : 'calc(100vh - 110px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      <div 
        style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflowY: 'auto', 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch',
          paddingRight: '0.15rem'
        }}
      >
        {/* User Header Profile Card */}
        <div
          style={{
            padding: '1rem 0.9rem',
            background: 'linear-gradient(135deg, #0d1322 0%, #1a2238 100%)',
            borderRadius: '14px',
            color: '#ffffff',
            marginBottom: '1.15rem',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.28)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              color: 'var(--color-text-on-primary, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.15rem',
              boxShadow: '0 4px 14px var(--color-primary-glow)',
              flexShrink: 0
            }}>
              {userInitial}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
                {userName}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userCompany}
              </div>
            </div>
          </div>

          {/* Wallet Credit Box — Perfectly Fitted & High Contrast */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.07)', 
            padding: '0.4rem 0.55rem', 
            borderRadius: '9px', 
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '0.74rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
              <Wallet size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>Wallet:</span>
              <strong style={{ 
                color: '#34d399', 
                fontWeight: 900, 
                fontSize: '0.82rem',
                letterSpacing: '-0.01em',
                background: 'rgba(52, 211, 153, 0.14)',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                ${displayWallet.toFixed(2)}
              </strong>
            </div>

            {onOpenDepositModal && (
              <button
                type="button"
                onClick={onOpenDepositModal}
                style={{
                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                  color: 'var(--color-text-on-primary, #ffffff)',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '0.2rem 0.45rem',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px var(--color-primary-glow)',
                  transition: 'all 0.15s ease'
                }}
                title="Add Funds"
              >
                <PlusCircle size={10} style={{ flexShrink: 0 }} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Navigation Sections */}
        {sections.map((sec, secIdx) => (
          <div key={secIdx} style={{ marginBottom: secIdx === sections.length - 1 ? 0 : '1.15rem' }}>
            <div style={{
              fontSize: '0.675rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '0.25rem 0.75rem',
              marginBottom: '0.35rem'
            }}>
              {sec.title}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {sec.items.map(item => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id === 'support' && onOpenLiveSupport) {
                        onOpenLiveSupport();
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: isActive ? '1.5px solid var(--color-primary)' : '1px solid transparent',
                      background: isActive 
                        ? 'var(--color-primary-light)' 
                        : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <IconComp size={16} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== '0' && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        background: item.badgeColor || (item.id === 'support' ? '#ef4444' : (isActive ? 'var(--color-primary)' : 'var(--color-primary-light)')), 
                        color: (item.badgeColor || item.id === 'support' || isActive) ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-primary)', 
                        padding: '0.1rem 0.45rem', 
                        borderRadius: '9999px',
                        flexShrink: 0
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {item.liveDot && (!item.badge || item.badge <= 0) && (
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: '#10b981',
                        boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                        flexShrink: 0
                      }} title="Studio Live 24/7" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Sign Out Action */}
      <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(220, 38, 38, 0.2)',
            background: 'rgba(220, 38, 38, 0.06)',
            color: '#dc2626',
            fontWeight: 700,
            fontSize: '0.825rem',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>Sign Out Account</span>
        </button>
      </div>
    </aside>
  );
};

