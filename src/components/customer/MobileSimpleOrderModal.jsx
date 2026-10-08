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
import { navigateTo } from '../../utils/navigation';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';
import { getPackageSizeInfo } from '../../utils/packageSizeUtils';

// Standard fallback package tiers matching website /app/pricing/page.jsx
const CORE_PACKAGES = {
  embroidery: [
    {
      id: 'emb-basic',
      service_type: 'embroidery',
      badge: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Caps, polos & small left chest logos up to 4"',
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
      subtitle: 'Medium artwork up to 7" with push-pull compensation',
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
      subtitle: 'Full back designs up to 12" & 3D puff foam',
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
      subtitle: 'Typographic logos & simple geometric shapes',
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
      subtitle: 'Multi-color mascots, crests & spot color separation',
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
      subtitle: 'Fine vector details, halftones & photo redraws',
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
      badge: 'SAMPLE RUN (50-100 PCS)',
      is_popular: false,
      title: 'Sample Batch (50–100 Pcs)',
      subtitle: 'Low minimum sample run for prototypes & clubs',
      price: 3.50,
      original_price: 5.00,
      turnaround: '3–5 Days',
      features: ['50 Pcs Minimum Order', 'Free Digital Proof', 'Iron-On or Velcro Backing'],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Shipment'],
      defaultWidth: '3.0',
      defaultHeight: '3.0',
      defaultPlacement: 'Custom Laser Cut Shape'
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      badge: 'MOST POPULAR (100-500 PCS)',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Uniform programs, tactical gear & apparel brands',
      price: 4.50,
      original_price: 6.00,
      turnaround: '4–7 Days',
      features: ['Laser-Cut Borders', 'Free Tracked Shipping', 'Velcro or Iron-On'],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Round / Oval Emblem'
    },
    {
      id: 'patch-pro',
      service_type: 'patch',
      badge: 'WHOLESALE BULK (500+ PCS)',
      is_popular: false,
      title: 'Wholesale Bulk Batch (500+ Pcs)',
      subtitle: 'Factory-direct wholesale volume with priority line',
      price: 5.50,
      original_price: 7.50,
      turnaround: '7–10 Days',
      features: ['Factory Direct Rate ($5.50/pc)', 'Priority Dedicated Line', 'Express Worldwide Delivery'],
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
    startingPrice: 'From $3.50/pc',
    turnaround: '3–5 Days'
  }
];

// Placement options per service with common industry positions
const PLACEMENT_OPTIONS = {
  embroidery: [
    { id: 'Left Chest', label: 'Left Chest', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Left Chest / Cap', label: 'Left Chest / Cap', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Cap / Hat (Front)', label: 'Cap / Hat (Front)', defaultWidth: '2.5', defaultHeight: '2.5' },
    { id: 'Cap (Side / Back)', label: 'Cap (Side / Back)', defaultWidth: '2.5', defaultHeight: '2.5' },
    { id: 'Full Jacket Back', label: 'Full Jacket Back', defaultWidth: '10.5', defaultHeight: '10.5' },
    { id: 'Full Front / Chest', label: 'Full Front / Chest', defaultWidth: '8.0', defaultHeight: '8.0' },
    { id: 'Sleeve / Cuff', label: 'Sleeve / Cuff', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Jacket Front / Sleeve', label: 'Jacket Front / Sleeve', defaultWidth: '6.0', defaultHeight: '6.0' },
    { id: 'Pocket / Collar', label: 'Pocket / Collar', defaultWidth: '3.0', defaultHeight: '3.0' },
    { id: 'Visor / Beanie', label: 'Visor / Beanie', defaultWidth: '2.2', defaultHeight: '2.2' },
    { id: 'Apron / Uniform', label: 'Apron / Uniform', defaultWidth: '4.5', defaultHeight: '4.5' },
    { id: 'Towel / Blanket / Bag', label: 'Towel / Blanket / Bag', defaultWidth: '6.0', defaultHeight: '6.0' },
    { id: 'Other / Custom Placement', label: 'Other / Custom Placement', defaultWidth: '3.5', defaultHeight: '3.5' }
  ],
  vector: [
    { id: 'Logo / Graphic Redraw', label: 'Logo / Graphic Redraw', defaultWidth: '5.0', defaultHeight: '5.0' },
    { id: 'Vector Redraw', label: 'Vector Redraw', defaultWidth: '5.0', defaultHeight: '5.0' },
    { id: 'Screen Printing Separation', label: 'Screen Printing Separation', defaultWidth: '10.0', defaultHeight: '10.0' },
    { id: 'Color Separation', label: 'Color Separation', defaultWidth: '8.0', defaultHeight: '8.0' },
    { id: 'High-Res Print Ready', label: 'High-Res Print Ready', defaultWidth: '11.0', defaultHeight: '11.0' },
    { id: 'Embroidery Prep / Vector', label: 'Embroidery Prep / Vector', defaultWidth: '5.0', defaultHeight: '5.0' },
    { id: 'Vinyl Cut / Decal', label: 'Vinyl Cut / Decal', defaultWidth: '6.0', defaultHeight: '6.0' },
    { id: 'Signage / Banner', label: 'Signage / Banner', defaultWidth: '12.0', defaultHeight: '12.0' },
    { id: 'Other / Custom Artwork', label: 'Other / Custom Artwork', defaultWidth: '5.0', defaultHeight: '5.0' }
  ],
  patch: [
    { id: 'Custom Laser Cut Shape', label: 'Custom Laser-Cut Shape', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Round / Oval Emblem', label: 'Round / Oval Emblem', defaultWidth: '3.0', defaultHeight: '3.0' },
    { id: 'Round / Circle Emblem', label: 'Round / Circle Emblem', defaultWidth: '3.0', defaultHeight: '3.0' },
    { id: 'Square / Shield', label: 'Square / Shield', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Rectangle / Name Bar', label: 'Rectangle / Name Bar', defaultWidth: '4.0', defaultHeight: '2.0' },
    { id: 'Shoulder / Sleeve Patch', label: 'Shoulder / Sleeve Patch', defaultWidth: '3.5', defaultHeight: '3.5' },
    { id: 'Cap / Hat Patch', label: 'Cap / Hat Patch', defaultWidth: '2.5', defaultHeight: '2.5' },
    { id: 'Full Back Rocker / Crest', label: 'Full Back Rocker / Crest', defaultWidth: '10.0', defaultHeight: '10.0' },
    { id: 'Other Custom Shape', label: 'Other Custom Shape', defaultWidth: '3.5', defaultHeight: '3.5' }
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

  // Step 2 & 3: Placement, Size, Instructions & Specs
  const [placement, setPlacement] = useState('Left Chest');
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [notes, setNotes] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Technical Options (Industry defaults applied)
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB', 'PDF']);
  const fabricType = null;
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [isRush, setIsRush] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const [formValidationError, setFormValidationError] = useState(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderObj, setCreatedOrderObj] = useState(null);

  // DOM Refs for smooth auto-scrolling
  const uploadAreaRef = useRef(null);
  const fileInputRef = useRef(null);
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
      let savedDraft = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('bdigi_pending_order_draft');
          if (raw) {
            savedDraft = JSON.parse(raw);
            localStorage.removeItem('bdigi_pending_order_draft');
          }
        } catch {}
      }

      if (savedDraft) {
        if (savedDraft.selectedService) setSelectedService(savedDraft.selectedService);
        if (savedDraft.selectedPackage) setSelectedPackage(savedDraft.selectedPackage);
        if (savedDraft.quantity) {
          setQuantity(savedDraft.quantity);
          setQuantityInput(String(savedDraft.quantity));
        }
        if (savedDraft.widthInches) setWidthInches(savedDraft.widthInches);
        if (savedDraft.heightInches) setHeightInches(savedDraft.heightInches);
        if (savedDraft.placement) setPlacement(savedDraft.placement);
        if (savedDraft.fabricType) setFabricType(savedDraft.fabricType);
        if (savedDraft.notes) setNotes(savedDraft.notes);
        if (savedDraft.orderTitle) setOrderTitle(savedDraft.orderTitle);
        if (savedDraft.uploadedFiles && Array.isArray(savedDraft.uploadedFiles) && savedDraft.uploadedFiles.length > 0) {
          setUploadedFiles(savedDraft.uploadedFiles);
        }
        if (savedDraft.appliedPromo) setAppliedPromo(savedDraft.appliedPromo);
        setStep(savedDraft.step || 4);
        return;
      }

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

    // Auto-advance to Step 2 (Choose Package)
    setTimeout(() => {
      setStep(2);
      if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    }, 180);
  };

  // Package switch handler
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setFormValidationError(null);
    if (pkg.defaultPlacement) setPlacement(pkg.defaultPlacement);
    if (pkg.defaultWidth) setWidthInches(pkg.defaultWidth);
    if (pkg.defaultHeight) setHeightInches(pkg.defaultHeight);
    if (pkg.defaultFormats) setSelectedFormats(pkg.defaultFormats);

    // Auto-advance to Step 3 (Artwork & Specs)
    setTimeout(() => {
      setStep(3);
      if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
    }, 180);
  };

  // Placement dropdown switch handler
  const handlePlacementChange = (e) => {
    const val = e.target.value;
    setPlacement(val);
    const currentOptions = PLACEMENT_OPTIONS[selectedService] || PLACEMENT_OPTIONS.embroidery;
    const match = currentOptions.find(o => o.id === val);
    if (match) {
      if (match.defaultWidth) setWidthInches(match.defaultWidth);
      if (match.defaultHeight) setHeightInches(match.defaultHeight);
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

  // Step 1: Studio Service Selection -> Proceed to Step 2 (Choose Package)
  const handleProceedFromStep1 = () => {
    setFormValidationError(null);
    setStep(2);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  };

  // Step 2: Package Selection -> Proceed to Step 3 (Artwork & Specs)
  const handleProceedFromStep2 = () => {
    setFormValidationError(null);
    setStep(3);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  };

  // Step 3: Artwork & Specs -> Validate upload and proceed to Step 4 (Review)
  const handleProceedFromStep3 = () => {
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
    setStep(4);
    if (contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  };

  // Final Order Submission
  const handleSubmitOrder = async (authenticatedOverride = null) => {
    if (selectedService === 'patch' && quantity < 50) {
      if (showToast) showToast('Minimum order requirement for Custom Patches is 50 pieces.', 'error');
      setQuantity(50);
      setQuantityInput('50');
      setStep(3);
      return;
    }

    if (uploadedFiles.length === 0) {
      setUploadError('Please attach at least one artwork or reference file.');
      setStep(3);
      return;
    }

    // 1. Ensure user is authenticated
    let isAuthed = Boolean(authenticatedOverride?.email) || isAuthenticated || Boolean(authUser?.email);
    if (!isAuthed && typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('bdigi_auth_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) isAuthed = true;
        }
      } catch {}
    }

    if (!isAuthed) {
      const draftPayload = {
        selectedService,
        selectedPackage,
        quantity,
        quantityInput,
        widthInches,
        heightInches,
        placement,
        fabricType,
        patchStyle,
        patchBacking,
        selectedFormats,
        isRush,
        notes,
        orderTitle,
        uploadedFiles,
        appliedPromo,
        step: 4
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bdigi_pending_order_draft', JSON.stringify(draftPayload));
          localStorage.setItem('bdigi_pending_order_wizard', JSON.stringify({ type: selectedService }));
        } catch {}
      }
      if (onClose) onClose();
      if (showToast) showToast('Please sign in or create an account to finalize your order. Your order details are saved.', 'info');
      navigateTo('/login?redirect=/order');
      return;
    }

    let clientEmail = (authenticatedOverride?.email || authUser?.email || currentUser?.email || '').toLowerCase().trim();
    let clientName = authenticatedOverride?.name || authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Studio Client';

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
      setStep(5); // Success confirmation step
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
            {step > 1 && step < 5 && (
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
                  {step < 5 ? `STEP ${step} OF 4` : 'CONFIRMED'}
                </span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  {step === 1 && 'Studio Service'}
                  {step === 2 && 'Choose Package'}
                  {step === 3 && 'Artwork & Specs'}
                  {step === 4 && 'Review & Submit'}
                  {step === 5 && 'Order Placed!'}
                </h3>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                {step === 1 && 'Choose what you need done today.'}
                {step === 2 && `Select the ${selectedService === 'vector' ? 'vector' : selectedService === 'patch' ? 'patch' : 'embroidery'} tier that fits your needs.`}
                {step === 3 && 'Upload your artwork file, placement and target size.'}
                {step === 4 && 'Instant dispatch with live turnaround & transparent pricing.'}
                {step === 5 && 'Your order is booked into our live production queue.'}
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

        {/* 4-SEGMENT PROGRESS BAR */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: '4px', padding: '0.35rem 1.15rem 0.2rem', background: isDark ? '#0b1120' : '#f8fafc' }}>
            {[1, 2, 3, 4].map(i => (
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
          {/* ================= STEP 1: SELECT STUDIO SERVICE ================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.25rem' }}>
                  1. Select Studio Service
                </label>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Choose what you need done today
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
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
                          minHeight: '72px',
                          borderRadius: '16px',
                          border: isSelected ? '2px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.15)' : 'none'
                        }}
                      >
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '14px',
                          background: isSelected ? '#059669' : isDark ? '#0f172a' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : svc.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <IconComp size={24} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.98rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                              {svc.title}
                            </span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#059669' }}>
                              {svc.startingPrice}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.76rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                              {svc.badge}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8' }}>
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
            </div>
          )}

          {/* ================= STEP 2: CHOOSE PACKAGE TIER ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    2. Choose {selectedService === 'vector' ? 'Vector' : selectedService === 'patch' ? 'Patch' : 'Embroidery'} Package
                  </label>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                    {activePkg?.badge || 'STANDARD'}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  Choose the package tier that fits your artwork
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {currentPackages.map((pkg, pIdx) => {
                    const isSelected = (activePkg?.id === pkg.id) || (selectedPackage?.id === pkg.id);
                    const sizeInfo = getPackageSizeInfo(pkg, selectedService, pIdx);

                    return (
                      <div
                        key={pkg.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPackage(pkg)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectPackage(pkg); }}
                        style={{
                          borderRadius: '16px',
                          border: isSelected ? '2.5px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #e2e8f0',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.16)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          padding: '0.9rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.16)' : '0 1px 3px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Top Row: Title, Badge, Price, Selection Radio */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                                {pkg.title}
                              </span>
                              {pkg.badge && (
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 900,
                                  background: pkg.is_popular ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : isDark ? '#334155' : '#e2e8f0',
                                  color: pkg.is_popular ? '#ffffff' : isDark ? '#cbd5e1' : '#475569',
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: '4px',
                                  letterSpacing: '0.04em'
                                }}>
                                  {pkg.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                                {selectedService === 'patch' ? `${Number(pkg.price).toFixed(2)}/pc` : `${Number(pkg.price).toFixed(2)}`}
                              </span>
                              {pkg.original_price && (
                                <span style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8', textDecoration: 'line-through', display: 'block' }}>
                                  ${Number(pkg.original_price).toFixed(2)}
                                </span>
                              )}
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
                        </div>

                        {/* CRITICAL: PROMINENT SIZE BADGE */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: isSelected ? (isDark ? 'rgba(5, 150, 105, 0.3)' : '#d1fae5') : (isDark ? 'rgba(249, 115, 22, 0.16)' : '#fff7ed'),
                            color: isSelected ? (isDark ? '#34d399' : '#047857') : '#ea580c',
                            border: isSelected ? '1px solid rgba(5, 150, 105, 0.5)' : '1px solid #fed7aa',
                            padding: '0.22rem 0.55rem',
                            borderRadius: '7px',
                            fontSize: '0.78rem',
                            fontWeight: 800
                          }}>
                            <span>📏</span>
                            <span>Max Size: <strong>{sizeInfo.limit}</strong></span>
                          </span>

                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isDark ? '#cbd5e1' : '#475569'
                          }}>
                            • {sizeInfo.examples ? `Fits: ${sizeInfo.examples}` : sizeInfo.label}
                          </span>
                        </div>

                        {/* Subtitle & Turnaround Row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.1rem' }}>
                          <span style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.35 }}>
                            {pkg.subtitle || (pkg.features && pkg.features[0]) || ''}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8', flexShrink: 0 }}>
                            ⚡ {pkg.turnaround}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ARTWORK & SPECIFICATIONS ================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 1. QUANTITY SELECTOR (BEFORE UPLOAD) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    Quantity {selectedService === 'patch' && '(Min. 50 Pcs)'}
                  </label>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedService === 'patch' ? 'Minimum 50 pieces' : 'Total designs/pieces'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    aria-label="Decrease quantity"
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
                      minHeight: '48px',
                      borderRadius: '12px',
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                    aria-label="Order quantity"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 2. ARTWORK UPLOAD ZONE */}
              <div ref={uploadAreaRef}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    Upload Artwork / Reference <span style={{ color: '#ef4444' }}>*</span>
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

              {/* 3. PLACEMENT LOCATION (DROPDOWN LIST) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.45rem' }}>
                  Placement Location
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={placement}
                    onChange={handlePlacementChange}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      borderRadius: '12px',
                      border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: isDark ? '#ffffff' : '#0f172a',
                      padding: '0 2.5rem 0 0.85rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      boxSizing: 'border-box',
                      outline: 'none',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {(PLACEMENT_OPTIONS[selectedService] || PLACEMENT_OPTIONS.embroidery).map(opt => (
                      <option
                        key={opt.id}
                        value={opt.id}
                        style={{ background: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a' }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>

              {/* 4. TARGET SIZE (DIRECT INPUTS WITH ACTIVE PACKAGE BOUNDARIES) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.45rem' }}>
                  Target Size (Inches)
                </label>

                {/* Selected Package Size Context Callout */}
                {activePkg && (() => {
                  const activePkgSize = getPackageSizeInfo(activePkg, selectedService);
                  const wNum = parseFloat(widthInches);
                  const hNum = parseFloat(heightInches);
                  const isExceeding = (!isNaN(wNum) && wNum > activePkgSize.maxInches) || (!isNaN(hNum) && hNum > activePkgSize.maxInches);

                  return (
                    <div style={{ marginBottom: '0.65rem' }}>
                      <div style={{
                        background: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5',
                        border: '1.5px solid rgba(5, 150, 105, 0.35)',
                        borderRadius: '12px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.5rem'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isDark ? '#34d399' : '#047857' }}>
                              📦 {activePkg.title}
                            </span>
                            <span style={{
                              background: '#059669',
                              color: '#ffffff',
                              fontSize: '0.65rem',
                              fontWeight: 900,
                              padding: '0.1rem 0.4rem',
                              borderRadius: '5px'
                            }}>
                              MAX: {activePkgSize.limit}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', marginTop: '0.15rem' }}>
                            {activePkgSize.examples ? `Standard for ${activePkgSize.examples}. ` : ''}Specify desired width & height below:
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#059669',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                            flexShrink: 0
                          }}
                        >
                          Change Tier
                        </button>
                      </div>

                      {isExceeding && (
                        <div style={{
                          marginTop: '0.45rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '10px',
                          background: '#fffbeb',
                          border: '1.5px solid #fcd34d',
                          color: '#92400e',
                          fontSize: '0.74rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.45rem'
                        }}>
                          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                          <div style={{ flex: 1 }}>
                            Entered size ({widthInches}" × {heightInches}") exceeds this tier's limit ({activePkgSize.limit}).
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              style={{
                                display: 'block',
                                marginTop: '0.25rem',
                                background: 'none',
                                border: 'none',
                                color: '#b45309',
                                fontWeight: 800,
                                textDecoration: 'underline',
                                padding: 0,
                                cursor: 'pointer',
                                fontSize: '0.73rem'
                              }}
                            >
                              Tap here to choose Mid-Size or Full-Back package →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>Width (Inches)</span>
                    <input
                      type="text"
                      value={widthInches}
                      onChange={(e) => setWidthInches(e.target.value)}
                      placeholder="e.g., 3.5"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0 0.85rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        boxSizing: 'border-box',
                        outline: 'none',
                        marginTop: '0.25rem'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b' }}>Height (Inches)</span>
                    <input
                      type="text"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder="e.g., 3.5"
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        borderRadius: '12px',
                        border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                        background: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#ffffff' : '#0f172a',
                        padding: '0 0.85rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        boxSizing: 'border-box',
                        outline: 'none',
                        marginTop: '0.25rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 5. INSTRUCTIONS */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569', marginBottom: '0.45rem' }}>
                  Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=""
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    borderRadius: '12px',
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    padding: '0.75rem 0.85rem',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* 6. MACHINE FORMATS (SELECTABLE PILLS - VISIBLE DIRECTLY) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? '#94a3b8' : '#475569' }}>
                    Machine Formats
                  </label>
                  <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    Tap to toggle formats
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {(selectedService === 'vector'
                    ? ['AI', 'EPS', 'SVG', 'PDF', 'CDR']
                    : ['DST', 'PES', 'EMB', 'EXP', 'PDF', 'VP3', 'JEF']
                  ).map(fmt => {
                    const isSelected = selectedFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        style={{
                          minHeight: '40px',
                          padding: '0 0.85rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #059669' : isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                          background: isSelected
                            ? isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5'
                            : isDark ? '#1e293b' : '#ffffff',
                          color: isSelected
                            ? '#059669'
                            : isDark ? '#ffffff' : '#0f172a',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                        .{fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. OPTIONAL ADD-ONS (RUSH, PROMO, PATCH CRAFT) */}
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
                    <span>⚡ Optional Add-ons & Promo</span>
                    {isRush && (
                      <span style={{ fontSize: '0.68rem', color: '#f59e0b', background: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                        Rush Active
                      </span>
                    )}
                  </div>
                  {isAdvancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {isAdvancedOpen && (
                  <div style={{ padding: '0 1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                    {/* PATCH BACKING & STYLE (ONLY FOR PATCHES) */}
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

          {/* ================= STEP 4: QUICK REVIEW & SUBMIT ================= */}
          {step === 4 && (
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

              {/* AUTHENTICATION BADGE (IF LOGGED IN) */}
              {(isAuthenticated || authUser) && (
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
              )}
            </div>
          )}

          {/* ================= STEP 5: ORDER CONFIRMED ================= */}
          {step === 5 && (
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
        {step < 5 && (
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
                <span>Continue to Packages →</span>
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    minWidth: '80px',
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
                  <span>Continue to Artwork & Specs (${totalPrice.toFixed(2)})</span>
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{
                    minWidth: '80px',
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
                  onClick={handleProceedFromStep3}
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
                  <span>Review Order (${totalPrice.toFixed(2)})</span>
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isSubmitting || isSubmittingAuth}
                  style={{
                    minWidth: '80px',
                    minHeight: '52px',
                    borderRadius: '14px',
                    border: isDark ? '1.5px solid #334155' : '1.5px solid #cbd5e1',
                    background: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmitOrder()}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    minHeight: '52px',
                    borderRadius: '14px',
                    background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.98rem',
                    fontWeight: 900,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isAuthenticated || authUser
                          ? `Place Order Now ($${totalPrice.toFixed(2)})`
                          : `Sign In to Place Order ($${totalPrice.toFixed(2)})`}
                      </span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSimpleOrderModal;
