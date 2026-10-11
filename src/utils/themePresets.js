/**
 * Central Theme Presets & Design Token Configuration System
 * 
 * Official Brand Theme (Light & Dark Modes):
 * 1. Executive Studio Pro (Warm Amber / Studio Precision Orange)
 */

export const THEME_PRESETS = [
  {
    id: 'studio-orange',
    name: 'Signature Sapphire',
    category: 'Creative Studio',
    description: 'Sapphire blue, violet highlights and midnight-navy surfaces for premium embroidery.',
    bestFor: 'High-End Commercial Digitizing & Vector Studio',
    palette: {
      primary: '#1d4ed8',
      secondary: '#5b21b6',
      accent: '#7c3aed',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#1d4ed8',
        '--color-primary-hover': '#1e40af',
        '--color-primary-light': '#e8efff',
        '--color-primary-glow': 'rgba(37,99,235,0.20)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#5b21b6',
        '--color-secondary-hover': '#4c1d95',
        '--color-accent': '#7c3aed',
        '--color-accent-light': '#f3edff',
        '--color-action-start': '#2563eb',
        '--color-action-end': '#4338ca',
        '--color-background': '#f6f8fd',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#f1f5ff',
        '--color-subtle': '#eaf0fb',
        '--color-input': '#f8faff',
        '--color-border': '#dbe4f4',
        '--color-border-hover': '#bfd0ec',
        '--color-border-focus': '#2563eb',
        '--color-text-primary': '#0b1730',
        '--color-text-secondary': '#344461',
        '--color-text-muted': '#586984',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 75% 65% at 86% 0%, rgba(124,58,237,0.10), transparent 66%), radial-gradient(ellipse 78% 70% at 15% -10%, rgba(37,99,235,0.10), transparent 67%), #f6f8fd',
        '--hero-tabs-bg': '#ffffff',
        '--hero-tabs-border': '#dbe4f4',
        '--hero-text-primary': '#0b1730',
        '--hero-text-secondary': '#344461',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': '#dbe4f4',
        '--hero-card-shadow': '0 20px 50px -20px rgba(25,51,112,0.18), 0 6px 14px -6px rgba(25,51,112,0.08)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 56%, #edf4ff 100%)',
        '--banner-border': 'rgba(67,56,202,0.18)',
        '--banner-title': '#0b1730',
        '--banner-desc': '#344461',
        '--stats-bar-bg': 'transparent',
        '--stats-card-bg': '#ffffff',
        '--stats-card-border': '#dbe4f4',
        '--stats-number-color': '#0b1730',
        '--stats-label-color': '#586984',
        '--cta-bg': 'radial-gradient(ellipse 75% 72% at 50% 0%, rgba(99,102,241,0.10), transparent 65%), #f6f8fd',
        '--cta-title': '#0b1730',
        '--cta-desc': '#344461',
        '--cta-badge-bg': '#edf2ff',
        '--cta-badge-border': '#c7d5fb',
        '--cta-badge-text': '#3730a3',
        '--cta-btn-outline-color': '#0b1730',
        '--cta-btn-outline-border': '#c4d2e8'
      },
      dark: {
        '--color-primary': '#78afff',
        '--color-primary-hover': '#a7cbff',
        '--color-primary-light': 'rgba(96,165,250,0.14)',
        '--color-primary-glow': 'rgba(96,165,250,0.27)',
        '--color-primary-text': '#081329',
        '--color-secondary': '#b5a0ff',
        '--color-secondary-hover': '#c4b5fd',
        '--color-accent': '#c4b5fd',
        '--color-accent-light': 'rgba(167,139,250,0.15)',
        '--color-action-start': '#2563eb',
        '--color-action-end': '#4338ca',
        '--color-background': '#080f20',
        '--color-surface': '#101b32',
        '--color-surface-elevated': '#172640',
        '--color-subtle': '#1a2b47',
        '--color-input': '#121f37',
        '--color-border': 'rgba(158,184,230,0.22)',
        '--color-border-hover': 'rgba(158,184,230,0.40)',
        '--color-border-focus': '#78afff',
        '--color-text-primary': '#f8faff',
        '--color-text-secondary': '#cad6ec',
        '--color-text-muted': '#a5b6d1',
        '--color-text-on-primary': '#081329',
        '--hero-bg': 'radial-gradient(ellipse 85% 62% at 80% -5%, rgba(100,83,220,0.20), transparent 64%), radial-gradient(ellipse 70% 60% at 14% 0%, rgba(37,99,235,0.16), transparent 68%), #080f20',
        '--hero-tabs-bg': '#172640',
        '--hero-tabs-border': 'rgba(158,184,230,0.25)',
        '--hero-text-primary': '#f8faff',
        '--hero-text-secondary': '#cad6ec',
        '--hero-card-bg': '#101b32',
        '--hero-card-border': 'rgba(158,184,230,0.22)',
        '--hero-card-shadow': '0 22px 55px -12px rgba(0,0,0,0.45)',
        '--banner-bg': 'linear-gradient(135deg, #101b32 0%, #1a2450 56%, #101b32 100%)',
        '--banner-border': 'rgba(167,139,250,0.26)',
        '--banner-title': '#f8faff',
        '--banner-desc': '#cad6ec',
        '--stats-bar-bg': 'transparent',
        '--stats-card-bg': '#101b32',
        '--stats-card-border': 'rgba(158,184,230,0.22)',
        '--stats-number-color': '#f8faff',
        '--stats-label-color': '#a5b6d1',
        '--cta-bg': 'radial-gradient(ellipse 80% 70% at 50% 0%, rgba(91,75,209,0.22), transparent 64%), #080f20',
        '--cta-title': '#f8faff',
        '--cta-desc': '#cad6ec',
        '--cta-badge-bg': 'rgba(120,175,255,0.12)',
        '--cta-badge-border': 'rgba(120,175,255,0.35)',
        '--cta-badge-text': '#b6d2ff',
        '--cta-btn-outline-color': '#f8faff',
        '--cta-btn-outline-border': 'rgba(158,184,230,0.32)'
      }
    }
  }
];

