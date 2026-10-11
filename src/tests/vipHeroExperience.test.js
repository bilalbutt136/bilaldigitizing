import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hero = fs.readFileSync('src/components/public/HeroSection.jsx', 'utf8');
const css = fs.readFileSync('src/components/public/HeroSectionVIP.css', 'utf8');

test('VIP hero preserves real CMS copy, studio portfolio and dynamic CTA actions', () => {
  assert.match(hero, /const matchedSlide = \(heroSlides \|\| \[\]\)\.find/);
  assert.match(hero, /const featuresList = Array\.isArray\(rawFeatures\)/);
  assert.match(hero, /portfolioSamples = \[\]/);
  assert.match(hero, /const activeShowcaseImages = React\.useMemo/);
  assert.match(hero, /openOrderWizard\(\{ type: service \}\)/);
  assert.match(hero, /onClick=\{handlePrimaryAction\}/);
  assert.match(hero, /onClick=\{handleSecondaryAction\}/);
});
test('VIP hero has strong brand CTA, dark-mode responsive style and accessible controls', () => {
  assert.match(hero, /className="theme-hero-section vip-hero"/);
  assert.match(hero, /vip-hero-primary/);
  assert.match(hero, /vip-hero-secondary/);
  assert.match(hero, /vip-hero-feature/);
  assert.match(hero, /aria-label="Studio capabilities"/);
  assert.match(css, /linear-gradient\(112deg,#0e64f2/);
  assert.match(css, /\[data-theme="dark"\] \.vip-hero/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});
test('before after comparison uses only matching actual gallery images', () => {
  assert.match(hero, /beforeUrl: item\.original_image/);
  assert.match(hero, /afterUrl: item\.digitized_image/);
  assert.match(hero, /currentImage\.beforeUrl !== currentImage\.afterUrl/);
  assert.match(hero, /Studio portfolio artwork/);
  assert.doesNotMatch(hero, /TRUSTED BY 1,200\+ BRANDS/);
});

test('first-screen layout keeps CTA and full detail visible on typical desktop viewports', () => {
  assert.match(hero, /vip-hero-duplicate-tabs/);
  assert.match(hero, /vip-hero-duplicate-vector-promo/);
  assert.match(css, /First-screen fit/);
  assert.match(css, /min-height: calc\(100svh - 69px\)/);
  assert.match(css, /height: min\(43vh,355px\)/);
  assert.match(css, /max-height: 800px/);
  assert.match(css, /max-width: 640px/);
  assert.match(css, /\.vip-hero-duplicate-tabs \{ display: none/);
});

test('wide-screen VIP hero balancing expands layout without overriding compact screens', () => {
  assert.match(css, /Wide-screen hero balance/);
  assert.match(css, /min-width: 1450px/);
  assert.match(css, /min-height: 780px/);
  assert.match(css, /max-width: min\(1640px, calc\(100% - 44px\)\)/);
  assert.match(css, /height: min\(48vh, 440px\)/);
  assert.match(css, /min-height: 980px/);
  assert.match(css, /min-width: 1350px/);
  assert.match(css, /Compact laptop view must retain the original first-screen sizing/);
});
