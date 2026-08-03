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
  PlusCircle
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
  onOpenDepositModal,
  onOpenLiveSupport,
  onLogout
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveUser = mounted ? activeUser : null;
  const userName = effectiveUser?.name || 'Sarah Jenkins';
  const userCompany = effectiveUser?.company || 'Apex Athletics Apparel';
  const userInitial = (userName[0] || 'S').toUpperCase();
  const displayWallet = mounted ? walletBalance : 150.00;

  const sections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard
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
    },
    {
      title: 'SUPPORT & ASSISTANCE',
      items: [
        { 
          id: 'support', 
          label: 'Live Support Chat', 
          icon: MessageSquare, 
          liveDot: true 
        }
      ]
    }
  ];

  return (
    <aside
      className="client-sidebar-saas"
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.15rem 0.85rem',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
        position: 'sticky',
        top: '90px',
        height: 'calc(100vh - 110px)',
        maxHeight: 'calc(100vh - 110px)',
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
            padding: '0.95rem 0.85rem',
            background: 'linear-gradient(135deg, var(--navy-950) 0%, #0f172a 100%)',
            borderRadius: '12px',
            color: '#ffffff',
            marginBottom: '1.15rem',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.18)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--orange-500), #e66e00)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.1rem',
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
              flexShrink: 0
            }}>
              {userInitial}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userName}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userCompany}
              </div>
            </div>
          </div>

          {/* Wallet Credit Box */}
          <div style={{ 
            display: 'flex', 
            justify: 'space-between', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.08)', 
            padding: '0.4rem 0.65rem', 
            borderRadius: '8px', 
            fontSize: '0.73rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Wallet size={13} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
              <span style={{ color: '#cbd5e1' }}>Wallet Credit:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <strong style={{ color: 'var(--orange-400)', fontWeight: 800 }}>${displayWallet.toFixed(2)}</strong>
              {onOpenDepositModal && (
                <button
                  type="button"
                  onClick={onOpenDepositModal}
                  style={{
                    background: 'var(--orange-500)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.15rem 0.35rem',
                    fontSize: '0.625rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                  title="Add Funds"
                >
                  <PlusCircle size={10} style={{ flexShrink: 0 }} /> Add
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        {sections.map((sec, secIdx) => (
          <div key={secIdx} style={{ marginBottom: secIdx === sections.length - 1 ? 0 : '1.15rem' }}>
            <div style={{
              fontSize: '0.675rem',
              fontWeight: 800,
              color: 'var(--orange-600)',
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
                      border: isActive ? '1.5px solid #ff7a00' : '1px solid transparent',
                      background: isActive 
                        ? 'rgba(255, 122, 0, 0.12)' 
                        : 'transparent',
                      color: isActive ? '#ff7a00' : '#475569',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <IconComp size={16} style={{ color: isActive ? '#ff7a00' : '#64748b', flexShrink: 0 }} />
                      <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        background: isActive ? '#ff7a00' : 'var(--navy-100)', 
                        color: isActive ? '#ffffff' : 'var(--navy-700)', 
                        padding: '0.1rem 0.45rem', 
                        borderRadius: '9999px',
                        flexShrink: 0
                      }}>
                        {item.badge}
                      </span>
                    )}

                    {item.liveDot && (
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

