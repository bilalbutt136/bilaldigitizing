'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, MessageCircle, Search, Sparkles, HelpCircle, Layers, PenTool, Tag, CreditCard, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

const MASTER_DEFAULT_FAQS = [
  {
    category: 'Commercial Embroidery Digitizing',
    icon: 'Layers',
    questions: [
      {
        q: 'What commercial and home embroidery machine formats do you provide?',
        a: 'We export to all commercial and home machine formats: Tajima (.DST), Wilcom Master (.EMB), Brother/Baby Lock (.PES, .PEC), Barudan (.DSB, .DAT), Melco (.EXP), Janome (.JEF, .SEW), Husqvarna/Pfaff (.VP3, .VIP, .HUS), and Singer (.XXX). Every delivery also includes a high-resolution PDF Production Worksheet with stitch count, exact dimensions, thread color run sheet, and machine run-time calculations.'
      },
      {
        q: 'How do you guarantee zero thread breaks and machine-ready sew-outs?',
        a: 'Backed by 11+ years of factory digitizing experience, every design is 100% manually digitized (zero auto-trace). We engineer fabric-specific push-and-pull compensation (piqué knit, performance fleece, twill, leather, canvas), apply structured dual-underlay pathing, and program gradual lead-in stitch angles to eliminate needle deflection and thread breaks at high speeds (1,000+ SPM).'
      },
      {
        q: 'How do you digitize 3D Puff / Foam embroidery for structured caps and hats?',
        a: 'For 3D Foam / Puff embroidery, we digitize dedicated capping stitches to cleanly slice the EVA foam edges, program double density satin columns (0.18mm - 0.22mm), adjust pull compensation outward by +0.35mm–0.50mm, and sequence the design center-outward so the front cap seam does not distort or push off-register.'
      },
      {
        q: 'What is the standard turnaround time for digitizing orders?',
        a: 'Our standard turnaround is 12 to 24 hours. We also offer an express rush service delivered within 4 to 6 hours for time-sensitive commercial production deadlines, operating 24 hours a day, 7 days a week.'
      },
      {
        q: 'Can you digitize tiny text and intricate small details for left chest logos?',
        a: 'Yes. For small lettering down to 4mm (0.15 inch), we utilize specialized single-run underlay, precise start/stop knots, and 60-weight thread optimization to ensure crisp, legible text without knotting, birdnesting, or fabric puckering.'
      }
    ]
  },
  {
    category: 'Vector Art & Spot Color Separations',
    icon: 'PenTool',
    questions: [
      {
        q: 'What vector master file formats will I receive?',
        a: 'You receive complete master vector files in Adobe Illustrator (.AI), Scalable Vector Graphics (.SVG), Encapsulated PostScript (.EPS), Print-Ready Vector (.PDF), CorelDRAW (.CDR upon request), and ultra-high-resolution transparent 300 DPI (.PNG) files.'
      },
      {
        q: 'Can you convert blurry, low-resolution JPG or mobile phone photos into vector art?',
        a: 'Absolutely. We do not use automated live-trace tools which generate thousands of messy jagged nodes. Our artists manually redraw every Bézier curve, reconstruct lost geometry, identify original typography, and deliver mathematically pure, infinitely scalable vector artwork.'
      },
      {
        q: 'Do your vector conversions include Pantone (PMS) spot color separations?',
        a: 'Yes. For screen printing, vinyl cut, and heat-press transfers, we match exact Pantone Solid Coated (PMS) spot colors, generate registration marks, white underbase plates, and trap boundaries so your press operators can burn screens without misregistration.'
      },
      {
        q: 'Are your vector files compatible with laser cutters, CNC, and vinyl plotters?',
        a: 'Yes. All vectors are exported with closed, clean cut-paths, zero overlapping duplicate nodes, and single-hairline cut strokes ready for Roland, Graphtec, GCC vinyl cutters, CO2 lasers, and CNC routing machines.'
      }
    ]
  },
  {
    category: 'Custom Physical Patches & Manufacturing',
    icon: 'Tag',
    questions: [
      {
        q: 'What types of custom patches do you manufacture?',
        a: 'We manufacture four commercial-grade patch styles: (1) Classic 100% Embroidered Twill Patches with textured Rayon threads, (2) Ultra-High Density Woven Patches for photographic fine details, (3) 3D Molded Waterproof PVC Rubber Patches, and (4) Laser-Engraved Genuine & Faux Leather Patches.'
      },
      {
        q: 'What patch backing options are available?',
        a: 'We offer Military-Grade Velcro (Hook & Loop) backings for tactical gear/uniforms, Heat-Seal Iron-On backings for apparel, Peel-and-Stick self-adhesive sticker backings for events/hats, and traditional Plain Sew-On border backings.'
      },
      {
        q: 'What is the difference between a Merrowed border and a Laser Cut border?',
        a: 'A Merrowed border is a classic 1/8" sealed overlock stitch wrapped around standard geometric shapes (circles, squares, shields, rectangles). A Laser Cut border is heat-sealed directly along the outer perimeter of custom contour or die-cut irregular shapes.'
      },
      {
        q: 'Do I get to review a sew-out sample before mass patch production?',
        a: 'Yes! Before full manufacturing, our factory produces a physical sample patch, photographs the real sew-out under studio lighting, and sends high-resolution proof photos to your portal for approval.'
      }
    ]
  },
  {
    category: 'Billing, Payment Gateways & Security',
    icon: 'CreditCard',
    questions: [
      {
        q: 'What payment methods and gateways do you accept?',
        a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express, Discover, JCB), PayPal, Apple Pay, Google Pay, and Bolt Checkout. All transactions are processed in USD.'
      },
      {
        q: 'Is my payment and credit card information secure?',
        a: '100% secure. Our website is secured with bank-grade 256-bit SSL encryption. We comply with Payment Card Industry Data Security Standards (PCI-DSS). We never store or have direct access to your sensitive credit card numbers.'
      },
      {
        q: 'Do you provide automated VAT/tax commercial invoices?',
        a: 'Yes. Every order automatically generates a downloadable PDF tax invoice with full company billing information, line-item breakdowns, and payment confirmation receipts in your Client Portal.'
      },
      {
        q: 'How does the Studio Wallet system work?',
        a: 'The Studio Wallet allows high-volume apparel businesses and embroidery shops to deposit account credit in advance. Wallet checkouts process with 0ms latency and 1 click, eliminating repetitive credit card verifications for daily orders.'
      }
    ]
  },
  {
    category: 'Revisions, Turnaround & 100% Satisfaction Guarantee',
    icon: 'ShieldCheck',
    questions: [
      {
        q: 'What is your revision policy?',
        a: 'We provide free unlimited minor revisions on all digitizing and vector conversion files! Whether you need slight density adjustments, machine format conversions, thread color tweaks, or size scaling (up to 15%), we revise the file within 2 to 4 hours at zero extra charge.'
      },
      {
        q: 'What if the digitized file does not sew out cleanly on my machine?',
        a: 'We stand behind our 11-year reputation with a 100% Satisfaction & Money-Back Guarantee. If an embroidery file experiences thread breaks, puckering, or registration issues, our master digitizers will re-engineer the file immediately. If we cannot make it sew out perfectly, you receive a 100% full refund.'
      }
    ]
  }
];

