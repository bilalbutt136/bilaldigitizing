'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingBag, 
  HelpCircle, 
  RotateCcw,
  CheckCheck,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Square,
  Upload,
  Trash2,
  Music,
  Check,
  FileAudio,
  Radio
} from 'lucide-react';
import { uploadFileToCloudinaryFull } from '../../../services/supabaseService';
import { testAudioTune, configureAudioNotification, playMessageChime, playNotificationSound } from '../../../utils/audioNotification';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AdminNotificationSettings = () => {
  const { siteSettings = {}, updateSiteSettings, showToast, authUser } = useAppState();

  const [adminEmail, setAdminEmail] = useState('');
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [revisionAlerts, setRevisionAlerts] = useState(true);
  const [deliveryAlerts, setDeliveryAlerts] = useState(true);

  // Audio Notification Tune states
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [soundUrl, setSoundUrl] = useState('');
  const [soundName, setSoundName] = useState('');
  const [soundSize, setSoundSize] = useState('');
  const [soundVolume, setSoundVolume] = useState(1.0);
  const [soundPreset, setSoundPreset] = useState('custom');

  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSavingAudio, setIsSavingAudio] = useState(false);
  const activeAudioRef = useRef(null);
  const fileInputRef = useRef(null);

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

      // Audio notification tune settings
      const sUrl = siteSettings?.notificationSoundUrl || siteSettings?.notification_sound_url || siteSettings?.notification_sound_settings?.url || '';
      const sName = siteSettings?.notificationSoundName || siteSettings?.notification_sound_name || siteSettings?.notification_sound_settings?.name || '';
      const sSize = siteSettings?.notificationSoundSize || siteSettings?.notification_sound_size || siteSettings?.notification_sound_settings?.size || '';
      const sVol = siteSettings?.notificationSoundVolume !== undefined 
        ? siteSettings?.notificationSoundVolume 
        : (siteSettings?.notification_sound_volume !== undefined 
            ? siteSettings?.notification_sound_volume 
            : (siteSettings?.notification_sound_settings?.volume ?? 1.0));
      const sPreset = siteSettings?.notificationSoundPreset || siteSettings?.notification_sound_preset || siteSettings?.notification_sound_settings?.preset || (sUrl ? 'custom' : 'crystal_bell');
      const sEnabled = siteSettings?.notificationSoundEnabled !== undefined 
        ? siteSettings?.notificationSoundEnabled 
        : (siteSettings?.notification_sound_enabled !== undefined 
            ? siteSettings?.notification_sound_enabled 
            : (typeof window !== 'undefined' ? localStorage.getItem('bdigi_audio_enabled') !== 'false' : true));

      setSoundUrl(sUrl);
      setSoundName(sName);
      setSoundSize(sSize);
      setSoundVolume(Number(sVol) !== undefined && !isNaN(Number(sVol)) ? Number(sVol) : 1.0);
      setSoundPreset(sPreset);
      setAudioEnabled(Boolean(sEnabled));
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

  const handleSendTestEmail = async (testType = 'TEST_EMAIL') => {
    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      showToast('Please enter a valid email address before sending a test.', 'warning');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const payload = {
        type: testType,
        adminEmail: cleanEmail,
      };

      if (testType === 'NEW_MESSAGE') {
        payload.senderName = 'Alex Mercer (Client)';
        payload.clientEmail = 'alex.mercer@example.com';
        payload.messageText = 'Hello BDigitizing Team! Could you please check if this vector logo can be digitized for a left chest cap embroidery?';
        payload.channel = 'Inbox (#ORD-PREVIEW)';
        payload.orderId = 'ORD-PREVIEW-101';
      } else if (testType === 'NEW_ORDER') {
        payload.orderDetails = {
          orderId: 'ORD-LIVE-TEST',
          serviceCategory: 'Embroidery Digitizing',
          tier: 'Left Chest / Hat Digitizing',
          price: 25,
          fabricType: 'Structured Cotton Twill',
          requiredFormat: 'DST, PES, EMB',
          turnaround: 'Rush (4-8 Hours)',
          clientNotes: 'Urgent turnaround requested for corporate uniform embroidery.'
        };
      }

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        const typeLabel = testType === 'NEW_ORDER' ? 'Order' : testType === 'NEW_MESSAGE' ? 'Customer Message' : 'Configuration';
        setTestResult({ 
          success: true, 
          message: `Test ${typeLabel} email dispatched to ${data.recipient || cleanEmail}! ${data.fallbackApplied ? '(Auto-routed to verified inbox bilalsadiq612@gmail.com)' : ''}` 
        });
        showToast(`Test ${typeLabel} email dispatched successfully!`, 'success');
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

  // ─── AUDIO NOTIFICATION TUNE HANDLERS ──────────────────────────────────────

  const handlePlayPreview = async (targetUrl = soundUrl, targetPreset = soundPreset, targetVol = soundVolume) => {
    if (isPlayingPreview && activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      setIsPlayingPreview(false);
      activeAudioRef.current = null;
      return;
    }

    setIsPlayingPreview(true);
    const safeVol = Math.max(0.05, Math.min(1.0, Number(targetVol) || 1.0));

    if (targetUrl && (targetPreset === 'custom' || !targetPreset)) {
      try {
        const audio = new Audio(targetUrl);
        audio.volume = safeVol;
        activeAudioRef.current = audio;

        audio.onended = () => {
          setIsPlayingPreview(false);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          setIsPlayingPreview(false);
          activeAudioRef.current = null;
          showToast('Custom audio could not be played. Testing synthesized bell chime fallback.', 'info');
          testAudioTune(null, safeVol, 'bell');
        };

        await audio.play();
      } catch (err) {
        setIsPlayingPreview(false);
        activeAudioRef.current = null;
        testAudioTune(null, safeVol, 'bell');
      }
    } else {
      testAudioTune(null, safeVol, targetPreset || 'bell');
      setTimeout(() => {
        setIsPlayingPreview(false);
      }, 750);
    }
  };

  const handleUploadAudioFile = async (file) => {
    if (!file) return;

    const validAudioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg',
      'audio/aac', 'audio/x-m4a', 'audio/m4a', 'audio/mp4', 'audio/webm'
    ];
    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'weba', 'flac'];

    if (!validAudioTypes.includes(file.type) && !validExtensions.includes(fileExt)) {
      showToast('Please select a valid audio file (.mp3, .wav, .ogg, .m4a, .aac).', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('Audio file size exceeds limit (max 20MB).', 'error');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const uploaded = await uploadFileToCloudinaryFull(file, 'media-gallery', 'notification-sounds');
      if (uploaded && (uploaded.url || uploaded.secure_url)) {
        const directUrl = uploaded.url || uploaded.secure_url;
        const cleanName = file.name;
        const formattedSize = file.size > 1024 * 1024 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`;

        setSoundUrl(directUrl);
        setSoundName(cleanName);
        setSoundSize(formattedSize);
        setSoundPreset('custom');

        // Play newly uploaded sound immediately for confirmation
        handlePlayPreview(directUrl, 'custom', soundVolume);

        showToast(`🎵 Audio tune "${cleanName}" uploaded! Click "Save Audio Tune" to activate live.`, 'success');
      } else {
        throw new Error('Upload did not return a storage URL');
      }
    } catch (err) {
      console.error('Audio upload error:', err);
      showToast('Audio upload failed: ' + (err.message || 'Storage error'), 'error');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleRemoveCustomSound = () => {
    if (isPlayingPreview && activeAudioRef.current) {
      try { activeAudioRef.current.pause(); } catch {}
      setIsPlayingPreview(false);
    }
    setSoundUrl('');
    setSoundName('');
    setSoundSize('');
    setSoundPreset('crystal_bell');
    showToast('Custom tune removed. Reverted to Crystal Bell Chime. Click Save to persist.', 'info');
  };

  const handleSaveAudioSettings = async () => {
    setIsSavingAudio(true);
    try {
      const audioPayload = {
        notificationSoundUrl: soundUrl.trim(),
        notification_sound_url: soundUrl.trim(),
        notificationSoundName: soundName,
        notification_sound_name: soundName,
        notificationSoundSize: soundSize,
        notification_sound_size: soundSize,
        notificationSoundEnabled: audioEnabled,
        notification_sound_enabled: audioEnabled,
        notificationSoundVolume: soundVolume,
        notification_sound_volume: soundVolume,
        notificationSoundPreset: soundPreset,
        notification_sound_preset: soundPreset,
        notificationSoundActive: Boolean(audioEnabled && (soundUrl.trim() || soundPreset !== 'custom')),
        notification_sound_active: Boolean(audioEnabled && (soundUrl.trim() || soundPreset !== 'custom')),
        notification_sound_settings: {
          url: soundUrl.trim(),
          name: soundName,
          size: soundSize,
          enabled: audioEnabled,
          volume: soundVolume,
          preset: soundPreset,
          updatedAt: new Date().toISOString()
        }
      };

      await updateSiteSettings(audioPayload);

      configureAudioNotification({
        url: soundUrl.trim(),
        name: soundName,
        active: audioEnabled,
        volume: soundVolume,
        preset: soundPreset
      });
      localStorage.setItem('bdigi_audio_enabled', String(audioEnabled));

      showToast('🔔 Notification tune saved & activated for all inbox messages & alerts!', 'success');
    } catch (err) {
      console.error('Save audio settings error:', err);
      showToast('Failed to save audio tune settings.', 'error');
    } finally {
      setIsSavingAudio(false);
    }
  };

  const handleTestChatMessageAlert = () => {
    showToast('💬 Testing Customer Chat Message Alert Tune...', 'info');
    if (soundUrl && soundPreset === 'custom') {
      handlePlayPreview(soundUrl, 'custom', soundVolume);
    } else {
      playMessageChime(true);
    }
  };

  const handleTestOrderNotificationAlert = () => {
    showToast('🚨 Testing New Order Notification Bell Alert...', 'info');
    if (soundUrl && soundPreset === 'custom') {
      handlePlayPreview(soundUrl, 'custom', soundVolume);
    } else {
      playNotificationSound('notification', true);
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

          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSendTestEmail('NEW_ORDER')}
              disabled={isSendingTest || !isValidEmail}
              title="Dispatches a realistic Order Placement email notification to test your inbox"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: isValidEmail && !isSendingTest ? 'pointer' : 'not-allowed',
                opacity: isValidEmail && !isSendingTest ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <ShoppingBag size={14} style={{ color: 'var(--orange-500)' }} />
              <span>Test Order Alert</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendTestEmail('NEW_MESSAGE')}
              disabled={isSendingTest || !isValidEmail}
              title="Dispatches a realistic Customer Chat/Support Message notification to test your inbox"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: isValidEmail && !isSendingTest ? 'pointer' : 'not-allowed',
                opacity: isValidEmail && !isSendingTest ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <Mail size={14} style={{ color: '#3b82f6' }} />
              <span>Test Message Alert</span>
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 1.15rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--orange-500) 0%, #c2410c 100%)',
                color: '#ffffff',
                fontSize: '0.825rem',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="spin-icon" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
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
                placeholder="admin@bdigitizing.com"
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
              All automated studio alerts, contact inquiries, and new order notifications will route directly to this address.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.55rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Delivery Service Provider:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>Resend Transactional API</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verified Safe Recipient:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>bilalsadiq612@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>200% Guarantee Engine:</span>
              <span style={{ color: '#2563eb', fontWeight: 700 }}>Direct In-Process + Auto-Failover</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Persistence Layer:</span>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Supabase site_config (Key-Value)</span>
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

            {/* Toggle 2: Customer Chat & Support Messages */}
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
                  <Mail size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Customer Chat & Support Message Alert
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Instant notification when any customer sends a chat message, 24/7 Live Desk inquiry, or contact form ticket.
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

      {/* ── Section 3: Real-Time Audio Notification Tunes & Bell Alert Engine ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: audioEnabled ? 'linear-gradient(135deg, var(--orange-500) 0%, #ea580c 100%)' : 'var(--bg-main)',
              color: audioEnabled ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: audioEnabled ? '0 4px 12px rgba(234, 88, 12, 0.25)' : 'none',
              border: `1px solid ${audioEnabled ? 'transparent' : 'var(--border-color)'}`
            }}>
              {audioEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Real-Time Notification Tune &amp; Bell Sound Alerts
                </h3>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  background: audioEnabled ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  color: audioEnabled ? '#16a34a' : '#ef4444',
                  border: `1px solid ${audioEnabled ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
                }}>
                  {audioEnabled ? 'Active & Armed' : 'Muted'}
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Set custom MP3/WAV tunes or crystal chime presets that play whenever customer messages or order notifications arrive.
              </p>
            </div>
          </div>

          {/* Master Audio Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {audioEnabled ? 'Audio Alert Active' : 'Sound Muted'}
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: audioEnabled ? 'var(--orange-500)' : 'var(--border-color)',
                borderRadius: '34px',
                transition: '0.2s ease',
                boxShadow: audioEnabled ? '0 2px 8px rgba(234, 88, 12, 0.35)' : 'none'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: audioEnabled ? '24px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.2s ease'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: '1.5rem'
        }}>

          {/* Column 1: Sound Source & Upload */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Tune Mode Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Select Active Notification Tune Source:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {[
                  { id: 'custom', label: 'Custom Uploaded Tune', icon: Music, desc: soundName || 'Upload your own audio file' },
                  { id: 'crystal_bell', label: 'Crystal Studio Bell', icon: Bell, desc: 'High-clarity dual-harmonic chime' },
                  { id: 'ding_dong', label: 'Classic Ding Dong', icon: Volume2, desc: 'Two-tone resonant door chime' },
                  { id: 'melodic_ping', label: 'Melodic Message Ping', icon: Radio, desc: 'Joyful upward notification ping' }
                ].map((item) => {
                  const IconC = item.icon;
                  const isSelected = soundPreset === item.id;
                  const isCustomDisabled = item.id === 'custom' && !soundUrl;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isCustomDisabled}
                      onClick={() => {
                        setSoundPreset(item.id);
                        handlePlayPreview(soundUrl, item.id, soundVolume);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.35rem',
                        padding: '0.85rem 1rem',
                        borderRadius: '12px',
                        textAlign: 'left',
                        background: isSelected ? 'var(--color-primary-light, rgba(249, 115, 22, 0.08))' : 'var(--bg-main)',
                        border: isSelected ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                        cursor: isCustomDisabled ? 'not-allowed' : 'pointer',
                        opacity: isCustomDisabled ? 0.6 : 1,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <IconC size={16} style={{ color: isSelected ? 'var(--orange-500)' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? 'var(--orange-500)' : 'var(--text-main)' }}>
                            {item.label}
                          </span>
                        </div>
                        {isSelected && <Check size={16} style={{ color: 'var(--orange-500)' }} />}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Audio File Upload Card */}
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                Upload Custom Audio Tune (.MP3, .WAV, .OGG, .M4A, .AAC):
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadAudioFile(file);
                  e.target.value = '';
                }}
              />

              {soundUrl ? (
                /* File Already Uploaded Card */
                <div style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        background: 'rgba(234, 88, 12, 0.12)',
                        color: 'var(--orange-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileAudio size={20} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {soundName || 'Custom Notification Tune'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {soundSize ? `${soundSize} • ` : ''}Active Live CDN Audio
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handlePlayPreview(soundUrl, 'custom', soundVolume)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid var(--orange-500)',
                          background: isPlayingPreview ? 'var(--orange-500)' : 'transparent',
                          color: isPlayingPreview ? '#ffffff' : 'var(--orange-500)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        {isPlayingPreview ? <Square size={13} /> : <Play size={13} />}
                        <span>{isPlayingPreview ? 'Stop' : 'Play'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAudio}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.45rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Upload size={13} />
                        <span>Replace</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveCustomSound}
                        title="Remove custom audio and revert to default"
                        style={{
                          padding: '0.45rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Upload Dropzone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border-color)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: isUploadingAudio ? 'wait' : 'pointer',
                    background: 'var(--bg-main)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(234, 88, 12, 0.1)',
                    color: 'var(--orange-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isUploadingAudio ? <RefreshCw size={20} className="spin-icon" /> : <Upload size={20} />}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {isUploadingAudio ? 'Uploading Audio Tune...' : 'Click to Upload Notification Tune'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Supports MP3, WAV, OGG, M4A, AAC audio files (up to 20MB)
                  </div>
                </div>
              )}
            </div>

            {/* Volume Control Slider */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {soundVolume > 0.5 ? <Volume2 size={16} style={{ color: 'var(--orange-500)' }} /> : soundVolume > 0.1 ? <Volume1 size={16} style={{ color: 'var(--orange-500)' }} /> : <VolumeX size={16} style={{ color: 'var(--text-muted)' }} />}
                  <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Master Alert Volume
                  </label>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-500)' }}>
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSoundVolume(val);
                  if (activeAudioRef.current) activeAudioRef.current.volume = val;
                }}
                style={{
                  width: '100%',
                  accentColor: 'var(--orange-500)',
                  cursor: 'pointer'
                }}
              />
            </div>

          </div>

          {/* Column 2: Test Playground & Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'space-between' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Live Audio Alert Test Playground:
              </div>

              {/* Test Button 1: Customer Inbox Message */}
              <button
                type="button"
                onClick={handleTestChatMessageAlert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-main)'; }}
              >
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
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Test Customer Chat Alert
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Plays chime as heard when a client messages you in Chat or Support Desk
                    </div>
                  </div>
                </div>
                <Play size={16} style={{ color: '#3b82f6' }} />
              </button>

              {/* Test Button 2: New Order Notification */}
              <button
                type="button"
                onClick={handleTestOrderNotificationAlert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1.15rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; e.currentTarget.style.background = 'rgba(249, 115, 22, 0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-main)'; }}
              >
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
                      Test New Order Notification Alert
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Plays bell sound as heard when a new embroidery or vector order is placed
                    </div>
                  </div>
                </div>
                <Play size={16} style={{ color: 'var(--orange-500)' }} />
              </button>

              {/* Engine Status Diagnostic Card */}
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: '12px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                fontSize: '0.78rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Active Sound Engine:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {soundPreset === 'custom' && soundUrl ? `Custom Audio (${soundName || 'File'})` : 'Synthesized Harmonic Chime'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Low-Latency Memory Preload:</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>Armed &amp; Ready</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Anti-Double-Ring Debounce:</span>
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>350ms Event Guard</span>
                </div>
              </div>

            </div>

            {/* Save Audio Tune Settings Button */}
            <button
              type="button"
              onClick={handleSaveAudioSettings}
              disabled={isSavingAudio || isUploadingAudio}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--orange-500) 0%, #c2410c 100%)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 800,
                cursor: isSavingAudio ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {isSavingAudio ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Saving Audio Tune...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Notification Audio Tune Settings</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminNotificationSettings;
