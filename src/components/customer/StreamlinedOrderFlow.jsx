'use client';

import React, { useState, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
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
  ShieldCheck
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

  // 1. EMBROIDERY FIELDS (Dropdown values)
  const [fileFormat, setFileFormat] = useState('all');
  const [sizeOption, setSizeOption] = useState('left-chest');
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('3.5');
  const [turnaround, setTurnaround] = useState('standard'); // standard (free), rush (+$10)
  const [complexity, setComplexity] = useState('medium'); // simple ($10), medium ($15) [default], complex ($25), hardcore ($35)

  // 2. PATCH FIELDS (Dropdown values)
  const [patchStyle, setPatchStyle] = useState('Embroidered Twill');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const [patchQuantityTier, setPatchQuantityTier] = useState('100'); // 50, 100 [popular], 250, 500
  const [patchTurnaround, setPatchTurnaround] = useState('standard'); // standard (free), rush (+$25)

  // 3. VECTOR FIELDS (Dropdown values)
  const [vectorFormat, setVectorFormat] = useState('all');
  const [vectorComplexity, setVectorComplexity] = useState('standard'); // simple ($15), standard ($25), complex ($45)
  const [vectorTurnaround, setVectorTurnaround] = useState('standard'); // standard (free), rush (+$10)

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

  // Helper Labels for Summary
  const getComplexityLabel = () => {
    if (selectedService === 'embroidery') {
      if (complexity === 'simple') return 'Simple ($10)';
      if (complexity === 'medium') return 'Medium ($15)';
      if (complexity === 'complex') return 'Complex ($25)';
      return '3D Puff / Back ($35)';
    }
    if (selectedService === 'patch') {
      return `${patchQuantityTier} Pcs (${patchStyle})`;
    }
    if (selectedService === 'vector') {
      if (vectorComplexity === 'simple') return 'Simple ($15)';
      if (vectorComplexity === 'standard') return 'Standard ($25)';
      return 'Complex ($45)';
    }
    return 'Standard';
  };

  const getSizeLabel = () => {
    if (selectedService === 'embroidery') {
      if (sizeOption === 'custom') return `${customWidth}" × ${customHeight}"`;
      if (sizeOption === 'cap') return 'Cap (2.5")';
      if (sizeOption === 'sleeve') return 'Sleeve (7")';
      if (sizeOption === 'jacket-back') return 'Jacket Back (12")';
      return 'Left Chest (4")';
    }
    if (selectedService === 'patch') return 'Standard';
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
      setUploadError('Please choose or upload your design file.');
      return;
    }

    const cleanEmail = (clientEmail || '').toLowerCase().trim();
    const cleanName = (clientName || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setContactError('Please enter a valid email address to receive your files.');
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
          simple: 'Simple (Text Only)',
          medium: 'Medium (Monogram / Logo)',
          complex: 'Complex (Detail Work)',
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
          simple: 'Simple Vector (Text Only)',
          standard: 'Standard Vector (Logo / Mascot)',
          complex: 'Complex Vector (Detailed Art)'
        };
        orderPackageName = vecLabels[vectorComplexity] || 'Standard Vector';
        derivedTitle = `${firstFileName} - ${orderPackageName}`;
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
        clientPhone: clientPhone.trim() || null,
        status: 'submitted',
        payment_status: 'pending'
      };

      const created = await createOrder(orderPayload);
      const resultingId = created?.id || `ORD_${Date.now()}`;

      // Save order ID to localStorage for guest tracking
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="Width"
                        className="bdigi-input"
                        style={{ maxWidth: '90px', textAlign: 'center' }}
                      />
                      <span style={{ color: '#94a3b8', fontWeight: 900 }}>×</span>
                      <input
                        type="text"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        placeholder="Height"
                        className="bdigi-input"
                        style={{ maxWidth: '90px', textAlign: 'center' }}
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

              {/* Complexity Dropdown */}
              <div className="bdigi-form-row">
                <label className="bdigi-label">Complexity</label>
                <div className="bdigi-select-wrapper">
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    className="bdigi-select"
                  >
                    <option value="simple">Simple ($10)</option>
                    <option value="medium">Medium / Logo ($15)</option>
                    <option value="complex">Complex ($25)</option>
                    <option value="hardcore">3D Puff / Back ($35)</option>
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

              {/* Quantity Batch */}
              <div className="bdigi-form-row">
                <label className="bdigi-label">Quantity</label>
                <div className="bdigi-select-wrapper">
                  <select
                    value={patchQuantityTier}
                    onChange={(e) => setPatchQuantityTier(e.target.value)}
                    className="bdigi-select"
                  >
                    <option value="50">50 Pcs ($3.50/pc — $175)</option>
                    <option value="100">100 Pcs ($2.50/pc — $250)</option>
                    <option value="250">250 Pcs ($1.80/pc — $450)</option>
                    <option value="500">500 Pcs ($1.50/pc — $750)</option>
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
              {/* Vector Complexity */}
              <div className="bdigi-form-row">
                <label className="bdigi-label">Complexity</label>
                <div className="bdigi-select-wrapper">
                  <select
                    value={vectorComplexity}
                    onChange={(e) => setVectorComplexity(e.target.value)}
                    className="bdigi-select"
                  >
                    <option value="simple">Simple ($15)</option>
                    <option value="standard">Standard Logo ($25)</option>
                    <option value="complex">Complex Art ($45)</option>
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
          <div className="bdigi-form-row" style={{ alignItems: 'flex-start' }}>
            <label className="bdigi-label" style={{ paddingTop: '0.45rem' }}>
              Upload Files<span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed #ea580c' : '1.5px dashed var(--color-border, #cbd5e1)',
                  borderRadius: '10px',
                  background: isDragOver ? (isDark ? 'rgba(234, 88, 12, 0.12)' : '#fff7ed') : (isDark ? '#1e293b' : '#f8fafc'),
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.16s ease',
                  gap: '0.75rem'
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
                      background: '#fff7ed',
                      color: '#ea580c',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Upload size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
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
                    color: '#ea580c',
                    background: '#fff7ed',
                    border: '1px solid #fed7aa',
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

              {uploadError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.4rem' }}>
                  <AlertCircle size={13} /> {uploadError}
                </div>
              )}
            </div>
          </div>

          {/* CONTACT DETAILS */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.1rem', borderTop: '1px dashed var(--color-border, #cbd5e1)' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.65rem' }}>
              Contact Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                  Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Your Name"
                  className="bdigi-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                  Email <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bdigi-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-text-muted, #64748b)', marginBottom: '0.25rem' }}>
                  WhatsApp (Optional)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="bdigi-input"
                />
              </div>
            </div>

            {contactError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, marginTop: '0.4rem' }}>
                <AlertCircle size={13} /> {contactError}
              </div>
            )}
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
                Instant Quote
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
                <span>Tier:</span>
                <strong style={{ color: 'var(--color-text-primary, #0f172a)' }}>{getComplexityLabel()}</strong>
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
    </div>
  );
};

export default StreamlinedOrderFlow;
