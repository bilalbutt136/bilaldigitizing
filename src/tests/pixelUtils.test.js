import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractMetaPixelId,
  isValidMetaPixelId,
  detectSnippetType,
  extractGoogleAnalyticsId,
  extractTikTokPixelId
} from '../utils/pixelUtils.js';

test('Meta Pixel Utils - Extraction and Validation', async (t) => {
  await t.test('extracts direct numeric Pixel ID', () => {
    assert.equal(extractMetaPixelId('986664733689901'), '986664733689901');
    assert.equal(extractMetaPixelId('  1234567890123456  '), '1234567890123456');
    assert.equal(extractMetaPixelId(986664733689901), '986664733689901');
  });

  await t.test('extracts Pixel ID from official full Meta base code snippet', () => {
    const metaSnippet = `
      <!-- Meta Pixel Code -->
      <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '986664733689901');
      fbq('track', 'PageView');
      </script>
      <noscript><img height="1" width="1" style="display:none"
      src="https://www.facebook.com/tr?id=986664733689901&ev=PageView&noscript=1"
      /></noscript>
      <!-- End Meta Pixel Code -->
    `;
    assert.equal(extractMetaPixelId(metaSnippet), '986664733689901');
  });

  await t.test('extracts Pixel ID from noscript or URL snippet', () => {
    const noscriptSnippet = '<noscript><img src="https://www.facebook.com/tr?id=884729104829102&ev=PageView&noscript=1"/></noscript>';
    assert.equal(extractMetaPixelId(noscriptSnippet), '884729104829102');
  });

  await t.test('extracts Pixel ID from Events Manager copy-paste text', () => {
    assert.equal(extractMetaPixelId('Dataset ID: 986664733689901'), '986664733689901');
    assert.equal(extractMetaPixelId('Pixel ID = 123456789012345'), '123456789012345');
  });

  await t.test('handles empty and invalid input safely', () => {
    assert.equal(extractMetaPixelId(''), '');
    assert.equal(extractMetaPixelId(null), '');
    assert.equal(extractMetaPixelId(undefined), '');
    assert.equal(extractMetaPixelId('hello world no numbers'), '');
  });

  await t.test('detectSnippetType correctly identifies input types', () => {
    assert.equal(detectSnippetType(''), 'empty');
    assert.equal(detectSnippetType('986664733689901'), 'pixel_id');
    assert.equal(detectSnippetType("<!-- Meta Pixel Code --><script>fbq('init', '1234567890');</script>"), 'full_meta_code');
    assert.equal(detectSnippetType('<script src="https://example.com/tag.js"></script>'), 'custom_script');
    assert.equal(detectSnippetType('non-numeric invalid input'), 'invalid');
  });

  await t.test('isValidMetaPixelId verifies numeric length correctly', () => {
    assert.equal(isValidMetaPixelId('986664733689901'), true);
    assert.equal(isValidMetaPixelId('1234567890123456'), true);
    assert.equal(isValidMetaPixelId('123'), false); // too short
    assert.equal(isValidMetaPixelId('abc1234567890'), false);
    assert.equal(isValidMetaPixelId(''), false);
  });

  await t.test('extractGoogleAnalyticsId detects GA4 and GTM IDs', () => {
    assert.equal(extractGoogleAnalyticsId('G-ABC1234XYZ'), 'G-ABC1234XYZ');
    assert.equal(extractGoogleAnalyticsId('GTM-K982910'), 'GTM-K982910');
    assert.equal(extractGoogleAnalyticsId('<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC1234XYZ"></script>'), 'G-ABC1234XYZ');
  });

  await t.test('extractTikTokPixelId detects TikTok Pixel IDs', () => {
    assert.equal(extractTikTokPixelId('C982019482910394'), 'C982019482910394');
    assert.equal(extractTikTokPixelId("ttq.load('C982019482910394');"), 'C982019482910394');
  });
});
