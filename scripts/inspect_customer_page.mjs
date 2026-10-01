import { requireE2EEnv } from './e2e-env.mjs';
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => {
    if (req.url().includes('/api/')) console.log('[REQ]:', req.method(), req.url());
  });
  page.on('response', resp => {
    if (resp.url().includes('/api/')) console.log('[RESP]:', resp.status(), resp.url());
  });

  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', requireE2EEnv('E2E_CUSTOMER_EMAIL'));
  await page.fill('input[type="password"]', requireE2EEnv('E2E_CUSTOMER_PASSWORD'));
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('Navigating to client-portal?tab=orders&trackOrder=1208...');
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);

  const state = await page.evaluate(() => {
    return {
      selectedOrder: window.__selectedOrderForDrawer || null,
      ordersCount: window.__ordersCount || null,
    };
  });
  console.log('State:', state);

  await browser.close();
}

main().catch(console.error);
