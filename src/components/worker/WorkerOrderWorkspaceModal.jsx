'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  Download, 
  ZoomIn, 
  Layers, 
  Maximize2, 
  Info, 
  Sparkles, 
  RefreshCw, 
  Clock,
  DollarSign,
  Palette,
  Scissors,
  FileText,
  User,
  ShieldCheck,
  Loader2,
  FileCode
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../services/supabaseService';

const ACCEPTED_EXTENSIONS = [
  '.dst', '.pes', '.emb', '.exp', '.jef', '.zip', '.rar',
  '.ai', '.eps', '.cdr', '.svg', '.pdf'
];

/**
 * Robust helper to safely extract all instructions and notes from an order
 */
export function parseOrderInstructions(order) {
  if (!order) return { adminFeedback: '', customerNotes: '', placementNotes: [], patchSpecs: null, hasAny: false };
  
  // Safely unescape text that may have literal \\n from JSON transport
  const safeText = (raw) => {
    if (!raw) return '';
    if (typeof raw !== 'string') return '';
    return raw
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '')
      .trim();
  };

  let adminFeedback = safeText(order.admin_worker_feedback || order.adminWorkerFeedback || '');
  let customerNotes = '';
  let placementNotes = [];
  let patchSpecs = null;

  // 1. Parse order.notes (which is often a JSON string, or already an object)
  if (order.notes) {
    let parsed = null;

    if (typeof order.notes === 'string') {
      // Skip if it looks like [object Object] garbage
      if (order.notes.trim() === '[object Object]') {
        parsed = null;
      } else {
        try {
          parsed = JSON.parse(order.notes);
        } catch {
          // Plain string notes
          customerNotes = safeText(order.notes);
        }
      }
    } else if (typeof order.notes === 'object' && order.notes !== null) {
      parsed = order.notes;
    }

    if (parsed && typeof parsed === 'object') {
      if (parsed.notes && typeof parsed.notes === 'string') {
        customerNotes = safeText(parsed.notes);
      }
      if (parsed.specialInstructions && typeof parsed.specialInstructions === 'string') {
        customerNotes = customerNotes ? `${customerNotes}\n${safeText(parsed.specialInstructions)}` : safeText(parsed.specialInstructions);
      }
      if (parsed.instructions && typeof parsed.instructions === 'string') {
        customerNotes = customerNotes ? `${customerNotes}\n${safeText(parsed.instructions)}` : safeText(parsed.instructions);
      }
      if (Array.isArray(parsed.placementItems) && parsed.placementItems.length > 0) {
        placementNotes = parsed.placementItems;
      }
      if (parsed.patchStyle || parsed.patchBacking || parsed.patchBorderStyle) {
        patchSpecs = {
          style: parsed.patchStyle,
          backing: parsed.patchBacking,
          border: parsed.patchBorderStyle,
          width: parsed.patchWidth,
          height: parsed.patchHeight,
          quantity: parsed.patchQuantity
        };
      }
    }
  }

  // 2. Direct order fallback fields
  if (!customerNotes) {
    customerNotes = safeText(order.special_instructions || order.instructions || order.customer_notes || order.description || '');
  }

  const hasAny = Boolean(adminFeedback || customerNotes || placementNotes.length > 0 || patchSpecs);

  return {
    adminFeedback,
    customerNotes,
    placementNotes,
    patchSpecs,
    hasAny
  };
}

export function formatPlacementTiming(dt) {
  if (!dt) return 'Recently';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return String(dt);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  } catch {
    return String(dt);
  }
}

export function getRelativeTimeString(dt) {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return '';
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return '';
  } catch {
    return '';
  }
}

