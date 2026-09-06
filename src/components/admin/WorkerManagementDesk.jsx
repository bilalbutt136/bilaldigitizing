'use client';

import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  UserCheck, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  KeyRound, 
  ShieldAlert, 
  Download, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  UserPlus, 
  Check, 
  AlertTriangle,
  FileCode,
  Layers,
  ChevronRight
} from 'lucide-react';

export const WorkerManagementDesk = ({ showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState('applications'); // 'applications' | 'workers' | 'earnings'
  const [workers, setWorkers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [earningsLedger, setEarningsLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const fetchEarningsData = async () => {
    try {
      const res = await fetch('/api/worker/earnings?all=true');
      const data = await res.json();
      if (res.ok && data.ledger) {
        setEarningsLedger(data.ledger);
      }
    } catch (err) {
      console.warn('Fetch earnings error:', err);
    }
  };

  useEffect(() => {
    fetchWorkersData();
    fetchEarningsData();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchWorkersData();
    fetchEarningsData();
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

  // 5. Mark Earnings Item as Paid
  const handleMarkPaid = async (item) => {
    setActionLoadingId(`paid-${item.id}`);
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markEarningsPaid',
          payload: { earningId: item.id, orderId: item.order_id }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Mark as paid failed');

      if (showToast) showToast(`Payout of $${parseFloat(item.amount).toFixed(2)} marked as Paid!`, 'success');
      fetchEarningsData();
      fetchWorkersData();
    } catch (err) {
      if (showToast) showToast(err.message || 'Could not update payout status.', 'error');
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
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const activeCount = workers.filter(w => w.status === 'active').length;
  const totalCompletedOrders = workers.reduce((acc, w) => acc + (w.completed_orders_count || 0), 0);
  const totalPaidEarnings = earningsLedger
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalPendingPayouts = earningsLedger
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

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
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.15rem 1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Payouts</span>
            <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#d97706' }}>
            ${totalPendingPayouts.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total paid: ${totalPaidEarnings.toFixed(2)}</span>
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
            onClick={() => setActiveSubTab('earnings')}
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
            <DollarSign size={14} /> Earnings & Payouts Ledger
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
          {applications.length === 0 ? (
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
              {applications.map((app) => (
                <div
                  key={app.id || app.email}
                  style={{
                    background: 'var(--bg-card)',
                    border: app.status === 'pending' ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
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
                          background: app.status === 'pending' ? '#fff7ed' : '#fef2f2',
                          color: app.status === 'pending' ? '#ea580c' : '#dc2626',
                          border: `1px solid ${app.status === 'pending' ? '#fed7aa' : '#fecaca'}`,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase'
                        }}>
                          {app.status === 'pending' ? 'Pending Review' : 'Rejected'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.825rem', flexWrap: 'wrap' }}>
                        <span>✉️ {app.email}</span>
                        {app.phone && <span>📞 {app.phone}</span>}
                        <span>📅 Applied: {new Date(app.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {app.status === 'pending' && (
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
              ))}
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
                      ${(w.total_earned || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: (w.pending_payout || 0) > 0 ? '#d97706' : 'var(--text-muted)' }}>
                      ${(w.pending_payout || 0).toFixed(2)}
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

      {/* TAB 3: EARNINGS & PAYOUTS LEDGER */}
      {activeSubTab === 'earnings' && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Worker Job Payouts & Ledger
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Total Ledger Entries: {earningsLedger.length}
            </span>
          </div>

          {earningsLedger.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No worker job payouts logged yet. When an Admin assigns an order with a payout price, the ledger entry appears here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Order #</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Worker Identifier</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Payout Amount</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Assigned Date</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1.25rem', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsLedger.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {item.order_number || item.order_id || 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.worker_id}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: item.status === 'paid' ? '#059669' : '#d97706' }}>
                        ${parseFloat(item.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: item.status === 'paid' ? '#ecfdf5' : '#fff7ed',
                          color: item.status === 'paid' ? '#059669' : '#ea580c',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        {item.status === 'pending' ? (
                          <button
                            onClick={() => handleMarkPaid(item)}
                            disabled={actionLoadingId === `paid-${item.id}`}
                            style={{
                              background: '#22c55e',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.35rem 0.75rem',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem'
                            }}
                          >
                            <Check size={12} /> Mark as Paid
                          </button>
                        ) : (
                          <span style={{ color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                            Paid on {new Date(item.paid_at || item.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
