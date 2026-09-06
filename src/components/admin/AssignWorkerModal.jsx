'use client';

import React, { useState, useEffect } from 'react';
import { X, Scissors, UserCheck, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { formatOrderId } from '../../context/StateContext';

export const AssignWorkerModal = ({ order, isOpen, onClose, onAssigned, showToast }) => {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [payoutAmount, setPayoutAmount] = useState(order?.worker_payout || order?.workerPayout || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWorkers, setIsFetchingWorkers] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsFetchingWorkers(true);
    fetch('/api/admin/workers')
      .then(res => res.json())
      .then(data => {
        if (data.workers) {
          setWorkers(data.workers);
          if (order?.worker_id) {
            setSelectedWorkerId(order.worker_id);
          } else if (data.workers.length > 0) {
            setSelectedWorkerId(data.workers[0].id);
          }
        }
      })
      .catch(err => console.warn('Fetch workers error:', err))
      .finally(() => setIsFetchingWorkers(false));
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleAssign = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedWorkerId) {
      if (showToast) showToast('Please select a digitizer worker to assign.', 'error');
      return;
    }

    setIsLoading(true);
    const chosenWorker = workers.find(w => w.id === selectedWorkerId);

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
            payoutAmount: parseFloat(payoutAmount) || 0
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign worker to order.');
      }

      if (showToast) {
        showToast(`Assigned Order ${formatOrderId(order.id)} to ${chosenWorker?.name || 'digitizer'}!`, 'success');
      }

      if (onAssigned) {
        onAssigned({
          ...order,
          worker_id: selectedWorkerId,
          worker_status: 'In Progress',
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        color: 'var(--text-main, #0f172a)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
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
              background: '#fff7ed',
              color: '#ea580c',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scissors size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)' }}>
                Assign Digitizer Worker
              </h3>
              <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                Order: <strong style={{ color: 'var(--orange-600, #ea580c)' }}>{formatOrderId(order.id)}</strong> — {order.title}
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

        {/* Body Form */}
        <form onSubmit={handleAssign} style={{ padding: '1.5rem' }}>
          {isFetchingWorkers ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted, #64748b)' }}>
              <div style={{ margin: '0 auto 0.5rem', width: '24px', height: '24px', border: '2px solid #cbd5e1', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span style={{ fontSize: '0.85rem' }}>Loading active digitizers...</span>
            </div>
          ) : workers.length === 0 ? (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#92400e'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>No digitizers found in directory.</strong>
                  <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.78rem' }}>
                    You can register digitizer workers via the Supabase <code>workers</code> table or assign an existing staff account.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.4rem' }}>
                Select Digitizer
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
                {workers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.email}) {w.specialty ? `— ${w.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Worker Payout Compensation */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.4rem' }}>
              Worker Payout / Job Price ($ USD)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b' }}>$</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="10.00"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 1.8rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
              Credited to worker's ledger upon admin QA approval and delivery.
            </span>
          </div>

          {/* Custom Instructions Textarea */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900, #0f172a)', marginBottom: '0.4rem' }}>
              Instructions / Notes for Worker (Optional)
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Use light underlay for pique polo, keep under 12,000 stitches. Standard DST and PES formats required."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
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
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedWorkerId || workers.length === 0}
              style={{
                padding: '0.6rem 1.25rem',
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
                <>Assigning Task...</>
              ) : (
                <>
                  <UserCheck size={15} /> Confirm Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
