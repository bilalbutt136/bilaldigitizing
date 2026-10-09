'use client';

import React, { useState, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  Upload,
  Check,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  Lock,
  Layers,
  Tag,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

export const StreamlinedOrderFlow = ({
  initialService = 'embroidery',
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
    theme = 'light'
  } = useAppState();

  const isDark = theme === 'dark';

  // Service switcher: 'embroidery' | 'patch' | 'vector'
  const [selectedService, setSelectedService] = useState(() => {
    const norm = String(initialService || '').toLowerCase();
    if (norm.includes('patch')) return 'patch';
    if (norm.includes('vector')) return 'vector';
    return 'embroidery';
  });

  // 1. EMBROIDERY FIELDS
  const [complexity, setComplexity] = useState('medium'); // simple ($10), medium ($15) [default], complex ($25), hardcore ($35)
  const [fileFormat, setFileFormat] = useState('all');
  const [sizeOption, setSizeOption] = useState('left-chest');
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('3.5');
  const [turnaround, setTurnaround] = useState('standard'); // standard (free), rush (+$10)

  // 2. PATCH FIELDS
  const [patchStyle, setPatchStyle] = useState('Embroidered Twill');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const [patchQuantityTier, setPatchQuantityTier] = useState('100'); // 50, 100 [popular], 250, 500
  const [patchTurnaround, setPatchTurnaround] = useState('standard'); // standard (free), rush (+$25)

  // 3. VECTOR FIELDS
  const [vectorComplexity, setVectorComplexity] = useState('standard'); // simple ($15), standard ($25), complex ($45)
  const [vectorTurnaround, setVectorTurnaround] = useState('standard'); // standard (free), rush (+$10)
  const [vectorFormat, setVectorFormat] = useState('all');

  // Universal fields
  const [quantity, setQuantity] = useState(1);
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Artwork Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Contact Details
  const [clientName, setClientName] = useState(() => authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState(() => authUser?.email || currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState(() => authUser?.user_metadata?.phone || authUser?.phone || '');
  const [contactError, setContactError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Price Calculation
  const calculatePricing = () => {
    let unitBase = 15;
    let rushFee = 0;
    const orderQty = Math.max(1, quantity);

    if (selectedService === 'embroidery') {
      if (complexity === 'simple') unitBase = 10;
      else if (complexity === 'medium') unitBase = 15;
      else if (complexity === 'complex') unitBase = 25;
      else if (complexity === 'hardcore') unitBase = 35;

      if (turnaround === 'rush') rushFee = 10;
      return {
        unitPrice: unitBase,
        subtotal: unitBase * orderQty,
        rush: rushFee,
        total: (unitBase * orderQty) + rushFee
      };
    }

    if (selectedService === 'patch') {
      let perPieceRate = 2.50;
      let minPieces = 100;
      if (patchQuantityTier === '50') { perPieceRate = 3.50; minPieces = 50; }
      else if (patchQuantityTier === '100') { perPieceRate = 2.50; minPieces = 100; }
      else if (patchQuantityTier === '250') { perPieceRate = 1.80; minPieces = 250; }
      else if (patchQuantityTier === '500') { perPieceRate = 1.50; minPieces = 500; }

      if (patchTurnaround === 'rush') rushFee = 25;
      const patchSubtotal = perPieceRate * minPieces;
      return {
        unitPrice: perPieceRate,
        subtotal: patchSubtotal,
        rush: rushFee,
        total: patchSubtotal + rushFee,
        patchPieces: minPieces
      };
    }

    if (selectedService === 'vector') {
      if (vectorComplexity === 'simple') unitBase = 15;
      else if (vectorComplexity === 'standard') unitBase = 25;
      else if (vectorComplexity === 'complex') unitBase = 45;

      if (vectorTurnaround === 'rush') rushFee = 10;
      return {
        unitPrice: unitBase,
        subtotal: unitBase * orderQty,
        rush: rushFee,
        total: (unitBase * orderQty) + rushFee
      };
    }

    return { unitPrice: 15, subtotal: 15, rush: 0, total: 15 };
  };

  const pricing = calculatePricing();

  // File Upload Logic
  const processFiles = async (files) => {
    if (!files || !files.length) return;

    setUploadError('');
    setIsUploading(true);

    const uploadedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 50MB limit.`);
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

  // Submit Order and Launch Instant Stripe Checkout
  const handleFinalSubmitOrder = async () => {
    if (uploadedFiles.length === 0) {
      setUploadError('Please upload your artwork or logo file to proceed.');
      return;
    }

    const cleanEmail = (clientEmail || '').toLowerCase().trim();
    const cleanName = (clientName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setContactError('Please enter a valid email address so we can deliver your files.');
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

      let derivedTitle = `${firstFileName} - ${cleanService}`;
      let orderPackageName = 'Standard';
      let isRush = false;
      let targetFormats = ['DST', 'PES', 'EMB', 'PDF'];
      let derivedSize = 'Left Chest (Up to 4")';

      if (selectedService === 'embroidery') {
        const compLabels = {
          simple: 'Basic (Text & Simple Logo)',
          medium: 'Standard (Corporate Logo)',
          complex: 'Premium (High Detail)',
          hardcore: 'Hardcore (3D Puff / Jacket Back)'
        };
        orderPackageName = compLabels[complexity] || 'Standard';
        derivedTitle = `${firstFileName} - ${orderPackageName}`;
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
        orderPackageName = `${patchStyle} (${pricing.patchPieces} Pcs - ${patchBacking})`;
        isRush = patchTurnaround === 'rush';
        derivedSize = 'Standard Patch Size';
        targetFormats = ['DST', 'PDF Proof Sheet', 'Physical Courier Delivery'];
      } else if (selectedService === 'vector') {
        const vecLabels = {
          simple: 'Basic Vector (Text Only)',
          standard: 'Standard Vector (Logo & Mascot)',
          complex: 'Complex Vector (Detailed Artwork)'
        };
        orderPackageName = vecLabels[vectorComplexity] || 'Standard Vector';
        derivedTitle = `${firstFileName} - ${orderPackageName}`;
        isRush = vectorTurnaround === 'rush';
        derivedSize = 'Infinite Scalable Vector';
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
        clientPhone: clientPhone.trim() || null,
        status: 'submitted',
        payment_status: 'pending'
      };

      const created = await createOrder(orderPayload);
      const resultingId = created?.id || `ORD_${Date.now()}`;

      // Store in localStorage for guest order lookups
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
          amount: pricing.total,
          price: pricing.total,
          totalPrice: pricing.total,
          base_price: pricing.subtotal,
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
        maxWidth: '860px',
        margin: '0 auto',
        background: 'var(--color-surface, #ffffff)',
        padding: 'clamp(1.15rem, 3vw, 2.25rem)',
        borderRadius: '24px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box',
        color: 'var(--color-text-primary, #0f172a)'
      }}
    >
      <style>{`
        .bdigi-section-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-muted, #64748b);
          margin-bottom: 0.65rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bdigi-pill-chip {
          padding: 0.48rem 0.85rem;
          border-radius: 9999px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-secondary, #334155);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.16s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          user-select: none;
        }
        .bdigi-pill-chip:hover {
          border-color: #ea580c;
          color: #ea580c;
          background: ${isDark ? 'rgba(234, 88, 12, 0.08)' : '#fffaf5'};
        }
        .bdigi-pill-chip.active {
          border-color: #ea580c;
          background: ${isDark ? 'rgba(234, 88, 12, 0.18)' : '#fff7ed'};
          color: #ea580c;
          box-shadow: 0 1px 4px rgba(234, 88, 12, 0.15);
        }
        .bdigi-input-field {
          width: 100%;
          padding: 0.72rem 0.95rem;
          border-radius: 10px;
          border: 1.5px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.92rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: all 0.18s ease;
        }
        .bdigi-input-field:focus {
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.12);
        }
        .bdigi-tier-card {
          border-radius: 14px;
          border: 1.5px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          padding: 0.9rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          user-select: none;
        }
        .bdigi-tier-card:hover {
          transform: translateY(-2px);
          border-color: #fdba74;
          box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.12);
        }
        .bdigi-tier-card.active {
          border-color: #ea580c;
          background: ${isDark ? 'rgba(234, 88, 12, 0.1)' : '#fffaf5'};
          box-shadow: 0 0 0 2px #ea580c, 0 10px 24px -6px rgba(234, 88, 12, 0.2);
        }
        @media (max-width: 640px) {
          .bdigi-packages-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .bdigi-speed-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 440px) {
          .bdigi-packages-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* 1. TOP SERVICE SELECTOR (Matching User Screenshot) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="bdigi-section-title">
          <span>1. Select What You Need</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {/* Service Card 1: Embroidery Digitizing */}
          <button
            type="button"
            onClick={() => setSelectedService('embroidery')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1rem',
              borderRadius: '16px',
              border: selectedService === 'embroidery' ? '2.5px solid #ea580c' : '1.5px solid var(--color-border, #e2e8f0)',
              background: selectedService === 'embroidery' ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fffaf5') : 'var(--color-surface, #ffffff)',
              boxShadow: selectedService === 'embroidery' ? '0 8px 24px -6px rgba(234, 88, 12, 0.2)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s ease'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: selectedService === 'embroidery' ? '#ea580c' : (isDark ? '#334155' : '#f1f5f9'),
                color: selectedService === 'embroidery' ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Layers size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                  Embroidery Digitizing
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    color: '#ea580c',
                    background: isDark ? 'rgba(234, 88, 12, 0.2)' : '#fff7ed',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #fed7aa',
                    whiteSpace: 'nowrap'
                  }}
                >
                  From $10
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.35 }}>
                Machine stitch files (.DST, .PES, .EMB) for caps, left chest & 3D puff.
              </p>
            </div>
          </button>

          {/* Service Card 2: Custom Patches */}
          <button
            type="button"
            onClick={() => setSelectedService('patch')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1rem',
              borderRadius: '16px',
              border: selectedService === 'patch' ? '2.5px solid #0284c7' : '1.5px solid var(--color-border, #e2e8f0)',
              background: selectedService === 'patch' ? (isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff') : 'var(--color-surface, #ffffff)',
              boxShadow: selectedService === 'patch' ? '0 8px 24px -6px rgba(2, 132, 199, 0.2)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.18s ease'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: selectedService === 'patch' ? '#0284c7' : (isDark ? '#334155' : '#f1f5f9'),
                color: selectedService === 'patch' ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Tag size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
                  Custom Patches
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 900,
                    color: '#0284c7',
                    background: isDark ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #bae6fd',
                    whiteSpace: 'nowrap'
                  }}
                >
                  50 Pcs Min
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.35 }}>
                Embroidered, Woven & PVC patches physically manufactured & shipped.
              </p>
            </div>
          </button>
        </div>

        {/* Discreet Vector Art switch */}
        <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSelectedService(selectedService === 'vector' ? 'embroidery' : 'vector')}
            style={{
              background: 'none',
              border: 'none',
              color: selectedService === 'vector' ? '#7c3aed' : 'var(--color-text-muted, #64748b)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px'
            }}
          >
            {selectedService === 'vector' ? (
              <span>← Switch back to Embroidery Digitizing</span>
            ) : (
              <span>Need logo redraw or vector conversion? <strong style={{ color: '#7c3aed', textDecoration: 'underline' }}>Switch to Vector Art ($15 Flat) →</strong></span>
            )}
          </button>
        </div>
      </div>

      {/* 2. CHOOSE PACKAGE / TIER */}
      {selectedService === 'embroidery' && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="bdigi-section-title">
            <span>2. Choose Package / Complexity Tier</span>
          </div>

          <div
            className="bdigi-packages-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            {/* Simple / Basic */}
            <div
              className={`bdigi-tier-card ${complexity === 'simple' ? 'active' : ''}`}
              onClick={() => setComplexity('simple')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)' }}>
                  Basic
                </span>
                {complexity === 'simple' && (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ margin: '0.35rem 0 0.2rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c' }}>$10</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}> flat</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.25 }}>
                Text & Lettering
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Up to 2.5" • Cap / Chest
              </span>
            </div>

            {/* Medium / Standard - Popular */}
            <div
              className={`bdigi-tier-card ${complexity === 'medium' ? 'active' : ''}`}
              onClick={() => setComplexity('medium')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: '#ea580c',
                    color: '#ffffff',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  Popular
                </span>
                {complexity === 'medium' && (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ margin: '0.35rem 0 0.2rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c' }}>$15</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}> flat</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.25 }}>
                Standard Logo
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Up to 4" • Left Chest
              </span>
            </div>

            {/* Complex / Premium */}
            <div
              className={`bdigi-tier-card ${complexity === 'complex' ? 'active' : ''}`}
              onClick={() => setComplexity('complex')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)' }}>
                  Premium
                </span>
                {complexity === 'complex' && (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ margin: '0.35rem 0 0.2rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c' }}>$25</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}> flat</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.25 }}>
                Complex Artwork
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Up to 7" • Jacket Front
              </span>
            </div>

            {/* Hardcore / 3D Puff */}
            <div
              className={`bdigi-tier-card ${complexity === 'hardcore' ? 'active' : ''}`}
              onClick={() => setComplexity('hardcore')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)' }}>
                  Hardcore
                </span>
                {complexity === 'hardcore' && (
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#ea580c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div style={{ margin: '0.35rem 0 0.2rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c' }}>$35</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}> flat</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', lineHeight: 1.25 }}>
                3D Puff / Jacket Back
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                Up to 12" • Full Back
              </span>
            </div>
          </div>

          {/* Dynamic Package Specs Strip */}
          <div
            style={{
              padding: '0.65rem 0.95rem',
              borderRadius: '10px',
              background: isDark ? 'rgba(234, 88, 12, 0.08)' : '#fffaf5',
              border: '1px solid #fed7aa',
              fontSize: '0.8rem',
              color: 'var(--color-text-secondary, #334155)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <Sparkles size={15} style={{ color: '#ea580c', flexShrink: 0 }} />
            {complexity === 'simple' && (
              <span><strong>Basic Package ($10.00):</strong> Text only, clean lettering, or simple 1–2 color caps. Includes Tajima .DST, Brother .PES & Wilcom .EMB.</span>
            )}
            {complexity === 'medium' && (
              <span><strong>Standard Package ($15.00):</strong> Corporate logos, multi-color monograms, sharp underlay pathing & density balancing. Includes free revisions.</span>
            )}
            {complexity === 'complex' && (
              <span><strong>Premium Package ($25.00):</strong> Complex artwork, intricate gradients, mascots, and high-density jacket front/sleeve designs.</span>
            )}
            {complexity === 'hardcore' && (
              <span><strong>Hardcore / 3D Package ($35.00):</strong> 3D puff foam underlay pathing, high-density full jacket backs (up to 12"), and complex photo conversions.</span>
            )}
          </div>
        </div>
      )}

      {/* 2b. CUSTOM PATCHES PACKAGES */}
      {selectedService === 'patch' && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="bdigi-section-title">
            <span>2. Choose Quantity Batch</span>
          </div>

          <div
            className="bdigi-packages-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            {[
              { tier: '50', pcs: 50, rate: '$3.50', total: '$175', badge: 'Starter Run' },
              { tier: '100', pcs: 100, rate: '$2.50', total: '$250', badge: 'Most Popular' },
              { tier: '250', pcs: 250, rate: '$1.80', total: '$450', badge: 'Wholesale' },
              { tier: '500', pcs: 500, rate: '$1.50', total: '$750', badge: 'Factory Direct' }
            ].map(item => (
              <div
                key={item.tier}
                className={`bdigi-tier-card ${patchQuantityTier === item.tier ? 'active' : ''}`}
                style={{
                  borderColor: patchQuantityTier === item.tier ? '#0284c7' : undefined,
                  background: patchQuantityTier === item.tier ? (isDark ? 'rgba(2, 132, 199, 0.12)' : '#f0f9ff') : undefined
                }}
                onClick={() => setPatchQuantityTier(item.tier)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                    {item.badge}
                  </span>
                  {patchQuantityTier === item.tier && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div style={{ margin: '0.35rem 0 0.15rem' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284c7' }}>{item.pcs} Pcs</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  {item.total} Total
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  ({item.rate} / piece)
                </span>
              </div>
            ))}
          </div>

          {/* Patch Style & Backing selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.35rem' }}>
                Patch Style
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['Embroidered Twill', 'Woven High-Def', 'PVC Rubber 3D', 'Laser Leather'].map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`bdigi-pill-chip ${patchStyle === st ? 'active' : ''}`}
                    onClick={() => setPatchStyle(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.35rem' }}>
                Patch Backing
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['Velcro (Hook & Loop)', 'Heat-Seal Iron-On', 'Plain Sew-On', 'Peel & Stick'].map(bk => (
                  <button
                    key={bk}
                    type="button"
                    className={`bdigi-pill-chip ${patchBacking === bk ? 'active' : ''}`}
                    onClick={() => setPatchBacking(bk)}
                  >
                    {bk}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2c. VECTOR ART PACKAGES */}
      {selectedService === 'vector' && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="bdigi-section-title">
            <span>2. Choose Vector Package</span>
          </div>

          <div
            className="bdigi-packages-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              marginBottom: '0.75rem'
            }}
          >
            {[
              { id: 'simple', title: 'Basic Redraw', price: '$15', desc: 'Simple text, 1–2 colors' },
              { id: 'standard', title: 'Standard Logo', price: '$25', desc: 'Multi-color logo & mascot ★ Popular' },
              { id: 'complex', title: 'Complex Illustration', price: '$45', desc: 'Detailed art, screen print separation' }
            ].map(v => (
              <div
                key={v.id}
                className={`bdigi-tier-card ${vectorComplexity === v.id ? 'active' : ''}`}
                style={{
                  borderColor: vectorComplexity === v.id ? '#7c3aed' : undefined,
                  background: vectorComplexity === v.id ? (isDark ? 'rgba(124, 58, 237, 0.12)' : '#faf5ff') : undefined
                }}
                onClick={() => setVectorComplexity(v.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)' }}>{v.title}</span>
                  {vectorComplexity === v.id && (
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div style={{ margin: '0.35rem 0 0.15rem' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#7c3aed' }}>{v.price}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}> flat</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b' }}>{v.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.4rem' }}>
              Vector Deliverables:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {[
                { id: 'all', label: '★ All Formats (.AI, .EPS, .SVG, .PDF & High-Res PNG)' },
                { id: 'ai', label: 'Adobe Illustrator (.AI)' },
                { id: 'svg', label: 'Scalable Vector (.SVG)' },
                { id: 'pdf', label: 'Vector PDF' }
              ].map(vf => (
                <button
                  key={vf.id}
                  type="button"
                  className={`bdigi-pill-chip ${vectorFormat === vf.id ? 'active' : ''}`}
                  onClick={() => setVectorFormat(vf.id)}
                >
                  {vf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MACHINE FILE FORMAT & PLACEMENT (Embroidery specific) */}
      {selectedService === 'embroidery' && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="bdigi-section-title">
            <span>3. Machine Formats & Placement</span>
          </div>

          {/* Formats row */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.4rem' }}>
              Machine File Format:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {[
                { id: 'all', label: '★ All Formats (.DST, .PES, .EMB + PDF Spec Sheet)' },
                { id: 'dst', label: 'Tajima (.DST)' },
                { id: 'pes', label: 'Brother (.PES)' },
                { id: 'emb', label: 'Wilcom (.EMB)' },
                { id: 'exp', label: 'Melco (.EXP)' },
                { id: 'jef', label: 'Janome (.JEF)' }
              ].map(fmt => (
                <button
                  key={fmt.id}
                  type="button"
                  className={`bdigi-pill-chip ${fileFormat === fmt.id ? 'active' : ''}`}
                  onClick={() => setFileFormat(fmt.id)}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placement & Size row */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.4rem' }}>
              Target Placement & Size:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
              {[
                { id: 'cap', label: '🧢 Cap / Hat (2.5")' },
                { id: 'left-chest', label: '👕 Left Chest (3.5" - 4")' },
                { id: 'sleeve', label: '🧥 Sleeve / Front (7")' },
                { id: 'jacket-back', label: '🦅 Full Jacket Back (12")' },
                { id: 'custom', label: '📏 Custom Dimensions' }
              ].map(sz => (
                <button
                  key={sz.id}
                  type="button"
                  className={`bdigi-pill-chip ${sizeOption === sz.id ? 'active' : ''}`}
                  onClick={() => setSizeOption(sz.id)}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            {sizeOption === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
                <input
                  type="text"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="Width"
                  className="bdigi-input-field"
                  style={{ maxWidth: '100px', textAlign: 'center' }}
                />
                <span style={{ color: '#94a3b8', fontWeight: 900 }}>×</span>
                <input
                  type="text"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  placeholder="Height"
                  className="bdigi-input-field"
                  style={{ maxWidth: '100px', textAlign: 'center' }}
                />
                <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 700 }}>Inches</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TURNAROUND SPEED */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="bdigi-section-title">
          <span>{selectedService === 'embroidery' ? '4. Turnaround Speed' : '3. Turnaround Speed'}</span>
        </div>

        <div className="bdigi-speed-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Standard */}
          <div
            className={`bdigi-tier-card ${(selectedService === 'patch' ? patchTurnaround === 'standard' : (selectedService === 'vector' ? vectorTurnaround === 'standard' : turnaround === 'standard')) ? 'active' : ''}`}
            onClick={() => {
              if (selectedService === 'patch') setPatchTurnaround('standard');
              else if (selectedService === 'vector') setVectorTurnaround('standard');
              else setTurnaround('standard');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} style={{ color: '#059669' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  Standard Production
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                FREE
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              {selectedService === 'patch' ? '5–7 Days Production with Free Air Courier Delivery.' : 'Delivered in 4–12 Hours with full stitch inspection.'}
            </p>
          </div>

          {/* Express Rush */}
          <div
            className={`bdigi-tier-card ${(selectedService === 'patch' ? patchTurnaround === 'rush' : (selectedService === 'vector' ? vectorTurnaround === 'rush' : turnaround === 'rush')) ? 'active' : ''}`}
            onClick={() => {
              if (selectedService === 'patch') setPatchTurnaround('rush');
              else if (selectedService === 'vector') setVectorTurnaround('rush');
              else setTurnaround('rush');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Zap size={16} style={{ color: '#ea580c' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                  ⚡ Express Priority Rush
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#ea580c', background: '#fff7ed', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #fed7aa' }}>
                {selectedService === 'patch' ? '+$25.00' : '+$10.00'}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.76rem', color: '#64748b' }}>
              {selectedService === 'patch' ? '3–4 Days Fast-Track Factory Production.' : 'Front-of-queue priority delivery in 2–4 Hours.'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. UPLOAD ARTWORK DROPZONE (Matching User Screenshot media_1791534943321_9fbfe32f.png) */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="bdigi-section-title">
          <span>{selectedService === 'embroidery' ? '5. Upload Design / Logo File' : '4. Upload Design / Logo File'}</span>
          <span style={{ color: '#ef4444' }}>*</span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? '2px dashed #ea580c' : '2px dashed var(--color-border, #cbd5e1)',
            borderRadius: '16px',
            background: isDragOver ? (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : (isDark ? '#1e293b' : '#f8fafc'),
            padding: '1.75rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
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

          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: '#fff7ed',
              color: '#ea580c',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.15)'
            }}
          >
            <Upload size={24} />
          </div>

          <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)', marginBottom: '0.25rem' }}>
            Click or Drag & Drop Artwork File Here
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>
            Supports JPG, PNG, PDF, AI, EPS, SVG, DST, PES, EMB (Max 50MB per file)
          </div>

          {isUploading && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', color: '#ea580c', fontSize: '0.84rem', fontWeight: 700 }}>
              <Loader2 size={16} className="animate-spin" /> Uploading to secure studio server...
            </div>
          )}
        </div>

        {/* Uploaded File List Badges */}
        {uploadedFiles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
            {uploadedFiles.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: '#ecfdf5',
                  color: '#065f46',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #a7f3d0'
                }}
              >
                <Check size={14} style={{ color: '#059669' }} />
                <span>{f.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#047857' }}>({Math.round((f.size || 0) / 1024)} KB)</span>
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
                    padding: '0 0 0 0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Remove file"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.45rem' }}>
            <AlertCircle size={14} /> {uploadError}
          </div>
        )}
      </div>

      {/* 6. ADDITIONAL INSTRUCTIONS / FABRIC TYPE */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="bdigi-section-title">
          <span>{selectedService === 'embroidery' ? '6. Fabric Type & Stitch Notes' : '5. Additional Project Notes'}</span>
        </div>
        <textarea
          rows={2}
          value={additionalDetails}
          onChange={(e) => setAdditionalDetails(e.target.value)}
          placeholder={
            selectedService === 'embroidery'
              ? 'Specify fabric type (e.g. Pique Polo, Twill Cap, Fleece Hoodie, Leather, Nylon), thread colors, or any notes...'
              : 'Specify dimensions, color codes, custom shape, or any instructions...'
          }
          className="bdigi-input-field"
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* 7. DELIVER FILES TO (CONTACT DETAILS FOR INSTANT FILE DELIVERY) */}
      <div
        style={{
          marginBottom: '1.75rem',
          padding: '1.15rem',
          borderRadius: '16px',
          background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
          border: '1.5px solid var(--color-border, #e2e8f0)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
          <Lock size={15} style={{ color: '#059669' }} />
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
            Deliver Machine Files & Proof Sheet To:
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Your Name or Business"
              className="bdigi-input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
              Email Address (For file delivery) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="you@example.com"
              className="bdigi-input-field"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
              WhatsApp / Phone (Optional for proof alert)
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="bdigi-input-field"
            />
          </div>
        </div>

        {contactError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.65rem' }}>
            <AlertCircle size={14} /> {contactError}
          </div>
        )}
      </div>

      {/* 8. BOTTOM SUMMARY & CHECKOUT BUTTON */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '1.25rem',
          borderTop: '2px solid var(--color-border, #e2e8f0)',
          flexWrap: 'wrap'
        }}
      >
        {selectedService !== 'patch' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Quantity Stepper */}
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
                  width: '36px',
                  height: '42px',
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
              <span style={{ width: '32px', textAlign: 'center', fontSize: '1rem', fontWeight: 900 }}>
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  width: '36px',
                  height: '42px',
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
                Total Due:
              </span>
              <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#ea580c', lineHeight: 1 }}>
                ${pricing.total.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
              Batch Total ({pricing.patchPieces} Patches):
            </span>
            <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0284c7', lineHeight: 1 }}>
              ${pricing.total.toFixed(2)}
            </span>
          </div>
        )}

        <button
          type="button"
          disabled={isSubmitting || isUploading}
          onClick={handleFinalSubmitOrder}
          style={{
            flex: '1 1 240px',
            height: '48px',
            padding: '0 1.75rem',
            borderRadius: '12px',
            border: 'none',
            background: selectedService === 'patch'
              ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
              : selectedService === 'vector'
                ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 900,
            cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 18px rgba(234, 88, 12, 0.25)',
            transition: 'all 0.18s ease'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Submitting Order...
            </>
          ) : (
            <>
              <Lock size={16} /> Place Order & Pay (${pricing.total.toFixed(2)})
            </>
          )}
        </button>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '0.85rem',
          fontSize: '0.74rem',
          color: 'var(--color-text-muted, #64748b)',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.65rem',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <Lock size={12} style={{ color: '#059669' }} /> 256-Bit SSL Encrypted
        </span>
        <span>•</span>
        <span>Instant Stripe Checkout</span>
        <span>•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <ShieldCheck size={12} style={{ color: '#059669' }} /> 100% Free Revisions
        </span>
      </div>
    </div>
  );
};

export default StreamlinedOrderFlow;
