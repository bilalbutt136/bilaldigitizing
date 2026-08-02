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
  FileText, 
  Scissors,
  User,
  Sparkles,
  ShieldCheck,
  Lock,
  ImageIcon,
  ZoomIn,
  FileCheck,
  UploadCloud,
  Check,
  Trash2,
  FileCode,
  Printer,
  Truck,
  MapPin,
  Package,
  PackageCheck,
  CreditCard,
  ExternalLink,
  Copy,
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
    cancelOrder,
    orders,
    authUser,
    currentView,
    showToast
  } = useAppState();

  const [revisionNote, setRevisionNote] = useState('');
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
  const stages = [
    { key: 'submitted', label: '🔴 New / Pending' },
    { key: 'digitizing', label: '⚡ In Progress' },
    { key: 'revision', label: '🔄 In Revision' },
    { key: 'delivered', label: '📦 Delivered' },
    { key: 'completed', label: '✅ Completed' }
  ];

  const stageKeys = ['submitted', 'digitizing', 'revision', 'delivered', 'completed'];
  const currentStageIndex = ord.status === 'cancelled' ? -1 : stageKeys.indexOf(ord.status === 'assigned' ? 'digitizing' : ord.status === 'qc' ? 'delivered' : ord.status || 'submitted');
  const isCompletedOrUnlocked = ord.status === 'completed' || (ord.uploadedMachineFiles && ord.uploadedMachineFiles.length > 0);

  const handleRevisionSubmit = (e) => {
    e.preventDefault();
    if (!revisionNote.trim()) return;
    addRevisionRequest(ord.id, revisionNote);
    setRevisionNote('');
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
            <>
              <button
                onClick={() => setActiveTab('timeline')}
                style={{
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: `3px solid ${activeTab === 'timeline' ? 'var(--orange-600)' : 'transparent'}`,
                  color: activeTab === 'timeline' ? 'var(--orange-600)' : 'var(--navy-700)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                📊 Live Progress & Specs
              </button>

              <button
                onClick={() => setActiveTab('downloads')}
                style={{
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: `3px solid ${activeTab === 'downloads' ? 'var(--orange-600)' : 'transparent'}`,
                  color: activeTab === 'downloads' ? 'var(--orange-600)' : 'var(--navy-700)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                📂 Files & Source Assets ({allDownloadFormats.length})
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                style={{
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: `3px solid ${activeTab === 'messages' ? 'var(--orange-600)' : 'transparent'}`,
                  color: activeTab === 'messages' ? 'var(--orange-600)' : 'var(--navy-700)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                💬 Communication Log ({ord.messages?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('revisions')}
                style={{
                  padding: '0.85rem 1.25rem',
                  border: 'none',
                  background: 'transparent',
                  borderBottom: `3px solid ${activeTab === 'revisions' ? 'var(--orange-600)' : 'transparent'}`,
                  color: activeTab === 'revisions' ? 'var(--orange-600)' : 'var(--navy-700)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Request Revisions ({ord.revisions?.length || 0})
              </button>
            </>
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
                    onClick={() => alert(`Carrier status for ${ord.trackingNumber || 'TRK-99482019482'}: In Transit to Destination`)}
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
              {/* TAB 1: Live Timeline for Digitizing & Vector Orders */}
              {activeTab === 'timeline' && (
            <div>
              {/* Visual 5-step progress bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '0.5rem',
                marginBottom: '2rem',
                position: 'relative'
              }}>
                {stages.map((stg, idx) => {
                  const isDone = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;
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
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isDone ? 'var(--green-500)' : 'var(--navy-100)',
                        color: isDone ? '#ffffff' : 'var(--text-muted)',
                        margin: '0 auto 0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--navy-900)' : 'var(--text-muted)'
                      }}>
                        {stg.label}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Precise Fiverr Order Timestamps Grid */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                fontSize: '0.825rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} style={{ color: 'var(--orange-600)' }} /> Placement Timestamp
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                    {formatPlacementTimeFull(ord.createdAt)}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Zap size={13} style={{ color: 'var(--orange-600)' }} /> Expected Turnaround SLA
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                    {ord.isRush ? '⚡ 4-Hour Express' : `${ord.turnaroundHours || 12}-Hour Standard SLA`}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RotateCcw size={13} style={{ color: 'var(--orange-600)' }} /> Total Elapsed Time
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                    {getElapsedTimeFormatted(ord.createdAt, ord.updatedAt)}
                  </div>
                </div>

                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={13} style={{ color: 'var(--orange-600)' }} /> Last Activity Sync
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--orange-600)' }}>
                    {formatPlacementTimeFull(ord.updatedAt || ord.createdAt)}
                  </div>
                </div>
              </div>



              {/* Brief Specs & Product Artwork Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                
                {/* Left side artwork & product preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Store Product Image (if merchandise order) */}
                  {(ord.productImage || ord.details?.productImage) && (
                    <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '0.75rem', border: '1.5px solid var(--orange-400)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--orange-700)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        📦 STORE PRODUCT ITEM
                      </div>
                      <img 
                        src={ord.productImage || ord.details?.productImage} 
                        alt="Store Product Item"
                        style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                      />
                    </div>
                  )}

                  {/* Customer Artwork Preview */}
                  <div 
                    style={{ background: 'var(--navy-100)', borderRadius: 'var(--radius-md)', padding: '0.75rem', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => setShowLightbox(true)}
                    title="Click to inspect full resolution artwork"
                  >
                    <img 
                      src={ord.artworkUrl || ord.image_url || ord.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'} 
                      alt="Brief Artwork"
                      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--orange-500)' }}
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--orange-700)', fontWeight: 700, marginTop: '0.5rem' }}>
                      🔍 Click to Inspect Full Resolution Artwork
                    </div>
                  </div>
                </div>

                {/* Right side parameters & Store Specs */}
                <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div><strong>Client Shop:</strong> {ord.clientName}</div>
                  <div><strong>Service Category:</strong> {ord.serviceCategory}</div>
                  
                  {ord.details?.itemTitle ? (
                    <>
                      <div><strong>Ordered Product:</strong> <span style={{ color: 'var(--orange-600)', fontWeight: 700 }}>{ord.details.itemTitle}</span></div>
                      <div><strong>Quantity & Size:</strong> {ord.details.quantity || 1} pcs ({ord.details.size || 'Standard'})</div>
                      <div><strong>Color / Option:</strong> {ord.details.color || 'Default'}</div>
                      <div><strong>Unit Price:</strong> {ord.details.unitPrice || 'N/A'}</div>
                    </>
                  ) : (
                    <>
                      <div><strong>Garment Target:</strong> {ord.fabricType}</div>
                      <div><strong>Dimensions:</strong> {ord.dimensions?.width} x {ord.dimensions?.height} inches</div>
                      <div><strong>Estimated Stitches:</strong> {ord.estimatedStitches ? ord.estimatedStitches.toLocaleString() : 'N/A'}</div>
                    </>
                  )}
                  
                  <div><strong>Price Total:</strong> ${parseFloat(ord.price).toFixed(2)}</div>
                  {ord.notes && (
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.825rem' }}>
                      <strong>Digitizing Instructions / Order Notes:</strong> {ord.notes}
                    </div>
                  )}
                </div>

              </div>

              {/* Order History Timeline Log */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Activity & Quality Check Log</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {ord.history?.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <Clock size={14} style={{ color: 'var(--orange-600)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(h.timestamp).toLocaleTimeString()}</span>
                      <span style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Download Hub (Real-time Status Synchronization & Dynamic Unlocking Grid) */}
          {activeTab === 'downloads' && (
            <div>

              {/* ADMIN ONLY MULTI-FILE UPLOADER DROPZONE - STRICTLY HIDDEN IN CLIENT PORTAL */}
              {isAdmin && (
                <div style={{
                  background: 'var(--navy-950)',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: 'var(--orange-500)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.5rem'
                  }}>
                    <UploadCloud size={20} /> Admin Operations Multi-File Upload Dropzone
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                    Select multiple finished digitizing files (.DST, .PES, .EMB, .PDF) at once to unlock client downloads and release the order.
                  </p>

                  <form onSubmit={handleAdminFileSubmit}>
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setAdminDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setAdminDragOver(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setAdminDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          processAdminFilesList(e.dataTransfer.files);
                        }
                      }}
                      style={{
                        border: `2px dashed ${adminDragOver ? 'var(--orange-500)' : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        background: adminDragOver ? 'rgba(249, 115, 22, 0.1)' : 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        position: 'relative',
                        marginBottom: '1rem'
                      }}
                    >
                      <input 
                        type="file"
                        multiple
                        accept="*/*"
                        onChange={handleAdminFileChange}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                      <UploadCloud size={32} style={{ color: 'var(--orange-500)', marginBottom: '0.4rem' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#ffffff' }}>
                        Drag & Drop multiple finished files or click to select all formats (.DST, .PES, .EMB, .PDF)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Supports multi-file selection for Tajima .DST, Brother .PES, Wilcom .EMB, Melco .EXP, Janome .JEF & Production PDFs
                      </div>
                    </div>

                    {/* Admin Multi-File Selection Grid with Item Removal */}
                    {adminFilesList.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--orange-500)', marginBottom: '0.5rem' }}>
                          Staged Machine Package Assets ({adminFilesList.length}):
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.65rem' }}>
                          {adminFilesList.map((file, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAdminFile(idx)}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Remove file"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit"
                      className="btn btn-primary-orange btn-md"
                      style={{ width: '100%' }}
                    >
                      <FileCheck size={18} /> Upload {adminFilesList.length} Finished Package Asset(s) & Release Downloads
                    </button>
                  </form>
                </div>
              )}
              
              {/* SECTION 1: Original Client Uploaded Source Artwork */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid var(--orange-600)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={ord.artworkUrl} 
                      alt="Source Artwork" 
                      style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--orange-700)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Original Client Uploaded Source Asset
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy-900)' }}>
                        {ord.artworkFileName || `${ord.title.replace(/\s+/g, '_')}_source_artwork.png`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Dimensions: {ord.dimensions?.width}x{ord.dimensions?.height}" • Ready for digitizing inspection
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary-orange"
                    onClick={handleDownloadSourceArtwork}
                  >
                    <Download size={16} /> Download Original Image Asset
                  </button>
                </div>
              </div>

              {/* FIVERR-STYLE DELIVERED ORDER CLIENT ACTION BANNER */}
              {(ord.status === 'delivered' || ord.uploadedMachineFiles?.length > 0 || ord.status === 'completed') && (
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  border: '1.5px solid var(--orange-500)',
                  borderRadius: '14px',
                  padding: '1.5rem',
                  marginBottom: '1.75rem',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <PackageCheck size={16} /> Production Machine Package Delivered
                      </div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {ord.status === 'completed' ? '✅ Order Completed & Accepted' : '📦 Your Machine Package is Ready for Review'}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.35rem', marginBottom: 0, maxWidth: '580px', lineHeight: 1.5 }}>
                        {ord.status === 'completed' 
                          ? 'This order has been accepted and completed. Downloadable production files remain accessible anytime in your client hub.'
                          : 'Master digitizer files (.DST, .PES, .EMB, .PDF) are unlocked below. Test stitch your sample or inspect the worksheet, then accept or request modifications.'
                        }
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {ord.status !== 'completed' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary-orange"
                            onClick={() => {
                              updateOrderStatus(ord.id, 'completed', { isPaid: true, paymentStatus: 'Paid' });
                              showToast(`Order ${formatOrderId(ord.id)} completed & accepted! Thank you for choosing Bilal Digitizing.`, 'success');
                            }}
                            style={{
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              padding: '0.55rem 1.15rem',
                              gap: '0.4rem',
                              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
                            }}
                          >
                            <CheckCircle2 size={16} /> Complete Order
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setActiveTab('revisions')}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              padding: '0.55rem 1.15rem',
                              gap: '0.4rem'
                            }}
                          >
                            <RotateCcw size={16} /> Request Modification / Revision
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: Comprehensive Machine Formats & Production Worksheet (.DST, .PES, .EMB, .JEF, .EXP, .HUS, .VP3, .PDF) */}
              <div>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--green-600)' }} /> Finished Machine Files & Production Worksheets
                </h4>

                {!isCompletedOrUnlocked ? (
                  <div style={{
                    background: 'var(--navy-100)',
                    border: '1px dashed var(--border-color)',
                    padding: '1.75rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    color: 'var(--navy-800)'
                  }}>
                    <Lock size={36} style={{ color: 'var(--orange-500)', marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.35rem' }}>
                      Digitizing Machine Packages (.DST, .PES, .EMB) In Production
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto 1.25rem' }}>
                      Our specialist digitizer is hand-pathing your artwork for commercial machine density. Finished machine files and color stop PDFs will unlock automatically once Quality Control testing passes.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {allDownloadFormats.map(fmt => (
                        <span key={fmt} className="badge" style={{ background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          🔒 .{fmt.toUpperCase()} (In Production)
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-600)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--green-800)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={18} /> Verified Production Package Released — Pass 100% pathing simulation for Tajima, Brother, Melco, Janome, Viking & Pfaff.
                    </div>

                    {/* Single Clean Grid of Published Files or Standard Formats */}
                    {ord.uploadedMachineFiles && ord.uploadedMachineFiles.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        {ord.uploadedMachineFiles.map((upFile, idx) => {
                          const ext = (upFile.format || upFile.name.split('.').pop() || 'dst').toUpperCase();
                          const isPdf = ext === 'PDF';
                          const isEmb = ext === 'EMB';

                          return (
                            <div 
                              key={idx} 
                              className="card"
                              style={{ 
                                padding: '1.25rem 1rem', 
                                textAlign: 'center', 
                                background: isPdf ? 'var(--orange-50)' : isEmb ? '#faf5ff' : '#f0fdf4',
                                border: `1.5px solid ${isPdf ? 'var(--orange-600)' : isEmb ? '#c084fc' : 'var(--green-600)'}`
                              }}
                            >
                              <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>
                                {isPdf ? '📄' : isEmb ? '💎' : '🧵'}
                              </div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={upFile.name}>
                                {upFile.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--green-700)', fontWeight: 700, marginBottom: '0.85rem' }}>
                                .{ext} Machine Package
                              </div>

                              <button 
                                type="button"
                                className="btn btn-sm btn-primary-orange"
                                style={{
                                  width: '100%',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  background: '#ff7a00',
                                  backgroundColor: '#ff7a00',
                                  color: '#ffffff',
                                  border: 'none',
                                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleDownloadFileAsset(upFile, ext)}
                              >
                                {isPdf ? <Printer size={14} /> : <Download size={14} />} {isPdf ? 'Print / Export .PDF' : `Download .${ext}`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fallback format cards if no custom file upload array exists */
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                        {allDownloadFormats.map((fmtKey) => {
                          const fmtMeta = FORMAT_METADATA[fmtKey.toLowerCase()] || { icon: '🧵' };
                          const isPdf = fmtKey.toLowerCase() === 'pdf';
                          const isEmb = fmtKey.toLowerCase() === 'emb';

                          return (
                            <div 
                              key={fmtKey}
                              className="card"
                              style={{ 
                                padding: '1.25rem 1rem', 
                                textAlign: 'center', 
                                background: isPdf ? 'var(--orange-50)' : isEmb ? '#faf5ff' : '#ffffff',
                                border: `1.5px solid ${isPdf ? 'var(--orange-600)' : isEmb ? '#c084fc' : 'var(--border-color)'}`
                              }}
                            >
                              <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{fmtMeta.icon}</div>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--navy-900)', marginBottom: '0.85rem' }}>
                                .{fmtKey.toUpperCase()}
                              </div>

                              <button 
                                type="button"
                                className="btn btn-sm btn-primary-orange"
                                style={{
                                  width: '100%',
                                  fontSize: '0.85rem',
                                  fontWeight: 800,
                                  background: '#ff7a00',
                                  backgroundColor: '#ff7a00',
                                  color: '#ffffff',
                                  border: 'none',
                                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer'
                                }}
                                onClick={() => handleDownloadFileAsset(null, fmtKey)}
                              >
                                {isPdf ? <Printer size={14} /> : <Download size={14} />} {isPdf ? 'Print / Export .PDF' : `Download .${fmtKey.toUpperCase()}`}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB: Fiverr Real-Time Activity & Communication Log */}
          {activeTab === 'messages' && (
            <div>
              <div style={{
                background: 'var(--navy-950)',
                color: '#ffffff',
                padding: '1.25rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: '#ffffff', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Send size={18} style={{ color: 'var(--orange-500)' }} /> Order Communication & Activity Log
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Track messages, revision notes, technical artwork specifications, and machine file attachments.
                  </div>
                </div>

                <span className="badge badge-assigned" style={{ fontSize: '0.75rem' }}>
                  {ord.messages?.length || 0} Messages
                </span>
              </div>

              {/* Message Feed Stream */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                maxHeight: '340px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {(!ord.messages || ord.messages.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    💬 No messages posted yet. Use the form below to send notes or attach files for Order {formatOrderId(ord.id)}.
                  </div>
                ) : (
                  ord.messages.map((msg) => {
                    const isMsgAdmin = msg.senderRole === 'admin';
                    return (
                      <div 
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMsgAdmin ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          maxWidth: '82%',
                          background: isMsgAdmin ? 'var(--navy-900)' : '#ffffff',
                          color: isMsgAdmin ? '#ffffff' : 'var(--navy-900)',
                          border: isMsgAdmin ? 'none' : '1.5px solid var(--border-color)',
                          padding: '0.85rem 1.1rem',
                          borderRadius: isMsgAdmin ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          boxShadow: 'var(--shadow-sm)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isMsgAdmin ? 'var(--orange-400)' : 'var(--navy-900)' }}>
                              {msg.sender}
                            </div>
                            <span style={{ fontSize: '0.68rem', color: isMsgAdmin ? '#94a3b8' : 'var(--text-muted)' }}>
                              {formatPlacementTimeFull(msg.timestamp)}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.875rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                            {msg.text}
                          </div>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: '0.65rem', borderTop: `1px solid ${isMsgAdmin ? 'rgba(255,255,255,0.15)' : 'var(--border-color)'}`, paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              {msg.attachments.map((att, aIdx) => (
                                <div key={aIdx} style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>📎</span>
                                  <span style={{ fontWeight: 700 }}>{att.name || att}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Message Form */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                    Post Message to Activity Log
                  </label>
                  <textarea 
                    rows={3}
                    className="form-control"
                    placeholder="Type technical notes, machine setup instructions, or response to client..."
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Posting as <strong>{isAdmin ? (authUser?.name || 'Master Admin') : (ord.clientName || 'Client')}</strong>
                  </span>
                  <button type="submit" className="btn btn-primary-orange btn-sm" style={{ fontWeight: 800 }}>
                    <Send size={14} /> Send Message
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Revisions Panel */}
          {activeTab === 'revisions' && (
            <div>
              {isAdmin ? (
                <div style={{ marginBottom: '1.25rem', background: 'var(--navy-100)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--navy-900)', fontWeight: 700, marginBottom: '0.2rem' }}>
                    📋 Client Revision Request History
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                    Review instructions, requested size adjustments, and thread modifications submitted by the client shop.
                  </p>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                    Request Free Revision Adjustment
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Need a size change, density adjustment, or color thread re-assignment? Describe your change below and our master digitizer will update it within 4 hours.
                  </p>

                  <form onSubmit={handleRevisionSubmit}>
                    <div className="form-group">
                      <textarea 
                        className="form-control"
                        rows="3"
                        placeholder="e.g. Please reduce the total width to 3.0 inches and increase underlay density for fleece fabric..."
                        value={revisionNote}
                        onChange={(e) => setRevisionNote(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary-orange btn-sm">
                      <Send size={14} /> Submit Revision Brief
                    </button>
                  </form>
                </div>
              )}

              {/* Previous Revisions Thread (Visible to both Admin and Client) */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                <h5 style={{ fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
                  Revision Request Log ({ord.revisions?.length || 0})
                </h5>
                {!ord.revisions || ord.revisions.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No revisions requested for this design yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {ord.revisions.map((rev) => (
                      <div 
                        key={rev.id}
                        style={{
                          background: 'var(--navy-100)',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.875rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Requested by {rev.requestedBy}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rev.createdAt).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--navy-800)' }}>"{rev.note}"</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
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
