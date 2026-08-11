'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    heroGlobalSettings,
    setActiveHomeServiceTab
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');

  // Fallback for global settings
  const globalTitle = heroGlobalSettings?.title || "Find the perfect custom digitizing and patches for your business";

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to pricing or catalog based on search
    navigate('/pricing');
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    if (tag.toLowerCase().includes('embroidery')) {
      if (setActiveHomeServiceTab) setActiveHomeServiceTab('embroidery');
      navigate('/services/embroidery-digitizing');
    } else if (tag.toLowerCase().includes('vector')) {
      if (setActiveHomeServiceTab) setActiveHomeServiceTab('vector-art');
      navigate('/services/vector-tracing');
    } else {
      if (setActiveHomeServiceTab) setActiveHomeServiceTab('patches');
      navigate('/custom-patches');
    }
  };

  return (
    <section style={{
      background: 'var(--navy-950)',
      position: 'relative',
      padding: '6rem 0 8rem',
      overflow: 'hidden'
    }}>
      {/* Background Graphic / Glow */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(29, 191, 115, 0.1) 0%, transparent 50%)',
        zIndex: 1
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        
        <h1 style={{
          color: '#ffffff',
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          marginBottom: '2rem',
          maxWidth: '800px',
          lineHeight: 1.2,
          fontFamily: 'var(--font-heading)'
        }}>
          {globalTitle}
        </h1>

        {/* Massive Search Bar */}
        <form 
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: '700px',
            background: '#ffffff',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}
        >
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try '3D Puff Embroidery'"
            style={{
              flex: 1,
              padding: '1.25rem 1.5rem',
              fontSize: '1.1rem',
              border: 'none',
              outline: 'none',
              color: '#222325',
              fontFamily: 'var(--font-body)'
            }}
          />
          <button 
            type="submit"
            style={{
              background: '#1dbf73',
              color: '#ffffff',
              border: 'none',
              padding: '0 2.5rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              fontFamily: 'var(--font-heading)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#19a463'}
            onMouseOut={(e) => e.currentTarget.style.background = '#1dbf73'}
          >
            Search
          </button>
        </form>

        {/* Popular Tags */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <span style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem' }}>Popular:</span>
          {['Embroidery Digitizing', 'Vector Tracing', 'Custom PVC Patches', 'Woven Labels'].map((tag, idx) => (
            <button
              key={idx}
              onClick={() => handleTagClick(tag)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#ffffff',
                padding: '0.35rem 1rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              }}
            >
              {tag}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
};
