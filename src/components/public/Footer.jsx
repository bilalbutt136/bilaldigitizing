'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';
import { useAppState } from '../../context/StateContext';

export const Footer = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { setCurrentView, isAuthenticated, authUser, siteSettings = {} } = useAppState();

  const safeIsAuthenticated = mounted ? isAuthenticated : false;
  const safeAuthUser = mounted ? authUser : null;

  const phone = siteSettings.contactPhone || '+1 (800) 555-DIGI (3444)';
  const email = siteSettings.supportEmail || 'orders@bdigitizing-pro.com';
  const currentYear = mounted ? new Date().getFullYear() : 2026;

  return (
    <footer style={{ background: 'var(--navy-950)', color: '#94a3b8', padding: '4rem 0 2rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="container">
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3.5rem'
        }}>
          
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ffffff' }}>
              <div style={{
                background: 'var(--orange-600)',
                color: '#ffffff',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <Scissors size={20} />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>
                BILAL DIGITIZING<span style={{ color: 'var(--orange-500)' }}>.PRO</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Premier commercial digitizing studio providing stitch-perfect embroidery files (.DST, .PES, .EXP) and professional vector artwork conversions for apparel brands worldwide.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>
              <ShieldCheck size={16} /> 100% Quality & Machine Tested Guarantee
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Services & Specialties
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Left Chest Polo Digitizing</a></li>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>3D Puff Cap & Hat Fronts</a></li>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Jacket Back Masterpiece Crests</a></li>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Vector Artwork (.AI, .EPS, .SVG)</a></li>
              <li><a href="#services" style={{ color: '#94a3b8', textDecoration: 'none' }}>Screen Print Color Separation</a></li>
            </ul>
          </div>

          {/* Machine Formats */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Machine Formats
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <li>Tajima Commercial (.DST)</li>
              <li>Brother / Baby Lock (.PES)</li>
              <li>Melco / Bernina (.EXP)</li>
              <li>Janome / Elna (.JEF)</li>
              <li>Wilcom Master Source (.EMB)</li>
              <li>Adobe Vector (.AI, .SVG)</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              24/7 Studio Desk
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={15} style={{ color: 'var(--orange-500)' }} /> {phone}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={15} style={{ color: 'var(--orange-600)' }} /> {email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={15} style={{ color: '#10b981' }} /> USA Headquarters & Global Production Desk
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            © {currentYear} BILAL DIGITIZING.PRO — Custom Embroidery Digitizing & Vector Services. All rights reserved.
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {(!safeIsAuthenticated || safeAuthUser?.role !== 'admin') && (
              <button 
                onClick={() => setCurrentView('customer')}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Client Dashboard Access
              </button>
            )}
            {safeIsAuthenticated && safeAuthUser?.role === 'admin' && (
              <button 
                onClick={() => setCurrentView('admin')}
                style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Admin Operations Portal
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
