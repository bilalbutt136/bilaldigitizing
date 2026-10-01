import { requireE2EEnv } from './e2e-env.mjs';
import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]:', err.message));

  console.log('1. Logging in on /secure-admin-login...');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', requireE2EEnv('E2E_ADMIN_EMAIL'));
  await page.fill('input[type="password"]', requireE2EEnv('E2E_ADMIN_PASSWORD'));
  await page.click('button[type="submit"]');

  // Wait for login to complete and token to be saved
  await page.waitForTimeout(4000);

  console.log('2. Navigating directly to /admin-portal?tab=orders ...');
  await page.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  console.log('3. Final URL:', page.url());
  await page.screenshot({ path: 'scratch/admin_portal_direct.png' });

  const bodyText = await page.innerText('body');
  console.log('4. Includes 1208?', bodyText.includes('1208'));
  console.log('5. Snippet:', bodyText.substring(0, 300).replace(/\n+/g, ' '));

  await browser.close();
}

main().catch(console.error);