export const WorkerOrderWorkspaceModal = ({ order, isOpen, onClose, onOrderUpdated, showToast, initialTab = 'specs' }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'specs');

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  const [selectedFiles, setSelectedFiles] = useState([]); // multi-file array
  const [workerNotes, setWorkerNotes] = useState(order?.worker_notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const fileInputRef = useRef(null);

  // PKR Bidding State for Pending_Worker_Acceptance
  const [quotedPriceInput, setQuotedPriceInput] = useState(
    order?.quoted_price_pkr || order?.quoted_price || order?.worker_payout || ''
  );
  const [bidNotes, setBidNotes] = useState('');
  const [isBidding, setIsBidding] = useState(false);



  if (!isOpen || !order) return null;

  const artworkSrc = order.artworkUrl || order.image_url || order.logo || order.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
  const dimensions = order.dimensions || { width: '3.5', height: '3.0', unit: 'inches' };
  const requestedFormats = Array.isArray(order.requestedFormats) ? order.requestedFormats : (order.requested_formats || ['dst', 'pes']);
  const workerStatus = order.workerStatus || order.worker_status || 'Unassigned';
  const isPendingAcceptance = workerStatus === 'Pending_Worker_Acceptance';
  const hasRevisions = workerStatus === 'Revisions Needed' || workerStatus === 'Revisions_Needed';
  const agreedPricePkr = parseFloat(order.quoted_price_pkr || order.quoted_price || order.worker_payout || 0);

  const parsedInstructions = parseOrderInstructions(order);
  const placementTimeStr = formatPlacementTiming(order.created_at || order.date);
  const placementRelative = getRelativeTimeString(order.created_at || order.date);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) validateAndAddFiles(files);
  };

  const validateAndAddFiles = (files) => {
    const valid = [];
    for (const file of files) {
      const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        if (showToast) showToast(`Skipped "${file.name}" — unsupported format. Use ${ACCEPTED_EXTENSIONS.join(', ')}`, 'warning');
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        if (showToast) showToast(`Skipped "${file.name}" — exceeds 50MB limit.`, 'warning');
        continue;
      }
      valid.push(file);
    }
    if (valid.length > 0) {
      setSelectedFiles(prev => {
        // Avoid duplicates by name
        const existingNames = new Set(prev.map(f => f.name));
        const unique = valid.filter(f => !existingNames.has(f.name));
        return [...prev, ...unique];
      });
    }
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 1. Worker Bid & Accept Job in PKR
  const handleBidAndAccept = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const priceVal = parseFloat(quotedPriceInput);
    if (!priceVal || priceVal <= 0) {
      if (showToast) showToast('Please enter your required quote in PKR (greater than 0).', 'error');
      return;
    }

    setIsBidding(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'workerBidAndAccept',
          payload: {
            orderId: order.id,
            quotedPrice: priceVal,
            notes: bidNotes.trim()
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to accept job.');
      }

      if (showToast) {
        showToast(`Job accepted! Quote of Rs. ${priceVal.toLocaleString()} PKR locked. Order is now In Progress.`, 'success');
      }

      if (onOrderUpdated) {
        onOrderUpdated({
          ...order,
          worker_status: 'In_Progress',
          status: 'in_progress',
          quoted_price_pkr: priceVal,
          quoted_price: priceVal,
          worker_payout: priceVal
        });
      }

      onClose();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not accept job.', 'error');
    } finally {
      setIsBidding(false);
    }
  };

  // 2. Worker Upload Completed Deliverables (multi-file)
  const handleUploadAndSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (selectedFiles.length === 0 && !order.worker_file_url) {
      if (showToast) showToast('Please select your completed production file(s) to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const uploadedFiles = [];

      // Upload each new file to Cloudinary
      if (selectedFiles.length > 0) {
        const progressPerFile = 70 / selectedFiles.length;
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('bucket', 'worker-uploads');
          formData.append('folder', 'worker-uploads');

          const uploadRes = await fetch('/api/cloudinary/upload', {
            method: 'POST',
            body: formData
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || !uploadData.url) {
            throw new Error(uploadData.error || `Failed to upload "${file.name}".`);
          }

          uploadedFiles.push({ url: uploadData.url, name: file.name });
          setUploadProgress(10 + Math.round((i + 1) * progressPerFile));
        }
      } else if (order.worker_file_url) {
        // Re-submit existing file (no new upload)
        uploadedFiles.push({ url: order.worker_file_url, name: order.worker_file_name || 'production_file' });
      }

      setUploadProgress(85);

      // Submit deliverables to API
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'workerSubmitUpload',
          payload: {
            orderId: order.id,
            workerFileUrl: uploadedFiles[0]?.url,
            workerFileName: uploadedFiles[0]?.name,
            workerFiles: uploadedFiles,
            notes: workerNotes.trim()
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit production files.');
      }

      setUploadProgress(100);
      if (showToast) {
        showToast(`${uploadedFiles.length} production file(s) submitted! Admin has been notified for QC inspection.`, 'success');
      }

      if (onOrderUpdated) {
        onOrderUpdated({
          ...order,
          worker_status: 'Review Pending',
          worker_file_url: uploadedFiles[0]?.url,
          worker_file_name: uploadedFiles[0]?.name,
          worker_files: uploadedFiles,
          worker_notes: workerNotes.trim()
        });
      }

      setSelectedFiles([]);
      onClose();
    } catch (err) {
      if (showToast) showToast(err.message || 'File submission failed.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };



  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div style={{
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '92vh',
        overflowY: 'auto',
        color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.15rem 1.5rem',
          borderBottom: '1px solid #334155',
          background: '#0f172a',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{
                  background: '#f97316',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  {formatOrderId(order.id)}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {order.title || 'Production Task'}
                </h3>
              </div>

              {/* Timing and Status Line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                <span>📂 {order.serviceCategory || order.type || 'Custom Production'}</span>
                <span>•</span>
                <span>Status: <strong style={{ color: isPendingAcceptance ? '#f59e0b' : '#38bdf8' }}>{workerStatus}</strong></span>
                {agreedPricePkr > 0 && <span>• Agreed Quote: <strong style={{ color: '#10b981' }}>Rs. {agreedPricePkr.toLocaleString()} PKR</strong></span>}
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f97316', fontWeight: 700 }}>
                  <Clock size={12} /> Placed: <span style={{ color: '#ffffff' }}>{placementTimeStr}</span> {placementRelative && <span style={{ color: '#94a3b8' }}>({placementRelative})</span>}
                </span>
                {order.worker_assigned_at && (
                  <>
                    <span>•</span>
                    <span>Assigned: <strong style={{ color: '#cbd5e1' }}>{formatPlacementTiming(order.worker_assigned_at)}</strong></span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Workspace Header Subtitle */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #1e293b', paddingTop: '0.65rem' }}>
            <span
              style={{
                background: 'rgba(249, 115, 22, 0.12)',
                color: '#f97316',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={13} /> Production Specs & Digitizing Files
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 1. Admin Assignment / Revision Instructions Notice */}
            {parsedInstructions.adminFeedback && (
              <div style={{
                background: hasRevisions ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                border: hasRevisions ? '1.5px solid #ef4444' : '1.5px solid #3b82f6',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                display: 'flex',
                gap: '0.85rem'
              }}>
                {hasRevisions ? (
                  <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <Info size={22} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                )}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <h4 style={{ margin: 0, color: hasRevisions ? '#fca5a5' : '#93c5fd', fontWeight: 800, fontSize: '0.95rem' }}>
                      {hasRevisions ? 'Admin Revision Instructions' : 'Admin Assignment Instructions / Notes'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', background: hasRevisions ? '#991b1b' : '#1e3a8a', color: '#ffffff', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 800 }}>
                      {hasRevisions ? 'Action Required' : 'Production Guide'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: hasRevisions ? '#fecaca' : '#e0f2fe', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {parsedInstructions.adminFeedback}
                  </p>
                </div>
              </div>
            )}

            {/* 2. Top Section: Artwork Preview & Specs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
              {/* Artwork Card */}
              <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <div 
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#1e293b',
                    cursor: 'pointer',
                    border: '1px solid #334155',
                    marginBottom: '0.85rem'
                  }}
                  onClick={() => setLightboxOpen(true)}
                  title="Click to zoom artwork"
                >
                  <img
                    src={artworkSrc}
                    alt={order.title || 'Artwork Preview'}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    padding: '0.35rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    color: '#ffffff'
                  }}>
                    <ZoomIn size={14} />
                  </div>
                </div>

                <a
                  href={artworkSrc}
                  target="_blank"
                  rel="noreferrer"
                  download
                  style={{
                    color: '#38bdf8',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Download size={14} /> Download Original Image
                </a>
              </div>

              {/* Production Specifications */}
              <div style={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 800, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={16} style={{ color: '#f97316' }} /> Production Specifications
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                    <div style={{ background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>TARGET DIMENSIONS</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                        {typeof dimensions === 'object' ? `${dimensions.width || '3.5'} × ${dimensions.height || '3.0'} ${dimensions.unit || 'in'}` : String(dimensions)}
                      </span>
                    </div>

                    <div style={{ background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>FABRIC / SUBSTRATE</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                        {order.fabricType || order.fabric_type || 'Pique Cotton / Twill'}
                      </span>
                    </div>

                    <div style={{ background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>PLACEMENT POSITION</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                        {order.placement_type || order.placement || 'Left Chest / Cap'}
                      </span>
                    </div>

                    <div style={{ background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>FORMATS REQUESTED</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f97316' }}>
                        {requestedFormats.join(', ').toUpperCase()}
                      </span>
                    </div>

                    {/* Placement Timing Tile */}
                    <div style={{ gridColumn: 'span 2', background: '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #334155' }}>
                      <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>ORDER PLACED TIMING</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: '#f97316' }} /> {placementTimeStr} {placementRelative && <span style={{ color: '#94a3b8', fontWeight: 600 }}>({placementRelative})</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Customer Requirements & Instructions Card */}
            <div style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <FileText size={16} /> Customer Requirements & Instructions
                </h4>
                {order.isRush && (
                  <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    ⚡ RUSH ORDER
                  </span>
                )}
              </div>

              {parsedInstructions.customerNotes ? (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Client Special Notes:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#ffffff', lineHeight: 1.5, whiteSpace: 'pre-line', fontWeight: 600 }}>
                    {parsedInstructions.customerNotes}
                  </p>
                </div>
              ) : (
                <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '8px', padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                  No custom text instructions were attached by the client. Follow target dimensions, placement, and fabric specifications above.
                </div>
              )}

              {/* Placement Specifics if any */}
              {parsedInstructions.placementNotes.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Placement Breakdown:
                  </span>
                  {parsedInstructions.placementNotes.map((item, idx) => (
                    <div key={item.id || idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
                      <strong style={{ color: '#38bdf8' }}>{item.placementType || `Placement #${idx + 1}`}:</strong> {item.dimensions ? `Size: ${item.dimensions}` : ''} {item.fabric ? `• Fabric: ${item.fabric}` : ''} {Array.isArray(item.formats) ? `• Formats: ${item.formats.join(', ')}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Workflow Section: Bidding (PKR) VS Deliverables Upload */}
            {isPendingAcceptance ? (
              /* PKR BIDDING & JOB ACCEPTANCE CARD */
              <div style={{
                background: '#0f172a',
                border: '2px solid #f59e0b',
                borderRadius: '14px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f59e0b', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                      Job Assignment Invitation — Submit Quote in PKR
                    </h4>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      Inspect the artwork and production specifications above. Input your cost/quote (PKR) to lock the price and accept this job.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBidAndAccept} style={{ marginTop: '1.25rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
                      Your Quote for this Order (PKR) *
                    </label>
                    <div style={{ position: 'relative', maxWidth: '320px' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#f97316' }}>
                        Rs.
                      </span>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        required
                        value={quotedPriceInput}
                        onChange={(e) => setQuotedPriceInput(e.target.value)}
                        placeholder="e.g. 1500"
                        style={{
                          width: '100%',
                          padding: '0.7rem 0.85rem 0.7rem 2.6rem',
                          borderRadius: '8px',
                          border: '1.5px solid #475569',
                          background: '#1e293b',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block', marginTop: '0.35rem' }}>
                      Primary internal billing is in Pakistani Rupee (PKR). This amount will be credited to your ledger upon completion.
                    </span>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                      Turnaround / Production Note for Admin (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={bidNotes}
                      onChange={(e) => setBidNotes(e.target.value)}
                      placeholder="e.g. Can deliver in 4 hours with Tajima DST stitch file and density proof."
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid #334155',
                        background: '#1e293b',
                        color: '#ffffff',
                        fontSize: '0.85rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{
                        padding: '0.65rem 1.25rem',
                        borderRadius: '8px',
                        background: '#334155',
                        color: '#e2e8f0',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Decline / Review Later
                    </button>

                    <button
                      type="submit"
                      disabled={isBidding || !quotedPriceInput}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        border: 'none',
                        cursor: isBidding || !quotedPriceInput ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isBidding || !quotedPriceInput ? 0.6 : 1,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
                      }}
                    >
                      {isBidding ? (
                        <>Accepting Job...</>
                      ) : (
                        <>
                          <CheckCircle size={16} /> Accept Job & Lock Price (Rs. {parseFloat(quotedPriceInput || 0).toLocaleString()} PKR)
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* PRODUCTION DELIVERABLES UPLOAD WORKSPACE */
              <div style={{
                background: '#0f172a',
                border: hasRevisions ? '2px solid #ef4444' : '1px solid #334155',
                borderRadius: '14px',
                padding: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                      Deliverable Upload Workspace
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Agreed Compensation: <strong style={{ color: '#10b981' }}>Rs. {agreedPricePkr.toLocaleString()} PKR</strong> (Locked)
                    </span>
                  </div>

                  {order.worker_file_url && (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      padding: '0.25rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      ✓ Deliverables on Record
                    </span>
                  )}
                </div>

                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.825rem', color: '#94a3b8' }}>
                  Upload your completed production files (DST, PES, EMB, AI, EPS, or ZIP) for Admin quality inspection.
                </p>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? '#f97316' : '#334155'}`,
                    background: isDragging ? 'rgba(249, 115, 22, 0.08)' : '#1e293b',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: selectedFiles.length > 0 ? '0.75rem' : '1.25rem'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".dst,.pes,.emb,.exp,.jef,.zip,.rar,.ai,.eps,.cdr,.svg,.pdf"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) validateAndAddFiles(files);
                      e.target.value = '';
                    }}
                  />

                  <UploadCloud size={36} style={{ color: isDragging ? '#f97316' : '#64748b', margin: '0 auto 0.75rem' }} />
                  
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>
                      Drag & Drop files here, or <span style={{ color: '#f97316' }}>Browse Files</span>
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      DST, PES, EMB, AI, EPS, CDR, SVG, ZIP — Max 50MB each • Multiple files supported
                    </span>
                  </div>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.25rem' }}>
                      FILES QUEUED FOR UPLOAD ({selectedFiles.length})
                    </span>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.45rem 0.75rem' }}>
                        <span style={{ fontSize: '0.825rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
                          <FileCheck size={14} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                          <span style={{ color: '#64748b', fontSize: '0.72rem', flexShrink: 0 }}>({(file.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSelectedFile(idx); }}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.1rem', lineHeight: 1, flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {order.worker_file_url && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Previously submitted file will be replaced by new uploads.
                      </span>
                    )}
                  </div>
                )}

                {/* If no new files selected but has previous submission */}
                {selectedFiles.length === 0 && order.worker_file_url && (
                  <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCheck size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>
                      Current: {order.worker_file_name || 'production_deliverable_file'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>Add new files above to replace</span>
                  </div>
                )}

                {/* Worker Remarks Textarea */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.35rem' }}>
                    WORKER REMARKS / STITCH COUNT DETAILS (OPTIONAL)
                  </label>
                  <textarea
                    rows={2}
                    value={workerNotes}
                    onChange={(e) => setWorkerNotes(e.target.value)}
                    placeholder="e.g., 9,800 stitches, trimmed underlay for pique polo, colors mapped to Madeira poly."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #334155',
                      background: '#1e293b',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                      <span>Uploading to Secure Storage...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#f97316', transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '8px',
                      background: '#334155',
                      color: '#e2e8f0',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={handleUploadAndSubmit}
                    disabled={isUploading || (selectedFiles.length === 0 && !order.worker_file_url)}
                    style={{
                      padding: '0.65rem 1.5rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: isUploading || (selectedFiles.length === 0 && !order.worker_file_url) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: isUploading || (selectedFiles.length === 0 && !order.worker_file_url) ? 0.6 : 1,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {isUploading ? (
                      <>Transmitting Files...</>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Submit for Admin Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
};
