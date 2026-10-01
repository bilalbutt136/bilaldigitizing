'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState, formatOrderId, formatDimensions, formatFabric } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { ProductionWorksheetModal } from '../common/ProductionWorksheetModal';
import { PdfPreviewModal } from '../common/PdfPreviewModal';
import { triggerFileDownload as _triggerFileDownload, downloadFileDirectly, openPdfInNewTab, openFileInNewTab } from '../../utils/fileDownloader';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';
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
  Printer as _Printer,
  Package as _Package,
  PackageCheck,
  Zap,
  CreditCard,
  FileText,
  Layers,
  ZoomIn,
  Check,
  ChevronRight as _ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle as _HelpCircle,
  FileCode as _FileCode,
  ShieldCheck as _ShieldCheck,
  ArrowLeft,
  Palette,
  Scissors,
  UserCheck,
  AlertCircle as _AlertCircle,
  AlertTriangle,
  Receipt,
  ExternalLink,
  Loader2,
  XCircle,
  Star
} from 'lucide-react';
import { uploadFileToCloudinaryFull, fetchOrderById } from '../../services/supabaseService';
import { AssignWorkerModal } from '../admin/AssignWorkerModal';
import { ReviewWorkerUploadModal } from '../admin/ReviewWorkerUploadModal';
import { CustomerInvoiceModal } from '../common/CustomerInvoiceModal';
import { CustomerReviewModal } from './CustomerReviewModal';
import { fetchOrderReview } from '../../services/reviewService';
import { getMobileOrderTrackingState } from '../../utils/orderTracking';

