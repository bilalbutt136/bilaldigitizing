'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import {
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  addRevisionInSupabase,
  upsertClientInSupabase,
  signInWithGoogleIdToken,
  signInWithGoogleOAuth,
  promptGoogleIdentitySignIn,
  signInWithAppleIdToken,
  signInWithAppleOAuth,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  sendPasswordResetEmail,
  updateUserPassword,
  saveCmsConfigToSupabase,
  fetchCatalogFromSupabase,
  fetchClientsFromSupabase,
  fetchOrdersFromSupabase,
  addOrderMessageInSupabase,
  verifyAdminSession,
  fetchAdminUsers,
  addAdminUserInSupabase,
  resetAdminPasswordInSupabase,
  removeAdminUserInSupabase,
  depositWalletViaApi,
  deductWalletViaApi,
  fetchWalletBalanceFromSupabase,
  cancelOrderInSupabase,
  deleteOrderInSupabase,
  upsertCatalogDataToSupabase,
  fetchHomePageContentFromSupabase,
  updateHomePageSettingsInSupabase,
  saveHeroServiceViaApi,
  fetchConversations,
  subscribeToLiveMessages,
  fetchNotificationsFromSupabase,
  createNotificationInSupabase,
  markNotificationAsReadInSupabase,
  markAllNotificationsAsReadInSupabase,
  broadcastLiveNotification,
  subscribeToNotifications,
  subscribeToNotificationListeners,
  subscribeToOrders,
  getAuthHeaders,
  ORDER_STATUSES,
  validateStatusTransition
} from '../services/supabaseService';

import { playNotificationSound } from '../utils/audioNotification';
import { THEME_PRESETS, applyThemePresetToDOM } from '../utils/themePresets';

const StateContext = createContext();

