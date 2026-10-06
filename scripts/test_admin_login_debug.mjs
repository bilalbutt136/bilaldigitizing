import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RES:', res.status(), res.url());
    }
  });

  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'shahidbutt59191@gmail.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');

  console.log('Submitted. Waiting 8s...');
  await page.waitForTimeout(8000);

  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'scratch/admin_login_after_wait.png', fullPage: true });

  await browser.close();
}

main().catch(console.error);
