import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { THEME_PRESETS, applyThemePresetToDOM } from '../utils/themePresets.js';

/**
 * Calculates relative luminance for a hex color string (#rrggbb) per WCAG 2.1 specifications
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getRelativeLuminance(hex) {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  const rLin = toLinear(r);
  const gLin = toLinear(g);
  const bLin = toLinear(b);

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors
 * https://www.w3.org/TR/WCAG21/#contrast-minimum
 */
function getContrastRatio(hex1, hex2) {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Dark Mode & Theme Contrast Standards (WCAG 2.1 AA)', () => {
  test('Luminance and contrast math behaves predictably on standard baselines', () => {
    const blackWhiteRatio = getContrastRatio('#000000', '#ffffff');
    assert.ok(blackWhiteRatio >= 20.9, `Expected ~21:1, got ${blackWhiteRatio}`);

    const sameRatio = getContrastRatio('#111827', '#111827');
    assert.equal(Math.round(sameRatio), 1);
  });

  test('All theme presets meet WCAG 2.1 AA text contrast requirements in dark mode', () => {
    THEME_PRESETS.forEach((preset) => {
      const darkTokens = preset.tokens.dark;
      const surfaceBg = darkTokens['--color-surface'];
      const canvasBg = darkTokens['--color-background'];

      const textPrimary = darkTokens['--color-text-primary'];
      const textSecondary = darkTokens['--color-text-secondary'];
      const textMuted = darkTokens['--color-text-muted'];

      // 1. Text Primary against Surface & Canvas >= 7.0:1 (Exceeds WCAG AAA standard 7:1)
      const primarySurfaceRatio = getContrastRatio(textPrimary, surfaceBg);
      const primaryCanvasRatio = getContrastRatio(textPrimary, canvasBg);
      assert.ok(
        primarySurfaceRatio >= 7.0,
        `Preset [${preset.name}] dark primary text ${textPrimary} on surface ${surfaceBg} ratio ${primarySurfaceRatio.toFixed(2)} < 7.0`
      );
      assert.ok(
        primaryCanvasRatio >= 7.0,
        `Preset [${preset.name}] dark primary text ${textPrimary} on canvas ${canvasBg} ratio ${primaryCanvasRatio.toFixed(2)} < 7.0`
      );

      // 2. Text Secondary against Surface >= 4.5:1 (WCAG AA standard)
      const secondarySurfaceRatio = getContrastRatio(textSecondary, surfaceBg);
      assert.ok(
        secondarySurfaceRatio >= 4.5,
        `Preset [${preset.name}] dark secondary text ${textSecondary} on surface ${surfaceBg} ratio ${secondarySurfaceRatio.toFixed(2)} < 4.5`
      );

      // 3. Text Muted against Surface >= 4.5:1 (WCAG AA standard)
      const mutedSurfaceRatio = getContrastRatio(textMuted, surfaceBg);
      assert.ok(
        mutedSurfaceRatio >= 4.5,
        `Preset [${preset.name}] dark muted text ${textMuted} on surface ${surfaceBg} ratio ${mutedSurfaceRatio.toFixed(2)} < 4.5`
      );
    });
  });

  test('All theme presets meet WCAG 2.1 AA text contrast requirements in light mode', () => {
    THEME_PRESETS.forEach((preset) => {
      const lightTokens = preset.tokens.light;
      const surfaceBg = lightTokens['--color-surface'];

      const textPrimary = lightTokens['--color-text-primary'];
      const textSecondary = lightTokens['--color-text-secondary'];
      const textMuted = lightTokens['--color-text-muted'];

      // Primary text against surface >= 7.0:1
      const primarySurfaceRatio = getContrastRatio(textPrimary, surfaceBg);
      assert.ok(
        primarySurfaceRatio >= 7.0,
        `Preset [${preset.name}] light primary text ${textPrimary} on surface ${surfaceBg} ratio ${primarySurfaceRatio.toFixed(2)} < 7.0`
      );

      // Secondary text against surface >= 4.5:1
      const secondarySurfaceRatio = getContrastRatio(textSecondary, surfaceBg);
      assert.ok(
        secondarySurfaceRatio >= 4.5,
        `Preset [${preset.name}] light secondary text ${textSecondary} on surface ${surfaceBg} ratio ${secondarySurfaceRatio.toFixed(2)} < 4.5`
      );

      // Muted text against surface >= 4.5:1
      const mutedSurfaceRatio = getContrastRatio(textMuted, surfaceBg);
      assert.ok(
        mutedSurfaceRatio >= 4.5,
        `Preset [${preset.name}] light muted text ${textMuted} on surface ${surfaceBg} ratio ${mutedSurfaceRatio.toFixed(2)} < 4.5`
      );
    });
  });

  test('applyThemePresetToDOM synchronizes class names and data attributes for root and body', () => {
    const styleStore = {};
    const rootClasses = new Set();
    const bodyClasses = new Set();
    const rootAttrs = {};
    const bodyAttrs = {};

    globalThis.document = {
      documentElement: {
        setAttribute: (k, v) => { rootAttrs[k] = v; },
        getAttribute: (k) => rootAttrs[k],
        classList: {
          add: (c) => rootClasses.add(c),
          remove: (c) => rootClasses.delete(c),
          contains: (c) => rootClasses.has(c)
        },
        style: {
          setProperty: (k, v) => { styleStore[k] = v; },
          getPropertyValue: (k) => styleStore[k]
        }
      },
      body: {
        setAttribute: (k, v) => { bodyAttrs[k] = v; },
        getAttribute: (k) => bodyAttrs[k],
        classList: {
          add: (c) => bodyClasses.add(c),
          remove: (c) => bodyClasses.delete(c),
          contains: (c) => bodyClasses.has(c)
        }
      }
    };

    // 1. Activate Dark Mode
    applyThemePresetToDOM('studio-orange', 'dark');

    assert.equal(rootAttrs['data-theme'], 'dark');
    assert.equal(bodyAttrs['data-theme'], 'dark');
    assert.equal(rootAttrs['data-theme-preset'], 'studio-orange');
    assert.ok(rootClasses.has('dark'), 'document.documentElement should have .dark');
    assert.ok(rootClasses.has('dark-mode'), 'document.documentElement should have .dark-mode');
    assert.ok(bodyClasses.has('dark'), 'document.body should have .dark');
    assert.ok(bodyClasses.has('dark-mode'), 'document.body should have .dark-mode');
    assert.equal(styleStore['--color-background'], '#090d16');
    assert.equal(styleStore['--color-surface'], '#111827');
    assert.equal(styleStore['--color-text-primary'], '#ffffff');
    assert.equal(styleStore['--navy-950'], '#ffffff');
    assert.equal(styleStore['--navy-900'], '#f8fafc');

    // 2. Activate Light Mode
    applyThemePresetToDOM('studio-orange', 'light');

    assert.equal(rootAttrs['data-theme'], 'light');
    assert.equal(bodyAttrs['data-theme'], 'light');
    assert.ok(!rootClasses.has('dark'), 'document.documentElement should not have .dark in light mode');
    assert.ok(!rootClasses.has('dark-mode'), 'document.documentElement should not have .dark-mode in light mode');
    assert.ok(!bodyClasses.has('dark'), 'document.body should not have .dark in light mode');
    assert.ok(!bodyClasses.has('dark-mode'), 'document.body should not have .dark-mode in light mode');
    assert.equal(styleStore['--color-background'], '#f8fafc');
    assert.equal(styleStore['--color-surface'], '#ffffff');
    assert.equal(styleStore['--color-text-primary'], '#090d16');
    assert.equal(styleStore['--navy-950'], '#090d16');
    assert.equal(styleStore['--navy-900'], '#0f172a');
  });
});