// Supported machine formats mapping
const _MACHINE_FORMAT_EXTENSIONS = {
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
    requestOrderCancellation,
    approveOrderCancellation,
    rejectOrderCancellation,
    orders,
    authUser,
    currentView,
    showToast,
    assignDigitizer: _assignDigitizer,
    digitizers: _digitizers,
    setIsCheckoutModalOpen,
    setCheckoutSession,
    mobileMode,
    theme
  } = useAppState();

  const isDark = theme === 'dark';

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

  // Active section scroll / focus toggle: 'all' | 'requirements' | 'delivery' | 'modification'
  const [activeSection, setActiveSection] = useState('all');

  // Form states
  const [revisionNote, setRevisionNote] = useState('');
  const [revisionImage, setRevisionImage] = useState(null);
  const [deliveryMessage, setDeliveryMessage] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [_showLightbox, _setShowLightbox] = useState(false);
  const [lightboxArtwork, setLightboxArtwork] = useState(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);
  const [activePdfPreview, setActivePdfPreview] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerReviewModal, setShowCustomerReviewModal] = useState(false);
  const [orderReview, setOrderReview] = useState(null);
  const [isLoadingOrderReview, setIsLoadingOrderReview] = useState(false);
  const [downloadingFileKey, setDownloadingFileKey] = useState(null);

  // Admin Multiple File Upload Array State
  const [adminFilesList, setAdminFilesList] = useState([]);
  const [_adminDragOver, _setAdminDragOver] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Detailed specifications stay collapsed by default so customers see the essentials first.
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  // Multi-Delivery Version Tab / Dropdown State
  const [selectedDeliveryIndex, setSelectedDeliveryIndex] = useState(0);

  // Cancellation Workflow States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [_isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isProcessingAdminCancel, setIsProcessingAdminCancel] = useState(false);

  // Section Refs for smooth scrolling on the single page
  const requirementsRef = useRef(null);
  const workerDeskRef = useRef(null);
  const deliveryRef = useRef(null);
  const modificationRef = useRef(null);

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

  const { handleSafeClose: handleSafeCloseDrawer } = useModalBackNavigation({
    isOpen: Boolean(selectedOrderForDrawer),
    onClose: handleCloseDrawer,
    modalId: 'order_tracker_drawer'
  });

  const { handleSafeClose: _handleSafeCloseCancelModal } = useModalBackNavigation({
    isOpen: isCancelModalOpen,
    onClose: () => setIsCancelModalOpen(false),
    modalId: 'order_cancel_modal'
  });

  // Always-active global listener for cancellation modal requests across app
  React.useEffect(() => {
    const handleOpenCancel = (e) => {
      const targetId = e?.detail?.orderId;
      const targetOrder = e?.detail?.order;
      if (targetOrder && setSelectedOrderForDrawer) {
        setSelectedOrderForDrawer(targetOrder);
      } else if (targetId) {
        const found = (orders || []).find(o => {
          const oClean = String(o?.id || '').trim().replace(/^#+/, '');
          return oClean === String(targetId).trim().replace(/^#+/, '') || o?.id === targetId;
        });
        if (found && setSelectedOrderForDrawer) {
          setSelectedOrderForDrawer(found);
        }
      }
      setIsCancelModalOpen(true);
    };
    window.addEventListener('bdigi_open_cancellation_modal', handleOpenCancel);
    return () => window.removeEventListener('bdigi_open_cancellation_modal', handleOpenCancel);
  }, [orders, setSelectedOrderForDrawer]);

  // Drawer-specific keyboard navigation & scroll lock
  React.useEffect(() => {
    if (!selectedOrderForDrawer) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSafeCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [selectedOrderForDrawer, handleSafeCloseDrawer]);

  // ── Derive order data BEFORE any early return so hook count stays constant ──
  // Always resolve live reactive order state from global orders array
  const cleanSelId = String(selectedOrderForDrawer?.id || '').trim().replace(/^#+/, '');
  const selWithHash = `#${cleanSelId}`;
  const matchedFromOrders = (orders || []).find(o => {
    const oClean = String(o?.id || '').trim().replace(/^#+/, '');
    return oClean === cleanSelId || o?.id === selectedOrderForDrawer?.id || o?.id === selWithHash;
  });

  const ord = (matchedFromOrders && matchedFromOrders.status && (matchedFromOrders.client_name || matchedFromOrders.clientName || matchedFromOrders.price !== undefined))
    ? matchedFromOrders
    : (selectedOrderForDrawer || {});

  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

  // If order in drawer is incomplete or marked as loading, fetch live from Supabase
  useEffect(() => {
    if (!cleanSelId) return;
    const isMissingDetails = Boolean(ord._isLoading || (!ord.status && !ord.title));
    if (isMissingDetails && !isFetchingOrder) {
      let isMounted = true;
      setIsFetchingOrder(true);
      fetchOrderById(cleanSelId).then(liveOrder => {
        if (isMounted && liveOrder) {
          if (typeof setSelectedOrderForDrawer === 'function') {
            setSelectedOrderForDrawer(liveOrder);
          }
        }
      }).catch(err => {
        console.warn('[OrderTrackerDrawer live fetch notice]:', err?.message);
      }).finally(() => {
        setIsFetchingOrder(false);
      });
      return () => { isMounted = false; };
    }
  }, [cleanSelId, ord.status, ord.title, ord._isLoading, isFetchingOrder, setSelectedOrderForDrawer]);

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

  // Payment reconciliation is handled by active Checkout/Deposit flows and provider webhooks.
  // Do not probe BoltPayouts merely because an order is unpaid: many valid unpaid orders
  // have no Bolt invoice and previously generated slow 404 serverless requests here.

  // Load any existing customer review so completed orders can offer feedback later.
  useEffect(() => {
    let isCurrent = true;
    const status = String(ord?.status || '').toLowerCase();

    if (!selectedOrderForDrawer || !ord?.id || status !== 'completed' || !authUser?.email) {
      setOrderReview(null);
      setIsLoadingOrderReview(false);
      return () => { isCurrent = false; };
    }

    setIsLoadingOrderReview(true);
    fetchOrderReview(ord.id)
      .then((review) => {
        if (isCurrent) setOrderReview(review);
      })
      .catch(() => {
        if (isCurrent) setOrderReview(null);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingOrderReview(false);
      });

    return () => { isCurrent = false; };
  }, [selectedOrderForDrawer, ord?.id, ord?.status, authUser?.email]);

  // Keep Order Details hidden whenever a new order is opened.
  // Customers can reveal the section only by tapping Details or Show.
  const lastSetOrderIdRef = useRef(null);
  useEffect(() => {
    if (!selectedOrderForDrawer) return;
    const currentId = ord?.id || selectedOrderForDrawer;
    if (lastSetOrderIdRef.current !== currentId) {
      lastSetOrderIdRef.current = currentId;
      setIsRequirementsOpen(false);
    }
  }, [selectedOrderForDrawer, ord?.id]);

  // Reset delivery version selection to latest (index 0) when switching orders
  useEffect(() => {
    setSelectedDeliveryIndex(0);
  }, [selectedOrderForDrawer, ord?.id, ord?.deliveries?.length]);

  // ── Early return AFTER all hooks have been declared ───────────────────────
  if (!selectedOrderForDrawer) return null;

  const isActuallyLoading = Boolean(ord._isLoading || (!ord.status && !ord.title && isFetchingOrder));
  if (isActuallyLoading) {
    return (
      <div
        className="order-tracker-drawer-backdrop"
        onClick={handleSafeCloseDrawer}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'stretch'
        }}
      >
        <div
          className="order-tracker-drawer"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: 'var(--bg-surface, #ffffff)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem',
            gap: '1.25rem'
          }}
        >
          <Loader2 size={40} className="animate-spin" style={{ color: 'var(--color-primary-orange, #ff6b00)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main, #1e293b)' }}>
            Loading Order #{cleanSelId}...
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)' }}>
            Fetching live production deliverables and specifications from studio server...
          </div>
        </div>
      </div>
    );
  }

  const orderPrice = getOrderPrice(ord);
  const formattedPrice = `$${orderPrice.toFixed(2)}`;

  // Normalize status — treat 'revision_requested' as 'revision' for all UI guards
  const normalizedStatus = (ord.status === 'revision_requested') ? 'revision' : (ord.status || 'submitted');
  const mobileTrackingState = getMobileOrderTrackingState(ord);

  // Files are considered ready ONLY when status is exactly 'delivered' or 'completed'
  const isDelivered = normalizedStatus === 'delivered' || normalizedStatus === 'completed';
  const isCompleted = normalizedStatus === 'completed';
  const isInRevision = normalizedStatus === 'revision';
  const _isCancellable = !isDelivered && !isCompleted && ord.status !== 'cancelled' && ord.status !== 'cancellation_requested';


  const isCurrentlyOnAdminPortal = currentView === 'admin' || (typeof window !== 'undefined' && (window.location.pathname.includes('admin') || window.location.pathname.includes('admin-portal')));
  const isAdmin = (authUser?.role === 'admin' && isCurrentlyOnAdminPortal) || currentView === 'admin';

  const isVectorOrder = Boolean(
    (ord.serviceCategory && ord.serviceCategory.toLowerCase().includes('vector')) ||
    (ord.type && ord.type.toLowerCase().includes('vector')) ||
    (ord.service && ord.service.toLowerCase().includes('vector')) ||
    (ord.title && ord.title.toLowerCase().includes('vector'))
  );
  const requiredSpecialty = isVectorOrder ? 'Vector Artist' : 'Embroidery Digitizer';

  // Parse order notes object (handles JSON string or existing object)
  let parsedNotes = {};
  if (ord.notes && typeof ord.notes === 'string' && ord.notes.trim().startsWith('{')) {
    try {
      parsedNotes = JSON.parse(ord.notes);
    } catch {}
  } else if (ord.notes && typeof ord.notes === 'object') {
    parsedNotes = ord.notes;
  }

  const cancellationData = ord.cancellation || parsedNotes.cancellation || (Array.isArray(parsedNotes.cancellations) ? parsedNotes.cancellations[0] : {}) || {};

  // Collect all uploaded artwork / logo files across all placements and attachments
  const notesFiles = [
    ...(Array.isArray(parsedNotes.uploadedFiles) ? parsedNotes.uploadedFiles : []),
    ...(Array.isArray(parsedNotes.clientUploadedFiles) ? parsedNotes.clientUploadedFiles : []),
    ...(Array.isArray(parsedNotes.placementItems?.[0]?.files) ? parsedNotes.placementItems[0].files : [])
  ];

  const clientArtworkFiles = [
    ...(Array.isArray(ord.uploadedFiles) ? ord.uploadedFiles : []),
    ...(Array.isArray(ord.clientUploadedFiles) ? ord.clientUploadedFiles : []),
    ...(Array.isArray(ord.order_files) ? ord.order_files.filter(f => f && f.file_type === 'client_artwork') : []),
    ...(Array.isArray(ord.orderFiles) ? ord.orderFiles.filter(f => f && f.file_type === 'client_artwork') : []),
    ...notesFiles,
    ...(Array.isArray(ord.placementItems) ? ord.placementItems.flatMap(p => (Array.isArray(p?.files) ? p.files : []).map(f => ({ ...f, placementName: p?.placement || p?.placementType || p?.name }))) : []),
    ...(Array.isArray(parsedNotes.placementItems) ? parsedNotes.placementItems.flatMap(p => (Array.isArray(p?.files) ? p.files : []).map(f => ({ ...f, placementName: p?.placement || p?.placementType || p?.name }))) : []),
    ...(Array.isArray(ord.patchItems) ? ord.patchItems.flatMap(p => (Array.isArray(p?.files) ? p.files : []).map(f => ({ ...f, placementName: p?.tier || p?.name }))) : []),
    ...(Array.isArray(ord.vectorItems) ? ord.vectorItems.flatMap(v => (Array.isArray(v?.files) ? v.files : []).map(f => ({ ...f, placementName: v?.name }))) : [])
  ].filter(f => f && (f.url || f.public_url || f.file_url || f.previewUrl));

  const uniqueArtworkFiles = [];
  const seenArtUrls = new Set();
  for (const f of clientArtworkFiles) {
    const key = f.url || f.public_url || f.file_url || f.file_name || f.name;
    if (key && !seenArtUrls.has(key)) {
      seenArtUrls.add(key);
      uniqueArtworkFiles.push({
        ...f,
        name: f.name || f.file_name || f.fileName || 'Artwork File',
        url: f.url || f.public_url || f.file_url
      });
    }
  }

  const primaryArtworkSrc =
    ord.artwork_url ||
    ord.artworkUrl ||
    ord.image_url ||
    ord.logo ||
    ord.file_url ||
    uniqueArtworkFiles[0]?.url ||
    uniqueArtworkFiles[0]?.public_url ||
    (ord.file_path && ord.file_path.startsWith('http') ? ord.file_path : null) ||
    '/artwork-placeholder.svg';

  if (uniqueArtworkFiles.length === 0 && primaryArtworkSrc && primaryArtworkSrc !== '/artwork-placeholder.svg') {
    const inferredExt = (primaryArtworkSrc.split('.').pop()?.split('?')[0] || 'png').toLowerCase();
    uniqueArtworkFiles.push({
      url: primaryArtworkSrc,
      name: `${(ord.title || 'Artwork').replace(/\s+/g, '_')}_source.${inferredExt}`,
      format: inferredExt
    });
  }

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
    setRevisionNote('');
    setRevisionImage(null);
    showToast('Modification request sent to master digitizer desk.', 'success');
  };

  const _handleCustomerSubmitCancellation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanR = cancelReason.trim();
    if (!cleanR) {
      showToast('Please provide a reason for requesting cancellation.', 'error');
      return;
    }
    setIsSubmittingCancel(true);
    try {
      const res = await requestOrderCancellation(ord.id, cleanR);
      if (res?.success) {
        setIsCancelModalOpen(false);
        setCancelReason('');
        if (selectedOrderForDrawer) {
          setSelectedOrderForDrawer(prev => prev ? {
            ...prev,
            status: 'cancellation_requested',
            cancellation: res.cancellation,
            notes: {
              ...(typeof prev.notes === 'string' && prev.notes.startsWith('{') ? JSON.parse(prev.notes) : (typeof prev.notes === 'object' ? prev.notes : {})),
              cancellation: res.cancellation
            }
          } : prev);
        }
      }
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handleAdminApproveCancel = async () => {
    if (!window.confirm(`Are you sure you want to approve cancellation for Order #${cleanSelId || ord.id}? This will cancel the order and refund eligible funds to the customer's wallet.`)) {
      return;
    }
    setIsProcessingAdminCancel(true);
    try {
      const res = await approveOrderCancellation(ord.id);
      if (res?.success && selectedOrderForDrawer) {
        setSelectedOrderForDrawer(prev => prev ? { ...prev, status: 'cancelled', payment_status: res.refundIssued ? 'refunded' : prev.payment_status } : prev);
      }
    } finally {
      setIsProcessingAdminCancel(false);
    }
  };

  const handleAdminRejectCancel = async () => {
    const reason = prompt('Please provide a reason for declining cancellation:', 'Order is already in active commercial production.');
    if (!reason) return;
    setIsProcessingAdminCancel(true);
    try {
      const res = await rejectOrderCancellation(ord.id, reason);
      if (res?.success && selectedOrderForDrawer) {
        setSelectedOrderForDrawer(prev => prev ? { ...prev, status: res.status } : prev);
      }
    } finally {
      setIsProcessingAdminCancel(false);
    }
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
      const existingDeliveries = (Array.isArray(ord.deliveries) && ord.deliveries.length > 0)
        ? ord.deliveries
        : (Array.isArray(notesDeliveries) && notesDeliveries.length > 0 ? notesDeliveries : []);
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

      const maxExistingNum = baseDeliveries.reduce((max, d) => Math.max(max, parseInt(d.deliveryNumber || 0, 10)), 0);
      const newDeliveryNumber = Math.max(baseDeliveries.length + 1, maxExistingNum + 1);

      const newDeliveryItem = {
        id: `delivery_${Date.now()}`,
        deliveryNumber: newDeliveryNumber,
        title: newDeliveryNumber === 1 ? 'Initial Delivery' : `Delivery #${newDeliveryNumber}`,
        deliveryDate: new Date().toISOString(),
        deliveryMessage: deliveryNoteText,
        deliveredBy: authUser?.name || 'Master Digitizer Desk',
        files: uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles : existingFiles
      };

      const updatedDeliveries = [newDeliveryItem, ...baseDeliveries];

      await updateOrderStatus(ord.id, 'delivered', {
        status: 'delivered',
        clientEmail: ord.client_email || ord.clientEmail,
        clientName: ord.client_name || ord.clientName,
        title: ord.title || `Order #${ord.id}`,
        outputFileUrl: uploadedCloudinaryFiles.length > 0 ? (uploadedCloudinaryFiles[0].url || uploadedCloudinaryFiles[0].name) : (ord.outputFileUrl || ''),
        uploadedMachineFiles: updatedFiles,
        deliveries: updatedDeliveries,
        deliveryNumber: newDeliveryNumber,
        deliveryTitle: newDeliveryItem.title,
        deliveryNotes: deliveryNoteText,
        deliveryMessage: deliveryNoteText,
        deliveryDate: new Date().toISOString()
      });

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

  const userFormats = ord.requestedFormats || ['dst', 'pes', 'emb'];
  const allDownloadFormats = Array.from(new Set([...userFormats, 'pdf']));

  const notesDeliveries = parsedNotes.deliveries || [];
  const notesMachineFiles = parsedNotes.uploadedMachineFiles || [];

  const rawMachineFilesList = [
    ...(Array.isArray(ord.uploadedMachineFiles) ? ord.uploadedMachineFiles : []),
    ...(Array.isArray(ord.uploaded_machine_files) ? ord.uploaded_machine_files : []),
    ...(Array.isArray(notesMachineFiles) ? notesMachineFiles : []),
    ...(Array.isArray(ord.workerFiles) ? ord.workerFiles : []),
    ...(Array.isArray(ord.worker_files) ? ord.worker_files : []),
    ...(Array.isArray(ord.order_files) ? ord.order_files.filter(f => f && f.file_type !== 'client_artwork') : []),
    ...(Array.isArray(ord.orderFiles) ? ord.orderFiles.filter(f => f && f.file_type !== 'client_artwork') : []),
    ...(Array.isArray(ord.deliveries) ? ord.deliveries.flatMap(d => Array.isArray(d?.files) ? d.files : (d?.fileUrl || d?.url ? [d] : [])) : []),
    ...(Array.isArray(notesDeliveries) ? notesDeliveries.flatMap(d => Array.isArray(d?.files) ? d.files : (d?.fileUrl || d?.url ? [d] : [])) : [])
  ];

  if (ord.output_file_url || ord.outputFileUrl) {
    const outUrl = ord.output_file_url || ord.outputFileUrl;
    const outExt = (outUrl.split('.').pop()?.split('?')[0] || 'dst').toLowerCase();
    rawMachineFilesList.push({
      url: outUrl,
      public_url: outUrl,
      name: `${(ord.title || 'Order').replace(/\s+/g, '_')}_master.${outExt}`,
      format: outExt
    });
  }

  if (ord.worker_file_url || ord.workerFileUrl) {
    const wUrl = ord.worker_file_url || ord.workerFileUrl;
    const wExt = (ord.worker_file_name?.split('.').pop() || wUrl.split('.').pop()?.split('?')[0] || 'dst').toLowerCase();
    rawMachineFilesList.push({
      url: wUrl,
      public_url: wUrl,
      name: ord.worker_file_name || `${(ord.title || 'Order').replace(/\s+/g, '_')}_digitized.${wExt}`,
      format: wExt
    });
  }

  const seenMachineKeys = new Set();
  const uniqueMachineFiles = [];
  for (const rawF of rawMachineFilesList) {
    if (!rawF) continue;
    const fileUrl = rawF.url || rawF.public_url || rawF.file_url;
    const fileName = rawF.name || rawF.file_name;
    const key = fileUrl || fileName;
    if (key && !seenMachineKeys.has(key)) {
      seenMachineKeys.add(key);
      const ext = (rawF.format || rawF.file_format || (fileName || '').split('.').pop() || 'dst').toLowerCase();
      uniqueMachineFiles.push({
        id: rawF.id || key,
        name: fileName || `Production_File.${ext}`,
        format: ext,
        url: fileUrl,
        public_url: fileUrl,
        public_id: rawF.public_id || rawF.file_path || null,
        uploadedAt: rawF.uploadedAt || rawF.created_at || null
      });
    }
  }

  // Multi-delivery version normalization: reliably resolve from ord.deliveries or notesDeliveries
  const availableDeliveries = (Array.isArray(ord.deliveries) && ord.deliveries.length > 0)
    ? ord.deliveries
    : (Array.isArray(notesDeliveries) && notesDeliveries.length > 0 ? notesDeliveries : []);

  const allDeliveries = (() => {
    if (availableDeliveries.length > 0) {
      return availableDeliveries.map((deliv, idx) => {
        let files = Array.isArray(deliv.files) && deliv.files.length > 0 ? deliv.files : [];
        if (files.length === 0 && deliv.outputFileUrl) {
          const ext = (deliv.outputFileUrl.split('.').pop()?.split('?')[0] || 'dst').toLowerCase();
          files = [{
            name: `${(ord.title || 'Order').replace(/\s+/g, '_')}_v${idx + 1}.${ext}`,
            url: deliv.outputFileUrl,
            format: ext
          }];
        }
        if (files.length === 0 && idx === 0 && uniqueMachineFiles.length > 0) {
          files = uniqueMachineFiles;
        }
        const delivNum = deliv.deliveryNumber || (availableDeliveries.length - idx);
        return {
          ...deliv,
          files,
          deliveryNumber: delivNum,
          title: deliv.title || `Delivery #${delivNum}`
        };
      });
    }

    if (uniqueMachineFiles.length > 0 || ord.deliveryNotes || ord.deliveryMessage || ord.outputFileUrl) {
      return [{
        id: 'delivery_initial',
        deliveryNumber: 1,
        title: 'Initial Delivery',
        deliveryDate: ord.deliveryDate || ord.created_at || new Date().toISOString(),
        deliveryMessage: ord.deliveryNotes || ord.deliveryMessage || 'Production stitch files and deliverables ready for download.',
        deliveredBy: 'Master Digitizer Desk',
        files: uniqueMachineFiles
      }];
    }

    return [];
  })();

  const activeDelivery = allDeliveries[selectedDeliveryIndex] || allDeliveries[0] || null;
  const activeDeliveryFiles = (activeDelivery && Array.isArray(activeDelivery.files) && activeDelivery.files.length > 0)
    ? activeDelivery.files
    : uniqueMachineFiles;

  const handleOpenFileAsset = (fileObj, fallbackFormatKey) => {
    let target = fileObj;
    const formatKey = (fileObj?.format || fallbackFormatKey || 'dst').toLowerCase();

    if (!target || !target.url) {
      target = uniqueMachineFiles.find(f => (f.format || '').toLowerCase() === formatKey) ||
               uniqueMachineFiles.find(f => (f.name || '').toLowerCase().endsWith(`.${formatKey}`)) ||
               null;
    }

    const fileUrl = target?.url || ord.output_file_url || ord.outputFileUrl || ord.worker_file_url;
    const fileName = target?.name || `${(ord.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;

    if (formatKey === 'pdf') {
      if (fileUrl && (fileUrl.toLowerCase().endsWith('.pdf') || fileUrl.includes('.pdf'))) {
        openPdfInNewTab(fileUrl, fileName);
      } else {
        setShowWorksheetModal(true);
      }
      return;
    }

    if (fileUrl) {
      openFileInNewTab(fileUrl, fileName);
    } else {
      setShowWorksheetModal(true);
    }
  };

  const handleDownloadFileAsset = async (fileObj, fallbackFormatKey) => {
    let target = fileObj;
    const formatKey = (fileObj?.format || fallbackFormatKey || 'dst').toLowerCase();

    if (!target || !target.url) {
      target = uniqueMachineFiles.find(f => (f.format || '').toLowerCase() === formatKey) ||
               uniqueMachineFiles.find(f => (f.name || '').toLowerCase().endsWith(`.${formatKey}`)) ||
               null;
    }

    const fileUrl = target?.url || ord.output_file_url || ord.outputFileUrl || ord.worker_file_url;
    const fileName = target?.name || `${(ord.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;
    const fileKey = target?.id || target?.url || target?.name || formatKey;

    if (!fileUrl) {
      if (formatKey === 'pdf') {
        setShowWorksheetModal(true);
      } else {
        showToast(`Production file for .${formatKey.toUpperCase()} is being prepared.`, 'info');
      }
      return;
    }

    setDownloadingFileKey(fileKey);
    try {
      showToast(`Downloading ${fileName}...`, 'info');
      await downloadFileDirectly(fileUrl, fileName);
      showToast(`Saved ${fileName}`, 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast(`Could not download ${fileName}`, 'error');
    } finally {
      setDownloadingFileKey(null);
    }
  };

  const handleDownloadDeliveryFiles = async (filesList) => {
    const list = Array.isArray(filesList) && filesList.length > 0
      ? filesList
      : (uniqueMachineFiles.length > 0 ? uniqueMachineFiles : allDownloadFormats.map(fmt => ({ name: null, format: fmt })));
    showToast(`Starting batch download of ${list.length} files...`, 'info');
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.name === null) {
        await handleDownloadFileAsset(null, file.format);
      } else {
        const ext = file.format || (file.name && file.name.split('.').pop().toLowerCase()) || 'dst';
        await handleDownloadFileAsset(file, ext);
      }
      if (i < list.length - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }
  };

  const handleDownloadAll = async () => {
    await handleDownloadDeliveryFiles(activeDeliveryFiles);
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
    showToast('🎉 Delivery approved! Thank you for choosing BDigitizing.', 'success');
    setShowCustomerReviewModal(true);
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
    if (s === 'completed') return <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>Completed</span>;
    if (s === 'delivered') return <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>Delivered</span>;
    if (s === 'revision' || s === 'revision_requested') return <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>Modification Requested</span>;
    if (s === 'cancellation_requested') return <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>⚠️ Cancellation Requested</span>;
    if (s === 'cancelled') return <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>✕ Cancelled</span>;
    if (s === 'qc' || s === 'quality_check') return <span style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>Quality Check</span>;
    if (s === 'in_progress' || s === 'digitizing' || s === 'assigned') return <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>In Production</span>;
    return <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>Submitted</span>;
  };

  return (
    <>
      <div
        className={isMobileLayout ? "mobile-fullscreen-modal" : "modal-overlay"}
        onClick={handleSafeCloseDrawer}
      style={{
        zIndex: 99990,
        background: isMobileLayout ? (isDark ? 'var(--color-background, #090d16)' : '#ffffff') : 'rgba(11, 19, 41, 0.85)',
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
        className="modal-content order-tracker-drawer"
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
          background: 'var(--color-surface, #ffffff)',
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
                onClick={handleSafeCloseDrawer}
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
                {!isMobileLayout && (isPaid ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={11} /> PAID
                  </span>
                ) : (
                  <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontWeight: 800, padding: '0.12rem 0.45rem', borderRadius: '9999px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> PENDING
                  </span>
                ))}

              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}</span>
                {!isMobileLayout && <><span>•</span><span>{formattedSubmissionDate}</span></>}
                {!isMobileLayout && ord.clientName && <span>• Client: <strong style={{ color: '#ffffff' }}>{ord.clientName}</strong></span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeCloseDrawer}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: '#cbd5e1',
              borderRadius: '10px',
              width: '34px',
              height: '34px',
              display: isMobileLayout ? 'none' : 'flex',
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
            2. PRIMARY ORDER NAVIGATION
           ================================================================== */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          padding: isMobileLayout ? '0.5rem 0.75rem' : '0.6rem 1.5rem',
          gap: '0.45rem',
          overflowX: 'auto',
          flexShrink: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}>
          <button
            type='button'
            onClick={() => {
              setIsRequirementsOpen(true);
              scrollToSection(requirementsRef, 'requirements');
            }}
            className={'btn btn-sm ' + (activeSection === 'requirements' ? 'btn-primary-orange' : 'btn-outline')}
            style={{ flex: isMobileLayout ? 1 : undefined, justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
          >
            <FileText size={14} /> Details
          </button>

          {isAdmin && (
            <button
              type='button'
              onClick={() => scrollToSection(workerDeskRef, 'worker')}
              className={'btn btn-sm ' + (activeSection === 'worker' ? 'btn-primary-orange' : 'btn-outline')}
              style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
            >
              <UserCheck size={14} /> Worker & QA
            </button>
          )}

          <button
            type='button'
            onClick={() => scrollToSection(deliveryRef, 'delivery')}
            className={'btn btn-sm ' + (activeSection === 'delivery' ? 'btn-primary-orange' : 'btn-outline')}
            style={{ flex: isMobileLayout ? 1 : undefined, justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', gap: '0.3rem', whiteSpace: 'nowrap' }}
          >
            <PackageCheck size={14} /> Files
          </button>

          <button
            type='button'
            onClick={() => setShowInvoiceModal(true)}
            className='btn btn-sm btn-outline'
            style={{ flex: isMobileLayout ? 1 : undefined, justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', gap: '0.3rem', whiteSpace: 'nowrap', background: 'var(--color-surface, #ffffff)', borderColor: 'var(--border-color, #e2e8f0)' }}
            title='View invoice'
          >
            <Receipt size={14} style={{ color: 'var(--orange-500, #ea580c)' }} /> Invoice
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
          gap: isMobileLayout ? '0.8rem' : '1.5rem',
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

          {/* CANCELLATION BANNER: Pending Review */}
          {ord.status === 'cancellation_requested' && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '2px solid #f59e0b',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#92400e' }}>
                      Cancellation Request Pending Review
                    </h4>
                    {cancellationData.requested_at && (
                      <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
                        Requested: {new Date(cancellationData.requested_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#78350f', background: 'rgba(255,255,255,0.7)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <strong>Reason provided:</strong> "{cancellationData.reason || 'Cancellation requested by customer.'}"
                  </div>
                  {!isAdmin && (
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.4 }}>
                      Our production operations team is reviewing your cancellation request. If approved, any paid funds will be automatically refunded to your BDigitizing Studio Wallet.
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px solid rgba(245, 158, 11, 0.3)',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginRight: 'auto' }}>
                    Admin Decision Required:
                  </span>
                  <button
                    type="button"
                    onClick={handleAdminRejectCancel}
                    disabled={isProcessingAdminCancel}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #d97706',
                      color: '#b45309',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: isProcessingAdminCancel ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessingAdminCancel ? 'Processing...' : '✕ Decline Cancellation'}
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminApproveCancel}
                    disabled={isProcessingAdminCancel}
                    style={{
                      background: '#dc2626',
                      border: 'none',
                      color: '#ffffff',
                      padding: '0.45rem 1.15rem',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: isProcessingAdminCancel ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
                    }}
                  >
                    {isProcessingAdminCancel ? 'Processing...' : '✓ Approve & Refund Wallet'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CANCELLATION BANNER: Cancelled */}
          {ord.status === 'cancelled' && (
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              boxShadow: '0 4px 18px rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#ef4444',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <XCircle size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#991b1b' }}>
                  Order Cancelled
                </h4>
                <p style={{ margin: '0.35rem 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                  This order has been cancelled and production has stopped.
                  {cancellationData.reason && <span> Reason: "{cancellationData.reason}"</span>}
                </p>
                {cancellationData.refund_issued && (
                  <div style={{
                    marginTop: '0.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px'
                  }}>
                    ✓ Refund of ${Number(cancellationData.refund_amount || 0).toFixed(2)} was credited to customer's Studio Wallet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SIMPLE ORDER STATUS */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: isMobileLayout ? '12px' : '14px',
            padding: isMobileLayout ? '0.8rem 0.9rem' : '0.95rem 1.15rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: mobileTrackingState.ready ? '#ecfdf5' : (mobileTrackingState.unpaid ? '#fff7ed' : '#eff6ff'),
                color: mobileTrackingState.ready ? '#059669' : (mobileTrackingState.unpaid ? '#ea580c' : '#2563eb'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {mobileTrackingState.ready ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {mobileTrackingState.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.08rem', lineHeight: 1.35 }}>
                  {mobileTrackingState.helper}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 900, color: mobileTrackingState.ready ? '#059669' : (mobileTrackingState.unpaid ? '#ea580c' : '#2563eb'), flexShrink: 0 }}>
                {mobileTrackingState.progress}%
              </span>
            </div>
            <div style={{ height: '5px', borderRadius: '999px', overflow: 'hidden', background: 'var(--bg-subtle, #e2e8f0)', marginTop: '0.65rem' }}>
              <div style={{
                width: String(mobileTrackingState.progress) + '%',
                height: '100%',
                borderRadius: '999px',
                background: mobileTrackingState.ready ? '#10b981' : (mobileTrackingState.unpaid ? '#ea580c' : '#2563eb')
              }} />
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
              borderRadius: isMobileLayout ? '12px' : '16px',
              border: '1px solid var(--border-color)',
              padding: isMobileLayout ? '1rem' : '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PackageCheck size={20} style={{ color: isDelivered ? '#059669' : 'var(--orange-500)' }} />
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {isAdmin ? 'Delivery Desk' : 'Your files'}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {isAdmin ? 'Upload finished files and delivery notes.' : (isDelivered ? 'Ready to download.' : 'Your finished files will appear here when ready.')}
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
                  <Download size={14} /> Download all
                </button>
              )}
            </div>

            {/* WORKER UPLOAD REVIEW BANNER (ADMIN VIEW) */}
            {isAdmin && (ord.worker_file_url || ord.workerFileUrl) && (
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#2563eb', color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      WORKER UPLOAD
                    </span>
                    <strong style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>
                      {ord.worker_file_name || ord.workerFileName || 'digitized_stitch_file.dst'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>
                      ({ord.worker_status || ord.workerStatus || 'Submitted'})
                    </span>
                  </div>
                  {(ord.worker_notes || ord.workerNotes) && (
                    <div style={{ fontSize: '0.78rem', color: '#1e40af', marginTop: '0.25rem' }}>
                      Digitizer Notes: {ord.worker_notes || ord.workerNotes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openFileInNewTab(ord.worker_file_url || ord.workerFileUrl, ord.worker_file_name || ord.workerFileName || 'digitized_stitch_file.dst')}
                    className="btn btn-sm"
                    style={{ background: '#ffffff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
                  >
                    <ExternalLink size={13} /> Open
                  </button>
                  <button
                    type="button"
                    disabled={downloadingFileKey === (ord.worker_file_url || ord.workerFileUrl)}
                    onClick={async () => {
                      const fUrl = ord.worker_file_url || ord.workerFileUrl;
                      const fName = ord.worker_file_name || ord.workerFileName || 'digitized_stitch_file.dst';
                      setDownloadingFileKey(fUrl);
                      try {
                        showToast(`Downloading ${fName}...`, 'info');
                        await downloadFileDirectly(fUrl, fName);
                        showToast(`Saved ${fName}`, 'success');
                      } catch {
                        showToast(`Failed to download ${fName}`, 'error');
                      } finally {
                        setDownloadingFileKey(null);
                      }
                    }}
                    className="btn btn-sm"
                    style={{ background: '#2563eb', color: '#ffffff', fontWeight: 700, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '6px' }}
                  >
                    {downloadingFileKey === (ord.worker_file_url || ord.workerFileUrl) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Download size={13} />
                    )}
                    Download
                  </button>
                </div>
              </div>
            )}

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
                    placeholder="Type message..."
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

            {/* MULTI-DELIVERY VERSIONING SYSTEM (DROPDOWN & SEGMENTED TABS) */}
            {isDelivered && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {/* Delivery Version Selector (Shown when more than 1 delivery exists) */}
                {allDeliveries.length > 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'var(--bg-surface)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Layers size={15} style={{ color: 'var(--orange-500)' }} /> Delivery Version:
                      </span>
                      <select
                        value={selectedDeliveryIndex}
                        onChange={(e) => setSelectedDeliveryIndex(Number(e.target.value))}
                        className="form-select"
                        style={{
                          padding: '0.32rem 0.7rem',
                          borderRadius: '8px',
                          border: '1.5px solid var(--orange-500)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {allDeliveries.map((deliv, idx) => {
                          const isLatest = idx === 0;
                          const delivLabel = deliv.title || `Delivery #${deliv.deliveryNumber || (allDeliveries.length - idx)}`;
                          return (
                            <option key={deliv.id || idx} value={idx}>
                              {delivLabel} {isLatest ? ' (Latest)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Segmented Pill Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {allDeliveries.map((deliv, idx) => {
                        const isLatest = idx === 0;
                        const isSelected = selectedDeliveryIndex === idx;
                        const delivLabel = deliv.title || `Delivery #${deliv.deliveryNumber || (allDeliveries.length - idx)}`;
                        return (
                          <button
                            key={deliv.id || idx}
                            type="button"
                            onClick={() => setSelectedDeliveryIndex(idx)}
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: '7px',
                              fontSize: '0.76rem',
                              fontWeight: isSelected ? 800 : 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              background: isSelected ? 'var(--orange-500)' : 'var(--bg-card)',
                              color: isSelected ? '#ffffff' : 'var(--text-muted)',
                              border: isSelected ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                              boxShadow: isSelected ? '0 2px 6px rgba(249, 115, 22, 0.28)' : 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <span>{delivLabel}</span>
                            {isLatest && <span style={{ fontSize: '0.68rem' }}>✨</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Delivery Card */}
                {activeDelivery ? (
                  <div
                    key={activeDelivery.id || selectedDeliveryIndex}
                    style={{
                      background: selectedDeliveryIndex === 0 ? '#f0fdf4' : '#f8fafc',
                      border: selectedDeliveryIndex === 0 ? '1.5px solid #86efac' : '1px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '1.25rem',
                      boxShadow: selectedDeliveryIndex === 0 ? '0 4px 14px rgba(16, 185, 129, 0.08)' : 'none'
                    }}
                  >
                    {/* Delivery Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem', borderBottom: selectedDeliveryIndex === 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0', paddingBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.15rem' }}>📦</span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: selectedDeliveryIndex === 0 ? '#065f46' : 'var(--navy-900)' }}>
                              {activeDelivery.title || `Delivery #${activeDelivery.deliveryNumber || (allDeliveries.length - selectedDeliveryIndex)}`}
                            </strong>
                            {selectedDeliveryIndex === 0 && (
                              <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.65rem', fontWeight: 900, padding: '0.15rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                                {allDeliveries.length > 1 ? 'Latest Delivery' : 'Delivered'}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: selectedDeliveryIndex === 0 ? '#047857' : 'var(--text-muted)' }}>
                            Dispatched {activeDelivery.deliveryDate ? new Date(activeDelivery.deliveryDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Recently delivered'} by {activeDelivery.deliveredBy || 'Master Digitizer Desk'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: selectedDeliveryIndex === 0 ? '#059669' : 'var(--text-muted)' }}>
                          {activeDeliveryFiles.length} file(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadDeliveryFiles(activeDeliveryFiles)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.74rem', fontWeight: 700, padding: '0.25rem 0.6rem', gap: '0.25rem', borderColor: selectedDeliveryIndex === 0 ? '#86efac' : undefined }}
                          title="Download all files in this delivery version"
                        >
                          <Download size={12} /> Download This Version
                        </button>
                      </div>
                    </div>

                    {/* Delivery Note */}
                    {(activeDelivery.deliveryMessage || activeDelivery.deliveryNotes) && (
                      <div style={{ background: selectedDeliveryIndex === 0 ? (isDark ? 'rgba(16, 185, 129, 0.12)' : '#ffffff') : (isDark ? 'var(--color-subtle, #1e293b)' : '#f1f5f9'), border: selectedDeliveryIndex === 0 ? (isDark ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #bbf7d0') : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0'), padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '0.85rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: selectedDeliveryIndex === 0 ? (isDark ? '#34d399' : '#065f46') : 'var(--navy-800)', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Sparkles size={12} /> Digitizer Delivery Note:
                        </div>
                        <div style={{ fontSize: '0.84rem', color: selectedDeliveryIndex === 0 ? (isDark ? '#6ee7b7' : '#047857') : 'var(--text-main)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                          {activeDelivery.deliveryMessage || activeDelivery.deliveryNotes}
                        </div>
                      </div>
                    )}

                    {/* Delivery Files Grid */}
                    {activeDeliveryFiles.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.65rem' }}>
                        {activeDeliveryFiles.map((f, fIdx) => {
                          const ext = (f.format || f.name?.split('.').pop() || 'dst').toUpperCase();
                          const isPdf = ext.toLowerCase() === 'pdf';
                          const fileIcon = isPdf ? '📄' : (['AI', 'EPS', 'SVG', 'CDR'].includes(ext) ? '🎨' : (['ZIP', 'RAR', '7Z'].includes(ext) ? '📦' : '🧵'));

                          return (
                            <div key={fIdx} style={{ background: isDark ? 'var(--color-surface, #111827)' : '#ffffff', border: isPdf ? '1.5px solid #fed7aa' : (isDark ? '1px solid var(--color-border, #334155)' : '1px solid #e2e8f0'), borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (f.url) {
                                        setActivePdfPreview({ url: f.url, name: f.name || 'document.pdf' });
                                      } else {
                                        handleOpenFileAsset(f, 'pdf');
                                      }
                                    }}
                                    className="btn btn-outline btn-sm"
                                    style={{ gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.35rem' }}
                                  >
                                    <ExternalLink size={11} /> Open
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingFileKey === (f.id || f.url || f.name || 'pdf')}
                                    onClick={() => handleDownloadFileAsset(f, 'pdf')}
                                    className="btn btn-primary-orange btn-sm"
                                    style={{ gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.35rem' }}
                                  >
                                    {downloadingFileKey === (f.id || f.url || f.name || 'pdf') ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <Download size={11} />
                                    )}
                                    Download
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenFileAsset(f, ext)}
                                    className="btn btn-outline btn-sm"
                                    style={{ gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.35rem' }}
                                    title={`Open ${f.name || ext}`}
                                  >
                                    <ExternalLink size={11} /> Open
                                  </button>
                                  <button
                                    type="button"
                                    disabled={downloadingFileKey === (f.id || f.url || f.name || ext)}
                                    onClick={() => handleDownloadFileAsset(f, ext)}
                                    className="btn btn-primary-orange btn-sm"
                                    style={{ gap: '0.2rem', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.35rem' }}
                                    title={`Download ${f.name || ext}`}
                                  >
                                    {downloadingFileKey === (f.id || f.url || f.name || ext) ? (
                                      <Loader2 size={11} className="animate-spin" />
                                    ) : (
                                      <Download size={11} />
                                    )}
                                    Download
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        No deliverable files attached to this delivery version.
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    No deliverable files uploaded yet.
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
                    onClick={handleDownloadAll}
                    className="btn btn-sm"
                    style={{ background: '#059669', color: '#ffffff', fontWeight: 800, border: 'none', padding: '0.5rem 1.15rem', borderRadius: '8px', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={14} /> Download All Files
                  </button>

                  {!isLoadingOrderReview && !orderReview && (
                    <button
                      type="button"
                      onClick={() => setShowCustomerReviewModal(true)}
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 800, gap: '0.35rem', borderColor: '#f59e0b', color: '#b45309', background: '#fffbeb' }}
                    >
                      <Star size={14} /> Leave feedback
                    </button>
                  )}

                  {orderReview && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.7rem',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #bbf7d0',
                      color: '#047857',
                      fontSize: '0.76rem',
                      fontWeight: 800
                    }}>
                      <CheckCircle2 size={14} /> Feedback submitted
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================
              SECTION B: ORDER REQUIREMENTS & SOURCE ARTWORK (COLLAPSIBLE ACCORDION)
             ================================================================ */}
          <div
            ref={requirementsRef}
            style={{
              background: 'var(--bg-card)',
              borderRadius: isMobileLayout ? '12px' : '16px',
              border: '1.5px solid var(--border-color)',
              padding: isMobileLayout ? '0.85rem' : '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {/* Accordion Toggle Header Bar */}
            <div
              onClick={() => setIsRequirementsOpen(prev => !prev)}
              style={{
                display: isMobileLayout ? 'grid' : 'flex',
                gridTemplateColumns: isMobileLayout ? 'minmax(0, 1fr) auto' : undefined,
                justifyContent: 'space-between',
                alignItems: isMobileLayout ? 'start' : 'center',
                cursor: 'pointer',
                userSelect: 'none',
                gap: isMobileLayout ? '0.65rem' : '0.75rem',
                borderBottom: isRequirementsOpen ? '1px solid var(--border-color)' : 'none',
                paddingBottom: isRequirementsOpen ? '0.75rem' : '0'
              }}
            >
              <div style={{ display: 'flex', alignItems: isMobileLayout ? 'flex-start' : 'center', gap: '0.65rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0, lineHeight: 1.2 }}>📋</span>
                <div style={{ minWidth: 0, width: '100%' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: isMobileLayout ? 'flex-start' : 'center',
                    flexDirection: isMobileLayout ? 'column' : 'row',
                    gap: isMobileLayout ? '0.25rem' : '0.5rem',
                    flexWrap: isMobileLayout ? 'nowrap' : 'wrap',
                    minWidth: 0
                  }}>
                    <h4 style={{ fontSize: isMobileLayout ? '0.95rem' : '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Order Details
                    </h4>
                    {/* Compact preview pills when collapsed */}
                    {!isRequirementsOpen && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: 'var(--bg-surface)',
                        color: 'var(--text-muted)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        whiteSpace: isMobileLayout ? 'normal' : 'nowrap',
                        maxWidth: '100%',
                        lineHeight: 1.35,
                        overflowWrap: 'anywhere',
                        wordBreak: 'break-word',
                        boxSizing: 'border-box'
                      }}>
                        {ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')} • {formatDimensions(ord.dimensions || ord.size)}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    marginTop: isMobileLayout ? '0.25rem' : '0.1rem',
                    lineHeight: 1.45,
                    overflowWrap: 'anywhere'
                  }}>
                    {isRequirementsOpen
                      ? 'Size, fabric, placement, instructions, and source artwork'
                      : 'Show size, fabric, placement, instructions, and artwork'}
                  </div>
                </div>
              </div>

              {/* View / Hide Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRequirementsOpen(prev => !prev);
                }}
                className="btn btn-sm btn-outline"
                style={{
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  flexShrink: 0,
                  alignSelf: isMobileLayout ? 'start' : 'center',
                  justifyContent: 'center',
                  minWidth: isMobileLayout ? '70px' : undefined,
                  padding: isMobileLayout ? '0.4rem 0.65rem' : '0.35rem 0.75rem',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap'
                }}
              >
                {isRequirementsOpen ? (
                  <>
                    <ChevronUp size={15} />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={15} />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Content Body */}
            {isRequirementsOpen && (
              <div style={{ marginTop: '1rem' }}>

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
                      e.currentTarget.src = '/artwork-placeholder.svg';
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
                      {formatFabric(ord.fabric || ord.fabricType || ord.fabric_type || ord.placementItems?.[0]?.fabric || parsedNotes.placementItems?.[0]?.fabric)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dimensions</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatDimensions(ord.dimensions || ord.size || ord.placementItems?.[0]?.dimensions || parsedNotes.placementItems?.[0]?.dimensions)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Placement</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {ord.placement || ord.placementType || ord.placement_type || ord.placementItems?.[0]?.placementType || ord.placementItems?.[0]?.placement || parsedNotes.placementItems?.[0]?.placementType || parsedNotes.placementItems?.[0]?.placement || 'Left Chest / Polo'}
                    </div>
                  </div>
                </div>

                {/* Customer Instructions Text */}
                <div style={{ background: 'var(--bg-surface)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--orange-500)', marginBottom: '0.25rem' }}>
                    Special Instructions
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                    {parsedNotes.notes || parsedNotes.customerNotes || (typeof ord.notes === 'string' && !ord.notes.trim().startsWith('{') ? ord.notes : null) || 'No special instructions were provided.'}
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
                    const fileExt = (artFile.format || artFile.file_format || artFile.name?.split('.').pop() || artFile.file_name?.split('.').pop() || 'png').toUpperCase();
                    const artUrl = artFile.url || artFile.public_url || artFile.file_url;
                    const artName = artFile.name || artFile.file_name || `artwork_${aIdx + 1}.${fileExt.toLowerCase()}`;
                    return (
                      <div key={aIdx} style={{ background: 'var(--bg-surface)', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{artName}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>.{fileExt} Original</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => openFileInNewTab(artUrl, artName)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, gap: '0.25rem', display: 'inline-flex', alignItems: 'center' }}
                            title="Open Original"
                          >
                            <ExternalLink size={12} /> Open
                          </button>
                          <button
                            type="button"
                            disabled={downloadingFileKey === (artUrl || artName)}
                            onClick={async () => {
                              setDownloadingFileKey(artUrl || artName);
                              try {
                                showToast(`Downloading ${artName}...`, 'info');
                                await downloadFileDirectly(artUrl, artName);
                                showToast(`Saved ${artName}`, 'success');
                              } catch {
                                showToast(`Failed to download ${artName}`, 'error');
                              } finally {
                                setDownloadingFileKey(null);
                              }
                            }}
                            className="btn btn-primary-orange btn-sm"
                            style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700, gap: '0.25rem', display: 'inline-flex', alignItems: 'center' }}
                            title="Download Original"
                          >
                            {downloadingFileKey === (artUrl || artName) ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Download size={12} />
                            )}
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
            )}
          </div>

          {/* ================================================================
              SECTION B.2: ADMIN WORKER ASSIGNMENT & QA REVIEW DESK
             ================================================================ */}
          {isAdmin && (
            <div
              ref={workerDeskRef}
              style={{
                background: 'var(--bg-card)',
                borderRadius: isMobileLayout ? '12px' : '16px',
                border: '1.5px solid var(--border-color)',
                padding: isMobileLayout ? '1rem' : '1.5rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isVectorOrder ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isVectorOrder ? <Palette size={22} /> : <Scissors size={22} />}
                  </div>
                  <div>
                    <h4 style={{ fontSize: isMobileLayout ? '0.98rem' : '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      Worker Assignment & QA Review Desk
                    </h4>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Specialization: <strong style={{ color: isVectorOrder ? '#0284c7' : '#ea580c' }}>{requiredSpecialty}</strong> • Internal Billing: <strong>PKR (Rs.)</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="btn btn-primary-orange btn-sm"
                    style={{ fontWeight: 800, gap: '0.35rem' }}
                  >
                    {ord.worker_id ? '🔄 Change Worker' : `+ Assign ${requiredSpecialty}`}
                  </button>
                </div>
              </div>

              {/* Status Display */}
              {!ord.worker_id ? (
                <div style={{ background: '#fffbeb', border: '1.5px dashed #f59e0b', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
                  <AlertTriangle size={28} style={{ color: '#d97706', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
                    Order Unassigned
                  </div>
                  <p style={{ margin: '0.35rem 0 1rem', fontSize: '0.825rem', color: '#b45309', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
                    You have inspected the requirements and source artwork above. Assign this {isVectorOrder ? 'vector conversion' : 'embroidery digitizing'} task to an active worker. The worker will review specifications and submit their PKR quote upon acceptance.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(true)}
                    className="btn btn-primary-orange btn-sm"
                    style={{ fontWeight: 800, gap: '0.35rem' }}
                  >
                    <UserCheck size={15} /> Assign {requiredSpecialty} Now
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Worker Card */}
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.15rem 1.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--navy-900)' }}>
                          {ord.worker_name || ord.worker_email || 'Assigned Worker'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: isVectorOrder ? '#e0f2fe' : '#fff7ed',
                          color: isVectorOrder ? '#0369a1' : '#ea580c',
                          border: `1px solid ${isVectorOrder ? '#bae6fd' : '#fed7aa'}`
                        }}>
                          {isVectorOrder ? '🎨 Vector Artist' : '🧵 Embroidery Digitizer'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: ord.worker_status === 'Pending_Worker_Acceptance' ? '#fef3c7' : ord.worker_status === 'Completed' ? '#ecfdf5' : '#eff6ff',
                          color: ord.worker_status === 'Pending_Worker_Acceptance' ? '#b45309' : ord.worker_status === 'Completed' ? '#059669' : '#2563eb',
                          border: `1px solid ${ord.worker_status === 'Pending_Worker_Acceptance' ? '#fde68a' : ord.worker_status === 'Completed' ? '#a7f3d0' : '#bfdbfe'}`
                        }}>
                          {ord.worker_status === 'Pending_Worker_Acceptance' ? '⏳ Pending Worker Acceptance & Quote' : (ord.worker_status || 'In Progress')}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <span>Agreed Quote: <strong style={{ color: 'var(--navy-900)' }}>{ord.quoted_price_pkr || ord.quoted_price ? `Rs. ${parseFloat(ord.quoted_price_pkr || ord.quoted_price).toLocaleString()} PKR` : 'Pending Quote'}</strong></span>
                        <span>•</span>
                        <span>Billing Status: <strong style={{ color: ord.worker_payment_status === 'Paid' ? '#059669' : '#ea580c' }}>{ord.worker_payment_status || 'Unpaid'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(ord.worker_status === 'Review Pending' || ord.worker_file_url) && (
                        <button
                          type="button"
                          onClick={() => setIsReviewModalOpen(true)}
                          style={{
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.55rem 1.15rem',
                            fontSize: '0.825rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                          }}
                        >
                          <FileCheck size={15} /> Review Worker Upload
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Worker Notes / Feedback */}
                  {ord.admin_worker_feedback && (
                    <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--navy-900)' }}>Instructions dispatched to worker:</strong>
                      <div style={{ color: '#475569', marginTop: '0.15rem' }}>{ord.admin_worker_feedback}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SECTION C: MODIFICATION / REVISIONS REQUEST (CUSTOMER ONLY, READ-ONLY LOGS FOR ADMIN)
             ================================================================ */}
          {(!isAdmin ? (normalizedStatus === 'delivered' || isInRevision || (isCompleted && Array.isArray(ord.revisions) && ord.revisions.length > 0)) : (Array.isArray(ord.revisions) && ord.revisions.length > 0 || isInRevision)) && (
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
                      {isAdmin ? 'Client Modification & Revision History' : (isCompleted ? 'Revision History (Archived)' : 'Modification & Revision Requests')}
                    </h4>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {isAdmin ? 'Review customer revision requests and instructions' : (isCompleted ? 'Completed project revision logs' : 'Free unlimited adjustments on density, size, colors, or pull compensation')}
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
                    <div style={{ fontWeight: 800, color: '#9f1239', fontSize: '0.88rem' }}>
                      {isAdmin ? 'Order In Revision Status' : 'Modification Currently Under Production'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#be123c', marginTop: '0.2rem', lineHeight: 1.4 }}>
                      {isAdmin
                        ? 'Customer has requested changes on this order. Deliver updated stitch files to fulfill revision.'
                        : 'Our master digitizer team is working on your requested changes. You will receive an instant notification as soon as updated stitch files are uploaded.'}
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

              {/* Submit Revision Form: ONLY active for CUSTOMER when delivered and NOT completed/in_revision */}
              {!isAdmin && ord.status === 'delivered' && !isCompleted && (
                <form onSubmit={handleRevisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--bg-surface)', padding: '1.15rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Describe Required Changes:
                  </label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Type instructions..."
                    value={revisionNote}
                    onChange={e => setRevisionNote(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600 }}>
                      📎 {revisionImage ? revisionImage.name : 'Attach Reference File (Image, PDF, Document)'}
                      <input type="file" style={{ display: 'none' }} accept="*/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setRevisionImage(e.target.files[0]); }} />
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

        </div>

        {/* ==================================================================
            4. STICKY ACTION FOOTER
           ================================================================== */}
        {(!isMobileLayout || isAdmin || !isPaid || (isDelivered && !isCompleted && !isInRevision) || isCompleted) && (
        <div style={{
          padding: isMobileLayout ? '0.65rem 0.85rem max(0.65rem, env(safe-area-inset-bottom, 0.65rem))' : '0.85rem 1.6rem',
          background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
          borderTop: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid var(--border-color)',
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
          {/* Price is shown in the mobile footer only when payment is still required. */}
          {(!isMobileLayout || !isPaid) && (
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
          )}

          {/* Primary actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', width: isMobileLayout ? '100%' : 'auto', marginLeft: isMobileLayout ? 0 : 'auto' }}>
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
                onClick={() => {
                  const targetStatus = (ord.status === 'delivered' || ord.status === 'completed') ? ord.status : 'in_progress';
                  updateOrderStatus(ord.id, targetStatus, { payment_status: 'paid', paymentStatus: 'paid', isPaid: true, paid_at: new Date().toISOString() });
                }}
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
                    flex: isMobileLayout ? 1 : undefined,
                    justifyContent: 'center',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <CheckCircle2 size={15} /> Approve delivery
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection(modificationRef, 'modification')}
                  className="btn btn-outline btn-sm"
                  style={{ fontWeight: 800, flex: isMobileLayout ? 1 : undefined, justifyContent: 'center', padding: isMobileLayout ? '0.55rem 0.75rem' : undefined }}
                >
                  <RotateCcw size={14} /> Request changes
                </button>
              </>
            ) : isCompleted && !isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="btn btn-sm"
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    gap: '0.35rem',
                    cursor: 'pointer',
                    flex: isMobileLayout ? 1 : undefined,
                    justifyContent: 'center'
                  }}
                >
                  <Download size={14} /> Download files
                </button>

                {!isLoadingOrderReview && !orderReview && (
                  <button
                    type="button"
                    onClick={() => setShowCustomerReviewModal(true)}
                    className="btn btn-outline btn-sm"
                    style={{
                      fontWeight: 800,
                      gap: '0.35rem',
                      flex: isMobileLayout ? 1 : undefined,
                      justifyContent: 'center',
                      borderColor: '#f59e0b',
                      color: '#b45309',
                      background: '#fffbeb'
                    }}
                  >
                    <Star size={14} /> Leave feedback
                  </button>
                )}
              </>
            ) : isInRevision && !isAdmin ? (
              <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <RotateCcw size={13} /> Modification Under Production
              </span>
            ) : null}



            {ord.status === 'cancelled' && (
              <span style={{
                background: '#fee2e2',
                color: '#991b1b',
                border: '1px solid #fca5a5',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                ✕ Order Cancelled
              </span>
            )}

            {!isMobileLayout && (
              <button
                type="button"
                onClick={handleSafeCloseDrawer}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}
              >
                Close
              </button>
            )}
          </div>
        </div>
        )}

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

      {/* In-App PDF Preview Modal */}
      {activePdfPreview && (
        <PdfPreviewModal
          isOpen={Boolean(activePdfPreview)}
          fileUrl={activePdfPreview.url}
          fileName={activePdfPreview.name}
          onClose={() => setActivePdfPreview(null)}
        />
      )}

      {/* Assign Worker Modal */}
      {isAssignModalOpen && (
        <AssignWorkerModal
          order={ord}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssigned={(updated) => {
            if (setSelectedOrderForDrawer) {
              setSelectedOrderForDrawer(prev => prev ? { ...prev, ...updated } : prev);
            }
            setIsAssignModalOpen(false);
          }}
          showToast={showToast}
        />
      )}

      {/* Review Worker Upload Modal */}
      {isReviewModalOpen && (
        <ReviewWorkerUploadModal
          order={ord}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          onReviewed={(updated) => {
            if (setSelectedOrderForDrawer) {
              setSelectedOrderForDrawer(prev => prev ? { ...prev, ...updated } : prev);
            }
            setIsReviewModalOpen(false);
          }}
          showToast={showToast}
        />
      )}

      {/* VIP International Commercial Tax Invoice Modal */}
      {showInvoiceModal && (
        <CustomerInvoiceModal
          order={ord}
          client={{ name: ord.clientName, email: ord.clientEmail }}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Optional post-approval customer feedback */}
      {showCustomerReviewModal && !isAdmin && (
        <CustomerReviewModal
          order={ord}
          onClose={() => setShowCustomerReviewModal(false)}
          onSubmitted={(review) => {
            setOrderReview(review || { submitted_at: new Date().toISOString() });
          }}
        />
      )}

    </>
  );
};
