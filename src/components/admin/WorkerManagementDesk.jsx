'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  KeyRound, 
  ShieldAlert, 
  Download, 
  Search, 
  RefreshCw, 
  UserPlus, 
  ArrowLeft, 
  Receipt, 
  Wallet 
} from 'lucide-react';
import { generateWorkerPayoutInvoicePdf } from '../../utils/workerInvoicePdfGenerator';

export const WorkerManagementDesk = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState('applications'); // 'applications' | 'workers' | 'earnings'
  const [workers, setWorkers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Payouts & PKR Billing states
  const [payoutsOverview, setPayoutsOverview] = useState({ workers: [], recentPayouts: [] });
  const [selectedWorkerForLedger, setSelectedWorkerForLedger] = useState(null);
  const [workerStatementData, setWorkerStatementData] = useState(null);
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [selectedOrdersForPayment, setSelectedOrdersForPayment] = useState([]);
  const [payoutMethod, setPayoutMethod] = useState('Bank Transfer (Meezan Bank)');
  const [payoutReference, setPayoutReference] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [invoiceDownloadingId, setInvoiceDownloadingId] = useState(null);

  // Processing state per worker
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection modal
  const [rejectingWorker, setRejectingWorker] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Manual Add Modal
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerEmail, setNewWorkerEmail] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSoftware, setNewWorkerSoftware] = useState('Wilcom EmbroideryStudio');

  const fetchWorkersData = async () => {
    try {
      const res = await fetch('/api/admin/workers');
      const data = await res.json();
      if (res.ok) {
        setWorkers(data.activeWorkers || data.workers || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.warn('Fetch admin workers notice:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchPayoutsOverview = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      const data = await res.json();
      if (res.ok) {
        setPayoutsOverview({
          workers: data.workers || [],
          recentPayouts: data.recentPayouts || []
        });
      }
    } catch (err) {
      console.warn('Fetch payouts overview notice:', err);
    }
  };

  useEffect(() => {
    fetchWorkersData();
    fetchPayoutsOverview();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchWorkersData();
    fetchPayoutsOverview();
    if (selectedWorkerForLedger) {
      handleOpenWorkerLedger(selectedWorkerForLedger);
    }
  };

  const handleOpenWorkerLedger = async (worker) => {
    setSelectedWorkerForLedger(worker);
    setIsStatementLoading(true);
    setSelectedOrdersForPayment([]);
    try {
      const res = await fetch(`/api/admin/payouts?workerId=${worker.id}`);
      const data = await res.json();
      if (res.ok) {
        setWorkerStatementData(data);
        // Default select all unpaid completed orders
        if (data.unpaidOrders && data.unpaidOrders.length > 0) {
          setSelectedOrdersForPayment(data.unpaidOrders.map(o => o.id));
        }
      }
    } catch (err) {
      console.warn('Fetch worker statement error:', err);
      if (showToast) showToast('Failed to load worker statement.', 'error');
    } finally {
      setIsStatementLoading(false);
    }
  };

  const handleToggleOrderSelection = (orderId) => {
    setSelectedOrdersForPayment(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAllOrders = (unpaidOrders = []) => {
    if (selectedOrdersForPayment.length === unpaidOrders.length) {
      setSelectedOrdersForPayment([]);
    } else {
      setSelectedOrdersForPayment(unpaidOrders.map(o => o.id));
    }
  };

  const handleExecutePayout = async () => {
    if (!selectedWorkerForLedger || selectedOrdersForPayment.length === 0) {
      if (showToast) showToast('Please select at least one unpaid order to settle.', 'warning');
      return;
    }

    const unpaidList = workerStatementData?.unpaidOrders || [];
    const selectedOrderObjects = unpaidList.filter(o => selectedOrdersForPayment.includes(o.id));
    const totalAmountPkr = selectedOrderObjects.reduce((sum, o) => sum + (o.costPkr || 0), 0);

    setIsProcessingPayout(true);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markAsPaid',
          payload: {
            workerId: selectedWorkerForLedger.id,
            workerName: selectedWorkerForLedger.name,
            workerEmail: selectedWorkerForLedger.email,
            orderIds: selectedOrdersForPayment,
            paymentMethod: payoutMethod,
            referenceNote: payoutReference,
            totalAmount: totalAmountPkr
          }
        })
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to mark as paid');
      }

      if (showToast) {
        showToast(`Settled Rs. ${totalAmountPkr.toLocaleString()} PKR for ${selectedOrdersForPayment.length} orders!`, 'success');
      }

      // Automatically generate & trigger instant PDF invoice download
      try {
        const { downloadPdf } = await generateWorkerPayoutInvoicePdf({
          payout: result.payout,
          worker: selectedWorkerForLedger,
          orders: selectedOrderObjects
        });
        downloadPdf();
      } catch (pdfErr) {
        console.warn('PDF auto-download notice:', pdfErr);
      }

      // Reset reference and reload
      setPayoutReference('');
      await handleOpenWorkerLedger(selectedWorkerForLedger);
      fetchPayoutsOverview();
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Payment recording failed.', 'error');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleDownloadInvoice = async (payout, worker) => {
    setInvoiceDownloadingId(payout.id || payout.payout_number);
    try {
      const workerId = payout.worker_id || worker?.id;
      let orderItems = [];

      try {
        const res = await fetch(`/api/admin/payouts?workerId=${workerId}`);
        const data = await res.json();
        if (data.paidOrders) {
          orderItems = data.paidOrders.filter(o => (payout.order_ids || []).includes(o.id));
        }
      } catch {}

      if (orderItems.length === 0) {
        orderItems = (payout.order_ids || []).map((id) => ({
          id,
          title: `Order #${id.slice(0, 8)}`,
          costPkr: (payout.total_amount || 0) / (payout.order_count || 1)
        }));
      }

      const { downloadPdf } = await generateWorkerPayoutInvoicePdf({
        payout,
        worker: worker || { name: payout.worker_name, email: payout.worker_email },
        orders: orderItems
      });

      downloadPdf();
      if (showToast) showToast(`Downloaded invoice ${payout.payout_number}`, 'success');
    } catch (err) {
      console.warn('Invoice download notice:', err);
      if (showToast) showToast('Could not generate PDF receipt.', 'error');
    } finally {
      setInvoiceDownloadingId(null);
    }
  };

  // 1. Approve Worker Application
  const handleApproveWorker = async (worker) => {
    setActionLoadingId(`approve-${worker.id}`);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approveWorker',
          payload: { workerId: worker.id, email: worker.email }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Approval failed');

      if (showToast) showToast(`Approved ${worker.name}! Account is now Active.`, 'success');
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to approve application.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Reject Worker Application
  const handleRejectWorker = async () => {
    if (!rejectingWorker) return;
    setActionLoadingId(`reject-${rejectingWorker.id}`);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rejectWorker',
          payload: { 
            workerId: rejectingWorker.id, 
            email: rejectingWorker.email,
            reason: rejectionReason.trim() 
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Rejection failed');

      if (showToast) showToast(`Application for ${rejectingWorker.name} marked as rejected.`, 'info');
      setRejectingWorker(null);
      setRejectionReason('');
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to reject application.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Suspend / Reactivate Worker
  const handleToggleSuspend = async (worker) => {
    const isSuspended = worker.status === 'suspended';
    const nextAction = isSuspended ? 'reactivateWorker' : 'suspendWorker';
    setActionLoadingId(`toggle-${worker.id}`);

    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextAction,
          payload: { workerId: worker.id }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Status update failed');

      if (showToast) {
        showToast(
          isSuspended ? `Reactivated ${worker.name}'s workstation.` : `Suspended ${worker.name}'s account.`,
          isSuspended ? 'success' : 'warning'
        );
      }
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to update status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Send Password Reset Email
  const handleSendPasswordReset = async (worker) => {
    setActionLoadingId(`reset-${worker.id}`);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendPasswordReset',
          payload: { email: worker.email }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Reset failed');

      if (showToast) showToast(`Dispatched secure reset link to ${worker.email}!`, 'success');
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not send reset email.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Manual Add Worker
  const handleCreateWorker = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newWorkerName.trim() || !newWorkerEmail.trim()) {
      if (showToast) showToast('Worker name and email are required.', 'error');
      return;
    }

    setActionLoadingId('manual-create');
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createWorker',
          payload: {
            name: newWorkerName.trim(),
            email: newWorkerEmail.trim(),
            phone: newWorkerPhone.trim(),
            specialty: newWorkerSoftware
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create worker.');

      if (showToast) showToast(`Worker ${newWorkerName} created successfully!`, 'success');
      setIsAddWorkerOpen(false);
      setNewWorkerName('');
      setNewWorkerEmail('');
      setNewWorkerPhone('');
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not create worker.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI Calculations
  const pendingCount = applications.filter(a => (a.status || '').toLowerCase() === 'pending').length;
  const activeCount = workers.filter(w => (w.status || '').toLowerCase() === 'active').length;
  const totalCompletedOrders = workers.reduce((acc, w) => acc + (w.completed_orders_count || 0), 0);

  // Filtered workers
  const filteredWorkers = workers.filter(w => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (w.name || '').toLowerCase().includes(q) || 
           (w.email || '').toLowerCase().includes(q) || 
           (w.specialty || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '0.5rem 0' }}>
      {/* Top Banner & KPI Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Digitizers</span>
            <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)' }}>
            {activeCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved studio staff</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: pendingCount > 0 ? '1.5px solid #f97316' : '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Applications</span>
            <span style={{ background: '#fff7ed', color: '#ea580c', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: pendingCount > 0 ? '#ea580c' : 'var(--text-main)' }}>
            {pendingCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting portfolio review</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders Digitized</span>
            <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)' }}>
            {totalCompletedOrders}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed stitch designs</span>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: totalUnpaidPkrAll > 0 ? '1.5px solid #d97706' : '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unpaid Ledger (PKR)</span>
            <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: totalUnpaidPkrAll > 0 ? '#d97706' : '#059669' }}>
            Rs. {totalUnpaidPkrAll.toLocaleString()} PKR
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Paid to date: Rs. {(totalPaidPkrAll > 0 ? totalPaidPkrAll : 0).toLocaleString()} PKR
          </span>
        </div>
      </div>

      {/* Action Header & Tabs */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '0.75rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Sub-Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('applications')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: activeSubTab === 'applications' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
              background: activeSubTab === 'applications' ? 'var(--color-primary-light)' : 'transparent',
              color: activeSubTab === 'applications' ? 'var(--color-primary)' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={14} /> Worker Applications
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: '#ffffff', fontSize: '0.7rem', fontWeight: 900, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('workers')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: activeSubTab === 'workers' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
              background: activeSubTab === 'workers' ? 'var(--color-primary-light)' : 'transparent',
              color: activeSubTab === 'workers' ? 'var(--color-primary)' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Scissors size={14} /> Manage Digitizers ({workers.length})
          </button>

          <button
            onClick={() => {
              setActiveSubTab('earnings');
              setSelectedWorkerForLedger(null);
            }}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: activeSubTab === 'earnings' ? '1.5px solid var(--color-primary)' : '1px solid var(--border-color)',
              background: activeSubTab === 'earnings' ? 'var(--color-primary-light)' : 'transparent',
              color: activeSubTab === 'earnings' ? 'var(--color-primary)' : 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.825rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Wallet size={14} /> Worker Billing & PKR Ledger
            {totalUnpaidPkrAll > 0 && (
              <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '0.68rem', fontWeight: 900, padding: '0.1rem 0.45rem', borderRadius: '9999px' }}>
                Rs. {totalUnpaidPkrAll.toLocaleString()}
              </span>
            )}
          </button>
        </div>

        {/* Right side search & actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-outline btn-sm"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
            title="Refresh digitizer data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-icon' : ''} /> {isRefreshing ? 'Syncing...' : 'Sync'}
          </button>

          <button
            onClick={() => setIsAddWorkerOpen(true)}
            className="btn btn-primary-orange btn-sm"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserPlus size={14} /> Add Digitizer
          </button>
        </div>
      </div>

      {/* TAB 1: WORKER APPLICATIONS */}
      {activeSubTab === 'applications' && (
        <div>
          {isLoading ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <RefreshCw size={24} className="spin-icon" style={{ color: '#ea580c', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading worker applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={42} style={{ color: '#22c55e', margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.35rem 0' }}>
                All Worker Applications Reviewed!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto' }}>
                There are currently no pending digitizer requests in the queue. New applications from <code>/worker/register</code> will arrive here automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {applications.map((app) => {
                const isPending = (app.status || '').toLowerCase() === 'pending';
                return (
                <div
                  key={app.id || app.email}
                  style={{
                    background: 'var(--bg-card)',
                    border: isPending ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                          {app.name}
                        </h3>
                        <span style={{
                          background: isPending ? '#fff7ed' : '#fef2f2',
                          color: isPending ? '#ea580c' : '#dc2626',
                          border: `1px solid ${isPending ? '#fed7aa' : '#fecaca'}`,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}>
                          {isPending ? 'Pending Review' : 'Rejected'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.825rem', flexWrap: 'wrap' }}>
                        <span>✉️ {app.email}</span>
                        {app.phone && <span>📞 {app.phone}</span>}
                        <span>📅 Applied: {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isPending && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setRejectingWorker(app)}
                          disabled={actionLoadingId === `approve-${app.id}`}
                          style={{
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            padding: '0.45rem 0.85rem',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <XCircle size={14} /> Reject
                        </button>

                        <button
                          onClick={() => handleApproveWorker(app)}
                          disabled={actionLoadingId === `approve-${app.id}`}
                          style={{
                            background: '#22c55e',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 1rem',
                            fontWeight: 800,
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {actionLoadingId === `approve-${app.id}` ? 'Activating...' : 'Approve Digitizer'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Skills & Experience Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    flexWrap: 'wrap',
                    background: 'var(--bg-surface, #f8fafc)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Qualifications:</span>
                    <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                      ⚡ {app.experience_years || 1} Years Experience
                    </span>
                    <span style={{ background: '#fdf4ff', color: '#a855f7', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                      🖥️ {app.primary_software || 'Wilcom EmbroideryStudio'}
                    </span>

                    {/* CV / Sample Portfolio Link */}
                    {app.portfolio_sample_url ? (
                      <a
                        href={app.portfolio_sample_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          marginLeft: 'auto',
                          background: '#fff7ed',
                          color: '#ea580c',
                          border: '1px solid #fed7aa',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Download size={13} /> Download Portfolio / CV ({app.portfolio_file_name || 'Samples'})
                      </a>
                    ) : (
                      <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        No sample file attached
                      </span>
                    )}
                  </div>

                  {app.bio && (
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{app.bio}"
                    </p>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANAGE ACTIVE WORKERS */}
      {activeSubTab === 'workers' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search digitizers by name or software..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Showing {filteredWorkers.length} of {workers.length} digitizers
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Digitizer Name</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Software & Specialty</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Orders (Active / Done)</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Earned</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Pending Payout</th>
                  <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((w) => (
                  <tr key={w.id || w.email} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{w.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.email}</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {w.specialty || w.primary_software || 'Wilcom'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <span style={{ color: '#ea580c' }}>{w.assigned_orders_count || 0} active</span> / <span style={{ color: '#059669' }}>{w.completed_orders_count || 0} completed</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#059669' }}>
                      Rs. {(() => {
                        const pw = payoutsOverview.workers?.find(x => x.id === w.id);
                        return ((pw ? pw.totalEarnedPkr : w.total_earned) || 0).toLocaleString();
                      })()} PKR
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: (() => {
                      const pw = payoutsOverview.workers?.find(x => x.id === w.id);
                      const unpaid = (pw ? pw.unpaidBalancePkr : w.pending_payout) || 0;
                      return unpaid > 0 ? '#d97706' : 'var(--text-muted)';
                    })() }}>
                      Rs. {(() => {
                        const pw = payoutsOverview.workers?.find(x => x.id === w.id);
                        return ((pw ? pw.unpaidBalancePkr : w.pending_payout) || 0).toLocaleString();
                      })()} PKR
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        background: w.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: w.status === 'active' ? '#059669' : '#dc2626',
                        border: `1px solid ${w.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px'
                      }}>
                        {w.status === 'active' ? 'Active' : (w.status === 'suspended' ? 'Suspended' : w.status)}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        {/* Open Ledger Button */}
                        <button
                          onClick={() => {
                            setActiveSubTab('earnings');
                            handleOpenWorkerLedger(w);
                          }}
                          title="Open Worker Ledger & Statement"
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#2563eb',
                            borderRadius: '6px',
                            padding: '0.35rem 0.6rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <Receipt size={13} /> Ledger
                        </button>

                        {/* Password Reset Email Button */}
                        <button
                          onClick={() => handleSendPasswordReset(w)}
                          disabled={actionLoadingId === `reset-${w.id}`}
                          title="Send Password Reset Email"
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.6rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <KeyRound size={13} style={{ color: '#ea580c' }} />
                          {actionLoadingId === `reset-${w.id}` ? 'Sending...' : 'Reset Pass'}
                        </button>

                        {/* Suspend / Reactivate */}
                        <button
                          onClick={() => handleToggleSuspend(w)}
                          disabled={actionLoadingId === `toggle-${w.id}`}
                          title={w.status === 'suspended' ? 'Reactivate Worker' : 'Suspend Worker'}
                          style={{
                            background: w.status === 'suspended' ? '#ecfdf5' : '#fef2f2',
                            color: w.status === 'suspended' ? '#059669' : '#dc2626',
                            border: `1px solid ${w.status === 'suspended' ? '#a7f3d0' : '#fecaca'}`,
                            borderRadius: '6px',
                            padding: '0.35rem 0.6rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <ShieldAlert size={13} />
                          {w.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORKER BILLING & PKR LEDGER */}
      {activeSubTab === 'earnings' && (
        <div>
          {/* VIEW B: SINGLE WORKER STATEMENT & SETTLEMENT DESK */}
          {selectedWorkerForLedger ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Back Button & Header */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <button
                    onClick={() => setSelectedWorkerForLedger(null)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <ArrowLeft size={14} /> Back to All Workers
                  </button>

                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--text-main)' }}>
                      {selectedWorkerForLedger.name} — Billing Ledger & Statement
                    </h3>
                    <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedWorkerForLedger.email} • {selectedWorkerForLedger.specialty || selectedWorkerForLedger.primary_software || 'Embroidery Digitizer'} • Primary Currency: <strong>Pakistani Rupee (PKR)</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Total Unpaid Balance Badge */}
                  <div style={{
                    background: '#fff7ed',
                    border: '1.5px solid #fed7aa',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    textAlign: 'right'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', display: 'block' }}>
                      Total Unpaid Balance
                    </span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c2410c' }}>
                      Rs. {(workerStatementData?.totalUnpaidPkr || 0).toLocaleString()} PKR
                    </strong>
                  </div>

                  {/* Total Paid Badge */}
                  <div style={{
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '0.5rem 1rem',
                    textAlign: 'right'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', display: 'block' }}>
                      Total Paid to Date
                    </span>
                    <strong style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857' }}>
                      Rs. {(workerStatementData?.totalPaidPkr || 0).toLocaleString()} PKR
                    </strong>
                  </div>
                </div>
              </div>

              {isStatementLoading ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <RefreshCw size={24} className="spin-icon" style={{ color: '#ea580c', margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading worker financial statement...</p>
                </div>
              ) : (
                <>
                  {/* SETTLEMENT SECTION: UNPAID COMPLETED ORDERS */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      background: 'var(--bg-surface)'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={16} style={{ color: '#ea580c' }} /> Completed Orders Awaiting Settlement
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Select verified completed orders below to mark as Paid and automatically generate an official PDF Payout Invoice.
                        </span>
                      </div>

                      {workerStatementData?.unpaidOrders && workerStatementData.unpaidOrders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSelectAllOrders(workerStatementData.unpaidOrders)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            borderRadius: '6px',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {selectedOrdersForPayment.length === workerStatementData.unpaidOrders.length ? 'Deselect All' : 'Select All Unpaid'}
                        </button>
                      )}
                    </div>

                    {!workerStatementData?.unpaidOrders || workerStatementData.unpaidOrders.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.6rem' }} />
                        <h4 style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>All Orders Settled</h4>
                        <p style={{ margin: 0, fontSize: '0.825rem' }}>
                          This worker has no pending completed orders awaiting payment. All work has been fully paid.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.75rem 1rem', width: '40px', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedOrdersForPayment.length === workerStatementData.unpaidOrders.length && workerStatementData.unpaidOrders.length > 0}
                                    onChange={() => handleSelectAllOrders(workerStatementData.unpaidOrders)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Order #</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Job Title / Details</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Completed Date</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Agreed Quote (PKR)</th>
                                <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>Payment Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workerStatementData.unpaidOrders.map((ord) => {
                                const isChecked = selectedOrdersForPayment.includes(ord.id);
                                return (
                                  <tr 
                                    key={ord.id} 
                                    style={{ 
                                      borderBottom: '1px solid var(--border-color)',
                                      background: isChecked ? 'rgba(234, 88, 12, 0.04)' : 'transparent'
                                    }}
                                  >
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleOrderSelection(ord.id)}
                                        style={{ cursor: 'pointer' }}
                                      />
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                      {ord.id?.slice(0, 8)}...
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)' }}>
                                      <div style={{ fontWeight: 700 }}>{ord.title || 'Embroidery Digitizing Design'}</div>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client: {ord.client_name || 'Direct Order'}</span>
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                      {new Date(ord.updated_at || ord.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#ea580c', fontSize: '0.95rem' }}>
                                      Rs. {(ord.costPkr || 0).toLocaleString()} PKR
                                    </td>
                                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                                      <span style={{
                                        background: '#fff7ed',
                                        color: '#ea580c',
                                        border: '1px solid #fed7aa',
                                        padding: '0.15rem 0.55rem',
                                        borderRadius: '4px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase'
                                      }}>
                                        Unpaid
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Settlement Payment Form Action Bar */}
                        <div style={{
                          padding: '1.25rem 1.5rem',
                          background: 'var(--bg-surface)',
                          borderTop: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1.25rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Selected for Payment:</span>
                              <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 800 }}>
                                {selectedOrdersForPayment.length} order{selectedOrdersForPayment.length !== 1 ? 's' : ''}
                              </strong>
                            </div>

                            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Payout Amount:</span>
                              <strong style={{ fontSize: '1.35rem', color: '#ea580c', fontWeight: 900 }}>
                                Rs. {(() => {
                                  const unpaidList = workerStatementData?.unpaidOrders || [];
                                  const sum = unpaidList
                                    .filter(o => selectedOrdersForPayment.includes(o.id))
                                    .reduce((acc, o) => acc + (o.costPkr || 0), 0);
                                  return sum.toLocaleString();
                                })()} PKR
                              </strong>
                            </div>

                            {/* Payment Method Selector */}
                            <div style={{ minWidth: '220px' }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                Settlement Channel
                              </label>
                              <select
                                value={payoutMethod}
                                onChange={(e) => setPayoutMethod(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.825rem',
                                  fontWeight: 600
                                }}
                              >
                                <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                                <option value="Bank Transfer (HBL / Allied / UBL / Alfalah)">Bank Transfer (HBL / Allied / UBL)</option>
                                <option value="JazzCash Mobile Account">JazzCash Mobile Account</option>
                                <option value="Easypaisa Mobile Account">Easypaisa Mobile Account</option>
                                <option value="SadaPay / NayaPay">SadaPay / NayaPay</option>
                                <option value="Internal Cash Voucher">Internal Cash Voucher</option>
                              </select>
                            </div>

                            {/* Reference / Transaction ID */}
                            <div style={{ minWidth: '200px' }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                Transaction Reference / Note
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Meezan Ref #10924 or TID"
                                value={payoutReference}
                                onChange={(e) => setPayoutReference(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.65rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-main)',
                                  fontSize: '0.825rem'
                                }}
                              />
                            </div>
                          </div>

                          {/* Submit & Generate Invoice Button */}
                          <button
                            type="button"
                            onClick={handleExecutePayout}
                            disabled={isProcessingPayout || selectedOrdersForPayment.length === 0}
                            style={{
                              background: selectedOrdersForPayment.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#94a3b8',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.65rem 1.4rem',
                              fontSize: '0.875rem',
                              fontWeight: 800,
                              cursor: selectedOrdersForPayment.length > 0 ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              boxShadow: selectedOrdersForPayment.length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
                            }}
                          >
                            <Receipt size={16} />
                            {isProcessingPayout ? 'Settling & Generating PDF...' : 'Mark as Paid & Download PDF Invoice'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* PAST PAYOUT INVOICES & RECEIPTS FOR THIS WORKER */}
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Receipt size={16} style={{ color: '#10b981' }} /> Payout Invoices & Receipts History ({workerStatementData?.payouts?.length || 0})
                      </h4>
                    </div>

                    {!workerStatementData?.payouts || workerStatementData.payouts.length === 0 ? (
                      <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No past payout receipts recorded for this worker yet.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                              <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payout / Invoice #</th>
                              <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date Settled</th>
                              <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payment Method</th>
                              <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Reference / TID</th>
                              <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Orders Settled</th>
                              <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Paid (PKR)</th>
                              <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>Receipt PDF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workerStatementData.payouts.map((payout) => (
                              <tr key={payout.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#2563eb' }}>
                                  {payout.payout_number}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {new Date(payout.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)', fontWeight: 600 }}>
                                  {payout.payment_method}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {payout.reference_note || '—'}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                  {payout.order_count || (payout.order_ids || []).length} orders
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                                  Rs. {parseFloat(payout.total_amount || 0).toLocaleString()} PKR
                                </td>
                                <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoice(payout, selectedWorkerForLedger)}
                                    disabled={invoiceDownloadingId === (payout.id || payout.payout_number)}
                                    style={{
                                      background: '#eff6ff',
                                      color: '#2563eb',
                                      border: '1px solid #bfdbfe',
                                      borderRadius: '6px',
                                      padding: '0.35rem 0.75rem',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem'
                                    }}
                                  >
                                    <Download size={13} />
                                    {invoiceDownloadingId === (payout.id || payout.payout_number) ? 'Generating...' : 'Download Invoice'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* VIEW A: ALL WORKERS BILLING & PKR LEDGER OVERVIEW */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Studio Financial Snapshot */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                borderRadius: '14px',
                padding: '1.25rem 1.75rem',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Pakistan Digitizer & Artist Production Ledger
                  </span>
                  <h3 style={{ margin: '0.2rem 0 0 0', fontSize: '1.25rem', fontWeight: 900 }}>
                    Internal Billing & Off-Platform Payouts (PKR)
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Settle completed work via Pakistani Bank Transfer, JazzCash, or Easypaisa with 1-click PDF tax invoice generation.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Studio Unpaid:</span>
                    <strong style={{ fontSize: '1.4rem', color: '#f59e0b', fontWeight: 900 }}>
                      Rs. {totalUnpaidPkrAll.toLocaleString()} PKR
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right', borderLeft: '1px solid #334155', paddingLeft: '1.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Paid to Date:</span>
                    <strong style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 900 }}>
                      Rs. {(totalPaidPkrAll > 0 ? totalPaidPkrAll : 0).toLocaleString()} PKR
                    </strong>
                  </div>
                </div>
              </div>

              {/* Workers Overview Table */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Wallet size={16} style={{ color: '#ea580c' }} /> Active Workers Balance & Payout Status
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {workers.length} active digitizer{workers.length !== 1 ? 's' : ''} / artists
                  </span>
                </div>

                {workers.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No active digitizers found. Once applications are approved, staff accounts will appear here.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Worker Name</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Specialty</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Completed Tasks</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unpaid Tasks</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Unpaid Balance (PKR)</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Total Earned (PKR)</th>
                          <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((w) => {
                          const pw = payoutsOverview.workers?.find(x => x.id === w.id);
                          const unpaidBalance = (pw ? pw.unpaidBalancePkr : w.pending_payout) || 0;
                          const totalEarned = (pw ? pw.totalEarnedPkr : w.total_earned) || 0;
                          const unpaidCount = pw ? pw.unpaidCount : 0;
                          const completedCount = pw ? pw.completedCount : (w.completed_orders_count || 0);

                          return (
                            <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.85rem 1.25rem' }}>
                                <strong style={{ color: 'var(--text-main)', display: 'block' }}>{w.name}</strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.email}</span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  background: (w.specialty || '').toLowerCase().includes('vector') ? '#fdf4ff' : '#eff6ff',
                                  color: (w.specialty || '').toLowerCase().includes('vector') ? '#c026d3' : '#2563eb',
                                  border: `1px solid ${(w.specialty || '').toLowerCase().includes('vector') ? '#f5d0fe' : '#bfdbfe'}`,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  {w.specialty || w.primary_software || 'Embroidery Digitizer'}
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {completedCount} completed
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  background: unpaidCount > 0 ? '#fff7ed' : '#ecfdf5',
                                  color: unpaidCount > 0 ? '#ea580c' : '#059669',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800
                                }}>
                                  {unpaidCount} unpaid
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem' }}>
                                <span style={{
                                  fontWeight: 900,
                                  fontSize: '0.95rem',
                                  color: unpaidBalance > 0 ? '#d97706' : '#059669'
                                }}>
                                  Rs. {unpaidBalance.toLocaleString()} PKR
                                </span>
                              </td>
                              <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#059669' }}>
                                Rs. {totalEarned.toLocaleString()} PKR
                              </td>
                              <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenWorkerLedger(w)}
                                  style={{
                                    background: unpaidBalance > 0 ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#eff6ff',
                                    color: unpaidBalance > 0 ? '#ffffff' : '#2563eb',
                                    border: unpaidBalance > 0 ? 'none' : '1px solid #bfdbfe',
                                    borderRadius: '6px',
                                    padding: '0.4rem 0.85rem',
                                    fontWeight: 800,
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    boxShadow: unpaidBalance > 0 ? '0 2px 8px rgba(234, 88, 12, 0.25)' : 'none'
                                  }}
                                >
                                  <Receipt size={13} /> {unpaidBalance > 0 ? 'Settle & Ledger' : 'View Ledger'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Recent Studio-wide Payout Invoices & Receipts */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Receipt size={15} style={{ color: '#10b981' }} /> Recent Payout Settlements & Invoices ({payoutsOverview.recentPayouts?.length || 0})
                  </h4>
                </div>

                {!payoutsOverview.recentPayouts || payoutsOverview.recentPayouts.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No worker payouts recorded yet. When you settle completed orders with digitizers, the payout receipts will appear here.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payout #</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Worker</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Date Settled</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Channel</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Ref / TID</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Orders Count</th>
                          <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Settled (PKR)</th>
                          <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>PDF Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutsOverview.recentPayouts.map((payout) => (
                          <tr key={payout.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#2563eb' }}>
                              {payout.payout_number}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {payout.worker_name || 'Worker'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {new Date(payout.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-main)', fontSize: '0.825rem' }}>
                              {payout.payment_method}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {payout.reference_note || '—'}
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {payout.order_count || (payout.order_ids || []).length} orders
                            </td>
                            <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#059669', fontSize: '0.95rem' }}>
                              Rs. {parseFloat(payout.total_amount || 0).toLocaleString()} PKR
                            </td>
                            <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => handleDownloadInvoice(payout, workers.find(w => w.id === payout.worker_id))}
                                disabled={invoiceDownloadingId === (payout.id || payout.payout_number)}
                                style={{
                                  background: '#eff6ff',
                                  color: '#2563eb',
                                  border: '1px solid #bfdbfe',
                                  borderRadius: '6px',
                                  padding: '0.35rem 0.75rem',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Download size={13} />
                                {invoiceDownloadingId === (payout.id || payout.payout_number) ? 'Generating...' : 'Download'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingWorker && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            maxWidth: '440px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
              Decline Digitizer Application
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Decline the application for <strong>{rejectingWorker.name}</strong> ({rejectingWorker.email}).
            </p>

            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Reason / Feedback (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Portfolio sample stitch density too low, require more commercial embroidery experience..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setRejectingWorker(null)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectWorker}
                disabled={actionLoadingId === `reject-${rejectingWorker.id}`}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.45rem 1rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                {actionLoadingId === `reject-${rejectingWorker.id}` ? 'Declining...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD WORKER MODAL */}
      {isAddWorkerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.4rem 0' }}>
              Add Active Digitizer
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Directly authorize an internal studio digitizer to receive assigned embroidery orders.
            </p>

            <form onSubmit={handleCreateWorker}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newWorkerEmail}
                  onChange={(e) => setNewWorkerEmail(e.target.value)}
                  placeholder="worker@example.com"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Primary Digitizing Software
                </label>
                <select
                  value={newWorkerSoftware}
                  onChange={(e) => setNewWorkerSoftware(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Wilcom EmbroideryStudio">Wilcom EmbroideryStudio</option>
                  <option value="Tajima Pulse DG/ML">Tajima Pulse DG/ML</option>
                  <option value="Hatch Embroidery">Hatch Embroidery</option>
                  <option value="Melco DesignShop">Melco DesignShop</option>
                  <option value="Wings XP / Drawings">Wings XP / Drawings</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddWorkerOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'manual-create'}
                  className="btn btn-primary-orange btn-sm"
                  style={{ padding: '0.45rem 1.25rem' }}
                >
                  {actionLoadingId === 'manual-create' ? 'Adding...' : 'Add Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
