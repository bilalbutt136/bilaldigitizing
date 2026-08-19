'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { 
  X, 
  Upload, 
  Layers, 
  PenTool, 
  Package, 
  Clock, 
  Zap, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Loader2, 
  Image as ImageIcon,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

const SERVICES = [
  {
    id: 'embroidery',
    title: 'Embroidery Digitizing',
    desc: 'DST, PES, EMB files for Tajima, Brother, Barudan & all machines.',
    icon: Layers,
    basePrice: 15,
    formats: ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'PDF Worksheet'],
    defaultFormat: 'DST',
    etaStandard: '12-24 Hours',
    etaRush: '4-8 Hours Express'
  },
  {
    id: 'vector',
    title: 'Vector Art Tracing',
    desc: 'High-res vector conversion for screen printing, vinyl & engraving.',
    icon: PenTool,
    basePrice: 12,
    formats: ['AI', 'EPS', 'PDF', 'SVG', 'CDR', 'High-Res PNG'],
    defaultFormat: 'AI',
    etaStandard: '12-24 Hours',
    etaRush: '4-8 Hours Express'
  },
  {
    id: 'patch',
    title: 'Custom Physical Patches',
    desc: 'Embroidered, PVC, Woven & Leather patches with velcro or iron-on.',
    icon: Package,
    basePrice: 45,
    formats: ['Pre-production Proof', 'DST', 'High-Res Preview'],
    defaultFormat: 'Pre-production Proof',
    etaStandard: '5-7 Business Days',
    etaRush: '3-4 Days Express'
  }
];

