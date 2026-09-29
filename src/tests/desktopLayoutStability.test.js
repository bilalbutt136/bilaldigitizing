import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relative => fs.readFileSync(path.join(process.cwd(), relative), 'utf8');

describe('Desktop layout stability regression', () => {
  test('global route loading shell keeps the footer below the first viewport', () => {
    const source = read('app/loading.jsx');
    assert.match(source, /className="route-loading-shell"/);
    assert.match(source, /minHeight: 'calc\(100svh - 101px\)'/);
  });

  test('shared layout does not suspend the page body above the footer', () => {
    const source = read('src/components/layout/ClientLayoutShell.jsx');
    const mainStart = source.indexOf('<main className="website-main-zone"');
    const footerStart = source.indexOf('website-footer-zone');
    assert.ok(mainStart >= 0 && footerStart > mainStart);
    const mainBlock = source.slice(mainStart, footerStart);
    assert.equal(mainBlock.includes('<Suspense'), false);
    assert.match(mainBlock, /\{children\}/);
  });

  test('worker shell also renders route children without a short suspense placeholder', () => {
    const source = read('src/components/layout/ClientLayoutShell.jsx');
    const workerStart = source.indexOf('stealth-worker-portal');
    const siteStart = source.indexOf('return (', workerStart + 1);
    const workerBlock = source.slice(workerStart, siteStart > workerStart ? siteStart : source.length);
    assert.equal(workerBlock.includes('bdigi-skeleton'), false);
  });

  test('webfonts use optional display so slow font loads cannot reflow desktop text', () => {
    const source = read('app/layout.jsx');
    const optionalCount = (source.match(/display: 'optional'/g) || []).length;
    assert.equal(optionalCount, 2);
    assert.equal(source.includes("display: 'swap'"), false);
  });

  test('FAQ CMS content is merged during first render instead of after mount', () => {
    const source = read('app/faqs/page.jsx');
    assert.match(source, /const faqs = useMemo\(\(\) => \{/);
    assert.equal(source.includes('setFaqs(merged)'), false);
    assert.equal(source.includes('useEffect'), false);
  });

  test('route loading geometry is aligned for compact auth and worker shells', () => {
    const css = read('src/index.css');
    assert.match(css, /DESKTOP STREAMING STABILITY/);
    assert.match(css, /\.auth-route-shell \.route-loading-shell/);
    assert.match(css, /\.stealth-worker-portal \.route-loading-shell/);
  });
});
