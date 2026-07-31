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
  RefreshCw
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
    showToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | orders | services | clients | digitizers | wallets | chat | portfolio | hero | marketing | email | pixel | payments | settings

  // Settings State Form
  const [metaPixelId, setMetaPixelId] = useState(siteSettings.metaPixelId || '123456789098765');
  const [adminEmail, setAdminEmail] = useState(siteSettings.adminEmail || 'shahidbutt59191@gmail.com');

  React.useEffect(() => {
    if (siteSettings?.adminEmail) {
      setAdminEmail(siteSettings.adminEmail);
    }
  }, [siteSettings?.adminEmail]);

  const configuredAdminEmail = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
  const isMasterAdmin = isAuthenticated && (
    authUser?.email?.toLowerCase().trim() === configuredAdminEmail ||
    authUser?.email?.toLowerCase().trim() === 'shahidbutt59191@gmail.com'
  );

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
  const newSubmissionsCount = safeOrders.filter(o => o?.status === 'submitted').length;
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
        { id: 'signout', label: 'Sign Out', icon: LogOut, danger: true }
      ]
    }
  ];

  return (
    <div style={{ padding: '2rem 0 4rem', background: 'var(--bg-main)', minHeight: 'calc(100vh - 120px)' }}>
      <div className="container" style={{ maxWidth: '1400px' }}>
        
        {/* Top Bar Header */}
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

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={resetAllData}
              title="Reset mock data to initial state"
            >
              <RefreshCw size={14} /> Reset Demo Data
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

        {/* 2-Column Sidebar Layout */}
        <div className="dashboard-layout-grid" style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* Left-Hand Admin Sidebar Navigation Container */}
          <div className="card dashboard-sidebar-sticky" style={{
            padding: '1.25rem 0.85rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            color: '#0f172a',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: '85px'
          }}>
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
                            background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)',
                            color: '#ffffff',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px'
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

          {/* Right Main Panel Content */}
          <div style={{ minWidth: 0 }}>
            
            {/* 1. DASHBOARD OVERVIEW TAB */}
            {activeTab === 'dashboard' && (
              <div>
                {/* 4 Operations KPI Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.75rem'
                }}>
                  <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
                    <div style={{ background: 'var(--green-50)', color: 'var(--green-600)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>${totalRevenue.toFixed(2)}</div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Gross Revenue</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
                    <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <Layers size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{activeJobsCount}</div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Active Production Queue</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{newSubmissionsCount}</div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>New Brief Submissions</div>
                    </div>
                  </div>

                  <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#ffffff' }}>
                    <div style={{ background: '#fae8ff', color: '#86198f', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                      <Users size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>{clients.length}</div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Registered Shops / Brands</div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Orders Pipeline Table */}
                <OrderManagementTable />
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === 'orders' && <OrderManagementTable />}

            {/* 3. SERVICES & PRICING TAB */}
            {activeTab === 'services' && <ServiceManagementEditor />}
            {activeTab === 'cms' && <SiteCmsEditor />}

            {/* 5. CLIENTS & WALLETS TAB */}
            {(activeTab === 'clients' || activeTab === 'wallets') && <ClientDirectory />}

            {/* 6. DIGITIZERS & STAFF TAB */}
            {activeTab === 'digitizers' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  🎨 Production Digitizers & Quality Staff
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Manage internal embroidery digitizers, vector artists, shift assignments, and workload metrics.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {digitizers.map(staff => (
                    <div key={staff.id} style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--navy-900)', fontSize: '1rem' }}>{staff.name}</div>
                        <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          AVAILABLE
                        </span>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        Role: <strong>{staff.role}</strong>
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        Specialty: <strong>{staff.specialty || '3D Foam & Caps'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. LIVE CHAT & SUPPORT TAB */}
            {activeTab === 'chat' && <AdminChatInbox />}

            {/* 8. HERO SLIDER SHOWCASE CMS */}
            {(activeTab === 'heroslider' || activeTab === 'portfolio' || activeTab === 'hero') && <SiteCmsEditor />}

            {/* 9. MARKETING & COUPONS TAB */}
            {activeTab === 'marketing' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  📢 Marketing, Discount Codes & Promotions
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Create promotional coupon codes and active shop discount rules for registered embroidery clients.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div style={{ padding: '1.25rem', border: '1.5px solid var(--orange-400)', background: '#fff7ed', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase' }}>ACTIVE PROMO CODE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.25rem 0' }}>{discountCode}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--navy-800)' }}>Discount: <strong>{discountPercent}</strong> on first digitizing order</div>
                  </div>
                </div>
              </div>
            )}

            {/* 11. EMAIL HUB & ALERTS TAB */}
            {activeTab === 'email' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  ✉️ Email Hub & Automated Dispatch Logs
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Configure automated email notifications for order status updates, deposit receipts, and sew-out proofs.
                </p>

                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <div><strong>SMTP Gateway:</strong> Active (Studio Notifications Service)</div>
                  <div style={{ marginTop: '0.4rem' }}><strong>Target Master Email:</strong> shahidbutt59191@gmail.com</div>
                </div>
              </div>
            )}

            {/* 12. META PIXEL & ANALYTICS TAB */}
            {activeTab === 'pixel' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  🎯 Meta Pixel & Conversion Analytics
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Inject your Meta Pixel ID to track checkout events, store orders, and ad campaigns.
                </p>

                <div style={{ maxWidth: '480px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)' }}>Meta Pixel Dataset ID</label>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ fontWeight: 700, marginTop: '0.35rem' }}
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value)}
                    />
                  </div>
                  <button type="button" className="btn btn-primary-orange btn-sm" onClick={handleSaveSettings}>
                    <Save size={14} /> Save Meta Pixel ID
                  </button>
                </div>
              </div>
            )}

            {/* 13. PAYMENT PROCESSORS TAB */}
            {activeTab === 'payments' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  ⚡ Payment Processors & Gateway Setup
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Configure client wallet top-up links and BoltPayouts checkout settings.
                </p>

                <div style={{ padding: '1.25rem', border: '1.5px solid #6366f1', background: '#e0e7ff', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#3730a3' }}>BOLT PAYOUTS GATEWAY URL</div>
                  <input 
                    type="text" 
                    className="form-control"
                    style={{ fontWeight: 800, marginTop: '0.4rem', color: '#1e1b4b' }}
                    value={boltUrl}
                    onChange={(e) => setBoltUrl(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: '0.4rem' }}>
                    Strict URL: <strong>https://www.boltpayouts.xyz/pay/boltpayouts</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 14. SETTINGS & SECURITY TAB */}
            {activeTab === 'settings' && (
              <div className="card" style={{ padding: '2rem', background: '#ffffff' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  ⚙️ Global Studio Settings & Security
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Manage site branding, master admin authorization, and database sync status.
                </p>

                <form onSubmit={handleSaveSettings} style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800 }}>Master Admin Authorization Email</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      value={adminEmail} 
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="e.g. shahidbutt59191@gmail.com"
                      required
                      style={{ fontWeight: 700, color: 'var(--navy-900)', background: '#ffffff' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      Users logging in with this email address will automatically receive Master Administrator access to the Operations Desk.
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 800 }}>Database Real-Time Channels</label>
                    <input type="text" disabled className="form-control" value="Supabase Real-Time Enabled (site_config table)" />
                  </div>
                  <button type="submit" className="btn btn-primary-orange">
                    <Save size={16} /> Save Security Configuration
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>

        {/* Pricing Settings Modal */}
        <PricingSettingsModal />

      </div>
    </div>
  );
};
