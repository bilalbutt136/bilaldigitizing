'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import {
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  addRevisionInSupabase,
  upsertClientInSupabase,
  signInWithGoogleIdToken,
  signInWithGoogleOAuth,
  promptGoogleIdentitySignIn,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  sendPasswordResetEmail,
  updateUserPassword,
  saveCmsConfigToSupabase,
  fetchCatalogFromSupabase,
  fetchClientsFromSupabase,
  fetchOrdersFromSupabase,
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
import { trackUserPresence, untrackUserPresence } from '../services/presenceService';

import { 
  playNotificationSound, 
  playCustomerNotificationSound, 
  playAdminNotificationSound, 
  configureAudioNotification, 
  playMessageChime, 
  playMessageChimeForMessage, 
  playCustomerChime, 
  playAdminChime, 
  stopNotificationSound 
} from '../utils/audioNotification';
import { THEME_PRESETS, applyThemePresetToDOM } from '../utils/themePresets';
import { formatOrderId, formatDimensions, formatFabric, formatDesignTitle } from '../utils/formatters';
import { 
  filterAndSanitizeNotifications, 
  isOrderPlacedNotification, 
  isOrderPaymentConfirmedNotification 
} from '../utils/notificationRouter';

export { formatOrderId, formatDimensions, formatFabric, formatDesignTitle };

