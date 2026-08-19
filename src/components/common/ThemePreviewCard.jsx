'use client';

import React from 'react';
import { Check, Sparkles, CheckCircle2, Clock, AlertCircle, Layers, Bell } from 'lucide-react';

/**
 * Reusable Theme Preview Card Component
 * Renders an interactive preview card displaying:
 * - Theme name, category badge, and 'Best For' tag
 * - 4-dot color palette preview
 * - Comprehensive Mini UI Mockup:
 *    * Mini Sidebar & Header
 *    * Primary Button & Secondary Button
 *    * Mini Card container
 *    * Table Row with Status Badges (Approved ✓ / In Progress ⏳)
 *    * Form Input field
 *    * Mini Notification banner
 * - Selected active checkmark state
 */
export default function ThemePreviewCard({
  themePreset,
  isSelected = false,
  mode = 'light',
  onSelect = () => {}
}) {
  if (!themePreset) return null;

  const tokens = (mode === 'dark' ? themePreset.tokens.dark : themePreset.tokens.light) || {};
  const isDark = mode === 'dark';

  const primaryColor = tokens['--color-primary'] || themePreset.palette.primary;
  const secondaryColor = tokens['--color-secondary'] || themePreset.palette.secondary;
  const accentColor = tokens['--color-accent'] || themePreset.palette.accent;
  const surfaceColor = tokens['--color-surface'] || (isDark ? '#111827' : '#ffffff');
  const bgColor = tokens['--color-background'] || (isDark ? '#070f1a' : '#f8fafc');
  const textColor = tokens['--color-text-primary'] || (isDark ? '#f8fafc' : '#0f172a');
  const textMuted = tokens['--color-text-muted'] || '#64748b';
  const borderColor = tokens['--color-border'] || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)');
  const textOnPrimary = tokens['--color-text-on-primary'] || '#ffffff';

  return (
    <div
      onClick={() => onSelect(themePreset.id)}
      style={{
        background: isDark ? '#111827' : '#ffffff',
        borderRadius: '18px',
        border: isSelected ? `2.5px solid ${primaryColor}` : '1.5px solid var(--border-color)',
        padding: '1.25rem',
        cursor: 'pointer',
        boxShadow: isSelected 
          ? `0 12px 30px -5px ${tokens['--color-primary-glow'] || 'rgba(0,0,0,0.15)'}, 0 0 0 1px ${primaryColor}`
          : 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        textAlign: 'left'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = primaryColor;
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
    >
      {/* Active Selection Badge Top Right */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: primaryColor,
          color: textOnPrimary,
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 8px ${tokens['--color-primary-glow'] || 'rgba(0,0,0,0.2)'}`,
          zIndex: 2
        }}>
          <Check size={14} strokeWidth={3} />
        </div>
      )}

      {/* Header Info: Title, Category & Palette Dots */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', paddingRight: isSelected ? '28px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
              {themePreset.name}
            </h3>
          </div>
          
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.2rem 0.55rem',
            borderRadius: '9999px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'var(--bg-subtle)',
            color: 'var(--text-muted)'
          }}>
            {themePreset.category}
          </span>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
          {themePreset.description}
        </p>

        {/* 4-Dot Color Palette Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '2px' }}>
            Palette:
          </span>
          <div title="Primary" style={{ width: '18px', height: '18px', borderRadius: '50%', background: themePreset.palette.primary, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
          <div title="Secondary" style={{ width: '18px', height: '18px', borderRadius: '50%', background: themePreset.palette.secondary, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
          <div title="Accent" style={{ width: '18px', height: '18px', borderRadius: '50%', background: themePreset.palette.accent, border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
          <div title="Surface" style={{ width: '18px', height: '18px', borderRadius: '50%', background: themePreset.palette.surface, border: '1px solid rgba(0,0,0,0.15)', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }} />
        </div>
      </div>

      {/* Mini UI Mockup Container */}
      <div style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        overflow: 'hidden'
      }}>
        
        {/* Mini Header & Navigation */}
        <div style={{
          background: surfaceColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '0.4rem 0.6rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: primaryColor }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: textColor }}>Studio UI</span>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: primaryColor, background: tokens['--color-primary-light'] || 'rgba(0,0,0,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Active</span>
          </div>
        </div>

        {/* Mini Card Layout */}
        <div style={{
          background: surfaceColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '0.6rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}>
          {/* Action Buttons Row */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              type="button"
              style={{
                background: primaryColor,
                color: textOnPrimary,
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <Sparkles size={10} /> Action
            </button>
            <button
              type="button"
              style={{
                background: 'transparent',
                color: textColor,
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                padding: '0.3rem 0.65rem',
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              Cancel
            </button>
          </div>

          {/* Mini Input Box */}
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.68rem',
            color: textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Search orders...</span>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: accentColor }} />
          </div>

          {/* Table Row with Status Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${borderColor}`,
            paddingTop: '0.4rem',
            fontSize: '0.68rem'
          }}>
            <span style={{ fontWeight: 700, color: textColor }}>ORD-4920</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <span style={{
                background: 'var(--color-success-bg, #ecfdf5)',
                color: 'var(--color-success-text, #065f46)',
                border: '1px solid var(--color-success-border, #a7f3d0)',
                padding: '0.1rem 0.4rem',
                borderRadius: '9999px',
                fontSize: '0.62rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                Approved ✓
              </span>
            </div>
          </div>
        </div>

        {/* Mini Notification Alert */}
        <div style={{
          background: tokens['--color-accent-light'] || 'rgba(0,0,0,0.04)',
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          padding: '0.3rem 0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.65rem',
          color: textColor,
          fontWeight: 600
        }}>
          <Bell size={10} style={{ color: primaryColor }} />
          <span>Instant sync active across portal</span>
        </div>

      </div>

      {/* Best For Tag Footer */}
      <div style={{
        fontSize: '0.73rem',
        fontWeight: 700,
        color: textMuted,
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '0.65rem',
        marginTop: 'auto'
      }}>
        <Layers size={13} style={{ color: primaryColor }} />
        <span>Best for: <strong style={{ color: 'var(--navy-950)' }}>{themePreset.bestFor}</strong></span>
      </div>
    </div>
  );
}
