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
  MessageSquare,
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
  ArrowRight,
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
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building,
  Headphones,
  CheckCheck
} from 'lucide-react';
import CustomerSupportChat from '../customer/CustomerSupportChat';
import { playMessageChime, playAdminChime, playCustomerChime, unlockAudioContext } from '../../utils/audioNotification';
import { 
  fetchNotificationsFromSupabase, 
  markNotificationAsReadInSupabase,
  markAllNotificationsAsReadInSupabase, 
  upsertClientInSupabase,
  createNotificationInSupabase
} from '../../services/supabaseService';
import MobileSimpleOrderModal from '../customer/MobileSimpleOrderModal';
import { THEME_PRESETS } from '../../utils/themePresets';
import { 
  handleNotificationClick, 
  filterAndSanitizeNotifications,
  formatNotificationExactTime,
  getNotificationFullDateTime
} from '../../utils/notificationRouter';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleCustomSignInButton } from '../auth/GoogleCustomSignInButton';

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '421520521310-7appibeh1m7cdd90iid17lsq8thlq2oc.apps.googleusercontent.com').trim();

export const BDigitizingMobileApp = () => {
  const navigate = useNavigate();
  const { 
    orders = [], 
    authUser, 
    currentUser, 
    isAuthenticated,
    isAuthInitialized,
    login,
    register,
    loginWithGoogle,
    requestPasswordReset,
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
    mobileActiveTab,
    setMobileTab: setGlobalMobileTab,
    dynamicPricingTiers = [],
    notifications: globalNotifications = [],
    markNotificationAsRead: markGlobalNotificationAsRead,
    markAllNotificationsAsRead: markAllGlobalNotificationsAsRead,
    refreshOrders,
    unreadOrdersCount = 0,
    markOrdersAsRead,
    siteSettings = {}
  } = useAppState();

  // Active authenticated user (NO mock fallback) - declared before any hooks or callbacks
  const activeUser = authUser || currentUser || null;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const userName = activeUser?.user_metadata?.full_name || activeUser?.name || (userEmail ? userEmail.split('@')[0] : 'Guest Visitor');
  const userInitial = (userName?.[0] || 'B').toUpperCase();

  const isDark = theme === 'dark';

  const mobileCi = siteSettings?.contactInfo || {};
  const mobileWhatsapp = (mobileCi.whatsapp !== undefined ? mobileCi.whatsapp : (siteSettings?.whatsapp || '')).trim();
  const cleanMobileWa = mobileWhatsapp.replace(/[^0-9]/g, '');
  const mobilePhone = (mobileCi.phone !== undefined ? mobileCi.phone : (siteSettings?.contactPhone || siteSettings?.supportPhone || '')).trim();
  const mobileEmail = (mobileCi.email !== undefined ? mobileCi.email : (siteSettings?.supportEmail || siteSettings?.contactEmail || '')).trim();

  const validTabs = ['home', 'categories', 'orders', 'profile', 'chat', 'support', 'inbox', 'login', 'signup', 'auth'];

  // Active Tab: 'home' | 'categories' | 'orders' | 'profile' | 'chat' | 'support' | 'inbox' | 'login' | 'signup' | 'auth'
  const getInitialMobileTab = () => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && validTabs.includes(tabParam)) return tabParam;
        
        const storedTab = localStorage.getItem('bdigi_mobile_active_tab');
        if (storedTab && validTabs.includes(storedTab)) return storedTab;
      } catch {}
    }
    return 'home';
  };

  const [mobileTab, setMobileTabState] = useState(getInitialMobileTab);
  const [mobileChatMode, setMobileChatMode] = useState('inbox'); // Default to unified Inbox

  const [unreadInboxCount, setUnreadInboxCount] = useState(0);
  const [unreadSupportCount, setUnreadSupportCount] = useState(0);

  const fetchMobileChatUnread = React.useCallback(async () => {
    const email = (activeUser?.email || userEmail || '').toLowerCase().trim();
    if (!email) return;
    try {
      const [resInbox, resSupport] = await Promise.all([
        fetch(`/api/chat/conversations?filter=unread&channel=inbox&email=${encodeURIComponent(email)}`),
        fetch(`/api/chat/conversations?filter=unread&channel=support&email=${encodeURIComponent(email)}`)
      ]);
      if (resInbox.ok) {
        const data = await resInbox.json();
        const unreadTotal = (data.conversations || []).reduce((acc, c) => acc + (c.unread_client_count || 0), 0);
        setUnreadInboxCount(unreadTotal);
      }
      if (resSupport.ok) {
        const data = await resSupport.json();
        const unreadTotal = (data.conversations || []).reduce((acc, c) => acc + (c.unread_client_count || 0), 0);
        setUnreadSupportCount(unreadTotal);
      }
    } catch {}
  }, [userEmail, activeUser?.email]);

  useEffect(() => {
    fetchMobileChatUnread();
    const interval = setInterval(fetchMobileChatUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchMobileChatUnread]);

  useEffect(() => {
    if (mobileTab === 'chat' || mobileTab === 'support' || mobileTab === 'inbox') {
      setUnreadInboxCount(0);
      setUnreadSupportCount(0);
    }
  }, [mobileTab]);

  const setMobileTab = (newTab, force = false) => {
    if (newTab === mobileTab && !force) return;
    setMobileTabState(newTab);
    if (newTab === 'inbox' || newTab === 'chat' || newTab === 'support') {
      setMobileChatMode('inbox');
    }
    if (typeof setGlobalMobileTab === 'function') {
      try {
        setGlobalMobileTab(newTab);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bdigi_mobile_active_tab', newTab);
        localStorage.setItem('bdigi_mobile_mode', 'app');
        const url = new URL(window.location.href);
        url.searchParams.set('app', 'true');
        url.searchParams.delete('web');
        url.searchParams.set('tab', newTab);
        if (newTab === 'home') {
          window.history.replaceState({ app: true, tab: 'home' }, '', url.toString());
        } else {
          window.history.pushState({ app: true, tab: newTab }, '', url.toString());
        }
      } catch {}
    }
  };

  // Dedicated Mobile Auth Form States
  const [mobileAuthMode, setMobileAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [authLoginEmail, setAuthLoginEmail] = useState('');
  const [authLoginPassword, setAuthLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSignupName, setAuthSignupName] = useState('');
  const [authSignupEmail, setAuthSignupEmail] = useState('');
  const [authSignupPassword, setAuthSignupPassword] = useState('');
  const [authSignupCompany, setAuthSignupCompany] = useState('');
  const [authForgotEmail, setAuthForgotEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');

  // Handle Mobile Login Submit
  const handleMobileLoginSubmit = async (e) => {
    e.preventDefault();
    if (!authLoginEmail.trim() || !authLoginPassword.trim()) {
      setAuthErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsAuthLoading(true);
    setAuthErrorMessage('');
    try {
      const res = await login(authLoginEmail, authLoginPassword);
      setIsAuthLoading(false);
      if (res && res.success) {
        showToast(`Welcome back ${res.user?.name || res.user?.email || ''}! ✨`, 'success');
        setMobileTab('home');
        setAuthLoginPassword('');
      } else {
        setAuthErrorMessage(res?.error || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      setIsAuthLoading(false);
      setAuthErrorMessage(err?.message || 'Authentication error. Please try again.');
    }
  };

  // Handle Mobile Signup Submit
  const handleMobileSignupSubmit = async (e) => {
    e.preventDefault();
    if (!authSignupName.trim() || !authSignupEmail.trim() || !authSignupPassword.trim()) {
      setAuthErrorMessage('Please fill in all required registration fields.');
      return;
    }
    if (authSignupPassword.length < 6) {
      setAuthErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsAuthLoading(true);
    setAuthErrorMessage('');
    try {
      const res = await register(authSignupName, authSignupEmail, authSignupPassword, authSignupCompany);
      setIsAuthLoading(false);
      if (res && res.success) {
        showToast(`Account created! Welcome to BDigitizing, ${authSignupName}! 🎉`, 'success');
        setMobileTab('home');
        setAuthSignupPassword('');
      } else {
        setAuthErrorMessage(res?.error || 'Registration failed. An account with this email may already exist.');
      }
    } catch (err) {
      setIsAuthLoading(false);
      setAuthErrorMessage(err?.message || 'Registration exception. Please try again.');
    }
  };

  // Handle Mobile Forgot Password Submit
  const handleMobileForgotSubmit = async (e) => {
    e.preventDefault();
    if (!authForgotEmail.trim()) {
      setAuthErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsAuthLoading(true);
    setAuthErrorMessage('');
    try {
      const res = await requestPasswordReset(authForgotEmail);
      setIsAuthLoading(false);
      if (res && res.success) {
        setAuthSuccessMessage(`Password reset link dispatched to ${authForgotEmail}. Check your inbox!`);
      } else {
        setAuthErrorMessage(res?.error || 'Could not send reset email. Please verify your email address.');
      }
    } catch (err) {
      setIsAuthLoading(false);
      setAuthErrorMessage(err?.message || 'Failed to dispatch reset email.');
    }
  };

  // Sync tab with mobile hardware / browser back/forward buttons
  useEffect(() => {
    // When app mounts on home, prime history state so hardware back button is caught
    if (typeof window !== 'undefined') {
      try {
        if (!window.history.state?.app) {
          window.history.replaceState({ app: true, tab: 'home' }, '', window.location.href);
        }
      } catch {}
    }

    const handlePopState = (e) => {
      if (typeof window !== 'undefined') {
        const stateTab = e?.state?.tab;
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = stateTab || urlParams.get('tab');
        const validTabs = ['home', 'categories', 'orders', 'profile', 'chat', 'support', 'inbox', 'login', 'signup', 'auth'];
        
        // If user is currently on any sub-tab and presses Android back key, return to home
        if (mobileTab !== 'home') {
          setMobileTabState('home');
          try {
            localStorage.setItem('bdigi_mobile_active_tab', 'home');
            localStorage.setItem('bdigi_mobile_mode', 'app');
            const url = new URL(window.location.href);
            url.searchParams.set('app', 'true');
            url.searchParams.delete('web');
            url.searchParams.set('tab', 'home');
            window.history.replaceState({ app: true, tab: 'home' }, '', url.toString());
          } catch {}
        } else if (tabParam && validTabs.includes(tabParam)) {
          setMobileTabState(tabParam);
        } else {
          setMobileTabState('home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileTab]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Category sub-tab: 'all' | 'embroidery' | 'vector' | 'patches'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  
  // Orders filter: 'all' | 'awaiting_payment' | 'delivered' | 'active' | 'completed'
  const [orderFilter, setOrderFilter] = useState('all');

  // Modals & State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderDefaultService, setOrderDefaultService] = useState('embroidery');
  const [isOrderActionMenuOpen, setIsOrderActionMenuOpen] = useState(null); // order object
  
  // Real-time unread counts
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
    if (mobileTab === 'orders' && typeof markOrdersAsRead === 'function') {
      markOrdersAsRead();
    }
  }, [mobileTab, userEmail, markOrdersAsRead]);

  // Listen for global tab switch events (e.g. clicking Client Dashboard, Orders, or Notifications from header)
  useEffect(() => {
    const handleTabSwitch = (e) => {
      const targetTab = e.detail?.tab;
      if (!targetTab) return;
      
      const cleanTab = targetTab === 'dashboard' ? 'home' : (['chat', 'support'].includes(targetTab) ? 'inbox' : targetTab);
      setMobileTabState(cleanTab);
      setIsPreferencesModalOpen(false);
      setIsAccountModalOpen(false);
      setIsFeedbackModalOpen(false);
      setIsLegalModalOpen(false);
      setIsNotifDrawerOpen(false);
      
      if (cleanTab === 'support') {
        setIsSupportModalOpen(true);
      } else {
        setIsSupportModalOpen(false);
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bdigi_mobile_active_tab', cleanTab);
          localStorage.setItem('bdigi_mobile_mode', 'app');
          const url = new URL(window.location.href);
          url.searchParams.set('app', 'true');
          url.searchParams.delete('web');
          url.searchParams.set('tab', cleanTab);
          window.history.replaceState({ app: true, tab: cleanTab }, '', url.toString());
        } catch {}
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    const handleOpenOrderEvent = (e) => {
      const sType = e.detail?.type || 'embroidery';
      handleOpenOrderConfigurator(sType);
    };

    // Check if user returned from Stripe or external payment gateway
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentParam = urlParams.get('payment');
        if (paymentParam === 'success') {
          setMobileTabState('orders');
          if (showToast) showToast('Payment verified successfully! Your order has begun production. 🚀', 'success');
          if (typeof refreshOrders === 'function') {
            refreshOrders().catch(() => {});
          }
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('payment');
          cleanUrl.searchParams.delete('session_id');
          cleanUrl.searchParams.delete('offerId');
          window.history.replaceState({ app: true, tab: 'orders' }, '', cleanUrl.toString());
        } else if (paymentParam === 'canceled') {
          setMobileTabState('orders');
          if (showToast) showToast('Payment session canceled. You can complete payment at any time.', 'info');
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('payment');
          window.history.replaceState({ app: true, tab: 'orders' }, '', cleanUrl.toString());
        }
      } catch {}
    }

    window.addEventListener('bdigi_switch_tab', handleTabSwitch);
    window.addEventListener('bdigi_open_mobile_order', handleOpenOrderEvent);
    return () => {
      window.removeEventListener('bdigi_switch_tab', handleTabSwitch);
      window.removeEventListener('bdigi_open_mobile_order', handleOpenOrderEvent);
    };
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

    const clientEmail = (o?.client_email || o?.clientEmail || o?.user_email || o?.userEmail || o?.email || o?.recipient_email || '').toLowerCase().trim();
    const orderUserId = String(o?.user_id || o?.clientId || o?.client_id || o?.created_by || '').toLowerCase().trim();
    const currentUserId = String(activeUser?.id || '').toLowerCase().trim();

    if (userEmail || currentUserId) {
      if (userEmail && clientEmail && clientEmail === userEmail) return true;
      if (currentUserId && orderUserId && orderUserId === currentUserId) return true;
      return false;
    }
    
    let localOrderIds = [];
    if (typeof window !== 'undefined') {
      try {
        localOrderIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
      } catch {}
    }
    const cleanId = String(o?.id || '').trim().replace(/^#+/, '');
    const isLocalMatch = localOrderIds.some(lid => String(lid).trim().replace(/^#+/, '') === cleanId);
    return isLocalMatch;
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
  const rawCombinedNotifications = [
    ...(Array.isArray(notifications) ? notifications : []),
    ...(Array.isArray(globalNotifications) ? globalNotifications : [])
  ].filter((n, idx, arr) => arr.findIndex(item => String(item.id) === String(n.id)) === idx);

  const combinedNotifications = filterAndSanitizeNotifications(rawCombinedNotifications, {
    currentUserEmail: userEmail,
    isAdmin: authUser?.role === 'admin',
    orders
  });

  const unreadNotifCount = combinedNotifications.filter(n => !n.is_read && !n.read).length;

  // Load Notifications
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const notifs = await fetchNotificationsFromSupabase(userEmail);
        if (isMounted && Array.isArray(notifs)) {
          setNotifications(notifs);
        }
      } catch (err) {
        console.warn('Mobile app sync note:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      setNotifications(prev => (Array.isArray(prev) ? prev.map(n => ({ ...n, is_read: true, read: true })) : []));
      if (markAllGlobalNotificationsAsRead) {
        markAllGlobalNotificationsAsRead();
      }
      await markAllNotificationsAsReadInSupabase(userEmail);
      if (showToast) showToast('All notifications marked as read', 'success');
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
    }
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

  const handleToggleSound = (forcedVal = null) => {
    const nextVal = forcedVal !== null ? forcedVal : !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_audio_enabled', String(nextVal));
    }
    if (nextVal) {
      unlockAudioContext();
      if (isAdmin) {
        playAdminChime(true);
        showToast('🔊 Admin audio alert tune active & tested!', 'success');
      } else {
        playCustomerChime(true);
        showToast('🔔 Gentle message chime active & tested!', 'success');
      }
    } else {
      showToast('🔕 Audio alerts muted.', 'info');
    }
  };

  const handleTestSound = () => {
    unlockAudioContext();
    if (isAdmin) {
      playAdminChime(true);
      showToast('🔊 Admin tune tested loud and clear!', 'success');
    } else {
      playCustomerChime(true);
      showToast('🔔 Gentle chime tested!', 'success');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      showToast('Please write a brief feedback note.', 'error');
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('bdigi_user_feedback') || '[]');
        existing.push({
          rating: feedbackRating,
          text: feedbackText.trim(),
          submittedAt: new Date().toISOString(),
          user: activeUser?.email || 'Anonymous'
        });
        localStorage.setItem('bdigi_user_feedback', JSON.stringify(existing));
      }
      showToast('Thank you for your rating & feedback! ⭐️', 'success');
      setFeedbackText('');
      setIsFeedbackModalOpen(false);
    } catch {
      showToast('Could not save feedback. Please try again.', 'error');
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
      subtitle: 'Sample Batch $3.50/pc (50+ Pcs) • Production Batch $4.50/pc',
      startingPrice: 'Starts $3.50 / pc',
      eta: '3–7 Days',
      icon: Package,
      color: '#0284c7',
      tags: ['patches', 'pvc', 'embroidered', 'woven', 'leather', 'velcro', 'iron-on', 'sample', 'bulk']
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

  if (!isAuthInitialized) {
    return (
      <div style={{
        minHeight: '100dvh',
        width: '100vw',
        background: isDark ? 'var(--color-background, #090d16)' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1.5px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 28px rgba(16, 185, 129, 0.25)'
        }}>
          <img 
            src="/favicon.png" 
            alt="BDigitizing" 
            style={{ width: '42px', height: '48px', objectFit: 'contain', display: 'block' }} 
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', letterSpacing: '-0.02em' }}>
            BDigitizing<span style={{ color: '#059669' }}>.PRO</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', fontWeight: 600, marginTop: '0.25rem' }}>
            Embroidery Digitizing & Vector Art Studio
          </div>
        </div>
        <div style={{ width: '28px', height: '28px', border: isDark ? '3px solid var(--color-border, #334155)' : '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginTop: '0.5rem' }} />
      </div>
    );
  }

  return (
    <div 
      className="mobile-app-root"
      style={{
        background: 'var(--color-background, #ffffff)',
        minHeight: '100vh',
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        paddingBottom: (['login', 'signup', 'auth', 'forgot'].includes(mobileTab)) ? '0px' : '70px',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      
      {/* =========================================================================
          SCREEN 0: DEDICATED FULL-SCREEN MOBILE AUTHENTICATION (LOGIN / SIGNUP / FORGOT)
          ========================================================================= */}
      {['login', 'signup', 'auth', 'forgot'].includes(mobileTab) && (
        <div style={{
          minHeight: '100dvh',
          width: '100%',
          background: isDark ? 'var(--color-background, #090d16)' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Top Bar with Back Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            borderBottom: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #e2e8f0',
            background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <button
              type="button"
              onClick={() => setMobileTab('home')}
              style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 800,
                color: isDark ? '#ffffff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <img src="/favicon.png" alt="BDigitizing" style={{ width: '18px', height: '22px', objectFit: 'contain' }} />
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.02em' }}>
                bdigitizing<span style={{ color: '#10b981' }}>.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileTab('home')}
              style={{
                background: 'none',
                border: 'none',
                color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Skip
            </button>
          </div>

          <div style={{ padding: '1.5rem 1.25rem 3rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '440px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            
            {/* Header Title */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)'
              }}>
                <Lock size={26} />
              </div>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.45rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                {mobileAuthMode === 'signup' ? 'Create Studio Account' : mobileAuthMode === 'forgot' ? 'Reset Password' : 'Sign In to Studio'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', lineHeight: 1.4 }}>
                {mobileAuthMode === 'signup' 
                  ? 'Join thousands of apparel brands and get instant access to 4–12h turnaround digitizing.' 
                  : mobileAuthMode === 'forgot'
                  ? 'Enter your account email and we will send you a secure password reset link.'
                  : 'Access your order stitch test runs, downloads, and real-time order tracking.'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            {mobileAuthMode !== 'forgot' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9',
                borderRadius: '12px',
                padding: '4px',
                gap: '4px'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileAuthMode('login');
                    setAuthErrorMessage('');
                    setAuthSuccessMessage('');
                  }}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: mobileAuthMode === 'login' ? (isDark ? 'var(--color-surface, #111827)' : '#ffffff') : 'transparent',
                    color: mobileAuthMode === 'login' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: mobileAuthMode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileAuthMode('signup');
                    setAuthErrorMessage('');
                    setAuthSuccessMessage('');
                  }}
                  style={{
                    padding: '0.65rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: mobileAuthMode === 'signup' ? (isDark ? 'var(--color-surface, #111827)' : '#ffffff') : 'transparent',
                    color: mobileAuthMode === 'signup' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
                    fontWeight: 900,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: mobileAuthMode === 'signup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Register
                </button>
              </div>
            )}

            {/* Error Message Box */}
            {authErrorMessage && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{authErrorMessage}</span>
              </div>
            )}

            {/* Success Message Box */}
            {authSuccessMessage && (
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#047857',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{authSuccessMessage}</span>
              </div>
            )}

            {/* AUTH FORMS */}
            {mobileAuthMode === 'login' && (
              <form onSubmit={handleMobileLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      value={authLoginEmail}
                      onChange={(e) => { setAuthLoginEmail(e.target.value); setAuthErrorMessage(''); }}
                      placeholder="name@company.com"
                      required
                      autoComplete="email"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 0.85rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setMobileAuthMode('forgot')}
                      style={{ background: 'none', border: 'none', color: isDark ? '#34d399' : '#047857', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authLoginPassword}
                      onChange={(e) => { setAuthLoginPassword(e.target.value); setAuthErrorMessage(''); }}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 2.5rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)',
                    marginTop: '0.25rem'
                  }}
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Studio Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {mobileAuthMode === 'signup' && (
              <form onSubmit={handleMobileSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={authSignupName}
                      onChange={(e) => setAuthSignupName(e.target.value)}
                      placeholder="e.g. Alex Johnson"
                      required
                      autoComplete="name"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.85rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Business Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      value={authSignupEmail}
                      onChange={(e) => setAuthSignupEmail(e.target.value)}
                      placeholder="alex@apparelbrand.com"
                      required
                      autoComplete="email"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.85rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Create Password * (Min 6 chars)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={authSignupPassword}
                      onChange={(e) => setAuthSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 2.5rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Company / Brand Name (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={authSignupCompany}
                      onChange={(e) => setAuthSignupCompany(e.target.value)}
                      placeholder="e.g. Apex Apparel Co."
                      autoComplete="organization"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 0.85rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)',
                    marginTop: '0.25rem'
                  }}
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Free Client Account</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}

            {mobileAuthMode === 'forgot' && (
              <form onSubmit={handleMobileForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      value={authForgotEmail}
                      onChange={(e) => setAuthForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      autoComplete="email"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 0.85rem 0 2.5rem',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                        fontSize: '16px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: '0.95rem',
                    cursor: isAuthLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(4, 120, 87, 0.3)'
                  }}
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMobileAuthMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#34d399' : '#047857',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* Social Logins Divider */}
            {mobileAuthMode !== 'forgot' && (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '0.5rem 0',
                  color: '#94a3b8',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ padding: '0 0.75rem' }}>Or continue with</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <GoogleCustomSignInButton
                      onAuthSuccess={async (googleUser) => {
                        setIsAuthLoading(true);
                        try {
                          const res = await loginWithGoogle(googleUser);
                          setIsAuthLoading(false);
                          if (res?.success) {
                            showToast(`Welcome ${res.user?.name || 'back'}!`, 'success');
                            setMobileTab('home');
                          } else {
                            setAuthErrorMessage(res?.error || 'Google Sign-In failed.');
                          }
                        } catch (err) {
                          setIsAuthLoading(false);
                          setAuthErrorMessage(err?.message || 'Google Sign-In failed.');
                        }
                      }}
                      onAuthError={(err) => setAuthErrorMessage(err)}
                    />
                  </GoogleOAuthProvider>
                </div>
              </>
            )}

            <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 1: HOME TAB
          ========================================================================= */}
      {mobileTab === 'home' && (
        <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: isDark ? 'var(--color-background, #090d16)' : '#f8fafc' }}>
          
          {/* Top Brand Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'var(--color-surface, #111827)' : '#ffffff', padding: '0.75rem 1rem', borderRadius: '16px', border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <img src="/favicon.png" alt="BDigitizing" style={{ width: '22px', height: '26px', objectFit: 'contain' }} />
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', letterSpacing: '-0.03em' }}>
                bdigitizing<span style={{ color: '#ea580c' }}>.</span>
              </span>
              {isAuthenticated && (
                <span style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 900,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  STUDIO
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  color: isDark ? '#ffffff' : '#0f172a',
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
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.5rem',
                  color: isDark ? '#ffffff' : '#0f172a',
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          >
            <Search size={18} style={{ color: '#047857' }} />
            <span style={{ fontSize: '0.88rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', fontWeight: 600 }}>
              Search services (Embroidery, Vector, Patches...)
            </span>
          </div>

          {/* Priority Order Action or Studio Tracker (Single clean card) */}
          {unpaidOrders.length > 0 ? (
            <div style={{
              background: isDark ? 'rgba(234, 88, 12, 0.15)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: isDark ? '1.5px solid rgba(234, 88, 12, 0.4)' : '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.25)' : '0 4px 14px rgba(245, 158, 11, 0.12)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                    {unpaidOrders.length} Order{unpaidOrders.length > 1 ? 's' : ''} Awaiting Payment
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#fb923c' : '#c2410c', fontWeight: 700 }}>
                    Pay to start production
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
                  padding: '0.4rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)'
                }}
              >
                Pay Now →
              </button>
            </div>
          ) : activeOrders.length > 0 ? (
            <div 
              onClick={() => {
                setOrderFilter('active');
                setMobileTab('orders');
              }}
              style={{
                background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4',
                border: isDark ? '1.5px solid rgba(16, 185, 129, 0.35)' : '1.5px solid #86efac',
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: isDark ? '0 4px 14px rgba(0, 0, 0, 0.2)' : '0 4px 14px rgba(16, 185, 129, 0.08)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#059669',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Zap size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                    {activeOrders.length} Order{activeOrders.length > 1 ? 's' : ''} in Production
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#34d399' : '#047857', fontWeight: 700 }}>
                    In progress with studio team
                  </span>
                </div>
              </div>

              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#34d399' : '#047857' }}>
                Track →
              </span>
            </div>
          ) : myOrders.length > 0 ? (
            <div 
              onClick={() => setMobileTab('orders')}
              style={{
                background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '0.85rem 1.15rem',
                color: isDark ? '#ffffff' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ClipboardList size={18} style={{ color: '#059669' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                    My Studio Orders
                  </div>
                  <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.1rem' }}>
                    {totalOrdersCount} orders total • View history & files
                  </div>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#94a3b8' }} />
            </div>
          ) : null}

          {/* Popular Services Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                Our 3 Core Services
              </h3>
              <button
                type="button"
                onClick={() => setMobileTab('categories')}
                style={{ background: 'none', border: 'none', color: isDark ? '#34d399' : '#047857', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
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
                  background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                  borderRadius: '16px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)',
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
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', lineHeight: 1.25 }}>
                    Embroidery Digitizing
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#34d399' : '#047857', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
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
                  background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                  borderRadius: '16px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)',
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
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', lineHeight: 1.25 }}>
                    Vector Art Tracing
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#fb923c' : '#ea580c', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
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
                  background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                  borderRadius: '16px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isDark ? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)',
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
                  <div style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', lineHeight: 1.25 }}>
                    Custom Patches
                  </div>
                  <span style={{ fontSize: '0.8rem', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 900, display: 'block', marginTop: '0.3rem' }}>
                    Starts $3.50 / pc
                  </span>
                  <span style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, display: 'block', marginTop: '0.1rem' }}>
                    50 Pcs Minimum
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
          SCREEN 3: CATEGORIES & SEARCH
          ========================================================================= */}
      {mobileTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0.85rem 1rem 1.5rem', gap: '1rem' }}>
          
          {/* Categories Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                Services & Packages
              </h2>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>
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
            background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc',
            border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
            borderRadius: '12px',
            padding: '0.65rem 0.95rem'
          }}>
            <Search size={18} style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
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
                color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
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
              { id: 'embroidery', label: 'Embroidery' },
              { id: 'vector', label: 'Vector Art' },
              { id: 'patches', label: 'Patches' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveCategoryFilter(f.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '20px',
                  border: activeCategoryFilter === f.id ? '1.5px solid #059669' : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1'),
                  background: activeCategoryFilter === f.id ? '#059669' : (isDark ? 'var(--color-surface, #111827)' : '#ffffff'),
                  color: activeCategoryFilter === f.id ? '#ffffff' : (isDark ? '#94a3b8' : '#475569'),
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
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc', borderRadius: '14px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0' }}>
                <Search size={32} style={{ color: '#94a3b8', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                  No services matching "{searchQuery}"
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>
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
                      border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #e2e8f0',
                      background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                      border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
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
                        <div style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                          {svc.title}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: isDark ? '#34d399' : '#047857' }}>
                          {svc.startingPrice}
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', lineHeight: 1.3 }}>
                        {svc.subtitle}
                      </p>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={11} /> {svc.eta}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: isDark ? '#34d399' : '#059669', fontWeight: 800, marginLeft: 'auto' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: isDark ? 'var(--color-background, #090d16)' : '#f8fafc' }}>
          
          {/* Manage Orders Top Bar */}
          <div style={{
            padding: '0.65rem 0.85rem',
            background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
            borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                Manage Orders
              </h2>
              <div style={{ fontSize: '0.66rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.05rem' }}>
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
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                  border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem',
                  color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
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
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                  border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.35rem',
                  color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
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

          {/* Unpaid Alert Banner (Concise single line) */}
          {unpaidOrdersCount > 0 && orderFilter !== 'awaiting_payment' && (
            <div 
              onClick={() => setOrderFilter('awaiting_payment')}
              style={{
                margin: '0.4rem 0.75rem 0',
                padding: '0.5rem 0.75rem',
                background: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
                border: isDark ? '1px solid rgba(234, 88, 12, 0.4)' : '1px solid #fed7aa',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <CreditCard size={15} style={{ color: '#ea580c' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isDark ? '#fb923c' : '#c2410c' }}>
                  {unpaidOrdersCount} order{unpaidOrdersCount > 1 ? 's' : ''} awaiting payment
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ea580c' }}>
                Pay Now →
              </span>
            </div>
          )}

          {/* Sub-filter Switcher */}
          <div style={{ padding: '0.45rem 0.75rem 0.2rem', display: 'flex', gap: '0.4rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {[
              { id: 'all', label: `All (${myOrders.length})` },
              { id: 'awaiting_payment', label: `Waiting (${unpaidOrders.length})`, highlight: unpaidOrders.length > 0, unpaid: true },
              { id: 'active', label: `Active (${activeOrders.length})` },
              { id: 'delivered', label: `Delivered (${deliveredOrders.length})`, highlight: deliveredOrders.length > 0 },
              { id: 'completed', label: `Completed (${completedOrders.length})` }
            ].map(f => {
              const isSelected = orderFilter === f.id;
              let bg = isDark ? 'var(--color-surface, #111827)' : '#ffffff';
              let color = isDark ? 'var(--color-text-secondary, #94a3b8)' : '#475569';
              let border = isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1';

              if (isSelected) {
                bg = f.unpaid ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : (isDark ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : '#0f172a');
                color = '#ffffff';
                border = f.unpaid ? '1.5px solid #ea580c' : (isDark ? '1.5px solid #475569' : '1.5px solid #0f172a');
              } else if (f.unpaid && f.highlight) {
                bg = isDark ? 'rgba(234, 88, 12, 0.18)' : '#fff7ed';
                color = isDark ? '#fb923c' : '#c2410c';
                border = isDark ? '1.5px solid #ea580c' : '1.5px solid #fdba74';
              } else if (f.highlight) {
                bg = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5';
                color = isDark ? '#34d399' : '#047857';
                border = isDark ? '1.5px solid #059669' : '1.5px solid #10b981';
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
          <div style={{ padding: '0.45rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {(!isAuthenticated && !userEmail && myOrders.length > 0) && (
              <div style={{
                background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                border: isDark ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.4rem',
                marginBottom: '0.15rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: isDark ? '#93c5fd' : '#1e40af', fontWeight: 600 }}>
                  Showing orders placed on this device. Sign in to sync across all devices.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileAuthMode('login');
                    setMobileTab('login');
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
                    background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                    border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '2rem 1.25rem',
                    textAlign: 'center',
                    marginTop: '0.35rem'
                  }}>
                    <Lock size={30} style={{ color: '#94a3b8', margin: '0 auto 0.5rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                      Sign In to View Orders
                    </h4>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.74rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', lineHeight: 1.4 }}>
                      Sign in with your studio account to track real-time machine stitch test runs and download files.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileAuthMode('login');
                        setMobileTab('login');
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
                    background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                    border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '2.25rem 1.25rem',
                    textAlign: 'center',
                    marginTop: '0.35rem'
                  }}>
                    <ClipboardList size={30} style={{ color: '#94a3b8', margin: '0 auto 0.5rem', opacity: 0.5 }} />
                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.92rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                      No Orders Found
                    </h4>
                    <p style={{ margin: '0 0 0.85rem', fontSize: '0.74rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>
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

                let badgeInfo = { 
                  label: 'IN PRODUCTION', 
                  bg: isDark ? 'rgba(2, 132, 199, 0.15)' : '#eff6ff', 
                  border: isDark ? 'rgba(2, 132, 199, 0.4)' : '#bae6fd', 
                  color: isDark ? '#38bdf8' : '#0284c7' 
                };
                if (isUnpaid) {
                  badgeInfo = { 
                    label: 'WAITING FOR PAYMENT', 
                    bg: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed', 
                    border: isDark ? 'rgba(234, 88, 12, 0.4)' : '#fdba74', 
                    color: isDark ? '#fb923c' : '#c2410c' 
                  };
                } else if (isDelivered) {
                  badgeInfo = { 
                    label: 'DELIVERED', 
                    bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', 
                    border: isDark ? 'rgba(16, 185, 129, 0.4)' : '#86efac', 
                    color: isDark ? '#34d399' : '#047857' 
                  };
                } else if (isCompleted) {
                  badgeInfo = { 
                    label: 'COMPLETED', 
                    bg: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', 
                    border: isDark ? 'var(--color-border, #334155)' : '#cbd5e1', 
                    color: isDark ? '#94a3b8' : '#334155' 
                  };
                } else if (isRevision) {
                  badgeInfo = { 
                    label: 'REVISION', 
                    bg: isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed', 
                    border: isDark ? 'rgba(234, 88, 12, 0.4)' : '#fdba74', 
                    color: isDark ? '#fb923c' : '#ea580c' 
                  };
                }

                const priceVal = Number(ord.totalPrice || ord.price || 15).toFixed(2);
                const dateStr = ord.created_at ? new Date(ord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderForDrawer(ord)}
                    style={{
                      background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                      border: isUnpaid ? (isDark ? '1.5px solid #ea580c' : '1.5px solid #fdba74') : (isDelivered ? (isDark ? '1.5px solid #059669' : '1.5px solid #86efac') : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0')),
                      borderRadius: '12px',
                      padding: '0.8rem 0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      boxShadow: isUnpaid ? '0 2px 8px rgba(234, 88, 12, 0.12)' : (isDelivered ? '0 2px 8px rgba(16, 185, 129, 0.12)' : (isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.03)')),
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
                          border: isUnpaid ? '1.5px solid #fb923c' : (isDelivered ? '1.5px solid #10b981' : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1')),
                          flexShrink: 0
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isUnpaid ? (isDark ? '#fb923c' : '#c2410c') : (isDark ? '#34d399' : '#059669') }}>
                            {formatOrderId(ord.id)}
                          </span>
                          <span style={{ fontSize: '1.02rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                            ${priceVal}
                          </span>
                        </div>
                        <p style={{
                          margin: '0.15rem 0 0',
                          fontSize: '0.86rem',
                          color: isDark ? 'var(--color-text-primary, #ffffff)' : '#1e293b',
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

                    {/* Middle Row: Digitizer Avatar + Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.1rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: isUnpaid ? (isDark ? 'rgba(234, 88, 12, 0.2)' : '#fff7ed') : (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5'),
                          color: isUnpaid ? (isDark ? '#fb923c' : '#c2410c') : (isDark ? '#34d399' : '#047857'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          fontWeight: 900
                        }}>
                          BD
                        </div>
                        <span style={{ fontSize: '0.74rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', fontWeight: 600 }}>
                          BDigitizing Studio
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

                    {/* Prominent Unpaid / Waiting for Payment Action Bar */}
                    {isUnpaid && (
                      <div style={{
                        background: isDark ? 'rgba(234, 88, 12, 0.15)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: isDark ? '1px solid rgba(234, 88, 12, 0.4)' : '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                        boxShadow: isDark ? '0 1px 6px rgba(0, 0, 0, 0.2)' : '0 1px 6px rgba(245, 158, 11, 0.1)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>⏳</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 900, color: isDark ? '#fb923c' : '#92400e', lineHeight: 1.2 }}>
                              Waiting for Payment to Start
                            </div>
                            <div style={{ fontSize: '0.65rem', color: isDark ? '#fed7aa' : '#b45309', fontWeight: 600 }}>
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
                            padding: '0.36rem 0.72rem',
                            fontSize: '0.74rem',
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
                          <Zap size={12} /> Pay ${priceVal} →
                        </button>
                      </div>
                    )}

                    {/* Delivered Quick Review Bar */}
                    {isDelivered && (
                      <div style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4',
                        border: isDark ? '1px dashed #059669' : '1px dashed #86efac',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: isDark ? '#34d399' : '#047857'
                      }}>
                        <span>Files Ready for Download</span>
                        <span style={{ textDecoration: 'underline' }}>Review & Download →</span>
                      </div>
                    )}

                    {/* Bottom Row: Date + 3 Dots Menu */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                      paddingTop: '0.45rem',
                      marginTop: '0.1rem'
                    }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>
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
                          color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                          cursor: 'pointer',
                          padding: '0.15rem'
                        }}
                      >
                        <MoreVertical size={16} />
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
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: isDark ? 'var(--color-background, #090d16)' : '#f8fafc', paddingBottom: '2.5rem' }}>
          
          {/* Top Brand Executive Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.25rem 2.25rem',
            position: 'relative'
          }}>
            {/* Top Bar with Notifications */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Client Operations Portal
              </span>
              <button
                type="button"
                onClick={() => setIsNotifDrawerOpen(true)}
                style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', padding: '0.4rem', color: '#ffffff', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadNotifCount > 0 && (
                  <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                )}
              </button>
            </div>

            {/* User Avatar + Name + Balance (Or Guest Sign-In) */}
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
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
                    border: '2px solid rgba(255, 255, 255, 0.4)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
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
                    background: '#22c55e',
                    border: '2px solid #0f172a'
                  }} />
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {userName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                      Wallet Balance: <strong style={{ color: '#ffffff', fontWeight: 900 }}>${walletBalance.toFixed(2)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDepositModalOpen(true)}
                      style={{
                        background: 'rgba(234, 88, 12, 0.25)',
                        border: '1px solid #ea580c',
                        borderRadius: '8px',
                        padding: '0.15rem 0.5rem',
                        color: '#ffedd5',
                        fontSize: '0.7rem',
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
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    <User size={26} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                      Guest Visitor
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '0.1rem' }}>
                      Sign in to track orders & balance
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileAuthMode('login');
                    setMobileTab('login');
                  }}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.5rem 0.95rem',
                    fontWeight: 900,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)'
                  }}
                >
                  Sign In
                </button>
              </div>
            )}

          </div>

          {/* SECTION 1: ACCOUNT & ORDERS */}
          <div style={{ padding: '0.85rem 1.25rem 0.35rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Account & Orders
            </div>

            <div style={{ background: isDark ? 'var(--color-surface, #111827)' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              {/* Account Profile */}
              <div 
                onClick={() => {
                  if (isAuthenticated) {
                    setIsAccountModalOpen(true);
                  } else {
                    setMobileAuthMode('login');
                    setMobileTab('login');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.45rem', borderRadius: '10px' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Account & Profile</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>{isAuthenticated ? `Signed in as ${userEmail}` : 'Sign in to sync your profile'}</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>

              {/* Wallet & Balance */}
              <div 
                onClick={() => setIsDepositModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.45rem', borderRadius: '10px' }}>
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Wallet & Payments</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Balance: ${walletBalance.toFixed(2)}</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDark ? '#34d399' : '#15803d', background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                  + Top-Up
                </span>
              </div>

              {/* Orders History */}
              <div 
                onClick={() => setMobileTab('orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', padding: '0.45rem', borderRadius: '10px' }}>
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Production Orders & Files</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Track live jobs, download DST & proof files</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* SECTION 2: STUDIO DESK */}
          <div style={{ padding: '0.75rem 1.25rem 0.35rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Studio Desk & Help
            </div>

            <div style={{ background: isDark ? 'var(--color-surface, #111827)' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              {/* Inbox & Studio Messages */}
              <div 
                onClick={() => {
                  setMobileChatMode('inbox');
                  setMobileTab('inbox');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', padding: '0.45rem', borderRadius: '10px' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Inbox & Studio Messages</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Chat with master digitizers & support</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {(unreadSupportCount + unreadInboxCount) > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 900, borderRadius: '9999px', padding: '0.1rem 0.45rem' }}>
                      {unreadSupportCount + unreadInboxCount} new
                    </span>
                  )}
                  <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
                </div>
              </div>

              {/* Direct WhatsApp & Studio Hotlines */}
              <div 
                onClick={() => setIsSupportModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.45rem', borderRadius: '10px' }}>
                    <HelpCircle size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>WhatsApp Desk & Hotlines</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Direct WhatsApp, phone hotline & FAQs</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>

              {/* Service Rates & Packages */}
              <div 
                onClick={() => setMobileTab('categories')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7', padding: '0.45rem', borderRadius: '10px' }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Service Rates & Packages</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>View all rates, turnarounds & tiers</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>

              {/* Quality Guarantee & Terms */}
              <div 
                onClick={() => setIsLegalModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#475569', padding: '0.45rem', borderRadius: '10px' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Quality Guarantee & Terms</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Sew-out guarantee, free edits & IP safety</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>

              {/* Share Feedback */}
              <div 
                onClick={() => setIsFeedbackModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', padding: '0.45rem', borderRadius: '10px' }}>
                    <Star size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Share Feedback</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Rate studio experience & send suggestions</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* SECTION 3: APP PREFERENCES */}
          <div style={{ padding: '0.75rem 1.25rem 0.35rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>
              App Preferences
            </div>

            <div style={{ background: isDark ? 'var(--color-surface, #111827)' : '#ffffff', borderRadius: '16px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.02)' }}>
              {/* Preferences */}
              <div 
                onClick={() => setIsPreferencesModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.9rem 1.15rem',
                  borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(100, 116, 139, 0.12)', color: '#475569', padding: '0.45rem', borderRadius: '10px' }}>
                    <Settings size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Display & File Preferences</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Themes, audio alerts & default machine formats</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
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
                  padding: '0.9rem 1.15rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', padding: '0.45rem', borderRadius: '10px' }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Switch to Website View</span>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Browse full desktop layout</span>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: isDark ? '#94a3b8' : '#94a3b8' }} />
              </div>
            </div>
          </div>

          {/* Invite friends row */}
          <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
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
                justifyContent: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                padding: '0.75rem',
                background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                borderRadius: '12px',
                border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
                color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                fontSize: '0.875rem',
                fontWeight: 700
              }}
            >
              <Share2 size={16} style={{ color: '#ea580c' }} />
              <span>Invite Friends & Colleagues</span>
            </div>
          </div>

          {/* App Version Tag + Sign Out */}
          <div style={{ padding: '1rem 1.25rem 0', textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: '0.85rem' }}>
              v4.5.0 • BDigitizing Studio
            </span>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  if (logout) logout();
                  showToast('Signed out successfully', 'info');
                }}
                style={{
                  background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  color: isDark ? '#f87171' : '#dc2626',
                  border: isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '0.65rem 1.75rem',
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
                  setMobileAuthMode('login');
                  setMobileTab('login');
                }}
                style={{
                  background: isDark ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 2rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)'
                }}
              >
                <User size={16} /> Sign In to Studio Account
              </button>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 6: 24/7 SUPPORT DESK & INBOX CHAT (LIVE REAL-TIME CONVERSATION)
          ========================================================================= */}
      {(mobileTab === 'chat' || mobileTab === 'support' || mobileTab === 'inbox') && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 66px)',
          maxHeight: 'calc(100vh - 66px)',
          overflow: 'hidden',
          background: isDark ? 'var(--color-background, #090d16)' : '#f8fafc',
          position: 'relative'
        }}>
          {/* Mobile Studio Inbox Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
            borderBottom: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setMobileTab('home')}
                style={{
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem',
                  color: isDark ? '#ffffff' : '#0f172a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Return to Home"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                  Studio Inbox
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#34d399' : '#059669', fontWeight: 700 }}>
                    Digitizers & Support Active
                  </span>
                </div>
              </div>
            </div>

            {/* Chime Sound Notification Toggle */}
            <button
              type="button"
              onClick={handleTestSound}
              style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem',
                color: soundEnabled ? (isDark ? '#34d399' : '#059669') : (isDark ? '#94a3b8' : '#64748b'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Notification sound chime"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>

          {/* Embedded CustomerSupportChat */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CustomerSupportChat
              chatType="inbox"
              key="mobile-chat-screen-inbox"
            />
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
          background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
          borderTop: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
          zIndex: isOrderModalOpen ? -1 : 800,
          display: (isOrderModalOpen || ['login', 'signup', 'auth', 'forgot'].includes(mobileTab)) ? 'none' : 'grid',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: isDark ? '0 -4px 16px rgba(0,0,0,0.35)' : '0 -4px 16px rgba(0,0,0,0.06)'
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
            color: mobileTab === 'home' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'home' ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
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

        {/* Tab 2: Inbox */}
        <button
          type="button"
          onClick={() => {
            setMobileChatMode('inbox');
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
            color: (mobileTab === 'inbox' || mobileTab === 'chat' || mobileTab === 'support') ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: (mobileTab === 'inbox' || mobileTab === 'chat' || mobileTab === 'support') ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            <MessageSquare size={20} strokeWidth={(mobileTab === 'inbox' || mobileTab === 'chat' || mobileTab === 'support') ? 2.5 : 1.75} />
            {(unreadSupportCount + unreadInboxCount) > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '2px',
                minWidth: '15px',
                height: '15px',
                borderRadius: '9999px',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.55rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px'
              }}>
                {unreadSupportCount + unreadInboxCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: (mobileTab === 'inbox' || mobileTab === 'chat' || mobileTab === 'support') ? 900 : 600 }}>Inbox</span>
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
            color: mobileTab === 'categories' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'categories' ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
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
            color: mobileTab === 'orders' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'orders' ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
            borderRadius: '12px',
            padding: '0.25rem 0.65rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}>
            <ClipboardList size={20} strokeWidth={mobileTab === 'orders' ? 2.5 : 1.75} />
            {unreadOrdersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-1px',
                right: '-1px',
                background: '#ea580c',
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
                {unreadOrdersCount}
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
            color: mobileTab === 'profile' ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
            gap: '0.18rem'
          }}
        >
          <div style={{
            background: mobileTab === 'profile' ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : 'transparent',
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              border: isDark ? '1px solid var(--color-border, #334155)' : 'none',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Settings size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Studio Preferences</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreferencesModalOpen(false)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Color Theme Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.35rem' }}>
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
                        border: isSelected ? '2px solid #059669' : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1'),
                        background: isSelected ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : (isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff'),
                        color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderTop: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #f1f5f9' }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block' }}>Audio Notifications</span>
                <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Play chime on incoming messages, support & orders</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleToggleSound()}
                  style={{
                    background: soundEnabled ? (isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5') : (isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9'),
                    color: soundEnabled ? (isDark ? '#34d399' : '#047857') : (isDark ? '#94a3b8' : '#64748b'),
                    border: soundEnabled ? '1.5px solid #86efac' : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1'),
                    borderRadius: '10px',
                    padding: '0.4rem 0.65rem',
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
                <button
                  type="button"
                  onClick={handleTestSound}
                  style={{
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.4rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Test Sound"
                >
                  <Volume2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Test
                </button>
              </div>
            </div>

            {/* Default Embroidery Format */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.35rem' }}>
                Default Embroidery Format
              </label>
              <select
                value={defaultEmbFormat}
                onChange={(e) => setDefaultEmbFormat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff'
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
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.35rem' }}>
                Currency Display
              </label>
              <select
                value={currencyPref}
                onChange={(e) => setCurrencyPref(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff'
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              border: isDark ? '1px solid var(--color-border, #334155)' : 'none',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <User size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Account Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
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
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    fontSize: '0.85rem',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
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
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    fontSize: '0.85rem',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
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
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    fontSize: '0.85rem',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
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
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #e2e8f0',
                    fontSize: '0.85rem',
                    color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b',
                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Wallet Summary */}
              <div style={{ background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4', border: isDark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #a7f3d0', borderRadius: '12px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#34d399' : '#047857', fontWeight: 800 }}>Prepaid Studio Balance</span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>${walletBalance.toFixed(2)}</div>
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderTop: isDark ? '1px solid var(--color-border, #334155)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <HelpCircle size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>24/7 Support Desk</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Primary Action: Open Live Support Chat */}
            <button
              type="button"
              onClick={() => {
                setIsSupportModalOpen(false);
                setMobileChatMode('support');
                setMobileTab('chat');
              }}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '14px',
                border: isDark ? '1.5px solid rgba(16, 185, 129, 0.5)' : '1.5px solid #86efac',
                background: isDark ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)' : '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Headphones size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: isDark ? '#34d399' : '#065f46' }}>Open Live Support Chat</h4>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#a7f3d0' : '#047857', fontWeight: 700 }}>● Active Specialists • Real-time Chat & Sound Chimes</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#059669' }} />
            </button>

            {/* Action 2: Email Helpdesk */}
            <a
              href={`mailto:${mobileEmail || 'support@bdigitizing.com'}?subject=Support%20Request%20-%20BDigitizing`}
              style={{
                padding: '0.95rem 1rem',
                borderRadius: '14px',
                border: isDark ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86efac',
                background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                textDecoration: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>24/7 Studio Helpdesk</h4>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#34d399' : '#047857', fontWeight: 700 }}>● Active Helpdesk • Direct Ticket</span>
                </div>
              </div>
              <ChevronRight size={18} style={{ color: '#059669' }} />
            </a>

            {/* Action 2: WhatsApp Direct or Phone Direct (Dynamic Auto-Fit) */}
            {cleanMobileWa ? (
              <a
                href={`https://wa.me/${cleanMobileWa}?text=Hello%20BDigitizing%20Studio%2C%20I%20need%20support%20with%20my%20order.`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.95rem 1rem',
                  borderRadius: '14px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
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
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>WhatsApp Master Desk</h4>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>Connect with master digitizers directly</span>
                  </div>
                </div>
                <ExternalLink size={18} style={{ color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }} />
              </a>
            ) : mobilePhone ? (
              <a
                href={`tel:${mobilePhone.replace(/[^0-9+]/g, '')}`}
                style={{
                  padding: '0.95rem 1rem',
                  borderRadius: '14px',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--orange-500)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Studio Direct Line</h4>
                    <span style={{ fontSize: '0.72rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }}>{mobilePhone}</span>
                  </div>
                </div>
                <ExternalLink size={18} style={{ color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b' }} />
              </a>
            ) : null}

            {/* FAQ Accordion Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', textTransform: 'uppercase' }}>
                Common Questions
              </span>
              {[
                { q: 'How fast is standard delivery?', a: 'Standard turnaround is 4–12 hours. Express rush delivers in 4–8 hours guaranteed.' },
                { q: 'What machine formats are provided?', a: 'Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP), Janome (.JEF) & PDF worksheet.' },
                { q: 'Are revisions really free?', a: 'Yes, unlimited free revisions are included on all orders until your machine stitches flawlessly.' }
              ].map((faq, idx) => (
                <div key={idx} style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block', marginBottom: '0.15rem' }}>{faq.q}</strong>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b', lineHeight: 1.35 }}>{faq.a}</p>
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderTop: isDark ? '1px solid var(--color-border, #334155)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Star size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Rate Your Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
                        style={{ color: star <= feedbackRating ? '#f59e0b' : (isDark ? '#475569' : '#cbd5e1') }}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block', marginTop: '0.35rem' }}>
                  {feedbackRating === 5 ? '⭐⭐⭐⭐⭐ Outstanding & Flawless' : feedbackRating === 4 ? '⭐⭐⭐⭐ Great Experience' : feedbackRating === 3 ? '⭐⭐⭐ Good Quality' : 'Needs Improvement'}
                </span>
              </div>

              {/* Feedback Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
                  Topic Category
                </label>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['Quality', 'Speed', 'Customer Support', 'Pricing', 'App Experience'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: feedbackCategory === cat ? (isDark ? '1.5px solid #10b981' : '1.5px solid #059669') : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1'),
                        background: feedbackCategory === cat ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5') : (isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff'),
                        color: feedbackCategory === cat ? (isDark ? '#34d399' : '#047857') : (isDark ? 'var(--color-text-secondary, #94a3b8)' : '#475569'),
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', marginBottom: '0.3rem' }}>
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
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    fontSize: '0.85rem',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '24px 24px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderTop: isDark ? '1px solid var(--color-border, #334155)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={20} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Community & Legal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLegalModalOpen(false)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#334155', lineHeight: 1.5 }}>
              <div style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0' }}>
                <strong style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>100% Quality & Machine Sew-Out Guarantee</strong>
                Every digitized embroidery design is tested on physical commercial machinery. We guarantee zero unnecessary thread breaks and proper underlay pull-compensation.
              </div>

              <div style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0' }}>
                <strong style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Intellectual Property & Non-Disclosure</strong>
                You retain 100% full commercial ownership of all uploaded artwork, source files, and final stitch outputs. We never resell, license, or share your proprietary designs.
              </div>

              <div style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc', padding: '0.85rem', borderRadius: '12px', border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0' }}>
                <strong style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Unlimited Free Revisions Policy</strong>
                Modifications for density, size adjustment, thread sequence, machine format conversions, and minor artwork changes are performed 100% free of charge.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLegalModalOpen(false)}
              style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#0f172a',
                color: '#ffffff',
                border: isDark ? '1px solid var(--color-border, #334155)' : 'none',
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              width: '100%',
              maxWidth: '500px',
              borderRadius: '20px 20px 0 0',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              animation: 'slideUp 0.2s ease-out',
              borderTop: isDark ? '1px solid var(--color-border, #334155)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#059669' }}>
                  {formatOrderId(isOrderActionMenuOpen.id)}
                </span>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                  {isOrderActionMenuOpen.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderActionMenuOpen(null)}
                style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
                border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0',
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer'
              }}
            >
              <ClipboardList size={18} style={{ color: '#059669' }} /> View Order & Download Files
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
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
              width: '85%',
              maxWidth: '380px',
              height: '100%',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              overflowY: 'auto',
              borderLeft: isDark ? '1px solid var(--color-border, #334155)' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Bell size={18} style={{ color: '#059669' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>Notifications</h3>
                {unreadNotifCount > 0 && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '999px', background: '#059669', color: '#ffffff' }}>
                    {unreadNotifCount}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllNotificationsAsRead}
                    title="Mark all notifications as read"
                    style={{
                      background: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
                      color: '#059669',
                      border: isDark ? '1px solid rgba(5, 150, 105, 0.4)' : '1px solid #a7f3d0',
                      borderRadius: '8px',
                      padding: '0.3rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Read All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifDrawerOpen(false)}
                  style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {combinedNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#94a3b8' }}>
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
                          setNotifications(prev => (Array.isArray(prev) ? prev.map(item => String(item.id) === String(id) ? { ...item, is_read: true, read: true } : item) : []));
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
                      background: (n.is_read || n.read) ? (isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc') : (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed'),
                      border: (n.is_read || n.read) ? (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0') : (isDark ? '1.5px solid rgba(251, 146, 60, 0.5)' : '1.5px solid #fdba74'),
                      cursor: 'pointer',
                      boxShadow: (n.is_read || n.read) ? 'none' : '0 2px 8px rgba(234, 88, 12, 0.12)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                        {n.title || 'Studio Notification'}
                      </h5>
                      <span 
                        style={{ fontSize: '0.68rem', color: isDark ? '#94a3b8' : '#64748b', whiteSpace: 'nowrap', fontWeight: 600, flexShrink: 0 }}
                        title={getNotificationFullDateTime(n, orders)}
                      >
                        {formatNotificationExactTime(n, orders)}
                      </span>
                    </div>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: isDark ? 'var(--color-text-secondary, #94a3b8)' : '#475569' }}>
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
