'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, ShieldCheck, Mail, Phone, MapPin, MessageCircle, Clock } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate, useLocation } from '../../utils/navigation';

export const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const { currentView, setCurrentView, isAuthenticated, authUser, siteSettings = {} } = useAppState();

  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeAuthUser = mounted ? authUser : null;
  const pathname = mounted ? (location?.pathname || '') : '';

  if (mounted && (
    pathname.includes('/admin-portal') ||
    pathname.includes('/client-portal') ||
    pathname.includes('/secure-admin-login') ||
    currentView === 'admin' ||
    currentView === 'customer'
  )) {
    return null;
  }

  const phone = siteSettings.contactInfo?.phone || siteSettings.contactPhone || '+1 (800) 555-DIGI (3444)';
  const email = siteSettings.contactInfo?.email || siteSettings.supportEmail || 'orders@bdigitizing-pro.com';
  const whatsapp = siteSettings.contactInfo?.whatsapp || siteSettings.whatsapp || '+1 (800) 555-DIGI (3444)';
  const businessHours = siteSettings.contactInfo?.businessHours || siteSettings.businessHours || '24/7 Support';
  const currentYear = mounted ? new Date().getFullYear() : 2026;

  return (
    <footer style={{ background: 'var(--navy-950)', color: '#94a3b8', paddingTop: '5rem', paddingBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container" style={{ padding: '0 1rem', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Main 4 Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '4rem'
        }}>
          
          {/* Column 1: Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: '#ffffff' }}>
              <div style={{
                background: 'var(--orange-500)',
                color: '#ffffff',
                padding: '0.5rem',
                borderRadius: '6px'
              }}>
                <Scissors size={24} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                BILAL<span style={{ color: 'var(--orange-500)' }}>DIGITIZING</span>
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem', color: '#cbd5e1' }}>
              Premium digitizing studio providing stitch-perfect embroidery files and professional vector artwork conversions for apparel brands worldwide.
            </p>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#ffffff', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              background: 'rgba(255,255,255,0.05)',
              padding: '0.6rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <ShieldCheck size={18} style={{ color: 'var(--orange-500)' }} /> 
              Trusted by 1200+ Brands
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              Our Services
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <li>
                <button onClick={() => navigate('/services/embroidery-digitizing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }} 
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Embroidery Digitizing
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/services/vector-tracing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Vector Art Conversion
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/custom-patches')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Custom Patches
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
              <li>
                <button onClick={() => navigate('/portfolio')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Portfolio
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/faqs')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  FAQ
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('bdigi_open_chat')); }}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
              Contact Us
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
                <Mail size={18} style={{ color: 'var(--orange-500)' }} /> 
                <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  {email}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
                <Phone size={18} style={{ color: 'var(--orange-500)' }} /> 
                <a href={`tel:${phone}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  {phone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
                <MessageCircle size={18} style={{ color: 'var(--orange-500)' }} /> 
                <a 
                  href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#25D366'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                >
                  WhatsApp: {whatsapp}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
                <Clock size={18} style={{ color: 'var(--orange-500)' }} /> 
                <span>{businessHours}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Social Media & Bottom Bar Container */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          
          {/* Social Icons Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            {(() => {
              const socialLinks = [
                { key: 'facebook', label: 'FB', url: siteSettings.contactInfo?.facebook || siteSettings.facebookUrl },
                { key: 'instagram', label: 'IG', url: siteSettings.contactInfo?.instagram || siteSettings.instagramUrl },
                { key: 'twitter', label: 'X', url: siteSettings.contactInfo?.twitter || siteSettings.twitterUrl },
                { key: 'linkedin', label: 'IN', url: siteSettings.contactInfo?.linkedin || siteSettings.linkedinUrl },
              ];
              const activeSocials = socialLinks.filter(s => s.url && s.url !== '#');
              if (activeSocials.length === 0) return null;
              return activeSocials.map(social => (
                <a 
                  key={social.key}
                  href={social.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Visit us on ${social.key}`}
                  style={{ color: '#94a3b8', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 600 }}>{social.label}</span>
                </a>
              ));
            })()}
          </div>

          {/* Copyright and Legal Links */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            flexWrap: 'wrap',
            gap: '1rem',
            color: '#64748b'
          }}>
            <div>
              © {currentYear} Bilal Digitizing. All rights reserved.
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                 onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
                 onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                 onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                Terms & Conditions
              </button>
              
              {/* Admin/Portal Links */}
              {(!safeIsAuthenticated || safeAuthUser?.role !== 'admin') && (
                <button 
                  onClick={() => setCurrentView('customer')}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  Portal
                </button>
              )}
              {safeIsAuthenticated && safeAuthUser?.role === 'admin' && (
                <button 
                  onClick={() => setCurrentView('admin')}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                >
                  Admin
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};
