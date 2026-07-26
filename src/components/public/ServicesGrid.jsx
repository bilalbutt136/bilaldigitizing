import React from 'react';
import { SERVICES } from '../../data/mockData';
import { useAppState } from '../../context/StateContext';
import { 
  Shirt, 
  HardHat, 
  Layers, 
  PenTool, 
  Tag, 
  Palette, 
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const iconMap = {
  Shirt: Shirt,
  HardHat: HardHat,
  Layers: Layers,
  PenTool: PenTool,
  Tag: Tag,
  Palette: Palette
};

export const ServicesGrid = () => {
  const { servicesList = [], protectedNavigate } = useAppState();

  return (
    <section id="services" style={{ padding: '5.5rem 0', background: 'var(--navy-100)' }}>
      <div className="container">
        
        {/* Section Header */}
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
            <Sparkles size={16} /> Specialized Studio Capabilities
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Comprehensive Embroidery & Vector Services
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.075rem', lineHeight: 1.6 }}>
            Hand-digitized by master pathing engineers and machine-tested for commercial multi-needle machines, single-head units, and high-speed workshop runs.
          </p>
        </div>

        {/* Services Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.75rem'
        }}>
          {servicesList.map((srv, idx) => {
            const IconComponent = iconMap[srv.icon] || Shirt;
            const isFeatured = idx === 0 || idx === 1;

            return (
              <div 
                key={srv.id}
                className="card"
                style={{
                  padding: '2.25rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  background: '#ffffff',
                  borderTop: '4px solid var(--orange-500)',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{
                      background: 'rgba(249, 115, 22, 0.1)',
                      color: 'var(--orange-600)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      display: 'inline-flex'
                    }}>
                      <IconComponent size={28} />
                    </div>
                    
                    <span style={{ 
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      background: '#fff7ed',
                      color: 'var(--orange-600)',
                      border: '1.5px solid #ffedd5',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px'
                    }}>
                      {srv.price}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.65rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                    {srv.title}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                    {srv.desc}
                  </p>
                </div>

                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.825rem',
                    color: 'var(--navy-700)',
                    marginBottom: '1.25rem'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                      <Clock size={15} style={{ color: 'var(--orange-500)' }} /> {srv.time}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--green-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={14} /> {srv.stitches}
                    </span>
                  </div>

                  <button 
                    className="btn btn-primary-orange"
                    style={{ width: '100%', justifyContent: 'space-between', fontWeight: 700 }}
                    onClick={() => protectedNavigate('customer', true)}
                  >
                    Order {srv.title.split(' ')[0]} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
