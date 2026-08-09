'use client';

import React, { useState } from 'react';
import { Layers, PenTool, Tag, Check } from 'lucide-react';
import { useNavigate } from '../../utils/navigation';

export const ServicesOverview = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 'embroidery',
      title: 'Embroidery Digitizing',
      description: 'Convert logos into flawless, production-ready machine embroidery files with precision stitching.',
      icon: <Layers size={24} color="var(--orange-500)" />,
      features: [
        '100% Manual Digitizing',
        'All Machine Formats (DST/PES/EMB/EXP)',
        'Free Unlimited Revisions',
        '4-12 Hour Turnaround'
      ],
      price: 'From $10.00',
      link: '/services/embroidery-digitizing'
    },
    {
      id: 'vector',
      title: 'Vector Art Conversion',
      description: 'Transform pixelated images into crisp, scalable vector graphics ready for premium printing.',
      icon: <PenTool size={24} color="var(--orange-500)" />,
      features: [
        'Hand-Drawn Node Tracing',
        'Pantone Color Separation',
        'AI/EPS/SVG/PDF Formats',
        'Print & Cut Ready'
      ],
      price: 'From $15.00',
      link: '/services/vector-tracing'
    },
    {
      id: 'patches',
      title: 'Custom Patches',
      description: 'Premium embroidered, woven, PVC & leather patches manufactured and shipped worldwide.',
      icon: <Tag size={24} color="var(--orange-500)" />,
      features: [
        'Embroidered/Woven/PVC/Leather',
        'Iron-On/Velcro/Sew-On Backing',
        'Worldwide Shipping',
        'Minimum 50 Pieces'
      ],
      price: 'From $1.50/patch',
      link: '/custom-patches'
    }
  ];

  return (
    <section style={styles.section}>
      <div className="w-full max-w-[1200px] px-4 mx-auto">
        <div style={styles.headerContainer}>
          <div style={styles.pillBadge}>Our Core Services</div>
          <h2 style={styles.heading}>Everything Your Brand Needs</h2>
          <p style={styles.subtext}>
            From manual digitizing and vector conversion to physical custom patches, we offer premium end-to-end solutions for apparel decorators and promotional businesses.
          </p>
        </div>

        <div style={styles.grid}>
          {services.map((service) => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onNavigate={() => navigate(service.link)} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const ServiceCard = ({ service, onNavigate }) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    ...styles.card,
    ...(isHovered ? styles.cardHover : {})
  };

  const buttonStyle = {
    ...styles.button,
    ...(isHovered ? styles.buttonHover : {})
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.cardHeader}>
        <div style={styles.iconContainer}>
          {service.icon}
        </div>
        <div style={styles.priceBadge}>{service.price}</div>
      </div>
      
      <h3 style={styles.cardTitle}>{service.title}</h3>
      <p style={styles.cardDescription}>{service.description}</p>
      
      <ul style={styles.featureList}>
        {service.features.map((feature, idx) => (
          <li key={idx} style={styles.featureItem}>
            <Check size={18} style={styles.checkIcon} />
            <span style={styles.featureText}>{feature}</span>
          </li>
        ))}
      </ul>
      
      <button 
        style={buttonStyle} 
        onClick={onNavigate}
        aria-label={`Get started with ${service.title}`}
      >
        Get Started
      </button>
    </div>
  );
};

const styles = {
  section: {
    backgroundColor: 'var(--bg-main)',
    padding: '80px 24px',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-main)',
  },
  container: {
    /* Migrated to className w-full max-w-[1200px] px-4 mx-auto */
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: '64px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: 'var(--orange-50)',
    color: 'var(--orange-600)',
    padding: '6px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    border: '1px solid #ffd4a3',
  },
  heading: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: '700',
    color: 'var(--navy-950)',
    margin: '0 0 16px 0',
    lineHeight: '1.2',
  },
  subtext: {
    fontSize: '1.125rem',
    color: 'var(--text-muted)',
    maxWidth: '650px',
    margin: '0',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    overflow: 'hidden',
  },
  cardHover: {
    transform: 'translateY(-6px)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    borderTop: '4px solid var(--orange-500)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  iconContainer: {
    backgroundColor: 'var(--orange-50)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    backgroundColor: 'var(--navy-950)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--navy-950)',
    margin: '0 0 12px 0',
  },
  cardDescription: {
    fontSize: '1rem',
    color: 'var(--text-muted)',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  featureList: {
    listStyle: 'none',
    padding: '0',
    margin: '0 0 32px 0',
    flexGrow: '1',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  checkIcon: {
    color: 'var(--orange-500)',
    marginRight: '12px',
    flexShrink: '0',
    marginTop: '2px',
  },
  featureText: {
    fontSize: '0.9375rem',
    color: 'var(--text-main)',
    lineHeight: '1.5',
  },
  button: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: 'transparent',
    color: 'var(--orange-600)',
    border: '2px solid var(--orange-500)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
  },
  buttonHover: {
    backgroundColor: 'var(--orange-500)',
    color: 'white',
  }
};
