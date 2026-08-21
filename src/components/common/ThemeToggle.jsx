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
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'var(--shadow-sm)',
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
          background: isDark ? 'var(--color-primary-light)' : '#fef3c7',
          color: isDark ? 'var(--color-primary)' : '#d97706',
          transition: 'all 0.25s ease'
        }}>
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </div>
        <span style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--color-text-primary)'
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
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: isDark ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.borderColor = 'var(--color-primary)';
        e.currentTarget.style.color = 'var(--color-primary)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.color = isDark ? 'var(--color-primary)' : 'var(--color-text-secondary)';
      }}
    >
      {isDark ? (
        <Sun size={18} style={{ transition: 'transform 0.3s ease' }} />
      ) : (
        <Moon size={18} style={{ transition: 'transform 0.3s ease' }} />
      )}
      {showLabel && (
        <span style={{ marginLeft: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {isDark ? 'White' : 'Dark'}
        </span>
      )}
    </button>
  );
};

