'use client';

import React, { useState, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  Loader2,
  AlertCircle
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
  const [complexity, setComplexity] = useState('simple'); // simple ($10), medium ($15), complex ($25), hardcore ($35)
  const [fileFormat, setFileFormat] = useState('all');
  const [sizeOption, setSizeOption] = useState('cap');
  const [customWidth, setCustomWidth] = useState('3.5');
  const [customHeight, setCustomHeight] = useState('3.5');
  const [turnaround, setTurnaround] = useState('standard'); // standard (free), rush (+$10)

  // 2. PATCH FIELDS
  const [patchStyle, setPatchStyle] = useState('Embroidered Twill');
  const [patchBacking, setPatchBacking] = useState('Velcro (Hook & Loop)');
  const [patchQuantityTier, setPatchQuantityTier] = useState('50'); // 50 ($3.50/pc), 100 ($2.50/pc), 250 ($1.80/pc), 500 ($1.50/pc)
  const [patchTurnaround, setPatchTurnaround] = useState('standard'); // standard (free), rush (+$25)

  // 3. VECTOR FIELDS
  const [vectorComplexity, setVectorComplexity] = useState('simple'); // simple ($15), medium ($25), complex ($45)
  const [vectorTurnaround, setVectorTurnaround] = useState('standard'); // standard (free), rush (+$10)
  const [vectorFormat, setVectorFormat] = useState('all');

  // Universal fields
  const [quantity, setQuantity] = useState(1);
  const [additionalDetails, setAdditionalDetails] = useState('');

  // Artwork Uploads
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
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
    let unitBase = 10;
    let rushFee = 0;
    let orderQty = Math.max(1, quantity);

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
      let perPieceRate = 3.50;
      let minPieces = 50;
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
      else if (vectorComplexity === 'medium') unitBase = 25;
      else if (vectorComplexity === 'complex') unitBase = 45;

      if (vectorTurnaround === 'rush') rushFee = 10;
      return {
        unitPrice: unitBase,
        subtotal: unitBase * orderQty,
        rush: rushFee,
        total: (unitBase * orderQty) + rushFee
      };
    }

    return { unitPrice: 10, subtotal: 10, rush: 0, total: 10 };
  };

  const pricing = calculatePricing();

  // File Upload Handler
  const handleFilesChosen = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError('');
    setIsUploading(true);

    const uploadedList = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds 50MB limit.`);
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

  const handleRemoveFile = (idx) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Order and Launch Stripe Checkout
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
      let derivedSize = 'Cap / Hat (Up to 2.5")';

      if (selectedService === 'embroidery') {
        const compLabels = {
          simple: 'Simple (Text Only)',
          medium: 'Medium (Monogram)',
          complex: 'Complex (Detail Work)',
          hardcore: 'Hardcore (Live Image / 3D)'
        };
        orderPackageName = compLabels[complexity] || 'Standard';
        derivedTitle = `${firstFileName} - ${orderPackageName}`;
        isRush = turnaround === 'rush';
        if (sizeOption === 'custom') {
          derivedSize = `${customWidth}" × ${customHeight}" (Custom)`;
        } else if (sizeOption === 'left-chest') {
          derivedSize = 'Left Chest (Up to 4")';
        } else if (sizeOption === 'sleeve') {
          derivedSize = 'Jacket Front / Sleeve (Up to 7")';
        } else if (sizeOption === 'jacket-back') {
          derivedSize = 'Full Jacket Back (Up to 12")';
        }
        if (fileFormat === 'dst') targetFormats = ['DST', 'PDF'];
        else if (fileFormat === 'pes') targetFormats = ['PES', 'PDF'];
        else if (fileFormat === 'emb') targetFormats = ['EMB', 'PDF'];
      } else if (selectedService === 'patch') {
        derivedTitle = `${patchStyle} Patches (${pricing.patchPieces} Pcs)`;
        orderPackageName = `${patchStyle} (${pricing.patchPieces} Pcs)`;
        isRush = patchTurnaround === 'rush';
        derivedSize = 'Standard Patch Size';
        targetFormats = ['DST', 'PDF Proof', 'Physical Shipment'];
      } else if (selectedService === 'vector') {
        const vecLabels = {
          simple: 'Simple Vector (Text Only)',
          medium: 'Medium Vector (Logo / Mascot)',
          complex: 'Complex Vector (Detailed Art)'
        };
        orderPackageName = vecLabels[vectorComplexity] || 'Standard';
        derivedTitle = `${firstFileName} - ${orderPackageName}`;
        isRush = vectorTurnaround === 'rush';
        derivedSize = 'Scalable Vector';
        targetFormats = ['AI', 'EPS', 'SVG', 'PDF'];
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
        maxWidth: '720px',
        margin: '0 auto',
        background: 'var(--color-surface, #ffffff)',
        padding: 'clamp(1rem, 2.5vw, 1.75rem)',
        borderRadius: '16px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        .order-field-row {
          display: grid;
          grid-template-columns: 140px 1fr;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.1rem;
        }
        @media (max-width: 580px) {
          .order-field-row {
            grid-template-columns: 1fr;
            gap: 0.35rem;
            margin-bottom: 0.95rem;
          }
        }
        .order-field-label {
          font-size: 0.92rem;
          font-weight: 800;
          color: var(--color-text-primary, #0f172a);
        }
        .order-field-select, .order-field-input, .order-field-textarea {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          border: 1px solid var(--color-border, #cbd5e1);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-primary, #0f172a);
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .order-field-select:focus, .order-field-input:focus, .order-field-textarea:focus {
          border-color: #ea580c;
        }
      `}</style>

      {/* SERVICE SELECTOR TABS */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.4rem',
          borderBottom: '1.5px solid var(--color-border, #e2e8f0)',
          paddingBottom: '0.85rem',
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedService('embroidery')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: selectedService === 'embroidery' ? '2px solid #ea580c' : '1px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'embroidery' ? (isDark ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') : 'transparent',
            color: selectedService === 'embroidery' ? '#ea580c' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🧵 Embroidery Digitizing
        </button>

        <button
          type="button"
          onClick={() => setSelectedService('patch')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: selectedService === 'patch' ? '2px solid #0284c7' : '1px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'patch' ? (isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff') : 'transparent',
            color: selectedService === 'patch' ? '#0284c7' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🏷️ Custom Patches
        </button>

        <button
          type="button"
          onClick={() => setSelectedService('vector')}
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: selectedService === 'vector' ? '2px solid #7c3aed' : '1px solid var(--color-border, #cbd5e1)',
            background: selectedService === 'vector' ? (isDark ? 'rgba(124, 58, 237, 0.15)' : '#faf5ff') : 'transparent',
            color: selectedService === 'vector' ? '#7c3aed' : 'var(--color-text-secondary, #475569)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          📐 Vector Art ($15)
        </button>
      </div>

      {/* EMBROIDERY DIGITIZING CLEAN FORM */}
      {selectedService === 'embroidery' && (
        <div>
          {/* Complexity Dropdown */}
          <div className="order-field-row">
            <label className="order-field-label">Complexity</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value)}
              className="order-field-select"
            >
              <option value="simple">Simple (Text Only) - $10.00</option>
              <option value="medium">Medium (Monogram / Small Logo) - $15.00</option>
              <option value="complex">Complex (Detail Work) - $25.00</option>
              <option value="hardcore">Hardcore ( Live Image / Full Back / 3D Puff ) - $35.00</option>
            </select>
          </div>

          {/* File Format Dropdown */}
          <div className="order-field-row">
            <label className="order-field-label">File Format</label>
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value)}
              className="order-field-select"
            >
              <option value="all">All Formats (.DST, .PES, .EMB, .PDF Spec Sheet) [Recommended]</option>
              <option value="dst">Tajima (.DST)</option>
              <option value="pes">Brother (.PES)</option>
              <option value="emb">Wilcom (.EMB)</option>
              <option value="jef">Janome (.JEF)</option>
              <option value="exp">Melco / Bernina (.EXP)</option>
              <option value="pdf">Print / Spec Sheet PDF</option>
            </select>
          </div>

          {/* Size Dropdown */}
          <div className="order-field-row">
            <label className="order-field-label">Size</label>
            <div>
              <select
                value={sizeOption}
                onChange={(e) => setSizeOption(e.target.value)}
                className="order-field-select"
              >
                <option value="cap">Cap / Hat (Up to 2.5" / 6.5cm)</option>
                <option value="left-chest">Left Chest (Up to 4" / 10cm)</option>
                <option value="sleeve">Jacket Front / Sleeve (Up to 7" / 18cm)</option>
                <option value="jacket-back">Full Jacket Back (Up to 12" / 30cm)</option>
                <option value="custom">Custom Size (Enter dimensions below)</option>
              </select>

              {sizeOption === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem' }}>
                  <input
                    type="text"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="Width"
                    className="order-field-input"
                    style={{ maxWidth: '100px' }}
                  />
                  <span style={{ color: '#94a3b8', fontWeight: 700 }}>×</span>
                  <input
                    type="text"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="Height"
                    className="order-field-input"
                    style={{ maxWidth: '100px' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Inches</span>
                </div>
              )}
            </div>
          </div>

          {/* Turnaround Dropdown */}
          <div className="order-field-row">
            <label className="order-field-label">Turnaround</label>
            <select
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              className="order-field-select"
            >
              <option value="standard">Standard (4–12 Hours)</option>
              <option value="rush">Express Rush (2–4 Hours) (+ $10.00)</option>
            </select>
          </div>

          {/* Additional Details Textarea */}
          <div className="order-field-row" style={{ alignItems: 'start' }}>
            <label className="order-field-label" style={{ paddingTop: '0.5rem' }}>Additional Details</label>
            <textarea
              rows={2}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Write fabric type (Cotton polo, Structured cap, Fleece, Leather), thread colors or instructions..."
              className="order-field-textarea"
            />
          </div>
        </div>
      )}

      {/* CUSTOM PATCHES CLEAN FORM */}
      {selectedService === 'patch' && (
        <div>
          {/* Patch Style */}
          <div className="order-field-row">
            <label className="order-field-label">Patch Style</label>
            <select
              value={patchStyle}
              onChange={(e) => setPatchStyle(e.target.value)}
              className="order-field-select"
            >
              <option value="Embroidered Twill">Embroidered Twill (Classic Textured)</option>
              <option value="Woven High-Def">Woven High-Definition (Ultra Sharp Micro-Details)</option>
              <option value="PVC Rubber 3D">PVC Rubber 3D (Waterproof Outdoor)</option>
              <option value="Leather Engraved">Leather / Faux Leather (Laser Engraved)</option>
            </select>
          </div>

          {/* Patch Backing */}
          <div className="order-field-row">
            <label className="order-field-label">Patch Backing</label>
            <select
              value={patchBacking}
              onChange={(e) => setPatchBacking(e.target.value)}
              className="order-field-select"
            >
              <option value="Velcro (Hook & Loop)">Velcro (Hook & Loop)</option>
              <option value="Heat-Seal Iron-On">Heat-Seal Iron-On</option>
              <option value="Plain Sew-On">Plain Sew-On</option>
              <option value="Peel & Stick Adhesive">Peel & Stick Adhesive</option>
            </select>
          </div>

          {/* Quantity Batch */}
          <div className="order-field-row">
            <label className="order-field-label">Quantity</label>
            <select
              value={patchQuantityTier}
              onChange={(e) => setPatchQuantityTier(e.target.value)}
              className="order-field-select"
            >
              <option value="50">50 Pieces - Starter Run ($3.50/pc - $175 Total)</option>
              <option value="100">100 Pieces - Production Batch ($2.50/pc - $250 Total) [Popular]</option>
              <option value="250">250 Pieces - Wholesale Batch ($1.80/pc - $450 Total)</option>
              <option value="500">500 Pieces - Factory Direct ($1.50/pc - $750 Total)</option>
            </select>
          </div>

          {/* Patch Turnaround */}
          <div className="order-field-row">
            <label className="order-field-label">Turnaround</label>
            <select
              value={patchTurnaround}
              onChange={(e) => setPatchTurnaround(e.target.value)}
              className="order-field-select"
            >
              <option value="standard">Standard Production (5–7 Days) - Free Air Delivery</option>
              <option value="rush">Priority Express Rush (3–4 Days) (+ $25.00)</option>
            </select>
          </div>

          {/* Patch Additional Details */}
          <div className="order-field-row" style={{ alignItems: 'start' }}>
            <label className="order-field-label" style={{ paddingTop: '0.5rem' }}>Additional Details</label>
            <textarea
              rows={2}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Specify custom shape, border type (Merrowed or Laser cut), patch dimensions, notes..."
              className="order-field-textarea"
            />
          </div>
        </div>
      )}

      {/* VECTOR ART CLEAN FORM */}
      {selectedService === 'vector' && (
        <div>
          {/* Vector Complexity */}
          <div className="order-field-row">
            <label className="order-field-label">Complexity</label>
            <select
              value={vectorComplexity}
              onChange={(e) => setVectorComplexity(e.target.value)}
              className="order-field-select"
            >
              <option value="simple">Simple (Text Only / Basic Line Art) - $15.00</option>
              <option value="medium">Medium (Multi-Color Logo / Mascot) - $25.00</option>
              <option value="complex">Complex (Detailed Illustration / Artwork) - $45.00</option>
            </select>
          </div>

          {/* Vector Deliverables */}
          <div className="order-field-row">
            <label className="order-field-label">File Format</label>
            <select
              value={vectorFormat}
              onChange={(e) => setVectorFormat(e.target.value)}
              className="order-field-select"
            >
              <option value="all">Master Suite (.AI, .EPS, .SVG, .PDF & High-Res PNG)</option>
              <option value="ai">Adobe Illustrator (.AI)</option>
              <option value="svg">Scalable Vector Graphics (.SVG)</option>
              <option value="pdf">Vector Print PDF</option>
            </select>
          </div>

          {/* Vector Turnaround */}
          <div className="order-field-row">
            <label className="order-field-label">Turnaround</label>
            <select
              value={vectorTurnaround}
              onChange={(e) => setVectorTurnaround(e.target.value)}
              className="order-field-select"
            >
              <option value="standard">Standard (6–12 Hours)</option>
              <option value="rush">Express Rush (2–4 Hours) (+ $10.00)</option>
            </select>
          </div>

          {/* Additional Details */}
          <div className="order-field-row" style={{ alignItems: 'start' }}>
            <label className="order-field-label" style={{ paddingTop: '0.5rem' }}>Additional Details</label>
            <textarea
              rows={2}
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Pantone color codes, font names, layer separations or vinyl cutting notes..."
              className="order-field-textarea"
            />
          </div>
        </div>
      )}

      {/* UNIVERSAL: UPLOAD DESIGN FILES */}
      <div className="order-field-row" style={{ alignItems: 'start', marginTop: '0.4rem' }}>
        <label className="order-field-label" style={{ paddingTop: '0.35rem' }}>
          Upload Design Files<span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.eps,.svg,.dst,.pes,.emb"
            onChange={handleFilesChosen}
            className="order-field-input"
            style={{ padding: '0.45rem', fontSize: '0.82rem' }}
          />

          {isUploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', color: '#ea580c', fontSize: '0.8rem', fontWeight: 700 }}>
              <Loader2 size={14} className="animate-spin" /> Uploading file...
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem' }}>
              {uploadedFiles.map((f, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#065f46',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '5px',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  ✓ {f.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontWeight: 900 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {uploadError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontSize: '0.76rem', fontWeight: 700, marginTop: '0.35rem' }}>
              <AlertCircle size={13} /> {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* DELIVER FILES TO (CLIENT CONTACT FOR GUEST DELIVERY) */}
      <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--color-border, #cbd5e1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.65rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.25rem' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Your Name / Business"
              className="order-field-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.25rem' }}>
              Email Address (To receive files) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="your@email.com"
              className="order-field-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-secondary, #475569)', marginBottom: '0.25rem' }}>
              WhatsApp / Phone (Optional)
            </label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="order-field-input"
            />
          </div>
        </div>

        {contactError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <AlertCircle size={13} /> {contactError}
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR (QUANTITY & PLACE ORDER BUTTON) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1.5px solid var(--color-border, #e2e8f0)',
          flexWrap: 'wrap'
        }}
      >
        {selectedService !== 'patch' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '60px',
                height: '46px',
                textAlign: 'center',
                borderRadius: '8px',
                border: '1.5px solid var(--color-border, #cbd5e1)',
                background: 'var(--color-surface, #ffffff)',
                color: 'var(--color-text-primary, #0f172a)',
                fontSize: '1.05rem',
                fontWeight: 900
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>Total Due:</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c' }}>${pricing.total.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 700 }}>
              Batch Total ({pricing.patchPieces} Patches):
            </span>
            <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0284c7' }}>${pricing.total.toFixed(2)}</span>
          </div>
        )}

        <button
          type="button"
          disabled={isSubmitting || isUploading}
          onClick={handleFinalSubmitOrder}
          style={{
            flex: '1 1 220px',
            height: '46px',
            padding: '0 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: selectedService === 'patch' ? '#0284c7' : '#ea580c',
            color: '#ffffff',
            fontSize: '0.96rem',
            fontWeight: 900,
            cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            transition: 'opacity 0.15s ease'
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Processing Order...
            </>
          ) : (
            <>
              Place Order & Pay (${pricing.total.toFixed(2)})
            </>
          )}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '0.65rem', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
        🔒 256-Bit SSL Encrypted • Instant Stripe Checkout • Free Revisions
      </div>
    </div>
  );
};

export default StreamlinedOrderFlow;
