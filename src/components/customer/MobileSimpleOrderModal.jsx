'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState, formatOrderId as _formatOrderId } from '../../context/StateContext';
import {
  X,
  Upload,
  Layers,
  PenTool,
  Package,
  Zap,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Trash2,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';
import {
  getActivePromotion,
  getServiceDiscountPercent,
  calculateOrderPricing,
  getServiceDisplayName,
  normalizeServiceKey as _normalizeServiceKey
} from '../../utils/promoUtils';
import { GoogleCustomSignInButton } from '../auth/GoogleCustomSignInButton';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';

// Standard fallback package tiers matching website /app/pricing/page.jsx
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
      features: ['Up to 4" x 4" Dimensions', 'Manual Pathing', 'Cap Curved Optimization', '.DST, .PES, .EMB + PDF'],
      defaultFormats: ['DST', 'PES', 'EMB', 'PDF'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Left Chest / Cap'
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
      features: ['Up to 7" x 7" Medium Artwork Area', 'Multi-Color Layering', 'Free Unlimited Revisions'],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'PDF'],
      defaultWidth: '6.0',
      defaultHeight: '6.0',
      defaultPlacement: 'Jacket Front / Sleeve'
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
      features: ['Up to 12" x 12" Full Back Area', '3D Puff Foam', '24/7 Priority Support'],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'PDF'],
      defaultWidth: '10.5',
      defaultHeight: '10.5',
      defaultPlacement: 'Full Jacket Back'
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
      features: ['Clean Bézier Curves', 'Sharp 100% Scalable Vector Paths', 'Suite: .AI, .EPS, .SVG, .PDF'],
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
      features: ['Multi-Color Separation', 'Production Ready Print Files', 'Unlimited Revisions'],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'CDR'],
      defaultWidth: '8.0',
      defaultHeight: '8.0',
      defaultPlacement: 'Color Separation'
    },
    {
      id: 'vec-pro',
      service_type: 'vector',
      badge: 'COMPLEX / ILLUSTRATION',
      is_popular: false,
      title: 'Complex Illustration & Detailed Art',
      subtitle: 'Intricate micro-details, gradients, halftones & photo redraws.',
      price: 45,
      original_price: 65,
      turnaround: '12–24 Hours',
      features: ['Intricate Micro-Detail Redraw', 'Custom Halftones & Gradients', 'Laser Engraving & CNC Ready'],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'CDR', 'PNG'],
      defaultWidth: '10.0',
      defaultHeight: '10.0',
      defaultPlacement: 'High-Res Print Ready'
    }
  ],
  patch: [
    {
      id: 'patch-basic',
      service_type: 'patch',
      badge: 'STARTER BATCH (50 PCS)',
      is_popular: false,
      title: 'Starter Run (50 Pcs)',
      subtitle: 'Custom manufactured patches with iron-on or velcro backing.',
      price: 3.50,
      original_price: 5.00,
      turnaround: '5–7 Days',
      features: ['50 Pcs Minimum Order', 'Free Digital Proof', 'Iron-On or Velcro Backing'],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Shipment'],
      defaultWidth: '3.0',
      defaultHeight: '3.0',
      defaultPlacement: 'Custom Laser Cut Shape'
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      badge: 'MOST POPULAR (100+ PCS)',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Uniform programs, merch drops, motorcycle clubs & business logos.',
      price: 2.50,
      original_price: 4.00,
      turnaround: '5–7 Days',
      features: ['Precision Laser-Cut Borders', 'Free Digital & Physical Mockup', 'Free Tracked Shipping'],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Round / Oval Emblem'
    },
    {
      id: 'patch-pro',
      service_type: 'patch',
      badge: 'ENTERPRISE BULK (500+ PCS)',
      is_popular: false,
      title: 'Bulk Enterprise (500+ Pcs)',
      subtitle: 'High volume wholesale manufacturing with best piece rates.',
      price: 1.50,
      original_price: 2.50,
      turnaround: '7–10 Days',
      features: ['Highest Volume Discount', 'Premium Thread & PVC Finishes', 'Priority Production Schedule'],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Square / Shield'
    }
  ]
};

// 3 Core Services configuration with tap-friendly visual cards
const SERVICE_OPTIONS = [
  {
    id: 'embroidery',
    title: 'Embroidery Digitizing',
    badge: 'Caps, Polos & Hoodies',
    icon: Layers,
    color: '#059669',
    startingPrice: '$10',
    turnaround: '4–12 Hours'
  },
  {
    id: 'vector',
    title: 'Vector Art Tracing',
    badge: 'Sharp Redraw & Print',
    icon: PenTool,
    color: '#ea580c',
    startingPrice: '$15',
    turnaround: '6–12 Hours'
  },
  {
    id: 'patch',
    title: 'Custom Patches',
    badge: 'Physical Patches Shipped',
    icon: Package,
    color: '#0284c7',
    startingPrice: 'From $1.50/pc',
    turnaround: '5–7 Days'
  }
];

