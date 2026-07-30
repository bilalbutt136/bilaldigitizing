'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
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
  Wallet,
  Layers,
  Package,
  ShoppingBag,
  User,
  MessageSquare,
  Settings,
  ShieldCheck,
  CreditCard,
  Building,
  Mail,
  Sliders,
  Bell,
  ArrowRight,
  LogOut
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
  const navigate = useNavigate();
  const { 
    orders = [], 
    authUser,
    currentUser, 
    setIsOrderWizardOpen, 
    setSelectedOrderForDrawer,
    walletBalance = 150.00,
    setIsDepositModalOpen,
    showToast,
    logout
  } = useAppState();

  const [activeTab, setActiveTab] = useState('digitizing'); // 'digitizing' | 'patches' | 'store' | 'profile' | 'support' | 'settings'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxOrder, setLightboxOrder] = useState(null);

  // Safe User Resolution
  const activeUser = authUser || currentUser || DEFAULT_USER;
  const userEmail = activeUser?.email || DEFAULT_USER.email;

  // Strict Category Helper Functions
  const isStoreOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'store' || typeStr === 'digital_product' || Boolean(o?.isStoreItem) || catStr.includes('store') || catStr.includes('download') || catStr.includes('merchandise');
  };

  const isPatchOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'patch' || typeStr === 'patches' || typeStr === 'apparel' || typeStr === 'headwear' || catStr.includes('patch') || catStr.includes('t-shirt') || catStr.includes('headwear');
  };

  const isVectorOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    const catStr = (o?.serviceCategory || '').toLowerCase();
    return typeStr === 'vector' || catStr.includes('vector');
  };

  const isEmbroideryOrder = (o) => {
    const typeStr = (o?.type || '').toLowerCase();
    if (isStoreOrder(o) || isPatchOrder(o) || isVectorOrder(o)) return false;
    return typeStr === 'embroidery' || typeStr === 'digitizing' || typeStr === '' || !o?.type;
  };

  // Filter client's orders by exact service category
  const myOrders = (orders || []).filter(o => o?.clientEmail === userEmail || o?.clientEmail === 'sarah@apexapparel.com');

  // 1. Strictly Embroidery Digitizing Orders ONLY
  const digitizingOrders = myOrders.filter(isEmbroideryOrder);

  // 2. Strictly Custom Patches & Physical Manufactured Goods
  const patchOrders = myOrders.filter(isPatchOrder);

  // 3. Strictly Store & Digital Product Purchases
  const storeOrders = myOrders.filter(isStoreOrder);

  const activeOrders = digitizingOrders.filter(o => o?.status !== 'completed');
  const completedOrders = digitizingOrders.filter(o => o?.status === 'completed');
  const revisionOrders = digitizingOrders.filter(o => o?.revisions && o.revisions.length > 0);

  const totalSpent = myOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);
  const digitizingSpent = digitizingOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);

  const filteredDigitizingOrders = digitizingOrders.filter(o => {
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

  const handleOpenLiveSupport = () => {
    const chatBtn = document.querySelector('.live-chat-floating-button');
    if (chatBtn) {
      chatBtn.click();
    } else if (showToast) {
      showToast('Connecting to 24/7 Live Support Agent...', 'info');
    }
  };

  return (
    <div style={{ padding: '1.5rem 0 3rem', background: 'var(--bg-main)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        
        {/* Main Grid Layout: Left Vertical Sidebar + Right Content Workspace */}
        <div 
          className="dashboard-layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(250px, 270px) 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}
        >

          {/* ==================================================================
              LEFT VERTICAL SIDEBAR NAVIGATION MENU (FULL-HEIGHT STICKY)
             ================================================================== */}
          <aside
            className="dashboard-sidebar-sticky"
            style={{
              background: '#ffffff',
              border: '1.5px solid var(--border-color)',
              borderRadius: '16px',
              padding: '1.25rem 0.85rem',
              boxShadow: 'var(--shadow-sm)',
              position: 'sticky',
              top: '85px',
              height: 'calc(100vh - 105px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto',
              zIndex: 10
            }}
          >
            <div>
              {/* Studio User Header Badge */}
              <div
                style={{
                  padding: '0.95rem 0.85rem',
                  background: 'linear-gradient(135deg, var(--navy-950) 0%, #0f172a 100%)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--orange-500), #e66e00)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.15rem',
                    boxShadow: '0 4px 14px rgba(255, 122, 0, 0.35)',
                    flexShrink: 0
                  }}>
                    {(activeUser?.name || 'S')[0].toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.925rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeUser?.name || DEFAULT_USER.name}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeUser?.company || DEFAULT_USER.company}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.08)', padding: '0.4rem 0.65rem', borderRadius: '8px', fontSize: '0.75rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Wallet Credit:</span>
                  <strong style={{ color: 'var(--orange-400)', fontWeight: 800 }}>${walletBalance.toFixed(2)}</strong>
                </div>
              </div>

              {/* Sidebar Menu Header */}
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem 0.55rem' }}>
                Client Studio Navigation
              </div>

              {/* 6 Clean Navigation Tabs */}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                
                {/* Tab 1: Embroidery Digitizing */}
                <button
                  type="button"
                  onClick={() => setActiveTab('digitizing')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: activeTab === 'digitizing' ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                    background: activeTab === 'digitizing' ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                    color: activeTab === 'digitizing' ? 'var(--orange-600)' : 'var(--navy-800)',
                    fontWeight: activeTab === 'digitizing' ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Layers size={18} style={{ color: activeTab === 'digitizing' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                    <span>Embroidery Digitizing</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, background: activeTab === 'digitizing' ? 'var(--orange-500)' : 'var(--navy-100)', color: activeTab === 'digitizing' ? '#ffffff' : 'var(--navy-700)', padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>
                    {digitizingOrders.length}
                  </span>
                </button>

                {/* Tab 2: Custom Patches & Goods */}
                <button
                  type="button"
                  onClick={() => setActiveTab('patches')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: activeTab === 'patches' ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                    background: activeTab === 'patches' ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                    color: activeTab === 'patches' ? 'var(--orange-600)' : 'var(--navy-800)',
                    fontWeight: activeTab === 'patches' ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Package size={18} style={{ color: activeTab === 'patches' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                    <span>Custom Patches & Goods</span>
                  </div>
                  {patchOrders.length > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: activeTab === 'patches' ? 'var(--orange-500)' : 'var(--navy-100)', color: activeTab === 'patches' ? '#ffffff' : 'var(--navy-700)', padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>
                      {patchOrders.length}
                    </span>
                  )}
                </button>

                {/* Tab 3: Account & Profile */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: activeTab === 'profile' ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                    background: activeTab === 'profile' ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                    color: activeTab === 'profile' ? 'var(--orange-600)' : 'var(--navy-800)',
                    fontWeight: activeTab === 'profile' ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <User size={18} style={{ color: activeTab === 'profile' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                    <span>Account & Profile</span>
                  </div>
                </button>

                {/* Tab 5: Live Support Chat */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('support');
                    handleOpenLiveSupport();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: activeTab === 'support' ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                    background: activeTab === 'support' ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                    color: activeTab === 'support' ? 'var(--orange-600)' : 'var(--navy-800)',
                    fontWeight: activeTab === 'support' ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <MessageSquare size={18} style={{ color: activeTab === 'support' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                    <span>Live Support Chat</span>
                  </div>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} title="Studio Live 24/7" />
                </button>

                {/* Tab 6: Settings */}
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '10px',
                    border: activeTab === 'settings' ? '1.5px solid var(--orange-500)' : '1.5px solid transparent',
                    background: activeTab === 'settings' ? 'linear-gradient(135deg, rgba(255,122,0,0.14) 0%, rgba(255,122,0,0.06) 100%)' : 'transparent',
                    color: activeTab === 'settings' ? 'var(--orange-600)' : 'var(--navy-800)',
                    fontWeight: activeTab === 'settings' ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Settings size={18} style={{ color: activeTab === 'settings' ? 'var(--orange-600)' : 'var(--navy-600)' }} />
                    <span>Settings</span>
                  </div>
                </button>

              </nav>
            </div>

            {/* Sidebar Bottom Footer Badge */}
            <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px dashed var(--border-color)' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                  24/7 Studio Systems Operational
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{ flex: 1, padding: '0.35rem 0.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-900)', cursor: 'pointer' }}
                  >
                    Public Site
                  </button>
                  {logout && (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                      style={{ padding: '0.35rem 0.6rem', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e11d48', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <LogOut size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

          </aside>

          {/* ==================================================================
              RIGHT CONTENT WORKSPACE PANE
             ================================================================== */}
          <main style={{ minWidth: 0 }}>
            
            {/* TAB 1: EMBROIDERY DIGITIZING & MAIN DASHBOARD */}
            {activeTab === 'digitizing' && (
              <>
                {/* Welcome Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.75rem',
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.15rem',
                  marginBottom: '2rem'
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
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button 
                        type="button"
                        onClick={() => setFilterStatus('all')}
                        style={{
                          background: filterStatus === 'all' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'all' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'all' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'all' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'all' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        All Orders ({myOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('active')}
                        style={{
                          background: filterStatus === 'active' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'active' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'active' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'active' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'active' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        Active Orders ({activeOrders.length})
                      </button>

                      <button 
                        type="button"
                        onClick={() => setFilterStatus('completed')}
                        style={{
                          background: filterStatus === 'completed' ? '#ff7a00' : '#f8fafc',
                          backgroundColor: filterStatus === 'completed' ? '#ff7a00' : '#f8fafc',
                          color: filterStatus === 'completed' ? '#ffffff' : 'var(--navy-800)',
                          border: filterStatus === 'completed' ? '1.5px solid #ff7a00' : '1.5px solid var(--border-color)',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          padding: '0.5rem 1.15rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          boxShadow: filterStatus === 'completed' ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                          transition: 'all 0.18s ease'
                        }}
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
                  {filteredDigitizingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <FileText size={42} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
                      <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>No embroidery digitizing orders found matching your search.</p>
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
                          {filteredDigitizingOrders.map((ord) => (
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
              </>
            )}

            {/* TAB 2: CUSTOM PATCHES & MANUFACTURED GOODS */}
            {activeTab === 'patches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem' }}>
                        Custom Patches & Physical Manufactured Goods
                      </h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                        Manage custom physical embroidered patches, leather emblems, screen-printed T-shirts, and 3D puff hats ({patchOrders.length} order{patchOrders.length !== 1 ? 's' : ''}).
                      </p>
                    </div>
                    <button
                      className="btn btn-primary-orange"
                      onClick={() => navigate('/custom-patches')}
                    >
                      <PlusCircle size={18} /> Order Custom Patches
                    </button>
                  </div>

                  {/* Patch Orders List Table */}
                  {patchOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                      <Package size={38} style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }} />
                      <h4 style={{ fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem' }}>No Physical Patch Orders Yet</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Configure custom embroidered, leather, or woven patches with low minimums.</p>
                      <button className="btn btn-primary-orange btn-sm" onClick={() => navigate('/custom-patches')}>
                        Create Patch Order
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--navy-700)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Patch Artwork & Title</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Manufacturing Specs</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Date Submitted</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Production Status</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
                            <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patchOrders.map((ord) => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                  <img 
                                    src={ord.artworkUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=120&q=80'} 
                                    alt={ord.title}
                                    style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid var(--orange-500)' }} 
                                  />
                                  <div>
                                    <div style={{ fontWeight: 800, color: 'var(--navy-900)' }}>{ord.title}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: {formatOrderId(ord.id)}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--navy-800)' }}>{ord.serviceCategory}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Qty: <strong>{ord.quantity || 100} Pcs</strong> • {ord.backing || 'Velcro Backing'}
                                </div>
                              </td>
                              <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span className="badge badge-digitizing">In Manufacturing</span>
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                                ${parseFloat(ord.price || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '1rem', textAlign: 'right' }}>
                                <button className="btn btn-outline btn-sm" onClick={() => setSelectedOrderForDrawer(ord)}>
                                  View Brief & Tracking <ChevronRight size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ maxWidth: '600px', marginTop: '1.5rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ background: '#fff7ed', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '10px', display: 'inline-flex', marginBottom: '0.85rem' }}>
                        <Package size={24} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>Custom Woven, Embroidered & PVC Patches</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.15rem' }}>
                        Iron-on, velcro, or sew-on backing options with merrowed borders and custom die-cut shapes shipped worldwide.
                      </p>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate('/custom-patches')} style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}>
                        Configure Custom Patches Order <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT & PROFILE */}
            {activeTab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Client Profile & Studio Account
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.name || DEFAULT_USER.name}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.email || DEFAULT_USER.email}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company / Brand</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>{activeUser?.company || DEFAULT_USER.company}</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Studio Deposit Credit</label>
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--orange-600)', marginTop: '0.2rem' }}>${walletBalance.toFixed(2)}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary-orange" onClick={() => setIsDepositModalOpen(true)}>
                      <Wallet size={18} /> Top-Up Studio Wallet Funds
                    </button>
                    <button className="btn btn-outline" onClick={() => setIsOrderWizardOpen(true)}>
                      <PlusCircle size={18} /> Submit New Design
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LIVE SUPPORT CHAT */}
            {activeTab === 'support' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#ecfdf5', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
                      <MessageSquare size={26} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                        24/7 Studio Live Support Chat
                      </h2>
                      <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Direct Digitizing Engineer Connectivity Online
                      </div>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                    Connect directly with senior pathing digitizers and vector engineers for urgent revisions, stitch adjustment advice, machine format inquiries, or custom quote approvals.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Average Response SLA</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>&lt; 5 Minutes</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>Support Availability</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.2rem' }}>24/7 / 365 Days</div>
                    </div>
                  </div>

                  <button className="btn btn-primary-orange btn-lg" onClick={handleOpenLiveSupport} style={{ fontWeight: 800 }}>
                    <MessageSquare size={20} /> Open Live Chat Window Now
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    Client Studio Preferences & Settings
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                        Default Required Machine Formats
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['.DST (Tajima)', '.PES (Brother)', '.EXP (Melco)', '.EMB (Wilcom)', '.JEF (Janome)'].map(fmt => (
                          <span key={fmt} style={{ background: '#f1f5f9', border: '1px solid var(--border-color)', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-800)' }}>
                            ✓ {fmt}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.25rem' }}>
                      <label style={{ display: 'block', fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                        Notification Alerts
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--navy-800)', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} /> Email notification when order passes Quality Control (QC) & ready to download
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.9rem', color: 'var(--navy-800)', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: 'var(--orange-500)' }} /> Instant SMS update on Super Rush (2-4 hr) order completion
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>

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
