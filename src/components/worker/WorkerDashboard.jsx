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
  Layers, 
  UploadCloud, 
  FileCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Home
} from 'lucide-react';

export const WorkerDashboard = ({ worker }) => {
  const router = useRouter();
  const { showToast, logout } = useAppState();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'in_progress' | 'review_pending' | 'revisions' | 'completed'
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

  useEffect(() => {
    fetchWorkerOrders();
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchWorkerOrders();
  };

  const handleLogout = async () => {
    try {
      if (supabaseClient) await supabaseClient.auth.signOut();
      if (logout) logout();
      try {
        localStorage.removeItem('bdigi_auth_user');
      } catch {}
      router.replace('/worker-login');
      if (showToast) showToast('Logged out of digitizer station.', 'info');
    } catch {
      router.replace('/worker-login');
    }
  };

  const handleOrderUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
  };

  // Metrics computation
  const inProgressCount = orders.filter(o => o.worker_status === 'In Progress' || (!o.worker_status && o.status !== 'completed')).length;
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
    if (activeTab === 'in_progress') return ws === 'In Progress';
    if (activeTab === 'review_pending') return ws === 'Review Pending';
    if (activeTab === 'revisions') return ws === 'Revisions Needed';
    if (activeTab === 'completed') return ws === 'Completed' || ord.status === 'completed';
    return true;
  });

  const getWorkerStatusBadge = (ws, ordStatus) => {
    const status = ws || 'In Progress';
    switch (status) {
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
              { id: 'in_progress', label: `In Progress (${inProgressCount})` },
              { id: 'review_pending', label: `Review Pending (${reviewPendingCount})` },
              { id: 'revisions', label: `Revisions (${revisionsCount})` },
              { id: 'completed', label: `Completed (${completedCount})` }
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

        {/* Orders List / Cards */}
        {isLoading ? (
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

              return (
                <div
                  key={ord.id}
                  style={{
                    background: '#1e293b',
                    border: isRevision ? '1.5px solid #ef4444' : '1px solid #334155',
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
                      {getWorkerStatusBadge(ord.worker_status, ord.status)}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(ord)}
                      style={{
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
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
                        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25)'
                      }}
                    >
                      <UploadCloud size={14} /> Open Workspace & Upload
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
