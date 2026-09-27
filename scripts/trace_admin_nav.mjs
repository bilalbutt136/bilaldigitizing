import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => console.log('[PAGE ERROR STACK]:', err.stack));

  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
  await page.fill('input[type="password"]', 'AdminSecurePass123!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(6000);
  await browser.close();
}

main().catch(console.error);
