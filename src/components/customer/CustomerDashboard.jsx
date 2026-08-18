'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Search, 
  FileText, 
  ChevronRight,
  DollarSign,
  ZoomIn,
  Wallet,
  Layers,
  Package,
  User,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  Sun,
  Moon,
  PenTool,
  X,
  CreditCard,
  Zap,
  AlertCircle,
  LayoutDashboard
} from 'lucide-react';
import { ClientSidebar } from './ClientSidebar';
import { ClientChatInbox } from './ClientChatInbox';
import { EmbroideryDigitizingPage } from '../public/EmbroideryDigitizingPage';
import { VectorArtPage } from '../public/VectorArtPage';
import { CustomPatchesSection } from '../public/CustomPatchesSection';
import { fetchConversations, subscribeToLiveMessages } from '../../services/supabaseService';
import { isSupabaseConfigured } from '../../lib/supabase/client';

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { 
    orders = [], 
    authUser,
    currentUser, 
    isAuthInitialized,
    setIsOrderWizardOpen, 
    openOrderWizard,
    setSelectedOrderForDrawer,
    walletBalance = 0,
    setIsDepositModalOpen,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    showToast,
    logout
  } = useAppState();

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'support' | 'digitizing' | 'vector' | 'patches' | 'profile' | 'settings'
  const [selectedOrderChatId, setSelectedOrderChatId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Mobile App UI State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Client-side mounting guard for hydration safety
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (isAuthInitialized && !authUser && !currentUser) {
      navigate('/login');
    }
  }, [isAuthInitialized, authUser, currentUser, navigate]);

  // Auto-open order tracker drawer if trackOrder or orderId query param exists
  React.useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get('trackOrder') || urlParams.get('orderId');
      if (trackId && orders && orders.length > 0) {
        const found = orders.find(o => String(o.id) === String(trackId) || formatOrderId(o.id) === trackId);
        if (found && setSelectedOrderForDrawer) {
          setSelectedOrderForDrawer(found);
        }
      }
    }
  }, [mounted, orders, setSelectedOrderForDrawer]);

  // Safe User Resolution
  const activeUser = authUser || currentUser || {
    name: 'Client',
    email: '',
    company: '',
    role: 'customer'
  };
  const userEmail = activeUser?.email || '';

  // Real-time unread messages calculator for Customer
  React.useEffect(() => {
    if (!mounted) return;
    let isMounted = true;

    const loadUnreadCount = async () => {
      if (isSupabaseConfigured) {
        try {
          const convs = await fetchConversations();
          if (convs && isMounted) {
            const clientEmail = (userEmail || '').toLowerCase().trim();
            let count = 0;

            convs.forEach(c => {
              const cEmail = (c.clientEmail || c.client_email || '').toLowerCase().trim();
              const isMatch = !clientEmail || cEmail === clientEmail || c.id === 'general-support' || !c.orderId;
              if (!isMatch) return;

              const msgs = c.messages || [];
              if (msgs.length === 0) return;

              const lastRead = typeof window !== 'undefined'
                ? parseInt(localStorage.getItem('bdigi_read_client_' + c.id) || '0', 10)
                : 0;

              const unreadFromAdmin = msgs.filter(m => {
                const isAdmin = m.sender === 'admin' || m.sender === 'support' || m.senderRole === 'admin';
                if (!isAdmin) return false;
                const msgTime = m.timestamp && !isNaN(new Date(m.timestamp).getTime()) ? new Date(m.timestamp).getTime() : 0;
                return msgTime > lastRead;
              });

              count += unreadFromAdmin.length;
            });

            setUnreadChatCount(count);
          }
        } catch { }
      }
    };

    loadUnreadCount();

    const unsubscribe = subscribeToLiveMessages(
      (msgPayload) => {
        if (!isMounted) return;
        const record = msgPayload.new || msgPayload.record;
        if (record && (record.sender === 'admin' || record.sender === 'support') && activeTab !== 'support') {
          setUnreadChatCount(prev => prev + 1);
        }
      },
      (convPayload) => {
        if (!isMounted) return;
        loadUnreadCount();
      }
    );

    const handleReadSync = () => {
      if (isMounted) loadUnreadCount();
    };
    window.addEventListener('bdigi_read_update', handleReadSync);

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('bdigi_read_update', handleReadSync);
    };
  }, [mounted, userEmail, activeTab]);

  React.useEffect(() => {
    if (activeTab === 'support') {
      setUnreadChatCount(0);
    }
  }, [activeTab]);

  React.useEffect(() => {
    const handleOpenOrderChat = (e) => {
      if (e.detail?.orderId) {
        setSelectedOrderChatId(e.detail.orderId);
        setActiveTab('support');
      }
    };
    window.addEventListener('bdigi_open_order_chat', handleOpenOrderChat);
    return () => {
      window.removeEventListener('bdigi_open_order_chat', handleOpenOrderChat);
    };
  }, []);

  // Strict Category Helper Functions
  const isStoreOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'store' || typeStr === 'digital_product' || Boolean(o?.isStoreItem) || catStr.includes('store') || catStr.includes('download') || catStr.includes('merchandise');
  };

  const isPatchOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'patch' || typeStr === 'patches' || typeStr === 'apparel' || typeStr === 'headwear' || catStr.includes('patch') || catStr.includes('t-shirt') || catStr.includes('headwear');
  };

  const isVectorOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'vector' || catStr.includes('vector');
  };

  const isEmbroideryOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    if (isStoreOrder(o) || isPatchOrder(o) || isVectorOrder(o)) return false;
    return typeStr === 'embroidery' || typeStr === 'digitizing' || typeStr === '' || !o?.type;
  };

  // Filter client's orders by exact service category
  const myOrders = (orders || []).filter(o => {
    const cEmail = (o?.clientEmail || o?.client_email || '').toLowerCase().trim();
    const uEmail = (userEmail || '').toLowerCase().trim();
    return cEmail && uEmail && cEmail === uEmail;
  });

  // All pending payment orders across all categories
  const unpaidOrders = myOrders.filter(o => {
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const oStatus = String(o?.status || '').toLowerCase().trim();
    return (pStatus === 'pending' || pStatus === 'unpaid' || pStatus === 'failed' || pStatus === '') && oStatus !== 'cancelled';
  });

  const handlePayOrder = (order) => {
    if (!order) return;
    const finalAmount = parseFloat(order.price || order.totalPrice || 15.00);
    setCheckoutSession({
      amount: finalAmount,
      orderId: order.id,
      orderTitle: order.title || 'Studio Design Order'
    });
    setIsCheckoutModalOpen(true);
  };

  // 1. Strictly Embroidery Digitizing Orders ONLY
  const digitizingOrders = myOrders.filter(isEmbroideryOrder);

  // 2. Strictly Vector Art Conversion Orders
  const vectorOrders = myOrders.filter(isVectorOrder);

  // 3. Strictly Custom Patches & Physical Manufactured Goods
  const patchOrders = myOrders.filter(isPatchOrder);

  // 4. Strictly Store & Digital Product Purchases
  const storeOrders = myOrders.filter(isStoreOrder);

  const activeOrders = digitizingOrders.filter(o => o?.status !== 'completed');
  const completedOrders = digitizingOrders.filter(o => o?.status === 'completed');
  const revisionOrders = digitizingOrders.filter(o => o?.revisions && o.revisions.length > 0);

  const totalSpent = myOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);

  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(10);

  React.useEffect(() => {
    setCustomerPage(1);
  }, [filterStatus, searchTerm]);

  const filteredDigitizingOrders = digitizingOrders.filter(o => {
    const titleMatch = (o?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (o?.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || idMatch;
    
    if (filterStatus === 'active') return matchesSearch && o?.status !== 'completed';
    if (filterStatus === 'completed') return matchesSearch && o?.status === 'completed';
    return matchesSearch;
  });

  const totalCustOrders = filteredDigitizingOrders.length;
  const totalCustPages = Math.max(1, Math.ceil(totalCustOrders / customerPageSize));
  const validCustPage = Math.min(Math.max(1, customerPage), totalCustPages);
  const custStartIndex = (validCustPage - 1) * customerPageSize;
  const custEndIndex = Math.min(custStartIndex + customerPageSize, totalCustOrders);
  const paginatedCustOrders = filteredDigitizingOrders.slice(custStartIndex, custEndIndex);

  const getPaymentStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'paid' || s === 'completed' || s === 'settled' || s === 'verified' || s === 'wallet') {
      return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 800 }}>PAID</span>;
    }
    return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 800 }}>PENDING</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'awaiting_payment':
        return <span className="badge badge-submitted">Brief Submitted</span>;
      case 'assigned':
        return <span className="badge badge-assigned">Digitizer Assigned</span>;
      case 'digitizing':
        return <span className="badge badge-digitizing">Digitizing In Progress</span>;
      case 'qc':
        return <span className="badge badge-qc">Quality Control Simulation</span>;
      case 'completed':
        return <span className="badge badge-completed">Ready For Download</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const handleOpenLiveSupport = (orderId = null) => {
    if (orderId) {
      setSelectedOrderChatId(orderId);
    }
    setActiveTab('support');
  };

  return (
    <div 
      className="dashboard-main-container" 
      style={{ 
        padding: activeTab === 'support' ? '0.75rem 0 0' : '1.5rem 0 8rem', 
        background: 'var(--bg-main)', 
        minHeight: activeTab === 'support' ? 'calc(100vh - 75px)' : 'calc(100vh - 80px)',
        height: activeTab === 'support' ? 'calc(100vh - 75px)' : 'auto',
        overflow: activeTab === 'support' ? 'hidden' : 'visible',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="client-portal-fluid-container" 
        style={{ 
          maxWidth: '1680px', 
          width: '100%', 
          padding: '0 2.25rem', 
          margin: '0 auto', 
          boxSizing: 'border-box',
          height: activeTab === 'support' ? '100%' : 'auto',
          display: activeTab === 'support' ? 'flex' : 'block',
          flexDirection: 'column'
        }}
      >

        {/* 1. TOP STICKY HEADER BAR FOR MOBILE APP UI */}
        <div 
          className="mobile-only"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '14px',
            padding: '0.75rem 1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              style={{
                background: '#f1f5f9',
                border: '1px solid var(--border-color)',
                color: 'var(--navy-900)',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Toggle Navigation Drawer"
            >
              {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                Studio Workspace
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, lineHeight: 1.1 }}>
                {activeTab === 'digitizing' && 'Embroidery Digitizing'}
                {activeTab === 'patches' && 'Custom Patches'}
                {activeTab === 'store' && 'Digital Store'}
                {activeTab === 'profile' && 'Account Profile'}
                {activeTab === 'support' && 'Support & Live Chat'}
                {activeTab === 'settings' && 'Studio Settings'}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                color: 'var(--navy-800)',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Toggle Theme Mode"
            >
              {isDarkMode ? <Sun size={18} style={{ color: 'var(--orange-500)' }} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* 2. SLIDE-OUT SIDEBAR DRAWER OVERLAY FOR MOBILE */}
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
                background: '#ffffff',
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
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy-900)' }}>Client Menu</span>
                  <button 
                    type="button" 
                    onClick={() => setIsMobileSidebarOpen(false)}
                    style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* User Info Header */}
                <div style={{ background: 'linear-gradient(135deg, var(--navy-950) 0%, #0f172a 100%)', borderRadius: '12px', padding: '0.85rem', color: '#ffffff', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{activeUser?.name || 'Client'}</div>
                  <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{activeUser?.company || ''}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '0.35rem 0.6rem', borderRadius: '6px', fontSize: '0.73rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Wallet Credit:</span>
                    <strong style={{ color: 'var(--orange-400)', fontWeight: 800 }}>${walletBalance.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {[
                    { 
                      id: 'dashboard', 
                      label: 'Dashboard', 
                      icon: LayoutDashboard,
                      badge: unpaidOrders.length > 0 ? `${unpaidOrders.length} Due` : null,
                      badgeColor: '#ef4444'
                    },
                    { 
                      id: 'support', 
                      label: 'Messages & Support', 
                      icon: MessageSquare, 
                      badge: unreadChatCount > 0 ? unreadChatCount : null,
                      isUnread: unreadChatCount > 0
                    },
                    { id: 'digitizing', label: 'Embroidery Digitizing', icon: Layers, badge: digitizingOrders.length },
                    { id: 'vector', label: 'Vector Art Conversion', icon: PenTool, badge: vectorOrders.length },
                    { id: 'patches', label: 'Custom Patches & Goods', icon: Package, badge: patchOrders.length },
                    { id: 'profile', label: 'Account Profile', icon: User },
                    { id: 'settings', label: 'Preferences & Settings', icon: Settings }
                  ].map(item => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileSidebarOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          padding: '0.7rem 0.85rem',
                          borderRadius: '10px',
                          border: isActive ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                          background: isActive ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                          color: isActive ? 'var(--orange-600)' : 'var(--navy-800)',
                          fontWeight: isActive ? 800 : 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <IconComp size={18} style={{ color: isActive ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge !== null && item.badge !== 0 && item.badge !== '0' && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: item.badgeColor || (item.isUnread ? '#ef4444' : (isActive ? 'var(--orange-500)' : 'var(--navy-100)')), color: (item.badgeColor || item.isUnread || isActive) ? '#ffffff' : 'var(--navy-700)', padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  logout();
                  navigate('/login');
                }}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                <LogOut size={16} /> Sign Out Account
              </button>
            </div>
          </div>
        )}

        {/* Main Grid Layout: Left Vertical Sidebar + Right Content Workspace */}
        <div 
          className="dashboard-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '2rem',
            alignItems: 'start',
            flex: activeTab === 'support' ? 1 : 'none',
            height: activeTab === 'support' ? '100%' : 'auto',
            minHeight: 0,
            overflow: activeTab === 'support' ? 'hidden' : 'visible'
          }}
        >

          {/* ==================================================================
              LEFT VERTICAL SIDEBAR NAVIGATION MENU (INDEPENDENT SCROLLABLE SAAS PANEL)
             ================================================================== */}
          <ClientSidebar 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            activeUser={activeUser}
            walletBalance={walletBalance}
            digitizingCount={digitizingOrders.length}
            vectorCount={vectorOrders.length}
            patchCount={patchOrders.length}
            storeCount={storeOrders.length}
            unreadChatCount={unreadChatCount}
            unpaidCount={unpaidOrders.length}
            onOpenDepositModal={() => setIsDepositModalOpen(true)}
            onOpenLiveSupport={handleOpenLiveSupport}
            onLogout={() => {
              if (logout) logout();
              navigate('/login');
            }}
          />

          {/* ==================================================================
              RIGHT CONTENT WORKSPACE PANE
             ================================================================== */}
          <main style={{ 
            minWidth: 0,
            height: activeTab === 'support' ? '100%' : 'auto',
            minHeight: 0,
            display: activeTab === 'support' ? 'flex' : 'block',
            flexDirection: 'column',
            overflow: activeTab === 'support' ? 'hidden' : 'visible'
          }}>
            
            {/* TAB 0: MAIN CLIENT DASHBOARD */}
            {activeTab === 'dashboard' && (
              <>
                {/* Welcome Header Container - Styled for Parity with Admin Portal */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.75rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  background: '#ffffff',
                  padding: '1.25rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                        Dashboard
                      </h1>
                      <span className="badge badge-assigned" style={{ fontSize: '0.725rem', background: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00', border: '1px solid rgba(255, 122, 0, 0.3)' }}>CLIENT ACCOUNT</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0' }}>
                      Welcome back, <strong>{activeUser?.name || 'Client'}</strong>{activeUser?.company ? ` (${activeUser.company})` : ''}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <button 
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setIsDepositModalOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.65rem 1.15rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer'
                      }}
                    >
                      <Wallet size={16} style={{ color: 'var(--orange-500)' }} /> Top-Up Wallet
                    </button>

                    <button 
                      type="button"
                      className="btn btn-primary-orange"
                      onClick={() => setIsServiceSelectorOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem 1.35rem',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        borderRadius: 'var(--radius-md)',
                        boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                        cursor: 'pointer'
                      }}
                    >
                      <PlusCircle size={18} /> Order Now
                    </button>
                  </div>
                </div>

                {/* ACTION REQUIRED: PENDING PAYMENT ORDERS BANNER */}
                {unpaidOrders.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                    border: '1.5px solid #fcd34d',
                    borderRadius: '16px',
                    padding: '1.35rem 1.5rem',
                    marginBottom: '1.75rem',
                    boxShadow: '0 6px 20px rgba(217, 119, 6, 0.1)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: '#f59e0b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(245, 158, 11, 0.35)',
                          flexShrink: 0
                        }}>
                          <CreditCard size={22} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#fef3c7', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
                              Action Required
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>
                              {unpaidOrders.length} {unpaidOrders.length === 1 ? 'Order Awaiting Payment' : 'Orders Awaiting Payment'}
                            </span>
                          </div>
                          <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.2rem', fontWeight: 900, color: '#78350f' }}>
                            Finalize Payment to Begin Production
                          </h3>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: '#92400e' }}>
                            Your design order and high-resolution files are securely saved. Complete payment to dispatch this order to our master digitizing desk.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* List of Pending Orders */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {unpaidOrders.map((ord, idx) => (
                        <div
                          key={ord.id || idx}
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #fde68a',
                            padding: '0.85rem 1.15rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            {ord.artworkUrl ? (
                              <img
                                src={ord.artworkUrl}
                                alt={ord.title}
                                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                              />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                                <FileText size={20} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--navy-950)', fontSize: '0.92rem' }}>
                                {ord.title || 'Custom Design Order'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                <span>ID: <strong>{formatOrderId(ord.id)}</strong></span>
                                <span>•</span>
                                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : ord.type === 'patch' ? 'Custom Patches' : 'Embroidery Digitizing')}</span>
                                <span>•</span>
                                <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ Payment Pending</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Amount Due</div>
                              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                                ${parseFloat(ord.price || 0).toFixed(2)}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handlePayOrder(ord)}
                              style={{
                                background: 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.65rem 1.25rem',
                                borderRadius: '10px',
                                fontWeight: 900,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                              <Zap size={15} /> Pay Now & Start Production
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Stat Cards - Styled with Admin Operations Desk Border-Left Accents */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.75rem'
                }}>
                  {/* Card 1: Wallet Balance */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ff7a00', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Studio Wallet Credit</span>
                      <div style={{ background: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <Wallet size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                        ${walletBalance.toFixed(2)}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDepositModalOpen(true)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--orange-600)',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        + Deposit
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Active Jobs */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Digitizing Jobs</span>
                      <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <Clock size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                      {activeOrders.length}
                    </div>
                  </div>

                  {/* Card 3: Completed Downloads */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Downloads</span>
                      <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                      {completedOrders.length}
                    </div>
                  </div>

                  {/* Card 4: Revisions Requested */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Revisions Requested</span>
                      <div style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <RotateCcw size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                      {revisionOrders.length}
                    </div>
                  </div>

                  {/* Card 5: Total Spend */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ec4899', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Invoiced Spend</span>
                      <div style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <DollarSign size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                      ${totalSpent.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Orders Table Container */}
                <div className="card" style={{ padding: '1.5rem' }}>
                  
                  {/* Table Header Controls */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button 
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        style={{
                          background: filterStatus === 'all' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'all' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'all' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'all' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'all' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        All Orders ({myOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('active')}
                        style={{
                          background: filterStatus === 'active' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'active' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'active' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'active' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'active' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        Active Orders ({activeOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('completed')}
                        style={{
                          background: filterStatus === 'completed' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'completed' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'completed' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'completed' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'completed' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        Completed ({completedOrders.length})
                      </button>
                    </div>

                    {/* Search input */}
                    <div style={{ position: 'relative', width: '280px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Search order ID or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.2rem' }}
                      />
                    </div>
                  </div>

                  {/* Orders Table */}
                  {filteredDigitizingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <FileText size={42} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
                      <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>No embroidery digitizing orders found matching your search.</p>
                      <p style={{ fontSize: '0.85rem' }}>Click "Upload New Design Brief" to place your first embroidery or vector job.</p>
                    </div>
                  ) : (
                    <div style={{ 
                      maxHeight: '560px', 
                      overflowY: 'auto', 
                      overflowX: 'auto',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      background: '#ffffff',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Uploaded Artwork & Design</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Service Type</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Payment Status</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedCustOrders.map((ord) => (
                            <tr 
                              key={ord?.id || Math.random()}
                              style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--orange-50)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              {/* Title & Interactive Lightbox Artwork Thumbnail */}
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <div 
                                    style={{ position: 'relative', cursor: 'pointer' }}
                                    onClick={() => setLightboxOrder(ord)}
                                    title="Click to inspect full high-res artwork"
                                  >
                                    <img 
                                      src={
                                        ord?.artworkUrl || 
                                        ord?.image_url || 
                                        ord?.logo || 
                                        ord?.uploadedFiles?.[0]?.url || 
                                        ord?.uploadedFiles?.[0]?.public_url || 
                                        ord?.placementItems?.[0]?.files?.[0]?.url || 
                                        ord?.patchItems?.[0]?.files?.[0]?.url || 
                                        ord?.order_files?.[0]?.public_url || 
                                        ord?.file_url || 
                                        ord?.file_path || 
                                        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'
                                      } 
                                      alt={ord?.title || 'Design'} 
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                                      }}
                                      style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1.5px solid var(--orange-600)' }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      inset: 0,
                                      background: 'rgba(15, 23, 42, 0.4)',
                                      borderRadius: 'var(--radius-sm)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#ffffff',
                                      opacity: 0,
                                      transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                    >
                                      <ZoomIn size={16} />
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      {ord?.title}
                                      {ord?.isRush && <span className="badge badge-rush" style={{ fontSize: '0.65rem' }}>RUSH</span>}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                      ID: <strong>{formatOrderId(ord?.id)}</strong>{ord?.dimensions?.width && ord?.dimensions?.height ? ` • ${ord.dimensions.width}"x${ord.dimensions.height}"` : ''}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Service Category */}
                              <td style={{ padding: '1rem' }}>
                                <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                                  {ord?.type === 'embroidery' ? '🧵 Embroidery Digitizing' : '✒️ Vector Art'}
                                </span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {ord?.serviceCategory}
                                </div>
                              </td>

                              {/* Date */}
                              <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {ord?.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                              </td>

                              {/* Status */}
                              <td style={{ padding: '1rem' }}>
                                {getPaymentStatusBadge(ord?.payment_status || ord?.paymentStatus)}
                              </td>

                              {/* Price */}
                              <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                                ${parseFloat(ord?.price || 0).toFixed(2)}
                              </td>

                              {/* Actions */}
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                  {String(ord?.payment_status || ord?.paymentStatus || '').toLowerCase() === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => handlePayOrder(ord)}
                                      style={{
                                        background: 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '8px',
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.25)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                      }}
                                    >
                                      <Zap size={13} /> Pay Now
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setSelectedOrderForDrawer(ord)}
                                  >
                                    View Order <ChevronRight size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Customer Orders Pagination Footer */}
                  {filteredDigitizingOrders.length > 0 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1.25rem',
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderTop: 'none',
                      borderRadius: '0 0 12px 12px',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginTop: '-1px'
                    }}>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Showing <strong style={{ color: 'var(--navy-900)' }}>{custStartIndex + 1}</strong> to <strong style={{ color: 'var(--navy-900)' }}>{custEndIndex}</strong> of <strong style={{ color: 'var(--orange-600)' }}>{totalCustOrders}</strong> orders
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>Per page:</span>
                          <select
                            value={customerPageSize}
                            onChange={(e) => {
                              setCustomerPageSize(Number(e.target.value));
                              setCustomerPage(1);
                            }}
                            className="form-control"
                            style={{ width: '65px', padding: '0.2rem 0.35rem', fontSize: '0.8rem', height: '30px' }}
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
                            disabled={validCustPage === 1}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCustPage === 1 ? 0.4 : 1, cursor: validCustPage === 1 ? 'not-allowed' : 'pointer' }}
                          >
                            ‹ Prev
                          </button>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.4rem', color: 'var(--navy-900)' }}>
                            Page {validCustPage} of {totalCustPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCustomerPage(p => Math.min(totalCustPages, p + 1))}
                            disabled={validCustPage >= totalCustPages}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCustPage >= totalCustPages ? 0.4 : 1, cursor: validCustPage >= totalCustPages ? 'not-allowed' : 'pointer' }}
                          >
                            Next ›
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}

            {/* TAB 1: EMBROIDERY DIGITIZING PUBLIC LANDING VIEW */}
            {activeTab === 'digitizing' && (
              <EmbroideryDigitizingPage />
            )}

            {/* TAB 2: VECTOR ART CONVERSION PUBLIC LANDING VIEW */}
            {activeTab === 'vector' && (
              <VectorArtPage />
            )}

            {/* TAB 3: CUSTOM PATCHES & MANUFACTURED GOODS PUBLIC LANDING VIEW */}
            {activeTab === 'patches' && (
              <CustomPatchesSection />
            )}

            {/* TAB 4: ACCOUNT & PROFILE */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Client Profile & Studio Account
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.name || 'Client'}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.email || '—'}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company / Brand</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.company || '—'}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Deposit Credit</label>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--orange-600)', marginTop: '0.2rem' }}>${walletBalance.toFixed(2)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary-orange" onClick={() => setIsDepositModalOpen(true)}>
                      <Wallet size={18} /> Top-Up Studio Wallet Funds
                    </button>
                    <button className="btn btn-outline" onClick={() => setIsServiceSelectorOpen(true)}>
                      <PlusCircle size={18} /> Order Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LIVE SUPPORT & ORDER CHAT INBOX */}
            {activeTab === 'support' && (
              <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ClientChatInbox initialOrderId={selectedOrderChatId} />
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Client Studio Preferences & Settings
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                        Default Required Machine Formats
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['.DST (Tajima)', '.PES (Brother)', '.EXP (Melco)', '.EMB (Wilcom)', '.JEF (Janome)'].map(fmt => (
                          <span key={fmt} style={{ background: '#f1f5f9', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-800)' }}>
                            ✓ {fmt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                        Notification Alerts
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--navy-800)', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} /> Email notification when order passes Quality Control (QC) & ready to download
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--navy-800)', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} /> Instant SMS update on Super Rush (2-4 hr) order completion
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>

        </div>

      </div>

      {/* Lightbox Inspection Modal */}
      {lightboxOrder && (
        <ArtworkLightboxModal 
          order={lightboxOrder} 
          onClose={() => setLightboxOrder(null)} 
        />
      )}

      {/* 3. FIXED BOTTOM NAVIGATION BAR FOR MOBILE VIEWPORTS */}
      <div 
        className="mobile-only mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#ffffff',
          borderTop: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          padding: '0.45rem 0.2rem max(0.65rem, env(safe-area-inset-bottom, 0.65rem))',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.15)'
        }}
      >
        {/* Item 1: Dashboard */}
        <button
          type="button"
          onClick={() => setActiveTab('digitizing')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            background: 'none',
            border: 'none',
            color: activeTab === 'digitizing' ? 'var(--orange-600)' : 'var(--navy-700)',
            fontWeight: activeTab === 'digitizing' ? 800 : 600,
            fontSize: '0.68rem',
            cursor: 'pointer',
            padding: '0.35rem 0'
          }}
        >
          <Layers size={20} style={{ color: activeTab === 'digitizing' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
          <span>Dashboard</span>
        </button>

        {/* Item 2: History */}
        <button
          type="button"
          onClick={() => setActiveTab('patches')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            background: 'none',
            border: 'none',
            color: activeTab === 'patches' ? 'var(--orange-600)' : 'var(--navy-700)',
            fontWeight: activeTab === 'patches' ? 800 : 600,
            fontSize: '0.68rem',
            cursor: 'pointer',
            padding: '0.35rem 0'
          }}
        >
          <Clock size={20} style={{ color: activeTab === 'patches' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
          <span>History</span>
        </button>

        {/* Item 3: New Order */}
        <button
          type="button"
          onClick={() => setIsServiceSelectorOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            background: 'none',
            border: 'none',
            color: 'var(--orange-600)',
            fontWeight: 800,
            fontSize: '0.68rem',
            cursor: 'pointer',
            padding: '0.35rem 0'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--orange-500) 0%, #ea580c 100%)',
            color: '#ffffff',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 8px rgba(249, 115, 22, 0.4)'
          }}>
            <PlusCircle size={18} />
          </div>
          <span>New Order</span>
        </button>

        {/* Item 4: Wallet */}
        <button
          type="button"
          onClick={() => setIsDepositModalOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.2rem',
            background: 'none',
            border: 'none',
            color: 'var(--navy-700)',
            fontWeight: 600,
            fontSize: '0.68rem',
            cursor: 'pointer',
            padding: '0.35rem 0'
          }}
        >
          <Wallet size={20} style={{ color: 'var(--navy-600)' }} />
          <span>Wallet (${walletBalance.toFixed(0)})</span>
        </button>
      </div>

      {/* SERVICE SELECTOR MODAL (3 Core Services Choice Dialog) */}
      {isServiceSelectorOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setIsServiceSelectorOpen(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
              border: '1.5px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
                  New Project Request
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0 }}>
                  Select Desired Service
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Choose a service category to launch the custom order configurator
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceSelectorOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--navy-700)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Service Choice Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Choice 1: Embroidery Digitizing */}
              <button
                type="button"
                onClick={() => {
                  setIsServiceSelectorOpen(false);
                  if (openOrderWizard) openOrderWizard({ type: 'embroidery' });
                  else setIsOrderWizardOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.15rem 1.25rem',
                  background: '#ffffff',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff7a00';
                  e.currentTarget.style.background = 'rgba(255, 122, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--orange-500), #e66e00)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
                  flexShrink: 0
                }}>
                  <Layers size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                      Embroidery Digitizing
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--orange-500)' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                    DST, PES, EMB stitch pathing for commercial embroidery machines
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fff7ed', color: 'var(--orange-700)', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(255, 122, 0, 0.2)' }}>
                      4-12 Hr Delivery
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#f1f5f9', color: 'var(--navy-700)', padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
                      Starts $10.00
                    </span>
                  </div>
                </div>
              </button>

              {/* Choice 2: Vector Art Conversion */}
              <button
                type="button"
                onClick={() => {
                  setIsServiceSelectorOpen(false);
                  if (openOrderWizard) openOrderWizard({ type: 'vector' });
                  else setIsOrderWizardOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.15rem 1.25rem',
                  background: '#ffffff',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff7a00';
                  e.currentTarget.style.background = 'rgba(255, 122, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                  flexShrink: 0
                }}>
                  <PenTool size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                      Vector Art Conversion
                    </div>
                    <ChevronRight size={18} style={{ color: '#0284c7' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                    Hand-traced AI, EPS, SVG vector redraw & Pantone spot color separation
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                      Screen Print Ready
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#f1f5f9', color: 'var(--navy-700)', padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
                      Starts $15.00
                    </span>
                  </div>
                </div>
              </button>

              {/* Choice 3: Custom Patches & Goods */}
              <button
                type="button"
                onClick={() => {
                  setIsServiceSelectorOpen(false);
                  if (openOrderWizard) openOrderWizard({ type: 'patch' });
                  else setIsOrderWizardOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.15rem 1.25rem',
                  background: '#ffffff',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff7a00';
                  e.currentTarget.style.background = 'rgba(255, 122, 0, 0.03)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  flexShrink: 0
                }}>
                  <Package size={24} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                      Custom Patches & Goods
                    </div>
                    <ChevronRight size={18} style={{ color: '#16a34a' }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.35 }}>
                    Custom embroidered, woven, 3D molded PVC rubber & leather patches
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                      Physical Shipping
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#f1f5f9', color: 'var(--navy-700)', padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
                      Starts $1.50 / pc
                    </span>
                  </div>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
