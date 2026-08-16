'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';

const MASTER_DEFAULT_FAQS = [
  {
    category: 'Commercial Embroidery Digitizing',
    questions: [
      {
        q: 'What embroidery machine formats do you provide?',
        a: 'We provide all commercial and home embroidery formats including Tajima (.DST), Wilcom (.EMB), Brother/Baby Lock (.PES, .PEC), Barudan (.DSB, .DAT), Melco (.EXP), Janome (.JEF, .SEW), Husqvarna/Pfaff (.VP3, .VIP, .HUS), and Singer (.XXX). We also include a detailed PDF Production Worksheet with stitch count, exact dimensions, color sequence, and run time.'
      },
      {
        q: 'How do you guarantee zero thread breaks and machine-ready quality?',
        a: 'With 25+ years of factory-floor digitizing experience, every stitch file is manually digitized (never auto-traced). We engineer precise pull-and-push compensation tailored to your specific fabric (piqué knit, performance fleece, twill, leather, canvas), apply structured dual-underlay pathing, and program gradual lead-in angles to eliminate needle deflection and thread breaks at high speeds (1,000+ SPM).'
      },
      {
        q: 'How do you digitize 3D Puff embroidery for structured caps and hats?',
        a: 'For 3D Foam / Puff embroidery, we digitize dedicated capping stitches to cleanly slice the EVA foam edges, program double density satin columns (0.18mm - 0.22mm), adjust pull compensation outward by 0.3mm–0.5mm, and sequence the design center-outward so cap seams do not distort.'
      },
      {
        q: 'What is the standard turnaround time for digitizing orders?',
        a: 'Our standard turnaround is 12 to 24 hours. We also offer an express rush service delivered within 4 to 6 hours for time-sensitive commercial production deadlines, available 24/7.'
      },
      {
        q: 'Can you digitize tiny text and intricate small details for left chest logos?',
        a: 'Yes. For small lettering down to 4mm (0.15 inch), we utilize specialized single-run underlay, precise start/stop knots, and 60-weight thread optimization to ensure crisp, readable text without knotting or puckering.'
      }
    ]
  },
  {
    category: 'Vector Art & Screen Print Separations',
    questions: [
      {
        q: 'What vector file formats will I receive?',
        a: 'You receive complete master vector files in Adobe Illustrator (.AI), Scalable Vector Graphics (.SVG), Encapsulated PostScript (.EPS), Print-Ready Vector (.PDF), CorelDRAW (.CDR upon request), and high-resolution transparent 300 DPI (.PNG) files.'
      },
      {
        q: 'Can you convert blurry, low-resolution JPG or mobile phone photos into vector art?',
        a: 'Absolutely. We do not use automated live-trace tools which create messy jagged nodes. Our artists manually redraw every Bézier curve, reconstruct lost geometry, identify original typography, and deliver mathematically pure, infinitely scalable vector artwork.'
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
    questions: [
      {
        q: 'What types of custom patches do you manufacture?',
        a: 'We manufacture four commercial-grade patch styles: (1) Classic 100% Embroidered Twill Patches with raised texture, (2) Ultra-High Density Woven Patches for photographic fine details, (3) 3D Molded Waterproof PVC Rubber Patches, and (4) Laser-Engraved Genuine & Faux Leather Patches.'
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
    questions: [
      {
        q: 'What is your revision policy?',
        a: 'We provide free unlimited minor revisions on all digitizing and vector conversion files! Whether you need slight density adjustments, machine format conversions, thread color tweaks, or size scaling (up to 15%), we revise the file within 2 to 4 hours at zero extra charge.'
      },
      {
        q: 'What if the digitized file does not sew out cleanly on my machine?',
        a: 'We stand behind our 25-year reputation with a 100% Satisfaction & Money-Back Guarantee. If an embroidery file experiences thread breaks, puckering, or registration issues, our master digitizers will re-engineer the file immediately. If we cannot make it sew out perfectly, you receive a 100% full refund.'
      }
    ]
  }
];

export default function FAQsPage() {
  const { faqs: dbFaqs = [] } = useAppState() || {};
  const [faqs, setFaqs] = useState(MASTER_DEFAULT_FAQS);

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

  const [openIndex, setOpenIndex] = useState('0-0');

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
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '4rem', paddingBottom: '6rem' }}>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      )}
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--navy-950)', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Everything you need to know about our services, processes, and policies. Can't find the answer you're looking for? Feel free to contact our 24/7 support.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {faqs.map((section, sIdx) => (
            <div key={sIdx}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                {section.category}
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {section.questions.map((faq, qIdx) => {
                  const idx = `${sIdx}-${qIdx}`;
                  const isOpen = openIndex === idx;
                  
                  return (
                    <div 
                      key={qIdx} 
                      style={{ 
                        background: '#ffffff', 
                        borderRadius: '12px', 
                        border: '1px solid var(--border-color)',
                        overflow: 'hidden',
                        boxShadow: isOpen ? '0 10px 25px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <button
                        onClick={() => toggleAccordion(idx)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '1.5rem',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: isOpen ? 'var(--orange-600)' : 'var(--navy-900)',
                        }}
                      >
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{faq.q}</span>
                        <ChevronDown 
                          size={20} 
                          style={{ 
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', 
                            transition: 'transform 0.3s ease',
                            color: isOpen ? 'var(--orange-500)' : 'var(--navy-400)'
                          }} 
                        />
                      </button>
                      
                      <div 
                        style={{ 
                          maxHeight: isOpen ? '500px' : '0', 
                          overflow: 'hidden', 
                          transition: 'max-height 0.3s ease-in-out',
                          background: '#f8fafc'
                        }}
                      >
                        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
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
        
        <div style={{ marginTop: '4rem', background: 'var(--navy-900)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', color: '#ffffff' }}>
          <MessageCircle size={40} style={{ color: 'var(--orange-500)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Still have questions?</h3>
          <p style={{ color: 'var(--navy-200)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
            Our team is available 24/7 to assist you with any custom requests or specific inquiries.
          </p>
          <button 
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
              background: 'linear-gradient(135deg, #ff7a00, #ff9d40)',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '999px',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 122, 0, 0.3)'
            }}
          >
            Chat with Support
          </button>
        </div>

      </div>
    </div>
  );
}