/**
 * Apply theme preset directly to DOM root elements
 * @param {string} presetId - Preset ID from THEME_PRESETS
 * @param {'light'|'dark'} mode - 'light' or 'dark'
 * @param {Object} [customBrandOverrides] - Optional custom brand colors { primary, secondary, accent }
 */
export function applyThemePresetToDOM(presetId = 'studio-orange', mode = 'light', customBrandOverrides = null) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const theme = THEME_PRESETS.find(t => t.id === presetId) || THEME_PRESETS[0];

  // 1. Set root HTML attributes and classes for unified theme activation
  root.setAttribute('data-theme-preset', theme.id);
  root.setAttribute('data-theme', mode);
  document.body.setAttribute('data-theme', mode);

  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.add('dark-mode');
    document.body.classList.add('dark');
    document.body.classList.add('dark-mode');
  } else {
    root.classList.remove('dark');
    root.classList.remove('dark-mode');
    document.body.classList.remove('dark');
    document.body.classList.remove('dark-mode');
  }

  // 2. Extract active token set
  const tokenSet = (mode === 'dark' ? theme.tokens.dark : theme.tokens.light) || {};

  // 3. Apply CSS custom properties directly on :root element
  Object.entries(tokenSet).forEach(([propName, propValue]) => {
    root.style.setProperty(propName, propValue);
  });

  // 4. Map semantic tokens to legacy aliases for complete backward compatibility
  root.style.setProperty('--orange-500', tokenSet['--color-primary'] || (mode === 'dark' ? '#fb923c' : '#ea580c'));
  root.style.setProperty('--orange-600', tokenSet['--color-primary-hover'] || (mode === 'dark' ? '#f97316' : '#c2410c'));
  root.style.setProperty('--orange-400', tokenSet['--color-secondary'] || (mode === 'dark' ? '#fdba74' : '#f97316'));
  root.style.setProperty('--orange-50', tokenSet['--color-primary-light'] || (mode === 'dark' ? 'rgba(251, 146, 60, 0.15)' : '#fff7ed'));
  root.style.setProperty('--orange-glow', tokenSet['--color-primary-glow'] || 'rgba(249, 115, 22, 0.35)');
  root.style.setProperty('--bg-main', tokenSet['--color-background'] || (mode === 'dark' ? '#090d16' : '#f8fafc'));
  root.style.setProperty('--bg-card', tokenSet['--color-surface'] || (mode === 'dark' ? '#111827' : '#ffffff'));
  root.style.setProperty('--bg-surface', tokenSet['--color-surface-elevated'] || (mode === 'dark' ? '#1e293b' : '#ffffff'));
  root.style.setProperty('--bg-subtle', tokenSet['--color-subtle'] || (mode === 'dark' ? '#1e293b' : '#f1f5f9'));
  root.style.setProperty('--bg-input', tokenSet['--color-input'] || (mode === 'dark' ? '#162035' : '#f8f9fa'));
  root.style.setProperty('--border-color', tokenSet['--color-border'] || (mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : '#e2e8f0'));
  root.style.setProperty('--text-main', tokenSet['--color-text-primary'] || (mode === 'dark' ? '#ffffff' : '#090d16'));
  root.style.setProperty('--text-secondary', tokenSet['--color-text-secondary'] || (mode === 'dark' ? '#e2e8f0' : '#334155'));
  root.style.setProperty('--text-muted', tokenSet['--color-text-muted'] || (mode === 'dark' ? '#94a3b8' : '#64748b'));
  root.style.setProperty('--text-light', tokenSet['--color-text-muted'] || (mode === 'dark' ? '#94a3b8' : '#94a3b8'));
  root.style.setProperty('--text-heading', tokenSet['--color-text-primary'] || (mode === 'dark' ? '#ffffff' : '#090d16'));

  // Dynamic high-contrast mapping for legacy navy palette tokens & hero navigation tabs
  if (mode === 'dark') {
    root.style.setProperty('--navy-950', '#ffffff');
    root.style.setProperty('--navy-900', '#f8fafc');
    root.style.setProperty('--navy-800', '#f1f5f9');
    root.style.setProperty('--navy-700', '#e2e8f0');
    root.style.setProperty('--navy-600', '#cbd5e1');
    root.style.setProperty('--navy-100', tokenSet['--color-subtle'] || '#141d2f');
    root.style.setProperty('--hero-tabs-bg', tokenSet['--hero-tabs-bg'] || tokenSet['--color-surface'] || '#0c192c');
    root.style.setProperty('--hero-tabs-border', tokenSet['--hero-tabs-border'] || tokenSet['--color-border'] || 'rgba(56, 189, 248, 0.22)');
    root.style.setProperty('--hero-tabs-text', '#f8fafc');
    root.style.setProperty('--hero-tabs-icon', tokenSet['--color-primary'] || '#38bdf8');
  } else {
    root.style.setProperty('--navy-950', '#0b1730');
    root.style.setProperty('--navy-900', '#142443');
    root.style.setProperty('--navy-800', '#243859');
    root.style.setProperty('--navy-700', '#344461');
    root.style.setProperty('--navy-600', '#586984');
    root.style.setProperty('--navy-100', '#eef3fd');
    root.style.setProperty('--hero-tabs-bg', tokenSet['--hero-tabs-bg'] || '#ffffff');
    root.style.setProperty('--hero-tabs-border', tokenSet['--hero-tabs-border'] || 'rgba(15, 23, 42, 0.12)');
    root.style.setProperty('--hero-tabs-text', '#0f172a');
    root.style.setProperty('--hero-tabs-icon', tokenSet['--color-secondary'] || '#1e40af');
  }

  // 5. Handle optional custom brand overrides (Admin Branding Manager)
  if (customBrandOverrides?.primary) {
    root.style.setProperty('--color-primary', customBrandOverrides.primary);
    root.style.setProperty('--orange-500', customBrandOverrides.primary);
  }
  if (customBrandOverrides?.secondary) {
    root.style.setProperty('--color-secondary', customBrandOverrides.secondary);
    root.style.setProperty('--orange-400', customBrandOverrides.secondary);
  }
  if (customBrandOverrides?.accent) {
    root.style.setProperty('--color-accent', customBrandOverrides.accent);
  }
}
