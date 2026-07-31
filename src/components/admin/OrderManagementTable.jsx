'use client';

import React, { useState } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { 
  CheckCircle, 
  Search, 
  ChevronRight,
  ZoomIn,
  Clock,
  Play
} from 'lucide-react';

export const OrderManagementTable = () => {
  const { 
    orders, 
    updateOrderStatus,
    setSelectedOrderForDrawer 
  } = useAppState();

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);

  const filteredOrders = orders.filter(ord => {
    const titleText = (ord?.title || ord?.description || '').toLowerCase();
    const idText = (ord?.id || '').toLowerCase();
    const clientNameText = (ord?.clientName || ord?.clientEmail || '').toLowerCase();
    const matchesSearch = titleText.includes(searchTerm.toLowerCase()) || 
                          idText.includes(searchTerm.toLowerCase()) ||
                          clientNameText.includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'submitted') return matchesSearch && (ord?.status === 'submitted' || !ord?.status);
    if (filterStatus === 'digitizing') return matchesSearch && (ord?.status === 'digitizing' || ord?.status === 'assigned');
    if (filterStatus === 'revision') return matchesSearch && ord?.status === 'revision';
    if (filterStatus === 'delivered') return matchesSearch && (ord?.status === 'delivered' || ord?.status === 'qc');
    if (filterStatus === 'completed') return matchesSearch && ord?.status === 'completed';
    if (filterStatus === 'cancelled') return matchesSearch && ord?.status === 'cancelled';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="badge badge-submitted" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>🔴 New / Pending</span>;
      case 'assigned':
      case 'digitizing':
        return <span className="badge badge-digitizing" style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>⚡ In Progress</span>;
      case 'revision':
        return <span className="badge badge-revision" style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' }}>🔄 In Revision</span>;
      case 'delivered':
      case 'qc':
        return <span className="badge badge-qc" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>📦 Delivered</span>;
      case 'completed':
        return <span className="badge badge-completed" style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>✅ Completed</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>❌ Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Helper to calculate live countdown timer & turnaround metrics
  const getDeliveryCountdown = (ord) => {
    if (ord.status === 'cancelled') {
      return <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.75rem' }}>Order Cancelled</span>;
    }
    if (ord.status === 'completed' || ord.status === 'delivered') {
      return (
        <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle size={13} /> Delivered on time
        </span>
      );
    }

    const createdTime = ord.createdAt ? new Date(ord.createdAt).getTime() : Date.now() - 3600000 * 2;
    const turnaroundHours = ord.turnaroundHours || (ord.isRush ? 4 : 12);
    const deadlineTime = createdTime + (turnaroundHours * 3600 * 1000);
    const diffMs = deadlineTime - Date.now();

    if (diffMs <= 0) {
      const overdueMins = Math.abs(Math.floor(diffMs / 60000));
      const hrs = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return (
        <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          ⚠️ Overdue by {hrs > 0 ? `${hrs}h ` : ''}{mins}m
        </span>
      );
    }

    const totalMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return (
      <span style={{ color: 'var(--orange-600)', fontWeight: 800, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Clock size={13} /> {ord.isRush ? '⚡ Rush ' : ''}{hrs}h {mins}m remaining
      </span>
    );
  };

  const formatPlacementTime = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const getLastUpdatedFormatted = (isoString) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', background: '#ffffff' }}>
      
      {/* Controls & Fiverr Lifecycle Filter Tabs */}
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
            className={`btn btn-sm ${filterStatus === 'submitted' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('submitted')}
            style={{ fontWeight: 800 }}
          >
            🔴 New ({orders.filter(o => o.status === 'submitted' || !o.status).length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'digitizing' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('digitizing')}
            style={{ fontWeight: 800 }}
          >
            ⚡ In Progress ({orders.filter(o => o.status === 'digitizing' || o.status === 'assigned').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'revision' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('revision')}
            style={{ fontWeight: 800 }}
          >
            🔄 In Revision ({orders.filter(o => o.status === 'revision').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'delivered' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('delivered')}
            style={{ fontWeight: 800 }}
          >
            📦 Delivered ({orders.filter(o => o.status === 'delivered' || o.status === 'qc').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('completed')}
            style={{ fontWeight: 800 }}
          >
            ✅ Completed ({orders.filter(o => o.status === 'completed').length})
          </button>

          <button 
            className={`btn btn-sm ${filterStatus === 'cancelled' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('cancelled')}
            style={{ fontWeight: 800 }}
          >
            ❌ Cancelled ({orders.filter(o => o.status === 'cancelled').length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" 
            className="form-control"
            placeholder="Search order title, client, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
      </div>

      {/* Orders Table - Fiverr-Style Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
              <th style={{ padding: '0.75rem 1rem', width: '26%' }}>Artwork & Order Details</th>
              <th style={{ padding: '0.75rem 1rem', width: '18%' }}>Client & Category</th>
              <th style={{ padding: '0.75rem 1rem', width: '24%' }}>Placement Time & Countdown</th>
              <th style={{ padding: '0.75rem 1rem', width: '18%' }}>Lifecycle Stage</th>
              <th style={{ padding: '0.75rem 1rem', width: '14%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((ord) => (
              <tr 
                key={ord.id}
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                {/* Title & Artwork Thumbnail */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div 
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => setLightboxOrder(ord)}
                      title="Click to inspect full artwork"
                    >
                      <img 
                        src={ord.image_url || ord.logo || ord.file_path || ord.file_url || ord.artworkUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'} 
                        alt={ord.title} 
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                        }}
                        style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1.5px solid var(--orange-500)', background: 'var(--slate-100)' }}
                      />
                    </div>

                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>
                        {ord.title}
                        {ord.isRush && <span className="badge badge-rush" style={{ marginLeft: 6, fontSize: '0.65rem' }}>⚡ RUSH</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ID: <strong>{formatOrderId(ord.id)}</strong> • <strong style={{ color: 'var(--navy-900)' }}>${parseFloat(ord.price || 15).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Client & Category */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>{ord.clientName || 'Client Account'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.serviceCategory || 'Embroidery Digitizing'}</div>
                </td>

                {/* Placement Time & Delivery Countdown */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--navy-900)', fontWeight: 600, marginBottom: '0.15rem' }}>
                    📅 {formatPlacementTime(ord.createdAt)}
                  </div>
                  <div style={{ marginBottom: '0.2rem' }}>
                    {getDeliveryCountdown(ord)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Updated {getLastUpdatedFormatted(ord.updatedAt || ord.createdAt)}
                  </div>
                </td>

                {/* Status Selector */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.4rem' }}>{getStatusBadge(ord.status)}</div>

                  <select 
                    value={ord.status || 'submitted'} 
                    onChange={(e) => updateOrderStatus(ord.id, e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', fontWeight: 700, borderRadius: '6px' }}
                  >
                    <option value="submitted">🔴 New / Pending</option>
                    <option value="digitizing">⚡ In Progress / Digitizing</option>
                    <option value="revision">🔄 In Revision</option>
                    <option value="delivered">📦 Delivered</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </td>

                {/* Actions */}
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    className="btn btn-primary-orange btn-sm"
                    onClick={() => setSelectedOrderForDrawer(ord)}
                    style={{ fontWeight: 800, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    Manage & Deliver <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
