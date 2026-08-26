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
  FileCheck,
  Trash2,
  Minus,
  Plus,
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

  // Wizard Step (1: Service, 2: Package & Quantity, 3: Upload Artwork & Notes, 4: Specs, 5: Review, 6: Confirmation)
  const [step, setStep] = useState(1);
  
  // Selection State
  const [selectedService, setSelectedService] = useState('embroidery');
  const [selectedPackage, setSelectedPackage] = useState(null);
  
  // Quantity State
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');

  // Configuration Specs State
  const [isRush, setIsRush] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState(['DST', 'PES', 'EMB']);
  const [placement, setPlacement] = useState('Left Chest / Polo (up to 4.0")');
  const [widthInches, setWidthInches] = useState('3.5');
  const [heightInches, setHeightInches] = useState('3.5');
  const [fabricType, setFabricType] = useState('Cotton / Pique Knit');
  const [patchStyle, setPatchStyle] = useState('Embroidered');
  const [patchBacking, setPatchBacking] = useState('Iron-On');
  const [notes, setNotes] = useState('');
  
  // Multiple Files Upload State
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderObj, setCreatedOrderObj] = useState(null);

  const fileInputRef = useRef(null);

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
      
      const defaultQty = normService === 'patch' ? 50 : 1;
      setQuantity(defaultQty);
      setQuantityInput(String(defaultQty));

      if (initialPkg) {
        setSelectedFormats(initialPkg.defaultFormats || (normService === 'vector' ? ['AI', 'EPS', 'SVG', 'PDF'] : ['DST', 'PES', 'EMB']));
        setWidthInches(initialPkg.defaultWidth || '3.5');
        setHeightInches(initialPkg.defaultHeight || '3.5');
        setPlacement(initialPkg.defaultPlacement || 'Left Chest / Polo (up to 4.0")');
      }
      setStep(1);
      setUploadedFiles([]);
      setUploadError(null);
      setIsRush(false);
      setNotes('');
    }
  }, [isOpen, defaultService]);

  if (!isOpen) return null;

  const currentPackages = getPackagesForCategory(selectedService);
  const activePkg = selectedPackage || currentPackages[0];

  const unitPrice = Number(activePkg?.price || (selectedService === 'patch' ? 2.50 : 15));
  const baseSubtotal = parseFloat((unitPrice * quantity).toFixed(2));

  let volumeDiscountPercent = 0;
  if (selectedService !== 'patch') {
    if (quantity >= 25) volumeDiscountPercent = 25;
    else if (quantity >= 10) volumeDiscountPercent = 15;
    else if (quantity >= 5) volumeDiscountPercent = 10;
    else if (quantity >= 3) volumeDiscountPercent = 5;
  }

  const volumeDiscountAmount = parseFloat(((baseSubtotal * volumeDiscountPercent) / 100).toFixed(2));
  const rushFee = isRush ? (selectedService === 'patch' ? 25 : 10) : 0;
  const totalPrice = Math.max(0, parseFloat((baseSubtotal - volumeDiscountAmount + rushFee).toFixed(2)));

  const handleSelectService = (serviceId) => {
    setSelectedService(serviceId);
    const pkgs = getPackagesForCategory(serviceId);
    const popularOrFirst = pkgs.find(p => p.is_popular) || pkgs[0];
    setSelectedPackage(popularOrFirst);
    
    const newQty = serviceId === 'patch' ? 50 : 1;
    setQuantity(newQty);
    setQuantityInput(String(newQty));

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

  const handleQuantityChange = (delta) => {
    const minVal = selectedService === 'patch' ? 10 : 1;
    const stepVal = selectedService === 'patch' ? (quantity >= 100 ? 50 : 10) : 1;
    const nextVal = Math.max(minVal, quantity + (delta * stepVal));
    setQuantity(nextVal);
    setQuantityInput(String(nextVal));
  };

  const handleQuantityInput = (val) => {
    setQuantityInput(val);
    const parsed = parseInt(val, 10);
    const minVal = selectedService === 'patch' ? 10 : 1;
    if (!isNaN(parsed) && parsed >= minVal) {
      setQuantity(parsed);
    }
  };

  const handleSetPresetQuantity = (presetQty) => {
    setQuantity(presetQty);
    setQuantityInput(String(presetQty));
  };

  const handleMultipleFiles = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const oversized = rawFiles.find(f => f.size > 50 * 1024 * 1024);
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds 50MB limit.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const uploadPromises = rawFiles.map(async (file) => {
        const result = await uploadFileToCloudinaryFull(file);
        if (result && (result.url || result.secure_url)) {
          return {
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            url: result.secure_url || result.url,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            format: file.name.split('.').pop()?.toUpperCase() || 'FILE',
            public_id: result.public_id || null
          };
        }
        throw new Error(`Upload failed for ${file.name}`);
      });

      const newUploaded = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...newUploaded]);
      if (showToast) showToast(`✓ ${newUploaded.length} artwork file(s) attached successfully!`, 'success');
    } catch (err) {
      console.error('Multiple upload error:', err);
      setUploadError(err.message || 'Error uploading artwork files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
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
    if (uploadedFiles.length === 0) {
      setUploadError('Please attach at least one artwork or reference file.');
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const firstFileName = uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Artwork';
      const cleanService = selectedService === 'vector' 
        ? 'Vector Art' 
        : selectedService === 'patch' 
          ? 'Custom Patches' 
          : 'Embroidery Digitizing';
      
      const derivedTitle = selectedService === 'patch'
        ? `${patchStyle} Patches (${quantity} Pcs)`
        : `${firstFileName} - ${cleanService} (Qty: ${quantity})`;

      const clientEmail = authUser?.email || currentUser?.email || 'guest@bdigitizing.pro';
      const clientName = authUser?.user_metadata?.full_name || authUser?.name || currentUser?.name || 'Studio Client';
      const primaryArtworkUrl = uploadedFiles[0]?.url || null;

      const orderPayload = {
        title: derivedTitle,
        type: selectedService,
        serviceCategory: cleanService,
        package_name: activePkg?.title,
        package_tier: activePkg?.badge || 'STANDARD',
        quantity: quantity,
        price: totalPrice,
        totalPrice: totalPrice,
        base_price: baseSubtotal,
        discount_amount: volumeDiscountAmount,
        isRush: isRush,
        notes: notes.trim(),
        placement: placement,
        width: widthInches,
        height: heightInches,
        fabricType: selectedService === 'embroidery' ? fabricType : null,
        patchStyle: selectedService === 'patch' ? patchStyle : null,
        patchBacking: selectedService === 'patch' ? patchBacking : null,
        targetFormats: selectedFormats,
        image_url: primaryArtworkUrl,
        artworkUrl: primaryArtworkUrl,
        uploadedFiles: uploadedFiles,
        placementItems: [
          {
            id: 1,
            placementType: placement,
            quantity: quantity,
            dimensions: `${widthInches}" x ${heightInches}"`,
            formats: selectedFormats,
            fabric: fabricType,
            patchStyle,
            patchBacking,
            files: uploadedFiles
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
        id: `ORD-${Date.now()}`,
        ...orderPayload
      };

      if (typeof window !== 'undefined' && resultingOrder?.id) {
        try {
          const prevIds = JSON.parse(localStorage.getItem('bdigi_my_order_ids') || '[]');
          const cleanId = String(resultingOrder.id).trim();
          if (!prevIds.includes(cleanId)) {
            localStorage.setItem('bdigi_my_order_ids', JSON.stringify([cleanId, ...prevIds].slice(0, 50)));
          }
        } catch {}
      }

      setCreatedOrderObj(resultingOrder);
      setStep(6);
      if (showToast) showToast('Order successfully generated! Complete payment to start production.', 'success');
    } catch (err) {
      console.error('Order creation error:', err);
      if (showToast) showToast('Failed to create order: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = () => {
    if (createdOrderObj) {
      setCheckoutSession({
        amount: totalPrice,
        orderId: createdOrderObj.id
      });
      setIsCheckoutModalOpen(true);
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        className="theme-light-enforced"
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
          borderBottom: '1.5px solid #e2e8f0',
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
                STEP {step} OF 5
              </span>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                {step === 1 && 'Choose Studio Service'}
                {step === 2 && 'Select Package & Quantity'}
                {step === 3 && 'Upload Artwork & Details'}
                {step === 4 && 'Technical Specifications'}
                {step === 5 && 'Review & Confirm Order'}
                {step === 6 && 'Order Successfully Placed!'}
              </h3>
            </div>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#475569' }}>
              {step === 1 && 'Select from our 3 primary professional digitizing services.'}
              {step === 2 && 'Select transparent studio packages & customize quantity.'}
              {step === 3 && 'Attach multiple reference files, artwork & special instructions.'}
              {step === 4 && 'Configure dimensions, formats, placement & express speed.'}
              {step === 5 && 'Review live pricing breakdown before instant dispatch.'}
              {step === 6 && 'Your order has been recorded into the live system.'}
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
              color: '#0f172a',
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
            width: `${Math.min(100, (step / 5) * 100)}%`,
            background: 'linear-gradient(90deg, #059669 0%, #10b981 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* BODY CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff' }}>
          
          {/* =========================================================================
              STEP 1: SELECT 1 OF 3 CORE SERVICES (HIGH CONTRAST & CLEAR LABELS)
              ========================================================================= */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#047857', background: '#ecfdf5', padding: '0.2rem 0.65rem', borderRadius: '999px', border: '1px solid #a7f3d0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Step 1: Choose Service
                </span>
                <h3 style={{ margin: '0.45rem 0 0.15rem', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                  What would you like created?
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>
                  Select from our 3 primary professional digitizing services below
                </p>
              </div>

              {/* The 3 Core Services Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                
                {/* 1. Embroidery Digitizing */}
                <div
                  onClick={() => {
                    handleSelectService('embroidery');
                    setStep(2);
                  }}
                  style={{
                    border: '2px solid #059669',
                    background: '#f0fdf4',
                    borderRadius: '18px',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(5, 150, 105, 0.12)',
                    display: 'flex',
                    gap: '0.95rem',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                  }}>
                    <Layers size={30} strokeWidth={2.2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#064e3b', letterSpacing: '-0.01em' }}>
                        Embroidery Digitizing
                      </h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#047857', background: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #86efac' }}>
                        From $10.00
                      </span>
                    </div>

                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#166534', lineHeight: 1.35, fontWeight: 500 }}>
                      Commercial stitch files for Left Chest, Caps, 3D Puff Foam & Jacket Backs (.DST, .PES, .EMB)
                    </p>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#047857', background: '#ffffff', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid #86efac' }}>
                        ⚡ 4–12H Delivery
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#065f46', fontWeight: 700 }}>
                        Machine Sew-Out Tested
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 900, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        Select <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Vector Art Tracing */}
                <div
                  onClick={() => {
                    handleSelectService('vector');
                    setStep(2);
                  }}
                  style={{
                    border: '2px solid #ea580c',
                    background: '#fff7ed',
                    borderRadius: '18px',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(234, 88, 12, 0.12)',
                    display: 'flex',
                    gap: '0.95rem',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)'
                  }}>
                    <PenTool size={30} strokeWidth={2.2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#7c2d12', letterSpacing: '-0.01em' }}>
                        Vector Art Tracing
                      </h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ea580c', background: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #fdba74' }}>
                        From $15.00
                      </span>
                    </div>

                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#9a3412', lineHeight: 1.35, fontWeight: 500 }}>
                      Logo Redraw, Screen Print Color Separation & Raster-to-Vector (.AI, .EPS, .SVG, .PDF)
                    </p>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#c2410c', background: '#ffffff', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid #fdba74' }}>
                        ⚡ 6–12H Delivery
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#9a3412', fontWeight: 700 }}>
                        Pantone PMS Match
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 900, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        Select <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Custom Physical Patches */}
                <div
                  onClick={() => {
                    handleSelectService('patch');
                    setStep(2);
                  }}
                  style={{
                    border: '2px solid #0284c7',
                    background: '#f0f9ff',
                    borderRadius: '18px',
                    padding: '1.15rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(2, 132, 199, 0.12)',
                    display: 'flex',
                    gap: '0.95rem',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}>
                    <Package size={30} strokeWidth={2.2} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: '#0c4a6e', letterSpacing: '-0.01em' }}>
                        Custom Patches
                      </h4>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0284c7', background: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #7dd3fc' }}>
                        From $1.50 / pc
                      </span>
                    </div>

                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.35, fontWeight: 500 }}>
                      Embroidered, 3D Molded PVC Rubber, Woven & Leather Patches with physical shipment
                    </p>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#0369a1', background: '#ffffff', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid #7dd3fc' }}>
                        📦 3–7 Days Delivery
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#075985', fontWeight: 700 }}>
                        10 Pcs Low Minimum
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 900, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        Select <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: SELECT PACKAGE TIER & QUANTITY
              ========================================================================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Category Switcher Tabs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', background: '#f8fafc', padding: '0.35rem', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
                {SERVICE_TABS.map(tab => {
                  const isSelected = selectedService === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleSelectService(tab.id)}
                      style={{
                        padding: '0.6rem 0.35rem',
                        borderRadius: '9px',
                        border: isSelected ? '1.5px solid #059669' : '1px solid transparent',
                        background: isSelected ? '#ffffff' : 'transparent',
                        color: isSelected ? '#047857' : '#475569',
                        fontWeight: isSelected ? 900 : 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* QUANTITY SELECTOR WIDGET */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                borderRadius: '16px',
                padding: '0.95rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>
                      {selectedService === 'patch' ? 'Patch Order Quantity (Pcs)' : 'Design Order Quantity'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block' }}>
                      {selectedService === 'patch' ? 'Minimum 10 pcs • Bulk tier discount applies' : 'Add multiple designs to get volume discounts'}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#f1f5f9',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 900
                      }}
                    >
                      <Minus size={16} />
                    </button>

                    <input
                      type="number"
                      value={quantityInput}
                      onChange={(e) => handleQuantityInput(e.target.value)}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        color: '#0f172a',
                        border: 'none',
                        background: 'transparent',
                        outline: 'none'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#ecfdf5',
                        color: '#047857',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 900
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Quick Quantity Chips */}
                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                  {(selectedService === 'patch' 
                    ? [25, 50, 100, 250, 500, 1000] 
                    : [1, 2, 3, 5, 10, 25]
                  ).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleSetPresetQuantity(preset)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        border: quantity === preset ? '1.5px solid #059669' : '1px solid #cbd5e1',
                        background: quantity === preset ? '#ecfdf5' : '#ffffff',
                        color: quantity === preset ? '#047857' : '#475569',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      {preset} {selectedService === 'patch' ? 'pcs' : (preset === 1 ? 'item' : 'items')}
                    </button>
                  ))}
                </div>

                {/* Real-time Dynamic Price Breakdown Banner */}
                <div style={{
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  padding: '0.55rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem'
                }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Rate: </span>
                    <strong style={{ color: '#0f172a' }}>${unitPrice.toFixed(2)}</strong> × <strong style={{ color: '#0f172a' }}>{quantity} {selectedService === 'patch' ? 'pcs' : 'qty'}</strong>
                    {volumeDiscountPercent > 0 && (
                      <span style={{ marginLeft: '0.4rem', color: '#059669', fontWeight: 900, background: '#ecfdf5', padding: '0.05rem 0.35rem', borderRadius: '4px' }}>
                        -{volumeDiscountPercent}% Vol Discount
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#047857' }}>
                    Total: ${totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Package Tier Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Choose Package Tier ({currentPackages.length})
                </span>

                {currentPackages.map((pkg, idx) => {
                  const isSelected = selectedPackage?.id === pkg.id || (!selectedPackage && idx === 0);
                  return (
                    <div
                      key={pkg.id || idx}
                      onClick={() => handleSelectPackage(pkg)}
                      style={{
                        border: isSelected ? '2px solid #059669' : '1.5px solid #cbd5e1',
                        background: isSelected ? '#f0fdf4' : '#ffffff',
                        borderRadius: '16px',
                        padding: '1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        boxShadow: isSelected ? '0 4px 16px rgba(5, 150, 105, 0.12)' : '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '5px solid #059669' : '2px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0
                          }} />
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#0f172a' }}>
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
                            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#047857' }}>
                              ${Number(pkg.price).toFixed(pkg.price % 1 === 0 ? 0 : 2)}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', display: 'block' }}>
                            {selectedService === 'patch' ? '/ piece' : 'flat rate'}
                          </span>
                        </div>
                      </div>

                      <p style={{ margin: '0.45rem 0 0.5rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.35 }}>
                        {pkg.subtitle}
                      </p>

                      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '0.25rem' }}>
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
              STEP 3: UPLOAD MULTIPLE ARTWORK FILES & DETAILS (NO ITEM NAME)
              ========================================================================= */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Selected Package & Live Price Banner */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: '14px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                    Selected Service & Tier
                  </span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                    {activePkg?.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700 }}>
                    Qty: {quantity} {selectedService === 'patch' ? 'pcs' : 'design(s)'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                    ${totalPrice.toFixed(2)}
                  </div>
                  {volumeDiscountPercent > 0 && (
                    <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 800 }}>
                      (-{volumeDiscountPercent}% Saved)
                    </span>
                  )}
                </div>
              </div>

              {/* Multiple Artwork Upload Area */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>
                    Attach Artwork & Reference Files <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 800 }}>
                    Multiple files supported
                  </span>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleMultipleFiles}
                  multiple
                  accept="image/*,.pdf,.ai,.eps,.svg,.cdr,.dst,.pes,.emb"
                />

                {/* Dropzone Container */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #059669',
                    borderRadius: '16px',
                    padding: '1.4rem 1rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isUploading ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0f172a' }}>
                      {isUploading ? 'Uploading and verifying files...' : 'Tap to Browse or Drop Multiple Files'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
                      PNG, JPG, PDF, AI, EPS, SVG, CDR up to 50MB each
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
                    ⚠️ {uploadError}
                  </div>
                )}

                {/* Uploaded Files Gallery / List */}
                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>
                        Attached Files ({uploadedFiles.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#047857',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        <Plus size={14} /> Add Another File
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {uploadedFiles.map((file, fIdx) => (
                        <div
                          key={file.id || fIdx}
                          style={{
                            border: '1.5px solid #cbd5e1',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.65rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: '#ecfdf5',
                              color: '#047857',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <FileCheck size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {file.name}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                {file.size} • <span style={{ color: '#059669', fontWeight: 700 }}>{file.format} Verified</span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.id)}
                            style={{
                              background: '#fee2e2',
                              border: 'none',
                              borderRadius: '50%',
                              width: '26px',
                              height: '26px',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Special Instructions & Notes Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Special Instructions / Production Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific colors, stitch densities, dimensions, backing instructions, or rush deadlines..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '12px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none'
                  }}
                />
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 4: SPECIFICATIONS & FORMATS
              ========================================================================= */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Dimensions: Width & Height */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
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
                        background: '#ffffff',
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
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Placement / Style Selector */}
              {selectedService === 'embroidery' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Embroidery Placement
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
                      <option value='Cap Front (Low Profile / Curved)'>Cap Front (Low Profile / Curved)</option>
                      <option value='Full Jacket Back (up to 12.0")'>Full Jacket Back (up to 12.0")</option>
                      <option value='Sleeve / Side Panel / Cuff'>Sleeve / Side Panel / Cuff</option>
                      <option value='3D Puff Foam Hat'>3D Puff Foam Hat (Raised 3D)</option>
                      <option value='Apron / Towel / Heavy Fleece'>Apron / Towel / Heavy Fleece</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Fabric Type Calibration
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
                      <option value='Cotton / Pique Knit'>Cotton / Pique Knit (Polos, T-Shirts)</option>
                      <option value='Structured Twill / Canvas'>Structured Twill / Canvas (Caps, Bags)</option>
                      <option value='Fleece / Hoodie / Sweatshirt'>Fleece / Hoodie / Sweatshirt</option>
                      <option value='Polyester Performance / DRI-FIT'>Polyester Performance / DRI-FIT</option>
                      <option value='Nylon / Softshell Jacket'>Nylon / Softshell Jacket</option>
                      <option value='Leather / Vinyl / Denim'>Leather / Vinyl / Denim</option>
                    </select>
                  </div>
                </>
              )}

              {selectedService === 'patch' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Patch Style
                    </label>
                    <select
                      value={patchStyle}
                      onChange={(e) => setPatchStyle(e.target.value)}
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
                      <option value='Embroidered'>🧵 100% Custom Embroidered Patch</option>
                      <option value='PVC'>⚡ 3D Molded Rubber PVC Patch</option>
                      <option value='Woven'>🌐 High-Density Micro Woven Patch</option>
                      <option value='Leather'>🪵 Genuine Debossed Leather Patch</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
                      Backing Attachment
                    </label>
                    <select
                      value={patchBacking}
                      onChange={(e) => setPatchBacking(e.target.value)}
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
                      <option value='Iron-On'>Heat Press / Iron-On (Standard)</option>
                      <option value='Velcro'>Hook & Loop (Velcro Tactical)</option>
                      <option value='Sew-On'>Sew-On (Plastic Border)</option>
                      <option value='Adhesive'>Peel & Stick (Self-Adhesive)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Target File Formats */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.35rem' }}>
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

              {/* Express Rush 2-6h Toggle */}
              <div 
                onClick={() => setIsRush(!isRush)}
                style={{
                  border: isRush ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
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
                      Express Rush Delivery
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Jump to front of queue (2–6 Hours)
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#d97706' }}>+$10.00</div>
                  <div style={{ fontSize: '0.65rem', color: isRush ? '#059669' : '#94a3b8', fontWeight: 800 }}>
                    {isRush ? 'ACTIVE' : 'OFF'}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 5: REVIEW & PLACE ORDER
              ========================================================================= */}
          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Order Summary Card */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.65rem', marginBottom: '0.65rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Service & Tier</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>{activePkg?.title}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Category</span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', textTransform: 'capitalize' }}>{selectedService}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Quantity: </span>
                    <strong style={{ color: '#0f172a' }}>{quantity} {selectedService === 'patch' ? 'pcs' : 'item(s)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Files Attached: </span>
                    <strong style={{ color: '#0f172a' }}>{uploadedFiles.length} file(s)</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Dimensions: </span>
                    <strong style={{ color: '#0f172a' }}>{widthInches}" × {heightInches}"</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Speed: </span>
                    <strong style={{ color: isRush ? '#d97706' : '#059669' }}>{isRush ? '⚡ Express 2-6H' : 'Standard 12-24H'}</strong>
                  </div>
                </div>
              </div>

              {/* Price Calculation Box */}
              <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '16px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#475569' }}>
                  <span>Base Rate ({quantity} × ${unitPrice.toFixed(2)})</span>
                  <span>${baseSubtotal.toFixed(2)}</span>
                </div>

                {volumeDiscountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#059669' }}>
                    <span>Volume Discount ({volumeDiscountPercent}% OFF)</span>
                    <span>-${volumeDiscountAmount.toFixed(2)}</span>
                  </div>
                )}

                {isRush && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#d97706' }}>
                    <span>Express Rush Queue</span>
                    <span>+$10.00</span>
                  </div>
                )}

                <div style={{ borderTop: '1px dashed #cbd5e1', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>Total Amount</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#047857' }}>
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* =========================================================================
              STEP 6: CONFIRMATION VIEW
              ========================================================================= */}
          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem 0.5rem', gap: '0.85rem' }}>
              
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
              
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0.65rem 1rem', display: 'inline-block' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Order Identifier: </span>
                <strong style={{ fontSize: '0.85rem', color: '#059669' }}>
                  {createdOrderObj?.id || 'Pending'}
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
        {step <= 5 && (
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
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            <button
              type="button"
              disabled={isSubmitting || (step === 3 && uploadedFiles.length === 0)}
              onClick={() => {
                if (step === 1) setStep(2);
                else if (step === 2) setStep(3);
                else if (step === 3) {
                  if (uploadedFiles.length === 0) {
                    setUploadError('Please attach at least one artwork file.');
                    return;
                  }
                  setStep(4);
                }
                else if (step === 4) setStep(5);
                else if (step === 5) handleSubmitOrder();
              }}
              style={{
                background: (step === 3 && uploadedFiles.length === 0)
                  ? '#cbd5e1'
                  : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                cursor: (step === 3 && uploadedFiles.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: (step === 3 && uploadedFiles.length === 0) ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.3)',
                marginLeft: 'auto'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Recording Order...
                </>
              ) : step === 5 ? (
                <>
                  Confirm & Place Order (${totalPrice.toFixed(2)}) <Check size={16} />
                </>
              ) : (
                <>
                  Continue <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MobileSimpleOrderModal;
