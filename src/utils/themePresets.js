/**
 * Central Theme Presets & Design Token Configuration System
 * 
 * Official Brand Theme (Light & Dark Modes):
 * 1. Executive Studio Pro (Warm Amber / Studio Precision Orange)
 */

export const THEME_PRESETS = [
  {
    id: 'studio-orange',
    name: 'Executive Studio Pro',
    category: 'Creative Studio',
    description: 'Precision luxury slate surfaces, obsidian headers, subtle warm ambient glow, and vivid amber CTA buttons.',
    bestFor: 'High-End Commercial Digitizing & Vector Studio',
    palette: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fb923c',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#ea580c',
        '--color-primary-hover': '#c2410c',
        '--color-primary-light': '#fff7ed',
        '--color-primary-glow': 'rgba(234, 88, 12, 0.28)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#f97316',
        '--color-secondary-hover': '#ea580c',
        '--color-accent': '#fb923c',
        '--color-accent-light': '#fff7ed',
        '--color-background': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#ffffff',
        '--color-subtle': '#f1f5f9',
        '--color-input': '#f8f9fa',
        '--color-border': '#e2e8f0',
        '--color-border-hover': '#cbd5e1',
        '--color-border-focus': '#ea580c',
        '--color-text-primary': '#090d16',
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#64748b',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(249, 115, 22, 0.08) 0%, rgba(241, 245, 249, 0.8) 50%, #f8fafc 100%)',
        '--hero-tabs-bg': '#ffffff',
        '--hero-tabs-border': '#e2e8f0',
        '--hero-text-primary': '#090d16',
        '--hero-text-secondary': '#334155',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': '#e2e8f0',
        '--hero-card-shadow': '0 16px 40px -10px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #fffbf6 50%, #f8fafc 100%)',
        '--banner-border': 'rgba(234, 88, 12, 0.16)',
        '--banner-title': '#090d16',
        '--banner-desc': '#334155',
        '--stats-bar-bg': '#f8fafc',
        '--stats-card-bg': '#ffffff',
        '--stats-card-border': '#e2e8f0',
        '--stats-number-color': '#090d16',
        '--stats-label-color': '#64748b',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(249, 115, 22, 0.08) 0%, rgba(241, 245, 249, 0.7) 50%, #f8fafc 100%)',
        '--cta-title': '#090d16',
        '--cta-desc': '#334155',
        '--cta-badge-bg': '#fff7ed',
        '--cta-badge-border': '#fed7aa',
        '--cta-badge-text': '#c2410c',
        '--cta-btn-outline-color': '#090d16',
        '--cta-btn-outline-border': '#cbd5e1'
      },
      dark: {
        '--color-primary': '#f97316',
        '--color-primary-hover': '#ea580c',
        '--color-primary-light': 'rgba(249, 115, 22, 0.18)',
        '--color-primary-glow': 'rgba(249, 115, 22, 0.40)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#fb923c',
        '--color-secondary-hover': '#f97316',
        '--color-accent': '#f97316',
        '--color-accent-light': 'rgba(249, 115, 22, 0.12)',
        '--color-background': '#090d16',
        '--color-surface': '#111827',
        '--color-surface-elevated': '#1e293b',
        '--color-subtle': '#1e293b',
        '--color-input': '#1e293b',
        '--color-border': 'rgba(255, 255, 255, 0.16)',
        '--color-border-hover': 'rgba(255, 255, 255, 0.32)',
        '--color-border-focus': '#f97316',
        '--color-text-primary': '#ffffff',
        '--color-text-secondary': '#e2e8f0',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(249, 115, 22, 0.15) 0%, rgba(15, 23, 42, 0.95) 50%, #090d16 100%)',
        '--hero-tabs-bg': '#111827',
        '--hero-tabs-border': 'rgba(255, 255, 255, 0.16)',
        '--hero-text-primary': '#ffffff',
        '--hero-text-secondary': '#cbd5e1',
        '--hero-card-bg': '#111827',
        '--hero-card-border': 'rgba(255, 255, 255, 0.16)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
        '--banner-bg': 'linear-gradient(135deg, #111827 0%, #1e293b 50%, #090d16 100%)',
        '--banner-border': 'rgba(249, 115, 22, 0.28)',
        '--banner-title': '#ffffff',
        '--banner-desc': '#cbd5e1',
        '--stats-bar-bg': '#090d16',
        '--stats-card-bg': '#111827',
        '--stats-card-border': 'rgba(255, 255, 255, 0.14)',
        '--stats-number-color': '#ffffff',
        '--stats-label-color': '#94a3b8',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(249, 115, 22, 0.15) 0%, rgba(15, 23, 42, 0.95) 50%, #090d16 100%)',
        '--cta-title': '#ffffff',
        '--cta-desc': '#cbd5e1',
        '--cta-badge-bg': 'rgba(249, 115, 22, 0.15)',
        '--cta-badge-border': 'rgba(249, 115, 22, 0.35)',
        '--cta-badge-text': '#fb923c',
        '--cta-btn-outline-color': '#ffffff',
        '--cta-btn-outline-border': 'rgba(255, 255, 255, 0.22)'
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
    root.style.setProperty('--navy-950', '#090d16');
    root.style.setProperty('--navy-900', '#0f172a');
    root.style.setProperty('--navy-800', '#1e293b');
    root.style.setProperty('--navy-700', '#334155');
    root.style.setProperty('--navy-600', '#475569');
    root.style.setProperty('--navy-100', '#f1f5f9');
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
