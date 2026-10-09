'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { matchCategory } from '../../utils/categoryUtils';
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
  X
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

// Default Canonical Packages matching DynamicPricingEditor & Website Pricing Page
const CANONICAL_DEFAULT_PACKAGES = {
  embroidery: [
    {
      id: 'emb-left-chest',
      service_type: 'embroidery',
      display_order: 1,
      title: 'Left Chest & Cap Small Logo',
      price: 10.00,
      turnaround_time: '4–12 Hours'
    },
    {
      id: 'emb-mid-size',
      service_type: 'embroidery',
      display_order: 2,
      title: 'Mid-Size Jacket & Sleeve Design',
      price: 20.00,
      turnaround_time: '6–12 Hours'
    },
    {
      id: 'emb-full-back',
      service_type: 'embroidery',
      display_order: 3,
      title: 'Full Back & 3D Puff Foam',
      price: 35.00,
      turnaround_time: '8–12 Hours'
    }
  ],
  vector: [
    {
      id: 'vec-simple',
      service_type: 'vector_art',
      display_order: 1,
      title: 'Simple Logo & Typography Redraw',
      price: 15.00,
      turnaround_time: '6–12 Hours'
    },
    {
      id: 'vec-medium',
      service_type: 'vector_art',
      display_order: 2,
      title: 'Medium Detail Artwork with Colors',
      price: 25.00,
      turnaround_time: '6–12 Hours'
    },
    {
      id: 'vec-complex',
      service_type: 'vector_art',
      display_order: 3,
      title: 'Complex Illustration & Mascot',
      price: 45.00,
      turnaround_time: '12–24 Hours'
    }
  ],
  patch: [
    {
      id: 'pat-50',
      service_type: 'patches',
      display_order: 1,
      title: 'Sample Batch (50 Pcs)',
      min_pieces: 50,
      price: 3.50,
      turnaround_time: '3–5 Days'
    },
    {
      id: 'pat-100',
      service_type: 'patches',
      display_order: 2,
      title: 'Production Batch (100 Pcs)',
      min_pieces: 100,
      price: 2.50,
      turnaround_time: '4–7 Days'
    },
    {
      id: 'pat-250',
      service_type: 'patches',
      display_order: 3,
      title: 'Wholesale Batch (250 Pcs)',
      min_pieces: 250,
      price: 1.80,
      turnaround_time: '5–8 Days'
    },
    {
      id: 'pat-500',
      service_type: 'patches',
      display_order: 4,
      title: 'Factory Bulk (500 Pcs)',
      min_pieces: 500,
      price: 1.50,
      turnaround_time: '7–10 Days'
    }
  ]
};

