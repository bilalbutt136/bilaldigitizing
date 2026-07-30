'use client';

import React, { useEffect } from 'react';
import { useNavigate, Link } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { MerchandiseStore } from './MerchandiseStore';
import { 
  ShoppingBag, 
  ArrowLeft, 
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
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
        color: '#ffffff',
        padding: '3.5rem 0 3rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
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
          background: 'rgba(249, 115, 22, 0.15)',
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
            color: '#94a3b8', 
            marginBottom: '1.25rem' 
          }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>Studio Store</span>
          </div>

          <div style={{ maxWidth: '800px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              color: 'var(--orange-400)',
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
              color: '#ffffff', 
              marginBottom: '1rem',
              lineHeight: 1.15
            }}>
              Custom Apparel & Emblem Store
            </h1>

            <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Explore our complete collection of custom embroidered t-shirts, dry-fit polos, 3D puff snapback caps, tactical PVC emblems, and master digitizing bundles.
            </p>

            {/* Store Highlights Trust Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '1rem', 
              paddingTop: '1.5rem', 
              borderTop: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Award size={20} style={{ color: 'var(--orange-400)' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Commercial Quality</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multi-head Tajima machinery</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ShieldCheck size={20} style={{ color: '#34d399' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Free Digital Proofs</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pre-sew proof before run</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Truck size={20} style={{ color: '#60a5fa' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Fast Turnaround</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>5-7 day express dispatch</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Sparkles size={20} style={{ color: '#fbbf24' }} />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>Secure Checkout</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Wallet & BoltPayouts</div>
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
