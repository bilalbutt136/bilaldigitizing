import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const styles=fs.readFileSync('src/components/public/HeroSectionVIP.css','utf8');
const markup=fs.readFileSync('src/components/public/HeroSection.jsx','utf8');
const safety=styles.slice(styles.indexOf('Hero typography paint safety'));

test('hero title and subtitle never use unclipped backgrounds behind invisible lettering', () => {
 assert.ok(safety.length>500,'safety styles must be present');
 assert.match(safety,/\.vip-hero \.vip-hero-title-highlight,/);
 assert.match(safety,/\.vip-hero \.hero-highlight-row \.text-gradient-orange,/);
 assert.match(safety,/-webkit-background-clip: text !important/);
 assert.match(safety,/background-clip: text !important/);
 assert.match(safety,/-webkit-text-fill-color: transparent !important/);
 assert.match(safety,/background: linear-gradient\(105deg,/);
});
test('solid brand finish uses real colored text with no opaque block', () => {
 assert.match(safety,/html\[data-brand-finish="solid"\]/);
 assert.match(safety,/background: none !important/);
 assert.match(safety,/-webkit-text-fill-color: var\(--color-action-start/);
 assert.match(safety,/-webkit-background-clip: border-box !important/);
});
test('dark mode and Windows high contrast mode preserve readable hero text', () => {
 assert.match(safety,/\[data-theme="dark"\]/);
 assert.match(safety,/body\.dark-mode/);
 assert.match(safety,/@media \(forced-colors: active\)/);
 assert.match(safety,/-webkit-text-fill-color: CanvasText !important/);
 assert.match(markup,/className="vip-hero-title-highlight"/);
 assert.match(markup,/className="text-gradient-orange"/);
});
