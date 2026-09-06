'use client';

import React, { useState, useEffect } from 'react';
import { X, Scissors, UserCheck, AlertCircle, CheckCircle, Send, Sparkles, Palette, Layers, Clock, FileText } from 'lucide-react';
import { formatOrderId } from '../../context/StateContext';
import { formatPlacementTiming, parseOrderInstructions } from '../worker/WorkerOrderWorkspaceModal';

export const AssignWorkerModal = ({ order, isOpen, onClose, onAssigned, showToast }) => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [targetPkrQuote, setTargetPkrQuote] = useState(order?.quoted_price_pkr || order?.quoted_price || order?.worker_payout || '');
  const [filterTab, setFilterTab] = useState('recommended'); // 'recommended' | 'all' | 'digitizer' | 'vector'
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWorkers, setIsFetchingWorkers] = useState(true);

  // Detect whether order is Vector Art or Embroidery Digitizing
  const isVectorOrder = Boolean(
    (order?.serviceCategory && order.serviceCategory.toLowerCase().includes('vector')) ||
    (order?.type && order.type.toLowerCase().includes('vector')) ||
    (order?.service && order.service.toLowerCase().includes('vector')) ||
    (order?.title && order.title.toLowerCase().includes('vector'))
  );
  const targetSpecialty = isVectorOrder ? 'Vector Artist' : 'Embroidery Digitizer';

  const getWorkerCategory = (w) => {
    const role = (w.worker_role || w.specialty || w.primary_software || '').toLowerCase();
    if (role.includes('vector') || role.includes('illustrator') || role.includes('coreldraw') || role.includes('affinity') || role.includes('inkscape')) {
      return 'Vector Artist';
    }
    return 'Embroidery Digitizer';
  };

  useEffect(() => {
    if (!isOpen) return;
    setIsFetchingWorkers(true);
    fetch('/api/admin/workers')
      .then(res => res.json())
      .then(data => {
        if (data.workers) {
          const activeOnly = data.workers.filter(w => w.status === 'active' || !w.status);
          setWorkers(activeOnly.length > 0 ? activeOnly : data.workers);

          // Select matching worker by default
          if (order?.worker_id) {
            setSelectedWorkerId(order.worker_id);
          } else {
            const recommended = (activeOnly.length > 0 ? activeOnly : data.workers).find(w => getWorkerCategory(w) === targetSpecialty);
            if (recommended) {
              setSelectedWorkerId(recommended.id);
            } else if (data.workers.length > 0) {
              setSelectedWorkerId(data.workers[0].id);
            }
          }
        }
      })
      .catch(err => console.warn('Fetch workers error:', err))
      .finally(() => setIsFetchingWorkers(false));
  }, [isOpen, order, targetSpecialty]);

  if (!isOpen || !order) return null;

  // Filtered workers list
  const filteredWorkers = workers.filter(w => {
    const cat = getWorkerCategory(w);
    if (filterTab === 'recommended') return cat === targetSpecialty;
    if (filterTab === 'digitizer') return cat === 'Embroidery Digitizer';
    if (filterTab === 'vector') return cat === 'Vector Artist';
    return true;
  });

  const chosenWorker = workers.find(w => w.id === selectedWorkerId);
  const chosenWorkerCat = chosenWorker ? getWorkerCategory(chosenWorker) : null;
  const isSpecialtyMismatch = chosenWorkerCat && chosenWorkerCat !== targetSpecialty;

  const handleAssign = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedWorkerId) {
      if (showToast) showToast('Please select a worker to assign.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignWorker',
          payload: {
            orderId: order.id,
            workerId: selectedWorkerId,
            workerName: chosenWorker?.name || chosenWorker?.email,
            workerEmail: chosenWorker?.email,
            instructions: instructions.trim(),
            payoutAmount: parseFloat(targetPkrQuote) || 0
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign worker to order.');
      }

      if (showToast) {
        showToast(`Dispatched Order ${formatOrderId(order.id)} to ${chosenWorker?.name}! Awaiting worker's PKR quote and acceptance.`, 'success');
      }

      if (onAssigned) {
        onAssigned({
          ...order,
          worker_id: selectedWorkerId,
          worker_status: 'Pending_Worker_Acceptance',
          admin_worker_feedback: instructions.trim() || order.admin_worker_feedback
        });
      }

      onClose();
    } catch (err) {
      if (showToast) showToast(err.message || 'Assignment failed.', 'error');
    } finally {
      setIsLoading(false);
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
          maxWidth: '560px',
          color: 'var(--text-main, #0f172a)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: isVectorOrder ? '#e0f2fe' : '#fff7ed',
              color: isVectorOrder ? '#0284c7' : '#ea580c',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isVectorOrder ? <Palette size={20} /> : <Scissors size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)' }}>
                Assign {targetSpecialty}
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Order: <strong style={{ color: 'var(--orange-600, #ea580c)' }}>{formatOrderId(order.id)}</strong> — {order.title || 'Production Job'}
                <span style={{ display: 'block', marginTop: '0.2rem', color: '#64748b', fontSize: '0.74rem' }}>
                  🕒 Placed: <strong style={{ color: 'var(--navy-900, #0f172a)' }}>{formatPlacementTiming(order?.created_at || order?.date)}</strong>
                </span>
              </p>
            </div>
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

        {/* Specialization Target Banner */}
        <div style={{
          padding: '0.65rem 1.5rem',
          background: isVectorOrder ? '#f0f9ff' : '#fff7ed',
          borderBottom: `1px solid ${isVectorOrder ? '#bae6fd' : '#fed7aa'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <span style={{ color: isVectorOrder ? '#0369a1' : '#c2410c', fontWeight: 700 }}>
            {isVectorOrder ? '🎨 Vector Tracing Order (AI/CDR/EPS/SVG)' : '🧵 Embroidery Digitizing Order (DST/PES/EMB)'}
          </span>
          <span style={{
            background: isVectorOrder ? '#0284c7' : '#ea580c',
            color: '#ffffff',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            fontWeight: 800,
            fontSize: '0.7rem'
          }}>
            Requires: {targetSpecialty}
          </span>
        </div>

        {/* Customer Requirements Snippet if present */}
        {(() => {
          const parsed = parseOrderInstructions(order);
          if (!parsed.customerNotes) return null;
          return (
            <div style={{
              margin: '0.75rem 1.5rem 0 1.5rem',
              padding: '0.65rem 0.85rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.78rem'
            }}>
              <span style={{ color: '#ea580c', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                <FileText size={12} /> Client Requirements:
              </span>
              <p style={{ margin: 0, color: '#334155', lineHeight: 1.4, fontWeight: 600 }}>
                "{parsed.customerNotes}"
              </p>
            </div>
          );
        })()}

        {/* Body Form */}
        <form onSubmit={handleAssign} style={{ padding: '1.25rem 1.5rem' }}>
          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setFilterTab('recommended')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterTab === 'recommended' ? 'var(--orange-500, #ea580c)' : 'var(--border-color, #cbd5e1)',
                background: filterTab === 'recommended' ? '#fff7ed' : 'transparent',
                color: filterTab === 'recommended' ? '#ea580c' : 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Sparkles size={12} /> Recommended ({targetSpecialty}s)
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('all')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterTab === 'all' ? 'var(--navy-900, #0f172a)' : 'var(--border-color, #cbd5e1)',
                background: filterTab === 'all' ? '#f1f5f9' : 'transparent',
                color: filterTab === 'all' ? '#0f172a' : 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              All Workers ({workers.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('digitizer')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterTab === 'digitizer' ? '#ea580c' : 'var(--border-color, #cbd5e1)',
                background: filterTab === 'digitizer' ? '#fff7ed' : 'transparent',
                color: filterTab === 'digitizer' ? '#ea580c' : 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🧵 Digitizers
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('vector')}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterTab === 'vector' ? '#0284c7' : 'var(--border-color, #cbd5e1)',
                background: filterTab === 'vector' ? '#e0f2fe' : 'transparent',
                color: filterTab === 'vector' ? '#0284c7' : 'var(--text-muted, #64748b)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🎨 Vector Artists
            </button>
          </div>

          {/* Worker Selection Dropdown / List */}
          {isFetchingWorkers ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted, #64748b)' }}>
              <div style={{ margin: '0 auto 0.5rem', width: '24px', height: '24px', border: '2px solid #cbd5e1', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.85rem' }}>Loading active workers directory...</span>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.825rem',
              color: '#92400e'
            }}>
              No active workers found under "{filterTab}". Switch tabs or add workers in Worker Management.
            </div>
          ) : (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.4rem' }}>
                Select Active Worker
              </label>
              <select
                className="form-control"
                value={selectedWorkerId}
                onChange={(e) => setSelectedWorkerId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                {filteredWorkers.map(w => {
                  const cat = getWorkerCategory(w);
                  const isMatch = cat === targetSpecialty;
                  return (
                    <option key={w.id} value={w.id}>
                      {isMatch ? '✨ ' : ''}{w.name} ({cat}) — {w.primary_software || w.specialty || 'Pro'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Specialty Mismatch Caution Warning */}
          {isSpecialtyMismatch && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '0.65rem 0.85rem',
              marginBottom: '1rem',
              fontSize: '0.78rem',
              color: '#92400e',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Specialization Notice:</strong> This order requires <strong>{targetSpecialty}</strong> skills, but {chosenWorker?.name} is registered as <strong>{chosenWorkerCat}</strong>. Ensure they can handle this task format.
              </div>
            </div>
          )}

          {/* Target Quote PKR Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.35rem' }}>
              Suggested Target Quote (PKR — Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b', fontSize: '0.85rem' }}>Rs.</span>
              <input
                type="number"
                step="50"
                min="0"
                value={targetPkrQuote}
                onChange={(e) => setTargetPkrQuote(e.target.value)}
                placeholder="1500"
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.2rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
              Worker will review specifications and submit their final PKR quote to accept the order.
            </span>
          </div>

          {/* Custom Instructions */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.35rem' }}>
              Instructions / Notes for Worker (Optional)
            </label>
            <textarea
              rows={2}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please deliver Tajima DST with underlay for cotton cap. Turnaround 4 hours needed."
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '0.825rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                background: 'transparent',
                color: 'var(--text-main, #334155)',
                fontWeight: 700,
                fontSize: '0.825rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedWorkerId || workers.length === 0}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.825rem',
                cursor: isLoading || !selectedWorkerId ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)'
              }}
            >
              {isLoading ? (
                <>Dispatching...</>
              ) : (
                <>
                  <UserCheck size={15} /> Send Assignment (Awaiting Quote)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
