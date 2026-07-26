import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS, INITIAL_CLIENTS, INITIAL_PRICING, DIGITIZERS, SERVICES, PORTFOLIO_SAMPLES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { 
  isSupabaseConfigured, 
  fetchOrdersFromSupabase, 
  createOrderInSupabase, 
  updateOrderStatusInSupabase, 
  addRevisionInSupabase,
  upsertClientInSupabase,
  fetchClientsFromSupabase,
  signInWithGoogleOAuth,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  depositFundsInSupabase,
  deductWalletInSupabase,
  fetchCmsConfigFromSupabase,
  saveCmsConfigToSupabase
} from '../services/supabaseService';

const StateContext = createContext();

export const formatOrderId = (rawId) => {
  if (!rawId) return '#3839';
  const cleanId = String(rawId).replace(/^(EMB-|VEC-)/i, '').replace(/^#/, '');
  return `#${cleanId}`;
};

const DEFAULT_SITE_SETTINGS = {
  siteTitle: 'B Digitizing & Vector Studio',
  supportEmail: 'orders@bdigitizing.pro',
  contactPhone: '+1 (800) 555-DIGI',
  bannerNotice: '⚡ 4-Hour Express Turnaround Available | Guaranteed Commercial Quality',
  operationalStatus: 'Online & Processing',
  currencySymbol: '$'
};

const DEFAULT_PRICING_CARDS = [
  {
    id: 'pcard-basic',
    category: 'embroidery',
    title: 'Basic Digitizing',
    rate: 'Starting from $5.00',
    unit: 'Ideal for simple left chest / small logos',
    badge: 'ESSENTIAL',
    popular: false,
    features: [
      'Standard turnaround',
      '.DST / .PES machine files',
      'Essential stitch paths & underlay'
    ]
  },
  {
    id: 'pcard-standard',
    category: 'embroidery',
    title: 'Standard Digitizing',
    rate: 'Starting from $10.00',
    unit: 'Ideal for standard left chest & caps',
    badge: 'MOST POPULAR',
    popular: true,
    features: [
      '4-Hour Express Available',
      'Free native .EMB source files',
      '100% Free Unlimited Revisions'
    ]
  },
  {
    id: 'pcard-premium',
    category: 'embroidery',
    title: 'Premium Digitizing',
    rate: 'Starting from $20.00',
    unit: 'Ideal for Jacket Backs & Large Crests',
    badge: 'VIP & COMPLEX',
    popular: false,
    highlight: true,
    features: [
      '3D Puff Cap density pathing',
      'Jacket back high stitch count verification',
      '24/7 Priority studio support'
    ]
  }
];

const DEFAULT_PATCH_CARDS = [
  {
    id: 'patch-basic',
    title: 'Basic Woven Patches',
    rate: 'Starting from $1.50 / patch',
    unit: 'Ideal for simple logos and bulk orders',
    badge: 'ESSENTIAL',
    popular: false,
    features: [
      'Flat stitched edge detail',
      'Iron-on backing',
      'Ideal for simple logos & high-volume bulk runs',
      'Standard 7-10 day studio turnaround'
    ]
  },
  {
    id: 'patch-standard',
    title: 'Standard Embroidered Patches',
    rate: 'Starting from $2.50 / patch',
    unit: '3D raised thread texture & merrowed border',
    badge: 'MOST POPULAR',
    popular: true,
    features: [
      'Classic merrowed border edges',
      '3D raised thread texture',
      'Velcro or heat-seal backing options',
      'Free pre-production digital proof'
    ]
  },
  {
    id: 'patch-premium',
    title: 'Premium 3D PVC & Leather Patches',
    rate: 'Starting from $3.50 / patch',
    unit: 'Waterproof 3D molded PVC or genuine leather',
    badge: 'LUXURY & PVC',
    popular: false,
    highlight: true,
    features: [
      'High-durability waterproof PVC or genuine leather',
      'Laser-cut precision border outlines',
      'Tactical velcro or adhesive mounting',
      'VIP priority production'
    ]
  }
];

const DEFAULT_STORE_PRODUCTS = [
  {
    id: 'store-tshirt-1',
    category: 'tshirts',
    title: 'Custom Embroidered Heavyweight T-Shirt',
    price: '$12.99',
    unit: 'per shirt',
    minQuantity: 10,
    badge: 'Bestseller',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    description: '100% Ring-spun cotton tees customized with your logo in high-density embroidery.',
    sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['Navy Blue', 'Classic Black', 'Pure White', 'Heather Gray'],
    features: [
      'Heavyweight 220 GSM 100% Cotton',
      'Up to 10,000 stitches left chest embroidery',
      'Free pre-production sew-out proof',
      'Individual poly-bagged & retail folded'
    ]
  },
  {
    id: 'store-tshirt-2',
    category: 'tshirts',
    title: 'Performance Athletic Polo & Sport Tee',
    price: '$16.50',
    unit: 'per shirt',
    minQuantity: 5,
    badge: 'Moisture Wicking',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    description: 'Breathable dry-fit polyester performance polos ideal for staff uniforms & corporate teams.',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    colors: ['Royal Blue', 'Charcoal', 'Forest Green'],
    features: [
      '100% Micro-polyester UV protection',
      'Precision collar & sleeve embroidery',
      'Wrinkle & stain resistant fabric',
      '5-7 day express shipping'
    ]
  },
  {
    id: 'store-patch-1',
    category: 'patches',
    title: 'Custom Merrowed Embroidered Patches',
    price: '$2.50',
    unit: '/ patch',
    minQuantity: 10,
    badge: 'Popular Emblem',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    description: 'Classic merrowed border custom embroidered patches with heat-seal or velcro backing.',
    sizes: ['2" Round', '3" Circle', '4" Shield', 'Custom Shape'],
    colors: ['Velcro Backing', 'Iron-On', 'Sew-On'],
    features: [
      '3D raised thread texture detail',
      '100% High-durability rayon thread',
      'Merrowed border overlock edge',
      'Free digital proof before production'
    ]
  },
  {
    id: 'store-patch-2',
    category: 'patches',
    title: 'Tactical 3D Molded PVC & Rubber Patches',
    price: '$3.50',
    unit: '/ patch',
    minQuantity: 10,
    badge: 'Tactical & Durable',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    description: 'Weatherproof 3D molded PVC rubber patches designed for military, police & outdoor gear.',
    sizes: ['3" Tactical Oval', '4" Rectangular', 'Custom Die-Cut'],
    colors: ['Coyote Tan', 'Tactical Black', 'OD Green'],
    features: [
      '100% Waterproof & UV fade proof',
      'Tactical hook & loop velcro backing',
      'Deep 3D dimension molded layers',
      'VIP priority production'
    ]
  },
  {
    id: 'store-cap-1',
    category: 'caps',
    title: 'Custom 3D Puff Embroidered Snapback Cap',
    price: '$9.99',
    unit: '/ hat',
    minQuantity: 12,
    badge: 'High Density 3D',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    description: '6-Panel structured snapback caps customized with 3D foam raised embroidery.',
    sizes: ['One Size Fits All (Adjustable)'],
    colors: ['Black / Red Peak', 'Navy / White', 'All Black'],
    features: [
      '3D Raised foam puff embroidery',
      'Structured 6-panel premium twill',
      'Curved or flat visor options',
      'Side & back custom text included'
    ]
  },
  {
    id: 'store-vector-1',
    category: 'vector',
    title: 'Vector Art + Digitizing Master Bundle',
    price: '$15.00',
    unit: 'Flat rate',
    minQuantity: 1,
    badge: 'Digital Master',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
    description: 'Complete logo restoration bundle including vector files (AI, EPS, SVG) + machine stitch files (.EMB, .DST).',
    sizes: ['All Standard Machine Formats'],
    colors: ['Full Color Separation'],
    features: [
      'Clean node vector reconstruction',
      'All embroidery machine formats (.DST, .PES, .EMB)',
      'Free color separation for screen printing',
      '2-4 Hour express rush turnaround'
    ]
  }
];


export const StateProvider = ({ children }) => {
  // Navigation & Authentication state
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('bdigi_current_view') || 'public';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('bdigi_is_auth') === 'true';
  });

  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('bdigi_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // login | register
  const [authModalTarget, setAuthModalTarget] = useState('customer'); // customer | admin

  // Orders list: Managed via local storage persistence, state & live Supabase DB sync
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_orders');
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch (_) {
      return INITIAL_ORDERS;
    }
  });

  // Clients list with local storage persistence & Supabase sync
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_clients');
      return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
    } catch (_) {
      return INITIAL_CLIENTS;
    }
  });

  // Pricing rules
  const [pricing, setPricing] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_pricing');
      return saved ? JSON.parse(saved) : INITIAL_PRICING;
    } catch (_) {
      return INITIAL_PRICING;
    }
  });

  // Landing Page Pricing Cards (CMS state)
  const [pricingCards, setPricingCards] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_pricing_cards');
      return saved ? JSON.parse(saved) : DEFAULT_PRICING_CARDS;
    } catch (_) {
      return DEFAULT_PRICING_CARDS;
    }
  });

  // Landing Page Before/After Portfolio Showcase (CMS state)
  const [portfolioSamples, setPortfolioSamples] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_portfolio_samples');
      return saved ? JSON.parse(saved) : (PORTFOLIO_SAMPLES || []);
    } catch (_) {
      return PORTFOLIO_SAMPLES || [];
    }
  });

