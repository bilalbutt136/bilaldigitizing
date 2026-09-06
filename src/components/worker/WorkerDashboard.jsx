'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { supabaseClient } from '../../lib/supabaseClient';
import { WorkerOrderWorkspaceModal } from './WorkerOrderWorkspaceModal';
import { 
  Scissors, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  LogOut, 
  UploadCloud, 
  Sparkles,
  DollarSign,
  Download,
  Wallet,
  FileText
} from 'lucide-react';
import { generateWorkerPayoutInvoicePdf } from '../../utils/workerInvoicePdfGenerator';

export const WorkerDashboard = ({ worker, logoutRoute = '/portal/login' }) => {
  const router = useRouter();
  const { showToast, logout } = useAppState();

  const [orders, setOrders] = useState([]);
  const [billingStatement, setBillingStatement] = useState({
    unpaidOrders: [],
    paidOrders: [],
    payouts: [],
    totalUnpaidPkr: 0,
    totalPaidPkr: 0,
    unpaidOrdersCount: 0,
    paidOrdersCount: 0
  });
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending_acceptance' | 'in_progress' | 'review_pending' | 'revisions' | 'completed' | 'earnings'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchWorkerOrders = async () => {
    try {
      const res = await fetch('/api/orders?action=fetchAll');
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.warn('Worker orders fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchBillingStatement = async () => {
    try {
      const res = await fetch('/api/admin/payouts');
      if (res.ok) {
        const data = await res.json();
        setBillingStatement(data);
      }
    } catch (err) {
      console.warn('Worker billing statement notice:', err);
    }
  };

  useEffect(() => {
    fetchWorkerOrders();
    fetchBillingStatement();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchWorkerOrders();
    fetchBillingStatement();
  };

  const handleLogout = async () => {
    try {
      if (supabaseClient) await supabaseClient.auth.signOut();
      if (logout) logout();
      try {
        localStorage.removeItem('bdigi_auth_user');
      } catch {}
      router.replace(logoutRoute || '/portal/login');
      if (showToast) showToast('Logged out of digitizer station.', 'info');
    } catch {
      router.replace(logoutRoute || '/portal/login');
    }
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
  };

  // Metrics computation
  const pendingAcceptanceCount = orders.filter(o => o.worker_status === 'Pending_Worker_Acceptance').length;
  const inProgressCount = orders.filter(o => o.worker_status === 'In Progress' || (!o.worker_status && o.status !== 'completed' && o.worker_status !== 'Pending_Worker_Acceptance')).length;
  const reviewPendingCount = orders.filter(o => o.worker_status === 'Review Pending').length;
  const revisionsCount = orders.filter(o => o.worker_status === 'Revisions Needed').length;
  const completedCount = orders.filter(o => o.worker_status === 'Completed' || o.status === 'completed').length;

  // Filtered orders
  const filteredOrders = orders.filter(ord => {
    const title = (ord.title || ord.description || '').toLowerCase();
    const id = (ord.id || '').toLowerCase();
    const fabric = (ord.fabricType || ord.fabric_type || '').toLowerCase();
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || title.includes(query) || id.includes(query) || fabric.includes(query);
    if (!matchesSearch) return false;

    const ws = ord.worker_status || 'In Progress';
    if (activeTab === 'pending_acceptance') return ws === 'Pending_Worker_Acceptance';
    if (activeTab === 'in_progress') return ws === 'In Progress' || (!ord.worker_status && ord.status !== 'completed' && ws !== 'Pending_Worker_Acceptance');
    if (activeTab === 'review_pending') return ws === 'Review Pending';
    if (activeTab === 'revisions') return ws === 'Revisions Needed';
    if (activeTab === 'completed') return ws === 'Completed' || ord.status === 'completed';
    return true;
  });

  const handleDownloadWorkerInvoice = async (payout) => {
    setIsDownloadingPdf(payout.id || payout.payout_number);
    try {
      const relatedOrders = (billingStatement.paidOrders || []).filter(o => (payout.order_ids || []).includes(o.id));
      const { downloadPdf } = await generateWorkerPayoutInvoicePdf({
        payout,
        worker: worker || { name: payout.worker_name, email: payout.worker_email },
        orders: relatedOrders.length > 0 ? relatedOrders : (payout.order_ids || []).map((id) => ({
          id,
          title: `Order #${id.slice(0, 8)}`,
          costPkr: (payout.total_amount || 0) / (payout.order_count || 1)
        })),
        stealthMode: true
      });
      downloadPdf();
      if (showToast) showToast(`Downloaded invoice ${payout.payout_number}`, 'success');
    } catch (err) {
      console.warn('PDF download error:', err);
      if (showToast) showToast('Could not generate PDF receipt.', 'error');
    } finally {
      setIsDownloadingPdf(null);
    }
  };

  const getWorkerStatusBadge = (ws) => {
    const status = ws || 'In Progress';
    switch (status) {
      case 'Pending_Worker_Acceptance':
        return (
          <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Sparkles size={12} /> Pending Quote (PKR)
          </span>
        );
      case 'Revisions Needed':
        return (
          <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={12} /> Revisions Needed
          </span>
        );
      case 'Review Pending':
        return (
          <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={12} /> Review Pending
          </span>
        );
      case 'Completed':
        return (
          <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      default:
        return (
          <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <Scissors size={12} /> In Progress
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Top Header Bar */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)'
            }}>
              <Scissors size={26} />
            </div>

            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                Digitizer Workstation
              </h1>
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: '0.15rem 0 0 0' }}>
                Signed in as: <strong style={{ color: '#f97316' }}>{worker?.name || worker?.email || 'Studio Digitizer'}</strong> • Production Desk
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              style={{
                background: '#334155',
                border: '1px solid #475569',
                color: '#e2e8f0',
                borderRadius: '8px',
                padding: '0.55rem 0.9rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Refresh Task Queue"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} /> {isRefreshing ? 'Syncing...' : 'Sync'}
            </button>

            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                borderRadius: '8px',
                padding: '0.55rem 0.9rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <LogOut size={14} /> Exit Station
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          {/* 0. Job Invitations / Quotes Needed */}
          <div 
            onClick={() => setActiveTab('pending_acceptance')}
            style={{
              background: activeTab === 'pending_acceptance' ? '#1e293b' : '#1e293b',
              border: activeTab === 'pending_acceptance' ? '2px solid #f59e0b' : pendingAcceptanceCount > 0 ? '1.5px solid #f59e0b' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pendingAcceptanceCount > 0 ? '#fbbf24' : '#94a3b8' }}>INVITATIONS</span>
              <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: pendingAcceptanceCount > 0 ? '#f59e0b' : '#ffffff' }}>
              {pendingAcceptanceCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: pendingAcceptanceCount > 0 ? '#fbbf24' : '#64748b' }}>Awaiting your PKR quote</span>
          </div>

          {/* 1. In Progress */}
          <div 
            onClick={() => setActiveTab('in_progress')}
            style={{
              background: activeTab === 'in_progress' ? '#1e293b' : '#1e293b',
              border: activeTab === 'in_progress' ? '2px solid #f97316' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>IN PROGRESS</span>
              <span style={{ background: '#fff7ed', color: '#ea580c', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scissors size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }}>
              {inProgressCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting punch & stitch file</span>
          </div>

          {/* 2. Review Pending */}
          <div 
            onClick={() => setActiveTab('review_pending')}
            style={{
              background: '#1e293b',
              border: activeTab === 'review_pending' ? '2px solid #3b82f6' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>REVIEW PENDING</span>
              <span style={{ background: '#eff6ff', color: '#2563eb', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }}>
              {reviewPendingCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting Admin approval</span>
          </div>

          {/* 3. Revisions Needed */}
          <div 
            onClick={() => setActiveTab('revisions')}
            style={{
              background: revisionsCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#1e293b',
              border: activeTab === 'revisions' ? '2px solid #ef4444' : revisionsCount > 0 ? '1.5px solid #ef4444' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: revisionsCount > 0 ? '#fca5a5' : '#94a3b8' }}>REVISIONS NEEDED</span>
              <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: revisionsCount > 0 ? '#ef4444' : '#ffffff' }}>
              {revisionsCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: revisionsCount > 0 ? '#fca5a5' : '#64748b' }}>Admin feedback received</span>
          </div>

          {/* 4. Completed */}
          <div 
            onClick={() => setActiveTab('completed')}
            style={{
              background: '#1e293b',
              border: activeTab === 'completed' ? '2px solid #10b981' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>COMPLETED</span>
              <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff' }}>
              {completedCount}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Delivered to clients</span>
          </div>

          {/* 5. Pending Payouts (PKR) */}
          <div 
            onClick={() => setActiveTab('earnings')}
            style={{
              background: activeTab === 'earnings' ? '#1e293b' : '#1e293b',
              border: activeTab === 'earnings' ? '2px solid #f59e0b' : '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>UNPAID BALANCE</span>
              <span style={{ background: '#fef3c7', color: '#d97706', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b' }}>
              Rs. {(billingStatement.totalUnpaidPkr || 0).toLocaleString()} PKR
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Awaiting settlement</span>
          </div>

          {/* 6. Total Earned (PKR) */}
          <div 
            onClick={() => setActiveTab('earnings')}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>PAID TO DATE</span>
              <span style={{ background: '#ecfdf5', color: '#059669', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={14} />
              </span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>
              Rs. {(billingStatement.totalPaidPkr || 0).toLocaleString()} PKR
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Settled via Bank/Wallets</span>
          </div>
        </div>

        {/* Filter Navigation & Search Bar */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Tasks (${orders.length})` },
              { id: 'pending_acceptance', label: `⚡ Invitations (${pendingAcceptanceCount})` },
              { id: 'in_progress', label: `In Progress (${inProgressCount})` },
              { id: 'review_pending', label: `Review Pending (${reviewPendingCount})` },
              { id: 'revisions', label: `Revisions (${revisionsCount})` },
              { id: 'completed', label: `Completed (${completedCount})` },
              { id: 'earnings', label: `💰 Billing & Invoices (Rs. ${(billingStatement.totalUnpaidPkr || 0).toLocaleString()} PKR)` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? '#f97316' : '#334155',
                  color: activeTab === tab.id ? '#ffffff' : '#cbd5e1',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search ID, title, fabric..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.825rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Earnings & Payouts Ledger View (PKR) */}
        {activeTab === 'earnings' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Financial Banner */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '14px',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Internal Workforce Ledger
                </span>
                <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Compensation, Payouts & Official Tax Invoices
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                  Transparent per-order compensation in Pakistani Rupee (PKR). Off-platform bank / mobile wallet settlements.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Unpaid Balance (Pending Payout):</span>
                  <strong style={{ fontSize: '1.35rem', color: '#f59e0b', fontWeight: 900 }}>
                    Rs. {(billingStatement.totalUnpaidPkr || 0).toLocaleString()} PKR
                  </strong>
                </div>

                <div style={{ textAlign: 'right', borderLeft: '1px solid #334155', paddingLeft: '1.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Total Settled to Date:</span>
                  <strong style={{ fontSize: '1.35rem', color: '#10b981', fontWeight: 900 }}>
                    Rs. {(billingStatement.totalPaidPkr || 0).toLocaleString()} PKR
                  </strong>
                </div>
              </div>
            </div>

            {/* Section 1: Completed Orders Awaiting Settlement */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '14px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} style={{ color: '#f59e0b' }} /> Completed Orders Awaiting Payout ({billingStatement.unpaidOrders?.length || 0})
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Sum: Rs. {(billingStatement.totalUnpaidPkr || 0).toLocaleString()} PKR
                </span>
              </div>

              {!billingStatement.unpaidOrders || billingStatement.unpaidOrders.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <CheckCircle2 size={36} style={{ color: '#10b981', margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#cbd5e1', fontWeight: 700 }}>
                    All completed orders are currently settled!
                  </p>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    When new completed orders are approved by Admin, they will appear here until paid.
                  </span>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Order Number</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Job Description</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date Completed</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Agreed Quote (PKR)</th>
                        <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingStatement.unpaidOrders.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#f97316' }}>
                            {formatOrderId(item.id)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            {item.title || 'Embroidery Digitizing Design'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#f59e0b', fontSize: '0.95rem' }}>
                            Rs. {(item.costPkr || 0).toLocaleString()} PKR
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}>
                              ⏳ Awaiting Settlement
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Settled Payouts & Invoices History */}
            <div style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '14px',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={16} style={{ color: '#10b981' }} /> Settled Payout Invoices & Receipts ({billingStatement.payouts?.length || 0})
                </h4>
              </div>

              {!billingStatement.payouts || billingStatement.payouts.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <Wallet size={36} style={{ color: '#64748b', margin: '0 auto 0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>
                    No payout receipts issued yet. When the studio settles your balance, official downloadable invoices will be listed here.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
                        <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payout #</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date Settled</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Payment Channel</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Ref / TID</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Tasks Count</th>
                        <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total Settled (PKR)</th>
                        <th style={{ padding: '0.75rem 1.25rem', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Official Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingStatement.payouts.map((payout) => (
                        <tr key={payout.id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '0.85rem 1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                            {payout.payout_number}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {new Date(payout.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1', fontWeight: 600 }}>
                            {payout.payment_method}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.8rem' }}>
                            {payout.reference_note || '—'}
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#cbd5e1' }}>
                            {payout.order_count || (payout.order_ids || []).length} orders
                          </td>
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 900, color: '#34d399', fontSize: '0.95rem' }}>
                            Rs. {parseFloat(payout.total_amount || 0).toLocaleString()} PKR
                          </td>
                          <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleDownloadWorkerInvoice(payout)}
                              disabled={isDownloadingPdf === (payout.id || payout.payout_number)}
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                color: '#60a5fa',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
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
                              {isDownloadingPdf === (payout.id || payout.payout_number) ? 'Downloading...' : 'PDF Receipt'}
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
        ) : (
        /* Orders List / Cards */
        isLoading ? (
          <div style={{ padding: '4rem', textAlign: 'center', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155' }}>
            <div style={{ margin: '0 auto 1rem', width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Loading assigned tasks...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#1e293b', borderRadius: '14px', border: '1px solid #334155' }}>
            <div style={{ color: '#64748b', marginBottom: '0.75rem' }}>
              <Scissors size={40} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem 0' }}>
              No tasks found in this category
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              {searchTerm ? 'Try adjusting your search query.' : 'New digitizing assignments from the Admin will show up here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {filteredOrders.map(ord => {
              const artworkSrc = ord.artworkUrl || ord.image_url || ord.logo || ord.uploadedFiles?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
              const dimensions = ord.dimensions || { width: '3.5', height: '3.0', unit: 'in' };
              const isRevision = ord.worker_status === 'Revisions Needed';
              const isPendingAcceptance = ord.worker_status === 'Pending_Worker_Acceptance';

              return (
                <div
                  key={ord.id}
                  style={{
                    background: '#1e293b',
                    border: isRevision ? '1.5px solid #ef4444' : isPendingAcceptance ? '1.5px solid #f59e0b' : '1px solid #334155',
                    borderRadius: '12px',
                    padding: '1.15rem 1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                    {/* Thumbnail Artwork */}
                    <div 
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        background: '#0f172a',
                        border: '1.5px solid #f97316',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={artworkSrc}
                        alt={ord.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Order Details Info */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, color: '#f97316', fontSize: '0.8rem', background: 'rgba(249, 115, 22, 0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {formatOrderId(ord.id)}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                          {ord.title || 'Untitled Order'}
                        </h4>
                        {ord.isRush && (
                          <span style={{ background: '#fef2f2', color: '#dc2626', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            ⚡ RUSH
                          </span>
                        )}
                        {parseFloat(ord.quoted_price_pkr || ord.quoted_price || 0) > 0 && (
                          <span style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            💰 Rs. {parseFloat(ord.quoted_price_pkr || ord.quoted_price).toLocaleString()} PKR
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '0.785rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>📂 {ord.serviceCategory || ord.type || 'Embroidery Digitizing'}</span>
                        <span>•</span>
                        <span>📐 {typeof dimensions === 'object' ? `${dimensions.width}×${dimensions.height} ${dimensions.unit || 'in'}` : String(dimensions)}</span>
                        <span>•</span>
                        <span>🧵 {ord.fabricType || 'Pique Cotton'}</span>
                      </div>

                      {/* If revision, show preview note */}
                      {isRevision && ord.admin_worker_feedback && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.775rem', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                          <span>Admin note: "{ord.admin_worker_feedback.slice(0, 75)}{ord.admin_worker_feedback.length > 75 ? '...' : ''}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Status Badge & Open Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div>
                      {getWorkerStatusBadge(ord.worker_status)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      style={{
                        background: isPendingAcceptance 
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                          : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        fontSize: '0.825rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: isPendingAcceptance 
                          ? '0 2px 8px rgba(245, 158, 11, 0.35)' 
                          : '0 2px 8px rgba(249, 115, 22, 0.25)'
                      }}
                    >
                      {isPendingAcceptance ? (
                        <>
                          <Sparkles size={14} /> Review & Enter PKR Quote
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} /> Open Workspace & Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Workspace Modal */}
      {selectedOrder && (
        <WorkerOrderWorkspaceModal
          order={selectedOrder}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleOrderUpdated}
          showToast={showToast}
        />
      )}
    </div>
  );
};
