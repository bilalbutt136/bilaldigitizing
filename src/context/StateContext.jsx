'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_ORDERS, INITIAL_CLIENTS, INITIAL_PRICING, DIGITIZERS, SERVICES, PORTFOLIO_SAMPLES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import api from '../lib/api';
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
  currencySymbol: '$',
  adminEmail: 'shahidbutt59191@gmail.com'
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

export const StateProvider = ({ children }) => {
  // Navigation & Authentication state
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window === 'undefined') return 'public';
    return localStorage.getItem('bdigi_current_view') || 'public';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('bdigi_is_auth') === 'true';
  });

  const [authUser, setAuthUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('bdigi_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalTarget, setAuthModalTarget] = useState('customer');

  // Core Data Arrays
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [pricing, setPricing] = useState(INITIAL_PRICING);
  const [pricingCards, setPricingCards] = useState(DEFAULT_PRICING_CARDS);
  const [portfolioSamples, setPortfolioSamples] = useState(PORTFOLIO_SAMPLES);
  const [sewOuts, setSewOuts] = useState(DEFAULT_SEW_OUTS);
  const [patchCards, setPatchCards] = useState(DEFAULT_PATCH_CARDS);
  const [storeProducts, setStoreProducts] = useState(DEFAULT_STORE_PRODUCTS);
  const [servicesList, setServicesList] = useState(SERVICES);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [digitizers] = useState(DIGITIZERS);

  // Wallet & Modals State
  const [walletBalance, setWalletBalance] = useState(150.00);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isOrderWizardOpen, setIsOrderWizardOpen] = useState(false);
  const [orderWizardInitialData, setOrderWizardInitialData] = useState(null);
  const [isStoreOrderModalOpen, setIsStoreOrderModalOpen] = useState(false);
  const [selectedStoreItem, setSelectedStoreItem] = useState(null);
  const [selectedOrderForDrawer, setSelectedOrderForDrawer] = useState(null);
  const [isPricingSettingsOpen, setIsPricingSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Safe Local Storage Helper
  const safeSetStorage = (key, val) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (err) {
      console.warn(`localStorage warning for ${key}:`, err);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // 1. Fetch backend state on initial load via Express REST API
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [ordersRes, pricingRes, clientsRes, cmsRes] = await Promise.allSettled([
          api.get('/orders'),
          api.get('/pricing/config'),
          api.get('/clients'),
          api.get('/cms')
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.orders) {
          setOrders(ordersRes.value.data.orders);
        }
        if (pricingRes.status === 'fulfilled' && pricingRes.value.data?.pricing) {
          setPricing(pricingRes.value.data.pricing);
        }
        if (clientsRes.status === 'fulfilled' && clientsRes.value.data?.clients) {
          setClients(clientsRes.value.data.clients);
        }
        if (cmsRes.status === 'fulfilled' && cmsRes.value.data?.siteSettings) {
          setSiteSettings(cmsRes.value.data.siteSettings);
          if (cmsRes.value.data.portfolio) setPortfolioSamples(cmsRes.value.data.portfolio);
          if (cmsRes.value.data.storeItems) setStoreProducts(cmsRes.value.data.storeItems);
        }
      } catch (err) {
        console.warn('Express backend connection notice (using fallback local store):', err);
      }
    };

    loadBackendData();
  }, []);

  // Sync state changes with localStorage
  useEffect(() => { safeSetStorage('bdigi_current_view', currentView); }, [currentView]);
  useEffect(() => { safeSetStorage('bdigi_is_auth', String(isAuthenticated)); }, [isAuthenticated]);
  useEffect(() => { safeSetStorage('bdigi_auth_user', authUser); }, [authUser]);

  // Auth Operations with Node.js Express REST API integration
  const login = async (email, password, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    try {
      const res = await api.post('/auth/login', { email: cleanEmail, password: cleanPass, role });
      if (res.data && res.data.success && res.data.user) {
        const uData = res.data.user;
        setAuthUser(uData);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        if (uData.role === 'admin') {
          setCurrentView('admin');
          showToast(`Welcome Master Admin (${cleanEmail})`, 'success');
          return { success: true, role: 'admin' };
        } else {
          setCurrentView('customer');
          showToast('Welcome to your Client Portal Dashboard!', 'success');
          return { success: true, role: 'customer' };
        }
      }
    } catch (err) {
      console.warn('Express Auth fallback:', err);
    }

    // Local / Supabase Auth Fallback
    const configuredAdmin = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
    if (cleanEmail === configuredAdmin || cleanEmail === 'shahidbutt59191@gmail.com') {
      const adminUserData = { name: 'Master Admin', email: cleanEmail, company: 'B Digitizing Studio', role: 'admin' };
      setAuthUser(adminUserData);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setCurrentView('admin');
      showToast(`Welcome Master Admin (${cleanEmail})`, 'success');
      return { success: true, role: 'admin' };
    }

    const userData = { name: cleanEmail.split('@')[0], email: cleanEmail, company: `${cleanEmail.split('@')[0]} Apparel`, role: 'customer' };
    setAuthUser(userData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('customer');
    showToast('Signed in successfully!', 'success');
    return { success: true, role: 'customer' };
  };

  const loginWithGoogle = async () => {
    try {
      const res = await api.post('/auth/google', { email: 'google.user@gmail.com', name: 'Google Client' });
      if (res.data && res.data.user) {
        setAuthUser(res.data.user);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setCurrentView('customer');
        showToast('Signed in with Google successfully!', 'success');
        return { success: true, role: 'customer' };
      }
    } catch (err) {
      console.warn('Express Google auth fallback:', err);
    }
    const demoUser = { name: 'Sarah Jenkins', email: 'sarah.jenkins@gmail.com', company: 'Apex Apparel', role: 'customer' };
    setAuthUser(demoUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('customer');
    showToast('Signed in with Google successfully!', 'success');
    return { success: true, role: 'customer' };
  };

  const register = async (name, email, password, company, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (company || '').trim() || `${cleanName}'s Custom Apparel`;

    try {
      const res = await api.post('/auth/signup', { name: cleanName, email: cleanEmail, password, company: cleanCompany, role });
      if (res.data && res.data.user) {
        setAuthUser(res.data.user);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setCurrentView(role === 'admin' ? 'admin' : 'customer');
        showToast(`Account created successfully! Welcome ${cleanName}.`, 'success');
        return { success: true, role: role === 'admin' ? 'admin' : 'customer' };
      }
    } catch (err) {
      console.warn('Express Signup fallback:', err);
    }

    const newUserData = { name: cleanName, email: cleanEmail, company: cleanCompany, role: role || 'customer' };
    setAuthUser(newUserData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView(role === 'admin' ? 'admin' : 'customer');
    showToast(`Account created successfully! Welcome ${cleanName}.`, 'success');
    return { success: true, role: role === 'admin' ? 'admin' : 'customer' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    setCurrentView('public');
    showToast('You have been logged out safely.', 'info');
  };

  const protectedNavigate = (targetView, triggerOrderWizard = false, initialData = null) => {
    if (targetView === 'public') {
      setCurrentView('public');
      return;
    }
    if (targetView === 'customer') {
      if (isAuthenticated) {
        setCurrentView('customer');
        if (triggerOrderWizard) openOrderWizard(initialData);
      } else {
        setAuthModalTarget('customer');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
        showToast('Please log in to access the Client Portal', 'warning');
      }
      return;
    }
    if (targetView === 'admin') {
      if (isAuthenticated && (authUser?.role === 'admin' || authUser?.email === 'shahidbutt59191@gmail.com')) {
        setCurrentView('admin');
      } else {
        showToast('Access Restricted to Master Admin.', 'warning');
        setAuthModalTarget('admin');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      }
    }
  };

  // Order Operations connected to Express API
  const createOrder = async (newOrderData) => {
    try {
      const res = await api.post('/orders', {
        ...newOrderData,
        clientName: authUser?.name || 'Valued Client',
        clientEmail: authUser?.email || 'client@bdigitizing.pro'
      });
      if (res.data && res.data.order) {
        const created = res.data.order;
        setOrders(prev => [created, ...prev]);
        showToast(`Order ${formatOrderId(created.id)} created successfully!`, 'success');
        return created;
      }
    } catch (err) {
      console.warn('Express createOrder fallback:', err);
    }

    const localId = `#${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder = {
      id: localId,
      ...newOrderData,
      clientName: authUser?.company || authUser?.name || 'Apex Apparel',
      clientEmail: authUser?.email || 'sarah@apexapparel.com',
      createdAt: new Date().toISOString(),
      status: 'submitted',
      history: [{ timestamp: new Date().toISOString(), label: 'Order Submitted by Client' }],
      revisions: []
    };
    setOrders(prev => [newOrder, ...prev]);
    showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      const res = await api.patch(`/orders/${orderId.replace('#', '')}/status`, { status: newStatus, ...extraData });
      if (res.data && res.data.order) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data.order : o));
        showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');
        return;
      }
    } catch (err) {
      console.warn('Express updateOrderStatus fallback:', err);
    }

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: newStatus,
          ...extraData,
          history: [...ord.history, { timestamp: new Date().toISOString(), label: `Status updated to ${newStatus}` }]
        };
      }
      return ord;
    }));
    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const addRevisionRequest = async (orderId, revisionNote) => {
    try {
      const res = await api.post(`/orders/${orderId.replace('#', '')}/revisions`, { revisionNotes: revisionNote, clientName: authUser?.name || 'Client' });
      if (res.data && res.data.order) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data.order : o));
        showToast(`Revision request sent for Order ${formatOrderId(orderId)}`, 'info');
        return;
      }
    } catch (err) {
      console.warn('Express addRevision fallback:', err);
    }

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'digitizing',
          revisions: [{ id: `rev-${Date.now()}`, notes: revisionNote, requestedBy: authUser?.name || 'Client', createdAt: new Date().toISOString() }, ...(ord.revisions || [])]
        };
      }
      return ord;
    }));
    showToast(`Revision request sent for Order ${formatOrderId(orderId)}`, 'info');
  };

  const depositFunds = async (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return false;

    try {
      const res = await api.post('/clients/deposit', { email: authUser?.email || 'sarah@apexapparel.com', amount: num });
      if (res.data && res.data.newBalance !== undefined) {
        setWalletBalance(res.data.newBalance);
        showToast(`Successfully deposited $${num.toFixed(2)} to studio wallet!`, 'success');
        return true;
      }
    } catch (err) {
      console.warn('Express deposit funds fallback:', err);
    }

    setWalletBalance(prev => prev + num);
    showToast(`Successfully deposited $${num.toFixed(2)} to studio wallet!`, 'success');
    return true;
  };

  const deductWalletBalance = async (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || walletBalance < num) return false;

    try {
      const res = await api.post('/clients/deduct', { email: authUser?.email || 'sarah@apexapparel.com', amount: num });
      if (res.data && res.data.newBalance !== undefined) {
        setWalletBalance(res.data.newBalance);
        return true;
      }
    } catch (err) {
      console.warn('Express deduct wallet fallback:', err);
    }

    setWalletBalance(prev => prev - num);
    return true;
  };

  const openOrderWizard = (initialData = null) => {
    if (initialData !== undefined) setOrderWizardInitialData(initialData);
    setIsOrderWizardOpen(true);
  };

  const openStoreOrderModal = (item) => {
    setSelectedStoreItem(item);
    setIsStoreOrderModalOpen(true);
  };

  return (
    <StateContext.Provider value={{
      currentView, setCurrentView,
      isAuthenticated, setIsAuthenticated,
      authUser, currentUser: authUser,
      login, loginWithGoogle, register, logout, protectedNavigate,
      isAuthModalOpen, setIsAuthModalOpen,
      authModalMode, setAuthModalMode,
      authModalTarget, setAuthModalTarget,
      orders, setOrders,
      clients, setClients,
      pricing, setPricing,
      pricingCards, setPricingCards,
      patchCards, setPatchCards,
      storeProducts, setStoreProducts,
      portfolioSamples, setPortfolioSamples,
      sewOuts, setSewOuts,
      servicesList, setServicesList,
      siteSettings, setSiteSettings,
      digitizers,
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
      createOrder, updateOrderStatus, addRevisionRequest
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
