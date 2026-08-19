'use client';

import React, { useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { MerchandiseStore } from './MerchandiseStore';
import { 
  ShoppingBag, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Award,
  ChevronRight
} from 'lucide-react';

export const StorePage = () => {
  const navigate = useNavigate();
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentView]);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Store Header Banner */}
      <div className="theme-hero-section" style={{
        background: 'var(--hero-bg)',
        color: 'var(--text-main)',
        padding: '3.5rem 0 3rem',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background glow */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '300px',
          height: '300px',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }} />

        <div className="container">
          {/* Breadcrumbs */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            color: 'var(--text-muted)', 
            marginBottom: '1.25rem' 
          }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--orange-600)', fontWeight: 700 }}>Studio Store</span>
          </div>

          <div style={{ maxWidth: '800px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: 'var(--orange-600)',
              fontWeight: 700,
              fontSize: '0.825rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <ShoppingBag size={14} /> Dedicated Studio Storefront
            </div>

            <h1 style={{ 
              fontSize: '2.8rem', 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 800, 
              color: 'var(--hero-text-primary)', 
              marginBottom: '1rem',
              lineHeight: 1.15
            }}>
              Custom Apparel & Emblem Store
            </h1>

            <p style={{ color: 'var(--hero-text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Explore our complete collection of custom embroidered t-shirts, dry-fit polos, 3D puff snapback caps, tactical PVC emblems, and master digitizing bundles.
            </p>

            {/* Store Highlights Trust Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '1rem', 
              paddingTop: '1.5rem', 
              borderTop: '1px solid var(--border-color)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--hero-card-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--hero-card-border)', boxShadow: 'var(--shadow-sm)' }}>
                <Award size={20} style={{ color: 'var(--orange-500)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--hero-text-primary)' }}>Commercial Quality</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hero-text-secondary)' }}>Multi-head Tajima machinery</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--hero-card-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--hero-card-border)', boxShadow: 'var(--shadow-sm)' }}>
                <ShieldCheck size={20} style={{ color: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--hero-text-primary)' }}>Free Digital Proofs</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hero-text-secondary)' }}>Pre-sew proof before run</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--hero-card-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--hero-card-border)', boxShadow: 'var(--shadow-sm)' }}>
                <Truck size={20} style={{ color: 'var(--orange-500)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--hero-text-primary)' }}>Fast Turnaround</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hero-text-secondary)' }}>5-7 day express dispatch</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'var(--hero-card-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--hero-card-border)', boxShadow: 'var(--shadow-sm)' }}>
                <Sparkles size={20} style={{ color: 'var(--orange-500)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--hero-text-primary)' }}>Secure Checkout</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--hero-text-secondary)' }}>Wallet & BoltPayouts</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Storefront Catalog Content */}
      <div style={{ flex: 1 }}>
        <MerchandiseStore />
      </div>
    </div>
  );
};