export const MobileSimpleOrderModal = ({ isOpen, onClose, defaultService = 'embroidery', onOrderCreated }) => {
  const { 
    createOrder, 
    authUser, 
    currentUser, 
    showToast, 
    setSelectedOrderForDrawer,
    setIsCheckoutModalOpen,
    setCheckoutSession
  } = useAppState();

  const [step, setStep] = useState(1); // 1: Service, 2: Upload, 3: Requirements, 4: Review, 5: Confirmation
  const [selectedService, setSelectedService] = useState(defaultService);
  const [orderTitle, setOrderTitle] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES']);
  const [placement, setPlacement] = useState('Left Chest / Polo (up to 4.0")');
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [notes, setNotes] = useState('');
  
  // File Upload State
  const [uploadedArtwork, setUploadedArtwork] = useState(null); // { url, name, size, public_id }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderObj, setCreatedOrderObj] = useState(null);

  const fileInputRef = useRef(null);

  const activeServiceObj = SERVICES.find(s => s.id === selectedService) || SERVICES[0];

  useEffect(() => {
    if (defaultService) {
      setSelectedService(defaultService);
      const svc = SERVICES.find(s => s.id === defaultService);
      if (svc) {
        setSelectedFormats(svc.id === 'vector' ? ['AI', 'PDF', 'SVG'] : ['DST', 'PES', 'EMB']);
      }
    }
  }, [defaultService]);

  if (!isOpen) return null;

  // Calculate Price
  const basePrice = activeServiceObj.basePrice;
  const rushFee = isRush ? 10 : 0;
  const totalPrice = basePrice + rushFee;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds 50MB. Please choose a smaller image or compressed archive.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(15);

    try {
      // Auto-set title from filename if empty
      if (!orderTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setOrderTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      setUploadProgress(45);
      const result = await uploadFileToCloudinaryFull(file);
      setUploadProgress(100);

      if (result && (result.url || result.secure_url)) {
        setUploadedArtwork({
          url: result.secure_url || result.url,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          format: file.name.split('.').pop()?.toUpperCase() || 'FILE',
          public_id: result.public_id || null
        });
      } else {
        throw new Error('Upload server did not return a valid URL.');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
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

  const handleSubmitOrder = async () => {
    if (!orderTitle.trim()) {
      setOrderTitle(uploadedArtwork?.name?.replace(/\.[^/.]+$/, '') || `${activeServiceObj.title} Job`);
    }

    setIsSubmitting(true);
    try {
      const finalTitle = orderTitle.trim() || `${activeServiceObj.title} #${Math.floor(1000 + Math.random() * 9000)}`;
      const clientEmail = authUser?.email || currentUser?.email || 'client@studio.com';
      const clientName = authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Customer';

      const orderPayload = {
        title: finalTitle,
        type: selectedService,
        serviceCategory: activeServiceObj.title,
        price: totalPrice,
        totalPrice: totalPrice,
        isRush: isRush,
        notes: notes.trim(),
        placement: placement,
        width: widthInches,
        height: heightInches,
        targetFormats: selectedFormats,
        image_url: uploadedArtwork?.url || null,
        artworkUrl: uploadedArtwork?.url || null,
        uploadedFiles: uploadedArtwork ? [uploadedArtwork] : [],
        placementItems: [
          {
            id: 1,
            placementType: placement,
            dimensions: `${widthInches}" x ${heightInches}"`,
            formats: selectedFormats,
            files: uploadedArtwork ? [uploadedArtwork] : []
          }
        ],
        client_email: clientEmail,
        clientEmail: clientEmail,
        clientName: clientName,
        status: 'pending_payment',
        payment_status: 'unpaid'
      };

      const created = await createOrder(orderPayload);
      const resultingOrder = created || {
        id: `ord-${Date.now()}`,
        ...orderPayload
      };

      setCreatedOrderObj(resultingOrder);
      setStep(5); // Jump to confirmation step
      if (typeof onOrderCreated === 'function') {
        onOrderCreated(resultingOrder);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      showToast('Error placing order: ' + (err.message || 'Please try again'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = () => {
    if (createdOrderObj) {
      setIsCheckoutModalOpen(true);
      setCheckoutSession({
        type: 'order',
        orderId: createdOrderObj.id,
        orderNumber: formatOrderId(createdOrderObj.id),
        title: createdOrderObj.title,
        amount: totalPrice,
        clientEmail: authUser?.email || currentUser?.email,
        clientName: authUser?.name || currentUser?.name
      });
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '92vh',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 900,
                padding: '0.15rem 0.45rem',
                borderRadius: '6px'
              }}>
                STEP {step} OF 4
              </span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                {step === 1 && 'Choose Service'}
                {step === 2 && 'Upload Your Design'}
                {step === 3 && 'Order Requirements'}
                {step === 4 && 'Review & Instant Quote'}
                {step === 5 && 'Order Confirmed! 🎉'}
              </h3>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              {step === 1 && 'Select embroidery digitizing, vector art, or custom patches.'}
              {step === 2 && 'Upload your artwork or logo from phone gallery or camera.'}
              {step === 3 && 'Specify dimensions, formats, and express turnaround.'}
              {step === 4 && 'Check your specifications and instant studio pricing.'}
              {step === 5 && 'Your production order has been received by our master team.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        {step < 5 && (
          <div style={{ height: '4px', background: '#f1f5f9', width: '100%' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f97316, #ea580c)',
              width: `${(step / 4) * 100}%`,
              transition: 'width 0.25s ease'
            }} />
          </div>
        )}

        {/* MODAL BODY */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
          
          {/* STEP 1: CHOOSE SERVICE */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SERVICES.map(svc => {
                const isSelected = selectedService === svc.id;
                const IconComp = svc.icon;

                return (
                  <div
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc.id);
                      setSelectedFormats(svc.id === 'vector' ? ['AI', 'PDF', 'SVG'] : ['DST', 'PES', 'EMB']);
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #f97316' : '1.5px solid #e2e8f0',
                      background: isSelected ? '#fff7ed' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 14px rgba(249, 115, 22, 0.15)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: isSelected ? '#f97316' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={22} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                          {svc.title}
                        </h4>
                        <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#ea580c' }}>
                          From ${svc.basePrice}
                        </span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>
                        {svc.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 2: UPLOAD DESIGN */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.ai,.eps,.dst,.pes,.emb,.zip,.rar"
              />

              {/* Upload Dropzone */}
              {!uploadedArtwork ? (
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isUploading ? (
                    <div>
                      <Loader2 size={36} style={{ color: '#f97316', animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        Uploading Design ({uploadProgress}%)...
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Securing artwork to high-speed studio storage...
                      </p>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', marginTop: '1rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#f97316', width: `${uploadProgress}%`, transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#ffedd5',
                        color: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem'
                      }}>
                        <Upload size={26} />
                      </div>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        Tap to Upload Design
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        From Gallery, Camera or Phone Files
                      </p>
                      <span style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.7rem', color: '#94a3b8', background: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        PNG, JPG, PDF, AI, EPS, DST (Max 50MB)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Uploaded Preview Card */
                <div style={{
                  padding: '1rem',
                  borderRadius: '16px',
                  border: '1.5px solid #86efac',
                  background: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}>
                  <img
                    src={uploadedArtwork.url}
                    alt={uploadedArtwork.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                    }}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '2px solid #16a34a',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={15} style={{ color: '#16a34a', flexShrink: 0 }} />
                      <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {uploadedArtwork.name}
                      </h5>
                    </div>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                      Ready for production • {uploadedArtwork.size}
                    </p>
                    <button
                      type="button"
                      onClick={() => setUploadedArtwork(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '0.35rem',
                        textDecoration: 'underline'
                      }}
                    >
                      Change Artwork
                    </button>
                  </div>
                </div>
              )}

              {uploadError && (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '0.78rem' }}>
                  {uploadError}
                </div>
              )}

              {/* Order Title Input */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Order / Design Name (Optional)
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="e.g. Front Logo DST, Company Cap Embroidery"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: ADD REQUIREMENTS */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Delivery Speed Selector */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.45rem' }}>
                  Delivery Turnaround Speed
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsRush(false)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: !isRush ? '2px solid #f97316' : '1.5px solid #e2e8f0',
                      background: !isRush ? '#fff7ed' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: !isRush ? '#ea580c' : '#0f172a', fontWeight: 800, fontSize: '0.82rem' }}>
                      <Clock size={14} /> Standard (12-24h)
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                      Included in rate
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRush(true)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: isRush ? '2px solid #f97316' : '1.5px solid #e2e8f0',
                      background: isRush ? '#fff7ed' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isRush ? '#ea580c' : '#0f172a', fontWeight: 800, fontSize: '0.82rem' }}>
                      <Zap size={14} style={{ color: '#ea580c' }} /> Rush (4-8h Express)
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 800, display: 'block', marginTop: '0.2rem' }}>
                      +$10 Express fee
                    </span>
                  </button>
                </div>
              </div>

              {/* Format Checkboxes */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.45rem' }}>
                  Target Machine Formats Needed
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {activeServiceObj.formats.map(fmt => {
                    const isChecked = selectedFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid #ea580c' : '1px solid #cbd5e1',
                          background: isChecked ? '#fff7ed' : '#ffffff',
                          color: isChecked ? '#ea580c' : '#334155',
                          fontWeight: isChecked ? 800 : 600,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        {isChecked && <Check size={12} />} {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Placement & Dimensions */}
              {selectedService === 'embroidery' && (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.45rem' }}>
                    Placement & Sizing
                  </label>
                  <select
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      background: '#ffffff',
                      marginBottom: '0.5rem',
                      outline: 'none'
                    }}
                  >
                    <option value='Left Chest / Polo (up to 4.0")'>Left Chest / Polo (up to 4.0")</option>
                    <option value='Cap / Hat Front (up to 2.25")'>Cap / Hat Front (up to 2.25")</option>
                    <option value='Full Back / Jacket Crest (9"-12"+)'>Full Back / Jacket Crest (9"-12"+)</option>
                    <option value='Sleeve / Visor Emblem'>Sleeve / Visor Emblem</option>
                    <option value='Custom Sizing'>Custom Dimensions</option>
                  </select>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Width (Inches)</span>
                      <input
                        type="text"
                        value={widthInches}
                        onChange={(e) => setWidthInches(e.target.value)}
                        placeholder="3.5"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Height (Inches)</span>
                      <input
                        type="text"
                        value={heightInches}
                        onChange={(e) => setHeightInches(e.target.value)}
                        placeholder="3.5"
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>
                  Specific Instructions / Thread Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please use 3D puff on text, keep background transparent, preserve tiny details..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.82rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

            </div>
          )}

          {/* STEP 4: REVIEW & INSTANT QUOTE */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Summary Card */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.15rem'
              }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
                  {uploadedArtwork ? (
                    <img
                      src={uploadedArtwork.url}
                      alt={orderTitle}
                      style={{ width: '58px', height: '58px', borderRadius: '10px', objectFit: 'cover', border: '2px solid #f97316' }}
                    />
                  ) : (
                    <div style={{ width: '58px', height: '58px', borderRadius: '10px', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
                      {activeServiceObj.title}
                    </span>
                    <h4 style={{ margin: '0.15rem 0 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {orderTitle || 'Production Artwork Job'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {isRush ? '⚡ 4-8hr Express Turnaround' : '⏱️ 12-24hr Standard Turnaround'}
                    </span>
                  </div>
                </div>

                {/* Specs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Formats:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedFormats.join(', ')}</strong>
                  </div>
                  {selectedService === 'embroidery' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Placement:</span>
                      <strong style={{ color: '#0f172a' }}>{placement}</strong>
                    </div>
                  )}
                  {notes && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Instructions:</span>
                      <span style={{ color: '#0f172a', fontWeight: 600, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price Calculation Card */}
              <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '1.15rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Base Studio Rate ({activeServiceObj.title})</span>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>${basePrice.toFixed(2)}</span>
                </div>
                {isRush && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#fbbf24' }}>
                    <span>⚡ Rush Turnaround Fee (4-8 Hours)</span>
                    <span style={{ fontWeight: 800 }}>+$10.00</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '0.65rem', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>Total Price Quote</span>
                  <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f97316' }}>${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', color: '#64748b' }}>
                <ShieldCheck size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                <span>100% Quality Guaranteed • Free Unlimited Minor Revisions</span>
              </div>

            </div>
          )}

          {/* STEP 5: ORDER CONFIRMATION CELEBRATION */}
          {step === 5 && createdOrderObj && (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)'
              }}>
                <Check size={32} strokeWidth={3} />
              </div>

              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                Order Placed Successfully!
              </h3>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                Our digitizing team has received your artwork and is preparing the machine production files.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Number:</span>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    color: '#ea580c',
                    background: '#fff7ed',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '6px'
                  }}>
                    {formatOrderId(createdOrderObj.id)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Service:</span>
                  <strong style={{ color: '#0f172a' }}>{createdOrderObj.serviceCategory || activeServiceObj.title}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                  <span style={{ color: '#64748b' }}>Estimated Delivery:</span>
                  <strong style={{ color: '#16a34a' }}>{isRush ? '4-8 Hours (Express)' : '12-24 Hours'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handlePayNow}
                  className="btn btn-primary-orange"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem' }}
                >
                  <Zap size={16} /> Pay ${totalPrice.toFixed(2)} via Wallet / Card
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderForDrawer(createdOrderObj);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  View Order Live Tracker
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER CONTROLS (Steps 1 - 4) */}
        {step < 5 && (
          <div style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 2 && !uploadedArtwork) {
                    showToast('Please upload an artwork image or logo to continue', 'info');
                    return;
                  }
                  setStep(s => s + 1);
                }}
                className="btn btn-primary-orange"
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="btn btn-primary-orange"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting Order...
                  </>
                ) : (
                  <>
                    Submit Order • ${totalPrice.toFixed(2)} <ArrowRight size={16} />
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
