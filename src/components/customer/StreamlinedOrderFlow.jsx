'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { getAvailableTiers, getServiceStartingPrice, calculatePackageQuote, formatUSD } from '../../utils/livePricing';
import { getLiveStudioDiscountPercent } from '../../utils/mobileOffer.js';
import { useLivePromotion } from '../../hooks/useLivePromotion';
import { requiredEmbroideryRank, eligibleEmbroideryTiers, chooseEmbroideryTier } from '../../utils/embroiderySizeEligibility';
import { MONTHLY_DESIGN_LIMITS, findPublishedMonthlyBundle } from '../../utils/monthlyBundles';
import {
  Upload,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ShieldCheck,
  X,
  ArrowRight,
  ArrowLeft,
  Palette,
  Award,
  Zap
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

export const StreamlinedOrderFlow = ({
  initialService = null,
  initialPackage = null,
  _initialPackage = null,
  onOrderComplete = null,
  _isModal = false,
  onCloseModal = null
}) => {
  const {
    createOrder,
    showToast,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    authUser,
    currentUser,
    isAuthenticated,
    setIsAuthModalOpen,
    setAuthModalMode,
    dynamicPricingTiers = [],
    theme = 'light'
  } = useAppState();

  const isDark = theme === 'dark';

  // The configuration screen is an order attempt, not a completed order.
  // Record it for both entry flows without changing how the customer orders.
  useEffect(() => {
    let active = true;
    const entrySource = new URLSearchParams(window.location.search).get('source');
    const source = _isModal
      ? 'order_popup'
      : entrySource === 'vip_offer'
        ? 'vip_promotion_page'
        : entrySource === 'get_started'
          ? 'get_started_page'
          : 'direct_order_page';
    import('../common/MetaPixelTracker').then(({ trackMetaEvent }) => {
      if (active) {
        trackMetaEvent('OrderStarted', {
          entry_point: source,
          flow: _isModal ? 'popup' : 'separate_page',
          service: initialService || 'all'
        });
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [_isModal, initialService]);

  const incomingPackage = initialPackage || _initialPackage;
  const [orderMode, setOrderMode] = useState('regular');
  const [monthlyCount, setMonthlyCount] = useState(10);
  const [monthlyPlans, setMonthlyPlans] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState('');
  useEffect(() => {
    let live = true;
    fetch('/api/monthly-bundles', { cache: 'no-store' })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Monthly plans unavailable');
        return data.plans || [];
      })
      .then(data => { if (live) setMonthlyPlans(data); })
      .catch(error => { if (live) setMonthlyError(error.message); })
      .finally(() => { if (live) setMonthlyLoading(false); });
    return () => { live = false; };
  }, []);

  // Has the customer chosen a service yet?
  // When starting the order from general entry points, show the 3 services selection screen first!
  const [hasSelectedService, setHasSelectedService] = useState(() => {
    if (!initialService || initialService === 'all') return false;
    return true;
  });

  // Service switcher: 'embroidery' | 'patch' | 'vector'
  const [selectedService, setSelectedService] = useState(() => {
    const norm = String(initialService || '').toLowerCase();
    if (norm.includes('patch')) return 'patch';
    if (norm.includes('vector')) return 'vector';
    return 'embroidery';
  });

  // Dynamic Tiers for the selected service (Editable from Admin Dynamic Pricing Editor)
  const getActiveTiers = (serviceKey) => getAvailableTiers(dynamicPricingTiers, serviceKey);
  const startingPrices = {
    embroidery: getServiceStartingPrice(dynamicPricingTiers, 'embroidery'),
    vector: getServiceStartingPrice(dynamicPricingTiers, 'vector'),
    patch: getServiceStartingPrice(dynamicPricingTiers, 'patch')
  };
  const serviceChoices = [
    { key: 'embroidery', name: 'Embroidery Digitizing', description: 'DST, PES, EMB stitch files for machines', price: startingPrices.embroidery, Icon: Zap, accent: isDark ? '#93c5fd' : '#1d4ed8', tint: isDark ? 'rgba(59,130,246,0.13)' : '#eaf1ff', cta: '#1d4ed8' },
    { key: 'vector', name: 'Vector Art', description: 'AI, EPS, SVG redraws for print and cut', price: startingPrices.vector, Icon: Palette, accent: isDark ? '#c4b5fd' : '#6d28d9', tint: isDark ? 'rgba(167,139,250,0.13)' : '#f3edff', cta: '#6d28d9' },
    { key: 'patch', name: 'Custom Patches', description: 'Embroidered and PVC patches · Min 50 pieces', price: startingPrices.patch, Icon: Award, accent: isDark ? '#7dd3fc' : '#0369a1', tint: isDark ? 'rgba(56,189,248,0.12)' : '#ecf8ff', cta: '#0369a1' }
  ];
  const currentServiceTiers = getActiveTiers(selectedService);

  // Selected Package Tier State (Dynamically linked to DB / Admin Tiers)
  const [selectedTierId, setSelectedTierId] = useState(() => {
    if (incomingPackage) {
      if (typeof incomingPackage === 'string') return incomingPackage;
      if (incomingPackage.id) return String(incomingPackage.id);
      if (incomingPackage.title) return String(incomingPackage.title);
    }
    return '';
  });

  // 1. EMBROIDERY FIELDS
  const [fileFormat, setFileFormat] = useState('all');
  const [sizeOption, setSizeOption] = useState('left-chest');
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('3.5');
  // Admin package order determines capacity: up to 4" => tier 1+, 7" => tier 2+, 12" => tier 3+.
  // Never downgrade a manually chosen premium tier when the size becomes smaller.
  const minEmbroideryRank = requiredEmbroideryRank(sizeOption, customWidth, customHeight);
  const eligibleEmbroidery = eligibleEmbroideryTiers(currentServiceTiers, minEmbroideryRank);
  const requestedTier = currentServiceTiers.find(t =>
    (t.id && String(t.id) === String(selectedTierId)) ||
    (t.title && t.title.toLowerCase() === String(selectedTierId).toLowerCase())
  ) || (selectedTierId ? null : currentServiceTiers[0] || null);
  const currentTier = selectedService === 'embroidery'
    ? chooseEmbroideryTier(currentServiceTiers, minEmbroideryRank, requestedTier)
    : requestedTier;
  const currentTierKey = currentTier ? String(currentTier.id || currentTier.title) : '';
  useEffect(() => {
    if (selectedService !== 'embroidery' || orderMode === 'monthly' || !currentTierKey) return;
    if (selectedTierId !== currentTierKey) setSelectedTierId(currentTierKey);
  }, [selectedService, orderMode, currentTierKey, selectedTierId]);

  const [turnaround, setTurnaround] = useState('standard'); // standard (free), rush (+$10)

  // 2. PATCH FIELDS
  const [patchStyle, setPatchStyle] = useState('Embroidered Twill');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const [patchSizeOption, setPatchSizeOption] = useState('3');
  const [patchCustomWidth, setPatchCustomWidth] = useState('3');
  const [patchCustomHeight, setPatchCustomHeight] = useState('3');

  // 3. VECTOR FIELDS
  const [vectorFormat, setVectorFormat] = useState('all');
  const [vectorTurnaround, setVectorTurnaround] = useState('standard'); // standard (free), rush (+$10)

  // Separated Quantity States to prevent cross-service contamination:
  // - designQuantity: For Embroidery & Vector (1, 2, 3 designs; default 1, min 1)
  // - patchQuantity: For Custom Patches (physical patches batch; default 50, STRICT MINIMUM 50)
  const [designQuantity, setDesignQuantity] = useState(1);
  const [patchQuantity, setPatchQuantity] = useState(50);
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Artwork Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isUploadHighlighted, setIsUploadHighlighted] = useState(false);
  const [validationAlert, setValidationAlert] = useState(null);
  const [isCustomSizeHighlighted, setIsCustomSizeHighlighted] = useState(false);
  const fileInputRef = useRef(null);
  const uploadSectionRef = useRef(null);
  const customSizeRef = useRef(null);
  const patchSizeRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to select service and proceed to order customization
  const handleSelectService = (serviceKey) => {
    setOrderMode('regular');
    setSelectedService(serviceKey);
    setSelectedTierId('');
    setHasSelectedService(true);
  };

  // Restore pending order draft if returning from auth (e.g. Google Login redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawDraft = localStorage.getItem('bdigi_pending_order_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (typeof draft.hasSelectedService === 'boolean') setHasSelectedService(draft.hasSelectedService);
        if (draft.selectedService) setSelectedService(draft.selectedService);
        if (draft.selectedTierId) setSelectedTierId(draft.selectedTierId);
        if (draft.orderMode === 'monthly' && ['embroidery','vector'].includes(draft.selectedService)) setOrderMode('monthly');
        if (MONTHLY_DESIGN_LIMITS.includes(Number(draft.monthlyCount))) setMonthlyCount(Number(draft.monthlyCount));
        if (draft.designQuantity) setDesignQuantity(Math.max(1, Number(draft.designQuantity) || 1));
        if (draft.patchQuantity) setPatchQuantity(Math.max(50, Number(draft.patchQuantity) || 50));
        if (draft.turnaround) setTurnaround(draft.turnaround);
        if (['2', '2.5', '3', '4', '5', 'custom'].includes(String(draft.patchSizeOption))) setPatchSizeOption(String(draft.patchSizeOption));
        if (draft.patchCustomWidth !== undefined) setPatchCustomWidth(String(draft.patchCustomWidth));
        if (draft.patchCustomHeight !== undefined) setPatchCustomHeight(String(draft.patchCustomHeight));
        if (draft.vectorTurnaround) setVectorTurnaround(draft.vectorTurnaround);
        if (draft.fileFormat) setFileFormat(draft.fileFormat);
        if (draft.vectorFormat) setVectorFormat(draft.vectorFormat);
        if (draft.sizeOption) setSizeOption(draft.sizeOption);
        if (draft.customWidth) setCustomWidth(draft.customWidth);
        if (draft.customHeight) setCustomHeight(draft.customHeight);
        if (draft.additionalDetails) setAdditionalDetails(draft.additionalDetails);
        if (Array.isArray(draft.uploadedFiles) && draft.uploadedFiles.length > 0) {
          setUploadedFiles(draft.uploadedFiles);
        }
        if (draft.patchStyle) setPatchStyle(draft.patchStyle);
        if (draft.patchBacking) setPatchBacking(draft.patchBacking);
      }
    } catch (e) {
      console.warn('Failed to restore draft:', e);
    }
  }, []);

  // Save draft helper
  const saveDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      const draft = {
        hasSelectedService,
        selectedService,
        selectedTierId: currentTier?.id || currentTier?.title,
        orderMode,
        monthlyCount,
        designQuantity,
        patchQuantity: Math.max(50, Number(patchQuantity) || 50),
        turnaround,
        patchSizeOption,
        patchCustomWidth,
        patchCustomHeight,
        vectorTurnaround,
        fileFormat,
        vectorFormat,
        sizeOption,
        customWidth,
        customHeight,
        additionalDetails,
        uploadedFiles,
        patchStyle,
        patchBacking
      };
      localStorage.setItem('bdigi_pending_order_draft', JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  };

  // Only live, admin-enabled campaign rates are applied to regular orders.
  const { settings: livePromoSettings, loading: livePromoLoading, error: livePromoError } = useLivePromotion();
  const liveDiscountPercent = getLiveStudioDiscountPercent(livePromoSettings, selectedService);
  // Active administrator-configured Supabase prices only.
  const calculatePricing = () => {
    const safePatchQty = Math.max(50, parseInt(patchQuantity, 10) || 50);
    const quantity = selectedService === 'patch' ? safePatchQty : Math.max(1, Number(designQuantity) || 1);
    const isRush = selectedService === 'patch' ? false
      : selectedService === 'vector' ? vectorTurnaround === 'rush' : turnaround === 'rush';
    return calculatePackageQuote({ tier: currentTier, service: selectedService, quantity, isRush, discountPercent: liveDiscountPercent });
  };
  const isMonthlyMode = orderMode === 'monthly' && selectedService !== 'patch';
  const monthlyPlan = isMonthlyMode ? findPublishedMonthlyBundle({ plans: monthlyPlans }, selectedService, monthlyCount) : null;
  const monthlyQuote = monthlyPlan ? {
    unitPrice: monthlyPlan.price, subtotal: monthlyPlan.price, rush: 0,
    total: monthlyPlan.price, quantity: monthlyPlan.designs,
    tierTitle: monthlyPlan.title, patchPieces: 0
  } : null;
  const pricing = (isMonthlyMode ? monthlyQuote : calculatePricing()) || { unitPrice: 0, subtotal: 0, rush: 0, total: 0, quantity: 0, patchPieces: 0, tierTitle: '' };
  const hasValidLivePrice = (isMonthlyMode ? Boolean(monthlyQuote) : Boolean(currentTier?.id && pricing.total > 0)) && (isMonthlyMode || (!livePromoLoading && !livePromoError));
  // Helper Labels for Summary
  const getPatchDimensions = () => {
    const width = Number(patchSizeOption === 'custom' ? patchCustomWidth : patchSizeOption);
    const height = Number(patchSizeOption === 'custom' ? patchCustomHeight : patchSizeOption);
    return { width, height };
  };
  const getPatchSizeLabel = () => {
    const { width, height } = getPatchDimensions();
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 'Enter patch size';
    return `${width}" × ${height}"`;
  };

  const getSizeLabel = () => {
    if (selectedService === 'embroidery') {
      if (sizeOption === 'custom') return `${customWidth}" × ${customHeight}"`;
      if (sizeOption === 'cap') return 'Cap (2.5")';
      if (sizeOption === 'sleeve') return 'Sleeve (7")';
      if (sizeOption === 'jacket-back') return 'Jacket Back (12")';
      return 'Left Chest (4")';
    }
    if (selectedService === 'patch') return 'Standard Patch';
    return 'Scalable Vector';
  };

  const getFormatLabel = () => {
    if (selectedService === 'embroidery') {
      if (fileFormat === 'all') return 'All Formats';
      return fileFormat.toUpperCase();
    }
    if (selectedService === 'vector') {
      if (vectorFormat === 'all') return 'All Formats';
      return vectorFormat.toUpperCase();
    }
    return 'Physical Delivery';
  };

  // File Upload Logic
  const processFiles = async (files) => {
    if (!files || !files.length) return;

    setUploadError('');
    setIsUploadHighlighted(false);
    setValidationAlert(null);
    setIsUploading(true);

    const uploadedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        const errorMsg = `File "${file.name}" exceeds the 50MB limit.`;
        setUploadError(errorMsg);
        setIsUploadHighlighted(true);
        setValidationAlert({
          title: 'File Exceeds 50MB Limit',
          message: `The file "${file.name}" is too large. Please select a design file under 50MB.`,
          actionText: 'Choose Another File',
          onAction: () => {
            if (uploadSectionRef.current) {
              uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            setTimeout(() => fileInputRef.current?.click(), 120);
          }
        });
        if (uploadSectionRef.current) {
          uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setIsUploading(false);
        return;
      }

      try {
        const res = await uploadFileToCloudinaryFull(file, 'client-uploads', 'artwork');
        if (res && (res.secure_url || res.url)) {
          uploadedList.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: res.secure_url || res.url,
            public_id: res.public_id || null,
            format: res.format || file.name.split('.').pop()
          });
        } else {
          throw new Error('Artwork was not stored on the server.');
        }
      } catch (err) {
        console.error('[Order artwork upload failed]', err);
        setUploadError('Artwork upload failed. Please retry before submitting.');
        setIsUploadHighlighted(true);
        setIsUploading(false);
        return;
      }
    }

    setUploadedFiles(prev => [...prev, ...uploadedList]);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFilesChosen = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const isUserAuthenticated = Boolean(
    isAuthenticated ||
    authUser?.email ||
    currentUser?.email
  );

  // Submit Order and Launch Instant Stripe Checkout / Payment Page
  const handleFinalSubmitOrder = async () => {
    if (!isMonthlyMode && selectedService === 'embroidery' && (!minEmbroideryRank || !currentTier)) {
      setValidationAlert({
        title: 'Size & Package Mismatch',
        message: !minEmbroideryRank
          ? 'Enter a valid custom width and height up to 12 inches. Larger designs need a custom quotation.'
          : 'No published embroidery package supports this size. Please contact the studio.',
        actionText: 'Review Size & Package',
        onAction: () => {}
      });
      return;
    }
    if (!hasValidLivePrice) {
      setValidationAlert({ title: 'Pricing Unavailable', message: 'Choose a currently published package before ordering.', actionText: 'Review Packages', onAction: () => {} });
      return;
    }
    // Monthly prepaid bundles can receive artwork over the 30-day period.
    // Single orders still require artwork before checkout.
    if (!isMonthlyMode && uploadedFiles.length === 0) {
      const errorMsg = selectedService === 'patch'
        ? 'Please choose or upload your patch artwork or logo before continuing.'
        : 'Please choose or upload your design file before continuing.';
      setUploadError(errorMsg);
      setIsUploadHighlighted(true);
      setValidationAlert({
        title: selectedService === 'patch' ? 'Patch Artwork Required' : 'Design File Required',
        message: selectedService === 'patch'
          ? 'Please choose or upload your artwork or logo (JPG, PNG, PDF, AI, DST) to place your patch order.'
          : 'Please choose or upload your artwork or design file (JPG, PNG, PDF, AI, DST) to place your order.',
        actionText: 'Upload File Now',
        onAction: () => {
          setIsUploadHighlighted(true);
          if (uploadSectionRef.current) {
            uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setTimeout(() => fileInputRef.current?.click(), 120);
        }
      });
      if (uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 1b. Validate strictly minimum 50 patches for Custom Patches
    if (selectedService === 'patch' && (Number(patchQuantity) < 50 || isNaN(Number(patchQuantity)))) {
      setPatchQuantity(50);
      setValidationAlert({
        title: 'Minimum 50 Patches Required',
        message: 'Custom patch manufacturing requires a minimum order of 50 pieces. We have set your quantity to 50.',
        actionText: 'Continue with 50 Patches',
        onAction: () => {}
      });
      return;
    }

    // 2. Validate custom dimensions if custom size is selected
    if (!isMonthlyMode && selectedService === 'embroidery' && sizeOption === 'custom') {
      const numW = parseFloat(customWidth);
      const numH = parseFloat(customHeight);
      if (!customWidth || !customHeight || isNaN(numW) || isNaN(numH) || numW <= 0 || numH <= 0) {
        setIsCustomSizeHighlighted(true);
        setValidationAlert({
          title: 'Custom Dimensions Required',
          message: 'Please specify valid width and height dimensions (e.g. 3.5" × 3.5") for your embroidery design.',
          actionText: 'Enter Dimensions',
          onAction: () => {
            if (customSizeRef.current) {
              customSizeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const inp = customSizeRef.current.querySelector('input');
              if (inp) inp.focus();
            }
          }
        });
        if (customSizeRef.current) {
          customSizeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }

    // Custom patch dimensions must be valid before authentication and checkout.
    if (selectedService === 'patch') {
      const { width, height } = getPatchDimensions();
      if (![width, height].every(n => Number.isFinite(n) && n >= 0.5 && n <= 24)) {
        setValidationAlert({
          title: 'Patch Size Required',
          message: 'Enter a width and height between 0.5 and 24 inches.',
          actionText: 'Enter Size',
          onAction: () => patchSizeRef.current?.querySelector('input')?.focus()
        });
        patchSizeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // 3. Require Login/Signup if visitor is not authenticated
    if (!isUserAuthenticated) {
      saveDraft();
      if (setAuthModalMode) setAuthModalMode('login');
      if (setIsAuthModalOpen) {
        setIsAuthModalOpen(true);
      } else if (typeof window !== 'undefined') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
      return;
    }

    const cleanEmail = (authUser?.email || currentUser?.email || '').toLowerCase().trim();
    const cleanName = (
      authUser?.user_metadata?.full_name ||
      authUser?.name ||
      currentUser?.name ||
      authUser?.email?.split('@')[0] ||
      'Customer'
    ).trim();
    const cleanPhone = (authUser?.user_metadata?.phone || authUser?.phone || '').trim();

    setUploadError('');
    setIsSubmitting(true);

    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Design';
      const cleanService = selectedService === 'patch'
        ? 'Custom Patches'
        : selectedService === 'vector'
          ? 'Vector Art'
          : 'Embroidery Digitizing';

      const orderPackageName = isMonthlyMode ? monthlyPlan.title : (currentTier?.title || 'Standard');
      let derivedTitle = isMonthlyMode ? `${cleanService} • ${monthlyCount} Design Monthly Bundle` : `${firstFileName} - ${orderPackageName}`;
      let isRush = false;
      let targetFormats = ['DST', 'PES', 'EMB', 'PDF'];
      let derivedSize = isMonthlyMode ? '30-day prepaid design bundle; submit artwork via order conversation' : 'Left Chest (Up to 4")';

      if (!isMonthlyMode && selectedService === 'embroidery') {
        isRush = turnaround === 'rush';
        if (sizeOption === 'custom') {
          derivedSize = `${customWidth}" × ${customHeight}" (Custom)`;
        } else if (sizeOption === 'cap') {
          derivedSize = 'Cap / Hat (Up to 2.5")';
        } else if (sizeOption === 'left-chest') {
          derivedSize = 'Left Chest (Up to 4")';
        } else if (sizeOption === 'sleeve') {
          derivedSize = 'Jacket Front / Sleeve (Up to 7")';
        } else if (sizeOption === 'jacket-back') {
          derivedSize = 'Full Jacket Back (Up to 12")';
        }

        if (fileFormat === 'dst') targetFormats = ['DST', 'PDF Spec Sheet'];
        else if (fileFormat === 'pes') targetFormats = ['PES', 'PDF Spec Sheet'];
        else if (fileFormat === 'emb') targetFormats = ['EMB', 'PDF Spec Sheet'];
        else if (fileFormat === 'exp') targetFormats = ['EXP', 'PDF Spec Sheet'];
        else if (fileFormat === 'jef') targetFormats = ['JEF', 'PDF Spec Sheet'];
        else targetFormats = ['DST', 'PES', 'EMB', 'PDF Spec Sheet'];

      } else if (selectedService === 'patch') {
        derivedTitle = `${firstFileName} - ${patchStyle} Patches (${pricing.patchPieces} Pcs)`;
        isRush = false;
        derivedSize = `${getPatchSizeLabel()} ${patchStyle} (${patchBacking})`;
        targetFormats = ['DST', 'PDF Proof Sheet', 'Physical Courier Delivery'];
      } else if (!isMonthlyMode && selectedService === 'vector') {
        isRush = vectorTurnaround === 'rush';
        derivedSize = 'Scalable Vector';
        targetFormats = vectorFormat === 'ai' ? ['AI'] : vectorFormat === 'svg' ? ['SVG'] : ['AI', 'EPS', 'SVG', 'PDF', 'PNG'];
      }

      const primaryArtworkUrl = isMonthlyMode ? null : (uploadedFiles[0]?.url || null);
      if (!isMonthlyMode && (!primaryArtworkUrl || primaryArtworkUrl.startsWith('blob:'))) throw new Error('Artwork upload is incomplete. Please upload your design again.');

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        source: isMonthlyMode ? 'monthly_design_bundle' : 'direct_order_desk',
        monthly_plan_id: isMonthlyMode ? monthlyPlan.id : undefined,
        monthly_plan_designs: isMonthlyMode ? monthlyPlan.designs : undefined,
        monthly_plan_duration_days: isMonthlyMode ? 30 : undefined,
        package_id: isMonthlyMode ? null : currentTier.id,
        unit_price: pricing.unitPrice,
        rush_fee: pricing.rush,
        package_name: orderPackageName,
        package_tier: orderPackageName,
        quantity: pricing.quantity,
        patchQuantity: selectedService === 'patch' ? pricing.patchPieces : undefined,
        price: pricing.total,
        totalPrice: pricing.total,
        base_price: pricing.subtotal,
        discount_amount: pricing.discountAmount || 0,
        isRush: isRush,
        notes: isMonthlyMode ? '30-day prepaid bundle. Submit designs through order conversation. No auto-renewal.' : additionalDetails.trim(),
        placement: derivedSize,
        width: selectedService === 'patch' ? getPatchDimensions().width : (sizeOption === 'custom' ? customWidth : '3.5'),
        height: selectedService === 'patch' ? getPatchDimensions().height : (sizeOption === 'custom' ? customHeight : '3.5'),
        patchWidth: selectedService === 'patch' ? getPatchDimensions().width : undefined,
        patchHeight: selectedService === 'patch' ? getPatchDimensions().height : undefined,
        patchProductionTime: selectedService === 'patch' ? '10–14 days' : undefined,
        fabricType: selectedService === 'embroidery' && !isMonthlyMode ? additionalDetails.trim() || 'Standard' : null,
        patchStyle: selectedService === 'patch' ? patchStyle : null,
        patchBacking: selectedService === 'patch' ? patchBacking : null,
        targetFormats: targetFormats,
        image_url: primaryArtworkUrl,
        artworkUrl: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        uploadedFiles: isMonthlyMode ? [] : uploadedFiles,
        client_name: cleanName,
        clientName: cleanName,
        client_email: cleanEmail,
        clientEmail: cleanEmail,
        clientPhone: cleanPhone || null,
        status: 'submitted',
        payment_status: 'pending'
      };

      const created = await createOrder(orderPayload);
      if (!created?.id) throw new Error('Order not confirmed by server. Please try again.');
      const resultingId = String(created.id);

      // Clean pending draft and store order id
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('bdigi_pending_order_draft');
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingId).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
        } catch {}
      }

      if (showToast) {
        showToast(`🎉 Order #${resultingId.replace(/^#/, '')} created successfully!`, 'success');
      }

      // Launch Instant Stripe Checkout Modal / Payment Page
      if (setIsCheckoutModalOpen && setCheckoutSession) {
        setCheckoutSession({
          amount: pricing.total,
          price: pricing.total,
          totalPrice: pricing.total,
          base_price: pricing.subtotal,
          orderId: resultingId,
          title: derivedTitle,
          clientEmail: cleanEmail,
          clientName: cleanName
        });
        setIsCheckoutModalOpen(true);
      }

      if (onCloseModal) onCloseModal();
      if (onOrderComplete) onOrderComplete(resultingId);
    } catch (err) {
      console.error('[Order submit exception]:', err);
      setValidationAlert({
        title: 'Order Submission Issue',
        message: err?.message || 'We could not submit your order. Please check your connection and try again.',
        actionText: 'Retry Submission',
        onAction: () => {
          handleFinalSubmitOrder();
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '1020px',
        margin: '0 auto',
        background: 'var(--color-surface, #ffffff)',
        padding: 'clamp(1.2rem, 2.5vw, 2rem)',
        borderRadius: '24px',
        border: '1.5px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 15px 40px -12px rgba(0, 0, 0, 0.06), 0 0 1px 1px rgba(0, 0, 0, 0.02)',
        boxSizing: 'border-box',
        color: 'var(--color-text-primary, #0f172a)'
      }}
    >
      <style>{`
        /* Compact service chooser; no unnecessary modal scrolling on desktop. */
        .bdigi-service-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
          align-items: stretch;
        }
        .bdigi-service-card {
          width: 100%;
          min-width: 0;
          border: 1.5px solid var(--color-border, #dbe4f4);
          border-radius: 16px;
          padding: 1rem 0.95rem;
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0b1730);
          font: inherit;
          text-align: center;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.4rem;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }
        .bdigi-service-card:hover {
          border-color: var(--service-accent);
          box-shadow: 0 8px 20px rgba(30, 64, 175, 0.10);
          transform: translateY(-2px);
        }
        .bdigi-service-card:focus-visible, .bdigi-switch-tab:focus-visible {
          outline: 3px solid var(--color-border-focus, #2563eb);
          outline-offset: 3px;
        }
        .bdigi-service-icon {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: var(--service-tint);
          color: var(--service-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.3rem;
        }
        .bdigi-service-title {
          font-size: 1.02rem;
          font-weight: 850;
          line-height: 1.3;
          margin: 0;
        }
        .bdigi-service-description {
          color: var(--color-text-muted, #64748b);
          font-size: 0.77rem;
          line-height: 1.4;
          margin: 0;
          min-height: 2.25rem;
        }
        .bdigi-service-price {
          margin-top: auto;
          padding-top: 0.65rem;
          color: var(--service-accent);
          font-size: 1.12rem;
          font-weight: 900;
          white-space: nowrap;
        }
        .bdigi-service-select {
          width: 100%;
          padding: 0.57rem;
          margin-top: 0.1rem;
          background: var(--service-cta);
          border-radius: 9px;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.82rem;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 0.4rem;
        }
        .bdigi-service-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.6rem;
          padding-bottom: 0.65rem;
          margin-bottom: 0.85rem;
          border-bottom: 1px solid var(--color-border, #dbe4f4);
        }
        .bdigi-service-switch {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .bdigi-switch-tab {
          border: 1.5px solid var(--color-border, #dbe4f4);
          border-radius: 999px;
          background: transparent;
          color: var(--color-text-secondary, #334155);
          font: inherit;
          font-weight: 750;
          font-size: 0.76rem;
          padding: 0.43rem 0.72rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .bdigi-switch-tab[aria-pressed="true"] {
          border-color: var(--service-accent);
          background: var(--service-tint);
          color: var(--service-accent);
        }
        @media (max-width: 720px) {
          .bdigi-service-grid { grid-template-columns: 1fr; gap: 0.6rem; }
          .bdigi-service-card { padding: 0.8rem 0.9rem; }
          .bdigi-service-icon { width: 38px; height: 38px; margin-bottom: 0; }
          .bdigi-service-description { min-height: 0; }
          .bdigi-service-nav { align-items: stretch; }
          .bdigi-service-switch { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .bdigi-switch-tab { white-space: normal; font-size: 0.7rem; padding: 0.55rem 0.32rem; line-height: 1.25; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bdigi-service-card { transition: none; }
          .bdigi-service-card:hover { transform: none; }
        }
        .bdigi-order-mode-switch { display: flex; padding: 4px; gap: 4px; border-radius: 14px; background: var(--color-subtle); border: 1px solid var(--color-border); }
        .bdigi-mode-option { padding: 0.56rem 1.1rem; background: transparent; border: 1px solid transparent; border-radius: 10px; font-size: 0.84rem; font-weight: 850; cursor: pointer; color: var(--color-text-secondary); }
        .bdigi-mode-option.is-selected { color: #fff; background: linear-gradient(120deg, #2563eb, #4338ca); box-shadow: 0 4px 12px rgba(37,99,235,0.20); }
        .bdigi-mode-option:focus-visible,.bdigi-monthly-card:focus-visible { outline: 3px solid var(--color-border-focus, #2563eb); outline-offset: 2px; }
        .bdigi-monthly-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
        .bdigi-monthly-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.45rem; padding: 1.25rem 0.6rem; border-radius: 15px; border: 1.5px solid var(--color-border); background: var(--color-surface); color: var(--color-text-primary); cursor: pointer; text-align: center; }
        .bdigi-monthly-card.is-selected { border-color: var(--color-primary); background: var(--color-primary-light); box-shadow: 0 5px 18px var(--color-primary-glow); }
        .bdigi-monthly-card:disabled { cursor: not-allowed; opacity: 0.55; }
        @media(max-width:600px) { .bdigi-order-mode-switch{width:100%;}.bdigi-mode-option{flex:1;padding:0.52rem 0.4rem;}.bdigi-monthly-grid{gap:0.5rem;}.bdigi-monthly-card{padding:0.9rem 0.3rem;}}
        .bdigi-order-container {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 880px) {
          .bdigi-order-container {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
        }
        .bdigi-form-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          align-items: center;
          gap: 1.15rem;
          margin-bottom: 1.15rem;
        }
        @media (max-width: 600px) {
          .bdigi-form-row {
            grid-template-columns: 1fr;
            gap: 0.35rem;
            margin-bottom: 1rem;
          }
        }
        .bdigi-label {
          font-size: 0.94rem;
          font-weight: 800;
          color: var(--color-text-primary, #0f172a);
          letter-spacing: -0.01em;
        }
        /* The embroidery package selector shares the familiar Vector Art dropdown. */
        .bdigi-embroidery-package-row .bdigi-select {
          color: var(--color-text-primary, #0f172a);
          font-weight: 800;
        }
        .bdigi-embroidery-package-row .bdigi-select:disabled {
          opacity: 1;
          color: var(--color-text-secondary, #334155);
          cursor: not-allowed;
        }
        .bdigi-select option {
          color: #0f172a;
          background: #ffffff;
          font-weight: 600;
        }
        [data-theme="dark"] .bdigi-select option {
          color: #f8fafc;
          background: #17263d;
        }
        .bdigi-package-notice {
          display: flex;
          align-items: center;
          gap: .42rem;
          margin-top: .4rem;
          color: var(--color-primary, #1d4ed8);
          font-size: .78rem;
          font-weight: 750;
          line-height: 1.35;
        }
        .bdigi-package-notice svg { flex: none; }
        .bdigi-package-notice.is-warning {
          color: var(--color-error-text, #b91c1c);
        }
        .bdigi-embroidery-package-row .bdigi-select:focus-visible {
          outline: 3px solid var(--color-border-focus, #2563eb);
          outline-offset: 2px;
        }
        .bdigi-select-wrapper {
          position: relative;
          width: 100%;
        }
        .bdigi-select {
          width: 100%;
          padding: 0.72rem 2.5rem 0.72rem 0.95rem;
          border-radius: 10px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.92rem;
          font-weight: 600;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .bdigi-select:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .bdigi-select-arrow {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748b;
          display: flex;
          align-items: center;
        }
        .bdigi-textarea {
          width: 100%;
          padding: 0.72rem 0.95rem;
          border-radius: 10px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          transition: all 0.18s ease;
        }
        .bdigi-textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .bdigi-input {
          width: 100%;
          padding: 0.72rem 0.95rem;
          border-radius: 10px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: all 0.18s ease;
        }
        .bdigi-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .bdigi-summary-card {
          position: sticky;
          top: 1.5rem;
          background: ${isDark ? '#101d32' : '#ffffff'};
          border: 1.5px solid ${isDark ? '#45628d' : '#c4d5ee'};
          border-radius: 18px;
          padding: 1.4rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
        }
      `}</style>

      {/* STEP 1: SERVICE SELECTION SCREEN (SHOWN WHEN STARTING ORDER) */}
      {!hasSelectedService ? (
        <section aria-labelledby="bdigi-choose-service-title" style={{ padding: '0.15rem 0 0.25rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
            <h2 id="bdigi-choose-service-title" style={{
              fontSize: 'clamp(1.35rem, 2.5vw, 1.65rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              margin: '0 0 0.2rem',
              color: 'var(--color-text-primary, #0f172a)'
            }}>Select a Service</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', margin: 0 }}>
              Choose a service to start placing your order.
            </p>
          </div>
          <div className="bdigi-service-grid">
            {serviceChoices.map(({ key, name, description, price, Icon, accent, tint, cta }) => (
              <button
                key={key}
                type="button"
                className="bdigi-service-card"
                style={{ '--service-accent': accent, '--service-tint': tint, '--service-cta': cta }}
                onClick={() => handleSelectService(key)}
                aria-label={`Select ${name}. ${price === null ? 'Pricing unavailable' : 'From ' + formatUSD(price) + (key === 'patch' ? ' per piece' : '')}`}
              >
                <span className="bdigi-service-icon"><Icon size={23} aria-hidden="true" /></span>
                <span className="bdigi-service-title">{name}</span>
                <span className="bdigi-service-description">{description}</span>
                <span className="bdigi-service-price">
                  {price === null ? (
                    <span style={{ fontSize: '0.8rem' }}>Pricing unavailable</span>
                  ) : (
                    <><span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>From </span>{formatUSD(price)}{key === 'patch' && <span style={{ fontSize: '0.7rem', fontWeight: 650 }}>/pc</span>}</>
                  )}
                </span>
                <span className="bdigi-service-select">Select <ArrowRight size={14} aria-hidden="true" /></span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        /* STEP 2: ORDER CUSTOMIZATION DESK (SHOWN ONCE SERVICE IS SELECTED) */
        <div>
          {/* Customer can change service using the back button above. */}
          <div className="bdigi-service-nav">
            <button type="button" onClick={() => { setHasSelectedService(false); setOrderMode('regular'); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem',
                borderRadius: '999px', border: '1px solid var(--color-border)',
                background: 'var(--color-subtle)', color: 'var(--color-text-primary)', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}>
              <ArrowLeft size={15} aria-hidden="true" /> Change Service
            </button>
            {selectedService !== 'patch' && (
              <div role="group" aria-label="Choose order type" className="bdigi-order-mode-switch">
                {[{ id: 'regular', title: 'Regular Order' }, { id: 'monthly', title: 'Monthly Plan' }].map(item => (
                  <button type="button" key={item.id} aria-pressed={orderMode === item.id}
                    onClick={() => setOrderMode(item.id)}
                    className={'bdigi-mode-option ' + (orderMode === item.id ? 'is-selected' : '')}>
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!isMonthlyMode && !getActiveTiers(selectedService).length && <p role="status" style={{ color: 'var(--color-warning-text)', fontWeight: 700, padding: '0.75rem' }}>Pricing is temporarily unavailable. Please try again later.</p>}
          {/* 2-COLUMN ORDER DESK: LEFT OPTIONS & UPLOAD VS RIGHT STICKY PRICE & QUANTITY */}
          <div className="bdigi-order-container">

            {/* LEFT COLUMN: CUSTOMER INSTRUCTIONS & OPTIONS */}
            <div>

              {isMonthlyMode ? (
                <section aria-label="Monthly plan choices" style={{ display: 'grid', gap: '0.85rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--color-text-primary)', fontSize: '1.22rem', fontWeight: 900 }}>Choose Your Monthly Bundle</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.81rem', lineHeight: 1.5 }}>
                      Prepaid 30-day design bundle · Pay once · No auto-renewal
                    </p>
                  </div>
                  {monthlyError && <p role="alert" style={{ color: 'var(--color-error-text, #b91c1c)', margin: 0 }}>{monthlyError}</p>}
                  {monthlyLoading && <p role="status" style={{ color: 'var(--color-text-secondary)' }}>Loading live monthly prices...</p>}
                  <div className="bdigi-monthly-grid">
                    {MONTHLY_DESIGN_LIMITS.map(count => {
                      const plan = findPublishedMonthlyBundle({ plans: monthlyPlans }, selectedService, count);
                      const selected = monthlyCount === count;
                      return (
                        <button key={count} type="button" disabled={!plan || monthlyLoading}
                          className={'bdigi-monthly-card ' + (selected ? 'is-selected' : '')}
                          aria-pressed={selected}
                          onClick={() => setMonthlyCount(count)}>
                          <strong style={{ fontSize: '1.5rem', fontWeight: 950, lineHeight: 1 }}>{count}</strong>
                          <span style={{ fontSize: '0.78rem', fontWeight: 750 }}>designs / 30 days</span>
                          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: plan ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                            {plan ? formatUSD(plan.price) : 'Not available'}
                          </span>
                          {plan?.description && <span style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)' }}>{plan.description}</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ padding: '0.9rem 1rem', background: 'var(--color-primary-light)', border: '1px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-secondary)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--color-text-primary)' }}>How it works:</strong> Purchase a bundle, then upload designs from your order tracker during the next 30 days. Studio staff track fulfillment. This is not an automatic recurring subscription.
                  </div>
                </section>
              ) : (
                <>
              {/* 1. EMBROIDERY OPTIONS */}
              {selectedService === 'embroidery' && (
                <div>
                  {/* Same compact dropdown as Vector Art, restricted to size-eligible packages. */}
                  <div className="bdigi-form-row bdigi-embroidery-package-row">
                    <label className="bdigi-label" htmlFor="bdigi-embroidery-package">Package</label>
                    <div>
                      <div className="bdigi-select-wrapper">
                        <select
                          id="bdigi-embroidery-package"
                          aria-label="Embroidery package"
                          className="bdigi-select"
                          value={currentTier ? String(currentTier.id || currentTier.title) : ''}
                          onChange={(event) => setSelectedTierId(event.target.value)}
                          disabled={eligibleEmbroidery.length === 0}
                        >
                          {eligibleEmbroidery.length === 0 && (
                            <option value="">No package available for this size</option>
                          )}
                          {eligibleEmbroidery.map(tier => (
                            <option key={String(tier.id || tier.title)} value={String(tier.id || tier.title)}>
                              {tier.title} — {formatUSD(tier.price)}
                            </option>
                          ))}
                        </select>
                        <div className="bdigi-select-arrow"><ChevronDown size={17} /></div>
                      </div>
                      {minEmbroideryRank === null ? (
                        <div className="bdigi-package-notice is-warning" role="alert">
                          <AlertCircle size={16} aria-hidden="true" /> Enter valid dimensions up to 12″; larger sizes need a custom quote.
                        </div>
                      ) : minEmbroideryRank > 1 ? (
                        <div className="bdigi-package-notice" role="status">
                          <ShieldCheck size={16} aria-hidden="true" />
                          {minEmbroideryRank === 2 ? '7″: Standard or Premium.' : '12″: Premium only.'}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* File Format Dropdown */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">File Format</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={fileFormat}
                        onChange={(e) => setFileFormat(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="all">All Formats (.DST, .PES, .EMB, .PDF)</option>
                        <option value="dst">DST (Tajima)</option>
                        <option value="pes">PES (Brother)</option>
                        <option value="emb">EMB (Wilcom)</option>
                        <option value="exp">EXP (Melco)</option>
                        <option value="jef">JEF (Janome)</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Size Dropdown */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Size</label>
                    <div>
                      <div className="bdigi-select-wrapper">
                        <select
                          value={sizeOption}
                          onChange={(e) => setSizeOption(e.target.value)}
                          className="bdigi-select"
                        >
                          <option value="left-chest">Left Chest (4")</option>
                          <option value="cap">Cap / Hat (2.5")</option>
                          <option value="sleeve">Sleeve (7")</option>
                          <option value="jacket-back">Jacket Back (12")</option>
                          <option value="custom">Custom Size</option>
                        </select>
                        <div className="bdigi-select-arrow">
                          <ChevronDown size={17} />
                        </div>
                      </div>

                      {sizeOption === 'custom' && (
                        <div
                          ref={customSizeRef}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            marginTop: '0.5rem',
                            padding: isCustomSizeHighlighted ? '0.35rem 0.5rem' : '0',
                            borderRadius: '8px',
                            border: isCustomSizeHighlighted ? '1.5px solid #ef4444' : 'none',
                            background: isCustomSizeHighlighted ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2') : 'transparent',
                            animation: isCustomSizeHighlighted ? 'bdigiErrorShake 0.4s ease-in-out' : 'none'
                          }}
                        >
                          <input
                            type="text"
                            value={customWidth}
                            onChange={(e) => {
                              setCustomWidth(e.target.value);
                              setIsCustomSizeHighlighted(false);
                            }}
                            placeholder="Width"
                            className="bdigi-input"
                            style={{
                              maxWidth: '90px',
                              textAlign: 'center',
                              borderColor: isCustomSizeHighlighted ? '#ef4444' : undefined
                            }}
                          />
                          <span style={{ color: '#94a3b8', fontWeight: 900 }}>×</span>
                          <input
                            type="text"
                            value={customHeight}
                            onChange={(e) => {
                              setCustomHeight(e.target.value);
                              setIsCustomSizeHighlighted(false);
                            }}
                            placeholder="Height"
                            className="bdigi-input"
                            style={{
                              maxWidth: '90px',
                              textAlign: 'center',
                              borderColor: isCustomSizeHighlighted ? '#ef4444' : undefined
                            }}
                          />
                          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 700 }}>Inches</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Turnaround Dropdown */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Turnaround</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={turnaround}
                        onChange={(e) => setTurnaround(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="standard">Standard (4–12h) — Free</option>
                        <option value="rush">Rush (2–4h) — +$10</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="bdigi-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>Notes</label>
                    <textarea
                      rows={2}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Fabric, thread colors, or special notes..."
                      className="bdigi-textarea"
                    />
                  </div>

                  {/* NUMBER OF DESIGNS (Placed BEFORE upload) */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Number of Designs</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1.5px solid var(--color-border, #cbd5e1)',
                          borderRadius: '10px',
                          background: 'var(--color-surface, #ffffff)',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setDesignQuantity(Math.max(1, designQuantity - 1))}
                          disabled={designQuantity <= 1}
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'none',
                            border: 'none',
                            color: designQuantity <= 1 ? '#94a3b8' : 'var(--color-text-primary, #0f172a)',
                            cursor: designQuantity <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: designQuantity <= 1 ? 0.45 : 1
                          }}
                          aria-label="Decrease designs"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ width: '38px', textAlign: 'center', fontSize: '1rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                          {designQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDesignQuantity(designQuantity + 1)}
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-primary, #0f172a)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label="Increase designs"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                        ${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"} each design
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CUSTOM PATCHES OPTIONS */}
              {selectedService === 'patch' && (
                <div>
                  {/* Package Tier / Quality Tier (Live from Admin Dynamic Pricing Tiers) */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Patch Tier</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={currentTier?.id || currentTier?.title || ''}
                        onChange={(e) => setSelectedTierId(e.target.value)}
                        className="bdigi-select"
                      >
                        {!currentTier && <option value="">Select a valid package</option>}
                        {currentServiceTiers.map(tier => {
                          const val = String(tier.id || tier.title);
                          const displayPrice = Number(tier.price).toFixed(2);
                          return (
                            <option key={val} value={val}>
                              {tier.title} — ${displayPrice} / piece
                            </option>
                          );
                        })}
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Patch Style */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Style</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={patchStyle}
                        onChange={(e) => setPatchStyle(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="Embroidered Twill">Embroidered Twill (Classic Textured)</option>
                        <option value="Woven High-Def">Woven High-Def (Ultra Fine Lettering)</option>
                        <option value="PVC Rubber 3D">PVC Rubber 3D (Waterproof Molded)</option>
                        <option value="Laser Leather">Leather / Laser Engraved</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Patch Backing */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Backing</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={patchBacking}
                        onChange={(e) => setPatchBacking(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="Velcro (Hook & Loop)">Velcro (Hook & Loop)</option>
                        <option value="Heat-Seal Iron-On">Heat-Seal Iron-On</option>
                        <option value="Plain Sew-On">Plain Sew-On</option>
                        <option value="Peel & Stick">Peel & Stick Adhesive</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Custom Patches size options and physical production timeline */}
                  <div className="bdigi-form-row">
                    <label htmlFor="bdigi-patch-size" className="bdigi-label">Size</label>
                    <div>
                      <div className="bdigi-select-wrapper">
                        <select id="bdigi-patch-size" value={patchSizeOption} onChange={(e) => setPatchSizeOption(e.target.value)} className="bdigi-select">
                          <option value="2">2" × 2"</option>
                          <option value="2.5">2.5" × 2.5"</option>
                          <option value="3">3" × 3"</option>
                          <option value="4">4" × 4"</option>
                          <option value="5">5" × 5"</option>
                          <option value="custom">Custom Size</option>
                        </select>
                        <span className="bdigi-select-arrow"><ChevronDown size={17}/></span>
                      </div>
                      {patchSizeOption === 'custom' && (
                        <div ref={patchSizeRef} style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                          <input className="bdigi-input" type="number" inputMode="decimal" min="0.5" max="24" step="0.25"
                            aria-label="Patch width in inches" placeholder="W" value={patchCustomWidth}
                            onChange={(e) => setPatchCustomWidth(e.target.value)}
                            style={{ width: '85px', height: '39px', textAlign: 'center', padding: '0 0.45rem' }} />
                          <span style={{ color: 'var(--color-text-muted)', fontWeight: 800 }}>×</span>
                          <input className="bdigi-input" type="number" inputMode="decimal" min="0.5" max="24" step="0.25"
                            aria-label="Patch height in inches" placeholder="H" value={patchCustomHeight}
                            onChange={(e) => setPatchCustomHeight(e.target.value)}
                            style={{ width: '85px', height: '39px', textAlign: 'center', padding: '0 0.45rem' }} />
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>in</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bdigi-form-row">
                    <span className="bdigi-label">Production</span>
                    <div style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.88rem', fontWeight: 800
                    }}>10–14 days</div>
                  </div>

                  {/* Patch Additional Details */}
                  <div className="bdigi-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>Notes</label>
                    <textarea
                      rows={1}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Border, colors, notes..."
                      className="bdigi-textarea"
                      style={{ minHeight: '43px', height: '46px' }}
                    />
                  </div>

                  {/* Compact quantity with 50-piece minimum and quick presets */}
                  <div className="bdigi-form-row">
                    <label htmlFor="bdigi-patch-quantity" className="bdigi-label">Quantity</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0,
                        border: '1.5px solid var(--color-border)', borderRadius: '10px',
                        background: 'var(--color-surface)', overflow: 'hidden' }}>
                        <button type="button" aria-label="Decrease patch quantity"
                          disabled={Number(patchQuantity) <= 50}
                          onClick={() => setPatchQuantity(prev => Math.max(50, (Number(prev) || 50) - 10))}
                          style={{ width: '32px', height: '36px', border: 'none', background: 'none', cursor: Number(patchQuantity) <= 50 ? 'not-allowed' : 'pointer', opacity: Number(patchQuantity) <= 50 ? 0.45 : 1, color: 'var(--color-text-primary)' }}>
                          <Minus size={14} />
                        </button>
                        <input id="bdigi-patch-quantity" type="number" min="50" max="100000" step="1"
                          value={patchQuantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPatchQuantity(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                          }}
                          onBlur={() => setPatchQuantity(prev => Math.max(50, Math.min(100000, parseInt(prev, 10) || 50)))}
                          className="bdigi-input" aria-label="Patch quantity, minimum 50"
                          style={{ width: '66px', height: '36px', border: 'none', borderRadius: 0, textAlign: 'center', fontWeight: 900, padding: '0 0.25rem' }} />
                        <button type="button" aria-label="Increase patch quantity"
                          onClick={() => setPatchQuantity(prev => Math.min(100000, (Number(prev) || 50) + 10))}
                          style={{ width: '32px', height: '36px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="bdigi-select-wrapper" style={{ width: 'auto', flex: '0 1 135px', minWidth: '118px' }}>
                        <select className="bdigi-select" aria-label="Quick patch quantity"
                          value={[50,100,200,250,500,1000].includes(Number(patchQuantity)) ? String(patchQuantity) : ''}
                          onChange={(e) => { if (e.target.value) setPatchQuantity(Number(e.target.value)); }}
                          style={{ height: '38px', padding: '0.3rem 1.7rem 0.3rem 0.5rem', fontSize: '0.8rem' }}>
                          <option value="">Custom qty</option>
                          {[50,100,200,250,500,1000].map(qty => <option key={qty} value={qty}>{qty} pcs</option>)}
                        </select>
                        <span className="bdigi-select-arrow" style={{ right: '7px' }}><ChevronDown size={14}/></span>
                      </div>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 700 }}>Min 50</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. VECTOR ART OPTIONS */}
              {selectedService === 'vector' && (
                <div>
                  {/* Package Tier Dropdown (Live from Admin Dynamic Pricing Tiers) */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Package</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={currentTier?.id || currentTier?.title || ''}
                        onChange={(e) => setSelectedTierId(e.target.value)}
                        className="bdigi-select"
                      >
                        {!currentTier && <option value="">Select a valid package</option>}
                        {currentServiceTiers.map(tier => {
                          const val = String(tier.id || tier.title);
                          const displayPrice = Number(tier.price).toFixed(2);
                          return (
                            <option key={val} value={val}>
                              {tier.title} — ${displayPrice}
                            </option>
                          );
                        })}
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Vector Formats */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">File Format</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={vectorFormat}
                        onChange={(e) => setVectorFormat(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="all">All Formats (.AI, .EPS, .SVG, .PDF)</option>
                        <option value="ai">Adobe Illustrator (.AI)</option>
                        <option value="svg">Scalable Vector (.SVG)</option>
                        <option value="pdf">Print PDF</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Vector Turnaround */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Turnaround</label>
                    <div className="bdigi-select-wrapper">
                      <select
                        value={vectorTurnaround}
                        onChange={(e) => setVectorTurnaround(e.target.value)}
                        className="bdigi-select"
                      >
                        <option value="standard">Standard (6–12h) — Free</option>
                        <option value="rush">Rush (2–4h) — +$10</option>
                      </select>
                      <div className="bdigi-select-arrow">
                        <ChevronDown size={17} />
                      </div>
                    </div>
                  </div>

                  {/* Vector Details */}
                  <div className="bdigi-form-row" style={{ alignItems: 'flex-start' }}>
                    <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>Notes</label>
                    <textarea
                      rows={2}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Colors, fonts, or vector notes..."
                      className="bdigi-textarea"
                    />
                  </div>

                  {/* NUMBER OF DESIGNS (Placed BEFORE upload) */}
                  <div className="bdigi-form-row">
                    <label className="bdigi-label">Number of Designs</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          border: '1.5px solid var(--color-border, #cbd5e1)',
                          borderRadius: '10px',
                          background: 'var(--color-surface, #ffffff)',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setDesignQuantity(Math.max(1, designQuantity - 1))}
                          disabled={designQuantity <= 1}
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'none',
                            border: 'none',
                            color: designQuantity <= 1 ? '#94a3b8' : 'var(--color-text-primary, #0f172a)',
                            cursor: designQuantity <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: designQuantity <= 1 ? 0.45 : 1
                          }}
                          aria-label="Decrease designs"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ width: '38px', textAlign: 'center', fontSize: '1rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                          {designQuantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDesignQuantity(designQuantity + 1)}
                          style={{
                            width: '38px',
                            height: '38px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-primary, #0f172a)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          aria-label="Increase designs"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                        ${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"} each design
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* UPLOAD ARTWORK FILES (Compact Drag & Drop Box) */}
              <div
                ref={uploadSectionRef}
                className="bdigi-form-row"
                style={{ alignItems: 'flex-start' }}
              >
                <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>
                  {selectedService === 'patch' ? 'Patch Artwork' : 'Upload Files'}
                  <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                      setIsUploadHighlighted(false);
                      setUploadError('');
                      fileInputRef.current?.click();
                    }}
                    style={{
                      border: isUploadHighlighted
                        ? '2px solid #ef4444'
                        : isDragOver
                          ? '2px dashed #2563eb'
                          : '1.5px dashed var(--color-border, #cbd5e1)',
                      borderRadius: '10px',
                      background: isUploadHighlighted
                        ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                        : isDragOver
                          ? (isDark ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff')
                          : (isDark ? '#1e293b' : '#f8fafc'),
                      boxShadow: isUploadHighlighted
                        ? '0 0 0 4px rgba(239, 68, 68, 0.22), 0 4px 14px rgba(239, 68, 68, 0.16)'
                        : 'none',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      gap: '0.75rem',
                      animation: isUploadHighlighted ? 'bdigiErrorShake 0.4s ease-in-out' : 'none'
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple={selectedService !== 'patch'}
                      accept="image/*,.pdf,.ai,.eps,.svg,.dst,.pes,.emb"
                      onChange={handleFilesChosen}
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isUploadHighlighted ? '#fee2e2' : '#eff6ff',
                          color: isUploadHighlighted ? '#dc2626' : '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Upload size={18} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: isUploadHighlighted ? '#dc2626' : 'var(--color-text-primary, #0f172a)'
                        }}>
                          {selectedService === 'patch'
                            ? 'Upload Artwork'
                            : `Upload ${designQuantity} ${designQuantity === 1 ? 'Design File' : 'Design Files'}`}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                          {selectedService === 'patch'
                            ? 'Max 50MB'
                            : 'JPG, PNG, PDF, AI, DST (Max 50MB)'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        color: isUploadHighlighted ? '#dc2626' : '#1d4ed8',
                        background: isUploadHighlighted ? '#fee2e2' : '#eff6ff',
                        border: isUploadHighlighted ? '1px solid #fca5a5' : '1px solid #93c5fd',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Browse
                    </span>
                  </div>

                  {/* Upload Counter & Guidance */}
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                    <span style={{ color: uploadedFiles.length > 0 ? '#059669' : 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                      {selectedService === 'patch'
                        ? (uploadedFiles.length === 0
                            ? '1 file required'
                            : `✓ ${uploadedFiles.length} attached`)
                        : (uploadedFiles.length === 0
                            ? `0 of ${designQuantity} files attached`
                            : uploadedFiles.length >= designQuantity
                              ? `✓ ${uploadedFiles.length} of ${designQuantity} files attached`
                              : `${uploadedFiles.length} of ${designQuantity} attached (please upload ${designQuantity - uploadedFiles.length} more)`)}
                    </span>
                  </div>

                  {/* HIGHLIGHTED INLINE WARNING (if upload error or missing file) */}
                  {(isUploadHighlighted || uploadError) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#b91c1c',
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '8px',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        marginTop: '0.5rem',
                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
                        animation: 'bdigiErrorShake 0.4s ease-in-out'
                      }}
                    >
                      <AlertCircle size={15} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <span>{uploadError || (selectedService === 'patch' ? 'Please choose or upload your patch artwork to proceed.' : 'Please choose or upload your design file to proceed.')}</span>
                    </div>
                  )}

                  {isUploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700 }}>
                      <Loader2 size={14} className="animate-spin" /> Uploading file...
                    </div>
                  )}

                  {/* Uploaded File Pills */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.55rem' }}>
                      {uploadedFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          <Check size={13} style={{ color: '#059669' }} />
                          <span>{f.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(i);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            aria-label="Remove file"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                </>
              )}
            </div>

            {/* RIGHT COLUMN: STICKY ORDER SUMMARY & PRICE COUNT */}
            <div>
              <div className="bdigi-summary-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--color-border, #e2e8f0)' }}>
                  <div style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                    Order Summary
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                    Live Quote
                  </span>
                </div>

                {/* Spec breakdown items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Service:</span>
                    <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                      {selectedService === 'embroidery' ? 'Embroidery Digitizing' : selectedService === 'patch' ? 'Custom Patches' : 'Vector Art'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>{isMonthlyMode ? 'Plan:' : selectedService === 'patch' ? 'Patch Tier:' : 'Package:'}</span>
                    <strong style={{ color: 'var(--color-text-primary, #0f172a)', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pricing.tierTitle}>
                      {pricing.tierTitle}
                    </strong>
                  </div>

                  {isMonthlyMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Designs included:</span><strong>{monthlyCount} / 30 days</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment:</span><strong>Once · No auto-renew</strong></div>
                      <span style={{ fontSize: '0.73rem', lineHeight: 1.4 }}>Submit designs via your order conversation during the month.</span>
                    </div>
                  ) : selectedService === 'patch' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Style:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{patchStyle}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Backing:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{patchBacking}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Size:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getPatchSizeLabel()}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedService === 'embroidery' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                          <span>Size:</span>
                          <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getSizeLabel()}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Format:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getFormatLabel()}</strong>
                      </div>
                    </>
                  )}

                  {!isMonthlyMode && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Turnaround:</span>
                    <strong style={{ color: selectedService !== 'patch' && (turnaround === 'rush' || vectorTurnaround === 'rush') ? '#ea580c' : '#059669' }}>
                      {selectedService === 'patch'
                        ? '10–14 days'
                        : ((turnaround === 'rush' || vectorTurnaround === 'rush') ? 'Rush (2–4h)' : 'Standard (Free)')}
                    </strong>
                  </div>}

                  {!isMonthlyMode && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Quantity:</span>
                    <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                      {selectedService === 'patch'
                        ? `${Math.max(50, Number(patchQuantity) || 50)} Patches`
                        : `${designQuantity} ${designQuantity === 1 ? 'Design' : 'Designs'}`}
                    </strong>
                  </div>}

                  {!isMonthlyMode && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Files:</span>
                    <strong style={{ color: uploadedFiles.length > 0 ? '#059669' : '#94a3b8' }}>
                      {selectedService === 'patch'
                        ? (uploadedFiles.length > 0 ? `${uploadedFiles.length} Artwork Attached` : 'Required')
                        : (uploadedFiles.length > 0 ? `${uploadedFiles.length} of ${designQuantity} Attached` : 'Required')}
                    </strong>
                  </div>}
                </div>

                {/* LIVE PRICE COUNT BREAKDOWN */}
                <div style={{ borderTop: '1px solid var(--color-border, #e2e8f0)', paddingTop: '0.75rem', marginBottom: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '0.3rem' }}>
                    <span>
                      {isMonthlyMode ? 'Monthly bundle (one-time):' : selectedService === 'patch'
                        ? `Subtotal (${pricing.patchPieces} × $${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"}):`
                        : `Subtotal (${designQuantity} × $${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"}):`}
                    </span>
                    <span>${pricing.subtotal.toFixed(2)}</span>
                  </div>

                  {!isMonthlyMode && pricing.discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#047857', fontWeight: 800, marginBottom: '0.3rem' }}>
                      <span>VIP studio saving ({pricing.discountPercent}%):</span>
                      <span>−{formatUSD(pricing.discountAmount)}</span>
                    </div>
                  )}

                  {pricing.rush > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.3rem' }}>
                      <span>Rush Fee:</span>
                      <span>+${pricing.rush.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1.5px solid var(--color-border, #e2e8f0)' }}>
                    <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                      Total Due:
                    </span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-primary, #1d4ed8)', lineHeight: 1 }}>
                      {hasValidLivePrice ? formatUSD(pricing.total) : 'Pricing unavailable'}
                    </span>
                  </div>
                </div>

                {/* CTA BUTTON */}
                <button
                  type="button"
                  disabled={isSubmitting || isUploading || !hasValidLivePrice}
                  onClick={handleFinalSubmitOrder}
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 1.25rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--color-action-bg, linear-gradient(120deg, #1d4ed8, #4338ca))',
                    color: '#ffffff',
                    fontSize: '0.96rem',
                    fontWeight: 900,
                    cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 7px 21px rgba(29, 78, 216, 0.28)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> {hasValidLivePrice ? (isMonthlyMode ? 'Buy 30-Day Bundle (' : 'Place Order & Pay (') + formatUSD(pricing.total) + ')' : 'Pricing unavailable'}
                    </>
                  )}
                </button>

                {/* TRUST BADGES STRIP */}
                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={13} style={{ color: '#059669' }} /> Secure Checkout • Free Revisions
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ON-SCREEN VALIDATION ALERT POPUP MODAL */}
      {validationAlert && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setValidationAlert(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1.5px solid #334155' : '1.5px solid #fecaca',
              borderRadius: '16px',
              padding: '1.75rem 1.5rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(239, 68, 68, 0.1)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setValidationAlert(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted, #64748b)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#fee2e2',
                border: '2px solid #fca5a5',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
              }}
            >
              <AlertCircle size={28} />
            </div>

            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 900,
                margin: '0 0 0.5rem',
                color: isDark ? '#f8fafc' : '#0f172a',
                letterSpacing: '-0.01em'
              }}
            >
              {validationAlert.title}
            </h3>

            <p
              style={{
                fontSize: '0.88rem',
                color: isDark ? '#cbd5e1' : '#475569',
                lineHeight: 1.5,
                margin: '0 0 1.4rem'
              }}
            >
              {validationAlert.message}
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  const action = validationAlert.onAction;
                  setValidationAlert(null);
                  if (action) action();
                }}
                style={{
                  background: 'var(--color-action-start, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Upload size={16} />
                {validationAlert.actionText || 'Upload File Now'}
              </button>
              <button
                type="button"
                onClick={() => setValidationAlert(null)}
                style={{
                  background: isDark ? '#334155' : '#f1f5f9',
                  color: isDark ? '#f8fafc' : '#475569',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamlinedOrderFlow;
