'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { getAvailableTiers, getServiceStartingPrice, calculatePackageQuote, formatUSD } from '../../utils/livePricing';
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
  const incomingPackage = initialPackage || _initialPackage;

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

  const currentTier = currentServiceTiers.find(t =>
    (t.id && String(t.id) === String(selectedTierId)) ||
    (t.title && t.title.toLowerCase() === String(selectedTierId).toLowerCase())
  ) || (selectedTierId ? null : currentServiceTiers[0] || null);

  // 1. EMBROIDERY FIELDS
  const [fileFormat, setFileFormat] = useState('all');
  const [sizeOption, setSizeOption] = useState('left-chest');
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('3.5');
  const [turnaround, setTurnaround] = useState('standard'); // standard (free), rush (+$10)

  // 2. PATCH FIELDS
  const [patchStyle, setPatchStyle] = useState('Embroidered Twill');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const [patchTurnaround, setPatchTurnaround] = useState('standard'); // standard (free), rush (+$25)

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to select service and proceed to order customization
  const handleSelectService = (serviceKey) => {
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
        if (draft.designQuantity) setDesignQuantity(Math.max(1, Number(draft.designQuantity) || 1));
        if (draft.patchQuantity) setPatchQuantity(Math.max(50, Number(draft.patchQuantity) || 50));
        if (draft.turnaround) setTurnaround(draft.turnaround);
        if (draft.patchTurnaround) setPatchTurnaround(draft.patchTurnaround);
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
        designQuantity,
        patchQuantity: Math.max(50, Number(patchQuantity) || 50),
        turnaround,
        patchTurnaround,
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

  // Active administrator-configured Supabase prices only.
  const calculatePricing = () => {
    const safePatchQty = Math.max(50, parseInt(patchQuantity, 10) || 50);
    const quantity = selectedService === 'patch' ? safePatchQty : Math.max(1, Number(designQuantity) || 1);
    const isRush = selectedService === 'patch' ? patchTurnaround === 'rush'
      : selectedService === 'vector' ? vectorTurnaround === 'rush' : turnaround === 'rush';
    return calculatePackageQuote({ tier: currentTier, service: selectedService, quantity, isRush });
  };
  const pricing = calculatePricing() || { unitPrice: 0, subtotal: 0, rush: 0, total: 0, quantity: 0, patchPieces: 0, tierTitle: '' };
  const hasValidLivePrice = Boolean(currentTier?.id && pricing.total > 0);
  // Helper Labels for Summary
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
    if (!hasValidLivePrice) {
      setValidationAlert({ title: 'Pricing Unavailable', message: 'Choose a currently published package before ordering.', actionText: 'Review Packages', onAction: () => {} });
      return;
    }
    // 1. Validate required design file upload
    if (uploadedFiles.length === 0) {
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
    if (selectedService === 'embroidery' && sizeOption === 'custom') {
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

      const orderPackageName = currentTier?.title || 'Standard';
      let derivedTitle = `${firstFileName} - ${orderPackageName}`;
      let isRush = false;
      let targetFormats = ['DST', 'PES', 'EMB', 'PDF'];
      let derivedSize = 'Left Chest (Up to 4")';

      if (selectedService === 'embroidery') {
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
        isRush = patchTurnaround === 'rush';
        derivedSize = `${patchStyle} (${patchBacking})`;
        targetFormats = ['DST', 'PDF Proof Sheet', 'Physical Courier Delivery'];
      } else if (selectedService === 'vector') {
        isRush = vectorTurnaround === 'rush';
        derivedSize = 'Scalable Vector';
        targetFormats = vectorFormat === 'ai' ? ['AI'] : vectorFormat === 'svg' ? ['SVG'] : ['AI', 'EPS', 'SVG', 'PDF', 'PNG'];
      }

      const primaryArtworkUrl = uploadedFiles[0]?.url || null;
      if (!primaryArtworkUrl || primaryArtworkUrl.startsWith('blob:')) throw new Error('Artwork upload is incomplete. Please upload your design again.');

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        source: 'direct_order_desk',
        package_id: currentTier.id,
        unit_price: pricing.unitPrice,
        rush_fee: pricing.rush,
        package_name: orderPackageName,
        package_tier: orderPackageName,
        quantity: pricing.quantity,
        patchQuantity: selectedService === 'patch' ? pricing.patchPieces : undefined,
        price: pricing.total,
        totalPrice: pricing.total,
        base_price: pricing.subtotal,
        isRush: isRush,
        notes: additionalDetails.trim(),
        placement: derivedSize,
        width: sizeOption === 'custom' ? customWidth : '3.5',
        height: sizeOption === 'custom' ? customHeight : '3.5',
        fabricType: selectedService === 'embroidery' ? additionalDetails.trim() || 'Standard' : null,
        patchStyle: selectedService === 'patch' ? patchStyle : null,
        patchBacking: selectedService === 'patch' ? patchBacking : null,
        targetFormats: targetFormats,
        image_url: primaryArtworkUrl,
        artworkUrl: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        uploadedFiles: uploadedFiles,
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
        .bdigi-order-container {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.75rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .bdigi-order-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        /* Top Service Navigation & Switcher */
        .bdigi-service-nav-bar {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1.15rem;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          flex-wrap: wrap;
        }
        .bdigi-change-service-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.52rem 1.05rem;
          border-radius: 9999px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-subtle, #f8fafc);
          color: var(--color-text-secondary, #475569);
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .bdigi-change-service-btn:hover {
          background: var(--color-surface, #ffffff);
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateX(-2px);
        }
        .bdigi-service-segmented-tabs {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: ${isDark ? '#0f172a' : '#f1f5f9'};
          padding: 4px;
          border-radius: 9999px;
          border: 1px solid var(--color-border, #e2e8f0);
        }
        .bdigi-segment-tab {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.46rem 1.05rem;
          border-radius: 9999px;
          border: 1.5px solid transparent;
          background: transparent;
          color: var(--color-text-secondary, #64748b);
          font-weight: 800;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .bdigi-segment-tab:hover {
          color: var(--color-text-primary, #0f172a);
        }
        .bdigi-segment-tab.active-embroidery {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          color: #ea580c;
          border-color: #fed7aa;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.15);
        }
        .bdigi-segment-tab.active-patch {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          color: #0284c7;
          border-color: #bae6fd;
          box-shadow: 0 2px 8px rgba(2, 132, 199, 0.15);
        }
        .bdigi-segment-tab.active-vector {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          color: #7c3aed;
          border-color: #ddd6fe;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
        }
        @media (max-width: 768px) {
          .bdigi-service-nav-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
          }
          .bdigi-change-service-btn {
            align-self: flex-start;
          }
          .bdigi-service-segmented-tabs {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 3px;
            padding: 3px;
            border-radius: 12px;
          }
          .bdigi-segment-tab {
            padding: 0.55rem 0.25rem;
            font-size: 0.72rem;
            justify-content: center;
            border-radius: 9px;
            text-align: center;
          }
          .bdigi-segment-tab .tab-tag {
            display: none;
          }
        }

        /* VIP Card Section Architecture */
        .bdigi-section-card {
          background: ${isDark ? '#1e293b' : '#ffffff'};
          border: 1.5px solid var(--color-border, #e2e8f0);
          border-radius: 18px;
          padding: 1.35rem 1.4rem;
          margin-bottom: 1.25rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          transition: all 0.2s ease;
        }
        .bdigi-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.15rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--color-border, #f1f5f9);
        }
        .bdigi-step-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--color-primary-light, #fff7ed);
          color: var(--color-primary, #ea580c);
          font-weight: 900;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          justifyContent: center;
          flex-shrink: 0;
          border: 1px solid #fed7aa;
        }
        .bdigi-section-title {
          font-size: 0.98rem;
          font-weight: 800;
          color: var(--color-text-primary, #0f172a);
          margin: 0;
          line-height: 1.2;
        }
        .bdigi-section-subtitle {
          font-size: 0.76rem;
          color: var(--color-text-muted, #64748b);
          margin: 2px 0 0;
        }
        .bdigi-field-group {
          margin-bottom: 1.15rem;
        }
        .bdigi-field-group:last-child {
          margin-bottom: 0;
        }
        .bdigi-field-label {
          display: block;
          font-size: 0.86rem;
          font-weight: 800;
          color: var(--color-text-primary, #0f172a);
          margin-bottom: 0.4rem;
          letter-spacing: -0.01em;
        }
        .bdigi-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.15rem;
        }
        @media (max-width: 600px) {
          .bdigi-grid-2col {
            grid-template-columns: 1fr;
            gap: 0.9rem;
          }
          .bdigi-section-card {
            padding: 1.1rem 1rem;
          }
        }

        .bdigi-select-wrapper {
          position: relative;
          width: 100%;
        }
        .bdigi-select {
          width: 100%;
          height: 44px;
          padding: 0 2.5rem 0 0.95rem;
          border-radius: 12px;
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
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
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
          padding: 0.75rem 0.95rem;
          border-radius: 12px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          resize: vertical;
          min-height: 72px;
          transition: all 0.18s ease;
        }
        .bdigi-textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
        }
        .bdigi-input {
          width: 100%;
          height: 44px;
          padding: 0 0.95rem;
          border-radius: 12px;
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
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
        }
        .bdigi-summary-card {
          position: sticky;
          top: 1.5rem;
          background: ${isDark ? '#1e293b' : '#f8fafc'};
          border: 1.5px solid var(--color-border, #e2e8f0);
          border-radius: 18px;
          padding: 1.4rem;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
          box-sizing: border-box;
        }
      `}</style>

      {/* STEP 1: SERVICE SELECTION SCREEN (SHOWN WHEN STARTING ORDER) */}
      {!hasSelectedService ? (
        <div style={{ padding: '0.25rem 0 0.5rem' }}>
          {/* Clean Minimal Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{
              fontSize: 'clamp(1.35rem, 2.5vw, 1.75rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              lineHeight: 1.25,
              margin: '0 0 0.3rem',
              color: 'var(--color-text-primary, #0f172a)'
            }}>
              Select a Service
            </h2>

            <p style={{
              fontSize: '0.86rem',
              color: 'var(--color-text-muted, #64748b)',
              maxWidth: '460px',
              margin: '0 auto',
              lineHeight: 1.4
            }}>
              Choose the service you need to start placing your order.
            </p>
          </div>

          {/* 3 Clean Compact Service Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              alignItems: 'stretch'
            }}
          >
            {/* Card 1: Embroidery Digitizing */}
            <div
              onClick={() => handleSelectService('embroidery')}
              style={{
                borderRadius: '16px',
                border: '1.5px solid var(--color-border, #e2e8f0)',
                background: isDark ? '#1e293b' : '#ffffff',
                padding: '1.4rem 1.15rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(37, 99, 235, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: 'var(--color-primary-light)',
                    border: '1.5px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)',
                    margin: '0 auto 0.85rem'
                  }}
                >
                  <Zap size={26} />
                </div>

                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, margin: '0 0 0.3rem', color: 'var(--color-text-primary, #0f172a)' }}>
                  Embroidery Digitizing
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                  DST, PES, EMB stitch files for machines
                </p>
              </div>

              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>From </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--color-primary)' }}>{formatUSD(startingPrices.embroidery)}</span>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.62rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--color-action-start, #2563eb)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Select <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 2: Vector Art */}
            <div
              onClick={() => handleSelectService('vector')}
              style={{
                borderRadius: '16px',
                border: '1.5px solid var(--color-border, #e2e8f0)',
                background: isDark ? '#1e293b' : '#ffffff',
                padding: '1.4rem 1.15rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(124, 58, 237, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#faf5ff',
                    border: '1.5px solid #e9d5ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7c3aed',
                    margin: '0 auto 0.85rem'
                  }}
                >
                  <Palette size={26} />
                </div>

                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, margin: '0 0 0.3rem', color: 'var(--color-text-primary, #0f172a)' }}>
                  Vector Art
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                  AI, EPS, SVG vector redraws for print & cut
                </p>
              </div>

              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>From </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#7c3aed' }}>{formatUSD(startingPrices.vector)}</span>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.62rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#7c3aed',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Select <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Card 3: Custom Patches */}
            <div
              onClick={() => handleSelectService('patch')}
              style={{
                borderRadius: '16px',
                border: '1.5px solid var(--color-border, #e2e8f0)',
                background: isDark ? '#1e293b' : '#ffffff',
                padding: '1.4rem 1.15rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0284c7';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(2, 132, 199, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: '#f0f9ff',
                    border: '1.5px solid #bae6fd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284c7',
                    margin: '0 auto 0.85rem'
                  }}
                >
                  <Award size={26} />
                </div>

                <h3 style={{ fontSize: '1.12rem', fontWeight: 900, margin: '0 0 0.3rem', color: 'var(--color-text-primary, #0f172a)' }}>
                  Custom Patches
                </h3>

                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                  Physical embroidered & PVC patches (Min 50 pcs)
                </p>
              </div>

              <div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>From </span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>{formatUSD(startingPrices.patch)}{startingPrices.patch !== null && <span style={{ fontSize: '0.76rem', fontWeight: 600 }}>/pc</span>}</span>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.62rem 1rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Select <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: ORDER CUSTOMIZATION DESK (SHOWN ONCE SERVICE IS SELECTED) */
        <div>
          {/* TOP BAR: CHANGE SERVICE BUTTON & SERVICE SWITCHER */}
          <div className="bdigi-service-nav-bar">
            {/* Left: Change Service Back Button */}
            <button
              type="button"
              onClick={() => setHasSelectedService(false)}
              className="bdigi-change-service-btn"
              title="Return to service selection"
            >
              <ArrowLeft size={14} />
              <span>Change Service</span>
            </button>

            {/* Right: Quick Service Tabs */}
            <div className="bdigi-service-segmented-tabs">
              <button
                type="button"
                onClick={() => {
                  setSelectedService('embroidery');
                  setSelectedTierId('');
                }}
                className={`bdigi-segment-tab ${selectedService === 'embroidery' ? 'active-embroidery' : ''}`}
              >
                <Zap size={14} />
                <span>Embroidery Digitizing</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedService('patch');
                  setSelectedTierId('');
                }}
                className={`bdigi-segment-tab ${selectedService === 'patch' ? 'active-patch' : ''}`}
              >
                <Award size={14} />
                <span>Custom Patches <span className="tab-tag">(Min 50)</span></span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedService('vector');
                  setSelectedTierId('');
                }}
                className={`bdigi-segment-tab ${selectedService === 'vector' ? 'active-vector' : ''}`}
              >
                <Palette size={14} />
                <span>Vector Art</span>
              </button>
            </div>
          </div>

          {!getActiveTiers(selectedService).length && <p role="status" style={{ color: 'var(--color-warning-text)', fontWeight: 700, padding: '0.75rem' }}>Pricing is temporarily unavailable. Please try again later.</p>}
          {/* 2-COLUMN ORDER DESK: LEFT OPTIONS & UPLOAD VS RIGHT STICKY PRICE & QUANTITY */}
          <div className="bdigi-order-container">

            {/* LEFT COLUMN: CUSTOMER INSTRUCTIONS & OPTIONS */}
            <div>

              {/* 1. EMBROIDERY OPTIONS */}
              {selectedService === 'embroidery' && (
                <>
                  {/* CARD 1: DESIGN SPECIFICATIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">1</div>
                      <div>
                        <h3 className="bdigi-section-title">Design Specifications</h3>
                        <p className="bdigi-section-subtitle">Select package tier, stitch format, and placement dimensions</p>
                      </div>
                    </div>

                    {/* Package Tier Dropdown (Live from Admin Dynamic Pricing Tiers) */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Package Tier</label>
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

                    {/* 2-Column Grid: File Format & Size */}
                    <div className="bdigi-grid-2col">
                      {/* File Format Dropdown */}
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">File Format</label>
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
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">Placement / Size</label>
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
                    </div>

                    {/* Turnaround Dropdown */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Turnaround Speed</label>
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
                  </div>

                  {/* CARD 2: QUANTITY & INSTRUCTIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">2</div>
                      <div>
                        <h3 className="bdigi-section-title">Quantity & Special Instructions</h3>
                        <p className="bdigi-section-subtitle">Specify how many designs you need digitised and any custom notes</p>
                      </div>
                    </div>

                    {/* NUMBER OF DESIGNS */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Number of Designs</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1.5px solid var(--color-border, #cbd5e1)',
                            borderRadius: '12px',
                            background: 'var(--color-surface, #ffffff)',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setDesignQuantity(Math.max(1, designQuantity - 1))}
                            disabled={designQuantity <= 1}
                            style={{
                              width: '42px',
                              height: '42px',
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
                            <Minus size={15} />
                          </button>
                          <span style={{ width: '42px', textAlign: 'center', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                            {designQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDesignQuantity(designQuantity + 1)}
                            style={{
                              width: '42px',
                              height: '42px',
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
                            <Plus size={15} />
                          </button>
                        </div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                          ${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"} each design
                        </span>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Production Notes / Fabric Details (Optional)</label>
                      <textarea
                        rows={2}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Fabric type, garment placement, thread colors, or specific instructions..."
                        className="bdigi-textarea"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 2. CUSTOM PATCHES OPTIONS */}
              {selectedService === 'patch' && (
                <>
                  {/* CARD 1: PATCH SPECIFICATIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">1</div>
                      <div>
                        <h3 className="bdigi-section-title">Patch Specifications</h3>
                        <p className="bdigi-section-subtitle">Choose quality tier, patch production style, and backing</p>
                      </div>
                    </div>

                    {/* Package Tier / Quality Tier (Live from Admin Dynamic Pricing Tiers) */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Patch Tier</label>
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

                    {/* 2-Column Grid: Style & Backing */}
                    <div className="bdigi-grid-2col">
                      {/* Patch Style */}
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">Patch Style</label>
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
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">Backing Option</label>
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
                    </div>

                    {/* Turnaround */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Turnaround Speed</label>
                      <div className="bdigi-select-wrapper">
                        <select
                          value={patchTurnaround}
                          onChange={(e) => setPatchTurnaround(e.target.value)}
                          className="bdigi-select"
                        >
                          <option value="standard">Standard (5–7 Days Production) — Free</option>
                          <option value="rush">Rush Express (3–4 Days Production) — +$25</option>
                        </select>
                        <div className="bdigi-select-arrow">
                          <ChevronDown size={17} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: QUANTITY & INSTRUCTIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">2</div>
                      <div>
                        <h3 className="bdigi-section-title">Quantity & Specifications</h3>
                        <p className="bdigi-section-subtitle">Select your production quantity (minimum 50 pieces) and details</p>
                      </div>
                    </div>

                    {/* QUANTITY OF PATCHES (DEFAULT 50, MINIMUM 50 STRICTLY ENFORCED) */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Patch Quantity</label>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              border: '1.5px solid var(--color-border, #cbd5e1)',
                              borderRadius: '12px',
                              background: 'var(--color-surface, #ffffff)',
                              overflow: 'hidden'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setPatchQuantity(prev => Math.max(50, (parseInt(prev, 10) || 50) - 10))}
                              disabled={Number(patchQuantity) <= 50}
                              style={{
                                width: '42px',
                                height: '42px',
                                background: 'none',
                                border: 'none',
                                color: Number(patchQuantity) <= 50 ? '#94a3b8' : 'var(--color-text-primary, #0f172a)',
                                cursor: Number(patchQuantity) <= 50 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: Number(patchQuantity) <= 50 ? 0.45 : 1
                              }}
                              aria-label="Decrease patch quantity"
                              title={Number(patchQuantity) <= 50 ? "Minimum 50 patches required" : "Decrease by 10"}
                            >
                              <Minus size={15} />
                            </button>
                            <input
                              type="number"
                              min="50"
                              step="10"
                              value={patchQuantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                  setPatchQuantity('');
                                } else {
                                  const num = parseInt(val, 10);
                                  setPatchQuantity(isNaN(num) ? 50 : Math.max(1, num));
                                }
                              }}
                              onBlur={() => {
                                const num = parseInt(patchQuantity, 10);
                                if (isNaN(num) || num < 50) {
                                  setPatchQuantity(50);
                                } else {
                                  setPatchQuantity(num);
                                }
                              }}
                              className="bdigi-input"
                              style={{
                                width: '75px',
                                height: '42px',
                                textAlign: 'center',
                                border: 'none',
                                borderRadius: 0,
                                fontWeight: 900,
                                fontSize: '1rem',
                                padding: '0 0.25rem'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setPatchQuantity(prev => (parseInt(prev, 10) || 50) + 10)}
                              style={{
                                width: '42px',
                                height: '42px',
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-primary, #0f172a)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              aria-label="Increase patch quantity"
                              title="Increase by 10"
                            >
                              <Plus size={15} />
                            </button>
                          </div>

                          {/* Quick Batch Chips */}
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {[50, 100, 200, 250, 500, 1000].map(tierQty => {
                              const isSelected = Number(patchQuantity) === tierQty;
                              return (
                                <button
                                  key={tierQty}
                                  type="button"
                                  onClick={() => setPatchQuantity(tierQty)}
                                  style={{
                                    padding: '0.35rem 0.7rem',
                                    borderRadius: '10px',
                                    border: isSelected ? '1.5px solid #0284c7' : '1px solid var(--color-border, #cbd5e1)',
                                    background: isSelected ? '#0284c7' : 'var(--color-subtle, #f8fafc)',
                                    color: isSelected ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {tierQty} pcs
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                          ✦ Minimum batch: 50 pieces • Rate: ${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"} / patch
                        </div>
                      </div>
                    </div>

                    {/* Patch Additional Details */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Notes & Custom Dimensions (Optional)</label>
                      <textarea
                        rows={2}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Custom dimensions (e.g. 3&quot; round), border style (merrowed vs laser cut), thread colors, special instructions..."
                        className="bdigi-textarea"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 3. VECTOR ART OPTIONS */}
              {selectedService === 'vector' && (
                <>
                  {/* CARD 1: VECTOR SPECIFICATIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">1</div>
                      <div>
                        <h3 className="bdigi-section-title">Vector Specifications</h3>
                        <p className="bdigi-section-subtitle">Select package tier, output vector format, and turnaround</p>
                      </div>
                    </div>

                    {/* Package Tier Dropdown (Live from Admin Dynamic Pricing Tiers) */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Package Tier</label>
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

                    {/* 2-Column Grid: Format & Turnaround */}
                    <div className="bdigi-grid-2col">
                      {/* Vector Formats */}
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">File Format</label>
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
                      <div className="bdigi-field-group">
                        <label className="bdigi-field-label">Turnaround Speed</label>
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
                    </div>
                  </div>

                  {/* CARD 2: QUANTITY & INSTRUCTIONS */}
                  <div className="bdigi-section-card">
                    <div className="bdigi-section-header">
                      <div className="bdigi-step-badge">2</div>
                      <div>
                        <h3 className="bdigi-section-title">Quantity & Special Instructions</h3>
                        <p className="bdigi-section-subtitle">Specify number of designs and vector redrawing notes</p>
                      </div>
                    </div>

                    {/* NUMBER OF DESIGNS */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Number of Designs</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1.5px solid var(--color-border, #cbd5e1)',
                            borderRadius: '12px',
                            background: 'var(--color-surface, #ffffff)',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setDesignQuantity(Math.max(1, designQuantity - 1))}
                            disabled={designQuantity <= 1}
                            style={{
                              width: '42px',
                              height: '42px',
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
                            <Minus size={15} />
                          </button>
                          <span style={{ width: '42px', textAlign: 'center', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                            {designQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDesignQuantity(designQuantity + 1)}
                            style={{
                              width: '42px',
                              height: '42px',
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
                            <Plus size={15} />
                          </button>
                        </div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                          ${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"} each design
                        </span>
                      </div>
                    </div>

                    {/* Vector Details */}
                    <div className="bdigi-field-group">
                      <label className="bdigi-field-label">Production Notes / Color Requirements (Optional)</label>
                      <textarea
                        rows={2}
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Colors, fonts, or vector notes..."
                        className="bdigi-textarea"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CARD 3: UPLOAD ARTWORK FILES */}
              <div
                ref={uploadSectionRef}
                className="bdigi-section-card"
                style={{
                  borderColor: isUploadHighlighted ? '#ef4444' : undefined,
                  boxShadow: isUploadHighlighted ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : undefined
                }}
              >
                <div className="bdigi-section-header">
                  <div className="bdigi-step-badge">3</div>
                  <div>
                    <h3 className="bdigi-section-title">
                      {selectedService === 'patch' ? 'Upload Patch Artwork or Logo' : 'Upload Files'}
                      <span style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>
                    </h3>
                    <p className="bdigi-section-subtitle">
                      {selectedService === 'patch'
                        ? '1 artwork file required for patch proof (Attach your logo or design for production proofing)'
                        : `Upload ${designQuantity} ${designQuantity === 1 ? 'file' : 'files'} (JPG, PNG, PDF, AI, DST, max 50MB)`}
                    </p>
                  </div>
                </div>

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
                          ? '2px dashed #ea580c'
                          : '1.5px dashed var(--color-border, #cbd5e1)',
                      borderRadius: '12px',
                      background: isUploadHighlighted
                        ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                        : isDragOver
                          ? (isDark ? 'rgba(37, 99, 235, 0.12)' : '#fff7ed')
                          : (isDark ? '#1e293b' : '#f8fafc'),
                      boxShadow: isUploadHighlighted
                        ? '0 0 0 4px rgba(239, 68, 68, 0.22), 0 4px 14px rgba(239, 68, 68, 0.16)'
                        : 'none',
                      padding: '1.1rem 1.25rem',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: isUploadHighlighted ? '#fee2e2' : selectedService === 'patch' ? '#f0f9ff' : '#fff7ed',
                          color: isUploadHighlighted ? '#dc2626' : selectedService === 'patch' ? '#0284c7' : '#ea580c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Upload size={20} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: isUploadHighlighted ? '#dc2626' : 'var(--color-text-primary, #0f172a)'
                        }}>
                          {selectedService === 'patch'
                            ? 'Upload Patch Artwork or Logo'
                            : `Upload ${designQuantity} ${designQuantity === 1 ? 'Design File' : 'Design Files'}`}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                          {selectedService === 'patch'
                            ? 'Attach your logo or design for proofing (Max 50MB)'
                            : 'JPG, PNG, PDF, AI, DST (Max 50MB)'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: isUploadHighlighted ? '#dc2626' : selectedService === 'patch' ? '#0284c7' : '#ea580c',
                        background: isUploadHighlighted ? '#fee2e2' : selectedService === 'patch' ? '#f0f9ff' : '#fff7ed',
                        border: isUploadHighlighted ? '1px solid #fca5a5' : selectedService === 'patch' ? '1px solid #bae6fd' : '1px solid #fed7aa',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Browse
                    </span>
                  </div>

                  {/* Upload Counter & Guidance */}
                  <div style={{ marginTop: '0.45rem', fontSize: '0.78rem' }}>
                    <span style={{ color: uploadedFiles.length > 0 ? '#059669' : 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                      {selectedService === 'patch'
                        ? (uploadedFiles.length === 0
                            ? '0 files attached (1 artwork file required for patch proof)'
                            : `✓ ${uploadedFiles.length} file attached (Ready for production proof)`)
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
                        gap: '0.45rem',
                        color: '#b91c1c',
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        borderRadius: '10px',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        marginTop: '0.65rem',
                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
                        animation: 'bdigiErrorShake 0.4s ease-in-out'
                      }}
                    >
                      <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <span>{uploadError || (selectedService === 'patch' ? 'Please choose or upload your patch artwork to proceed.' : 'Please choose or upload your design file to proceed.')}</span>
                    </div>
                  )}

                  {isUploading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700 }}>
                      <Loader2 size={15} className="animate-spin" /> Uploading file...
                    </div>
                  )}

                  {/* Uploaded File Pills */}
                  {uploadedFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.65rem' }}>
                      {uploadedFiles.map((f, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: '#ecfdf5',
                            color: '#065f46',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #a7f3d0'
                          }}
                        >
                          <Check size={14} style={{ color: '#059669' }} />
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
                              alignItems: 'center',
                              marginLeft: '2px'
                            }}
                            aria-label="Remove file"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
                    <span>{selectedService === 'patch' ? 'Patch Tier:' : 'Package:'}</span>
                    <strong style={{ color: 'var(--color-text-primary, #0f172a)', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pricing.tierTitle}>
                      {pricing.tierTitle}
                    </strong>
                  </div>

                  {selectedService === 'patch' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Style:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{patchStyle}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                        <span>Backing:</span>
                        <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{patchBacking}</strong>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Turnaround:</span>
                    <strong style={{ color: (turnaround === 'rush' || patchTurnaround === 'rush' || vectorTurnaround === 'rush') ? '#ea580c' : '#059669' }}>
                      {selectedService === 'patch'
                        ? (patchTurnaround === 'rush' ? 'Rush (3–4 Days)' : 'Standard (5–7 Days)')
                        : ((turnaround === 'rush' || vectorTurnaround === 'rush') ? 'Rush (2–4h)' : 'Standard (Free)')}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Quantity:</span>
                    <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                      {selectedService === 'patch'
                        ? `${Math.max(50, Number(patchQuantity) || 50)} Patches`
                        : `${designQuantity} ${designQuantity === 1 ? 'Design' : 'Designs'}`}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                    <span>Files:</span>
                    <strong style={{ color: uploadedFiles.length > 0 ? '#059669' : '#94a3b8' }}>
                      {selectedService === 'patch'
                        ? (uploadedFiles.length > 0 ? `${uploadedFiles.length} Artwork Attached` : 'Required')
                        : (uploadedFiles.length > 0 ? `${uploadedFiles.length} of ${designQuantity} Attached` : 'Required')}
                    </strong>
                  </div>
                </div>

                {/* LIVE PRICE COUNT BREAKDOWN */}
                <div style={{ borderTop: '1px solid var(--color-border, #e2e8f0)', paddingTop: '0.75rem', marginBottom: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '0.3rem' }}>
                    <span>
                      {selectedService === 'patch'
                        ? `Subtotal (${pricing.patchPieces} × $${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"}):`
                        : `Subtotal (${designQuantity} × $${hasValidLivePrice ? pricing.unitPrice.toFixed(2) : "—"}):`}
                    </span>
                    <span>${pricing.subtotal.toFixed(2)}</span>
                  </div>

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
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: selectedService === 'patch' ? '#0284c7' : '#ea580c', lineHeight: 1 }}>
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
                    background: selectedService === 'patch'
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : selectedService === 'vector'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    color: '#ffffff',
                    fontSize: '0.96rem',
                    fontWeight: 900,
                    cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Lock size={15} /> {hasValidLivePrice ? 'Place Order & Pay (' + formatUSD(pricing.total) + ')' : 'Pricing unavailable'}
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
