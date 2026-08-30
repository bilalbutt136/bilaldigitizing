'use client';

import React, { useState, useRef } from 'react';
import { useAppState, formatOrderId, formatDimensions, formatFabric } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { ProductionWorksheetModal } from '../common/ProductionWorksheetModal';
import { triggerFileDownload, openPdfInNewTab } from '../../utils/fileDownloader';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Download, 
  RotateCcw, 
  Send, 
  Sparkles, 
  FileCheck, 
  UploadCloud, 
  Trash2, 
  Printer, 
  Package, 
  PackageCheck, 
  Zap, 
  MessageSquare, 
  CreditCard, 
  FileText, 
  Layers, 
  ZoomIn, 
  Check, 
  ChevronRight,
  HelpCircle,
  FileCode,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

// Supported machine formats mapping
const MACHINE_FORMAT_EXTENSIONS = {
  dst: { name: 'Tajima (.DST)', desc: 'Universal Commercial Machine Format', icon: '🧵', type: 'Embroidery' },
  pes: { name: 'Brother / Deco (.PES)', desc: 'Home & Commercial Brother Embroidery', icon: '🧵', type: 'Embroidery' },
  emb: { name: 'Wilcom Source File (.EMB)', desc: 'Full Object Density & Stitch Native Data', icon: '💎', type: 'Source File' },
  exp: { name: 'Melco / Bernina (.EXP)', desc: 'Melco & Bernina Machine Stitch File', icon: '🧵', type: 'Embroidery' },
  jef: { name: 'Janome (.JEF)', desc: 'Janome & Elna Memory Craft File', icon: '🧵', type: 'Embroidery' },
  xxx: { name: 'Singer (.XXX)', desc: 'Singer & Compucon Embroidery Format', icon: '🧵', type: 'Embroidery' },
  vp3: { name: 'Husqvarna Viking (.VP3)', desc: 'Pfaff & Viking Multi-format', icon: '🧵', type: 'Embroidery' },
  pdf: { name: 'Production Worksheet (.PDF)', desc: 'Color Stop Sequence & Thread Specs', icon: '📄', type: 'Spec Sheet' },
  ai: { name: 'Adobe Illustrator (.AI)', desc: 'Vector Graphic Source File', icon: '✒️', type: 'Vector' },
  svg: { name: 'Scalable Vector (.SVG)', desc: 'Clean Vector Artwork', icon: '📐', type: 'Vector' },
  eps: { name: 'Encapsulated Postscript (.EPS)', desc: 'Screen Print Vector Asset', icon: '🖼️', type: 'Vector' }
};

