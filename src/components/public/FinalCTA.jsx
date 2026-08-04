'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { Upload, ArrowRight, Shield, Globe, Zap, CheckCircle2 } from 'lucide-react';

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { protectedNavigate, openOrderWizard } = useAppState();
  
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const handleUploadClick = () => {
    protectedNavigate('customer', true);
  };

  const handleQuoteClick = () => {
    navigate('/pricing');
  };

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
          Transform Your Designs Into Production-Ready Masterpieces
        </h2>
        
        <p style={styles.subtext}>
          Whether you need precision embroidery digitizing, scalable vector artwork, or custom patches shipped to your door — our expert team delivers flawless results every time.
        </p>
        
        <div style={styles.buttonContainer}>
          <button 
            style={styles.primaryBtn}
            onClick={handleUploadClick}
            onMouseEnter={() => setHoveredBtn('primary')}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <Upload size={20} />
            Upload Your Design
          </button>
          
          <button 
            style={styles.secondaryBtn}
            onClick={handleQuoteClick}
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
