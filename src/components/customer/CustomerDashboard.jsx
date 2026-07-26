import React, { useState } from 'react';
import { useAppState, formatOrderId } from '../../context/StateContext';
import { ArtworkLightboxModal } from '../common/ArtworkLightboxModal';
import { 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Search, 
  FileText, 
  ChevronRight,
  Zap,
  Filter,
  DollarSign,
  ZoomIn,
  Wallet
} from 'lucide-react';
import { UserMenuDropdown } from '../common/UserMenuDropdown';
import { ClientLiveChatWidget } from './ClientLiveChatWidget';

const DEFAULT_USER = {
  name: 'Sarah Jenkins',
  email: 'sarah@apexapparel.com',
  company: 'Apex Athletics Apparel',
  role: 'customer'
};

export const CustomerDashboard = () => {
  const { 
    orders = [], 
    authUser,
    currentUser, 
    setIsOrderWizardOpen, 
    setSelectedOrderForDrawer,
    walletBalance = 150.00,
    setIsDepositModalOpen
  } = useAppState();

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);

  // Safe User Resolution
  const activeUser = authUser || currentUser || DEFAULT_USER;
  const userEmail = activeUser?.email || DEFAULT_USER.email;

  // Filter client's orders
  const myOrders = (orders || []).filter(o => o?.clientEmail === userEmail || o?.clientEmail === 'sarah@apexapparel.com');

  const activeOrders = myOrders.filter(o => o?.status !== 'completed');
  const completedOrders = myOrders.filter(o => o?.status === 'completed');
  const revisionOrders = myOrders.filter(o => o?.revisions && o.revisions.length > 0);

  const totalSpent = myOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);

  const filteredOrdersList = myOrders.filter(o => {
    const titleMatch = (o?.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = (o?.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || idMatch;
    
    if (filterStatus === 'active') return matchesSearch && o?.status !== 'completed';
    if (filterStatus === 'completed') return matchesSearch && o?.status === 'completed';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="badge badge-submitted">Brief Submitted</span>;
      case 'assigned':
        return <span className="badge badge-assigned">Digitizer Assigned</span>;
      case 'digitizing':
        return <span className="badge badge-digitizing">Digitizing In Progress</span>;
      case 'qc':
        return <span className="badge badge-qc">Quality Control Simulation</span>;
      case 'completed':
        return <span className="badge badge-completed">Ready For Download</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '2.5rem 0 4rem', background: 'var(--bg-main)', minHeight: 'calc(100vh - 120px)' }}>
      <div className="container">
        
        {/* Welcome Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
              Client Dashboard
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Welcome back, <strong>{activeUser?.name || DEFAULT_USER.name}</strong> ({activeUser?.company || DEFAULT_USER.company})
            </p>
          </div>

          <button 
            className="btn btn-primary-orange btn-lg"
            onClick={() => setIsOrderWizardOpen(true)}
          >
            <PlusCircle size={20} /> Upload New Design Brief
          </button>
        </div>

        {/* Summary Stat Cards + Wallet Balance Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Wallet Balance Card */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid var(--orange-500)', background: '#fff7ed' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'var(--orange-500)', color: '#ffffff', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <Wallet size={18} />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Studio Wallet</div>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy-950)' }}>${walletBalance.toFixed(2)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Available Deposit Credit</div>
            </div>

            <button 
              className="btn btn-primary-orange btn-sm"
              onClick={() => setIsDepositModalOpen(true)}
              style={{ width: '100%', justifyContent: 'center', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
            >
              + Deposit Funds
            </button>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{activeOrders.length}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Active Digitizing Jobs</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--green-50)', color: 'var(--green-600)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{completedOrders.length}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Completed Downloads</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#fae8ff', color: '#86198f', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{revisionOrders.length}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Revisions Requested</div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--orange-50)', color: 'var(--orange-600)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>${totalSpent.toFixed(2)}</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Total Invoiced Spend</div>
            </div>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="card" style={{ padding: '1.5rem' }}>
          
          {/* Table Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setFilterStatus('all')}
              >
                All Orders ({myOrders.length})
              </button>
              <button 
                className={`btn btn-sm ${filterStatus === 'active' ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setFilterStatus('active')}
              >
                Active ({activeOrders.length})
              </button>
              <button 
                className={`btn btn-sm ${filterStatus === 'completed' ? 'btn-primary-orange' : 'btn-outline'}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed ({completedOrders.length})
              </button>
            </div>

            {/* Search input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="text" 
                className="form-control"
                placeholder="Search order ID or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrdersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={42} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>No orders found matching your search.</p>
              <p style={{ fontSize: '0.85rem' }}>Click "Upload New Design Brief" to place your first embroidery or vector job.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Uploaded Artwork & Design</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Service Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Live Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrdersList.map((ord) => (
                    <tr 
                      key={ord?.id || Math.random()}
                      style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--orange-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Title & Interactive Lightbox Artwork Thumbnail */}
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div 
                            style={{ position: 'relative', cursor: 'pointer' }}
                            onClick={() => setLightboxOrder(ord)}
                            title="Click to inspect full high-res artwork"
                          >
                            <img 
                              src={ord?.artworkUrl || ord?.image_url || ord?.logo || ord?.file_url || ord?.file_path || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80'} 
                              alt={ord?.title || 'Design'} 
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80';
                              }}
                              style={{ width: '54px', height: '54px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '1.5px solid var(--orange-600)' }}
                            />
                            <div style={{
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
                            <div style={{ fontWeight: 700, color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              {ord?.title}
                              {ord?.isRush && <span className="badge badge-rush" style={{ fontSize: '0.65rem' }}>RUSH</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              ID: <strong>{formatOrderId(ord?.id)}</strong> • {ord?.dimensions?.width}x{ord?.dimensions?.height}"
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Service Category */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                          {ord?.type === 'embroidery' ? '🧵 Embroidery Digitizing' : '✒️ Vector Art'}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {ord?.serviceCategory}
                        </div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ord?.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem' }}>
                        {getStatusBadge(ord?.status)}
                      </td>

                      {/* Price */}
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                        ${parseFloat(ord?.price || 0).toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedOrderForDrawer(ord)}
                        >
                          View Brief & Files <ChevronRight size={16} />
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

      {/* Lightbox Inspection Modal */}
      {lightboxOrder && (
        <ArtworkLightboxModal 
          order={lightboxOrder} 
          onClose={() => setLightboxOrder(null)} 
        />
      )}

      {/* Floating Live Chat Support Widget */}
      <ClientLiveChatWidget />

    </div>
  );
};
