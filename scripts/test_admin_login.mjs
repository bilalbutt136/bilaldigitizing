import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://bdigitizing.com/secure-admin-login...');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });

  console.log('2. Filling credentials...');
  await page.fill('input[type="email"]', 'shahidbutt59191@gmail.com');
  await page.fill('input[type="password"]', 'admin123');

  console.log('3. Clicking submit...');
  await page.click('button[type="submit"]');

  // Wait for navigation or portal load
  console.log('4. Waiting for response...');
  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);

  await page.screenshot({ path: 'scratch/admin_login_verification.png', fullPage: true });

  const bodyText = await page.innerText('body');
  console.log('Snippet of page text:', bodyText.substring(0, 300));

  await browser.close();
}

main().catch(console.error);
