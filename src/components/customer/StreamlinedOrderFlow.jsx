'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  Upload,
  Layers,
  Tag,
  PenTool,
  Check,
  Trash2,
  Loader2,
  Clock,
  Zap,
  ShieldCheck,
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
      title: 'Cap & Left Chest',
      subtitle: 'Caps, beanies, polos & shirts up to 4" x 4"',
      badge: 'POPULAR',
      price: 10,
      original_price: 15,
      turnaround: '4–12 Hours'
    },
    {
      id: 'emb-popular',
      service_type: 'embroidery',
      title: 'Mid-Size Artwork',
      subtitle: 'Medium artwork up to 7" x 7" with pull compensation',
      badge: 'RECOMMENDED',
      price: 20,
      original_price: 30,
      turnaround: '6–12 Hours'
    },
    {
      id: 'emb-pro',
      service_type: 'embroidery',
      title: 'Jacket Back & 3D Puff',
      subtitle: 'Full jacket back designs up to 12" x 12" & raised foam',
      badge: 'PRO 3D',
      price: 35,
      original_price: 50,
      turnaround: '8–12 Hours'
    }
  ],
  patch: [
    {
      id: 'patch-starter',
      service_type: 'patch',
      title: 'Starter Run (50 Pcs)',
      subtitle: 'Physical patches with velcro or iron-on backing',
      badge: '50 PCS MIN',
      price: 3.50,
      original_price: 5.00,
      quantity: 50,
      turnaround: '4–6 Days'
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      title: 'Production (100 Pcs)',
      subtitle: 'Standard uniforms, clubs & merchandise batch',
      badge: 'BEST VALUE',
      price: 2.50,
      original_price: 3.80,
      quantity: 100,
      turnaround: '5–7 Days'
    },
    {
      id: 'patch-bulk',
      service_type: 'patch',
      title: 'Wholesale (250+ Pcs)',
      subtitle: 'Bulk factory rates for suppliers & apparel brands',
      badge: 'FACTORY DIRECT',
      price: 1.80,
      original_price: 2.80,
      quantity: 250,
      turnaround: '7–10 Days'
    }
  ],
  vector: [
    {
      id: 'vec-basic',
      service_type: 'vector',
      title: 'Basic Logo Redraw',
      subtitle: 'Clean typographic logos & basic line art to vector',
      badge: 'BASIC',
      price: 15,
      original_price: 25,
      turnaround: '6–12 Hours'
    },
    {
      id: 'vec-popular',
      service_type: 'vector',
      title: 'Multi-Color Mascot',
      subtitle: 'Multi-layer mascot logos & Pantone color separations',
      badge: 'POPULAR',
      price: 25,
      original_price: 40,
      turnaround: '6–12 Hours'
    },
    {
      id: 'vec-pro',
      service_type: 'vector',
      title: 'Intricate Artwork',
      subtitle: 'Complex illustrations, halftones, gradients & photos',
      badge: 'DETAILED',
      price: 45,
      original_price: 65,
      turnaround: '12–24 Hours'
    }
  ]
};

