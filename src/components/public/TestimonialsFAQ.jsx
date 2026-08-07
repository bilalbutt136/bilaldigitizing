'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { Star, ChevronDown, ChevronUp, Quote } from 'lucide-react';

export const TestimonialsFAQ = () => {
  const appState = useAppState?.() || {};

  // 6-8 default testimonials covering all 3 services
  const defaultTestimonials = [
    {
      name: 'Dave Miller',
      role: 'Owner, Custom Cap Crafters',
      rating: 5,
      comment: 'Bilal Digitizing is our go-to partner for 3D puff cap digitizing. The foam compensation and center-out pathing are flawless. Zero thread breaks on our Tajima 6-head machine!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      service: 'Embroidery'
    },
    {
      name: 'Marcus Thorne',
      role: 'Art Director, Vintage Apparel Co.',
      rating: 5,
      comment: 'The vector artwork conversions are super clean. Low-resolution client PNGs get turned into crisp AI/SVG files ready for screen printing color separation within hours.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
      service: 'Vector'
    },
    {
      name: 'James Wilson',
      role: 'Operations Lead, Tactical Gear USA',
      rating: 5,
      comment: 'We ordered 5,000 custom 3D PVC patches and the quality is outstanding. Completely waterproof, sharp molded details, and they shipped faster than our local supplier.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
      service: 'Patches'
    },
    {
      name: 'Sarah Jenkins',
      role: 'Production Manager, Apex Athletics',
      rating: 5,
      comment: 'Their 12-hour turnaround saved our team during high-season rush orders. The DST files sew clean on pique polos with zero puckering. Best digitizing service on the market.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      service: 'Embroidery'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Founder, Print Shop Express',
      rating: 5,
      comment: 'Absolutely blown away by the vector tracing quality. Hand-drawn nodes make a huge difference for our vinyl cutters. Perfectly separated Pantone spot colors every time.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
      service: 'Vector'
    },
    {
      name: 'Michael Chen',
      role: 'Merchandise Coordinator, SoundWave Fest',
      rating: 5,
      comment: 'The merrowed border woven patches were a huge hit at our festival. Clean threads, perfect iron-on backing, and delivered right on schedule.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
      service: 'Patches'
    }
  ];

  const defaultFaqs = [
    {
      category: 'General',
      q: 'What is your turnaround time?',
      a: 'Our standard turnaround time is 12 to 24 hours. We also offer Rush Service (4 to 8 hours) for a nominal fee if you have an urgent deadline.'
    },
    {
      category: 'General',
      q: 'What if I need revisions to my file?',
      a: 'We offer FREE unlimited revisions on all orders! If you need size adjustments, color edits, or density tweaks, we will update it within 4-6 hours.'
    },
    {
      category: 'Embroidery',
      q: 'What machine format files will I receive?',
      a: 'You will receive your digitized design in all standard formats including Tajima (.DST), Brother (.PES), Melco (.EXP), Janome (.JEF), Husqvarna (.HUS), and native Wilcom (.EMB).'
    },
    {
      category: 'Embroidery',
      q: 'How do you ensure stitch quality on different fabrics?',
      a: 'Every design is custom pathing-mapped by master digitizers. We tailor the stitch underlay, pull compensation, and density specifically to your target fabric (Pique, Denim, Cap Frame).'
    },
    {
      category: 'Vector',
      q: 'Do you use auto-trace software for vectors?',
      a: 'No. All our vector conversions are 100% hand-drawn in Adobe Illustrator using the pen tool to ensure crisp, node-perfect scalable files with zero distortion.'
    },
    {
      category: 'Vector',
      q: 'Will the colors be separated for screen printing?',
      a: 'Yes, we provide clean Pantone spot color separation on distinct layers, making the vector files fully ready for screen printing films and vinyl plotters.'
    },
    {
      category: 'Patches',
      q: 'What patch backings do you offer?',
      a: 'We offer iron-on (heat seal), hook-and-loop (velcro), adhesive peel-and-stick, and standard sew-on backings for all our embroidered, woven, and PVC patches.'
    },
    {
      category: 'Patches',
      q: 'Is there a minimum order quantity for custom patches?',
      a: 'We have very low minimums. While bulk orders give you the best pricing, we can accommodate smaller runs starting at just 10 pieces for most patch types.'
    }
  ];

  const { activeHomeServiceTab } = useAppState?.() || {};
  const currentServiceKey = activeHomeServiceTab === 'vector' ? 'Vector' : activeHomeServiceTab === 'patches' || activeHomeServiceTab === 'patch' ? 'Patches' : 'Embroidery';

  const testimonials = (appState.testimonials || defaultTestimonials).filter(
    (t) => t.service === currentServiceKey
  );
  const faqs = appState.faqs || defaultFaqs;

  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeFaqTab, setActiveFaqTab] = useState(currentServiceKey);
  const [hoveredTestimonial, setHoveredTestimonial] = useState(null);

  // Sync activeFaqTab when global service changes
  useEffect(() => {
    setActiveFaqTab(currentServiceKey);
  }, [currentServiceKey]);

  // Optionally hide faqTabs if we want it fully synced with home tab
  // Or just filter filteredFaqs to only the activeFaqTab (which tracks currentServiceKey)
  const filteredFaqs = faqs.filter(faq => faq.category === activeFaqTab);

  // Responsive state for grid layout
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section id="faqs" style={{ padding: '6rem 0', background: 'var(--bg-main)', position: 'relative' }}>
      <div className="container">
        
        {/* Testimonials Block */}
        <div style={{ marginBottom: '6rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--orange-500)',
              fontWeight: 700,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.5rem'
            }}>
              <Quote size={16} /> Client Verification
            </div>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem', lineHeight: 1.2 }}>
              Trusted by 1,200+ Apparel Decorators & Brands
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              From complex 3D puff embroidery to meticulous vector conversions and premium physical patches, our clients rely on us for production-ready quality.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            {testimonials.map((t, idx) => {
              const isHovered = hoveredTestimonial === idx;
              return (
                <div 
                  key={idx}
                  onMouseEnter={() => setHoveredTestimonial(idx)}
                  onMouseLeave={() => setHoveredTestimonial(null)}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: isHovered 
                      ? '0 20px 40px -10px rgba(0,0,0,0.1), 0 10px 20px -5px rgba(255,122,0,0.1)' 
                      : '0 4px 6px -1px rgba(0,0,0,0.05)',
                    transform: isHovered ? 'translateY(-5px)' : 'none',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid var(--border-color)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '4px', 
                    background: isHovered ? 'var(--orange-500)' : 'transparent',
                    transition: 'background 0.3s ease'
                  }}></div>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" stroke="none" />
                        ))}
                      </div>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        background: 'var(--orange-50)', 
                        color: 'var(--orange-600)',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px'
                      }}>
                        {t.service}
                      </span>
                    </div>
                    <p style={{ color: 'var(--navy-800)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                      "{t.comment}"
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={t.avatar} 
                      alt={t.name} 
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-950)' }}>{t.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQs Accordion Block */}
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', color: 'var(--navy-950)', marginBottom: '1rem' }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
              Everything you need to know about files, turnaround times, and free revisions for our services.
            </p>
            
            {/* Filter Tabs - Hidden as it is controlled globally now */}
            <div style={{ display: 'none' }}>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '12px',
                      border: isOpen ? '1px solid var(--orange-500)' : '1px solid var(--border-color)',
                      boxShadow: isOpen ? '0 4px 12px rgba(255,122,0,0.05)' : 'none',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '1.25rem 1.5rem',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)'
                      }}
                    >
                      <span style={{ paddingRight: '1rem' }}>{faq.q}</span>
                      <div style={{ 
                        color: isOpen ? 'var(--orange-500)' : 'var(--text-muted)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    <div style={{
                      maxHeight: isOpen ? '500px' : '0',
                      opacity: isOpen ? 1 : 0,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease-in-out'
                    }}>
                      <div style={{
                        padding: '0 1.5rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '1rem',
                        lineHeight: 1.6,
                      }}>
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No FAQs available for this category yet.
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
