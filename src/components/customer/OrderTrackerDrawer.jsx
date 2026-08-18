'use client';

import React, { useState } from 'react';
import { useAppState, formatOrderId, formatDimensions, formatFabric } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { ProductionWorksheetModal } from '../common/ProductionWorksheetModal';
import { triggerFileDownload } from '../../utils/fileDownloader';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Download, 
  RotateCcw, 
  Send, 
  Sparkles,
  ShieldCheck,
  Lock,
  FileCheck,
  UploadCloud,
  Trash2,
  Printer,
  Truck,
  MapPin,
  Package,
  PackageCheck,
  ExternalLink,
  Zap,
  MessageSquare,
  CreditCard,
  AlertCircle,
  FileText,
  Layers,
  ZoomIn,
  Check,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Activity,
  History,
  FileCode,
  LockKeyhole,
  Eye,
  ArrowRight,
  User,
  Building2,
  Calendar,
  DollarSign
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
    addInternalNote,
    requestOrderModification,
    submitOrderModification,
    approveOrderSpecification,
    approveDeliveryPackage,
    dispatchOrderDelivery,
    updateProcessingProgress,
    ORDER_STATUSES
  } = useAppState();

  const [revisionNote, setRevisionNote] = useState('');
  const [revisionFiles, setRevisionFiles] = useState([]);
  const [revisionImage, setRevisionImage] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | documents | activity | messages | revisions | internal_notes
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxArtwork, setLightboxArtwork] = useState(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);

  // Dedicated Modals
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [isAdminModModalOpen, setIsAdminModModalOpen] = useState(false);
  const [adminModReason, setAdminModReason] = useState('Specification Clarification');
  const [adminModChanges, setAdminModChanges] = useState('');
  const [adminModComments, setAdminModComments] = useState('');

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryCarrier, setDeliveryCarrier] = useState('DHL Express');
  const [deliveryTrackingNumber, setDeliveryTrackingNumber] = useState('');
  const [deliveryExpectedDate, setDeliveryExpectedDate] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Standard Courier Delivery');
  const [deliveryProofUrl, setDeliveryProofUrl] = useState('');

  const [internalNoteText, setInternalNoteText] = useState('');
  const [selectedVersionFilter, setSelectedVersionFilter] = useState('all');

  // Admin Multiple File Upload Array State
  const [adminFilesList, setAdminFilesList] = useState([]);
  const [adminDragOver, setAdminDragOver] = useState(false);

  React.useEffect(() => {
    if (!selectedOrderForDrawer) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedOrderForDrawer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [selectedOrderForDrawer, setSelectedOrderForDrawer]);

  if (!selectedOrderForDrawer) return null;

  // Always resolve live reactive order state from global orders array with flexible ID matching
  const cleanSelId = String(selectedOrderForDrawer?.id || '').trim().replace(/^#+/, '');
  const selWithHash = `#${cleanSelId}`;
  const ord = orders.find(o => {
    const oClean = String(o?.id || '').trim().replace(/^#+/, '');
    return oClean === cleanSelId || o?.id === selectedOrderForDrawer?.id || o?.id === selWithHash;
  }) || selectedOrderForDrawer;

  const isCurrentlyOnAdminPortal = currentView === 'admin' || (typeof window !== 'undefined' && window.location.pathname.includes('admin'));
  const isAdmin = authUser?.role === 'admin' && isCurrentlyOnAdminPortal;

  const isOrderPaid = (o) => {
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    const oStatus = String(o?.status || '').toLowerCase().trim();
    const isPaidFlag = o?.isPaid === true || o?.paid === true || Boolean(o?.paid_at);
    return isPaidFlag || pStatus === 'paid' || pStatus === 'completed' || pStatus === 'settled' || pStatus === 'verified' || pStatus === 'wallet' ||
           ['in_progress', 'processing', 'approved', 'ready_for_delivery', 'in_delivery', 'delivered', 'completed'].includes(oStatus);
  };

  const isPaid = isOrderPaid(ord);

  // Files are ready if the order is PAID and either status is 'delivered'/'completed' or admin uploaded machine files
  const isDeliveredOrReady = isPaid && (
    ord.status === 'delivered' || 
    ord.status === 'completed' || 
    ord.status === 'ready_for_delivery' ||
    ord.status === 'awaiting_delivery_approval' ||
    (Array.isArray(ord.uploadedMachineFiles) && ord.uploadedMachineFiles.length > 0)
  );
  const isCompleted = isPaid && ord.status === 'completed';
  const isCompletedOrUnlocked = isDeliveredOrReady;

  const getPaymentStatusBadge = (statusOrOrder) => {
    const isPaidComputed = typeof statusOrOrder === 'object' && statusOrOrder !== null 
      ? isOrderPaid(statusOrOrder) 
      : isOrderPaid({ payment_status: statusOrOrder });

    if (isPaidComputed) {
      return (
        <span 
          style={{ 
            background: 'rgba(16, 185, 129, 0.14)', 
            color: '#10b981', 
            border: '1px solid rgba(16, 185, 129, 0.35)', 
            fontWeight: 800,
            padding: '0.25rem 0.65rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <Check size={12} /> PAID
        </span>
      );
    }
    return (
      <span 
        style={{ 
          background: '#fef3c7', 
          color: '#d97706', 
          border: '1px solid #fde68a', 
          fontWeight: 800,
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        <Clock size={12} /> PENDING PAYMENT
      </span>
    );
  };

  const getLifecycleStatusBadge = (status) => {
    const s = String(status || 'submitted').toLowerCase();
    switch (s) {
      case 'draft':
        return <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 800 }}>Draft</span>;
      case 'submitted':
        return <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 800 }}>Submitted</span>;
      case 'under_review':
        return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800 }}>Under Review</span>;
      case 'modification_required':
        return <span className="badge" style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: 800 }}>⚠️ Action Needed: Modification</span>;
      case 'resubmitted':
        return <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontWeight: 800 }}>Resubmitted v{ord.currentVersion || 2}</span>;
      case 'approved':
        return <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>Approved v{ord.approvedVersion || ord.currentVersion || 1}</span>;
      case 'processing':
      case 'in_progress':
      case 'digitizing':
      case 'assigned':
        return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 800 }}>⚡ In Production</span>;
      case 'ready_for_delivery':
      case 'awaiting_delivery_approval':
        return <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 }}>✨ Ready for Approval</span>;
      case 'in_delivery':
        return <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 800 }}>🚚 In Delivery</span>;
      case 'delivered':
        return <span className="badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 800 }}>📦 Delivered</span>;
      case 'completed':
        return <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', fontWeight: 800 }}>✅ Completed & Verified</span>;
      case 'rejected':
        return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 800 }}>❌ Rejected</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', fontWeight: 800 }}>Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

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

  const isPhysicalPatchOrder = ord.type === 'patch' || ord.type === 'patches' || ord.serviceCategory?.toLowerCase().includes('patch');
  const isPhysicalStoreOrder = isPhysicalPatchOrder || ord.type === 'store' || ord.type === 'merchandise' || ord.type === 'digital_product' || Boolean(ord.isStoreItem) || ord.serviceCategory?.toLowerCase().includes('store') || ord.serviceCategory?.toLowerCase().includes('merchandise');

  const formattedSubmissionDate = ord.createdAt || ord.created_at ? (() => {
    try {
      const d = new Date(ord.createdAt || ord.created_at);
      if (isNaN(d.getTime())) return 'Recent Submission';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent Submission';
    }
  })() : 'Recent Submission';

  // Build Comprehensive Documents Repository across all versions
  const allOrderDocuments = [];

  // 1. Initial / Original Files (v1)
  (uniqueArtworkFiles || []).forEach((f, idx) => {
    allOrderDocuments.push({
      id: `doc-art-${idx}`,
      name: f.name || `Original_Artwork_${idx + 1}`,
      category: 'Original Artwork',
      version: 1,
      uploadedBy: ord.clientName || 'Client',
      uploadedAt: ord.createdAt || ord.created_at || new Date().toISOString(),
      url: f.url || f.public_url,
      type: 'image'
    });
  });

  // 2. Versioned Files from ord.versions
  if (Array.isArray(ord.versions)) {
    ord.versions.forEach(verObj => {
      (verObj.files || []).forEach((vf, vIdx) => {
        allOrderDocuments.push({
          id: `doc-ver-${verObj.version}-${vIdx}`,
          name: vf.name || `Revised_Brief_v${verObj.version}_${vIdx + 1}`,
          category: `Version ${verObj.version} Revision`,
          version: verObj.version,
          uploadedBy: verObj.submittedBy || 'Client',
          uploadedAt: verObj.submittedAt || new Date().toISOString(),
          url: vf.url || vf.public_url,
          type: 'revision'
        });
      });
    });
  }

  // 3. Machine Deliverables
  if (Array.isArray(ord.uploadedMachineFiles)) {
    ord.uploadedMachineFiles.forEach((mf, mIdx) => {
      allOrderDocuments.push({
        id: `doc-mf-${mIdx}`,
        name: mf.name || `Deliverable_${mIdx + 1}.${mf.format || 'dst'}`,
        category: 'Production Machine Deliverable',
        version: ord.approvedVersion || ord.currentVersion || 1,
        uploadedBy: 'Master Digitizer Desk',
        uploadedAt: mf.uploadedAt || ord.paid_at || new Date().toISOString(),
        url: mf.url,
        format: mf.format,
        type: 'machine_file'
      });
    });
  }

  // 4. Delivery Proof (if any)
  if (ord.deliveryInfo?.proofOfDeliveryUrl) {
    allOrderDocuments.push({
      id: 'doc-pod',
      name: 'Proof_of_Delivery.pdf',
      category: 'Proof of Delivery',
      version: ord.approvedVersion || ord.currentVersion || 1,
      uploadedBy: ord.deliveryInfo.carrier || 'Logistics',
      uploadedAt: ord.deliveryInfo.dispatchDate || new Date().toISOString(),
      url: ord.deliveryInfo.proofOfDeliveryUrl,
      type: 'proof'
    });
  }

  // Filtered Documents
  const filteredDocuments = selectedVersionFilter === 'all' 
    ? allOrderDocuments 
    : allOrderDocuments.filter(d => String(d.version) === String(selectedVersionFilter));

  const availableVersions = Array.from(new Set(allOrderDocuments.map(d => d.version))).sort((a, b) => a - b);

  // Activity Audit Log construction
  const activityList = Array.isArray(ord.activityLog) && ord.activityLog.length > 0
    ? ord.activityLog
    : [
        {
          id: 'act-init',
          action: 'Order Placed & Brief Submitted',
          user: ord.clientName || 'Client',
          role: 'client',
          timestamp: ord.createdAt || ord.created_at || new Date().toISOString(),
          version: 1,
          details: 'Design brief submitted with production specifications.'
        },
        ...(isPaid ? [{
          id: 'act-paid',
          action: 'Payment Verified & Confirmed',
          user: ord.clientName || 'Client',
          role: 'client',
          timestamp: ord.paid_at || new Date().toISOString(),
          version: 1,
          details: `Invoiced amount $${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)} confirmed.`
        }] : []),
        ...(Array.isArray(ord.history) ? ord.history.map((h, i) => ({
          id: `act-hist-${i}`,
          action: h.label || 'Status Updated',
          user: 'Operations System',
          role: 'admin',
          timestamp: h.timestamp || new Date().toISOString(),
          version: 1,
          details: h.label || 'Workflow progress event.'
        })) : [])
      ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    const senderRole = isAdmin ? 'admin' : 'client';
    const senderName = isAdmin ? (authUser?.name || 'Master Admin') : (ord.clientName || 'Client');
    addOrderMessage(ord.id, chatMessageText, senderName, senderRole);
    setChatMessageText('');
    showToast('Message sent to project thread', 'success');
  };

  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    await addInternalNote(ord.id, internalNoteText);
    setInternalNoteText('');
  };

  const handleAdminRequestModificationSubmit = async (e) => {
    e.preventDefault();
    if (!adminModReason.trim()) return;
    await requestOrderModification(ord.id, {
      reason: adminModReason,
      requestedChanges: adminModChanges,
      comments: adminModComments
    });
    setIsAdminModModalOpen(false);
    setAdminModChanges('');
    setAdminModComments('');
  };

  const handleCustomerModificationSubmit = async (e) => {
    e.preventDefault();
    if (!revisionNote.trim() && revisionFiles.length === 0) {
      showToast('Please describe the required changes or upload updated files.', 'warning');
      return;
    }

    const uploadedNewFiles = [];
    if (revisionFiles.length > 0) {
      for (const f of revisionFiles) {
        if (f.rawFile) {
          const up = await uploadFileToCloudinaryFull(f.rawFile, 'customer-revisions', 'artwork');
          if (up) uploadedNewFiles.push(up);
        }
      }
    }

    await submitOrderModification(ord.id, {
      notes: revisionNote,
      newFiles: uploadedNewFiles,
      customerComment: revisionNote
    });

    setRevisionNote('');
    setRevisionFiles([]);
    setRevisionImage(null);
  };

  const handleConfirmCustomerApproval = async () => {
    if (!approvalConfirmed) {
      showToast('Please check the confirmation box to approve the order.', 'warning');
      return;
    }
    await approveOrderSpecification(ord.id, {
      approvedBy: authUser?.name || ord.clientName || 'Client',
      version: ord.currentVersion || 1
    });
    setIsApprovalModalOpen(false);
    setApprovalConfirmed(false);
  };

  const handleAdminDispatchDelivery = async (e) => {
    e.preventDefault();
    await dispatchOrderDelivery(ord.id, {
      carrier: deliveryCarrier,
      trackingNumber: deliveryTrackingNumber,
      expectedDeliveryDate: deliveryExpectedDate,
      deliveryMethod,
      proofOfDeliveryUrl: deliveryProofUrl || null
    });
    setIsDeliveryModalOpen(false);
  };

  const handleLaunchPayment = () => {
    if (setCheckoutSession && setIsCheckoutModalOpen) {
      setCheckoutSession({
        amount: parseFloat(ord.price || ord.totalPrice || 15.00),
        orderId: ord.id,
        orderTitle: ord.title || 'Studio Design Order'
      });
      setIsCheckoutModalOpen(true);
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

  const handleAdminFileChange = (e) => {
    processAdminFilesList(e.target.files);
  };

  const removeAdminFile = (indexToRemove) => {
    setAdminFilesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAdminFileSubmit = async (e) => {
    e.preventDefault();
    if (adminFilesList.length === 0) {
      alert('Please select or drop at least one finished machine file.');
      return;
    }

    const uploadedCloudinaryFiles = [];
    for (const fileObj of adminFilesList) {
      if (!fileObj.rawFile) continue;
      const uploaded = await uploadFileToCloudinaryFull(fileObj.rawFile, 'admin-deliveries', 'deliveries');
      if (uploaded) {
        uploadedCloudinaryFiles.push(uploaded);
      } else {
        uploadedCloudinaryFiles.push({ name: fileObj.name, error: 'Upload failed' });
      }
    }

    const existingFiles = ord.uploadedMachineFiles || [];
    const updatedFiles = [...uploadedCloudinaryFiles, ...existingFiles];

    await updateOrderStatus(ord.id, ORDER_STATUSES.DELIVERED, {
      outputFileUrl: uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles[0].url || uploadedCloudinaryFiles[0].name : '',
      uploadedMachineFiles: updatedFiles,
      activityAction: 'Deliverables Uploaded by Digitizer Desk',
      activityDetails: `${uploadedCloudinaryFiles.length} production files uploaded and dispatched to client.`
    });

    setAdminFilesList([]);
    showToast(`${uploadedCloudinaryFiles.length} finished package(s) delivered!`, 'success');
  };

  const handleDownloadFileAsset = (fileObj, fallbackFormatKey) => {
    if (fileObj && fileObj.url) {
      const fileName = fileObj.name || `${ord.title}_${formatOrderId(ord.id)}.${fileObj.format || fallbackFormatKey}`;
      const ext = fileObj.format || fileName.split('.').pop().toLowerCase() || fallbackFormatKey || 'dst';
      triggerFileDownload(fileObj.url, fileName, ext);
      return;
    }

    const formatKey = (fallbackFormatKey || 'dst').toLowerCase();
    if (formatKey === 'pdf') {
      setShowWorksheetModal(true);
      return;
    }

    const fileName = `${(ord.title || 'Design').replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;
    triggerFileDownload(null, fileName, formatKey);
  };

  const userFormats = ord.requestedFormats || ['dst', 'pes', 'emb'];
  const allDownloadFormats = Array.from(new Set([...userFormats, 'pdf']));
  const uniqueFiles = (ord.uploadedMachineFiles || []).reduce((acc, file) => {
    if (!acc.some(f => f.name === file.name)) acc.push(file);
    return acc;
  }, []);

  const handleDownloadAll = () => {
    const filesToDownload = uniqueFiles.length > 0 ? uniqueFiles : allDownloadFormats.map(fmt => ({ name: null, format: fmt }));
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

  return (
    <div 
      className="modal-overlay"
      onClick={() => setSelectedOrderForDrawer(null)}
      style={{ zIndex: 99990, background: 'rgba(11, 19, 41, 0.85)', backdropFilter: 'blur(10px)', padding: '1rem' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '1020px', 
          width: '100%',
          maxHeight: '94vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '22px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        
        {/* HEADER BAR */}
        <div style={{
          padding: '1.35rem 1.75rem',
          background: 'linear-gradient(135deg, #090f1d 0%, #111a2e 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)'
            }}>
              {ord.type === 'vector' ? <Sparkles size={22} /> : (ord.type === 'patch' ? <Package size={22} /> : <Layers size={22} />)}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ord.title || 'Studio Order'}
                </h3>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.12)', 
                  color: '#f8fafc', 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  padding: '0.2rem 0.55rem', 
                  borderRadius: '6px', 
                  letterSpacing: '0.05em' 
                }}>
                  {formatOrderId(ord.id)}
                </span>
                {getLifecycleStatusBadge(ord.status)}
                {getPaymentStatusBadge(ord.payment_status || ord.paymentStatus)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art Redraw' : 'Embroidery Digitizing')}</span>
                <span>•</span>
                <span>Submitted {formattedSubmissionDate}</span>
                <span>•</span>
                <span style={{ color: '#fb923c', fontWeight: 700 }}>Version {ord.currentVersion || 1}</span>
                {ord.approvedVersion && (
                  <>
                    <span>•</span>
                    <span style={{ color: '#34d399', fontWeight: 700 }}>Approved v{ord.approvedVersion}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button"
              onClick={() => setSelectedOrderForDrawer(null)}
              style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                border: 'none', 
                color: '#cbd5e1', 
                borderRadius: '10px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = '#cbd5e1'; }}
              title="Close Panel (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ADMIN QUICK ACTION BAR (Visible when Staff/Admin opens drawer) */}
        {isAdmin && (
          <div style={{
            background: '#0f172a',
            padding: '0.65rem 1.75rem',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700 }}>
              <LockKeyhole size={14} style={{ color: '#38bdf8' }} />
              <span style={{ color: '#f8fafc' }}>Admin Operations Bar:</span>
              <span>Current Status: <strong style={{ color: '#38bdf8' }}>{String(ord.status).replace(/_/g, ' ').toUpperCase()}</strong></span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Review / Approval Actions */}
              {['submitted', 'under_review', 'resubmitted'].includes(ord.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => approveOrderSpecification(ord.id, { approvedBy: authUser?.name || 'Admin', version: ord.currentVersion || 1 })}
                    style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✓ Approve Specs (v{ord.currentVersion || 1})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdminModModalOpen(true)}
                    style={{ background: '#d97706', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    🔄 Request Modification
                  </button>
                </>
              )}

              {/* Processing Actions */}
              {ord.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, ORDER_STATUSES.PROCESSING, { activityAction: 'Production Started', activityDetails: 'Assigned digitizer has started stitch drafting.' })}
                  style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  ⚡ Start Production
                </button>
              )}

              {['processing', 'in_progress', 'digitizing'].includes(ord.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => updateOrderStatus(ord.id, ORDER_STATUSES.READY_FOR_DELIVERY, { activityAction: 'Marked Ready for Delivery', activityDetails: 'Deliverables verified and ready for client delivery.' })}
                    style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    ✨ Mark Ready for Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProcessingProgress(ord.id, Math.min(100, (ord.processingProgress || 50) + 25))}
                    style={{ background: '#334155', color: '#f8fafc', border: '1px solid #475569', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📈 Progress: {ord.processingProgress || 50}% (+25%)
                  </button>
                </>
              )}

              {/* Delivery Actions */}
              {['ready_for_delivery', 'awaiting_delivery_approval'].includes(ord.status) && (
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(true)}
                  style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  🚚 Dispatch Delivery Package
                </button>
              )}

              {ord.status === 'in_delivery' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, ORDER_STATUSES.DELIVERED, { activityAction: 'Package Delivered', activityDetails: 'Courier confirmed package delivery to client.' })}
                  style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  📦 Mark as Delivered
                </button>
              )}

              {ord.status === 'delivered' && (
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, ORDER_STATUSES.COMPLETED, { activityAction: 'Order Completed by Staff', activityDetails: 'Final deliverables accepted and verified.' })}
                  style={{ background: '#047857', color: '#ffffff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                >
                  ✅ Complete & Archive Order
                </button>
              )}
            </div>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 1.5rem',
          gap: '0.4rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview & Specs', icon: FileText },
            { id: 'documents', label: 'Documents & Versions', icon: FileCode, badge: allOrderDocuments.length > 0 ? allOrderDocuments.length : null },
            { id: 'activity', label: 'Activity Timeline', icon: Activity, badge: activityList.length > 0 ? activityList.length : null },
            { id: 'messages', label: 'Project Messages', icon: MessageSquare, badge: (Array.isArray(ord.messages) && ord.messages.length > 0) ? ord.messages.length : null },
            { id: 'revisions', label: 'Modifications', icon: RotateCcw, badge: ord.status === 'modification_required' ? 'Action' : null },
            ...(isAdmin ? [{ id: 'internal_notes', label: 'Internal Staff Notes', icon: LockKeyhole, badge: (Array.isArray(ord.internalNotes) && ord.internalNotes.length > 0) ? ord.internalNotes.length : null }] : [])
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.85rem 1.05rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: isActive ? '3px solid var(--orange-500)' : '3px solid transparent',
                  color: isActive ? 'var(--orange-600)' : 'var(--navy-800)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} style={{ color: isActive ? 'var(--orange-500)' : 'var(--navy-600)' }} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: tab.badge === 'Action' ? '#e11d48' : (tab.id === 'documents' ? '#059669' : '#ff7a00'),
                    color: '#ffffff',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* DRAWER BODY CONTENT */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#fbfcfd' }}>

          {/* 1. VISUAL 5-STEP LIFECYCLE TRACKER */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.15rem 1.4rem',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                🚀 B2B Order Progress Tracker
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ord.isRush ? 'var(--orange-600)' : 'var(--navy-700)', background: ord.isRush ? 'var(--orange-50)' : '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                {ord.isRush ? '⚡ 2–4h Super Rush' : '⏱ 12–24h Standard Turnaround'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', position: 'relative' }}>
              {[
                { 
                  step: 1, 
                  title: isPaid ? 'Placed & Paid' : 'Pending Payment', 
                  desc: isPaid ? 'Verified order brief' : 'Requires payment',
                  passed: isPaid,
                  current: !isPaid
                },
                { 
                  step: 2, 
                  title: 'Review & Approval', 
                  desc: ord.status === 'modification_required' ? 'Changes requested' : (ord.approvedVersion ? `v${ord.approvedVersion} Approved` : 'Under evaluation'),
                  passed: isPaid && Boolean(ord.approvedVersion || ['processing', 'ready_for_delivery', 'awaiting_delivery_approval', 'in_delivery', 'delivered', 'completed'].includes(ord.status)),
                  current: isPaid && ['submitted', 'under_review', 'resubmitted', 'modification_required'].includes(ord.status)
                },
                { 
                  step: 3, 
                  title: 'Production / QC', 
                  desc: ord.processingProgress ? `${ord.processingProgress}% completed` : 'Digitizing & QC simulation',
                  passed: isPaid && ['ready_for_delivery', 'awaiting_delivery_approval', 'in_delivery', 'delivered', 'completed'].includes(ord.status),
                  current: isPaid && ['processing', 'in_progress', 'digitizing', 'assigned', 'qc', 'approved'].includes(ord.status)
                },
                { 
                  step: 4, 
                  title: 'Delivery & Dispatch', 
                  desc: ord.deliveryInfo?.carrier ? `${ord.deliveryInfo.carrier}` : (ord.status === 'in_delivery' ? 'Package in transit' : 'Awaiting dispatch'),
                  passed: isPaid && ['delivered', 'completed'].includes(ord.status),
                  current: isPaid && ['ready_for_delivery', 'awaiting_delivery_approval', 'in_delivery'].includes(ord.status)
                },
                { 
                  step: 5, 
                  title: isCompleted ? 'Completed' : 'Delivered', 
                  desc: isCompleted ? 'Verified & accepted' : 'Ready for review',
                  passed: isCompleted,
                  current: isPaid && ord.status === 'delivered'
                }
              ].map(st => {
                const isPassed = st.passed;
                const isCurrent = st.current;

                return (
                  <div key={st.step} style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      margin: '0 auto 0.4rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.78rem',
                      background: isPassed 
                        ? '#10b981' 
                        : isCurrent 
                        ? (st.step === 1 && !isPaid ? '#f59e0b' : 'var(--orange-500)') 
                        : '#f1f5f9',
                      color: (isPassed || isCurrent) ? '#ffffff' : '#94a3b8',
                      border: isCurrent ? (st.step === 1 && !isPaid ? '2px solid #fcd34d' : '2px solid var(--orange-300)') : 'none',
                      boxShadow: isCurrent ? (st.step === 1 && !isPaid ? '0 0 0 3px rgba(245, 158, 11, 0.2)' : '0 0 0 3px rgba(249, 115, 22, 0.2)') : 'none',
                      transition: 'all 0.2s'
                    }}>
                      {isPassed ? <Check size={16} /> : (isCurrent && st.step === 1 && !isPaid ? <Clock size={16} /> : st.step)}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 800 : 700, color: isCurrent ? (st.step === 1 && !isPaid ? '#d97706' : 'var(--orange-600)') : isPassed ? '#10b981' : 'var(--navy-900)' }}>
                      {st.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {st.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. DYNAMIC CONTEXTUAL COMMAND BANNERS */}
          {!isPaid ? (
            /* UNPAID BANNER */
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fcd34d',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: '#f59e0b', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
                }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#78350f', fontSize: '0.98rem' }}>
                    Payment Required to Dispatch Production (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
                  </div>
                  <div style={{ color: '#92400e', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    Your high-res design brief is saved. Finalize payment to begin master digitizing.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchPayment}
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #ff5500 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Zap size={16} /> Pay Now (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
              </button>
            </div>
          ) : ord.status === 'modification_required' ? (
            /* MODIFICATION REQUIRED BANNER */
            <div style={{
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
              border: '1.5px solid #fecdd3',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e11d48', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#881337', fontSize: '0.98rem' }}>
                    Action Required: Modification Requested by Digitizer Desk
                  </div>
                  <div style={{ color: '#9f1239', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    Reason: <strong>{ord.modificationRequest?.reason || 'Specification Adjustment'}</strong>. {ord.modificationRequest?.comments || 'Please upload updated files.'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('revisions')}
                style={{
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
                }}
              >
                Review & Upload Changes
              </button>
            </div>
          ) : ord.status === 'delivered' ? (
            /* DELIVERED / READY FOR APPROVAL */
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#10b981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PackageCheck size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.98rem' }}>
                    ✨ Production Files Ready for Review & Acceptance!
                  </div>
                  <div style={{ color: '#047857', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    Inspect finished stitch packages below. Approve order to finalize or request a free modification.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(true)}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  <CheckCircle2 size={16} /> Approve & Accept Order
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="btn btn-outline"
                  style={{ gap: '0.35rem', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 800, borderColor: '#059669', color: '#059669' }}
                >
                  <Download size={15} /> Download All
                </button>
              </div>
            </div>
          ) : ord.status === 'in_delivery' ? (
            /* IN DELIVERY BANNER */
            <div style={{
              background: '#f0fdf4',
              border: '1.5px solid #bbf7d0',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#14532d', fontSize: '0.98rem' }}>
                    🚚 Order Package In Transit ({ord.deliveryInfo?.carrier || 'Carrier Delivery'})
                  </div>
                  <div style={{ color: '#166534', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    Tracking #: <strong>{ord.deliveryInfo?.trackingNumber || 'Available upon pickup'}</strong> • Expected: {ord.deliveryInfo?.expectedDeliveryDate || 'Standard Window'}
                  </div>
                </div>
              </div>

              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => approveDeliveryPackage(ord.id)}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  ✓ Confirm Package Received
                </button>
              )}
            </div>
          ) : isCompleted ? (
            /* COMPLETED BANNER */
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '1.5px solid #a7f3d0',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#059669', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#065f46', fontSize: '0.98rem' }}>
                    🎉 Order Completed & Verified (Approved v{ord.approvedVersion || ord.currentVersion || 1})
                  </div>
                  <div style={{ color: '#047857', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                    Production package accepted. All deliverables and original files remain permanently archived below.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAll}
                className="btn btn-primary-orange"
                style={{ gap: '0.4rem', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
              >
                <Download size={15} /> Download All Files
              </button>
            </div>
          ) : null}

          {/* TAB 1: OVERVIEW & SPECIFICATIONS */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ 
                background: '#ffffff', 
                borderRadius: '16px', 
                border: '1.5px solid var(--border-color)', 
                padding: '1.5rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  
                  <div 
                    onClick={() => setLightboxArtwork({ url: primaryArtworkSrc, name: ord.title })}
                    style={{ 
                      width: '210px', 
                      flexShrink: 0, 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      border: '1.5px solid var(--border-color)', 
                      borderRadius: '14px', 
                      padding: '0.75rem',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      height: '180px', 
                      background: '#ffffff', 
                      borderRadius: '10px', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px solid #e2e8f0',
                      position: 'relative'
                    }}>
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
                    <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                      <ZoomIn size={13} /> Click to Inspect
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.25rem' }}>
                          Production Specification Sheet
                        </h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                          Client: <strong>{ord.clientName || 'Client'}</strong> ({ord.clientEmail || 'client@studio.com'})
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setShowWorksheetModal(true)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem', gap: '0.35rem' }}
                        >
                          <Printer size={13} /> View PDF Worksheet
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DIMENSIONS</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.15rem' }}>
                          {formatDimensions(ord.dimensions || ord.size)}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>FABRIC / SUBSTRATE</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.15rem' }}>
                          {formatFabric(ord.fabric || ord.fabricType)}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>MACHINE FORMATS</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.15rem', textTransform: 'uppercase' }}>
                          {Array.isArray(ord.requestedFormats) && ord.requestedFormats.length > 0 ? ord.requestedFormats.join(', ') : '.DST, .PES, .EMB'}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>ORDER VALUE</div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669', marginTop: '0.15rem' }}>
                          ${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {ord.notes && (
                      <div style={{ marginTop: '1rem', background: '#fffbeb', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                          Production Instructions & Notes
                        </div>
                        <div style={{ fontSize: '0.84rem', color: '#78350f', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                          {ord.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DOCUMENTS & VERSION CONTROL */}
          {activeTab === 'documents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Header & Version Pill Filter */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid var(--border-color)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.2rem' }}>
                    Document Repository & Version Control
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Strict version traceability (v1, v2, v3). All original artwork, revised briefs, and machine packages are preserved.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedVersionFilter('all')}
                    style={{
                      background: selectedVersionFilter === 'all' ? '#ff7a00' : '#f8fafc',
                      color: selectedVersionFilter === 'all' ? '#ffffff' : 'var(--navy-800)',
                      border: selectedVersionFilter === 'all' ? '1px solid #ff7a00' : '1px solid var(--border-color)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    All Versions ({allOrderDocuments.length})
                  </button>
                  {availableVersions.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVersionFilter(v)}
                      style={{
                        background: String(selectedVersionFilter) === String(v) ? '#ff7a00' : '#f8fafc',
                        color: String(selectedVersionFilter) === String(v) ? '#ffffff' : 'var(--navy-800)',
                        border: String(selectedVersionFilter) === String(v) ? '1px solid #ff7a00' : '1px solid var(--border-color)',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Version {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Machine File Upload Box on Documents tab */}
              {isAdmin && (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setAdminDragOver(true); }}
                  onDragLeave={() => setAdminDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setAdminDragOver(false); processAdminFilesList(e.dataTransfer.files); }}
                  style={{ 
                    padding: '1.25rem', 
                    background: adminDragOver ? 'var(--orange-50)' : '#ffffff', 
                    borderRadius: '14px', 
                    border: `2px dashed ${adminDragOver ? 'var(--orange-500)' : 'var(--border-color)'}`, 
                    textAlign: 'center' 
                  }}
                >
                  <UploadCloud size={26} style={{ color: 'var(--orange-500)', margin: '0 auto 0.35rem' }} />
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>Upload Finished Machine Packages (.DST, .PES, .EMB)</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Drag stitch deliverables or browse files to deliver to client</div>
                  
                  <form onSubmit={handleAdminFileSubmit}>
                    <label style={{ display: 'inline-block', padding: '0.45rem 1rem', background: 'var(--navy-900)', color: '#fff', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginBottom: '0.75rem' }}>
                      Browse Files
                      <input type="file" multiple accept="*/*" onChange={handleAdminFileChange} style={{ display: 'none' }} />
                    </label>

                    {adminFilesList.length > 0 && (
                      <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0.5rem', marginBottom: '0.75rem' }}>
                        {adminFilesList.map((f, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', alignItems: 'center', borderBottom: i < adminFilesList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.8rem' }}>{f.name}</span>
                            <button type="button" onClick={() => removeAdminFile(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                          </div>
                        ))}
                        <button type="submit" className="btn btn-primary-orange btn-sm" style={{ width: '100%', marginTop: '0.5rem', gap: '0.4rem' }}>
                          <Send size={14} /> Deliver Finished Package
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Documents Table */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid var(--border-color)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>Document / File Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Version</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Uploaded By</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                          No documents found for this version selection.
                        </td>
                      </tr>
                    ) : (
                      filteredDocuments.map(doc => (
                        <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <span style={{ fontSize: '1.1rem' }}>
                                {doc.type === 'machine_file' ? '🧵' : (doc.type === 'proof' ? '📜' : '🖼️')}
                              </span>
                              <div style={{ fontWeight: 800, color: 'var(--navy-900)', wordBreak: 'break-all' }}>
                                {doc.name}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {doc.category}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '0.15rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>
                              v{doc.version}
                            </span>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {doc.uploadedBy}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => triggerFileDownload(doc.url, doc.name, doc.format || 'bin')}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.3rem' }}
                            >
                              <Download size={13} /> Download
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: ACTIVITY TIMELINE (FULL AUDIT TRAIL) */}
          {activeTab === 'activity' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem'
            }}>
              <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.2rem' }}>
                  Chronological Activity & Audit Log
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Every transition, review, approval, modification, and dispatch is permanently recorded with user identity and timestamp.
                </p>
              </div>

              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                {/* Vertical Timeline Line */}
                <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {activityList.map((item, idx) => {
                    const isClient = item.role === 'client';
                    return (
                      <div key={item.id || idx} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                        {/* Dot */}
                        <div style={{
                          position: 'absolute',
                          left: '-1.5rem',
                          top: '2px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: isClient ? '#ff7a00' : '#2563eb',
                          border: '3px solid #ffffff',
                          boxShadow: '0 0 0 2px rgba(0,0,0,0.08)'
                        }} />

                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem 1.15rem', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.25rem' }}>
                            <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.88rem' }}>
                              {item.action}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {new Date(item.timestamp || Date.now()).toLocaleString()}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontWeight: 700, color: isClient ? '#ea580c' : '#1e40af' }}>{item.user}</span>
                            <span>•</span>
                            <span className="badge" style={{ fontSize: '0.65rem', background: isClient ? 'rgba(255, 122, 0, 0.1)' : 'rgba(37, 99, 235, 0.1)', color: isClient ? '#ea580c' : '#1e40af' }}>
                              {isClient ? 'CLIENT' : 'STAFF'}
                            </span>
                            {item.version && <span>• Version {item.version}</span>}
                          </div>

                          {item.details && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--navy-800)', lineHeight: 1.4 }}>
                              {item.details}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROJECT MESSAGES */}
          {activeTab === 'messages' && (
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              border: '1.5px solid var(--border-color)', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem' }}>
                    Project Communication Thread
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Direct communication between Client and Master Digitizer Desk
                  </div>
                </div>
              </div>

              {/* Message Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
                {(!Array.isArray(ord.messages) || ord.messages.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '2.5rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    No messages on this project yet. Use the message composer below to chat with the digitizing team.
                  </div>
                ) : (
                  (Array.isArray(ord.messages) ? ord.messages : []).map(msg => {
                    const isMsgAdmin = msg.senderRole === 'admin' || msg.sender === 'admin';
                    const displayTime = msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) 
                      ? new Date(msg.timestamp).toLocaleString() 
                      : (msg.timestamp || 'Recent');
                    const displayName = isMsgAdmin ? 'Master Digitizer Desk' : (msg.senderName || msg.sender || (ord.clientName || 'Client'));
                    return (
                      <div key={`msg-${msg.id}`} style={{ 
                        background: isMsgAdmin ? 'linear-gradient(135deg, #090f1d 0%, #162033 100%)' : '#f8fafc', 
                        color: isMsgAdmin ? '#ffffff' : 'var(--navy-900)',
                        border: isMsgAdmin ? 'none' : '1px solid var(--border-color)',
                        padding: '0.9rem 1.15rem', 
                        borderRadius: '12px', 
                        alignSelf: isMsgAdmin ? 'flex-end' : 'flex-start',
                        width: '85%'
                      }}>
                        <div style={{ fontSize: '0.72rem', color: isMsgAdmin ? 'var(--orange-400)' : 'var(--text-muted)', fontWeight: 800, marginBottom: '0.35rem' }}>
                          {displayName} • {displayTime}
                        </div>
                        <div style={{ fontSize: '0.88rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{msg.text}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <textarea 
                  className="form-control" 
                  rows="2" 
                  placeholder="Send a note or technical question to the digitizing desk..." 
                  value={chatMessageText} 
                  onChange={e => setChatMessageText(e.target.value)} 
                  style={{ fontSize: '0.88rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!chatMessageText.trim()} style={{ gap: '0.35rem' }}>
                    <Send size={14} /> Send Message
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: REVISIONS & MODIFICATIONS */}
          {activeTab === 'revisions' && (
            <div style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              border: '1.5px solid var(--border-color)', 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem' }}>
                  Modification & Revision Center
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Submit adjustments on stitch density, dimensions, colors, or pull compensation. Each revision creates a tracked new version (v2, v3...).
                </p>
              </div>

              {/* Pending Modification Request by Admin */}
              {ord.modificationRequest && !ord.modificationRequest.resolved && (
                <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#e11d48', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    ⚠️ Admin Requested Adjustments
                  </div>
                  <div style={{ fontWeight: 800, color: '#881337', fontSize: '0.92rem' }}>
                    Reason: {ord.modificationRequest.reason}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#9f1239', marginTop: '0.2rem' }}>
                    {ord.modificationRequest.comments || 'Please provide revised specifications or high-resolution artwork.'}
                  </div>
                </div>
              )}

              {/* Revisions History Feed */}
              {Array.isArray(ord.revisions) && ord.revisions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)' }}>Previous Revisions:</div>
                  {ord.revisions.map(rev => (
                    <div key={`rev-${rev.id}`} style={{ background: '#fffbeb', padding: '0.9rem 1.15rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 800, marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                        🔄 Revision Requested • {new Date(rev.createdAt || rev.created_at || Date.now()).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#78350f', whiteSpace: 'pre-wrap' }}>{rev.note}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Revision Form */}
              <form onSubmit={handleCustomerModificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>Describe Changes / Upload Revision Files (v{(ord.currentVersion || 1) + 1})</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Explain requested modifications (e.g. increase satin stitch width on borders, adjust height to 3.2 inches, change thread colors)..." 
                  value={revisionNote} 
                  onChange={e => setRevisionNote(e.target.value)} 
                  style={{ fontSize: '0.88rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--navy-700)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid var(--border-color)', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: 600 }}>
                    📎 {revisionFiles.length > 0 ? `${revisionFiles.length} file(s) attached` : 'Attach Revised File / Reference'}
                    <input type="file" multiple style={{ display: 'none' }} accept="*/*" onChange={(e) => {
                      if (e.target.files) {
                        const arr = Array.from(e.target.files).map(f => ({ name: f.name, rawFile: f }));
                        setRevisionFiles(arr);
                      }
                    }} />
                  </label>
                  <button type="submit" className="btn btn-primary-orange btn-sm">
                    Submit Version {(ord.currentVersion || 1) + 1} for Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: INTERNAL STAFF NOTES (ADMIN ONLY) */}
          {activeTab === 'internal_notes' && isAdmin && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}>
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <LockKeyhole size={18} style={{ color: '#0284c7' }} />
                <span style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 700 }}>
                  🔒 Confidential Staff Notes — Strictly internal. Client users never see these notes.
                </span>
              </div>

              {/* Internal Notes Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                {(!Array.isArray(ord.internalNotes) || ord.internalNotes.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem', background: '#f8fafc', borderRadius: '10px' }}>
                    No internal staff notes recorded yet.
                  </div>
                ) : (
                  ord.internalNotes.map(n => (
                    <div key={n.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1.15rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--navy-900)' }}>{n.author}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--navy-800)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{n.text}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Compose Internal Note */}
              <form onSubmit={handleAddInternalNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Type internal staff note or quality check instructions..."
                  value={internalNoteText}
                  onChange={e => setInternalNoteText(e.target.value)}
                  style={{ fontSize: '0.88rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-navy btn-sm" disabled={!internalNoteText.trim()}>
                    Save Internal Note
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* 4. CLEAN B2B ACTION FOOTER */}
        <div style={{
          padding: '1rem 1.6rem',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)'
        }}>
          {/* Left: Total Price and Payment Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project Invoiced Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--navy-950)', lineHeight: 1 }}>
                ${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)}
              </div>
            </div>
            {getPaymentStatusBadge(ord.payment_status || ord.paymentStatus)}
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {!isPaid ? (
              <button
                type="button"
                onClick={handleLaunchPayment}
                style={{
                  background: 'linear-gradient(135deg, #ff7a00 0%, #ff5500 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Zap size={15} /> Pay Now (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
              </button>
            ) : isDeliveredOrReady && ord.status !== 'completed' ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.35rem',
                    borderRadius: '10px',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <CheckCircle2 size={16} /> Approve & Accept Order
                </button>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 800, borderColor: '#059669', color: '#059669' }}
                >
                  <Download size={15} /> Download Files
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revisions')}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <RotateCcw size={15} /> Request Modification
                </button>
              </>
            ) : isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={handleDownloadAll}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 800, borderColor: '#059669', color: '#059669' }}
                >
                  <Download size={15} /> Download Files
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revisions')}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <RotateCcw size={15} /> Request Modification
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('messages')}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <MessageSquare size={15} /> Chat with Team
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('revisions')}
                  className="btn btn-outline"
                  style={{ gap: '0.4rem', padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 700 }}
                >
                  <RotateCcw size={15} /> Request Modification
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedOrderForDrawer(null)}
              className="btn btn-outline"
              style={{ padding: '0.6rem 1.15rem', fontSize: '0.86rem', fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* ====================================================================
          MODAL 1: DEDICATED CUSTOMER APPROVAL CONFIRMATION MODAL
         ==================================================================== */}
      {isApprovalModalOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsApprovalModalOpen(false)}
        >
          <div 
            style={{ maxWidth: '580px', width: '100%', background: '#ffffff', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={24} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                  Confirm Order & Deliverables Approval
                </h3>
              </div>
              <button type="button" onClick={() => setIsApprovalModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Project:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>{ord.title} ({formatOrderId(ord.id)})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approval Version:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ea580c' }}>Version {ord.currentVersion || 1}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dimensions & Fabric:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>{formatDimensions(ord.dimensions || ord.size)} / {formatFabric(ord.fabric || ord.fabricType)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Cost:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Mandatory Checklist */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', background: '#ecfdf5', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #a7f3d0', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={approvalConfirmed} 
                  onChange={e => setApprovalConfirmed(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '0.15rem', accentColor: '#059669' }} 
                />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#065f46', lineHeight: 1.4 }}>
                  I confirm that the order details, dimensions, stitch density specifications, and latest files are correct.
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button 
                type="button" 
                onClick={() => { setIsApprovalModalOpen(false); setActiveTab('revisions'); }} 
                className="btn btn-outline"
                style={{ fontSize: '0.84rem' }}
              >
                Request Modification Instead
              </button>
              <button 
                type="button" 
                onClick={handleConfirmCustomerApproval} 
                disabled={!approvalConfirmed}
                className="btn btn-primary-orange"
                style={{ background: approvalConfirmed ? '#059669' : '#cbd5e1', border: 'none', fontSize: '0.84rem', gap: '0.35rem' }}
              >
                <CheckCircle2 size={16} /> Approve Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ADMIN REQUEST MODIFICATION MODAL
         ==================================================================== */}
      {isAdminModModalOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsAdminModModalOpen(false)}
        >
          <div 
            style={{ maxWidth: '540px', width: '100%', background: '#ffffff', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                Request Order Modification from Client
              </h3>
              <button type="button" onClick={() => setIsAdminModModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminRequestModificationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Modification Reason
                </label>
                <select 
                  className="form-control" 
                  value={adminModReason} 
                  onChange={e => setAdminModReason(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="Specification Clarification">Specification Clarification</option>
                  <option value="Artwork Low Resolution / Unclear">Artwork Low Resolution / Unclear</option>
                  <option value="Size / Dimension Adjustment Needed">Size / Dimension Adjustment Needed</option>
                  <option value="Thread / Color Code Missing">Thread / Color Code Missing</option>
                  <option value="Fabric / Backing Unspecified">Fabric / Backing Unspecified</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Staff Comments & Instructions for Customer
                </label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="Explain exactly what changes the customer needs to upload..."
                  value={adminModComments}
                  onChange={e => setAdminModComments(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsAdminModModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.84rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-orange" style={{ background: '#d97706', border: 'none', fontSize: '0.84rem' }}>
                  Send Modification Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: ADMIN DELIVERY DISPATCH SETUP MODAL
         ==================================================================== */}
      {isDeliveryModalOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setIsDeliveryModalOpen(false)}
        >
          <div 
            style={{ maxWidth: '540px', width: '100%', background: '#ffffff', borderRadius: '18px', padding: '1.75rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={22} style={{ color: '#0284c7' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
                  Dispatch Delivery Package
                </h3>
              </div>
              <button type="button" onClick={() => setIsDeliveryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminDispatchDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Carrier / Delivery Method
                </label>
                <select 
                  className="form-control" 
                  value={deliveryCarrier} 
                  onChange={e => setDeliveryCarrier(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="DHL Express">DHL Express</option>
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="Direct Digital Delivery">Direct Digital Delivery</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Tracking Number
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. DHL-9847291834"
                  value={deliveryTrackingNumber}
                  onChange={e => setDeliveryTrackingNumber(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.3rem' }}>
                  Expected Delivery Date
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Oct 24, 2026 or Express 4-8 Hours"
                  value={deliveryExpectedDate}
                  onChange={e => setDeliveryExpectedDate(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.84rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-orange" style={{ background: '#0284c7', border: 'none', fontSize: '0.84rem' }}>
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxArtwork && (
        <ArtworkLightboxModal
          isOpen={Boolean(lightboxArtwork)}
          onClose={() => setLightboxArtwork(null)}
          imageUrl={lightboxArtwork.url || lightboxArtwork.public_url || primaryArtworkSrc}
          title={lightboxArtwork.name || ord.title}
        />
      )}

      {/* PDF Production Worksheet Modal */}
      {showWorksheetModal && (
        <ProductionWorksheetModal
          isOpen={showWorksheetModal}
          onClose={() => setShowWorksheetModal(false)}
          order={ord}
        />
      )}

    </div>
  );
};
