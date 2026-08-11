'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileCheck, Users, Globe, Zap, ShieldCheck, Headphones } from 'lucide-react';

let useAppState;
try {
  useAppState = require('../../context/StateContext').useAppState;
} catch (e) {
  useAppState = () => ({ siteSettings: {}, homePageConfig: {} });
}

// Icon mapper for dynamic string icon names from DB
const IconRenderer = ({ iconName, size = 24, color = "var(--orange-500, #ff7a00)" }) => {
  switch (iconName?.toLowerCase()) {
    case 'filecheck': return <FileCheck size={size} color={color} />;
    case 'users': return <Users size={size} color={color} />;
    case 'globe': return <Globe size={size} color={color} />;
    case 'zap': return <Zap size={size} color={color} />;
    case 'headphones': return <Headphones size={size} color={color} />;
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
      <span ref={ref} style={{ fontWeight: '700', fontSize: '2rem', color: '#ffffff', textShadow: '0 0 20px rgba(255, 122, 0, 0.3)' }}>
        {staticText}
      </span>
    );
  }

  return (
    <span ref={ref} style={{ fontWeight: '700', fontSize: '2rem', color: '#ffffff', textShadow: '0 0 20px rgba(255, 122, 0, 0.3)', fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)' }}>
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
    icon: <IconRenderer iconName={s.icon} />,
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
        borderTop: '2px solid var(--orange-500, #ff7a00)',
        padding: '3rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '60%', height: '100%',
        background: 'radial-gradient(ellipse at top, rgba(255, 122, 0, 0.05) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px', margin: '0 auto', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem',
        position: 'relative', zIndex: 1
      }}>
        {displayStats.map((stat, index) => (
          <div key={stat.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem', borderRight: index !== displayStats.length - 1 ? '1px solid rgba(226, 232, 240, 0.1)' : 'none' }}>
            <div style={{ background: 'rgba(255, 122, 0, 0.1)', padding: '0.75rem', borderRadius: '50%', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(255, 122, 0, 0.15)' }}>
              {stat.icon}
            </div>
            <AnimatedNumber end={stat.value} suffix={stat.suffix} isStatic={stat.isStatic} staticText={stat.staticText} />
            <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', fontWeight: '500', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

