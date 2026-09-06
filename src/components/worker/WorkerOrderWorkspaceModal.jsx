'use client';

import React, { useState, useRef } from 'react';
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
  Scissors
} from 'lucide-react';
import { formatOrderId } from '../../context/StateContext';

const ACCEPTED_EXTENSIONS = [
  '.dst', '.pes', '.emb', '.exp', '.jef', '.zip', '.rar',
  '.ai', '.eps', '.cdr', '.svg', '.pdf'
];

export const WorkerOrderWorkspaceModal = ({ order, isOpen, onClose, onOrderUpdated, showToast }) => {
  const [selectedFile, setSelectedFile] = useState(null);
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
  const hasRevisions = workerStatus === 'Revisions Needed';
  const agreedPricePkr = parseFloat(order.quoted_price_pkr || order.quoted_price || order.worker_payout || 0);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    const ext = `.${(file.name.split('.').pop() || '').toLowerCase()}`;
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      if (showToast) {
        showToast(`Invalid format. Please upload standard machine or vector files (${ACCEPTED_EXTENSIONS.join(', ')})`, 'error');
      }
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      if (showToast) {
        showToast('File exceeds 50MB maximum size limit.', 'error');
      }
      return;
    }
    setSelectedFile(file);
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

  // 2. Worker Upload Completed Deliverables
  const handleUploadAndSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedFile && !order.worker_file_url) {
      if (showToast) showToast('Please select your completed production file to upload.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      let finalFileUrl = order.worker_file_url || null;
      let finalFileName = order.worker_file_name || null;

      // Upload file if new
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('bucket', 'worker-uploads');
        formData.append('folder', 'worker-uploads');

        setUploadProgress(50);
        const uploadRes = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload digitized file to storage.');
        }

        finalFileUrl = uploadData.url;
        finalFileName = selectedFile.name;
      }

      setUploadProgress(80);

      // Submit via /api/orders
      const ext = finalFileName ? finalFileName.split('.').pop().toLowerCase() : 'dst';
      const submitRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'workerSubmitUpload',
          payload: {
            orderId: order.id,
            fileUrl: finalFileUrl,
            fileName: finalFileName,
            format: ext,
            notes: workerNotes.trim()
          }
        })
      });

      const submitData = await submitRes.json();
      if (!submitRes.ok || !submitData.success) {
        throw new Error(submitData.error || 'Failed to submit files for review.');
      }

      setUploadProgress(100);
      if (showToast) {
        showToast('Production file submitted to Admin for inspection!', 'success');
      }

      if (onOrderUpdated) {
        onOrderUpdated({
          ...order,
          worker_status: 'Review Pending',
          worker_file_url: finalFileUrl,
          worker_file_name: finalFileName,
          worker_notes: workerNotes.trim()
        });
      }

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
        maxWidth: '880px',
        maxHeight: '92vh',
        overflowY: 'auto',
        color: '#f8fafc',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0f172a',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
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
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
              {order.serviceCategory || order.type || 'Custom Production'} • Status: <strong style={{ color: isPendingAcceptance ? '#f59e0b' : '#38bdf8' }}>{workerStatus}</strong>
              {agreedPricePkr > 0 && <span> • Agreed Quote: <strong style={{ color: '#10b981' }}>Rs. {agreedPricePkr.toLocaleString()} PKR</strong></span>}
            </p>
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

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Admin Revision Feedback Notice */}
          {hasRevisions && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid #ef4444',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              display: 'flex',
              gap: '0.85rem'
            }}>
              <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.35rem 0', color: '#fca5a5', fontWeight: 800, fontSize: '0.95rem' }}>
                  Admin Revision Instructions
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#fecaca', lineHeight: 1.5 }}>
                  {order.admin_worker_feedback || order.adminWorkerFeedback || 'Please adjust stitch density and preview quality check.'}
                </p>
              </div>
            </div>
          )}

          {/* Top Section: Artwork Preview & Specs Grid */}
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
                      {order.fabricType || 'Pique Cotton / Twill'}
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
                </div>
              </div>

              {/* Client & Admin Notes */}
              {(order.notes || order.description) && (
                <div style={{ marginTop: '1rem', background: '#1e293b', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                    CLIENT & ADMIN INSTRUCTIONS
                  </span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {order.notes || order.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              WORKFLOW SECTION: BIDDING (PKR) VS DELIVERABLES UPLOAD
             ================================================================ */}
          {isPendingAcceptance ? (
            /* 1. PKR BIDDING & JOB ACCEPTANCE CARD */
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

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={isBidding || !quotedPriceInput}
                    style={{
                      padding: '0.7rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      cursor: isBidding ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
                    }}
                  >
                    {isBidding ? 'Accepting Job...' : `✓ Accept Job & Lock Price (Rs. ${parseFloat(quotedPriceInput || 0).toLocaleString()} PKR)`}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      padding: '0.7rem 1.25rem',
                      borderRadius: '8px',
                      border: '1px solid #475569',
                      background: 'transparent',
                      color: '#cbd5e1',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 2. FILE UPLOAD DROPZONE FOR IN_PROGRESS & REVISIONS */
            <div style={{
              background: '#0f172a',
              border: '1.5px dashed #475569',
              borderRadius: '12px',
              padding: '1.5rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={20} style={{ color: '#38bdf8' }} /> Upload Finalized Deliverables
                </h4>

                {agreedPricePkr > 0 && (
                  <span style={{
                    background: '#14532d',
                    color: '#86efac',
                    border: '1px solid #22c55e',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    💰 Locked Quote: Rs. {agreedPricePkr.toLocaleString()} PKR
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
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  marginBottom: '1.25rem'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dst,.pes,.emb,.exp,.jef,.zip,.rar,.ai,.eps,.cdr,.svg,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                />

                <UploadCloud size={36} style={{ color: isDragging ? '#f97316' : '#64748b', margin: '0 auto 0.75rem' }} />
                
                {selectedFile ? (
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FileCheck size={18} /> {selectedFile.name}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for transmission
                    </p>
                  </div>
                ) : order.worker_file_url ? (
                  <div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>
                      Current File: {order.worker_file_name || 'production_deliverable_file'}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                      Click or drag to replace with updated file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, color: '#e2e8f0', fontSize: '0.9rem' }}>
                      Drag & Drop your production files here, or <span style={{ color: '#f97316' }}>Browse Files</span>
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Supported: DST, PES, EMB, AI, EPS, CDR, SVG, or ZIP (Max 50MB)
                    </span>
                  </div>
                )}
              </div>

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
                  disabled={isUploading || (!selectedFile && !order.worker_file_url)}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    border: 'none',
                    cursor: isUploading || (!selectedFile && !order.worker_file_url) ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: isUploading || (!selectedFile && !order.worker_file_url) ? 0.6 : 1,
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
