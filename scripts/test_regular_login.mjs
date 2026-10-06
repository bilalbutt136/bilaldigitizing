import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to https://bdigitizing.com/login...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'networkidle' });

  console.log('2. Filling credentials...');
  await page.fill('input[type="email"]', 'shahidbutt59191@gmail.com');
  await page.fill('input[type="password"]', 'admin123');

  console.log('3. Clicking submit...');
  await page.click('button[type="submit"]');

  console.log('4. Waiting for response...');
  await page.waitForTimeout(6000);

  const currentUrl = page.url();
  console.log('Current URL after /login:', currentUrl);
  await page.screenshot({ path: 'scratch/login_route_verification.png', fullPage: true });

  await browser.close();
}

main().catch(console.error);