export default function FAQsPage() {
  const { faqs: dbFaqs = [] } = useAppState() || {};
  const [faqs, setFaqs] = useState(MASTER_DEFAULT_FAQS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState('0-0');

  useEffect(() => {
    if (dbFaqs && dbFaqs.length > 0) {
      const groupedFaqs = dbFaqs.reduce((acc, faq) => {
        const cat = faq.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ q: faq.question || faq.q, a: faq.answer || faq.a });
        return acc;
      }, {});
      
      setFaqs(Object.keys(groupedFaqs).map(cat => ({
        category: cat,
        questions: groupedFaqs[cat]
      })));
    }
  }, [dbFaqs]);

  const categories = useMemo(() => {
    return ['All', ...faqs.map(f => f.category)];
  }, [faqs]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return faqs
      .filter(section => selectedCategory === 'All' || section.category === selectedCategory)
      .map(section => {
        if (!query) return section;
        const matchingQuestions = section.questions.filter(
          q => q.q.toLowerCase().includes(query) || q.a.toLowerCase().includes(query)
        );
        return {
          ...section,
          questions: matchingQuestions
        };
      })
      .filter(section => section.questions.length > 0);
  }, [faqs, searchQuery, selectedCategory]);

  const totalQuestionsCount = useMemo(() => {
    return filteredFaqs.reduce((acc, s) => acc + s.questions.length, 0);
  }, [filteredFaqs]);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const schemaData = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.flatMap(section => section.questions.map(q => ({
      "@type": "Question",
      "name": q.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.a
      }
    })))
  } : null;

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--color-text-primary)', minHeight: '100vh', paddingTop: 'clamp(2.5rem, 5vh, 4rem)', paddingBottom: '6rem' }}>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <div className="container" style={{ maxWidth: '980px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Hero Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))',
            border: '1px solid var(--border-color)',
            color: 'var(--color-primary, #ea580c)',
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '1.25rem'
          }}>
            <Sparkles size={16} />
            11+ Years Industry Knowledge Base
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-text-primary)',
            marginBottom: '1.25rem',
            letterSpacing: '-0.025em',
            lineHeight: 1.15
          }}>
            Frequently Asked <span style={{ color: 'var(--orange-500)' }}>Questions</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: 'var(--color-text-muted)',
            maxWidth: '680px',
            margin: '0 auto',
            lineHeight: 1.65
          }}>
            Search our master production archive for clear, authoritative answers regarding commercial embroidery digitizing, vector separations, patch manufacturing, file formats, rush turnarounds, and billing policies.
          </p>
        </div>

        {/* Live Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '2rem',
          maxWidth: '720px',
          margin: '0 auto 2rem'
        }}>
          <div style={{
            position: 'absolute',
            left: '1.25rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--orange-500)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions, machine formats, puff foam, PMS colors, refunds..."
            style={{
              padding: '1rem 1.25rem 1rem 3.25rem',
              borderRadius: '14px',
              fontSize: '1.05rem',
              border: '2px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              background: 'var(--bg-card)',
              color: 'var(--color-text-primary)'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--color-subtle)',
                color: 'var(--color-text-primary)',
                border: 'none',
                borderRadius: '999px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Interactive Category Filter Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setSelectedCategory(cat); setOpenIndex(null); }}
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '999px',
                  border: isSelected ? '1.5px solid var(--orange-500)' : '1px solid var(--border-color)',
                  background: isSelected ? 'var(--orange-500)' : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(249, 115, 22, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        {searchQuery && (
          <div style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: 'var(--color-text-primary)', fontWeight: 700 }}>
            Found {totalQuestionsCount} matching question{totalQuestionsCount === 1 ? '' : 's'} for "{searchQuery}"
          </div>
        )}

        {/* Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <HelpCircle size={48} style={{ color: 'var(--orange-400)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              No matching questions found
            </h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Try searching with different keywords, or connect with our 24/7 support engineers for immediate help.
            </p>
            <button
              type="button"
              className="btn btn-primary-orange"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {filteredFaqs.map((section, sIdx) => (
              <div key={sIdx}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  borderBottom: '2px solid var(--border-color)',
                  paddingBottom: '0.75rem'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary, #ea580c)'
                  }}>
                    <Layers size={18} />
                  </div>
                  <h2 style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-heading)',
                    margin: 0
                  }}>
                    {section.category}
                  </h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {section.questions.map((faq, qIdx) => {
                    const idx = `${sIdx}-${qIdx}`;
                    const isOpen = openIndex === idx;
                    
                    return (
                      <div 
                        key={qIdx} 
                        style={{ 
                          background: 'var(--bg-card)', 
                          borderRadius: '14px', 
                          border: isOpen ? '1.5px solid var(--orange-400)' : '1px solid var(--border-color)',
                          overflow: 'hidden',
                          boxShadow: isOpen ? '0 10px 25px rgba(249, 115, 22, 0.08)' : 'var(--shadow-sm)',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <button
                          onClick={() => toggleAccordion(idx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.25rem 1.5rem',
                            background: isOpen ? 'var(--color-subtle, var(--bg-subtle))' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: isOpen ? 'var(--orange-500)' : 'var(--color-text-primary)',
                            gap: '1rem'
                          }}
                        >
                          <span style={{ fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4 }}>
                            {faq.q}
                          </span>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: isOpen ? 'var(--orange-500)' : 'var(--color-subtle, var(--bg-subtle))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s ease'
                          }}>
                            <ChevronDown 
                              size={18} 
                              style={{ 
                                transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                                transition: 'transform 0.25s ease',
                                color: isOpen ? '#ffffff' : 'var(--color-text-muted)'
                              }} 
                            />
                          </div>
                        </button>
                        
                        <div 
                          style={{ 
                            maxHeight: isOpen ? '600px' : '0', 
                            overflow: 'hidden', 
                            transition: 'max-height 0.3s ease-in-out',
                            background: 'var(--bg-card)'
                          }}
                        >
                          <div style={{
                            padding: '0 1.5rem 1.5rem 1.5rem',
                            color: 'var(--color-text-secondary)',
                            fontSize: '0.975rem',
                            lineHeight: 1.75,
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '1rem'
                          }}>
                            {faq.a}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Support & Quote CTA Card (High-Contrast Professional Theme) */}
        <div style={{
          marginTop: '4.5rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '24px',
          padding: '3.5rem 2.5rem',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(249, 115, 22, 0.15)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            color: 'var(--orange-400)',
            marginBottom: '1.5rem'
          }}>
            <MessageCircle size={32} />
          </div>

          <h3 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.2rem)',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
            color: '#ffffff',
            marginBottom: '0.85rem',
            lineHeight: 1.2
          }}>
            Need Dedicated Support or a Custom Quote?
          </h3>

          <p style={{
            color: '#cbd5e1',
            fontSize: '1.05rem',
            lineHeight: 1.65,
            maxWidth: '560px',
            margin: '0 auto 2.25rem auto'
          }}>
            Our senior digitizers and production engineers are on standby <strong>24/7/365</strong> to review your artwork, recommend optimal fabric stabilizers, and answer any custom inquiries.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button 
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('bdigi_open_chat'));
                  setTimeout(() => {
                    const chatBtn = document.querySelector('.live-chat-floating-button') || document.querySelector('[data-chat-trigger="true"]');
                    if (chatBtn) chatBtn.click();
                  }, 100);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.95rem 2.25rem',
                borderRadius: '999px',
                fontSize: '1rem',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'transform 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start 24/7 Live Chat <ArrowRight size={18} />
            </button>

            <a
              href="mailto:orders@bdigitizing-pro.com"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '0.95rem 2rem',
                borderRadius: '999px',
                fontSize: '1rem',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              <Mail size={18} /> Email Production Desk
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
