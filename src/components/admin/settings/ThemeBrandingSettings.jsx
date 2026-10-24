'use client';

import React, { useState } from 'react';
import { useAppState } from '../../../context/StateContext';
import { Palette, Sun, Moon, Sparkles, RefreshCw, Sliders } from 'lucide-react';
import BrandPaletteGallery from './BrandPaletteGallery';

import BrandingAssetManager from './BrandingAssetManager';

export const ThemeBrandingSettings = () => {
  const {
    theme,
    setTheme,
    customBrandColors,
    setCustomBrandColors,
    siteSettings,
    showToast,
    updateSiteSettings
  } = useAppState();

  // Custom Brand Colors Local State
  const [customPrimary, setCustomPrimary] = useState(customBrandColors?.primary || '#1d4ed8');
  const [customSecondary, setCustomSecondary] = useState(customBrandColors?.secondary || '#5b21b6');
  const [customAccent, setCustomAccent] = useState(customBrandColors?.accent || '#7c3aed');
  const isCustomBrandActive = Boolean(siteSettings?.customBrandColors);
  const [isSaving, setIsSaving] = useState(false);


  const handleSaveCustomBrand = async (e) => {
    e?.preventDefault?.();
    if (![customPrimary, customSecondary, customAccent].every(v => /^#[0-9a-f]{6}$/i.test(v))) {
      showToast('Enter valid 6-digit HEX color codes.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const brandPayload = { primary: customPrimary, secondary: customSecondary, accent: customAccent };
      await updateSiteSettings({ customBrandColors: brandPayload });
      setCustomBrandColors(brandPayload);
      showToast('Custom brand colors published across the website.', 'success');
    } catch {
      showToast('Failed to save brand colors in database.', 'error');
    } finally { setIsSaving(false); }
  };

  const handleResetBrandColors = async () => {
    try {
      await updateSiteSettings({ customBrandColors: null });
      setCustomBrandColors(null);
      showToast('Custom overrides cleared. Selected brand restored.', 'success');
    } catch {
      showToast('Could not reset brand overrides.', 'error');
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* 1. Header Card & Mode Switcher */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.5rem', borderRadius: '10px' }}>
                <Palette size={22} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                Brand & Appearance
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
              Manage logos, colors, theme presets, and light/dark appearance.
            </p>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.4rem 0.6rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>
              Mode:
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
              Light
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
              Dark
            </button>
          </div>
        </div>
      </div>

      <BrandingAssetManager />

      <BrandPaletteGallery siteSettings={siteSettings} updateSiteSettings={updateSiteSettings} showToast={showToast} />

      {/* 3. Custom Brand Colors Override Form */}
      <div className="card" style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={20} style={{ color: 'var(--color-primary)' }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
              Brand Colors
            </h4>
          </div>
          {isCustomBrandActive && (
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
              Custom colors active
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Fine-tune the primary, secondary, and accent colors used across the site.
        </p>

        <form onSubmit={handleSaveCustomBrand} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
              Primary
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
              Secondary
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
              Accent
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
              <Sparkles size={16} /> {isSaving ? 'Saving...' : 'Save Colors'}
            </button>
            {isCustomBrandActive && (
              <button type="button" onClick={handleResetBrandColors} className="btn btn-outline" style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                <RefreshCw size={15} /> Reset
              </button>
            )}
          </div>
        </form>
      </div>



    </div>
  );
};