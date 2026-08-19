'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../context/StateContext';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Lock, 
  Clock, 
  AlertTriangle, 
  Save, 
  X, 
  CheckCircle2, 
  KeyRound,
  Users,
  Power
} from 'lucide-react';

export const AdminSecuritySettings = () => {
  const {
    siteSettings = {},
    updateSiteSettings,
    authUser,
    showToast,
    adminUsers = [],
    addAdminUser
  } = useAppState();

  const [adminEmail, setAdminEmail] = useState(authUser?.email || '');
  const [sessionTimeout, setSessionTimeout] = useState(siteSettings?.sessionTimeout || '24h');
  const [maintenanceMode, setMaintenanceMode] = useState(siteSettings?.maintenanceMode === true);
  const [maintenanceNotice, setMaintenanceNotice] = useState(siteSettings?.maintenanceNotice || 'We are currently performing scheduled maintenance. The studio will be back online shortly.');
  const [isSaving, setIsSaving] = useState(false);

  // Add Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Live Admins State from API
  const [liveAdmins, setLiveAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    if (siteSettings?.adminEmail) {
      setAdminEmail(siteSettings.adminEmail);
    }
    if (siteSettings?.sessionTimeout) {
      setSessionTimeout(siteSettings.sessionTimeout);
    }
    if (siteSettings?.maintenanceMode !== undefined) {
      setMaintenanceMode(siteSettings.maintenanceMode === true);
    }
    if (siteSettings?.maintenanceNotice) {
      setMaintenanceNotice(siteSettings.maintenanceNotice);
    }
  }, [siteSettings]);

  const loadAdminsFromApi = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data?.success && Array.isArray(data.admins)) {
        setLiveAdmins(data.admins);
      }
    } catch {
      // Fallback to state adminUsers
      setLiveAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    loadAdminsFromApi();
  }, []);

  const handleSaveSecurity = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    try {
      await updateSiteSettings({
        adminEmail: adminEmail.trim().toLowerCase(),
        sessionTimeout,
        maintenanceMode,
        maintenanceNotice: maintenanceNotice.trim()
      });
      showToast('Security and access configurations saved successfully!', 'success');
    } catch {
      showToast('Failed to save security settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setIsAddingAdmin(true);
    try {
      const res = await addAdminUser(newAdminName, newAdminEmail);
      if (res && res.success) {
        setNewAdminName('');
        setNewAdminEmail('');
        setShowAddAdminModal(false);
        await loadAdminsFromApi();
        showToast(`Administrator ${newAdminEmail} added successfully!`, 'success');
      } else {
        showToast(res?.error || 'Failed to add administrator.', 'error');
      }
    } catch {
      showToast('Error creating administrator.', 'error');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRevokeAdmin = async (emailToRevoke) => {
    if (!confirm(`Are you sure you want to revoke admin privileges for ${emailToRevoke}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(emailToRevoke)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Access revoked for ${emailToRevoke}`, 'info');
        await loadAdminsFromApi();
      } else {
        showToast(data?.error || 'Failed to revoke access.', 'error');
      }
    } catch {
      showToast('Error revoking access.', 'error');
    }
  };

  const configuredAdminEmail = (siteSettings?.adminEmail || authUser?.email || '').toLowerCase().trim();

  // Combine live DB admins with context admin list
  const combinedAdmins = liveAdmins.length > 0 ? liveAdmins : (adminUsers || []).map(a => ({ email: a.email || a, created_at: null }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header Card */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.5rem', borderRadius: '10px' }}>
            <ShieldCheck size={22} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Admin Team, Security & Access Management
          </h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Manage whitelisted studio operators, configure session timeouts, and control maintenance mode.
        </p>
      </div>

      {/* 2. Authorized Administrator Team Directory */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
              Authorized Studio Administrators
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Whitelisted Supabase accounts with full access to the operations desk and pricing manager.
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
          <div style={{ padding: '1rem 1.25rem', background: 'var(--color-subtle)', borderRadius: '12px', border: '1.5px solid var(--orange-500)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{authUser?.name || 'Studio Administrator'}</span>
                <span style={{ background: 'var(--orange-500)', color: '#ffffff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 900 }}>
                  MASTER ADMIN
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                {configuredAdminEmail}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                ● Active
              </span>
            </div>
          </div>

          {/* Secondary Whitelisted Admins */}
          {combinedAdmins.filter(a => (a.email || '').toLowerCase().trim() !== configuredAdminEmail).map((ad) => (
            <div key={ad.email} style={{ padding: '0.9rem 1.25rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{ad.email.split('@')[0]}</span>
                  <span style={{ background: '#3b82f6', color: '#ffffff', fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 900 }}>
                    OPERATOR
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                  {ad.email} {ad.created_at && `• Added ${new Date(ad.created_at).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.65rem', borderRadius: '8px' }}>
                  ● Active
                </span>
                <button
                  type="button"
                  onClick={() => handleRevokeAdmin(ad.email)}
                  className="btn btn-outline btn-sm"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                  title="Revoke Admin Privileges"
                >
                  <Trash2 size={13} /> Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Security, Operational State & Session Policies */}
      <form onSubmit={handleSaveSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 1.25rem' }}>
            Operational State & Session Security Policies
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Master Admin Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                Primary Master Notification Email
              </label>
              <input
                type="email"
                className="form-control"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                Order notices, client inquiries, and system health alerts are sent to this address.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Session Timeout */}
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Admin Inactivity Session Timeout
                </label>
                <select
                  className="form-control"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                >
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                  <option value="4h">4 Hours</option>
                  <option value="24h">24 Hours (Default)</option>
                  <option value="7d">7 Days</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Automatically requires re-authentication after idle duration.
                </span>
              </div>

              {/* Maintenance Mode Switch */}
              <div style={{ padding: '1rem', background: 'var(--color-subtle)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Power size={16} style={{ color: maintenanceMode ? '#ef4444' : '#10b981' }} />
                    Studio Maintenance Mode
                  </span>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  When active, a friendly maintenance banner informs clients while preserving database records.
                </span>
              </div>
            </div>

            {maintenanceMode && (
              <div>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Client Maintenance Notice Banner
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={maintenanceNotice}
                  onChange={(e) => setMaintenanceNotice(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2rem' }}>
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Security Policies'}
          </button>
        </div>
      </form>

      {/* ADD NEW ADMIN MODAL DIALOG */}
      {showAddAdminModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowAddAdminModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div 
            className="modal-content"
            style={{
              maxWidth: '440px',
              width: '100%',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              border: '1px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} style={{ color: 'var(--orange-500)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Add New Administrator
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddAdminModal(false)} 
                style={{ background: 'var(--color-subtle)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                  Admin Full Name *
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Bilal Butt" 
                  value={newAdminName} 
                  onChange={(e) => setNewAdminName(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                  Admin Email Address *
                </label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="admin@bdigitizing-pro.com" 
                  value={newAdminEmail} 
                  onChange={(e) => setNewAdminEmail(e.target.value)} 
                  required 
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  This email will be added to the live Supabase <code>public.admins</code> whitelist.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isAddingAdmin} className="btn btn-primary-orange" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}>
                  <UserPlus size={15} /> {isAddingAdmin ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
