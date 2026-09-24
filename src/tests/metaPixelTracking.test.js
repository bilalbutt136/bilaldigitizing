import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseReferrerInfo,
  extractMarketingParams,
  detectDeviceType,
  detectOS,
  detectBrowser,
  generateUUID,
  resolveUserIdentity
} from '../utils/visitorTracker.js';

describe('Meta Pixel & Visitor Telemetry Engine', () => {

  describe('Traffic Attribution & Referrer Parsing', () => {
    test('identifies direct traffic when referrer is empty', () => {
      const res = parseReferrerInfo('', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Direct');
      assert.equal(res.trafficSource, 'Direct');
      assert.equal(res.searchEngine, null);
      assert.equal(res.socialNetwork, null);
    });

    test('identifies Google organic search', () => {
      const res = parseReferrerInfo('https://www.google.com/search?q=embroidery+digitizing', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Organic Search');
      assert.equal(res.searchEngine, 'Google');
      assert.equal(res.trafficSource, 'www.google.com');
    });

    test('identifies Bing organic search', () => {
      const res = parseReferrerInfo('https://www.bing.com/search?q=vector+art', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Organic Search');
      assert.equal(res.searchEngine, 'Bing');
    });

    test('identifies Facebook social referrer and l.facebook.com link shim', () => {
      const res = parseReferrerInfo('https://l.facebook.com/l.php?u=https%3A%2F%2Fbdigitizing.com', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Social Media');
      assert.equal(res.socialNetwork, 'Facebook');
    });

    test('identifies Instagram social referrer', () => {
      const res = parseReferrerInfo('https://www.instagram.com/', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Social Media');
      assert.equal(res.socialNetwork, 'Instagram');
    });

    test('identifies TikTok social referrer', () => {
      const res = parseReferrerInfo('https://www.tiktok.com/', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Social Media');
      assert.equal(res.socialNetwork, 'TikTok');
    });

    test('identifies internal navigation', () => {
      const res = parseReferrerInfo('https://bdigitizing.com/services', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Direct / Internal');
    });

    test('identifies third-party referral domains', () => {
      const res = parseReferrerInfo('https://embroideryforum.com/threads/best-digitizer', 'bdigitizing.com');
      assert.equal(res.trafficChannel, 'Referral');
      assert.equal(res.trafficSource, 'embroideryforum.com');
    });
  });

  describe('Marketing & Campaign Parameter Extraction', () => {
    test('extracts complete UTM parameters', () => {
      const search = '?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_sale&utm_term=patches&utm_content=video_ad';
      const params = extractMarketingParams(search);
      assert.equal(params.utmSource, 'facebook');
      assert.equal(params.utmMedium, 'cpc');
      assert.equal(params.utmCampaign, 'summer_sale');
      assert.equal(params.utmTerm, 'patches');
      assert.equal(params.utmContent, 'video_ad');
    });

    test('extracts Meta fbclid and ad click IDs', () => {
      const search = '?fbclid=IwAR1abcXYZ987_test_click_id&gclid=Cj0KCQjw123&ttclid=tt_abc_456';
      const params = extractMarketingParams(search);
      assert.equal(params.fbclid, 'IwAR1abcXYZ987_test_click_id');
      assert.equal(params.gclid, 'Cj0KCQjw123');
      assert.equal(params.ttclid, 'tt_abc_456');
    });

    test('handles empty or missing parameters gracefully', () => {
      const params = extractMarketingParams('');
      assert.equal(params.utmSource, null);
      assert.equal(params.fbclid, null);
      assert.equal(params.gclid, null);
    });
  });

  describe('UUID Generation & Format', () => {
    test('generates valid RFC4122 v4 UUID', () => {
      const id = generateUUID();
      assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('generates unique IDs across calls', () => {
      const id1 = generateUUID();
      const id2 = generateUUID();
      assert.notEqual(id1, id2);
    });
  });

  describe('User Identity & Role Resolution', () => {
    test('resolves anonymous visitor as Guest Visitor', () => {
      const identity = resolveUserIdentity(null);
      assert.equal(identity, 'Guest Visitor');
    });

    test('resolves logged-in customer with name and email', () => {
      const customer = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'customer'
      };
      const identity = resolveUserIdentity(customer);
      assert.equal(identity, 'Customer (John Doe <john@example.com>)');
    });

    test('resolves platform admin with email', () => {
      const admin = {
        email: 'admin@bdigitizing.com',
        role: 'admin'
      };
      const identity = resolveUserIdentity(admin);
      assert.equal(identity, 'Platform Admin (admin@bdigitizing.com)');
    });

    test('respects custom override role', () => {
      const identity = resolveUserIdentity(null, 'Simulated VIP Buyer');
      assert.equal(identity, 'Simulated VIP Buyer');
    });
  });

});
