import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/components/customer/StreamlinedOrderFlow.jsx','utf8');

test('Embroidery and Vector both use one native select visual style', () => {
  assert.match(source,/id="bdigi-embroidery-package"/);
  assert.match(source,/htmlFor="bdigi-embroidery-package"/);
  assert.match(source,/className="bdigi-select"/);
  assert.match(source,/className="bdigi-select-wrapper"/);
  assert.match(source,/aria-label="Embroidery package"/);
  assert.match(source,/eligibleEmbroidery\.map\(tier =>/);
  assert.doesNotMatch(source,/bdigi-package-option/);
});
test('size-restricted dropdown shows only eligible packages without faint disabled items', () => {
  assert.match(source,/disabled=\{eligibleEmbroidery\.length === 0\}/);
  assert.match(source,/formatUSD\(tier\.price\)/);
  assert.match(source,/setSelectedTierId\(event\.target\.value\)/);
  assert.match(source,/No package available for this size/);
  assert.match(source,/7″: Standard or Premium/);
  assert.match(source,/12″: Premium only/);
  assert.match(source,/\.bdigi-select option \{/);
  assert.match(source,/\[data-theme="dark"\] \.bdigi-select option/);
  assert.match(source,/\.bdigi-embroidery-package-row \.bdigi-select/);
  assert.match(source,/focus-visible/);
});
test('order total and checkout retain common brand color tokens', () => {
  assert.match(source,/color: 'var\(--color-primary, #1d4ed8\)', lineHeight: 1/);
  assert.match(source,/background: 'var\(--color-action-bg, linear-gradient\(120deg, #1d4ed8, #4338ca\)\)'/);
});
