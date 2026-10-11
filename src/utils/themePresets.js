/**
 * Central Theme Presets & Design Token Configuration System
 * 
 * Official Brand Theme (Light & Dark Modes):
 * 1. Executive Studio Pro (Warm Amber / Studio Precision Orange)
 */

export const THEME_PRESETS = [
  {
    id: 'studio-orange',
    name: 'Royal Executive Navy & Gold',
    category: 'Creative Studio',
    description: 'Precision luxury royal navy obsidian surfaces, crisp white cards, and warm amber gold CTA buttons.',
    bestFor: 'High-End Commercial Digitizing & Vector Studio',
    palette: {
      primary: '#d97706',
      secondary: '#f59e0b',
      accent: '#fbbf24',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#d97706',
        '--color-primary-hover': '#b45309',
        '--color-primary-light': '#fffbeb',
        '--color-primary-glow': 'rgba(217, 119, 6, 0.28)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#f59e0b',
        '--color-secondary-hover': '#d97706',
        '--color-accent': '#fbbf24',
        '--color-accent-light': '#fffdf5',
        '--color-background': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#f1f5f9',
        '--color-subtle': '#eef4fa',
        '--color-input': '#f8fafc',
        '--color-border': '#e2e8f0',
        '--color-border-hover': '#cbd5e1',
        '--color-border-focus': '#d97706',
        '--color-text-primary': '#0a0f1d',
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#64748b',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(245, 158, 11, 0.08) 0%, rgba(241, 245, 249, 0.8) 50%, #f8fafc 100%)',
        '--hero-tabs-bg': '#ffffff',
        '--hero-tabs-border': '#e2e8f0',
        '--hero-text-primary': '#0a0f1d',
        '--hero-text-secondary': '#334155',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': '#e2e8f0',
        '--hero-card-shadow': '0 16px 40px -10px rgba(10, 15, 29, 0.08), 0 4px 12px -2px rgba(10, 15, 29, 0.03)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #fffdfa 50%, #f8fafc 100%)',
        '--banner-border': 'rgba(217, 119, 6, 0.18)',
        '--banner-title': '#0a0f1d',
        '--banner-desc': '#334155',
        '--stats-bar-bg': '#f8fafc',
        '--stats-card-bg': '#ffffff',
        '--stats-card-border': '#e2e8f0',
        '--stats-number-color': '#0a0f1d',
        '--stats-label-color': '#64748b',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(245, 158, 11, 0.08) 0%, rgba(241, 245, 249, 0.7) 50%, #f8fafc 100%)',
        '--cta-title': '#0a0f1d',
        '--cta-desc': '#334155',
        '--cta-badge-bg': '#fffbeb',
        '--cta-badge-border': '#fde68a',
        '--cta-badge-text': '#b45309',
        '--cta-btn-outline-color': '#0a0f1d',
        '--cta-btn-outline-border': '#cbd5e1'
      },
      dark: {
        '--color-primary': '#f59e0b',
        '--color-primary-hover': '#d97706',
        '--color-primary-light': 'rgba(245, 158, 11, 0.16)',
        '--color-primary-glow': 'rgba(245, 158, 11, 0.40)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#fbbf24',
        '--color-secondary-hover': '#f59e0b',
        '--color-accent': '#f59e0b',
        '--color-accent-light': 'rgba(245, 158, 11, 0.12)',
        '--color-background': '#070b14',
        '--color-surface': '#0f172a',
        '--color-surface-elevated': '#16223b',
        '--color-subtle': '#16223b',
        '--color-input': '#111c30',
        '--color-border': 'rgba(255, 255, 255, 0.12)',
        '--color-border-hover': 'rgba(245, 158, 11, 0.35)',
        '--color-border-focus': '#f59e0b',
        '--color-text-primary': '#ffffff',
        '--color-text-secondary': '#e2e8f0',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.95) 50%, #070b14 100%)',
        '--hero-tabs-bg': '#0f172a',
        '--hero-tabs-border': 'rgba(255, 255, 255, 0.14)',
        '--hero-text-primary': '#ffffff',
        '--hero-text-secondary': '#cbd5e1',
        '--hero-card-bg': '#0f172a',
        '--hero-card-border': 'rgba(255, 255, 255, 0.14)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.7)',
        '--banner-bg': 'linear-gradient(135deg, #0f172a 0%, #16223b 50%, #070b14 100%)',
        '--banner-border': 'rgba(245, 158, 11, 0.28)',
        '--banner-title': '#ffffff',
        '--banner-desc': '#cbd5e1',
        '--stats-bar-bg': '#070b14',
        '--stats-card-bg': '#0f172a',
        '--stats-card-border': 'rgba(255, 255, 255, 0.12)',
        '--stats-number-color': '#ffffff',
        '--stats-label-color': '#94a3b8',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(245, 158, 11, 0.16) 0%, rgba(15, 23, 42, 0.95) 50%, #070b14 100%)',
        '--cta-title': '#ffffff',
        '--cta-desc': '#cbd5e1',
        '--cta-badge-bg': 'rgba(245, 158, 11, 0.15)',
        '--cta-badge-border': 'rgba(245, 158, 11, 0.35)',
        '--cta-badge-text': '#fbbf24',
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
  root.style.setProperty('--orange-500', tokenSet['--color-secondary'] || (mode === 'dark' ? '#fbbf24' : '#f59e0b'));
  root.style.setProperty('--orange-600', tokenSet['--color-primary'] || (mode === 'dark' ? '#f59e0b' : '#d97706'));
  root.style.setProperty('--orange-700', tokenSet['--color-primary-hover'] || (mode === 'dark' ? '#d97706' : '#b45309'));
  root.style.setProperty('--orange-400', tokenSet['--color-accent'] || (mode === 'dark' ? '#fbbf24' : '#fbbf24'));
  root.style.setProperty('--orange-50', tokenSet['--color-primary-light'] || (mode === 'dark' ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb'));
  root.style.setProperty('--orange-glow', tokenSet['--color-primary-glow'] || 'rgba(245, 158, 11, 0.35)');
  root.style.setProperty('--bg-main', tokenSet['--color-background'] || (mode === 'dark' ? '#070b14' : '#f8fafc'));
  root.style.setProperty('--bg-card', tokenSet['--color-surface'] || (mode === 'dark' ? '#0f172a' : '#ffffff'));
  root.style.setProperty('--bg-surface', tokenSet['--color-surface-elevated'] || (mode === 'dark' ? '#16223b' : '#f1f5f9'));
  root.style.setProperty('--bg-subtle', tokenSet['--color-subtle'] || (mode === 'dark' ? '#16223b' : '#eef4fa'));
  root.style.setProperty('--bg-input', tokenSet['--color-input'] || (mode === 'dark' ? '#111c30' : '#f8fafc'));
  root.style.setProperty('--border-color', tokenSet['--color-border'] || (mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'));
  root.style.setProperty('--text-main', tokenSet['--color-text-primary'] || (mode === 'dark' ? '#ffffff' : '#0a0f1d'));
  root.style.setProperty('--text-secondary', tokenSet['--color-text-secondary'] || (mode === 'dark' ? '#e2e8f0' : '#334155'));
  root.style.setProperty('--text-muted', tokenSet['--color-text-muted'] || (mode === 'dark' ? '#94a3b8' : '#64748b'));
  root.style.setProperty('--text-light', tokenSet['--color-text-muted'] || (mode === 'dark' ? '#94a3b8' : '#94a3b8'));
  root.style.setProperty('--text-heading', tokenSet['--color-text-primary'] || (mode === 'dark' ? '#ffffff' : '#0a0f1d'));

  // Dynamic high-contrast mapping for legacy navy palette tokens & hero navigation tabs
  if (mode === 'dark') {
    root.style.setProperty('--navy-950', '#ffffff');
    root.style.setProperty('--navy-900', '#f8fafc');
    root.style.setProperty('--navy-800', '#f1f5f9');
    root.style.setProperty('--navy-700', '#e2e8f0');
    root.style.setProperty('--navy-600', '#cbd5e1');
    root.style.setProperty('--navy-100', tokenSet['--color-subtle'] || '#16223b');
    root.style.setProperty('--hero-tabs-bg', tokenSet['--hero-tabs-bg'] || tokenSet['--color-surface'] || '#0f172a');
    root.style.setProperty('--hero-tabs-border', tokenSet['--hero-tabs-border'] || tokenSet['--color-border'] || 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--hero-tabs-text', '#f8fafc');
    root.style.setProperty('--hero-tabs-icon', tokenSet['--color-primary'] || '#f59e0b');
  } else {
    root.style.setProperty('--navy-950', '#0a0f1d');
    root.style.setProperty('--navy-900', '#0f172a');
    root.style.setProperty('--navy-800', '#1e293b');
    root.style.setProperty('--navy-700', '#334155');
    root.style.setProperty('--navy-600', '#475569');
    root.style.setProperty('--navy-100', '#f1f5f9');
    root.style.setProperty('--hero-tabs-bg', tokenSet['--hero-tabs-bg'] || '#ffffff');
    root.style.setProperty('--hero-tabs-border', tokenSet['--hero-tabs-border'] || 'rgba(15, 23, 42, 0.12)');
    root.style.setProperty('--hero-tabs-text', '#0a0f1d');
    root.style.setProperty('--hero-tabs-icon', tokenSet['--color-primary'] || '#d97706');
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
