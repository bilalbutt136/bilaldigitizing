import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
  await page.fill('input[type="password"]', 'AdminSecurePass123!');
  console.log('Submitting login...');
  await page.click('button[type="submit"]');

  await page.waitForURL(u => u.pathname === '/admin-portal', { timeout: 15000 });
  await page.waitForTimeout(5000);
  console.log('Current URL:', page.url());

  await page.screenshot({ path: 'scratch/admin_portal_real.png' });

  const hasOrdersTable = await page.$('table');
  console.log('Table found?', Boolean(hasOrdersTable));

  // Print text content of any h1, h2, h3
  const headings = await page.evaluate(() => 
    Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText)
  );
  console.log('Headings on page:', headings);

  // Check if order 1208 is found anywhere in page text
  const bodyText = await page.innerText('body');
  console.log('Includes 1208?', bodyText.includes('1208'));

  await browser.close();
}

main().catch(console.error);
