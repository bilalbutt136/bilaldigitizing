/**
 * Central Theme Presets & Design Token Configuration System
 * 
 * Top 5 International-Grade Themes (Light & Dark Modes):
 * 1. Executive Studio Pro (Warm Amber / Studio Precision Orange)
 * 2. Executive Navy (Corporate / Enterprise / B2B)
 * 3. Royal Indigo (Modern SaaS / Technology / Digital)
 * 4. Emerald Executive (Finance / Healthcare / Prestige)
 * 5. Luxury Graphite (Minimalist Luxury / Titanium Monochrome)
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
        '--color-primary': '#fb923c',
        '--color-primary-hover': '#f97316',
        '--color-primary-light': 'rgba(251, 146, 60, 0.15)',
        '--color-primary-glow': 'rgba(251, 146, 60, 0.35)',
        '--color-primary-text': '#7c2d12',
        '--color-secondary': '#fdba74',
        '--color-secondary-hover': '#fb923c',
        '--color-accent': '#f97316',
        '--color-accent-light': 'rgba(251, 146, 60, 0.1)',
        '--color-background': '#0a0e17',
        '--color-surface': '#111827',
        '--color-surface-elevated': '#1a2234',
        '--color-subtle': '#141d2f',
        '--color-input': '#162035',
        '--color-border': 'rgba(251, 146, 60, 0.18)',
        '--color-border-hover': 'rgba(251, 146, 60, 0.32)',
        '--color-border-focus': '#fb923c',
        '--color-text-primary': '#f8fafc',
        '--color-text-secondary': '#cbd5e1',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#0a0e17',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(249, 115, 22, 0.18) 0%, rgba(124, 45, 18, 0.4) 50%, transparent 80%), linear-gradient(180deg, #0a0e17 0%, #111827 100%)',
        '--hero-card-bg': '#111827',
        '--hero-card-border': 'rgba(251, 146, 60, 0.22)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
        '--banner-bg': 'linear-gradient(135deg, #111827 0%, #1a2234 50%, #0a0e17 100%)',
        '--banner-border': 'rgba(251, 146, 60, 0.24)',
        '--stats-bar-bg': '#0a0e17',
        '--stats-card-bg': '#111827',
        '--stats-card-border': 'rgba(251, 146, 60, 0.18)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(249, 115, 22, 0.18) 0%, rgba(124, 45, 18, 0.3) 50%, transparent 80%), linear-gradient(180deg, #0a0e17 0%, #111827 100%)',
        '--cta-badge-bg': 'rgba(249, 115, 22, 0.12)',
        '--cta-badge-border': 'rgba(249, 115, 22, 0.35)',
        '--cta-badge-text': '#fb923c'
      }
    }
  },
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    category: 'Corporate',
    description: 'Deep navy, soft blue accents, clean white surfaces with subtle slate borders.',
    bestFor: 'Corporate / B2B / Enterprise',
    palette: {
      primary: '#0f2b48',
      secondary: '#1e40af',
      accent: '#0284c7',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#0f2b48',
        '--color-primary-hover': '#0a1e33',
        '--color-primary-light': '#e0f2fe',
        '--color-primary-glow': 'rgba(15, 43, 72, 0.25)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#1e40af',
        '--color-secondary-hover': '#1e3a8a',
        '--color-accent': '#0284c7',
        '--color-accent-light': '#f0f9ff',
        '--color-background': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#ffffff',
        '--color-subtle': '#f1f5f9',
        '--color-input': '#f8f9fa',
        '--color-border': 'rgba(15, 43, 72, 0.14)',
        '--color-border-hover': 'rgba(15, 43, 72, 0.28)',
        '--color-border-focus': '#0f2b48',
        '--color-text-primary': '#0f172a',
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#64748b',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(15, 43, 72, 0.08) 0%, rgba(2, 132, 199, 0.04) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': 'rgba(15, 43, 72, 0.15)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(15, 43, 72, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 50%, #f8fafc 100%)',
        '--banner-border': 'rgba(15, 43, 72, 0.18)',
        '--stats-bar-bg': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-bg': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-border': 'rgba(15, 43, 72, 0.14)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(15, 43, 72, 0.1) 0%, rgba(2, 132, 199, 0.05) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--cta-badge-bg': 'rgba(15, 43, 72, 0.08)',
        '--cta-badge-border': 'rgba(15, 43, 72, 0.25)',
        '--cta-badge-text': '#0f2b48'
      },
      dark: {
        '--color-primary': '#38bdf8',
        '--color-primary-hover': '#0284c7',
        '--color-primary-light': 'rgba(56, 189, 248, 0.15)',
        '--color-primary-glow': 'rgba(56, 189, 248, 0.35)',
        '--color-primary-text': '#070f1a',
        '--color-secondary': '#60a5fa',
        '--color-secondary-hover': '#3b82f6',
        '--color-accent': '#38bdf8',
        '--color-accent-light': 'rgba(56, 189, 248, 0.1)',
        '--color-background': '#070f1a',
        '--color-surface': '#0c192c',
        '--color-surface-elevated': '#13233c',
        '--color-subtle': '#102038',
        '--color-input': '#0f223d',
        '--color-border': 'rgba(56, 189, 248, 0.16)',
        '--color-border-hover': 'rgba(56, 189, 248, 0.3)',
        '--color-border-focus': '#38bdf8',
        '--color-text-primary': '#f8fafc',
        '--color-text-secondary': '#cbd5e1',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#070f1a',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(56, 189, 248, 0.15) 0%, rgba(15, 43, 72, 0.4) 50%, transparent 80%), linear-gradient(180deg, #070f1a 0%, #0c192c 100%)',
        '--hero-card-bg': '#0c192c',
        '--hero-card-border': 'rgba(56, 189, 248, 0.2)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
        '--banner-bg': 'linear-gradient(135deg, #0c192c 0%, #13233c 50%, #070f1a 100%)',
        '--banner-border': 'rgba(56, 189, 248, 0.22)',
        '--stats-bar-bg': '#070f1a',
        '--stats-card-bg': '#0c192c',
        '--stats-card-border': 'rgba(56, 189, 248, 0.18)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(56, 189, 248, 0.18) 0%, rgba(15, 43, 72, 0.3) 50%, transparent 80%), linear-gradient(180deg, #070f1a 0%, #0c192c 100%)',
        '--cta-badge-bg': 'rgba(56, 189, 248, 0.12)',
        '--cta-badge-border': 'rgba(56, 189, 248, 0.35)',
        '--cta-badge-text': '#38bdf8'
      }
    }
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    category: 'Technology',
    description: 'Deep royal indigo, violet highlights, neutral crisp backgrounds with modern sheen.',
    bestFor: 'Modern SaaS / Technology',
    palette: {
      primary: '#4338ca',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#4338ca',
        '--color-primary-hover': '#3730a3',
        '--color-primary-light': '#e0e7ff',
        '--color-primary-glow': 'rgba(67, 56, 202, 0.25)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#6366f1',
        '--color-secondary-hover': '#4f46e5',
        '--color-accent': '#8b5cf6',
        '--color-accent-light': '#ede9fe',
        '--color-background': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#ffffff',
        '--color-subtle': '#f1f5f9',
        '--color-input': '#f8f9fa',
        '--color-border': 'rgba(67, 56, 202, 0.14)',
        '--color-border-hover': 'rgba(67, 56, 202, 0.28)',
        '--color-border-focus': '#4338ca',
        '--color-text-primary': '#0f172a',
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#64748b',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': 'rgba(99, 102, 241, 0.18)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(99, 102, 241, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 50%, #f8fafc 100%)',
        '--banner-border': 'rgba(99, 102, 241, 0.2)',
        '--stats-bar-bg': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-bg': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-border': 'rgba(99, 102, 241, 0.14)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--cta-badge-bg': 'rgba(99, 102, 241, 0.08)',
        '--cta-badge-border': 'rgba(99, 102, 241, 0.25)',
        '--cta-badge-text': '#4338ca'
      },
      dark: {
        '--color-primary': '#818cf8',
        '--color-primary-hover': '#6366f1',
        '--color-primary-light': 'rgba(129, 140, 248, 0.15)',
        '--color-primary-glow': 'rgba(129, 140, 248, 0.35)',
        '--color-primary-text': '#09091b',
        '--color-secondary': '#a78bfa',
        '--color-secondary-hover': '#8b5cf6',
        '--color-accent': '#c084fc',
        '--color-accent-light': 'rgba(167, 139, 250, 0.1)',
        '--color-background': '#09091b',
        '--color-surface': '#11112b',
        '--color-surface-elevated': '#1a1a3e',
        '--color-subtle': '#151533',
        '--color-input': '#18183d',
        '--color-border': 'rgba(129, 140, 248, 0.18)',
        '--color-border-hover': 'rgba(129, 140, 248, 0.32)',
        '--color-border-focus': '#818cf8',
        '--color-text-primary': '#f8fafc',
        '--color-text-secondary': '#cbd5e1',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#09091b',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(129, 140, 248, 0.18) 0%, rgba(67, 56, 202, 0.4) 50%, transparent 80%), linear-gradient(180deg, #09091b 0%, #11112b 100%)',
        '--hero-card-bg': '#11112b',
        '--hero-card-border': 'rgba(129, 140, 248, 0.22)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
        '--banner-bg': 'linear-gradient(135deg, #11112b 0%, #1a1a3e 50%, #09091b 100%)',
        '--banner-border': 'rgba(129, 140, 248, 0.24)',
        '--stats-bar-bg': '#09091b',
        '--stats-card-bg': '#11112b',
        '--stats-card-border': 'rgba(129, 140, 248, 0.18)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(129, 140, 248, 0.18) 0%, rgba(67, 56, 202, 0.3) 50%, transparent 80%), linear-gradient(180deg, #09091b 0%, #11112b 100%)',
        '--cta-badge-bg': 'rgba(129, 140, 248, 0.12)',
        '--cta-badge-border': 'rgba(129, 140, 248, 0.35)',
        '--cta-badge-text': '#818cf8'
      }
    }
  },
  {
    id: 'emerald-executive',
    name: 'Emerald Executive',
    category: 'Finance & Trust',
    description: 'Deep emerald green, mint accents, warm clean surfaces, high trustworthiness.',
    bestFor: 'Finance / Healthcare / Business',
    palette: {
      primary: '#065f46',
      secondary: '#059669',
      accent: '#10b981',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#065f46',
        '--color-primary-hover': '#044e3a',
        '--color-primary-light': '#ecfdf5',
        '--color-primary-glow': 'rgba(6, 95, 70, 0.25)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#059669',
        '--color-secondary-hover': '#047857',
        '--color-accent': '#10b981',
        '--color-accent-light': '#d1fae5',
        '--color-background': '#f8fafc',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#ffffff',
        '--color-subtle': '#f1f5f9',
        '--color-input': '#f8f9fa',
        '--color-border': 'rgba(6, 95, 70, 0.14)',
        '--color-border-hover': 'rgba(6, 95, 70, 0.28)',
        '--color-border-focus': '#065f46',
        '--color-text-primary': '#0f172a',
        '--color-text-secondary': '#334155',
        '--color-text-muted': '#64748b',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': 'rgba(5, 150, 105, 0.18)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(5, 150, 105, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #f8fafc 100%)',
        '--banner-border': 'rgba(5, 150, 105, 0.2)',
        '--stats-bar-bg': 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-bg': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        '--stats-card-border': 'rgba(5, 150, 105, 0.14)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(5, 150, 105, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        '--cta-badge-bg': 'rgba(5, 150, 105, 0.08)',
        '--cta-badge-border': 'rgba(5, 150, 105, 0.25)',
        '--cta-badge-text': '#065f46'
      },
      dark: {
        '--color-primary': '#34d399',
        '--color-primary-hover': '#10b981',
        '--color-primary-light': 'rgba(52, 211, 153, 0.15)',
        '--color-primary-glow': 'rgba(52, 211, 153, 0.35)',
        '--color-primary-text': '#041611',
        '--color-secondary': '#6ee7b7',
        '--color-secondary-hover': '#34d399',
        '--color-accent': '#a7f3d0',
        '--color-accent-light': 'rgba(52, 211, 153, 0.1)',
        '--color-background': '#041611',
        '--color-surface': '#0a261f',
        '--color-surface-elevated': '#0f382e',
        '--color-subtle': '#0d2e25',
        '--color-input': '#0c3027',
        '--color-border': 'rgba(52, 211, 153, 0.18)',
        '--color-border-hover': 'rgba(52, 211, 153, 0.32)',
        '--color-border-focus': '#34d399',
        '--color-text-primary': '#f8fafc',
        '--color-text-secondary': '#cbd5e1',
        '--color-text-muted': '#94a3b8',
        '--color-text-on-primary': '#041611',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(52, 211, 153, 0.18) 0%, rgba(6, 95, 70, 0.4) 50%, transparent 80%), linear-gradient(180deg, #041611 0%, #0a261f 100%)',
        '--hero-card-bg': '#0a261f',
        '--hero-card-border': 'rgba(52, 211, 153, 0.22)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.6)',
        '--banner-bg': 'linear-gradient(135deg, #0a261f 0%, #0f382e 50%, #041611 100%)',
        '--banner-border': 'rgba(52, 211, 153, 0.24)',
        '--stats-bar-bg': '#041611',
        '--stats-card-bg': '#0a261f',
        '--stats-card-border': 'rgba(52, 211, 153, 0.18)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(52, 211, 153, 0.18) 0%, rgba(6, 95, 70, 0.3) 50%, transparent 80%), linear-gradient(180deg, #041611 0%, #0a261f 100%)',
        '--cta-badge-bg': 'rgba(52, 211, 153, 0.12)',
        '--cta-badge-border': 'rgba(52, 211, 153, 0.35)',
        '--cta-badge-text': '#34d399'
      }
    }
  },
  {
    id: 'luxury-graphite',
    name: 'Luxury Graphite',
    category: 'Minimal Luxury',
    description: 'Graphite, charcoal, crisp silver accents, timeless minimalist luxury.',
    bestFor: 'Luxury / Premium Brands',
    palette: {
      primary: '#18181b',
      secondary: '#27272a',
      accent: '#71717a',
      surface: '#ffffff'
    },
    tokens: {
      light: {
        '--color-primary': '#18181b',
        '--color-primary-hover': '#09090b',
        '--color-primary-light': '#f4f4f5',
        '--color-primary-glow': 'rgba(24, 24, 27, 0.25)',
        '--color-primary-text': '#ffffff',
        '--color-secondary': '#3f3f46',
        '--color-secondary-hover': '#27272a',
        '--color-accent': '#71717a',
        '--color-accent-light': '#f4f4f5',
        '--color-background': '#fafafa',
        '--color-surface': '#ffffff',
        '--color-surface-elevated': '#ffffff',
        '--color-subtle': '#f4f4f5',
        '--color-input': '#f4f4f5',
        '--color-border': 'rgba(24, 24, 27, 0.14)',
        '--color-border-hover': 'rgba(24, 24, 27, 0.28)',
        '--color-border-focus': '#18181b',
        '--color-text-primary': '#09090b',
        '--color-text-secondary': '#27272a',
        '--color-text-muted': '#71717a',
        '--color-text-on-primary': '#ffffff',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(24, 24, 27, 0.06) 0%, rgba(113, 113, 122, 0.04) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        '--hero-card-bg': '#ffffff',
        '--hero-card-border': 'rgba(24, 24, 27, 0.14)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03)',
        '--banner-bg': 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 50%, #fafafa 100%)',
        '--banner-border': 'rgba(24, 24, 27, 0.16)',
        '--stats-bar-bg': 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        '--stats-card-bg': 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        '--stats-card-border': 'rgba(24, 24, 27, 0.12)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(24, 24, 27, 0.08) 0%, rgba(113, 113, 122, 0.04) 50%, transparent 80%), linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
        '--cta-badge-bg': 'rgba(24, 24, 27, 0.06)',
        '--cta-badge-border': 'rgba(24, 24, 27, 0.2)',
        '--cta-badge-text': '#18181b'
      },
      dark: {
        '--color-primary': '#f4f4f5',
        '--color-primary-hover': '#e4e4e7',
        '--color-primary-light': 'rgba(244, 244, 245, 0.15)',
        '--color-primary-glow': 'rgba(244, 244, 245, 0.3)',
        '--color-primary-text': '#09090b',
        '--color-secondary': '#d4d4d8',
        '--color-secondary-hover': '#a1a1aa',
        '--color-accent': '#a1a1aa',
        '--color-accent-light': 'rgba(244, 244, 245, 0.1)',
        '--color-background': '#09090b',
        '--color-surface': '#18181b',
        '--color-surface-elevated': '#27272a',
        '--color-subtle': '#1c1c20',
        '--color-input': '#222226',
        '--color-border': 'rgba(244, 244, 245, 0.15)',
        '--color-border-hover': 'rgba(244, 244, 245, 0.3)',
        '--color-border-focus': '#f4f4f5',
        '--color-text-primary': '#fafafa',
        '--color-text-secondary': '#d4d4d8',
        '--color-text-muted': '#a1a1aa',
        '--color-text-on-primary': '#09090b',
        '--hero-bg': 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(244, 244, 245, 0.12) 0%, rgba(39, 39, 42, 0.4) 50%, transparent 80%), linear-gradient(180deg, #09090b 0%, #18181b 100%)',
        '--hero-card-bg': '#18181b',
        '--hero-card-border': 'rgba(244, 244, 245, 0.18)',
        '--hero-card-shadow': '0 20px 50px -15px rgba(0, 0, 0, 0.8)',
        '--banner-bg': 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)',
        '--banner-border': 'rgba(244, 244, 245, 0.2)',
        '--stats-bar-bg': '#09090b',
        '--stats-card-bg': '#18181b',
        '--stats-card-border': 'rgba(244, 244, 245, 0.15)',
        '--cta-bg': 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(244, 244, 245, 0.15) 0%, rgba(39, 39, 42, 0.3) 50%, transparent 80%), linear-gradient(180deg, #09090b 0%, #18181b 100%)',
        '--cta-badge-bg': 'rgba(244, 244, 245, 0.1)',
        '--cta-badge-border': 'rgba(244, 244, 245, 0.3)',
        '--cta-badge-text': '#fafafa'
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

  // 1. Set root HTML attributes
  root.setAttribute('data-theme-preset', theme.id);
  root.setAttribute('data-theme', mode);

  if (mode === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
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
  root.style.setProperty('--bg-main', tokenSet['--color-background'] || (mode === 'dark' ? '#0a0e17' : '#f8fafc'));
  root.style.setProperty('--bg-card', tokenSet['--color-surface'] || (mode === 'dark' ? '#111827' : '#ffffff'));
  root.style.setProperty('--bg-surface', tokenSet['--color-surface-elevated'] || (mode === 'dark' ? '#1a2234' : '#ffffff'));
  root.style.setProperty('--bg-subtle', tokenSet['--color-subtle'] || (mode === 'dark' ? '#141d2f' : '#f1f5f9'));
  root.style.setProperty('--bg-input', tokenSet['--color-input'] || (mode === 'dark' ? '#162035' : '#f8f9fa'));
  root.style.setProperty('--border-color', tokenSet['--color-border'] || (mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'));
  root.style.setProperty('--text-main', tokenSet['--color-text-primary'] || (mode === 'dark' ? '#f8fafc' : '#090d16'));
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
