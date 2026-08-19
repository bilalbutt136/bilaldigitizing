'use client';

import React, { useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Layers 
} from 'lucide-react';

export const CustomApparelPage = () => {
  const navigate = useNavigate();
  const { openStoreOrderModal, storeProducts = [], protectedNavigate } = useAppState();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const apparelProducts = (storeProducts || []).filter(p => p.category === 'tshirts' || p.category === 'apparel' || (p.title || '').toLowerCase().includes('shirt') || (p.title || '').toLowerCase().includes('polo'));

  const itemsToRender = apparelProducts;

  const [sizeChart, setSizeChart] = React.useState([]);

  useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('apparel_size_chart').then(data => {
        if (data && data.length > 0) {
          setSizeChart(data.map(item => ({
            size: item.size,
            chest: item.chest,
            length: item.length || item.waist || '' // fallback to waist since CMS might have waist instead of length
          })));
        }
      });
    });
  }, []);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Hero Header Banner */}
      <div className="theme-hero-section" style={{
        background: 'var(--hero-bg)',
        color: 'var(--text-main)',
        padding: '3.75rem 0 3.25rem',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '350px',
          height: '350px',
          background: 'rgba(249, 115, 22, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div className="container">
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
            <span>/</span>
            <span style={{ color: 'var(--orange-600)', fontWeight: 700 }}>Custom T-Shirts & Apparel</span>
          </div>

          <div style={{ maxWidth: '820px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              color: 'var(--orange-600)',
              fontWeight: 800,
              fontSize: '0.825rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <ShoppingBag size={15} /> Commercial Custom Apparel Manufacturing
            </div>

            <h1 style={{ 
              fontSize: '2.85rem', 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 800, 
              color: 'var(--hero-text-primary)', 
              marginBottom: '1rem',
              lineHeight: 1.15,
              letterSpacing: '-0.02em'
            }}>
              Custom Screen Print & Embroidered Apparel
            </h1>

            <p style={{ color: 'var(--hero-text-secondary)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '2.25rem' }}>
              Customized ring-spun cotton tees, performance athletic polos, and corporate team uniforms embroidered with high-density precision stitching and zero needle puckering.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem',
              fontSize: '0.9rem',
              color: 'var(--hero-text-primary)',
              fontWeight: 700
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> Free Pre-Production Proof
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> Individual Poly-Bagging Included
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={17} style={{ color: '#10b981' }} /> Min. Quantity Only 5 Units
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Apparel Products Showcase */}
      <section style={{ padding: '4.5rem 0 5.5rem' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <h2 style={{ fontSize: '2.4rem', color: 'var(--navy-900)', fontWeight: 800, marginBottom: '0.75rem' }}>
              Apparel Catalog & Pricing Options
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Select a garment style below to customize logo placement, color choices, and quantity discounts.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2.25rem',
            marginBottom: '4.5rem'
          }}>
            {itemsToRender.map(product => (
              <div
                key={product.id}
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease'
                }}
              >
                <div>
                  <div style={{ position: 'relative', height: '260px', overflow: 'hidden', background: '#0f172a' }}>
                    <img 
                      src={product.image} 
                      alt={product.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {product.badge && (
                      <span style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)'
                      }}>
                        {product.badge}
                      </span>
                    )}

                    <span style={{
                      position: 'absolute',
                      bottom: '14px',
                      right: '14px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      padding: '0.35rem 0.85rem',
                      borderRadius: '8px'
                    }}>
                      Starting {product.price} {product.unit}
                    </span>
                  </div>

                  <div style={{ padding: '1.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                      {product.title}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {product.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {product.features?.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                          <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} /> {feat}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 1.75rem 1.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange"
                    style={{ width: '100%', fontWeight: 800, justifyContent: 'center', padding: '0.85rem' }}
                    onClick={() => openStoreOrderModal(product)}
                  >
                    Customize & Order This Style <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 3. Sizing & Specifications Guide */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} style={{ color: 'var(--orange-500)' }} /> Standard Apparel Sizing Matrix
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Size</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Chest Width (Inches)</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Body Length (Inches)</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 800 }}>Embroidery Placement</th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--orange-600)' }}>{row.size}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{row.chest}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{row.length}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Left Chest / Right Sleeve / Back Neck</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Bottom Order Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-900) 0%, #ff7a00 100%)',
        padding: '3.5rem 2rem',
        color: '#ffffff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
            Ready to Order Custom Apparel?
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#f1f5f9', lineHeight: 1.6, marginBottom: '2rem' }}>
            Upload your logo today to receive a free pre-production sew-out proof before volume production begins.
          </p>
          <button
            type="button"
            className="btn btn-primary-orange btn-lg"
            style={{ fontWeight: 800, padding: '1rem 2.5rem', background: '#ffffff', color: 'var(--navy-950)' }}
            onClick={() => protectedNavigate('customer', true)}
          >
            Start Apparel Order <ArrowRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
};