const SIZE_PRESETS = [
  { label: 'Cap / Hat (2.25")', width: '2.25', height: '2.25', placement: 'Cap / Beanie Front' },
  { label: 'Left Chest (3.5")', width: '3.5', height: '3.5', placement: 'Left Chest Polo / Shirt' },
  { label: 'Sleeve (4.0")', width: '4.0', height: '4.0', placement: 'Sleeve / Pocket' },
  { label: 'Jacket Back (10.0")', width: '10.0', height: '10.0', placement: 'Full Jacket Back' }
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

  // 1. Service Selection: 'embroidery' | 'patch' | 'vector'
  const [selectedService, setSelectedService] = useState(() => {
    const norm = String(initialService || '').toLowerCase();
    if (norm.includes('patch')) return 'patch';
    if (norm.includes('vector')) return 'vector';
    return 'embroidery';
  });

  // 2. Package Selection
  const [activePkg, setActivePkg] = useState(null);

  // 3. Quantity
  const [quantity, setQuantity] = useState(1);

  // 4. Specifications
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [selectedPlacement, setSelectedPlacement] = useState('Left Chest Polo / Shirt');
  const [fabricType, setFabricType] = useState('Cotton / Pique Polo');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const patchStyle = 'Embroidered Twill';
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB', 'PDF']);
  const [isRush, setIsRush] = useState(false);
  const [notes, setNotes] = useState('');

  // 5. Artwork Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // 6. Contact Details (for guest / prefill)
  const [clientName, setClientName] = useState(() => authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState(() => authUser?.email || currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState(() => authUser?.user_metadata?.phone || authUser?.phone || '');
  const [contactError, setContactError] = useState('');

  // 7. Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load tiers from DB or fallback
  const currentTiers = useMemo(() => {
    const dbTiers = (dynamicPricingTiers || []).filter(t => matchCategory(t.service_type, selectedService));
    if (dbTiers && dbTiers.length > 0) {
      return dbTiers.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)).map((t, idx) => ({
        id: t.id || `tier-${idx}`,
        service_type: selectedService,
        title: t.title,
        subtitle: t.subtitle,
        badge: t.badge_text || (idx === 0 ? 'BASIC' : idx === 1 ? 'POPULAR' : 'PRO'),
        price: Number(t.price) || 10,
        original_price: t.original_price ? Number(t.original_price) : null,
        turnaround: t.turnaround_time || '4–12 Hours'
      }));
    }
    return DEFAULT_PACKAGES[selectedService] || DEFAULT_PACKAGES.embroidery;
  }, [dynamicPricingTiers, selectedService]);

  // Sync selected package
  useEffect(() => {
    if (initialPackage && currentTiers.some(p => p.id === initialPackage.id)) {
      setActivePkg(initialPackage);
    } else {
      setActivePkg(currentTiers[1] || currentTiers[0]);
    }
  }, [selectedService, currentTiers, initialPackage]);

  // Adjust defaults when service changes
  useEffect(() => {
    if (selectedService === 'patch') {
      setQuantity(50);
      setSelectedPlacement('Custom Shape Cut');
      setSelectedFormats(['DST', 'PDF Proof', 'Physical Shipment']);
    } else if (selectedService === 'vector') {
      setQuantity(1);
      setSelectedPlacement('Vector Scalable Art');
      setSelectedFormats(['AI', 'EPS', 'SVG', 'PDF', 'PNG']);
    } else {
      setQuantity(1);
      setSelectedPlacement('Left Chest Polo / Shirt');
      setSelectedFormats(['DST', 'PES', 'EMB', 'PDF']);
    }
  }, [selectedService]);

  // Preset Size Click
  const handleSelectSizePreset = (preset) => {
    setWidthInches(preset.width);
    setHeightInches(preset.height);
    setSelectedPlacement(preset.placement);
  };

  // Toggle format selection
  const handleToggleFormat = (fmt) => {
    setSelectedFormats(prev => {
      if (prev.includes(fmt)) {
        if (prev.length === 1) return prev;
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
        setUploadError(`"${file.name}" exceeds 50MB limit.`);
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

  // Live Pricing Calculations
  const baseUnitPrice = Number(activePkg?.price) || (selectedService === 'patch' ? 3.50 : 10);
  const baseSubtotal = selectedService === 'patch'
    ? baseUnitPrice * Math.max(50, quantity)
    : baseUnitPrice * Math.max(1, quantity);

  const rushAmount = isRush ? (selectedService === 'patch' ? 25.00 : 10.00) : 0;
  const promoDiscountAmount = appliedPromo ? (baseSubtotal * (Number(appliedPromo.discount_percent) || 15) / 100) : 0;
  const totalPrice = Math.max(1, baseSubtotal + rushAmount - promoDiscountAmount);

  // Apply Coupon
  const handleApplyCoupon = () => {
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
      if (showToast) showToast('Invalid code. Try SAVE15', 'info');
    }
  };

  // Submit Order and Launch Stripe Checkout
  const handleFinalSubmitOrder = async () => {
    if (uploadedFiles.length === 0) {
      setUploadError('Please attach at least one artwork or logo file.');
      return;
    }

    const cleanEmail = (clientEmail || '').toLowerCase().trim();
    const cleanName = (clientName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setContactError('Please enter a valid email address to receive your stitch files.');
      return;
    }
    if (!cleanName) {
      setContactError('Please enter your full name or company name.');
      return;
    }

    setContactError('');
    setUploadError('');
    setIsSubmitting(true);

    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Design';
      const cleanService = selectedService === 'patch'
        ? 'Custom Patches'
        : selectedService === 'vector'
          ? 'Vector Art'
          : 'Embroidery Digitizing';

      const derivedTitle = selectedService === 'patch'
        ? `${patchStyle} Patches (${quantity} Pcs)`
        : `${firstFileName} - ${cleanService} (${activePkg?.title || 'Standard'})`;

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

      // Save order id to local storage for guests
      if (typeof window !== 'undefined' && resultingId) {
        try {
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingId).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
          localStorage.setItem('bdigi_guest_contact', JSON.stringify({ name: cleanName, email: cleanEmail, phone: clientPhone }));
        } catch {}
      }

      if (showToast) {
        showToast(`🎉 Order #${resultingId.replace(/^#/, '')} created successfully!`, 'success');
      }

      if (onCloseModal) onCloseModal();

      // Launch Instant Stripe Checkout Modal
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
        margin: '0 auto',
        background: 'var(--color-surface, #ffffff)',
        borderRadius: '18px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
          padding: 'clamp(1rem, 2.5vw, 1.5rem)'
        }}
      >
        {/* LEFT COLUMN: COMPACT SPECIFICATIONS & ARTWORK */}
        <div>
          {/* 1. SERVICE SELECTOR (Compact Segmented Pills) */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted, #64748b)' }}>
                Select Service
              </span>
              <button
                type="button"
                onClick={() => setSelectedService(selectedService === 'vector' ? 'embroidery' : 'vector')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: selectedService === 'vector' ? '#ea580c' : '#0284c7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: 0
                }}
              >
                <PenTool size={11} />
                {selectedService === 'vector' ? 'Back to Embroidery' : 'Vector Art ($15) →'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedService === 'vector' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => setSelectedService('embroidery')}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  border: selectedService === 'embroidery' ? '2px solid #ea580c' : '1px solid var(--color-border, #cbd5e1)',
                  background: selectedService === 'embroidery' ? (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : 'transparent',
                  color: selectedService === 'embroidery' ? '#ea580c' : 'var(--color-text-primary, #0f172a)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Layers size={15} />
                <span>Embroidery Digitizing</span>
                <span style={{ fontSize: '0.68rem', background: '#ea580c', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                  From $10
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedService('patch')}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  border: selectedService === 'patch' ? '2px solid #0284c7' : '1px solid var(--color-border, #cbd5e1)',
                  background: selectedService === 'patch' ? (isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff') : 'transparent',
                  color: selectedService === 'patch' ? '#0284c7' : 'var(--color-text-primary, #0f172a)',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <Tag size={15} />
                <span>Custom Patches</span>
                <span style={{ fontSize: '0.68rem', background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                  50 Pcs Min
                </span>
              </button>

              {selectedService === 'vector' && (
                <button
                  type="button"
                  style={{
                    padding: '0.55rem 0.65rem',
                    borderRadius: '10px',
                    border: '2px solid #7c3aed',
                    background: isDark ? 'rgba(124, 58, 237, 0.15)' : '#faf5ff',
                    color: '#7c3aed',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <PenTool size={15} />
                  <span>Vector Tracing</span>
                  <span style={{ fontSize: '0.68rem', background: '#7c3aed', color: '#fff', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>
                    $15 Flat
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* 2. PACKAGE SELECTION (Compact 3-Column Radio Grid) */}
          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted, #64748b)', marginBottom: '0.35rem' }}>
              Choose Package / Tier
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
              {currentTiers.map((pkg) => {
                const isSelected = activePkg?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setActivePkg(pkg)}
                    style={{
                      border: isSelected ? '2px solid #ea580c' : '1px solid var(--color-border, #cbd5e1)',
                      background: isSelected ? (isDark ? 'rgba(234, 88, 12, 0.1)' : '#fffaf5') : 'transparent',
                      borderRadius: '8px',
                      padding: '0.5rem 0.55rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pkg.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginTop: '0.15rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 900, color: isSelected ? '#ea580c' : 'var(--color-text-primary, #0f172a)' }}>
                        ${pkg.price.toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                        {selectedService === 'patch' ? '/pc' : 'flat'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                      <Clock size={10} /> {pkg.turnaround}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PATCH QUANTITY STEPPER (For Patches Only) */}
          {selectedService === 'patch' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.65rem',
                background: isDark ? 'rgba(30, 41, 59, 0.35)' : '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--color-border, #e2e8f0)',
                marginBottom: '0.85rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  Patch Quantity (MOQ: 50):
                </span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                  Bulk factory pricing applies automatically
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(50, quantity - 25))}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'var(--color-surface, #ffffff)',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(50, parseInt(e.target.value) || 50))}
                  style={{
                    width: '55px',
                    padding: '0.25rem 0.3rem',
                    textAlign: 'center',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 800
                  }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 25)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: 'var(--color-surface, #ffffff)',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* 3. ARTWORK UPLOAD (Compact Slim Upload Bar) */}
          <div style={{ marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted, #64748b)' }}>
                Upload Artwork / Logo <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>PNG, JPG, PDF, AI, DST</span>
            </div>

            {uploadedFiles.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--color-border, #cbd5e1)',
                  borderRadius: '9px',
                  padding: '0.55rem 0.85rem',
                  background: isDark ? 'rgba(30, 41, 59, 0.4)' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'border-color 0.15s ease'
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
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c' }}>
                      Uploading artwork...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={16} style={{ color: '#ea580c' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                      Click to choose or drop logo file
                    </span>
                  </>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem' }}>
                {uploadedFiles.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px'
                    }}
                  >
                    <Check size={12} style={{ color: '#059669' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#065f46', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(i)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
                >
                  + Add more
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.ai,.eps,.svg,.dst,.pes,.emb"
                  onChange={handleFilesChosen}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>

          {/* 4. SPECIFICATIONS (Compact 2-Column Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.2rem' }}>
                Size (Width × Height)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="text"
                  value={widthInches}
                  onChange={(e) => setWidthInches(e.target.value)}
                  placeholder='3.5"'
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.55rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>×</span>
                <input
                  type="text"
                  value={heightInches}
                  onChange={(e) => setHeightInches(e.target.value)}
                  placeholder='3.5"'
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.55rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.2rem' }}>
                {selectedService === 'patch' ? 'Patch Backing' : 'Fabric / Garment'}
              </label>
              {selectedService === 'patch' ? (
                <select
                  value={patchBacking}
                  onChange={(e) => setPatchBacking(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                >
                  <option value="Velcro (Hook & Loop)">Velcro (Hook & Loop)</option>
                  <option value="Heat-Seal Iron-On">Heat-Seal Iron-On</option>
                  <option value="Plain Sew-On">Plain Sew-On</option>
                  <option value="Peel & Stick Adhesive">Peel & Stick Adhesive</option>
                </select>
              ) : (
                <select
                  value={fabricType}
                  onChange={(e) => setFabricType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #cbd5e1)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary, #0f172a)'
                  }}
                >
                  <option value="Cotton / Pique Polo">Polo / T-Shirt (Cotton)</option>
                  <option value="Structured Cap / Hat">Structured Cap / Beanie</option>
                  <option value="Hoodie / Heavy Fleece">Hoodie / Jacket / Fleece</option>
                  <option value="3D Puff Foam">3D Puff Raised Foam</option>
                  <option value="Towel / Velvet">Towel / Textured Fabric</option>
                </select>
              )}
            </div>
          </div>

          {/* Quick Size Preset Chips */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {SIZE_PRESETS.map((p) => {
              const active = widthInches === p.width && heightInches === p.height;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectSizePreset(p)}
                  style={{
                    padding: '0.18rem 0.45rem',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: '1px solid var(--color-border, #e2e8f0)',
                    background: active ? '#ea580c' : 'var(--color-subtle, #f8fafc)',
                    color: active ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Machine Deliverables Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>Files:</span>
            {(selectedService === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF', 'PNG'] : ['DST', 'PES', 'EMB', 'PDF']).map((fmt) => {
              const sel = selectedFormats.includes(fmt);
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => handleToggleFormat(fmt)}
                  style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    border: sel ? '1px solid #ea580c' : '1px solid #cbd5e1',
                    background: sel ? '#fff7ed' : 'transparent',
                    color: sel ? '#ea580c' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {sel ? '✓ ' : ''}.{fmt}
                </button>
              );
            })}
          </div>

          {/* 5. NOTES & EXPRESS RUSH (Compact) */}
          <div style={{ marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thread colors, small text, or special instructions (optional)..."
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '7px',
                border: '1px solid var(--color-border, #cbd5e1)',
                fontSize: '0.78rem',
                color: 'var(--color-text-primary, #0f172a)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Express Rush Toggle */}
          <div
            onClick={() => setIsRush(!isRush)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.65rem',
              borderRadius: '7px',
              border: isRush ? '1.5px solid #ea580c' : '1px solid var(--color-border, #e2e8f0)',
              background: isRush ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed') : 'var(--color-subtle, #f8fafc)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={14} style={{ color: isRush ? '#ea580c' : '#94a3b8' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isRush ? '#ea580c' : 'var(--color-text-primary, #0f172a)' }}>
                ⚡ 2–4 Hour Express Rush Assignment
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: '#ea580c' }}>
              +${selectedService === 'patch' ? '25.00' : '10.00'}
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE ORDER SUMMARY & INSTANT CHECKOUT */}
        <div
          style={{
            background: isDark ? 'rgba(30, 41, 59, 0.45)' : '#f8fafc',
            borderRadius: '14px',
            border: '1.5px solid var(--color-border, #e2e8f0)',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '0.85rem'
          }}
        >
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid var(--color-border, #e2e8f0)', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                Order Summary & Checkout
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                {isRush ? '2–4h Express' : activePkg?.turnaround || '4–12h'}
              </span>
            </div>

            {/* Live Line Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--color-text-secondary, #475569)', fontWeight: 600 }}>
                  {selectedService === 'patch' ? `Custom Patches (${quantity} Pcs)` : (activePkg?.title || 'Embroidery Digitizing')}
                </span>
                <span style={{ fontWeight: 800 }}>${baseSubtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                <span>Specs: {widthInches}" × {heightInches}" • {selectedService === 'patch' ? patchBacking : fabricType}</span>
              </div>

              {isRush && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ea580c' }}>
                  <span>⚡ Priority Express Rush</span>
                  <span style={{ fontWeight: 800 }}>+${rushAmount.toFixed(2)}</span>
                </div>
              )}

              {promoDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                  <span>Promo Discount ({appliedPromo?.code})</span>
                  <span>-${promoDiscountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Coupon Code Row */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.85rem' }}>
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                placeholder="Promo code (SAVE15)"
                style={{
                  flex: 1,
                  padding: '0.38rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                style={{
                  padding: '0.38rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#334155',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </div>

            {/* Contact Details (For file delivery) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted, #64748b)' }}>
                Deliver Files & Proof To:
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Full Name *"
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              />
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="Email Address (Required for files) *"
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              />
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="WhatsApp / Phone (Optional for proof alerts)"
                style={{
                  padding: '0.45rem 0.6rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              />
              {contactError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                  <AlertCircle size={12} /> {contactError}
                </div>
              )}
              {uploadError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                  <AlertCircle size={12} /> {uploadError}
                </div>
              )}
            </div>
          </div>

          <div>
            {/* Total and Order Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem', paddingTop: '0.6rem', borderTop: '1.5px dashed var(--color-border, #cbd5e1)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)' }}>Total Due:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ea580c' }}>${totalPrice.toFixed(2)}</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting || isUploading}
              onClick={handleFinalSubmitOrder}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '9px',
                border: 'none',
                background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                color: '#ffffff',
                fontSize: '0.92rem',
                fontWeight: 900,
                cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing Order...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} /> Place Order & Pay (${totalPrice.toFixed(2)})
                </>
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.45rem', fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
              🔒 256-Bit SSL Encrypted • Instant Stripe Checkout • Free Revisions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedOrderFlow;
