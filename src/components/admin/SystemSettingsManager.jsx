'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Settings, ShieldCheck, UserPlus, X } from 'lucide-react';
import { AdminMetaPixel } from './AdminMetaPixel';

export const SystemSettingsManager = () => {
  const {
    siteSettings = {},
    updateSiteSettings,
    adminUsers = [],
    addAdminUser,
    authUser,
    showToast
  } = useAppState();

  const [adminEmail, setAdminEmail] = useState(authUser?.email || '');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    if (siteSettings?.adminEmail) {
      setAdminEmail(siteSettings.adminEmail);
    }
  }, [siteSettings?.adminEmail]);

  const configuredAdminEmail = (siteSettings?.adminEmail || authUser?.email || '').toLowerCase().trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Core Studio Settings */}
      <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
          🛡️ Studio Admin Settings
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Manage master administrator contact details.
        </p>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          updateSiteSettings({ adminEmail });
          showToast('Security settings saved successfully!', 'success');
        }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
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

          <button type="submit" className="btn btn-primary-orange" style={{ alignSelf: 'flex-start' }}>
            <Settings size={16} /> Save Security Configuration
          </button>
        </form>
      </div>

      {/* 2. Admin Team Management */}
      <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
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

      {/* 3. Meta Pixel Dashboard */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--navy-900)' }}>
          📈 Marketing & Tracking
        </h3>
        <AdminMetaPixel />
      </div>

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
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary-orange" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <UserPlus size={15} /> Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
