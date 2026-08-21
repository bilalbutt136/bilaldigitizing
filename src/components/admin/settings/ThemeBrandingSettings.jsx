'use client';

import React, { useState } from 'react';
import { useAppState } from '../../../context/StateContext';
import { Palette, Sun, Moon, Sparkles, RefreshCw, Sliders, Check, Eye, Copy, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import ThemePreviewCard from '../../common/ThemePreviewCard';
import { THEME_PRESETS } from '../../../utils/themePresets';

export const ThemeBrandingSettings = () => {
  const {
    colorTheme,
    setColorTheme,
    availableThemes = THEME_PRESETS,
    theme,
    setTheme,
    customBrandColors,
    setCustomBrandColors,
    showToast,
    updateSiteSettings
  } = useAppState();

  // Custom Brand Colors Local State
  const [customPrimary, setCustomPrimary] = useState(customBrandColors?.primary || '#ea580c');
  const [customSecondary, setCustomSecondary] = useState(customBrandColors?.secondary || '#f97316');
  const [customAccent, setCustomAccent] = useState(customBrandColors?.accent || '#fb923c');
  const [isCustomBrandActive, setIsCustomBrandActive] = useState(Boolean(customBrandColors));
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCustomBrand = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    try {
      const brandPayload = {
        primary: customPrimary,
        secondary: customSecondary,
        accent: customAccent
      };
      setCustomBrandColors(brandPayload);
      setIsCustomBrandActive(true);
      
      // Persist to Supabase site_settings
      await updateSiteSettings({
        themePreset: colorTheme,
        customBrandColors: brandPayload,
        themeMode: theme
      });

      showToast('Custom brand colors saved and applied across the studio!', 'success');
    } catch {
      showToast('Failed to persist custom brand colors to database.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = async (presetId) => {
    setColorTheme(presetId);
    try {
      await updateSiteSettings({
        themePreset: presetId,
        themeMode: theme
      });
      showToast(`Active theme preset changed to ${THEME_PRESETS.find(t => t.id === presetId)?.name || presetId}`, 'success');
    } catch {
      showToast('Theme applied locally. Syncing to database...', 'info');
    }
  };

  const handleResetBrandColors = async () => {
    setCustomBrandColors(null);
    setIsCustomBrandActive(false);
    await updateSiteSettings({
      customBrandColors: null
    });
    showToast('Reset brand colors to theme default palette.', 'info');
  };

  const activePresetObj = availableThemes.find(t => t.id === colorTheme) || availableThemes[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header Card & Mode Switcher */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{ background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))', color: 'var(--color-primary, #ea580c)', padding: '0.5rem', borderRadius: '10px' }}>
                <Palette size={22} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Theme & Design System Engine
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Select from the top 5 curated international studio presets, configure brand color overrides, and set default light/dark moods.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.4rem 0.6rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>
              Mood:
            </span>
            <button
              type="button"
              onClick={() => setTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: theme === 'light' ? 'var(--bg-card)' : 'transparent',
                color: theme === 'light' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: theme === 'light' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Sun size={15} style={{ color: theme === 'light' ? '#f59e0b' : 'inherit' }} />
              White Mood
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.825rem',
                background: theme === 'dark' ? 'var(--bg-card)' : 'transparent',
                color: theme === 'dark' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                boxShadow: theme === 'dark' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Moon size={15} style={{ color: theme === 'dark' ? '#60a5fa' : 'inherit' }} />
              Darker Mood
            </button>
          </div>
        </div>
      </div>

      {/* 2. Global Preset Selector Grid */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
              International Theme Presets
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Click any theme to apply its complete typography, surface tokens, and contrast rules studio-wide.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))', color: 'var(--color-primary, #ea580c)', padding: '0.3rem 0.75rem', borderRadius: '9999px' }}>
            Active: {activePresetObj?.name}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: '1.25rem'
        }}>
          {availableThemes.map((preset) => (
            <ThemePreviewCard
              key={preset.id}
              themePreset={preset}
              isSelected={colorTheme === preset.id}
              mode={theme}
              onSelect={handleSelectPreset}
            />
          ))}
        </div>
      </div>

      {/* 3. Custom Brand Colors Override Form */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} style={{ color: 'var(--color-primary, #ea580c)' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Custom Brand Color Overrides
            </h4>
          </div>
          {isCustomBrandActive && (
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))', color: 'var(--color-primary, #ea580c)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
              ✓ Custom Brand Active
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Override the preset's primary CTA, secondary glow, and accent tones with your official brand hex codes.
        </p>

        <form onSubmit={handleSaveCustomBrand} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Primary Brand Color (Buttons & CTAs)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.4rem 0.6rem' }}>
              <input 
                type="color" 
                value={customPrimary} 
                onChange={(e) => setCustomPrimary(e.target.value)} 
                style={{ width: '34px', height: '34px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
              />
              <input 
                type="text" 
                value={customPrimary} 
                onChange={(e) => setCustomPrimary(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '0.875rem', fontWeight: 700, width: '100%', outline: 'none', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Secondary Color (Highlights & Badges)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.4rem 0.6rem' }}>
              <input 
                type="color" 
                value={customSecondary} 
                onChange={(e) => setCustomSecondary(e.target.value)} 
                style={{ width: '34px', height: '34px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
              />
              <input 
                type="text" 
                value={customSecondary} 
                onChange={(e) => setCustomSecondary(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '0.875rem', fontWeight: 700, width: '100%', outline: 'none', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Accent Color (Glows & Borders)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.4rem 0.6rem' }}>
              <input 
                type="color" 
                value={customAccent} 
                onChange={(e) => setCustomAccent(e.target.value)} 
                style={{ width: '34px', height: '34px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'none' }}
              />
              <input 
                type="text" 
                value={customAccent} 
                onChange={(e) => setCustomAccent(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontSize: '0.875rem', fontWeight: 700, width: '100%', outline: 'none', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={isSaving} className="btn btn-primary-orange" style={{ padding: '0.75rem 1.35rem', fontSize: '0.875rem', fontWeight: 800 }}>
              <Sparkles size={16} /> {isSaving ? 'Saving...' : 'Apply Brand'}
            </button>
            {isCustomBrandActive && (
              <button type="button" onClick={handleResetBrandColors} className="btn btn-outline" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                <RefreshCw size={15} /> Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 4. Live Component Sandbox / Design Token Preview */}
      <div className="card" style={{ padding: '2rem', background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--border-color)', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Eye size={18} style={{ color: 'var(--color-primary, #ea580c)' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
            Live Design System Sandbox Preview
          </h4>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.65rem' }}>BUTTON STYLES</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button className="btn btn-primary-orange" style={{ width: '100%', justifyContent: 'center' }}>
                Primary Action <ArrowRight size={15} />
              </button>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                Secondary Outline
              </button>
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.65rem' }}>BADGES & PILLS</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="badge-pill-glow">
                <Sparkles size={13} /> Featured Pill
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                ✓ Production Ready
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--color-primary-light, rgba(249, 115, 22, 0.15))', color: 'var(--color-primary, #ea580c)', padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
                Studio Verified
              </span>
            </div>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.65rem' }}>TYPOGRAPHY CONTRAST</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 0.25rem' }}>
              Headings Contrast
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 0.35rem', lineHeight: 1.5 }}>
              Body text inherits high-contrast readability in both modes.
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Muted details & timestamps</span>
          </div>
        </div>
      </div>

    </div>
  );
};
