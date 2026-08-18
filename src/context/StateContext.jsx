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
  signInWithAppleIdToken,
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
  ORDER_STATUSES,
  validateStatusTransition
} from '../services/supabaseService';

import { playNotificationSound } from '../utils/audioNotification';

const StateContext = createContext();

export const formatOrderId = (rawId) => {
  if (!rawId) return '#0000';
  const cleanId = String(rawId).replace(/^(EMB-|VEC-)/i, '').replace(/^#/, '');
  return `#${cleanId}`;
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
  const [siteSettings, setSiteSettings] = useState({
    announcement: {
      enabled: true,
      badge: 'SPECIAL PROMO',
      text: 'Get 20% OFF on All Custom Embroidery Digitizing & Vector Art Orders!',
      promoCode: 'SAVE20',
      linkText: 'Claim 20% Off',
      linkUrl: '/order',
      theme: 'emerald',
      bgColor: 'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)',
      textColor: '#ffffff',
      showCodeBadge: true,
      showCountdown: true,
      countdownHours: 24
    },
    promotionalBanner: {
      enabled: true,
      title: 'First-Time Client Welcome Offer',
      description: 'Enjoy 20% off your first digitizing file or vector redraw with guaranteed zero thread breaks and free unlimited revisions.',
      promoCode: 'WELCOME20',
      ctaText: 'Start Your Order',
      ctaLink: '/order',
      theme: 'navy',
      position: 'bottom-right'
    },
    promoCodes: [
      {
        code: 'SAVE20',
        discountType: 'percent',
        discountValue: 20,
        minOrder: 10,
        description: '20% off all embroidery digitizing and vector conversion services',
        isActive: true
      }
    ]
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

  // Global Notification System State
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
    try {
      playNotificationSound('notification');
    } catch {}
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Global Chat Unread Counter (Synced across customer and admin)
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const refreshUnreadChatCount = React.useCallback(async () => {
    try {
      if (!isSupabaseConfigured) return;
      const convs = await fetchConversations();
      if (Array.isArray(convs)) {
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || c.adminUnreadCount || c.clientUnreadCount || 0), 0);
        setUnreadChatCount(total);
      }
    } catch (err) {
      console.warn('Refresh unread count notice:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !authUser) {
      setUnreadChatCount(0);
      return;
    }
    refreshUnreadChatCount();

    const handleReadUpdate = () => {
      refreshUnreadChatCount();
    };

    window.addEventListener('bdigi_read_update', handleReadUpdate);
    const unsubscribe = subscribeToLiveMessages(() => {
      refreshUnreadChatCount();
    }, () => {
      refreshUnreadChatCount();
    });

    return () => {
      window.removeEventListener('bdigi_read_update', handleReadUpdate);
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [isAuthenticated, authUser, refreshUnreadChatCount]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    try {
      playNotificationSound('notification');
    } catch {}
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
          // If Supabase has no authenticated session, clear any stale local user state immediately (Rule 3)
          if (!cancelled) {
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

    // Supabase Realtime: Global Chat Notifications
    let messageChannel = null;
    if (isSupabaseConfigured && supabase) {
      messageChannel = supabase.channel(`global-messages-channel-state-${Date.now()}`);
      messageChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (!msg) return;
        
        // Notify admin if a client sends a message
        if (msg.sender === 'client') {
          // Check role safely since this is inside a mount useEffect
          let isAdmin = false;
          try {
            const savedUser = localStorage.getItem('bdigi_auth_user');
            if (savedUser) isAdmin = JSON.parse(savedUser).role === 'admin';
          } catch {}

          if (isAdmin) {
            addNotification({
              id: `msg-${Date.now()}`,
              title: `New Message from ${msg.sender_name || 'Client'}`,
              message: msg.text || (msg.attachment ? 'Sent an attachment' : 'Sent a message'),
              type: 'info',
              read: false,
              timestamp: msg.created_at || new Date().toISOString()
            });
          }
        }
      });
      messageChannel.subscribe();
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

    // Supabase Realtime: Instant Bi-Directional Order Synchronization
    let ordersLiveChannel = null;
    if (isSupabaseConfigured && supabase) {
      ordersLiveChannel = supabase.channel(`orders-live-sync-${Date.now()}`);
      
      const orderTables = ['orders', 'order_files', 'order_messages', 'revisions', 'transactions', 'clients'];
      orderTables.forEach(tbl => {
        ordersLiveChannel.on('postgres_changes', { event: '*', schema: 'public', table: tbl }, async () => {
          try {
            const freshOrders = await fetchOrdersFromSupabase();
            if (freshOrders && Array.isArray(freshOrders)) {
              setOrders(freshOrders);
            }
            if (tbl === 'clients') {
              const freshClients = await fetchClientsFromSupabase();
              if (freshClients && freshClients.length > 0) {
                setClients(freshClients);
              }
            }
          } catch (syncErr) {
            console.warn('Realtime order sync error:', syncErr);
          }
        });
      });
      ordersLiveChannel.subscribe();
    }

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
      if (catalogChannel && supabase) {
        supabase.removeChannel(catalogChannel);
      }
      if (messageChannel && supabase) {
        supabase.removeChannel(messageChannel);
      }
      if (ordersLiveChannel && supabase) {
        supabase.removeChannel(ordersLiveChannel);
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

  const loginWithGoogle = async (idToken) => {
    showToast('Connecting to Google...', 'info');
    if (idToken && typeof idToken === 'string' && idToken.length > 20) {
      const res = await signInWithGoogleIdToken(idToken);
      if (!res.success) {
        showToast(res.error || 'Google Sign-In failed.', 'error');
      } else {
        await finishAuth(res.data.user);
      }
      return res;
    } else {
      const res = await signInWithGoogleOAuth('/client-portal');
      if (!res.success) {
        showToast(res.error || 'Google Sign-In failed.', 'error');
      }
      return res;
    }
  };

  const loginWithApple = async (idToken) => {
    showToast('Authenticating with Apple...', 'info');
    const res = await signInWithAppleIdToken(idToken);
    if (!res.success) {
      showToast(res.error || 'Apple Sign-In failed.', 'error');
    } else {
      await finishAuth(res.data.user);
    }
    return res;
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
    if (targetView === 'public') {
      setCurrentView('public');
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return;
    }
    if (targetView === 'customer') {
      if (isAuthenticated) {
        setCurrentView('customer');
        if (triggerOrderWizard) {
          openOrderWizard(initialData);
        } else if (typeof window !== 'undefined' && !window.location.pathname.includes('client')) {
          window.location.href = '/client-portal';
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
      if (isAuthenticated && authUser?.role === 'admin') {
        setCurrentView('admin');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('admin')) {
          window.location.href = '/admin-portal';
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
  const triggerEmailNotification = async (type, orderObj) => {
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          orderId: orderObj.id,
          clientEmail: orderObj.clientEmail,
          // adminEmail can be picked up by env variable on server side
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
        triggerEmailNotification('NEW_ORDER', fullOrderPayload);
        return fullOrderPayload;
      } catch (sbErr) {
        console.warn('Supabase create order notice:', sbErr);
      }
    }

    setOrders(prev => [fullOrderPayload, ...prev]);
    showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
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
        return {
          ...ord,
          status: newStatus,
          ...safeExtraData,
          payment_status: resolvedPayStatus,
          paymentStatus: resolvedPayStatus,
          history: [...(ord.history || []), { timestamp: new Date().toISOString(), label: `Status updated to ${newStatus}` }]
        };
      }
      return ord;
    }));

    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');

    // Trigger email based on new status
    if (targetOrder) {
      if (newStatus === 'delivered') {
        triggerEmailNotification('ORDER_DELIVERED', { ...targetOrder, ...safeExtraData });
      } else if (newStatus === 'completed') {
        triggerEmailNotification('ORDER_COMPLETED', { ...targetOrder, ...safeExtraData });
      }
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
    addNotification({
      title: 'Order Completed',
      message: `Order ${formatOrderId(orderId)} has been marked as complete.`,
      type: 'success'
    });
  };

  const addRevisionRequest = async (orderId, revisionNote) => {
    if (isSupabaseConfigured) {
      try {
        await addRevisionInSupabase(orderId, revisionNote, authUser?.name || 'Client');
        await updateOrderStatusInSupabase(orderId, 'revision');
      } catch (sbErr) {
        console.warn('Supabase add revision notice:', sbErr);
      }
    }

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'revision',
          updatedAt: new Date().toISOString(),
          revisions: [{ id: `rev-${Date.now()}`, notes: revisionNote, requestedBy: authUser?.name || 'Client', createdAt: new Date().toISOString() }, ...(ord.revisions || [])],
          history: [{ timestamp: new Date().toISOString(), label: `Revision Requested: "${revisionNote.slice(0, 35)}..."` }, ...ord.history]
        };
      }
      return ord;
    }));
    showToast(`Revision request sent for Order ${formatOrderId(orderId)}`, 'info');
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

  const deductWalletBalance = async (amount, orderId = null) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || walletBalance < num) return false;

    const res = await deductWalletViaApi(num, 'Studio Wallet Credit', orderId);
    if (res.success) {
      setWalletBalance(res.balance);
      if (orderId) {
        await updateOrderStatus(orderId, 'in_progress', { paymentStatus: 'paid', payment_status: 'paid' });
      }
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
        } catch (e) {}
      }

      return merged;
    });

    await saveCmsConfigToSupabase('site_settings', newSettings);
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

  const addAdminUser = async (name, email, _password) => {
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

    const res = await addAdminUserInSupabase(cleanName, cleanEmail, authUser.email);
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
      adminUsers, setAdminUsers, addAdminUser,
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
      selectedOrderForDrawer, setSelectedOrderForDrawer,
      isPricingSettingsOpen, setIsPricingSettingsOpen,
      walletBalance, setWalletBalance,
      isDepositModalOpen, setIsDepositModalOpen,
      depositFunds, deductWalletBalance,
      toast, showToast,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, unreadNotificationsCount,
      unreadChatCount, refreshUnreadChatCount,
      createOrder, updateOrderStatus, addRevisionRequest, addOrderMessage, cancelOrder,
      completeOrder, deleteOrder, ORDER_STATUSES, assignDigitizer
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
