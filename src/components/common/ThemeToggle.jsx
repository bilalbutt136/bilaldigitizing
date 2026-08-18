'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = ({ variant = 'icon', showLabel = false, style = {} }) => {
  const { theme, toggleTheme } = useAppState();
  const isDark = theme === 'dark';

  if (variant === 'pill') {
    return (
      <div 
        onClick={toggleTheme}
        role="button"
        tabIndex={0}
        aria-label={`Switch to ${isDark ? 'White' : 'Darker'} Mood`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          background: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(15, 23, 42, 0.12)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
          ...style
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: isDark ? '#312e81' : '#fef3c7',
          color: isDark ? '#a5b4fc' : '#d97706',
          transition: 'all 0.25s ease'
        }}>
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </div>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: isDark ? '#e2e8f0' : '#1e293b'
        }}>
          {isDark ? 'Darker Mood' : 'White Mood'}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'White' : 'Darker'} Mood`}
      title={`Switch to ${isDark ? 'White Mood ☀️' : 'Darker Mood 🌙'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        minWidth: '38px',
        minHeight: '38px',
        borderRadius: '10px',
        background: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(15, 23, 42, 0.12)',
        color: isDark ? '#fbbf24' : '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 5px rgba(0,0,0,0.03)',
        ...style
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        if (isDark) {
          e.currentTarget.style.background = '#1e293b';
          e.currentTarget.style.color = '#fef08a';
        } else {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.color = '#ea580c';
        }
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)';
        e.currentTarget.style.color = isDark ? '#fbbf24' : '#475569';
      }}
    >
      {isDark ? (
        <Sun size={18} style={{ transition: 'transform 0.3s ease' }} />
      ) : (
        <Moon size={18} style={{ transition: 'transform 0.3s ease' }} />
      )}
      {showLabel && (
        <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem', fontWeight: 700 }}>
          {isDark ? 'White' : 'Dark'}
        </span>
      )}
    </button>
  );
};