export const OrderTrackerDrawer = () => {
  const { 
    selectedOrderForDrawer, 
    setSelectedOrderForDrawer,
    addRevisionRequest,
    updateOrderStatus,
    addOrderMessage,
    orders,
    authUser,
    currentView,
    showToast,
    assignDigitizer,
    digitizers,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    mobileMode
  } = useAppState();

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isMobileLayout = isMobileScreen || mobileMode === 'app';

  // Active section scroll / focus toggle: 'all' | 'requirements' | 'delivery' | 'modification' | 'messages'
  const [activeSection, setActiveSection] = useState('all');

  // Form states
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionImage, setRevisionImage] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxArtwork, setLightboxArtwork] = useState(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);

  // Admin Multiple File Upload Array State
  const [adminFilesList, setAdminFilesList] = useState([]);
  const [adminDragOver, setAdminDragOver] = useState(false);

  // Section Refs for smooth scrolling on the single page
  const requirementsRef = useRef(null);
  const deliveryRef = useRef(null);
  const modificationRef = useRef(null);
  const messagesRef = useRef(null);

  const handleCloseDrawer = () => {
    setSelectedOrderForDrawer(null);
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('trackOrder') || url.searchParams.has('orderId')) {
          url.searchParams.delete('trackOrder');
          url.searchParams.delete('orderId');
          const cleanQuery = url.searchParams.toString();
          const cleanUrl = url.pathname + (cleanQuery ? `?${cleanQuery}` : '');
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch {}
    }
  };

  React.useEffect(() => {
    if (!selectedOrderForDrawer) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [selectedOrderForDrawer]);

  if (!selectedOrderForDrawer) return null;

  // Always resolve live reactive order state from global orders array
  const cleanSelId = String(selectedOrderForDrawer?.id || '').trim().replace(/^#+/, '');
  const selWithHash = `#${cleanSelId}`;
  const ord = orders.find(o => {
    const oClean = String(o?.id || '').trim().replace(/^#+/, '');
    return oClean === cleanSelId || o?.id === selectedOrderForDrawer?.id || o?.id === selWithHash;
  }) || selectedOrderForDrawer;

  const isOrderPaid = (o) => {
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const isPaidFlag = o?.isPaid === true || o?.paid === true || Boolean(o?.paid_at);
    return isPaidFlag || pStatus === 'paid' || pStatus === 'completed' || pStatus === 'settled' || pStatus === 'verified' || pStatus === 'wallet';
  };

  // Robust price resolution that guarantees a positive price for every order
  const getOrderPrice = (o) => {
    if (!o) return 15.00;
    const raw = parseFloat(o.price ?? o.totalPrice ?? o.total_price ?? o.amount ?? o.cost ?? 0);
    if (!isNaN(raw) && raw > 0) return raw;
    const cat = String(o.serviceCategory || o.service_category || o.type || o.serviceType || '').toLowerCase();
    if (cat.includes('vector')) return 12.00;
    if (cat.includes('patch')) return 25.00;
    return 15.00;
  };

  const isPaid = isOrderPaid(ord);
  const orderPrice = getOrderPrice(ord);
  const formattedPrice = `$${orderPrice.toFixed(2)}`;

  // Normalize status — treat 'revision_requested' as 'revision' for all UI guards
  const normalizedStatus = (ord.status === 'revision_requested') ? 'revision' : (ord.status || 'submitted');

  // Files are considered ready ONLY when status is exactly 'delivered' or 'completed'
  const isDelivered = normalizedStatus === 'delivered' || normalizedStatus === 'completed';
  const isCompleted = normalizedStatus === 'completed';
  const isInRevision = normalizedStatus === 'revision';


  const isCurrentlyOnAdminPortal = currentView === 'admin' || (typeof window !== 'undefined' && (window.location.pathname.includes('admin') || window.location.pathname.includes('admin-portal')));
  const isAdmin = (authUser?.role === 'admin' && isCurrentlyOnAdminPortal) || currentView === 'admin';

  // Collect all uploaded artwork / logo files across all placements and attachments
  const clientArtworkFiles = [
    ...(Array.isArray(ord.uploadedFiles) ? ord.uploadedFiles : []),
    ...(Array.isArray(ord.placementItems) ? ord.placementItems.flatMap(p => (Array.isArray(p?.files) ? p.files : []).map(f => ({ ...f, placementName: p?.placement || p?.name }))) : []),
    ...(Array.isArray(ord.patchItems) ? ord.patchItems.flatMap(p => (Array.isArray(p?.files) ? p.files : []).map(f => ({ ...f, placementName: p?.tier || p?.name }))) : []),
    ...(Array.isArray(ord.vectorItems) ? ord.vectorItems.flatMap(v => (Array.isArray(v?.files) ? v.files : []).map(f => ({ ...f, placementName: v?.name }))) : [])
  ].filter(f => f && (f.url || f.public_url || f.previewUrl));

  const uniqueArtworkFiles = [];
  const seenArtUrls = new Set();
  for (const f of clientArtworkFiles) {
    const key = f.url || f.public_url || f.name;
    if (key && !seenArtUrls.has(key)) {
      seenArtUrls.add(key);
      uniqueArtworkFiles.push(f);
    }
  }

  const primaryArtworkSrc = 
    ord.artworkUrl || 
    ord.image_url || 
    ord.logo || 
    uniqueArtworkFiles[0]?.url || 
    uniqueArtworkFiles[0]?.public_url || 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

  const formattedSubmissionDate = ord.createdAt || ord.created_at ? (() => {
    try {
      const d = new Date(ord.createdAt || ord.created_at);
      if (isNaN(d.getTime())) return 'Recent Submission';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent Submission';
    }
  })() : 'Recent Submission';

  const scrollToSection = (ref, sectionKey) => {
    setActiveSection(sectionKey);
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    let finalNote = revisionNote;
    if (revisionImage) {
      finalNote += `\n[Attached Reference File: ${revisionImage.name}]`;
    }
    await addRevisionRequest(ord.id, finalNote);
    await addOrderMessage(ord.id, `🔄 Modification Requested:\n${finalNote}`, ord.clientName || 'Client', 'client');
    setRevisionNote('');
    setRevisionImage(null);
    showToast('Modification request sent to master digitizer desk.', 'success');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const isMobileOrTouch = typeof window !== 'undefined' && (
        window.innerWidth <= 768 || 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );

      // On mobile / touch screens, Enter creates a new line in the message box.
      // On desktop keyboards, Enter sends the message and Shift+Enter creates a new line.
      if (!isMobileOrTouch && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage(e);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatMessageText.trim()) return;
    const senderRole = isAdmin ? 'admin' : 'client';
    const senderName = isAdmin ? (authUser?.name || 'Master Admin Desk') : (ord.clientName || 'Client');
    await addOrderMessage(ord.id, chatMessageText.trim(), senderName, senderRole);
    setChatMessageText('');
    showToast('Message sent', 'success');
  };

  const processAdminFilesList = (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const tempUrl = URL.createObjectURL(file);
      setAdminFilesList(prev => [
        ...prev,
        { name: file.name, format: ext, url: tempUrl, rawFile: file, uploadedAt: new Date().toISOString() }
      ]);
    });
  };

  const removeAdminFile = (indexToRemove) => {
    setAdminFilesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAdminDeliverOrder = async (e) => {
    e.preventDefault();
    if (adminFilesList.length === 0 && (!ord.uploadedMachineFiles || ord.uploadedMachineFiles.length === 0)) {
      alert('Please select or drop at least one deliverable file to complete delivery.');
      return;
    }

    setIsDelivering(true);
    try {
      const uploadedCloudinaryFiles = [];
      for (const fileObj of adminFilesList) {
        if (!fileObj.rawFile) continue;
        const uploaded = await uploadFileToCloudinaryFull(fileObj.rawFile, 'admin-deliveries', 'deliveries');
        if (uploaded) {
          uploadedCloudinaryFiles.push(uploaded);
        } else {
          uploadedCloudinaryFiles.push({ name: fileObj.name, url: fileObj.url, format: fileObj.format });
        }
      }

      const existingFiles = ord.uploadedMachineFiles || [];
      const updatedFiles = [...uploadedCloudinaryFiles, ...existingFiles];
      const deliveryNoteText = deliveryMessage.trim() || 'Your production stitch files and preview documents are ready for download.';

      // Construct Multi-Delivery Structured History (1st Delivery, 2nd Delivery, etc.)
      const existingDeliveries = Array.isArray(ord.deliveries) ? ord.deliveries : [];
      let baseDeliveries = [...existingDeliveries];
      if (baseDeliveries.length === 0 && existingFiles.length > 0) {
        baseDeliveries.push({
          id: 'delivery_initial',
          deliveryNumber: 1,
          title: 'Initial Delivery',
          deliveryDate: ord.deliveryDate || ord.created_at || new Date().toISOString(),
          deliveryMessage: ord.deliveryNotes || ord.deliveryMessage || 'Initial production stitch files.',
          deliveredBy: 'Master Digitizer Desk',
          files: existingFiles
        });
      }

      const newDeliveryNumber = baseDeliveries.length + 1;
      const newDeliveryItem = {
        id: `delivery_${Date.now()}`,
        deliveryNumber: newDeliveryNumber,
        title: newDeliveryNumber === 1 ? 'Initial Delivery' : `Revision Delivery #${newDeliveryNumber - 1}`,
        deliveryDate: new Date().toISOString(),
        deliveryMessage: deliveryNoteText,
        deliveredBy: authUser?.name || 'Master Digitizer Desk',
        files: uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles : existingFiles
      };

      const updatedDeliveries = [newDeliveryItem, ...baseDeliveries];

      await updateOrderStatus(ord.id, 'delivered', {
        status: 'delivered',
        outputFileUrl: uploadedCloudinaryFiles.length > 0 ? (uploadedCloudinaryFiles[0].url || uploadedCloudinaryFiles[0].name) : (ord.outputFileUrl || ''),
        uploadedMachineFiles: updatedFiles,
        deliveries: updatedDeliveries,
        deliveryNotes: deliveryNoteText,
        deliveryMessage: deliveryNoteText,
        deliveryDate: new Date().toISOString()
      });

      // Also add as a chat notification message
      await addOrderMessage(
        ord.id,
        `📦 Delivery #${newDeliveryNumber} Dispatched:\n${deliveryNoteText}\n${(uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles.length : updatedFiles.length)} file(s) available for download.`,
        authUser?.name || 'Master Digitizer Desk',
        'admin'
      );

      setAdminFilesList([]);
      setDeliveryMessage('');
      showToast(`🎉 Delivery #${newDeliveryNumber} successfully sent to client!`, 'success');
    } catch (err) {
      console.error('Delivery error:', err);
      showToast('Delivery failed. Please try again.', 'error');
    } finally {
      setIsDelivering(false);
    }
  };

  const handleDownloadFileAsset = (fileObj, fallbackFormatKey) => {
    if (fileObj && fileObj.url) {
      const fileName = fileObj.name || `${(ord.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${fileObj.format || fallbackFormatKey || 'dst'}`;
      triggerFileDownload(fileObj.url, fileName);
      return;
    }

    const formatKey = (fallbackFormatKey || 'dst').toLowerCase();
    if (formatKey === 'pdf') {
      if (ord.outputFileUrl && (ord.outputFileUrl.toLowerCase().endsWith('.pdf') || ord.outputFileUrl.includes('.pdf'))) {
        triggerFileDownload(ord.outputFileUrl, `${(ord.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.pdf`);
      } else {
        setShowWorksheetModal(true);
      }
      return;
    }

    const fileName = `${(ord.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;
    if (ord.outputFileUrl) {
      triggerFileDownload(ord.outputFileUrl, fileName);
    } else {
      setShowWorksheetModal(true);
    }
  };

  const userFormats = ord.requestedFormats || ['dst', 'pes', 'emb'];
  const allDownloadFormats = Array.from(new Set([...userFormats, 'pdf']));

  const uniqueMachineFiles = (ord.uploadedMachineFiles || []).reduce((acc, file) => {
    if (!acc.some(f => f.name === file.name)) acc.push(file);
    return acc;
  }, []);

  const handleDownloadAll = () => {
    const filesToDownload = uniqueMachineFiles.length > 0 ? uniqueMachineFiles : allDownloadFormats.map(fmt => ({ name: null, format: fmt }));
    filesToDownload.forEach((file, index) => {
      setTimeout(() => {
        if (file.name === null) {
          handleDownloadFileAsset(null, file.format);
        } else {
          const ext = file.format || (file.name && file.name.split('.').pop().toLowerCase()) || 'dst';
          handleDownloadFileAsset(file, ext);
        }
      }, index * 400);
    });
  };

  const handleLaunchPayment = () => {
    const priceAmount = getOrderPrice(ord);
    if (setCheckoutSession && setIsCheckoutModalOpen) {
      setCheckoutSession({
        amount: priceAmount,
        price: priceAmount,
        totalPrice: priceAmount,
        orderId: ord.id,
        title: ord.title || `Order ${formatOrderId(ord.id)}`,
        orderTitle: ord.title || `Order ${formatOrderId(ord.id)}`,
        clientEmail: ord.clientEmail || ord.client_email || authUser?.email,
        serviceType: ord.serviceCategory || ord.type || 'embroidery'
      });
      setIsCheckoutModalOpen(true);
    }
  };

  const handleApproveDelivery = async () => {
    await updateOrderStatus(ord.id, 'completed');
    if (setSelectedOrderForDrawer) {
      setSelectedOrderForDrawer(prev => prev ? { ...prev, status: 'completed' } : prev);
    }
    await addOrderMessage(ord.id, '✅ Delivery Approved & Order Completed by Client.', ord.clientName || 'Client', 'client');
    showToast('🎉 Delivery approved! Thank you for choosing Bilal Digitizing.', 'success');
  };

  const getStatusBadge = () => {
    const s = String(ord.status || 'submitted').toLowerCase();
    const pStatus = String(ord.payment_status || ord.paymentStatus || '').toLowerCase();
    const isUnpaid = s === 'awaiting_payment' || s === 'pending_payment' || pStatus === 'unpaid' || (!isPaid && (s === 'awaiting_payment' || s === 'pending_payment' || s === 'submitted'));

    if (isUnpaid && !isPaid) {
      return (
        <span style={{
          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          color: '#ffffff',
          border: '1px solid #fdba74',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 900,
          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          ⏳ Waiting for Payment to Start
        </span>
      );
    }
    if (s === 'completed') return <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>✅ Completed</span>;
    if (s === 'delivered') return <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>📦 Delivered</span>;
    if (s === 'revision' || s === 'revision_requested') return <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔄 Modification Requested</span>;
    if (s === 'qc' || s === 'quality_check') return <span style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔍 Quality Check</span>;
    if (s === 'in_progress' || s === 'digitizing' || s === 'assigned') return <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⚡ In Production</span>;
    return <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔴 Submitted</span>;
  };

  return (
    <div 
      className={isMobileLayout ? "mobile-fullscreen-modal" : "modal-overlay"}
      onClick={handleCloseDrawer}
      style={{ 
        zIndex: 99990, 
        background: isMobileLayout ? '#ffffff' : 'rgba(11, 19, 41, 0.85)', 
        backdropFilter: 'blur(10px)', 
        padding: isMobileLayout ? '0' : 'clamp(0.5rem, 2vw, 1.5rem)',
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: isMobileLayout ? 'stretch' : 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100dvh'
      }}
    >
      <div 
        className="modal-content theme-light-enforced" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: isMobileLayout ? '100vw' : '960px', 
          width: '100%',
          height: isMobileLayout ? '100dvh' : 'auto',
          maxHeight: isMobileLayout ? '100dvh' : '94vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: isMobileLayout ? '0px' : '20px',
          border: isMobileLayout ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: isMobileLayout ? 'none' : '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          background: '#ffffff',
          margin: 0
        }}
      >
        
        {/* ==================================================================
            1. TOP HEADER (COMPACT & SAFE AREA OPTIMIZED)
           ================================================================== */}
        <div className="modal-header-dark" style={{
          padding: isMobileLayout ? 'max(0.75rem, env(safe-area-inset-top, 0.75rem)) 1rem 0.75rem' : '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #090f1d 0%, #111a2e 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            {isMobileLayout && (
              <button
                type="button"
                onClick={handleCloseDrawer}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Back to Orders"
              >
                <ArrowLeft size={18} />
              </button>
            )}

            <div style={{
              width: isMobileLayout ? '36px' : '44px',
              height: isMobileLayout ? '36px' : '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
              color: 'var(--color-text-on-primary, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px var(--color-primary-glow)'
            }}>
              <Layers size={isMobileLayout ? 18 : 22} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <h3 className="order-drawer-title" style={{ fontSize: isMobileLayout ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ord.title || `Order ${formatOrderId(ord.id)}`}
                </h3>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.14)', 
                  color: '#f8fafc', 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  padding: '0.12rem 0.45rem', 
                  borderRadius: '6px' 
                }}>
                  {formatOrderId(ord.id)}
                </span>
                {getStatusBadge()}
                {isPaid ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={11} /> PAID
                  </span>
                ) : (
                  <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> PENDING
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}</span>
                <span>•</span>
                <span>{formattedSubmissionDate}</span>
                {ord.clientName && <span>• Client: <strong style={{ color: '#ffffff' }}>{ord.clientName}</strong></span>}
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleCloseDrawer}
            style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: 'none', 
              color: '#cbd5e1', 
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* ==================================================================
            2. QUICK NAV TOOLBAR ON SINGLE PAGE
           ================================================================== */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          padding: isMobileLayout ? '0.5rem 0.75rem' : '0.6rem 1.5rem',
          gap: '0.4rem',
          overflowX: 'auto',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}>
          <button
            type="button"
            onClick={() => scrollToSection(requirementsRef, 'requirements')}
            className={`btn btn-sm ${activeSection === 'requirements' ? 'btn-primary-orange' : 'btn-outline'}`}
            style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <FileText size={14} /> Order Requirements
          </button>

          <button
            type="button"
            onClick={() => scrollToSection(deliveryRef, 'delivery')}
            className={`btn btn-sm ${activeSection === 'delivery' ? 'btn-primary-orange' : 'btn-outline'}`}
            style={{ 
              fontWeight: 800, 
              fontSize: '0.8rem', 
              gap: '0.35rem',
              borderColor: (isCompleted || isDelivered) ? '#10b981' : undefined,
              color: (isCompleted || isDelivered) && activeSection !== 'delivery' ? '#047857' : undefined,
              background: (isCompleted || isDelivered) && activeSection !== 'delivery' ? '#ecfdf5' : undefined
            }}
          >
            <PackageCheck size={14} /> {isAdmin ? 'Deliver Order / Files' : (isCompleted ? '✅ Final Deliverables' : (isDelivered ? '✨ Delivered Files' : 'Deliverables'))}
          </button>

          {/* Request Modification Tab: ONLY visible when delivered or in revision, NEVER when completed */}
          {!isCompleted && (normalizedStatus === 'delivered' || isInRevision) && (
            <button
              type="button"
              onClick={() => scrollToSection(modificationRef, 'modification')}
              className={`btn btn-sm ${activeSection === 'modification' ? 'btn-primary-orange' : 'btn-outline'}`}
              style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <RotateCcw size={14} /> {isInRevision ? '🔄 In Revision' : 'Request Modification'}
            </button>
          )}

          {isCompleted && Array.isArray(ord.revisions) && ord.revisions.length > 0 && (
            <button
              type="button"
              onClick={() => scrollToSection(modificationRef, 'modification')}
              className={`btn btn-sm ${activeSection === 'modification' ? 'btn-primary-orange' : 'btn-outline'}`}
              style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.35rem' }}
            >
              <RotateCcw size={14} /> Revision History ({ord.revisions.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollToSection(messagesRef, 'messages')}
            className={`btn btn-sm ${activeSection === 'messages' ? 'btn-primary-orange' : 'btn-outline'}`}
            style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <MessageSquare size={14} /> Messages {Array.isArray(ord.messages) && ord.messages.length > 0 ? `(${ord.messages.length})` : ''}
          </button>
        </div>

        {/* ==================================================================
            3. MAIN SCROLLABLE CONTENT BODY (SINGLE PAGE)
           ================================================================== */}
        <div style={{
          padding: isMobileLayout ? '0.85rem' : '1.5rem',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          background: 'var(--bg-main)',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobileLayout ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>

          {/* Unpaid / Waiting for Payment Urgent Banner */}
          {!isPaid && !isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.18)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)'
                }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.05rem', fontWeight: 900, color: '#92400e' }}>
                    ⏳ Waiting for Payment to Start Production
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#78350f', lineHeight: 1.4 }}>
                    Your order requirements and specifications are safely saved. Complete payment of <strong>{formattedPrice}</strong> to dispatch this design to our master digitizing desk immediately.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchPayment}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <Zap size={18} /> Pay Now ({formattedPrice})
              </button>
            </div>
          )}

          {/* STEPPER PROGRESS TRACKER */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '16px',
            padding: '1rem 1.4rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              {[
                { step: 1, title: isPaid ? 'Placed & Paid' : 'Pending Payment', passed: isPaid, current: !isPaid },
                { step: 2, title: 'In Production', passed: isPaid && (isDelivered || ord.status === 'qc'), current: isPaid && !isDelivered && ord.status !== 'qc' },
                { step: 3, title: 'Quality Check', passed: isPaid && isDelivered, current: isPaid && ord.status === 'qc' },
                { step: 4, title: isCompleted ? 'Completed' : (isDelivered ? 'Delivered' : 'Ready Delivery'), passed: isCompleted, current: isDelivered && !isCompleted }
              ].map(st => (
                <div key={st.step}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    margin: '0 auto 0.35rem auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    background: st.passed ? '#10b981' : st.current ? (st.step === 1 && !isPaid ? '#f59e0b' : 'var(--orange-500)') : '#f1f5f9',
                    color: (st.passed || st.current) ? '#ffffff' : '#94a3b8'
                  }}>
                    {st.passed ? <Check size={15} /> : st.step}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: st.current ? 800 : 700, color: st.current ? 'var(--orange-600)' : st.passed ? '#10b981' : 'var(--navy-900)' }}>
                    {st.title}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN UNPAID NOTICE */}
          {!isPaid && isAdmin && (
            <div style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '0.9rem 1.3rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.9rem' }}>
                    Payment Status: Awaiting Client Checkout ({formattedPrice})
                  </div>
                  <div style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                    Customer has submitted requirements but has not finalized online payment yet.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateOrderStatus(ord.id, 'in_progress', { payment_status: 'paid', paymentStatus: 'paid', isPaid: true, paid_at: new Date().toISOString() })}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.78rem', fontWeight: 800, borderColor: '#10b981', color: '#047857', background: '#ecfdf5' }}
              >
                ✓ Mark Paid (Admin)
              </button>
            </div>
          )}

          {/* ================================================================
              SECTION A: DELIVERED FILES & DELIVERY ACTIONS (TOP PRIORITY)
             ================================================================ */}
          <div 
            ref={deliveryRef}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📦</span>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {isAdmin ? 'Deliver Order & Files (Admin Desk)' : 'Delivered Production Files'}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isAdmin ? 'Upload finished machine stitch files and write delivery notes to client' : 'Download your finished machine deliverables and approve or request changes'}
                  </div>
                </div>
              </div>

              {isDelivered && (
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="btn btn-primary-orange btn-sm"
                  style={{ gap: '0.35rem', fontWeight: 800 }}
                >
                  <Download size={14} /> Download All (.ZIP)
                </button>
              )}
            </div>

            {/* ADMIN DELIVERY COMPOSER */}
            {isAdmin && (
              <form onSubmit={handleAdminDeliverOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '14px', border: '1.5px dashed var(--orange-500)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                    📤 Upload Deliverables & Write Delivery Note
                  </span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 1rem', background: 'var(--orange-500)', color: '#ffffff', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                    <UploadCloud size={14} /> Browse Machine Files
                    <input type="file" multiple accept="*/*" onChange={(e) => processAdminFilesList(e.target.files)} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Staged Upload Files List */}
                {adminFilesList.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {adminFilesList.map((f, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
                          <FileCheck size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                        </div>
                        <button type="button" onClick={() => removeAdminFile(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><Trash2 size={13}/></button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delivery Notes */}
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '0.3rem', display: 'block' }}>
                    Delivery Message / Stitch Specifications for Client:
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Write a message (e.g., Stitch count: 11,400 stitches, tested for pique cotton polo, .DST, .PES and Wilcom .EMB attached)..."
                    value={deliveryMessage}
                    onChange={(e) => setDeliveryMessage(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary-orange"
                    disabled={isDelivering || (adminFilesList.length === 0 && (!ord.uploadedMachineFiles || ord.uploadedMachineFiles.length === 0))}
                    style={{ fontWeight: 800, gap: '0.4rem' }}
                  >
                    <Send size={15} /> {isDelivering ? 'Uploading & Delivering...' : '🚀 Deliver Order to Client'}
                  </button>
                </div>
              </form>
            )}

            {/* MULTI-DELIVERY HISTORY TIMELINE (1st, 2nd, 3rd Deliveries) */}
            {isDelivered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.25rem' }}>
                {Array.isArray(ord.deliveries) && ord.deliveries.length > 0 ? (
                  ord.deliveries.map((delivery, dIdx) => {
                    const isLatest = dIdx === 0;
                    const dFiles = Array.isArray(delivery.files) && delivery.files.length > 0 ? delivery.files : uniqueMachineFiles;
                    const dDateStr = delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently delivered';

                    return (
                      <div 
                        key={delivery.id || dIdx}
                        style={{
                          background: isLatest ? '#f0fdf4' : '#f8fafc',
                          border: isLatest ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                          borderRadius: '14px',
                          padding: '1.25rem',
                          boxShadow: isLatest ? '0 4px 14px rgba(16, 185, 129, 0.08)' : 'none'
                        }}
                      >
                        {/* Delivery Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem', borderBottom: isLatest ? '1px solid #bbf7d0' : '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.15rem' }}>📦</span>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <strong style={{ fontSize: '0.95rem', color: isLatest ? '#065f46' : 'var(--navy-900)' }}>
                                  {delivery.title || `Delivery #${delivery.deliveryNumber || (ord.deliveries.length - dIdx)}`}
                                </strong>
                                {isLatest && (
                                  <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                                    Latest Delivery
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: isLatest ? '#047857' : 'var(--text-muted)' }}>
                                Dispatched {dDateStr} by {delivery.deliveredBy || 'Master Digitizer Desk'}
                              </span>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isLatest ? '#059669' : 'var(--text-muted)' }}>
                            {dFiles.length} file(s)
                          </span>
                        </div>

                        {/* Delivery Note */}
                        {(delivery.deliveryMessage || delivery.deliveryNotes) && (
                          <div style={{ background: isLatest ? '#ffffff' : '#f1f5f9', border: isLatest ? '1px solid #bbf7d0' : '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '0.85rem' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isLatest ? '#065f46' : 'var(--navy-800)', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Sparkles size={12} /> Digitizer Note:
                            </div>
                            <div style={{ fontSize: '0.84rem', color: isLatest ? '#047857' : 'var(--text-main)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                              {delivery.deliveryMessage || delivery.deliveryNotes}
                            </div>
                          </div>
                        )}

                        {/* Delivery Files Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                          {dFiles.map((f, fIdx) => {
                            const ext = (f.format || f.name?.split('.').pop() || 'dst').toUpperCase();
                            const isPdf = ext.toLowerCase() === 'pdf';
                            const fileIcon = isPdf ? '📄' : (['AI', 'EPS', 'SVG', 'CDR'].includes(ext) ? '🎨' : (['ZIP', 'RAR', '7Z'].includes(ext) ? '📦' : '🧵'));

                            return (
                              <div key={fIdx} style={{ background: '#ffffff', border: isPdf ? '1.5px solid #fed7aa' : '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '1.2rem' }}>{fileIcon}</span>
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {f.name || `Production_File.${ext}`}
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: isPdf ? '#ea580c' : 'var(--text-muted)', fontWeight: isPdf ? 700 : 500 }}>
                                      .{ext} {isPdf ? 'Worksheet & Preview' : 'Production File'}
                                    </div>
                                  </div>
                                </div>
                                {isPdf ? (
                                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    {f.url && (
                                      <button
                                        type="button"
                                        onClick={() => openPdfInNewTab(f.url, f.name || 'document.pdf')}
                                        className="btn btn-outline btn-sm"
                                        style={{ flex: 1, gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.35rem' }}
                                      >
                                        👁️ View
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadFileAsset(f, 'pdf')}
                                      className="btn btn-primary-orange btn-sm"
                                      style={{ flex: 1, gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.35rem' }}
                                    >
                                      <Download size={11} /> Download
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFileAsset(f, ext)}
                                    className="btn btn-outline btn-sm"
                                    style={{ width: '100%', gap: '0.25rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.5rem' }}
                                  >
                                    <Download size={12} /> Download .{ext}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div>
                    {/* Fallback Single Delivery Display */}
                    {(ord.deliveryNotes || ord.deliveryMessage) && (
                      <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Sparkles size={13} /> Digitizer Delivery Note:
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#047857', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {ord.deliveryNotes || ord.deliveryMessage}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      {uniqueMachineFiles.length > 0 ? (
                        uniqueMachineFiles.map((f, idx) => {
                          const ext = (f.format || f.name?.split('.').pop() || 'dst').toUpperCase();
                          const isPdf = ext.toLowerCase() === 'pdf';
                          const fileIcon = isPdf ? '📄' : (['AI', 'EPS', 'SVG', 'CDR'].includes(ext) ? '🎨' : (['ZIP', 'RAR', '7Z'].includes(ext) ? '📦' : '🧵'));

                          return (
                            <div key={idx} style={{ background: '#f8fafc', border: isPdf ? '1.5px solid #fed7aa' : '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{fileIcon}</span>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || `Machine_File.${ext}`}</div>
                                  <div style={{ fontSize: '0.72rem', color: isPdf ? '#ea580c' : 'var(--text-muted)', fontWeight: isPdf ? 700 : 500 }}>.{ext} {isPdf ? 'Worksheet & Preview' : 'Production File'}</div>
                                </div>
                              </div>
                              {isPdf ? (
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  {f.url && (
                                    <button
                                      type="button"
                                      onClick={() => openPdfInNewTab(f.url, f.name || 'document.pdf')}
                                      className="btn btn-outline btn-sm"
                                      style={{ flex: 1, gap: '0.25rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}
                                    >
                                      👁️ View
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFileAsset(f, 'pdf')}
                                    className="btn btn-primary-orange btn-sm"
                                    style={{ flex: 1, gap: '0.25rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}
                                  >
                                    <Download size={13} /> Download
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFileAsset(f, ext)}
                                  className="btn btn-outline btn-sm"
                                  style={{ width: '100%', gap: '0.3rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}
                                >
                                  <Download size={13} /> Download .{ext}
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        allDownloadFormats.map(fmt => {
                          const isPdf = fmt.toLowerCase() === 'pdf';
                          const fileIcon = isPdf ? '📄' : (['ai', 'eps', 'svg', 'cdr'].includes(fmt.toLowerCase()) ? '🎨' : '🧵');

                          return (
                            <div key={fmt} style={{ background: '#f8fafc', border: isPdf ? '1.5px solid #fed7aa' : '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>{fileIcon}</span>
                                <div>
                                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.84rem' }}>Format (.{fmt.toUpperCase()})</div>
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standard Production Package</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDownloadFileAsset(null, fmt)}
                                className="btn btn-outline btn-sm"
                                style={{ width: '100%', gap: '0.3rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}
                              >
                                <Download size={13} /> {isPdf ? 'Open / Download PDF' : `Download .${fmt.toUpperCase()}`}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isDelivered && (
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '1.25rem' }}>
                <Clock size={24} style={{ color: 'var(--orange-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.92rem' }}>Order Currently in Master Digitizing Production</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Files are being processed and tested. Once completed, your machine packages will appear here.</div>
              </div>
            )}

            {/* CUSTOMER APPROVE & MODIFICATION ACTION ROW (WHEN DELIVERED) */}
            {!isAdmin && isDelivered && !isCompleted && ord.status !== 'revision' && ord.status !== 'revision_requested' && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.88rem' }}>Satisfied with the result?</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approve delivery to finalize order, or request a free modification if any adjustments are needed.</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleApproveDelivery}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <CheckCircle2 size={15} /> Approve Delivery
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection(modificationRef, 'modification')}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 800, color: '#b45309', borderColor: '#fde68a', background: '#fffbeb', gap: '0.3rem' }}
                  >
                    <RotateCcw size={14} /> Request Modification
                  </button>
                </div>
              </div>
            )}

            {/* CUSTOMER REVISION IN PROGRESS BANNER */}
            {!isAdmin && isInRevision && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#fff1f2', padding: '1rem 1.25rem', borderRadius: '12px', border: '1.5px solid #fecdd3', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e11d48', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#9f1239', fontSize: '0.92rem' }}>Modification Currently Under Production</div>
                    <div style={{ fontSize: '0.76rem', color: '#be123c', marginTop: '0.1rem' }}>Our digitizing team is currently revising your design according to your instructions.</div>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMER COMPLETED & APPROVED CELEBRATION ROW */}
            {!isAdmin && isCompleted && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#ecfdf5', padding: '1rem 1.25rem', borderRadius: '12px', border: '1.5px solid #a7f3d0', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.92rem' }}>Order Approved & Completed Successfully!</div>
                    <div style={{ fontSize: '0.76rem', color: '#047857', marginTop: '0.1rem' }}>All stitch files, source documents, and production worksheets are permanently archived in your studio.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleDownloadAllDeliveryFiles(activeDeliveryFiles)}
                    className="btn btn-sm"
                    style={{ background: '#059669', color: '#ffffff', fontWeight: 800, border: 'none', padding: '0.5rem 1.15rem', borderRadius: '8px', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={14} /> Download All Files
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================================================================
              SECTION B: ORDER REQUIREMENTS & SOURCE ARTWORK
             ================================================================ */}
          <div 
            ref={requirementsRef}
            style={{
              background: 'var(--bg-card)',
              borderRadius: isMobileLayout ? '12px' : '16px',
              border: '1.5px solid var(--border-color)',
              padding: isMobileLayout ? '1rem' : '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <div>
                  <h4 style={{ fontSize: isMobileLayout ? '0.98rem' : '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Order Requirements & Specifications
                  </h4>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Customer instructions, dimensions, target fabric, and source logo files
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: isMobileLayout ? '1rem' : '1.5rem', flexDirection: isMobileLayout ? 'column' : 'row', alignItems: 'stretch' }}>
              {/* Artwork Box */}
              <div 
                onClick={() => setLightboxArtwork({ url: primaryArtworkSrc, name: ord.title })}
                style={{ 
                  width: isMobileLayout ? '100%' : '180px', 
                  flexShrink: 0, 
                  cursor: 'pointer', 
                  background: 'var(--bg-surface)', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '0.65rem',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ height: isMobileLayout ? '180px' : '150px', background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                  <img 
                    src={primaryArtworkSrc} 
                    alt="Design"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-500)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                  <ZoomIn size={12} /> Inspect Full Logo (Tap to Zoom)
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobileLayout ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Service Category</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Fabric</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatFabric(ord.fabric || ord.fabricType)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dimensions</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatDimensions(ord.dimensions || ord.size)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Placement</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {ord.placement || ord.placementItems?.[0]?.placement || 'Standard Placement'}
                    </div>
                  </div>
                </div>

                {/* Customer Instructions Text */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--orange-500)', marginBottom: '0.25rem' }}>
                    📝 Customer Notes & Instructions:
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                    {ord.notes || 'Standard high-density stitch pathing with underlay and pull compensation applied for commercial production.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Attached Original Source Files */}
            {uniqueArtworkFiles.length > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.65rem' }}>
                  📎 Source Artwork Files ({uniqueArtworkFiles.length})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                  {uniqueArtworkFiles.map((artFile, aIdx) => {
                    const fileExt = (artFile.format || artFile.name?.split('.').pop() || 'png').toUpperCase();
                    return (
                      <div key={aIdx} style={{ background: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artFile.name || `Artwork_${aIdx + 1}.${fileExt.toLowerCase()}`}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>.{fileExt} Original</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => triggerFileDownload(artFile.url || artFile.public_url, artFile.name || `artwork_${aIdx + 1}.${fileExt.toLowerCase()}`, fileExt.toLowerCase())}
                          style={{ border: 'none', background: 'none', color: 'var(--orange-500)', cursor: 'pointer', padding: '0.2rem' }}
                          title="Download Original"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================
              SECTION C: MODIFICATION / REVISIONS REQUEST
             ================================================================ */}
          {(normalizedStatus === 'delivered' || isInRevision || (isCompleted && Array.isArray(ord.revisions) && ord.revisions.length > 0)) && (
            <div 
              ref={modificationRef}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1.5px solid var(--border-color)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>🔄</span>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {isCompleted ? 'Revision History (Archived)' : 'Modification & Revision Requests'}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {isCompleted ? 'Completed project revision logs' : 'Free unlimited adjustments on density, size, colors, or pull compensation'}
                    </div>
                  </div>
                </div>

                {isCompleted && (
                  <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800 }}>
                    ✅ Completed & Locked
                  </span>
                )}
              </div>

              {/* Revision In Progress Banner */}
              {isInRevision && (
                <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <RotateCcw size={20} style={{ color: '#e11d48', flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#9f1239', fontSize: '0.88rem' }}>Modification Currently Under Production</div>
                    <div style={{ fontSize: '0.78rem', color: '#be123c', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      Our master digitizer team is working on your requested changes. You will receive an instant notification as soon as updated stitch files are uploaded.
                    </div>
                  </div>
                </div>
              )}

              {/* Revisions History */}
              {Array.isArray(ord.revisions) && ord.revisions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revision Logs ({ord.revisions.length})</div>
                  {ord.revisions.map((rev, idx) => (
                    <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 800, marginBottom: '0.2rem' }}>
                        🔄 Revision #{ord.revisions.length - idx} • {new Date(rev.createdAt || rev.created_at || Date.now()).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{rev.note || rev.notes || rev.details}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Revision Form: ONLY active when delivered and NOT completed/in_revision */}
              {ord.status === 'delivered' && !isCompleted && (
                <form onSubmit={handleRevisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Describe Required Changes:
                  </label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    placeholder="Explain what you would like modified (e.g. increase satin stitch width on border, change height to 3.2 inches, change blue thread to navy)..." 
                    value={revisionNote} 
                    onChange={e => setRevisionNote(e.target.value)} 
                    style={{ fontSize: '0.85rem' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600 }}>
                      📎 {revisionImage ? revisionImage.name : 'Attach Reference Image / Screenshot'}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setRevisionImage(e.target.files[0]); }} />
                    </label>

                    <button 
                      type="submit" 
                      className="btn btn-primary-orange btn-sm" 
                      disabled={!revisionNote.trim()}
                      style={{ fontWeight: 800 }}
                    >
                      Submit Modification Request
                    </button>
                  </div>
                </form>
              )}

              {/* Completed Notice */}
              {isCompleted && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                  ℹ️ This order is approved and completed. If you need a completely new design variant, you can place a new order from your dashboard anytime.
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SECTION D: LIVE MESSAGES & PROJECT COMMUNICATION
             ================================================================ */}
          <div 
            ref={messagesRef}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>💬</span>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Project Discussion & Activity
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Direct communication with the master digitizing desk
                  </div>
                </div>
              </div>
            </div>

            {/* Message Feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto', padding: '0.35rem', marginBottom: '0.85rem' }}>
              {(!Array.isArray(ord.messages) || ord.messages.length === 0) ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1.5rem 1rem', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  No messages on this project yet. Write below to chat with your digitizer.
                </div>
              ) : (
                ord.messages.map((msg, mIdx) => {
                  const isMsgAdmin = msg.senderRole === 'admin' || msg.sender === 'admin';
                  const isMe = isAdmin ? isMsgAdmin : !isMsgAdmin;
                  const isRead = msg.is_read === true || msg.is_read === 'true';

                  return (
                    <div key={mIdx} style={{ 
                      background: isMe 
                        ? (isRead ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)')
                        : (!isRead ? '#fffbf5' : 'var(--bg-surface)'), 
                      color: isMe ? '#ffffff' : 'var(--text-main)',
                      border: isMe ? 'none' : (!isRead ? '1.5px solid #fed7aa' : '1px solid var(--border-color)'),
                      borderLeft: (!isMe && !isRead) ? '4.5px solid #ea580c' : (isMe ? 'none' : '1px solid var(--border-color)'),
                      boxShadow: isMe ? '0 2px 8px rgba(234, 88, 12, 0.2)' : (!isRead ? '0 3px 10px rgba(234, 88, 12, 0.1)' : 'none'),
                      padding: '0.75rem 1rem', 
                      borderRadius: '10px', 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: isMe ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{isMsgAdmin ? 'Master Digitizer Desk' : (msg.senderName || msg.sender || 'Client')}</span>
                        <span>•</span>
                        <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                      </div>
                      <div style={{ fontSize: '0.84rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{msg.text}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea 
                rows={1}
                className="form-control" 
                placeholder="Type a message..." 
                value={chatMessageText} 
                onChange={e => setChatMessageText(e.target.value)} 
                onKeyDown={handleKeyDown}
                style={{
                  flex: 1,
                  minHeight: '36px',
                  maxHeight: '100px',
                  fontSize: '0.85rem',
                  padding: '0.45rem 0.75rem',
                  resize: 'none',
                  lineHeight: 1.4,
                  overflowY: 'auto',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!chatMessageText.trim()} style={{ height: '36px', fontWeight: 800, gap: '0.3rem', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <Send size={14} /> Send
              </button>
            </form>
          </div>

        </div>

        {/* ==================================================================
            4. STICKY ACTION FOOTER
           ================================================================== */}
        <div style={{
          padding: isMobileLayout ? '0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' : '0.85rem 1.6rem',
          background: '#ffffff',
          borderTop: '1.5px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: isMobileLayout ? '0 -4px 16px rgba(0,0,0,0.06)' : 'var(--shadow-sm)',
          position: 'sticky',
          bottom: 0,
          zIndex: 20,
          flexShrink: 0
        }}>
          {/* Left: Total Price and Payment Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Project Total</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                {formattedPrice}
              </div>
            </div>
            {isPaid ? (
              <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem' }}>
                PAID
              </span>
            ) : (
              <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem' }}>
                PENDING
              </span>
            )}
          </div>

          {/* Right: Quick Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {!isPaid && !isAdmin ? (
              <button
                type="button"
                onClick={handleLaunchPayment}
                className="btn btn-primary-orange"
                style={{ fontWeight: 900, gap: '0.35rem', padding: '0.5rem 1.25rem' }}
              >
                <Zap size={15} /> Pay Now ({formattedPrice})
              </button>
            ) : !isPaid && isAdmin ? (
              <button
                type="button"
                onClick={() => updateOrderStatus(ord.id, 'in_progress', { payment_status: 'paid', paymentStatus: 'paid', isPaid: true, paid_at: new Date().toISOString() })}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem', fontWeight: 800, borderColor: '#10b981', color: '#047857', background: '#ecfdf5' }}
              >
                ✓ Mark Paid (Admin)
              </button>
            ) : isDelivered && !isCompleted && ord.status !== 'revision' && ord.status !== 'revision_requested' && !isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={handleApproveDelivery}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <CheckCircle2 size={15} /> Approve Delivery
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(modificationRef, 'modification')}
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 800 }}
                >
                  <RotateCcw size={14} /> Request Modification
                </button>
              </>
            ) : isCompleted && !isAdmin ? (
              <button
                type="button"
                onClick={() => handleDownloadAllDeliveryFiles(activeDeliveryFiles)}
                className="btn btn-sm"
                style={{ background: '#059669', color: '#ffffff', fontWeight: 800, border: 'none', padding: '0.5rem 1.15rem', borderRadius: '8px', gap: '0.35rem', cursor: 'pointer' }}
              >
                <Download size={14} /> Download Deliverables
              </button>
            ) : isInRevision && !isAdmin ? (
              <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCcw size={13} /> Modification Under Production
              </span>
            ) : null}

            <button
              type="button"
              onClick={handleCloseDrawer}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxArtwork && (
        <ArtworkLightboxModal
          order={lightboxArtwork ? {
            ...ord,
            title: lightboxArtwork.name || ord.title,
            artworkUrl: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl,
            image_url: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl,
            logo: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl
          } : ord} 
          onClose={() => setLightboxArtwork(null)}
        />
      )}

      {/* Production Worksheet Modal */}
      {showWorksheetModal && (
        <ProductionWorksheetModal
          order={ord}
          onClose={() => setShowWorksheetModal(false)}
        />
      )}
    </div>
  );
};
