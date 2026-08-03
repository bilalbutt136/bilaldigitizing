'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { OrderManagementTable } from './OrderManagementTable';
import { ClientDirectory } from './ClientDirectory';
import { PricingSettingsModal } from './PricingSettingsModal';
import { SiteCmsEditor } from './SiteCmsEditor';
import { ServiceManagementEditor } from './ServiceManagementEditor';
import { AdminChatInbox } from './AdminChatInbox';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Sliders, 
  Users, 
  MessageSquare, 
  Image, 
  Settings, 
  LogOut, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  RefreshCw,
  Menu,
  X,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

export const AdminDashboard = () => {
  const { 
    orders = [], 
    clients = [], 
    setIsPricingSettingsOpen,
    resetAllData,
    authUser,
    isAuthenticated,
    protectedNavigate,
    logout,
    siteSettings = {},
    updateSiteSettings,
    adminUsers = [],
    addAdminUser,
    activeAdminTab = 'dashboard',
    setActiveAdminTab,
    showToast
  } = useAppState();

  const [activeTabState, setActiveTabState] = useState(activeAdminTab || 'dashboard');

  React.useEffect(() => {
    if (activeAdminTab) {
      setActiveTabState(activeAdminTab);
    }
  }, [activeAdminTab]);

  const activeTab = activeTabState;
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (setActiveAdminTab) setActiveAdminTab(tab);
  };
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // New Admin Modal & Form State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Settings State Form
  const [metaPixelId, setMetaPixelId] = useState(siteSettings.metaPixelId || '');
  const [adminEmail, setAdminEmail] = useState(authUser?.email || '');

  React.useEffect(() => {
    if (siteSettings?.adminEmail) {
      setAdminEmail(siteSettings.adminEmail);
    }
  }, [siteSettings?.adminEmail]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const configuredAdminEmail = (siteSettings?.adminEmail || authUser?.email || '').toLowerCase().trim();
  const isMasterAdmin = mounted && isAuthenticated && authUser?.role === 'admin';

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 73px)',
        background: 'var(--bg-main)',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <RefreshCw size={20} className="spin-icon" style={{ color: 'var(--orange-500)' }} />
          <span>Authenticating Operations Desk...</span>
        </div>
      </div>
    );
  }

  if (!isMasterAdmin) {
    return (
      <div className="container py-12" style={{ maxWidth: '540px', margin: '3rem auto' }}>
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', border: '1.5px solid #fca5a5', background: '#fff1f2' }}>
          <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
          <h3 style={{ color: '#991b1b', fontSize: '1.35rem', marginBottom: '0.5rem' }}>System Access Restricted</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--navy-900)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            The Operations Desk is strictly restricted to Master Administrator <strong>{configuredAdminEmail}</strong>.
          </p>
          <button 
            className="btn btn-primary-orange btn-lg"
            style={{ width: '100%' }}
            onClick={() => protectedNavigate('customer')}
          >
            Return to Client Portal
          </button>
        </div>
      </div>
    );
  }

  // Calculations & KPI metrics with safe fallbacks
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeClients = Array.isArray(clients) ? clients : [];

  const totalRevenue = safeOrders.reduce((acc, curr) => acc + (parseFloat(curr?.price) || 0), 0);
  const activeJobsCount = safeOrders.filter(o => o?.status !== 'completed').length;
  const completedJobsCount = safeOrders.filter(o => o?.status === 'completed').length;

  const handleSignOut = () => {
    logout();
    protectedNavigate('public');
    showToast('Signed out of Admin Operations Portal', 'info');
  };

  // Streamlined Essential Sidebar Menu Sections
  const menuSections = [
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ClipboardList, badge: safeOrders.length },
        { id: 'services', label: 'Services & Pricing', icon: Sliders },
        { id: 'clients', label: 'Accounts & Wallets', icon: Users, badge: safeClients.length }
      ]
    },
    {
      title: 'CONTENT & SUPPORT',
      items: [
        { id: 'chat', label: 'Live Chat', icon: MessageSquare, badge: 2 },
        { id: 'heroslider', label: 'Hero Slider', icon: Image, tag: 'CMS' }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'admintam', label: 'Manage Admins', icon: ShieldCheck, tag: 'Master' },
        { id: 'signout', label: 'Sign Out', icon: LogOut, danger: true }
      ]
    }
  ];

  return (
    <div className="admin-portal-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 73px)', background: 'var(--bg-main)', position: 'relative', width: '100%' }}>
      
      {/* MOBILE STICKY HEADER BAR FOR ADMIN PORTAL */}
      <div 
        className="mobile-only"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 95,
          background: '#ffffff',
          borderBottom: '1.5px solid var(--border-color)',
          padding: '0.75rem 1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            style={{
              background: '#f1f5f9',
              border: '1px solid var(--border-color)',
              color: 'var(--navy-900)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Toggle Admin Navigation Drawer"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
              Operations Desk
            </span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, lineHeight: 1.1 }}>
              {activeTab === 'dashboard' && 'Admin Operations'}
              {activeTab === 'orders' && 'Order Pipeline'}
              {activeTab === 'services' && 'Service Rates'}
              {activeTab === 'clients' && 'Client Directory'}
              {activeTab === 'chat' && 'Inbox & Support'}
              {activeTab === 'settings' && 'Studio Settings'}
            </h3>
          </div>
        </div>
      </div>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          className="mobile-only"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 2000,
            display: 'flex'
          }}
          onClick={() => setIsMobileSidebarOpen(false)}
        >
          <div 
            style={{
              width: '285px',
              maxHeight: '100vh',
              background: '#ffffff',
              padding: '1.25rem 1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--navy-900)' }}>Admin Navigation</span>
                <button 
                  type="button" 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.35rem', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {navigationSections.map((sec, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      {sec.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {sec.items.map(item => {
                        const IconComp = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMobileSidebarOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              padding: '0.65rem 0.8rem',
                              borderRadius: '8px',
                              border: isActive ? '1.5px solid #ff7a00' : '1px solid transparent',
                              background: isActive ? 'rgba(255, 122, 0, 0.12)' : 'transparent',
                              color: isActive ? '#ff7a00' : 'var(--navy-800)',
                              fontWeight: isActive ? 800 : 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <IconComp size={16} style={{ color: isActive ? '#ff7a00' : 'var(--navy-600)' }} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 800, background: isActive ? '#ff7a00' : '#e2e8f0', color: isActive ? '#ffffff' : 'var(--navy-800)', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <aside className="admin-sidebar-fixed" style={{
        position: 'fixed',
        top: '73px',
        left: 0,
        bottom: 0,
        width: '280px',
        background: '#ffffff',
        borderRight: '1px solid var(--border-color)',
        boxShadow: '4px 0 20px rgba(15, 23, 42, 0.04)',
        overflowY: 'auto',
        padding: '1.5rem 1rem',
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 0.75rem 1.25rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-900), #ff7a00)',
              color: '#ffffff',
              padding: '0.45rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)'
            }}>
              <LayoutDashboard size={18} style={{ color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1.1 }}>
                Operations Desk
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
                Master Control Panel
              </div>
            </div>
          </div>

          {menuSections.map((sec, secIdx) => (
            <div key={secIdx} style={{ marginBottom: secIdx === menuSections.length - 1 ? 0 : '1.25rem' }}>
              <div style={{
                fontSize: '0.675rem',
                fontWeight: 800,
                color: 'var(--orange-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '0.25rem 0.75rem',
                marginBottom: '0.4rem'
              }}>
                {sec.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {sec.items.map(item => {
                  const IconComp = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'signout') {
                          handleSignOut();
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: isActive ? '1.5px solid #ff7a00' : '1px solid transparent',
                        background: isActive 
                          ? 'rgba(255, 122, 0, 0.12)' 
                          : item.danger ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        color: isActive 
                          ? '#ff7a00' 
                          : item.danger ? '#dc2626' : '#475569',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <IconComp size={16} style={{ color: isActive ? '#ff7a00' : item.danger ? '#ef4444' : '#64748b' }} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          background: isActive ? '#ff7a00' : '#e2e8f0',
                          color: isActive ? '#ffffff' : '#334155',
                          padding: '0.1rem 0.45rem',
                          borderRadius: '9999px'
                        }}>
                          {item.badge}
                        </span>
                      )}

                      {item.tag && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          background: 'rgba(249, 115, 22, 0.15)',
                          color: '#f97316',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px'
                        }}>
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '0.85rem',
          background: 'var(--navy-50)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '0.75rem',
          color: 'var(--navy-900)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            System Live
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.2rem' }}>
            {configuredAdminEmail}
          </div>
        </div>
      </aside>

      <main className="admin-main-content" style={{
        marginLeft: '280px',
        width: 'calc(100% - 280px)',
        padding: '2rem 2.5rem 4rem',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 73px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
          background: '#ffffff',
          padding: '1.25rem 1.75rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                Admin Operations Portal
              </h1>
              <span className="badge badge-assigned" style={{ fontSize: '0.725rem' }}>MASTER ADMIN</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.2rem 0 0' }}>
              Centralized digitizing studio pipeline, client balances, store merchandise, and live CMS controls.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={resetAllData}
              title="Refresh catalog and admin data from the live database"
            >
              <RefreshCw size={14} /> Refresh Catalog
            </button>

            <button 
              type="button"
              className="btn btn-navy btn-sm"
              onClick={() => setIsPricingSettingsOpen(true)}
            >
              <Sliders size={14} /> Quick Rates Editor
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ff7a00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</span>
                  <div style={{ background: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                  ${totalRevenue.toFixed(2)}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Jobs in Pipeline</span>
                  <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                    <ClipboardList size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                  {activeJobsCount}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Files</span>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                    <Layers size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                  {completedJobsCount}
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registered Clients</span>
                  <div style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.4rem 0 0.1rem' }}>
                  {safeClients.length}
                </div>
              </div>
            </div>

            <OrderManagementTable />
          </div>
        )}

        {activeTab === 'orders' && <OrderManagementTable />}
        {activeTab === 'services' && <ServiceManagementEditor />}
        {activeTab === 'clients' && <ClientDirectory />}
        {activeTab === 'chat' && <AdminChatInbox />}
        {activeTab === 'heroslider' && <SiteCmsEditor />}

        {(activeTab === 'settings' || activeTab === 'admintam') && (
          <div className="card" style={{ padding: '2rem', maxWidth: '760px', background: '#ffffff', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
              🛡️ Admin Team & Security Operations
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Manage master administrator settings, add new administrators, and configure system security.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              updateSiteSettings({ metaPixelId, adminEmail });
              showToast('Security settings saved successfully!', 'success');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  Master Admin Email Address
                </label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  Contact / support email displayed across the studio.
                </span>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                  Meta Pixel ID (Facebook Ads Tracking)
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="e.g. 123456789098765"
                />
              </div>

              <button type="submit" className="btn btn-primary-orange" style={{ alignSelf: 'flex-start' }}>
                <Settings size={16} /> Save Security Configuration
              </button>
            </form>

            {/* DEDICATED ADMIN TEAM MANAGEMENT MODULE */}
            <div style={{ paddingTop: '1.75rem', borderTop: '1.5px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                    👥 Authorized Administrator Team
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                    Registered admins who can sign in and manage studio operations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-sm"
                  onClick={() => setShowAddAdminModal(true)}
                  style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserPlus size={15} /> Add New Admin
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Master Admin Card */}
                <div style={{ padding: '0.9rem 1.15rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{authUser?.name || 'Studio Administrator'}</span>
                      <span style={{ background: '#ff7a00', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 900 }}>MASTER ADMIN</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{authUser?.email || configuredAdminEmail}</div>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                    Active
                  </span>
                </div>

                {/* Additional Registered Admins */}
                {(adminUsers || []).filter(a => (a.email || '').toLowerCase().trim() !== (authUser?.email || '').toLowerCase().trim()).map((ad) => (
                  <div key={ad.email || ad.id} style={{ padding: '0.9rem 1.15rem', background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{ad.name}</span>
                        <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 900 }}>ADMIN</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{ad.email}</div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ADD NEW ADMIN MODAL DIALOG */}
        {showAddAdminModal && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 30000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem'
            }}
            onClick={() => setShowAddAdminModal(false)}
          >
            <div 
              style={{
                maxWidth: '440px',
                width: '100%',
                background: '#ffffff',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} style={{ color: '#ff7a00' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>
                    Add New Administrator
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAddAdminModal(false)} 
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const res = await addAdminUser(newAdminName, newAdminEmail);
                if (res && res.success) {
                  setNewAdminName('');
                  setNewAdminEmail('');
                  setShowAddAdminModal(false);
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.25rem', display: 'block' }}>
                    Admin Full Name *
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Alex Rivera" 
                    value={newAdminName} 
                    onChange={(e) => setNewAdminName(e.target.value)} 
                    required 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.25rem', display: 'block' }}>
                    Admin Email Address *
                  </label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="alex@bdigitizing.pro" 
                    value={newAdminEmail} 
                    onChange={(e) => setNewAdminEmail(e.target.value)} 
                    required 
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                    This email is whitelisted for admin access. The person signs in with their own Supabase account credentials.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddAdminModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-orange" style={{ flex: 1, fontWeight: 800 }}>
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pricing Settings Modal */}
        <PricingSettingsModal />
      </main>

    </div>
  );
};
