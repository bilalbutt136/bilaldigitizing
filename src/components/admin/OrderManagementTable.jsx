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
    if (filterStatus === 'digitizing') return matchesSearch && (ord?.status === 'digitizing' || ord?.status === 'qc' || ord?.status === 'assigned');
    if (filterStatus === 'completed') return matchesSearch && ord?.status === 'completed';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="badge badge-submitted">Brief Submitted</span>;
      case 'assigned':
      case 'digitizing':
        return <span className="badge badge-digitizing">Digitizing In Progress</span>;
      case 'qc':
        return <span className="badge badge-qc">Quality Control Simulation</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('all')}
          >
            All Briefs ({orders.length})
          </button>
          <button 
            className={`btn btn-sm ${filterStatus === 'submitted' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('submitted')}
          >
            New Submissions ({orders.filter(o => o.status === 'submitted').length})
          </button>
          <button 
            className={`btn btn-sm ${filterStatus === 'digitizing' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('digitizing')}
          >
            In Digitizing / QC ({orders.filter(o => o.status === 'digitizing' || o.status === 'qc').length})
          </button>
          <button 
            className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary-orange' : 'btn-outline'}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({orders.filter(o => o.status === 'completed').length})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" 
            className="form-control"
            placeholder="Search order, client, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
      </div>

      {/* Orders Table - Clean 5 Column Grid Layout */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
              <th style={{ padding: '0.75rem 1rem', width: '32%' }}>Uploaded Artwork & Brief</th>
              <th style={{ padding: '0.75rem 1rem', width: '22%' }}>Client & Category</th>
              <th style={{ padding: '0.75rem 1rem', width: '24%' }}>Stage Timeline & Status</th>
              <th style={{ padding: '0.75rem 1rem', width: '10%' }}>Fee</th>
              <th style={{ padding: '0.75rem 1rem', width: '12%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((ord) => (
              <tr 
                key={ord.id}
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                {/* Title & Interactive Lightbox Artwork Thumbnail */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div 
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => setLightboxOrder(ord)}
                      title="Click to inspect full artwork in Lightbox"
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
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(15, 23, 42, 0.4)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          opacity: 0,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                      >
                        <ZoomIn size={16} />
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy-900)' }}>
                        {ord.title}
                        {ord.isRush && <span className="badge badge-rush" style={{ marginLeft: 6, fontSize: '0.65rem' }}>RUSH</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ID: <strong>{formatOrderId(ord.id)}</strong> • {ord.dimensions?.width}x{ord.dimensions?.height}"
                      </div>
                    </div>
                  </div>
                </td>

                {/* Client & Category */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{ord.clientName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.serviceCategory}</div>
                </td>

                {/* Status & Streamlined Stage Controls */}
                <td style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.35rem' }}>{getStatusBadge(ord.status)}</div>
                  
                  {/* Streamlined Quick Status Advance Controls */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {ord.status === 'submitted' && (
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                        onClick={() => updateOrderStatus(ord.id, 'digitizing')}
                      >
                        <Play size={10} /> Start Production
                      </button>
                    )}
                    {(ord.status === 'digitizing' || ord.status === 'assigned') && (
                      <button 
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                        onClick={() => updateOrderStatus(ord.id, 'qc')}
                      >
                        Pass QC Test
                      </button>
                    )}
                    {(ord.status === 'qc' || ord.status === 'digitizing') && (
                      <button 
                        className="btn btn-primary-orange btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                        onClick={() => updateOrderStatus(ord.id, 'completed', { outputFileUrl: `${ord.title.replace(/\s+/g, '_')}.dst` })}
                      >
                        <CheckCircle size={11} /> Mark Completed
                      </button>
                    )}
                  </div>
                </td>

                {/* Fee */}
                <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                  ${parseFloat(ord.price).toFixed(2)}
                </td>

                {/* Actions */}
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedOrderForDrawer(ord)}
                  >
                    Inspect Brief <ChevronRight size={14} />
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