// Default Customer Sew-Outs Gallery Cards
const DEFAULT_SEW_OUTS = [
  {
    id: 'sewout-1',
    title: 'Logo Digitizing (Cap Embroidery)',
    category: 'Cap & Snapback Logo',
    beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '8,400 Stitches',
    formats: 'DST, PES, EMB, EXP',
    features: ['Center-out cap pathing', '3D foam raised thread depth', 'Zero needle breaks']
  },
  {
    id: 'sewout-2',
    title: 'Live Graphic Image Digitizing',
    category: 'Complex Artwork & Emblems',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '14,200 Stitches',
    formats: 'DST, PES, JEF, HUS',
    features: ['High-density tatami fill', 'Precision color blending', 'Clean outline satin borders']
  },
  {
    id: 'sewout-3',
    title: 'Left Chest Digitizing (Polo & Apparel)',
    category: 'Corporate Uniform Logo',
    beforeImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    afterImg: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    stitchCount: '6,800 Stitches',
    formats: 'DST, PES, EMB, VP3',
    features: ['Knit fabric pull compensation', 'Smooth Underlay foundation', 'Zero puckering guaranteed']
  }
];

  // Customer Sew-Outs Showcase Items (CMS State)
  const [sewOuts, setSewOuts] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_sew_outs');
      return saved ? JSON.parse(saved) : DEFAULT_SEW_OUTS;
    } catch (_) {
      return DEFAULT_SEW_OUTS;
    }
  });

  const updateSewOuts = async (newItems) => {
    setSewOuts(newItems);
    safeSetStorage('bdigi_sew_outs', JSON.stringify(newItems));
    await saveCmsConfigToSupabase('sew_outs', newItems);
  };

  // Landing Page Custom Patches Tiers (CMS state)
  const [patchCards, setPatchCards] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_patch_cards');
      return saved ? JSON.parse(saved) : DEFAULT_PATCH_CARDS;
    } catch (_) {
      return DEFAULT_PATCH_CARDS;
    }
  });

  // Store Merchandise Products Catalog (CMS State)
  const [storeProducts, setStoreProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_store_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter(item => {
          const t = (item.title || '').toLowerCase();
          return !t.includes('bilal') && !t.includes('shahid') && !t.includes('test') && !t.includes('new custom merchandise');
        });
        if (cleaned.length > 0) return cleaned;
      }
      return DEFAULT_STORE_PRODUCTS;
    } catch (_) {
      return DEFAULT_STORE_PRODUCTS;
    }
  });

  // Public Services List (CMS state)
  const [servicesList, setServicesList] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_services');
      return saved ? JSON.parse(saved) : SERVICES;
    } catch (_) {
      return SERVICES;
    }
  });

  // Site Settings & Contact Meta (CMS state)
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_site_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SITE_SETTINGS;
    } catch (_) {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  // Staff digitizers
  const [digitizers] = useState(DIGITIZERS);

  // Wallet & Deposit Credit State
  const [walletBalance, setWalletBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('bdigi_wallet_balance');
      return saved !== null ? parseFloat(saved) : 150.00;
    } catch (_) {
      return 150.00;
    }
  });

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bdigi_wallet_balance', walletBalance.toString());
    } catch (_) {}
  }, [walletBalance]);

  const depositFunds = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;
    setWalletBalance(prev => prev + num);
    showToast(`Successfully deposited $${num.toFixed(2)} to your studio wallet via BoltPayouts!`, 'success');

    // Update in-memory clients array state
    if (authUser?.email) {
      setClients(prev => prev.map(c => {
        if (c.email?.toLowerCase().trim() === authUser.email.toLowerCase().trim()) {
          return { ...c, walletBalance: (parseFloat(c.walletBalance || 0) + num) };
        }
        return c;
      }));
    }

    if (isSupabaseConfigured && authUser?.email) {
      depositFundsInSupabase(authUser.email, num, 'BoltPayouts Gateway');
    }
    return true;
  };

  const deductWalletBalance = (amount, orderId = '') => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || walletBalance < num) return false;
    setWalletBalance(prev => prev - num);

    if (isSupabaseConfigured && authUser?.email) {
      deductWalletInSupabase(authUser.email, num, orderId);
    }
    return true;
  };

  // UI Modals & Drawers
  const [isOrderWizardOpen, setIsOrderWizardOpen] = useState(false);
  const [isStoreOrderModalOpen, setIsStoreOrderModalOpen] = useState(false);
  const [selectedStoreItem, setSelectedStoreItem] = useState(null);
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState(null);
  const [isPricingSettingsOpen, setIsPricingSettingsOpen] = useState(false);

  const openStoreOrderModal = (item) => {
    setSelectedStoreItem(item);
    setIsStoreOrderModalOpen(true);
  };

  // Toast notifications
  const [toast, setToast] = useState(null);

  // Safe localStorage helper to catch quota exceptions
  const safeSetStorage = (key, val) => {
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (err) {
      console.warn(`localStorage quota exceeded for ${key}, clearing legacy caches.`, err);
      try { localStorage.removeItem('bdigi_orders'); } catch (_) {}
    }
  };

  // Synchronize orders, client profiles, and CMS site config with Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchOrdersFromSupabase().then(remoteOrders => {
        if (remoteOrders && remoteOrders.length > 0) {
          setOrders(remoteOrders);
        }
      });

      fetchClientsFromSupabase().then(remoteClients => {
        if (remoteClients && remoteClients.length > 0) {
          setClients(remoteClients);
        }
      });

      // Helper to filter out dummy/test products
      const sanitizeProducts = (prods) => {
        if (!Array.isArray(prods)) return DEFAULT_STORE_PRODUCTS;
        const cleaned = prods.filter(item => {
          const t = (item.title || '').toLowerCase();
          return !t.includes('bilal') && !t.includes('shahid') && !t.includes('test') && !t.includes('new custom merchandise');
        });
        return cleaned.length > 0 ? cleaned : DEFAULT_STORE_PRODUCTS;
      };

      // Fetch CMS Config (Pricing, Pricing Cards, Patch Cards, Store Products, Portfolio Samples, Services & Site Settings) from Database
      fetchCmsConfigFromSupabase().then(cmsConfig => {
        if (cmsConfig) {
          if (cmsConfig.pricing) setPricing(cmsConfig.pricing);
          if (cmsConfig.pricing_cards) setPricingCards(cmsConfig.pricing_cards);
          if (cmsConfig.patch_cards) setPatchCards(cmsConfig.patch_cards);
          if (cmsConfig.store_products) setStoreProducts(sanitizeProducts(cmsConfig.store_products));
          if (cmsConfig.portfolio_samples) setPortfolioSamples(cmsConfig.portfolio_samples);

          if (cmsConfig.sew_outs) setSewOuts(cmsConfig.sew_outs);
          if (cmsConfig.services) setServicesList(cmsConfig.services);
          if (cmsConfig.site_settings) setSiteSettings(cmsConfig.site_settings);
        }
      });

      // Subscribe to Real-Time Database Changes via Supabase Channels
      try {
        const ordersChannel = supabase
          .channel('orders_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            async () => {
              console.log('[Real-time] Detected Supabase orders table change, refreshing orders queue...');
              const freshOrders = await fetchOrdersFromSupabase();
              if (freshOrders && freshOrders.length > 0) {
                setOrders(freshOrders);
              }
            }
          )
          .subscribe();

        const channel = supabase
          .channel('cms_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'site_config' },
            (payload) => {
              const { new: newRow } = payload || {};
              if (newRow && newRow.key) {
                if (newRow.key === 'pricing') setPricing(newRow.value);
                if (newRow.key === 'pricing_cards') setPricingCards(newRow.value);
                if (newRow.key === 'patch_cards') setPatchCards(newRow.value);
                if (newRow.key === 'store_products') setStoreProducts(sanitizeProducts(newRow.value));
                if (newRow.key === 'portfolio_samples') setPortfolioSamples(newRow.value);

                if (newRow.key === 'sew_outs') setSewOuts(newRow.value);
                if (newRow.key === 'services') setServicesList(newRow.value);
                if (newRow.key === 'site_settings') setSiteSettings(newRow.value);
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(ordersChannel);
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.warn('Real-time subscription notice:', err);
      }
    }
  }, []);

  // Supabase Auth Session Persistence & onAuthStateChange Listener
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Initial Session Check on App Load
    const checkSupabaseSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const u = session.user;
          const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
          const company = u.user_metadata?.company_name || u.user_metadata?.company || `${name}'s Apparel`;
          const role = u.email === 'shahidbutt59191@gmail.com' ? 'admin' : 'customer';

          const userData = {
            name,
            email: u.email,
            company,
            role
          };

          setAuthUser(userData);
          setIsAuthenticated(true);
          safeSetStorage('bdigi_is_auth', 'true');
          safeSetStorage('bdigi_auth_user', userData);
        }
      } catch (err) {
        console.warn('Supabase getSession check notice:', err);
      }
    };

    checkSupabaseSession();

    // 2. Real-time Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session && session.user) {
          const u = session.user;
          const name = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0];
          const company = u.user_metadata?.company_name || u.user_metadata?.company || `${name}'s Apparel`;
          const role = u.email === 'shahidbutt59191@gmail.com' ? 'admin' : 'customer';

          const userData = {
            name,
            email: u.email,
            company,
            role
          };

          setAuthUser(userData);
          setIsAuthenticated(true);
          safeSetStorage('bdigi_is_auth', 'true');
          safeSetStorage('bdigi_auth_user', userData);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setAuthUser(null);
        safeSetStorage('bdigi_is_auth', 'false');
        safeSetStorage('bdigi_auth_user', null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    safeSetStorage('bdigi_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    safeSetStorage('bdigi_is_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    safeSetStorage('bdigi_auth_user', authUser);
  }, [authUser]);

  useEffect(() => {
    const syncAuthStorage = (e) => {
      if (e.key === 'bdigi_is_auth') {
        setIsAuthenticated(e.newValue === 'true');
      }
      if (e.key === 'bdigi_auth_user') {
        try {
          setAuthUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch (_) {}
      }
      if (e.key === 'bdigi_current_view') {
        setCurrentView(e.newValue || 'public');
      }
      if (e.key === 'bdigi_orders') {
        try {
          if (e.newValue) setOrders(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };
    window.addEventListener('storage', syncAuthStorage);
    return () => window.removeEventListener('storage', syncAuthStorage);
  }, []);

  useEffect(() => {
    safeSetStorage('bdigi_orders', orders);
  }, [orders]);

  useEffect(() => {
    safeSetStorage('bdigi_clients', clients);
  }, [clients]);

  useEffect(() => {
    safeSetStorage('bdigi_pricing', pricing);
  }, [pricing]);

  useEffect(() => {
    safeSetStorage('bdigi_pricing_cards', pricingCards);
  }, [pricingCards]);

  useEffect(() => {
    safeSetStorage('bdigi_patch_cards', patchCards);
  }, [patchCards]);

  useEffect(() => {
    safeSetStorage('bdigi_store_products', storeProducts);
  }, [storeProducts]);

  useEffect(() => {
    safeSetStorage('bdigi_portfolio_samples', portfolioSamples);
  }, [portfolioSamples]);

  useEffect(() => {
    safeSetStorage('bdigi_services', servicesList);
  }, [servicesList]);

  useEffect(() => {
    safeSetStorage('bdigi_site_settings', siteSettings);
  }, [siteSettings]);

  const updatePricing = (newPricing) => {
    const updated = { ...pricing, ...newPricing };
    setPricing(updated);
    showToast('Pricing rates updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('pricing', updated);
    }
  };

  const updatePricingCards = (newCards) => {
    setPricingCards(newCards);
    showToast('Public pricing cards updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('pricing_cards', newCards);
    }
  };

  const updatePatchCards = (newCards) => {
    setPatchCards(newCards);
    showToast('Custom patches pricing tiers updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('patch_cards', newCards);
    }
  };

  const updateStoreProducts = (newProducts) => {
    setStoreProducts(newProducts);
    showToast('Store merchandise catalog updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('store_products', newProducts);
    }
  };

  const updatePortfolioSamples = (newSamples) => {
    setPortfolioSamples(newSamples);
    showToast('Before & After portfolio showcase updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('portfolio_samples', newSamples);
    }
  };

  const updateServicesList = (newServices) => {
    setServicesList(newServices);
    showToast('Public services list updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('services', newServices);
    }
  };

  const updateSiteSettings = (newSettings) => {
    const updated = { ...siteSettings, ...newSettings };
    setSiteSettings(updated);
    showToast('Site contact & settings updated and published live!', 'success');
    if (isSupabaseConfigured) {
      saveCmsConfigToSupabase('site_settings', updated);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Auth Operations
  const login = async (email, password, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    // 1. HARDCODED MASTER ADMIN AUTHENTICATION
    if (cleanEmail === 'shahidbutt59191@gmail.com') {
      if (cleanPass === 'shahid123@$') {
        const adminUserData = {
          name: 'Shahid Butt',
          email: 'shahidbutt59191@gmail.com',
          company: 'BDIGITIZING.PRO HQ',
          role: 'admin'
        };
        setAuthUser(adminUserData);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setCurrentView('admin');
        showToast('Welcome Master Administrator Shahid Butt! Administrative Access Granted.', 'success');
        return { success: true, role: 'admin' };
      } else {
        return { success: false, error: 'Invalid master administrator password key.' };
      }
    }

    // 2. CLIENT AUTHENTICATION VALIDATION (Supabase & Table check)
    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please fill in both email and password.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    // Async Supabase Auth check
    const authResult = await signInWithSupabaseAuth(cleanEmail, cleanPass);
    if (authResult && !authResult.success) {
      return { success: false, error: authResult.error || 'Invalid email or password combination. Please verify your credentials.' };
    }

    const userName = authResult?.user?.name || cleanEmail.split('@')[0].toUpperCase();
    const userCompany = authResult?.user?.company || `${userName} Apparel`;

    const userData = {
      name: userName,
      email: cleanEmail,
      company: userCompany,
      role: 'customer'
    };

    setAuthUser(userData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    safeSetStorage('bdigi_is_auth', 'true');
    safeSetStorage('bdigi_auth_user', userData);

    if (role === 'admin') {
      setCurrentView('admin');
      safeSetStorage('bdigi_current_view', 'admin');
      showToast('Admin Operations Portal Session Initialized', 'info');
      return { success: true, role: 'admin' };
    } else {
      setCurrentView('customer');
      safeSetStorage('bdigi_current_view', 'customer');
      showToast('Welcome to your Client Portal Dashboard!', 'success');
      upsertClientInSupabase(userData);
      return { success: true, role: 'customer' };
    }
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      const res = await signInWithGoogleOAuth();
      if (res && res.success) {
        return { success: true };
      }
    }

    // Demo fallback for Google social authentication
    const googleUserData = {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@gmail.com',
      company: 'Apex Apparel (Google Auth)',
      role: 'customer'
    };

    setAuthUser(googleUserData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('customer');
    showToast('Signed in with Google successfully!', 'success');
    upsertClientInSupabase(googleUserData);
    return { success: true, role: 'customer' };
  };

  const register = async (name, email, password, company, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (company || '').trim() || `${cleanName}'s Custom Apparel`;

    if (!cleanEmail || !cleanName) {
      return { success: false, error: 'Please enter your full name and email address.' };
    }

    // Check existing clients list for duplicate email
    const existingClient = clients.find(c => c.email.toLowerCase() === cleanEmail);
    if (existingClient) {
      return { 
        success: false, 
        error: 'An account with this email already exists. Please sign in instead.' 
      };
    }

    // Try Supabase auth signup if Supabase is configured
    if (isSupabaseConfigured) {
      const authRes = await signUpWithSupabaseAuth(cleanName, cleanEmail, password, cleanCompany);
      if (authRes && !authRes.success) {
        if (authRes.error?.toLowerCase().includes('already registered') || authRes.error?.toLowerCase().includes('already exists')) {
          return { 
            success: false, 
            error: 'An account with this email already exists. Please sign in instead.' 
          };
        }
        return { success: false, error: authRes.error || 'Registration failed. Please try again.' };
      }
    }

    const newUserData = {
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      role: role || 'customer'
    };

    setAuthUser(newUserData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    safeSetStorage('bdigi_is_auth', 'true');
    safeSetStorage('bdigi_auth_user', newUserData);

    if (role === 'customer' || !role) {
      setClients(prev => [
        {
          id: `client-${Date.now()}`,
          name: cleanName,
          company: cleanCompany,
          email: cleanEmail,
          totalOrders: 0,
          totalSpent: 0,
          tier: 'Standard Client'
        },
        ...prev
      ]);
      upsertClientInSupabase(newUserData);
    }

    const targetView = role === 'admin' ? 'admin' : 'customer';
    setCurrentView(targetView);
    safeSetStorage('bdigi_current_view', targetView);
    showToast(`Account created successfully! Welcome ${cleanName}.`, 'success');
    return { success: true, role: targetView };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    try {
      localStorage.removeItem('bdigi_is_auth');
      localStorage.removeItem('bdigi_auth_user');
      localStorage.setItem('bdigi_current_view', 'public');
    } catch (_) {}
    setCurrentView('public');
    showToast('You have been logged out safely.', 'info');
  };

  // Protected Route Navigation Handler
  const protectedNavigate = (targetView, triggerOrderWizard = false) => {
    if (targetView === 'public') {
      setCurrentView('public');
      return;
    }

    if (targetView === 'customer') {
      if (isAuthenticated) {
        setCurrentView('customer');
        if (triggerOrderWizard) setIsOrderWizardOpen(true);
      } else {
        setAuthModalTarget('customer');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        showToast('Please log in to access the Client Portal', 'warning');
      }
      return;
    }

    if (targetView === 'admin') {
      const isMasterAdmin = isAuthenticated && authUser?.email?.toLowerCase().trim() === 'shahidbutt59191@gmail.com';
      if (isMasterAdmin) {
        setCurrentView('admin');
      } else {
        showToast('Access Restricted: Only Master Admin shahidbutt59191@gmail.com can access System Operations.', 'warning');
        if (isAuthenticated) {
          setCurrentView('customer');
        } else {
          setAuthModalTarget('admin');
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }
      }
      return;
    }
  };

  // Order Operations
  const createOrder = async (newOrderData) => {
    const orderId = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = {
      id: orderId,
      ...newOrderData,
      clientName: authUser?.company || authUser?.name || 'Apex Athletics Apparel',
      clientEmail: authUser?.email || 'sarah@apexapparel.com',
      clientId: authUser?.email || 'sarah@apexapparel.com',
      createdAt: new Date().toISOString(),
      status: 'submitted',
      assignedDigitizerId: null,
      outputFileUrl: null,
      history: [
        { timestamp: new Date().toISOString(), label: `Order Submitted by ${authUser?.name || 'Client'}` }
      ],
      revisions: []
    };

    console.log('[Order Creation] Submitting order payload:', newOrder.id, newOrder);

    // Optimistically update React state for instant UI re-render
    setOrders(prev => [newOrder, ...prev]);

    // Update clients roster counts
    setClients(prev => prev.map(cli => {
      if (cli.email?.toLowerCase() === newOrder.clientEmail?.toLowerCase()) {
        return {
          ...cli,
          totalOrders: (cli.totalOrders || 0) + 1,
          totalSpent: (cli.totalSpent || 0) + (parseFloat(newOrder.price) || 0)
        };
      }
      return cli;
    }));

    showToast(`Order ${formatOrderId(orderId)} created successfully!`, 'success');

    // Async Supabase Sync
    try {
      const res = await createOrderInSupabase(newOrder);
      console.log('[Order Creation] Supabase order insertion result:', res);
      if (res && res.artworkUrl) {
        setOrders(prev => prev.map(ord => {
          if (ord.id === orderId) {
            return {
              ...ord,
              artworkUrl: res.artworkUrl,
              image_url: res.artworkUrl,
              logo: res.artworkUrl,
              file_url: res.artworkUrl
            };
          }
          return ord;
        }));
      }
    } catch (err) {
      console.error('[Order Creation] Error inserting order in Supabase:', err);
    }

    // Sync client profile and increment order count in Supabase
    try {
      await upsertClientInSupabase({
        name: authUser?.name || newOrder.clientName,
        email: authUser?.email || newOrder.clientEmail,
        company: authUser?.company || newOrder.clientName,
        incrementOrder: true
      });
    } catch (err) {
      console.warn('[Order Creation] Client profile sync warning:', err);
    }

    return newOrder;
  };

  const assignDigitizer = (orderId, digitizerId) => {
    const digitizer = digitizers.find(d => d.id === digitizerId);
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const nextStatus = ord.status === 'submitted' ? 'assigned' : ord.status;
        return {
          ...ord,
          assignedDigitizerId: digitizerId,
          status: nextStatus,
          history: [
            ...ord.history,
            { 
              timestamp: new Date().toISOString(), 
              label: `Assigned to Digitizer: ${digitizer ? digitizer.name : 'Staff'}` 
            }
          ]
        };
      }
      return ord;
    }));
    showToast(`Order ${formatOrderId(orderId)} assigned to ${digitizer?.name || 'Digitizer'}`, 'info');
  };

  const updateOrderStatus = (orderId, newStatus, extraData = {}) => {
    let updatedOrderObj = null;

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const statusLabels = {
          submitted: 'Order Status reset to Submitted',
          assigned: 'Order Status set to Assigned',
          digitizing: 'Digitizing & Pathing work in progress',
          qc: 'Quality Control Stitch Simulation Passed',
          completed: 'Completed files released to Client'
        };

        const updatedHistory = [
          ...ord.history,
          { timestamp: new Date().toISOString(), label: statusLabels[newStatus] || `Status updated to ${newStatus}` }
        ];

        updatedOrderObj = {
          ...ord,
          status: newStatus,
          ...extraData,
          history: updatedHistory
        };

        return updatedOrderObj;
      }
      return ord;
    }));

    if (selectedOrderForDrawer && selectedOrderForDrawer.id === orderId && updatedOrderObj) {
      setSelectedOrderForDrawer(updatedOrderObj);
    }

    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');

    // Async Supabase Sync
    updateOrderStatusInSupabase(orderId, newStatus, extraData);
  };

  const addRevisionRequest = (orderId, revisionNote, attachment = null) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        const newRev = {
          id: `rev-${Date.now()}`,
          createdAt: new Date().toISOString(),
          requestedBy: authUser?.name || 'Client',
          note: revisionNote,
          attachment
        };

        return {
          ...ord,
          status: 'digitizing', // Send back to digitizing on revision
          revisions: [newRev, ...(ord.revisions || [])],
          history: [
            ...ord.history,
            { timestamp: new Date().toISOString(), label: `Revision Requested: "${revisionNote.slice(0, 30)}..."` }
          ]
        };
      }
      return ord;
    }));

    showToast(`Revision request sent for Order ${formatOrderId(orderId)}`, 'info');

    // Async Supabase Sync
    addRevisionInSupabase(orderId, revisionNote, authUser?.name || 'Client');
  };

  const resetAllData = () => {
    localStorage.removeItem('bdigi_orders');
    localStorage.removeItem('bdigi_clients');
    localStorage.removeItem('bdigi_pricing');
    setOrders(INITIAL_ORDERS);
    setClients(INITIAL_CLIENTS);
    setPricing(INITIAL_PRICING);
    showToast('Platform mock data & authentication reset', 'info');
  };

  return (
    <StateContext.Provider value={{
      currentView,
      setCurrentView,
      isAuthenticated,
      authUser: authUser,
      currentUser: authUser,
      login,
      loginWithGoogle,
      register,
      logout,
      protectedNavigate,
      isAuthModalOpen,
      setIsAuthModalOpen,
      authModalMode,
      setAuthModalMode,
      authModalTarget,
      setAuthModalTarget,
      orders,
      clients,
      pricing,
      setPricing,
      updatePricing,
      pricingCards,
      setPricingCards,
      updatePricingCards,
      patchCards,
      setPatchCards,
      updatePatchCards,
      storeProducts,
      setStoreProducts,
      updateStoreProducts,
      portfolioSamples,
      setPortfolioSamples,
      updatePortfolioSamples,

      sewOuts,
      setSewOuts,
      updateSewOuts,
      servicesList,
      setServicesList,
      updateServicesList,
      siteSettings,
      setSiteSettings,
      updateSiteSettings,
      digitizers,
      isOrderWizardOpen,
      setIsOrderWizardOpen,
      isStoreOrderModalOpen,
      setIsStoreOrderModalOpen,
      selectedStoreItem,
      setSelectedStoreItem,
      openStoreOrderModal,
      selectedOrderForDrawer,
      setSelectedOrderForDrawer,
      isPricingSettingsOpen,
      setIsPricingSettingsOpen,
      walletBalance,
      setWalletBalance,
      isDepositModalOpen,
      setIsDepositModalOpen,
      depositFunds,
      deductWalletBalance,
      toast,
      showToast,
      createOrder,
      assignDigitizer,
      updateOrderStatus,
      addRevisionRequest,
      resetAllData
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
