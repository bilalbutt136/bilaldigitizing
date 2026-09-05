'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../context/StateContext';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles, 
  Bell, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  MessageSquare, 
  ShoppingBag, 
  RotateCcw,
  CheckCheck
} from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AdminNotificationSettings = () => {
  const { siteSettings = {}, updateSiteSettings, showToast, authUser } = useAppState();

  const [adminEmail, setAdminEmail] = useState('');
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [revisionAlerts, setRevisionAlerts] = useState(true);
  const [deliveryAlerts, setDeliveryAlerts] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (siteSettings) {
      const dbEmail = siteSettings?.admin_notification_email || 
        siteSettings?.notification_settings?.adminEmail || 
        siteSettings?.adminEmail || 
        siteSettings?.contactInfo?.email || 
        siteSettings?.supportEmail || 
        authUser?.email || 
        '';

      if (dbEmail) {
        setAdminEmail(dbEmail);
      }

      const notifPrefs = siteSettings?.notification_settings || {};
      if (notifPrefs?.orderAlerts !== undefined) setOrderAlerts(Boolean(notifPrefs.orderAlerts));
      if (notifPrefs?.messageAlerts !== undefined) setMessageAlerts(Boolean(notifPrefs.messageAlerts));
      if (notifPrefs?.revisionAlerts !== undefined) setRevisionAlerts(Boolean(notifPrefs.revisionAlerts));
      if (notifPrefs?.deliveryAlerts !== undefined) setDeliveryAlerts(Boolean(notifPrefs.deliveryAlerts));
    }
  }, [siteSettings, authUser]);

  const isValidEmail = Boolean(adminEmail && EMAIL_REGEX.test(adminEmail.trim()));

  const handleSaveSettings = async (e) => {
    e?.preventDefault?.();

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Please enter a recipient notification email address.', 'warning');
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      showToast('Please enter a valid email format (e.g. name@domain.com).', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const notificationSettingsPayload = {
        adminEmail: cleanEmail,
        orderAlerts,
        messageAlerts,
        revisionAlerts,
        deliveryAlerts,
        updatedAt: new Date().toISOString()
      };

      await updateSiteSettings({
        admin_notification_email: cleanEmail,
        adminEmail: cleanEmail,
        notification_settings: notificationSettingsPayload
      });

      showToast('Email notification routing updated & persisted to live database!', 'success');
    } catch (err) {
      console.error('Save notification settings error:', err);
      showToast('Failed to save notification settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      showToast('Please enter a valid email address before sending a test.', 'warning');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_EMAIL',
          adminEmail: cleanEmail
        })
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setTestResult({ success: true, message: `Test email dispatched to ${cleanEmail}` });
        showToast(`Test email successfully dispatched to ${cleanEmail}!`, 'success');
      } else {
        const errorMsg = data?.error || data?.details || 'Failed to dispatch test email';
        setTestResult({ success: false, message: errorMsg });
        showToast(`Email test error: ${errorMsg}`, 'error');
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Network error' });
      showToast('Failed to send test email. Check API key configuration.', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(249, 115, 22, 0.05) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--orange-500) 0%, #c2410c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
            }}>
              <Mail size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Email & Alert Notification Routing
                </h2>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#16a34a',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '9999px',
                  border: '1px solid rgba(34, 197, 94, 0.25)'
                }}>
                  Live Sync
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Configure the central destination email and automatic triggers for customer messages, new orders, and revisions.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={isSendingTest || !isValidEmail}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.15rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: isValidEmail && !isSendingTest ? 'pointer' : 'not-allowed',
                opacity: isValidEmail && !isSendingTest ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              {isSendingTest ? (
                <>
                  <RefreshCw size={15} className="spin-icon" style={{ color: 'var(--orange-500)' }} />
                  <span>Sending Test...</span>
                </>
              ) : (
                <>
                  <Send size={15} style={{ color: 'var(--orange-500)' }} />
                  <span>Send Test Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--orange-500) 0%, #c2410c 100%)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {testResult && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.825rem',
            color: testResult.success ? '#15803d' : '#b91c1c'
          }}>
            {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Main Settings Body */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
        gap: '1.5rem'
      }}>

        {/* Section 1: Destination Email & Delivery Engine */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <ShieldCheck size={18} style={{ color: 'var(--orange-500)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Primary Notification Recipient
            </h3>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Admin Destination Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@bilaldigitizing.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 2.75rem 0.75rem 1rem',
                  borderRadius: '10px',
                  border: `1.5px solid ${isValidEmail ? 'rgba(34, 197, 94, 0.4)' : (adminEmail ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)')}`,
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center'
              }}>
                {isValidEmail ? (
                  <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
                ) : adminEmail ? (
                  <AlertCircle size={18} style={{ color: '#ef4444' }} />
                ) : (
                  <Mail size={18} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.4rem 0 0' }}>
              All automated studio alerts, customer chat alerts, and new order notifications will route directly to this address.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Delivery Service Provider:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Resend Transactional API</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Persistence Layer:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Supabase site_config (Key-Value)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Execution Mode:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Non-blocking Asynchronous</span>
            </div>
          </div>
        </div>

        {/* Section 2: Event Triggers & Notification Toggles */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
            <Bell size={18} style={{ color: 'var(--orange-500)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Automated Event Triggers
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Toggle 1: New Order Placement */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: orderAlerts ? 'rgba(249, 115, 22, 0.06)' : 'var(--bg-main)',
              border: `1px solid ${orderAlerts ? 'rgba(249, 115, 22, 0.25)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(234, 88, 12, 0.12)',
                  color: 'var(--orange-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    New Order Placement Alert
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sends itemized specs, placement, notes, and deep link on checkout.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={orderAlerts}
                onChange={(e) => setOrderAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--orange-500)' }}
              />
            </div>

            {/* Toggle 2: Customer Chat & Inquiries */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: messageAlerts ? 'rgba(59, 130, 246, 0.06)' : 'var(--bg-main)',
              border: `1px solid ${messageAlerts ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Customer Chat & 24/7 Support Alert
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Instant notification when a client posts a message or contact inquiry.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={messageAlerts}
                onChange={(e) => setMessageAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6' }}
              />
            </div>

            {/* Toggle 3: Revision Requests */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: revisionAlerts ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-main)',
              border: `1px solid ${revisionAlerts ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <RotateCcw size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Design Revision Request Alert
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Triggers when a customer requests changes or thread adjustments.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={revisionAlerts}
                onChange={(e) => setRevisionAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
              />
            </div>

            {/* Toggle 4: Completed Orders */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: deliveryAlerts ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-main)',
              border: `1px solid ${deliveryAlerts ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Order Acceptance & Deliveries
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Alerts when clients accept production deliverables.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={deliveryAlerts}
                onChange={(e) => setDeliveryAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
              />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminNotificationSettings;
