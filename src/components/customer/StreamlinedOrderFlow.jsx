'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  Upload,
  Layers,
  Tag,
  PenTool,
  Check,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';

// Standard fallback packages
const DEFAULT_PACKAGES = {
  embroidery: [
    {
      id: 'emb-basic',
      service_type: 'embroidery',
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Caps, beanies, polos & shirts up to 4" x 4"',
      badge: 'MOST POPULAR',
      price: 10,
      original_price: 15,
      turnaround: '4–12 Hours',
      features: ['Up to 4" x 4" Dimensions', '100% Manual Hand Pathing', 'Cap Curved Optimization', 'Tajima .DST, Wilcom .EMB, Brother .PES + PDF']
    },
    {
      id: 'emb-popular',
      service_type: 'embroidery',
      title: 'Mid-Size Jacket & Sleeve Design',
      subtitle: 'Medium artwork up to 7" x 7" with calculated pull compensation',
      badge: 'RECOMMENDED',
      price: 20,
      original_price: 30,
      turnaround: '6–12 Hours',
      features: ['Up to 7" x 7" Medium Area', 'Complex Multi-Color Layering', 'Underlay Pull & Push Compensation', 'Free Unlimited Revisions']
    },
    {
      id: 'emb-pro',
      service_type: 'embroidery',
      title: 'Full Back & 3D Puff Foam',
      subtitle: 'Full back jacket designs up to 12" x 12" and raised 3D foam',
      badge: 'PRO 3D PUFF',
      price: 35,
      original_price: 50,
      turnaround: '8–12 Hours',
      features: ['Up to 12" x 12" Full Back Area', 'High Density 3D Puff Foam Layering', 'Heavy Fabric Calibration', 'Priority Digitizer Support']
    }
  ],
  patch: [
    {
      id: 'patch-starter',
      service_type: 'patch',
      title: 'Starter Run (50 Pieces)',
      subtitle: 'Physical patches manufactured with iron-on or velcro backing',
      badge: 'LOW MOQ',
      price: 3.50,
      original_price: 5.00,
      quantity: 50,
      turnaround: '4–6 Days',
      features: ['50 Pieces Minimum Run', '12-Hour Free Digital Proof', 'Velcro Hook & Loop or Iron-On', 'Worldwide Doorstep Delivery']
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      title: 'Production Batch (100 Pieces)',
      subtitle: 'Standard batch for uniforms, brand drops, and apparel clubs',
      badge: 'BEST VALUE',
      price: 2.50,
      original_price: 3.80,
      quantity: 100,
      turnaround: '5–7 Days',
      features: ['100 Pieces Batch', 'Precision Laser-Cut Border', 'Free Pre-Production Sew-Out Photo', 'Free Doorstep Air Shipping']
    },
    {
      id: 'patch-bulk',
      service_type: 'patch',
      title: 'Wholesale Batch (250+ Pieces)',
      subtitle: 'Maximum factory savings for uniform suppliers and merchandise',
      badge: 'FACTORY DIRECT',
      price: 1.80,
      original_price: 2.80,
      quantity: 250,
      turnaround: '7–10 Days',
      features: ['250+ Pieces Wholesale', 'Individual Poly-Bag Packaging', 'Any Custom Shape & Border', 'Dedicated Account Manager']
    }
  ],
  vector: [
    {
      id: 'vec-basic',
      service_type: 'vector',
      title: 'Simple Logo & Typography Redraw',
      subtitle: 'Clean typographic logos & basic line work converted to vector',
      badge: 'BASIC',
      price: 15,
      original_price: 25,
      turnaround: '6–12 Hours',
      features: ['Clean Bézier Curves & Nodes', 'Sharp 100% Scalable Vector Paths', 'Master Suite: .AI, .EPS, .SVG, .PDF', 'Print & Cut Ready']
    },
    {
      id: 'vec-popular',
      service_type: 'vector',
      title: 'Standard Multi-Color Artwork',
      subtitle: 'Multi-layer mascot logos, badges & Pantone color separations',
      badge: 'POPULAR',
      price: 25,
      original_price: 40,
      turnaround: '6–12 Hours',
      features: ['Pantone (PMS) Spot Color Matching', 'Separated Layers for Screen Print', 'Vinyl & DTF Print Optimization', 'High-Res 300+ DPI PDF']
    },
    {
      id: 'vec-pro',
      service_type: 'vector',
      title: 'Complex Detailed Illustration',
      subtitle: 'Highly intricate artwork, halftones, gradients & photos',
      badge: 'DETAILED',
      price: 45,
      original_price: 65,
      turnaround: '12–24 Hours',
      features: ['Intricate Micro-Detail Redraw', 'Custom Halftones & Gradients', 'Laser Engraving & CNC Ready', 'Dedicated Senior Vector Artist']
    }
  ]
};

