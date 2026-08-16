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
  MessageSquare
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

const FORMAT_METADATA = {
  dst: { name: 'Tajima (.DST)', desc: 'Tajima Commercial Machine Pathing', icon: '🧵', type: 'Commercial' },
  pes: { name: 'Brother / Bernina (.PES)', desc: 'Brother, Babylock & Bernina Format', icon: '🪡', type: 'Home & Pro' },
  emb: { name: 'Wilcom Native (.EMB)', desc: 'Wilcom Master Vector Source File', icon: '💎', type: 'Master Source' },
  jef: { name: 'Janome (.JEF)', desc: 'Janome & Elna Embroidery Format', icon: '🧵', type: 'Home & Pro' },
  exp: { name: 'Melco (.EXP)', desc: 'Melco & High-Speed Multi-Needle', icon: '⚡', type: 'Commercial' },
  hus: { name: 'Husqvarna Viking (.HUS)', desc: 'Husqvarna Viking Machine Format', icon: '🧵', type: 'Home & Pro' },
  vp3: { name: 'Pfaff (.VP3)', desc: 'Pfaff & Viking Precision Stitching', icon: '🧵', type: 'Home & Pro' },
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
    completeOrder,
    ORDER_STATUSES,
    assignDigitizer,
    digitizers
  } = useAppState();

  const [revisionNote, setRevisionNote] = useState('');
  const [revisionImage, setRevisionImage] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('timeline'); // timeline | downloads | messages | revisions
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxArtwork, setLightboxArtwork] = useState(null);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);

  // Admin Multiple File Upload Array State
  const [adminFilesList, setAdminFilesList] = useState([]);
  const [adminDragOver, setAdminDragOver] = useState(false);

  if (!selectedOrderForDrawer) return null;

  // Always resolve live reactive order state from global orders array
  const ord = orders.find(o => o.id === selectedOrderForDrawer.id) || selectedOrderForDrawer;

  // Collect all uploaded artwork / logo files across all placements and attachments
  const clientArtworkFiles = [
    ...(ord.uploadedFiles || []),
    ...(ord.placementItems?.flatMap(p => (p.files || []).map(f => ({ ...f, placementName: p.placement || p.name }))) || []),
    ...(ord.patchItems?.flatMap(p => (p.files || []).map(f => ({ ...f, placementName: p.tier || p.name }))) || []),
    ...(ord.vectorItems?.flatMap(v => (v.files || []).map(f => ({ ...f, placementName: v.name }))) || [])
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
  
  // Show Admin dropzone ONLY if user has admin role AND is currently viewing inside the Admin Portal
  const isCurrentlyOnAdminPortal = currentView === 'admin' || (typeof window !== 'undefined' && window.location.pathname.includes('admin'));
  const isAdmin = authUser?.role === 'admin' && isCurrentlyOnAdminPortal;

  // Check if physical store or custom patch order
  const isPhysicalPatchOrder = ord.type === 'patch' || ord.type === 'patches' || ord.serviceCategory?.toLowerCase().includes('patch');
  const isPhysicalStoreOrder = isPhysicalPatchOrder || ord.type === 'store' || ord.type === 'merchandise' || ord.type === 'digital_product' || Boolean(ord.isStoreItem) || ord.serviceCategory?.toLowerCase().includes('store') || ord.serviceCategory?.toLowerCase().includes('merchandise');

  // Fiverr-style granular stages
  const stageKeys = ['awaiting_payment', 'in_progress', 'digitizing', 'delivered', 'completed'];
  const stageLabels = {
    awaiting_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    digitizing: 'Digitizing',
    delivered: 'Delivered',
    completed: 'Completed'
  };

  const stages = stageKeys.map(key => ({ key, label: stageLabels[key] }));
  const currentStageIndex = ord.status === 'cancelled' ? -1 : stageKeys.indexOf(ord.status === 'assigned' ? 'digitizing' : ord.status === 'qc' ? 'delivered' : ord.status || 'awaiting_payment');
  const isCompletedOrUnlocked = ord.status === 'completed' || (ord.uploadedMachineFiles && ord.uploadedMachineFiles.length > 0);

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

  const formatPlacementTimeFull = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const getElapsedTimeFormatted = (createdIso, updatedIso) => {
    try {
      const start = new Date(createdIso || Date.now()).getTime();
      const end = updatedIso && (ord.status === 'completed' || ord.status === 'delivered') ? new Date(updatedIso).getTime() : Date.now();
      const diffMs = Math.max(0, end - start);
      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return `${hrs}h ${mins}m`;
    } catch {
      return 'N/A';
    }
  };

  // Helper to download original client source artwork
  const handleDownloadSourceArtwork = () => {
    const fileName = ord.artworkFileName || `${ord.title.replace(/\s+/g, '_')}_source_artwork.png`;
    const ext = fileName.split('.').pop().toLowerCase() || 'png';
    triggerFileDownload(ord.artworkUrl, fileName, ext);
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
      alert('Please select or drop at least one finished machine file (.DST, .PES, .EMB, .PDF) to upload.');
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
    showToast(`${adminFilesList.length} finished machine package(s) delivered to client! Status updated to DELIVERED.`, 'success');
  };

  // Helper to download specific uploaded or simulated machine file
  const handleDownloadFileAsset = (fileObj, fallbackFormatKey) => {
    if (fileObj && fileObj.url) {
      const fileName = fileObj.name || `${ord.title}_${formatOrderId(ord.id)}.${fileObj.format || fallbackFormatKey}`;
      const ext = fileObj.format || fileName.split('.').pop().toLowerCase() || fallbackFormatKey || 'dst';
      triggerFileDownload(fileObj.url, fileName, ext);
      return;
    }

    const formatKey = (fallbackFormatKey || 'dst').toLowerCase();
    
    // If format is PDF, open the branded printable worksheet modal
    if (formatKey === 'pdf') {
      setShowWorksheetModal(true);
      return;
    }

    const fileName = `${ord.title.replace(/\s+/g, '_')}_${formatOrderId(ord.id)}.${formatKey}`;
    triggerFileDownload(null, fileName, formatKey);
  };

  // Compile full format download list (.DST, .PES, .EMB, .JEF, .EXP, .HUS, .VP3 + .PDF)
  const userFormats = ord.requestedFormats || ['dst', 'pes', 'emb'];
  const allDownloadFormats = Array.from(new Set([...userFormats, 'pdf']));

  // Deduplicate existing files to prevent old double-upload bugs from showing
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
      }, index * 400); // Stagger to prevent browser blocking
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--navy-950)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff' }}>{ord.title}</h3>
              <span className="badge badge-assigned" style={{ fontSize: '0.75rem' }}>{formatOrderId(ord.id)}</span>
              {isCompletedOrUnlocked && <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>COMPLETED & UNLOCKED</span>}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Submitted on {new Date(ord.createdAt).toLocaleString()}
            </div>
          </div>

          <button 
            onClick={() => setSelectedOrderForDrawer(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: '#ffffff',
          padding: '0 1.75rem'
        }}>
          {isPhysicalStoreOrder ? (
            <button
              style={{
                padding: '0.85rem 1.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: '3px solid var(--orange-600)',
                color: 'var(--orange-600)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'default'
              }}
            >
              📦 Order Fulfillment & Shipping Details
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  color: 'var(--navy-900)',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'default'
                }}
              >
                📋 Order Requirements & Delivery
              </div>
            </div>
          )}
        </div>

        {/* Drawer Body Content */}
        <div style={{ padding: '1.75rem', overflowY: 'auto', flex: 1 }}>
          
          {/* PHYSICAL STORE & MERCHANDISE FULFILLMENT VIEW */}
          {isPhysicalStoreOrder ? (
            <div>
              {/* 4-Step Fulfillment / Production Progress Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginBottom: '2rem',
                position: 'relative'
              }}>
                {(isPhysicalPatchOrder ? [
                  { key: 'proof', label: 'Proof Approval' },
                  { key: 'production', label: 'Weaving / Embroidering' },
                  { key: 'qc', label: 'Quality & Border Check' },
                  { key: 'shipped', label: 'Dispatched & Shipping' }
                ] : [
                  { key: 'placed', label: 'Order Placed' },
                  { key: 'processing', label: 'Processing & Packing' },
                  { key: 'shipped', label: 'Shipped & In Transit' },
                  { key: 'delivered', label: 'Delivered' }
                ]).map((stg, idx) => {
                  const currentIdx = ord.status === 'completed' || ord.status === 'delivered' ? 3 : (ord.status === 'shipped' ? 2 : (ord.status === 'digitizing' || ord.status === 'assigned' ? 1 : 0));
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={stg.key} style={{ textAlign: 'center' }}>
                      <div style={{
                        height: '6px',
                        background: isDone ? 'var(--green-500)' : 'var(--navy-100)',
                        borderRadius: '3px',
                        marginBottom: '0.75rem',
                        transition: 'background 0.3s'
                      }} />
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isDone ? 'var(--green-500)' : 'var(--navy-100)',
                        color: isDone ? '#ffffff' : 'var(--text-muted)',
                        margin: '0 auto 0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}>
                        {isDone ? <CheckCircle2 size={18} /> : idx + 1}
                      </div>
                      <div style={{
                        fontSize: '0.78rem',
                        fontWeight: isCurrent ? 800 : 600,
                        color: isCurrent ? 'var(--navy-900)' : 'var(--text-muted)'
                      }}>
                        {stg.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Patch Manufacturing Specs Card (if Custom Patch Order) */}
              {isPhysicalPatchOrder && (
                <div style={{ background: '#ffffff', border: '1.5px solid var(--orange-500)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={17} /> Physical Patch Manufacturing Specifications
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    <div><strong>Patch Style:</strong> <span style={{ color: 'var(--navy-900)', fontWeight: 800 }}>{ord.serviceCategory || ord.title}</span></div>
                    <div><strong>Order Quantity:</strong> <strong>{ord.quantity || 100} Pcs</strong></div>
                    <div><strong>Backing Attachment:</strong> {ord.backing || 'Velcro Hook & Loop'}</div>
                    <div><strong>Border Edge Finish:</strong> {ord.borderType || 'Merrowed Die-Cut Border'}</div>
                    <div><strong>Size Dimensions:</strong> {ord.patchSize || '3.5" x 3.5" Standard'}</div>
                    <div><strong>Total Cost:</strong> <strong style={{ color: 'var(--navy-900)' }}>${parseFloat(ord.price || 0).toFixed(2)}</strong></div>
                  </div>
                </div>
              )}

              {/* Shipping Address & Package Tracking Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                {/* Shipping Address Card */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <MapPin size={16} style={{ color: 'var(--orange-600)' }} /> Shipping Destination
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                    {ord.clientName || 'Sarah Jenkins'}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                    {ord.shippingAddress?.street || '1042 Industrial Parkway, Suite 400'}<br />
                    {ord.shippingAddress?.cityStateZip || 'Austin, TX 78758, United States'}
                  </div>
                </div>

                {/* Tracking & Carrier Information */}
                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <Truck size={16} style={{ color: 'var(--orange-600)' }} /> Carrier & Tracking Details
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                    <strong>Carrier:</strong> {ord.carrier || 'FedEx Express Ground'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
                    <strong>Tracking #:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--orange-600)' }}>{ord.trackingNumber || 'TRK-99482019482'}</span>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => showToast(`Tracking: ${ord.trackingNumber || 'Tracking info will be available when shipped'}`, 'info')}
                    style={{ gap: '0.4rem' }}
                  >
                    <ExternalLink size={14} /> Track Package Live
                  </button>
                </div>
              </div>

              {/* Purchased Product Summary */}
              <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.85rem' }}>Itemized Order Summary</h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={ord.artworkUrl || ord.productImage || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=120&q=80'} 
                      alt={ord.title}
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid var(--orange-500)' }} 
                    />
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.95rem' }}>{ord.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Category: {ord.serviceCategory} • Order ID: {formatOrderId(ord.id)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)' }}>${parseFloat(ord.price || 0).toFixed(2)}</div>
                    <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Paid</span>
                  </div>
                </div>
              </div>

              {/* Order Activity Log */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Fulfillment Activity Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(ord.history || [
                    { timestamp: ord.createdAt, label: 'Order Placed & Payment Confirmed' },
                    { timestamp: ord.createdAt, label: 'Package Processing & Quality Check' }
                  ]).map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <Clock size={14} style={{ color: 'var(--orange-600)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Simplified Digital Order View */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                
                {/* 1. Order Status & Specs */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700 }}>
                    Order Details & Specifications
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div 
                      onClick={() => setLightboxArtwork({ url: primaryArtworkSrc, name: ord.title })}
                      style={{ cursor: 'pointer', flexShrink: 0, textAlign: 'center', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', width: '180px' }}
                    >
                      <img 
                        src={primaryArtworkSrc} 
                        alt="Artwork"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
                        }}
                        style={{ width: '100%', height: '150px', objectFit: 'contain', borderRadius: '8px', background: '#ffffff' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: 'var(--orange-600)', marginTop: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <Sparkles size={14} /> Inspect Full Artwork
                      </div>
                    </div>
                    
                    <div style={{ flex: 1, background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-color)' }}>
                        <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Current Status</div><div style={{ textTransform: 'capitalize', fontWeight: 800, color: 'var(--orange-600)', fontSize: '1rem' }}>{ord.status || 'Pending'}</div></div>
                        <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Client Profile</div><div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '1rem' }}>{ord.clientName}</div></div>
                        <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Service Category</div><div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.serviceCategory}</div></div>
                        <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Project Total</div><div style={{ fontWeight: 800, color: 'var(--green-600)' }}>${parseFloat(ord.price || 0).toFixed(2)}</div></div>
                        {ord.fabricType && <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Target Garment</div><div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.fabricType}</div></div>}
                        {ord.dimensions && <div style={{ background: '#fff', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem' }}>Dimensions</div><div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.dimensions.width} x {ord.dimensions.height} inches</div></div>}
                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem' }}><div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>Digitizing Instructions</div><div style={{ color: 'var(--navy-900)', fontSize: '0.9rem', lineHeight: 1.5 }}>{ord.notes || 'No specific instructions provided.'}</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Client Artwork & Logos Section */}
                  {uniqueArtworkFiles.length > 0 && (
                    <div style={{ marginTop: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1.5px solid var(--border-color)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📎</span> Attached Source Artwork & Logos ({uniqueArtworkFiles.length})
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>High-Resolution Client Assets</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
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
                                padding: '0.85rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.65rem'
                              }}
                            >
                              <div 
                                onClick={() => setLightboxArtwork(artFile)}
                                style={{ 
                                  height: '110px', 
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
                                    <div style={{ fontSize: '1.8rem' }}>📄</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, marginTop: '2px' }}>.{fileExt} Asset</div>
                                  </div>
                                )}
                                <span style={{ 
                                  position: 'absolute', 
                                  top: '6px', 
                                  right: '6px', 
                                  background: 'rgba(15, 23, 42, 0.85)', 
                                  color: '#fff', 
                                  fontSize: '0.65rem', 
                                  fontWeight: 800, 
                                  padding: '0.15rem 0.4rem', 
                                  borderRadius: '4px' 
                                }}>
                                  .{fileExt}
                                </span>
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={artFile.name}>
                                  {artFile.name || `Artwork_File_${aIdx + 1}.${fileExt.toLowerCase()}`}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                                  {artFile.size && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{artFile.size}</span>}
                                  {artFile.placementName && (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                      {artFile.placementName}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                                <button 
                                  type="button"
                                  onClick={() => setLightboxArtwork(artFile)}
                                  className="btn btn-outline btn-sm" 
                                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem', justifyContent: 'center' }}
                                >
                                  <Sparkles size={12} /> Inspect
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => triggerFileDownload(artFile.url || artFile.public_url, artFile.name || `artwork_${aIdx + 1}.${fileExt.toLowerCase()}`, fileExt.toLowerCase())}
                                  className="btn btn-outline btn-sm" 
                                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', gap: '0.25rem' }}
                                  title="Download Original File"
                                >
                                  <Download size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Multi-Placement Breakdown List (if available) */}
                  {ord.placementItems && ord.placementItems.length > 0 && (
                    <div style={{ marginTop: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.25rem' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>📍</span> Placement Breakdown ({ord.placementItems.length} Locations)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                        {ord.placementItems.map((pl, pIdx) => (
                          <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                              <strong style={{ color: 'var(--navy-900)', fontSize: '0.85rem' }}>{pl.placement || `Location #${pIdx + 1}`}</strong>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)' }}>${parseFloat(pl.price || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                              {pl.fabric && <div><strong>Fabric:</strong> {pl.fabric}</div>}
                              {pl.width && pl.height && <div><strong>Size:</strong> {pl.width}" x {pl.height}"</div>}
                              {pl.notes && <div><strong>Note:</strong> {pl.notes}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Files & Delivery */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700 }}>
                    Files & Delivery
                  </h4>

                  {isAdmin && !isPhysicalStoreOrder && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1rem', marginBottom: '0.5rem' }}>Assign Production Staff</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <select
                          className="form-control"
                          style={{ width: '100%', fontSize: '0.9rem', fontWeight: 700 }}
                          value={ord.digitizerId || ''}
                          onChange={(e) => assignDigitizer(ord.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {(digitizers || []).map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.role})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setAdminDragOver(true); }}
                      onDragLeave={() => setAdminDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setAdminDragOver(false); processAdminFilesList(e.dataTransfer.files); }}
                      style={{ marginBottom: '1.5rem', padding: '2rem', background: adminDragOver ? 'var(--orange-50)' : '#f8fafc', borderRadius: '12px', border: `2px dashed ${adminDragOver ? 'var(--orange-500)' : 'var(--border-color)'}`, textAlign: 'center', transition: 'all 0.2s' }}
                    >
                      <UploadCloud size={32} style={{ color: 'var(--orange-500)', margin: '0 auto 1rem' }} />
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Secure Admin Dropzone</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Drag & drop finished machine files (.DST, .PES, .PDF) here, or click to browse.</div>
                      
                      <form onSubmit={handleAdminFileSubmit}>
                        <label style={{ display: 'inline-block', padding: '0.6rem 1.25rem', background: 'var(--navy-900)', color: '#fff', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}>
                          Browse Files
                          <input type="file" multiple accept="*/*" onChange={handleAdminFileChange} style={{ display: 'none' }} />
                        </label>

                        {adminFilesList.length > 0 && (
                          <div style={{ textAlign: 'left', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '0.5rem', marginBottom: '1.5rem' }}>
                            {adminFilesList.map((f, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', alignItems: 'center', borderBottom: i < adminFilesList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <FileCheck size={16} style={{ color: 'var(--green-500)' }} />
                                  <span style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.85rem' }}>{f.name}</span>
                                </div>
                                <button type="button" onClick={() => removeAdminFile(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}><Trash2 size={16}/></button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {adminFilesList.length > 0 && (
                          <button type="submit" className="btn btn-primary-orange" style={{ width: '100%', gap: '0.5rem' }}>
                            <Send size={18} /> Deliver Package to Client
                          </button>
                        )}
                      </form>
                    </div>
                  )}

                  {!isCompletedOrUnlocked ? (
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px', color: 'var(--text-muted)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <Clock size={32} style={{ margin: '0 auto 1rem', color: 'var(--orange-400)' }} />
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Files in Production</div>
                      <div style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>Your digitizing package is currently being worked on by our experts. Finished machine files will appear here once quality checked.</div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ background: '#f8fafc', padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PackageCheck size={18} style={{ color: 'var(--green-600)' }}/> Completed Assets</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>All requested formats and worksheets</div>
                        </div>
                        <button onClick={handleDownloadAll} className="btn btn-primary-orange" style={{ gap: '0.5rem' }}>
                          <Download size={16} /> Download All Files
                        </button>
                      </div>
                      
                      <div style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: '#ffffff' }}>
                      {uniqueFiles.length > 0 ? (
                          uniqueFiles.map((upFile, idx) => {
                            const ext = (upFile.format || (upFile.name && upFile.name.split('.').pop()) || 'dst').toUpperCase();
                            return (
                              <button
                                key={idx}
                                onClick={() => handleDownloadFileAsset(upFile, ext)}
                                className="btn btn-outline"
                                style={{ gap: '0.5rem', background: '#fff' }}
                              >
                                <Download size={14} /> {upFile.name || `Asset.${ext}`}
                              </button>
                            );
                          })
                      ) : (
                           allDownloadFormats.map(fmtKey => (
                             <button
                               key={fmtKey}
                               onClick={() => handleDownloadFileAsset(null, fmtKey)}
                               className="btn btn-outline"
                               style={{ gap: '0.5rem', background: '#fff' }}
                             >
                               <Download size={14} /> Download .{fmtKey.toUpperCase()}
                             </button>
                           ))
                      )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Messages & Revisions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', margin: 0, fontWeight: 700 }}>
                      Messages & Revisions
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('bdigi_open_order_chat', { detail: { orderId: ord.id } }));
                        onClose();
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', gap: '0.35rem', borderColor: 'var(--orange-500)', color: 'var(--orange-600)' }}
                    >
                      <MessageSquare size={13} /> Open in Live Chat Inbox 💬
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {(!ord.messages || ord.messages.length === 0) && (!ord.revisions || ord.revisions.length === 0) ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        No messages or revisions yet. Use the form below to communicate.
                      </div>
                    ) : (
                      <>
                        {ord.revisions?.map(rev => (
                          <div key={`rev-${rev.id}`} style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                              🔄 Revision Request • {new Date(rev.createdAt).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#78350f', whiteSpace: 'pre-wrap' }}>{rev.note}</div>
                          </div>
                        ))}
                        {ord.messages?.map(msg => {
                           const isMsgAdmin = msg.senderRole === 'admin' || msg.sender === 'admin';
                           const displayTime = msg.timestamp && !isNaN(new Date(msg.timestamp).getTime()) 
                             ? new Date(msg.timestamp).toLocaleString() 
                             : (msg.timestamp || 'Recent');
                           const displayName = isMsgAdmin ? 'Support' : (msg.senderName || msg.sender || (ord.clientName || 'Client'));
                           return (
                            <div key={`msg-${msg.id}`} style={{ 
                               background: isMsgAdmin ? 'var(--navy-900)' : '#ffffff', 
                               color: isMsgAdmin ? '#ffffff' : 'var(--navy-900)',
                               border: isMsgAdmin ? 'none' : '1px solid var(--border-color)',
                               padding: '1rem', 
                               borderRadius: '8px',
                               alignSelf: isMsgAdmin ? 'flex-end' : 'flex-start',
                               width: '85%'
                            }}>
                              <div style={{ fontSize: '0.75rem', color: isMsgAdmin ? 'var(--orange-400)' : 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>
                                {displayName} • {displayTime}
                              </div>
                              <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                            </div>
                           )
                        })}
                      </>
                    )}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {isAdmin ? (
                      <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>Send Message</label>
                        <textarea className="form-control" rows="2" placeholder="Type a message to the client..." value={chatMessageText} onChange={e => setChatMessageText(e.target.value)} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!chatMessageText.trim()}>Send Message</button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>Send Message</label>
                          <textarea className="form-control" rows="2" placeholder="Ask a question or send a note..." value={chatMessageText} onChange={e => setChatMessageText(e.target.value)} />
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary-orange btn-sm" disabled={!chatMessageText.trim()}>Send Message</button>
                          </div>
                        </form>
                        
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                          <form onSubmit={handleRevisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-900)' }}>Request Revision</label>
                            <textarea className="form-control" rows="2" placeholder="Describe the changes needed (e.g. adjust size, change colors)..." value={revisionNote} onChange={e => setRevisionNote(e.target.value)} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--navy-700)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '4px' }}>
                                📎 {revisionImage ? revisionImage.name : 'Attach Image'}
                                <input type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files && e.target.files[0]) setRevisionImage(e.target.files[0]); }} />
                              </label>
                              <button type="submit" className="btn btn-outline btn-sm" disabled={!revisionNote.trim()}>Submit Revision</button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

        {/* Sticky Action Footer (Digital Orders Only) */}
        {!isPhysicalStoreOrder && ord.status === 'delivered' && !isAdmin && (
          <div style={{
            padding: '1.25rem 1.75rem',
            background: '#ffffff',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            boxShadow: '0 -4px 10px rgba(0,0,0,0.03)'
          }}>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--green-700)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={18}/> Review & Accept</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Please review your files. If everything looks good, complete the order.</div>
            </div>
            <button onClick={() => completeOrder(ord.id)} className="btn btn-primary-orange" style={{ background: 'var(--green-600)', borderColor: 'var(--green-600)', gap: '0.5rem' }}>
              ✅ Accept & Complete Order
            </button>
          </div>
        )}

      </div>

      {(showLightbox || lightboxArtwork) && (
        <ArtworkLightboxModal 
          order={lightboxArtwork ? {
            ...ord,
            title: lightboxArtwork.name || ord.title,
            artworkUrl: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl,
            image_url: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl,
            logo: lightboxArtwork.url || lightboxArtwork.public_url || lightboxArtwork.previewUrl || ord.artworkUrl
          } : ord} 
          onClose={() => {
            setShowLightbox(false);
            setLightboxArtwork(null);
          }} 
        />
      )}

      {showWorksheetModal && (
        <ProductionWorksheetModal 
          order={ord} 
          onClose={() => setShowWorksheetModal(false)} 
        />
      )}
    </div>
  );
};
