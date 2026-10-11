import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { THEME_PRESETS } from '../utils/themePresets.js';
const hero=fs.readFileSync('src/components/public/HeroSectionVIP.css','utf8');
const global=fs.readFileSync('app/globals.css','utf8');
const theme=fs.readFileSync('src/utils/themePresets.js','utf8');
test('8 distinct admin-saved palettes power both solid and gradient global actions',()=>{
 assert.equal(THEME_PRESETS.length,8);
 for(const preset of THEME_PRESETS){
  assert.ok(preset.tokens.light['--color-action-start']);
  assert.ok(preset.tokens.dark['--color-action-end']);
  assert.ok(preset.tokens.light['--hero-bg']);
  assert.ok(preset.tokens.dark['--hero-bg']);
 }
 assert.match(theme,/root\.setAttribute\('data-brand-finish', appearance\)/);
 assert.match(theme,/appearance === 'solid' \? actionStart/);
 assert.match(global,/\.btn-vip-primary,[\s\S]*?background: var\(--color-action-bg/);
 assert.match(hero,/background: var\(--color-action-bg/);
 assert.match(hero,/--brand-title-fill/);
});
test('hero color palette is applied in light/dark mode, including secondary CTA and chips',()=>{
 assert.match(hero,/\.vip-hero \.vip-hero-secondary[\s\S]*?color: var\(--color-primary\)/);
 assert.match(hero,/\[data-theme="dark"\] \.vip-hero \.vip-hero-secondary[\s\S]*?background: var\(--color-surface-elevated\)/);
 assert.match(hero,/\.vip-hero \.vip-hero-feature-icon[\s\S]*?background: var\(--color-primary-light\)/);
 assert.match(hero,/\.vip-hero \.badge-pill-glow[\s\S]*?color: var\(--color-primary\)/);
});
