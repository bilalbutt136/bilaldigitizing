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
  Tag,
  Sliders,
  DollarSign,
  ChevronRight,
  Info
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';

// Standard fallback package tiers matching website /app/pricing/page.jsx
const CORE_PACKAGES = {
  embroidery: [
    {
      id: 'emb-basic',
      service_type: 'embroidery',
      badge: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Commercial stitch files for caps, polos & shirts (.DST, .PES, .EMB)',
      price: 10,
      original_price: 15,
      turnaround: '4–12 Hours',
      features: [
        'Up to 4" x 4" Dimensions',
        '100% Manual Hand-Mapped Pathing',
        'Cap Curved Optimization & Zero Thread Breaks',
        'Tajima .DST, Wilcom .EMB, Brother .PES + PDF Sheet'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'PDF'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Left Chest / Polo (up to 4.0")'
    },
    {
      id: 'emb-popular',
      service_type: 'embroidery',
      badge: 'MOST POPULAR',
      is_popular: true,
      title: 'Mid-Size Jacket & Sleeve Design',
      subtitle: 'Medium complexity artwork up to 7" x 7" with push-pull compensation.',
      price: 20,
      original_price: 30,
      turnaround: '6–12 Hours',
      features: [
        'Up to 7" x 7" Medium Artwork Area',
        'Complex Multi-Color Layering & Pathing',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'PDF'],
      defaultWidth: '6.0',
      defaultHeight: '6.0',
      defaultPlacement: 'Jacket Front / Sleeve (up to 7.0")'
    },
    {
      id: 'emb-pro',
      service_type: 'embroidery',
      badge: 'PRO / 3D PUFF',
      is_popular: false,
      title: 'Full Back & 3D Puff Foam',
      subtitle: 'High stitch count jacket back designs up to 12" x 12" and 3D puff foam.',
      price: 35,
      original_price: 50,
      turnaround: '8–12 Hours',
      features: [
        'Up to 12" x 12" Full Back Area',
        'High Density 3D Puff Foam Layering',
        'Heavy Fabric Calibration & Zero Distortion',
        '24/7 Priority Master Digitizer Support'
      ],
      defaultFormats: ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'PDF'],
      defaultWidth: '10.5',
      defaultHeight: '10.5',
      defaultPlacement: 'Full Jacket Back (up to 12.0")'
    }
  ],
  vector: [
    {
      id: 'vec-basic',
      service_type: 'vector',
      badge: 'BASIC',
      is_popular: false,
      title: 'Simple Logo & Typography Redraw',
      subtitle: 'Clean typographic logos, line work & basic shapes converted to vector.',
      price: 15,
      original_price: 25,
      turnaround: '6–12 Hours',
      features: [
        'Clean Bézier Curves & Anchor Nodes',
        'Sharp 100% Scalable Vector Paths',
        'Master Suite: .AI, .EPS, .SVG, .PDF',
        'Infinite Scale Without Pixelation'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF'],
      defaultWidth: '8.0',
      defaultHeight: '8.0',
      defaultPlacement: 'Print / Vector Scalable'
    },
    {
      id: 'vec-popular',
      service_type: 'vector',
      badge: 'BEST VALUE',
      is_popular: true,
      title: 'Medium Detail Artwork with Colors',
      subtitle: 'Multi-color badges, crests & illustrations with Pantone color separation.',
      price: 25,
      original_price: 35,
      turnaround: '6–12 Hours',
      features: [
        'Pantone (PMS) Spot Color Matching',
        'Separated Layers for Screen Printing',
        'Vinyl Cutting Smooth Cut-Paths',
        'High-Res 300+ DPI PDF Master'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'High-Res PNG'],
      defaultWidth: '10.0',
      defaultHeight: '10.0',
      defaultPlacement: 'Screen Print / Apparel'
    },
    {
      id: 'vec-pro',
      service_type: 'vector',
      badge: 'MASTER DETAIL',
      is_popular: false,
      title: 'Complex Intricate Mascot & Illustration',
      subtitle: 'Highly intricate artwork, photographic traces & heraldic crests.',
      price: 45,
      original_price: 65,
      turnaround: '12–24 Hours',
      features: [
        'Ultra-Intricate Fine Vector Details',
        'Complete Multi-Layer Organization',
        'Print-Ready Color Separations Suite',
        'Unlimited Revisions Until Press-Ready'
      ],
      defaultFormats: ['AI', 'EPS', 'SVG', 'PDF', 'CDR', 'PNG'],
      defaultWidth: '12.0',
      defaultHeight: '12.0',
      defaultPlacement: 'Master Artwork / Large Print'
    }
  ],
  patch: [
    {
      id: 'patch-sample',
      service_type: 'patch',
      badge: 'SAMPLE RUN',
      is_popular: false,
      title: 'Sample Batch (10–50 Pcs)',
      subtitle: 'Low-minimum run perfect for small brands, clubs, prototypes & events.',
      price: 4.50,
      original_price: 6.50,
      turnaround: '3–5 Days',
      features: [
        'Ultra-Low 10 Pieces Minimum Order',
        '12-Hour Free Digital Production Proof',
        'Velcro Hook & Loop or Iron-On Backings',
        'Custom Embroidered, Woven or 3D PVC'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.0',
      defaultHeight: '3.0',
      defaultPlacement: 'Custom Shape Cut'
    },
    {
      id: 'patch-popular',
      service_type: 'patch',
      badge: 'POPULAR',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Ideal for uniform programs, merchandise drops & motorcycle clubs.',
      price: 2.50,
      original_price: 4.00,
      turnaround: '5–7 Days',
      features: [
        'Precision Laser-Cut or Merrowed Border',
        'Metallic Gold/Silver & Glow-in-Dark Threads',
        'Pre-Production Physical Sew-Out Sample',
        'Free Shipping Included'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Custom Shape Cut'
    },
    {
      id: 'patch-bulk',
      service_type: 'patch',
      badge: 'WHOLESALE BULK',
      is_popular: false,
      title: 'Wholesale Bulk (500+ Pcs)',
      subtitle: 'Maximum volume discount for apparel brands, military & distributors.',
      price: 1.50,
      original_price: 2.50,
      turnaround: '7–10 Days',
      features: [
        'Maximum Factory Direct Wholesale Savings',
        'Individual Poly-Bag Packaging',
        'Custom Backing Paper & Barcodes',
        'Dedicated Master Account Manager'
      ],
      defaultFormats: ['DST', 'PDF Proof', 'Physical Patch Shipment'],
      defaultWidth: '3.5',
      defaultHeight: '3.5',
      defaultPlacement: 'Custom Shape Cut'
    }
  ]
};

const SERVICE_TABS = [
  { id: 'embroidery', label: 'Embroidery', icon: Layers, color: '#059669', defaultCategory: 'embroidery' },
  { id: 'vector', label: 'Vector Art', icon: PenTool, color: '#ea580c', defaultCategory: 'vector' },
  { id: 'patch', label: 'Patches', icon: Package, color: '#0284c7', defaultCategory: 'patch' }
];

export const MobileSimpleOrderModal = ({ isOpen, onClose, defaultService = 'embroidery', onOrderCreated }) => {
  const { 
    createOrder, 
    authUser, 
    currentUser, 
    showToast, 
    setSelectedOrderForDrawer,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    dynamicPricingTiers = []
  } = useAppState();

  const [step, setStep] = useState(1); // 1: Package Selection, 2: Upload Artwork, 3: Specifications, 4: Review, 5: Confirmation
  const [selectedService, setSelectedService] = useState('embroidery');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [orderTitle, setOrderTitle] = useState('');
  const [isRush, setIsRush] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB']);
  const [placement, setPlacement] = useState('Left Chest / Polo (up to 4.0")');
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [fabricType, setFabricType] = useState('Cotton / Pique Knit');
  const [notes, setNotes] = useState('');
  
  // File Upload State
  const [uploadedArtwork, setUploadedArtwork] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderObj, setCreatedOrderObj] = useState(null);

  const fileInputRef = useRef(null);

  // Merge dynamic database pricing tiers with core packages
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
        turnaround: t.turnaround_time || (catKey === 'patch' ? '5–7 Days' : '6–12 Hours'),
        features: Array.isArray(t.features) ? t.features : [],
        defaultFormats: catKey === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : catKey === 'patch' ? ['DST', 'PDF Proof'] : ['DST', 'PES', 'EMB', 'PDF'],
        defaultWidth: '3.5',
        defaultHeight: '3.5',
        defaultPlacement: catKey === 'vector' ? 'Vector Art Tracing' : catKey === 'patch' ? 'Custom Patch' : 'Left Chest / Polo'
      }));
    }
    return coreList;
  };

  // Sync initial service on open
  useEffect(() => {
    if (isOpen) {
      const normService = defaultService === 'patch' || defaultService === 'patches' 
        ? 'patch' 
        : (defaultService === 'vector' || defaultService === 'vector-art' || defaultService === 'vector_art') 
          ? 'vector' 
          : 'embroidery';
      setSelectedService(normService);
      const pkgs = getPackagesForCategory(normService);
      const initialPkg = pkgs.find(p => p.is_popular) || pkgs[0];
      setSelectedPackage(initialPkg);
      if (initialPkg) {
        setSelectedFormats(initialPkg.defaultFormats || (normService === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : ['DST', 'PES', 'EMB']));
        setWidthInches(initialPkg.defaultWidth || '3.5');
        setHeightInches(initialPkg.defaultHeight || '3.5');
        setPlacement(initialPkg.defaultPlacement || 'Left Chest / Polo (up to 4.0")');
      }
      setStep(1);
      setUploadError(null);
    }
  }, [isOpen, defaultService]);

  if (!isOpen) return null;

  const currentPackages = getPackagesForCategory(selectedService);
  const activePkg = selectedPackage || currentPackages[0];

  // Price calculations
  const basePrice = Number(activePkg?.price || 15);
  const rushFee = isRush ? 10 : 0;
  const totalPrice = basePrice + rushFee;

  const handleSelectService = (serviceId) => {
    setSelectedService(serviceId);
    const pkgs = getPackagesForCategory(serviceId);
    const popularOrFirst = pkgs.find(p => p.is_popular) || pkgs[0];
    setSelectedPackage(popularOrFirst);
    if (popularOrFirst) {
      setSelectedFormats(popularOrFirst.defaultFormats || (serviceId === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : ['DST', 'PES', 'EMB']));
      setWidthInches(popularOrFirst.defaultWidth || '3.5');
      setHeightInches(popularOrFirst.defaultHeight || '3.5');
      setPlacement(popularOrFirst.defaultPlacement || 'Left Chest / Polo (up to 4.0")');
    }
  };

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    if (pkg.defaultFormats) setSelectedFormats(pkg.defaultFormats);
    if (pkg.defaultWidth) setWidthInches(pkg.defaultWidth);
    if (pkg.defaultHeight) setHeightInches(pkg.defaultHeight);
    if (pkg.defaultPlacement) setPlacement(pkg.defaultPlacement);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File exceeds 50MB. Please select a smaller file.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(20);

    try {
      if (!orderTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setOrderTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      setUploadProgress(50);
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
        throw new Error('Upload completed without a valid URL.');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'File upload failed. Please try again.');
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
      setOrderTitle(uploadedArtwork?.name?.replace(/\.[^/.]+$/, '') || `${activePkg?.title || 'Custom'} Order`);
    }

    setIsSubmitting(true);
    try {
      const finalTitle = orderTitle.trim() || `${activePkg?.title || 'Design'} #${Math.floor(1000 + Math.random() * 9000)}`;
      const clientEmail = authUser?.email || currentUser?.email || 'guest@bdigitizing.pro';
      const clientName = authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Studio Client';

      const orderPayload = {
        title: finalTitle,
        type: selectedService,
        serviceCategory: activePkg?.title || (selectedService === 'vector' ? 'Vector Art Tracing' : selectedService === 'patch' ? 'Custom Patches' : 'Embroidery Digitizing'),
        package_name: activePkg?.title,
        package_tier: activePkg?.badge || 'STANDARD',
        price: totalPrice,
        totalPrice: totalPrice,
        isRush: isRush,
        notes: notes.trim(),
        placement: placement,
        width: widthInches,
        height: heightInches,
        fabricType: fabricType,
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
            fabric: fabricType,
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
      setStep(5); // Confirmation screen
      showToast('Order created successfully! 🎉', 'success');
      if (typeof onOrderCreated === 'function') {
        onOrderCreated(resultingOrder);
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      showToast('Could not submit order: ' + (err.message || 'Please try again'), 'error');
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
          maxWidth: '560px',
          maxHeight: '92vh',
          borderRadius: '24px 24px 0 0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP MODAL HEADER */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '0.18rem 0.5rem',
                borderRadius: '6px',
                letterSpacing: '0.05em'
              }}>
                STEP {step} OF 4
              </span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                {step === 1 && 'Choose Service Package'}
                {step === 2 && 'Upload Artwork & Details'}
                {step === 3 && 'Technical Specifications'}
                {step === 4 && 'Review & Confirm Order'}
                {step === 5 && 'Order Ready!'}
              </h3>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#64748b' }}>
              {step === 1 && 'Select from real studio tiers with transparent pricing.'}
              {step === 2 && 'Upload your design image, vector, or mockup.'}
              {step === 3 && 'Configure dimensions, formats, placement & speed.'}
              {step === 4 && 'Verify specs before dispatching to digitizers.'}
              {step === 5 && 'Your order has been recorded into the live system.'}
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
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div style={{ width: '100%', height: '4px', background: '#f1f5f9' }}>
          <div style={{
            height: '100%',
            width: `${(step / 4) * 100}%`,
            background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* BODY CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* =========================================================================
              STEP 1: SELECT SERVICE & PACKAGE TIER
              ========================================================================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Category Switcher Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {SERVICE_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isSelected = selectedService === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectService(tab.id)}
                      style={{
                        padding: '0.55rem 0.35rem',
                        borderRadius: '9px',
                        border: isSelected ? '1.5px solid #059669' : '1px solid transparent',
                        background: isSelected ? '#ffffff' : 'transparent',
                        color: isSelected ? '#0f172a' : '#64748b',
                        fontWeight: isSelected ? 900 : 600,
                        fontSize: '0.78rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={16} style={{ color: isSelected ? '#059669' : '#64748b' }} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Package Tier Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Available Packages ({currentPackages.length})
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                    ⚡ Express Turnaround Available
                  </span>
                </div>

                {currentPackages.map((pkg, idx) => {
                  const isSelected = selectedPackage?.id === pkg.id || (!selectedPackage && idx === 0);
                  return (
                    <div
                      key={pkg.id || idx}
                      onClick={() => handleSelectPackage(pkg)}
                      style={{
                        border: isSelected ? '2px solid #059669' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        borderRadius: '16px',
                        padding: '1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Popular / Badge Tag */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #059669' : '2px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0
                          }} />
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                            {pkg.title}
                          </h4>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', justifyContent: 'flex-end' }}>
                            {pkg.original_price && (
                              <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                                ${Number(pkg.original_price).toFixed(2)}
                              </span>
                            )}
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                              ${Number(pkg.price).toFixed(pkg.price % 1 === 0 ? 0 : 2)}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
                            {selectedService === 'patch' ? '/ piece' : 'flat rate'}
                          </span>
                        </div>
                      </div>

                      {pkg.badge && (
                        <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            background: pkg.is_popular ? '#fef3c7' : '#ecfdf5',
                            color: pkg.is_popular ? '#b45309' : '#047857',
                            border: pkg.is_popular ? '1px solid #fde68a' : '1px solid #a7f3d0'
                          }}>
                            {pkg.badge}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Clock size={11} /> {pkg.turnaround}
                          </span>
                        </div>
                      )}

                      <p style={{ margin: '0.45rem 0 0.5rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                        {pkg.subtitle}
                      </p>

                      {/* Feature Bullet Points */}
                      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
                          {pkg.features.slice(0, 3).map((feat, fIdx) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#334155' }}>
                              <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 2: UPLOAD ARTWORK & TITLE
              ========================================================================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Selected Package Mini-Summary */}
              <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                    Selected Package
                  </span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                    {activePkg?.title}
                  </div>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#047857' }}>
                  ${Number(activePkg?.price || 15).toFixed(activePkg?.price % 1 === 0 ? 0 : 2)}
                </div>
              </div>

              {/* Artwork Upload Area */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Upload Artwork / Logo File <span style={{ color: '#ef4444' }}>*</span>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.ai,.eps,.svg,.cdr,.dst,.pes,.emb"
                />

                {!uploadedArtwork ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #cbd5e1',
                      borderRadius: '16px',
                      padding: '1.75rem 1rem',
                      textAlign: 'center',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={32} className="animate-spin" style={{ color: '#059669' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                          Uploading to Studio Cloud ({uploadProgress}%)
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Processing high-resolution preview...
                        </span>
                      </>
                    ) : (
                      <>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: '#ecfdf5',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Upload size={22} />
                        </div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          Tap to select image or document
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Supports JPG, PNG, PDF, AI, EPS, SVG, DST, EMB (up to 50MB)
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{
                    border: '1.5px solid #10b981',
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    position: 'relative'
                  }}>
                    {uploadedArtwork.url && (
                      <img
                        src={uploadedArtwork.url}
                        alt="Preview"
                        style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {uploadedArtwork.name}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.15rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '0.08rem 0.35rem', borderRadius: '4px' }}>
                          {uploadedArtwork.format}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {uploadedArtwork.size}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUploadedArtwork(null)}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>

              {/* Design Name / Title Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Design / Job Name
                </label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="e.g. Apex Racing Left Chest Logo"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    background: '#f8fafc',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 3: SPECIFICATIONS & FORMATS
              ========================================================================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Dimensions: Width & Height */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Target Dimensions (Inches)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Width</span>
                    <input
                      type="text"
                      value={widthInches}
                      onChange={(e) => setWidthInches(e.target.value)}
                      placeholder='3.5"'
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Height</span>
                    <input
                      type="text"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      placeholder='3.5"'
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Left Chest (3.5")', w: '3.5', h: '3.5', p: 'Left Chest / Polo (up to 4.0")' },
                    { label: 'Cap (2.25")', w: '4.5', h: '2.25', p: 'Cap Front (Low Profile)' },
                    { label: 'Sleeve (5.0")', w: '3.0', h: '5.0', p: 'Sleeve / Side Panel' },
                    { label: 'Full Back (10.5")', w: '10.5', h: '10.5', p: 'Full Jacket Back (up to 12.0")' }
                  ].map(pre => (
                    <button
                      key={pre.label}
                      type="button"
                      onClick={() => {
                        setWidthInches(pre.w);
                        setHeightInches(pre.h);
                        setPlacement(pre.p);
                      }}
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '14px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {pre.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Placement Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Placement Type
                </label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value='Left Chest / Polo (up to 4.0")'>Left Chest / Polo (up to 4.0")</option>
                  <option value='Cap Front (Low Profile)'>Cap Front (Low Profile / Structured)</option>
                  <option value='Full Jacket Back (up to 12.0")'>Full Jacket Back (up to 12.0")</option>
                  <option value='Sleeve / Side Panel'>Sleeve / Side Panel</option>
                  <option value='3D Puff Foam Hat'>3D Puff Foam Hat (Raised 3D)</option>
                  <option value='Custom Patch Merrowed'>Custom Patch Merrowed</option>
                  <option value='Screen Print / Vinyl Cut'>Screen Print / Vinyl Cut (Vector)</option>
                </select>
              </div>

              {/* Fabric Type (for Embroidery) */}
              {selectedService === 'embroidery' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    Garment / Fabric Type
                  </label>
                  <select
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.7rem 0.85rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      color: '#0f172a',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value='Cotton / Pique Knit'>Cotton / Pique Polo Knit</option>
                    <option value='Structured Twill Cap'>Structured Twill / Trucker Cap</option>
                    <option value='Heavy Hoodie / Fleece'>Heavy Hoodie / Sweatshirt Fleece</option>
                    <option value='Nylon / Performance Polyester'>Nylon / Dri-Fit Polyester</option>
                    <option value='Leather / Heavy Canvas'>Leather / Heavy Canvas</option>
                    <option value='Beanies / Ribbed Knit'>Beanies / Ribbed Knit</option>
                  </select>
                </div>
              )}

              {/* Target File Formats */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Target Deliverable Formats
                </label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {(selectedService === 'vector' 
                    ? ['AI', 'EPS', 'SVG', 'PDF', 'CDR', 'PNG'] 
                    : selectedService === 'patch'
                      ? ['DST', 'PDF Proof', 'Physical Patch Shipment']
                      : ['DST', 'PES', 'EMB', 'EXP', 'JEF', 'VP3', 'PDF Worksheet']
                  ).map(fmt => {
                    const isChecked = selectedFormats.includes(fmt);
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleToggleFormat(fmt)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          border: isChecked ? '1.5px solid #059669' : '1px solid #cbd5e1',
                          background: isChecked ? '#ecfdf5' : '#ffffff',
                          color: isChecked ? '#047857' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        {isChecked ? <Check size={12} strokeWidth={3} /> : null}
                        <span>{fmt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Express Rush 4-8h Toggle */}
              <div 
                onClick={() => setIsRush(!isRush)}
                style={{
                  border: isRush ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                  background: isRush ? '#fffbeb' : '#ffffff',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: isRush ? '#fef3c7' : '#f1f5f9',
                    color: isRush ? '#d97706' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Zap size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#0f172a' }}>
                      4–8 Hour Express Rush
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Guaranteed same-day prioritized queue
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#d97706' }}>
                    +$10.00
                  </span>
                  <div style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    background: isRush ? '#d97706' : '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isRush ? 'flex-end' : 'flex-start',
                    padding: '2px',
                    boxSizing: 'border-box',
                    marginTop: '2px'
                  }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff' }} />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 4: ORDER REVIEW & CONFIRMATION
              ========================================================================= */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Review Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem', background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  {uploadedArtwork?.url ? (
                    <img
                      src={uploadedArtwork.url}
                      alt="Artwork"
                      style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <ImageIcon size={24} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                      {activePkg?.title}
                    </span>
                    <h4 style={{ margin: '0.1rem 0 0', fontSize: '0.95rem', fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {orderTitle || 'Custom Design Order'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {widthInches}" x {heightInches}" • {placement}
                    </span>
                  </div>
                </div>

                {/* Specs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Service Tier:</span>
                    <strong style={{ color: '#0f172a' }}>{activePkg?.badge || 'STANDARD'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Target Formats:</span>
                    <strong style={{ color: '#0f172a' }}>{selectedFormats.join(', ')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Turnaround ETA:</span>
                    <strong style={{ color: isRush ? '#d97706' : '#047857' }}>
                      {isRush ? '⚡ 4–8 Hours Express' : activePkg?.turnaround || '12–24 Hours'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Special Instructions Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Digitizer Instructions / Thread Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please use matte white thread on navy fabric, keep lettering sharp and underlay stable..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.82rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Price Breakdown */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '0.85rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155', marginBottom: '0.25rem' }}>
                  <span>Package Base Price:</span>
                  <span>${basePrice.toFixed(2)}</span>
                </div>
                {isRush && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#d97706', marginBottom: '0.25rem' }}>
                    <span>4–8h Express Rush Fee:</span>
                    <span>+$10.00</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #a7f3d0', paddingTop: '0.45rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>Total Due:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857' }}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 5: CONFIRMATION & NEXT STEPS
              ========================================================================= */}
          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                Order Successfully Placed!
              </h3>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.65rem 1rem', display: 'inline-block' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Identifier: </span>
                <strong style={{ fontSize: '0.85rem', color: '#059669' }}>
                  {formatOrderId(createdOrderObj?.id)}
                </strong>
              </div>

              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, maxWidth: '380px' }}>
                Our master digitizers are reviewing your artwork specifications. You will receive production stitch test updates straight to your dashboard.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', maxWidth: '340px', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handlePayNow}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.85rem',
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
                  }}
                >
                  Pay & Instant Dispatch (${totalPrice.toFixed(2)})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (createdOrderObj) setSelectedOrderForDrawer(createdOrderObj);
                    onClose();
                  }}
                  style={{
                    background: '#f8fafc',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Track Order in Dashboard
                </button>
              </div>

            </div>
          )}

        </div>

        {/* BOTTOM NAVIGATION CONTROLS */}
        {step < 5 && (
          <div style={{
            padding: '0.85rem 1.25rem',
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
                onClick={() => setStep(step - 1)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.85rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(5, 150, 105, 0.25)'
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order (${totalPrice.toFixed(2)})</span>
                    <Check size={16} strokeWidth={3} />
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
