'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Upload,
  Zap, 
  ArrowRight, 
  ArrowLeft,
  FileCheck,
  FileCode,
  Trash2,
  Sparkles,
  Plus,
  Minus,
  Tag,
  Check,
  CheckCircle2,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Building,
  Clock,
  Layers,
  PenTool,
  Package,
  Sliders,
  DollarSign,
  ChevronRight,
  Info,
  Loader2
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleCustomSignInButton } from '../auth/GoogleCustomSignInButton';
import AppleSignin from 'react-apple-signin-auth';

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '421520521310-7appibeh1m7cdd90iid17lsq8thlq2oc.apps.googleusercontent.com').trim();
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';

// Standard Fallback Package Tiers
const CORE_PACKAGES = {
  embroidery: [
    {
      id: 'emb-basic',
      service_type: 'embroidery',
      badge: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Commercial stitch files for caps, polos & shirts (.DST, .PES, .EMB)',
      price: 10,
      original_price: 15,
      turnaround: '4–12 Hours',
      features: [
        'Up to 4" x 4" Dimensions',
        '100% Manual Hand-Mapped Pathing',
        'Cap Curved Optimization & Zero Thread Breaks',
        'Tajima .DST, Wilcom .EMB, Brother .PES + PDF Sheet'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'PDF'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Left Chest / Polo (up to 4.0")'
    },
    {
      id: 'emb-popular',
      service_type: 'embroidery',
      badge: 'MOST POPULAR',
      is_popular: true,
      title: 'Mid-Size Jacket & Sleeve Design',
      subtitle: 'Medium complexity artwork up to 7" x 7" with push-pull compensation.',
      price: 20,
      original_price: 30,
      turnaround: '6–12 Hours',
      features: [
        'Up to 7" x 7" Medium Artwork Area',
        'Complex Multi-Color Layering & Pathing',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'PDF'],
      defaultWidth: '6.0',
      defaultHeight: '6.0',
      defaultPlacement: 'Jacket Front / Sleeve (up to 7.0")'
    },
    {
      id: 'emb-pro',
      service_type: 'embroidery',
      badge: 'PRO / 3D PUFF',
      is_popular: false,
      title: 'Full Back & 3D Puff Foam',
      subtitle: 'High stitch count jacket back designs up to 12" x 12" and 3D puff foam.',
      price: 35,
      original_price: 50,
      turnaround: '8–12 Hours',
      features: [
        'Up to 12" x 12" Full Back Area',
        'High Density 3D Puff Foam Layering',
        'Heavy Fabric Calibration & Zero Distortion',
        '24/7 Priority Master Digitizer Support'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'PDF'],
      defaultWidth: '10.5',
      defaultHeight: '10.5',
      defaultPlacement: 'Full Jacket Back (up to 12.0")'
    }
  ],
  vector: [
    {
      id: 'vec-basic',
      service_type: 'vector',
      badge: 'BASIC',
      is_popular: false,
      title: 'Simple Logo & Typography Redraw',
      subtitle: 'Clean typographic logos, line work & basic shapes converted to vector.',
      price: 15,
      original_price: 25,
      turnaround: '6–12 Hours',
      features: [
        'Clean Bézier Curves & Anchor Nodes',
        'Sharp 100% Scalable Vector Paths',
        'Master Suite: .AI, .EPS, .SVG, .PDF',
        'Infinite Scale Without Pixelation'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF'],
      defaultWidth: '5.0',
      defaultHeight: '5.0',
      defaultPlacement: 'Vector Redraw'
    },
    {
      id: 'vec-popular',
      service_type: 'vector',
      badge: 'MOST POPULAR',
      is_popular: true,
      title: 'Standard Multi-Color Artwork',
      subtitle: 'Multi-layer mascot logos, character illustrations & badge crests.',
      price: 25,
      original_price: 40,
      turnaround: '6–12 Hours',
      features: [
        'Multi-Color Separation & Trapping',
        'Pantone (PMS) Spot Color Matching',
        'Screen Print & Vinyl Ready Nodes',
        'CMYK / RGB High-Res Formats'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'PNG'],
      defaultWidth: '8.0',
      defaultHeight: '8.0',
      defaultPlacement: 'Screen Print / DTF'
    },
    {
      id: 'vec-pro',
      service_type: 'vector',
      badge: 'COMPLEX / ILLUSTRATION',
      is_popular: false,
      title: 'Complex Illustration & Detailed Art',
      subtitle: 'Highly intricate artwork, halftones, gradients & photographic vectorization.',
      price: 45,
      original_price: 65,
      turnaround: '12–24 Hours',
      features: [
        'Intricate Micro-Detail Redraw',
        'Custom Halftones & Gradients',
        'Laser Engraving & CNC Ready',
        'Dedicated Senior Vector Artist'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'CDR', 'PNG'],
      defaultWidth: '12.0',
      defaultHeight: '12.0',
      defaultPlacement: 'Complex Art'
    }
  ],
  patch: [
    {
      id: 'patch-basic',
      service_type: 'patch',
      badge: 'STARTER (50 PCS)',
      is_popular: false,
      title: 'Sample & Short Run (50 Pcs)',
      subtitle: 'Physical patches manufactured with iron-on or velcro backing.',
      price: 3.50,
      original_price: 5.00,
      turnaround: '5–7 Days',
      features: [
        '50 Pieces Minimum Order',
        '12-Hour Free Digital Production Proof',
        'Velcro Hook & Loop or Iron-On Backings',
        'Custom Embroidered, Woven or 3D PVC'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.0',
      defaultHeight: '3.0',
      defaultPlacement: 'Custom Shape Cut'
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      badge: 'POPULAR BATCH',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Ideal for uniform programs, merchandise drops & motorcycle clubs.',
      price: 2.50,
      original_price: 4.00,
      turnaround: '5–7 Days',
      features: [
        'Precision Laser-Cut or Merrowed Border',
        'Metallic Gold/Silver & Glow-in-Dark Threads',
        'Pre-Production Physical Sew-Out Sample',
        'Free Shipping Included'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Custom Shape Cut'
    },
    {
      id: 'patch-bulk',
      service_type: 'patch',
      badge: 'WHOLESALE BULK',
      is_popular: false,
      title: 'Wholesale Bulk (500+ Pcs)',
      subtitle: 'Maximum volume discount for apparel brands, military & distributors.',
      price: 1.50,
      original_price: 2.50,
      turnaround: '7–10 Days',
      features: [
        'Maximum Factory Direct Wholesale Savings',
        'Individual Poly-Bag Packaging',
        'Custom Backing Paper & Barcodes',
        'Dedicated Master Account Manager'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Custom Shape Cut'
    }
  ]
};

const SERVICE_OPTIONS = [
  {
    id: 'embroidery',
    title: 'Embroidery Digitizing',
    badge: '4–12H Delivery',
    priceText: 'From $10.00',
    icon: Layers,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#10b981',
    description: 'Precision stitch files (.DST, .PES, .EMB) with zero thread breaks for caps, polos & jacket backs.'
  },
  {
    id: 'vector',
    title: 'Vector Art Tracing',
    badge: '6–12H Delivery',
    priceText: 'From $15.00',
    icon: PenTool,
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#f97316',
    description: 'Hand-drawn scalable vector conversions (.AI, .EPS, .SVG, .PDF) with Pantone PMS spot color separation.'
  },
  {
    id: 'patch',
    title: 'Custom Physical Patches',
    badge: '5–7 Days Delivery',
    priceText: 'From $1.50 / pc',
    icon: Package,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    description: 'Custom Embroidered, 3D Rubber PVC, Woven & Leather patches shipped directly to your door.'
  }
];

export const OrderWizardModal = () => {
  const { 
    isOrderWizardOpen, 
    setIsOrderWizardOpen, 
    orderWizardInitialData,
    createOrder,
    showToast,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    authUser,
    currentUser,
    isAuthenticated,
    register,
    login,
    loginWithGoogle,
    loginWithApple,
    dynamicPricingTiers = [],
    siteSettings = {},
    refreshOrders
  } = useAppState();

  // Wizard Step State (1 to 5)
  const [step, setStep] = useState(1);

  // Selected Service & Package
  const [selectedService, setSelectedService] = useState('embroidery');
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Quantity State
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');

  // Artwork & Files State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [orderTitle, setOrderTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Technical Specs State
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [placement, setPlacement] = useState('Left Chest / Polo (up to 4.0")');
  const [fabricType, setFabricType] = useState('Cotton / Pique Knit');
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB', 'PDF']);
  const [isRush, setIsRush] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Auth for Guest Users
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestCompany, setGuestCompany] = useState('');
  const [guestAuthMode, setGuestAuthMode] = useState('signup');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Order Submission State
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const fileInputRef = useRef(null);

  const getPackagesForCategory = (catKey) => {
    const coreList = CORE_PACKAGES[catKey] || CORE_PACKAGES.embroidery;
    const dbTiers = (dynamicPricingTiers || []).filter(t => matchCategory(t.service_type, catKey));
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.map(t => ({
        id: t.id || `db-${t.service_type}-${t.display_order}`,
        service_type: catKey,
        badge: t.badge_text || (t.is_popular ? 'MOST POPULAR' : 'STANDARD'),
        is_popular: Boolean(t.is_popular),
        title: t.title,
        subtitle: t.subtitle || '',
        price: Number(t.price),
        original_price: t.original_price ? Number(t.original_price) : null,
        turnaround: t.turnaround_time || (catKey === 'patch' ? '5–7 Days' : '6–12 Hours'),
        features: Array.isArray(t.features) ? t.features : [],
        defaultFormats: catKey === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : (catKey === 'patch' ? ['DST', 'PDF Proof', 'Physical Patch Shipment'] : ['DST', 'PES', 'EMB', 'PDF']),
        defaultWidth: catKey === 'patch' ? '3.5' : '3.5',
        defaultHeight: catKey === 'patch' ? '3.5' : '3.5',
        defaultPlacement: catKey === 'patch' ? 'Custom Shape Cut' : 'Left Chest / Polo (up to 4.0")'
      }));
    }
    return coreList;
  };

  // Reset and populate on modal open
  useEffect(() => {
    if (isOrderWizardOpen) {
      let initialType = 'embroidery';
      let targetStep = 1;

      if (orderWizardInitialData) {
        if (orderWizardInitialData.type && orderWizardInitialData.type !== 'all') {
          const t = String(orderWizardInitialData.type).toLowerCase();
          if (t.includes('vector')) initialType = 'vector';
          else if (t.includes('patch')) initialType = 'patch';
          else initialType = 'embroidery';
          targetStep = 2; // Jump directly to packages if service was specifically requested
        } else if (orderWizardInitialData.serviceCategory) {
          const sc = String(orderWizardInitialData.serviceCategory).toLowerCase();
          if (sc.includes('vector')) initialType = 'vector';
          else if (sc.includes('patch')) initialType = 'patch';
          else initialType = 'embroidery';
          targetStep = 2;
        }
      }

      setSelectedService(initialType);
      const pkgs = getPackagesForCategory(initialType);
      const popularOrFirst = pkgs.find(p => p.is_popular) || pkgs[0];
      setSelectedPackage(popularOrFirst);

      const defaultQty = initialType === 'patch' ? 50 : 1;
      setQuantity(defaultQty);
      setQuantityInput(String(defaultQty));

      if (popularOrFirst) {
        setSelectedFormats(popularOrFirst.defaultFormats || ['DST', 'PES', 'EMB', 'PDF']);
        setWidthInches(popularOrFirst.defaultWidth || '3.5');
        setHeightInches(popularOrFirst.defaultHeight || '3.5');
        setPlacement(popularOrFirst.defaultPlacement || 'Left Chest / Polo (up to 4.0")');
      }

      setStep(targetStep);
      setUploadedFiles([]);
      setUploadError(null);
      setIsRush(false);
      setNotes('');
      setOrderTitle('');
      setAppliedPromo(null);

      // Check default promo code
      const promo = orderWizardInitialData?.promoCode || siteSettings?.announcement?.promoCode;
      if (promo) {
        setPromoCodeInput(promo);
        setAppliedPromo({
          code: promo.toUpperCase(),
          discountPercent: 15,
          discountAmount: 0
        });
      }
    }
  }, [isOrderWizardOpen, orderWizardInitialData]);

  if (!isOrderWizardOpen) return null;

  const currentPackages = getPackagesForCategory(selectedService);
  const activePkg = selectedPackage || currentPackages[0];

  const unitPrice = Number(activePkg?.price || (selectedService === 'patch' ? 2.50 : 15));
  const baseSubtotal = parseFloat((unitPrice * quantity).toFixed(2));

  let volumeDiscountPercent = 0;
  if (selectedService !== 'patch') {
    if (quantity >= 25) volumeDiscountPercent = 25;
    else if (quantity >= 10) volumeDiscountPercent = 15;
    else if (quantity >= 5) volumeDiscountPercent = 10;
    else if (quantity >= 3) volumeDiscountPercent = 5;
  }

  const volumeDiscountAmount = parseFloat(((baseSubtotal * volumeDiscountPercent) / 100).toFixed(2));
  const rushFee = isRush ? (selectedService === 'patch' ? 25 : 10) : 0;
  
  let promoDiscountAmount = 0;
  if (appliedPromo && appliedPromo.discountPercent) {
    promoDiscountAmount = parseFloat((((baseSubtotal - volumeDiscountAmount) * appliedPromo.discountPercent) / 100).toFixed(2));
  }

  const totalPrice = Math.max(0, parseFloat((baseSubtotal - volumeDiscountAmount - promoDiscountAmount + rushFee).toFixed(2)));

  const handleSelectService = (serviceId) => {
    setSelectedService(serviceId);
    const pkgs = getPackagesForCategory(serviceId);
    const popularOrFirst = pkgs.find(p => p.is_popular) || pkgs[0];
    setSelectedPackage(popularOrFirst);

    const newQty = serviceId === 'patch' ? 50 : 1;
    setQuantity(newQty);
    setQuantityInput(String(newQty));

    if (popularOrFirst) {
      setSelectedFormats(popularOrFirst.defaultFormats || (serviceId === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : ['DST', 'PES', 'EMB', 'PDF']));
      setWidthInches(popularOrFirst.defaultWidth || '3.5');
      setHeightInches(popularOrFirst.defaultHeight || '3.5');
      setPlacement(popularOrFirst.defaultPlacement || 'Left Chest / Polo (up to 4.0")');
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg.defaultFormats) setSelectedFormats(pkg.defaultFormats);
    if (pkg.defaultWidth) setWidthInches(pkg.defaultWidth);
    if (pkg.defaultHeight) setHeightInches(pkg.defaultHeight);
    if (pkg.defaultPlacement) setPlacement(pkg.defaultPlacement);
  };

  const handleQuantityChange = (delta) => {
    const minVal = selectedService === 'patch' ? 50 : 1;
    const stepVal = selectedService === 'patch' ? (quantity >= 100 ? 50 : 10) : 1;
    const nextVal = Math.max(minVal, quantity + (delta * stepVal));
    setQuantity(nextVal);
    setQuantityInput(String(nextVal));
  };

  const handleQuantityInput = (val) => {
    setQuantityInput(val);
    const parsed = parseInt(val, 10);
    const minVal = selectedService === 'patch' ? 50 : 1;
    if (!isNaN(parsed) && parsed >= minVal) {
      setQuantity(parsed);
    } else if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const handleQuantityBlur = () => {
    const parsed = parseInt(quantityInput, 10);
    const minVal = selectedService === 'patch' ? 50 : 1;
    if (isNaN(parsed) || parsed < minVal) {
      setQuantity(minVal);
      setQuantityInput(String(minVal));
      if (selectedService === 'patch' && showToast) {
        showToast('Minimum order quantity for Custom Patches is 50 pieces.', 'warning');
      }
    } else {
      setQuantity(parsed);
      setQuantityInput(String(parsed));
    }
  };

  const handleSetPresetQuantity = (presetQty) => {
    const minVal = selectedService === 'patch' ? 50 : 1;
    const finalQty = Math.max(minVal, presetQty);
    setQuantity(finalQty);
    setQuantityInput(String(finalQty));
  };

  const handleMultipleFiles = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const oversized = rawFiles.find(f => f.size > 50 * 1024 * 1024);
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds 50MB limit.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadPromises = rawFiles.map(async (file) => {
        const result = await uploadFileToCloudinaryFull(file);
        if (result && (result.url || result.secure_url)) {
          return {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: result.secure_url || result.url,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            format: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            public_id: result.public_id || null
          };
        }
        throw new Error(`Upload failed for ${file.name}`);
      });

      const newUploaded = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...newUploaded]);
      if (showToast) showToast(`✓ ${newUploaded.length} artwork file(s) attached successfully!`, 'success');
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Error uploading artwork files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleToggleFormat = (fmt) => {
    if (selectedFormats.includes(fmt)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter(f => f !== fmt));
      }
    } else {
      setSelectedFormats([...selectedFormats, fmt]);
    }
  };

  const handleApplyPromo = () => {
    if (!promoCodeInput || !promoCodeInput.trim()) return;
    const clean = promoCodeInput.trim().toUpperCase();
    if (clean === 'SAVE15' || clean === 'SAVE10' || clean === 'WELCOME' || clean === 'PROMO') {
      const pct = clean === 'SAVE10' ? 10 : 15;
      setAppliedPromo({
        code: clean,
        discountPercent: pct,
        discountAmount: parseFloat((((baseSubtotal - volumeDiscountAmount) * pct) / 100).toFixed(2))
      });
      if (showToast) showToast(`Coupon ${clean} applied! (-${pct}% discount)`, 'success');
    } else {
      if (showToast) showToast('Invalid promo code. Use SAVE15 for 15% off.', 'error');
    }
  };

  const handleGoogleAuthSuccess = async (googleUser) => {
    try {
      if (loginWithGoogle) {
        const res = await loginWithGoogle(googleUser);
        if (res?.success && res?.user) {
          setGuestEmail(res.user.email || '');
          setGuestName(res.user.name || '');
          if (showToast) showToast(`✓ Connected with Google (${res.user.email})`, 'success');
          return;
        }
      }
      if (googleUser?.email) {
        setGuestEmail(googleUser.email);
        setGuestName(googleUser.name || '');
        if (showToast) showToast(`✓ Connected with Google (${googleUser.email})`, 'success');
      }
    } catch (err) {
      console.warn('Google sign-in notice:', err);
      if (showToast) showToast(err.message || 'Google authentication notice', 'error');
    }
  };

  const handleAppleAuth = async () => {
    try {
      if (loginWithApple) {
        const res = await loginWithApple();
        if (res?.success && res?.user) {
          setGuestEmail(res.user.email || '');
          setGuestName(res.user.name || '');
          if (showToast) showToast(`✓ Signed in with Apple!`, 'success');
          return;
        }
      }
      if (showToast) showToast('Apple Sign-In is ready for Apple devices.', 'info');
    } catch (err) {
      console.warn('Apple auth notice:', err);
      if (showToast) showToast(err.message || 'Apple sign-in notice', 'info');
    }
  };

  const handleSubmitOrder = async () => {
    if (selectedService === 'patch' && quantity < 50) {
      if (showToast) showToast('Minimum order requirement for Custom Patches is 50 pieces.', 'error');
      setQuantity(50);
      setQuantityInput('50');
      setStep(2);
      return;
    }

    // 1. Ensure user is authenticated or authenticate them
    let clientEmail = (authUser?.email || currentUser?.email || '').toLowerCase().trim();
    let clientName = authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Studio Client';

    if (!isAuthenticated && !authUser) {
      if (!guestEmail.trim() || !guestPassword.trim()) {
        showToast('Please sign in or create an account to finalize your order.', 'warning');
        return;
      }

      setIsSubmittingAuth(true);
      try {
        if (guestAuthMode === 'signup') {
          const regRes = await register(guestName.trim() || 'Client', guestEmail.trim(), guestPassword.trim(), guestCompany.trim());
          if (!regRes || !regRes.success) {
            showToast(regRes?.error || 'Registration failed. Please check your credentials.', 'error');
            return;
          }
          clientEmail = guestEmail.trim().toLowerCase();
          clientName = guestName.trim() || 'Client';
        } else {
          const logRes = await login(guestEmail.trim(), guestPassword.trim());
          if (!logRes || !logRes.success) {
            showToast(logRes?.error || 'Login failed. Please check your password.', 'error');
            return;
          }
          clientEmail = guestEmail.trim().toLowerCase();
        }
      } catch (authErr) {
        showToast('Authentication error: ' + authErr.message, 'error');
        return;
      } finally {
        setIsSubmittingAuth(false);
      }
    }

    setIsSubmittingOrder(true);
    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Artwork';
      const cleanService = selectedService === 'vector' 
        ? 'Vector Art' 
        : selectedService === 'patch' 
          ? 'Custom Patches' 
          : 'Embroidery Digitizing';
      
      const derivedTitle = (orderTitle || '').trim() || (
        selectedService === 'patch'
          ? `${patchStyle} Patches (${quantity} Pcs)`
          : `${firstFileName} - ${cleanService} (Qty: ${quantity})`
      );

      const primaryArtworkUrl = uploadedFiles[0]?.url || null;

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        package_name: activePkg?.title,
        package_tier: activePkg?.badge || 'STANDARD',
        quantity: quantity,
        price: totalPrice,
        totalPrice: totalPrice,
        base_price: baseSubtotal,
        discount_amount: volumeDiscountAmount + promoDiscountAmount,
        applied_promo_code: appliedPromo?.code || null,
        isRush: isRush,
        notes: notes.trim(),
        placement: placement,
        width: widthInches,
        height: heightInches,
        fabricType: selectedService === 'embroidery' ? fabricType : null,
        patchStyle: selectedService === 'patch' ? patchStyle : null,
        patchBacking: selectedService === 'patch' ? patchBacking : null,
        targetFormats: selectedFormats,
        image_url: primaryArtworkUrl,
        artworkUrl: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        uploadedFiles: uploadedFiles,
        placementItems: [
          {
            id: 1,
            placementType: placement,
            quantity: quantity,
            dimensions: `${widthInches}" x ${heightInches}"`,
            formats: selectedFormats,
            fabric: fabricType,
            patchStyle,
            patchBacking,
            files: uploadedFiles
          }
        ],
        client_email: clientEmail,
        clientEmail: clientEmail,
        clientName: clientName,
        status: 'pending_payment',
        payment_status: 'unpaid'
      };

      const created = await createOrder(orderPayload);
      const resultingId = created?.id || `ORD_${Date.now()}`;

      if (typeof window !== 'undefined' && resultingId) {
        try {
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingId).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
        } catch {}
      }

      if (typeof refreshOrders === 'function') {
        refreshOrders().catch(() => {});
      }

      setIsCheckoutModalOpen(true);
      setCheckoutSession({
        amount: totalPrice,
        price: totalPrice,
        totalPrice: totalPrice,
        orderId: resultingId,
        title: derivedTitle,
        clientEmail: clientEmail,
        serviceType: cleanService
      });

      setIsOrderWizardOpen(false);
      if (showToast) showToast('✓ Order recorded! Choose Studio Wallet or Card to begin production.', 'success');
    } catch (err) {
      console.error('Order placement error:', err);
      if (showToast) showToast('Could not record order: ' + (err.message || 'Please try again'), 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div 
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsOrderWizardOpen(false);
        }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99980,
          padding: '1rem',
          overflowY: 'auto'
        }}
      >
        <div 
          className="theme-light-enforced"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '1020px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '1.5px solid #cbd5e1',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
          }}
        >
          {/* HEADER: Title & 5-Step Progress Stepper */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1.5px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    letterSpacing: '0.05em'
                  }}>
                    STEP {step} OF 5
                  </span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    {step === 1 && 'Select Studio Service'}
                    {step === 2 && 'Choose Package & Quantity'}
                    {step === 3 && 'Upload Artwork & Instructions'}
                    {step === 4 && 'Technical Specifications & Speed'}
                    {step === 5 && 'Review & Confirm Order'}
                  </h2>
                </div>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  {step === 1 && 'Choose from our 3 specialized digitizing services.'}
                  {step === 2 && 'Select transparent packages and configure design quantities with volume savings.'}
                  {step === 3 && 'Attach multiple artwork files and specify any custom notes for our master digitizers.'}
                  {step === 4 && 'Configure dimensions, file formats, placements, and optional rush turnaround.'}
                  {step === 5 && 'Verify your order breakdown before instant dispatch to our master production desk.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOrderWizardOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 5-Step Interactive Tabs */}
            <div 
              className="order-wizard-stepper-bar"
              style={{
                display: 'flex',
                gap: '0.35rem',
                background: '#f8fafc',
                padding: '0.3rem',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {[
                { s: 1, label: '1. Service', icon: Layers },
                { s: 2, label: '2. Packages', icon: Sliders },
                { s: 3, label: '3. Artwork', icon: Upload },
                { s: 4, label: '4. Specs', icon: FileCheck },
                { s: 5, label: '5. Review', icon: ShieldCheck }
              ].map(tab => {
                const isActive = step === tab.s;
                const isPassed = step > tab.s;
                const IconComp = tab.icon;

                return (
                  <button
                    key={tab.s}
                    type="button"
                    onClick={() => {
                      if (isPassed || tab.s === 1 || (tab.s === 2 && selectedService)) {
                        setStep(tab.s);
                      }
                    }}
                    style={{
                      flex: '1 1 auto',
                      minWidth: '65px',
                      background: isActive ? '#059669' : (isPassed ? '#ecfdf5' : 'transparent'),
                      color: isActive ? '#ffffff' : (isPassed ? '#047857' : '#64748b'),
                      border: isActive ? '1px solid #047857' : (isPassed ? '1px solid #a7f3d0' : '1px solid transparent'),
                      padding: '0.4rem 0.5rem',
                      minHeight: '36px',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      fontWeight: isActive ? 900 : 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      cursor: isPassed || isActive ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {isPassed ? <Check size={13} strokeWidth={3} /> : <IconComp size={13} />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN MODAL BODY */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.15rem'
          }}>
            
            {/* =========================================================================
                STEP 1: SELECT 1 OF 3 CORE SERVICES
                ========================================================================= */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.65rem', borderRadius: '999px', border: '1px solid #a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select Service Category
                  </span>
                  <h3 style={{ margin: '0.45rem 0 0.2rem', fontSize: '1.45rem', fontWeight: 900, color: '#0f172a' }}>
                    What would you like us to create for you?
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
                    Select one of our 3 core services below to see related packages & options.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.15rem' }}>
                  {SERVICE_OPTIONS.map(opt => {
                    const isSelected = selectedService === opt.id;
                    const IconC = opt.icon;

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          handleSelectService(opt.id);
                          setStep(2);
                        }}
                        style={{
                          background: isSelected ? opt.bgColor : '#ffffff',
                          border: isSelected ? `2.5px solid ${opt.color}` : '1.5px solid #cbd5e1',
                          borderRadius: '16px',
                          padding: '1.4rem 1.15rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          cursor: 'pointer',
                          boxShadow: isSelected ? `0 8px 24px rgba(0,0,0,0.08)` : '0 2px 8px rgba(0,0,0,0.02)',
                          transition: 'all 0.18s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '16px',
                          background: isSelected ? opt.color : '#f1f5f9',
                          color: isSelected ? '#ffffff' : opt.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '0.85rem',
                          boxShadow: isSelected ? `0 4px 14px rgba(0,0,0,0.15)` : 'none'
                        }}>
                          <IconC size={28} strokeWidth={2.2} />
                        </div>

                        <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.12rem', fontWeight: 900, color: '#0f172a' }}>
                          {opt.title}
                        </h4>

                        <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.65rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: opt.color, background: opt.bgColor, border: `1px solid ${opt.borderColor}`, padding: '0.12rem 0.5rem', borderRadius: '5px' }}>
                            {opt.priceText}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', background: '#f1f5f9', padding: '0.12rem 0.5rem', borderRadius: '5px' }}>
                            {opt.badge}
                          </span>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.45, flex: 1 }}>
                          {opt.description}
                        </p>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectService(opt.id);
                            setStep(2);
                          }}
                          style={{
                            marginTop: '1rem',
                            width: '100%',
                            background: isSelected ? opt.color : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#0f172a',
                            border: isSelected ? 'none' : '1px solid #cbd5e1',
                            borderRadius: '10px',
                            padding: '0.55rem',
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span>{isSelected ? '✓ Selected' : 'Choose Package'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================================
                STEP 2: SELECT PACKAGE TIER & QUANTITY
                ========================================================================= */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {/* Service Tab Switcher */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#f8fafc', padding: '0.35rem', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
                  {SERVICE_OPTIONS.map(tab => {
                    const isSelected = selectedService === tab.id;
                    const IconTab = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleSelectService(tab.id)}
                        style={{
                          padding: '0.55rem 0.5rem',
                          borderRadius: '8px',
                          border: isSelected ? `1.5px solid ${tab.color}` : '1px solid transparent',
                          background: isSelected ? '#ffffff' : 'transparent',
                          color: isSelected ? tab.color : '#475569',
                          fontWeight: isSelected ? 900 : 700,
                          fontSize: '0.84rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <IconTab size={16} />
                        <span>{tab.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* QUANTITY SELECTOR & PRICING WIDGET */}
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  padding: '0.95rem 1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                        {selectedService === 'patch' ? 'Patch Production Quantity (Pcs)' : 'Design Order Quantity'}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                        {selectedService === 'patch' ? 'Minimum 50 pcs batch • Factory wholesale pricing' : 'Add multiple designs to qualify for volume discounts up to 25% off'}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '0.2rem' }}>
                      <button
                        type="button"
                        disabled={selectedService === 'patch' && quantity <= 50}
                        onClick={() => handleQuantityChange(-1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#f1f5f9',
                          color: (selectedService === 'patch' && quantity <= 50) ? '#94a3b8' : '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: (selectedService === 'patch' && quantity <= 50) ? 'not-allowed' : 'pointer',
                          fontWeight: 900
                        }}
                      >
                        <Minus size={15} />
                      </button>

                      <input
                        type="number"
                        value={quantityInput}
                        onChange={(e) => handleQuantityInput(e.target.value)}
                        onBlur={handleQuantityBlur}
                        style={{
                          width: '60px',
                          textAlign: 'center',
                          fontWeight: 900,
                          fontSize: '0.95rem',
                          color: (selectedService === 'patch' && quantity < 50) ? '#dc2626' : '#0f172a',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none'
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleQuantityChange(1)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#ecfdf5',
                          color: '#047857',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 900
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Warning notice if quantity is less than 50 for patches */}
                  {selectedService === 'patch' && (quantity < 50 || parseInt(quantityInput, 10) < 50) && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '0.4rem 0.75rem',
                      color: '#b91c1c',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      ⚠️ Minimum order quantity for Custom Patches is 50 pcs.
                    </div>
                  )}

                  {/* Quick Quantity Preset Chips */}
                  <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto' }}>
                    {(selectedService === 'patch' 
                      ? [50, 100, 250, 500, 1000, 2500] 
                      : [1, 2, 3, 5, 10, 25]
                    ).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSetPresetQuantity(preset)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          border: quantity === preset ? '1.5px solid #059669' : '1px solid #cbd5e1',
                          background: quantity === preset ? '#ecfdf5' : '#ffffff',
                          color: quantity === preset ? '#047857' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        {preset} {selectedService === 'patch' ? 'pcs' : (preset === 1 ? 'item' : 'items')}
                      </button>
                    ))}
                  </div>

                  {/* Live Calculation Banner */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '0.55rem 0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Rate: </span>
                      <strong style={{ color: '#0f172a' }}>${unitPrice.toFixed(2)}</strong> × <strong style={{ color: '#0f172a' }}>{quantity} {selectedService === 'patch' ? 'pcs' : 'designs'}</strong>
                      {volumeDiscountPercent > 0 && (
                        <span style={{ marginLeft: '0.45rem', color: '#059669', fontWeight: 900, background: '#ecfdf5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          -{volumeDiscountPercent}% Volume Savings
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 900, color: '#047857' }}>
                      Subtotal: ${totalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* 3 Package Tier Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {currentPackages.map((pkg, idx) => {
                    const isSelected = selectedPackage?.id === pkg.id || (!selectedPackage && idx === 0);

                    return (
                      <div
                        key={pkg.id || idx}
                        onClick={() => handleSelectPackage(pkg)}
                        style={{
                          border: isSelected ? '2.5px solid #059669' : '1.5px solid #cbd5e1',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          borderRadius: '16px',
                          padding: '1.15rem 1rem',
                          cursor: 'pointer',
                          boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.14)' : '0 2px 6px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{
                            background: isSelected ? '#059669' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : '#475569',
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            textTransform: 'uppercase'
                          }}>
                            {pkg.badge}
                          </span>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                              ${Number(pkg.price).toFixed(pkg.price % 1 === 0 ? 0 : 2)}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', fontWeight: 700 }}>
                              {selectedService === 'patch' ? '/ pc' : 'flat rate'}
                            </span>
                          </div>
                        </div>

                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
                          {pkg.title}
                        </h4>

                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', lineHeight: 1.35, flex: 1 }}>
                          {pkg.subtitle}
                        </p>

                        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {pkg.features.slice(0, 3).map((feat, fIdx) => (
                              <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#334155' }}>
                                <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================================
                STEP 3: UPLOAD ARTWORK & INSTRUCTIONS
                ========================================================================= */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Header info badge */}
                <div style={{ background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                      Configuring: {activePkg?.title}
                    </span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0f172a' }}>
                      Quantity: {quantity} {selectedService === 'patch' ? 'pcs' : 'design(s)'}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#047857' }}>
                    ${totalPrice.toFixed(2)}
                  </div>
                </div>

                {/* Upload Dropzone */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                      Attach Artwork & Reference Files <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 800 }}>
                      Multiple files supported
                    </span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleMultipleFiles}
                    multiple
                    accept="image/*,.pdf,.ai,.eps,.svg,.cdr,.dst,.pes,.emb,.zip,.psd"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #059669',
                      borderRadius: '16px',
                      padding: '1.75rem 1.25rem',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
                        {isUploading ? 'Uploading and verifying files...' : 'Drag and Drop Artwork Files Here, or Click to Browse'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Supported formats: JPG, PNG, PDF, AI, EPS, SVG, DST, PES, EMB, PSD up to 50MB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1.15rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        marginTop: '0.35rem'
                      }}
                    >
                      <Upload size={14} /> Browse from Computer
                    </button>
                  </div>

                  {uploadError && (
                    <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>
                      ⚠️ {uploadError}
                    </div>
                  )}

                  {/* Uploaded Files Gallery */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                          Attached Files ({uploadedFiles.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#047857',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          <Plus size={13} /> Add Another File
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                        {uploadedFiles.map((file, fIdx) => (
                          <div
                            key={file.id || fIdx}
                            style={{
                              border: '1.5px solid #cbd5e1',
                              background: '#f8fafc',
                              borderRadius: '10px',
                              padding: '0.6rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.55rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                              <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                background: '#ecfdf5',
                                color: '#047857',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <FileCheck size={16} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                  {file.size} • <span style={{ color: '#059669', fontWeight: 700 }}>{file.format}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(file.id)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Special Instructions / Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide stitch density details, thread color codes (Madeira/Isacord), Pantone PMS numbers, backing preferences, or production deadlines..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.95rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

              </div>
            )}

            {/* =========================================================================
                STEP 4: TECHNICAL SPECIFICATIONS & RUSH TURNAROUND
                ========================================================================= */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Dimensions: Width & Height */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Target Dimensions (Inches)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Width</span>
                      <input
                        type="text"
                        value={widthInches}
                        onChange={(e) => setWidthInches(e.target.value)}
                        placeholder='3.5"'
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>Height</span>
                      <input
                        type="text"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder='3.5"'
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Placement / Style specific */}
                {selectedService === 'embroidery' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                        Placement
                      </label>
                      <select
                        value={placement}
                        onChange={(e) => setPlacement(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff'
                        }}
                      >
                        <option value='Left Chest / Polo (up to 4.0")'>Left Chest / Polo (up to 4.0")</option>
                        <option value='Cap / Hat Front (Curved Center-Out)'>Cap / Hat Front (Curved Center-Out)</option>
                        <option value='Sleeve / Visor / Cuff'>Sleeve / Visor / Cuff</option>
                        <option value='Full Front / Chest'>Full Front / Chest</option>
                        <option value='Full Jacket Back (9"-12"+)'>Full Jacket Back (9"-12"+)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                        Fabric Type
                      </label>
                      <select
                        value={fabricType}
                        onChange={(e) => setFabricType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff'
                        }}
                      >
                        <option value="Cotton / Pique Knit">Cotton / Pique Knit Polo</option>
                        <option value="Structured Twill Cap">Structured Twill Cap</option>
                        <option value="Fleece / Hoodie / Sweatshirt">Fleece / Hoodie / Sweatshirt</option>
                        <option value="Performance Poly / Dri-Fit">Performance Poly / Dri-Fit</option>
                        <option value="Leather / Denim / Heavy Canvas">Leather / Denim / Heavy Canvas</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedService === 'patch' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                        Patch Style
                      </label>
                      <select
                        value={patchStyle}
                        onChange={(e) => setPatchStyle(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff'
                        }}
                      >
                        <option value="Embroidered">🧵 Embroidered Patch</option>
                        <option value="Woven">🌐 Micro Woven Patch</option>
                        <option value="PVC">⚡ 3D Rubber PVC Patch</option>
                        <option value="Leather">🪵 Debossed Leather Patch</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                        Backing Type
                      </label>
                      <select
                        value={patchBacking}
                        onChange={(e) => setPatchBacking(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          background: '#ffffff'
                        }}
                      >
                        <option value="Iron-On">Heat Press / Iron-On (Standard)</option>
                        <option value="Velcro">Hook & Loop (Velcro)</option>
                        <option value="Sew-On">Sew-On (Plastic Backing)</option>
                        <option value="Adhesive">Peel & Stick (Adhesive)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Formats checkboxes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Required Output Formats
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {(selectedService === 'vector' 
                      ? ['AI', 'EPS', 'SVG', 'PDF', 'PNG', 'CDR', 'PSD'] 
                      : (selectedService === 'patch'
                        ? ['DST', 'PDF Proof', 'Physical Patch Shipment']
                        : ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'PDF']
                      )
                    ).map(fmt => {
                      const isSel = selectedFormats.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => handleToggleFormat(fmt)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: isSel ? '1.5px solid #059669' : '1px solid #cbd5e1',
                            background: isSel ? '#ecfdf5' : '#ffffff',
                            color: isSel ? '#047857' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {isSel && <Check size={13} />}
                          <span>{fmt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Express Rush Turnaround */}
                <div
                  onClick={() => setIsRush(!isRush)}
                  style={{
                    border: isRush ? '2px solid #ea580c' : '1.5px solid #cbd5e1',
                    background: isRush ? '#fff7ed' : '#ffffff',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    boxShadow: isRush ? '0 2px 10px rgba(234, 88, 12, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isRush ? '#ea580c' : '#f1f5f9',
                      color: isRush ? '#ffffff' : '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Zap size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                        ⚡ Express Rush Turnaround (2–4 Hours)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Priority desk allocation & instant master digitizer queue (+$${selectedService === 'patch' ? '25.00' : '10.00'})
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '6px',
                    border: isRush ? '2px solid #ea580c' : '2px solid #cbd5e1',
                    background: isRush ? '#ea580c' : '#ffffff',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {isRush && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

              </div>
            )}

            {/* =========================================================================
                STEP 5: REVIEW & CONFIRM ORDER / PAYMENT
                ========================================================================= */}
            {step === 5 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                
                {/* Summary Card */}
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {selectedService === 'patch' ? 'Custom Patches' : (selectedService === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}
                      </span>
                      <h3 style={{ margin: '0.35rem 0 0.15rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                        {orderTitle || activePkg?.title}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Package Tier: <strong style={{ color: '#0f172a' }}>{activePkg?.title}</strong> • Quantity: <strong style={{ color: '#0f172a' }}>{quantity} {selectedService === 'patch' ? 'pcs' : 'designs'}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857' }}>
                        ${totalPrice.toFixed(2)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>
                        Live Verified Total
                      </span>
                    </div>
                  </div>

                  {/* Specs row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', fontSize: '0.78rem' }}>
                    <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>Dimensions</span>
                      <strong style={{ color: '#0f172a' }}>{widthInches}" × {heightInches}"</strong>
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>Formats</span>
                      <strong style={{ color: '#0f172a' }}>{selectedFormats.join(', ')}</strong>
                    </div>

                    <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>Speed</span>
                      <strong style={{ color: isRush ? '#ea580c' : '#059669' }}>
                        {isRush ? '⚡ 2–4H Express Rush' : activePkg?.turnaround}
                      </strong>
                    </div>
                  </div>

                  {/* Attached files preview */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                      <FileCheck size={16} style={{ color: '#059669' }} />
                      <span>{uploadedFiles.length} file(s) attached: <strong style={{ color: '#0f172a' }}>{uploadedFiles.map(f => f.name).join(', ')}</strong></span>
                    </div>
                  )}

                  {/* Promo Code Input */}
                  <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.2rem' }}>
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      placeholder="Coupon / Promo Code (e.g. SAVE15)"
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.85rem',
                        borderRadius: '8px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.82rem',
                        color: '#0f172a',
                        textTransform: 'uppercase'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      style={{
                        background: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Apply Code
                    </button>
                  </div>
                </div>

                {/* Inline Auth for Guest Users */}
                {!isAuthenticated && !authUser && (
                  <div style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                        Studio Account Setup / Sign In
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => setGuestAuthMode('signup')}
                          style={{
                            background: guestAuthMode === 'signup' ? '#059669' : '#f1f5f9',
                            color: guestAuthMode === 'signup' ? '#ffffff' : '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Create Account
                        </button>
                        <button
                          type="button"
                          onClick={() => setGuestAuthMode('login')}
                          style={{
                            background: guestAuthMode === 'login' ? '#059669' : '#f1f5f9',
                            color: guestAuthMode === 'login' ? '#ffffff' : '#475569',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.25rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Sign In
                        </button>
                      </div>
                    </div>

                    {/* 1-Click Social Logins (Google & Apple) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.65rem' }}>
                      <GoogleCustomSignInButton
                        onAuthSuccess={handleGoogleAuthSuccess}
                        onAuthError={(err) => {
                          if (showToast) showToast(err || 'Google sign-in cancelled', 'error');
                        }}
                        style={{ height: '42px', borderRadius: '10px', fontSize: '0.84rem' }}
                        text="Continue with Google"
                      />

                      <button
                        type="button"
                        onClick={handleAppleAuth}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #000000',
                          background: '#000000',
                          color: '#ffffff',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          boxSizing: 'border-box'
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 170 170" fill="currentColor">
                          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.77-11.74-14.2-7.41-11.51-11.11-23.79-11.11-36.83 0-14.56 4.35-26.65 13.06-36.27 8.7-9.63 19.34-14.52 31.91-14.68 4.79 0 10.12 1.25 15.99 3.75 5.87 2.5 9.74 3.82 11.61 3.96 1.74-.14 5.72-1.5 11.94-4.08 6.22-2.58 11.45-3.75 15.69-3.52 11.85.65 21.32 4.96 28.41 12.92-10.45 6.32-15.57 15.14-15.35 26.46.22 8.71 3.65 16.03 10.29 21.95 6.64 5.92 14.52 9.4 23.63 10.43-2.18 6.31-4.78 12.83-7.81 19.57zM119.22 33.72c0-7.39 2.67-14.35 8.01-20.88C132.57 6.31 139.31 2.06 147.45 0c.22 1.31.33 2.5.33 3.59 0 7.39-2.83 14.47-8.49 21.23-5.66 6.75-12.63 10.74-20.91 11.97-.22-1.09-.33-2.07-.33-3.07z" />
                        </svg>
                        <span>Continue with Apple</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', margin: '0.1rem 0' }}>
                      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
                        or {guestAuthMode === 'signup' ? 'create with email' : 'sign in with email'}
                      </span>
                      <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: guestAuthMode === 'signup' ? '1fr 1fr' : '1fr 1fr', gap: '0.65rem' }}>
                      {guestAuthMode === 'signup' && (
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Your Full Name *"
                          style={{
                            padding: '0.55rem 0.85rem',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.82rem'
                          }}
                        />
                      )}
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="Email Address *"
                        style={{
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.82rem'
                        }}
                      />
                      <input
                        type="password"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                        placeholder="Password *"
                        style={{
                          padding: '0.55rem 0.85rem',
                          borderRadius: '8px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.82rem'
                        }}
                      />
                      {guestAuthMode === 'signup' && (
                        <input
                          type="text"
                          value={guestCompany}
                          onChange={(e) => setGuestCompany(e.target.value)}
                          placeholder="Company / Brand (Optional)"
                          style={{
                            padding: '0.55rem 0.85rem',
                            borderRadius: '8px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.82rem'
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* FOOTER NAVIGATION CONTROLS */}
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1.5px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, display: 'block' }}>Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                  ${totalPrice.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmittingOrder || isSubmittingAuth}
                onClick={() => {
                  if (step === 1) {
                    setStep(2);
                  } else if (step === 2) {
                    const parsed = parseInt(quantityInput, 10);
                    if (selectedService === 'patch' && (quantity < 50 || isNaN(parsed) || parsed < 50)) {
                      setQuantity(50);
                      setQuantityInput('50');
                      if (showToast) showToast('Minimum order quantity for Custom Patches is 50 pieces.', 'warning');
                      return;
                    }
                    setStep(3);
                  } else if (step === 3) {
                    if (uploadedFiles.length === 0) {
                      setUploadError('Please attach at least one artwork file to proceed.');
                      if (fileInputRef.current) fileInputRef.current.click();
                      return;
                    }
                    setStep(4);
                  } else if (step === 4) {
                    setStep(5);
                  } else if (step === 5) {
                    handleSubmitOrder();
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.7rem 1.45rem',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: (isSubmittingOrder || isSubmittingAuth) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                }}
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Recording Order...
                  </>
                ) : step === 1 ? (
                  <>
                    Next: Select Package <ArrowRight size={16} />
                  </>
                ) : step === 2 ? (
                  <>
                    Next: Upload Artwork <ArrowRight size={16} />
                  </>
                ) : step === 3 ? (
                  uploadedFiles.length === 0 ? (
                    <>
                      <Upload size={16} /> Choose Artwork & Continue
                    </>
                  ) : (
                    <>
                      Next: Technical Specs <ArrowRight size={16} />
                    </>
                  )
                ) : step === 4 ? (
                  <>
                    Next: Review & Pay <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    🚀 Confirm & Place Order (${totalPrice.toFixed(2)}) <Check size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default OrderWizardModal;
