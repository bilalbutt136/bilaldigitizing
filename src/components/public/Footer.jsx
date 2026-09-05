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

  const ci = siteSettings.contactInfo || {};
  const phone = (ci.phone !== undefined ? ci.phone : (siteSettings.contactPhone || siteSettings.supportPhone || '')).trim();
  const email = (ci.email !== undefined ? ci.email : (siteSettings.supportEmail || siteSettings.contactEmail || 'orders@bdigitizing-pro.com')).trim();
  const whatsapp = (ci.whatsapp !== undefined ? ci.whatsapp : (siteSettings.whatsapp || '')).trim();
  const address = (ci.address !== undefined ? ci.address : (siteSettings.studioAddress || '')).trim();
  const businessHours = (ci.businessHours !== undefined ? ci.businessHours : (siteSettings.businessHours || '')).trim();
  const socials = ci.socials || {};

  const socialLinks = [
    {
      key: 'facebook',
      label: 'Facebook',
      url: socials.facebook,
      color: '#1877f2',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      key: 'instagram',
      label: 'Instagram',
      url: socials.instagram,
      color: '#e1306c',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      key: 'twitter',
      label: 'X (Twitter)',
      url: socials.twitter,
      color: '#ffffff',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      url: socials.linkedin,
      color: '#0a66c2',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      key: 'youtube',
      label: 'YouTube',
      url: socials.youtube,
      color: '#ef4444',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      url: socials.tiktok,
      color: '#00f2fe',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98v8.63c-.02 1.95-.73 3.9-2.07 5.35-1.57 1.7-3.93 2.6-6.22 2.4-2.28-.2-4.38-1.42-5.59-3.37-1.2-1.95-1.39-4.43-.51-6.55.88-2.12 2.82-3.66 5.09-4.07.64-.12 1.29-.14 1.94-.07v4.12c-.67-.18-1.42-.14-2.06.11-.64.25-1.18.73-1.5 1.34-.32.61-.39 1.35-.2 2.01.19.66.66 1.21 1.28 1.52.62.31 1.37.34 2.02.08.65-.26 1.16-.8 1.39-1.46.12-.34.18-.7.18-1.07V.02z"/>
        </svg>
      )
    },
    {
      key: 'pinterest',
      label: 'Pinterest',
      url: socials.pinterest,
      color: '#e60023',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.627 0-12 5.372-12 12 0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 12-5.373 12-12 0-6.628-5.393-12-12-12z"/>
        </svg>
      )
    },
    {
      key: 'behance',
      label: 'Behance',
      url: socials.behance,
      color: '#0057ff',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-4.726 3-3.047 0-5.5-2.029-5.5-5.5s2.453-5.5 5.5-5.5c3.551 0 5.208 2.651 4.726 6h-7.726c.205 1.536 1.488 2.5 2.99 2.5 1.341 0 2.213-.674 2.671-1.5h2.065zm-7.726-4h5.275c-.179-1.238-1.177-2-2.529-2-1.399 0-2.508.825-2.746 2zm-11.726 7h-4.274v-14h4.869c2.816 0 4.405 1.42 4.405 3.594 0 1.25-.568 2.247-1.564 2.843 1.258.528 1.838 1.636 1.838 3.081 0 2.625-1.921 4.482-5.274 4.482zm-1.774-8.5h2.049c1.232 0 1.951-.624 1.951-1.579 0-.919-.719-1.421-1.951-1.421h-2.049v3zm0 6h2.245c1.378 0 2.19-.688 2.19-1.782 0-1.125-.812-1.718-2.19-1.718h-2.245v3.5z"/>
        </svg>
      )
    }
  ].filter(s => Boolean(s.url && String(s.url).trim().length > 0));

  const currentYear = mounted ? new Date().getFullYear() : 2026;

  return (
    <footer style={{ background: '#090d16', color: '#94a3b8', paddingTop: '4.5rem', paddingBottom: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container" style={{ padding: '0 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Main Columns Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '2.5rem',
          marginBottom: '3.5rem'
        }}>
          
          {/* Column 1: Brand Info & Social Channels */}
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
              border: '1px solid rgba(255,255,255,0.12)',
              marginBottom: socialLinks.length > 0 ? '1.25rem' : '0'
            }}>
              <ShieldCheck size={16} style={{ color: 'var(--orange-400)' }} /> 
              25+ Years Experience • 4,500+ Clients
            </div>

            {/* Dynamic Social Media Links (Only Renders Active Links With Clean Layout Adjustment) */}
            {socialLinks.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: '0.65rem' }}>
                  Connect & Follow Studio
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  {socialLinks.map(s => (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      aria-label={s.label}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#cbd5e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = s.color;
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.borderColor = s.color;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${s.color}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.color = '#cbd5e1';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            )}
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
              {email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                  <Mail size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                  <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', wordBreak: 'break-all' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                     onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                  <Phone size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                  <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                     onMouseEnter={(e) => e.currentTarget.style.color = 'var(--orange-500)'} 
                     onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    {phone}
                  </a>
                </div>
              )}
              {whatsapp && (
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
              )}
              {address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: '#cbd5e1' }}>
                  <MapPin size={16} style={{ color: 'var(--orange-500)', flexShrink: 0, marginTop: '2px' }} /> 
                  <span style={{ lineHeight: 1.4 }}>{address}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#cbd5e1' }}>
                <Clock size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} /> 
                <span>{businessHours || '24/7 Global Production Support'}</span>
              </div>

              {/* 24/7 Instant Live Chat Trigger */}
              <div style={{ marginTop: '0.35rem' }}>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('bdigi_open_chat'));
                    }
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'rgba(255, 107, 0, 0.12)',
                    border: '1px solid rgba(255, 107, 0, 0.3)',
                    color: 'var(--orange-400)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--orange-500)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 0, 0.12)';
                    e.currentTarget.style.color = 'var(--orange-400)';
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                  24/7 Live Desk Online
                </button>
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
                My Account
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
