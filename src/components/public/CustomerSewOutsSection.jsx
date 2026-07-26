import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { CheckCircle2, ArrowRight, ShieldCheck, Sparkles, Layers, Eye } from 'lucide-react';

export const CustomerSewOutsSection = () => {
  const { protectedNavigate, sewOuts = [] } = useAppState();
  const [activeCard, setActiveCard] = useState(null);

  const defaultSewOuts = [
    {
      id: 'sewout-1',
      title: 'Logo Digitizing (Cap Embroidery)',
      category: 'Cap & Snapback Logo',
      beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      stitchCount: '8,400 Stitches',
      formats: 'DST, PES, EMB, EXP',
      features: ['Center-out cap pathing', '3D foam raised thread depth', 'Zero needle breaks']
    },
    {
      id: 'sewout-2',
      title: 'Live Graphic Image Digitizing',
      category: 'Complex Artwork & Emblems',
      beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      stitchCount: '14,200 Stitches',
      formats: 'DST, PES, JEF, HUS',
      features: ['High-density tatami fill', 'Precision color blending', 'Clean outline satin borders']
    },
    {
      id: 'sewout-3',
      title: 'Left Chest Digitizing (Polo & Apparel)',
      category: 'Corporate Uniform Logo',
      beforeImg: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
      stitchCount: '6,800 Stitches',
      formats: 'DST, PES, EMB, VP3',
      features: ['Knit fabric pull compensation', 'Smooth Underlay foundation', 'Zero puckering guaranteed']
    }
  ];

  const itemsToRender = (sewOuts && sewOuts.length > 0) ? sewOuts : defaultSewOuts;

  return (
    <section id="sew-outs" style={{ padding: '5rem 0', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1.5px solid var(--orange-200)',
            color: 'var(--orange-700)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.85rem'
          }}>
            <Sparkles size={16} /> Verified Machine Precision
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.85rem', fontWeight: 800 }}>
            Our Customers' Sew-Outs
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, margin: 0 }}>
            Real stitch-outs delivered to 1,200+ commercial embroidery shops and apparel decorators. Clean pathing, crisp satin fills, and zero thread breaks.
          </p>
        </div>

        {/* 3-Column Product Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {itemsToRender.map((item) => (
            <div 
              key={item.id}
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
                {/* Image Container with Before vs After Badge */}
                <div style={{ position: 'relative', height: '230px', overflow: 'hidden', background: '#0f172a' }}>
                  <img 
                    src={item.image || item.afterImg} 
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                  />

                  {/* Category Pill */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: '1.5px solid #ffffff',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.45)'
                  }}>
                    {item.category}
                  </span>

                  {/* Stitch Count Badge */}
                  <span style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}>
                    ⚡ {item.stitchCount}
                  </span>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                    {item.title}
                  </h3>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--orange-600)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={14} /> Formats: {item.formats}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Bottom Call To Action */}
        <div style={{ textAlign: 'center' }}>
          <button 
            type="button"
            className="btn btn-primary-orange btn-lg"
            style={{ 
              fontWeight: 800, 
              padding: '1rem 2.25rem', 
              fontSize: '1.1rem',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)'
            }}
            onClick={() => protectedNavigate('customer', true)}
          >
            Get My Design Digitized Now <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  );
};
