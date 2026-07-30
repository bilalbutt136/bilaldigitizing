'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Headphones, 
  RotateCcw,
  Lock,
  Clock
} from 'lucide-react';

export const WhyChooseUs = () => {
  return (
    <section id="formats" style={{ padding: '5.5rem 0', background: '#ffffff' }}>
      <div className="container">
        
        {/* Section Title */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={16} /> Industry Leading Precision
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Why Commercial Embroidery Shops Trust Us
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            We work as an extended digitizing department for 1,200+ apparel decorators, screen printers, and hat manufacturers worldwide.
          </p>
        </div>

        {/* 6 High Impact Studio Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          marginBottom: 0
        }}>
          {[
            {
              icon: Clock,
              title: '4 - 12 Hour Turnaround Time',
              desc: 'Rapid delivery on all cap logos, left chest designs, and jacket backs with express 4-hour rush processing available 24/7.'
            },
            {
              icon: ShieldCheck,
              title: '100% Stitch Verified (.EMB, .DST, .PES)',
              desc: 'Every file undergoes Wilcom pathing simulation to guarantee zero thread trims, clean satin fills, and zero needle breaks.'
            },
            {
              icon: Cpu,
              title: 'Custom Fabric Pull Compensation',
              desc: 'We map stitch underlay and pull compensation specifically for your fabric type—preventing puckering on knits and sinking on fleece.'
            },
            {
              icon: RotateCcw,
              title: 'Unlimited Free Revisions',
              desc: 'Need a small tweak, size scaling, or color thread re-assignment? We adjust your files within 4 hours at zero extra charge.'
            },
            {
              icon: Headphones,
              title: '24/7 Dedicated Studio Support',
              desc: 'Direct communication with master digitizing engineers via live portal dashboard and instant order chat notifications.'
            },
            {
              icon: Lock,
              title: '100% Confidentiality & Data Security',
              desc: 'Your brand assets and client artwork are kept strictly confidential with encrypted SSL transfers and secure cloud storage.'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="card"
                style={{ 
                  padding: '2rem', 
                  textAlign: 'left', 
                  background: 'var(--bg-main)',
                  border: '1.5px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  background: 'var(--orange-50)',
                  color: 'var(--orange-700)',
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}>
                  <Icon size={26} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.55 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
