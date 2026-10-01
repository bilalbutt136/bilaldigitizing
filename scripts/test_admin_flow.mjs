import { requireE2EEnv } from './e2e-env.mjs';
import { chromium } from 'playwright';

async function testAdminFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', m => console.log('ADMIN PAGE:', m.text()));
  page.on('pageerror', err => console.log('ADMIN ERROR:', err.message));

  console.log('Logging in as Admin...');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', requireE2EEnv('E2E_ADMIN_EMAIL'));
  await page.fill('input[type="password"]', requireE2EEnv('E2E_ADMIN_PASSWORD'));
  await page.click('button[type="submit"]');

  await page.waitForURL(u => u.pathname === '/admin-portal', { timeout: 20000 });
  await page.waitForTimeout(4000);
  console.log('Admin portal loaded!');

  await page.screenshot({ path: 'scratch/admin_portal_table.png' });

  // Locate row with 1208
  console.log('Locating order #1208 in admin table...');
  const row = await page.$('tr:has-text("1208")');
  console.log('Found row in admin table?', Boolean(row));

  // Click Deliver Files or Manage
  const deliverBtn = await page.$('tr:has-text("1208") button:has-text("Deliver Files")') ||
                     await page.$('tr:has-text("1208") button:has-text("Manage")');
  console.log('Clicking deliver button...');
  await deliverBtn.click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/admin_drawer_open.png' });

  const text = await page.innerText('body');
  console.log('Admin delivery drawer opened?', text.includes('Upload Deliverables') || text.includes('Browse Machine Files'));

  await browser.close();
}

testAdminFlow().catch(console.error);
