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
  return (
    <div className="gig-card" onClick={onNavigate} style={{ cursor: 'pointer' }}>
      <img 
        src={service.category === 'Vector Art' ? '/assets/vector-mock.jpg' : '/assets/embroidery-mock.jpg'} 
        alt={service.title}
        className="gig-image"
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = 'https://placehold.co/600x400/1e293b/ffffff?text=Service+Preview';
        }}
      />
      <div className="gig-body">
        <div className="gig-seller">
          <div className="gig-seller-avatar">B</div>
          <span className="gig-seller-name">B Digitizing Studio</span>
        </div>
        <h3 className="gig-title" onClick={(e) => { e.stopPropagation(); onNavigate(); }}>
          {service.title}
        </h3>
        <div className="gig-rating">
          <span className="gig-rating-star">★</span>
          <span className="gig-rating-score">5.0</span>
          <span className="gig-rating-count">(1k+)</span>
        </div>
      </div>
      <div className="gig-footer">
        <button 
          onClick={(e) => { e.stopPropagation(); onOrder(); }}
          style={{ background: 'none', border: 'none', color: '#74767e', cursor: 'pointer' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <div className="gig-footer-price">
          <span className="gig-footer-label">Starting At</span>
          <span className="gig-footer-amount">{service.price || '$10'}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  section: {
    backgroundColor: 'var(--bg-main, #ffffff)',
    padding: '70px 24px',
    fontFamily: 'var(--font-body, "Inter", sans-serif)',
    color: 'var(--text-main, #0f172a)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerContainer: {
    marginBottom: '48px',
  },
  pillBadge: {
    display: 'none', // Removed for Fiverr layout
  },
  heading: {
    fontFamily: 'var(--font-heading, sans-serif)',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#404145',
    margin: '0 0 8px 0',
  },
  subtext: {
    display: 'none', // Removed for Fiverr layout
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #e4e5e7',
  },
  emptyText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#74767e',
    margin: 0
  }
};
