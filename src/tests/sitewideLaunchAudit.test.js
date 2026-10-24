import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = (file) => fs.readFileSync(file, 'utf8');

test('public contact form never reports delivery success on a rejected request', () => {
  const form = source('app/contact/page.jsx');
  const route = source('app/api/contact/route.js');
  assert.match(form, /fetch\('\/api\/contact'/);
  assert.doesNotMatch(form, /fetch\('\/api\/email'/);
  assert.match(form, /!response\.ok \|\| result\?\.success !== true/);
  assert.match(form, /setSubmitError\(message\)/);
  assert.match(route, /checkDistributedRateLimit/);
  assert.match(route, /resolveAdminNotificationConfig/);
  assert.match(route, /createAdminClient/);
  assert.match(route, /inbox-contact_/);
  assert.match(route, /\.from\('conversations'\)/);
  assert.match(route, /\.from\('messages'\)/);
  assert.match(route, /unread_admin_count/);
  assert.match(route, /escapeHtml\(inquiry\.message\)/);
  assert.match(route, /if \(error \|\| !data\?\.id\)/);
});

test('sitewide theme retains full styles and both distinct semantic moods', () => {
  const css = source('src/index.css');
  const presets = source('src/utils/themePresets.js');
  assert.ok(css.split(/\r?\n/).length > 1800, 'Full responsive CSS must remain intact');
  assert.match(css, /--color-action-start: #2563eb;/);
  assert.match(css, /--color-background: #080f20;/);
  assert.match(css, /--color-text-primary: #f8faff;/);
  assert.match(presets, /name: 'Signature Sapphire'/);
  assert.match(presets, /'--color-background': '#f6f8fd'/);
  assert.match(presets, /'--color-background': '#080f20'/);
});

test('sitewide CTA and contact copy use the shared identity', () => {
  const contact = source('app/contact/page.jsx');
  const global = source('app/globals.css');
  const theme = source('src/components/admin/settings/ThemeBrandingSettings.jsx');
  assert.match(contact, /className="contact-page"/);
  assert.match(contact, /background: 'var\(--color-background\)'/);
  assert.match(global, /#4338ca/);
  assert.match(theme, /customBrandColors\?\.secondary \|\| '#5b21b6'/);
  assert.match(theme, /customBrandColors\?\.accent \|\| '#7c3aed'/);
});
