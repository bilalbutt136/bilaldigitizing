'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Save, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Globe, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Share2,
  Tv,
  Camera,
  Layers,
  Send
} from 'lucide-react';

export const ContactInfoManager = () => {
  const { siteSettings, updateSiteSettings, showToast } = useAppState();
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    businessHours: '',
    socials: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      pinterest: '',
      behance: ''
    }
  });

  useEffect(() => {
    if (siteSettings) {
      const ci = siteSettings.contactInfo || {};
      setFormData({
        email: ci.email !== undefined ? ci.email : (siteSettings.supportEmail || siteSettings.contactEmail || ''),
        phone: ci.phone !== undefined ? ci.phone : (siteSettings.contactPhone || siteSettings.supportPhone || ''),
        whatsapp: ci.whatsapp !== undefined ? ci.whatsapp : (siteSettings.whatsapp || ''),
        address: ci.address !== undefined ? ci.address : (siteSettings.studioAddress || ''),
        businessHours: ci.businessHours !== undefined ? ci.businessHours : (siteSettings.businessHours || ''),
        socials: {
          facebook: ci.socials?.facebook !== undefined ? ci.socials.facebook : '',
          instagram: ci.socials?.instagram !== undefined ? ci.socials.instagram : '',
          twitter: ci.socials?.twitter !== undefined ? ci.socials.twitter : '',
          linkedin: ci.socials?.linkedin !== undefined ? ci.socials.linkedin : '',
          youtube: ci.socials?.youtube !== undefined ? ci.socials.youtube : '',
          tiktok: ci.socials?.tiktok !== undefined ? ci.socials.tiktok : '',
          pinterest: ci.socials?.pinterest !== undefined ? ci.socials.pinterest : '',
          behance: ci.socials?.behance !== undefined ? ci.socials.behance : ''
        }
      });
    }
  }, [siteSettings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socials: {
        ...prev.socials,
        [platform]: value
      }
    }));
  };

  const handleCopy = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    if (showToast) showToast(`Copied ${fieldKey} to clipboard!`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const cleanEmail = formData.email.trim();
      const cleanPhone = formData.phone.trim();
      const cleanWhatsapp = formData.whatsapp.trim();
      const cleanAddress = formData.address.trim();
      const cleanHours = formData.businessHours.trim();

      const payload = {
        contactPhone: cleanPhone,
        supportEmail: cleanEmail,
        whatsapp: cleanWhatsapp,
        studioAddress: cleanAddress,
        businessHours: cleanHours,
        contactInfo: {
          email: cleanEmail,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          address: cleanAddress,
          businessHours: cleanHours,
          socials: {
            facebook: (formData.socials.facebook || '').trim(),
            instagram: (formData.socials.instagram || '').trim(),
            twitter: (formData.socials.twitter || '').trim(),
            linkedin: (formData.socials.linkedin || '').trim(),
            youtube: (formData.socials.youtube || '').trim(),
            tiktok: (formData.socials.tiktok || '').trim(),
            pinterest: (formData.socials.pinterest || '').trim(),
            behance: (formData.socials.behance || '').trim()
          }
        }
      };

      if (updateSiteSettings) {
        await updateSiteSettings(payload);
      }

      if (showToast) {
        showToast('Contact details and social links updated across the live platform!', 'success');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
      if (showToast) {
        showToast('Failed to save contact information: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clean WhatsApp phone number for link
  const cleanWaNumber = (formData.whatsapp || '').replace(/[^0-9]/g, '');
  const waTestUrl = cleanWaNumber ? `https://wa.me/${cleanWaNumber}?text=Hello%20Bilal%20Digitizing%20Studio` : '';

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
      
      {/* 1. Header Banner */}
      <div className="card" style={{
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{ background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))', color: 'var(--color-primary, #ea580c)', padding: '0.5rem', borderRadius: '10px' }}>
                <Phone size={22} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Contact Channels & Social Ecosystem
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Manage official customer reach points, instant WhatsApp dispatch numbers, physical studio address, and social links.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary-orange btn-lg"
            style={{ fontWeight: 800, padding: '0.75rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? (
              <span className="spin-icon" style={{ display: 'inline-flex' }}>
                <Sparkles size={18} />
              </span>
            ) : (
              <Save size={18} />
            )}
            <span>{loading ? 'Saving Changes...' : 'Save Contact Settings'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))', gap: '1.75rem' }}>
        
        {/* Column 1: Direct Support Channels */}
        <div className="card" style={{
          padding: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={18} style={{ color: 'var(--orange-500)' }} /> Direct Customer Support
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', background: 'var(--color-subtle)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
              High Priority
            </span>
          </div>

          {/* Email */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Official Orders & Support Email *
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleCopy(formData.email, 'Email')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  {copiedField === 'Email' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedField === 'Email' ? 'Copied' : 'Copy'}</span>
                </button>
                {formData.email && (
                  <a
                    href={`mailto:${formData.email}`}
                    style={{ color: 'var(--color-primary)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}
                  >
                    <Send size={11} /> Test Mailto
                  </a>
                )}
              </div>
            </div>
            <input
              type="email"
              className="form-control"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g. orders@bdigitizing-pro.com"
              required
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Phone */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Direct Voice / Support Phone
              </label>
              {formData.phone ? (
                <a
                  href={`tel:${formData.phone}`}
                  style={{ color: 'var(--color-primary)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}
                >
                  <Phone size={11} /> Test Call
                </a>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Optional • Auto-hides if empty</span>
              )}
            </div>
            <input
              type="text"
              className="form-control"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Leave empty or enter phone: e.g. +1 (347) 915-4498"
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* WhatsApp Direct */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MessageSquare size={14} color="#16a34a" /> WhatsApp Instant Order Number
              </label>
              {waTestUrl ? (
                <a
                  href={waTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#16a34a', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}
                >
                  <ExternalLink size={11} /> Open WhatsApp Chat
                </a>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Optional • Auto-hides if empty</span>
              )}
            </div>
            <input
              type="text"
              className="form-control"
              value={formData.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="Leave empty or enter WhatsApp number"
              style={{ fontSize: '0.875rem' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              If kept empty, public website buttons route directly to instant 24/7 Studio Live Chat.
            </span>
          </div>

          {/* Studio Physical Address */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Physical Studio / Office Address
              </label>
              {!formData.address && (
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Optional • Auto-hides if empty</span>
              )}
            </div>
            <textarea
              className="form-control"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Leave empty or enter studio street address..."
              rows={2}
              style={{ fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          {/* Business Hours */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Business & Turnaround Hours
              </label>
              {!formData.businessHours && (
                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Optional • Auto-hides if empty</span>
              )}
            </div>
            <input
              type="text"
              className="form-control"
              value={formData.businessHours}
              onChange={(e) => handleChange('businessHours', e.target.value)}
              placeholder="e.g. 24/7 Global Production Support (Mon - Sun)"
              style={{ fontSize: '0.875rem' }}
            />
          </div>
        </div>

        {/* Column 2: Social Media & Portfolio Links */}
        <div className="card" style={{
          padding: '2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Share2 size={18} style={{ color: '#3b82f6' }} /> Social & Portfolio Channels
            </h4>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', background: 'var(--color-subtle)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
              Public Footer Links
            </span>
          </div>

          {/* Social Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            {/* Facebook */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Facebook Page</label>
                {formData.socials.facebook && (
                  <a href={formData.socials.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#1877f2', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.facebook}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* Instagram */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Instagram Profile</label>
                {formData.socials.instagram && (
                  <a href={formData.socials.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#e1306c', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.instagram}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* Twitter / X */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Twitter / X</label>
                {formData.socials.twitter && (
                  <a href={formData.socials.twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.twitter}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                placeholder="https://x.com/yourhandle"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* LinkedIn */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>LinkedIn Company</label>
                {formData.socials.linkedin && (
                  <a href={formData.socials.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#0a66c2', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.linkedin}
                onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* YouTube */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>YouTube Channel</label>
                {formData.socials.youtube && (
                  <a href={formData.socials.youtube} target="_blank" rel="noopener noreferrer" style={{ color: '#ef4444', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.youtube}
                onChange={(e) => handleSocialChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@yourstudio"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* TikTok */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>TikTok Profile</label>
                {formData.socials.tiktok && (
                  <a href={formData.socials.tiktok} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-primary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.tiktok}
                onChange={(e) => handleSocialChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@yourstudio"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* Pinterest */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Pinterest Board</label>
                {formData.socials.pinterest && (
                  <a href={formData.socials.pinterest} target="_blank" rel="noopener noreferrer" style={{ color: '#e60023', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.pinterest}
                onChange={(e) => handleSocialChange('pinterest', e.target.value)}
                placeholder="https://pinterest.com/yourstudio"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

            {/* Behance / Portfolio */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Behance / Art Portfolio</label>
                {formData.socials.behance && (
                  <a href={formData.socials.behance} target="_blank" rel="noopener noreferrer" style={{ color: '#0057ff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 700 }}>
                    <ExternalLink size={10} /> Test
                  </a>
                )}
              </div>
              <input
                type="url"
                className="form-control"
                value={formData.socials.behance}
                onChange={(e) => handleSocialChange('behance', e.target.value)}
                placeholder="https://behance.net/yourstudio"
                style={{ fontSize: '0.825rem' }}
              />
            </div>

          </div>

          {/* Quick Live Preview Bar */}
          <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--color-subtle)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer Live Footer Preview
              </span>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                {Object.values(formData.socials || {}).filter(Boolean).length > 0 
                  ? `${Object.values(formData.socials || {}).filter(Boolean).length} Active Link(s)` 
                  : 'Auto-Clean Mode (Hidden)'}
              </span>
            </div>
            
            {Object.values(formData.socials || {}).filter(Boolean).length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {formData.socials.facebook && <span style={{ fontSize: '0.75rem', background: 'rgba(24, 119, 242, 0.1)', color: '#1877f2', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>Facebook</span>}
                {formData.socials.instagram && <span style={{ fontSize: '0.75rem', background: 'rgba(225, 48, 108, 0.1)', color: '#e1306c', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>Instagram</span>}
                {formData.socials.twitter && <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--color-text-primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>X (Twitter)</span>}
                {formData.socials.linkedin && <span style={{ fontSize: '0.75rem', background: 'rgba(10, 102, 194, 0.1)', color: '#0a66c2', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>LinkedIn</span>}
                {formData.socials.youtube && <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>YouTube</span>}
                {formData.socials.tiktok && <span style={{ fontSize: '0.75rem', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-text-primary)', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>TikTok</span>}
                {formData.socials.pinterest && <span style={{ fontSize: '0.75rem', background: 'rgba(230, 0, 35, 0.1)', color: '#e60023', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>Pinterest</span>}
                {formData.socials.behance && <span style={{ fontSize: '0.75rem', background: 'rgba(0, 87, 255, 0.1)', color: '#0057ff', padding: '0.2rem 0.55rem', borderRadius: '6px', fontWeight: 700 }}>Behance</span>}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.45 }}>
                ✨ <em>All social links are empty. The public website footer will cleanly omit the social bar without empty gaps or broken icons until you add links.</em>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* 3. Bottom Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary-orange btn-lg"
          style={{ fontWeight: 800, padding: '0.85rem 2.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {loading ? (
            <span className="spin-icon" style={{ display: 'inline-flex' }}>
              <Sparkles size={18} />
            </span>
          ) : (
            <Save size={18} />
          )}
          <span>{loading ? 'Saving Changes...' : 'Save All Contact Channels'}</span>
        </button>
      </div>

    </form>
  );
};

export default ContactInfoManager;

