'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { Upload, ArrowRight, Shield, Globe, Zap, CheckCircle2 } from 'lucide-react';

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { activeHomeServiceTab, openOrderWizard, protectedNavigate } = useAppState();
  
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleCtaClick = () => {
    if (openOrderWizard) {
      const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
      openOrderWizard({ type: currentKey });
    } else {
      protectedNavigate('customer', true);
    }
  };

  const getDynamicContent = () => {
    if (activeHomeServiceTab === 'vector') {
      return {
        title: 'Transform Your Designs Into Resolution-Independent Vector Art',
        desc: 'Precision node tracing and Pantone spot color separation. Get clean, scalable vector files ready for high-quality printing.',
        btnText: 'Start Vector Conversion'
      };
    } else if (activeHomeServiceTab === 'patch' || activeHomeServiceTab === 'patches') {
      return {
        title: 'Transform Your Designs Into Premium Custom Patches',
        desc: 'High-density embroidered, woven, and PVC patches delivered to your door. Get a free digital proof and fast worldwide shipping.',
        btnText: 'Order Custom Patches'
      };
    }
    return {
      title: 'Transform Your Designs Into Production-Ready Masterpieces',
      desc: 'Precision embroidery digitizing with zero thread breaks. Get machine-ready stitch files engineered for your specific fabric and equipment.',
      btnText: 'Start Digitizing Now'
    };
  };

  const content = getDynamicContent();

  const styles = {
    section: {
      width: '100%',
      backgroundColor: 'var(--navy-950, #0f172a)',
      position: 'relative',
      padding: '6rem 1.5rem',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body, Inter, sans-serif)',
    },
    backgroundGlow: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100vw',
      height: '100vw',
      maxWidth: '800px',
      maxHeight: '800px',
      background: 'radial-gradient(circle, rgba(255,122,0,0.08) 0%, rgba(15,23,42,0) 70%)',
      pointerEvents: 'none',
      zIndex: 0,
    },
    container: {
      position: 'relative',
      zIndex: 1,
      maxWidth: '800px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    },
    pill: {
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 122, 0, 0.1)',
      border: '1px solid rgba(255, 122, 0, 0.2)',
      color: 'var(--orange-400, #ff9433)',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '600',
      marginBottom: '1.5rem',
      gap: '0.5rem',
    },
    headline: {
      color: '#ffffff',
      fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
      fontSize: 'clamp(2rem, 4vw + 1rem, 3.5rem)',
      fontWeight: '800',
      lineHeight: '1.2',
      marginBottom: '1.5rem',
    },
    subtext: {
      color: 'var(--text-muted, #94a3b8)',
      fontSize: '1.125rem',
      lineHeight: '1.6',
      marginBottom: '2.5rem',
      maxWidth: '640px',
    },
    buttonContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '3rem',
    },
    primaryBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: 'linear-gradient(135deg, var(--orange-500, #ff7a00), var(--orange-600, #e66e00))',
      color: '#ffffff',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: hoveredBtn === 'primary' ? 'translateY(-2px)' : 'none',
      boxShadow: hoveredBtn === 'primary' ? '0 10px 25px -5px rgba(255, 122, 0, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    secondaryBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      background: hoveredBtn === 'secondary' ? 'rgba(255,255,255,0.1)' : 'transparent',
      color: '#ffffff',
      border: '2px solid rgba(255,255,255,0.2)',
      padding: '1rem 2rem',
      borderRadius: '0.5rem',
      fontSize: '1.125rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      transform: hoveredBtn === 'secondary' ? 'translateY(-2px)' : 'none',
    },
    trustBadges: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '2rem',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      paddingTop: '2rem',
      width: '100%',
    },
    badge: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#cbd5e1',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    icon: {
      color: 'var(--orange-400, #ff9433)',
      width: '18px',
      height: '18px',
    },
  };

  return (
    <section style={styles.section}>
      <div style={styles.backgroundGlow} />
      
      <div style={styles.container}>
        <div style={styles.pill}>
          <span>🚀</span> Ready to Get Started?
        </div>
        
        <h2 style={styles.headline}>
          {content.title}
        </h2>
        
        <p style={styles.subtext}>
          {content.desc}
        </p>
        
        <div style={styles.buttonContainer}>
          <button 
            style={styles.primaryBtn}
            onClick={handleCtaClick}
            onMouseEnter={() => setHoveredBtn('primary')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Upload size={20} />
            {content.btnText}
          </button>
          
          <button 
            style={styles.secondaryBtn}
            onClick={() => navigate('/pricing')}
            onMouseEnter={() => setHoveredBtn('secondary')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Get Free Quote
            <ArrowRight size={20} />
          </button>
        </div>
        
        <div style={styles.trustBadges}>
          <div style={styles.badge}>
            <Shield style={styles.icon} />
            Secure Payments
          </div>
          <div style={styles.badge}>
            <Globe style={styles.icon} />
            Worldwide Delivery
          </div>
          <div style={styles.badge}>
            <Zap style={styles.icon} />
            4-Hour Express
          </div>
          <div style={styles.badge}>
            <CheckCircle2 style={styles.icon} />
            100% Satisfaction
          </div>
        </div>
      </div>
    </section>
  );
};
