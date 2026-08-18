'use client';

import React, { useState } from 'react';
import { useAppState, formatOrderId, formatDimensions, formatFabric } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { 
  CheckCircle, 
  Search, 
  ChevronRight,
  ZoomIn,
  Clock,
  MessageSquare,
  AlertCircle,
  Truck,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  FileCode,
  LockKeyhole
} from 'lucide-react';

const statusLabels = {
  'draft': 'Draft',
  'submitted': 'Submitted',
  'under_review': 'Under Review',
  'modification_required': 'Modification Required',
  'resubmitted': 'Resubmitted',
  'approved': 'Approved',
  'processing': 'Processing',
  'in_progress': 'In Progress',
  'digitizing': 'Digitizing',
  'assigned': 'Assigned',
  'qc': 'Quality Check',
  'ready_for_delivery': 'Ready for Delivery',
  'awaiting_delivery_approval': 'Awaiting Delivery Approval',
  'in_delivery': 'In Delivery',
  'delivered': 'Delivered',
  'completed': 'Completed',
  'revision': 'Modification Required',
  'cancelled': 'Cancelled',
  'rejected': 'Rejected'
};

export const OrderManagementTable = () => {
  const { 
    orders = [], 
    setSelectedOrderForDrawer,
    ORDER_STATUSES,
    updateOrderStatus,
    approveOrderSpecification,
    dispatchOrderDelivery,
    authUser
  } = useAppState();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'embroidery' | 'vector' | 'patch'
  const [filterPayment, setFilterPayment] = useState('all'); // 'all' | 'paid' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Reset to page 1 whenever filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCategory, filterPayment, searchTerm]);

  const getIsOrderPaid = (ord) => {
    const statusLower = (ord?.status || '').toLowerCase();
    const payStatusLower = (ord?.paymentStatus || ord?.payment_status || '').toLowerCase();
    const isPaidFlag = ord?.isPaid === true || ord?.paid === true;

    return isPaidFlag || 
           payStatusLower === 'paid' || 
           payStatusLower === 'completed' || 
           payStatusLower === 'verified' ||
           payStatusLower === 'wallet' ||
           ['in_progress', 'processing', 'approved', 'ready_for_delivery', 'in_delivery', 'delivered', 'completed'].includes(statusLower);
  };

  const filteredOrders = orders.filter(ord => {
    const titleText = (ord?.title || ord?.description || '').toLowerCase();
    const idText = (ord?.id || '').toLowerCase();
    const clientNameText = (ord?.clientName || ord?.clientEmail || '').toLowerCase();
    const matchesSearch = titleText.includes(searchTerm.toLowerCase()) || 
                          idText.includes(searchTerm.toLowerCase()) ||
                          clientNameText.includes(searchTerm.toLowerCase());

    const ordType = (ord?.type || '').toLowerCase();
    const ordCat = (ord?.serviceCategory || '').toLowerCase();

    let matchesCategory = true;
    if (filterCategory === 'embroidery') {
      matchesCategory = ordType === 'embroidery' || ordType === 'digitizing' || (!ordType && !ordCat.includes('vector') && !ordCat.includes('patch'));
    } else if (filterCategory === 'vector') {
      matchesCategory = ordType === 'vector' || ordCat.includes('vector');
    } else if (filterCategory === 'patch') {
      matchesCategory = ordType === 'patch' || ordType === 'patches' || ordCat.includes('patch');
    }

    if (!matchesCategory) return false;

    if (filterPayment === 'paid' && !getIsOrderPaid(ord)) return false;
    if (filterPayment === 'pending' && getIsOrderPaid(ord)) return false;

    const s = String(ord?.status || 'submitted').toLowerCase();

    if (filterStatus === 'review') return matchesSearch && (s === 'submitted' || s === 'under_review' || s === 'resubmitted' || !ord?.status);
    if (filterStatus === 'modifications') return matchesSearch && (s === 'modification_required' || s === 'revision');
    if (filterStatus === 'approved') return matchesSearch && s === 'approved';
    if (filterStatus === 'processing') return matchesSearch && (s === 'processing' || s === 'in_progress' || s === 'digitizing' || s === 'assigned' || s === 'qc');
    if (filterStatus === 'ready_for_delivery') return matchesSearch && (s === 'ready_for_delivery' || s === 'awaiting_delivery_approval');
    if (filterStatus === 'in_delivery') return matchesSearch && s === 'in_delivery';
    if (filterStatus === 'delivered') return matchesSearch && s === 'delivered';
    if (filterStatus === 'completed') return matchesSearch && s === 'completed';
    if (filterStatus === 'cancelled') return matchesSearch && (s === 'cancelled' || s === 'rejected');
    return matchesSearch;
  });

  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalOrders);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getPaymentBadge = (ord) => {
    const isPaid = getIsOrderPaid(ord);

    if (isPaid) {
      return (
        <span 
          className="badge" 
          style={{ 
            background: '#dcfce7', 
            color: '#15803d', 
            border: '1px solid #bbf7d0',
            fontWeight: 800,
            fontSize: '0.725rem',
            padding: '0.22rem 0.55rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            whiteSpace: 'nowrap'
          }}
          title="Payment Verified & Settled"
        >
          <CheckCircle size={12} style={{ color: '#16a34a' }} /> PAID
        </span>
      );
    }

    return (
      <span 
        className="badge" 
        style={{ 
          background: '#fff7ed', 
          color: '#c2410c', 
          border: '1px solid #ffedd5',
          fontWeight: 800,
          fontSize: '0.725rem',
          padding: '0.22rem 0.55rem',
          borderRadius: '9999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          whiteSpace: 'nowrap'
        }}
        title="Payment Unpaid / Pending Checkout"
      >
        <Clock size={12} style={{ color: '#ea580c' }} /> PENDING
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'submitted').toLowerCase();
    switch (s) {
      case 'draft':
        return <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 800 }}>Draft</span>;
      case 'submitted':
        return <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 800 }}>🔴 New Submitted</span>;
      case 'under_review':
        return <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 800 }}>Under Review</span>;
      case 'modification_required':
      case 'revision':
        return <span className="badge" style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: 800 }}>⚠️ Mod Requested</span>;
      case 'resubmitted':
        return <span className="badge" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', fontWeight: 800 }}>Resubmitted</span>;
      case 'approved':
        return <span className="badge" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontWeight: 800 }}>✓ Approved</span>;
      case 'processing':
      case 'in_progress':
      case 'digitizing':
      case 'assigned':
        return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontWeight: 800 }}>⚡ In Production</span>;
      case 'qc':
        return <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', fontWeight: 800 }}>QC Check</span>;
      case 'ready_for_delivery':
      case 'awaiting_delivery_approval':
        return <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800 }}>✨ Ready for Delivery</span>;
      case 'in_delivery':
        return <span className="badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 800 }}>🚚 In Delivery</span>;
      case 'delivered':
        return <span className="badge" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', fontWeight: 800 }}>📦 Delivered</span>;
      case 'completed':
        return <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #6ee7b7', fontWeight: 800 }}>✅ Completed</span>;
      case 'rejected':
      case 'cancelled':
        return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', fontWeight: 800 }}>❌ Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const formatPlacementTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="card" style={{ padding: 'clamp(0.85rem, 2vw, 1.5rem)', background: '#ffffff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(15, 23, 42, 0.05)' }}>
      
      {/* Controls & B2B Lifecycle Filter Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('all')}
            style={{ fontWeight: 800 }}
          >
            All Orders ({orders.length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'review' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('review')}
            style={{ fontWeight: 800 }}
          >
            🔴 Review ({orders.filter(o => o.status === 'submitted' || o.status === 'under_review' || o.status === 'resubmitted' || !o.status).length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'modifications' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('modifications')}
            style={{ fontWeight: 800 }}
          >
            ⚠️ Changes ({orders.filter(o => o.status === 'modification_required' || o.status === 'revision').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'approved' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('approved')}
            style={{ fontWeight: 800 }}
          >
            ✓ Approved ({orders.filter(o => o.status === 'approved').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'processing' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('processing')}
            style={{ fontWeight: 800 }}
          >
            ⚡ Production ({orders.filter(o => ['processing', 'in_progress', 'digitizing', 'assigned', 'qc'].includes(o.status)).length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'ready_for_delivery' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('ready_for_delivery')}
            style={{ fontWeight: 800 }}
          >
            ✨ Ready Dispatch ({orders.filter(o => o.status === 'ready_for_delivery' || o.status === 'awaiting_delivery_approval').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'in_delivery' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('in_delivery')}
            style={{ fontWeight: 800 }}
          >
            🚚 In Delivery ({orders.filter(o => o.status === 'in_delivery').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'delivered' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('delivered')}
            style={{ fontWeight: 800 }}
          >
            📦 Delivered ({orders.filter(o => o.status === 'delivered').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('completed')}
            style={{ fontWeight: 800 }}
          >
            ✅ Completed ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        {/* Category, Payment & Search Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '650px' }}>
          {/* Category Dropdown Filter */}
          <select
            className="form-control"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ minWidth: '140px', flex: '1 1 auto', fontWeight: 800, fontSize: '0.825rem', background: '#ffffff', color: 'var(--navy-900)' }}
          >
            <option value="all">📂 All Categories</option>
            <option value="embroidery">🧵 Embroidery</option>
            <option value="vector">📐 Vector Tracing</option>
            <option value="patch">📦 Custom Patches</option>
          </select>

          {/* Payment Filter */}
          <select
            className="form-control"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            style={{ minWidth: '130px', flex: '1 1 auto', fontWeight: 800, fontSize: '0.825rem', background: '#ffffff', color: 'var(--navy-900)' }}
          >
            <option value="all">💳 All Payments</option>
            <option value="paid">✅ Paid Only</option>
            <option value="pending">🕒 Pending Only</option>
          </select>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '180px', flex: '1 1 auto' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              className="form-control"
              placeholder="Search order, client, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.1rem', fontSize: '0.825rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Orders Table with Dedicated Scroll Viewport */}
      <div 
        className="table-responsive"
        style={{ 
          maxHeight: '620px', 
          overflowY: 'auto', 
          overflowX: 'auto', 
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          background: '#ffffff',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <tr style={{ 
              borderBottom: '2px solid var(--border-color)', 
              color: 'var(--navy-900)',
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '0.85rem 1rem' }}>ORDER / ID</th>
              <th style={{ padding: '0.85rem 1rem' }}>CLIENT ACCOUNT</th>
              <th style={{ padding: '0.85rem 1rem' }}>VERSION & APPROVAL</th>
              <th style={{ padding: '0.85rem 1rem' }}>SERVICE</th>
              <th style={{ padding: '0.85rem 1rem' }}>PRICE</th>
              <th style={{ padding: '0.85rem 1rem' }}>PAYMENT</th>
              <th style={{ padding: '0.85rem 1rem' }}>STATUS</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>ARTWORK</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>OPERATIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found matching the current filters.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((ord) => {
                const artworkImg = 
                  ord.artworkUrl || 
                  ord.image_url || 
                  ord.logo || 
                  ord.uploadedFiles?.[0]?.url || 
                  ord.uploadedFiles?.[0]?.public_url || 
                  ord.placementItems?.[0]?.files?.[0]?.url || 
                  ord.patchItems?.[0]?.files?.[0]?.url || 
                  ord.vectorItems?.[0]?.files?.[0]?.url || 
                  ord.order_files?.[0]?.public_url || 
                  ord.order_files?.[0]?.file_url || 
                  ord.file_path || 
                  ord.file_url || 
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                const msgCount = ord.messages?.length || 0;
                const currentVer = ord.currentVersion || (Array.isArray(ord.versions) ? ord.versions.length : 1);

                return (
                  <tr 
                    key={ord.id}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s ease' }}
                    className="order-table-row"
                  >
                    {/* 1. ORDER */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span>{ord.title || 'Untitled Order'}</span>
                        {ord.isRush && <span className="badge badge-rush" style={{ fontSize: '0.625rem', padding: '0.1rem 0.4rem' }}>⚡ RUSH</span>}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: 'var(--orange-600)', background: '#fff7ed', padding: '0.05rem 0.4rem', borderRadius: '4px', border: '1px solid #ffedd5' }}>
                          {formatOrderId(ord.id)}
                        </span>
                        <span>•</span>
                        <span>📅 {formatPlacementTime(ord.createdAt)}</span>
                      </div>
                    </td>

                    {/* 2. ACCOUNT */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '0.85rem' }}>
                        {ord.clientName || 'Client Account'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                        ✉️ {ord.clientEmail || 'client@bdigitizing.pro'}
                      </div>
                    </td>

                    {/* 3. VERSION & APPROVAL */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                            v{currentVer}
                          </span>
                          {ord.approvedVersion ? (
                            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.1rem 0.4rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                              ✓ Appr v{ord.approvedVersion}
                            </span>
                          ) : (
                            <span style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.7rem', fontWeight: 600 }}>
                              Pending
                            </span>
                          )}
                        </div>
                        {ord.modificationRequest && !ord.modificationRequest.resolved && (
                          <span style={{ color: '#e11d48', fontSize: '0.68rem', fontWeight: 800 }}>
                            ⚠️ Mod Pending
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. SERVICE */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)', fontSize: '0.825rem' }}>
                        {ord.serviceCategory || ord.type || 'Embroidery Digitizing'}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatDimensions(ord.dimensions || ord.size)} • {formatFabric(ord.fabric || ord.fabricType)}
                      </div>
                    </td>

                    {/* 5. PRICE */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy-950)', fontSize: '0.925rem' }}>
                        ${parseFloat(ord.price || 15).toFixed(2)}
                      </div>
                    </td>

                    {/* 6. PAYMENT */}
                    <td style={{ padding: '1rem' }}>
                      {getPaymentBadge(ord)}
                    </td>

                    {/* 7. STATUS */}
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(ord.status)}
                    </td>

                    {/* 8. ARTWORK */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div 
                        style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}
                        onClick={() => setLightboxOrder(ord)}
                        title="Inspect full resolution artwork"
                      >
                        <img 
                          src={artworkImg} 
                          alt={ord.title} 
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                          }}
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '8px', 
                            objectFit: 'cover', 
                            border: '1.5px solid var(--orange-500)', 
                            background: '#f1f5f9',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          bottom: '-4px',
                          right: '-4px',
                          background: 'var(--navy-900)',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          <ZoomIn size={10} />
                        </span>
                      </div>
                    </td>

                    {/* 9. OPERATIONS */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        <button 
                          className="btn btn-primary-orange btn-sm"
                          onClick={() => setSelectedOrderForDrawer(ord)}
                          style={{ fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap', gap: '0.3rem', padding: '0.35rem 0.75rem' }}
                        >
                          Project Desk <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDrawer(ord)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Open project activity timeline"
                        >
                          <MessageSquare size={12} style={{ color: 'var(--orange-500)' }} />
                          {msgCount > 0 ? `${msgCount} Messages` : 'Audit Timeline'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Stats Controls */}
      {filteredOrders.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.9rem 1.25rem',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing <strong style={{ color: 'var(--navy-900)' }}>{startIndex + 1}</strong> to <strong style={{ color: 'var(--navy-900)' }}>{endIndex}</strong> of <strong style={{ color: 'var(--orange-600)' }}>{totalOrders}</strong> orders
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="form-control"
                style={{ width: '65px', padding: '0.25rem 0.4rem', fontSize: '0.8rem', height: '32px' }}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button 
                type="button"
                onClick={() => setCurrentPage(1)} 
                disabled={validCurrentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                title="First Page"
              >
                «
              </button>
              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={validCurrentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCurrentPage === 1 ? 0.4 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
                title="Previous Page"
              >
                ‹ Prev
              </button>

              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.5rem', color: 'var(--navy-900)' }}>
                Page {validCurrentPage} of {totalPages}
              </span>

              <button 
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={validCurrentPage >= totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCurrentPage >= totalPages ? 0.4 : 1, cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                title="Next Page"
              >
                Next ›
              </button>
              <button 
                type="button"
                onClick={() => setCurrentPage(totalPages)} 
                disabled={validCurrentPage >= totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: validCurrentPage >= totalPages ? 0.4 : 1, cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Artwork Inspection Lightbox Modal */}
      {lightboxOrder && (
        <ArtworkLightboxModal 
          order={lightboxOrder} 
          onClose={() => setLightboxOrder(null)} 
        />
      )}

    </div>
  );
};
