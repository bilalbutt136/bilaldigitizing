import { requireE2EEnv } from './e2e-env.mjs';
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Logging in...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', requireE2EEnv('E2E_CUSTOMER_EMAIL'));
  await page.fill('input[type="password"]', requireE2EEnv('E2E_CUSTOMER_PASSWORD'));
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/client-portal', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Evaluating fetchOne in browser context...');
  const res = await page.evaluate(async () => {
    try {
      const response = await fetch('/api/orders?action=fetchOne&orderId=1208');
      const text = await response.text();
      return { status: response.status, body: text };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log('Result:', res);
  await browser.close();
}

main().catch(console.error);