// Visual selectable pill chips per service
const PLACEMENT_OPTIONS = {
  embroidery: [
    { id: 'Left Chest / Cap', label: 'Left Chest / Cap', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Full Jacket Back', label: 'Full Jacket Back', defaultWidth: '10.5', defaultHeight: '10.5' },
    { id: 'Sleeve / Other', label: 'Sleeve / Other', defaultWidth: '4.0', defaultHeight: '4.0' }
  ],
  vector: [
    { id: 'Logo / Graphic Redraw', label: 'Logo / Graphic Redraw', defaultWidth: '5.0', defaultHeight: '5.0' },
    { id: 'Color Separation', label: 'Color Separation', defaultWidth: '8.0', defaultHeight: '8.0' },
    { id: 'High-Res Print Ready', label: 'High-Res Print Ready', defaultWidth: '10.0', defaultHeight: '10.0' }
  ],
  patch: [
    { id: 'Custom Laser Cut Shape', label: 'Custom Shape Cut', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Round / Oval Emblem', label: 'Round / Oval', defaultWidth: '3.0', defaultHeight: '3.0' },
    { id: 'Square / Shield', label: 'Square / Shield', defaultWidth: '3.5', defaultHeight: '3.5' }
  ]
};

export const MobileSimpleOrderModal = ({
  isOpen,
  onClose,
  defaultService = 'embroidery',
  onOrderCreated,
  initialData = null
}) => {
  const {
    createOrder,
    authUser,
    currentUser,
    isAuthenticated,
    register,
    login,
    loginWithGoogle,
    showToast,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    dynamicPricingTiers = [],
    refreshOrders,
    siteSettings,
    theme
  } = useAppState();

  const isDark = theme === 'dark';

  // 3-Step Flow State: 1: Service & Artwork, 2: Placement & Size, 3: Review & Submit, 4: Confirmed
  const [step, setStep] = useState(1);

  // Step 1: Service, Packages & Artwork
  const [selectedService, setSelectedService] = useState('embroidery');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [orderTitle, setOrderTitle] = useState('');

  // Step 2: Placement, Size & Notes
  const [placement, setPlacement] = useState('Left Chest / Cap');
  const [sizeMode, setSizeMode] = useState('auto'); // 'auto' (Pro decision) or 'custom'
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [notes, setNotes] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Advanced Technical Options (Industry defaults applied)
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB', 'PDF']);
  const [fabricType, setFabricType] = useState('Cotton / Pique Knit');
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [isRush, setIsRush] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Step 3: Guest Authentication State
  const [guestAuthMode, setGuestAuthMode] = useState('signup');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestCompany, _setGuestCompany] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [guestAuthRequested, setGuestAuthRequested] = useState(false);
  const [formValidationError, setFormValidationError] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderObj, setCreatedOrderObj] = useState(null);

  // DOM Refs for smooth auto-scrolling
  const uploadAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const guestAuthCardRef = useRef(null);
  const guestEmailInputRef = useRef(null);
  const contentScrollRef = useRef(null);

  const { handleSafeClose } = useModalBackNavigation({
    isOpen,
    onClose,
    modalId: 'mobile_order_wizard'
  });

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
        turnaround: t.turnaround_time || (catKey === 'patch' ? '5–7 Days' : '4–12 Hours'),
        features: Array.isArray(t.features) ? t.features : [],
        defaultFormats: catKey === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : catKey === 'patch' ? ['DST', 'PDF Proof'] : ['DST', 'PES', 'EMB', 'PDF'],
        defaultWidth: '3.5',
        defaultHeight: '3.5',
        defaultPlacement: catKey === 'patch' ? 'Custom Laser Cut Shape' : 'Left Chest / Cap'
      }));
    }
    return coreList;
  };

  // Reset and initialize on open
  /* oxlint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isOpen) {
      const incomingRaw = initialData?.type || initialData?.serviceCategory || defaultService || 'embroidery';
      const normService = (incomingRaw === 'patch' || incomingRaw === 'patches' || incomingRaw === 'custom_patches')
        ? 'patch'
        : (incomingRaw === 'vector' || incomingRaw === 'vector-art' || incomingRaw === 'vector_art')
          ? 'vector'
          : 'embroidery';

      setSelectedService(normService);
      setStep(1);
      setUploadedFiles([]);
      setUploadError(null);
      setFormValidationError(null);
      setOrderTitle('');
      setNotes('');
      setIsRush(false);
      setSizeMode('auto');
      setIsNotesOpen(false);
      setIsAdvancedOpen(false);
      setGuestAuthRequested(false);

      const pkgs = getPackagesForCategory(normService);
      const initialPkg = pkgs.find(p => p.is_popular) || pkgs[0];
      setSelectedPackage(initialPkg);

      const defaultPlacements = PLACEMENT_OPTIONS[normService] || PLACEMENT_OPTIONS.embroidery;
      const initialPlacement = defaultPlacements[0];
      setPlacement(initialPlacement.id);
      setWidthInches(initialPkg?.defaultWidth || initialPlacement.defaultWidth);
      setHeightInches(initialPkg?.defaultHeight || initialPlacement.defaultHeight);

      const defQty = normService === 'patch' ? 50 : 1;
      setQuantity(defQty);
      setQuantityInput(String(defQty));

      if (normService === 'vector') {
        setSelectedFormats(initialPkg?.defaultFormats || ['AI', 'EPS', 'SVG', 'PDF']);
      } else if (normService === 'patch') {
        setSelectedFormats(initialPkg?.defaultFormats || ['DST', 'PDF Proof']);
      } else {
        setSelectedFormats(initialPkg?.defaultFormats || ['DST', 'PES', 'EMB', 'PDF']);
      }

      // Check active live promotion from Supabase siteSettings
      const livePromo = getActivePromotion(siteSettings?.promotions);
      const initialCode = initialData?.promoCode || siteSettings?.announcement?.promoCode || livePromo?.promoCode || 'PROMO';
      const hasServiceDiscount = Boolean(livePromo || (siteSettings?.service_discounts && siteSettings?.service_discounts?.enabled !== false));

      if (hasServiceDiscount || initialData?.promoCode || siteSettings?.announcement?.promoCode) {
        setPromoCodeInput(initialCode);
        setAppliedPromo({
          code: initialCode.toUpperCase(),
          isGranular: true,
          promoObj: livePromo
        });
      }
    }
  }, [isOpen, defaultService, initialData, siteSettings?.promotions, siteSettings?.service_discounts]);
  /* oxlint-enable react-hooks/exhaustive-deps */

  if (!isOpen) return null;

  // Active pricing calculation
  const currentPackages = getPackagesForCategory(selectedService);
  const activePkg = selectedPackage || currentPackages.find(p => p.is_popular) || currentPackages[0];
  const unitPrice = Number(activePkg?.price || (selectedService === 'patch' ? 2.50 : selectedService === 'vector' ? 25 : 20));

  const activePromotion = getActivePromotion(siteSettings?.promotions);
  const effectivePromo = appliedPromo?.promoObj || activePromotion;
  const hasGranularRates = Boolean(
    (effectivePromo && effectivePromo.serviceDiscounts && Object.keys(effectivePromo.serviceDiscounts).length > 0) ||
    (siteSettings?.service_discounts && siteSettings?.service_discounts?.enabled !== false)
  );

  const pricingResult = calculateOrderPricing({
    service: selectedService,
    unitPrice,
    quantity,
    isRush,
    activePromo: effectivePromo,
    siteSettings,
    customPromoPercent: (appliedPromo?.isCustomPercent && !hasGranularRates) ? appliedPromo.discountPercent : undefined
  });

  const baseSubtotal = pricingResult.baseSubtotal;
  const volumeDiscountPercent = pricingResult.volumeDiscountPercent;
  const volumeDiscountAmount = pricingResult.volumeDiscountAmount;
  const promoDiscountPercent = pricingResult.promoDiscountPercent;
  const promoDiscountAmount = pricingResult.promoDiscountAmount;
  const rushFee = pricingResult.rushFee;
  const totalPrice = Math.max(0, parseFloat((baseSubtotal - volumeDiscountAmount - promoDiscountAmount + rushFee).toFixed(2)));
  const serviceDisplayName = pricingResult.serviceName || getServiceDisplayName(selectedService);

  // Service switch handler
  const handleSelectService = (serviceId) => {
    setSelectedService(serviceId);
    setFormValidationError(null);

    const pkgs = getPackagesForCategory(serviceId);
    const initialPkg = pkgs.find(p => p.is_popular) || pkgs[0];
    setSelectedPackage(initialPkg);

    const defaultPlacements = PLACEMENT_OPTIONS[serviceId] || PLACEMENT_OPTIONS.embroidery;
    const initialPlacement = defaultPlacements[0];
    setPlacement(initialPkg?.defaultPlacement || initialPlacement.id);
    setWidthInches(initialPkg?.defaultWidth || initialPlacement.defaultWidth);
    setHeightInches(initialPkg?.defaultHeight || initialPlacement.defaultHeight);

    const newQty = serviceId === 'patch' ? 50 : 1;
    setQuantity(newQty);
    setQuantityInput(String(newQty));

    if (serviceId === 'vector') {
      setSelectedFormats(initialPkg?.defaultFormats || ['AI', 'EPS', 'SVG', 'PDF']);
    } else if (serviceId === 'patch') {
      setSelectedFormats(initialPkg?.defaultFormats || ['DST', 'PDF Proof']);
    } else {
      setSelectedFormats(initialPkg?.defaultFormats || ['DST', 'PES', 'EMB', 'PDF']);
    }
  };

  // Package switch handler
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setFormValidationError(null);
    if (pkg.defaultPlacement) setPlacement(pkg.defaultPlacement);
    if (pkg.defaultWidth) setWidthInches(pkg.defaultWidth);
    if (pkg.defaultHeight) setHeightInches(pkg.defaultHeight);
    if (pkg.defaultFormats) setSelectedFormats(pkg.defaultFormats);
  };

  // Placement chip switch handler
  const handleSelectPlacement = (item) => {
    setPlacement(item.id);
    if (sizeMode === 'auto') {
      setWidthInches(item.defaultWidth);
      setHeightInches(item.defaultHeight);
    }
  };

  // Multiple files upload handler
  const handleMultipleFiles = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const oversized = rawFiles.find(f => f.size > 50 * 1024 * 1024);
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds 50MB file limit.`);
      return;
    }

    setUploadError(null);
    setFormValidationError(null);
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
      if (showToast) showToast(`✓ ${newUploaded.length} artwork file(s) attached!`, 'success');
      
      // Auto-set title from first file if blank
      if (!orderTitle.trim() && newUploaded[0]?.name) {
        setOrderTitle(newUploaded[0].name.replace(/\.[^/.]+$/, ''));
      }
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

  const handleQuantityChange = (delta) => {
    const minVal = selectedService === 'patch' ? 50 : 1;
    const stepVal = selectedService === 'patch' ? 10 : 1;
    const nextVal = Math.max(minVal, quantity + (delta * stepVal));
    setQuantity(nextVal);
    setQuantityInput(String(nextVal));
  };

  const handleApplyPromo = () => {
    if (!promoCodeInput || !promoCodeInput.trim()) return;
    const clean = promoCodeInput.trim().toUpperCase();

    const livePromo = getActivePromotion(siteSettings?.promotions);
    const activeCode = (livePromo?.promoCode || siteSettings?.announcement?.promoCode || '').toUpperCase();

    const hasGranular = Boolean(
      (livePromo && livePromo.serviceDiscounts && Object.keys(livePromo.serviceDiscounts).length > 0) ||
      (siteSettings?.service_discounts && siteSettings?.service_discounts?.enabled !== false)
    );

    const isMatchingPromo = clean === activeCode ||
      clean === 'PROMO' ||
      clean === 'SALE' ||
      clean === 'WELCOME' ||
      clean === 'SPECIAL' ||
      clean === 'DISCOUNT' ||
      (livePromo && clean === `SAVE${livePromo.discountPercent}`) ||
      (hasGranular && clean.startsWith('SAVE'));

    if (isMatchingPromo || hasGranular) {
      setAppliedPromo({
        code: clean,
        isGranular: true,
        promoObj: livePromo
      });
      const pct = getServiceDiscountPercent(selectedService, livePromo, siteSettings);
      if (showToast) {
        showToast(`Promo "${clean}" applied! (${getServiceDisplayName(selectedService)}: ${pct}% OFF)`, 'success');
      }
      return;
    }

    setAppliedPromo({
      code: clean,
      isGranular: true,
      promoObj: livePromo
    });
    const pct = getServiceDiscountPercent(selectedService, livePromo, siteSettings);
    if (showToast) showToast(`Promo ${clean} applied! (${getServiceDisplayName(selectedService)}: ${pct}% OFF)`, 'success');
  };

  // Step 1 Validation & Navigation
  const handleProceedFromStep1 = () => {
    if (uploadedFiles.length === 0) {
      setUploadError('Please tap above to upload your artwork or reference image.');
      setFormValidationError('Artwork file required to proceed.');
      if (typeof window !== 'undefined') {
        uploadAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setUploadError(null);
    setFormValidationError(null);
    setStep(2);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  };

  // Step 2 Validation & Navigation
  const handleProceedFromStep2 = () => {
    setFormValidationError(null);
    setStep(3);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  };

  // Guest authentication disclosure and smooth auto-scroll
  const revealGuestAuth = () => {
    setGuestAuthRequested(true);
    setFormValidationError('Please enter your name and email to place your order.');
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        guestAuthCardRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        setTimeout(() => guestEmailInputRef.current?.focus(), 300);
      });
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
          await handleSubmitOrder({
            email: res.user.email,
            name: res.user.name || res.user.user_metadata?.full_name || 'Studio Client'
          });
          return;
        }
      }
      if (googleUser?.email) {
        setGuestEmail(googleUser.email);
        setGuestName(googleUser.name || '');
        if (showToast) showToast(`✓ Connected with Google (${googleUser.email})`, 'success');
      }
    } catch (err) {
      console.warn('Google auth notice:', err);
      if (showToast) showToast(err.message || 'Google sign-in notice', 'error');
    }
  };

  // Final Order Submission
  const handleSubmitOrder = async (authenticatedOverride = null) => {
    if (selectedService === 'patch' && quantity < 50) {
      if (showToast) showToast('Minimum order requirement for Custom Patches is 50 pieces.', 'error');
      setQuantity(50);
      setQuantityInput('50');
      setStep(2);
      return;
    }

    if (uploadedFiles.length === 0) {
      setUploadError('Please attach at least one artwork or reference file.');
      setStep(1);
      return;
    }

    let clientEmail = (authenticatedOverride?.email || authUser?.email || currentUser?.email || '').toLowerCase().trim();
    let clientName = authenticatedOverride?.name || authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Studio Client';
    const hasAuthenticatedOverride = Boolean(authenticatedOverride?.email);

    if (!hasAuthenticatedOverride && !isAuthenticated && !authUser) {
      if (!guestEmail.trim() || !guestPassword.trim()) {
        revealGuestAuth();
        return;
      }

      setIsSubmittingAuth(true);
      try {
        if (guestAuthMode === 'signup') {
          const regRes = await register(guestName.trim() || 'Client', guestEmail.trim(), guestPassword.trim(), guestCompany.trim());
          if (!regRes || !regRes.success) {
            if (showToast) showToast(regRes?.error || 'Registration failed. Please check your details.', 'error');
            return;
          }
          clientEmail = guestEmail.trim().toLowerCase();
          clientName = guestName.trim() || 'Client';
        } else {
          const logRes = await login(guestEmail.trim(), guestPassword.trim());
          if (!logRes || !logRes.success) {
            if (showToast) showToast(logRes?.error || 'Login failed. Please check your credentials.', 'error');
            return;
          }
          clientEmail = guestEmail.trim().toLowerCase();
        }
      } catch (authErr) {
        if (showToast) showToast('Authentication error: ' + authErr.message, 'error');
        return;
      } finally {
        setIsSubmittingAuth(false);
      }
    }

    setIsSubmitting(true);
    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Artwork';
      const cleanService = selectedService === 'vector'
        ? 'Vector Art'
        : selectedService === 'patch'
          ? 'Custom Patches'
          : 'Embroidery Digitizing';

      const derivedTitle = orderTitle.trim() || (selectedService === 'patch'
        ? `${patchStyle} Patches (${quantity} Pcs)`
        : `${firstFileName} - ${cleanService}`);

      const finalClientEmail = (clientEmail || authUser?.email || currentUser?.email || '').toLowerCase().trim();
      if (!finalClientEmail) {
        if (showToast) showToast('Account email could not be verified. Please sign in again.', 'error');
        return;
      }
      const finalClientName = clientName || authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || finalClientEmail.split('@')[0];
      const primaryArtworkUrl = uploadedFiles[0]?.url || null;

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        package_name: activePkg?.title || `${cleanService} Standard`,
        package_tier: activePkg?.badge || 'STANDARD',
        quantity: quantity,
        price: totalPrice,
        totalPrice: totalPrice,
        base_price: baseSubtotal,
        discount_amount: parseFloat((volumeDiscountAmount + promoDiscountAmount).toFixed(2)),
        applied_promo_code: appliedPromo?.code || null,
        discount_breakdown: {
          base_price: baseSubtotal,
          volume_discount_percent: volumeDiscountPercent,
          volume_discount_amount: volumeDiscountAmount,
          promo_discount_percent: promoDiscountPercent,
          promo_discount_amount: promoDiscountAmount,
          service_key: selectedService,
          service_name: serviceDisplayName,
          rush_fee: rushFee,
          final_price: totalPrice
        },
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
        client_email: finalClientEmail,
        clientEmail: finalClientEmail,
        clientName: finalClientName,
        status: 'pending_payment',
        payment_status: 'unpaid'
      };

      const created = await createOrder(orderPayload);
      const resultingOrder = created || {
        id: `ORD-${Date.now()}`,
        ...orderPayload
      };

      if (typeof window !== 'undefined' && resultingOrder?.id) {
        try {
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingOrder.id).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
        } catch {}
      }

      if (typeof refreshOrders === 'function') {
        refreshOrders().catch(() => {});
      }

      setCreatedOrderObj(resultingOrder);
      if (typeof onOrderCreated === 'function') {
        onOrderCreated(resultingOrder);
      }
      setStep(4); // Success confirmation step
      if (showToast) showToast('Order successfully generated! Complete payment to begin production.', 'success');
    } catch (err) {
      console.error('Order creation error:', err);
      if (showToast) showToast('Failed to create order: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = () => {
    if (createdOrderObj) {
      const priceVal = parseFloat(createdOrderObj.totalPrice || createdOrderObj.price || totalPrice || 10);
      setCheckoutSession({
        amount: priceVal,
        price: priceVal,
        totalPrice: priceVal,
        base_price: createdOrderObj.base_price || baseSubtotal,
        discount_amount: createdOrderObj.discount_amount || parseFloat((volumeDiscountAmount + promoDiscountAmount).toFixed(2)),
        discount_breakdown: createdOrderObj.discount_breakdown || null,
        orderId: createdOrderObj.id,
        title: createdOrderObj.title || `Order ${createdOrderObj.id}`,
        clientEmail: createdOrderObj.clientEmail || authUser?.email,
        serviceType: createdOrderObj.serviceCategory || createdOrderObj.type || selectedService
      });
      setIsCheckoutModalOpen(true);
      if (typeof onOrderCreated === 'function') {
        onOrderCreated(createdOrderObj);
      }
      handleSafeClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
      onClick={handleSafeClose}
    >
      <div
        style={{
          background: isDark ? 'var(--color-surface, #0f172a)' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '94vh',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -12px 48px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP PULL BAR */}
        <div style={{ padding: '8px 0 2px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '4px', background: isDark ? '#334155' : '#cbd5e1', borderRadius: '999px' }} />
        </div>

        {/* MODAL HEADER */}
        <div style={{
          padding: '0.65rem 1.15rem 0.75rem',
          borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark ? 'var(--color-surface, #0f172a)' : '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {step > 1 && step < 4 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                style={{
                  background: isDark ? '#1e293b' : '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  cursor: 'pointer'
                }}
                aria-label="Previous Step"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  {step < 4 ? `STEP ${step} OF 3` : 'CONFIRMED'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  {step === 1 && 'Service & Artwork'}
                  {step === 2 && 'Placement & Size'}
                  {step === 3 && 'Review & Submit'}
                  {step === 4 && 'Order Placed!'}
                </h3>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                {step === 1 && 'Choose service and tap to attach reference artwork.'}
                {step === 2 && 'Select placement chips and preferred dimensions.'}
                {step === 3 && 'Instant dispatch with live turnaround & transparent pricing.'}
                {step === 4 && 'Your order is booked into our live production queue.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            style={{
              background: isDark ? '#1e293b' : '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDark ? '#f8fafc' : '#0f172a',
              cursor: 'pointer'
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3-SEGMENT PROGRESS BAR */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: '4px', padding: '0.35rem 1.15rem 0.2rem', background: isDark ? '#0b1120' : '#f8fafc' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '999px',
                  background: step >= i
                    ? 'linear-gradient(90deg, #059669 0%, #10b981 100%)'
                    : isDark ? '#1e293b' : '#e2e8f0',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* INLINE VALIDATION BANNER */}
        {formValidationError && (
          <div style={{
            margin: '0.5rem 1.15rem 0',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{formValidationError}</span>
          </div>
        )}

        {/* SCROLLABLE FORM BODY */}
        <div
          ref={contentScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem 1.15rem 7rem 1.15rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* ================= STEP 1: SERVICE & ARTWORK ================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* SERVICE SELECTION CARDS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.55rem' }}>
                  1. Select Studio Service
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                  {SERVICE_OPTIONS.map(svc => {
                    const isSelected = selectedService === svc.id;
                    const IconComp = svc.icon;

                    return (
                      <div
                        key={svc.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectService(svc.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectService(svc.id); }}
                        style={{
                          minHeight: '68px',
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: isSelected ? '#059669' : isDark ? '#0f172a' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : svc.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IconComp size={22} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                              {svc.title}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669' }}>
                              {svc.startingPrice}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                              {svc.badge}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                              ⚡ {svc.turnaround}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid #94a3b8',
                          background: isSelected ? '#059669' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. CHOOSE PACKAGE TIER (3 PACKAGES PER SERVICE) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    2. Choose {selectedService === 'vector' ? 'Vector' : selectedService === 'patch' ? 'Patch' : 'Embroidery'} Package
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                    {activePkg?.badge || 'STANDARD'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {currentPackages.map(pkg => {
                    const isSelected = (activePkg?.id === pkg.id) || (selectedPackage?.id === pkg.id);

                    return (
                      <div
                        key={pkg.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPackage(pkg)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPackage(pkg); }}
                        style={{
                          minHeight: '64px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          padding: '0.75rem 0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                              {pkg.title}
                            </span>
                            {pkg.is_popular && (
                              <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                color: '#ffffff',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '4px',
                                letterSpacing: '0.04em'
                              }}>
                                MOST POPULAR
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                            <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                              {pkg.subtitle || (pkg.features && pkg.features[0]) || ''}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8', flexShrink: 0, marginLeft: '0.5rem' }}>
                              ⚡ {pkg.turnaround}
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div>
                            <div style={{ fontSize: '0.98rem', fontWeight: 900, color: '#059669' }}>
                              {selectedService === 'patch' ? `$${Number(pkg.price).toFixed(2)}/pc` : `$${Number(pkg.price).toFixed(2)}`}
                            </div>
                            {pkg.original_price && (
                              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8', textDecoration: 'line-through' }}>
                                ${Number(pkg.original_price).toFixed(2)}
                              </div>
                            )}
                          </div>

                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? 'none' : '2px solid #94a3b8',
                            background: isSelected ? '#059669' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            flexShrink: 0
                          }}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ARTWORK UPLOAD ZONE */}
              <div ref={uploadAreaRef}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    3. Upload Artwork / Reference <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {uploadedFiles.length > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                      ✓ {uploadedFiles.length} File(s) Attached
                    </span>
                  )}
                </div>

                {/* HIDDEN FILE INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMultipleFiles}
                  multiple
                  accept="image/*,application/pdf,.ai,.eps,.dst,.pes,.emb,.svg"
                  style={{ display: 'none' }}
                />

                {/* TAP TO UPLOAD BOX */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                  style={{
                    minHeight: '110px',
                    borderRadius: '18px',
                    border: uploadError
                      ? '2px dashed #ef4444'
                      : uploadedFiles.length > 0
                        ? '1.5px dashed #059669'
                        : isDark ? '2px dashed #334155' : '2px dashed #cbd5e1',
                    background: uploadedFiles.length > 0
                      ? isDark ? 'rgba(5, 150, 105, 0.08)' : '#f0fdf4'
                      : isDark ? '#1e293b' : '#f8fafc',
                    padding: '1.15rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isUploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <Loader2 size={28} className="animate-spin" style={{ color: '#059669' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                        Uploading artwork to secure cloud...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isDark ? '#0f172a' : '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <Upload size={22} />
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                        Tap to upload image/artwork
                      </div>
                      <div style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.2rem' }}>
                        Camera, Gallery, PDF, AI or EPS (up to 50MB)
                      </div>
                    </>
                  )}
                </div>

                {uploadError && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={14} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* UPLOADED FILE PREVIEWS */}
                {uploadedFiles.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        style={{
                          background: isDark ? '#1e293b' : '#ffffff',
                          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '0.55rem 0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem'
                        }}
                      >
                        {file.url && (file.format === 'PNG' || file.format === 'JPG' || file.format === 'JPEG' || file.format === 'WEBP') ? (
                          <img
                            src={file.url}
                            alt="preview"
                            style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: isDark ? '#0f172a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                            <FileText size={22} />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {file.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            {file.size} • {file.format}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(file.id);
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            padding: '8px',
                            minWidth: '40px',
                            minHeight: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                          aria-label="Remove uploaded file"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DESIGN NAME / REFERENCE */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.45rem' }}>
                  4. Design Name / Reference
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="e.g., Summit Club Cap, Apex Logo"
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    borderRadius: '12px',
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    padding: '0 0.85rem',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          {/* ================= STEP 2: PLACEMENT & SIZE ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* PLACEMENT SELECTABLE PILL CHIPS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.55rem' }}>
                  Placement Location
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {(PLACEMENT_OPTIONS[selectedService] || PLACEMENT_OPTIONS.embroidery).map(item => {
                    const isSelected = placement === item.id;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPlacement(item)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPlacement(item); }}
                        style={{
                          minHeight: '50px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a' }}>
                          {item.label}
                        </span>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid #94a3b8',
                          background: isSelected ? '#059669' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff'
                        }}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TARGET SIZE CONFIGURATION */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.55rem' }}>
                  Target Size
                </label>

                {/* TOGGLE: AUTO VS CUSTOM */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSizeMode('auto')}
                    style={{
                      minHeight: '48px',
                      borderRadius: '12px',
                      border: sizeMode === 'auto' ? '2px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                      background: sizeMode === 'auto'
                        ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                        : isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Pro Scale (Auto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeMode('custom')}
                    style={{
                      minHeight: '48px',
                      borderRadius: '12px',
                      border: sizeMode === 'custom' ? '2px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                      background: sizeMode === 'custom'
                        ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                        : isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Custom Inches
                  </button>
                </div>

                {sizeMode === 'auto' ? (
                  <div style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '12px',
                    background: isDark ? '#1e293b' : '#f8fafc',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    color: isDark ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Sparkles size={18} style={{ color: '#059669', flexShrink: 0 }} />
                    <span>Our master digitizer will calculate optimal proportions for best stitch quality ({widthInches}&quot; x {heightInches}&quot;).</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>Width (Inches)</span>
                      <input
                        type="text"
                        value={widthInches}
                        onChange={(e) => setWidthInches(e.target.value)}
                        placeholder="e.g., 3.5 inches"
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          borderRadius: '12px',
                          border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                          background: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#ffffff' : '#0f172a',
                          padding: '0 0.85rem',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                          marginTop: '0.25rem'
                        }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>Height (Inches)</span>
                      <input
                        type="text"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="e.g., 3.5 inches"
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          borderRadius: '12px',
                          border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                          background: isDark ? '#1e293b' : '#ffffff',
                          color: isDark ? '#ffffff' : '#0f172a',
                          padding: '0 0.85rem',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                          outline: 'none',
                          marginTop: '0.25rem'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SPECIAL INSTRUCTIONS (COLLAPSIBLE) */}
              <div style={{
                borderRadius: '14px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                background: isDark ? '#1e293b' : '#ffffff',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setIsNotesOpen(prev => !prev)}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span>Add special notes / thread colors (optional)</span>
                  {isNotesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isNotesOpen && (
                  <div style={{ padding: '0 1rem 1rem' }}>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Thread colors: Madeira Polyneon 1801 White, 1842 Blue. Keep background transparent. 3D puff on bold lettering..."
                      style={{
                        width: '100%',
                        borderRadius: '10px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#0f172a' : '#f8fafc',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ADVANCED OPTIONS (OPTIONAL ACCORDION) */}
              <div style={{
                borderRadius: '14px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                background: isDark ? '#1e293b' : '#ffffff',
                overflow: 'hidden'
              }}>
                <button
                  type="button"
                  onClick={() => setIsAdvancedOpen(prev => !prev)}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: '0.75rem 1rem',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>⚙️ Advanced Options (Optional)</span>
                    <span style={{ fontSize: '0.68rem', color: '#059669', background: isDark ? 'rgba(5,150,105,0.2)' : '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      Defaults Applied
                    </span>
                  </div>
                  {isAdvancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isAdvancedOpen && (
                  <div style={{ padding: '0 1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* FORMATS CHIPS */}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                        Machine Formats
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.35rem' }}>
                        {(selectedService === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF', 'CDR'] : ['DST', 'PES', 'EMB', 'EXP', 'PDF']).map(fmt => {
                          const isSelected = selectedFormats.includes(fmt);
                          return (
                            <button
                              key={fmt}
                              type="button"
                              onClick={() => handleToggleFormat(fmt)}
                              style={{
                                minHeight: '36px',
                                padding: '0 0.75rem',
                                borderRadius: '8px',
                                border: isSelected ? '1.5px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                                background: isSelected ? '#059669' : isDark ? '#0f172a' : '#f8fafc',
                                color: isSelected ? '#ffffff' : isDark ? '#94a3b8' : '#475569',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              .{fmt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* FABRIC TYPE / BACKING */}
                    {selectedService === 'embroidery' && (
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                          Target Fabric / Substrate
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.35rem' }}>
                          {['Cotton / Pique Knit', 'Structured Cap', 'Fleece / Hoodie', 'Jacket / Nylon'].map(fab => (
                            <button
                              key={fab}
                              type="button"
                              onClick={() => setFabricType(fab)}
                              style={{
                                minHeight: '40px',
                                padding: '0 0.55rem',
                                borderRadius: '8px',
                                border: fabricType === fab ? '1.5px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                                background: fabricType === fab ? (isDark ? 'rgba(5,150,105,0.2)' : '#ecfdf5') : 'transparent',
                                color: isDark ? '#ffffff' : '#0f172a',
                                fontSize: '0.75rem',
                                fontWeight: fabricType === fab ? 800 : 500,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              {fab}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* PATCH BACKING & STYLE */}
                    {selectedService === 'patch' && (
                      <>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Patch Backing Type
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.35rem' }}>
                            {['Iron-On', 'Velcro Hook & Loop', 'Peel & Stick', 'Sew-On / Plain'].map(bkg => (
                              <button
                                key={bkg}
                                type="button"
                                onClick={() => setPatchBacking(bkg)}
                                style={{
                                  minHeight: '40px',
                                  padding: '0 0.55rem',
                                  borderRadius: '8px',
                                  border: patchBacking === bkg ? '1.5px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                                  background: patchBacking === bkg ? (isDark ? 'rgba(5,150,105,0.2)' : '#ecfdf5') : 'transparent',
                                  color: isDark ? '#ffffff' : '#0f172a',
                                  fontSize: '0.75rem',
                                  fontWeight: patchBacking === bkg ? 800 : 500,
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                {bkg}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Patch Craft Style
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', marginTop: '0.35rem' }}>
                            {['Embroidered', 'PVC Rubber 3D', 'Woven Thread', 'Laser Leather'].map(sty => (
                              <button
                                key={sty}
                                type="button"
                                onClick={() => setPatchStyle(sty)}
                                style={{
                                  minHeight: '40px',
                                  padding: '0 0.55rem',
                                  borderRadius: '8px',
                                  border: patchStyle === sty ? '1.5px solid #059669' : isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                                  background: patchStyle === sty ? (isDark ? 'rgba(5,150,105,0.2)' : '#ecfdf5') : 'transparent',
                                  color: isDark ? '#ffffff' : '#0f172a',
                                  fontSize: '0.75rem',
                                  fontWeight: patchStyle === sty ? 800 : 500,
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                {sty}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* RUSH PRODUCTION TOGGLE */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      background: isDark ? '#0f172a' : '#f8fafc',
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={18} style={{ color: '#f59e0b' }} />
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                            Express Rush Turnaround
                          </div>
                          <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                            Guaranteed delivery in 2–4 hours (+$10)
                          </div>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isRush}
                        onChange={(e) => setIsRush(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#059669' }}
                      />
                    </div>

                    {/* QUANTITY SELECTOR (MAINLY FOR PATCHES) */}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                        Quantity {selectedService === 'patch' && '(Min. 50 Pcs)'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.35rem' }}>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(-1)}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                            background: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantityInput}
                          onChange={(e) => {
                            setQuantityInput(e.target.value);
                            const parsed = parseInt(e.target.value, 10);
                            if (!isNaN(parsed) && parsed > 0) setQuantity(parsed);
                          }}
                          style={{
                            flex: 1,
                            minHeight: '44px',
                            borderRadius: '10px',
                            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                            background: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            textAlign: 'center',
                            fontSize: '1rem',
                            fontWeight: 800
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(1)}
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '10px',
                            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                            background: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* PROMO CODE INPUT */}
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b' }}>
                        Promo Code
                      </span>
                      <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.35rem' }}>
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="e.g., PROMO, SAVE20"
                          style={{
                            flex: 1,
                            minHeight: '40px',
                            borderRadius: '8px',
                            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                            background: isDark ? '#0f172a' : '#ffffff',
                            color: isDark ? '#ffffff' : '#0f172a',
                            padding: '0 0.75rem',
                            fontSize: '0.85rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          style={{
                            minHeight: '40px',
                            padding: '0 0.85rem',
                            borderRadius: '8px',
                            background: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 3: QUICK REVIEW & SUBMIT ================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* COMPACT SUMMARY CARD */}
              <div style={{
                borderRadius: '16px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                background: isDark ? '#1e293b' : '#f8fafc',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedService === 'vector' ? <PenTool size={16} /> : selectedService === 'patch' ? <Package size={16} /> : <Layers size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                        {activePkg?.title || serviceDisplayName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {serviceDisplayName} • {placement} • {widthInches}&quot; x {heightInches}&quot;
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                      ${totalPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      ⚡ {isRush ? '2–4h Rush' : activePkg?.turnaround || '4–12h Delivery'}
                    </div>
                  </div>
                </div>

                {/* UPLOADED FILE THUMBNAIL & REFERENCE */}
                {uploadedFiles.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {uploadedFiles[0].url && (uploadedFiles[0].format === 'PNG' || uploadedFiles[0].format === 'JPG' || uploadedFiles[0].format === 'JPEG') ? (
                      <img
                        src={uploadedFiles[0].url}
                        alt="thumbnail"
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={18} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#ffffff' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {uploadedFiles[0].name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                        {uploadedFiles.length > 1 ? `+ ${uploadedFiles.length - 1} more file(s)` : `${uploadedFiles[0].size}`}
                      </div>
                    </div>
                  </div>
                )}

                {/* PRICE BREAKDOWN ITEMS */}
                <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Standard Studio Base</span>
                    <span>${baseSubtotal.toFixed(2)}</span>
                  </div>
                  {promoDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                      <span>Discount ({appliedPromo?.code || 'PROMO'})</span>
                      <span>-${promoDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {isRush && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontWeight: 700 }}>
                      <span>Express 2–4h Turnaround</span>
                      <span>+${rushFee.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AUTHENTICATION / GUEST FORM */}
              {isAuthenticated || authUser ? (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '14px',
                  background: isDark ? 'rgba(5, 150, 105, 0.14)' : '#ecfdf5',
                  border: '1.5px solid #059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}>
                  <CheckCircle2 size={20} style={{ color: '#059669', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Logged in as {authUser?.user_metadata?.full_name || authUser?.name || 'Verified Client'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#059669', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {authUser?.email || currentUser?.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={guestAuthCardRef}
                  style={{
                    borderRadius: '16px',
                    border: guestAuthRequested ? '2px solid #059669' : isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    background: isDark ? '#1e293b' : '#ffffff',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                      Customer Checkout Details
                    </div>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                      Your order and artwork stay saved in your secure client portal.
                    </p>
                  </div>

                  {/* ONE-TAP GOOGLE SIGN IN */}
                  <GoogleCustomSignInButton
                    onAuthSuccess={handleGoogleAuthSuccess}
                    onAuthError={(err) => {
                      if (showToast) showToast(err || 'Google authentication notice', 'error');
                    }}
                    text="Instant One-Tap Google Checkout"
                    style={{ width: '100%', minHeight: '48px', borderRadius: '12px' }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.15rem 0' }}>
                    <div style={{ flex: 1, height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isDark ? '#64748b' : '#94a3b8' }}>OR WITH EMAIL</span>
                    <div style={{ flex: 1, height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Your Full Name / Business"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0 0.85rem',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box'
                      }}
                    />

                    <input
                      ref={guestEmailInputRef}
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="Email address / WhatsApp"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0 0.85rem',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box'
                      }}
                    />

                    <input
                      type="password"
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      placeholder="Create password for order tracking"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0 0.85rem',
                        fontSize: '0.88rem',
                        boxSizing: 'border-box'
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setGuestAuthMode(m => m === 'signup' ? 'login' : 'signup')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#059669',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '0.35rem'
                        }}
                      >
                        {guestAuthMode === 'signup' ? 'Already have an account? Sign In' : 'New customer? Create Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: ORDER CONFIRMED ================= */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
                marginBottom: '1rem'
              }}>
                <Check size={36} strokeWidth={3} />
              </div>

              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.35rem', fontWeight: 900 }}>
                Order Successfully Placed!
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '320px' }}>
                Your order #{createdOrderObj?.id || 'ORD'} has been recorded into the live production queue.
              </p>

              <div style={{
                width: '100%',
                borderRadius: '14px',
                background: isDark ? '#1e293b' : '#f8fafc',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                padding: '1rem',
                textAlign: 'left',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800 }}>
                  <span>{createdOrderObj?.title || serviceDisplayName}</span>
                  <span style={{ color: '#059669' }}>${totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.25rem' }}>
                  Delivery Turnaround: ⚡ {isRush ? '2–4 Hours Express' : '4–12 Hours Standard'}
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayNow}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)'
                }}
              >
                <span>Proceed to Secure Payment (${totalPrice.toFixed(2)})</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM CTA BAR */}
        {step < 4 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '0.75rem 1.15rem calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderTop: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10
          }}>
            {step === 1 && (
              <button
                type="button"
                onClick={handleProceedFromStep1}
                disabled={isUploading}
                style={{
                  flex: 1,
                  minHeight: '52px',
                  borderRadius: '14px',
                  background: isUploading ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)'
                }}
              >
                <span>Continue to Placement & Size (${totalPrice.toFixed(2)})</span>
                <ArrowRight size={18} />
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    minWidth: '90px',
                    minHeight: '52px',
                    borderRadius: '14px',
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedFromStep2}
                  style={{
                    flex: 1,
                    minHeight: '52px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  <span>Review Order (${totalPrice.toFixed(2)})</span>
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => handleSubmitOrder()}
                disabled={isSubmitting || isSubmittingAuth}
                style={{
                  flex: 1,
                  minHeight: '52px',
                  borderRadius: '14px',
                  background: (isSubmitting || isSubmittingAuth) ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.98rem',
                  fontWeight: 900,
                  cursor: (isSubmitting || isSubmittingAuth) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)'
                }}
              >
                {isSubmitting || isSubmittingAuth ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isAuthenticated || authUser
                        ? `Place Order Now ($${totalPrice.toFixed(2)})`
                        : `${guestAuthMode === 'signup' ? 'Create Account' : 'Sign In'} & Place Order`}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSimpleOrderModal;
