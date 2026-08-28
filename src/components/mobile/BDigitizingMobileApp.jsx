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
  DollarSign,
  Building2,
  Users,
  Coins,
  KeyRound,
  ShieldAlert,
  ArrowUpRight
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
import { AdminChatInbox } from '../admin/AdminChatInbox';
import { DynamicPricingEditor } from '../admin/DynamicPricingEditor';
import { PromotionsManager } from '../admin/PromotionsManager';
import { THEME_PRESETS } from '../../utils/themePresets';
import { handleNotificationClick } from '../../utils/notificationRouter';

export const BDigitizingMobileApp = () => {
  const navigate = useNavigate();
  const { 
    orders = [], 
    clients = [],
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
    login,
    logout,
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    setMobileMode,
    dynamicPricingTiers = [],
    notifications: globalNotifications = [],
    markNotificationAsRead: markGlobalNotificationAsRead,
    refreshOrders,
    updateOrderStatus,
    openOrderWizard
  } = useAppState();

  // Determine if active user is admin
  const isSuperAdmin = Boolean(
    authUser?.role === 'admin' || 
    currentUser?.role === 'admin' || 
    (typeof window !== 'undefined' && localStorage.getItem('bdigi_admin_logged_in') === 'true')
  );

  // Active Admin Mode toggle state
  const [isAdminModeActive, setIsAdminModeActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bdigi_admin_mode_active');
      if (saved !== null) return saved === 'true';
    }
    return isSuperAdmin;
  });

  // Sync admin mode when role changes
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('bdigi_admin_mode_active') : null;
      if (saved === null) {
        setIsAdminModeActive(true);
        if (typeof window !== 'undefined') localStorage.setItem('bdigi_admin_mode_active', 'true');
      }
    }
  }, [isSuperAdmin]);

  const toggleAdminMode = () => {
    const nextVal = !isAdminModeActive;
    setIsAdminModeActive(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_admin_mode_active', String(nextVal));
    }
    showToast(nextVal ? '🛡️ Switched to Master Admin Desk Mode' : '👤 Switched to Client View Mode', 'info');
  };

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
  
  // Orders filter: 'all' | 'awaiting_payment' | 'delivered' | 'active' | 'completed' | 'revisions'
  const [orderFilter, setOrderFilter] = useState('all');

  // Modals & Chat state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDefaultService, setOrderDefaultService] = useState('embroidery');
  const [selectedChatOrderId, setSelectedChatOrderId] = useState(null);
  const [isOrderActionMenuOpen, setIsOrderActionMenuOpen] = useState(null);
  
  // Real-time unread counts
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Admin Specific Modals
  const [isAdminTopUpModalOpen, setIsAdminTopUpModalOpen] = useState(false);
  const [adminSelectedClient, setAdminSelectedClient] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState('100');
  const [topUpNotes, setTopUpNotes] = useState('');
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  const [isAdminPricingModalOpen, setIsAdminPricingModalOpen] = useState(false);
  const [isAdminPromotionsModalOpen, setIsAdminPromotionsModalOpen] = useState(false);
  const [adminClientSearch, setAdminClientSearch] = useState('');

  // Admin Direct Login Modal
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [isLoggingInAdmin, setIsLoggingInAdmin] = useState(false);

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
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('General Quality');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Refresh spinner
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  const activeUser = authUser || currentUser;
  const userEmail = (activeUser?.email || '').toLowerCase().trim();
  const userName = activeUser?.user_metadata?.full_name || activeUser?.name || userEmail.split('@')[0] || 'Studio Client';
  const userInitial = (userName?.[0] || 'C').toUpperCase();

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVip = localStorage.getItem('bdigi_client_vip_mode') === 'true';
      setIsVipMode(savedVip);

      const savedSound = localStorage.getItem('bdigi_audio_enabled');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');

      const savedEmbFmt = localStorage.getItem('bdigi_pref_emb_format');
      if (savedEmbFmt) setDefaultEmbFormat(savedEmbFmt);

      const savedVecFmt = localStorage.getItem('bdigi_pref_vec_format');
      if (savedVecFmt) setDefaultVecFormat(savedVecFmt);

      const savedCurr = localStorage.getItem('bdigi_pref_currency');
      if (savedCurr) setCurrencyPref(savedCurr);

      const savedReceipts = localStorage.getItem('bdigi_pref_auto_receipts');
      if (savedReceipts !== null) setAutoDownloadReceipts(savedReceipts === 'true');
    }
  }, []);

  // Sync profile form inputs with active user
  useEffect(() => {
    if (activeUser) {
      setProfileName(activeUser.user_metadata?.full_name || activeUser.name || '');
      setProfileCompany(activeUser.user_metadata?.company || activeUser.company || '');
      setProfilePhone(activeUser.user_metadata?.phone || activeUser.phone || '');
    }
  }, [activeUser]);

  // Handle global tab switch events
  useEffect(() => {
    const handleTabSwitch = (e) => {
      const targetTab = e.detail?.tab || 'home';
      if (targetTab === 'home' || targetTab === 'dashboard') {
        setMobileTab('home');
      } else if (targetTab === 'orders' || targetTab === 'my_orders') {
        setMobileTab('orders');
        setIsPreferencesModalOpen(false);
        setIsAccountModalOpen(false);
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

  // Helper to determine if an order is unpaid
  const isOrderUnpaid = (o) => {
    if (!o) return false;
    const s = String(o?.status || '').toLowerCase().trim();
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const isPaidFlag = o?.isPaid === true || Boolean(o?.paid_at) || pStatus === 'paid' || pStatus === 'completed' || pStatus === 'wallet' || ['in_progress', 'digitizing', 'assigned', 'qc', 'delivered', 'completed'].includes(s);
    if (isPaidFlag) return false;
    return s === 'awaiting_payment' || s === 'pending_payment' || s === 'submitted' || s === 'pending' || pStatus === 'unpaid' || pStatus === 'pending';
  };

  // Filter Orders for Customer strictly (or show all if in Admin Mode)
  const myOrders = orders.filter(o => {
    if (isAdminModeActive && isSuperAdmin) return true;

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

  const revisionsOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    return s === 'revision' || s === 'modification';
  });

  const activeOrders = myOrders.filter(o => {
    const s = String(o?.status || '').toLowerCase().trim();
    const isDeliv = s === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0);
    const isUnpaid = isOrderUnpaid(o);
    return !isDeliv && !isUnpaid && s !== 'completed' && s !== 'cancelled' && s !== 'revision';
  });

  // Calculate live statistics
  const totalOrdersCount = myOrders.length;
  const activeOrdersCount = activeOrders.length;
  const deliveredOrdersCount = deliveredOrders.length;
  const completedOrdersCount = completedOrders.length;
  const revisionsOrdersCount = revisionsOrders.length;
  const unpaidOrdersCount = unpaidOrders.length;
  const totalValueSpent = myOrders.reduce((sum, o) => {
    const rawP = parseFloat(o.totalPrice ?? o.price ?? 0);
    const p = !isNaN(rawP) && rawP > 0 ? rawP : 15;
    return sum + p;
  }, 0);

  // Admin Revenue calculation
  const totalGrossRevenue = orders
    .filter(o => !isOrderUnpaid(o))
    .reduce((sum, o) => sum + (parseFloat(o.totalPrice || o.price || 0) || 0), 0);

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

  // Admin Mark Paid Action
  const handleAdminMarkPaid = async (ord) => {
    try {
      await updateOrderStatus(ord.id, 'in_progress', { payment_status: 'paid', paymentStatus: 'paid' });
      showToast(`✓ Order ${formatOrderId(ord.id)} marked as paid!`, 'success');
      if (typeof refreshOrders === 'function') refreshOrders();
    } catch (err) {
      showToast('Could not update order status: ' + err.message, 'error');
    }
  };

  // Admin Change Status Action
  const handleAdminChangeStatus = async (ord, newStatus) => {
    try {
      await updateOrderStatus(ord.id, newStatus);
      showToast(`✓ Status updated to ${newStatus} for ${formatOrderId(ord.id)}`, 'success');
      if (typeof refreshOrders === 'function') refreshOrders();
    } catch (err) {
      showToast('Could not update status: ' + err.message, 'error');
    }
  };

  // Admin Direct Login Handler
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    if (!adminLoginEmail.trim() || !adminLoginPassword.trim()) {
      showToast('Please enter admin email and password.', 'error');
      return;
    }
    setIsLoggingInAdmin(true);
    try {
      const res = await login(adminLoginEmail.trim(), adminLoginPassword.trim());
      if (res?.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bdigi_admin_logged_in', 'true');
          localStorage.setItem('bdigi_admin_mode_active', 'true');
        }
        setIsAdminModeActive(true);
        setIsAdminLoginModalOpen(false);
        showToast('🛡️ Welcome to Master Admin Desk!', 'success');
        if (typeof refreshOrders === 'function') refreshOrders();
      } else {
        showToast(res?.error || 'Invalid admin credentials.', 'error');
      }
    } catch (err) {
      showToast('Login error: ' + err.message, 'error');
    } finally {
      setIsLoggingInAdmin(false);
    }
  };

  // Admin Client Wallet Top-Up Handler
  const handleAdminTopUpSubmit = async (e) => {
    e?.preventDefault?.();
    const amountVal = parseFloat(topUpAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }
    const targetEmail = adminSelectedClient?.email || adminClientSearch;
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Please select or specify a valid client email.', 'error');
      return;
    }

    setIsProcessingTopUp(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          amount: amountVal,
          targetClientEmail: targetEmail.trim(),
          paymentMethod: 'Admin Studio Credit / Top-Up'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Credited $${amountVal.toFixed(2)} to ${targetEmail}!`, 'success');
        setIsAdminTopUpModalOpen(false);
        setTopUpAmount('100');
        if (typeof refreshOrders === 'function') refreshOrders();
      } else {
        showToast(data.error || 'Failed to deposit funds.', 'error');
      }
    } catch (err) {
      showToast('Deposit error: ' + err.message, 'error');
    } finally {
      setIsProcessingTopUp(false);
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
      subtitle: 'Embroidered, 3D Rubber PVC, Micro Woven & Leather Patches',
      startingPrice: 'From $1.50 / pc',
      eta: '5–7 Days',
      icon: Package,
      color: '#0284c7',
      tags: ['patch', 'pvc', 'woven', 'leather', 'iron on', 'velcro', 'embroidery patch', 'custom patches']
    }
  ];

  const filteredServices = allServicesData.filter(s => {
    if (activeCategoryFilter !== 'all' && s.category !== activeCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = s.title.toLowerCase().includes(q);
      const subMatch = s.subtitle.toLowerCase().includes(q);
      const tagMatch = s.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || subMatch || tagMatch;
    }
    return true;
  });

  const handleManualRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      if (typeof refreshOrders === 'function') {
        await refreshOrders();
      }
      showToast('Live orders synchronized with database! ✨', 'success');
    } catch {
      showToast('Orders refreshed.', 'info');
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 500);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      paddingBottom: '76px',
      position: 'relative'
    }}>

      {/* =========================================================================
          STICKY TOP ADMIN DESK BANNER & MODE SWITCHER (WHEN ADMIN)
          ========================================================================= */}
      {isSuperAdmin && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: isAdminModeActive 
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
            : 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
          color: '#ffffff',
          padding: '0.45rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1.5px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
            <span style={{ fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {isAdminModeActive ? '🛡️ Master Admin Desk' : '👤 Client Preview Mode'}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleAdminMode}
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              padding: '0.2rem 0.65rem',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {isAdminModeActive ? 'Switch to Client View' : 'Switch to Admin Mode'}
          </button>
        </div>
      )}

      {/* =========================================================================
          SCREEN 1: HOME (CUSTOMER SHOWCASE OR ADMIN KPI DASHBOARD)
          ========================================================================= */}
      {mobileTab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* ADMIN OVERVIEW DASHBOARD */}
          {isAdminModeActive && isSuperAdmin ? (
            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Header Title Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    Studio Operations Hub
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    Live Production Metrics & Order Dispatch
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleManualRefreshOrders}
                    disabled={isRefreshingOrders}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.4rem',
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <RefreshCw size={16} style={{ animation: isRefreshingOrders ? 'spin 0.8s linear infinite' : 'none' }} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (openOrderWizard) openOrderWizard({ type: 'all' });
                      else setIsOrderModalOpen(true);
                    }}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                    }}
                  >
                    <Plus size={15} /> New Order
                  </button>
                </div>
              </div>

              {/* 6 Live Admin Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                {/* 1. Total Gross Volume */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '0.65rem 0.5rem',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <DollarSign size={16} style={{ color: '#38bdf8', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1 }}>
                    ${totalGrossRevenue.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    Gross Volume
                  </div>
                </div>

                {/* 2. Total Orders */}
                <div 
                  onClick={() => setMobileTab('orders')}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ClipboardList size={16} style={{ color: '#059669', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#0f172a' }}>
                    {orders.length}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    Total Orders
                  </div>
                </div>

                {/* 3. Awaiting Payment */}
                <div 
                  onClick={() => {
                    setOrderFilter('awaiting_payment');
                    setMobileTab('orders');
                  }}
                  style={{
                    background: unpaidOrdersCount > 0 ? '#fff7ed' : '#ffffff',
                    border: unpaidOrdersCount > 0 ? '1.5px solid #fdba74' : '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <CreditCard size={16} style={{ color: '#ea580c', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#c2410c' }}>
                    {unpaidOrdersCount}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#c2410c', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    Waiting Pay
                  </div>
                </div>

                {/* 4. In Production */}
                <div 
                  onClick={() => {
                    setOrderFilter('active');
                    setMobileTab('orders');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={16} style={{ color: '#0284c7', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#0369a1' }}>
                    {activeOrdersCount}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#0369a1', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    In Production
                  </div>
                </div>

                {/* 5. Registered Clients */}
                <div 
                  onClick={() => setMobileTab('categories')}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Users size={16} style={{ color: '#6366f1', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#0f172a' }}>
                    {clients.length}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#64748b', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    Clients
                  </div>
                </div>

                {/* 6. Delivered Orders */}
                <div 
                  onClick={() => {
                    setOrderFilter('delivered');
                    setMobileTab('orders');
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '0.65rem 0.5rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Package size={16} style={{ color: '#059669', marginBottom: '0.15rem' }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#047857' }}>
                    {deliveredOrdersCount}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#047857', marginTop: '0.2rem', textTransform: 'uppercase' }}>
                    Delivered
                  </div>
                </div>
              </div>

              {/* Quick Admin Actions Row */}
              <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSelectedClient(null);
                    setIsAdminTopUpModalOpen(true);
                  }}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <Coins size={14} style={{ color: '#059669' }} /> Top-Up Client Wallet
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdminPricingModalOpen(true)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <SlidersHorizontal size={14} style={{ color: '#ea580c' }} /> Pricing Editor
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdminPromotionsModalOpen(true)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  <Tag size={14} style={{ color: '#0284c7' }} /> Promo Codes
                </button>
              </div>

              {/* Live Production Queue (Recent Orders) */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>
                    ⚡ Recent Production Orders
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileTab('orders')}
                    style={{ background: 'none', border: 'none', color: '#059669', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    View All ({orders.length}) →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {orders.slice(0, 5).map(ord => {
                    const isUnpaid = isOrderUnpaid(ord);
                    const pVal = Number(ord.totalPrice || ord.price || 15).toFixed(2);

                    return (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrderForDrawer(ord)}
                        style={{
                          border: isUnpaid ? '1.5px solid #fdba74' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '0.6rem 0.75rem',
                          background: isUnpaid ? '#fffbeb' : '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: isUnpaid ? '#c2410c' : '#059669' }}>
                              {formatOrderId(ord.id)}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>• {ord.client_name || ord.clientName || 'Client'}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {ord.title || 'Embroidery Design'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                            ${pVal}
                          </div>
                          {isUnpaid ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminMarkPaid(ord);
                              }}
                              style={{
                                background: '#ea580c',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.15rem 0.45rem',
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Mark Paid
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669' }}>
                              {ord.status?.toUpperCase() || 'PAID'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* CUSTOMER HOME SHOWCASE */
            <>
              {/* Customer Hero Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                color: '#ffffff',
                padding: '1.35rem 1.25rem 1.75rem',
                borderRadius: '0 0 24px 24px',
                position: 'relative',
                boxShadow: '0 6px 20px rgba(4, 120, 87, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.85rem'
                    }}>
                      BD
                    </div>
                    <div>
                      <h1 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.01em' }}>
                        BDigitizing Pro
                      </h1>
                      <span style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600 }}>
                        Master Digitizing Studio
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsNotifDrawerOpen(true)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.15)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <Bell size={17} />
                      {unreadNotifCount > 0 && (
                        <span style={{ position: 'absolute', top: '2px', right: '2px', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                      )}
                    </button>
                  </div>
                </div>

                <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.35rem', fontWeight: 900, lineHeight: 1.25 }}>
                  Professional Embroidery & Vector Art Studio
                </h2>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4 }}>
                  Fast 4–12 hour turnaround, zero thread breaks & free unlimited revisions.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (openOrderWizard) openOrderWizard({ type: 'all' });
                      else setIsOrderModalOpen(true);
                    }}
                    style={{
                      flex: 1,
                      background: '#ffffff',
                      color: '#047857',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.65rem 1rem',
                      fontWeight: 900,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Plus size={16} /> Place New Order
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenChat()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      borderRadius: '12px',
                      padding: '0.65rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Mail size={16} /> Live Chat
                  </button>
                </div>
              </div>

              {/* 3 Core Services Showcase */}
              <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Our Specialized Services
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {allServicesData.map(svc => {
                    const IconS = svc.icon;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => handleOpenOrderConfigurator(svc.category)}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '0.85rem 0.55rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
                          background: `${svc.color}15`,
                          color: svc.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.45rem'
                        }}>
                          <IconS size={20} />
                        </div>
                        <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                          {svc.title}
                        </h4>
                        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: svc.color }}>
                          {svc.startingPrice}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {/* =========================================================================
          SCREEN 2: INBOX (CLIENT CHAT OR ADMIN MULTI-CLIENT INBOX)
          ========================================================================= */}
      {mobileTab === 'inbox' && (
        <div style={{ minHeight: 'calc(100vh - 76px)', background: '#ffffff' }}>
          {isAdminModeActive && isSuperAdmin ? (
            <AdminChatInbox 
              onOrderClick={(ordId) => {
                const found = orders.find(o => String(o.id) === String(ordId));
                if (found) setSelectedOrderForDrawer(found);
              }}
            />
          ) : (
            <ClientChatInbox defaultOrderId={selectedChatOrderId} />
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 3: EXPLORE CATEGORIES (OR ADMIN CLIENTS DIRECTORY)
          ========================================================================= */}
      {mobileTab === 'categories' && (
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {isAdminModeActive && isSuperAdmin ? (
            /* ADMIN REGISTERED CLIENTS DIRECTORY */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    Registered Clients ({clients.length})
                  </h2>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Client directory, wallet balances & custom pricing
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAdminSelectedClient(null);
                    setIsAdminTopUpModalOpen(true);
                  }}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Plus size={14} /> Credit Wallet
                </button>
              </div>

              {/* Search bar */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '0.5rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Search size={16} style={{ color: '#64748b' }} />
                <input
                  type="text"
                  value={adminClientSearch}
                  onChange={(e) => setAdminClientSearch(e.target.value)}
                  placeholder="Search client by name, email, or company..."
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Clients Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {(clients || [])
                  .filter(c => {
                    if (!adminClientSearch.trim()) return true;
                    const q = adminClientSearch.toLowerCase().trim();
                    const nMatch = (c.name || c.full_name || '').toLowerCase().includes(q);
                    const eMatch = (c.email || '').toLowerCase().includes(q);
                    const cMatch = (c.company || '').toLowerCase().includes(q);
                    return nMatch || eMatch || cMatch;
                  })
                  .map((clientItem, idx) => {
                    const cName = clientItem.name || clientItem.full_name || clientItem.email?.split('@')[0] || 'Client Account';
                    const cEmail = clientItem.email || 'N/A';
                    const cCompany = clientItem.company || 'Apparel Brand / Shop';
                    const cBal = parseFloat(clientItem.wallet_balance ?? 0);
                    const cOrders = clientItem.totalOrders ?? clientItem.orders_count ?? 0;

                    return (
                      <div
                        key={clientItem.id || idx}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: '#f1f5f9',
                              color: '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.95rem'
                            }}>
                              {(cName[0] || 'C').toUpperCase()}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                                {cName}
                              </h4>
                              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                                {cEmail} • <strong style={{ color: '#059669' }}>{cCompany}</strong>
                              </span>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#047857' }}>
                              ${cBal.toFixed(2)}
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700 }}>
                              Wallet Balance
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.45rem' }}>
                          <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700 }}>
                            {cOrders} total jobs recorded
                          </span>

                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminSelectedClient(clientItem);
                                setIsAdminTopUpModalOpen(true);
                              }}
                              style={{
                                background: '#ecfdf5',
                                color: '#047857',
                                border: '1px solid #a7f3d0',
                                borderRadius: '6px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.72rem',
                                fontWeight: 900,
                                cursor: 'pointer'
                              }}
                            >
                              + Add $
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenChat(clientItem.email)}
                              style={{
                                background: '#f8fafc',
                                color: '#0f172a',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                padding: '0.3rem 0.65rem',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* CUSTOMER SERVICES DIRECTORY */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                Services & Capabilities
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredServices.map(service => {
                  const IconServ = service.icon;
                  return (
                    <div
                      key={service.id}
                      onClick={() => handleOpenOrderConfigurator(service.category)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '16px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: `${service.color}15`,
                          color: service.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IconServ size={24} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                            {service.title}
                          </h4>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                            {service.subtitle}
                          </p>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: service.color }}>
                          {service.startingPrice}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block' }}>
                          {service.eta}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          SCREEN 4: ORDERS (ALL ORDERS FOR ADMIN OR MY ORDERS FOR CUSTOMER)
          ========================================================================= */}
      {mobileTab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Top Manage Orders Bar */}
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
                {isAdminModeActive && isSuperAdmin ? 'All Studio Orders' : 'Manage Orders'}
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
                onClick={() => {
                  if (openOrderWizard) openOrderWizard({ type: 'all' });
                  else setIsOrderModalOpen(true);
                }}
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

          {/* Sub-filter Switcher */}
          <div style={{ padding: '0.45rem 0.75rem 0.2rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: `All (${myOrders.length})` },
              { id: 'awaiting_payment', label: `⏳ Waiting (${unpaidOrders.length})`, highlight: unpaidOrders.length > 0, unpaid: true },
              { id: 'active', label: `⚡ Active (${activeOrders.length})` },
              { id: 'delivered', label: `📦 Delivered (${deliveredOrders.length})`, highlight: deliveredOrders.length > 0 },
              { id: 'revisions', label: `🔄 Revisions (${revisionsOrders.length})`, highlight: revisionsOrders.length > 0 },
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
                    padding: '0.32rem 0.65rem',
                    borderRadius: '16px',
                    border,
                    background: bg,
                    color,
                    fontSize: '0.74rem',
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
          <div style={{ padding: '0.45rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {myOrders
              .filter(o => {
                const isUnpaid = isOrderUnpaid(o);
                const s = String(o?.status || '').toLowerCase().trim();
                const isDelivered = (s === 'delivered' || (Array.isArray(o?.uploadedMachineFiles) && o.uploadedMachineFiles.length > 0)) && s !== 'completed' && s !== 'cancelled';
                const isCompleted = s === 'completed';
                const isRev = s === 'revision' || s === 'modification';

                if (orderFilter === 'awaiting_payment') {
                  if (!isUnpaid) return false;
                } else if (orderFilter === 'delivered') {
                  if (!isDelivered) return false;
                } else if (orderFilter === 'revisions') {
                  if (!isRev) return false;
                } else if (orderFilter === 'active') {
                  if (isDelivered || isCompleted || isUnpaid || isRev || s === 'cancelled') return false;
                } else if (orderFilter === 'completed') {
                  if (!isCompleted) return false;
                }

                if (searchQuery?.trim()) {
                  const q = searchQuery.toLowerCase().trim().replace(/^#+/, '');
                  const idMatch = String(o?.id || '').toLowerCase().replace(/^#+/, '').includes(q);
                  const titleMatch = String(o?.title || '').toLowerCase().includes(q);
                  const clientMatch = String(o?.client_name || o?.clientName || o?.client_email || '').toLowerCase().includes(q);
                  return idMatch || titleMatch || clientMatch;
                }

                return true;
              })
              .map(ord => {
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
                      borderRadius: '12px',
                      padding: '0.8rem 0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      boxShadow: isUnpaid ? '0 2px 8px rgba(234, 88, 12, 0.08)' : (isDelivered ? '0 2px 8px rgba(16, 185, 129, 0.08)' : '0 1px 4px rgba(0,0,0,0.03)'),
                      cursor: 'pointer'
                    }}
                  >
                    {/* Top Row: Thumbnail + Price + Title */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <img
                        src={primaryImg}
                        alt={ord.title}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        }}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          border: isUnpaid ? '1.5px solid #fb923c' : (isDelivered ? '1.5px solid #10b981' : '1px solid #cbd5e1'),
                          flexShrink: 0
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isUnpaid ? '#c2410c' : '#059669' }}>
                            {formatOrderId(ord.id)}
                          </span>
                          <span style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0f172a' }}>
                            ${priceVal}
                          </span>
                        </div>
                        <p style={{
                          margin: '0.15rem 0 0',
                          fontSize: '0.86rem',
                          color: '#1e293b',
                          fontWeight: 750,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {ord.title || 'Embroidery Digitizing Design'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Client info & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.1rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isUnpaid ? '#fff7ed' : '#ecfdf5',
                          color: isUnpaid ? '#c2410c' : '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 900
                        }}>
                          {(ord.client_name || ord.clientName || 'C')[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                          {ord.client_name || ord.clientName || ord.client_email || 'Studio Client'}
                        </span>
                      </div>

                      <span style={{
                        background: badgeInfo.bg,
                        color: badgeInfo.color,
                        border: `1px solid ${badgeInfo.border}`,
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '0.18rem 0.5rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    {/* Admin Action Bar on every order */}
                    {isAdminModeActive && isSuperAdmin ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.45rem',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: '0.45rem',
                        marginTop: '0.1rem'
                      }}>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminMarkPaid(ord);
                              }}
                              style={{
                                background: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.25rem 0.55rem',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Mark Paid
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForDrawer(ord);
                            }}
                            style={{
                              background: '#f8fafc',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            📦 Deliver / Details
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChat(ord.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Mail size={13} /> Chat
                        </button>
                      </div>
                    ) : (
                      /* Customer Action Bar */
                      isUnpaid && (
                        <div style={{
                          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          boxShadow: '0 1px 6px rgba(245, 158, 11, 0.1)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⏳</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#92400e', lineHeight: 1.2 }}>
                                Waiting for Payment
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
                              padding: '0.36rem 0.72rem',
                              fontSize: '0.74rem',
                              fontWeight: 900,
                              cursor: 'pointer'
                            }}
                          >
                            <Zap size={12} /> Pay ${priceVal} →
                          </button>
                        </div>
                      )
                    )}

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 5: PROFILE & SETTINGS (WITH ADMIN CONTROLS)
          ========================================================================= */}
      {mobileTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: '#ffffff' }}>
          
          {/* Top Brand Banner */}
          <div style={{
            background: isAdminModeActive 
              ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
              : 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.25rem 2rem',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: isAdminModeActive ? '#059669' : '#ea580c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: 900,
                border: '2px solid #ffffff'
              }}>
                {userInitial}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                  {isAdminModeActive ? 'Master Admin Desk' : userName}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', display: 'block', marginTop: '0.1rem' }}>
                  {isAdminModeActive ? 'Studio Director & Operations' : (userEmail || 'Client Account')}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Actions List */}
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            
            {/* Mode Switcher Banner */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={toggleAdminMode}
                style={{
                  background: isAdminModeActive ? '#f0fdf4' : '#0f172a',
                  color: isAdminModeActive ? '#047857' : '#ffffff',
                  border: isAdminModeActive ? '1.5px solid #a7f3d0' : 'none',
                  borderRadius: '12px',
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>{isAdminModeActive ? '🛡️ Admin Mode Active (Tap to switch to Client View)' : '👤 Client View Active (Tap to switch to Admin Desk)'}</span>
                <ChevronRight size={16} />
              </button>
            )}

            {/* Admin Management Tools */}
            {isAdminModeActive && isSuperAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginTop: '0.35rem' }}>
                  Admin Operations Suite
                </span>

                <button
                  type="button"
                  onClick={() => setIsAdminPricingModalOpen(true)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <SlidersHorizontal size={18} style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Dynamic Pricing & Packages</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdminPromotionsModalOpen(true)}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Tag size={18} style={{ color: '#0284c7' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Promotions & Coupon Codes</span>
                  </div>
                  <ChevronRight size={16} style={{ color: '#94a3b8' }} />
                </button>
              </div>
            )}

            {/* Direct Admin Login Button if not super admin */}
            {!isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(true)}
                style={{
                  background: '#f8fafc',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <KeyRound size={18} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>🔐 Master Admin Login</span>
                </div>
                <ChevronRight size={16} style={{ color: '#94a3b8' }} />
              </button>
            )}

            {/* Customer Settings */}
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginTop: '0.35rem' }}>
              Preferences & Account
            </span>

            <button
              type="button"
              onClick={() => setIsPreferencesModalOpen(true)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Settings size={18} style={{ color: '#059669' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>System Preferences</span>
              </div>
              <ChevronRight size={16} style={{ color: '#94a3b8' }} />
            </button>

            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Star size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Submit Studio Feedback</span>
              </div>
              <ChevronRight size={16} style={{ color: '#94a3b8' }} />
            </button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('bdigi_admin_logged_in');
                    localStorage.removeItem('bdigi_admin_mode_active');
                  }
                  logout();
                }}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  color: '#dc2626',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  marginTop: '0.5rem'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          BOTTOM TAB NAVIGATION BAR (5 TABS)
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
          display: isOrderModalOpen ? 'none' : 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: isOrderModalOpen ? -1 : 800,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}
      >
        {/* Tab 1: Home / Dashboard */}
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
            color: mobileTab === 'home' ? (isAdminModeActive ? '#0f172a' : '#047857') : '#64748b',
            gap: '0.18rem'
          }}
        >
          <Home size={20} strokeWidth={mobileTab === 'home' ? 2.5 : 1.75} />
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'home' ? 900 : 600 }}>
            {isAdminModeActive && isSuperAdmin ? 'Overview' : 'Home'}
          </span>
        </button>

        {/* Tab 2: Live Chat Inbox */}
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
            color: mobileTab === 'inbox' ? (isAdminModeActive ? '#0f172a' : '#047857') : '#64748b',
            gap: '0.18rem',
            position: 'relative'
          }}
        >
          <Mail size={20} strokeWidth={mobileTab === 'inbox' ? 2.5 : 1.75} />
          {unreadChatCount > 0 && (
            <span style={{ position: 'absolute', top: '2px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          )}
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'inbox' ? 900 : 600 }}>
            {isAdminModeActive && isSuperAdmin ? 'Inboxes' : 'Inbox'}
          </span>
        </button>

        {/* Tab 3: Explore / Clients */}
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
            color: mobileTab === 'categories' ? (isAdminModeActive ? '#0f172a' : '#047857') : '#64748b',
            gap: '0.18rem'
          }}
        >
          {isAdminModeActive && isSuperAdmin ? (
            <Users size={20} strokeWidth={mobileTab === 'categories' ? 2.5 : 1.75} />
          ) : (
            <Search size={20} strokeWidth={mobileTab === 'categories' ? 2.5 : 1.75} />
          )}
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'categories' ? 900 : 600 }}>
            {isAdminModeActive && isSuperAdmin ? 'Clients' : 'Explore'}
          </span>
        </button>

        {/* Tab 4: Orders */}
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
            color: mobileTab === 'orders' ? (isAdminModeActive ? '#0f172a' : '#047857') : '#64748b',
            gap: '0.18rem'
          }}
        >
          <ClipboardList size={20} strokeWidth={mobileTab === 'orders' ? 2.5 : 1.75} />
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'orders' ? 900 : 600 }}>Orders</span>
        </button>

        {/* Tab 5: Account / Profile */}
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
            color: mobileTab === 'profile' ? (isAdminModeActive ? '#0f172a' : '#047857') : '#64748b',
            gap: '0.18rem'
          }}
        >
          <User size={20} strokeWidth={mobileTab === 'profile' ? 2.5 : 1.75} />
          <span style={{ fontSize: '0.68rem', fontWeight: mobileTab === 'profile' ? 900 : 600 }}>
            {isAdminModeActive && isSuperAdmin ? 'Admin' : 'Account'}
          </span>
        </button>
      </nav>

      {/* =========================================================================
          ADMIN SUB-MODAL 1: TOP-UP CLIENT WALLET BALANCE
          ========================================================================= */}
      {isAdminTopUpModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000008,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsAdminTopUpModalOpen(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Coins size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Credit Client Studio Wallet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminTopUpModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminTopUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Target Client Email
                </label>
                <input
                  type="email"
                  value={adminSelectedClient?.email || adminClientSearch}
                  onChange={(e) => setAdminClientSearch(e.target.value)}
                  placeholder="client@company.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Deposit Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    color: '#047857',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quick preset chips */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[50, 100, 250, 500, 1000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(String(val))}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      borderRadius: '6px',
                      border: topUpAmount === String(val) ? '1.5px solid #059669' : '1px solid #cbd5e1',
                      background: topUpAmount === String(val) ? '#ecfdf5' : '#ffffff',
                      color: topUpAmount === String(val) ? '#047857' : '#475569',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    +${val}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isProcessingTopUp}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: isProcessingTopUp ? 'not-allowed' : 'pointer',
                  marginTop: '0.45rem',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {isProcessingTopUp ? 'Processing Deposit...' : `✓ Credit $${parseFloat(topUpAmount || 0).toFixed(2)} to Client`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN SUB-MODAL 2: DYNAMIC PRICING EDITOR
          ========================================================================= */}
      {isAdminPricingModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000008,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsAdminPricingModalOpen(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth: '680px',
              height: '92dvh',
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <SlidersHorizontal size={20} style={{ color: '#ea580c' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Dynamic Pricing & Packages
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPricingModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <DynamicPricingEditor />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN SUB-MODAL 3: PROMOTIONS & COUPONS MANAGER
          ========================================================================= */}
      {isAdminPromotionsModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000008,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setIsAdminPromotionsModalOpen(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '24px 24px 0 0',
              width: '100%',
              maxWidth: '680px',
              height: '92dvh',
              maxHeight: '92dvh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Tag size={20} style={{ color: '#0284c7' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Promotions & Coupon Codes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPromotionsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              <PromotionsManager />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADMIN DIRECT LOGIN MODAL
          ========================================================================= */}
      {isAdminLoginModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1000008,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setIsAdminLoginModalOpen(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '440px',
              padding: '1.5rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <KeyRound size={20} style={{ color: '#0f172a' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  Master Admin Login
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Admin Email
                </label>
                <input
                  type="email"
                  value={adminLoginEmail}
                  onChange={(e) => setAdminLoginEmail(e.target.value)}
                  placeholder="admin@bdigitizing.pro"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  placeholder="Admin Password"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingInAdmin}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  cursor: isLoggingInAdmin ? 'not-allowed' : 'pointer',
                  marginTop: '0.45rem'
                }}
              >
                {isLoggingInAdmin ? 'Signing In...' : '🚀 Authenticate as Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          5-STEP ORDER CONFIGURATOR MODAL
          ========================================================================= */}
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
