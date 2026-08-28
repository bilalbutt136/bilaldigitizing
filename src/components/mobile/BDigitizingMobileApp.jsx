'use client';

import React, { useState, useEffect } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import { 
  Home, 
  Mail, 
  Search, 
  ClipboardList, 
  User, 
  Bell, 
  SlidersHorizontal, 
  MoreVertical, 
  ChevronRight, 
  Plus, 
  Layers, 
  PenTool, 
  Package, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Check, 
  Sparkles, 
  Send, 
  Paperclip, 
  X, 
  Settings, 
  HelpCircle, 
  Share2, 
  ShieldCheck, 
  ArrowLeft, 
  RotateCcw, 
  FileText, 
  Download,
  LayoutGrid,
  Tag,
  Palette,
  LogOut,
  Info,
  Globe,
  Phone,
  MessageCircle,
  ExternalLink,
  Star,
  Lock,
  Volume2,
  VolumeX,
  CreditCard,
  ChevronDown,
  RefreshCw,
  Activity,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { 
  fetchConversations, 
  fetchNotificationsFromSupabase, 
  markNotificationAsReadInSupabase, 
  subscribeToLiveMessages,
  upsertClientInSupabase,
  createNotificationInSupabase
} from '../../services/supabaseService';
import MobileSimpleOrderModal from '../customer/MobileSimpleOrderModal';
import { ClientChatInbox } from '../customer/ClientChatInbox';
import { THEME_PRESETS } from '../../utils/themePresets';
import { handleNotificationClick } from '../../utils/notificationRouter';

export const BDigitizingMobileApp = () => {
  const navigate = useNavigate();
  const { 
    orders = [], 
    authUser, 
    currentUser, 
    isAuthenticated,
    openOrderTrackerDrawer,
    setSelectedOrderForDrawer,
    setIsAuthModalOpen,
    setAuthModalMode,
    walletBalance = 0,
    setIsDepositModalOpen,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    showToast,
    logout,
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    setMobileMode,
    dynamicPricingTiers = [],
    notifications: globalNotifications = [],
    markNotificationAsRead: markGlobalNotificationAsRead,
    refreshOrders
  } = useAppState();

  // Active Tab: 'home' | 'inbox' | 'categories' | 'orders' | 'profile'
  const getInitialMobileTab = () => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const validTabs = ['home', 'inbox', 'categories', 'orders', 'profile'];
        if (tabParam && validTabs.includes(tabParam)) return tabParam;
        
        const storedTab = localStorage.getItem('bdigi_mobile_active_tab');
        if (storedTab && validTabs.includes(storedTab)) return storedTab;
      } catch {}
    }
    return 'home';
  };

  const [mobileTab, setMobileTabState] = useState(getInitialMobileTab);

  const setMobileTab = (newTab) => {
    setMobileTabState(newTab);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bdigi_mobile_active_tab', newTab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', newTab);
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
  };

  // Sync tab with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const validTabs = ['home', 'inbox', 'categories', 'orders', 'profile'];
        if (tabParam && validTabs.includes(tabParam)) {
          setMobileTabState(tabParam);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Category sub-tab: 'all' | 'embroidery' | 'vector' | 'patches'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  
  // Orders filter: 'all' | 'awaiting_payment' | 'delivered' | 'active' | 'completed'
  const [orderFilter, setOrderFilter] = useState('all');

  // Modals & Chat state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDefaultService, setOrderDefaultService] = useState('embroidery');
  const [selectedChatOrderId, setSelectedChatOrderId] = useState(null);
  const [isOrderActionMenuOpen, setIsOrderActionMenuOpen] = useState(null); // order object
  
  // Real-time unread counts
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Sub-Modals on Mobile
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isVipInfoModalOpen, setIsVipInfoModalOpen] = useState(false);

  // Client VIP Mode State (persisted)
  const [isVipMode, setIsVipMode] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Preferences Form State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [defaultEmbFormat, setDefaultEmbFormat] = useState('DST');
  const [defaultVecFormat, setDefaultVecFormat] = useState('AI');
  const [currencyPref, setCurrencyPref] = useState('USD');
  const [autoDownloadReceipts, setAutoDownloadReceipts] = useState(true);

  // Feedback Form State
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] = useState('Quality');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Active authenticated user (NO mock fallback)
  const activeUser = authUser || currentUser || null;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const userName = activeUser?.user_metadata?.full_name || activeUser?.name || (userEmail ? userEmail.split('@')[0] : 'Guest Visitor');
  const userInitial = (userName?.[0] || 'B').toUpperCase();

  // Load Saved Preferences on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedVip = localStorage.getItem('bdigi_client_vip_mode');
        if (savedVip === 'true') setIsVipMode(true);

        const savedSound = localStorage.getItem('bdigi_audio_enabled');
        if (savedSound !== null) setSoundEnabled(savedSound !== 'false');

        const savedEmbFmt = localStorage.getItem('bdigi_pref_emb_format');
        if (savedEmbFmt) setDefaultEmbFormat(savedEmbFmt);

        const savedVecFmt = localStorage.getItem('bdigi_pref_vec_format');
        if (savedVecFmt) setDefaultVecFormat(savedVecFmt);

        const savedCurr = localStorage.getItem('bdigi_pref_currency');
        if (savedCurr) setCurrencyPref(savedCurr);
      } catch {}
    }
  }, []);

  // Hydrate Profile fields when user changes
  useEffect(() => {
    if (activeUser) {
      setProfileName(activeUser.user_metadata?.full_name || activeUser.name || '');
      setProfileCompany(activeUser.user_metadata?.company || activeUser.company || '');
      setProfilePhone(activeUser.user_metadata?.phone || activeUser.phone || '');
    }
  }, [activeUser]);

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const handleManualRefreshOrders = async () => {
    if (typeof refreshOrders === 'function') {
      setIsRefreshingOrders(true);
      try {
        await refreshOrders();
      } catch (err) {
        console.warn('Refresh orders error:', err);
      } finally {
        setTimeout(() => setIsRefreshingOrders(false), 600);
      }
    }
  };

  // Automatically refresh live orders on component mount and when switching tabs
  useEffect(() => {
    if (typeof refreshOrders === 'function') {
      refreshOrders().catch(err => console.warn('Order sync note:', err));
    }
  }, [mobileTab, userEmail]);

  // Listen for global tab switch events (e.g. clicking Client Dashboard, Inbox, or Notifications from header)
  useEffect(() => {
    const handleTabSwitch = (e) => {
      const targetTab = e.detail?.tab;
      if (targetTab === 'dashboard' || targetTab === 'home') {
        setMobileTab('home');
        setIsPreferencesModalOpen(false);
        setIsAccountModalOpen(false);
        setIsSupportModalOpen(false);
        setIsFeedbackModalOpen(false);
        setIsLegalModalOpen(false);
        setIsNotifDrawerOpen(false);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetTab === 'orders') {
        setMobileTab('orders');
        setIsPreferencesModalOpen(false);
        setIsAccountModalOpen(false);
        setIsSupportModalOpen(false);
        setIsFeedbackModalOpen(false);
        setIsLegalModalOpen(false);
        setIsNotifDrawerOpen(false);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (targetTab === 'inbox' || targetTab === 'chat' || targetTab === 'support') {
        setMobileTab('inbox');
        if (e.detail?.orderId) {
          setSelectedChatOrderId(e.detail.orderId);
        }
      } else if (targetTab === 'profile' || targetTab === 'wallet' || targetTab === 'settings' || targetTab === 'account') {
        setMobileTab('profile');
      }
    };

    window.addEventListener('bdigi_switch_tab', handleTabSwitch);
    return () => window.removeEventListener('bdigi_switch_tab', handleTabSwitch);
  }, []);

  const isAdmin = authUser?.role === 'admin' || currentUser?.role === 'admin';

  // Helper to determine if an order is unpaid and awaiting payment to start
  const isOrderUnpaid = (o) => {
    if (!o) return false;
    const s = String(o?.status || '').toLowerCase().trim();
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const isPaidFlag = o?.isPaid === true || Boolean(o?.paid_at) || pStatus === 'paid' || pStatus === 'completed' || pStatus === 'wallet' || ['in_progress', 'digitizing', 'assigned', 'qc', 'delivered', 'completed'].includes(s);
    if (isPaidFlag) return false;
    return s === 'awaiting_payment' || s === 'pending_payment' || s === 'submitted' || s === 'pending' || pStatus === 'unpaid' || pStatus === 'pending';
  };

  // Filter Orders for Customer strictly (or show all if admin)
  const myOrders = orders.filter(o => {
    if (isAdmin) return true;

    let localOrderIds = [];
    if (typeof window !== 'undefined') {
      try {
        localOrderIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
      } catch {}
    }
    const cleanId = String(o?.id || '').trim().replace(/^#+/, '');
    const isLocalMatch = localOrderIds.some(lid => String(lid).trim().replace(/^#+/, '') === cleanId);
    if (isLocalMatch) return true;

    const clientEmail = (o?.client_email || o?.clientEmail || o?.user_email || o?.userEmail || o?.email || o?.recipient_email || '').toLowerCase().trim();
    if (userEmail) {
      if (clientEmail === userEmail) return true;
      if (o?.created_by && (String(o.created_by).toLowerCase() === activeUser?.id?.toLowerCase() || String(o.created_by).toLowerCase() === userEmail)) return true;
      if (o?.clientId && (String(o.clientId).toLowerCase() === activeUser?.id?.toLowerCase() || String(o.clientId).toLowerCase() === userEmail)) return true;
      if (o?.client_id && (String(o.client_id).toLowerCase() === activeUser?.id?.toLowerCase() || String(o.client_id).toLowerCase() === userEmail)) return true;
    }
    
    return !userEmail && (isLocalMatch || !clientEmail || clientEmail === 'guest@bdigitizing.pro');
  });

  const unpaidOrders = myOrders.filter(o => isOrderUnpaid(o));

  const deliveredOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    return (s === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0)) && s !== 'completed' && s !== 'cancelled';
  });

  const completedOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    return s === 'completed';
  });

  const activeOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    const isDeliv = s === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0);
    const isUnpaid = isOrderUnpaid(o);
    return !isDeliv && !isUnpaid && s !== 'completed' && s !== 'cancelled';
  });

  // Calculate live statistics for Dashboard
  const totalOrdersCount = myOrders.length;
  const activeOrdersCount = activeOrders.length;
  const deliveredOrdersCount = deliveredOrders.length;
  const completedOrdersCount = completedOrders.length;
  const unpaidOrdersCount = unpaidOrders.length;
  const totalValueSpent = myOrders.reduce((sum, o) => {
    const rawP = parseFloat(o.totalPrice ?? o.price ?? 0);
    const p = !isNaN(rawP) && rawP > 0 ? rawP : 15;
    return sum + p;
  }, 0);

  const handleOpenPaymentForOrder = (ord) => {
    const priceVal = parseFloat(ord.totalPrice || ord.price || 15);
    setCheckoutSession({
      amount: priceVal,
      orderId: ord.id,
      clientEmail: ord.client_email || ord.clientEmail || userEmail,
      title: ord.title || 'Order Payment',
      serviceType: ord.serviceType || 'embroidery'
    });
    setIsCheckoutModalOpen(true);
  };

  // Combine global in-memory notifications with Supabase live notifications
  const combinedNotifications = [
    ...(Array.isArray(notifications) ? notifications : []),
    ...(Array.isArray(globalNotifications) ? globalNotifications : [])
  ].filter((n, idx, arr) => arr.findIndex(item => String(item.id) === String(n.id)) === idx)
   .sort((a, b) => new Date(b.created_at || b.timestamp || 0) - new Date(a.created_at || a.timestamp || 0));

  const unreadNotifCount = combinedNotifications.filter(n => !n.is_read && !n.read).length;

  // Load Real-time Notifications & Messages
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const notifs = await fetchNotificationsFromSupabase(userEmail);
        if (isMounted && Array.isArray(notifs)) {
          setNotifications(notifs);
        }

        if (userEmail) {
          const convRes = await fetchConversations({ clientEmail: userEmail });
          if (isMounted && convRes?.conversations) {
            const totalUnread = convRes.conversations.reduce((sum, c) => sum + (c.clientUnreadCount || 0), 0);
            setUnreadChatCount(totalUnread);
          }
        }
      } catch (err) {
        console.warn('Mobile app sync note:', err);
      }
    };

    loadData();

    const unsubscribe = subscribeToLiveMessages({
      onMessage: () => {
        if (isMounted) loadData();
      },
      onNotification: () => {
        if (isMounted) loadData();
      }
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userEmail]);

  const handleOpenChat = (orderOrChannelId = null) => {
    setSelectedChatOrderId(orderOrChannelId);
    setMobileTab('inbox');
  };

  const handleOpenOrderConfigurator = (serviceType = 'embroidery') => {
    setOrderDefaultService(serviceType);
    setIsOrderModalOpen(true);
  };

  const handleToggleVipMode = () => {
    const nextVal = !isVipMode;
    setIsVipMode(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_client_vip_mode', String(nextVal));
    }
    if (nextVal) {
      showToast('Client VIP Mode Activated ✨ Priority Digitizer Queue Assigned', 'success');
      setIsVipInfoModalOpen(true);
    } else {
      showToast('VIP Mode Disabled', 'info');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!activeUser) return;
    setIsSavingProfile(true);
    try {
      const updatedData = {
        email: userEmail,
        name: profileName.trim(),
        company: profileCompany.trim(),
        phone: profilePhone.trim()
      };
      await upsertClientInSupabase(updatedData);
      showToast('Profile updated successfully! ✨', 'success');
      setIsAccountModalOpen(false);
    } catch (err) {
      showToast('Could not save profile: ' + (err.message || 'Please try again'), 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_audio_enabled', String(soundEnabled));
      localStorage.setItem('bdigi_pref_emb_format', defaultEmbFormat);
      localStorage.setItem('bdigi_pref_vec_format', defaultVecFormat);
      localStorage.setItem('bdigi_pref_currency', currencyPref);
      localStorage.setItem('bdigi_pref_auto_receipts', String(autoDownloadReceipts));
    }
    showToast('Preferences saved successfully! ✨', 'success');
    setIsPreferencesModalOpen(false);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      showToast('Please write a brief feedback note.', 'error');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await createNotificationInSupabase({
        type: 'client_feedback',
        title: `Feedback from ${userName} (${feedbackRating} Stars - ${feedbackCategory})`,
        body: feedbackText.trim(),
        user_email: userEmail || 'guest@bdigitizing.pro'
      });
      showToast('Thank you! Your feedback has been sent to our management team. ⭐', 'success');
      setFeedbackText('');
      setIsFeedbackModalOpen(false);
    } catch (err) {
      showToast('Thank you for your rating! ⭐', 'success');
      setIsFeedbackModalOpen(false);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Search filter across categories
  const allServicesData = [
    {
      id: 'embroidery',
      category: 'embroidery',
      title: 'Embroidery Digitizing',
      subtitle: 'Left Chest, Cap Front, 3D Puff, Jacket Back & Applique',
      startingPrice: 'From $10.00',
      eta: '4–12 Hours',
      icon: Layers,
      color: '#059669',
      tags: ['dst', 'pes', 'emb', 'exp', 'jef', 'wilcom', 'tajima', 'puff', 'hat', 'polo']
    },
    {
      id: 'vector',
      category: 'vector',
      title: 'Vector Art Tracing',
      subtitle: 'Logo Redraw, Screen Print Color Separation, Raster to Vector',
      startingPrice: 'From $15.00',
      eta: '6–12 Hours',
      icon: PenTool,
      color: '#ea580c',
      tags: ['ai', 'eps', 'svg', 'pdf', 'cdr', 'screen print', 'vector', 'logo', 'redraw']
    },
    {
      id: 'patch',
      category: 'patches',
      title: 'Custom Physical Patches',
      subtitle: 'Embroidered, 3D Molded PVC Rubber, Woven & Leather Patches',
      startingPrice: 'From $1.50 / pc',
      eta: '3–7 Days',
      icon: Package,
      color: '#0284c7',
      tags: ['patches', 'pvc', 'embroidered', 'woven', 'leather', 'velcro', 'iron-on', 'sample']
    },
    {
      id: 'embroidery',
      category: 'embroidery',
      title: '3D Puff Foam Digitizing',
      subtitle: 'High density stitch pathing calibrated for raised foam caps & beanies',
      startingPrice: 'From $35.00',
      eta: '8–12 Hours',
      icon: Zap,
      color: '#d97706',
      tags: ['3d puff', 'foam', 'hats', 'caps', 'high density', 'satin']
    },
    {
      id: 'vector',
      category: 'vector',
      title: 'Pantone Spot Color Separation',
      subtitle: 'Print-ready vector layers for silk screen printing & direct-to-garment',
      startingPrice: 'From $25.00',
      eta: '6–12 Hours',
      icon: Sparkles,
      color: '#7c3aed',
      tags: ['pantone', 'color separation', 'spot colors', 'halftones', 'cmyk']
    }
  ];

  const filteredServices = allServicesData.filter(svc => {
    if (activeCategoryFilter !== 'all' && svc.category !== activeCategoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      svc.title.toLowerCase().includes(q) ||
      svc.subtitle.toLowerCase().includes(q) ||
      svc.tags.some(t => t.includes(q))
    );
  });

  return (
    <div 
      className="mobile-app-root theme-light-enforced"
      style={{
        background: '#ffffff',
        minHeight: '100vh',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: mobileTab === 'inbox' ? '0px' : '70px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      
      {/* =========================================================================
          SCREEN 1: HOME TAB
          ========================================================================= */}
      {mobileTab === 'home' && (
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f8fafc' }}>
          
          {/* Top Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '16px', border: '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.03em' }}>
                bdigitizing<span style={{ color: '#10b981' }}>.</span>
              </span>
              {isVipMode && (
                <span style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  VIP CLIENT
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  color: '#0f172a',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={19} />
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }} />
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileTab('categories')}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  color: '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LayoutGrid size={19} />
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div 
            onClick={() => setMobileTab('categories')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            <Search size={18} style={{ color: '#047857' }} />
            <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
              Search services (Embroidery, Vector, Patches...)
            </span>
          </div>

          {/* Quick Metrics Studio Overview Banner */}
          {myOrders.length > 0 && (
            <div 
              onClick={() => setMobileTab('orders')}
              style={{
                background: 'linear-gradient(135deg, #090f1d 0%, #111a2e 100%)',
                borderRadius: '16px',
                padding: '0.9rem 1.15rem',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Layers size={20} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                    Active Studio Tracker
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                    {activeOrdersCount} in production • {deliveredOrdersCount} delivered • {totalOrdersCount} total
                  </div>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#94a3b8' }} />
            </div>
          )}

          {/* Unpaid / Waiting for Payment Widget */}
          {unpaidOrders.length > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '0.9rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)'
                }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                    {unpaidOrders.length} Order{unpaidOrders.length > 1 ? 's' : ''} Waiting for Payment
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#c2410c', fontWeight: 700 }}>
                    Complete payment to start master digitizing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderFilter('awaiting_payment');
                  setMobileTab('orders');
                }}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)'
                }}
              >
                Pay Now →
              </button>
            </div>
          )}

          {/* Active Orders Widget */}
          {activeOrders.length > 0 && (
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              borderRadius: '16px',
              padding: '0.9rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                    {activeOrders.length} Order{activeOrders.length > 1 ? 's' : ''} in Production
                  </h4>
                  <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>
                    Master digitizers are testing stitch pathing
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileTab('orders')}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid #86efac',
                  borderRadius: '8px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#047857',
                  cursor: 'pointer'
                }}
              >
                Track →
              </button>
            </div>
          )}

          {/* Popular Services Section (Horizontal Slider) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                Our 3 Core Services
              </h3>
              <button
                type="button"
                onClick={() => setMobileTab('categories')}
                style={{ background: 'none', border: 'none', color: '#047857', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                View All →
              </button>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.85rem',
              overflowX: 'auto',
              paddingBottom: '0.35rem',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {/* Card 1: Embroidery Digitizing */}
              <div
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  minWidth: '155px',
                  width: '155px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Layers size={42} strokeWidth={2} />
                </div>
                <div style={{ padding: '0.75rem 0.85rem' }}>
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                    Embroidery Digitizing
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
                    From $10.00
                  </span>
                </div>
              </div>

              {/* Card 2: Vector Art Tracing */}
              <div
                onClick={() => handleOpenOrderConfigurator('vector')}
                style={{
                  minWidth: '155px',
                  width: '155px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <PenTool size={42} strokeWidth={2} />
                </div>
                <div style={{ padding: '0.75rem 0.85rem' }}>
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                    Vector Art Tracing
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
                    From $15.00
                  </span>
                </div>
              </div>

              {/* Card 3: Custom Physical Patches */}
              <div
                onClick={() => handleOpenOrderConfigurator('patch')}
                style={{
                  minWidth: '155px',
                  width: '155px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Package size={42} strokeWidth={2} />
                </div>
                <div style={{ padding: '0.75rem 0.85rem' }}>
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                    Custom Patches
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
                    From $1.50 / pc
                  </span>
                </div>
              </div>

              {/* Card 4: 4-8 Hour Express Rush */}
              <div
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  minWidth: '155px',
                  width: '155px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  flexShrink: 0
                }}
              >
                <div style={{
                  height: '110px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Zap size={42} strokeWidth={2} />
                </div>
                <div style={{ padding: '0.75rem 0.85rem' }}>
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.25 }}>
                    Express 2–6h Rush
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
                    +$10 Speed Fee
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Place New Order Big Floating CTA */}
          <button
            type="button"
            onClick={() => handleOpenOrderConfigurator('embroidery')}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '1.05rem',
              fontWeight: 900,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 6px 22px rgba(5, 150, 105, 0.35)',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
          >
            <Plus size={22} strokeWidth={3} /> Place New Order
          </button>

        </div>
      )}


      {/* =========================================================================
          SCREEN 2: INBOX / MESSAGES
          ========================================================================= */}
      {mobileTab === 'inbox' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100dvh - 66px - env(safe-area-inset-bottom, 0px))',
          maxHeight: 'calc(100dvh - 66px - env(safe-area-inset-bottom, 0px))',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Render Full Client Chat Inbox with built-in channels and complete scrolling */}
          <div style={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ClientChatInbox initialOrderId={selectedChatOrderId} />
          </div>
        </div>
      )}


      {/* =========================================================================
          SCREEN 3: CATEGORIES & SEARCH
          ========================================================================= */}
      {mobileTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0.85rem 1rem 1.5rem', gap: '1rem' }}>
          
          {/* Categories Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                Services & Packages
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Select any package to start instant order configuration
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenOrderConfigurator('embroidery')}
              style={{
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem 0.75rem',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={15} /> New Order
            </button>
          </div>

          {/* Live Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.65rem 0.95rem'
          }}>
            <Search size={18} style={{ color: '#64748b' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search formats, 3D puff, left chest, patches..."
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.88rem',
                color: '#0f172a',
                fontFamily: 'inherit'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {[
              { id: 'all', label: 'All Services' },
              { id: 'embroidery', label: '🧵 Embroidery' },
              { id: 'vector', label: '📐 Vector Art' },
              { id: 'patches', label: '📦 Patches' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveCategoryFilter(f.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: activeCategoryFilter === f.id ? '1.5px solid #059669' : '1px solid #cbd5e1',
                  background: activeCategoryFilter === f.id ? '#059669' : '#ffffff',
                  color: activeCategoryFilter === f.id ? '#ffffff' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtered Services List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#f8fafc', borderRadius: '14px' }}>
                <Search size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  No services matching "{searchQuery}"
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Try searching for "embroidery", "vector", "puff", or "patches".
                </p>
              </div>
            ) : (
              filteredServices.map((svc, idx) => {
                const IconComp = svc.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenOrderConfigurator(svc.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '14px',
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: svc.color || '#059669',
                      flexShrink: 0
                    }}>
                      <IconComp size={24} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                          {svc.title}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#047857' }}>
                          {svc.startingPrice}
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
                        {svc.subtitle}
                      </p>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> {svc.eta}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800, marginLeft: 'auto' }}>
                          Start Order →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}


      {/* =========================================================================
          SCREEN 4: MANAGE ORDERS WITH LIVE DATA STATISTICS & KPI DASHBOARD
          ========================================================================= */}
      {mobileTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#f8fafc' }}>
          
          {/* Manage Orders Top Bar */}
          <div style={{
            padding: '0.65rem 0.85rem',
            background: '#ffffff',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                Manage Orders
              </h2>
              <div style={{ fontSize: '0.66rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.05rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>{myOrders.length} total orders recorded</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={handleManualRefreshOrders}
                disabled={isRefreshingOrders}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem',
                  color: '#0f172a',
                  cursor: isRefreshingOrders ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Sync Live Orders"
              >
                <RefreshCw size={15} style={{ animation: isRefreshingOrders ? 'spin 0.8s linear infinite' : 'none' }} />
              </button>

              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem',
                  color: '#0f172a',
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={15} />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenOrderConfigurator('embroidery')}
                style={{
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  boxShadow: '0 2px 5px rgba(5, 150, 105, 0.25)'
                }}
              >
                <Plus size={14} /> New Order
              </button>
            </div>
          </div>

          {/* =========================================================================
              LIVE ORDER DATA STATISTICS & KPI DASHBOARD (COMPACTED)
              ========================================================================= */}
          <div style={{ padding: '0.45rem 0.75rem 0.15rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Activity size={13} style={{ color: '#059669' }} />
                <span>Live Studio Statistics</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                Tap metric to filter
              </span>
            </div>

            {/* Grid of 5 Key Stat Cards + Total Spend Pill */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              {/* Total Orders Card */}
              <div 
                onClick={() => setOrderFilter('all')}
                style={{
                  background: orderFilter === 'all' ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#ffffff',
                  color: orderFilter === 'all' ? '#ffffff' : '#0f172a',
                  border: orderFilter === 'all' ? '1.5px solid #0f172a' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <ClipboardList size={15} style={{ color: orderFilter === 'all' ? '#38bdf8' : '#64748b', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1 }}>
                  {totalOrdersCount}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: orderFilter === 'all' ? '#cbd5e1' : '#64748b', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  Total Orders
                </div>
              </div>

              {/* Waiting for Payment Card */}
              <div 
                onClick={() => setOrderFilter('awaiting_payment')}
                style={{
                  background: orderFilter === 'awaiting_payment' ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#ffffff',
                  color: orderFilter === 'awaiting_payment' ? '#ffffff' : '#0f172a',
                  border: orderFilter === 'awaiting_payment' ? '1.5px solid #ea580c' : (unpaidOrdersCount > 0 ? '1px solid #fdba74' : '1px solid #e2e8f0'),
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: unpaidOrdersCount > 0 ? '0 1px 6px rgba(234, 88, 12, 0.15)' : '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CreditCard size={15} style={{ color: orderFilter === 'awaiting_payment' ? '#fef08a' : '#ea580c', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, color: orderFilter === 'awaiting_payment' ? '#ffffff' : '#c2410c' }}>
                  {unpaidOrdersCount}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: orderFilter === 'awaiting_payment' ? '#fed7aa' : '#c2410c', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  Waiting Pay
                </div>
              </div>

              {/* In Production Card */}
              <div 
                onClick={() => setOrderFilter('active')}
                style={{
                  background: orderFilter === 'active' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff',
                  color: orderFilter === 'active' ? '#ffffff' : '#0f172a',
                  border: orderFilter === 'active' ? '1.5px solid #0284c7' : '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={15} style={{ color: orderFilter === 'active' ? '#bae6fd' : '#0284c7', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, color: orderFilter === 'active' ? '#ffffff' : '#0369a1' }}>
                  {activeOrdersCount}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: orderFilter === 'active' ? '#e0f2fe' : '#64748b', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  In Production
                </div>
              </div>

              {/* Delivered Card */}
              <div 
                onClick={() => setOrderFilter('delivered')}
                style={{
                  background: orderFilter === 'delivered' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#ffffff',
                  color: orderFilter === 'delivered' ? '#ffffff' : '#0f172a',
                  border: orderFilter === 'delivered' ? '1.5px solid #059669' : '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Package size={15} style={{ color: orderFilter === 'delivered' ? '#a7f3d0' : '#059669', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1, color: orderFilter === 'delivered' ? '#ffffff' : '#047857' }}>
                  {deliveredOrdersCount}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: orderFilter === 'delivered' ? '#d1fae5' : '#64748b', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  Delivered
                </div>
              </div>

              {/* Completed Card */}
              <div 
                onClick={() => setOrderFilter('completed')}
                style={{
                  background: orderFilter === 'completed' ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)' : '#ffffff',
                  color: orderFilter === 'completed' ? '#ffffff' : '#0f172a',
                  border: orderFilter === 'completed' ? '1.5px solid #334155' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <CheckCircle2 size={15} style={{ color: orderFilter === 'completed' ? '#94a3b8' : '#64748b', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 900, lineHeight: 1 }}>
                  {completedOrdersCount}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: orderFilter === 'completed' ? '#cbd5e1' : '#64748b', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  Completed
                </div>
              </div>

              {/* Total Spend Pill */}
              <div 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.4rem 0.3rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                <DollarSign size={15} style={{ color: '#059669', marginBottom: '0.1rem' }} />
                <div style={{ fontSize: '0.92rem', fontWeight: 900, lineHeight: 1, color: '#059669' }}>
                  ${totalValueSpent.toFixed(0)}
                </div>
                <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#64748b', marginTop: '0.1rem', textTransform: 'uppercase' }}>
                  Total Value
                </div>
              </div>
            </div>

            {/* Action Required Alert Banner for Unpaid Orders */}
            {unpaidOrdersCount > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.45rem',
                boxShadow: '0 1px 6px rgba(245, 158, 11, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                  <div style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CreditCard size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#9a3412', lineHeight: 1.2 }}>
                      {unpaidOrdersCount} Order{unpaidOrdersCount > 1 ? 's' : ''} Awaiting Payment
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#c2410c', marginTop: '1px' }}>
                      Complete payment to start master digitizing
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOrderFilter('awaiting_payment');
                    if (unpaidOrders[0]) handleOpenPaymentForOrder(unpaidOrders[0]);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.32rem 0.6rem',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  Pay Now
                </button>
              </div>
            )}
          </div>

          {/* Sub-filter Switcher */}
          <div style={{ padding: '0.4rem 0.75rem 0.15rem', display: 'flex', gap: '0.35rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: `All (${myOrders.length})` },
              { id: 'awaiting_payment', label: `⏳ Waiting (${unpaidOrders.length})`, highlight: unpaidOrders.length > 0, unpaid: true },
              { id: 'active', label: `⚡ Active (${activeOrders.length})` },
              { id: 'delivered', label: `📦 Delivered (${deliveredOrders.length})`, highlight: deliveredOrders.length > 0 },
              { id: 'completed', label: `✓ Done (${completedOrders.length})` }
            ].map(f => {
              const isSelected = orderFilter === f.id;
              let bg = '#ffffff';
              let color = '#475569';
              let border = '1px solid #cbd5e1';

              if (isSelected) {
                bg = f.unpaid ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#0f172a';
                color = '#ffffff';
                border = f.unpaid ? '1.5px solid #ea580c' : '1.5px solid #0f172a';
              } else if (f.unpaid && f.highlight) {
                bg = '#fff7ed';
                color = '#c2410c';
                border = '1.5px solid #fdba74';
              } else if (f.highlight) {
                bg = '#ecfdf5';
                color = '#047857';
                border = '1.5px solid #10b981';
              }

              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderFilter(f.id)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '14px',
                    border,
                    background: bg,
                    color,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: isSelected && f.unpaid ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Order Cards List */}
          <div style={{ padding: '0.45rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {(!isAuthenticated && !userEmail && myOrders.length > 0) && (
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                marginBottom: '0.15rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 600 }}>
                  Showing orders placed on this device. Sign in to sync across all devices.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

            {(() => {
              if (!isAuthenticated && !userEmail && myOrders.length === 0) {
                return (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    marginTop: '0.35rem'
                  }}>
                    <Lock size={30} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                      Sign In to View Orders
                    </h4>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.4 }}>
                      Sign in with your studio account to track real-time machine stitch test runs and download files.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalMode('login');
                        setIsAuthModalOpen(true);
                      }}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1.25rem',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Sign In to Account
                    </button>
                  </div>
                );
              }

              const filtered = myOrders.filter(o => {
                const isUnpaid = isOrderUnpaid(o);
                const s = String(o?.status || '').toLowerCase().trim();
                const isDelivered = (s === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0)) && s !== 'completed' && s !== 'cancelled';
                const isCompleted = s === 'completed';

                if (orderFilter === 'awaiting_payment') {
                  if (!isUnpaid) return false;
                } else if (orderFilter === 'delivered') {
                  if (!isDelivered) return false;
                } else if (orderFilter === 'active') {
                  if (isDelivered || isCompleted || isUnpaid || s === 'cancelled') return false;
                } else if (orderFilter === 'completed') {
                  if (!isCompleted) return false;
                }

                if (searchQuery?.trim()) {
                  const q = searchQuery.toLowerCase().trim().replace(/^#+/, '');
                  const idMatch = String(o?.id || '').toLowerCase().replace(/^#+/, '').includes(q);
                  const titleMatch = String(o?.title || '').toLowerCase().includes(q);
                  const serviceMatch = String(o?.serviceCategory || o?.type || '').toLowerCase().includes(q);
                  const statusMatch = String(o?.status || '').toLowerCase().includes(q);
                  return idMatch || titleMatch || serviceMatch || statusMatch;
                }

                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '2.25rem 1.25rem',
                    textAlign: 'center',
                    marginTop: '0.35rem'
                  }}>
                    <ClipboardList size={30} style={{ color: '#94a3b8', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                      No Orders Found
                    </h4>
                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.74rem', color: '#64748b' }}>
                      {orderFilter === 'awaiting_payment'
                        ? 'No unpaid orders pending payment.'
                        : orderFilter === 'delivered'
                        ? 'No delivered orders pending review.'
                        : orderFilter === 'active'
                        ? 'You have no active orders in production.'
                        : orderFilter === 'completed'
                        ? 'No completed orders in your history.'
                        : 'You have no orders yet. Place an order to get started!'}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenOrderConfigurator('embroidery')}
                      style={{
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      Place New Order
                    </button>
                  </div>
                );
              }

              return filtered.map(ord => {
                const primaryImg = ord?.artworkUrl || ord?.image_url || ord?.logo || ord?.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                const isUnpaid = isOrderUnpaid(ord);
                const s = String(ord?.status || '').toLowerCase().trim();
                const isDelivered = (s === 'delivered' || (Array.isArray(ord?.uploadedMachineFiles) && ord.uploadedMachineFiles.length > 0)) && s !== 'completed';
                const isCompleted = s === 'completed';
                const isRevision = s === 'revision' || s === 'modification';

                let badgeInfo = { label: 'IN PRODUCTION', bg: '#eff6ff', border: '#bae6fd', color: '#0284c7' };
                if (isUnpaid) {
                  badgeInfo = { label: '⏳ WAITING FOR PAYMENT', bg: '#fff7ed', border: '#fdba74', color: '#c2410c' };
                } else if (isDelivered) {
                  badgeInfo = { label: '📦 DELIVERED', bg: '#ecfdf5', border: '#86efac', color: '#047857' };
                } else if (isCompleted) {
                  badgeInfo = { label: '✓ COMPLETED', bg: '#f1f5f9', border: '#cbd5e1', color: '#334155' };
                } else if (isRevision) {
                  badgeInfo = { label: '🔄 REVISION', bg: '#fff7ed', border: '#fdba74', color: '#ea580c' };
                }

                const priceVal = Number(ord.totalPrice || ord.price || 15).toFixed(2);
                const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderForDrawer(ord)}
                    style={{
                      background: '#ffffff',
                      border: isUnpaid ? '1.5px solid #fdba74' : (isDelivered ? '1.5px solid #86efac' : '1px solid #e2e8f0'),
                      borderRadius: '10px',
                      padding: '0.65rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                      boxShadow: isUnpaid ? '0 2px 8px rgba(234, 88, 12, 0.08)' : (isDelivered ? '0 2px 8px rgba(16, 185, 129, 0.08)' : '0 1px 4px rgba(0,0,0,0.03)'),
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Row: Thumbnail + Price + Title */}
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                      <img
                        src={primaryImg}
                        alt={ord.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        }}
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: isUnpaid ? '1.5px solid #fb923c' : (isDelivered ? '1.5px solid #10b981' : '1px solid #cbd5e1'),
                          flexShrink: 0
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isUnpaid ? '#c2410c' : '#059669' }}>
                            {formatOrderId(ord.id)}
                          </span>
                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                            ${priceVal}
                          </span>
                        </div>
                        <p style={{
                          margin: '0.1rem 0 0',
                          fontSize: '0.78rem',
                          color: '#334155',
                          fontWeight: 700,
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {ord.title || 'Embroidery Digitizing Design'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Digitizer Avatar + Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.1rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: isUnpaid ? '#fff7ed' : '#ecfdf5',
                          color: isUnpaid ? '#c2410c' : '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.55rem',
                          fontWeight: 900
                        }}>
                          BD
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                          BDigitizing Studio
                        </span>
                      </div>

                      <span style={{
                        background: badgeInfo.bg,
                        color: badgeInfo.color,
                        border: `1px solid ${badgeInfo.border}`,
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    {/* Prominent Unpaid / Waiting for Payment Action Bar */}
                    {isUnpaid && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '0.45rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.45rem',
                        boxShadow: '0 1px 6px rgba(245, 158, 11, 0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>⏳</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#92400e', lineHeight: 1.2 }}>
                              Waiting for Payment to Start
                            </div>
                            <div style={{ fontSize: '0.62rem', color: '#b45309', fontWeight: 600 }}>
                              Production starts immediately upon payment
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPaymentForOrder(ord);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.32rem 0.6rem',
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            flexShrink: 0
                          }}
                        >
                          <Zap size={11} /> Pay ${priceVal} →
                        </button>
                      </div>
                    )}

                    {/* Delivered Quick Review Bar */}
                    {isDelivered && (
                      <div style={{
                        background: '#f0fdf4',
                        border: '1px dashed #86efac',
                        borderRadius: '6px',
                        padding: '0.35rem 0.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        color: '#047857'
                      }}>
                        <span>📦 Files Ready for Download</span>
                        <span style={{ textDecoration: 'underline' }}>Review & Download →</span>
                      </div>
                    )}

                    {/* Bottom Row: Date + 3 Dots Menu */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '0.4rem',
                      marginTop: '0.1rem'
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                        {dateStr}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsOrderActionMenuOpen(ord);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0f172a',
                          cursor: 'pointer',
                          padding: '0.15rem'
                        }}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

        </div>
      )}


      {/* =========================================================================
          SCREEN 5: PROFILE, SETTINGS & SUPPORT
          ========================================================================= */}
      {mobileTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#ffffff' }}>
          
          {/* Top Brand Green Header */}
          <div style={{
            background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.25rem 2.25rem',
            position: 'relative'
          }}>
            {/* Top Bar with Bell */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', position: 'relative' }}
              >
                <Bell size={22} />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>
            </div>

            {/* User Avatar + Name + Balance (Or Guest Sign-In) */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {userInitial}
                  </div>
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #ffffff'
                  }} />
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                    {userName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                      Personal balance: <strong style={{ color: '#ffffff', fontWeight: 800 }}>${walletBalance.toFixed(2)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDepositModalOpen(true)}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.4)',
                        borderRadius: '12px',
                        padding: '0.1rem 0.45rem',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      + Top-Up
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff'
                  }}>
                    <User size={28} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                      Guest Visitor
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: '0.1rem' }}>
                      Sign in to track orders & balance
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#047857',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

          </div>

          {/* Floating Card: VIP Studio Mode Toggle */}
          <div style={{ padding: '0 1.25rem', marginTop: '-18px' }}>
            <div 
              onClick={handleToggleVipMode}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '0.85rem 1.15rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: isVipMode ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>Client VIP Mode</span>
                  {isVipMode && <Sparkles size={14} style={{ color: '#d97706' }} />}
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {isVipMode ? 'Priority master digitizer queue active' : 'Enable for expedited turnaround & direct line'}
                </span>
              </div>

              <div style={{
                width: '42px',
                height: '24px',
                borderRadius: '12px',
                background: isVipMode ? '#059669' : '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isVipMode ? 'flex-end' : 'flex-start',
                padding: '2px',
                boxSizing: 'border-box',
                transition: 'background 0.2s ease'
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Invite friends row */}
          <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
            <div 
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.share) {
                  navigator.share({ title: 'BDigitizing Studio', url: window.location.origin });
                } else {
                  showToast('Studio link copied to clipboard! 📋', 'success');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                cursor: 'pointer',
                padding: '0.5rem 0'
              }}
            >
              <Share2 size={20} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                Invite friends & colleagues
              </span>
            </div>
          </div>

          {/* SETTINGS SECTION */}
          <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
              Settings & Preferences
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Preferences */}
              <div 
                onClick={() => setIsPreferencesModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Settings size={20} style={{ color: '#64748b' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Preferences</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Themes, sound alerts & default file formats</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              {/* Account Profile */}
              <div 
                onClick={() => {
                  if (isAuthenticated) {
                    setIsAccountModalOpen(true);
                  } else {
                    setAuthModalMode('login');
                    setIsAuthModalOpen(true);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <User size={20} style={{ color: '#64748b' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Account & Profile</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{isAuthenticated ? `Signed in as ${userEmail}` : 'Sign in to sync your profile'}</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* RESOURCES & SUPPORT SECTION */}
          <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
              Support & Help Desk
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Support & Help Desk */}
              <div 
                onClick={() => setIsSupportModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <HelpCircle size={20} style={{ color: '#059669' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>24/7 Support & Help Desk</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>WhatsApp, live chat & FAQs</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              {/* Community & Legal */}
              <div 
                onClick={() => setIsLegalModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <ShieldCheck size={20} style={{ color: '#64748b' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Community & Legal Terms</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Quality guarantee, IP safety & policies</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              {/* Share Feedback */}
              <div 
                onClick={() => setIsFeedbackModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Star size={20} style={{ color: '#f59e0b' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Share Feedback</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Rate your experience & give suggestions</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>

              {/* Switch to Website View */}
              <div 
                onClick={() => {
                  if (setMobileMode) setMobileMode('website');
                  showToast('Switched to Website view 🌐', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 0',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <Globe size={20} style={{ color: '#64748b' }} />
                  <div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>Switch to Website View</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Browse full desktop/mobile layout</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* App Version Tag + Sign Out */}
          <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>
              v4.5.0 • BDigitizing Pro Studio
            </span>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (logout) logout();
                  showToast('Signed out successfully', 'info');
                }}
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <User size={16} /> Sign In to Studio Account
              </button>
            )}
          </div>

        </div>
      )}


      {/* =========================================================================
          UNIVERSAL BOTTOM 5-TAB NAVIGATION BAR
          ========================================================================= */}
      <nav 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '66px',
          background: '#ffffff',
          borderTop: '1.5px solid #cbd5e1',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: 99999,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            color: mobileTab === 'home' ? '#047857' : '#64748b',
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'home' ? '#ecfdf5' : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <Home size={20} strokeWidth={mobileTab === 'home' ? 2.5 : 1.75} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'home' ? 900 : 600 }}>Home</span>
        </button>

        {/* Tab 2: Messages / Inbox */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('inbox');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            position: 'relative',
            color: mobileTab === 'inbox' ? '#047857' : '#64748b',
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'inbox' ? '#ecfdf5' : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            <Mail size={20} strokeWidth={mobileTab === 'inbox' ? 2.5 : 1.75} />
            {unreadChatCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ef4444'
              }} />
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'inbox' ? 900 : 600 }}>Inbox</span>
        </button>

        {/* Tab 3: Search / Categories */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('categories');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            color: mobileTab === 'categories' ? '#047857' : '#64748b',
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'categories' ? '#ecfdf5' : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <Search size={20} strokeWidth={mobileTab === 'categories' ? 2.5 : 1.75} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'categories' ? 900 : 600 }}>Explore</span>
        </button>

        {/* Tab 4: Manage Orders */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('orders');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            position: 'relative',
            color: mobileTab === 'orders' ? '#047857' : '#64748b',
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'orders' ? '#ecfdf5' : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            <ClipboardList size={20} strokeWidth={mobileTab === 'orders' ? 2.5 : 1.75} />
            {(unpaidOrders.length > 0 || activeOrders.length > 0) && (
              <span style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                background: unpaidOrders.length > 0 ? '#ea580c' : '#047857',
                color: '#ffffff',
                fontSize: '0.55rem',
                fontWeight: 900,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unpaidOrders.length > 0 ? unpaidOrders.length : activeOrders.length}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'orders' ? 900 : 600 }}>Orders</span>
        </button>

        {/* Tab 5: Profile & Account */}
        <button
          type="button"
          onClick={() => {
            setMobileTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0',
            color: mobileTab === 'profile' ? '#047857' : '#64748b',
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'profile' ? '#ecfdf5' : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <User size={20} strokeWidth={mobileTab === 'profile' ? 2.5 : 1.75} />
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'profile' ? 900 : 600 }}>Account</span>
        </button>
      </nav>


      {/* =========================================================================
          SUB-MODAL 1: PREFERENCES MODAL
          ========================================================================= */}
      {isPreferencesModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsPreferencesModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Settings size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Studio Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Color Theme Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Color Theme Preset
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {THEME_PRESETS.map(preset => {
                  const isSelected = colorTheme === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        if (setColorTheme) setColorTheme(preset.id);
                      }}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid #059669' : '1px solid #cbd5e1',
                        background: isSelected ? '#ecfdf5' : '#ffffff',
                        color: '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: preset.color }} />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio Alerts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>Audio Notifications</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Play chime on live digitizer messages & delivery</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: soundEnabled ? '#ecfdf5' : '#f1f5f9',
                  color: soundEnabled ? '#047857' : '#64748b',
                  border: soundEnabled ? '1.5px solid #86efac' : '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            {/* Default Embroidery Format */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Default Embroidery Format
              </label>
              <select
                value={defaultEmbFormat}
                onChange={(e) => setDefaultEmbFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="DST">Tajima (.DST) - Universal Commercial Format</option>
                <option value="PES">Brother / Deco (.PES) - Home & Commercial</option>
                <option value="EMB">Wilcom Master Source (.EMB) - Native Stitch Object</option>
                <option value="EXP">Melco / Bernina (.EXP)</option>
                <option value="JEF">Janome Memory Craft (.JEF)</option>
                <option value="VP3">Husqvarna / Viking (.VP3)</option>
              </select>
            </div>

            {/* Currency Preference */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                Currency Display
              </label>
              <select
                value={currencyPref}
                onChange={(e) => setCurrencyPref(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#ffffff'
                }}
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}


      {/* =========================================================================
          SUB-MODAL 2: ACCOUNT PROFILE MODAL
          ========================================================================= */}
      {isAccountModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsAccountModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <User size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Account Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. John Doe"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  placeholder="e.g. Apex Apparel Co."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Phone / WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Wallet Summary */}
              <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800 }}>Prepaid Studio Balance</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>${walletBalance.toFixed(2)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    setIsDepositModalOpen(true);
                  }}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.75rem',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  + Add Funds
                </button>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: isSavingProfile ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          SUB-MODAL 3: 24/7 SUPPORT & HELP DESK
          ========================================================================= */}
      {isSupportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsSupportModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <HelpCircle size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>24/7 Support Desk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Action 1: Live Chat In-App */}
            <button
              type="button"
              onClick={() => {
                setIsSupportModalOpen(false);
                handleOpenChat('help-support');
              }}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '14px',
                border: '1.5px solid #86efac',
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>Live Support Chat</h4>
                  <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>● Online • Response in &lt; 5 mins</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#059669' }} />
            </button>

            {/* Action 2: WhatsApp Direct */}
            <a
              href="https://wa.me/923000000000?text=Hello%20BDigitizing%20Studio%2C%20I%20need%20support%20with%20my%20order."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '14px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textDecoration: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#22c55e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>WhatsApp Master Desk</h4>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Chat with master digitizers directly</span>
                </div>
              </div>
              <ExternalLink size={18} style={{ color: '#64748b' }} />
            </a>

            {/* FAQ Accordion Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                Common Questions
              </span>
              {[
                { q: 'How fast is standard delivery?', a: 'Standard turnaround is 4–12 hours. Express rush delivers in 4–8 hours guaranteed.' },
                { q: 'What machine formats are provided?', a: 'Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP), Janome (.JEF) & PDF worksheet.' },
                { q: 'Are revisions really free?', a: 'Yes, unlimited free revisions are included on all orders until your machine stitches flawlessly.' }
              ].map((faq, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: '#0f172a', display: 'block', marginBottom: '0.15rem' }}>{faq.q}</strong>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b', lineHeight: 1.35 }}>{faq.a}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}


      {/* =========================================================================
          SUB-MODAL 4: FEEDBACK & RATING
          ========================================================================= */}
      {isFeedbackModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsFeedbackModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Star size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Rate Your Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Star Rating Selector */}
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem'
                      }}
                    >
                      <Star
                        size={32}
                        fill={star <= feedbackRating ? '#f59e0b' : 'none'}
                        style={{ color: star <= feedbackRating ? '#f59e0b' : '#cbd5e1' }}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', display: 'block', marginTop: '0.35rem' }}>
                  {feedbackRating === 5 ? '⭐⭐⭐⭐⭐ Outstanding & Flawless' : feedbackRating === 4 ? '⭐⭐⭐⭐ Great Experience' : feedbackRating === 3 ? '⭐⭐⭐ Good Quality' : 'Needs Improvement'}
                </span>
              </div>

              {/* Feedback Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Topic Category
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['Quality', 'Speed', 'Digitizer Chat', 'Pricing', 'App Experience'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: feedbackCategory === cat ? '1.5px solid #059669' : '1px solid #cbd5e1',
                        background: feedbackCategory === cat ? '#ecfdf5' : '#ffffff',
                        color: feedbackCategory === cat ? '#047857' : '#475569',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commentary */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Your Comments & Suggestions
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you liked or what we can improve..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: isSubmittingFeedback ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {isSubmittingFeedback ? 'Sending Feedback...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          SUB-MODAL 5: COMMUNITY & LEGAL TERMS
          ========================================================================= */}
      {isLegalModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsLegalModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Community & Legal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLegalModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>100% Quality & Machine Sew-Out Guarantee</strong>
                Every digitized embroidery design is tested on physical commercial machinery. We guarantee zero unnecessary thread breaks and proper underlay pull-compensation.
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Intellectual Property & Non-Disclosure</strong>
                You retain 100% full commercial ownership of all uploaded artwork, source files, and final stitch outputs. We never resell, license, or share your proprietary designs.
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Unlimited Free Revisions Policy</strong>
                Modifications for density, size adjustment, thread sequence, machine format conversions, and minor artwork changes are performed 100% free of charge.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLegalModalOpen(false)}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Close Legal Terms
            </button>
          </div>
        </div>
      )}


      {/* =========================================================================
          ORDER ACTION SHEET (3-Dots on Order Card)
          ========================================================================= */}
      {isOrderActionMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsOrderActionMenuOpen(null)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '20px 20px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              animation: 'slideUp 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#059669' }}>
                  {formatOrderId(isOrderActionMenuOpen.id)}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {isOrderActionMenuOpen.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderActionMenuOpen(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderForDrawer(isOrderActionMenuOpen);
                setIsOrderActionMenuOpen(null);
              }}
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer'
              }}
            >
              <ClipboardList size={18} style={{ color: '#059669' }} /> View Order & Download Files
            </button>

            <button
              type="button"
              onClick={() => {
                const ordId = isOrderActionMenuOpen.id;
                setIsOrderActionMenuOpen(null);
                handleOpenChat(ordId);
              }}
              style={{
                padding: '0.85rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer'
              }}
            >
              <Mail size={18} style={{ color: '#059669' }} /> Chat with Assigned Digitizer
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DRAWER */}
      {isNotifDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsNotifDrawerOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              width: '85%',
              maxWidth: '380px',
              height: '100%',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Bell size={18} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {combinedNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No new notifications</p>
                </div>
              ) : (
                combinedNotifications.map(n => (
                  <div
                    key={n.id || Math.random()}
                    onClick={() => {
                      setIsNotifDrawerOpen(false);
                      handleNotificationClick(n, {
                        markNotificationAsRead: (id) => {
                          if (markGlobalNotificationAsRead) markGlobalNotificationAsRead(id);
                          markNotificationAsReadInSupabase(id);
                        },
                        markGlobalNotificationAsRead,
                        authUser,
                        currentUser,
                        isAuthenticated,
                        setIsAuthModalOpen,
                        setAuthModalMode,
                        orders,
                        openOrderTrackerDrawer,
                        setSelectedOrderForDrawer,
                        setMobileTab,
                        mobileMode: 'app'
                      });
                    }}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '12px',
                      background: (n.is_read || n.read) ? '#f8fafc' : '#fff7ed',
                      border: (n.is_read || n.read) ? '1px solid #e2e8f0' : '1.5px solid #fdba74',
                      cursor: 'pointer',
                      boxShadow: (n.is_read || n.read) ? 'none' : '0 2px 8px rgba(234, 88, 12, 0.12)'
                    }}
                  >
                    <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                      {n.title || 'Studio Notification'}
                    </h5>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                      {n.message || n.body}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP ORDER CONFIGURATOR MODAL */}
      <MobileSimpleOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        defaultService={orderDefaultService}
        onOrderCreated={(newOrd) => {
          setMobileTab('orders');
          if (typeof refreshOrders === 'function') {
            refreshOrders().catch(() => {});
          }
        }}
      />

    </div>
  );
};

export default BDigitizingMobileApp;
