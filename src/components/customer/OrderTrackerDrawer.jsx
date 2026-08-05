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
  Zap
} from 'lucide-react';

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
    ORDER_STATUSES
  } = useAppState();

  const [revisionNote, setRevisionNote] = useState('');
  const [revisionImage, setRevisionImage] = useState(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [activeTab, setActiveTab] = useState('timeline'); // timeline | downloads | messages | revisions
  const [showLightbox, setShowLightbox] = useState(false);
  const [showWorksheetModal, setShowWorksheetModal] = useState(false);

  // Admin Multiple File Upload Array State
  const [adminFilesList, setAdminFilesList] = useState([]);
  const [adminDragOver, setAdminDragOver] = useState(false);

  if (!selectedOrderForDrawer) return null;

  // Always resolve live reactive order state from global orders array
  const ord = orders.find(o => o.id === selectedOrderForDrawer.id) || selectedOrderForDrawer;
  
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

  // Admin Multiple Files Processing & Handler
  const processAdminFilesList = (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdminFilesList(prev => [
          ...prev,
          { name: file.name, format: ext, url: e.target.result, uploadedAt: new Date().toISOString() }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAdminFileChange = (e) => {
    processAdminFilesList(e.target.files);
  };

  const removeAdminFile = (indexToRemove) => {
    setAdminFilesList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAdminFileSubmit = (e) => {
    e.preventDefault();
    if (adminFilesList.length === 0) {
      alert('Please select or drop at least one finished machine file (.DST, .PES, .EMB, .PDF) to upload.');
      return;
    }

    const existingFiles = ord.uploadedMachineFiles || [];
    const updatedFiles = [...adminFilesList, ...existingFiles];

    updateOrderStatus(ord.id, 'delivered', {
      outputFileUrl: adminFilesList[0].name,
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

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '92vh' }}>
        
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
        <div style={{ padding: '1.75rem', overflowY: 'auto' }}>
          
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
                    Order Details
                  </h4>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div 
                      onClick={() => setShowLightbox(true)}
                      style={{ cursor: 'pointer', flexShrink: 0, textAlign: 'center' }}
                    >
                      <img 
                        src={ord.artworkUrl || ord.image_url || ord.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'} 
                        alt="Artwork"
                        style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                      />
                      <div style={{ fontSize: '0.75rem', color: 'var(--orange-600)', marginTop: '0.5rem', fontWeight: 600 }}>🔍 View Artwork</div>
                    </div>
                    
                    <div style={{ fontSize: '0.9rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', flex: 1 }}>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Status</strong><br/><span style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--navy-900)' }}>{ord.status || 'Pending'}</span></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Client</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.clientName}</span></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Category</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.serviceCategory}</span></div>
                      <div><strong style={{ color: 'var(--text-muted)' }}>Price</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>${parseFloat(ord.price || 0).toFixed(2)}</span></div>
                      {ord.fabricType && <div><strong style={{ color: 'var(--text-muted)' }}>Garment</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.fabricType}</span></div>}
                      {ord.dimensions && <div><strong style={{ color: 'var(--text-muted)' }}>Dimensions</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.dimensions.width} x {ord.dimensions.height} inches</span></div>}
                      {ord.estimatedStitches && <div><strong style={{ color: 'var(--text-muted)' }}>Est. Stitches</strong><br/><span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.estimatedStitches.toLocaleString()}</span></div>}
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--text-muted)' }}>Instructions / Notes</strong><br/><span style={{ color: 'var(--navy-900)' }}>{ord.notes || 'None'}</span></div>
                    </div>
                  </div>
                </div>

                {/* 2. Files & Delivery */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700 }}>
                    Files & Delivery
                  </h4>

                  {isAdmin && (
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'var(--navy-50)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '0.75rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UploadCloud size={18} /> Admin File Upload
                      </div>
                      <form onSubmit={handleAdminFileSubmit}>
                        <input type="file" multiple accept="*/*" onChange={handleAdminFileChange} style={{ marginBottom: '1rem', fontSize: '0.85rem' }} />
                        {adminFilesList.length > 0 && (
                          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', background: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            {adminFilesList.map((f, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{f.name}</span>
                                <button type="button" onClick={() => removeAdminFile(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}><Trash2 size={14}/></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button type="submit" className="btn btn-primary-orange btn-sm" disabled={adminFilesList.length === 0}>
                          Upload & Deliver to Client
                        </button>
                      </form>
                    </div>
                  )}

                  {!isCompletedOrUnlocked ? (
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', color: 'var(--text-muted)', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      <Clock size={24} style={{ margin: '0 auto 0.5rem', color: 'var(--orange-400)' }} />
                      <div style={{ fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>Files in Production</div>
                      <div style={{ fontSize: '0.85rem' }}>Finished machine files will appear here once digitizing is complete.</div>
                    </div>
                  ) : (
                    <div>
                      {ord.uploadedMachineFiles && ord.uploadedMachineFiles.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {ord.uploadedMachineFiles.map((upFile, idx) => {
                            const ext = (upFile.format || upFile.name.split('.').pop() || 'dst').toUpperCase();
                            return (
                              <button
                                key={idx}
                                onClick={() => handleDownloadFileAsset(upFile, ext)}
                                className="btn btn-outline"
                                style={{ gap: '0.5rem', background: '#fff' }}
                              >
                                <Download size={16} /> {upFile.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                           {allDownloadFormats.map(fmtKey => (
                             <button
                               key={fmtKey}
                               onClick={() => handleDownloadFileAsset(null, fmtKey)}
                               className="btn btn-outline"
                               style={{ gap: '0.5rem', background: '#fff' }}
                             >
                               <Download size={16} /> Download .{fmtKey.toUpperCase()}
                             </button>
                           ))}
                        </div>
                      )}

                      {ord.status === 'delivered' && !isAdmin && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', padding: '1.25rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#166534', marginBottom: '0.25rem' }}>Review & Accept</div>
                            <div style={{ fontSize: '0.85rem', color: '#15803d' }}>Please review your files and mark the order as complete.</div>
                          </div>
                          <button onClick={() => completeOrder(ord.id)} className="btn" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                            ✅ Accept & Complete Order
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Messages & Revisions */}
                <div>
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', fontWeight: 700 }}>
                    Messages & Revisions
                  </h4>
                  
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
                           const isMsgAdmin = msg.senderRole === 'admin';
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
                                {msg.sender} • {new Date(msg.timestamp).toLocaleString()}
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

      </div>

      {showLightbox && (
        <ArtworkLightboxModal 
          order={ord} 
          onClose={() => setShowLightbox(false)} 
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
