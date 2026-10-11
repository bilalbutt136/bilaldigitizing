import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('src/components/customer/StreamlinedOrderFlow.jsx','utf8');
test('package buttons always display readable names and live prices',()=>{
 assert.match(source,/className="bdigi-package-name"/);
 assert.match(source,/className="bdigi-package-price"/);
 assert.match(source,/className="bdigi-package-status"/);
 assert.match(source,/disabled=\{!allowed\}/);
 assert.match(source,/formatUSD\(tier.price\)/);
 assert.match(source,/aria-label=\{tier.title/);
 assert.match(source,/setSelectedTierId\(val\)/);
});
test('bright blue selected and readable rose locked palettes in light and dark',()=>{
 assert.match(source,/\.bdigi-package-option\[aria-pressed="true"\]/);
 assert.match(source,/\.bdigi-package-option:disabled \{/);
 assert.match(source,/opacity: 1;/);
 assert.match(source,/background: #fff1f2;/);
 assert.match(source,/color: #881337;/);
 assert.match(source,/\[data-theme="dark"\] \.bdigi-package-option:disabled/);
 assert.match(source,/color: #ffe4e6;/);
 assert.match(source,/\.bdigi-package-notice/);
 assert.match(source,/focus-visible/);
 assert.match(source,/hover:not\(:disabled\):not\(\[aria-pressed="true"\]\)/);
});
test('matching CTA and summary styling avoids orange brand conflict',()=>{
 assert.match(source,/color: 'var\(--color-primary, #1d4ed8\)', lineHeight: 1/);
 assert.match(source,/background: 'var\(--color-action-bg, linear-gradient\(120deg, #1d4ed8, #4338ca\)\)'/);
});