export const StreamlinedOrderFlow = ({
  initialService = 'embroidery',
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

  // Service switcher: 'embroidery' | 'patch' | 'vector'
  const [selectedService, setSelectedService] = useState(() => {
    const norm = String(initialService || '').toLowerCase();
    if (norm.includes('patch')) return 'patch';
    if (norm.includes('vector')) return 'vector';
    return 'embroidery';
  });

  // Dynamic Tiers for the selected service (Editable from Admin Dynamic Pricing Editor)
  const getActiveTiers = (serviceKey) => {
    const dbTiers = (dynamicPricingTiers || [])
      .filter(t => matchCategory(t?.service_type, serviceKey))
      .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0));

    if (dbTiers && dbTiers.length > 0) {
      return dbTiers;
    }
    return CANONICAL_DEFAULT_PACKAGES[serviceKey] || [];
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
  ) || currentServiceTiers[0] || null;

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

  // Universal fields
  const [quantity, setQuantity] = useState(1);
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

  // Restore pending order draft if returning from auth (e.g. Google Login redirect)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawDraft = localStorage.getItem('bdigi_pending_order_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft.selectedService) setSelectedService(draft.selectedService);
        if (draft.selectedTierId) setSelectedTierId(draft.selectedTierId);
        if (draft.quantity) setQuantity(Number(draft.quantity) || 1);
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
        selectedService,
        selectedTierId: currentTier?.id || currentTier?.title,
        quantity,
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

  // Live Price Calculation derived directly from dynamic active tier
  const calculatePricing = () => {
    const unitBase = Number(currentTier?.price) || 15;
    let rushFee = 0;
    const orderQty = Math.max(1, quantity);

    if (selectedService === 'embroidery') {
      if (turnaround === 'rush') rushFee = 10;
      return {
        unitPrice: unitBase,
        subtotal: unitBase * orderQty,
        rush: rushFee,
        total: (unitBase * orderQty) + rushFee,
        tierTitle: currentTier?.title || 'Left Chest & Cap Small Logo'
      };
    }

    if (selectedService === 'patch') {
      let pieces = Number(currentTier?.min_pieces);
      if (!pieces) {
        const matchDigits = String(currentTier?.title || '').match(/\b(\d+)\b/);
        pieces = matchDigits ? Number(matchDigits[1]) : 100;
      }
      if (patchTurnaround === 'rush') rushFee = 25;
      const patchSubtotal = unitBase * pieces;
      return {
        unitPrice: unitBase,
        subtotal: patchSubtotal,
        rush: rushFee,
        total: patchSubtotal + rushFee,
        patchPieces: pieces,
        tierTitle: currentTier?.title || `${pieces} Pieces`
      };
    }

    if (selectedService === 'vector') {
      if (vectorTurnaround === 'rush') rushFee = 10;
      return {
        unitPrice: unitBase,
        subtotal: unitBase * orderQty,
        rush: rushFee,
        total: (unitBase * orderQty) + rushFee,
        tierTitle: currentTier?.title || 'Simple Logo & Typography Redraw'
      };
    }

    return { unitPrice: 15, subtotal: 15, rush: 0, total: 15, tierTitle: 'Standard' };
  };

  const pricing = calculatePricing();

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
        if (showToast) {
          showToast(`⚠️ ${errorMsg}`, 'error', true);
        }
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
          const localUrl = URL.createObjectURL(file);
          uploadedList.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: localUrl,
            format: file.name.split('.').pop()
          });
        }
      } catch (err) {
        console.warn('Upload fallback applied for:', file.name, err);
        const localUrl = URL.createObjectURL(file);
        uploadedList.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: localUrl,
          format: file.name.split('.').pop()
        });
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
    // 1. Validate required design file upload
    if (uploadedFiles.length === 0) {
      const errorMsg = 'Please choose or upload your design file before continuing.';
      setUploadError(errorMsg);
      setIsUploadHighlighted(true);
      setValidationAlert({
        title: 'Design File Required',
        message: 'Please choose or upload your artwork or design file (JPG, PNG, PDF, AI, DST) to place your order.',
        actionText: 'Upload File Now',
        onAction: () => {
          setIsUploadHighlighted(true);
          if (uploadSectionRef.current) {
            uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          setTimeout(() => fileInputRef.current?.click(), 120);
        }
      });
      if (showToast) {
        showToast(`⚠️ ${errorMsg}`, 'error', true);
      }
      if (uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // 2. Validate custom dimensions if custom size is selected
    if (selectedService === 'embroidery' && sizeOption === 'custom') {
      const numW = parseFloat(customWidth);
      const numH = parseFloat(customHeight);
      if (!customWidth || !customHeight || isNaN(numW) || isNaN(numH) || numW <= 0 || numH <= 0) {
        setIsCustomSizeHighlighted(true);
        const errorMsg = 'Please enter valid width and height dimensions for your custom size.';
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
        if (showToast) {
          showToast(`⚠️ ${errorMsg}`, 'error', true);
        }
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
        derivedTitle = `${patchStyle} Patches (${pricing.patchPieces} Pcs)`;
        isRush = patchTurnaround === 'rush';
        derivedSize = 'Standard Patch Size';
        targetFormats = ['DST', 'PDF Proof Sheet', 'Physical Courier Delivery'];
      } else if (selectedService === 'vector') {
        isRush = vectorTurnaround === 'rush';
        derivedSize = 'Scalable Vector';
        targetFormats = vectorFormat === 'ai' ? ['AI'] : vectorFormat === 'svg' ? ['SVG'] : ['AI', 'EPS', 'SVG', 'PDF', 'PNG'];
      }

      const primaryArtworkUrl = uploadedFiles[0]?.url || null;

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        package_name: orderPackageName,
        package_tier: orderPackageName,
        quantity: selectedService === 'patch' ? pricing.patchPieces : Math.max(1, quantity),
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
      const resultingId = created?.id || `ORD_${Date.now()}`;

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
      if (showToast) {
        showToast(err?.message || 'Failed to submit order. Please retry.', 'error');
      }
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
          border-color: #ea580c;
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
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
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
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
        }
        .bdigi-summary-card {
          position: sticky;
          top: 1.5rem;
          background: ${isDark ? '#1e293b' : '#f8fafc'};
          border: 1.5px solid var(--color-border, #e2e8f0);
          border-radius: 18px;
          padding: 1.4rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
        }
      `}</style>

      {/* SERVICE SWITCHER BUTTONS TOP */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--color-border, #e2e8f0)',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedService('embroidery')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '9999px',
            border: selectedService === 'embroidery' ? '2px solid #ea580c' : '1.5px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'embroidery' ? (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : 'transparent',
            color: selectedService === 'embroidery' ? '#ea580c' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.16s ease'
          }}
        >
          Embroidery Digitizing
        </button>

        <button
          type="button"
          onClick={() => setSelectedService('patch')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '9999px',
            border: selectedService === 'patch' ? '2px solid #0284c7' : '1.5px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'patch' ? (isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff') : 'transparent',
            color: selectedService === 'patch' ? '#0284c7' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.16s ease'
          }}
        >
          Custom Patches
        </button>

        <button
          type="button"
          onClick={() => setSelectedService('vector')}
          style={{
            padding: '0.55rem 1.1rem',
            borderRadius: '9999px',
            border: selectedService === 'vector' ? '2px solid #7c3aed' : '1.5px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'vector' ? (isDark ? 'rgba(124, 58, 237, 0.15)' : '#faf5ff') : 'transparent',
            color: selectedService === 'vector' ? '#7c3aed' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.16s ease'
          }}
        >
          Vector Art
        </button>
      </div>

      {/* 2-COLUMN ORDER DESK: LEFT OPTIONS & UPLOAD VS RIGHT STICKY PRICE & QUANTITY */}
      <div className="bdigi-order-container">

        {/* LEFT COLUMN: CUSTOMER INSTRUCTIONS & OPTIONS */}
        <div>

          {/* EMBROIDERY OPTIONS */}
          {selectedService === 'embroidery' && (
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
            </div>
          )}

          {/* CUSTOM PATCHES OPTIONS */}
          {selectedService === 'patch' && (
            <div>
              {/* Package Tier / Quantity Batch (Live from Admin Dynamic Pricing Tiers) */}
              <div className="bdigi-form-row">
                <label className="bdigi-label">Quantity</label>
                <div className="bdigi-select-wrapper">
                  <select
                    value={currentTier?.id || currentTier?.title || ''}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    className="bdigi-select"
                  >
                    {currentServiceTiers.map(tier => {
                      const val = String(tier.id || tier.title);
                      const displayPrice = Number(tier.price).toFixed(2);
                      let pieces = Number(tier.min_pieces);
                      if (!pieces) {
                        const m = String(tier.title || '').match(/\b(\d+)\b/);
                        pieces = m ? Number(m[1]) : 100;
                      }
                      const totalCost = (Number(tier.price) * pieces).toFixed(2);
                      return (
                        <option key={val} value={val}>
                          {tier.title} — ${displayPrice}/pc (${totalCost} Total)
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
                    <option value="Embroidered Twill">Embroidered Twill</option>
                    <option value="Woven High-Def">Woven High-Def</option>
                    <option value="PVC Rubber 3D">PVC Rubber 3D</option>
                    <option value="Laser Leather">Leather / Engraved</option>
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
                    <option value="Velcro (Hook & Loop)">Velcro</option>
                    <option value="Heat-Seal Iron-On">Iron-On</option>
                    <option value="Plain Sew-On">Sew-On</option>
                    <option value="Peel & Stick">Peel & Stick</option>
                  </select>
                  <div className="bdigi-select-arrow">
                    <ChevronDown size={17} />
                  </div>
                </div>
              </div>

              {/* Turnaround */}
              <div className="bdigi-form-row">
                <label className="bdigi-label">Turnaround</label>
                <div className="bdigi-select-wrapper">
                  <select
                    value={patchTurnaround}
                    onChange={(e) => setPatchTurnaround(e.target.value)}
                    className="bdigi-select"
                  >
                    <option value="standard">Standard (5–7 Days) — Free</option>
                    <option value="rush">Rush (3–4 Days) — +$25</option>
                  </select>
                  <div className="bdigi-select-arrow">
                    <ChevronDown size={17} />
                  </div>
                </div>
              </div>

              {/* Patch Additional Details */}
              <div className="bdigi-form-row" style={{ alignItems: 'flex-start' }}>
                <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>Notes</label>
                <textarea
                  rows={2}
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  placeholder="Custom shape, size, border type, or notes..."
                  className="bdigi-textarea"
                />
              </div>
            </div>
          )}

          {/* VECTOR ART OPTIONS */}
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
            </div>
          )}

          {/* NUMBER OF DESIGNS (Placed BEFORE upload so customer selects count first) */}
          <div className="bdigi-form-row">
            <label className="bdigi-label">
              {selectedService === 'patch' ? 'Patch Designs' : 'Number of Designs'}
            </label>
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
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
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
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span style={{ width: '38px', textAlign: 'center', fontSize: '1rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
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
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                {selectedService === 'patch' ? `${pricing.patchPieces} patches total` : `$${pricing.unitPrice.toFixed(2)} each`}
              </span>
            </div>
          </div>

          {/* UPLOAD DESIGN FILES (Compact Drag & Drop Box) */}
          <div
            ref={uploadSectionRef}
            className="bdigi-form-row"
            style={{ alignItems: 'flex-start' }}
          >
            <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>
              Upload Files<span style={{ color: '#ef4444' }}>*</span>
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
                      ? '2px dashed #ea580c'
                      : '1.5px dashed var(--color-border, #cbd5e1)',
                  borderRadius: '10px',
                  background: isUploadHighlighted
                    ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2')
                    : isDragOver
                      ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed')
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
                  multiple
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
                      background: isUploadHighlighted ? '#fee2e2' : '#fff7ed',
                      color: isUploadHighlighted ? '#dc2626' : '#ea580c',
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
                      Upload {quantity} {quantity === 1 ? 'Design File' : 'Design Files'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                      JPG, PNG, PDF, AI, DST (Max 50MB)
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: isUploadHighlighted ? '#dc2626' : '#ea580c',
                    background: isUploadHighlighted ? '#fee2e2' : '#fff7ed',
                    border: isUploadHighlighted ? '1px solid #fca5a5' : '1px solid #fed7aa',
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
                <span style={{ color: uploadedFiles.length >= quantity ? '#059669' : 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                  {uploadedFiles.length === 0
                    ? `0 of ${quantity} files attached`
                    : uploadedFiles.length >= quantity
                      ? `✓ ${uploadedFiles.length} of ${quantity} files attached`
                      : `${uploadedFiles.length} of ${quantity} attached (please upload ${quantity - uploadedFiles.length} more)`}
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
                  <span>{uploadError || 'Please choose or upload your design file to proceed.'}</span>
                </div>
              )}

              {isUploading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', color: '#ea580c', fontSize: '0.8rem', fontWeight: 700 }}>
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
                  {selectedService === 'embroidery' ? 'Embroidery' : selectedService === 'patch' ? 'Custom Patches' : 'Vector Art'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Package:</span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)', textAlign: 'right', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={pricing.tierTitle}>
                  {pricing.tierTitle}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Size:</span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getSizeLabel()}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Format:</span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getFormatLabel()}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Turnaround:</span>
                <strong style={{ color: turnaround === 'rush' || patchTurnaround === 'rush' || vectorTurnaround === 'rush' ? '#ea580c' : '#059669' }}>
                  {turnaround === 'rush' || patchTurnaround === 'rush' || vectorTurnaround === 'rush' ? 'Rush (2–4h)' : 'Standard (Free)'}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Quantity:</span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>
                  {selectedService === 'patch' ? `${pricing.patchPieces} Pieces` : `${quantity} ${quantity === 1 ? 'Design' : 'Designs'}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary, #475569)' }}>
                <span>Files:</span>
                <strong style={{ color: uploadedFiles.length > 0 ? '#059669' : '#94a3b8' }}>
                  {uploadedFiles.length > 0 ? `${uploadedFiles.length} of ${quantity} Attached` : 'None'}
                </strong>
              </div>
            </div>

            {/* LIVE PRICE COUNT BREAKDOWN */}
            <div style={{ borderTop: '1px solid var(--color-border, #e2e8f0)', paddingTop: '0.75rem', marginBottom: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--color-text-secondary, #475569)', marginBottom: '0.3rem' }}>
                <span>Subtotal:</span>
                <span>${pricing.subtotal.toFixed(2)}</span>
              </div>

              {pricing.rush > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#ea580c', fontWeight: 700, marginBottom: '0.3rem' }}>
                  <span>Rush Fee:</span>
                  <span>+${pricing.rush.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1.5px solid var(--color-border, #e2e8f0)' }}>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  Total Due:
                </span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: selectedService === 'patch' ? '#0284c7' : '#ea580c', lineHeight: 1 }}>
                  ${pricing.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* CTA BUTTON */}
            <button
              type="button"
              disabled={isSubmitting || isUploading}
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
                    : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                fontSize: '0.96rem',
                fontWeight: 900,
                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.18s ease'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Lock size={15} /> Place Order & Pay (${pricing.total.toFixed(2)})
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
                  background: '#ea580c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
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
