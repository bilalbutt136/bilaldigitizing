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
  PackageCheck,
  Plus,
  Palette,
  Bell,
  ClipboardList,
  Home,
  Download,
  Smartphone,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
import { ClientSidebar } from './ClientSidebar';
import { ClientChatInbox } from './ClientChatInbox';
import { MobileSimpleOrderModal } from './MobileSimpleOrderModal';
import { ClientNotificationsView } from './ClientNotificationsView';
import { EmbroideryDigitizingPage } from '../public/EmbroideryDigitizingPage';
import { VectorArtPage } from '../public/VectorArtPage';
import { CustomPatchesSection } from '../public/CustomPatchesSection';
import ThemePreviewCard from '../common/ThemePreviewCard';
import { THEME_PRESETS } from '../../utils/themePresets';
import { fetchConversations, fetchNotificationsFromSupabase, subscribeToLiveMessages } from '../../services/supabaseService';
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
    logout,
    theme,
    toggleTheme,
    setTheme,
    colorTheme,
    setColorTheme,
    availableThemes = THEME_PRESETS,
    activeCustomerTab,
    setActiveCustomerTab,
    unreadNotificationsCount = 0,
    markAllNotificationsAsRead,
    refreshNotifications,
    unreadChatCount = 0,
    setUnreadChatCount,
    refreshUnreadChatCount
  } = useAppState();

  const unreadNotifCount = unreadNotificationsCount;

  const [activeTab, setActiveTabLocal] = useState(() => activeCustomerTab || 'dashboard');
  const [selectedOrderChatId, setSelectedOrderChatId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [orderFilterTab, setOrderFilterTab] = useState('active'); // 'active' | 'completed' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);
  const [isServiceSelectorOpen, setIsServiceSelectorOpen] = useState(false);
  const [isMobileOrderOpen, setIsMobileOrderOpen] = useState(false);
  const [mobileOrderDefaultService, setMobileOrderDefaultService] = useState('embroidery');

  // Mobile App UI State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  // Client-side mounting guard for hydration safety
  const [mounted, setMounted] = React.useState(false);

  const setActiveTab = React.useCallback((tab) => {
    setActiveTabLocal(tab);
    if (setActiveCustomerTab) {
      setActiveCustomerTab(tab);
    }
  }, [setActiveCustomerTab]);

  // Sync with global activeCustomerTab changes (e.g. from top header navigation)
  React.useEffect(() => {
    if (activeCustomerTab && activeCustomerTab !== activeTab) {
      setActiveTabLocal(activeCustomerTab);
    }
  }, [activeCustomerTab, activeTab]);

  // Listen for direct tab switch events (e.g. from HeaderNav Inbox or Live Support buttons)
  React.useEffect(() => {
    const handleTabSwitch = (e) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
        if (e.detail.orderId) {
          setSelectedOrderChatId(e.detail.orderId);
        }
      }
    };
    window.addEventListener('bdigi_switch_tab', handleTabSwitch);

    // Sync tab from URL query params on mount/refresh
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }

    return () => window.removeEventListener('bdigi_switch_tab', handleTabSwitch);
  }, [setActiveTab]);

  React.useEffect(() => {
    setMounted(true);
    if (isAuthInitialized && !authUser && !currentUser) {
      navigate('/login');
    }
  }, [isAuthInitialized, authUser, currentUser, navigate]);

  // Auto-open order tracker drawer only ONCE if explicitly navigated via URL param, then clean URL
  const initialTrackHandledRef = React.useRef(false);
  React.useEffect(() => {
    if (!mounted || initialTrackHandledRef.current) return;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackId = urlParams.get('trackOrder') || urlParams.get('orderId');
      if (trackId && orders && orders.length > 0) {
        const cleanTrackId = String(trackId).trim().replace(/^#+/, '');
        const found = orders.find(o => {
          const oClean = String(o?.id || '').trim().replace(/^#+/, '');
          return oClean === cleanTrackId || String(o.id) === String(trackId) || formatOrderId(o.id) === trackId;
        });
        if (found && setSelectedOrderForDrawer) {
          initialTrackHandledRef.current = true;
          setSelectedOrderForDrawer(found);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
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
        if (record && (record.sender === 'admin' || record.sender === 'support') && activeTab !== 'support' && activeTab !== 'inbox' && activeTab !== 'help-support') {
          if (typeof setUnreadChatCount === 'function') {
            setUnreadChatCount(prev => prev + 1);
          }
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
    if (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') {
      if (typeof setUnreadChatCount === 'function') {
        setUnreadChatCount(0);
      }
    }
    if (activeTab === 'notifications') {
      if (typeof markAllNotificationsAsRead === 'function') {
        markAllNotificationsAsRead();
      }
    }
  }, [activeTab, setUnreadChatCount, markAllNotificationsAsRead]);

  // Live Notifications Count Loader & Real-time Subscription
  React.useEffect(() => {
    if (!mounted) return;
    let isMounted = true;

    const loadNotificationsCount = async () => {
      try {
        if (typeof refreshNotifications === 'function') {
          await refreshNotifications();
        }
      } catch {}
    };

    loadNotificationsCount();

    const unsubscribe = subscribeToLiveMessages({
      onNotification: () => {
        if (isMounted) loadNotificationsCount();
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [mounted, refreshNotifications]);

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

  const isOrderPaid = (o) => {
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const oStatus = String(o?.status || '').toLowerCase().trim();
    const isPaidFlag = o?.isPaid === true || o?.paid === true || Boolean(o?.paid_at);
    return isPaidFlag ||
           pStatus === 'paid' || pStatus === 'completed' || pStatus === 'settled' || pStatus === 'verified' || pStatus === 'wallet' ||
           ['in_progress', 'digitizing', 'assigned', 'qc', 'delivered', 'completed'].includes(oStatus);
  };

  // All pending payment orders across all categories
  const unpaidOrders = myOrders.filter(o => {
    const isPaid = isOrderPaid(o);
    const oStatus = String(o?.status || '').toLowerCase().trim();
    return !isPaid && oStatus !== 'cancelled';
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

  // Orders to display on the current tab (on Studio Dashboard, show ALL client orders)
  const currentTabOrders = activeTab === 'digitizing' 
    ? digitizingOrders 
    : activeTab === 'vector' 
      ? vectorOrders 
      : activeTab === 'patches' 
        ? patchOrders 
        : myOrders;

  const activeOrders = currentTabOrders.filter(o => o?.status !== 'completed' && o?.status !== 'cancelled');
  const deliveredOrders = currentTabOrders.filter(o => o?.status === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0 && o?.status !== 'completed'));
  const revisionOrders = currentTabOrders.filter(o => o?.status === 'revision' || o?.status === 'revision_requested');
  const completedOrders = currentTabOrders.filter(o => o?.status === 'completed');

  const totalSpent = myOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);

  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(10);

  React.useEffect(() => {
    setCustomerPage(1);
  }, [filterStatus, searchTerm, activeTab]);

  const filteredDigitizingOrders = currentTabOrders.filter(o => {
    const titleMatch = (o?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (o?.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || idMatch;
    
    if (filterStatus === 'active') return matchesSearch && o?.status !== 'completed' && o?.status !== 'cancelled';
    if (filterStatus === 'delivered') return matchesSearch && (o?.status === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0 && o?.status !== 'completed'));
    if (filterStatus === 'revision') return matchesSearch && (o?.status === 'revision' || o?.status === 'revision_requested');
    if (filterStatus === 'completed') return matchesSearch && o?.status === 'completed';
    return matchesSearch;
  });

  const totalCustOrders = filteredDigitizingOrders.length;
  const totalCustPages = Math.max(1, Math.ceil(totalCustOrders / customerPageSize));
  const validCustPage = Math.min(Math.max(1, customerPage), totalCustPages);
  const custStartIndex = (validCustPage - 1) * customerPageSize;
  const custEndIndex = Math.min(custStartIndex + customerPageSize, totalCustOrders);
  const paginatedCustOrders = filteredDigitizingOrders.slice(custStartIndex, custEndIndex);

  const getPaymentStatusBadge = (statusOrOrder) => {
    const isPaidComputed = typeof statusOrOrder === 'object' && statusOrOrder !== null 
      ? isOrderPaid(statusOrOrder) 
      : isOrderPaid({ payment_status: statusOrOrder });

    if (isPaidComputed) {
      return (
        <span 
          className="badge" 
          style={{ 
            background: '#dcfce7', 
            color: '#15803d', 
            border: '1px solid #bbf7d0', 
            fontWeight: 800,
            fontSize: '0.725rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            whiteSpace: 'nowrap'
          }}
        >
          <CheckCircle2 size={11} style={{ color: '#16a34a' }} /> PAID
        </span>
      );
    }
    return (
      <span 
        className="badge" 
        style={{ 
          background: '#fff7ed', 
          color: '#c2410c', 
          border: '1px solid #ffedd5', 
          fontWeight: 800,
          fontSize: '0.725rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          whiteSpace: 'nowrap'
        }}
      >
        <Clock size={11} style={{ color: '#ea580c' }} /> PENDING
      </span>
    );
  };

  const getOrderDeliveryStatusBadge = (ord) => {
    if (!ord) return null;
    const s = String(ord?.status || 'submitted').toLowerCase().trim();
    const hasFiles = Array.isArray(ord?.uploadedMachineFiles) && ord.uploadedMachineFiles.length > 0;
    const isDelivered = s === 'delivered' || (hasFiles && s !== 'completed');
    const isCompleted = s === 'completed';
    const isRevision = s === 'revision' || s === 'revision_requested';
    const isQC = s === 'qc' || s === 'quality_check';
    const isInProgress = s === 'in_progress' || s === 'digitizing' || s === 'assigned';

    if (isCompleted) {
      return (
        <span style={{
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #86efac',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap'
        }}>
          ✅ Completed
        </span>
      );
    }

    if (isDelivered) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-start' }}>
          <span style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
            whiteSpace: 'nowrap'
          }}>
            📦 Delivered (Files Ready)
          </span>
          <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 700 }}>
            Click to Download & Review
          </span>
        </div>
      );
    }

    if (isRevision) {
      return (
        <span style={{
          background: '#fff1f2',
          color: '#e11d48',
          border: '1px solid #fecdd3',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap'
        }}>
          🔄 Modification in Progress
        </span>
      );
    }

    if (isQC) {
      return (
        <span style={{
          background: '#e0e7ff',
          color: '#4338ca',
          border: '1px solid #c7d2fe',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap'
        }}>
          🔍 Quality Check
        </span>
      );
    }

    if (isInProgress) {
      return (
        <span style={{
          background: '#e0f2fe',
          color: '#0369a1',
          border: '1px solid #bae6fd',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.74rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap'
        }}>
          ⚡ In Production
        </span>
      );
    }

    return (
      <span style={{
        background: '#fef3c7',
        color: '#b45309',
        border: '1px solid #fde68a',
        padding: '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: '0.74rem',
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        whiteSpace: 'nowrap'
      }}>
        📋 Placed & Reviewing
      </span>
    );
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
        padding: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? '0.65rem 0' : '1.5rem 0 8rem', 
        background: 'var(--bg-main)', 
        minHeight: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'calc(100vh - 130px)' : 'calc(100vh - 80px)',
        height: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'calc(100vh - 130px)' : 'auto',
        maxHeight: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'calc(100vh - 130px)' : 'none',
        overflow: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'hidden' : 'visible',
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
          height: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? '100%' : 'auto',
          display: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'flex' : 'block',
          flexDirection: 'column'
        }}
      >

        {/* 1. TOP NATIVE MOBILE APP HEADER (Fiverr / Modern App Standard) */}
        <div 
          className="mobile-only mobile-app-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 95,
            background: '#ffffff',
            borderBottom: '1px solid var(--border-color)',
            padding: '0.75rem 1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* User Avatar Circle */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              color: 'var(--color-text-on-primary, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px var(--color-primary-glow)',
              flexShrink: 0
            }}>
              {(activeUser?.name?.[0] || 'C').toUpperCase()}
            </div>
            
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeUser?.name || 'Client'}
                </span>
                <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                  VIP
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                {activeTab === 'dashboard' ? 'Studio Dashboard' : (activeTab === 'digitizing' ? 'Embroidery Digitizing' : (activeTab === 'vector' ? 'Vector Art' : (activeTab === 'patches' ? 'Custom Patches' : (activeTab === 'inbox' ? 'Customer Inbox' : 'Client Portal'))))}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Quick Mobile Inbox Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('inbox');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? '#fff7ed' : '#f8fafc',
                border: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                color: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? 'var(--orange-500)' : 'var(--navy-900)',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
              title="Open Inbox"
            >
              <MessageSquare size={16} />
              {unreadChatCount > 0 && (
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
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Wallet Button */}
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#fff7ed',
                border: '1.5px solid #fed7aa',
                borderRadius: '20px',
                padding: '0.3rem 0.65rem',
                color: '#c2410c',
                fontWeight: 800,
                fontSize: '0.78rem',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(234, 88, 12, 0.12)'
              }}
              title="Deposit Wallet Funds"
            >
              <Wallet size={14} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontWeight: 900 }}>${walletBalance.toFixed(0)}</span>
              <span style={{ background: 'var(--color-primary)', color: 'var(--color-text-on-primary, #fff)', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, lineHeight: 1 }}>+</span>
            </button>

            {/* Menu Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                color: 'var(--navy-900)',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Menu"
            >
              <Menu size={17} />
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
                <div style={{ background: 'var(--bg-subtle, #f1f5f9)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-950)' }}>{activeUser?.name || 'Client'}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{activeUser?.company || ''}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Wallet Credit:</span>
                    <strong style={{ color: '#059669', fontWeight: 900, background: 'var(--color-success-bg, #ecfdf5)', padding: '0.1rem 0.45rem', borderRadius: '6px', border: '1px solid var(--color-success-border, #a7f3d0)' }}>${walletBalance.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {[
                    { 
                      id: 'dashboard', 
                      label: 'Dashboard', 
                      icon: LayoutDashboard
                    },
                    { 
                      id: 'orders', 
                      label: 'My Orders', 
                      icon: ClipboardList, 
                      badge: (digitizingOrders.length + vectorOrders.length + patchOrders.length) > 0 ? (digitizingOrders.length + vectorOrders.length + patchOrders.length) : null
                    },
                    { 
                      id: 'inbox', 
                      label: 'Customer Inbox (Orders & Offers)', 
                      icon: MessageSquare, 
                      badge: unreadChatCount > 0 ? unreadChatCount : null,
                      isUnread: unreadChatCount > 0
                    },
                    { 
                      id: 'help-support', 
                      label: '24/7 Live Support Helpdesk', 
                      icon: Headphones
                    },
                    { 
                      id: 'notifications', 
                      label: 'Notifications', 
                      icon: Bell, 
                      badge: unreadNotifCount > 0 ? unreadNotifCount : null,
                      isUnread: unreadNotifCount > 0
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
            gap: '1.5rem',
            alignItems: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'stretch' : 'start',
            flex: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 1 : 'none',
            height: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? '100%' : 'auto',
            maxHeight: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? '100%' : 'none',
            minHeight: 0,
            overflow: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'hidden' : 'visible'
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
            unreadNotifCount={unreadNotificationsCount}
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
            height: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? '100%' : 'auto',
            minHeight: 0,
            display: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'flex' : 'block',
            flexDirection: 'column',
            overflow: (activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') ? 'hidden' : 'visible'
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
                  background: 'var(--bg-card)',
                  padding: '1.25rem 1.75rem',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                        Dashboard
                      </h1>
                      <span className="badge badge-assigned" style={{ fontSize: '0.725rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>CLIENT ACCOUNT</span>
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
                      <Wallet size={16} style={{ color: 'var(--color-primary)' }} /> Top-Up Wallet
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
                        boxShadow: '0 4px 14px var(--color-primary-glow)',
                        cursor: 'pointer'
                      }}
                    >
                      <PlusCircle size={18} /> Order Now
                    </button>
                  </div>
                </div>

                {/* Summary Stat Cards - Styled with Operations Desk Border-Left Accents */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.75rem'
                }}>
                  {/* Card 1: Wallet Balance */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--color-primary)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Studio Wallet Credit</span>
                      <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <Wallet size={18} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
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
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Digitizing Jobs</span>
                      <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <Clock size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.1rem' }}>
                      {activeOrders.length}
                    </div>
                  </div>

                  {/* Card 3: Completed Downloads */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Downloads</span>
                      <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.1rem' }}>
                      {completedOrders.length}
                    </div>
                  </div>

                  {/* Card 4: Revisions Requested */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Revisions Requested</span>
                      <div style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <RotateCcw size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.1rem' }}>
                      {revisionOrders.length}
                    </div>
                  </div>

                  {/* Card 5: Total Spend */}
                  <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ec4899', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Invoiced Spend</span>
                      <div style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                        <DollarSign size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: '0.4rem 0 0.1rem' }}>
                      ${totalSpent.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* A. MOBILE-FIRST APP HOME SCREEN (Clean, simple, 1-tap ordering) */}
                <div className="mobile-only" style={{ marginBottom: '1.5rem' }}>
                  
                  {/* Hero Place New Order CTA */}
                  <div 
                    onClick={() => {
                      setMobileOrderDefaultService('embroidery');
                      setIsMobileOrderOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      borderRadius: '20px',
                      padding: '1.25rem',
                      color: '#ffffff',
                      marginBottom: '1rem',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.25)',
                      border: '1.5px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                        <span style={{
                          background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                          color: 'var(--color-text-on-primary, #ffffff)',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Zap size={11} /> 4-8 HOUR EXPRESS
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          • 100% Quality Guaranteed
                        </span>
                      </div>

                      <h3 style={{ margin: '0.2rem 0 0.25rem', fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                        Place New Order
                      </h3>
                      <p style={{ margin: '0 0 0.85rem', fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.35 }}>
                        Embroidery Digitizing • Vector Art • Custom Patches
                      </p>

                      <div style={{
                        background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                        color: 'var(--color-text-on-primary, #ffffff)',
                        padding: '0.65rem 1.15rem',
                        borderRadius: '12px',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
                      }}>
                        Start Order Now <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* 5 Quick Action Cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '0.4rem',
                    marginBottom: '1.25rem'
                  }}>
                    {/* 1. New Order */}
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOrderDefaultService('embroidery');
                        setIsMobileOrderOpen(true);
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.65rem 0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlusCircle size={20} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>New Order</span>
                    </button>

                    {/* 2. My Orders */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.65rem 0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ClipboardList size={20} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>My Orders</span>
                      {activeOrders.length > 0 && (
                        <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#0284c7', color: '#fff', fontSize: '0.55rem', fontWeight: 900, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {activeOrders.length}
                        </span>
                      )}
                    </button>

                    {/* 3. Messages */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('support')}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.65rem 0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MessageSquare size={20} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>Messages</span>
                      {unreadChatCount > 0 && (
                        <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 900, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {unreadChatCount}
                        </span>
                      )}
                    </button>

                    {/* 4. Notifications */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('notifications')}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.65rem 0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={20} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>Alerts</span>
                      {unreadNotifCount > 0 && (
                        <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#f97316', color: '#fff', fontSize: '0.55rem', fontWeight: 900, width: '15px', height: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {unreadNotifCount}
                        </span>
                      )}
                    </button>

                    {/* 5. Profile */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.65rem 0.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} />
                      </div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>Profile</span>
                    </button>
                  </div>

                  {/* Active Orders Live Progress Snapshot (if any active order) */}
                  {activeOrders.length > 0 && (
                    <div style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                            Active Order In Production
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                        >
                          View All ({activeOrders.length}) →
                        </button>
                      </div>

                      {(() => {
                        const topOrd = activeOrders[0];
                        const primaryImg = topOrd?.artworkUrl || topOrd?.image_url || topOrd?.logo || topOrd?.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        return (
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <img
                              src={primaryImg}
                              alt={topOrd.title}
                              style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid var(--color-border)', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                                  {formatOrderId(topOrd.id)}
                                </span>
                                <h5 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {topOrd.title}
                                </h5>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDrawer(topOrd)}
                                  className="btn btn-sm btn-outline"
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px' }}
                                >
                                  Track Order
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenLiveSupport(topOrd.id)}
                                  className="btn btn-sm btn-primary-orange"
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '6px' }}
                                >
                                  Chat <MessageSquare size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 3 Core Services Choice */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Studio Services
                    </div>

                    {[
                      { id: 'embroidery', title: 'Embroidery Digitizing', desc: 'DST, PES, EMB files with wilcom native stitch pathing', icon: Layers, price: '$15' },
                      { id: 'vector', title: 'Vector Art Tracing', desc: 'Crisp vector AI, EPS, SVG for printing & engraving', icon: PenTool, price: '$12' },
                      { id: 'patch', title: 'Custom Physical Patches', desc: 'Manufactured custom patches with velcro/iron-on backing', icon: Package, price: '$45' }
                    ].map(svc => {
                      const IconComp = svc.icon;
                      return (
                        <div
                          key={svc.id}
                          onClick={() => {
                            setMobileOrderDefaultService(svc.id);
                            setIsMobileOrderOpen(true);
                          }}
                          style={{
                            background: 'var(--color-surface)',
                            border: '1.5px solid var(--color-border)',
                            borderRadius: '14px',
                            padding: '0.85rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconComp size={20} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{svc.title}</h5>
                              <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--color-primary)' }}>From {svc.price}</span>
                            </div>
                            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {svc.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Orders Section Container */}
                <div id="orders-table-wrapper" className="card orders-table-container" style={{ padding: '1.25rem' }}>
                  
                  {/* Table Header Controls */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.25rem',
                    flexWrap: 'wrap',
                    gap: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        style={{
                          background: filterStatus === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
                          backgroundColor: filterStatus === 'all' ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: filterStatus === 'all' ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)',
                          border: filterStatus === 'all' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'all' ? '0 4px 14px var(--color-primary-glow)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        All Orders ({currentTabOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('active')}
                        style={{
                          background: filterStatus === 'active' ? 'var(--color-primary)' : 'var(--color-surface)',
                          backgroundColor: filterStatus === 'active' ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: filterStatus === 'active' ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)',
                          border: filterStatus === 'active' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'active' ? '0 4px 14px var(--color-primary-glow)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        Active ({activeOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('delivered')}
                        style={{
                          background: filterStatus === 'delivered' ? 'var(--color-success)' : 'var(--color-surface)',
                          backgroundColor: filterStatus === 'delivered' ? 'var(--color-success)' : 'var(--color-surface)',
                          color: filterStatus === 'delivered' ? '#ffffff' : 'var(--color-success-text)',
                          border: filterStatus === 'delivered' ? '1.5px solid var(--color-success)' : '1.5px solid var(--color-border)',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'delivered' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        📦 Delivered ({deliveredOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('revision')}
                        style={{
                          background: filterStatus === 'revision' ? 'var(--color-primary)' : 'var(--color-surface)',
                          backgroundColor: filterStatus === 'revision' ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: filterStatus === 'revision' ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)',
                          border: filterStatus === 'revision' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'revision' ? '0 4px 14px var(--color-primary-glow)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        🔄 In Revision ({revisionOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('completed')}
                        style={{
                          background: filterStatus === 'completed' ? 'var(--color-primary)' : 'var(--color-surface)',
                          backgroundColor: filterStatus === 'completed' ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: filterStatus === 'completed' ? 'var(--color-text-on-primary, #ffffff)' : 'var(--color-text-primary)',
                          border: filterStatus === 'completed' ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                          fontWeight: 800,
                          fontSize: '0.825rem',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'completed' ? '0 4px 14px var(--color-primary-glow)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        ✅ Completed ({completedOrders.length})
                      </button>
                    </div>

                    {/* Search input */}
                    <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Search order ID or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {filteredDigitizingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <FileText size={42} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
                      <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>No orders found matching your search filter.</p>
                      <p style={{ fontSize: '0.85rem' }}>Click "Upload New Design Brief" to place your embroidery or vector job.</p>
                    </div>
                  ) : (
                    <>
                      {/* A. DESKTOP DATA TABLE (Screens > 768px) */}
                      <div className="desktop-table-view" style={{ 
                        maxHeight: '560px', 
                        overflowY: 'auto', 
                        overflowX: 'auto', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-main)' }}>
                              <th style={{ padding: '0.75rem 1rem' }}>Uploaded Artwork & Design</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Service Type</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Delivery & Order Status</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Payment Status</th>
                              <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
                              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedCustOrders.map((ord) => {
                              const isPaid = isOrderPaid(ord);
                              const isDelivered = ord?.status === 'delivered' || (Array.isArray(ord?.uploadedMachineFiles) && ord.uploadedMachineFiles.length > 0 && ord?.status !== 'completed');
                              return (
                                <tr 
                                  key={ord?.id || Math.random()}
                                  style={{ 
                                    borderBottom: isPaid ? '1px solid var(--border-color)' : '1px solid #fed7aa', 
                                    background: isDelivered ? 'rgba(16, 185, 129, 0.08)' : (isPaid ? 'var(--bg-card)' : 'rgba(249, 115, 22, 0.04)'),
                                    transition: 'background 0.15s' 
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = isDelivered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.08)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = isDelivered ? 'rgba(16, 185, 129, 0.08)' : (isPaid ? 'var(--bg-card)' : 'rgba(249, 115, 22, 0.04)')}
                                >
                                  {/* Title & Interactive Lightbox Artwork Thumbnail */}
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                      <div 
                                        style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
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
                                          style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: isDelivered ? '2px solid #10b981' : '1.5px solid var(--orange-600)' }}
                                        />
                                        <div style={{
                                          position: 'absolute',
                                          inset: 0,
                                          background: 'rgba(15, 23, 42, 0.4)',
                                          borderRadius: '8px',
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
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.92rem' }}>
                                          {ord?.title || 'Embroidery Digitizing Order'}
                                          {ord?.isRush && <span className="badge badge-rush" style={{ fontSize: '0.65rem' }}>RUSH</span>}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                          ID: <strong>{formatOrderId(ord?.id)}</strong>{ord?.dimensions?.width && ord?.dimensions?.height ? ` • ${ord.dimensions.width}"x${ord.dimensions.height}"` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Service Type */}
                                  <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
                                      {ord?.type === 'vector' ? '✒️ Vector Art' : (ord?.type === 'patch' || ord?.type === 'patches' ? '🏷️ Custom Patches' : '🧵 Embroidery Digitizing')}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                      {ord?.serviceCategory || (ord?.type === 'vector' ? 'Vector Art Conversion' : (ord?.type === 'patch' || ord?.type === 'patches' ? 'Custom Physical Patches' : 'Embroidery Digitizing'))}
                                    </div>
                                  </td>

                                  {/* Date Submitted */}
                                  <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                      {ord?.createdAt || ord?.created_at ? new Date(ord.createdAt || ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {ord?.createdAt || ord?.created_at ? new Date(ord.createdAt || ord.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
                                    </div>
                                  </td>

                                  {/* Delivery & Order Status (NEW) */}
                                  <td style={{ padding: '1rem' }}>
                                    {getOrderDeliveryStatusBadge(ord)}
                                  </td>

                                  {/* Payment Status */}
                                  <td style={{ padding: '1rem' }}>
                                    {getPaymentStatusBadge(ord)}
                                  </td>

                                  {/* Cost */}
                                  <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                                    ${parseFloat(ord?.price || ord?.totalPrice || 0).toFixed(2)}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                      {isDelivered && (
                                        <button
                                          type="button"
                                          onClick={() => setSelectedOrderForDrawer(ord)}
                                          style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            whiteSpace: 'nowrap'
                                          }}
                                        >
                                          <PackageCheck size={14} /> Download / Review
                                        </button>
                                      )}

                                      {!isPaid && (
                                        <button
                                          type="button"
                                          onClick={() => handlePayOrder(ord)}
                                          style={{
                                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '0.45rem 0.85rem',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.78rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.28)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.3rem',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                                        >
                                          <Zap size={12} /> Pay Now
                                        </button>
                                      )}

                                      <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setSelectedOrderForDrawer(ord)}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.35rem',
                                          padding: '0.45rem 0.85rem',
                                          borderRadius: '8px',
                                          fontWeight: 700,
                                          fontSize: '0.78rem',
                                          color: 'var(--navy-800)',
                                          borderColor: 'var(--border-color)',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        View Order <ChevronRight size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* B. MOBILE NATIVE APP ORDER CARDS (Screens <= 768px - Fiverr Standard) */}
                      <div className="mobile-cards-view">
                        {paginatedCustOrders.map((ord) => {
                          const isPaid = isOrderPaid(ord);
                          const ordStatus = String(ord?.status || '').toLowerCase();
                          const isDelivered = ordStatus === 'delivered';
                          const isRevision = ordStatus === 'revision' || ordStatus === 'revision_requested';
                          const isCompleted = ordStatus === 'completed';

                          const primaryImg = 
                            ord?.artworkUrl || 
                            ord?.image_url || 
                            ord?.logo || 
                            ord?.uploadedFiles?.[0]?.url || 
                            ord?.uploadedFiles?.[0]?.public_url || 
                            ord?.placementItems?.[0]?.files?.[0]?.url || 
                            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';

                          return (
                            <div 
                              key={ord?.id || Math.random()}
                              className="mobile-order-card"
                              style={{
                                border: isDelivered ? '1.5px solid #86efac' : (isPaid ? '1px solid var(--border-color)' : '1.5px solid #fed7aa'),
                                background: isDelivered ? '#f0fdf4' : (isPaid ? '#ffffff' : '#fffcf6'),
                                borderRadius: '12px',
                                padding: '0.85rem',
                                marginBottom: '0.75rem',
                                boxShadow: isDelivered ? '0 4px 14px rgba(16, 185, 129, 0.12)' : '0 1px 4px rgba(0,0,0,0.04)'
                              }}
                            >
                              {/* Delivered Banner Alert on Mobile */}
                              {isDelivered && (
                                <div style={{
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: '#ffffff',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '8px',
                                  fontSize: '0.725rem',
                                  fontWeight: 800,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  marginBottom: '0.65rem',
                                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <PackageCheck size={14} /> Production Files Ready!
                                  </span>
                                  <span style={{ fontSize: '0.68rem', textDecoration: 'underline', opacity: 0.95 }}>
                                    Download & Review
                                  </span>
                                </div>
                              )}

                              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                {/* Thumbnail */}
                                <div 
                                  style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                                  onClick={() => setLightboxOrder(ord)}
                                >
                                  <img 
                                    src={primaryImg} 
                                    alt={ord?.title || 'Design'}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                                    }}
                                    style={{ width: '58px', height: '58px', borderRadius: '10px', objectFit: 'cover', border: isDelivered ? '2px solid #10b981' : '1.5px solid var(--orange-500)' }}
                                  />
                                  <div style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.65)', borderRadius: '4px', padding: '1px 3px', color: '#fff', fontSize: '0.55rem', display: 'flex', alignItems: 'center' }}>
                                    <ZoomIn size={10} />
                                  </div>
                                </div>

                                {/* Main details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.35rem' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-600)', background: '#fff7ed', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                          {formatOrderId(ord?.id)}
                                        </span>
                                        {ord?.isRush && (
                                          <span className="badge badge-rush" style={{ fontSize: '0.6rem', padding: '0.05rem 0.35rem' }}>RUSH</span>
                                        )}
                                      </div>
                                      <h4 style={{ margin: '0.25rem 0 0.1rem', fontSize: '0.92rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.25 }}>
                                        {ord?.title || 'Studio Order'}
                                      </h4>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', whiteSpace: 'nowrap' }}>
                                      ${parseFloat(ord?.price || ord?.totalPrice || 0).toFixed(2)}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    <span>{ord?.type === 'vector' ? '✒️ Vector Art' : (ord?.type === 'patch' ? '🏷️ Custom Patches' : '🧵 Embroidery')}</span>
                                    <span>•</span>
                                    <span>{ord?.createdAt || ord?.created_at ? `${new Date(ord.createdAt || ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${new Date(ord.createdAt || ord.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : 'Recent'}</span>
                                  </div>

                                  <div style={{ marginTop: '0.4rem' }}>
                                    {getOrderDeliveryStatusBadge(ord)}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer Actions */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '0.4rem' }}>
                                <div>
                                  {getPaymentStatusBadge(ord)}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  {isCompleted ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderForDrawer(ord)}
                                      style={{
                                        background: '#dcfce7',
                                        color: '#15803d',
                                        border: '1px solid #bbf7d0',
                                        padding: '0.35rem 0.7rem',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                      }}
                                    >
                                      <PackageCheck size={13} /> Files Ready
                                    </button>
                                  ) : isRevision ? (
                                    <span style={{
                                      background: '#fff1f2',
                                      color: '#e11d48',
                                      border: '1px solid #fecdd3',
                                      padding: '0.3rem 0.6rem',
                                      borderRadius: '6px',
                                      fontWeight: 800,
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}>
                                      🔄 Modification Sent
                                    </span>
                                  ) : isDelivered ? (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderForDrawer(ord)}
                                      style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '0.35rem 0.7rem',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                      }}
                                    >
                                      <PackageCheck size={13} /> Review & Download
                                    </button>
                                  ) : null}


                                  {!isPaid && (
                                    <button
                                      type="button"
                                      onClick={() => handlePayOrder(ord)}
                                      style={{
                                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '6px',
                                        fontWeight: 800,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        boxShadow: '0 2px 6px rgba(249, 115, 22, 0.28)'
                                      }}
                                    >
                                      <Zap size={12} /> Pay Now
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForDrawer(ord)}
                                    style={{
                                      background: '#f8fafc',
                                      border: '1px solid #cbd5e1',
                                      color: 'var(--navy-800)',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '6px',
                                      fontWeight: 700,
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    View <ChevronRight size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
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

            {/* TAB: MY ORDERS (Clean, high-performance order management) */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Header & Controls */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                      My Orders
                    </h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Track artwork production, machine files, quotes & revisions
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-subtle, #f1f5f9)', padding: '3px', borderRadius: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('active')}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: orderFilterTab === 'active' ? '#ffffff' : 'transparent',
                          color: orderFilterTab === 'active' ? '#ea580c' : 'var(--text-muted)',
                          fontWeight: orderFilterTab === 'active' ? 900 : 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          boxShadow: orderFilterTab === 'active' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        Active ({activeOrders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('completed')}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: orderFilterTab === 'completed' ? '#ffffff' : 'transparent',
                          color: orderFilterTab === 'completed' ? '#16a34a' : 'var(--text-muted)',
                          fontWeight: orderFilterTab === 'completed' ? 900 : 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          boxShadow: orderFilterTab === 'completed' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        Completed ({completedOrders.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderFilterTab('all')}
                        style={{
                          padding: '0.4rem 0.85rem',
                          borderRadius: '8px',
                          border: 'none',
                          background: orderFilterTab === 'all' ? '#ffffff' : 'transparent',
                          color: orderFilterTab === 'all' ? 'var(--navy-900)' : 'var(--text-muted)',
                          fontWeight: orderFilterTab === 'all' ? 900 : 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          boxShadow: orderFilterTab === 'all' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        All ({myOrders.length})
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileOrderDefaultService('embroidery');
                        setIsMobileOrderOpen(true);
                      }}
                      className="btn btn-primary-orange"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 800, borderRadius: '10px' }}
                    >
                      <PlusCircle size={16} /> + New Order
                    </button>
                  </div>
                </div>

                {/* Orders List / Cards */}
                {(() => {
                  const filtered = myOrders.filter(o => {
                    const s = String(o?.status || '').toLowerCase().trim();
                    const isCompleted = s === 'completed' || s === 'delivered';
                    if (orderFilterTab === 'active') return !isCompleted && s !== 'cancelled';
                    if (orderFilterTab === 'completed') return isCompleted;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div style={{
                        background: '#ffffff',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '3rem 1.5rem',
                        textAlign: 'center'
                      }}>
                        <Package size={40} style={{ color: '#94a3b8', margin: '0 auto 0.75rem', opacity: 0.5 }} />
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                          No Orders Found
                        </h3>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {orderFilterTab === 'active' ? 'You have no active orders in production right now.' : 'No completed orders found in your account history.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOrderDefaultService('embroidery');
                            setIsMobileOrderOpen(true);
                          }}
                          className="btn btn-primary-orange"
                          style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 800, borderRadius: '10px' }}
                        >
                          <PlusCircle size={16} /> Place Your First Order
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      {filtered.map(ord => {
                        const primaryImg = ord?.artworkUrl || ord?.image_url || ord?.logo || ord?.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        const statusObj = getOrderDeliveryStatusBadge(ord);
                        const isDelivered = String(ord.status).toLowerCase() === 'delivered' || String(ord.status).toLowerCase() === 'completed';

                        return (
                          <div
                            key={ord.id}
                            style={{
                              background: '#ffffff',
                              border: '1.5px solid var(--border-color)',
                              borderRadius: '16px',
                              padding: '1.15rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                              <img
                                src={primaryImg}
                                alt={ord.title}
                                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1.5px solid #fed7aa', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#ea580c', background: '#fff7ed', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                    {formatOrderId(ord.id)}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                    {ord.serviceCategory || (ord.type === 'vector' ? 'Vector' : (ord.type === 'patch' ? 'Patch' : 'Digitizing'))}
                                  </span>
                                </div>
                                <h4 style={{ margin: '0.2rem 0', fontSize: '0.95rem', fontWeight: 900, color: 'var(--navy-950)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {ord.title || 'Studio Order'}
                                </h4>
                                <div>{statusObj}</div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem', fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Amount: <strong style={{ color: 'var(--navy-950)' }}>${Number(ord.totalPrice || ord.price || 0).toFixed(2)}</strong></span>
                              <span style={{ color: ord.isRush ? '#ea580c' : '#64748b', fontWeight: 700 }}>
                                {ord.isRush ? '⚡ Express 4-8h' : '⏱️ Standard 12-24h'}
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForDrawer(ord)}
                                className="btn btn-outline"
                                style={{ padding: '0.45rem', fontSize: '0.78rem', fontWeight: 800, borderRadius: '8px', justifyContent: 'center' }}
                              >
                                {isDelivered ? '📥 Files & Details' : '🔍 Track Order'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenLiveSupport(ord.id)}
                                className="btn btn-primary-orange"
                                style={{ padding: '0.45rem', fontSize: '0.78rem', fontWeight: 800, borderRadius: '8px', justifyContent: 'center' }}
                              >
                                <MessageSquare size={13} /> Chat Digitizer
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB: NOTIFICATIONS VIEW */}
            {activeTab === 'notifications' && (
              <ClientNotificationsView
                onNavigateToOrder={(ordId) => {
                  const found = myOrders.find(o => String(o.id) === String(ordId) || formatOrderId(o.id) === String(ordId));
                  if (found && setSelectedOrderForDrawer) {
                    setSelectedOrderForDrawer(found);
                  }
                }}
                onNavigateToChat={(chatId) => {
                  setSelectedOrderChatId(chatId);
                  setActiveTab('support');
                }}
                userEmail={userEmail}
              />
            )}

            {/* TAB: WORKING CHAT & HELP / SUPPORT INBOX */}
            {(activeTab === 'support' || activeTab === 'help-support' || activeTab === 'inbox') && (
              <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <ClientChatInbox initialOrderId={activeTab === 'help-support' ? 'help-support' : 'inbox'} />
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* 1. APPEARANCE & THEME CUSTOMIZATION CARD */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Palette size={22} style={{ color: 'var(--orange-500)' }} />
                        Appearance & Theme System
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Choose your preferred studio brand theme and color palette. Updates instantly across your portal.
                      </p>
                    </div>

                    {/* Mode Toggle Switch (Light / Dark) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.35rem 0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          background: theme === 'light' ? 'var(--bg-card)' : 'transparent',
                          color: theme === 'light' ? 'var(--navy-950)' : 'var(--text-muted)',
                          boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Sun size={15} style={{ color: theme === 'light' ? '#f59e0b' : 'inherit' }} />
                        Light
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.825rem',
                          background: theme === 'dark' ? 'var(--bg-card)' : 'transparent',
                          color: theme === 'dark' ? 'var(--navy-950)' : 'var(--text-muted)',
                          boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Moon size={15} style={{ color: theme === 'dark' ? '#60a5fa' : 'inherit' }} />
                        Dark
                      </button>
                    </div>
                  </div>

                  {/* Themes Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                    gap: '1.25rem'
                  }}>
                    {availableThemes.map((preset) => (
                      <ThemePreviewCard
                        key={preset.id}
                        themePreset={preset}
                        isSelected={colorTheme === preset.id}
                        mode={theme}
                        onSelect={(id) => setColorTheme(id)}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. STUDIO PREFERENCES CARD */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Production Preferences & Alerts
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                        Default Required Machine Formats
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['.DST (Tajima)', '.PES (Brother)', '.EXP (Melco)', '.EMB (Wilcom)', '.JEF (Janome)'].map(fmt => (
                          <span key={fmt} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-800)' }}>
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

      {/* 3. FIXED NATIVE APP BOTTOM NAVIGATION BAR (Fiverr Standard Equal-Divide) */}
      <nav 
        className="mobile-only mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          zIndex: 9990,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(226, 232, 240, 0.95)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          height: '64px',
          padding: '0.2rem 0 max(0.55rem, env(safe-area-inset-bottom, 0.55rem))',
          boxShadow: '0 -4px 20px rgba(15, 23, 42, 0.08)'
        }}
        aria-label="Mobile Navigation"
      >
        {/* Tab 1: Home / Dashboard */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            color: activeTab === 'dashboard' ? 'var(--orange-600)' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.2rem 0',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            background: activeTab === 'dashboard' ? '#fff7ed' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Home size={19} style={{ color: activeTab === 'dashboard' ? 'var(--orange-600)' : '#64748b' }} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'dashboard' ? 800 : 600, marginTop: '0.1rem' }}>
            Home
          </span>
        </button>

        {/* Tab 2: Orders / Tracking */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            color: activeTab === 'orders' ? 'var(--orange-600)' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.2rem 0',
            position: 'relative',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            background: activeTab === 'orders' ? '#fff7ed' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <ClipboardList size={19} style={{ color: activeTab === 'orders' ? 'var(--orange-600)' : '#64748b' }} />
            {activeOrders.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '4px',
                background: 'var(--orange-500)',
                color: '#ffffff',
                fontSize: '0.58rem',
                fontWeight: 900,
                borderRadius: '9999px',
                padding: '0.05rem 0.3rem',
                minWidth: '15px',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {activeOrders.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'orders' ? 800 : 600, marginTop: '0.1rem' }}>
            Orders
          </span>
        </button>

        {/* Tab 3: Center Elevated + Order Action */}
        <button
          type="button"
          onClick={() => {
            setMobileOrderDefaultService('embroidery');
            setIsMobileOrderOpen(true);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginTop: '-16px',
            position: 'relative'
          }}
          aria-label="Create New Order"
        >
          <div style={{
            background: 'linear-gradient(135deg, #ff7a00 0%, #ff5500 100%)',
            color: '#ffffff',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(255, 122, 0, 0.45)',
            border: '3px solid #ffffff'
          }}>
            <Plus size={24} style={{ color: '#ffffff', strokeWidth: 3 }} />
          </div>
          <span style={{ 
            fontSize: '0.62rem', 
            fontWeight: 800, 
            color: 'var(--orange-600)', 
            marginTop: '0.15rem' 
          }}>
            + Order
          </span>
        </button>

        {/* Tab 4: Live Messages / Inbox */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            color: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? 'var(--orange-600)' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.2rem 0',
            position: 'relative',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            background: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? '#fff7ed' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <MessageSquare size={19} style={{ color: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? 'var(--orange-600)' : '#64748b' }} />
            {unreadChatCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '4px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.58rem',
                fontWeight: 900,
                borderRadius: '9999px',
                padding: '0.05rem 0.3rem',
                minWidth: '15px',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {unreadChatCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: (activeTab === 'support' || activeTab === 'inbox' || activeTab === 'help-support') ? 800 : 600, marginTop: '0.1rem' }}>
            Inbox
          </span>
        </button>

        {/* Tab 5: Alerts / Notifications */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('notifications');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            color: activeTab === 'notifications' ? 'var(--orange-600)' : '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.2rem 0',
            position: 'relative',
            transition: 'all 0.18s ease'
          }}
        >
          <div style={{
            padding: '0.15rem 0.55rem',
            borderRadius: '12px',
            background: activeTab === 'notifications' ? '#fff7ed' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Bell size={19} style={{ color: activeTab === 'notifications' ? 'var(--orange-600)' : '#64748b' }} />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '4px',
                background: '#f97316',
                color: '#ffffff',
                fontSize: '0.58rem',
                fontWeight: 900,
                borderRadius: '9999px',
                padding: '0.05rem 0.3rem',
                minWidth: '15px',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {unreadNotifCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: activeTab === 'notifications' ? 800 : 600, marginTop: '0.1rem' }}>
            Alerts
          </span>
        </button>
      </nav>

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

      {/* MOBILE 5-STEP STREAMLINED ORDER FLOW MODAL */}
      <MobileSimpleOrderModal
        isOpen={isMobileOrderOpen}
        onClose={() => setIsMobileOrderOpen(false)}
        defaultService={mobileOrderDefaultService}
        onOrderCreated={(newOrd) => {
          setActiveTab('orders');
        }}
      />

    </div>
  );
};
