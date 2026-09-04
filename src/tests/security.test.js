import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateSafeUrl } from '../lib/urlValidator.js';
import { checkRateLimit, getRateLimitHeaders } from '../lib/rateLimit.js';

describe('SSRF Protection & URL Validation', () => {
  test('allows trusted Supabase storage URLs', () => {
    const res = validateSafeUrl('https://xyzref.supabase.co/storage/v1/object/public/order-files/test.dst');
    assert.equal(res.valid, true);
    assert.match(res.sanitizedUrl, /^https:\/\/xyzref\.supabase\.co\//);
  });

  test('allows trusted Cloudinary asset URLs', () => {
    const res = validateSafeUrl('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    assert.equal(res.valid, true);
  });

  test('allows trusted AWS S3, Cloudflare R2, and Google Cloud Storage URLs', () => {
    assert.equal(validateSafeUrl('https://my-bucket.s3.amazonaws.com/embroidery/order.pdf').valid, true);
    assert.equal(validateSafeUrl('https://pub-xyz.r2.dev/artwork.dst').valid, true);
    assert.equal(validateSafeUrl('https://storage.googleapis.com/bdigi-assets/logo.ai').valid, true);
    assert.equal(validateSafeUrl('https://firebasestorage.googleapis.com/v0/b/app/patch.png').valid, true);
  });

  test('allows same-origin relative URLs', () => {
    const res = validateSafeUrl('/uploads/artwork_sample.zip');
    assert.equal(res.valid, true);
  });

  test('blocks SSRF to localhost and loopback IPs', () => {
    assert.equal(validateSafeUrl('http://localhost:3000/api/admin').valid, false);
    assert.equal(validateSafeUrl('http://127.0.0.1:8080/secret').valid, false);
    assert.equal(validateSafeUrl('http://127.0.0.2/admin').valid, false);
    assert.equal(validateSafeUrl('http://0.0.0.0/').valid, false);
  });

  test('blocks SSRF to cloud metadata endpoints', () => {
    assert.equal(validateSafeUrl('http://169.254.169.254/latest/meta-data/').valid, false);
    assert.equal(validateSafeUrl('http://metadata.google.internal/computeMetadata/v1/').valid, false);
  });

  test('blocks private IPv4 RFC 1918 ranges', () => {
    assert.equal(validateSafeUrl('http://10.0.0.1/admin').valid, false);
    assert.equal(validateSafeUrl('http://192.168.1.1/router').valid, false);
    assert.equal(validateSafeUrl('http://172.20.0.5/api').valid, false);
  });

  test('blocks non-HTTP/HTTPS protocols', () => {
    assert.equal(validateSafeUrl('ftp://example.com/file.dst').valid, false);
    assert.equal(validateSafeUrl('file:///etc/passwd').valid, false);
    assert.equal(validateSafeUrl('javascript:alert(1)').valid, false);
  });

  test('blocks unknown third-party domains', () => {
    assert.equal(validateSafeUrl('https://malicious-site.com/payload.exe').valid, false);
  });
});

describe('In-Memory Rate Limiting', () => {
  test('allows requests within limit', () => {
    const testId = `test-client-${Date.now()}`;
    const r1 = checkRateLimit(testId, 3, 10000);
    assert.equal(r1.success, true);
    assert.equal(r1.remaining, 2);

    const r2 = checkRateLimit(testId, 3, 10000);
    assert.equal(r2.success, true);
    assert.equal(r2.remaining, 1);

    const r3 = checkRateLimit(testId, 3, 10000);
    assert.equal(r3.success, true);
    assert.equal(r3.remaining, 0);
  });

  test('blocks requests exceeding limit and includes retry-after', () => {
    const testId = `test-blocked-${Date.now()}`;
    checkRateLimit(testId, 2, 10000);
    checkRateLimit(testId, 2, 10000);

    const blocked = checkRateLimit(testId, 2, 10000);
    assert.equal(blocked.success, false);
    assert.equal(blocked.remaining, 0);
    assert.ok(blocked.retryAfter > 0);

    const headers = getRateLimitHeaders(blocked);
    assert.equal(headers['X-RateLimit-Remaining'], '0');
    assert.ok(headers['Retry-After']);
  });
});