export const formatOrderId = (rawId) => {
  if (!rawId) return '#0000';
  const cleanId = String(rawId).replace(/^(EMB-|VEC-)/i, '').replace(/^#/, '');
  return `#${cleanId}`;
};

export const formatDimensions = (dim) => {
  if (!dim) return '3.5" (Standard Width)';
  if (typeof dim === 'string') return dim;
  if (typeof dim === 'number') return `${dim}"`;
  if (typeof dim === 'object') {
    const w = dim.width || dim.w || '';
    const h = dim.height || dim.h || '';
    const u = dim.unit || 'in';
    if (w && h) return `${w}" x ${h}" ${u}`;
    if (w) return `${w}" ${u}`;
    if (h) return `${h}" ${u}`;
    return '3.5" (Standard Width)';
  }
  return String(dim);
};

export const formatFabric = (fab) => {
  if (!fab) return 'Cotton / Poly Twill';
  if (typeof fab === 'string') return fab;
  if (typeof fab === 'object') {
    return fab.name || fab.type || fab.label || 'Cotton / Poly Twill';
  }
  return String(fab);
};


export const StateProvider = ({ children }) => {
  // Synchronous session hydration from localStorage to prevent flash/redirect on refresh
  const getInitialAuth = () => {
    if (typeof window === 'undefined') {
      return { user: null, isAuth: false, view: 'public' };
    }
    try {
      const savedUserStr = localStorage.getItem('bdigi_auth_user');
      const savedView = localStorage.getItem('bdigi_current_view') || 'public';
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        if (parsed && parsed.email) {
          const isAdmin = parsed.role === 'admin';
          return {
            user: parsed,
            isAuth: true,
            view: isAdmin ? 'admin' : (savedView === 'admin' ? 'admin' : 'customer')
          };
        }
      }
    } catch {}
    return { user: null, isAuth: false, view: 'public' };
  };

  const initialAuth = getInitialAuth();

  // Navigation & Authentication state
  const [currentView, setCurrentView] = useState(initialAuth.view);
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuth);
  const [isAuthInitialized, setIsAuthInitialized] = useState(initialAuth.isAuth);
  const [authUser, setAuthUser] = useState(initialAuth.user);

  // Auth modal & Tab navigation states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalTarget, setAuthModalTarget] = useState('customer');
  const [activeAdminTabState, setActiveAdminTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bdigi_admin_tab') || 'dashboard';
    }
    return 'dashboard';
  });
  
  const [activeCustomerTabState, setActiveCustomerTabState] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam) {
        return tabParam === 'support' ? 'inbox' : tabParam;
      }
      return localStorage.getItem('bdigi_customer_tab') || 'dashboard';
    }
    return 'dashboard';
  });

  const activeAdminTab = activeAdminTabState;
  const setActiveAdminTab = (tab) => {
    setActiveAdminTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_admin_tab', tab);
    }
  };

  const activeCustomerTab = activeCustomerTabState;
  const setActiveCustomerTab = (tab) => {
    setActiveCustomerTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_customer_tab', tab);
    }
  };

  // Global Theme Mode State ('light' | 'dark') & Color Preset
  const [theme, setThemeState] = useState('light');
  const [colorTheme, setColorThemeState] = useState('studio-orange');
  const [customBrandColors, setCustomBrandColorsState] = useState(null);

  const applyThemeToDOM = (tMode = theme, cPreset = colorTheme, cBrand = customBrandColors) => {
    if (typeof window === 'undefined') return;
    applyThemePresetToDOM(cPreset, tMode, cBrand);
  };

  useEffect(() => {
    const savedMode = (typeof window !== 'undefined' && localStorage.getItem('bdigi_theme')) || 'light';
    const savedPreset = (typeof window !== 'undefined' && localStorage.getItem('bdigi_color_theme')) || 'studio-orange';
    const savedBrand = (typeof window !== 'undefined' && JSON.parse(localStorage.getItem('bdigi_custom_brand') || 'null')) || null;

    setThemeState(savedMode);
    setColorThemeState(savedPreset);
    setCustomBrandColorsState(savedBrand);

    applyThemePresetToDOM(savedPreset, savedMode, savedBrand);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);

    let nextPreset = colorTheme;
    if (nextTheme === 'dark' && (colorTheme === 'studio-orange' || !colorTheme)) {
      nextPreset = 'executive-navy';
      setColorThemeState('executive-navy');
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_color_theme', 'executive-navy');
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_theme', nextTheme);
    }
    applyThemePresetToDOM(nextPreset, nextTheme, customBrandColors);
    showToast(nextTheme === 'dark' ? 'Executive Navy Dark Mode enabled 🌙' : 'Light mode enabled ☀️', 'info');
  };

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(validTheme);

    let nextPreset = colorTheme;
    if (validTheme === 'dark' && (colorTheme === 'studio-orange' || !colorTheme)) {
      nextPreset = 'executive-navy';
      setColorThemeState('executive-navy');
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_color_theme', 'executive-navy');
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_theme', validTheme);
    }
    applyThemePresetToDOM(nextPreset, validTheme, customBrandColors);
  };

  const setColorTheme = (presetId, customBrand = null) => {
    const targetPreset = THEME_PRESETS.find(t => t.id === presetId)?.id || 'studio-orange';
    setColorThemeState(targetPreset);
    if (customBrand) {
      setCustomBrandColorsState(customBrand);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_color_theme', targetPreset);
      if (customBrand) {
        localStorage.setItem('bdigi_custom_brand', JSON.stringify(customBrand));
      }
    }
    applyThemePresetToDOM(targetPreset, theme, customBrand || customBrandColors);
    showToast(`Theme updated to ${THEME_PRESETS.find(t => t.id === targetPreset)?.name || 'New Theme'} ✨`, 'success');
  };

  // Mobile View Mode: 'app' (default on mobile devices, standalone PWA, installed app) | 'website' (for desktop browsers or explicit web mode)
  const [mobileMode, setMobileModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true;
        const isMobileScreen = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const urlParams = new URLSearchParams(window.location.search);
        const urlApp = urlParams.get('app') === 'true' || urlParams.get('mode') === 'app';
        const urlWeb = urlParams.get('web') === 'true' || urlParams.get('mode') === 'web';
        const savedMode = localStorage.getItem('bdigi_mobile_mode');

        if (urlWeb) return 'website';
        if (urlApp || isStandalone) return 'app';
        if (savedMode === 'app' || savedMode === 'website') return savedMode;
        if (isMobileScreen) return 'app';
      } catch {}
    }
    return 'website';
  });

  const [isStandaloneApp, setIsStandaloneApp] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
      setIsStandaloneApp(isStandalone);
      
      const urlParams = new URLSearchParams(window.location.search);
      const urlApp = urlParams.get('app') === 'true' || urlParams.get('mode') === 'app';
      const urlWeb = urlParams.get('web') === 'true' || urlParams.get('mode') === 'web';
      
      const savedMode = localStorage.getItem('bdigi_mobile_mode');
      const isMobileScreen = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let targetMode = 'website';
      if (urlWeb) {
        targetMode = 'website';
      } else if (urlApp || isStandalone) {
        targetMode = 'app';
      } else if (savedMode === 'app' || savedMode === 'website') {
        targetMode = savedMode;
      } else if (isMobileScreen) {
        targetMode = 'app';
      }

      setMobileModeState(targetMode);
      if (targetMode === 'app') {
        document.documentElement.classList.add('mobile-app-active');
        document.documentElement.setAttribute('data-mobile-mode', 'app');
      } else {
        document.documentElement.classList.remove('mobile-app-active');
        document.documentElement.removeAttribute('data-mobile-mode');
      }
    }
  }, []);

  const setMobileMode = (mode) => {
    setMobileModeState(mode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bdigi_mobile_mode', mode);
        if (mode === 'app') {
          document.documentElement.classList.add('mobile-app-active');
          document.documentElement.setAttribute('data-mobile-mode', 'app');
        } else {
          document.documentElement.classList.remove('mobile-app-active');
          document.documentElement.removeAttribute('data-mobile-mode');
        }
      } catch {}
    }
  };

  const setCustomBrandColors = (brandOverrides) => {
    setCustomBrandColorsState(brandOverrides);
    if (typeof window !== 'undefined') {
      if (brandOverrides) {
        localStorage.setItem('bdigi_custom_brand', JSON.stringify(brandOverrides));
      } else {
        localStorage.removeItem('bdigi_custom_brand');
      }
    }
    applyThemePresetToDOM(colorTheme, theme, brandOverrides);
    showToast('Brand colors updated successfully!', 'success');
  };
  
  // Checkout & Payment states
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutSession, setCheckoutSession] = useState(null);

  // Core Data Arrays (seeded from the database catalog on load)
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricing, setPricing] = useState({});
  const [pricingCards, setPricingCards] = useState([]);
  const [dynamicPricingTiers, setDynamicPricingTiers] = useState([]);
  const [portfolioSamples, setPortfolioSamples] = useState([]);
  const [sewOuts, setSewOuts] = useState([]);
  const [patchCards, setPatchCards] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroGlobalSettings, setHeroGlobalSettings] = useState({
    title: 'Premium Embroidery, Vector Art & Patches',
    rotatingTexts: 'Commercial Embroidery, Scalable Vector Art, Custom Physical Patches'
  });
  const [heroServiceText, setHeroServiceText] = useState({});
  const [siteSettings, setSiteSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('site_settings_live');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            // Sanitize: eliminate any obsolete emerald/green gradient or 20% cached announcement
            if (parsed.announcement) {
              if (parsed.announcement.theme === 'emerald' || (parsed.announcement.bgColor && parsed.announcement.bgColor.includes('065f46'))) {
                parsed.announcement.theme = 'orange';
                parsed.announcement.bgColor = 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)';
              }
            }
            if (Array.isArray(parsed.promotions) && parsed.promotions.length > 0) {
              return parsed;
            }
          }
        }
      } catch {}
    }
    return {
      promotions: [
        {
          id: 'promo-sale-15',
          name: 'SALE',
          type: 'all_orders',
          discountPercent: 15,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'active',
          maxOrdersLimit: 500,
          ordersCount: 0,
          servicesIncluded: 'All Studio Services',
          promoCode: 'SAVE15',
          createdAt: new Date().toISOString()
        }
      ],
      announcement: {
        enabled: true,
        badge: 'SALE',
        text: 'Get 15% OFF on All Custom Embroidery Digitizing & Vector Art Orders!',
        promoCode: 'SAVE15',
        linkText: 'Claim 15% Off',
        linkUrl: '/order',
        theme: 'orange',
        bgColor: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
        textColor: '#ffffff',
        showCodeBadge: true,
        showCountdown: true,
        countdownHours: 24,
        discountValue: 15
      },
      promotionalBanner: {
        enabled: false,
        title: '',
        description: '',
        promoCode: '',
        ctaText: 'Start Your Order',
        ctaLink: '/order'
      },
      promoCodes: [
        {
          code: 'SAVE15',
          discountType: 'percent',
          discountValue: 15,
          minOrder: 0,
          description: '15% off all embroidery digitizing and vector conversion services',
          isActive: true
        }
      ]
    };
  });
  const [digitizers, setDigitizers] = useState([]);

  // Admin whitelist (server-managed via public.admins table)
  const [adminUsers, setAdminUsers] = useState([]);

  // Dynamic Service-Driven Homepage & CMS Content State
  const [activeHomeServiceTab, setActiveHomeServiceTab] = useState('all');
  const [serviceCmsContent, setServiceCmsContent] = useState({});
  const [homePageConfig, setHomePageConfig] = useState({
    settings: {},
    trustStats: [],
    trustFeatures: [],
    workflowSteps: [],
    pricingStaticCards: [],
    pricingTiers: []
  });
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);

  // Wallet & Modals State
  const [walletBalance, setWalletBalance] = useState(0);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isOrderWizardOpen, setIsOrderWizardOpen] = useState(false);
  const [orderWizardInitialData, setOrderWizardInitialData] = useState(null);
  const [isStoreOrderModalOpen, setIsStoreOrderModalOpen] = useState(false);
  const [selectedStoreItem, setSelectedStoreItem] = useState(null);
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState(null);
  const [isPricingSettingsOpen, setIsPricingSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Global Order Notification System State with localStorage Persistence & Live Sync
  const [notifications, setNotifications] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bdigi_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          return Array.isArray(parsed) ? parsed.filter(n => !String(n.id || '').startsWith('msg-')) : [];
        }
      }
    } catch {}
    return [];
  });

  const saveNotificationsToStorage = (updatedList) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_notifications', JSON.stringify(updatedList.slice(0, 60)));
      }
    } catch {}
  };

  const refreshNotifications = React.useCallback(async () => {
    try {
      const freshNotifs = await fetchNotificationsFromSupabase();
      if (Array.isArray(freshNotifs)) {
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const map = new Map();
          
          freshNotifs.forEach(n => {
            if (n && n.id) {
              map.set(n.id, {
                id: n.id,
                title: n.title || 'Notification',
                message: n.message || n.description || '',
                type: n.type || 'info',
                link: n.link || null,
                order_id: n.order_id || n.orderId || null,
                orderId: n.order_id || n.orderId || null,
                recipient_role: n.recipient_role || 'client',
                recipient_email: n.recipient_email || null,
                read: n.read === true || n.is_read === true,
                is_read: n.read === true || n.is_read === true,
                timestamp: n.created_at || n.timestamp || new Date().toISOString(),
                created_at: n.created_at || n.timestamp || new Date().toISOString()
              });
            }
          });

          safePrev.forEach(n => {
            if (n && n.id && !map.has(n.id)) {
              map.set(n.id, n);
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => {
            const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
            const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
            return timeB - timeA;
          });

          saveNotificationsToStorage(merged);
          return merged;
        });
      }
    } catch (err) {
      console.warn('refreshNotifications notice:', err);
    }
  }, []);

  const addNotification = (notif, syncToBackend = true) => {
    if (!notif) return;
    const nowIso = new Date().toISOString();
    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: notif.timestamp || notif.created_at || nowIso,
      created_at: notif.created_at || notif.timestamp || nowIso,
      read: notif.read || notif.is_read || false,
      is_read: notif.read || notif.is_read || false,
      title: notif.title || 'Notification',
      message: notif.message || notif.description || '',
      type: notif.type || 'info',
      link: notif.link || null,
      order_id: notif.order_id || notif.orderId || null,
      orderId: notif.order_id || notif.orderId || null,
      recipient_role: notif.recipient_role || notif.recipientRole || 'client',
      recipient_email: notif.recipient_email || notif.recipientEmail || null,
      ...notif
    };
    
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const filtered = safePrev.filter(n => n.id !== newNotif.id);
      const nextList = [newNotif, ...filtered];
      saveNotificationsToStorage(nextList);
      return nextList;
    });

    try {
      playNotificationSound(notif.soundType || 'notification');
    } catch {}

    if (notif.showToast !== false && notif.title) {
      showToast(`${notif.title}${notif.message ? `: ${notif.message}` : ''}`, notif.type || 'info');
    }

    if (syncToBackend && isSupabaseConfigured) {
      createNotificationInSupabase(newNotif).catch(() => {});
      broadcastLiveNotification(newNotif);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const nextList = safePrev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n);
      saveNotificationsToStorage(nextList);
      return nextList;
    });
    if (isSupabaseConfigured) {
      markNotificationAsReadInSupabase(id).catch(() => {});
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const nextList = safePrev.map(n => ({ ...n, read: true, is_read: true }));
      saveNotificationsToStorage(nextList);
      return nextList;
    });
    if (isSupabaseConfigured) {
      markAllNotificationsAsReadInSupabase().catch(() => {});
    }
  };

  const openOrderTrackerDrawer = (orderOrId) => {
    if (!orderOrId) return;
    if (typeof orderOrId === 'object' && (orderOrId.id || orderOrId.title)) {
      setSelectedOrderForDrawer(orderOrId);
      return;
    }
    const cleanId = String(orderOrId).trim().replace(/^#+/, '');
    const found = orders.find(o => {
      const oClean = String(o.id || '').trim().replace(/^#+/, '');
      return oClean === cleanId || o.id === orderOrId || o.id === `#${cleanId}`;
    });
    if (found) {
      setSelectedOrderForDrawer(found);
    } else {
      setSelectedOrderForDrawer({ id: `#${cleanId}`, title: `Order #${cleanId}`, status: 'in_progress' });
    }
  };

  const unreadNotificationsCount = Array.isArray(notifications) ? notifications.filter(n => !n.read && !n.is_read).length : 0;

  // Global Chat Unread Counter (Synced across customer and admin for Inbox badge)
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChatCount = React.useCallback(async () => {
    try {
      const userEmail = authUser?.email || '';
      const convs = await fetchConversations(userEmail);
      if (Array.isArray(convs)) {
        let currentRole = 'customer';
        try {
          const saved = localStorage.getItem('bdigi_auth_user');
          if (saved) currentRole = JSON.parse(saved).role || 'customer';
        } catch {}

        let total = 0;
        if (currentRole === 'admin') {
          total = convs.reduce((sum, c) => sum + (c.adminUnreadCount ?? c.unreadCount ?? 0), 0);
        } else {
          total = convs.reduce((sum, c) => sum + (c.clientUnreadCount ?? 0), 0);
        }
        setUnreadChatCount(total);
      }
    } catch (err) {
      console.warn('Refresh unread count notice:', err);
    }
  }, [authUser]);

  // Global Realtime Listeners for Notifications & Messages
  useEffect(() => {
    if (!isAuthenticated && !authUser) {
      setUnreadChatCount(0);
      return;
    }
    refreshUnreadChatCount();
    refreshNotifications();

    const userEmail = authUser?.email || '';
    const isAdminUser = authUser?.role === 'admin';

    // 1. Cross-tab Notification Read Synchronization
    const handleNotifReadUpdate = (e) => {
      const { id, all } = e.detail || {};
      setNotifications(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        let updated;
        if (all) {
          updated = safePrev.map(n => ({ ...n, read: true, is_read: true }));
        } else if (id) {
          updated = safePrev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n);
        } else {
          updated = safePrev;
        }
        saveNotificationsToStorage(updated);
        return updated;
      });
    };

    window.addEventListener('bdigi_notif_read_update', handleNotifReadUpdate);

    let notifBc = null;
    try {
      notifBc = new BroadcastChannel('bdigi_notifs_sync');
      notifBc.onmessage = (msg) => {
        if (msg.data?.type === 'mark_all_read') {
          handleNotifReadUpdate({ detail: { all: true } });
        } else if (msg.data?.type === 'mark_read') {
          handleNotifReadUpdate({ detail: { id: msg.data.id } });
        }
      };
    } catch {}

    // 2. Global Live Notifications Listener
    const unsubNotifs = subscribeToNotifications({
      userEmail,
      isAdmin: isAdminUser,
      onNewNotification: (notif) => {
        if (!notif) return;
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          if (safePrev.some(n => n.id === notif.id)) return safePrev;

          const item = {
            id: notif.id || `notif-${Date.now()}`,
            title: notif.title || 'System Notification',
            message: notif.message || notif.description || '',
            type: notif.type || 'info',
            link: notif.link || null,
            order_id: notif.order_id || notif.orderId || null,
            orderId: notif.order_id || notif.orderId || null,
            read: notif.read === true || notif.is_read === true,
            is_read: notif.read === true || notif.is_read === true,
            timestamp: notif.created_at || notif.timestamp || new Date().toISOString(),
            created_at: notif.created_at || notif.timestamp || new Date().toISOString()
          };

          const nextList = [item, ...safePrev];
          saveNotificationsToStorage(nextList);
          return nextList;
        });

        try {
          playNotificationSound('notification');
        } catch {}

        if (notif.title) {
          showToast(`${notif.title}${notif.message ? `: ${notif.message}` : ''}`, notif.type || 'info');
        }
      },
      onNotificationUpdate: (notif) => {
        if (!notif) return;
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(n => n.id === notif.id ? { ...n, ...notif, read: notif.read === true || notif.is_read === true, is_read: notif.read === true || notif.is_read === true } : n);
          saveNotificationsToStorage(updated);
          return updated;
        });
      }
    });

    // 3. Live Chat Messages & Unread Counter Listener
    const handleReadUpdate = () => {
      refreshUnreadChatCount();
    };

    window.addEventListener('bdigi_read_update', handleReadUpdate);
    const unsubMessages = subscribeToLiveMessages((msgPayload) => {
      refreshUnreadChatCount();
      if (msgPayload && (msgPayload.new || msgPayload.record)) {
        const msg = msgPayload.new || msgPayload.record;
        let currentRole = 'customer';
        try {
          const saved = localStorage.getItem('bdigi_auth_user');
          if (saved) currentRole = JSON.parse(saved).role || 'customer';
        } catch {}
        
        if (msg.sender === 'client' && currentRole === 'admin') {
          playNotificationSound('chat');
          showToast(`💬 New message from ${msg.sender_name || 'Client'}`, 'info');
        } else if ((msg.sender === 'admin' || msg.sender === 'digitizer') && currentRole !== 'admin') {
          playNotificationSound('chat');
          showToast(`💬 New message from ${msg.sender_name || 'Studio Support'}`, 'info');
        }
      }
    }, () => {
      refreshUnreadChatCount();
    });

    return () => {
      window.removeEventListener('bdigi_notif_read_update', handleNotifReadUpdate);
      window.removeEventListener('bdigi_read_update', handleReadUpdate);
      if (notifBc) {
        try { notifBc.close(); } catch {}
      }
      if (typeof unsubNotifs === 'function') unsubNotifs();
      if (typeof unsubMessages === 'function') unsubMessages();
    };
  }, [isAuthenticated, authUser, refreshUnreadChatCount, refreshNotifications]);

  const showToast = (message, type = 'info', playSound = false) => {
    setToast({ message, type, id: Date.now() });
    if (playSound) {
      try {
        playNotificationSound('notification');
      } catch {}
    }
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Build the app-facing user record from a Supabase session user + role
  const buildAuthUser = (sbUser, role) => {
    const cleanEmail = (sbUser?.email || '').toLowerCase().trim();
    return {
      id: sbUser?.id || `user-${Date.now()}`,
      name: sbUser?.user_metadata?.full_name || sbUser?.user_metadata?.name || cleanEmail.split('@')[0] || 'Verified User',
      email: cleanEmail,
      company: sbUser?.user_metadata?.company || `${cleanEmail.split('@')[0] || 'Valued'} Apparel`,
      role,
      provider: sbUser?.app_metadata?.provider || 'email'
    };
  };

  // Resolve role (admin vs customer) server-side from the admins table with local fallback
  const resolveRole = async (email) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return 'customer';
    if (adminUsers.some(a => (a.email || '').toLowerCase().trim() === cleanEmail)) {
      return 'admin';
    }
    try {
      const res = await verifyAdminSession(cleanEmail);
      return res?.isAdmin ? 'admin' : 'customer';
    } catch {
      return 'customer';
    }
  };

  // Load catalog + admin whitelist + database clients + wallet on mount
  useEffect(() => {
    let cancelled = false;

    // 1. Validate Supabase session IMMEDIATELY in parallel
    const validateImmediateSession = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) setIsAuthInitialized(true);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;
        if (!cancelled && session?.user) {
          const role = await resolveRole(session.user.email);
          const uData = buildAuthUser(session.user, role);
          setAuthUser(uData);
          setIsAuthenticated(true);
          if (role === 'admin') {
            setCurrentView('admin');
            fetchAdminUsers(session.user.email).then(adminList => {
              if (!cancelled && adminList?.length) {
                setAdminUsers(adminList.map(a => ({ email: a.email, name: a.name || a.email })));
              }
            });
          } else {
            setCurrentView('customer');
          }

          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
              localStorage.setItem('bdigi_current_view', role === 'admin' ? 'admin' : 'customer');
            }
          } catch {}

          fetchWalletBalanceFromSupabase(session.user.email).then(balance => {
            if (!cancelled) setWalletBalance(balance);
          });

          fetchOrdersFromSupabase().then(dbOrders => {
            if (!cancelled && dbOrders) setOrders(dbOrders);
          });

          upsertClientInSupabase({ ...uData, role }).catch(() => {});
        } else {
          // If Supabase has no active session, verify if a freshly authenticated user exists locally
          if (!cancelled) {
            let hasValidLocalUser = false;
            try {
              if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('bdigi_auth_user');
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed && parsed.email) {
                    hasValidLocalUser = true;
                  }
                }
              }
            } catch {}

            if (!hasValidLocalUser) {
              setIsAuthenticated(false);
              setAuthUser(null);
              setCurrentView('public');
              setWalletBalance(0);
              try {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('bdigi_auth_user');
                  localStorage.removeItem('bdigi_current_view');
                }
              } catch {}
            }
          }
        }
      } catch (sessErr) {
        console.warn('Session verification notice:', sessErr);
      } finally {
        if (!cancelled) setIsAuthInitialized(true);
      }
    };

    validateImmediateSession();

    const loadInitialData = async () => {
      // 2. Fetch catalog & DB clients if Supabase is configured
      if (isSupabaseConfigured && supabase) {
        try {
          const catalog = await fetchCatalogFromSupabase();
          if (!cancelled && catalog) {
            if (catalog.servicesList) setServicesList(catalog.servicesList);
            if (catalog.pricingCards) setPricingCards(catalog.pricingCards);
            if (catalog.dynamicPricingTiers) setDynamicPricingTiers(catalog.dynamicPricingTiers);
            if (catalog.patchCards) setPatchCards(catalog.patchCards);
            if (catalog.storeProducts) setStoreProducts(catalog.storeProducts);
            if (catalog.portfolioSamples) setPortfolioSamples(catalog.portfolioSamples);
            if (catalog.sewOuts) setSewOuts(catalog.sewOuts);
            if (catalog.heroSlides) setHeroSlides(catalog.heroSlides);
            if (catalog.heroGlobalSettings) setHeroGlobalSettings(catalog.heroGlobalSettings);
            if (catalog.heroServiceText) setHeroServiceText(catalog.heroServiceText);
            if (catalog.digitizers) {
              setDigitizers(prev => prev.map(d => {
                const fresh = catalog.digitizers.find(x => x.id === d.id);
                return fresh ? { ...d, ...fresh } : d;
              }));
            }
            if (catalog.siteSettings) setSiteSettings(catalog.siteSettings);
            if (catalog.pricing) setPricing(catalog.pricing);
            if (catalog.serviceCms) setServiceCmsContent(catalog.serviceCms);
          }

          // Fetch new Home Page CMS
          const hpContent = await fetchHomePageContentFromSupabase();
          if (!cancelled && hpContent) {
            setHomePageConfig(hpContent);
          }

          // Load DB clients from Supabase users table
          const dbClients = await fetchClientsFromSupabase();
          if (!cancelled && dbClients && dbClients.length > 0) {
            setClients(prev => {
              const mergedMap = new Map();
              [...dbClients, ...prev].forEach(c => {
                if (c && c.email) mergedMap.set(c.email.toLowerCase(), c);
              });
              return Array.from(mergedMap.values());
            });
          }

          // Fetch orders from Supabase DB
          const dbOrders = await fetchOrdersFromSupabase();
          if (!cancelled && dbOrders) {
            setOrders(dbOrders);
          }
        } catch (err) {
          console.warn('Initial data load notice:', err);
        }
      }
    };

    loadInitialData();

    // Supabase Realtime: Sync catalog when Admin updates it
    let catalogChannel = null;
    if (isSupabaseConfigured && supabase) {
      catalogChannel = supabase.channel(`catalog-sync-channel-${Date.now()}`);
      
      const tablesToSync = [
        'services', 'pricing_tiers', 'patch_cards', 'store_products', 
        'portfolio_items', 'sew_outs', 'hero_slides', 'digitizers', 'cms_content',
        'faqs', 'testimonials', 'site_config', 'home_page_settings'
      ];
      
      tablesToSync.forEach(table => {
        catalogChannel.on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
          try {
            const catalog = await fetchCatalogFromSupabase();
            if (catalog) {
              if (catalog.servicesList) setServicesList(catalog.servicesList);
              if (catalog.pricingCards) setPricingCards(catalog.pricingCards);
              if (catalog.dynamicPricingTiers) setDynamicPricingTiers(catalog.dynamicPricingTiers);
              if (catalog.patchCards) setPatchCards(catalog.patchCards);
              if (catalog.storeProducts) setStoreProducts(catalog.storeProducts);
              if (catalog.portfolioSamples) setPortfolioSamples(catalog.portfolioSamples);
              if (catalog.sewOuts) setSewOuts(catalog.sewOuts);
              if (catalog.heroSlides) setHeroSlides(catalog.heroSlides);
              if (catalog.heroServiceText) setHeroServiceText(catalog.heroServiceText);
              if (catalog.siteSettings) setSiteSettings(catalog.siteSettings);
              if (catalog.pricing) setPricing(catalog.pricing);
              if (catalog.serviceCms) setServiceCmsContent(catalog.serviceCms);
              if (catalog.testimonials) setTestimonials(catalog.testimonials);
              if (catalog.faqs) setFaqs(catalog.faqs);
              if (catalog.digitizers?.length) {
                setDigitizers(prev => prev.map(d => {
                  const fresh = catalog.digitizers.find(x => x.id === d.id);
                  return fresh ? { ...d, ...fresh } : d;
                }));
              }
            }
          } catch (err) {
            console.warn('Realtime catalog sync error:', err);
          }
        });
      });
      
      catalogChannel.subscribe();
    }

    // Local instant cross-tab sync listeners
    const handleLocalSync = (e) => {
      if (e.detail) {
        setSiteSettings(prev => ({ ...prev, ...e.detail }));
      }
    };
    const handleStorageSync = (e) => {
      if (e.key === 'site_settings_live' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSiteSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('site_settings_updated', handleLocalSync);
      window.addEventListener('storage', handleStorageSync);
    }

    // Supabase Realtime: Unified Live Chat, Notifications & Orders Subscriptions
    let unsubscribeNotifs = null;
    let unsubscribeOrders = null;

    if (isSupabaseConfigured) {
      unsubscribeNotifs = subscribeToNotificationListeners((payload) => {
        const notif = payload.new || payload.record;
        if (!notif) return;

        let currentRole = 'customer';
        let currentUserEmail = '';
        try {
          const savedUser = localStorage.getItem('bdigi_auth_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            currentRole = parsed.role || 'customer';
            currentUserEmail = (parsed.email || '').toLowerCase().trim();
          }
        } catch {}

        const notifRole = notif.recipient_role || notif.recipientRole || 'all';
        const notifEmail = (notif.recipient_email || notif.recipientEmail || '').toLowerCase().trim();

        const isForMe = 
          notifRole === 'all' ||
          (currentRole === 'admin' && notifRole === 'admin') ||
          (currentRole !== 'admin' && (notifRole === 'client' || (notifEmail && notifEmail === currentUserEmail)));

        if (isForMe) {
          addNotification({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type || 'info',
            link: notif.link,
            order_id: notif.order_id || notif.orderId,
            orderId: notif.order_id || notif.orderId,
            timestamp: notif.created_at || notif.timestamp || new Date().toISOString(),
            read: notif.read || false
          }, false);
        }
      });

      unsubscribeOrders = subscribeToOrders(async (payload) => {
        const ord = payload.new || payload.record;
        if (!ord) return;

        // If this is a brand-new order (INSERT), push an admin notification immediately
        if (payload.eventType === 'INSERT' || !payload.eventType) {
          let currentRole = 'customer';
          try {
            const savedUser = localStorage.getItem('bdigi_auth_user');
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              currentRole = parsed.role || 'customer';
            }
          } catch {}

          if (currentRole === 'admin') {
            addNotification({
              id: `notif-ord-${ord.id}-admin`,
              recipient_role: 'admin',
              title: `🚨 New Order: ${ord.title || 'Order'}`,
              message: `Received from ${ord.client_name || 'Client'} (${(ord.client_email || '').toLowerCase()}) — ${ord.service_category || 'Digitizing'}. Price: $${parseFloat(ord.price || 15).toFixed(2)}`,
              type: 'info',
              link: '/admin-portal',
              order_id: ord.id,
              orderId: ord.id,
              read: false,
              timestamp: ord.created_at || new Date().toISOString()
            }, false);
          }
        }

        try {
          const freshOrders = await fetchOrdersFromSupabase();
          if (freshOrders && Array.isArray(freshOrders)) {
            setOrders(freshOrders);
          }
        } catch (err) {
          console.warn('Realtime order update fetch notice:', err);
        }
      });
    }

    let authSubscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;

        try {
          if (event === 'PASSWORD_RECOVERY') {
            setAuthModalMode('update_password');
            setIsAuthModalOpen(true);
            return;
          }

          if (event === 'SIGNED_OUT') {
            setIsAuthenticated(false);
            setAuthUser(null);
            setCurrentView('public');
            setWalletBalance(0);
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('bdigi_auth_user');
                localStorage.removeItem('bdigi_current_view');
              }
            } catch {}
            return;
          }

          if (session?.user) {
            const role = await resolveRole(session.user.email);
            const uData = buildAuthUser(session.user, role);
            setAuthUser(uData);
            setIsAuthenticated(true);
            setIsAuthModalOpen(false);
            setCurrentView(role === 'admin' ? 'admin' : 'customer');
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
                localStorage.setItem('bdigi_current_view', role === 'admin' ? 'admin' : 'customer');
              }
            } catch {}

            const balance = await fetchWalletBalanceFromSupabase(session.user.email);
            if (!cancelled) setWalletBalance(balance);

            fetchOrdersFromSupabase().then(freshOrders => {
              if (!cancelled && freshOrders) setOrders(freshOrders);
            });

            fetchNotificationsFromSupabase().then(freshNotifs => {
              if (!cancelled && Array.isArray(freshNotifs) && freshNotifs.length > 0) {
                setNotifications(prev => {
                  const safePrev = Array.isArray(prev) ? prev : [];
                  const idSet = new Set(safePrev.map(n => n.id));
                  const merged = [...safePrev];
                  for (const fn of freshNotifs) {
                    if (!idSet.has(fn.id)) {
                      merged.push({
                        id: fn.id,
                        title: fn.title,
                        message: fn.message,
                        type: fn.type || 'info',
                        link: fn.link,
                        order_id: fn.order_id,
                        orderId: fn.order_id,
                        timestamp: fn.created_at || fn.timestamp,
                        read: fn.read || false
                      });
                    }
                  }
                  saveNotificationsToStorage(merged);
                  return merged;
                });
              }
            });

            try {
              await upsertClientInSupabase({ ...uData, role });
            } catch (err) {
              console.warn('Client upsert notice:', err);
            }
          }
        } catch (authErr) {
          console.warn('onAuthStateChange exception:', authErr);
        } finally {
          if (!cancelled) setIsAuthInitialized(true);
        }
      });
      authSubscription = authListener?.subscription;
    }

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
      if (typeof unsubscribeNotifs === 'function') {
        unsubscribeNotifs();
      }
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
      if (catalogChannel && supabase) {
        supabase.removeChannel(catalogChannel);
      }
    };
  }, []);

  const persistAuth = (uData, view) => {
    setAuthUser(uData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView(view);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
        localStorage.setItem('bdigi_current_view', view);
      }
    } catch {}
  };

  const finishAuth = async (sbUser) => {
    let role = 'customer';
    let balance = 0;
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(sbUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        role = data.role || 'customer';
        balance = data.balance || 0;
      }
    } catch (e) {
      console.warn("Error fetching user data from api");
    }

    const uData = buildAuthUser(sbUser, role);
    persistAuth(uData, role);
    setWalletBalance(balance);
    return { success: true, role, user: uData };
  };

  const login = async (email, password) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    try {
      const sbRes = await signInWithSupabaseAuth(cleanEmail, cleanPass);
      if (sbRes && sbRes.success && sbRes.user) {
        const result = await finishAuth(sbRes.user);
        showToast(`Welcome back ${result.user.name}!`, 'success');
        return result;
      } else {
        return { success: false, error: sbRes?.error || 'Invalid email or password.' };
      }
    } catch (sbErr) {
      return { success: false, error: sbErr?.message || 'Authentication error.' };
    }
  };

  const loginWithGoogle = async (googleUserOrToken) => {
    showToast('Connecting to Google...', 'info');
    if (googleUserOrToken && typeof googleUserOrToken === 'object' && googleUserOrToken.email) {
      const result = await finishAuth(googleUserOrToken);
      showToast(`Welcome ${result.user.name || result.user.email}!`, 'success');
      return { success: true, role: result.role, user: result.user };
    }
    if (googleUserOrToken && typeof googleUserOrToken === 'string' && googleUserOrToken.length > 20) {
      const res = await signInWithGoogleIdToken(googleUserOrToken);
      if (!res.success) {
        showToast(res.error || 'Google Sign-In failed.', 'error');
      } else {
        await finishAuth(res.data.user);
      }
      return res;
    } else {
      const res = await promptGoogleIdentitySignIn();
      if (res?.success && res?.data?.user) {
        await finishAuth(res.data.user);
      } else if (!res?.success && res?.error) {
        showToast(res.error || 'Google Sign-In failed.', 'error');
      }
      return res;
    }
  };

  const loginWithApple = async (idToken) => {
    showToast('Authenticating with Apple...', 'info');
    if (idToken && typeof idToken === 'string' && idToken.length > 20) {
      const res = await signInWithAppleIdToken(idToken);
      if (!res.success) {
        showToast(res.error || 'Apple Sign-In failed.', 'error');
      } else {
        await finishAuth(res.data.user);
      }
      return res;
    } else {
      const res = await signInWithAppleOAuth('/client-portal');
      if (!res.success) {
        showToast(res.error || 'Apple Sign-In failed.', 'error');
      }
      return res;
    }
  };

  const register = async (name, email, password, company) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (company || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, error: 'Please fill in your name, email, and password.' };
    }

    try {
      const sbRes = await signUpWithSupabaseAuth(cleanName, cleanEmail, cleanPass, cleanCompany);
      if (sbRes && sbRes.success) {
        showToast(`Account registered successfully! Welcome ${cleanName}.`, 'success');
        const result = await finishAuth(sbRes.user);
        return { success: true, role: 'customer', user: result.user };
      } else {
        return { success: false, error: sbRes?.error || 'Registration failed.' };
      }
    } catch (err) {
      return { success: false, error: err?.message || 'Registration exception.' };
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    setCurrentView('public');
    setWalletBalance(0);

    try {
      sessionStorage.clear();
      localStorage.removeItem('bdigi_auth_user');
      localStorage.removeItem('bdigi_current_view');
    } catch (e) {
      console.warn('Storage clearance notice:', e);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }

    showToast('You have been logged out safely.', 'info');
  };

  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return { success: false, error: 'Please enter a valid email address.' };

    try {
      const res = await sendPasswordResetEmail(cleanEmail);
      if (res && !res.success) return res;
    } catch (err) {
      return { success: false, error: err.message || 'Failed to dispatch reset email.' };
    }

    showToast(`Password reset link dispatched to ${cleanEmail}`, 'info');
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const res = await updateUserPassword(newPassword);
      if (res && !res.success) return res;
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }

    showToast('Password updated successfully! Please sign in with your new password.', 'success');
    setAuthModalMode('login');
    return { success: true };
  };

  const protectedNavigate = (targetView, triggerOrderWizard = false, initialData = null) => {
    const isAuthed = isAuthenticated || Boolean(authUser?.email);

    if (targetView === 'public') {
      setCurrentView('public');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return;
    }

    if (targetView === 'customer') {
      if (isAuthed) {
        setCurrentView('customer');
        if (triggerOrderWizard) {
          openOrderWizard(initialData);
        } else if (typeof window !== 'undefined') {
          if (!window.location.pathname.includes('client-portal') && !window.location.pathname.includes('client')) {
            window.location.href = '/client-portal';
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      } else {
        setAuthModalTarget('customer');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        showToast('Please log in to access the Client Portal', 'warning');
      }
      return;
    }

    if (targetView === 'admin') {
      if (isAuthed && authUser?.role === 'admin') {
        setCurrentView('admin');
        if (typeof window !== 'undefined') {
          if (!window.location.pathname.includes('admin-portal') && !window.location.pathname.includes('admin')) {
            window.location.href = '/admin-portal';
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      } else {
        showToast('Access Restricted to Studio Admin.', 'warning');
        setAuthModalTarget('admin');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      }
    }
  };

  // Helper to trigger email notifications
  const triggerEmailNotification = async (type, orderObj = {}) => {
    try {
      const headers = await getAuthHeaders();
      await fetch('/api/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          orderId: orderObj.id || orderObj.orderId,
          clientEmail: orderObj.clientEmail || orderObj.client_email,
          clientName: orderObj.clientName || orderObj.client_name,
          serviceName: orderObj.serviceType || orderObj.service_type || orderObj.title,
          amount: orderObj.price || orderObj.amount || orderObj.total,
          revisionNotes: orderObj.revisionNotes,
          messageText: orderObj.messageText,
          senderName: orderObj.senderName,
          recipientEmail: orderObj.recipientEmail
        })
      });
    } catch (err) {
      console.warn('Failed to trigger email notification:', err);
    }
  };

  // Order Operations connected to Supabase DB
  const createOrder = async (newOrderData) => {
    const localId = newOrderData.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
    const isAlreadyPaid = String(newOrderData.payment_status || newOrderData.paymentStatus || '').toLowerCase() === 'paid';
    
    const fullOrderPayload = {
      id: localId,
      ...newOrderData,
      clientName: newOrderData.clientName || authUser?.company || authUser?.name || 'Valued Client',
      clientEmail: (newOrderData.clientEmail || authUser?.email || '').toLowerCase().trim(),
      clientId: newOrderData.clientId || authUser?.id || authUser?.email || '',
      createdAt: new Date().toISOString(),
      status: newOrderData.status || (isAlreadyPaid ? 'in_progress' : 'awaiting_payment'),
      payment_status: isAlreadyPaid ? 'paid' : (newOrderData.payment_status || newOrderData.paymentStatus || 'pending'),
      paymentStatus: isAlreadyPaid ? 'paid' : (newOrderData.payment_status || newOrderData.paymentStatus || 'pending'),
      history: [{ timestamp: new Date().toISOString(), label: isAlreadyPaid ? 'Order Submitted & Paid with Studio Wallet' : 'Order Submitted — Awaiting Payment' }],
      revisions: []
    };

    if (isSupabaseConfigured) {
      try {
        await createOrderInSupabase(fullOrderPayload);
        setOrders(prev => [fullOrderPayload, ...prev]);
        showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
        // Client notification (for customer's own bell & mobile notification drawer)
        addNotification({
          id: `ord-created-${localId}`,
          title: `🎉 Order ${formatOrderId(localId)} Placed!`,
          message: isAlreadyPaid 
            ? `Your digitizing order has been created and production has started.`
            : `Order created. Waiting for payment of $${parseFloat(fullOrderPayload.totalPrice || fullOrderPayload.price || 15).toFixed(2)} to start production.`,
          type: isAlreadyPaid ? 'success' : 'warning',
          link: '/client-portal',
          order_id: localId,
          orderId: localId,
          recipient_role: 'client',
          recipient_email: (fullOrderPayload.clientEmail || '').toLowerCase().trim()
        });
        // Broadcast admin notification in real-time so admin portal gets it immediately
        const adminNotif = {
          id: `notif-ord-${localId}-admin`,
          recipient_role: 'admin',
          recipient_email: null,
          title: `🚨 New Order: ${fullOrderPayload.title || 'Order'}`,
          message: `Received from ${fullOrderPayload.clientName || 'Client'} (${(fullOrderPayload.clientEmail || '').toLowerCase()}) — ${fullOrderPayload.serviceCategory || 'Embroidery Digitizing'}. Price: $${parseFloat(fullOrderPayload.price || 15).toFixed(2)}`,
          type: 'info',
          link: '/admin-portal',
          order_id: localId,
          orderId: localId,
          read: false,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        broadcastLiveNotification(adminNotif);
        triggerEmailNotification('NEW_ORDER', fullOrderPayload);

        // Log Purchase Tracking Event with exact customer name and email
        try {
          const custIdentity = fullOrderPayload.clientEmail
            ? `${fullOrderPayload.clientName || 'Customer'} (${fullOrderPayload.clientEmail})`
            : (authUser?.email ? `${authUser.name || 'Customer'} (${authUser.email})` : 'Customer');
          
          const orderAmount = parseFloat(fullOrderPayload.price || 15);
          const { logTrackingEventToSupabase } = await import('../services/supabaseService');
          logTrackingEventToSupabase({
            eventName: 'Purchase',
            userRole: custIdentity,
            source: 'Visitor browser',
            trafficSource: (typeof window !== 'undefined' ? window.location.hostname : 'Direct') || 'Direct',
            value: `$${orderAmount.toFixed(2)}`,
            pagePath: '/order'
          });
        } catch {}

        return fullOrderPayload;
      } catch (sbErr) {
        console.warn('Supabase create order notice:', sbErr);
      }
    }

    setOrders(prev => [fullOrderPayload, ...prev]);
    showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
    addNotification({
      id: `ord-created-${localId}`,
      title: `🎉 Order ${formatOrderId(localId)} Placed!`,
      message: isAlreadyPaid 
        ? `Your digitizing order has been created and production has started.`
        : `Order created. Waiting for payment of $${parseFloat(fullOrderPayload.totalPrice || fullOrderPayload.price || 15).toFixed(2)} to start production.`,
      type: isAlreadyPaid ? 'success' : 'warning',
      link: '/client-portal',
      order_id: localId,
      orderId: localId,
      recipient_role: 'client',
      recipient_email: (fullOrderPayload.clientEmail || '').toLowerCase().trim()
    });
    triggerEmailNotification('NEW_ORDER', fullOrderPayload);
    return fullOrderPayload;
  };

  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    const safeExtraData = typeof extraData === 'string' 
      ? { paymentStatus: extraData, payment_status: extraData } 
      : (extraData || {});

    const cleanTargetId = String(orderId || '').trim().replace(/^#+/, '');
    const targetWithHash = `#${cleanTargetId}`;
    const targetOrder = orders.find(o => {
      const oClean = String(o.id || '').trim().replace(/^#+/, '');
      return oClean === cleanTargetId || o.id === orderId || o.id === targetWithHash;
    });
    
    if (isSupabaseConfigured) {
      try {
        await updateOrderStatusInSupabase(orderId, newStatus, safeExtraData);
      } catch (sbErr) {
        console.warn('Supabase update order status notice:', sbErr);
      }
    }

    setOrders(prev => prev.map(ord => {
      const ordClean = String(ord.id || '').trim().replace(/^#+/, '');
      const isMatch = ordClean === cleanTargetId || ord.id === orderId || ord.id === targetWithHash;
      if (isMatch) {
        const resolvedPayStatus = safeExtraData.paymentStatus || safeExtraData.payment_status || (newStatus === 'in_progress' ? 'paid' : ord.payment_status || ord.paymentStatus);
        const isPaidComputed = resolvedPayStatus === 'paid' || resolvedPayStatus === 'completed' || resolvedPayStatus === 'wallet' || newStatus === 'in_progress';
        return {
          ...ord,
          status: newStatus,
          ...safeExtraData,
          payment_status: isPaidComputed ? 'paid' : resolvedPayStatus,
          paymentStatus: isPaidComputed ? 'paid' : resolvedPayStatus,
          isPaid: isPaidComputed,
          paid_at: isPaidComputed ? (ord.paid_at || new Date().toISOString()) : ord.paid_at,
          history: [...(ord.history || []), { timestamp: new Date().toISOString(), label: `Status updated to ${newStatus}` }]
        };
      }
      return ord;
    }));

    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');

    // In-app Notification + Email trigger based on new status
    if (newStatus === 'delivered') {
      addNotification({
        id: `ord-deliv-${orderId}`,
        title: `📦 Order ${formatOrderId(orderId)} Files Delivered!`,
        message: `Your digitized production files are ready for inspection and download.`,
        type: 'success',
        order_id: orderId,
        orderId: orderId,
        link: `/client-portal?tab=orders&trackOrder=${orderId}`,
        recipient_role: 'client',
        recipient_email: targetOrder?.clientEmail || null
      });
      triggerEmailNotification('ORDER_DELIVERED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
    } else if (newStatus === 'completed') {
      addNotification({
        id: `ord-comp-${orderId}`,
        title: `✅ Order ${formatOrderId(orderId)} Accepted & Completed`,
        message: `Deliverables confirmed and archived in your studio portfolio.`,
        type: 'success',
        order_id: orderId,
        orderId: orderId,
        link: authUser?.role === 'admin' ? `/admin-portal?tab=orders&trackOrder=${orderId}` : `/client-portal?tab=orders&trackOrder=${orderId}`,
        recipient_role: 'client',
        recipient_email: targetOrder?.clientEmail || null
      });
      triggerEmailNotification('ORDER_COMPLETED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
    } else {
      addNotification({
        id: `ord-stat-${orderId}-${newStatus}`,
        title: `🔔 Order ${formatOrderId(orderId)}: ${newStatus.toUpperCase()}`,
        message: `Order status is now updated to ${newStatus.toUpperCase()}.`,
        type: 'info',
        order_id: orderId,
        orderId: orderId,
        link: authUser?.role === 'admin' ? `/admin-portal?tab=orders&trackOrder=${orderId}` : `/client-portal?tab=orders&trackOrder=${orderId}`,
        recipient_role: authUser?.role === 'admin' ? 'client' : 'admin',
        recipient_email: targetOrder?.clientEmail || null
      });
    }
  };

  const assignDigitizer = async (orderId, digitizerId) => {
    await updateOrderStatus(orderId, 'assigned', { digitizerId });
  };

  const completeOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order && !validateStatusTransition(order.status, ORDER_STATUSES.COMPLETED)) {
      showToast(`Cannot complete order — current status is '${order.status}'. Order must be in 'delivered' status first.`, 'error');
      return;
    }
    await updateOrderStatus(orderId, ORDER_STATUSES.COMPLETED);
  };

  const addRevisionRequest = async (orderId, revisionNote) => {
    const nowIso = new Date().toISOString();

    // Call the Orders API requestRevision — sets status='revision', inserts revision row, fires dual notifications
    if (isSupabaseConfigured) {
      try {
        const headers = await getAuthHeaders().catch(() => ({ 'Content-Type': 'application/json' }));
        await fetch('/api/orders', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'requestRevision',
            payload: { orderId, instructions: revisionNote }
          })
        });
      } catch (sbErr) {
        // Fallback: direct Supabase update
        try {
          await addRevisionInSupabase(orderId, revisionNote, authUser?.name || 'Client');
          await updateOrderStatusInSupabase(orderId, 'revision');
        } catch (fbErr) {
          console.warn('Supabase add revision fallback notice:', fbErr);
        }
      }
    }

    // Immediately update local UI state
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'revision',
          updated_at: nowIso,
          revisions: [{ id: `rev-${Date.now()}`, notes: revisionNote, requestedBy: authUser?.name || 'Client', createdAt: nowIso }, ...(ord.revisions || [])],
          history: [{ timestamp: nowIso, label: `Revision Requested: "${(revisionNote || '').slice(0, 35)}..."` }, ...(ord.history || [])]
        };
      }
      return ord;
    }));

    showToast(`Modification request sent for Order ${formatOrderId(orderId)}`, 'info');
    addNotification({
      id: `rev-${orderId}-${Date.now()}`,
      title: `🔄 Modification Request Submitted`,
      message: revisionNote ? `"${revisionNote.slice(0, 60)}"` : 'Your modification request has been sent to the digitizer team.',
      type: 'info',
      order_id: orderId,
      orderId: orderId,
      link: `/client-portal?tab=orders&trackOrder=${orderId}`,
      showToast: false
    });

    const targetOrder = orders.find(o => o.id === orderId);
    triggerEmailNotification('ORDER_REVISION', { 
      id: orderId, 
      clientEmail: targetOrder?.clientEmail || authUser?.email,
      revisionNotes: revisionNote 
    });
  };


  const addOrderMessage = async (orderId, text, senderName, senderRole = 'admin', attachments = []) => {
    if (!text && (!attachments || attachments.length === 0)) return;

    let persisted = null;
    if (isSupabaseConfigured) {
      try {
        persisted = await addOrderMessageInSupabase(orderId, text, senderName, senderRole, attachments);
      } catch (err) {
        console.warn('Supabase add order message notice:', err);
      }
    }

    const msgObj = persisted || {
      id: `msg-${Date.now()}`,
      sender: senderName || (senderRole === 'admin' ? 'Master Admin' : 'Client'),
      senderRole,
      text: text || '',
      attachments: attachments || [],
      timestamp: new Date().toISOString()
    };

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const updatedMsgs = [...(ord.messages || []), msgObj];
        return {
          ...ord,
          messages: updatedMsgs,
          updatedAt: new Date().toISOString(),
          history: [{ timestamp: new Date().toISOString(), label: `Message posted by ${msgObj.sender}` }, ...ord.history]
        };
      }
      return ord;
    }));

    // Trigger email alert for new message
    const targetOrder = orders.find(o => o.id === orderId);
    triggerEmailNotification('NEW_MESSAGE', {
      orderId,
      clientEmail: targetOrder?.clientEmail,
      messageText: text,
      senderName: senderName || (senderRole === 'admin' ? 'Studio Support' : 'Client')
    });
  };

  const cancelOrder = async (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    await cancelOrderInSupabase(orderId);
    showToast(`Order ${formatOrderId(orderId)} marked as CANCELLED`, 'warning');
  };

  const deleteOrder = async (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    await deleteOrderInSupabase(orderId);
    showToast(`Order ${formatOrderId(orderId)} DELETED`, 'error');
  };

  const depositFunds = async (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;

    const res = await depositWalletViaApi(num);
    if (res.success) {
      setWalletBalance(res.balance);
      showToast(`Successfully deposited $${num.toFixed(2)} to studio wallet!`, 'success');
      return true;
    }
    showToast(res.error || 'Wallet deposit failed.', 'error');
    return false;
  };

  const fetchUserWalletBalance = async (email = authUser?.email) => {
    if (!email) return 0;
    try {
      const balance = await fetchWalletBalanceFromSupabase(email);
      setWalletBalance(balance);
      return balance;
    } catch {
      return 0;
    }
  };

  const refreshOrders = async () => {
    try {
      const freshOrders = await fetchOrdersFromSupabase();
      if (freshOrders && Array.isArray(freshOrders)) {
        setOrders(freshOrders);
        return freshOrders;
      }
    } catch {}
    return [];
  };

  const deductWalletBalance = async (amount, orderId = null) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || walletBalance < num) return false;

    const res = await deductWalletViaApi(num, 'Studio Wallet Credit', orderId);
    if (res.success) {
      setWalletBalance(res.balance);

      // The wallet API already sets payment_status='paid' and status='in_progress' in the DB.
      // We update local state immediately without a second API call to avoid race conditions / overwrites.
      if (orderId) {
        const cleanOrdId = String(orderId).trim().replace(/^#+/, '');
        const withHash = `#${cleanOrdId}`;
        setOrders(prev => prev.map(ord => {
          const ordClean = String(ord.id || '').trim().replace(/^#+/, '');
          const isMatch = ordClean === cleanOrdId || ord.id === orderId || ord.id === withHash;
          if (isMatch) {
            return {
              ...ord,
              status: 'in_progress',
              payment_status: 'paid',
              paymentStatus: 'paid',
              isPaid: true,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return ord;
        }));
      }

      // Refresh from DB for full sync (after slight delay to ensure DB write settled)
      setTimeout(async () => {
        await refreshOrders();
        if (authUser?.email) {
          await fetchUserWalletBalance(authUser.email);
        }
      }, 800);

      return true;
    }
    showToast(res.error || 'Wallet payment failed.', 'error');
    return false;
  };


  const openOrderWizard = (initialData = null) => {
    if (initialData !== undefined && initialData !== null) {
      setOrderWizardInitialData(initialData);
    }
    setIsOrderWizardOpen(true);
  };

  const openStoreOrderModal = (item) => {
    if (!isAuthenticated && !authUser) {
      setAuthModalTarget('customer');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to place an order.', 'info');
      return;
    }
    setSelectedStoreItem(item);
    setIsStoreOrderModalOpen(true);
  };

  const updatePricing = (newPricing) => {
    setPricing(newPricing);
    saveCmsConfigToSupabase('pricing', newPricing);
  };

  const updatePricingCards = (newCards) => {
    setPricingCards(newCards);
    upsertCatalogDataToSupabase('pricing_tiers', newCards);
  };

  const updatePatchCards = (newCards) => {
    setPatchCards(newCards);
    upsertCatalogDataToSupabase('patch_cards', newCards);
  };

  const updateStoreProducts = (newProducts) => {
    setStoreProducts(newProducts);
    upsertCatalogDataToSupabase('store_products', newProducts);
  };

  const updatePortfolioSamples = (newPortfolio) => {
    setPortfolioSamples(newPortfolio);
    upsertCatalogDataToSupabase('portfolio_items', newPortfolio);
  };

  const updateSewOuts = (newSewOuts) => {
    setSewOuts(newSewOuts);
    upsertCatalogDataToSupabase('sew_outs', newSewOuts);
  };

  const updateServicesList = (newServices) => {
    setServicesList(newServices);
    upsertCatalogDataToSupabase('services', newServices);
  };

  const updateHeroSlides = async (newSlides) => {
    setHeroSlides(newSlides);
    const res = await saveHeroServiceViaApi(null, newSlides);
    if (!res || !res.success) {
      await saveCmsConfigToSupabase('hero_slides', newSlides);
      await upsertCatalogDataToSupabase('hero_slides', newSlides);
    }
    return res;
  };



  const updateHeroServiceText = (newData) => {
    setHeroServiceText(newData);
    saveCmsConfigToSupabase('hero_service_text', newData);
    showToast('Hero section text updated successfully!', 'success');
  };

  const updateSiteSettings = async (newSettings) => {
    setSiteSettings(prev => {
      const merged = {
        ...prev,
        ...newSettings,
        promotions: newSettings?.promotions || prev?.promotions || [],
        announcement: {
          ...(prev?.announcement || {}),
          ...(newSettings?.announcement || {})
        },
        promotionalBanner: {
          ...(prev?.promotionalBanner || {}),
          ...(newSettings?.promotionalBanner || {})
        },
        promoCodes: newSettings?.promoCodes || prev?.promoCodes || []
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('site_settings_live', JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('site_settings_updated', { detail: merged }));
          window.dispatchEvent(new CustomEvent('bdigi_promotions_sync', { detail: merged }));
          if ('BroadcastChannel' in window) {
            const promoBc = new BroadcastChannel('bdigi_promotions_sync');
            promoBc.postMessage(merged);
            promoBc.close();
          }
        } catch (e) {}
      }

      return merged;
    });

    await saveCmsConfigToSupabase('site_settings', newSettings);
    if (newSettings.promotions) {
      await saveCmsConfigToSupabase('promotions', newSettings.promotions);
    }
    if (newSettings.announcement) {
      await saveCmsConfigToSupabase('announcement', newSettings.announcement);
    }
    if (newSettings.promotionalBanner) {
      await saveCmsConfigToSupabase('promotionalBanner', newSettings.promotionalBanner);
    }
    if (newSettings.promoCodes) {
      await saveCmsConfigToSupabase('promoCodes', newSettings.promoCodes);
    }
  };

  const saveCmsData = (key, value) => {
    if (key === 'testimonials') setTestimonials(value);
    if (key === 'faqs') setFaqs(value);
    saveCmsConfigToSupabase(key, value);
  };

  const updateServiceCmsContent = (serviceKey, sectionKey, updatedData) => {
    setServiceCmsContent(prev => {
      const nextState = {
        ...prev,
        [serviceKey]: {
          ...prev[serviceKey],
          [sectionKey]: {
            ...prev[serviceKey]?.[sectionKey],
            ...updatedData
          }
        }
      };
      saveCmsConfigToSupabase('service_cms', nextState);
      return nextState;
    });
    showToast(`Updated CMS content for ${serviceKey.toUpperCase()} - ${sectionKey.toUpperCase()}`, 'success');
  };

  // Reload catalog + admin data from the database (no localStorage demo seeding)
  const resetAllData = async () => {
    try {
      const catalog = await fetchCatalogFromSupabase();
      if (catalog) {
        if (catalog.servicesList) setServicesList(catalog.servicesList);
        if (catalog.pricingCards) setPricingCards(catalog.pricingCards);
        if (catalog.dynamicPricingTiers) setDynamicPricingTiers(catalog.dynamicPricingTiers);
        if (catalog.patchCards) setPatchCards(catalog.patchCards);
        if (catalog.storeProducts) setStoreProducts(catalog.storeProducts);
        if (catalog.portfolioSamples) setPortfolioSamples(catalog.portfolioSamples);
        if (catalog.sewOuts) setSewOuts(catalog.sewOuts);
        if (catalog.heroSlides) setHeroSlides(catalog.heroSlides);
        if (catalog.heroServiceText) setHeroServiceText(catalog.heroServiceText);

        if (catalog.digitizers?.length) {
          const merged = digitizers.map(d => {
            const fresh = catalog.digitizers.find(x => x.id === d.id);
            return fresh ? { ...d, ...fresh } : d;
          });
          setDigitizers(merged);
        }
        if (catalog.siteSettings) setSiteSettings(catalog.siteSettings);
        if (catalog.pricing) setPricing(catalog.pricing);
        if (catalog.serviceCms) setServiceCmsContent(catalog.serviceCms);
        if (catalog.testimonials) setTestimonials(catalog.testimonials);
        if (catalog.faqs) setFaqs(catalog.faqs);
      }

      const adminList = await fetchAdminUsers(authUser?.email);
      if (adminList?.length) {
        setAdminUsers(adminList.map(a => ({ email: a.email, name: a.name || a.email })));
      }

      showToast('Catalog refreshed from the live database.', 'success');
      return { success: true };
    } catch (err) {
      showToast('Failed to refresh catalog from the database.', 'error');
      return { success: false, error: err.message };
    }
  };

  const addAdminUser = async (name, email, password = null) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanName || !cleanEmail) {
      showToast('Please enter full name and email for new admin.', 'error');
      return { success: false, error: 'Missing required fields' };
    }

    if (!authUser?.email) {
      showToast('You must be signed in as an admin to add admins.', 'error');
      return { success: false, error: 'Not authenticated as admin.' };
    }

    const res = await addAdminUserInSupabase(cleanName, cleanEmail, password, authUser.email);
    if (res.success) {
      setAdminUsers(prev =>
        prev.some(a => (a.email || '').toLowerCase().trim() === cleanEmail)
          ? prev
          : [...prev, { email: cleanEmail, name: cleanName }]
      );
      showToast(`Administrator account for ${cleanName} (${cleanEmail}) created successfully!`, 'success');
      return { success: true };
    }
    showToast(res.error || 'Failed to create admin.', 'error');
    return { success: false, error: res.error };
  };

  const resetAdminPassword = async (email, newPassword) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      showToast('Email is required for password reset.', 'error');
      return { success: false, error: 'Missing email' };
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return { success: false, error: 'Password too short' };
    }

    const res = await resetAdminPasswordInSupabase(cleanEmail, newPassword, authUser?.email);
    if (res.success) {
      showToast(`Password for ${cleanEmail} reset successfully!`, 'success');
      return { success: true };
    }
    showToast(res.error || 'Failed to reset password.', 'error');
    return { success: false, error: res.error };
  };

  const fetchHomePageContent = async () => {
    try {
      const data = await fetchHomePageContentFromSupabase();
      if (data) setHomePageConfig(data);
      return data;
    } catch (err) {
      console.error('Error fetching home page content:', err);
      return null;
    }
  };

  const updateHomePageConfigSettings = async (newSettingsObject) => {
    // Optimistic UI update
    setHomePageConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettingsObject }
    }));
    
    // Transform into payload array for the API: [{key: '...', value: '...'}, ...]
    const payloadArray = Object.keys(newSettingsObject).map(k => ({
      key: k,
      value: newSettingsObject[k]
    }));
    
    const res = await updateHomePageSettingsInSupabase(payloadArray);
    if (res.success) {
      showToast('Service banners updated successfully!', 'success');
    } else {
      showToast('Failed to save service banners to database.', 'error');
    }
  };

  return (
    <StateContext.Provider value={{
      currentView, setCurrentView,
      isAuthenticated, setIsAuthenticated,
      isAuthInitialized,
      authUser, currentUser: authUser, setAuthUser,
      login, loginWithGoogle, loginWithApple, register, logout, protectedNavigate,
      requestPasswordReset, updatePassword,
      isAuthModalOpen, setIsAuthModalOpen,
      authModalMode, setAuthModalMode,
      authModalTarget, setAuthModalTarget,
      activeAdminTab, setActiveAdminTab,
      activeCustomerTab, setActiveCustomerTab,
      isCheckoutModalOpen, setIsCheckoutModalOpen,
      checkoutSession, setCheckoutSession,
      orders, setOrders,
      clients, setClients,
      pricing, setPricing, updatePricing,
      pricingCards, setPricingCards, updatePricingCards,
      dynamicPricingTiers, setDynamicPricingTiers,
      patchCards, setPatchCards, updatePatchCards,
      storeProducts, setStoreProducts,
      portfolioSamples, setPortfolioSamples, updatePortfolioSamples,
      sewOuts, setSewOuts, updateSewOuts,
      servicesList, setServicesList, updateServicesList,
      heroSlides, setHeroSlides, updateHeroSlides,
      heroGlobalSettings, setHeroGlobalSettings,
      heroServiceText, setHeroServiceText, updateHeroServiceText,
      homePageConfig, setHomePageConfig, fetchHomePageContent, updateHomePageConfigSettings,
      digitizers, setDigitizers,
      siteSettings, setSiteSettings, updateSiteSettings,
      adminUsers, setAdminUsers, addAdminUser, resetAdminPassword,
      activeHomeServiceTab, setActiveHomeServiceTab,
      serviceCmsContent, setServiceCmsContent, updateServiceCmsContent,
      testimonials, setTestimonials,
      faqs, setFaqs,
      saveCmsData,
      resetAllData,
      isOrderWizardOpen, setIsOrderWizardOpen,
      orderWizardInitialData, openOrderWizard,
      isStoreOrderModalOpen, setIsStoreOrderModalOpen,
      selectedStoreItem, setSelectedStoreItem, openStoreOrderModal,
      selectedOrderForDrawer, setSelectedOrderForDrawer, openOrderTrackerDrawer,
      isPricingSettingsOpen, setIsPricingSettingsOpen,
      walletBalance, setWalletBalance,
      isDepositModalOpen, setIsDepositModalOpen,
      depositFunds, deductWalletBalance,
      toast, showToast,
      theme, toggleTheme, setTheme,
      colorTheme, setColorTheme, availableThemes: THEME_PRESETS,
      customBrandColors, setCustomBrandColors,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, unreadNotificationsCount, refreshNotifications,
      unreadChatCount, setUnreadChatCount, refreshUnreadChatCount,
      createOrder, updateOrderStatus, addRevisionRequest, addOrderMessage, cancelOrder,
      completeOrder, deleteOrder, ORDER_STATUSES, assignDigitizer,
      fetchUserWalletBalance, refreshOrders,
      mobileMode, setMobileMode, isStandaloneApp
    }}>
      {children}
    </StateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useAppState must be used within a StateProvider');
  }
  return context;
};
