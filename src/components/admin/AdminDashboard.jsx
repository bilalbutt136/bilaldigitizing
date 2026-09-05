'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { OrderManagementTable } from './OrderManagementTable';
import { ClientDirectory } from './ClientDirectory';
import { StudioServicesManager } from './StudioServicesManager';
import { SystemSettingsManager } from './SystemSettingsManager';

import { AdminChatInbox } from './AdminChatInbox';
import { AdminExecutiveDashboard } from './AdminExecutiveDashboard';
import { PromotionsManager } from './PromotionsManager';
import { ContactInfoManager } from './ContactInfoManager';
import { PortfolioManager } from './PortfolioManager';
import { fetchConversations, subscribeToLiveMessages, getAdminThreadUnreadCount } from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase/client';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Sliders, 
  Users, 
  MessageSquare, 
  Image, 
  Settings, 
  LogOut, 
  TrendingUp,
  Layers, 
  AlertCircle, 
  RefreshCw,
  Menu,
  X,
  DollarSign,
  Phone,
  Type,
  LayoutTemplate,
  Palette,
  Megaphone,
  ShieldCheck,
  Building2,
  Mail
} from 'lucide-react';

export const AdminDashboard = () => {
  const { 
    orders = [], 
    clients = [], 
    portfolioSamples = [],
    setIsPricingSettingsOpen,
    resetAllData,
    authUser,
    isAuthenticated,
    protectedNavigate,
    logout,
    siteSettings = {},
    activeAdminTab = 'dashboard',
    setActiveAdminTab,
    openOrderTrackerDrawer,
    setSelectedOrderForDrawer,
    showToast,
    refreshOrders,
    refreshClients
  } = useAppState();

  const [activeTabState, setActiveTabState] = useState(activeAdminTab || 'dashboard');
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);

  React.useEffect(() => {
    if (activeAdminTab) {
      setActiveTabState(activeAdminTab);
    }
  }, [activeAdminTab]);

  const activeTab = activeTabState;
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (setActiveAdminTab) setActiveAdminTab(tab);
  };
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [mounted, setMounted] = React.useState(false);
  const initialTrackSyncedRef = React.useRef(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && !initialTrackSyncedRef.current) {
      initialTrackSyncedRef.current = true;
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const trackId = urlParams.get('trackOrder') || urlParams.get('orderId');
      if (tabParam) {
        setActiveTab(tabParam === 'inbox' ? 'chat' : tabParam);
      }
      if (trackId) {
        if (openOrderTrackerDrawer) {
          openOrderTrackerDrawer(trackId);
        } else if (setSelectedOrderForDrawer) {
          const cleanTrackId = String(trackId).trim().replace(/^#+/, '');
          const found = (orders || []).find(o => {
            const oClean = String(o?.id || '').trim().replace(/^#+/, '');
            return oClean === cleanTrackId || String(o?.id) === String(trackId);
          });
          setSelectedOrderForDrawer(found || { id: `#${cleanTrackId}`, title: `Order #${cleanTrackId}`, status: 'in_progress' });
        }
      }
    }
  }, []);

  // Real-time unread messages calculator for Admin Desk
  React.useEffect(() => {
    if (!mounted) return;
    let isMounted = true;

    const loadAdminUnreadCount = async () => {
      if (isSupabaseConfigured) {
        try {
          const convs = await fetchConversations();
          if (convs && isMounted) {
            let totalUnread = 0;
            convs.forEach(c => {
              totalUnread += getAdminThreadUnreadCount(c);
            });
            setAdminUnreadCount(totalUnread);
          }
        } catch { }
      }
    };

    loadAdminUnreadCount();

    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (record && (record.sender === 'client' || record.sender === 'customer' || record.sender !== 'admin')) {
          loadAdminUnreadCount();
        }
      },
      (convPayload) => {
        if (!isMounted) return;
        loadAdminUnreadCount();
      }
    );

    const handleReadSync = () => {
      if (isMounted) loadAdminUnreadCount();
    };
    const handleOpenOrderChat = () => {
      setActiveTab('chat');
    };
    const handleAdminTabSwitch = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab === 'inbox' ? 'chat' : e.detail.tab);
      }
      if (e.detail?.orderId) {
        if (openOrderTrackerDrawer) {
          openOrderTrackerDrawer(e.detail.orderId);
        } else if (setSelectedOrderForDrawer) {
          const cleanId = String(e.detail.orderId).trim().replace(/^#+/, '');
          const found = (orders || []).find(o => {
            const oClean = String(o?.id || '').trim().replace(/^#+/, '');
            return oClean === cleanId || o?.id === e.detail.orderId;
          });
          setSelectedOrderForDrawer(found || { id: `#${cleanId}`, title: `Order #${cleanId}`, status: 'in_progress' });
        }
      }
    };

    window.addEventListener('bdigi_read_update', handleReadSync);
    window.addEventListener('bdigi_open_order_chat', handleOpenOrderChat);
    window.addEventListener('bdigi_switch_admin_tab', handleAdminTabSwitch);
    window.addEventListener('bdigi_switch_tab', handleAdminTabSwitch);

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('bdigi_read_update', handleReadSync);
      window.removeEventListener('bdigi_open_order_chat', handleOpenOrderChat);
      window.removeEventListener('bdigi_switch_admin_tab', handleAdminTabSwitch);
      window.removeEventListener('bdigi_switch_tab', handleAdminTabSwitch);
    };
  }, [mounted, orders, openOrderTrackerDrawer, setSelectedOrderForDrawer]);

  const configuredAdminEmail = (siteSettings?.adminEmail || authUser?.email || '').toLowerCase().trim();
  const isMasterAdmin = mounted && isAuthenticated && authUser?.role === 'admin';

  // Ensure live orders & client directory are freshly synchronized upon accessing Operations Desk
  React.useEffect(() => {
    if (mounted && isMasterAdmin) {
      if (refreshOrders) refreshOrders();
      if (refreshClients) refreshClients();
    }
  }, [mounted, isMasterAdmin]);

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 73px)',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <RefreshCw size={20} className="spin-icon" style={{ color: 'var(--orange-500)' }} />
          <span>Authenticating Operations Desk...</span>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="container py-12" style={{ maxWidth: '540px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px solid #fca5a5', background: '#fff1f2' }}>
          <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
          <h3 style={{ color: '#991b1b', fontSize: '1.35rem', marginBottom: '0.5rem' }}>System Access Restricted</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--navy-900)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            The Operations Desk is strictly restricted to Master Administrator <strong>{configuredAdminEmail}</strong>.
          </p>
          <button 
            className="btn btn-primary-orange btn-lg"
            style={{ width: '100%' }}
            onClick={() => protectedNavigate('customer')}
          >
            Return to Client Portal
          </button>
        </div>
      </div>
    );
  }

  // Calculations & KPI metrics with safe fallbacks
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeClients = Array.isArray(clients) ? clients : [];
  const safePortfolio = Array.isArray(portfolioSamples) ? portfolioSamples : [];

  const totalRevenue = safeOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);
  const activeJobsCount = safeOrders.filter(o => o?.status !== 'completed').length;
  const completedJobsCount = safeOrders.filter(o => o?.status === 'completed').length;

  const handleSignOut = () => {
    logout();
    protectedNavigate('public');
    showToast('Signed out of Admin Operations Portal', 'info');
  };

  // Streamlined Essential Sidebar Menu Sections
  const menuSections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders & Production', icon: ClipboardList, badge: activeJobsCount },
        { id: 'clients', label: 'Accounts & Wallets', icon: Users, badge: safeClients.length },
        { 
          id: 'chat', 
          label: 'Messages', 
          icon: MessageSquare, 
          badge: adminUnreadCount > 0 ? adminUnreadCount : null,
          isUnread: adminUnreadCount > 0
        }
      ]
    },
    {
      title: 'SERVICES & PRICING',
      items: [
        { id: 'services', label: 'Service Rates & Tiers', icon: Sliders }
      ]
    },
    {
      title: 'STUDIO CONTENT & GALLERY',
      items: [
        { id: 'portfolio', label: 'Portfolio Gallery', icon: Image, badge: safePortfolio.length },
        { id: 'promotions', label: 'Promotions', icon: TrendingUp },
        { id: 'contact', label: 'Contact Info', icon: Phone }
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { id: 'settings-theme', label: 'Theme & Brand Engine', icon: Palette },
        { id: 'settings-meta', label: 'Meta Pixel & SEO', icon: Megaphone },
        { id: 'settings-admin', label: 'Admin Team & Security', icon: ShieldCheck },
        { id: 'settings-email', label: 'Email & Alert Routing', icon: Mail },
        { id: 'settings-general', label: 'Studio Profile & Defaults', icon: Building2 },
        { id: 'signout', label: 'Sign Out', icon: LogOut, danger: true }
      ]
    }
  ];

  return (
    <div className="admin-portal-wrapper" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 114px)', maxHeight: 'calc(100vh - 114px)', minHeight: 'calc(100vh - 114px)', background: 'var(--bg-main)', position: 'relative', width: '100%', overflow: 'hidden' }}>
      
      {/* Desktop Independent Layout Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .admin-portal-wrapper {
            height: calc(100vh - 114px) !important;
            max-height: calc(100vh - 114px) !important;
            overflow: hidden !important;
          }
          .admin-portal-body {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .admin-sidebar-fixed {
            width: 255px !important;
            min-width: 255px !important;
            max-width: 255px !important;
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .admin-main-content {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            scroll-behavior: smooth;
          }
          .admin-main-content.chat-mode {
            padding: 0.65rem 1.25rem 0.85rem !important;
            overflow: hidden !important;
          }
        }
        /* Custom scrollbar for sidebar & main content */
        .admin-sidebar-fixed::-webkit-scrollbar {
          width: 5px;
        }
        .admin-sidebar-fixed::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-sidebar-fixed::-webkit-scrollbar-thumb {
          background: var(--color-border, rgba(0,0,0,0.1));
          border-radius: 4px;
        }
        .admin-sidebar-fixed::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary, var(--orange-500));
        }
        .admin-main-content::-webkit-scrollbar {
          width: 7px;
        }
        .admin-main-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-main-content::-webkit-scrollbar-thumb {
          background: var(--color-border, rgba(0,0,0,0.15));
          border-radius: 6px;
        }
        .admin-main-content::-webkit-scrollbar-thumb:hover {
          background: var(--color-primary, var(--orange-500));
        }
      `}} />

      {/* MOBILE STICKY HEADER BAR FOR ADMIN PORTAL */}
      <div 
        className="mobile-only"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 95,
          background: 'var(--bg-card)',
          borderBottom: '1.5px solid var(--border-color)',
          padding: '0.75rem 1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Toggle Admin Navigation Drawer"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Operations Desk
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, lineHeight: 1.1 }}>
              {activeTab === 'dashboard' && 'Executive Overview'}
              {activeTab === 'orders' && 'Orders & Production Management'}
              {activeTab === 'services' && 'Service Rates & Tiers'}
              {activeTab === 'portfolio' && 'Portfolio & Work Gallery'}
              {activeTab === 'clients' && 'Client Directory'}
              {activeTab === 'chat' && 'Messages'}
              {activeTab === 'promotions' && 'Promotions'}
              {activeTab === 'contact' && 'Contact Info'}
              {activeTab.startsWith('settings') && 'System Settings & Control Center'}
            </h3>
          </div>
        </div>

        {/* Quick Mobile Messages Button for Admin */}
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          style={{
            background: activeTab === 'chat' ? '#fff7ed' : 'var(--bg-surface)',
            border: activeTab === 'chat' ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
            color: activeTab === 'chat' ? 'var(--orange-500)' : 'var(--text-main)',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
          aria-label="Open Messages"
          title="Open Messages"
        >
          <MessageSquare size={18} />
          {adminUnreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.58rem',
              fontWeight: 900,
              borderRadius: '9999px',
              padding: '0.05rem 0.25rem',
              lineHeight: 1
            }}>
              {adminUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex'
          }}
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div 
            style={{
              width: '285px',
              maxHeight: '100vh',
              background: 'var(--bg-card)',
              padding: '1.25rem 1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>Admin Navigation</span>
                <button 
                  type="button" 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-main)', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {menuSections.map((sec, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
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
                              if (item.onClick) {
                                item.onClick();
                              } else if (item.id === 'signout') {
                                handleSignOut();
                              } else {
                                setActiveTab(item.id);
                                setIsMobileSidebarOpen(false);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.65rem 0.8rem',
                              borderRadius: '8px',
                              border: isActive ? '1.5px solid var(--color-primary)' : '1px solid transparent',
                              background: isActive ? 'var(--color-primary-light)' : 'transparent',
                              color: isActive ? 'var(--color-primary)' : 'var(--color-text-primary)',
                              fontWeight: isActive ? 800 : 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <IconComp size={16} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, background: item.isUnread ? '#ef4444' : (isActive ? 'var(--color-primary)' : 'var(--color-subtle)'), color: item.isUnread ? '#ffffff' : (isActive ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)'), padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-portal-body" style={{ display: 'flex', flex: 1, width: '100%', minHeight: 0, height: '100%', position: 'relative', overflow: 'hidden' }}>
        <aside className="admin-sidebar-fixed desktop-only" style={{
          position: 'relative',
          width: '255px',
          minWidth: '255px',
          maxWidth: '255px',
          height: '100%',
          maxHeight: '100%',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-color)',
          boxShadow: '4px 0 20px rgba(15, 23, 42, 0.04)',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem 0.85rem',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
          boxSizing: 'border-box'
        }}>
          <div>
            {/* Professional Operations Desk Brand Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 0.85rem',
              background: 'linear-gradient(135deg, #0d1322 0%, #1a2238 100%)',
              borderRadius: '12px',
              color: '#ffffff',
              marginBottom: '1.25rem',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                color: 'var(--color-text-on-primary, #ffffff)',
                padding: '0.5rem',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--color-primary-glow)',
                flexShrink: 0
              }}>
                <LayoutDashboard size={18} style={{ color: 'var(--color-text-on-primary, #ffffff)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  Operations Desk
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.15rem' }}>
                  Master Control Panel
                </div>
              </div>
            </div>

          {menuSections.map((sec, secIdx) => (
            <div key={secIdx} style={{ marginBottom: secIdx === menuSections.length - 1 ? 0 : '1.25rem' }}>
              <div style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '0.25rem 0.75rem',
                marginBottom: '0.4rem'
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
                        if (item.onClick) {
                          item.onClick();
                        } else if (item.id === 'signout') {
                          handleSignOut();
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: isActive ? '1.5px solid var(--color-primary)' : '1px solid transparent',
                        background: isActive 
                          ? 'var(--color-primary-light)' 
                          : item.danger ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        color: isActive 
                          ? 'var(--color-primary)' 
                          : item.danger ? '#dc2626' : 'var(--color-text-secondary)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <IconComp size={16} style={{ color: isActive ? 'var(--color-primary)' : item.danger ? '#ef4444' : 'var(--color-text-muted)' }} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: item.isUnread ? '#ef4444' : (isActive ? 'var(--color-primary)' : 'var(--color-subtle)'),
                          color: item.isUnread ? '#ffffff' : (isActive ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)'),
                          padding: '0.1rem 0.45rem',
                          borderRadius: '9999px'
                        }}>
                          {item.badge}
                        </span>
                      )}

                      {item.tag && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        }}>
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '0.85rem',
          background: 'var(--navy-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--navy-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            System Live
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
            {configuredAdminEmail}
          </div>
        </div>
      </aside>

      <main className="admin-main-content" style={{
        flex: 1,
        minWidth: 0,
        width: '100%',
        padding: activeTab === 'chat' ? '0.5rem 1rem 0.65rem' : '0.85rem 1.25rem 2.5rem',
        boxSizing: 'border-box',
        height: '100%',
        maxHeight: '100%',
        minHeight: 0,
        overflowY: activeTab === 'chat' ? 'hidden' : 'auto',
        overflowX: 'hidden',
        display: activeTab === 'chat' ? 'flex' : 'block',
        flexDirection: 'column'
      }}>
        {activeTab !== 'chat' && activeTab !== 'dashboard' && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'var(--bg-card)',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Admin Operations Portal
                </h1>
                <span className="badge badge-assigned" style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>MASTER ADMIN</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.1rem 0 0' }}>
                Centralized digitizing studio pipeline, client balances, and live CMS controls.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                type="button"
                className="btn btn-outline btn-sm"
                onClick={resetAllData}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                title="Refresh catalog and admin data from the live database"
              >
                <RefreshCw size={13} /> Refresh Catalog
              </button>

              <button 
                type="button"
                className="btn btn-navy btn-sm"
                onClick={() => setIsPricingSettingsOpen(true)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Sliders size={13} /> Quick Rates Editor
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <AdminExecutiveDashboard
            orders={orders}
            clients={clients}
            adminUnreadCount={adminUnreadCount}
            setActiveTab={setActiveTab}
            setSelectedOrderForDrawer={setSelectedOrderForDrawer}
            setIsPricingSettingsOpen={setIsPricingSettingsOpen}
            resetAllData={resetAllData}
            showToast={showToast}
          />
        )}

        {/* DEDICATED SEPARATE ORDERS & PRODUCTION MANAGEMENT PAGE */}
        {activeTab === 'orders' && (
          <OrderManagementTable />
        )}

        {activeTab === 'services' && <StudioServicesManager />}
        {activeTab === 'portfolio' && <PortfolioManager />}
        {activeTab === 'clients' && <ClientDirectory />}
        {activeTab === 'chat' && (
          <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <AdminChatInbox />
          </div>
        )}
        {activeTab === 'promotions' && <PromotionsManager />}
        {activeTab === 'contact' && <ContactInfoManager />}
        {activeTab === 'settings' && <SystemSettingsManager activeSubTab="theme" />}
        {activeTab === 'settings-theme' && <SystemSettingsManager activeSubTab="theme" />}
        {activeTab === 'settings-meta' && <SystemSettingsManager activeSubTab="meta" />}
        {activeTab === 'settings-admin' && <SystemSettingsManager activeSubTab="security" />}
        {activeTab === 'settings-email' && <SystemSettingsManager activeSubTab="notifications" />}
        {activeTab === 'settings-notifications' && <SystemSettingsManager activeSubTab="notifications" />}
        {activeTab === 'settings-general' && <SystemSettingsManager activeSubTab="general" />}

      </main>
      </div>

    </div>
  );
};
