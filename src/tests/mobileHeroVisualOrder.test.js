import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('narrow mobile hero puts portfolio sample above the copy after VIP overrides', () => {
  const css = fs.readFileSync('src/components/public/HeroSectionVIP.css', 'utf8');
  const mobileRuleStart = css.lastIndexOf('@media (max-width: 899px)');
  const earlierCopyFirstRule = css.lastIndexOf('.vip-hero .hero-left-content { order: 1 !important; }');
  assert.ok(mobileRuleStart > earlierCopyFirstRule, 'sample-first fix must follow conflicting VIP rules');
  const mobileRules = css.slice(mobileRuleStart);
  assert.match(mobileRules, /\.vip-hero \.hero-grid-layout\s*\{\s*display:\s*flex !important;\s*flex-direction:\s*column !important;/);
  assert.match(mobileRules, /\.vip-hero \.hero-right-visual\s*\{\s*order:\s*1 !important;/);
  assert.match(mobileRules, /\.vip-hero \.hero-left-content\s*\{\s*order:\s*2 !important;/);
});

test('tablet two-column hero rules remain available from 900 to 1024 px', () => {
  const css = fs.readFileSync('src/components/public/HeroSectionVIP.css', 'utf8');
  assert.match(css, /@media \(min-width: 900px\) and \(max-width: 1024px\)/);
  assert.match(css, /\.vip-hero \.hero-grid-layout\s*\{\s*display:\s*grid !important;/);
});
