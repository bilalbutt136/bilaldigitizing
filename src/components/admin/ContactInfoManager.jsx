'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Save, AlertCircle, CheckCircle2, Mail, Phone, MapPin, Clock, Globe } from 'lucide-react';

export const ContactInfoManager = () => {
  const { siteSettings, updateSiteSettings } = useAppState();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    contactInfo: {
      email: '',
      phone: '',
      whatsapp: '',
      address: '',
      businessHours: '',
      socials: {
        facebook: '',
        instagram: '',
        twitter: '',
        linkedin: ''
      }
    }
  });

  useEffect(() => {
    if (siteSettings?.contactInfo) {
      setFormData({
        contactInfo: {
          email: siteSettings.contactInfo.email || '',
          phone: siteSettings.contactInfo.phone || '',
          whatsapp: siteSettings.contactInfo.whatsapp || '',
          address: siteSettings.contactInfo.address || '',
          businessHours: siteSettings.contactInfo.businessHours || '',
          socials: {
            facebook: siteSettings.contactInfo.socials?.facebook || '',
            instagram: siteSettings.contactInfo.socials?.instagram || '',
            twitter: siteSettings.contactInfo.socials?.twitter || '',
            linkedin: siteSettings.contactInfo.socials?.linkedin || ''
          }
        }
      });
    }
  }, [siteSettings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const handleSocialChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        socials: {
          ...prev.contactInfo.socials,
          [platform]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      await updateSiteSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving contact info:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '64rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Contact Information</h2>
          <p style={{ color: '#4b5563', margin: '0.25rem 0 0 0' }}>Manage business contact details and social links</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? (
            <span className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
          ) : (
            <Save size={20} />
          )}
          Save Changes
        </button>
      </div>

      {saveStatus === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#ecfdf5', color: '#047857' }}>
          <CheckCircle2 size={20} />
          <span>Contact information saved successfully!</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c' }}>
          <AlertCircle size={20} />
          <span>Failed to save contact information. Please try again.</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Business Details</h3>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Mail size={16} /> Email Address
            </label>
            <input
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="e.g. contact@yourbusiness.com"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Phone size={16} /> Phone Number
            </label>
            <input
              type="text"
              value={formData.contactInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="e.g. +1 (555) 123-4567"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Phone size={16} color="#22c55e" /> WhatsApp Number
            </label>
            <input
              type="text"
              value={formData.contactInfo.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              placeholder="e.g. +15551234567 (no spaces)"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <MapPin size={16} /> Physical Address
            </label>
            <textarea
              value={formData.contactInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Full business address"
              rows={3}
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Clock size={16} /> Business Hours
            </label>
            <input
              type="text"
              value={formData.contactInfo.businessHours}
              onChange={(e) => handleChange('businessHours', e.target.value)}
              placeholder="e.g. Mon-Fri: 9AM - 5PM EST"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--navy-900)', margin: '0 0 1rem 0', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Social Media</h3>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Globe size={16} /> Facebook URL
            </label>
            <input
              type="url"
              value={formData.contactInfo.socials.facebook}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              placeholder="https://facebook.com/yourpage"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Globe size={16} /> Instagram URL
            </label>
            <input
              type="url"
              value={formData.contactInfo.socials.instagram}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="https://instagram.com/yourhandle"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Globe size={16} /> Twitter/X URL
            </label>
            <input
              type="url"
              value={formData.contactInfo.socials.twitter}
              onChange={(e) => handleSocialChange('twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-700)', marginBottom: '0.4rem' }}>
              <Globe size={16} /> LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.contactInfo.socials.linkedin}
              onChange={(e) => handleSocialChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/yourcompany"
              style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
