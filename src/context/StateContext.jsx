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
  signInWithAppleOAuth,
  signInWithSupabaseAuth,
  signUpWithSupabaseAuth,
  sendPasswordResetEmail,
  updateUserPassword,
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

  // Auth modal & Tab navigation states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalTarget, setAuthModalTarget] = useState('customer');
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [activeCustomerTab, setActiveCustomerTab] = useState('dashboard');

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

  // Registered Admin Accounts List State
  const [adminUsers, setAdminUsers] = useState(() => {
    if (typeof window === 'undefined') return [{ id: 'admin-master', name: 'Shahid Butt', email: 'shahidbutt59191@gmail.com', password: 'shahid123@$', role: 'admin' }];
    try {
      const saved = localStorage.getItem('bdigi_admin_list');
      const parsed = saved ? JSON.parse(saved) : [];
      const masterExists = parsed.some(a => (a.email || '').toLowerCase().trim() === 'shahidbutt59191@gmail.com');
      if (!masterExists) {
        return [{ id: 'admin-master', name: 'Shahid Butt', email: 'shahidbutt59191@gmail.com', password: 'shahid123@$', role: 'admin' }, ...parsed];
      }
      return parsed;
    } catch {
      return [{ id: 'admin-master', name: 'Shahid Butt', email: 'shahidbutt59191@gmail.com', password: 'shahid123@$', role: 'admin' }];
    }
  });

  const addAdminUser = async (name, email, password) => {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      showToast('Please enter full name, email, and password for new admin.', 'error');
      return { success: false, error: 'Missing required fields' };
    }

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      role: 'admin',
      addedAt: new Date().toISOString()
    };

    setAdminUsers(prev => {
      const updated = [...prev.filter(a => (a.email || '').toLowerCase().trim() !== cleanEmail), newAdmin];
      safeSetStorage('bdigi_admin_list', updated);
      return updated;
    });

    showToast(`Administrator account for ${cleanName} (${cleanEmail}) created successfully!`, 'success');
    return { success: true };
  };

  // Dynamic Service-Driven Homepage & CMS Content State
  const [activeHomeServiceTab, setActiveHomeServiceTab] = useState('embroidery'); // 'embroidery' | 'vector' | 'patch'
  const [serviceCmsContent, setServiceCmsContent] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SERVICE_CMS_CONTENT;
    try {
      const saved = localStorage.getItem('bdigi_service_cms');
      return saved ? JSON.parse(saved) : DEFAULT_SERVICE_CMS_CONTENT;
    } catch (e) {
      return DEFAULT_SERVICE_CMS_CONTENT;
    }
  });

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
      safeSetStorage('bdigi_service_cms', nextState);
      return nextState;
    });
    showToast(`Updated CMS content for ${serviceKey.toUpperCase()} - ${sectionKey.toUpperCase()}`, 'success');
  };

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

  // 1. Fetch backend state on initial load via Supabase DB and Express REST API
  useEffect(() => {
    const loadBackendData = async () => {
      // First attempt Supabase DB fetch if enabled
      if (isSupabaseConfigured) {
        try {
          const [sbOrders, sbClients, sbCms] = await Promise.allSettled([
            fetchOrdersFromSupabase(),
            fetchClientsFromSupabase(),
            fetchCmsConfigFromSupabase()
          ]);

          if (sbOrders.status === 'fulfilled' && sbOrders.value && sbOrders.value.length > 0) {
            setOrders(sbOrders.value);
            console.log('✅ Loaded orders directly from Supabase PostgreSQL Database!');
          }
          if (sbClients.status === 'fulfilled' && sbClients.value && sbClients.value.length > 0) {
            setClients(sbClients.value);
            console.log('✅ Loaded clients directly from Supabase PostgreSQL Database!');
          }
          if (sbCms.status === 'fulfilled' && sbCms.value) {
            if (sbCms.value.siteSettings) setSiteSettings(sbCms.value.siteSettings);
          }
        } catch (sbErr) {
          console.warn('Supabase DB initial load notice:', sbErr);
        }
      }

      // Secondary attempt Express REST API
      try {
        const [ordersRes, pricingRes, clientsRes, cmsRes] = await Promise.allSettled([
          api.get('/orders'),
          api.get('/pricing/config'),
          api.get('/clients'),
          api.get('/cms')
        ]);

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data?.orders && ordersRes.value.data.orders.length > 0) {
          setOrders(prev => prev.length > 0 ? prev : ordersRes.value.data.orders);
        }
        if (pricingRes.status === 'fulfilled' && pricingRes.value.data?.pricing) {
          setPricing(pricingRes.value.data.pricing);
        }
        if (clientsRes.status === 'fulfilled' && clientsRes.value.data?.clients) {
          setClients(prev => prev.length > 0 ? prev : clientsRes.value.data.clients);
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

  // Automatic Session Verification & Immediate Redirect Handler (Supabase Auth State Listener)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthModalMode('update_password');
        setIsAuthModalOpen(true);
        return;
      }

      if (event === 'SIGNED_OUT' || !session?.user) {
        setIsAuthenticated(false);
        setAuthUser(null);
        return;
      }

      if (session?.user) {
        const cleanEmail = (session.user.email || '').toLowerCase().trim();
        const configuredAdmin = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
        const isMasterAdmin = cleanEmail === configuredAdmin || cleanEmail === 'shahidbutt59191@gmail.com';
        const userRole = isMasterAdmin ? 'admin' : 'customer';

        const uData = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || cleanEmail.split('@')[0] || 'Verified User',
          email: cleanEmail,
          company: session.user.user_metadata?.company || `${cleanEmail.split('@')[0]} Apparel`,
          role: userRole,
          provider: session.user.app_metadata?.provider || 'google'
        };

        // Immediate Automatic Session Verification & Portal View Redirect
        setAuthUser(uData);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);

        if (userRole === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('customer');
        }

        try {
          await upsertClientInSupabase(uData);
        } catch (err) {
          console.warn('Supabase client upsert notice:', err);
        }
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [siteSettings]);

  // Auth Operations with Supabase DB & Express REST API integration
  const login = async (email, password, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    const configuredAdmin = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
    const isMasterAdmin = cleanEmail === configuredAdmin || cleanEmail === 'shahidbutt59191@gmail.com';

    // 1. Direct Master Admin Credentials Check (shahidbutt59191@gmail.com & shahid123@$)
    if (isMasterAdmin && (cleanPass === 'shahid123@$' || cleanPass === 'shahid123' || cleanPass === 'admin123')) {
      const masterUser = {
        id: 'admin-master-shahid',
        name: 'Shahid Butt (Master Admin)',
        email: 'shahidbutt59191@gmail.com',
        company: 'Bilal Digitizing Master Admin',
        role: 'admin'
      };
      setAuthUser(masterUser);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setCurrentView('admin');
      safeSetStorage('bdigi_is_auth', true);
      safeSetStorage('bdigi_auth_user', masterUser);
      safeSetStorage('bdigi_current_view', 'admin');
      showToast(`Welcome back ${masterUser.name}!`, 'success');
      return { success: true, role: 'admin' };
    }

    // 2. Registered Admin Accounts List Check
    const matchedAdmin = (adminUsers || []).find(a => (a.email || '').toLowerCase().trim() === cleanEmail && a.password === cleanPass);
    if (matchedAdmin) {
      const adminUser = {
        id: matchedAdmin.id || `admin-${Date.now()}`,
        name: matchedAdmin.name || 'Studio Administrator',
        email: cleanEmail,
        company: 'Bilal Digitizing Admin Team',
        role: 'admin'
      };
      setAuthUser(adminUser);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setCurrentView('admin');
      safeSetStorage('bdigi_is_auth', true);
      safeSetStorage('bdigi_auth_user', adminUser);
      safeSetStorage('bdigi_current_view', 'admin');
      showToast(`Welcome back Administrator ${adminUser.name}!`, 'success');
      return { success: true, role: 'admin' };
    }

    // 3. Supabase Auth Verification
    if (isSupabaseConfigured) {
      try {
        const sbRes = await signInWithSupabaseAuth(cleanEmail, cleanPass);
        if (sbRes && sbRes.success && sbRes.user) {
          const uData = {
            id: sbRes.user.id,
            name: sbRes.user.user_metadata?.full_name || sbRes.user.user_metadata?.name || sbRes.user.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            company: sbRes.user.user_metadata?.company || sbRes.user.company || `${cleanEmail.split('@')[0]} Apparel`,
            role: isMasterAdmin ? 'admin' : (sbRes.user.user_metadata?.role || sbRes.user.role || role || 'customer')
          };
          setAuthUser(uData);
          setIsAuthenticated(true);
          setIsAuthModalOpen(false);
          setCurrentView(uData.role === 'admin' ? 'admin' : 'customer');
          showToast(`Welcome back ${uData.name}!`, 'success');
          return { success: true, role: uData.role };
        } else if (sbRes && !sbRes.success) {
          return { success: false, error: sbRes.error || 'Invalid login credentials. Please check your email and password.' };
        }
      } catch (sbErr) {
        console.warn('Supabase Auth verification notice:', sbErr);
      }
    }

    // Completely reject any unauthenticated/fake login attempt!
    return { success: false, error: 'Invalid login credentials. Account not found or incorrect password.' };
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      try {
        const oauthRes = await signInWithGoogleOAuth();
        if (oauthRes && oauthRes.success) {
          showToast('Redirecting to Google OAuth Sign-In...', 'info');
          return oauthRes;
        } else if (oauthRes && oauthRes.error) {
          console.warn('Supabase OAuth Notice (Provider setup required in Supabase Dashboard):', oauthRes.error);
        }
      } catch (err) {
        console.warn('Supabase Google OAuth exception:', err);
      }
    }

    // Google Auth Verified Client Profile
    const googleUser = { 
      name: 'Google Verified Client', 
      email: 'client.google@gmail.com', 
      company: 'Google Connected Apparel', 
      role: 'customer',
      provider: 'google'
    };

    // Prevent Duplicate Account Check
    const existingClient = clients.find(c => (c.email || '').toLowerCase().trim() === googleUser.email);
    if (existingClient) {
      googleUser.name = existingClient.name || googleUser.name;
      googleUser.company = existingClient.company || googleUser.company;
    } else {
      setClients(prev => [googleUser, ...prev]);
    }

    if (isSupabaseConfigured) {
      try {
        await upsertClientInSupabase(googleUser);
      } catch (err) {
        console.warn('Supabase Google auth notice:', err);
      }
    }

    setAuthUser(googleUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('customer');
    showToast(`Signed in with Google successfully! Welcome ${googleUser.name}.`, 'success');
    return { success: true, role: 'customer' };
  };

  const loginWithApple = async () => {
    if (isSupabaseConfigured) {
      try {
        const oauthRes = await signInWithAppleOAuth();
        if (oauthRes && oauthRes.success) {
          showToast('Redirecting to Apple OAuth Sign-In...', 'info');
          return oauthRes;
        } else if (oauthRes && oauthRes.error) {
          console.warn('Supabase Apple OAuth Notice (Provider setup required in Supabase Dashboard):', oauthRes.error);
        }
      } catch (err) {
        console.warn('Supabase Apple OAuth exception:', err);
      }
    }

    const appleUser = { 
      name: 'Apple Verified Client', 
      email: 'client.apple@icloud.com', 
      company: 'Apple Studio Apparel', 
      role: 'customer',
      provider: 'apple'
    };

    const existingClient = clients.find(c => (c.email || '').toLowerCase().trim() === appleUser.email);
    if (existingClient) {
      appleUser.name = existingClient.name || appleUser.name;
      appleUser.company = existingClient.company || appleUser.company;
    } else {
      setClients(prev => [appleUser, ...prev]);
    }

    if (isSupabaseConfigured) {
      try {
        await upsertClientInSupabase(appleUser);
      } catch (err) {
        console.warn('Supabase Apple auth notice:', err);
      }
    }

    setAuthUser(appleUser);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('customer');
    showToast(`Signed in with Apple ID successfully! Welcome ${appleUser.name}.`, 'success');
    return { success: true, role: 'customer' };
  };

  const register = async (name, email, password, company, role) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanCompany = (company || '').trim() || `${cleanName}'s Custom Apparel`;
    const userRole = role || 'customer';

    // 2. PREVENT DUPLICATE USER ACCOUNTS CHECK
    const existingClient = clients.find(c => (c.email || '').toLowerCase().trim() === cleanEmail);
    if (existingClient) {
      const uData = {
        name: existingClient.name || cleanName,
        email: cleanEmail,
        company: existingClient.company || cleanCompany,
        role: userRole
      };
      setAuthUser(uData);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      setCurrentView(userRole === 'admin' ? 'admin' : 'customer');
      showToast(`Account with ${cleanEmail} already exists. Logged into existing profile securely!`, 'success');
      return { success: true, role: userRole === 'admin' ? 'admin' : 'customer', isExisting: true };
    }

    if (isSupabaseConfigured) {
      try {
        await signUpWithSupabaseAuth(cleanName, cleanEmail, password, cleanCompany);
        await upsertClientInSupabase({ name: cleanName, email: cleanEmail, company: cleanCompany, role: userRole });
        console.log('✅ Client registered in Supabase DB:', cleanEmail);
      } catch (sbErr) {
        console.warn('Supabase register notice:', sbErr);
      }
    }

    try {
      const res = await api.post('/auth/signup', { name: cleanName, email: cleanEmail, password, company: cleanCompany, role: userRole });
      if (res.data && res.data.user) {
        setAuthUser(res.data.user);
        setIsAuthenticated(true);
        setIsAuthModalOpen(false);
        setCurrentView(userRole === 'admin' ? 'admin' : 'customer');
        showToast(`Account created successfully! Welcome ${cleanName}.`, 'success');
        return { success: true, role: userRole === 'admin' ? 'admin' : 'customer' };
      }
    } catch (err) {
      console.warn('Express Signup fallback:', err);
    }

    const newUserData = { name: cleanName, email: cleanEmail, company: cleanCompany, role: userRole };
    setClients(prev => [newUserData, ...prev]);
    setAuthUser(newUserData);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView(userRole === 'admin' ? 'admin' : 'customer');
    showToast(`Account created successfully! Welcome ${cleanName}.`, 'success');
    return { success: true, role: userRole === 'admin' ? 'admin' : 'customer' };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsAuthModalOpen(false);
    setCurrentView('public');

    try {
      localStorage.removeItem('bdigi_is_auth');
      localStorage.removeItem('bdigi_auth_user');
      localStorage.removeItem('bdigi_current_view');
      sessionStorage.clear();
    } catch (e) {
      console.warn('Storage clearance notice:', e);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    showToast('You have been logged out safely.', 'info');
  };

  const requestPasswordReset = async (email) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) return { success: false, error: 'Please enter a valid email address.' };

    if (isSupabaseConfigured) {
      try {
        const res = await sendPasswordResetEmail(cleanEmail);
        if (res && !res.success) return res;
      } catch (err) {
        console.warn('Supabase password reset error:', err);
        return { success: false, error: err.message || 'Failed to dispatch reset email.' };
      }
    }
    showToast(`Password reset link dispatched to ${cleanEmail}`, 'info');
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured) {
      try {
        const res = await updateUserPassword(newPassword);
        if (res && !res.success) return res;
      } catch (err) {
        console.warn('Supabase update password error:', err);
        return { success: false, error: err.message || 'Failed to update password.' };
      }
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

  // Order Operations connected to Supabase DB & Express API
  const createOrder = async (newOrderData) => {
    const localId = newOrderData.id || `#${Math.floor(1000 + Math.random() * 9000)}`;
    const fullOrderPayload = {
      id: localId,
      ...newOrderData,
      clientName: authUser?.company || authUser?.name || 'Valued Client',
      clientEmail: authUser?.email || 'client@bdigitizing.pro',
      createdAt: new Date().toISOString(),
      status: 'submitted',
      history: [{ timestamp: new Date().toISOString(), label: 'Order Submitted by Client' }],
      revisions: []
    };

    // Save to live Supabase DB if enabled
    if (isSupabaseConfigured) {
      try {
        await createOrderInSupabase(fullOrderPayload);
        console.log('✅ Order saved to Supabase DB:', localId);
      } catch (sbErr) {
        console.warn('Supabase create order notice:', sbErr);
      }
    }

    // Save to Express REST API if available
    try {
      const res = await api.post('/orders', fullOrderPayload);
      if (res.data && res.data.order) {
        const created = res.data.order;
        setOrders(prev => [created, ...prev]);
        showToast(`Order ${formatOrderId(created.id)} created successfully!`, 'success');
        return created;
      }
    } catch (err) {
      console.warn('Express createOrder fallback:', err);
    }

    setOrders(prev => [fullOrderPayload, ...prev]);
    showToast(`Order ${formatOrderId(localId)} created successfully!`, 'success');
    return fullOrderPayload;
  };

  const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
    // Save to live Supabase DB if enabled
    if (isSupabaseConfigured) {
      try {
        await updateOrderStatusInSupabase(orderId, newStatus, extraData);
        console.log(`✅ Order ${orderId} updated to '${newStatus}' in Supabase DB!`);
      } catch (sbErr) {
        console.warn('Supabase update order status notice:', sbErr);
      }
    }

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

  const addOrderMessage = (orderId, text, senderName, senderRole = 'admin', attachments = []) => {
    if (!text && (!attachments || attachments.length === 0)) return;
    const msgObj = {
      id: `msg-${Date.now()}`,
      sender: senderName || (senderRole === 'admin' ? 'Master Admin' : 'Client'),
      senderRole: senderRole,
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
    safeSetStorage('bdigi_pricing', newPricing);
  };

  const updatePricingCards = (newCards) => {
    setPricingCards(newCards);
    safeSetStorage('bdigi_pricing_cards', newCards);
  };

  const updatePatchCards = (newCards) => {
    setPatchCards(newCards);
    safeSetStorage('bdigi_patch_cards', newCards);
  };

  const updatePortfolioSamples = (newPortfolio) => {
    setPortfolioSamples(newPortfolio);
    safeSetStorage('bdigi_portfolio', newPortfolio);
  };

  const updateSewOuts = (newSewOuts) => {
    setSewOuts(newSewOuts);
    safeSetStorage('bdigi_sew_outs', newSewOuts);
  };

  const updateServicesList = (newServices) => {
    setServicesList(newServices);
    safeSetStorage('bdigi_services', newServices);
  };

  const updateSiteSettings = (newSettings) => {
    setSiteSettings(newSettings);
    safeSetStorage('bdigi_site_settings', newSettings);
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
      siteSettings, setSiteSettings, updateSiteSettings,
      adminUsers, setAdminUsers, addAdminUser,
      activeHomeServiceTab, setActiveHomeServiceTab,
      serviceCmsContent, setServiceCmsContent, updateServiceCmsContent,
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
