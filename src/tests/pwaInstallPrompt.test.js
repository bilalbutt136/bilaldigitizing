import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = relativePath =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('mobile website exposes a removable PWA install notice with native one-click prompt', () => {
  const source = read('src/components/common/PWAInstallBanner.jsx');

  assert.match(source, /MOBILE_PROMPT_DELAY_MS = 1800/);
  assert.match(source, /ANDROID_FALLBACK_DELAY_MS = 3600/);
  assert.match(source, /EXPLICIT_DISMISS_COOLDOWN_MS = 24 \* 60 \* 60 \* 1000/);

  assert.match(source, /window\.deferredPWAInstallPrompt/);
  assert.match(source, /await promptObj\.prompt\(\)/);
  assert.match(source, /await promptObj\.userChoice/);
  assert.match(source, /outcome === 'accepted'/);

  assert.match(source, /role="status"/);
  assert.match(source, /aria-live="polite"/);
  assert.match(source, /aria-label="Close install popup"/);
  assert.match(source, /bdigi_pwa_dismissed_until/);

  assert.match(source, /src="\/icon-192x192\.png"/);
  assert.match(source, /Install BDigitizing App/);
  assert.match(source, /no app store needed/);
  assert.match(source, /How to Install/);
});

test('install card is mobile responsive and does not overlap on narrow screens', () => {
  const source = read('src/components/common/PWAInstallBanner.jsx');

  assert.match(source, /@media \(max-width: 420px\)/);
  assert.match(source, /\.bdigi-install-card-main/);
  assert.match(source, /flex-wrap: wrap/);
  assert.match(source, /\.bdigi-install-actions/);
  assert.match(source, /width: 100%/);
});

test('push permission never collides with the PWA install click', () => {
  const registrar = read('src/components/common/PWARegistrar.jsx');

  assert.equal(
    registrar.includes("window.addEventListener('click', handleFirstInteraction"),
    false
  );
  assert.equal(
    registrar.includes("window.addEventListener('touchend', handleFirstInteraction"),
    false
  );
  assert.equal(
    registrar.includes('Notification.requestPermission()'),
    false
  );

  assert.match(registrar, /await setupPush\(reg\)/);
});

test('installed mode suppresses the website install notice', () => {
  const shell = read('src/components/layout/ClientLayoutShell.jsx');
  const banner = read('src/components/common/PWAInstallBanner.jsx');

  assert.match(shell, /\{!isAppMode && !isCompactShell && <PWAInstallBanner \/>\}/);
  assert.match(banner, /if \(isStandalone \|\| !showBanner\) return null/);
  assert.match(banner, /window\.matchMedia\('\(display-mode: standalone\)'\)/);
});
