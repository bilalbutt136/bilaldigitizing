'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileCheck, Users, Globe, Zap, ShieldCheck, Headphones, Award } from 'lucide-react';
import { useAppState } from '../../context/StateContext';

// Icon mapper for dynamic string icon names from DB
const IconRenderer = ({ iconName, size = 24, color = "var(--orange-500, #ff7a00)" }) => {
  switch (iconName?.toLowerCase()) {
    case 'filecheck': return <FileCheck size={size} color={color} />;
    case 'users': return <Users size={size} color={color} />;
    case 'globe': return <Globe size={size} color={color} />;
    case 'zap': return <Zap size={size} color={color} />;
    case 'headphones': return <Headphones size={size} color={color} />;
    case 'award': return <Award size={size} color={color} />;
    case 'shieldcheck':
    case 'shield':
    default:
      return <ShieldCheck size={size} color={color} />;
  }
};

const AnimatedNumber = ({ end, duration = 2000, suffix = '', isStatic = false, staticText = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  useEffect(() => {
    if (!isVisible || isStatic) return;

    let startTime = null;
    const endNum = parseInt(end.toString().replace(/,/g, ''), 10);
    
    if (isNaN(endNum)) return;

    const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4);

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const currentCount = Math.floor(easeOutQuart(progress) * endNum);
      setCount(currentCount);

      if (progress < 1) requestAnimationFrame(animate);
      else setCount(endNum);
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration, isStatic]);

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (isStatic) {
    return (
      <span ref={ref} style={{ fontWeight: '800', fontSize: '2.15rem', color: '#ffffff', textShadow: '0 0 20px rgba(255, 122, 0, 0.3)', fontFamily: 'var(--font-heading)' }}>
        {staticText}
      </span>
    );
  }

  return (
    <span ref={ref} style={{ fontWeight: '800', fontSize: '2.15rem', color: '#ffffff', textShadow: '0 0 20px rgba(255, 122, 0, 0.3)', fontFamily: 'var(--font-heading)' }}>
      {formatNumber(count)}
      <span style={{ color: 'var(--orange-500, #ff7a00)' }}>{suffix}</span>
    </span>
  );
};

export const TrustStatsBar = () => {
  const { homePageConfig } = useAppState();
  const dbStats = homePageConfig?.trustStats || [];

  // Fallback defaults if DB is empty
  let displayStats = dbStats.filter(s => s.is_active !== false).map(s => ({
    id: s.id,
    icon: <IconRenderer iconName={s.icon} size={24} color="var(--orange-500)" />,
    value: s.value,
    suffix: s.suffix || (isNaN(parseInt(s.value)) ? '' : '+'),
    label: s.label,
    isStatic: s.is_static || isNaN(parseInt(String(s.value).replace(/,/g, ''), 10)),
    staticText: s.value
  }));

  if (displayStats.length === 0) {
    displayStats = [
      { id: '1', icon: <FileCheck size={24} color="var(--orange-500)" />, value: '15000', suffix: '+', label: 'Orders Completed', isStatic: false, staticText: '15000' },
      { id: '2', icon: <Users size={24} color="var(--orange-500)" />, value: '1200', suffix: '+', label: 'Happy Clients', isStatic: false, staticText: '1200' },
      { id: '3', icon: <ShieldCheck size={24} color="var(--orange-500)" />, value: '100', suffix: '%', label: 'Success Rate', isStatic: false, staticText: '100' },
      { id: '4', icon: <Zap size={24} color="var(--orange-500)" />, value: '12h', suffix: '', label: 'Avg Turnaround', isStatic: true, staticText: '12h' }
    ];
  }

  return (
    <section 
      style={{
        backgroundColor: 'var(--navy-950, #0f172a)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '3rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '100%',
        background: 'radial-gradient(ellipse at top, rgba(255, 122, 0, 0.08) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid-responsive-4" style={{ alignItems: 'center' }}>
          {displayStats.map((stat) => (
            <div 
              key={stat.id} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                textAlign: 'center', 
                padding: '1.25rem 1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ 
                background: 'rgba(255, 122, 0, 0.12)', 
                padding: '0.75rem', 
                borderRadius: '14px', 
                marginBottom: '0.85rem', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 0 16px rgba(255, 122, 0, 0.2)' 
              }}>
                {stat.icon}
              </div>
              <AnimatedNumber end={stat.value} suffix={stat.suffix} isStatic={stat.isStatic} staticText={stat.staticText} />
              <span style={{ 
                color: '#94a3b8', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                marginTop: '0.4rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontFamily: 'var(--font-heading)' 
              }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};


