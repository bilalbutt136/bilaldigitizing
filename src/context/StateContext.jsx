'use client';

import React, { createContext, useContext, useState, useEffect, useRef as _useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import {
  createOrderInSupabase,
  mapDatabaseOrderToClientOrder,
  updateOrderStatusInSupabase,
  addRevisionInSupabase,
  upsertClientInSupabase,
  signInWithGoogleIdToken,
  signInWithGoogleOAuth as _signInWithGoogleOAuth,
  promptGoogleIdentitySignIn,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  sendPasswordResetEmail,
  updateUserPassword,
  saveCmsConfigToSupabase,
  fetchCatalogFromSupabase,
  fetchClientsFromSupabase,
  fetchOrdersFromSupabase,
  fetchOrderById,
  verifyAdminSession,
  fetchAdminUsers,
  addAdminUserInSupabase,
  resetAdminPasswordInSupabase,
  removeAdminUserInSupabase as _removeAdminUserInSupabase,
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
import { trackUserPresence, untrackUserPresence, resetPresenceAuthBlock } from '../services/presenceService';
import { clearChatUnreadCache } from '../services/chatUnreadService';

import {
  playNotificationSound as _playNotificationSound,
  playCustomerNotificationSound,
  playAdminNotificationSound,
  configureAudioNotification,
  playMessageChime as _playMessageChime,
  playMessageChimeForMessage,
  playCustomerChime as _playCustomerChime,
  playAdminChime as _playAdminChime,
  stopNotificationSound,
  markNotificationSoundPlayed
} from '../utils/audioNotification';
import { THEME_PRESETS, applyThemePresetToDOM } from '../utils/themePresets';
import { formatOrderId, formatDimensions, formatFabric, formatDesignTitle } from '../utils/formatters';
import {
  filterAndSanitizeNotifications,
  isOrderPlacedNotification,
  isOrderPaymentConfirmedNotification,
  isOrderDeliveredNotification
} from '../utils/notificationRouter';

export { formatOrderId, formatDimensions, formatFabric, formatDesignTitle };

const StateContext = createContext();


export const StateProvider = ({ children, initialCatalog = null }) => {
  // Keep SSR and hydration identical. Cached browser data never counts as authenticated;
  // Supabase verification below is the only source of truth for the signed-in session.
  const [currentView, setCurrentView] = useState('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const authHydrationGuardRef = _useRef({ userId: null, hydratedAt: 0 });
  const authInitialSessionSeenRef = _useRef(false);

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
  const [activeAdminTabState, setActiveAdminTabState] = useState('dashboard');
  const [activeCustomerTabState, setActiveCustomerTabState] = useState('dashboard');

  // Browser-only tab preferences are applied after hydration so SSR and the
  // first client render stay identical.
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const savedAdminTab = localStorage.getItem('bdigi_admin_tab');
      const savedCustomerTab = localStorage.getItem('bdigi_customer_tab');

      if (savedAdminTab) setActiveAdminTabState(savedAdminTab);
      if (tabParam) {
        setActiveCustomerTabState(tabParam === 'chat' ? 'inbox' : tabParam);
      } else if (savedCustomerTab) {
        setActiveCustomerTabState(savedCustomerTab === 'chat' ? 'inbox' : savedCustomerTab);
      }
    } catch {}
  }, []);

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

  const _applyThemeToDOM = (tMode = theme, cPreset = colorTheme, cBrand = customBrandColors) => {
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

  // Mobile view starts deterministically for SSR/hydration; browser display mode is resolved after mount.
  const [mobileMode, setMobileModeState] = useState('website');
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('home');

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

  // Core Data Arrays (seeded from cached storage immediately, updated live from DB)
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricing, setPricing] = useState(initialCatalog?.pricing || {});
  const [pricingCards, setPricingCards] = useState(initialCatalog?.pricingCards || []);
  const [dynamicPricingTiers, setDynamicPricingTiers] = useState(initialCatalog?.dynamicPricingTiers || []);
  const [portfolioSamples, setPortfolioSamples] = useState(initialCatalog?.portfolioSamples || []);
  const [sewOuts, setSewOuts] = useState(initialCatalog?.sewOuts || []);
  const [patchCards, setPatchCards] = useState(initialCatalog?.patchCards || []);
  const [storeProducts, setStoreProducts] = useState(initialCatalog?.storeProducts || []);
  const [servicesList, setServicesList] = useState(initialCatalog?.servicesList || []);
  const [heroSlides, setHeroSlides] = useState(initialCatalog?.heroSlides || []);
  const [heroGlobalSettings, setHeroGlobalSettings] = useState(initialCatalog?.heroGlobalSettings || {
    title: 'Premium Embroidery, Vector Art & Patches',
    rotatingTexts: 'Commercial Embroidery, Scalable Vector Art, Custom Physical Patches'
  });
  const [heroServiceText, setHeroServiceText] = useState(initialCatalog?.heroServiceText || {});
  const [siteSettings, setSiteSettings] = useState(() => {
    if (initialCatalog?.siteSettings) return initialCatalog.siteSettings;
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
  const [digitizers, setDigitizers] = useState(initialCatalog?.digitizers || []);

  // Admin whitelist (server-managed via public.admins table)
  const [adminUsers, setAdminUsers] = useState([]);

  // Dynamic Service-Driven Homepage & CMS Content State
  const [activeHomeServiceTab, setActiveHomeServiceTab] = useState('all');
  const [serviceCmsContent, setServiceCmsContent] = useState(initialCatalog?.serviceCms || {});
  const [homePageConfig, setHomePageConfig] = useState(initialCatalog?.homePageConfig || {
    settings: {},
    trustStats: [],
    trustFeatures: [],
    workflowSteps: [],
    pricingStaticCards: [],
    pricingTiers: []
  });
  const [testimonials, setTestimonials] = useState(initialCatalog?.testimonials || []);
  const [faqs, setFaqs] = useState(initialCatalog?.faqs || []);

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
  const [notifications, setNotifications] = useState([]);

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

  /* oxlint-disable react-hooks/exhaustive-deps -- storage helper closes over the same auth identity already listed below */
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
  /* oxlint-enable react-hooks/exhaustive-deps */

  const addNotification = (notif, syncToBackend = true) => {
    if (!notif) return;
    const nowIso = new Date().toISOString();
    const isAlreadyRead = Boolean(notif.read || notif.is_read);
    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: notif.timestamp || notif.created_at || nowIso,
      created_at: notif.created_at || notif.timestamp || nowIso,
      title: notif.title || 'Notification',
      message: notif.message || notif.description || '',
      type: notif.type || 'info',
      link: notif.link || null,
      order_id: notif.order_id || notif.orderId || null,
      orderId: notif.order_id || notif.orderId || null,
      recipient_role: notif.recipient_role || notif.recipientRole || 'client',
      recipient_email: notif.recipient_email || notif.recipientEmail || null,
      ...notif,
      read: isAlreadyRead,
      is_read: isAlreadyRead
    };

    // Check whether this notification already exists in the current list
    const alreadyExists = Array.isArray(notifications) && notifications.some(n => String(n.id) === String(newNotif.id));

    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const filtered = safePrev.filter(n => String(n.id) !== String(newNotif.id));
      const emailToUse = (authUser?.email || newNotif.recipient_email || '').toLowerCase().trim();
      const isAdminToUse = authUser?.role === 'admin' || currentView === 'admin';
      const sanitized = filterAndSanitizeNotifications([newNotif, ...filtered], {
        currentUserEmail: emailToUse,
        isAdmin: isAdminToUse
      });
      saveNotificationsToStorage(sanitized, emailToUse);
      return sanitized;
    });

    // Sound should ONLY play for genuinely new, unread notifications
    // Order delivery notification sound is completely disabled per specification
    const isDeliveryNotification = notif.playSound === false ||
      notif.isDelivery === true ||
      notif.soundType === 'delivery' ||
      Boolean(notif.deliveryNumber) ||
      (typeof notif.title === 'string' && (
        notif.title.toLowerCase().includes('delivery') ||
        notif.title.toLowerCase().includes('order files ready') ||
        notif.title.toLowerCase().includes('files ready') ||
        notif.title.toLowerCase().includes('delivered')
      ));

    const shouldPlaySound = notif.playSound !== false && !isAlreadyRead && !alreadyExists && !isDeliveryNotification;

    if (shouldPlaySound) {
      try {
        const isForAdmin = newNotif.recipient_role === 'admin' || authUser?.role === 'admin' || currentView === 'admin';
        if (isForAdmin) {
          playAdminNotificationSound(notif.soundType || 'notification', false, { messageId: newNotif.id, role: 'admin', isAdmin: true });
        } else {
          playCustomerNotificationSound(notif.soundType || 'chat', false, { messageId: newNotif.id, role: 'customer', isAdmin: false });
        }
      } catch {}
    } else if (isAlreadyRead && newNotif.id) {
      markNotificationSoundPlayed(newNotif.id);
    }

    if (notif.showToast !== false && !isAlreadyRead && !alreadyExists && notif.title) {
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
    if (id) markNotificationSoundPlayed(id);
    setNotifications(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const nextList = safePrev.map(n => String(n.id) === String(id) ? { ...n, read: true, is_read: true } : n);
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
      safePrev.forEach(n => {
        if (n?.id) markNotificationSoundPlayed(n.id);
      });
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
      // If object already has full hydrated properties, use directly
      if (!orderOrId._summaryOnly && orderOrId.status && (orderOrId.client_name || orderOrId.clientName || orderOrId.price !== undefined)) {
        setSelectedOrderForDrawer(orderOrId);
        return;
      }
    }
    const cleanId = String(typeof orderOrId === 'object' ? orderOrId.id : orderOrId).trim().replace(/^#+/, '');
    const found = orders.find(o => {
      const oClean = String(o?.id || '').trim().replace(/^#+/, '');
      return oClean === cleanId || o?.id === orderOrId || o?.id === `#${cleanId}`;
    });
    if (found && !found._summaryOnly && found.status && (found.client_name || found.clientName || found.price !== undefined)) {
      setSelectedOrderForDrawer(found);
      return;
    }

    // NO FAKE MOCK OBJECT: Set loading state and fetch live from Supabase DB
    setSelectedOrderForDrawer({ id: `#${cleanId}`, _isLoading: true });
    (async () => {
      try {
        const liveOrder = await fetchOrderById(cleanId);
        if (liveOrder) {
          setSelectedOrderForDrawer(liveOrder);
          setOrders(prev => {
            const exists = prev.some(p => String(p?.id || '').replace(/^#+/, '') === cleanId);
            return exists ? prev.map(p => String(p?.id || '').replace(/^#+/, '') === cleanId ? liveOrder : p) : [liveOrder, ...prev];
          });
        } else {
          setSelectedOrderForDrawer(null);
          showToast(`Order #${cleanId} not found`, 'error');
        }
      } catch (err) {
        console.warn('[openOrderTrackerDrawer live fetch notice]:', err?.message);
        setSelectedOrderForDrawer(null);
      }
    })();
  };

  const unreadNotificationsCount = Array.isArray(notifications) ? notifications.filter(n => !n.read && !n.is_read).length : 0;

  // Unread Orders tracking (Badge clears once customer views Orders tab/screen)
  const [lastOrdersViewedTime, setLastOrdersViewedTime] = useState(0);

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

  // Global Realtime Listeners for Notifications.
  /* oxlint-disable react-hooks/exhaustive-deps -- subscription lifecycle is auth-keyed; mutable order/toast helper identities must not churn sockets */
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
          if (safePrev.some(n => String(n.id) === String(notif.id))) return prev;
          const emailToUse = (authUser?.email || notif.recipient_email || userEmail || '').toLowerCase().trim();
          const isAdminToUse = authUser?.role === 'admin' || currentView === 'admin' || isAdminUser;
          const sanitized = filterAndSanitizeNotifications([notif, ...safePrev], {
            currentUserEmail: emailToUse,
            isAdmin: isAdminToUse,
            orders
          });
          saveNotificationsToStorage(sanitized, emailToUse);
          return sanitized;
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
  /* oxlint-enable react-hooks/exhaustive-deps */

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
      const rawOrder = orderPayload.order || orderPayload;
      if (!rawOrder || !rawOrder.id) return;
      const incomingOrder = mapDatabaseOrderToClientOrder(rawOrder) || rawOrder;

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
        const cleanIncomingId = String(incomingOrder.id || '').replace(/^#+/, '');
        const index = safePrev.findIndex(o => String(o.id || '').replace(/^#+/, '') === cleanIncomingId);
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
  }, [authUser?.email, authUser?.id, authUser?.role]);

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
    // Only server-controlled app_metadata may provide an immediate worker role.
    // user_metadata and localStorage are user-controlled and must never grant privileges.
    if (sbUser?.app_metadata?.role === 'worker') {
      return 'worker';
    }

    // Check worker directory records using the verified authenticated email.
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

  // Load catalog + admin whitelist + database clients + wallet on mount.
  /* oxlint-disable react-hooks/exhaustive-deps -- single application bootstrap/subscription lifecycle; callback identities are intentionally not lifecycle keys */
  useEffect(() => {
    let cancelled = false;

    // 1. Validate Supabase session IMMEDIATELY in parallel
    const validateImmediateSession = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (!cancelled) setIsAuthInitialized(true);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const session = sessionData?.session;
        if (!cancelled && session?.user) {
          // onAuthStateChange(INITIAL_SESSION) may win this race on hard refresh.
          // If that path already hydrated the same user, do not duplicate all API reads.
          if (authHydrationGuardRef.current.userId === session.user.id) {
            setIsAuthInitialized(true);
            return;
          }

          const role = await resolveRole(session.user.email, session.user);
          authHydrationGuardRef.current = {
            userId: session.user.id,
            hydratedAt: Date.now()
          };
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

          if (role === 'customer') upsertClientInSupabase({ ...uData, role }).catch(() => {});
        } else {
          // Hard refresh can briefly report no session before Supabase emits its
          // authoritative INITIAL_SESSION event. Do not mark auth initialized yet,
          // otherwise AdminPortalClient redirects a still-valid admin to login.
          if (!authInitialSessionSeenRef.current) return;

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
                localStorage.removeItem('bdigi_user_email');
                if (typeof document !== 'undefined') {
                  document.cookie = 'bdigi_auth=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_email=; path=/; max-age=0; SameSite=Lax';
                  document.cookie = 'bdigi_user_role=; path=/; max-age=0; SameSite=Lax';
                }
              }
            } catch {}
            setIsAuthInitialized(true);
          }
        }
      } catch (sessErr) {
        console.warn('Session verification notice:', sessErr);
        // INITIAL_SESSION remains the fallback source of truth.
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
          const catalog = initialCatalog || await fetchCatalogFromSupabase();
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

          // The RootLayout already preloads Home Page CMS inside initialCatalog.
          // Only hit the API when no server-preloaded value exists.
          const hpContent = initialCatalog?.homePageConfig || await fetchHomePageContentFromSupabase();
          if (!cancelled && hpContent) {
            setHomePageConfig(hpContent);
          }

          // Auth-scoped clients/orders are loaded by validateImmediateSession above.
          // Avoid duplicate /api/orders and client-directory requests during hydration.
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
        'faqs', 'testimonials', 'site_config', 'home_page_settings', 'site_branding'
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
          // For customers: only Placed, Payment Confirmed, and Delivered are allowed for orders
          if (currentRole !== 'admin') {
            const isOrdPlaced = isOrderPlacedNotification(notif);
            const isOrdPaid = isOrderPaymentConfirmedNotification(notif);
            const isOrdDelivered = isOrderDeliveredNotification(notif);
            const isOrderRelated = Boolean(notif.order_id || notif.orderId || isOrdPlaced || isOrdPaid || isOrdDelivered);
            if (isOrderRelated && !isOrdPlaced && !isOrdPaid && !isOrdDelivered) {
              return; // Ignore other order status notifications (internal revisions, etc.)
            }
          }

          const isInsert = payload?.eventType === 'INSERT';
          const isUnread = !notif.read && !notif.is_read;

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
            read: notif.read || notif.is_read || false,
            is_read: notif.read || notif.is_read || false,
            playSound: isInsert && isUnread,
            showToast: isInsert && isUnread
          }, false);

          // Order rows are synchronized by the shared orders Realtime subscription below.
          // Do not refetch the entire order list for the accompanying notification event.
        }
      });

      unsubscribeOrders = subscribeToOrders(async (payload) => {
        const ord = payload.new || payload.record;
        if (!ord) return;
        const mappedOrd = mapDatabaseOrderToClientOrder(ord) || ord;

        // Immediate optimistic in-memory state update
        setOrders(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          const cleanNewId = String(mappedOrd.id || '').replace(/^#+/, '');
          const existingIdx = safePrev.findIndex(o => String(o.id || '').replace(/^#+/, '') === cleanNewId);
          if (existingIdx >= 0) {
            const next = [...safePrev];
            next[existingIdx] = { ...next[existingIdx], ...mappedOrd };
            return next;
          }
          return [mappedOrd, ...safePrev];
        });

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

        // The Realtime row above is the source of truth for this change. A manual/focus
        // refresh remains available as recovery without multiplying serverless invocations.
      });
    }

    let authSubscription = null;
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;

        try {
          if (event === 'INITIAL_SESSION') {
            authInitialSessionSeenRef.current = true;
          }

          // TOKEN_REFRESHED changes credentials, not application data. Reset only
          // auth-sensitive REST circuit breakers without refetching portal data.
          if (event === 'TOKEN_REFRESHED') {
            clearChatUnreadCache();
            resetPresenceAuthBlock();
            return;
          }

          if (event === 'PASSWORD_RECOVERY') {
            setAuthModalMode('update_password');
            setIsAuthModalOpen(true);
            return;
          }

          if (event === 'SIGNED_OUT') {
            clearChatUnreadCache();
            resetPresenceAuthBlock();
            authHydrationGuardRef.current = { userId: null, hydratedAt: 0 };
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
            clearChatUnreadCache();
            resetPresenceAuthBlock();
            const lastHydration = authHydrationGuardRef.current;
            if (
              lastHydration.userId === session.user.id &&
              (
                event === 'INITIAL_SESSION' || event === 'SIGNED_IN'
              )
            ) {
              setIsAuthInitialized(true);
              return;
            }

            const role = await resolveRole(session.user.email, session.user);
            authHydrationGuardRef.current = {
              userId: session.user.id,
              hydratedAt: Date.now()
            };
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

            if (role === 'customer') {
              try {
                await upsertClientInSupabase({ ...uData, role });
              } catch (err) {
                console.warn('Client upsert notice:', err);
              }
            }
          } else if (event === 'INITIAL_SESSION') {
            // INITIAL_SESSION with no user is the authoritative "signed out"
            // signal after browser storage/cookies have finished loading.
            if (!authHydrationGuardRef.current.userId) {
              setIsAuthenticated(false);
              setAuthUser(null);
              setCurrentView('public');
              setWalletBalance(0);
              setOrders([]);
              try {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('bdigi_auth_user');
                  localStorage.removeItem('bdigi_current_view');
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
        } catch (authErr) {
          console.warn('onAuthStateChange exception:', authErr);
        } finally {
          if (!cancelled && event !== 'TOKEN_REFRESHED') {
            setIsAuthInitialized(true);
          }
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
  /* oxlint-enable react-hooks/exhaustive-deps */

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

    const handleUnload = () => {
      untrackUserPresence(cleanEmail);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
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
    } catch {
      console.warn("Error fetching user data from api");
    }

    const uData = buildAuthUser(sbUser, role);
    authHydrationGuardRef.current = {
      userId: sbUser.id,
      hydratedAt: Date.now()
    };
    persistAuth(uData, role);
    setWalletBalance(balance);

    // Immediately load orders for the authenticated user so Customer Portal has live data
    try {
      fetchOrdersFromSupabase(
        role === 'admin' ? null : sbUser.email,
        null,
        role === 'admin' ? null : sbUser.id
      ).then(freshOrders => {
        if (freshOrders && Array.isArray(freshOrders)) {
          setOrders(freshOrders);
        }
      }).catch(err => console.warn('Order hydration after auth notice:', err));
    } catch {}

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
    const localId = newOrderData.id || `#${Math.floor(10000 + Math.random() * 90000)}`;
    const isAlreadyPaid = String(newOrderData.payment_status || newOrderData.paymentStatus || '').toLowerCase() === 'paid';

    const fullOrderPayload = {
      id: localId,
      ...newOrderData,
      clientName: newOrderData.clientName || authUser?.company || authUser?.name || 'Valued Client',
      clientEmail: (newOrderData.clientEmail || authUser?.email || '').toLowerCase().trim(),
      client_email: (newOrderData.clientEmail || authUser?.email || '').toLowerCase().trim(),
      clientId: newOrderData.clientId || authUser?.id || authUser?.email || '',
      user_id: newOrderData.user_id || authUser?.id || null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      // Use 'submitted' to match what the DB stores (not 'awaiting_payment')
      status: newOrderData.status || (isAlreadyPaid ? 'in_progress' : 'submitted'),
      payment_status: isAlreadyPaid ? 'paid' : (newOrderData.payment_status || newOrderData.paymentStatus || 'pending'),
      paymentStatus: isAlreadyPaid ? 'paid' : (newOrderData.payment_status || newOrderData.paymentStatus || 'pending'),
      isPaid: isAlreadyPaid,
      history: [{ timestamp: new Date().toISOString(), label: isAlreadyPaid ? 'Order Submitted & Paid with Studio Wallet' : 'Order Submitted — Awaiting Payment' }],
      revisions: []
    };

    let canonicalOrder = fullOrderPayload;

    if (isSupabaseConfigured) {
      try {
        const sbResult = await createOrderInSupabase(fullOrderPayload);
        if (sbResult?.success && sbResult?.data) {
          const liveOrder = mapDatabaseOrderToClientOrder(sbResult.data) || sbResult.data;
          canonicalOrder = { ...fullOrderPayload, ...liveOrder };
        } else {
          const errMsg = sbResult?.error || 'Failed to save order to live database.';
          console.error('[createOrder DB write error]:', errMsg);
          throw new Error(errMsg);
        }
      } catch (sbErr) {
        console.error('Supabase create order error:', sbErr);
        throw sbErr;
      }
    }

    const assignedId = canonicalOrder.id || localId;
    setOrders(prev => [canonicalOrder, ...prev.filter(o => o.id !== assignedId && o.id !== localId)]);
    showToast(`Order ${formatOrderId(assignedId)} created successfully!`, 'success');

    // Refresh orders from DB after a brief delay to ensure the new order is fully persisted
    // This fixes the race condition where the dashboard shows stale data after order creation
    setTimeout(async () => {
      try { await refreshOrders(); } catch {}
    }, 2000);


    if (typeof window !== 'undefined' && assignedId) {
      try {
        const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
        const cleanId = String(assignedId).trim();
        if (!prevIds.includes(cleanId)) {
          localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
        }
      } catch {}
    }

    const isFromOffer = canonicalOrder.source === 'custom_offer' ||
                        Boolean(canonicalOrder.offerId) ||
                        Boolean(canonicalOrder.offer_id) ||
                        Boolean(fullOrderPayload.offerId) ||
                        Boolean(fullOrderPayload.offer_id) ||
                        (typeof canonicalOrder.notes === 'string' && canonicalOrder.notes.includes('custom_offer'));

    // Client Notification 1: Order Placed (Local state only; DB already populated by /api/orders)
    if (!isFromOffer) {
      addNotification({
        id: `ord-created-${assignedId}`,
        title: `🎉 Order ${formatOrderId(assignedId)} Placed!`,
        message: isAlreadyPaid
          ? `Your digitizing order has been created and production has started.`
          : `Order created. Waiting for payment of $${parseFloat(canonicalOrder.totalPrice || canonicalOrder.price || 15).toFixed(2)} to start production.`,
        type: isAlreadyPaid ? 'success' : 'warning',
        link: '/client-portal',
        order_id: assignedId,
        orderId: assignedId,
        recipient_role: 'client',
        recipient_email: (canonicalOrder.clientEmail || '').toLowerCase().trim()
      }, false);
    }

    // Client Notification 2: Payment Confirmed (if paid immediately at creation)
    if (isAlreadyPaid) {
      addNotification({
        id: `ord-paid-${assignedId}`,
        title: `💳 Payment Confirmed - Order Active!`,
        message: `Payment confirmed for Order ${formatOrderId(assignedId)}. Production is underway.`,
        type: 'success',
        link: '/client-portal',
        order_id: assignedId,
        orderId: assignedId,
        recipient_role: 'client',
        recipient_email: (canonicalOrder.clientEmail || '').toLowerCase().trim()
      }, false);
    }

    // Broadcast admin notification in real-time so admin portal gets it immediately
    const adminNotif = {
      id: `notif-ord-${assignedId}-admin`,
      recipient_role: 'admin',
      recipient_email: null,
      title: `🚨 New Order: ${canonicalOrder.title || 'Order'}`,
      message: `Received from ${canonicalOrder.clientName || 'Client'} (${(canonicalOrder.clientEmail || '').toLowerCase()}) — ${canonicalOrder.serviceCategory || 'Embroidery Digitizing'}. Price: $${parseFloat(canonicalOrder.price || 15).toFixed(2)}`,
      type: 'info',
      link: '/admin-portal',
      order_id: assignedId,
      orderId: assignedId,
      read: false,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    broadcastLiveNotification(adminNotif);
    triggerEmailNotification('NEW_ORDER', canonicalOrder);

    // Log Purchase Tracking Event with exact customer name and email
    try {
      const custIdentity = canonicalOrder.clientEmail
        ? `${canonicalOrder.clientName || 'Customer'} (${canonicalOrder.clientEmail})`
        : (authUser?.email ? `${authUser.name || 'Customer'} (${authUser.email})` : 'Customer');

      const orderAmount = parseFloat(canonicalOrder.price || 15);
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

    return canonicalOrder;
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
        const clientEmailForApi = (targetOrder?.clientEmail || targetOrder?.client_email || safeExtraData?.clientEmail || safeExtraData?.client_email || '').toLowerCase().trim();
        const clientNameForApi = targetOrder?.clientName || targetOrder?.client_name || safeExtraData?.clientName || safeExtraData?.client_name || '';
        const orderTitleForApi = targetOrder?.title || safeExtraData?.title || '';
        const persistenceResult = await updateOrderStatusInSupabase(orderId, newStatus, {
          ...safeExtraData,
          clientEmail: clientEmailForApi,
          clientName: clientNameForApi,
          title: orderTitleForApi
        });
        if (!persistenceResult?.success) {
          throw new Error(persistenceResult?.error || 'Order update was not persisted.');
        }
      } catch (sbErr) {
        console.warn('Supabase update order status notice:', sbErr);
        showToast(sbErr?.message || 'Order update failed to save.', 'error');
        return { success: false, error: sbErr?.message || 'Order update failed to save.' };
      }
    }

    setOrders(prev => prev.map(ord => {
      const ordClean = String(ord.id || '').trim().replace(/^#+/, '');
      const isMatch = ordClean === cleanTargetId || ord.id === orderId || ord.id === targetWithHash;
      if (isMatch) {
        const resolvedPayStatus = safeExtraData.paymentStatus || safeExtraData.payment_status || (newStatus === 'in_progress' ? 'paid' : ord.payment_status || ord.paymentStatus);
        const isPaidComputed = resolvedPayStatus === 'paid' || resolvedPayStatus === 'completed' || resolvedPayStatus === 'wallet' || newStatus === 'in_progress';
        let resolvedStatus = newStatus || ord.status || 'in_progress';
        if (ord.status === 'delivered' || ord.status === 'completed') {
          if (!newStatus || newStatus === 'in_progress') {
            resolvedStatus = ord.status;
          }
        } else if (isPaidComputed && (resolvedStatus === 'awaiting_payment' || resolvedStatus === 'pending_payment' || resolvedStatus === 'submitted')) {
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

    // Notifications and Email triggers based on new status
    if (newStatus === 'delivered' && !isSupabaseConfigured) {
      const clientEmail = (targetOrder?.clientEmail || targetOrder?.client_email || safeExtraData?.clientEmail || safeExtraData?.client_email || '').toLowerCase().trim();
      const delivNum = safeExtraData?.deliveryNumber ||
        (Array.isArray(safeExtraData?.deliveries) && safeExtraData.deliveries.length > 0
          ? (safeExtraData.deliveries[0]?.deliveryNumber || safeExtraData.deliveries.length)
          : (Array.isArray(targetOrder?.deliveries) && targetOrder.deliveries.length > 0 ? (targetOrder.deliveries[0]?.deliveryNumber || targetOrder.deliveries.length) : 1));

      const delivNotifId = delivNum > 1 ? `ord-deliv-${cleanTargetId}-v${delivNum}` : `ord-deliv-${cleanTargetId}`;
      const delivTitle = delivNum > 1
        ? `📦 Delivery #${delivNum} Ready: ${targetOrder?.title || safeExtraData?.title || `Order #${cleanTargetId}`}`
        : `📦 Order Files Ready: ${targetOrder?.title || safeExtraData?.title || `Order #${cleanTargetId}`}`;
      const delivMsg = delivNum > 1
        ? `Updated production stitch files (Delivery #${delivNum}) are ready for inspection and download!`
        : `Your production stitch files and deliverables are ready for inspection and download!`;

      addNotification({
        id: delivNotifId,
        title: delivTitle,
        message: delivMsg,
        type: 'success',
        order_id: cleanTargetId,
        orderId: cleanTargetId,
        deliveryNumber: delivNum,
        link: `/client-portal?tab=orders&trackOrder=${cleanTargetId}`,
        recipient_role: 'client',
        recipient_email: clientEmail || null,
        playSound: false,
        isDelivery: true,
        soundType: 'delivery'
      }, true);

      triggerEmailNotification('ORDER_DELIVERED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
    } else if (newStatus === 'completed') {
      triggerEmailNotification('ORDER_COMPLETED', { ...(targetOrder || {}), id: orderId, ...safeExtraData });
    }

    return { success: true };
  };

  const _assignDigitizer = async (orderId, digitizerId) => {
    await updateOrderStatus(orderId, 'assigned', { digitizerId });
  };

  const _completeOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (order && !validateStatusTransition(order.status, ORDER_STATUSES.COMPLETED)) {
      showToast(`Cannot complete order — current status is '${order.status}'. Order must be in 'delivered' status first.`, 'error');
      return;
    }
    await updateOrderStatus(orderId, ORDER_STATUSES.COMPLETED);
  };

  const addRevisionRequest = async (orderId, revisionNote) => {
    const nowIso = new Date().toISOString();
    const cleanId = String(orderId || '').trim().replace(/^#+/, '');
    const withHash = `#${cleanId}`;

    // Call the Orders API requestRevision — sets status='revision', inserts revision row, fires dual notifications
    if (isSupabaseConfigured) {
      try {
        const headers = await getAuthHeaders().catch(() => ({ 'Content-Type': 'application/json' }));
        await fetch('/api/orders', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'requestRevision',
            payload: { orderId: cleanId, instructions: revisionNote }
          })
        });
      } catch {
        // Fallback: direct Supabase update
        try {
          await addRevisionInSupabase(cleanId, revisionNote, authUser?.name || 'Client');
          await updateOrderStatusInSupabase(cleanId, 'revision');
        } catch (fbErr) {
          console.warn('Supabase add revision fallback notice:', fbErr);
        }
      }
    }

    const newRevItem = { id: `rev-${Date.now()}`, notes: revisionNote, instructions: revisionNote, requestedBy: authUser?.name || 'Client', createdAt: nowIso };

    // Immediately update local UI state AND drawer state
    setOrders(prev => prev.map(ord => {
      const ordClean = String(ord?.id || '').trim().replace(/^#+/, '');
      if (ordClean === cleanId || ord.id === orderId || ord.id === withHash) {
        return {
          ...ord,
          status: 'revision',
          updated_at: nowIso,
          revisions: [newRevItem, ...(ord.revisions || [])],
          history: [{ timestamp: nowIso, label: `Revision Requested: "${(revisionNote || '').slice(0, 35)}..."` }, ...(ord.history || [])]
        };
      }
      return ord;
    }));

    setSelectedOrderForDrawer(prev => {
      if (!prev) return null;
      const prevClean = String(prev?.id || '').trim().replace(/^#+/, '');
      if (prevClean === cleanId || prev.id === orderId || prev.id === withHash) {
        return {
          ...prev,
          status: 'revision',
          updated_at: nowIso,
          revisions: [newRevItem, ...(prev.revisions || [])]
        };
      }
      return prev;
    });

    showToast(`Modification request sent for Order ${formatOrderId(orderId)}`, 'info');

    const targetOrder = orders.find(o => {
      const oClean = String(o?.id || '').trim().replace(/^#+/, '');
      return oClean === cleanId || o.id === orderId || o.id === withHash;
    });

    triggerEmailNotification('ORDER_REVISION', {
      id: cleanId,
      clientEmail: targetOrder?.clientEmail || authUser?.email,
      revisionNotes: revisionNote
    });
  };




  const cancelOrder = async (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    await cancelOrderInSupabase(orderId);
    showToast(`Order ${formatOrderId(orderId)} marked as CANCELLED`, 'warning');
  };

  const requestOrderCancellation = async (orderId, reason) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'requestCancellation', payload: { orderId, reason } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to submit cancellation request.', 'error');
        return { success: false, error: data.error };
      }
      const cleanTarget = String(orderId).replace(/^#+/, '');
      setOrders(prev => prev.map(o => {
        const oClean = String(o.id).replace(/^#+/, '');
        if (oClean === cleanTarget || o.id === orderId) {
          const updatedNotes = typeof o.notes === 'string' && o.notes.startsWith('{')
            ? JSON.parse(o.notes)
            : (typeof o.notes === 'object' && o.notes ? { ...o.notes } : {});
          updatedNotes.cancellation = data.cancellation;
          return { ...o, status: 'cancellation_requested', notes: updatedNotes, cancellation: data.cancellation };
        }
        return o;
      }));
      showToast('Cancellation request submitted to studio administration.', 'info');
      if (refreshOrders) refreshOrders();
      return { success: true, cancellation: data.cancellation };
    } catch (err) {
      showToast(err.message || 'Error submitting cancellation request.', 'error');
      return { success: false, error: err.message };
    }
  };

  const approveOrderCancellation = async (orderId, adminNote = '') => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'approveCancellation', payload: { orderId, adminNote } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to approve cancellation.', 'error');
        return { success: false, error: data.error };
      }
      const cleanTarget = String(orderId).replace(/^#+/, '');
      setOrders(prev => prev.map(o => {
        const oClean = String(o.id).replace(/^#+/, '');
        if (oClean === cleanTarget || o.id === orderId) {
          return {
            ...o,
            status: 'cancelled',
            payment_status: data.refundIssued ? 'refunded' : o.payment_status,
            cancellation: { ...(o.cancellation || {}), status: 'approved', refund_issued: data.refundIssued }
          };
        }
        return o;
      }));
      if (data.newBalance !== null && data.newBalance !== undefined) {
        setWalletBalance(data.newBalance);
      }
      showToast(`Order ${formatOrderId(orderId)} cancelled.${data.refundIssued ? ` $${data.refundAmount.toFixed(2)} refunded to wallet.` : ''}`, 'success');
      if (refreshOrders) refreshOrders();
      return { success: true, ...data };
    } catch (err) {
      showToast(err.message || 'Error approving cancellation.', 'error');
      return { success: false, error: err.message };
    }
  };

  const rejectOrderCancellation = async (orderId, rejectionReason = '') => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'rejectCancellation', payload: { orderId, rejectionReason } })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to reject cancellation.', 'error');
        return { success: false, error: data.error };
      }
      const restoredStatus = data.status || 'in_progress';
      const cleanTarget = String(orderId).replace(/^#+/, '');
      setOrders(prev => prev.map(o => {
        const oClean = String(o.id).replace(/^#+/, '');
        if (oClean === cleanTarget || o.id === orderId) {
          return {
            ...o,
            status: restoredStatus,
            cancellation: { ...(o.cancellation || {}), status: 'rejected', admin_rejection_reason: rejectionReason }
          };
        }
        return o;
      }));
      showToast(`Cancellation declined. Order restored to ${restoredStatus}.`, 'info');
      if (refreshOrders) refreshOrders();
      return { success: true, ...data };
    } catch (err) {
      showToast(err.message || 'Error rejecting cancellation.', 'error');
      return { success: false, error: err.message };
    }
  };

  const _deleteOrder = async (orderId) => {
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

  const refreshOrders = useCallback(async (options = {}) => {
    try {
      let resolvedUser = authUser;
      if (!resolvedUser && typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('bdigi_auth_user') || 'null');
          if (saved) resolvedUser = saved;
        } catch {}
      }
      const isAdminUser = resolvedUser?.role === 'admin';
      const email = isAdminUser ? null : (resolvedUser?.email || null);
      const userId = isAdminUser ? null : (resolvedUser?.id || null);
      const freshOrders = await fetchOrdersFromSupabase(email, null, userId, { force: Boolean(options?.force) });
      if (freshOrders && Array.isArray(freshOrders)) {
        setOrders(prevOrders => {
          const freshMap = new Map(freshOrders.map(o => [String(o.id).replace(/^#+/, ''), o]));
          const now = Date.now();
          const retainedLocalOrders = (prevOrders || []).filter(o => {
            const cleanId = String(o.id).replace(/^#+/, '');
            if (freshMap.has(cleanId)) return false;
            const orderAge = now - new Date(o.createdAt || o.created_at || now).getTime();
            return !isNaN(orderAge) && orderAge < 300000;
          });
          return [...freshOrders, ...retainedLocalOrders];
        });
        return freshOrders;
      }
    } catch (err) {
      console.warn('refreshOrders error:', err);
    }
    return [];
  }, [authUser]);

  const refreshClients = useCallback(async (options = {}) => {
    try {
      const freshClients = await fetchClientsFromSupabase({ force: Boolean(options?.force) });
      if (freshClients && Array.isArray(freshClients)) {
        setClients(freshClients);
        return freshClients;
      }
    } catch (err) {
      console.warn('refreshClients error:', err);
    }
    return [];
  }, []);

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
            const targetStatus = (ord.status === 'delivered' || ord.status === 'completed') ? ord.status : 'in_progress';
            return {
              ...ord,
              status: targetStatus,
              payment_status: 'paid',
              paymentStatus: 'paid',
              isPaid: true,
              paid_at: ord.paid_at || new Date().toISOString(),
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

  const _updateStoreProducts = (newProducts) => {
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
        } catch {}
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
    if (newSettings.admin_notification_emails) {
      await saveCmsConfigToSupabase('admin_notification_emails', newSettings.admin_notification_emails);
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
      requestOrderCancellation, approveOrderCancellation, rejectOrderCancellation,
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
