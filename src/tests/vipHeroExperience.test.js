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
