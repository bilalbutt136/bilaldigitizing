'use client';

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  CheckCircle, 
  RotateCcw, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  Clock,
  User,
  Scissors
} from 'lucide-react';
import { formatOrderId } from '../../context/StateContext';
import { formatPlacementTiming } from '../worker/WorkerOrderWorkspaceModal';

export const ReviewWorkerUploadModal = ({ order, isOpen, onClose, onReviewed, showToast }) => {
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  if (!isOpen || !order) return null;

  // Resolve all uploaded files (multi-file JSONB array or single URL fallback)
  let workerFilesList = [];
  if (Array.isArray(order.worker_files) && order.worker_files.length > 0) {
    workerFilesList = order.worker_files;
  } else if (typeof order.worker_files === 'string') {
    try {
      const parsed = JSON.parse(order.worker_files);
      if (Array.isArray(parsed)) workerFilesList = parsed;
    } catch {}
  }
  
  if (workerFilesList.length === 0 && (order.worker_file_url || order.workerFileUrl)) {
    const singleUrl = order.worker_file_url || order.workerFileUrl;
    const singleName = order.worker_file_name || order.workerFileName || (typeof singleUrl === 'string' ? singleUrl.split('/').pop() : 'digitized_file.dst');
    workerFilesList = [{ url: singleUrl, name: singleName }];
  }

  const workerRemarks = order.worker_notes || order.workerNotes || 'No notes provided by digitizer.';

  const handleReviewAction = async (decision) => {
    if (decision === 'revision' && !feedbackNotes.trim()) {
      if (showToast) showToast('Please write feedback notes explaining what needs modification.', 'error');
      setShowRevisionInput(true);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adminReviewWorker',
          payload: {
            orderId: order.id,
            decision,
            feedbackNotes: feedbackNotes.trim()
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to process ${decision} review.`);
      }

      if (decision === 'approve') {
        if (showToast) showToast(`Order ${formatOrderId(order.id)} Approved & Delivered to Client!`, 'success');
        if (onReviewed) {
          onReviewed({
            ...order,
            worker_status: 'Completed',
            status: 'delivered'
          });
        }
      } else {
        if (showToast) showToast(`Sent Order ${formatOrderId(order.id)} back to worker for revision.`, 'info');
        if (onReviewed) {
          onReviewed({
            ...order,
            worker_status: 'Revisions Needed',
            admin_worker_feedback: feedbackNotes.trim()
          });
        }
      }

      onClose();
    } catch (err) {
      if (showToast) showToast(err.message || 'Review action failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: 'var(--text-main, #0f172a)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color, #e2e8f0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface, #f8fafc)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                background: '#3b82f6',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}>
                QA REVIEW DESK
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)' }}>
                Review Worker Upload: {formatOrderId(order.id)}
              </h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
              {order.title} • Client: {order.clientName || order.clientEmail}
              <span style={{ display: 'block', marginTop: '0.2rem', color: '#64748b', fontSize: '0.74rem' }}>
                🕒 Placed: <strong style={{ color: 'var(--navy-900, #0f172a)' }}>{formatPlacementTiming(order.created_at || order.date)}</strong>
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Worker Uploaded Files Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted, #64748b)' }}>
              DIGITIZER DELIVERABLE FILES ({workerFilesList.length})
            </span>

            {workerFilesList.length === 0 ? (
              <div style={{ padding: '1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                ⚠️ No deliverable files attached to this order.
              </div>
            ) : (
              workerFilesList.map((fileObj, idx) => {
                const fUrl = fileObj.url || fileObj;
                const fName = fileObj.name || (typeof fUrl === 'string' ? fUrl.split('/').pop() : `deliverable_${idx + 1}.dst`);
                const fExt = (fName.split('.').pop() || 'dst').toUpperCase();

                return (
                  <div key={idx} style={{
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        border: '1px solid #bfdbfe'
                      }}>
                        .{fExt}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900, #0f172a)', wordBreak: 'break-all' }}>
                          {fName}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={11} />
                          <span>File {idx + 1} of {workerFilesList.length}</span>
                          {order.worker_submitted_at && <span>• {new Date(order.worker_submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                      </div>
                    </div>

                    {fUrl && (
                      <a
                        href={fUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={fName}
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#ffffff',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                        }}
                      >
                        <Download size={14} /> Download {fExt}
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Worker Remarks Box */}
          <div style={{
            background: 'var(--bg-surface, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            padding: '1rem'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '0.35rem' }}>
              DIGITIZER REMARKS & PRODUCTION NOTES
            </span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main, #334155)', lineHeight: 1.5, fontStyle: workerRemarks.includes('No notes') ? 'italic' : 'normal' }}>
              {workerRemarks}
            </p>
          </div>

          {/* Revision Feedback Input (toggled or shown) */}
          {showRevisionInput && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '1rem',
              animation: 'fadeIn 0.2s ease'
            }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: '#991b1b', marginBottom: '0.35rem' }}>
                Revision Feedback for Worker (Explain Required Changes)
              </label>
              <textarea
                rows={3}
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                placeholder="e.g., Pull compensation needs to be increased by 0.3mm for cap embroidery. Adjust density on background fill."
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #fca5a5',
                  fontSize: '0.85rem',
                  color: '#7f1d1d',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            paddingTop: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'transparent',
                color: 'var(--text-main, #334155)',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              Close
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {/* Send Back for Revision */}
              <button
                type="button"
                onClick={() => {
                  if (!showRevisionInput) {
                    setShowRevisionInput(true);
                  } else {
                    handleReviewAction('revision');
                  }
                }}
                disabled={isProcessing}
                style={{
                  padding: '0.65rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #ef4444',
                  background: showRevisionInput ? '#ef4444' : 'rgba(239, 68, 68, 0.08)',
                  color: showRevisionInput ? '#ffffff' : '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <RotateCcw size={15} /> {showRevisionInput ? 'Confirm Send for Revision' : 'Send Back for Revision'}
              </button>

              {/* Approve & Deliver */}
              <button
                type="button"
                onClick={() => handleReviewAction('approve')}
                disabled={isProcessing}
                style={{
                  padding: '0.65rem 1.35rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                {isProcessing ? (
                  <>Processing Decision...</>
                ) : (
                  <>
                    <CheckCircle size={15} /> Approve & Deliver to Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
