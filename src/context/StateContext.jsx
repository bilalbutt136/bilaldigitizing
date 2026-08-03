'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRICING, DIGITIZERS, SERVICES, PORTFOLIO_SAMPLES, DEFAULT_HERO_SLIDES } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase/client';
import {
  createOrderInSupabase,
  updateOrderStatusInSupabase,
  addRevisionInSupabase,
  upsertClientInSupabase,
  signInWithGoogleIdToken,
  signInWithAppleIdToken,
  signInWithSupabaseAuth,
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
  depositWalletViaApi,
  deductWalletViaApi,
  fetchWalletBalanceFromSupabase
} from '../services/supabaseService';
import { playNotificationSound } from '../utils/audioNotification';

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

const DEFAULT_SERVICE_CMS_CONTENT = {
  embroidery: {
    hero: {
      title: 'Commercial Embroidery Digitizing',
      highlight: '100% Guaranteed',
      subtext: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.',
      badge: 'STARTS $10.00',
      primaryCta: 'Upload Embroidery Design',
      secondaryCta: 'View Digitizing Rates',
      trustPoints: [
        { title: '100% Manual Digitizing', sub: 'Master digitizers, zero auto-trace' },
        { title: 'Free Revisions Included', sub: '100% satisfaction guaranteed' },
        { title: 'Machine-Ready Formats', sub: 'DST, PES, EXP, EMB, JEF' },
        { title: 'Super Fast 4-12 Hrs Delivery', sub: '24/7 express rush processing' }
      ]
    },
    showcase: {
      title: 'Embroidery Sew-Outs & Stitch Quality Showcase',
      subtext: 'Real commercial embroidery sew-outs produced on Tajima, Brother, and Barudan multi-head industrial machines.',
      samples: [
        { id: 'emb-s1', title: 'Golden Eagle Sports Polo', category: 'Left Chest', stitches: '12,450 Stitches', colors: '5 Madeira Colors', fabric: 'Pique Cotton Polo', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s2', title: 'Tactical Flexfit Cap Front', category: '3D Puff Cap', stitches: '15,800 Stitches', colors: '2 Colors (3mm Foam)', fabric: 'Structured Wool Cap', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s3', title: 'Heritage Apparel Jacket Crest', category: 'Jacket Back', stitches: '48,200 Stitches', colors: '8 Madeira Colors', fabric: 'Heavy Leather & Canvas', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    workflow: {
      title: 'How It Works: Embroidery Digitizing Workflow',
      subtext: 'From initial logo upload to machine-ready stitch file delivery in 4 simple steps.',
      steps: [
        { step: '01', title: 'Upload Raster / Vector Logo', desc: 'Submit your logo file and specify target fabric type (polo, cap, hoodie) and required dimensions.' },
        { step: '02', title: 'Manual Pathing & Density Mapping', desc: 'Master digitizers set Wilcom underlay density, satin stitch directions, and fabric pull compensation.' },
        { step: '03', title: 'Virtual Stitch Simulation & Testing', desc: 'Every machine file undergoes pathing simulation to guarantee zero thread trims and zero needle breaks.' },
        { step: '04', title: 'Instant Download & Free Revisions', desc: 'Download production-ready machine files (.DST, .PES, .EMB) with 100% free unlimited revisions.' }
      ]
    }
  },
  vector: {
    hero: {
      title: 'Raster to Scalable Vector Redraw',
      highlight: 'Hand-Traced Vector',
      subtext: 'Transform pixelated JPEGs, PNGs, and hand sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF) with Pantone spot color separation.',
      badge: 'STARTS $15.00 FLAT',
      primaryCta: 'Upload Artwork for Vectoring',
      secondaryCta: 'View Vector Rates',
      trustPoints: [
        { title: '100% Hand-Drawn Node Paths', sub: 'Clean vectors for printing & cutting' },
        { title: 'Pantone Spot Color Separation', sub: 'Screen printing & vinyl cut ready' },
        { title: 'Master Source Files Included', sub: 'AI, EPS, SVG, PDF, CDR' },
        { title: '6-12 Hrs Turnaround', sub: 'Same-day vector delivery' }
      ]
    },
    showcase: {
      title: 'Vector Art Redrawing & Separation Showcase',
      subtext: 'Low-res raster JPEGs converted into resolution-independent Adobe Illustrator vector node paths.',
      samples: [
        { id: 'vec-s1', title: 'Vintage Skull & Rose Vector', category: 'Spot Color Sep', stitches: 'N/A (Scalable Vector)', colors: '4 Pantone Spot Colors', fabric: 'Screen Printing & Cutters', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s2', title: 'Wildcat Athletic Team Mascot', category: 'Hand-Drawn Vector', stitches: 'N/A (Scalable Vector)', colors: '3 Screen Colors', fabric: 'Vinyl & Apparel Print', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s3', title: 'Corporate Shield & Crest Redraw', category: 'Clean AI & SVG', stitches: 'N/A (Scalable Vector)', colors: 'Full CMYK Vector', fabric: 'Large Format Banners', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    workflow: {
      title: 'How It Works: Vector Art Conversion Workflow',
      subtext: 'Pixel-perfect node tracing and color separation for print and vinyl cutting.',
      steps: [
        { step: '01', title: 'Upload Low-Res Image or Sketch', desc: 'Upload your pixelated JPEG, PNG, or hand sketch with target printing specifications.' },
        { step: '02', title: 'Manual Pen-Tool Vector Tracing', desc: 'Vector artists redraw your logo node-by-node in Adobe Illustrator — zero auto-tracing distortion.' },
        { step: '03', title: 'Color Separation & Scale Adjustment', desc: 'Clean Pantone spot color layer separation ready for screen printing films and vinyl plotters.' },
        { step: '04', title: 'Instant Vector Delivery', desc: 'Download resolution-independent master vector source files (.AI, .EPS, .SVG, .PDF).' }
      ]
    }
  },
  patch: {
    hero: {
      title: 'Physical Custom Patches & Emblems',
      highlight: 'Physical Shipping',
      subtext: 'Order high-density embroidered patches, 3D molded waterproof PVC emblems, woven labels, and genuine laser-engraved leather patches with physical shipping worldwide.',
      badge: 'STARTS $1.50 / PATCH',
      primaryCta: 'Order Custom Patches',
      secondaryCta: 'Explore Patch Tiers',
      trustPoints: [
        { title: 'Velcro & Iron-On Backing', sub: 'Hook & loop, heat seal or sew-on' },
        { title: 'Classic Merrowed Borders', sub: 'Overlock edges & die-cut shapes' },
        { title: 'Waterproof 3D Molded PVC', sub: 'High-durability tactical rubber' },
        { title: '3-5 Days Production', sub: 'Express physical delivery' }
      ]
    },
    showcase: {
      title: 'Physical Custom Patches & Goods Showcase',
      subtext: 'Custom embroidered, woven, PVC rubber, and genuine leather emblems delivered nationwide.',
      samples: [
        { id: 'pat-s1', title: 'Tactical Merrowed Embroidered Patch', category: 'Overlock Edge', stitches: 'High Density Rayon', colors: 'Velcro Backing', fabric: 'Heavy Duty Felt', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s2', title: '3D Molded Rubber PVC Patch', category: 'Tactical PVC', stitches: 'Waterproof Rubber', colors: 'Hook & Loop Backing', fabric: 'Tactical Outerwear', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s3', title: 'Laser Debossed Genuine Leather Patch', category: 'Real Leather', stitches: 'Engraved Leather', colors: 'Heat Seal Iron-On', fabric: 'Denim & Headwear', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' }
      ]
    },
    workflow: {
      title: 'How It Works: Custom Patches Production Workflow',
      subtext: 'Crafting premium physical emblems from digital proofing to doorstep delivery.',
      steps: [
        { step: '01', title: 'Artwork Submission & Specs', desc: 'Upload your artwork and choose patch material (Embroidered, Woven, PVC, Leather), backing, and border.' },
        { step: '02', title: 'Digital Proof & Approval', desc: 'Receive a high-resolution 1:1 digital mockup & physical sample proof for final approval before mass production.' },
        { step: '03', title: 'Precision Stitching & Molding', desc: 'High-density embroidery, fine woven thread weaving, or 3D waterproof PVC vulcanization.' },
        { step: '04', title: 'Quality Check & Express Shipping', desc: 'Every emblem undergoes strict quality inspection before express physical shipping worldwide.' }
      ]
    }
  }
};

export const StateProvider = ({ children }) => {
  // Navigation & Authentication state
  const [currentView, setCurrentView] = useState('public');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  // Auth modal & Tab navigation states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalTarget, setAuthModalTarget] = useState('customer');
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [activeCustomerTab, setActiveCustomerTab] = useState('dashboard');

  // Core Data Arrays (seeded from the database catalog on load)
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [pricing, setPricing] = useState(INITIAL_PRICING);
  const [pricingCards, setPricingCards] = useState(DEFAULT_PRICING_CARDS);
  const [portfolioSamples, setPortfolioSamples] = useState(PORTFOLIO_SAMPLES);
  const [sewOuts, setSewOuts] = useState(DEFAULT_SEW_OUTS);
  const [patchCards, setPatchCards] = useState(DEFAULT_PATCH_CARDS);
  const [storeProducts, setStoreProducts] = useState(DEFAULT_STORE_PRODUCTS);
  const [servicesList, setServicesList] = useState(SERVICES);
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [digitizers, setDigitizers] = useState(DIGITIZERS);

  // Admin whitelist (server-managed via public.admins table)
  const [adminUsers, setAdminUsers] = useState([]);

  // Dynamic Service-Driven Homepage & CMS Content State
  const [activeHomeServiceTab, setActiveHomeServiceTab] = useState('embroidery');
  const [serviceCmsContent, setServiceCmsContent] = useState(DEFAULT_SERVICE_CMS_CONTENT);

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
    if (
      cleanEmail === 'shahidbutt59191@gmail.com' ||
      cleanEmail.startsWith('admin@') ||
      adminUsers.some(a => (a.email || '').toLowerCase().trim() === cleanEmail)
    ) {
      return 'admin';
    }
    const res = await verifyAdminSession(cleanEmail);
    return res?.isAdmin ? 'admin' : 'customer';
  };

  // Load catalog + admin whitelist + database clients + wallet on mount
  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      // 1. (Removed local clients loading)

      // 2. Fetch catalog & DB clients if Supabase is configured
      if (isSupabaseConfigured && supabase) {
        try {
          const catalog = await fetchCatalogFromSupabase();
          if (!cancelled && catalog) {
            if (catalog.servicesList?.length) setServicesList(catalog.servicesList);
            if (catalog.pricingCards?.length) setPricingCards(catalog.pricingCards);
            if (catalog.patchCards?.length) setPatchCards(catalog.patchCards);
            if (catalog.storeProducts?.length) setStoreProducts(catalog.storeProducts);
            if (catalog.portfolioSamples?.length) setPortfolioSamples(catalog.portfolioSamples);
            if (catalog.sewOuts?.length) setSewOuts(catalog.sewOuts);
            if (catalog.heroSlides?.length) setHeroSlides(catalog.heroSlides);
            if (catalog.digitizers?.length) {
              setDigitizers(prev => prev.map(d => {
                const fresh = catalog.digitizers.find(x => x.id === d.id);
                return fresh ? { ...d, ...fresh } : d;
              }));
            }
            if (catalog.siteSettings) setSiteSettings(catalog.siteSettings);
            if (catalog.pricing) setPricing(catalog.pricing);
            if (catalog.serviceCms) setServiceCmsContent(catalog.serviceCms);
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

          // Load current Supabase session
          let resolvedAdminEmail = null;
          if (isSupabaseConfigured && supabase) {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              const session = sessionData?.session;
              if (!cancelled && session?.user) {
                const role = await resolveRole(session.user.email);
                if (role === 'admin') resolvedAdminEmail = session.user.email;
                const uData = buildAuthUser(session.user, role);
                setAuthUser(uData);
                setIsAuthenticated(true);
                setCurrentView(role === 'admin' ? 'admin' : 'customer');

                const balance = await fetchWalletBalanceFromSupabase(session.user.email);
                if (!cancelled) setWalletBalance(balance);

                try {
                  await upsertClientInSupabase({ ...uData, role });
                } catch (err) {
                  console.warn('Client upsert notice:', err);
                }
              }
            } catch (sessErr) {
              console.warn('Get session exception:', sessErr);
            }
          }

          if (!cancelled && resolvedAdminEmail) {
            const adminList = await fetchAdminUsers(resolvedAdminEmail);
            if (adminList?.length) {
              setAdminUsers(adminList.map(a => ({ email: a.email, name: a.name || a.email })));
            }
          }
        } catch (err) {
          console.warn('Initial data load notice:', err);
        }
      }

      // 3. Restore persistent local session if active
      if (!cancelled && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('bdigi_auth_user');
          if (stored) {
            const uData = JSON.parse(stored);
            if (uData && uData.email) {
              setAuthUser(prev => prev || uData);
              setIsAuthenticated(prev => prev || true);
              setCurrentView(prev => (prev === 'public' ? (uData.role === 'admin' ? 'admin' : 'customer') : prev));
            }
          }
        } catch (e) {}
      }
    };

    loadInitialData();

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

            try {
              await upsertClientInSupabase({ ...uData, role });
            } catch (err) {
              console.warn('Client upsert notice:', err);
            }
          }
        } catch (authErr) {
          console.warn('onAuthStateChange exception:', authErr);
        }
      });
      authSubscription = authListener?.subscription;
    }

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
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
      const { data, error } = await supabase.from('users').select('role, wallet_balance, name').eq('id', sbUser.id).single();
      if (!error && data) {
        role = data.role;
        balance = data.wallet_balance;
      }
    } catch (e) {
      console.warn("Error fetching user data from public.users");
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
    showToast('Authenticating with Google...', 'info');
    const res = await signInWithGoogleIdToken(idToken);
    if (!res.success) {
      showToast(res.error || 'Google Sign-In failed.', 'error');
    } else {
      await finishAuth(res.data.user);
    }
    return res;
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
      if (isAuthenticated && authUser?.role === 'admin') {
        setCurrentView('admin');
      } else {
        showToast('Access Restricted to Studio Admin.', 'warning');
        setAuthModalTarget('admin');
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
      }
    }
  };

  // Order Operations connected to Supabase DB
  const createOrder = async (newOrderData) => {
    const localId = newOrderData.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
    const fullOrderPayload = {
      id: localId,
      ...newOrderData,
      clientName: authUser?.company || authUser?.name || 'Valued Client',
      clientEmail: authUser?.email || '',
      createdAt: new Date().toISOString(),
      status: 'submitted',
      history: [{ timestamp: new Date().toISOString(), label: 'Order Submitted by Client' }],
      revisions: []
    };

    if (isSupabaseConfigured) {
      try {
        await createOrderInSupabase(fullOrderPayload);
        setOrders(prev => [fullOrderPayload, ...prev]);
        showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
        return fullOrderPayload;
      } catch (sbErr) {
        console.warn('Supabase create order notice:', sbErr);
      }
    }

    setOrders(prev => [fullOrderPayload, ...prev]);
    showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
    return fullOrderPayload;
  };

  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    if (isSupabaseConfigured) {
      try {
        await updateOrderStatusInSupabase(orderId, newStatus, extraData);
      } catch (sbErr) {
        console.warn('Supabase update order status notice:', sbErr);
      }
    }

    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: newStatus,
          ...extraData,
          history: [...(ord.history || []), { timestamp: new Date().toISOString(), label: `Status updated to ${newStatus}` }]
        };
      }
      return ord;
    }));
    showToast(`Order ${formatOrderId(orderId)} status updated to ${newStatus.toUpperCase()}`, 'success');
  };

  const addRevisionRequest = async (orderId, revisionNote) => {
    if (isSupabaseConfigured) {
      try {
        await addRevisionInSupabase(orderId, revisionNote, authUser?.name || 'Client');
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

  const cancelOrder = (orderId, reason = 'Cancelled by Admin') => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
          history: [{ timestamp: new Date().toISOString(), label: `Order Cancelled: ${reason}` }, ...ord.history]
        };
      }
      return ord;
    }));
    showToast(`Order ${formatOrderId(orderId)} marked as CANCELLED`, 'warning');
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

  const deductWalletBalance = async (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0 || walletBalance < num) return false;

    const res = await deductWalletViaApi(num);
    if (res.success) {
      setWalletBalance(res.balance);
      return true;
    }
    showToast(res.error || 'Wallet payment failed.', 'error');
    return false;
  };

  const openOrderWizard = (initialData = null) => {
    if (!isAuthenticated && !authUser) {
      if (initialData !== undefined) setOrderWizardInitialData(initialData);
      setAuthModalTarget('customer');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      showToast('Please sign in or create an account to place an order.', 'info');
      return;
    }

    if (initialData !== undefined) setOrderWizardInitialData(initialData);
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
    saveCmsConfigToSupabase('pricing_cards', newCards);
  };

  const updatePatchCards = (newCards) => {
    setPatchCards(newCards);
    saveCmsConfigToSupabase('patch_cards', newCards);
  };

  const updateStoreProducts = (newProducts) => {
    setStoreProducts(newProducts);
    saveCmsConfigToSupabase('store_products', newProducts);
  };

  const updatePortfolioSamples = (newPortfolio) => {
    setPortfolioSamples(newPortfolio);
    saveCmsConfigToSupabase('portfolio_samples', newPortfolio);
  };

  const updateSewOuts = (newSewOuts) => {
    setSewOuts(newSewOuts);
    saveCmsConfigToSupabase('sew_outs', newSewOuts);
  };

  const updateServicesList = (newServices) => {
    setServicesList(newServices);
    saveCmsConfigToSupabase('services_list', newServices);
  };

  const updateHeroSlides = (newSlides) => {
    setHeroSlides(newSlides);
    saveCmsConfigToSupabase('hero_slides', newSlides);
  };

  const updateSiteSettings = (newSettings) => {
    setSiteSettings(newSettings);
    saveCmsConfigToSupabase('site_settings', newSettings);
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
        if (catalog.servicesList?.length) setServicesList(catalog.servicesList);
        if (catalog.pricingCards?.length) setPricingCards(catalog.pricingCards);
        if (catalog.patchCards?.length) setPatchCards(catalog.patchCards);
        if (catalog.storeProducts?.length) setStoreProducts(catalog.storeProducts);
        if (catalog.portfolioSamples?.length) setPortfolioSamples(catalog.portfolioSamples);
        if (catalog.sewOuts?.length) setSewOuts(catalog.sewOuts);
        if (catalog.heroSlides?.length) setHeroSlides(catalog.heroSlides);
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

  return (
    <StateContext.Provider value={{
      currentView, setCurrentView,
      isAuthenticated, setIsAuthenticated,
      authUser, currentUser: authUser,
      login, loginWithGoogle, loginWithApple, register, logout, protectedNavigate,
      requestPasswordReset, updatePassword,
      isAuthModalOpen, setIsAuthModalOpen,
      authModalMode, setAuthModalMode,
      authModalTarget, setAuthModalTarget,
      activeAdminTab, setActiveAdminTab,
      activeCustomerTab, setActiveCustomerTab,
      orders, setOrders,
      clients, setClients,
      pricing, setPricing, updatePricing,
      pricingCards, setPricingCards, updatePricingCards,
      patchCards, setPatchCards, updatePatchCards,
      storeProducts, setStoreProducts,
      portfolioSamples, setPortfolioSamples, updatePortfolioSamples,
      sewOuts, setSewOuts, updateSewOuts,
      servicesList, setServicesList, updateServicesList,
      heroSlides, setHeroSlides, updateHeroSlides,
      siteSettings, setSiteSettings, updateSiteSettings,
      adminUsers, setAdminUsers, addAdminUser,
      activeHomeServiceTab, setActiveHomeServiceTab,
      serviceCmsContent, setServiceCmsContent, updateServiceCmsContent,
      resetAllData,
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
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, unreadNotificationsCount,
      createOrder, updateOrderStatus, addRevisionRequest, addOrderMessage, cancelOrder
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
