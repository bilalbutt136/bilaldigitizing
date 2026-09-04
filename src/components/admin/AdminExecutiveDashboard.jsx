'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ClipboardList, 
  Layers, 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Eye, 
  ChevronRight, 
  Tag, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight,
  Maximize2,
  DollarSign,
  Activity,
  Scissors,
  CheckCheck
} from 'lucide-react';
import AdminCreateOfferModal from './AdminCreateOfferModal';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';

export const AdminExecutiveDashboard = ({
  orders = [],
  clients = [],
  adminUnreadCount = 0,
  setActiveTab,
  setSelectedOrderForDrawer,
  setIsPricingSettingsOpen,
  resetAllData,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'embroidery' | 'vector' | 'patches'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed' | 'revision'
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [lightboxOrder, setLightboxOrder] = useState(null);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  // Core KPI Calculations
  const totalRevenue = useMemo(() => {
    return safeOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);
  }, [safeOrders]);

  const avgOrderValue = useMemo(() => {
    return safeOrders.length > 0 ? (totalRevenue / safeOrders.length) : 0;
  }, [totalRevenue, safeOrders]);

  const activeJobs = useMemo(() => {
    return safeOrders.filter(o => o?.status !== 'completed' && o?.status !== 'cancelled' && o?.status !== 'delivered');
  }, [safeOrders]);

  const completedJobs = useMemo(() => {
    return safeOrders.filter(o => o?.status === 'completed' || o?.status === 'delivered');
  }, [safeOrders]);

  const pendingJobs = useMemo(() => {
    return safeOrders.filter(o => !o?.status || o?.status === 'pending' || o?.status === 'submitted' || o?.status === 'quote_requested');
  }, [safeOrders]);

  const inProgressJobs = useMemo(() => {
    return safeOrders.filter(o => o?.status === 'in_progress' || o?.status === 'digitizing' || o?.status === 'vectoring' || o?.status === 'production');
  }, [safeOrders]);

  const revisionJobs = useMemo(() => {
    return safeOrders.filter(o => o?.status === 'revision' || o?.status === 'changes_requested');
  }, [safeOrders]);

  const rushJobs = useMemo(() => {
    return safeOrders.filter(o => 
      o?.is_rush || 
      o?.isRush || 
      o?.turnaround === 'rush' || 
      o?.turnaround === '2-4 hours' || 
      String(o?.notes || '').toLowerCase().includes('rush') ||
      String(o?.title || '').toLowerCase().includes('rush')
    );
  }, [safeOrders]);

  // Category Counts & Revenue
  const categoryStats = useMemo(() => {
    let embCount = 0;
    let embRev = 0;
    let vecCount = 0;
    let vecRev = 0;
    let patchCount = 0;
    let patchRev = 0;

    safeOrders.forEach(o => {
      const type = String(o?.type || o?.serviceCategory || o?.service_category || '').toLowerCase();
      const price = parseFloat(o?.price) || 0;
      if (type.includes('vector') || type.includes('trace') || type.includes('redraw')) {
        vecCount++;
        vecRev += price;
      } else if (type.includes('patch')) {
        patchCount++;
        patchRev += price;
      } else {
        embCount++;
        embRev += price;
      }
    });

    const total = safeOrders.length || 1;
    return {
      embroidery: { count: embCount, revenue: embRev, pct: Math.round((embCount / total) * 100) },
      vector: { count: vecCount, revenue: vecRev, pct: Math.round((vecCount / total) * 100) },
      patches: { count: patchCount, revenue: patchRev, pct: Math.round((patchCount / total) * 100) }
    };
  }, [safeOrders]);

  // Filtered Orders Queue for Dashboard
  const filteredQueue = useMemo(() => {
    return safeOrders.filter(o => {
      // Category filter
      if (selectedCategory !== 'all') {
        const type = String(o?.type || o?.serviceCategory || o?.service_category || '').toLowerCase();
        if (selectedCategory === 'embroidery' && (type.includes('vector') || type.includes('patch'))) return false;
        if (selectedCategory === 'vector' && !type.includes('vector') && !type.includes('trace') && !type.includes('redraw')) return false;
        if (selectedCategory === 'patches' && !type.includes('patch')) return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const st = String(o?.status || 'pending').toLowerCase();
        if (selectedStatus === 'pending' && st !== 'pending' && st !== 'submitted' && st !== 'quote_requested') return false;
        if (selectedStatus === 'in_progress' && st !== 'in_progress' && st !== 'digitizing' && st !== 'vectoring' && st !== 'production') return false;
        if (selectedStatus === 'revision' && st !== 'revision' && st !== 'changes_requested') return false;
        if (selectedStatus === 'completed' && st !== 'completed' && st !== 'delivered') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const id = String(o?.id || '').toLowerCase();
        const title = String(o?.title || '').toLowerCase();
        const client = String(o?.clientName || o?.client_name || '').toLowerCase();
        const email = String(o?.clientEmail || o?.client_email || '').toLowerCase();
        return id.includes(q) || title.includes(q) || client.includes(q) || email.includes(q);
      }

      return true;
    });
  }, [safeOrders, selectedCategory, selectedStatus, searchQuery]);

  const handleOrderClick = (ord) => {
    if (setSelectedOrderForDrawer) {
      setSelectedOrderForDrawer(ord);
    } else {
      setActiveTab('orders');
    }
  };

  const handleOpenChat = (clientEmail) => {
    setActiveTab('chat');
    if (typeof window !== 'undefined' && clientEmail) {
      window.dispatchEvent(new CustomEvent('bdigi_open_client_chat', { detail: { email: clientEmail } }));
    }
  };

  const getStatusBadgeStyle = (status) => {
    const st = String(status || 'pending').toLowerCase();
    if (st === 'completed' || st === 'delivered') {
      return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Completed' };
    }
    if (st === 'in_progress' || st === 'digitizing' || st === 'vectoring' || st === 'production') {
      return { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe', label: 'In Production' };
    }
    if (st === 'revision' || st === 'changes_requested') {
      return { bg: '#fef3c7', color: '#b45309', border: '#fde68a', label: 'In Revision' };
    }
    return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'Pending Review' };
  };

  const getCategoryBadgeStyle = (serviceCategory, type) => {
    const combined = String(serviceCategory || type || '').toLowerCase();
    if (combined.includes('vector') || combined.includes('trace')) {
      return { label: 'Vector Tracing', icon: '✒️', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
    }
    if (combined.includes('patch')) {
      return { label: 'Custom Patches', icon: '🏷️', bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff' };
    }
    return { label: 'Embroidery Digitizing', icon: '🧵', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* 1. COMMAND HEADER & REALTIME STATUS BAR */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle, #f8fafc) 100%)',
        border: '1.5px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#dcfce7',
              color: '#15803d',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              border: '1px solid #86efac',
              letterSpacing: '0.02em'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.3)' }} />
              LIVE OPERATIONS HUB
            </span>
            <span style={{
              background: 'var(--navy-900, #0f172a)',
              color: 'var(--orange-400, #fb923c)',
              fontSize: '0.68rem',
              fontWeight: 900,
              padding: '0.15rem 0.5rem',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}>
              MASTER ADMIN
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
            Executive Command Center
          </h1>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
            Real-time pipeline monitoring, revenue tracking, and digitized asset control.
          </p>
        </div>

        {/* Quick Command Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsOfferModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              padding: '0.5rem 0.95rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 3px 10px rgba(234, 88, 12, 0.3)',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={15} /> Create Custom Offer
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setIsPricingSettingsOpen(true)}
            style={{
              background: 'var(--navy-900, #0f172a)',
              color: '#ffffff',
              border: '1px solid var(--navy-700, #334155)',
              fontWeight: 700,
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer'
            }}
          >
            <Sliders size={14} /> Rates Matrix
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={resetAllData}
            style={{
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              border: '1.5px solid var(--border-color, #cbd5e1)',
              fontWeight: 700,
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer'
            }}
            title="Force refresh catalog and orders from live database"
          >
            <RefreshCw size={13} /> Sync DB
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE METRIC KPI TILES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem'
      }}>
        {/* Metric 1: Total Revenue */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          padding: '1rem 1.15rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Volume
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(234, 88, 12, 0.1)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <ArrowUpRight size={12} /> {safeOrders.length} orders
            </span>
            <span>•</span>
            <span>Avg ${avgOrderValue.toFixed(2)}/job</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #ea580c, #fb923c)' }} />
        </div>

        {/* Metric 2: Active Pipeline */}
        <div 
          onClick={() => setActiveTab('orders')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '14px',
            padding: '1rem 1.15rem',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Pipeline
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(37, 99, 235, 0.1)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {activeJobs.length} Jobs
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ fontWeight: 800, color: '#2563eb' }}>
              {inProgressJobs.length} In Production
            </span>
            <span>•</span>
            <span>{pendingJobs.length} Pending</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2563eb, #60a5fa)' }} />
        </div>

        {/* Metric 3: Completed & Delivered */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          padding: '1rem 1.15rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed & Delivered
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(22, 163, 74, 0.1)',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {completedJobs.length} Files
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ fontWeight: 800, color: '#16a34a' }}>
              100% Quality Inspected
            </span>
            <span>•</span>
            <span>Accepted</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
        </div>

        {/* Metric 4: Registered Studio Accounts */}
        <div 
          onClick={() => setActiveTab('clients')}
          role="button"
          tabIndex={0}
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '14px',
            padding: '1rem 1.15rem',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Studio Clients
            </span>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(147, 51, 234, 0.1)',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {safeClients.length} Accounts
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem', fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ fontWeight: 800, color: '#9333ea' }}>
              Active Client Wallets
            </span>
            <span>•</span>
            <span>VIP Rates</span>
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #9333ea, #c084fc)' }} />
        </div>
      </div>

      {/* 3. INTERACTIVE PRODUCTION PIPELINE FUNNEL (4 STAGES) */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        border: '1.5px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              PRODUCTION FLOW
            </span>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', margin: 0 }}>
              Live Workflow Pipeline Funnel
            </h3>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
            Click stage to filter queue below
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.65rem'
        }}>
          {/* Stage 1: Pending Review */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
            role="button"
            tabIndex={0}
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '12px',
              border: selectedStatus === 'pending' ? '2px solid #ea580c' : '1px solid #e2e8f0',
              background: selectedStatus === 'pending' ? '#fff7ed' : 'var(--bg-subtle, #f8fafc)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c2410c' }}>1. Pending Review</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#ea580c' }}>{pendingJobs.length}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              New orders awaiting specs verification
            </div>
          </div>

          {/* Stage 2: In Production */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'in_progress' ? 'all' : 'in_progress')}
            role="button"
            tabIndex={0}
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '12px',
              border: selectedStatus === 'in_progress' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              background: selectedStatus === 'in_progress' ? '#eff6ff' : 'var(--bg-subtle, #f8fafc)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>2. In Production</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#2563eb' }}>{inProgressJobs.length}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              Actively being digitized or redrawn
            </div>
          </div>

          {/* Stage 3: Revision / QA */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'revision' ? 'all' : 'revision')}
            role="button"
            tabIndex={0}
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '12px',
              border: selectedStatus === 'revision' ? '2px solid #d97706' : '1px solid #e2e8f0',
              background: selectedStatus === 'revision' ? '#fffbeb' : 'var(--bg-subtle, #f8fafc)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e' }}>3. Quality / Revision</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#d97706' }}>{revisionJobs.length}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              Customer adjustments or QA testing
            </div>
          </div>

          {/* Stage 4: Completed & Delivered */}
          <div
            onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
            role="button"
            tabIndex={0}
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '12px',
              border: selectedStatus === 'completed' ? '2px solid #16a34a' : '1px solid #e2e8f0',
              background: selectedStatus === 'completed' ? '#f0fdf4' : 'var(--bg-subtle, #f8fafc)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534' }}>4. Completed Files</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#16a34a' }}>{completedJobs.length}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              Machine files delivered to client
            </div>
          </div>
        </div>
      </div>

      {/* 4. SPLIT TWO-COLUMN COMMAND CENTER (65% / 35%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1.15fr)',
        gap: '1rem',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: LIVE PRODUCTION QUEUE */}
        <div style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1.5px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          padding: '1.15rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Live Production Queue
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                Showing {filteredQueue.length} of {safeOrders.length} total orders
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ea580c',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.4rem'
              }}
            >
              Open Full Orders Table ➔
            </button>
          </div>

          {/* Search Input & Quick Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order #, client, title, email..."
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.78rem',
                  background: 'var(--bg-surface, #ffffff)',
                  color: 'var(--text-main, #0f172a)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: selectedCategory === 'all' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                  background: selectedCategory === 'all' ? '#ea580c' : 'var(--bg-subtle, #f8fafc)',
                  color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-main, #334155)',
                  cursor: 'pointer'
                }}
              >
                All ({safeOrders.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('embroidery')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: selectedCategory === 'embroidery' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                  background: selectedCategory === 'embroidery' ? '#ea580c' : 'var(--bg-subtle, #f8fafc)',
                  color: selectedCategory === 'embroidery' ? '#ffffff' : 'var(--text-main, #334155)',
                  cursor: 'pointer'
                }}
              >
                🧵 Embroidery ({categoryStats.embroidery.count})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('vector')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: selectedCategory === 'vector' ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: selectedCategory === 'vector' ? '#2563eb' : 'var(--bg-subtle, #f8fafc)',
                  color: selectedCategory === 'vector' ? '#ffffff' : 'var(--text-main, #334155)',
                  cursor: 'pointer'
                }}
              >
                ✒️ Vector ({categoryStats.vector.count})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('patches')}
                style={{
                  padding: '0.4rem 0.7rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: selectedCategory === 'patches' ? '1.5px solid #9333ea' : '1px solid #e2e8f0',
                  background: selectedCategory === 'patches' ? '#9333ea' : 'var(--bg-subtle, #f8fafc)',
                  color: selectedCategory === 'patches' ? '#ffffff' : 'var(--text-main, #334155)',
                  cursor: 'pointer'
                }}
              >
                🏷️ Patches ({categoryStats.patches.count})
              </button>
            </div>
          </div>

          {/* Orders List Stream */}
          {filteredQueue.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted, #94a3b8)',
              background: 'var(--bg-subtle, #f8fafc)',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1'
            }}>
              <ClipboardList size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>No orders found matching your filters</div>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedStatus('all'); }}
                style={{
                  marginTop: '0.5rem',
                  background: 'none',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#ea580c',
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {filteredQueue.slice(0, 7).map((ord) => {
                const statusBadge = getStatusBadgeStyle(ord.status);
                const catBadge = getCategoryBadgeStyle(ord.serviceCategory, ord.type);
                const artworkImg = ord.artworkUrl || ord.artwork_url || ord.image_url || ord.logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                const isPaid = ord.payment_status === 'paid';
                const cleanId = String(ord.id || '').replace(/^#+/, '');

                return (
                  <div
                    key={ord.id}
                    style={{
                      background: 'var(--bg-surface, #ffffff)',
                      border: '1.5px solid var(--border-color, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '0.75rem 0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                      flexWrap: 'wrap',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Artwork Preview + Title + Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
                      <div 
                        style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
                        onClick={() => setLightboxOrder(ord)}
                        title="Click to view full artwork preview"
                      >
                        <img
                          src={artworkImg}
                          alt={ord.title || 'Order artwork'}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            border: '1.5px solid var(--border-color, #cbd5e1)',
                            background: '#0f172a'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          background: '#0f172a',
                          color: '#ffffff',
                          borderRadius: '4px',
                          padding: '1px 3px',
                          fontSize: '0.55rem',
                          fontWeight: 800
                        }}>
                          <Maximize2 size={8} />
                        </div>
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 900,
                            color: 'var(--navy-900, #0f172a)',
                            background: 'var(--bg-subtle, #f1f5f9)',
                            padding: '0.08rem 0.4rem',
                            borderRadius: '5px',
                            border: '1px solid #cbd5e1'
                          }}>
                            #{cleanId}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: catBadge.bg,
                            color: catBadge.color,
                            border: `1px solid ${catBadge.border}`,
                            padding: '0.08rem 0.4rem',
                            borderRadius: '5px'
                          }}>
                            {catBadge.icon} {catBadge.label}
                          </span>
                        </div>

                        <div style={{
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color: 'var(--text-main, #0f172a)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {ord.title || 'Custom Studio Order'}
                        </div>

                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-main, #334155)' }}>
                            {ord.clientName || ord.client_name || 'Client'}
                          </span>
                          {ord.clientEmail && (
                            <>
                              <span>•</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', whiteSpace: 'nowrap' }}>
                                {ord.clientEmail}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price + Status + Quick Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-main, #0f172a)' }}>
                          ${parseFloat(ord.price || 0).toFixed(2)}
                        </div>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: isPaid ? '#15803d' : '#b45309',
                          background: isPaid ? '#dcfce7' : '#fef3c7',
                          padding: '0.05rem 0.35rem',
                          borderRadius: '4px'
                        }}>
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        border: `1px solid ${statusBadge.border}`,
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px'
                      }}>
                        {statusBadge.label}
                      </span>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {ord.clientEmail && (
                          <button
                            type="button"
                            onClick={() => handleOpenChat(ord.clientEmail)}
                            title="Chat with customer"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#2563eb',
                              borderRadius: '8px',
                              padding: '0.35rem 0.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <MessageSquare size={13} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOrderClick(ord)}
                          style={{
                            background: 'var(--navy-900, #0f172a)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          Manage ➔
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Queue Footer */}
          {filteredQueue.length > 7 && (
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border-color, #cbd5e1)',
                background: 'var(--bg-subtle, #f8fafc)',
                color: 'var(--text-main, #0f172a)',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              View all {filteredQueue.length} orders in dedicated management table ➔
            </button>
          )}
        </div>

        {/* RIGHT COLUMN: PRIORITY ALERTS & STUDIO CAPACITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* WIDGET 1: PRIORITY ALERTS CARD */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: '1rem 1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Zap size={16} style={{ color: '#ea580c' }} />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Priority Action Items
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Unread Customer Inquiries */}
              <div 
                onClick={() => setActiveTab('chat')}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '10px',
                  background: adminUnreadCount > 0 ? '#eff6ff' : 'var(--bg-subtle, #f8fafc)',
                  border: adminUnreadCount > 0 ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare size={15} style={{ color: adminUnreadCount > 0 ? '#2563eb' : '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      Customer Messages
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
                      {adminUnreadCount > 0 ? `${adminUnreadCount} new unread inquiries` : 'All conversations answered'}
                    </div>
                  </div>
                </div>
                {adminUnreadCount > 0 ? (
                  <span style={{ background: '#2563eb', color: '#ffffff', fontSize: '0.68rem', fontWeight: 900, borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                    {adminUnreadCount} new
                  </span>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 800 }}>Clear ✓</span>
                )}
              </div>

              {/* Pending Specs Verification */}
              <div 
                onClick={() => { setSelectedStatus('pending'); }}
                role="button"
                tabIndex={0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.8rem',
                  borderRadius: '10px',
                  background: pendingJobs.length > 0 ? '#fff7ed' : 'var(--bg-subtle, #f8fafc)',
                  border: pendingJobs.length > 0 ? '1.5px solid #fed7aa' : '1px solid #e2e8f0',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} style={{ color: pendingJobs.length > 0 ? '#ea580c' : '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                      Pending Order Review
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
                      {pendingJobs.length} orders awaiting specs check
                    </div>
                  </div>
                </div>
                <span style={{ background: '#ea580c', color: '#ffffff', fontSize: '0.68rem', fontWeight: 900, borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                  {pendingJobs.length}
                </span>
              </div>

              {/* Rush Orders */}
              {rushJobs.length > 0 && (
                <div 
                  onClick={() => setActiveTab('orders')}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={15} style={{ color: '#dc2626' }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b' }}>
                        🔥 Rush Production Queue
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#b91c1c' }}>
                        {rushJobs.length} urgent priority orders
                      </div>
                    </div>
                  </div>
                  <span style={{ background: '#dc2626', color: '#ffffff', fontSize: '0.68rem', fontWeight: 900, borderRadius: '9999px', padding: '0.1rem 0.5rem' }}>
                    {rushJobs.length} Rush
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WIDGET 2: SERVICE CAPACITY DISTRIBUTION */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: '1rem 1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', margin: 0 }}>
                Service Capacity & Share
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', fontWeight: 600 }}>
                Volume breakdown
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Embroidery */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-main, #0f172a)' }}>🧵 Embroidery Digitizing</span>
                  <span style={{ color: '#ea580c' }}>{categoryStats.embroidery.count} Jobs ({categoryStats.embroidery.pct}%)</span>
                </div>
                <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.embroidery.pct}%`, height: '100%', background: 'linear-gradient(90deg, #ea580c, #fb923c)', borderRadius: '9999px' }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', textAlign: 'right' }}>
                  ${categoryStats.embroidery.revenue.toFixed(2)} generated
                </div>
              </div>

              {/* Vector */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-main, #0f172a)' }}>✒️ Vector Art Redraw</span>
                  <span style={{ color: '#2563eb' }}>{categoryStats.vector.count} Jobs ({categoryStats.vector.pct}%)</span>
                </div>
                <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.vector.pct}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '9999px' }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', textAlign: 'right' }}>
                  ${categoryStats.vector.revenue.toFixed(2)} generated
                </div>
              </div>

              {/* Patches */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-main, #0f172a)' }}>🏷️ Custom Physical Patches</span>
                  <span style={{ color: '#9333ea' }}>{categoryStats.patches.count} Jobs ({categoryStats.patches.pct}%)</span>
                </div>
                <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${categoryStats.patches.pct}%`, height: '100%', background: 'linear-gradient(90deg, #9333ea, #c084fc)', borderRadius: '9999px' }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', marginTop: '2px', textAlign: 'right' }}>
                  ${categoryStats.patches.revenue.toFixed(2)} generated
                </div>
              </div>
            </div>
          </div>

          {/* WIDGET 3: STUDIO QUICK SHORTCUTS */}
          <div style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border-color, #e2e8f0)',
            borderRadius: '16px',
            padding: '1rem 1.15rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main, #0f172a)', margin: '0 0 0.65rem' }}>
              Studio Control Shortcuts
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => setIsPricingSettingsOpen(true)}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Sliders size={13} style={{ color: '#ea580c' }} />
                <span>Pricing Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('clients')}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Users size={13} style={{ color: '#2563eb' }} />
                <span>Client Wallets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <Layers size={13} style={{ color: '#9333ea' }} />
                <span>Work Gallery</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings-theme')}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '10px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  color: 'var(--text-main, #0f172a)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <ShieldCheck size={13} style={{ color: '#16a34a' }} />
                <span>Brand & SEO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {isOfferModalOpen && (
        <AdminCreateOfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          conversationId="inbox-general"
          clientName="Customer"
          clientEmail=""
          onOfferCreated={() => {
            setIsOfferModalOpen(false);
            if (showToast) showToast('Custom Offer created & saved to database!', 'success');
          }}
          showToast={showToast}
        />
      )}

      {lightboxOrder && (
        <ArtworkLightboxModal
          order={lightboxOrder}
          onClose={() => setLightboxOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminExecutiveDashboard;
