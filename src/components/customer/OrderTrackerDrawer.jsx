'use client';

import React, { useState } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
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
  HelpCircle
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

  const [revisionNote, setRevisionNote] = useState('');
  const [revisionImage, setRevisionImage] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview | deliverables | messages | revisions
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxArtwork, setLightboxArtwork] = useState(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);

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

  // Always resolve live reactive order state from global orders array
  const ord = orders.find(o => o.id === selectedOrderForDrawer.id) || selectedOrderForDrawer;

  const isOrderPaid = (o) => {
    const pStatus = String(o?.payment_status || o?.paymentStatus || '').toLowerCase().trim();
    return pStatus === 'paid' || pStatus === 'completed' || pStatus === 'settled' || pStatus === 'verified' || pStatus === 'wallet';
  };

  const isPaid = isOrderPaid(ord);

  const getPaymentStatusBadge = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'paid' || s === 'completed' || s === 'settled' || s === 'verified' || s === 'wallet') {
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
        <Clock size={12} /> PENDING
      </span>
    );
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
  
  const isCurrentlyOnAdminPortal = currentView === 'admin' || (typeof window !== 'undefined' && window.location.pathname.includes('admin'));
  const isAdmin = authUser?.role === 'admin' && isCurrentlyOnAdminPortal;

  const isPhysicalPatchOrder = ord.type === 'patch' || ord.type === 'patches' || ord.serviceCategory?.toLowerCase().includes('patch');
  const isPhysicalStoreOrder = isPhysicalPatchOrder || ord.type === 'store' || ord.type === 'merchandise' || ord.type === 'digital_product' || Boolean(ord.isStoreItem) || ord.serviceCategory?.toLowerCase().includes('store') || ord.serviceCategory?.toLowerCase().includes('merchandise');

  const isCompletedOrUnlocked = ord.status === 'completed' || (ord.uploadedMachineFiles && ord.uploadedMachineFiles.length > 0);

  const formattedSubmissionDate = ord.createdAt || ord.created_at ? (() => {
    try {
      const d = new Date(ord.createdAt || ord.created_at);
      if (isNaN(d.getTime())) return 'Recent Submission';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent Submission';
    }
  })() : 'Recent Submission';

  const handleRevisionSubmit = (e) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    let finalNote = revisionNote;
    if (revisionImage) {
      finalNote += `\n[Attached Reference File: ${revisionImage.name}]`;
    }
    addRevisionRequest(ord.id, finalNote);
    setRevisionNote('');
    setRevisionImage(null);
    showToast('Revision request submitted to master digitizer.', 'success');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessageText.trim()) return;
    const senderRole = isAdmin ? 'admin' : 'client';
    const senderName = isAdmin ? (authUser?.name || 'Master Admin') : (ord.clientName || 'Client');
    addOrderMessage(ord.id, chatMessageText, senderName, senderRole);
    setChatMessageText('');
    showToast('Message sent to order activity log', 'success');
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

    updateOrderStatus(ord.id, 'delivered', {
      outputFileUrl: uploadedCloudinaryFiles.length > 0 ? uploadedCloudinaryFiles[0].url || uploadedCloudinaryFiles[0].name : '',
      uploadedMachineFiles: updatedFiles
    });

    setAdminFilesList([]);
    showToast(`${adminFilesList.length} finished machine package(s) delivered!`, 'success');
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

  return (
    <div 
      className="modal-overlay"
      onClick={() => setSelectedOrderForDrawer(null)}
      style={{ zIndex: 99990, background: 'rgba(11, 19, 41, 0.82)', backdropFilter: 'blur(10px)', padding: '1rem' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '920px', 
          width: '100%',
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          background: '#ffffff'
        }}
      >
        
        <div style={{
          padding: '1.4rem 1.8rem',
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
              background: 'linear-gradient(135deg, #ff7a00 0%, #ff5500 100%)',
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
                {getPaymentStatusBadge(ord.payment_status || ord.paymentStatus)}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>{ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art Redraw' : 'Embroidery Digitizing')}</span>
                <span>•</span>
                <span>Submitted {formattedSubmissionDate}</span>
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

        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 1.5rem',
          gap: '0.5rem',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview & Specifications', icon: FileText },
            { id: 'deliverables', label: 'Production Files', icon: Download, badge: isCompletedOrUnlocked ? 'Ready' : null },
            { id: 'messages', label: 'Messages & Activity', icon: MessageSquare, badge: (Array.isArray(ord.messages) && ord.messages.length > 0) ? ord.messages.length : null },
            { id: 'revisions', label: 'Request Revision', icon: RotateCcw }
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
                  padding: '0.9rem 1.15rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: isActive ? '3px solid var(--orange-500)' : '3px solid transparent',
                  color: isActive ? 'var(--orange-600)' : 'var(--navy-800)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} style={{ color: isActive ? 'var(--orange-500)' : 'var(--navy-600)' }} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: tab.id === 'deliverables' ? '#10b981' : '#ff7a00',
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

        <div style={{ padding: '1.6rem', overflowY: 'auto', flex: 1, background: '#fbfcfd' }}>

          {!isPaid && (
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #fcd34d',
              borderRadius: '14px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
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
                  <div style={{ fontWeight: 900, color: '#78350f', fontSize: '1rem' }}>
                    Payment Required to Start Production (${parseFloat(ord.price || 0).toFixed(2)})
                  </div>
                  <div style={{ color: '#92400e', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                    Your high-res design brief is saved. Finalize payment to dispatch to our master digitizing desk.
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
                  padding: '0.7rem 1.45rem',
                  borderRadius: '10px',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
              >
                <Zap size={16} /> Pay Now (${parseFloat(ord.price || 0).toFixed(2)})
              </button>
            </div>
          )}

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
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        borderRadius: '10px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <ZoomIn size={24} />
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 800, 
                      color: 'var(--orange-600)', 
                      marginTop: '0.65rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.35rem' 
                    }}>
                      <Sparkles size={13} /> Click to Inspect High-Res
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.25rem' }}>
                        {ord.title || 'Studio Design Order'}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        Professional high-density digitization with commercial machine pathing.
                      </p>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '0.75rem' 
                    }}>
                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Service Category</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                          {ord.serviceCategory || (ord.type === 'vector' ? 'Vector Art' : 'Embroidery Digitizing')}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Target Garment / Fabric</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                          {ord.fabricType || 'Pique Cotton Polo'}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Target Dimensions</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                          {ord.dimensions?.width && ord.dimensions?.height ? `${ord.dimensions.width}" × ${ord.dimensions.height}"` : (ord.patchSize || '3.5" Standard')}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Placement Location</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                          {ord.placement || ord.placementItems?.[0]?.placement || 'Left Chest'}
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Required Machine Formats</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--orange-600)', marginTop: '0.2rem' }}>
                          .DST, .PES, .EMB, .PDF
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>Project Total Cost</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--navy-950)', marginTop: '0.1rem' }}>
                          ${parseFloat(ord.price || ord.totalPrice || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: '1.25rem', 
                  padding: '1rem 1.25rem', 
                  background: '#f8fafc', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0' 
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--navy-800)', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                    📝 Digitizing Instructions & Notes
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--navy-900)', lineHeight: 1.5 }}>
                    {ord.notes || 'Standard high-density stitch pathing with underlay and pull compensation applied for commercial production.'}
                  </div>
                </div>
              </div>

              {uniqueArtworkFiles.length > 0 && (
                <div style={{ 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1.5px solid var(--border-color)', 
                  padding: '1.4rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📎</span> Attached Source Artwork & Logos ({uniqueArtworkFiles.length})
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>High-Resolution Client Assets</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    {uniqueArtworkFiles.map((artFile, aIdx) => {
                      const fileExt = (artFile.format || artFile.name?.split('.').pop() || 'png').toUpperCase();
                      const isImg = ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(fileExt);

                      return (
                        <div 
                          key={aIdx} 
                          style={{ 
                            background: '#f8fafc', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '10px', 
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}
                        >
                          <div 
                            onClick={() => setLightboxArtwork(artFile)}
                            style={{ 
                              height: '95px', 
                              background: '#ffffff', 
                              borderRadius: '8px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              overflow: 'hidden', 
                              cursor: 'pointer',
                              border: '1px solid #e2e8f0',
                              position: 'relative'
                            }}
                          >
                            {isImg ? (
                              <img 
                                src={artFile.url || artFile.public_url || artFile.previewUrl} 
                                alt={artFile.name} 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80';
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                              />
                            ) : (
                              <div style={{ textAlign: 'center', color: 'var(--navy-900)' }}>
                                <div style={{ fontSize: '1.6rem' }}>📄</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 800 }}>.{fileExt} Asset</div>
                              </div>
                            )}
                            <span style={{ 
                              position: 'absolute', 
                              top: '4px', 
                              right: '4px', 
                              background: 'rgba(15, 23, 42, 0.85)', 
                              color: '#fff', 
                              fontSize: '0.62rem', 
                              fontWeight: 800, 
                              padding: '0.1rem 0.35rem', 
                              borderRadius: '4px' 
                            }}>
                              .{fileExt}
                            </span>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={artFile.name}>
                              {artFile.name || `Artwork_${aIdx + 1}.${fileExt.toLowerCase()}`}
                            </div>
                            {artFile.placementName && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--orange-600)', fontWeight: 700, marginTop: '0.1rem' }}>
                                {artFile.placementName}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: 'auto' }}>
                            <button 
                              type="button"
                              onClick={() => setLightboxArtwork(artFile)}
                              className="btn btn-outline btn-sm" 
                              style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', gap: '0.2rem', justifyContent: 'center' }}
                            >
                              <Sparkles size={11} /> Inspect
                            </button>
                            <button 
                              type="button"
                              onClick={() => triggerFileDownload(artFile.url || artFile.public_url, artFile.name || `artwork_${aIdx + 1}.${fileExt.toLowerCase()}`, fileExt.toLowerCase())}
                              className="btn btn-outline btn-sm" 
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                              title="Download Original File"
                            >
                              <Download size={11} />
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

          {/* ================================================================
              TAB 2: PRODUCTION FILES & DELIVERABLES
             ================================================================ */}
          {activeTab === 'deliverables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {isAdmin && !isPhysicalStoreOrder && (
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>Assign Production Staff</div>
                  <select
                    className="form-control"
                    style={{ width: '100%', fontSize: '0.88rem', fontWeight: 700 }}
                    value={ord.digitizerId || ''}
                    onChange={(e) => assignDigitizer(ord.id, e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {(digitizers || []).map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.role})</option>
                    ))}
                  </select>
                </div>
              )}

              {isAdmin && (
                <div 
                  onDragOver={(e) => { e.preventDefault(); setAdminDragOver(true); }}
                  onDragLeave={() => setAdminDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setAdminDragOver(false); processAdminFilesList(e.dataTransfer.files); }}
                  style={{ 
                    padding: '1.5rem', 
                    background: adminDragOver ? 'var(--orange-50)' : '#ffffff', 
                    borderRadius: '14px', 
                    border: `2px dashed ${adminDragOver ? 'var(--orange-500)' : 'var(--border-color)'}`, 
                    textAlign: 'center' 
                  }}
                >
                  <UploadCloud size={30} style={{ color: 'var(--orange-500)', margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.25rem' }}>Master Digitizer Delivery Dropzone</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload finished machine packages (.DST, .PES, .EMB, .PDF)</div>
                  
                  <form onSubmit={handleAdminFileSubmit}>
                    <label style={{ display: 'inline-block', padding: '0.5rem 1.15rem', background: 'var(--navy-900)', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', marginBottom: '1rem' }}>
                      Browse Machine Files
                      <input type="file" multiple accept="*/*" onChange={handleAdminFileChange} style={{ display: 'none' }} />
                    </label>

                    {adminFilesList.length > 0 && (
                      <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0.5rem', marginBottom: '1rem' }}>
                        {adminFilesList.map((f, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', alignItems: 'center', borderBottom: i < adminFilesList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileCheck size={15} style={{ color: 'var(--green-500)' }} />
                              <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.82rem' }}>{f.name}</span>
                            </div>
                            <button type="button" onClick={() => removeAdminFile(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={15}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {adminFilesList.length > 0 && (
                      <button type="submit" className="btn btn-primary-orange btn-sm" style={{ width: '100%', gap: '0.4rem' }}>
                        <Send size={15} /> Deliver Finished Package to Client
                      </button>
                    )}
                  </form>
                </div>
              )}

              {/* Client Deliverables View */}
              {!isCompletedOrUnlocked ? (
                <div style={{ 
                  padding: '3rem 2rem', 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1.5px solid var(--border-color)', 
                  textAlign: 'center' 
                }}>
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    background: '#fff7ed', 
                    color: 'var(--orange-500)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 1rem' 
                  }}>
                    <Clock size={30} />
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-950)', margin: '0 0 0.5rem' }}>
                    Design Brief In Production
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                    Our master digitizing desk is preparing your production stitch files (.DST, .PES, .EMB) with full pull compensation and color sequence worksheets.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--navy-800)', fontWeight: 700 }}>
                    ⚡ Turnaround: 4–8 Hour Express Delivery
                  </div>
                </div>
              ) : (
                <div style={{ 
                  background: '#ffffff', 
                  borderRadius: '16px', 
                  border: '1.5px solid var(--border-color)', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '1.25rem 1.5rem', 
                    borderBottom: '1px solid #e2e8f0', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1rem' 
                  }}>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy-950)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <PackageCheck size={20} style={{ color: 'var(--green-600)' }} /> Production Deliverables Ready
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        High-precision machine formats and stitch worksheet
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleDownloadAll} 
                      className="btn btn-primary-orange" 
                      style={{ gap: '0.45rem', padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
                    >
                      <Download size={15} /> Download All Files (.ZIP)
                    </button>
                  </div>

                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {uniqueFiles.length > 0 ? (
                      uniqueFiles.map((upFile, idx) => {
                        const ext = (upFile.format || (upFile.name && upFile.name.split('.').pop()) || 'dst').toUpperCase();
                        return (
                          <div 
                            key={idx}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid var(--border-color)',
                              borderRadius: '12px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>🧵</span>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.85rem' }}>{upFile.name || `Machine_Asset.${ext}`}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>.{ext} Production File</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadFileAsset(upFile, ext)}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', gap: '0.4rem', justifyContent: 'center', fontSize: '0.8rem' }}
                            >
                              <Download size={13} /> Download .{ext}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      allDownloadFormats.map(fmtKey => {
                        const meta = MACHINE_FORMAT_EXTENSIONS[fmtKey] || { name: `Format (.${fmtKey.toUpperCase()})`, desc: 'Machine Stitch Asset', icon: '🧵' };
                        return (
                          <div 
                            key={fmtKey}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid var(--border-color)',
                              borderRadius: '12px',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.85rem' }}>{meta.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{meta.desc}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadFileAsset(null, fmtKey)}
                              className="btn btn-outline btn-sm"
                              style={{ width: '100%', gap: '0.4rem', justifyContent: 'center', fontSize: '0.8rem' }}
                            >
                              <Download size={13} /> Download .{fmtKey.toUpperCase()}
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

          {/* ================================================================
              TAB 3: MESSAGES & ACTIVITY LOG
             ================================================================ */}
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
                <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.05rem' }}>
                  Project Communication Feed
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('bdigi_open_order_chat', { detail: { orderId: ord.id } }));
                    setSelectedOrderForDrawer(null);
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.78rem', gap: '0.35rem', borderColor: 'var(--orange-500)', color: 'var(--orange-600)' }}
                >
                  <MessageSquare size={13} /> Open in Live Support Inbox 💬
                </button>
              </div>

              {/* Message Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
                {(!Array.isArray(ord.messages) || ord.messages.length === 0) ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '2rem 1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    No messages on this project yet. Use the message composer below to chat with your digitizer.
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
                  placeholder="Send a note or question to the digitizing team..." 
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

          {/* ================================================================
              TAB 4: REVISION REQUEST
             ================================================================ */}
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
                  Free Unlimited Revisions Guarantee
                </h4>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                  Need adjustments on stitch density, dimensions, colors, or pull compensation? Describe the required tweaks below.
                </p>
              </div>

              {/* Revisions History Feed */}
              {Array.isArray(ord.revisions) && ord.revisions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
              <form onSubmit={handleRevisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)' }}>Describe Changes Needed</label>
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
                    📎 {revisionImage ? revisionImage.name : 'Attach Reference Image / Mockup'}
                    <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setRevisionImage(e.target.files[0]); }} />
                  </label>
                  <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!revisionNote.trim()}>
                    Submit Revision Request
                  </button>
                </div>
              </form>
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
    </div>
  );
};
