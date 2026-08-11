'use client';

import React, { useState } from 'react';
import { Layers, PenTool, Tag, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { matchCategory, normalizeCategory } from '../../utils/categoryUtils';

export const ServicesOverview = () => {
  const navigate = useNavigate();
  const { servicesList = [], activeHomeServiceTab = 'all', openOrderWizard, protectedNavigate } = useAppState?.() || {};

  const filteredRawServices = (servicesList || []).filter(s => {
    if (s.is_active === false) return false;
    return matchCategory(s.category, activeHomeServiceTab);
  });

  const services = filteredRawServices.map(s => {
    const catKey = normalizeCategory(s.category);
    let icon = <Layers size={24} color="var(--orange-500)" />;
    if (catKey === 'vector-art' || (s.title || '').toLowerCase().includes('vector')) {
      icon = <PenTool size={24} color="var(--orange-500)" />;
    } else if (catKey === 'patches' || (s.title || '').toLowerCase().includes('patch')) {
      icon = <Tag size={24} color="var(--orange-500)" />;
    }

    return {
      id: s.id,
      title: s.title,
      category: s.category,
      description: s.description,
      icon,
      features: Array.isArray(s.features) ? s.features : [],
      price: s.price || s.rate || '',
      link: s.route || s.link || '/'
    };
  });

  const categoryHeadings = {
    all: {
      badge: 'Our Core Services',
      title: 'Everything Your Brand Needs',
      subtext: 'From manual digitizing and vector conversion to physical custom patches, we offer premium end-to-end solutions for apparel decorators and promotional businesses.'
    },
    embroidery: {
      badge: 'Embroidery Digitizing',
      title: 'Commercial Embroidery Digitizing Services',
      subtext: 'Production-ready embroidery stitch files engineered for Tajima, Brother, Melco, Janome & Barudan machines with zero thread breaks.'
    },
    'vector-art': {
      badge: 'Vector Art Conversion',
      title: 'Raster to Scalable Vector Artwork Services',
      subtext: '100% hand-drawn vector redrawing, color separation, and high-resolution paths for print, screen printing, and merchandise.'
    },
    patches: {
      badge: 'Custom Patches',
      title: 'Physical Custom Patches & Emblems',
      subtext: 'High-density embroidered, 3D molded waterproof PVC, woven, and leather patches with velcro, iron-on, or sew-on backings.'
    }
  };

  const currentCategoryKey = normalizeCategory(activeHomeServiceTab);
  const headingInfo = categoryHeadings[currentCategoryKey] || categoryHeadings.all;

  const handleOrder = (service) => {
    const type = normalizeCategory(service.category);
    if (openOrderWizard) {
      openOrderWizard({ type, title: service.title });
    } else {
      protectedNavigate('customer', true, { type, title: service.title });
    }
  };

  return (
    <section id="services-overview" style={styles.section}>
      <div style={styles.container}>
        <div style={styles.headerContainer}>
          <div style={styles.pillBadge}>{headingInfo.badge}</div>
          <h2 style={styles.heading}>{headingInfo.title}</h2>
          <p style={styles.subtext}>{headingInfo.subtext}</p>
        </div>

        {services.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No active services available in this category yet.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {services.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onOrder={() => handleOrder(service)} 
                onNavigate={() => navigate(service.link)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const ServiceCard = ({ service, onOrder, onNavigate }) => {
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
        {service.price && <div style={styles.priceBadge}>{service.price}</div>}
      </div>
      
      <h3 style={styles.cardTitle}>{service.title}</h3>
      <p style={styles.cardDescription}>{service.description}</p>
      
      {service.features.length > 0 && (
        <ul style={styles.featureList}>
          {service.features.map((feature, idx) => (
            <li key={idx} style={styles.featureItem}>
              <Check size={18} style={styles.checkIcon} />
              <span style={styles.featureText}>{feature}</span>
            </li>
          ))}
        </ul>
      )}
      
      <button 
        style={buttonStyle} 
        onClick={onOrder}
        aria-label={`Get started with ${service.title}`}
      >
        <span>Get Started</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};

const styles = {
  section: {
    backgroundColor: 'var(--bg-main, #f8fafc)',
    padding: '70px 24px',
    fontFamily: 'var(--font-body, "Inter", sans-serif)',
    color: 'var(--text-main, #0f172a)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerContainer: {
    textAlign: 'center',
    marginBottom: '48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: 'var(--orange-50, #fff7ed)',
    color: 'var(--orange-600, #ea580c)',
    padding: '6px 16px',
    borderRadius: '9999px',
    fontSize: '0.875rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '16px',
    border: '1px solid #ffd4a3',
  },
  heading: {
    fontFamily: 'var(--font-heading, sans-serif)',
    fontSize: 'clamp(2rem, 4vw, 2.5rem)',
    fontWeight: '800',
    color: 'var(--navy-950, #090d16)',
    margin: '0 0 16px 0',
    lineHeight: '1.2',
  },
  subtext: {
    fontSize: '1.125rem',
    color: 'var(--text-muted, #64748b)',
    maxWidth: '650px',
    margin: '0',
    lineHeight: '1.6',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '32px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid var(--border-color, #e2e8f0)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  emptyText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'var(--text-muted, #64748b)',
    margin: 0
  },
  card: {
    backgroundColor: 'var(--bg-card, #ffffff)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid var(--border-color, #e2e8f0)',
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
    borderTop: '4px solid var(--orange-500, #ff7a00)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  iconContainer: {
    backgroundColor: 'var(--orange-50, #fff7ed)',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBadge: {
    backgroundColor: 'var(--navy-950, #090d16)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '700',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading, sans-serif)',
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'var(--navy-950, #090d16)',
    margin: '0 0 12px 0',
  },
  cardDescription: {
    fontSize: '1rem',
    color: 'var(--text-muted, #64748b)',
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
    color: 'var(--orange-500, #ff7a00)',
    marginRight: '12px',
    flexShrink: '0',
    marginTop: '2px',
  },
  featureText: {
    fontSize: '0.9375rem',
    color: 'var(--text-main, #0f172a)',
    lineHeight: '1.5',
  },
  button: {
    width: '100%',
    padding: '14px 24px',
    backgroundColor: 'transparent',
    color: 'var(--orange-600, #ea580c)',
    border: '2px solid var(--orange-500, #ff7a00)',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  buttonHover: {
    backgroundColor: 'var(--orange-500, #ff7a00)',
    color: 'white',
  }
};
