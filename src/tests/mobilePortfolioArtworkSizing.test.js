import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const hero = fs.readFileSync('src/components/public/HeroSection.jsx', 'utf8');
const css = fs.readFileSync('src/components/public/HeroSectionVIP.css', 'utf8');

test('portfolio image no longer has Tap to inspect overlay or tooltip while zoom remains functional', () => {
  assert.doesNotMatch(hero, /Tap to inspect/);
  assert.doesNotMatch(hero, /<ZoomIn/);
  assert.match(hero, /onClick=\{handleImageClick\}/);
  assert.match(hero, /hero-sample-lightbox-card/);
});

test('mobile pagination dot buttons use compact controls with visible tiny indicators', () => {
  assert.match(hero, /className="hero-showcase-pagination"/);
  assert.match(hero, /className="hero-showcase-pagination-dot"/);
  assert.match(hero, /data-active=\{isActive/);
  assert.match(hero, /aria-label=\{\`Show portfolio sample/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /\.vip-hero \.hero-showcase-pagination-dot\s*\{[\s\S]*?min-height:\s*24px !important/);
  assert.match(css, /\.vip-hero \.hero-showcase-pagination-dot::after\s*\{/);
  assert.match(css, /\.vip-hero \.hero-showcase-pagination-dot\[data-active="true"\]::after/);
});

test('phone portfolio image stage is taller but remains uncropped', () => {
  assert.match(css, /\.vip-hero \.hero-showcase-image-box\s*\{\s*height: clamp\(265px, 78vw, 345px\) !important/);
  assert.match(css, /height: clamp\(265px, 78vw, 345px\) !important/);
  assert.match(css, /\.vip-hero \.hero-showcase-image-box > img/);
  assert.match(css, /object-fit: contain !important/);
});
