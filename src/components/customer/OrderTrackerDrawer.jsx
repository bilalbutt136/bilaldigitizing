'use client';

import React, { useState, useRef } from 'react';
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
  ShieldCheck
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
    setCheckoutSession
  } = useAppState();

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

  const isPaid = isOrderPaid(ord);

  // Files are considered ready if order is marked delivered or completed or has uploaded machine files
  const isDelivered = ord.status === 'delivered' || ord.status === 'completed' || (Array.isArray(ord.uploadedMachineFiles) && ord.uploadedMachineFiles.length > 0);
  const isCompleted = ord.status === 'completed';

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    const senderRole = isAdmin ? 'admin' : 'client';
    const senderName = isAdmin ? (authUser?.name || 'Master Admin Desk') : (ord.clientName || 'Client');
    await addOrderMessage(ord.id, chatMessageText, senderName, senderRole);
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

      await updateOrderStatus(ord.id, 'delivered', {
        outputFileUrl: uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles[0].url || uploadedCloudinaryFiles[0].name : '',
        uploadedMachineFiles: updatedFiles,
        deliveryNotes: deliveryNoteText,
        deliveryMessage: deliveryNoteText,
        deliveryDate: new Date().toISOString()
      });

      // Also add as a chat notification message
      await addOrderMessage(
        ord.id,
        `📦 Order Delivered:\n${deliveryNoteText}\n${updatedFiles.length} file(s) available for download.`,
        authUser?.name || 'Master Digitizer Desk',
        'admin'
      );

      setAdminFilesList([]);
      setDeliveryMessage('');
      showToast(`🎉 Order successfully delivered to client!`, 'success');
    } catch (err) {
      console.error('Delivery error:', err);
      showToast('Delivery failed. Please try again.', 'error');
    } finally {
      setIsDelivering(false);
    }
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

    const fileName = `${ord.title.replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;
    triggerFileDownload(null, fileName, formatKey);
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
    if (setCheckoutSession && setIsCheckoutModalOpen) {
      setCheckoutSession({
        amount: parseFloat(ord.price || ord.totalPrice || 15.00),
        orderId: ord.id,
        orderTitle: ord.title || 'Studio Design Order'
      });
      setIsCheckoutModalOpen(true);
    }
  };

  const handleApproveDelivery = async () => {
    await updateOrderStatus(ord.id, 'completed');
    await addOrderMessage(ord.id, '✅ Delivery Approved & Order Completed by Client.', ord.clientName || 'Client', 'client');
    showToast('🎉 Delivery approved! Thank you for choosing Bilal Digitizing.', 'success');
  };

  const getStatusBadge = () => {
    const s = String(ord.status || 'submitted').toLowerCase();
    if (s === 'completed') return <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>✅ Completed</span>;
    if (s === 'delivered') return <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>📦 Delivered</span>;
    if (s === 'revision' || s === 'revision_requested') return <span style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔄 Modification Requested</span>;
    if (s === 'qc' || s === 'quality_check') return <span style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔍 Quality Check</span>;
    if (s === 'in_progress' || s === 'digitizing' || s === 'assigned') return <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>⚡ In Production</span>;
    return <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>🔴 Submitted</span>;
  };

  return (
    <div 
      className="modal-overlay"
      onClick={() => setSelectedOrderForDrawer(null)}
      style={{ zIndex: 99990, background: 'rgba(11, 19, 41, 0.85)', backdropFilter: 'blur(10px)', padding: 'clamp(0.5rem, 2vw, 1.5rem)' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '960px', 
          width: '100%',
          maxHeight: '94vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          background: 'var(--bg-card)'
        }}
      >
        
        {/* ==================================================================
            1. TOP HEADER
           ================================================================== */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(135deg, #090f1d 0%, #111a2e 100%)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff7a00 0%, #ff5500 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)'
            }}>
              <Layers size={22} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ord.title || 'Studio Order'}
                </h3>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.14)', 
                  color: '#f8fafc', 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '6px' 
                }}>
                  {formatOrderId(ord.id)}
                </span>
                {getStatusBadge()}
                {isPaid ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={11} /> PAID
                  </span>
                ) : (
                  <span style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={11} /> PENDING
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}</span>
                <span>•</span>
                <span>Submitted {formattedSubmissionDate}</span>
                {ord.clientName && <span>• Client: <strong style={{ color: '#ffffff' }}>{ord.clientName}</strong></span>}
              </div>
            </div>
          </div>

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
              cursor: 'pointer'
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
          padding: '0.6rem 1.5rem',
          gap: '0.5rem',
          overflowX: 'auto'
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
              borderColor: isDelivered ? '#10b981' : undefined,
              color: isDelivered && activeSection !== 'delivery' ? '#047857' : undefined,
              background: isDelivered && activeSection !== 'delivery' ? '#ecfdf5' : undefined
            }}
          >
            <PackageCheck size={14} /> {isAdmin ? 'Deliver Order / Files' : (isDelivered ? '✨ Delivered Files' : 'Deliverables')}
          </button>

          <button
            type="button"
            onClick={() => scrollToSection(modificationRef, 'modification')}
            className={`btn btn-sm ${activeSection === 'modification' ? 'btn-primary-orange' : 'btn-outline'}`}
            style={{ fontWeight: 800, fontSize: '0.8rem', gap: '0.35rem' }}
          >
            <RotateCcw size={14} /> Request Modification
          </button>

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
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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

          {/* UNPAID PAYMENT BANNER (CUSTOMER ONLY) */}
          {!isPaid && !isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fcd34d',
              borderRadius: '14px',
              padding: '1.15rem 1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f59e0b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: '#78350f', fontSize: '0.95rem' }}>
                    Payment Required to Dispatch Production (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
                  </div>
                  <div style={{ color: '#92400e', fontSize: '0.78rem', marginTop: '0.1rem' }}>
                    Your design brief is saved. Finalize checkout to start digitizing immediately.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLaunchPayment}
                className="btn btn-primary-orange"
                style={{ fontWeight: 900, gap: '0.4rem', padding: '0.55rem 1.25rem' }}
              >
                <Zap size={15} /> Pay Now (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
              </button>
            </div>
          )}

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
                    Payment Status: Awaiting Client Checkout (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
                  </div>
                  <div style={{ color: '#b45309', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                    Customer has submitted requirements but has not finalized online payment yet.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateOrderStatus(ord.id, ord.status || 'in_progress', { payment_status: 'paid', isPaid: true })}
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

            {/* CUSTOMER DELIVERY MESSAGE DISPLAY */}
            {isDelivered && (ord.deliveryNotes || ord.deliveryMessage) && (
              <div style={{ background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={13} /> Digitizer Delivery Note:
                </div>
                <div style={{ fontSize: '0.88rem', color: '#047857', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {ord.deliveryNotes || ord.deliveryMessage}
                </div>
              </div>
            )}

            {/* DELIVERABLE MACHINE FILES GRID */}
            {isDelivered ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                {uniqueMachineFiles.length > 0 ? (
                  uniqueMachineFiles.map((f, idx) => {
                    const ext = (f.format || f.name?.split('.').pop() || 'dst').toUpperCase();
                    return (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>🧵</span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name || `Machine_File.${ext}`}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>.{ext} Production File</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadFileAsset(f, ext)}
                          className="btn btn-outline btn-sm"
                          style={{ width: '100%', gap: '0.3rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          <Download size={13} /> Download .{ext}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  allDownloadFormats.map(fmt => (
                    <div key={fmt} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>🧵</span>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.84rem' }}>Format (.{fmt.toUpperCase()})</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Standard Stitch Package</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadFileAsset(null, fmt)}
                        className="btn btn-outline btn-sm"
                        style={{ width: '100%', gap: '0.3rem', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700 }}
                      >
                        <Download size={13} /> Download .{fmt.toUpperCase()}
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', marginBottom: '1.25rem' }}>
                <Clock size={24} style={{ color: 'var(--orange-500)', margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.92rem' }}>Order Currently in Master Digitizing Production</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Files are being processed and tested. Once completed, your machine packages will appear here.</div>
              </div>
            )}

            {/* CUSTOMER APPROVE & MODIFICATION ACTION ROW */}
            {!isAdmin && isDelivered && ord.status !== 'completed' && (
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
          </div>

          {/* ================================================================
              SECTION B: ORDER REQUIREMENTS & SOURCE ARTWORK
             ================================================================ */}
          <div 
            ref={requirementsRef}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1.5px solid var(--border-color)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📋</span>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Order Requirements & Specifications
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Customer instructions, dimensions, target fabric, and source logo files
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Artwork Box */}
              <div 
                onClick={() => setLightboxArtwork({ url: primaryArtworkSrc, name: ord.title })}
                style={{ 
                  width: '180px', 
                  flexShrink: 0, 
                  cursor: 'pointer', 
                  background: 'var(--bg-surface)', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '0.65rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ height: '150px', background: 'var(--bg-card)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
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
                  <ZoomIn size={12} /> Inspect Full Logo
                </div>
              </div>

              {/* Specs Grid */}
              <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Service Category</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Fabric</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatFabric(ord.fabric || ord.fabricType)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Dimensions</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {formatDimensions(ord.dimensions || ord.size)}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Placement</div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
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
                    Modification & Revision Requests
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Free unlimited adjustments on density, size, colors, or pull compensation
                  </div>
                </div>
              </div>
            </div>

            {/* Revisions History */}
            {Array.isArray(ord.revisions) && ord.revisions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                {ord.revisions.map((rev, idx) => (
                  <div key={idx} style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.2rem' }}>
                      🔄 Revision #{ord.revisions.length - idx} • {new Date(rev.createdAt || rev.created_at || Date.now()).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{rev.note || rev.notes || rev.details}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Revision Form */}
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
          </div>

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
                  return (
                    <div key={mIdx} style={{ 
                      background: isMsgAdmin ? 'linear-gradient(135deg, #090f1d 0%, #162033 100%)' : 'var(--bg-surface)', 
                      color: isMsgAdmin ? '#ffffff' : 'var(--text-main)',
                      border: isMsgAdmin ? 'none' : '1px solid var(--border-color)',
                      padding: '0.75rem 1rem', 
                      borderRadius: '10px', 
                      alignSelf: isMsgAdmin ? 'flex-end' : 'flex-start',
                      maxWidth: '85%'
                    }}>
                      <div style={{ fontSize: '0.68rem', color: isMsgAdmin ? 'var(--orange-400)' : 'var(--text-muted)', fontWeight: 800, marginBottom: '0.2rem' }}>
                        {isMsgAdmin ? 'Master Digitizer Desk' : (msg.senderName || msg.sender || 'Client')} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                      </div>
                      <div style={{ fontSize: '0.84rem', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{msg.text}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type a message or question..." 
                value={chatMessageText} 
                onChange={e => setChatMessageText(e.target.value)} 
                style={{ fontSize: '0.85rem' }}
              />
              <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!chatMessageText.trim()} style={{ fontWeight: 800, gap: '0.3rem', whiteSpace: 'nowrap' }}>
                <Send size={14} /> Send
              </button>
            </form>
          </div>

        </div>

        {/* ==================================================================
            4. STICKY ACTION FOOTER
           ================================================================== */}
        <div style={{
          padding: '0.85rem 1.6rem',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Left: Total Price and Payment Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Project Total</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                ${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)}
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
                <Zap size={15} /> Pay Now (${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)})
              </button>
            ) : !isPaid && isAdmin ? (
              <button
                type="button"
                onClick={() => updateOrderStatus(ord.id, ord.status || 'in_progress', { payment_status: 'paid', isPaid: true })}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem', fontWeight: 800, borderColor: '#10b981', color: '#047857', background: '#ecfdf5' }}
              >
                ✓ Mark Paid (Admin)
              </button>
            ) : isDelivered && ord.status !== 'completed' && !isAdmin ? (
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
            ) : null}

            <button
              type="button"
              onClick={() => setSelectedOrderForDrawer(null)}
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