const StateContext = createContext();


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
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [authUser, setAuthUser] = useState(initialAuth.user);

  // Global Toast Notification State - hoisted early so all callbacks/effects can safely access it
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info', playSound = false) => {
    setToast({ message, type, id: Date.now() });
    if (playSound) {
      try {
        const isAdminUser = authUser?.role === 'admin' || currentView === 'admin';
        if (isAdminUser) {
          playAdminNotificationSound('notification', false, { role: 'admin', isAdmin: true });
        } else {
          playCustomerNotificationSound('chat', false, { role: 'customer', isAdmin: false });
        }
      } catch {}
    }
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
        if (tabParam === 'chat') return 'inbox';
        return tabParam;
      }
      const savedTab = localStorage.getItem('bdigi_customer_tab');
      if (savedTab) {
        if (savedTab === 'chat') return 'inbox';
        return savedTab;
      }
      return 'dashboard';
    }
    return 'dashboard';
  });

  // Strict Session Guard: If an active authenticated session exists, ensure the login modal stays closed
  useEffect(() => {
    const isUserActive = isAuthenticated || Boolean(authUser?.email);
    if (isUserActive && authModalMode !== 'update_password') {
      setIsAuthModalOpen(false);
    }
  }, [isAuthenticated, authUser, authModalMode]);

  const activeAdminTab = activeAdminTabState;
  const setActiveAdminTab = (tab) => {
    setActiveAdminTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_admin_tab', tab);
    }
  };

  const activeCustomerTab = activeCustomerTabState;
  const setActiveCustomerTab = (tab) => {
    const cleanTab = tab === 'chat' ? 'inbox' : tab;
    setActiveCustomerTabState(cleanTab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_customer_tab', cleanTab);
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

    const activePreset = colorTheme || 'studio-orange';

    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_theme', nextTheme);
    }
    applyThemePresetToDOM(activePreset, nextTheme, customBrandColors);
    showToast(nextTheme === 'dark' ? 'Dark Mode enabled 🌙' : 'Light Mode enabled ☀️', 'info');
  };

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(validTheme);

    const activePreset = colorTheme || 'studio-orange';

    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_theme', validTheme);
    }
    applyThemePresetToDOM(activePreset, validTheme, customBrandColors);
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

  // Mobile View Mode: 'app' (standalone PWA/installed app) | 'website' (responsive website for mobile & desktop browsers)
  const getInitialMobileMode = () => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlApp = urlParams.get('app') === 'true' || urlParams.get('mode') === 'app';
        const urlWeb = urlParams.get('web') === 'true' || urlParams.get('mode') === 'web';
        if (urlWeb) return 'website';
        if (urlApp) return 'app';

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                             window.navigator.standalone === true ||
                             (document.referrer && document.referrer.includes('android-app://'));
        if (isStandalone) return 'app';

        // When opened in mobile Chrome, Safari, or any browser, always default to responsive website
        return 'website';
      } catch {}
    }
    return 'website';
  };

  const [mobileMode, setMobileModeState] = useState(getInitialMobileMode);

  const [isStandaloneApp, setIsStandaloneApp] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true ||
               (document.referrer && document.referrer.includes('android-app://'));
      } catch {}
    }
    return false;
  });

  const [mobileActiveTab, setMobileActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam) return tabParam;
        const storedTab = localStorage.getItem('bdigi_mobile_active_tab');
        if (storedTab) return storedTab;
      } catch {}
    }
    return 'home';
  });

  const setMobileTab = useCallback((newTab) => {
    setMobileActiveTab(prev => (prev === newTab ? prev : newTab));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bdigi_mobile_active_tab', newTab);
        const url = new URL(window.location.href);
        const isApp = url.searchParams.get('app') === 'true' || 
                      window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
        if (isApp) {
          url.searchParams.set('app', 'true');
          url.searchParams.delete('web');
          url.searchParams.set('tab', newTab);
          if (newTab === 'home') {
            window.history.replaceState({ app: true, tab: 'home' }, '', url.toString());
          } else {
            window.history.pushState({ app: true, tab: newTab }, '', url.toString());
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true ||
                           (document.referrer && document.referrer.includes('android-app://'));
      setIsStandaloneApp(isStandalone);
      
      const urlParams = new URLSearchParams(window.location.search);
      const urlApp = urlParams.get('app') === 'true' || urlParams.get('mode') === 'app';
      const urlWeb = urlParams.get('web') === 'true' || urlParams.get('mode') === 'web';

      let targetMode = 'website';
      if (urlWeb) {
        targetMode = 'website';
        localStorage.setItem('bdigi_mobile_mode', 'website');
      } else if (urlApp || isStandalone) {
        targetMode = 'app';
        localStorage.setItem('bdigi_mobile_mode', 'app');
      } else {
        // Standard mobile Chrome, Safari, etc. -> always responsive website
        targetMode = 'website';
        localStorage.setItem('bdigi_mobile_mode', 'website');
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
          const url = new URL(window.location.href);
          url.searchParams.delete('web');
          url.searchParams.set('app', 'true');
          window.history.replaceState({ app: true }, '', url.toString());
        } else {
          document.documentElement.classList.remove('mobile-app-active');
          document.documentElement.removeAttribute('data-mobile-mode');
          const url = new URL(window.location.href);
          url.searchParams.delete('app');
          url.searchParams.set('web', 'true');
          window.history.replaceState({ web: true }, '', url.toString());
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

  const readCachedArray = (key) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  };

  // Core Data Arrays (seeded from cached storage immediately, updated live from DB)
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricing, setPricing] = useState({});
  const [pricingCards, setPricingCards] = useState(() => readCachedArray('bdigi_pricing_cards'));
  const [dynamicPricingTiers, setDynamicPricingTiers] = useState(() => readCachedArray('bdigi_dynamic_pricing_tiers'));
  const [portfolioSamples, setPortfolioSamples] = useState(() => readCachedArray('portfolio_samples_live'));
  const [sewOuts, setSewOuts] = useState(() => readCachedArray('bdigi_sew_outs'));
  const [patchCards, setPatchCards] = useState(() => readCachedArray('bdigi_patch_cards'));
  const [storeProducts, setStoreProducts] = useState(() => readCachedArray('bdigi_store_products'));
  const [servicesList, setServicesList] = useState(() => readCachedArray('bdigi_services_list'));
  const [heroSlides, setHeroSlides] = useState(() => readCachedArray('bdigi_hero_slides'));
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
            // Sanitize: eliminate any obsolete brand strings from local storage cache
            if (parsed.studioName && /bilal\s*digitizing/i.test(parsed.studioName)) {
              parsed.studioName = parsed.studioName.replace(/bilal\s*digitizing/gi, 'BDigitizing');
            }
            if (parsed.metaTitle && /bilal\s*digitizing/i.test(parsed.metaTitle)) {
              parsed.metaTitle = parsed.metaTitle.replace(/bilal\s*digitizing/gi, 'BDigitizing');
            }
            if (parsed.invoiceFooterNote && /bilal\s*digitizing/i.test(parsed.invoiceFooterNote)) {
              parsed.invoiceFooterNote = parsed.invoiceFooterNote.replace(/bilal\s*digitizing/gi, 'BDigitizing');
            }
            if (parsed.supportEmail && /bilaldigitizing\.com/i.test(parsed.supportEmail)) {
              parsed.supportEmail = 'support@bdigitizing.com';
            }
            // Sanitize: eliminate any obsolete emerald/green gradient or 20% cached announcement
            if (parsed.announcement) {
              if (parsed.announcement.theme === 'emerald' || (parsed.announcement.bgColor && parsed.announcement.bgColor.includes('065f46'))) {
                parsed.announcement.theme = 'orange';
                parsed.announcement.bgColor = 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)';
              }
            }
            return parsed;
          }
        }
      } catch {}
    }
    return {
      studioName: 'BDigitizing Studio',
      studioTagline: 'Premier Commercial Embroidery Digitizing & Vector Art Lab',
      metaTitle: 'BDigitizing | Premier Commercial Embroidery Digitizing & Vector Art Lab',
      canonicalUrl: 'https://bdigitizing.com',
      supportEmail: 'support@bdigitizing.com',
      invoiceFooterNote: 'Thank you for your business with BDigitizing. For any technical sew-out questions, contact support 24/7.',
      promotions: [
        {
          id: 'promo-sale-granular',
          name: 'SALE',
          type: 'all_orders',
          discountPercent: 20,
          serviceDiscounts: {
            embroidery: 20,
            vector: 10,
            patch: 5
          },
          serviceStatus: {
            embroidery: true,
            vector: true,
            patch: true
          },
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'active',
          maxOrdersLimit: 500,
          ordersCount: 0,
          servicesIncluded: 'Embroidery: 20% | Vector: 10% | Patches: 5%',
          promoCode: 'SAVEPROMO',
          createdAt: new Date().toISOString()
        }
      ],
      service_discounts: {
        embroidery: 20,
        vector: 10,
        patch: 5,
        enabled: true
      },
      serviceDiscounts: {
        embroidery: 20,
        vector: 10,
        patch: 5,
        enabled: true
      },
      announcement: {
        enabled: true,
        badge: 'SALE',
        text: 'Special Studio Promo: 20% OFF Digitizing, 10% OFF Vector, 5% OFF Patches!',
        promoCode: 'SAVEPROMO',
        linkText: 'Claim 20% Off',
        linkUrl: '/order',
        theme: 'orange',
        bgColor: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)',
        textColor: '#ffffff',
        showCodeBadge: true,
        showCountdown: true,
        countdownHours: 24,
        discountValue: 20
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

  const getNotificationStorageKey = (email) => {
    const clean = (email || '').toLowerCase().trim();
    return clean ? `bdigi_notifications_${clean}` : null;
  };

  // Global Order Notification System State with Per-User Persistence & Live Sync
  const [notifications, setNotifications] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedUserStr = localStorage.getItem('bdigi_auth_user');
        if (savedUserStr) {
          const parsedUser = JSON.parse(savedUserStr);
          const email = (parsedUser?.email || '').toLowerCase().trim();
          const role = parsedUser?.role || 'customer';
          const key = getNotificationStorageKey(email);
          if (key) {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              return filterAndSanitizeNotifications(parsed, { currentUserEmail: email, isAdmin: role === 'admin' });
            }
          }
        }
        try { localStorage.removeItem('bdigi_notifications'); } catch {}
      }
    } catch {}
    return [];
  });

  const saveNotificationsToStorage = (updatedList, targetEmail = null) => {
    try {
      if (typeof window !== 'undefined') {
        const email = (targetEmail || authUser?.email || '').toLowerCase().trim();
        const key = getNotificationStorageKey(email);
        if (key) {
          localStorage.setItem(key, JSON.stringify(updatedList.slice(0, 60)));
        }
      }
    } catch {}
  };

  const refreshNotifications = React.useCallback(async (forcedEmail = null, forcedIsAdmin = null) => {
    try {
      const emailToUse = (forcedEmail || authUser?.email || '').toLowerCase().trim();
      const isAdminToUse = forcedIsAdmin !== null ? forcedIsAdmin : (authUser?.role === 'admin' || currentView === 'admin');

      // Unauthenticated sessions should never fetch or show notifications
      if (!emailToUse && !isAdminToUse) {
        setNotifications([]);
        return;
      }

      const freshNotifs = await fetchNotificationsFromSupabase(emailToUse, isAdminToUse);
      if (Array.isArray(freshNotifs)) {
        const sanitized = filterAndSanitizeNotifications(freshNotifs, {
          currentUserEmail: emailToUse,
          isAdmin: isAdminToUse
        });
        setNotifications(sanitized);
        saveNotificationsToStorage(sanitized, emailToUse);
      }
    } catch (err) {
      console.warn('refreshNotifications notice:', err);
    }
  }, [authUser?.email, authUser?.role, currentView]);

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
      const emailToUse = (authUser?.email || newNotif.recipient_email || '').toLowerCase().trim();
      const isAdminToUse = authUser?.role === 'admin' || currentView === 'admin';
      const sanitized = filterAndSanitizeNotifications([newNotif, ...filtered], {
        currentUserEmail: emailToUse,
        isAdmin: isAdminToUse
      });
      saveNotificationsToStorage(sanitized, emailToUse);
      return sanitized;
    });

    if (notif.playSound !== false) {
      try {
        const isForAdmin = newNotif.recipient_role === 'admin' || authUser?.role === 'admin' || currentView === 'admin';
        if (isForAdmin) {
          playAdminNotificationSound(notif.soundType || 'notification', false, { messageId: newNotif.id, role: 'admin', isAdmin: true });
        } else {
          playCustomerNotificationSound(notif.soundType || 'chat', false, { messageId: newNotif.id, role: 'customer', isAdmin: false });
        }
      } catch {}
    }

    if (notif.showToast !== false && notif.title) {
      showToast(`${notif.title}${notif.message ? `: ${notif.message}` : ''}`, notif.type || 'info');
    }

    if (syncToBackend && isSupabaseConfigured) {
      createNotificationInSupabase(newNotif).catch(() => {});
      broadcastLiveNotification(newNotif);
      // Trigger native lock-screen push notification
      if (typeof fetch !== 'undefined') {
        fetch('/api/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newNotif.title,
            message: newNotif.message,
            url: newNotif.link || '/',
            orderId: newNotif.order_id,
            role: newNotif.recipient_role,
            email: newNotif.recipient_email
          })
        }).catch(() => {});
      }
    }
  };

  const markNotificationAsRead = (id) => {
    stopNotificationSound();
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
    stopNotificationSound();
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

  // Unread Orders tracking (Badge clears once customer views Orders tab/screen)
  const [lastOrdersViewedTime, setLastOrdersViewedTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const email = authUser?.email || 'guest';
      const saved = localStorage.getItem(`bdigi_last_orders_viewed_${email}`);
      return saved ? parseInt(saved, 10) || 0 : 0;
    }
    return 0;
  });

  const [unreadOrdersCount, setUnreadOrdersCount] = useState(0);

  const markOrdersAsRead = React.useCallback(() => {
    const now = Date.now();
    setLastOrdersViewedTime(now);
    setUnreadOrdersCount(0);
    if (typeof window !== 'undefined') {
      const email = authUser?.email || 'guest';
      localStorage.setItem(`bdigi_last_orders_viewed_${email}`, String(now));
      window.dispatchEvent(new CustomEvent('bdigi_orders_read_sync', { detail: { time: now } }));
    }
  }, [authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const email = authUser?.email || 'guest';
    const saved = localStorage.getItem(`bdigi_last_orders_viewed_${email}`);
    const viewedTime = saved ? parseInt(saved, 10) || 0 : 0;
    setLastOrdersViewedTime(viewedTime);

    if (!viewedTime) {
      // First session: initialize with 0 unread orders to avoid showing stale badges
      setUnreadOrdersCount(0);
    } else if (Array.isArray(orders)) {
      const unread = orders.filter(o => {
        if (!o) return false;
        const orderTime = o.updated_at ? new Date(o.updated_at).getTime() : (o.created_at ? new Date(o.created_at).getTime() : 0);
        return orderTime > viewedTime;
      }).length;
      setUnreadOrdersCount(unread);
    }
  }, [orders, authUser]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOrdersReadSync = (e) => {
      if (e.detail?.time) {
        setLastOrdersViewedTime(e.detail.time);
        setUnreadOrdersCount(0);
      }
    };
    window.addEventListener('bdigi_orders_read_sync', handleOrdersReadSync);
    return () => window.removeEventListener('bdigi_orders_read_sync', handleOrdersReadSync);
  }, []);

  // Global Realtime Listeners for Notifications
  useEffect(() => {
    if (!isAuthenticated && !authUser) {
      return;
    }
    refreshNotifications();

    const userEmail = authUser?.email || '';
    const isAdminUser = authUser?.role === 'admin';

    // 1. Cross-tab Notification Read Synchronization
    const handleNotifReadUpdate = (e) => {
      const { id, all } = e.detail || {};
      if (all) {
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(n => ({ ...n, read: true, is_read: true }));
          saveNotificationsToStorage(updated);
          return updated;
        });
      } else if (id) {
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(n => n.id === id ? { ...n, read: true, is_read: true } : n);
          saveNotificationsToStorage(updated);
          return updated;
        });
      }
    };

    let notifBc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        notifBc = new BroadcastChannel('bdigi_notifs_sync');
        notifBc.onmessage = (event) => {
          if (event.data?.type === 'mark_all_read') {
            handleNotifReadUpdate({ detail: { all: true } });
          } else if (event.data?.type === 'mark_read') {
            handleNotifReadUpdate({ detail: { id: event.data.id } });
          }
        };
      }
    } catch {}

    window.addEventListener('bdigi_notif_read_update', handleNotifReadUpdate);

    // 2. Realtime Notification Stream (Direct Supabase WebSocket & Postgres replication)
    const unsubNotifs = subscribeToNotifications({
      userEmail,
      isAdmin: isAdminUser,
      onNewNotification: (notif) => {
        if (!notif || !notif.id) return;
        // Item 3: Exclude message notifications (only order placed, delivered, or order-related)
        const notifType = (notif.type || '').toLowerCase();
        const notifTitle = (notif.title || '').toLowerCase();
        if (notifType === 'chat' || notifType === 'message' || notifTitle.includes('new message')) {
          return;
        }
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          if (safePrev.some(n => n.id === notif.id)) return prev;
          const updated = [notif, ...safePrev];
          saveNotificationsToStorage(updated);
          return updated;
        });
        showToast(`🔔 ${notif.title || 'New Notification'}: ${notif.message || ''}`, 'info');
      },
      onNotificationUpdate: (notif) => {
        if (!notif || !notif.id) return;
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const updated = safePrev.map(n => n.id === notif.id ? { ...n, ...notif, read: notif.read === true || notif.is_read === true, is_read: notif.read === true || notif.is_read === true } : n);
          saveNotificationsToStorage(updated);
          return updated;
        });
      }
    });

    return () => {
      window.removeEventListener('bdigi_notif_read_update', handleNotifReadUpdate);
      if (notifBc) {
        try { notifBc.close(); } catch {}
      }
      if (typeof unsubNotifs === 'function') unsubNotifs();
    };
  }, [isAuthenticated, authUser, refreshNotifications]);

  // 4. Real-time synchronization for orders across tabs & events (e.g., custom offer acceptances)
  useEffect(() => {
    let orderBc = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        orderBc = new BroadcastChannel('bdigi_orders_sync');
      }
    } catch {}

    const handleLiveOrderEvent = (orderPayload) => {
      if (!orderPayload) return;
      const incomingOrder = orderPayload.order || orderPayload;
      if (!incomingOrder || !incomingOrder.id) return;

      // Only accept if admin or matching authenticated user
      const currentUserEmail = (authUser?.email || '').toLowerCase().trim();
      const currentUserId = authUser?.id || null;
      const orderEmail = (incomingOrder.client_email || incomingOrder.clientEmail || '').toLowerCase().trim();
      const orderUserId = incomingOrder.user_id || incomingOrder.clientId || incomingOrder.created_by || null;
      const isAdminUser = authUser?.role === 'admin';

      if (!isAdminUser && currentUserEmail) {
        const emailMatch = orderEmail && orderEmail === currentUserEmail;
        const idMatch = currentUserId && orderUserId && String(orderUserId) === String(currentUserId);
        if (!emailMatch && !idMatch) return;
      }

      setOrders(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const index = safePrev.findIndex(o => o.id === incomingOrder.id);
        if (index >= 0) {
          const updated = [...safePrev];
          updated[index] = { ...updated[index], ...incomingOrder };
          return updated;
        } else {
          return [incomingOrder, ...safePrev];
        }
      });
    };

    const handleCustomEvent = (e) => {
      if (e.detail) {
        handleLiveOrderEvent(e.detail);
      }
    };

    const handleBcMessage = (e) => {
      if (e.data && e.data.order) {
        handleLiveOrderEvent(e.data.order);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('bdigi_order_change', handleCustomEvent);
      if (orderBc) {
        orderBc.addEventListener('message', handleBcMessage);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('bdigi_order_change', handleCustomEvent);
      }
      if (orderBc) {
        try {
          orderBc.removeEventListener('message', handleBcMessage);
          orderBc.close();
        } catch {}
      }
    };
  }, []);

  // Build the app-facing user record from a Supabase session user + role
  const buildAuthUser = (sbUser, role) => {
    const cleanEmail = (sbUser?.email || '').toLowerCase().trim();
    return {
      id: sbUser?.id || `user-${Date.now()}`,
      name: sbUser?.user_metadata?.full_name || sbUser?.user_metadata?.name || cleanEmail.split('@')[0] || 'Verified User',
      email: cleanEmail,
      company: sbUser?.user_metadata?.company || `${cleanEmail.split('@')[0] || 'Valued'} Apparel`,
      role,
      status: sbUser?.user_metadata?.worker_status || sbUser?.user_metadata?.status || 'active',
      specialty: sbUser?.user_metadata?.specialty || sbUser?.user_metadata?.primary_software || 'Embroidery Digitizer',
      provider: sbUser?.app_metadata?.provider || 'email'
    };
  };

  // Resolve role (admin vs worker vs customer) server-side from admins/workers/metadata with local fallback
  const resolveRole = async (email, sbUser = null) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return 'customer';
    if (adminUsers.some(a => (a.email || '').toLowerCase().trim() === cleanEmail)) {
      return 'admin';
    }
    try {
      const res = await verifyAdminSession(cleanEmail);
      if (res?.isAdmin) return 'admin';
    } catch {}

    // 1. Check user metadata
    if (sbUser?.user_metadata?.role === 'worker' || sbUser?.app_metadata?.role === 'worker') {
      return 'worker';
    }

    // 2. Check cached localStorage
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('bdigi_auth_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.email?.toLowerCase() === cleanEmail && parsed?.role === 'worker') {
            return 'worker';
          }
        }
      }
    } catch {}

    // 3. Check worker directory in Supabase
    if (supabase) {
      try {
        const { data: worker } = await supabase
          .from('workers')
          .select('id, status')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (worker && (worker.status || '').toLowerCase() === 'active') {
          return 'worker';
        }
      } catch {}

      try {
        const { data: profile } = await supabase
          .from('worker_profiles')
          .select('id, status')
          .eq('email', cleanEmail)
          .maybeSingle();
        if (profile && (profile.status || '').toLowerCase() === 'active') {
          return 'worker';
        }
      } catch {}
    }

    return 'customer';
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
          const role = await resolveRole(session.user.email, session.user);
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
            fetchClientsFromSupabase().then(dbClients => {
              if (!cancelled && dbClients?.length) {
                setClients(dbClients);
              }
            });
            fetchOrdersFromSupabase().then(dbOrders => {
              if (!cancelled && dbOrders) {
                setOrders(dbOrders);
              }
            });
          } else if (role === 'worker') {
            setCurrentView('worker');
          } else {
            setCurrentView('customer');
          }

          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
              localStorage.setItem('bdigi_current_view', role === 'admin' ? 'admin' : (role === 'worker' ? 'worker' : 'customer'));
              if (typeof document !== 'undefined') {
                document.cookie = 'bdigi_auth=true; path=/; max-age=31536000; SameSite=Lax';
                document.cookie = `bdigi_user_email=${encodeURIComponent(uData.email || '')}; path=/; max-age=31536000; SameSite=Lax`;
                document.cookie = `bdigi_user_role=${encodeURIComponent(role)}; path=/; max-age=31536000; SameSite=Lax`;
              }
            }
          } catch {}

          fetchWalletBalanceFromSupabase(session.user.email).then(balance => {
            if (!cancelled) setWalletBalance(balance);
          });

          fetchOrdersFromSupabase(role === 'admin' ? null : session.user.email, null, role === 'admin' ? null : session.user.id).then(dbOrders => {
            if (!cancelled && dbOrders) setOrders(dbOrders);
          });

          upsertClientInSupabase({ ...uData, role }).catch(() => {});
        } else {
          // If Supabase has no active session, strictly clear session and log out (Rule 3: Auth Enforcement)
          if (!cancelled) {
            setIsAuthenticated(false);
            setAuthUser(null);
            setCurrentView('public');
            setWalletBalance(0);
            setOrders([]);
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('bdigi_auth_user');
                localStorage.removeItem('bdigi_current_view');
                localStorage.removeItem('bdigi_my_order_ids');
                localStorage.removeItem('bdigi_user_email');
                if (typeof document !== 'undefined') {
                  document.cookie = 'bdigi_auth=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_email=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_role=; path=/; max-age=0; SameSite=Lax';
                }
              }
            } catch {}
          }
        }
      } catch (sessErr) {
        console.warn('Session verification notice:', sessErr);
      } finally {
        if (!cancelled) setIsAuthInitialized(true);
      }
    };

    validateImmediateSession();

    const persistLiveCatalogToStorage = (cat) => {
      if (typeof window === 'undefined' || !cat) return;
      try {
        if (cat.siteSettings) {
          localStorage.setItem('site_settings_live', JSON.stringify(cat.siteSettings));
        }
        if (Array.isArray(cat.portfolioSamples) && cat.portfolioSamples.length > 0) {
          localStorage.setItem('portfolio_samples_live', JSON.stringify(cat.portfolioSamples));
        }
        if (Array.isArray(cat.heroSlides) && cat.heroSlides.length > 0) {
          localStorage.setItem('bdigi_hero_slides', JSON.stringify(cat.heroSlides));
        }
        if (Array.isArray(cat.dynamicPricingTiers) && cat.dynamicPricingTiers.length > 0) {
          localStorage.setItem('bdigi_dynamic_pricing_tiers', JSON.stringify(cat.dynamicPricingTiers));
        }
        if (Array.isArray(cat.storeProducts) && cat.storeProducts.length > 0) {
          localStorage.setItem('bdigi_store_products', JSON.stringify(cat.storeProducts));
        }
        if (Array.isArray(cat.patchCards) && cat.patchCards.length > 0) {
          localStorage.setItem('bdigi_patch_cards', JSON.stringify(cat.patchCards));
        }
        if (Array.isArray(cat.pricingCards) && cat.pricingCards.length > 0) {
          localStorage.setItem('bdigi_pricing_cards', JSON.stringify(cat.pricingCards));
        }
        if (Array.isArray(cat.servicesList) && cat.servicesList.length > 0) {
          localStorage.setItem('bdigi_services_list', JSON.stringify(cat.servicesList));
        }
        if (Array.isArray(cat.sewOuts) && cat.sewOuts.length > 0) {
          localStorage.setItem('bdigi_sew_outs', JSON.stringify(cat.sewOuts));
        }
      } catch {}
    };

    const loadInitialData = async () => {
      // 2. Fetch catalog & DB clients if Supabase is configured
      if (isSupabaseConfigured && supabase) {
        try {
          const catalog = await fetchCatalogFromSupabase();
          if (!cancelled && catalog) {
            persistLiveCatalogToStorage(catalog);
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

          // Fetch orders from Supabase DB only for active authenticated session
          const { data: { session: initSession } } = await supabase.auth.getSession();
          if (initSession?.user) {
            const initRole = await resolveRole(initSession.user.email, initSession.user);
            const dbOrders = await fetchOrdersFromSupabase(
              initRole === 'admin' ? null : initSession.user.email,
              null,
              initRole === 'admin' ? null : initSession.user.id
            );
            if (!cancelled && dbOrders) {
              setOrders(dbOrders);
            }
          } else {
            if (!cancelled) setOrders([]);
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
        'portfolio', 'portfolio_items', 'sew_outs', 'hero_slides', 'digitizers', 'cms_content',
        'faqs', 'testimonials', 'site_config', 'home_page_settings'
      ];
      
      tablesToSync.forEach(table => {
        catalogChannel.on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
          try {
            const catalog = await fetchCatalogFromSupabase();
            if (catalog) {
              persistLiveCatalogToStorage(catalog);
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
    const handlePortfolioLocalSync = (e) => {
      if (e.detail) {
        setPortfolioSamples(prev => {
          const list = [...(prev || [])];
          const index = list.findIndex(p => p.id === e.detail.id);
          if (index >= 0) {
            list[index] = { ...list[index], ...e.detail };
          } else {
            list.unshift(e.detail);
          }
          return list;
        });
      }
    };
    const handleStorageSync = (e) => {
      if (e.key === 'site_settings_live' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSiteSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
      if (e.key === 'portfolio_samples_live' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setPortfolioSamples(parsed);
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('site_settings_updated', handleLocalSync);
      window.addEventListener('portfolio_updated', handlePortfolioLocalSync);
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

        // Strict privacy protection: unauthenticated visitors receive zero notifications
        if (!currentUserEmail && currentRole !== 'admin') return;

        const notifRole = (notif.recipient_role || notif.recipientRole || 'all').toLowerCase();
        const notifEmail = (notif.recipient_email || notif.recipientEmail || notif.client_email || '').toLowerCase().trim();

        let isForMe = false;
        if (currentRole === 'admin') {
          isForMe = (notifRole === 'admin' || notifRole === 'all');
        } else {
          // Regular client: NEVER allow admin or worker notifications
          if (notifRole === 'admin' || notifRole === 'worker') {
            isForMe = false;
          } else if (notifEmail) {
            isForMe = (notifEmail === currentUserEmail);
          } else {
            isForMe = (notifRole === 'all');
          }
        }

        if (isForMe) {
          // For customers: only Placed and Payment Confirmed are allowed for orders
          if (currentRole !== 'admin') {
            const isOrdPlaced = isOrderPlacedNotification(notif);
            const isOrdPaid = isOrderPaymentConfirmedNotification(notif);
            const isOrderRelated = Boolean(notif.order_id || notif.orderId || isOrdPlaced || isOrdPaid);
            if (isOrderRelated && !isOrdPlaced && !isOrdPaid) {
              return; // Ignore other order status notifications (delivered, revisions, etc.)
            }
          }

          addNotification({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.type || 'info',
            link: notif.link,
            order_id: notif.order_id || notif.orderId,
            orderId: notif.order_id || notif.orderId,
            recipient_role: notif.recipient_role,
            recipient_email: notif.recipient_email,
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
          const { data: { session: rtSession } } = await supabase.auth.getSession();
          if (rtSession?.user) {
            const rtRole = await resolveRole(rtSession.user.email, rtSession.user);
            const freshOrders = await fetchOrdersFromSupabase(
              rtRole === 'admin' ? null : rtSession.user.email,
              null,
              rtRole === 'admin' ? null : rtSession.user.id
            );
            if (freshOrders && Array.isArray(freshOrders)) {
              setOrders(freshOrders);
            }
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
            setOrders([]); // Wipe orders state immediately on sign out
            setNotifications([]); // Wipe notifications state immediately on sign out
            try {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('bdigi_auth_user');
                localStorage.removeItem('bdigi_current_view');
                localStorage.removeItem('bdigi_my_order_ids');
                localStorage.removeItem('bdigi_user_email');
                localStorage.removeItem('bdigi_notifications');
                if (typeof document !== 'undefined') {
                  document.cookie = 'bdigi_auth=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_email=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_role=; path=/; max-age=0; SameSite=Lax';
                }
              }
            } catch {}
            return;
          }

          if (session?.user) {
            const role = await resolveRole(session.user.email, session.user);
            const uData = buildAuthUser(session.user, role);
            setAuthUser(uData);
            setIsAuthenticated(true);
            setIsAuthModalOpen(false);
            setCurrentView(role === 'admin' ? 'admin' : (role === 'worker' ? 'worker' : 'customer'));
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
                localStorage.setItem('bdigi_current_view', role === 'admin' ? 'admin' : (role === 'worker' ? 'worker' : 'customer'));
              }
            } catch {}

            const balance = await fetchWalletBalanceFromSupabase(session.user.email);
            if (!cancelled) setWalletBalance(balance);

            if (role === 'admin') {
              fetchClientsFromSupabase().then(freshClients => {
                if (!cancelled && freshClients && freshClients.length > 0) setClients(freshClients);
              });
            }

            fetchOrdersFromSupabase(role === 'admin' ? null : session.user.email, null, role === 'admin' ? null : session.user.id).then(freshOrders => {
              if (!cancelled && freshOrders) setOrders(freshOrders);
            });

            fetchNotificationsFromSupabase(session.user.email, role === 'admin').then(freshNotifs => {
              if (!cancelled && Array.isArray(freshNotifs)) {
                const sanitized = filterAndSanitizeNotifications(freshNotifs, {
                  currentUserEmail: session.user.email,
                  isAdmin: role === 'admin'
                });
                setNotifications(sanitized);
                saveNotificationsToStorage(sanitized, session.user.email);
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

  // Synchronize notification audio configuration from siteSettings (Admin & Customer)
  useEffect(() => {
    if (siteSettings) {
      // Admin sound configuration
      const soundUrl = siteSettings.notificationSoundUrl || siteSettings.notification_sound_url || siteSettings.notification_sound_settings?.url || null;
      const soundName = siteSettings.notificationSoundName || siteSettings.notification_sound_name || siteSettings.notification_sound_settings?.name || null;
      const soundActive = siteSettings.notificationSoundActive !== false && 
        siteSettings.notification_sound_active !== false && 
        siteSettings.notificationSoundEnabled !== false &&
        siteSettings.notification_sound_enabled !== false &&
        siteSettings.notification_sound_settings?.enabled !== false;
      const soundVolume = siteSettings.notificationSoundVolume !== undefined 
        ? siteSettings.notificationSoundVolume 
        : (siteSettings.notification_sound_volume !== undefined 
            ? siteSettings.notification_sound_volume 
            : (siteSettings.notification_sound_settings?.volume ?? 1.0));
      const soundPreset = siteSettings.notificationSoundPreset || siteSettings.notification_sound_preset || siteSettings.notification_sound_settings?.preset || 'custom';

      // Customer gentle sound configuration
      const custPreset = siteSettings.customerSoundPreset || siteSettings.customer_sound_preset || siteSettings.notification_sound_settings?.customerPreset || 'basic_ping';
      const custVol = siteSettings.customerSoundVolume !== undefined 
        ? siteSettings.customerSoundVolume 
        : (siteSettings.customer_sound_volume !== undefined 
            ? siteSettings.customer_sound_volume 
            : (siteSettings.notification_sound_settings?.customerVolume ?? 0.50));
      const custActive = siteSettings.customerSoundEnabled !== false && 
        siteSettings.customer_sound_enabled !== false && 
        siteSettings.notification_sound_settings?.customerEnabled !== false;

      configureAudioNotification({
        url: soundUrl,
        name: soundName,
        active: soundActive,
        volume: soundVolume,
        preset: soundPreset,
        customerPreset: custPreset,
        customerVolume: custVol,
        customerActive: custActive
      });
    }
  }, [siteSettings]);

  // Global incoming customer chat chime listener for admin portal
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalChatMessage = (e) => {
      const msg = e.detail;
      if (!msg) return;

      let currentRole = authUser?.role;
      if (!currentRole) {
        try {
          const saved = localStorage.getItem('bdigi_auth_user');
          if (saved) currentRole = JSON.parse(saved)?.role;
        } catch {}
      }

      // If viewing admin portal or logged in as admin
      if (currentRole === 'admin' || currentView === 'admin') {
        const isFromClient = msg.sender === 'client' || msg.sender_role === 'client' || msg.role === 'client';
        if (isFromClient) {
          playMessageChimeForMessage(msg.id || `${msg.conversation_id}-${msg.created_at}`, false, { role: 'admin', isAdmin: true });
        }
      }
    };

    window.addEventListener('bdigi_new_chat_message', handleGlobalChatMessage);
    return () => {
      window.removeEventListener('bdigi_new_chat_message', handleGlobalChatMessage);
    };
  }, [authUser?.role, currentView]);

  // Real-time Presence tracking across the entire website for active authenticated users
  useEffect(() => {
    if (!authUser?.email) return;
    const cleanEmail = authUser.email.toLowerCase().trim();

    trackUserPresence({
      email: cleanEmail,
      name: authUser.name || '',
      role: authUser.role || 'client'
    });

    const interval = setInterval(() => {
      trackUserPresence({
        email: cleanEmail,
        name: authUser.name || '',
        role: authUser.role || 'client'
      });
    }, 60000);

    const handleUnload = () => {
      untrackUserPresence(cleanEmail);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      untrackUserPresence(cleanEmail);
    };
  }, [authUser?.email, authUser?.name, authUser?.role]);

  const persistAuth = (uData, view) => {
    setAuthUser(uData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView(view);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bdigi_auth_user', JSON.stringify(uData));
        localStorage.setItem('bdigi_current_view', view);
        if (typeof document !== 'undefined') {
          document.cookie = 'bdigi_auth=true; path=/; max-age=31536000; SameSite=Lax';
          if (uData?.email) {
            document.cookie = `bdigi_user_email=${encodeURIComponent(uData.email)}; path=/; max-age=31536000; SameSite=Lax`;
          }
          if (view || uData?.role) {
            document.cookie = `bdigi_user_role=${encodeURIComponent(uData?.role || view)}; path=/; max-age=31536000; SameSite=Lax`;
          }
        }
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

  const logout = async () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    setCurrentView('public');
    setWalletBalance(0);
    setOrders([]);
    setNotifications([]);

    try {
      sessionStorage.clear();
      localStorage.removeItem('bdigi_auth_user');
      localStorage.removeItem('bdigi_current_view');
      localStorage.removeItem('bdigi_notifications');
      if (typeof document !== 'undefined') {
        document.cookie = 'bdigi_auth=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'bdigi_user_email=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'bdigi_user_role=; path=/; max-age=0; SameSite=Lax';
      }
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

  const login = async (email, password, requiredRole = null) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    try {
      const sbRes = await signInWithSupabaseAuth(cleanEmail, cleanPass);
      if (sbRes && sbRes.success && sbRes.user) {
        const result = await finishAuth(sbRes.user);

        if (requiredRole && result.role !== requiredRole) {
          // If a specific role is required (e.g. 'admin' for /secure-admin-login)
          await logout();
          return {
            success: false,
            error: `Access denied: This account does not possess authorized ${requiredRole} credentials.`
          };
        }

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
    let isAuthed = isAuthenticated || Boolean(authUser?.email);
    if (!isAuthed && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bdigi_auth_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.email) {
            isAuthed = true;
          }
        }
      } catch {}
    }

    // In mobile app mode (standalone installed app), handle views natively via mobile tabs
    if (mobileMode === 'app') {
      if (targetView === 'public') {
        setCurrentView('public');
        setMobileTab('home');
        return;
      }
      if (targetView === 'customer') {
        if (isAuthed) {
          setCurrentView('customer');
          if (triggerOrderWizard) {
            setMobileTab('home');
            window.dispatchEvent(new CustomEvent('bdigi_open_mobile_order', { detail: initialData }));
          } else {
            setMobileTab('orders');
          }
        } else {
          setMobileTab('login');
          showToast('Please sign in or create an account to view orders', 'warning');
        }
        return;
      }
      if (targetView === 'admin') {
        if (isAuthed && authUser?.role === 'admin') {
          setCurrentView('admin');
          if (typeof window !== 'undefined') {
            window.location.href = '/admin-portal';
          }
        } else {
          showToast('Access Restricted to Studio Admin.', 'warning');
          setMobileTab('login');
        }
        return;
      }
    }

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
            window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'dashboard' } }));
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('trackOrder');
              url.searchParams.delete('orderId');
              url.searchParams.delete('tab');
              window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
            } catch {}
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
          serviceName: orderObj.serviceType || orderObj.service_type || orderObj.title || orderObj.serviceCategory || 'Custom Digitizing',
          amount: orderObj.price || orderObj.amount || orderObj.total,
          revisionNotes: orderObj.revisionNotes,
          messageText: orderObj.messageText,
          senderName: orderObj.senderName,
          recipientEmail: orderObj.recipientEmail,
          orderDetails: orderObj
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
        
        // Client Notification 1: Order Placed (Local state only; DB already populated by /api/orders)
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
        }, false);

        // Client Notification 2: Payment Confirmed (if paid immediately at creation)
        if (isAlreadyPaid) {
          addNotification({
            id: `ord-paid-${localId}`,
            title: `💳 Payment Confirmed - Order Active!`,
            message: `Payment confirmed for Order ${formatOrderId(localId)}. Production is underway.`,
            type: 'success',
            link: '/client-portal',
            order_id: localId,
            orderId: localId,
            recipient_role: 'client',
            recipient_email: (fullOrderPayload.clientEmail || '').toLowerCase().trim()
          }, false);
        }

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
        let resolvedStatus = newStatus || ord.status || 'in_progress';
        if (isPaidComputed && (resolvedStatus === 'awaiting_payment' || resolvedStatus === 'pending_payment' || resolvedStatus === 'submitted')) {
          resolvedStatus = 'in_progress';
        }

        const updatedOrderObj = {
          ...ord,
          status: resolvedStatus,
          ...safeExtraData,
          payment_status: isPaidComputed ? 'paid' : resolvedPayStatus,
          paymentStatus: isPaidComputed ? 'paid' : resolvedPayStatus,
          isPaid: isPaidComputed,
          paid_at: isPaidComputed ? (ord.paid_at || new Date().toISOString()) : ord.paid_at,
          history: [...(ord.history || []), { timestamp: new Date().toISOString(), label: `Status updated to ${resolvedStatus}` }]
        };

        setSelectedOrderForDrawer(prevDrawer => {
          if (!prevDrawer) return null;
          const prevClean = String(prevDrawer.id || '').trim().replace(/^#+/, '');
          if (prevClean === cleanTargetId || prevDrawer.id === orderId || prevDrawer.id === targetWithHash) {
            return { ...prevDrawer, ...updatedOrderObj };
          }
          return prevDrawer;
        });

        return updatedOrderObj;
      }
      return ord;
    }));

    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');

    // Client Notification 2: Payment Confirmed (Only when transitioning to paid)
    const wasAlreadyPaid = String(targetOrder?.payment_status || targetOrder?.paymentStatus || '').toLowerCase() === 'paid';
    const isNowPaid = safeExtraData.paymentStatus === 'paid' || safeExtraData.payment_status === 'paid' || newStatus === 'in_progress';

    if (!wasAlreadyPaid && isNowPaid) {
      addNotification({
        id: `ord-paid-${cleanTargetId}`,
        title: `💳 Payment Confirmed - Order Active!`,
        message: `Payment confirmed for Order ${formatOrderId(orderId)}. Production is underway.`,
        type: 'success',
        order_id: cleanTargetId,
        orderId: cleanTargetId,
        link: `/client-portal?tab=orders&trackOrder=${cleanTargetId}`,
        recipient_role: 'client',
        recipient_email: targetOrder?.clientEmail || null
      }, false);
    }

    // Email triggers based on new status
    if (newStatus === 'delivered') {
      triggerEmailNotification('ORDER_DELIVERED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
    } else if (newStatus === 'completed') {
      triggerEmailNotification('ORDER_COMPLETED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
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

    const targetOrder = orders.find(o => o.id === orderId);
    triggerEmailNotification('ORDER_REVISION', { 
      id: orderId, 
      clientEmail: targetOrder?.clientEmail || authUser?.email,
      revisionNotes: revisionNote 
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
      const isAdminUser = authUser?.role === 'admin';
      const email = isAdminUser ? null : (authUser?.email || null);
      const userId = isAdminUser ? null : (authUser?.id || null);
      const freshOrders = await fetchOrdersFromSupabase(email, null, userId);
      if (freshOrders && Array.isArray(freshOrders)) {
        setOrders(freshOrders);
        return freshOrders;
      }
    } catch (err) {
      console.warn('refreshOrders error:', err);
    }
    return [];
  };

  const refreshClients = async () => {
    try {
      const freshClients = await fetchClientsFromSupabase();
      if (freshClients && Array.isArray(freshClients)) {
        setClients(freshClients);
        return freshClients;
      }
    } catch (err) {
      console.warn('refreshClients error:', err);
    }
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
    // Only in standalone installed mobile app mode, trigger the mobile app order sheet
    if (mobileMode === 'app') {
      setMobileTab('home');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_open_mobile_order', { detail: initialData }));
      }
      return;
    }

    // In responsive website (mobile browser & desktop), open standard responsive OrderWizardModal
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
    upsertCatalogDataToSupabase('portfolio', newPortfolio);
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
    let mergedSettings = null;
    setSiteSettings(prev => {
      const merged = {
        ...prev,
        ...newSettings,
        promotions: newSettings?.promotions || prev?.promotions || [],
        service_discounts: newSettings?.service_discounts || newSettings?.serviceDiscounts || prev?.service_discounts || { embroidery: 20, vector: 10, patch: 5, enabled: true },
        serviceDiscounts: newSettings?.service_discounts || newSettings?.serviceDiscounts || prev?.serviceDiscounts || { embroidery: 20, vector: 10, patch: 5, enabled: true },
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
      mergedSettings = merged;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('site_settings_live', JSON.stringify(merged));
          if (merged.metaPixelId) {
            localStorage.setItem('meta_pixel_id', merged.metaPixelId);
          }
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

    const settingsToSave = mergedSettings || newSettings;
    await saveCmsConfigToSupabase('site_settings', settingsToSave);
    if (newSettings.metaPixelId !== undefined) {
      await saveCmsConfigToSupabase('meta_pixel_id', newSettings.metaPixelId);
    }
    if (newSettings.googleAnalyticsId !== undefined) {
      await saveCmsConfigToSupabase('google_analytics_id', newSettings.googleAnalyticsId);
    }
    if (newSettings.tiktokPixelId !== undefined) {
      await saveCmsConfigToSupabase('tiktok_pixel_id', newSettings.tiktokPixelId);
    }
    if (newSettings.promotions) {
      await saveCmsConfigToSupabase('promotions', newSettings.promotions);
    }
    if (newSettings.service_discounts || newSettings.serviceDiscounts) {
      const sDiscounts = newSettings.service_discounts || newSettings.serviceDiscounts;
      await saveCmsConfigToSupabase('service_discounts', sDiscounts);
      await saveCmsConfigToSupabase('serviceDiscounts', sDiscounts);
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
    if (newSettings.admin_notification_email) {
      await saveCmsConfigToSupabase('admin_notification_email', newSettings.admin_notification_email);
    }
    if (newSettings.notification_settings) {
      await saveCmsConfigToSupabase('notification_settings', newSettings.notification_settings);
    }
    if (newSettings.notification_sound_settings !== undefined) {
      await saveCmsConfigToSupabase('notification_sound_settings', newSettings.notification_sound_settings);
    }
    if (newSettings.notificationSoundUrl !== undefined || newSettings.notification_sound_url !== undefined) {
      const urlToSave = newSettings.notificationSoundUrl || newSettings.notification_sound_url;
      await saveCmsConfigToSupabase('notification_sound_url', urlToSave);
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

      // Reload fresh orders and registered clients from database
      const [freshOrders, freshClients] = await Promise.all([
        fetchOrdersFromSupabase(),
        fetchClientsFromSupabase()
      ]);
      if (freshOrders && Array.isArray(freshOrders)) setOrders(freshOrders);
      if (freshClients && Array.isArray(freshClients)) setClients(freshClients);

      showToast('Catalog & Admin records refreshed from live database.', 'success');
      return { success: true };
    } catch (err) {
      showToast('Failed to refresh data from the database.', 'error');
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
      login, loginWithGoogle, register, logout, protectedNavigate,
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
      stopNotificationSound,
      unreadOrdersCount, markOrdersAsRead, lastOrdersViewedTime,
      createOrder, updateOrderStatus, addRevisionRequest, cancelOrder,
      fetchUserWalletBalance, refreshOrders, refreshClients,
      mobileMode, setMobileMode, isStandaloneApp,
      mobileActiveTab, setMobileTab
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