const SIZE_PRESETS = [
  { label: 'Cap / Hat (2.25")', width: '2.25', height: '2.25', placement: 'Cap / Beanie Front' },
  { label: 'Left Chest (3.5")', width: '3.5', height: '3.5', placement: 'Left Chest Polo / Shirt' },
  { label: 'Sleeve (4.0")', width: '4.0', height: '4.0', placement: 'Sleeve / Pocket' },
  { label: 'Jacket Back (10.0")', width: '10.0', height: '10.0', placement: 'Full Jacket Back' },
  { label: 'Custom Size', width: '4.0', height: '4.0', placement: 'Custom Placement' }
];

export const StreamlinedOrderFlow = ({
  initialService = 'embroidery',
  initialPackage = null,
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
    dynamicPricingTiers = [],
    theme = 'light'
  } = useAppState();

  const isDark = theme === 'dark';

  // 1. Flow Step: 1 = Details & Artwork, 2 = Review & Contact
  const [step, setStep] = useState(1);

  // 2. Service Selection: 'embroidery' | 'patch' | 'vector'
  const [selectedService, setSelectedService] = useState(() => {
    const norm = String(initialService || '').toLowerCase();
    if (norm.includes('patch')) return 'patch';
    if (norm.includes('vector')) return 'vector';
    return 'embroidery';
  });

  // 3. Package Selection
  const [activePkg, setActivePkg] = useState(null);

  // 4. Quantity
  const [quantity, setQuantity] = useState(1);

  // 5. Specifications
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [selectedPlacement, setSelectedPlacement] = useState('Left Chest Polo / Shirt');
  const [fabricType, setFabricType] = useState('Cotton / Pique Polo');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const patchStyle = 'Embroidered Twill';
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB', 'PDF']);
  const [isRush, setIsRush] = useState(false);
  const orderTitle = '';
  const [notes, setNotes] = useState('');

  // 6. Artwork Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // 7. Contact Details (for guest / prefill)
  const [clientName, setClientName] = useState(() => authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState(() => authUser?.email || currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState(() => authUser?.user_metadata?.phone || authUser?.phone || '');
  const [contactError, setContactError] = useState('');

  // 8. Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tiers from DB or fallback
  const currentTiers = React.useMemo(() => {
    const dbTiers = (dynamicPricingTiers || []).filter(t => matchCategory(t.service_type, selectedService));
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((t, idx) => ({
        id: t.id || `tier-${idx}`,
        service_type: selectedService,
        title: t.title,
        subtitle: t.subtitle,
        badge: t.badge_text || (idx === 0 ? 'BASIC' : idx === 1 ? 'MOST POPULAR' : 'PRO'),
        price: Number(t.price) || 10,
        original_price: t.original_price ? Number(t.original_price) : null,
        turnaround: t.turnaround_time || '4–12 Hours',
        features: Array.isArray(t.features) ? t.features : []
      }));
    }
    return DEFAULT_PACKAGES[selectedService] || DEFAULT_PACKAGES.embroidery;
  }, [dynamicPricingTiers, selectedService]);

  // Sync selected package
  useEffect(() => {
    if (initialPackage && currentTiers.some(p => p.id === initialPackage.id)) {
      setActivePkg(initialPackage);
    } else {
      // Default to second tier (popular) or first
      setActivePkg(currentTiers[1] || currentTiers[0]);
    }
  }, [selectedService, currentTiers, initialPackage]);

  // Adjust defaults when service changes
  useEffect(() => {
    if (selectedService === 'patch') {
      setQuantity(50);
      setSelectedPlacement('Custom Shape Cut');
      setSelectedFormats(['DST', 'PDF Proof', 'Physical Patch Shipment']);
    } else if (selectedService === 'vector') {
      setQuantity(1);
      setSelectedPlacement('Vector Art');
      setSelectedFormats(['AI', 'EPS', 'SVG', 'PDF', 'PNG']);
    } else {
      setQuantity(1);
      setSelectedPlacement('Left Chest Polo / Shirt');
      setSelectedFormats(['DST', 'PES', 'EMB', 'PDF']);
    }
  }, [selectedService]);

  // Handle Preset Size Click
  const handleSelectSizePreset = (preset) => {
    setWidthInches(preset.width);
    setHeightInches(preset.height);
    setSelectedPlacement(preset.placement);
  };

  // Toggle format selection
  const handleToggleFormat = (fmt) => {
    setSelectedFormats(prev => {
      if (prev.includes(fmt)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(f => f !== fmt);
      }
      return [...prev, fmt];
    });
  };

  // File Upload Handler
  const handleFilesChosen = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError('');
    setIsUploading(true);
    setUploadProgress(10);

    const uploadedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds maximum allowed 50MB limit.`);
        setIsUploading(false);
        return;
      }

      try {
        setUploadProgress(20 + Math.round((i / files.length) * 70));
        const res = await uploadFileToCloudinaryFull(file, 'client-uploads', 'artwork', (p) => {
          setUploadProgress(20 + Math.round((p / 100) * 70));
        });

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
          // Fallback object URL if upload fails locally
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
    setUploadProgress(100);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate live total price
  const baseUnitPrice = Number(activePkg?.price) || (selectedService === 'patch' ? 3.50 : 10);
  const baseSubtotal = selectedService === 'patch'
    ? baseUnitPrice * Math.max(50, quantity)
    : baseUnitPrice * Math.max(1, quantity);

  const rushFee = isRush ? (selectedService === 'patch' ? 25.00 : 10.00) : 0;
  const promoDiscountAmount = appliedPromo ? (baseSubtotal * (Number(appliedPromo.discount_percent) || 15) / 100) : 0;
  const totalPrice = Math.max(1, baseSubtotal + rushFee - promoDiscountAmount);

  // Apply Coupon Code
  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setAppliedPromo(null);
      return;
    }
    if (code === 'FIRST10' || code === 'SAVE15' || code === 'VIP10' || code === 'PROMO20') {
      const discount = code === 'PROMO20' ? 20 : (code === 'SAVE15' ? 15 : 10);
      setAppliedPromo({ code, discount_percent: discount });
      if (showToast) showToast(`Coupon ${code} applied: ${discount}% OFF!`, 'success');
    } else {
      if (showToast) showToast('Invalid coupon code. Try SAVE15', 'info');
    }
  };

  // Validation before going to Step 2
  const handleGoToReview = () => {
    if (uploadedFiles.length === 0) {
      setUploadError('Please attach at least one artwork file or design screenshot.');
      return;
    }
    if (selectedService === 'patch' && quantity < 50) {
      setQuantity(50);
      if (showToast) showToast('Minimum order quantity for Custom Patches is 50 pieces.', 'warning');
      return;
    }
    setUploadError('');
    setStep(2);
  };

  // Submit Order to Supabase and Launch Checkout
  const handleFinalSubmitOrder = async () => {
    const cleanEmail = (clientEmail || '').toLowerCase().trim();
    const cleanName = (clientName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setContactError('Please enter a valid email address so we can deliver your machine files & proof.');
      return;
    }
    if (!cleanName) {
      setContactError('Please enter your full name or company name.');
      return;
    }

    setContactError('');
    setIsSubmitting(true);

    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Artwork';
      const cleanService = selectedService === 'patch'
        ? 'Custom Patches'
        : selectedService === 'vector'
          ? 'Vector Art'
          : 'Embroidery Digitizing';

      const derivedTitle = (orderTitle || '').trim() || (
        selectedService === 'patch'
          ? `${patchStyle} Patches (${quantity} Pcs)`
          : `${firstFileName} - ${cleanService} (${activePkg?.title || 'Standard'})`
      );

      const primaryArtworkUrl = uploadedFiles[0]?.url || null;

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        package_name: activePkg?.title || 'Standard Package',
        package_tier: activePkg?.badge || 'POPULAR',
        quantity: quantity,
        price: totalPrice,
        totalPrice: totalPrice,
        base_price: baseSubtotal,
        discount_amount: parseFloat(promoDiscountAmount.toFixed(2)),
        applied_promo_code: appliedPromo?.code || null,
        isRush: isRush,
        notes: notes.trim(),
        placement: selectedPlacement,
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
        client_name: cleanName,
        clientName: cleanName,
        client_email: cleanEmail,
        clientEmail: cleanEmail,
        clientPhone: clientPhone.trim() || null,
        status: 'submitted',
        payment_status: 'pending'
      };

      const created = await createOrder(orderPayload);
      const resultingId = created?.id || `ORD_${Date.now()}`;

      // Store in localStorage for instant tracking by guest
      if (typeof window !== 'undefined' && resultingId) {
        try {
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingId).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
          // Save guest contact in storage for next time
          localStorage.setItem('bdigi_guest_contact', JSON.stringify({ name: cleanName, email: cleanEmail, phone: clientPhone }));
        } catch {}
      }

      if (showToast) {
        showToast(`🎉 Order #${resultingId.replace(/^#/, '')} created successfully!`, 'success');
      }

      // Close order modal if in modal mode
      if (onCloseModal) onCloseModal();

      // Launch Checkout Modal for instant payment
      if (setIsCheckoutModalOpen && setCheckoutSession) {
        setIsCheckoutModalOpen(true);
        setCheckoutSession({
          amount: totalPrice,
          price: totalPrice,
          totalPrice: totalPrice,
          base_price: baseSubtotal,
          orderId: resultingId,
          title: derivedTitle,
          clientEmail: cleanEmail,
          clientName: cleanName
        });
      }

      if (onOrderComplete) onOrderComplete(resultingId);
    } catch (err) {
      console.error('[Order submit exception]:', err);
      if (showToast) {
        showToast(err?.message || 'Failed to submit order. Please check details and retry.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '860px',
      margin: '0 auto',
      background: 'var(--color-surface, #ffffff)',
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.08)',
      border: '1.5px solid var(--color-border, #e2e8f0)',
      overflow: 'hidden',
      color: 'var(--color-text-primary, #0f172a)',
      fontFamily: 'var(--font-body, "Inter", sans-serif)'
    }}>

      {/* TOP HEADER & TRUST PILL */}
      <div style={{
        padding: '1.5rem clamp(1.25rem, 3vw, 2rem)',
        background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
        borderBottom: '1.5px solid var(--color-border, #e2e8f0)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            <Sparkles size={13} />
            Step {step} of 2: {step === 1 ? 'Design & Requirements' : 'Instant Review & Contact'}
          </div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontWeight: 900, margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-text-primary, #0f172a)' }}>
            {step === 1 ? 'Upload Artwork & Choose Specs' : 'Review & Finalize Order'}
          </h2>
        </div>

        {/* TRUST METRICS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', background: 'rgba(5, 150, 105, 0.08)', padding: '0.3rem 0.65rem', borderRadius: '8px' }}>
            <Zap size={14} /> 4–12H Delivery
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0284c7', background: 'rgba(2, 132, 199, 0.08)', padding: '0.3rem 0.65rem', borderRadius: '8px' }}>
            <ShieldCheck size={14} /> Free Revisions
          </span>
        </div>
      </div>

      {/* STEP 1: SERVICE & DESIGN REQUIREMENTS */}
      {step === 1 && (
        <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* 1. SERVICE TOGGLE (Embroidery vs Patches - VIP Focus) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.65rem' }}>
              1. Select What You Need
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
              
              {/* Option 1: Embroidery Digitizing (Primary Flagship) */}
              <button
                type="button"
                onClick={() => setSelectedService('embroidery')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  border: selectedService === 'embroidery' ? '2.5px solid #ea580c' : '1.5px solid var(--color-border, #cbd5e1)',
                  background: selectedService === 'embroidery' ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed') : 'var(--color-surface, #ffffff)',
                  boxShadow: selectedService === 'embroidery' ? '0 8px 24px rgba(234, 88, 12, 0.18)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: selectedService === 'embroidery' ? '#ea580c' : '#f1f5f9', color: selectedService === 'embroidery' ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Layers size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>Embroidery Digitizing</strong>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>From $10</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.35 }}>
                    Stitch files (.DST, .PES, .EMB) for caps, left chest & 3D puff.
                  </p>
                </div>
              </button>

              {/* Option 2: Custom Physical Patches */}
              <button
                type="button"
                onClick={() => setSelectedService('patch')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.1rem 1.25rem',
                  borderRadius: '16px',
                  border: selectedService === 'patch' ? '2.5px solid #0284c7' : '1.5px solid var(--color-border, #cbd5e1)',
                  background: selectedService === 'patch' ? (isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff') : 'var(--color-surface, #ffffff)',
                  boxShadow: selectedService === 'patch' ? '0 8px 24px rgba(2, 132, 199, 0.18)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: selectedService === 'patch' ? '#0284c7' : '#f1f5f9', color: selectedService === 'patch' ? '#ffffff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>Custom Patches</strong>
                    <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>50 Pcs Min</span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.35 }}>
                    Embroidered, Woven & PVC patches shipped to your door.
                  </p>
                </div>
              </button>
            </div>

            {/* Subtle Vector Art Mention Link */}
            <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
              <span>Need logo redraw or vector art conversion?</span>
              <button
                type="button"
                onClick={() => setSelectedService(selectedService === 'vector' ? 'embroidery' : 'vector')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: selectedService === 'vector' ? '#ea580c' : '#2563eb',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0
                }}
              >
                <PenTool size={13} />
                {selectedService === 'vector' ? '← Back to Embroidery' : 'Switch to Vector Art ($15 Flat) →'}
              </button>
            </div>
          </div>

          {/* 2. CHOOSE PACKAGE TIER */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <label style={{ fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #64748b)' }}>
                2. Choose Package Tier
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
                {selectedService === 'patch' ? 'Includes pre-production proof' : 'All packages include Tajima .DST, Brother .PES & Wilcom .EMB'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
              {currentTiers.map((pkg) => {
                const isSelected = activePkg?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setActivePkg(pkg)}
                    style={{
                      border: isSelected ? '2px solid #ea580c' : '1.5px solid var(--color-border, #e2e8f0)',
                      borderRadius: '14px',
                      padding: '1rem',
                      background: isSelected ? (isDark ? 'rgba(234, 88, 12, 0.08)' : '#fffbf7') : 'var(--color-surface, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      position: 'relative'
                    }}
                  >
                    {pkg.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '12px',
                        background: isSelected ? '#ea580c' : '#475569',
                        color: '#ffffff',
                        fontSize: '0.64rem',
                        fontWeight: 900,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        letterSpacing: '0.04em'
                      }}>
                        {pkg.badge}
                      </span>
                    )}

                    <div style={{ fontSize: '0.94rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', marginBottom: '0.25rem' }}>
                      {pkg.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.75rem', lineHeight: 1.35 }}>
                      {pkg.subtitle}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.45rem', fontWeight: 900, color: isSelected ? '#ea580c' : 'var(--color-text-primary, #0f172a)' }}>
                        ${pkg.price.toFixed(2)}
                      </span>
                      {pkg.original_price && (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                          ${pkg.original_price.toFixed(2)}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                        {selectedService === 'patch' ? '/ piece' : 'flat'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={12} /> Turnaround: {pkg.turnaround}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. ARTWORK UPLOAD (Dropzone) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.65rem' }}>
              3. Upload Design / Logo File <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--color-border, #cbd5e1)',
                borderRadius: '16px',
                padding: '1.8rem 1.5rem',
                textAlign: 'center',
                background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.ai,.eps,.dst,.pes,.emb,.svg"
                onChange={handleFilesChosen}
                style={{ display: 'none' }}
              />

              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
              </div>

              <div style={{ fontWeight: 800, fontSize: '0.98rem', marginBottom: '0.25rem', color: 'var(--color-text-primary, #0f172a)' }}>
                {isUploading ? `Uploading Artwork (${uploadProgress}%)...` : 'Click or Drag & Drop Artwork File Here'}
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
                Supports JPG, PNG, PDF, AI, EPS, SVG, DST, PES, EMB (Max 50MB per file)
              </p>
            </div>

            {uploadError && (
              <div style={{ marginTop: '0.65rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={16} /> {uploadError}
              </div>
            )}

            {/* Uploaded Files Previews */}
            {uploadedFiles.length > 0 && (
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {uploadedFiles.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      background: 'var(--color-surface, #ffffff)',
                      border: '1px solid var(--color-border, #cbd5e1)',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <FileCheck size={18} style={{ color: '#059669', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                      {f.size && (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          ({(f.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. SMART SPECIFICATIONS & PRESETS */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.65rem' }}>
              4. Target Size & Machine Formats
            </label>

            {/* Quick Size Presets */}
            {selectedService === 'embroidery' && (
              <div style={{ marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Quick Size Presets:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {SIZE_PRESETS.map((p, idx) => {
                    const isSelected = widthInches === p.width && heightInches === p.height;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSizePreset(p)}
                        style={{
                          background: isSelected ? '#ea580c' : 'var(--color-subtle, #f1f5f9)',
                          color: isSelected ? '#ffffff' : 'var(--color-text-primary, #0f172a)',
                          border: isSelected ? '1px solid #ea580c' : '1px solid var(--color-border, #e2e8f0)',
                          borderRadius: '8px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Dimensions Input Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                  Width (Inches)
                </label>
                <input
                  type="text"
                  value={widthInches}
                  onChange={(e) => setWidthInches(e.target.value)}
                  placeholder='e.g. 3.5"'
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                  Height (Inches)
                </label>
                <input
                  type="text"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  placeholder='e.g. 3.5"'
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                />
              </div>

              {selectedService === 'patch' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                    Patch Backing
                  </label>
                  <select
                    value={patchBacking}
                    onChange={(e) => setPatchBacking(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border, #cbd5e1)',
                      background: 'var(--color-surface, #ffffff)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    <option value="Velcro (Hook & Loop)">Velcro (Hook & Loop)</option>
                    <option value="Heat-Seal Iron-On">Heat-Seal Iron-On</option>
                    <option value="Plain Sew-On">Plain Sew-On</option>
                    <option value="Peel & Stick Adhesive">Peel & Stick Adhesive</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                    Garment / Fabric
                  </label>
                  <select
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      border: '1.5px solid var(--color-border, #cbd5e1)',
                      background: 'var(--color-surface, #ffffff)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--color-text-primary, #0f172a)'
                    }}
                  >
                    <option value="Cotton / Pique Polo">Polo / T-Shirt (Cotton)</option>
                    <option value="Structured Cap / Hat">Structured Cap / Beanie</option>
                    <option value="Hoodie / Heavy Fleece">Hoodie / Fleece / Jacket</option>
                    <option value="3D Puff Foam">3D Puff Raised Foam</option>
                    <option value="Towel / Velvet">Towel / Textured Fabric</option>
                  </select>
                </div>
              )}
            </div>

            {/* Deliverable Format Toggles */}
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Deliverable Formats Included (Pre-checked standard formats):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(selectedService === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF', 'PNG'] : ['DST', 'PES', 'EMB', 'PDF', 'EXP', 'JEF']).map((fmt) => {
                  const isChecked = selectedFormats.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleToggleFormat(fmt)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '8px',
                        border: isChecked ? '1px solid #059669' : '1px solid var(--color-border, #e2e8f0)',
                        background: isChecked ? 'rgba(5, 150, 105, 0.1)' : 'var(--color-subtle, #f8fafc)',
                        color: isChecked ? '#059669' : '#64748b',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked && <Check size={12} />}
                      .{fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. NOTES & EXPRESS RUSH TOGGLE */}
          <div>
            <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.4rem' }}>
              Special Notes / Thread Color Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Please use exact colors matching logo, keep stitch count tight for caps, make small text clean..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                background: 'var(--color-surface, #ffffff)',
                fontSize: '0.84rem',
                color: 'var(--color-text-primary, #0f172a)',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />

            {/* Express Rush Option */}
            <div
              onClick={() => setIsRush(!isRush)}
              style={{
                marginTop: '0.85rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: isRush ? '1.5px solid #ea580c' : '1px solid var(--color-border, #e2e8f0)',
                background: isRush ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed') : 'var(--color-subtle, #f8fafc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: isRush ? '2px solid #ea580c' : '2px solid #94a3b8', background: isRush ? '#ea580c' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  {isRush && <Check size={14} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isRush ? '#ea580c' : 'var(--color-text-primary, #0f172a)' }}>
                    ⚡ 2–4 Hour Express Rush Turnaround
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                    Priority machine lane with immediate production assignment
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#ea580c' }}>
                +${selectedService === 'patch' ? '25.00' : '10.00'}
              </span>
            </div>
          </div>

          {/* CONTINUE BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1.5px solid var(--color-border, #e2e8f0)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', display: 'block', fontWeight: 700 }}>Estimated Total</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>${totalPrice.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={handleGoToReview}
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.9rem 1.8rem',
                fontSize: '0.96rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Continue to Final Review</span>
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: REVIEW & CONTACT DETAILS */}
      {step === 2 && (
        <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* ITEM SUMMARY CARD */}
          <div style={{
            background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
            border: '1.5px solid var(--color-border, #e2e8f0)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border, #e2e8f0)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#059669', background: 'rgba(5, 150, 105, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                  {selectedService === 'patch' ? 'Custom Patches' : selectedService === 'vector' ? 'Vector Art' : 'Embroidery Digitizing'}
                </span>
                <h3 style={{ margin: '0.35rem 0 0.2rem', fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                  {activePkg?.title}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Size: <strong>{widthInches}" × {heightInches}"</strong> • Turnaround: <strong>{isRush ? '⚡ 2–4H Express' : activePkg?.turnaround}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669' }}>
                  ${totalPrice.toFixed(2)}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                  Verified Price
                </span>
              </div>
            </div>

            {/* Attached Files Pill */}
            {uploadedFiles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-secondary, #334155)' }}>
                <FileCheck size={16} style={{ color: '#059669', flexShrink: 0 }} />
                <span>Artwork: <strong>{uploadedFiles.map(f => f.name).join(', ')}</strong></span>
              </div>
            )}

            {/* Coupon Code Input */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
                placeholder="Coupon Code (e.g. SAVE15)"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.85rem',
                  borderRadius: '8px',
                  border: '1.5px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-surface, #ffffff)',
                  fontSize: '0.82rem',
                  textTransform: 'uppercase',
                  fontWeight: 700
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
                Apply
              </button>
            </div>

            {/* Itemized Price Breakdown */}
            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted, #64748b)' }}>
                <span>Base Subtotal ({activePkg?.title})</span>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>${baseSubtotal.toFixed(2)}</span>
              </div>
              {promoDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                  <span>Coupon Discount ({appliedPromo?.discount_percent}% OFF)</span>
                  <span>-${promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              {rushFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c', fontWeight: 700 }}>
                  <span>⚡ Express Rush Turnaround</span>
                  <span>+${rushFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* CONTACT & DELIVERY DETAILS (Frictionless / No Password Required!) */}
          <div>
            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
              Where should we deliver your files & sew-out proof?
            </h4>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
              No complex registration needed. Your production files and instant tracking will be emailed directly to you.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.3rem' }}>
                  Your Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. John Doe / Apex Apparel"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.3rem' }}>
                  Email Address (For File Delivery) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. john@yourshop.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.3rem' }}>
                  WhatsApp / Phone (Optional for instant proof SMS)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="e.g. +1 555-0192"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--color-border, #cbd5e1)',
                    background: 'var(--color-surface, #ffffff)',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {contactError && (
              <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={16} /> {contactError}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS & FINAL SUBMIT */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1.5px solid var(--color-border, #e2e8f0)', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                background: 'var(--color-subtle, #f1f5f9)',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 800,
                color: 'var(--color-text-primary, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} /> Edit Specs
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmitOrder}
              style={{
                flex: 1,
                maxWidth: '380px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '0.95rem 1.8rem',
                fontSize: '1rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Submitting Order to Production...</span>
                </>
              ) : (
                <>
                  <span>Place Order & Pay (${totalPrice.toFixed(2)})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* TRUST FOOTER */}
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} style={{ color: '#059669' }} /> 256-Bit SSL Encrypted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={14} style={{ color: '#ea580c' }} /> 100% Manual Digitizing Guarantee
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileCheck size={14} style={{ color: '#0284c7' }} /> Free Unlimited Sew-Out Revisions
            </span>
          </div>

        </div>
      )}

    </div>
  );
};
