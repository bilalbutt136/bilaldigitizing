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
  assert.match(css, /background: var\(--color-action-bg/);
  assert.match(css, /\[data-theme="dark"\] \.vip-hero/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});
test('before after comparison uses only matching actual gallery images', () => {
  assert.match(hero, /beforeUrl: item\.original_image/);
  assert.match(hero, /afterUrl: item\.digitized_image/);
  assert.match(hero, /currentImage\.beforeUrl !== currentImage\.afterUrl/);
  // Decorative labels were removed; the sample, its title and detail inspection remain.
  assert.doesNotMatch(hero, /Studio portfolio artwork/);
  assert.doesNotMatch(hero, /View design details/);
  assert.doesNotMatch(hero, /STUDIO PORTFOLIO/);
  assert.match(hero, /currentImage\?\.title \|\| previewTitle/);
  assert.match(hero, /onClick=\{handleImageClick\}/);
  assert.doesNotMatch(hero, /TRUSTED BY 1,200\+ BRANDS/);
});

test('desktop hero uses one unified height-aware layout at 100% browser zoom', () => {
  assert.match(css, /Unified VIP desktop sizing/);
  assert.match(css, /min-width: 1025px/);
  assert.match(css, /min-height: 690px/);
  assert.match(css, /max-width: 1780px/);
  assert.match(css, /font-size: clamp\(2\.55rem, 3\.13vw, 3\.85rem\)/);
  assert.match(css, /grid-template-rows: auto minmax\(0, 1fr\)/);
  assert.match(css, /max-height: calc\(100svh - 269px\)/);
  assert.match(css, /max-height: 780px/);
  assert.match(css, /max-height: 899px/);
  assert.match(css, /max-height: 689px/);
});
test('mobile and tablet keep accessible content without viewport clipping', () => {
  assert.match(css, /@media \(max-width: 1024px\)/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.match(css, /Landscape tablets|Tablets stay two-column/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.match(hero, /vip-hero-duplicate-tabs/);
  assert.match(hero, /vip-hero-duplicate-vector-promo/);
});

test('showcase has one clean image stage without artificial grey side gutters', () => {
  assert.doesNotMatch(hero, /Ambient Blurred Artwork Backdrop/);
  assert.doesNotMatch(hero, /Subtle vignette layer to elevate foreground artwork contrast/);
  assert.doesNotMatch(hero, /blur\(30px\) saturate\(1\.3\)/);
  assert.doesNotMatch(hero, /drop-shadow\(0 8px 24px/);
  assert.match(hero, /objectFit: 'contain'/);
  assert.match(hero, /aria-label="Previous portfolio sample"/);
  assert.match(hero, /aria-label="Next portfolio sample"/);
  assert.match(css, /Clean studio portfolio: a single, seamless artwork stage/);
  assert.match(css, /\.hero-showcase-image-box > img/);
  assert.match(css, /background: #ffffff !important/);
  assert.match(css, /\[data-theme="dark"\] \.vip-hero \.hero-showcase-card/);
});
