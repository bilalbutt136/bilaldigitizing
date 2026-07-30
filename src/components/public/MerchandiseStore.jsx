'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  ShoppingBag, 
  Tag, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Shirt, 
  Layers, 
  HardHat, 
  PenTool,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Award,
  RefreshCw,
  HelpCircle,
  FileCheck
} from 'lucide-react';

import { useLocation } from '../../utils/navigation';

export const MerchandiseStore = () => {
  const { storeProducts = [], openStoreOrderModal } = useAppState();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  React.useEffect(() => {
    const cat = new URLSearchParams(location.search).get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [location.search]);

  const allProducts = (storeProducts && storeProducts.length > 0) ? storeProducts : [];

  const filteredItems = selectedCategory === 'all' 
    ? allProducts 
    : allProducts.filter(item => item.category === selectedCategory);

  return (
    <section id="store" style={{ padding: '3.5rem 0 5.5rem', background: 'var(--bg-main)' }}>
      <div className="container">
        
        {/* Sticky Filter Pills Container */}
        <div style={{
          position: 'sticky',
          top: '75px',
          zIndex: 90,
          background: 'rgba(248, 250, 252, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: '0.85rem 1.25rem',
          borderRadius: '9999px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          margin: '0 auto 3rem',
          maxWidth: '920px',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'all', label: 'All Items', icon: ShoppingBag, count: allProducts.length },
            { id: 'tshirts', label: 'Custom Apparel & Polos', icon: Shirt },
            { id: 'patches', label: 'Custom Patches (Woven & PVC)', icon: Layers },
            { id: 'caps', label: '3D Puff Caps & Hats', icon: HardHat },
            { id: 'vector', label: 'Digitizing Bundles', icon: PenTool }
          ].map(cat => {
            const IconComponent = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '9999px',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.85rem',
                  border: isSelected ? '2px solid var(--orange-500)' : '1px solid transparent',
                  background: isSelected ? 'var(--orange-500)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--navy-800)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.25)' : 'none'
                }}
              >
                <IconComponent size={15} style={{ color: isSelected ? '#ffffff' : 'var(--orange-500)' }} />
                <span>{cat.label}</span>
                {cat.count !== undefined && (
                  <span style={{
                    fontSize: '0.725rem',
                    background: isSelected ? '#ffffff' : '#e2e8f0',
                    color: isSelected ? 'var(--orange-600)' : 'var(--navy-800)',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    fontWeight: 800
                  }}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Store Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))',
          gap: '2.25rem',
          maxWidth: '1240px',
          margin: '0 auto 4.5rem'
        }}>
          {filteredItems.map(item => {
            const isOutOfStock = item.status === 'out_of_stock';

            return (
              <div 
                key={item.id}
                className="card"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1.5px solid var(--border-color)',
                  background: '#ffffff',
                  boxShadow: 'var(--shadow-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.28s ease',
                  position: 'relative',
                  opacity: isOutOfStock ? 0.88 : 1
                }}
              >
                <div>
                  {/* Image Container with Zoom Hover Effect & Badge */}
                  <div style={{ position: 'relative', height: '220px', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img 
                      src={item.image} 
                      alt={item.title}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover',
                        filter: isOutOfStock ? 'grayscale(75%) opacity(0.85)' : 'none',
                        transition: 'transform 0.5s ease'
                      }}
                      onMouseOver={(e) => {
                        if (!isOutOfStock) e.currentTarget.style.transform = 'scale(1.08)';
                      }}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                    />

                    {isOutOfStock ? (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: '#ef4444',
                        border: '1.5px solid #ffffff',
                        color: '#ffffff',
                        fontSize: '0.725rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '9999px',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.45)',
                        zIndex: 10
                      }}>
                        🚫 Out of Stock
                      </span>
                    ) : item.badge ? (
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
                        {item.badge}
                      </span>
                    ) : null}

                    {item.minQuantity && (
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
                        MOQ: {item.minQuantity} pcs
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.75rem 1.5rem 1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.6rem', lineHeight: 1.35 }}>
                      {item.title}
                    </h3>

                    {/* Starting Price & Rate Subtitle */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Starting from:</span>
                      <span style={{ fontSize: '1.85rem', fontWeight: 800, color: isOutOfStock ? '#94a3b8' : 'var(--orange-600)' }}>
                        {item.price}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.unit}
                      </span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
                      {item.description}
                    </p>

                    {/* Sizing & Available Options */}
                    {item.sizes && item.sizes.length > 0 && (
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--navy-900)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                          Available Options / Sizes:
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {item.sizes.map((sz, sIdx) => (
                            <span 
                              key={sIdx} 
                              style={{ 
                                fontSize: '0.725rem', 
                                padding: '0.25rem 0.55rem', 
                                background: '#fff7ed', 
                                border: '1px solid var(--orange-300)', 
                                borderRadius: 'var(--radius-sm)', 
                                color: 'var(--orange-700)', 
                                fontWeight: 800 
                              }}
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bullet Feature Specs */}
                    {item.features && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.5rem' }}>
                        {item.features.map((feat, fIdx) => (
                          <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', color: 'var(--navy-800)' }}>
                            <CheckCircle size={14} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Button */}
                <div style={{ padding: '0 1.5rem 1.65rem' }}>
                  {isOutOfStock ? (
                    <button 
                      type="button"
                      className="btn btn-lg"
                      disabled
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        fontWeight: 800, 
                        fontSize: '0.95rem',
                        background: '#cbd5e1',
                        color: '#475569',
                        border: '1.5px solid #94a3b8',
                        cursor: 'not-allowed',
                        opacity: 0.85
                      }}
                    >
                      🚫 Out of Stock (Unavailable)
                    </button>
                  ) : (
                    <button 
                      type="button"
                      className="btn btn-primary-orange btn-lg"
                      style={{ width: '100%', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem' }}
                      onClick={() => openStoreOrderModal(item)}
                    >
                      <ShoppingCart size={18} /> Customize & Order Now <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust & FAQ Guarantees Footer Row */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--border-color)',
          padding: '2.5rem 2rem',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '1240px',
          margin: '0 auto'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
              BUYER REASSURANCE & GUARANTEES
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)' }}>
              Why Leading Apparel Brands Trust Our Studio
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.75rem'
          }}>
            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ background: 'var(--orange-50)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.3rem' }}>
                  100% Machine Pathing Verified
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Every digitizing and emblem file is pre-tested on commercial Tajima, Barudan & Brother machines to prevent thread breaks.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.75rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
                <Award size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.3rem' }}>
                  Free Sew-Out Digital Proofs
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  We send high-resolution digital stitch proofs before running bulk merchandise orders. Free unlimited revisions guaranteed.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
                <Truck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.3rem' }}>
                  Express Production & Shipping
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Standard merchandise dispatch in 5-7 business days. 24/48-Hour express rush options available for urgent deadlines.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem' }}>
              <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
                <HelpCircle size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.3rem' }}>
                  Low MOQs & Bulk Tier Pricing
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Order from as low as 1 piece for digital bundles or 5-10 pcs for custom tees & patches. Automatic bulk discount applied.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

