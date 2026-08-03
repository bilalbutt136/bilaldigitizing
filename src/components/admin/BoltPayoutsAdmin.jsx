import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, DollarSign, Key, ShieldCheck } from 'lucide-react';

export const BoltPayoutsAdmin = () => {
  const { siteSettings, updateSiteSettings, showToast } = useAppState();
  const [draftSettings, setDraftSettings] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setDraftSettings(JSON.parse(JSON.stringify(siteSettings)));
    }
  }, [siteSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteSettings(draftSettings);
      showToast('BoltPayouts configuration saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save BoltPayouts configuration.', 'error');
    }
    setIsSaving(false);
  };

  if (!draftSettings) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <DollarSign size={28} style={{ color: '#10b981' }} />
          BoltPayouts Payment Hub
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Manage your BoltPayouts integration to accept seamless crypto and card deposits.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Key size={18} style={{ color: 'var(--primary-color)' }} /> 
          API Credentials
        </h3>
        
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>BoltPayouts Server-Side API Key</label>
            <input 
              type="password" 
              className="form-control"
              placeholder="bolt_pk_..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              value={draftSettings.boltpayoutsConfig?.apiKey || ''}
              onChange={(e) => setDraftSettings(prev => ({ 
                ...prev, 
                boltpayoutsConfig: { ...prev.boltpayoutsConfig, apiKey: e.target.value } 
              }))}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Used to authenticate server-to-server requests for payouts and balance billing.
            </p>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Webhook Signing Secret</label>
            <input 
              type="password" 
              className="form-control"
              placeholder="whsec_..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              value={draftSettings.boltpayoutsConfig?.webhookSecret || ''}
              onChange={(e) => setDraftSettings(prev => ({ 
                ...prev, 
                boltpayoutsConfig: { ...prev.boltpayoutsConfig, webhookSecret: e.target.value } 
              }))}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Required to securely verify incoming webhook events from BoltPayouts.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary-orange btn-lg"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <ShieldCheck size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <div>
          <h4 style={{ fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>Security Notice</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Your API keys provide full access to your BoltPayouts operator balance. Never expose these keys in client-side code. They are securely encrypted and only accessible by your backend server environment.
          </p>
        </div>
      </div>
    </div>
  );
};
