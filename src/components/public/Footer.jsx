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
    <footer style={{ background: 'var(--navy-950)', color: '#94a3b8', paddingTop: '4.5rem', paddingBottom: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container" style={{ padding: '0 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Main 5 Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3.5rem'
        }}>
          
          {/* Column 1: Brand Info & 25-Year Experience */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: '#ffffff' }}>
              <div style={{
                background: 'var(--orange-500)',
                color: '#ffffff',
                padding: '0.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)'
              }}>
                <Scissors size={22} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                BILAL<span style={{ color: 'var(--orange-500)' }}>DIGITIZING</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.25rem', color: '#cbd5e1' }}>
              Premier commercial embroidery digitizing studio and precision vector conversion lab backed by <strong>25+ years of master craftsmanship</strong>.
            </p>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#ffffff', 
              fontSize: '0.8rem', 
              fontWeight: 700,
              background: 'rgba(255,255,255,0.06)',
              padding: '0.5rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.12)'
            }}>
              <ShieldCheck size={16} style={{ color: 'var(--orange-400)' }} /> 
              25+ Years Experience • 4,500+ Clients
            </div>
          </div>

          {/* Column 2: Services */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Services
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => navigate('/services/embroidery-digitizing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }} 
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Embroidery Digitizing
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/services/vector-tracing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Vector Art Conversion
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/custom-patches')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Custom Physical Patches
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Live Pricing & Packages
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/portfolio')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Sew-Out Portfolio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Community & Knowledge */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Knowledge Hub
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => navigate('/faqs')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left', fontWeight: 600 }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Ask the Community / FAQs
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/blogs')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left', fontWeight: 600 }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Industry Insights & Blogs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('bdigi_open_chat')); }}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--orange-400)', fontWeight: 800, transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'} 
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--orange-400)'}>
                  Support (24/7 Live Chat)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Gateway Compliance */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal & Policies
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Refund & Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', padding: 0, color: '#94a3b8', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit', textAlign: 'left' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
                  Delivery & Shipping Terms
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact & 24/7 Support */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Direct Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                <Mail size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', wordBreak: 'break-all' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  {email}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                <Phone size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                <a href={`tel:${phone}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                   onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                  {phone}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                <MessageCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> 
                <a 
                  href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#22c55e'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
                >
                  WhatsApp: {whatsapp}
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                <Clock size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                <span>24/7 Global Production Support</span>
              </div>
            </div>
          </div>

        </div>

        {/* Payment Gateway Trust Badges */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} style={{ color: '#22c55e' }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>
                Bank-Grade 256-Bit SSL Encrypted Checkout
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                PCI-DSS Compliant • Secure Merchant Gateway Processing
              </div>
            </div>
          </div>

          {/* Payment Card Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            {['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'PAYPAL', 'APPLE PAY', 'GOOGLE PAY'].map((badge) => (
              <span
                key={badge}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  letterSpacing: '0.04em'
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Quick Legal */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          flexWrap: 'wrap',
          gap: '1rem',
          color: '#64748b'
        }}>
          <div>
            © {currentYear} Bilal Digitizing. All rights reserved. 25+ Years Master Studio.
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
            <button onClick={() => navigate('/faqs')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
               onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
               onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
              FAQs
            </button>
            <button onClick={() => navigate('/blogs')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', transition: 'color 0.2s', cursor: 'pointer', fontSize: 'inherit' }}
               onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
               onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
              Blogs
            </button>
            
            {/* Admin/Portal Links */}
            {(!safeIsAuthenticated || safeAuthUser?.role !== 'admin') && (
              <button 
                onClick={() => setCurrentView('customer')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Client Portal
              </button>
            )}
            {safeIsAuthenticated && safeAuthUser?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem', padding: 0, textDecoration: 'underline', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
              >
                Admin Portal
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
