import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Mobile Hero Sample First & VIP Presentation', () => {
  const heroFilePath = path.join(process.cwd(), 'src/components/public/HeroSection.jsx');
  const indexCssPath = path.join(process.cwd(), 'src/index.css');

  test('HeroSection.jsx exists and contains mobile sample-first order styling', () => {
    assert.equal(fs.existsSync(heroFilePath), true, 'HeroSection.jsx must exist');
    const heroCode = fs.readFileSync(heroFilePath, 'utf8');

    // 1. Right showcase column has className hero-right-visual
    assert.match(
      heroCode,
      /className="hero-right-visual"/,
      'HeroSection must designate hero-right-visual class on the showcase column'
    );

    // 2. Left text column has className hero-left-content
    assert.match(
      heroCode,
      /className="hero-left-content"/,
      'HeroSection must designate hero-left-content class on the copy column'
    );

    // 3. Media query sets hero-right-visual order: 1 and hero-left-content order: 2
    assert.match(
      heroCode,
      /\.hero-right-visual\s*\{\s*order:\s*1\s*!important;/,
      'Mobile/tablet media query must set hero-right-visual order: 1 so sample card appears first'
    );
    assert.match(
      heroCode,
      /\.hero-left-content\s*\{\s*order:\s*2\s*!important;/,
      'Mobile/tablet media query must set hero-left-content order: 2 so text appears below sample'
    );
  });

  test('src/index.css synchronizes mobile sample-first layout order', () => {
    assert.equal(fs.existsSync(indexCssPath), true, 'src/index.css must exist');
    const cssCode = fs.readFileSync(indexCssPath, 'utf8');

    assert.match(
      cssCode,
      /\.hero-right-visual\s*\{\s*order:\s*1\s*!important;/,
      'index.css must synchronize hero-right-visual order: 1 for mobile viewports'
    );
    assert.match(
      cssCode,
      /\.hero-left-content\s*\{\s*order:\s*2\s*!important;/,
      'index.css must synchronize hero-left-content order: 2 for mobile viewports'
    );
  });

  test('HeroSection.jsx implements touch swipe navigation for mobile sample browsing', () => {
    const heroCode = fs.readFileSync(heroFilePath, 'utf8');

    // Touch event handlers present
    assert.match(heroCode, /handleTouchStart/, 'HeroSection must handle touch start');
    assert.match(heroCode, /handleTouchMove/, 'HeroSection must handle touch move');
    assert.match(heroCode, /handleTouchEnd/, 'HeroSection must handle touch end');
    assert.match(heroCode, /onTouchStart=\{handleTouchStart\}/, 'showcase image box must attach onTouchStart');
    assert.match(heroCode, /onTouchEnd=\{handleTouchEnd\}/, 'showcase image box must attach onTouchEnd');
  });

  test('HeroSection.jsx provides mobile VIP badge and interactive full-screen inspection lightbox', () => {
    const heroCode = fs.readFileSync(heroFilePath, 'utf8');

    // Mobile VIP banner
    assert.match(
      heroCode,
      /hero-mobile-vip-banner/,
      'HeroSection must include hero-mobile-vip-banner for real production sew-out branding'
    );

    // Tap to inspect badge & Lightbox modal
    assert.match(heroCode, /lightboxSample/, 'HeroSection must maintain lightboxSample state');
    assert.match(heroCode, /handleImageClick/, 'HeroSection must support tapping image to open sample preview');
    assert.match(heroCode, /Tap to inspect/, 'Showcase image container must expose Tap to inspect indicator');
    assert.match(heroCode, /hero-sample-lightbox-card/, 'HeroSection must render full-screen interactive lightbox modal');
    assert.match(heroCode, /Order Similar Quality/, 'Lightbox modal must include high-converting CTA action');
  });
});
