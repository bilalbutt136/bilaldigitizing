import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const debug = await page.evaluate(async () => {
    // Check localStorage auth
    const authUser = localStorage.getItem('bdigi_auth_user');
    // Call fetchOrderById via fetch directly
    const res = await fetch('/api/orders?action=fetchOne&orderId=1208');
    const data = await res.json();
    return { authUser, resStatus: res.status, data };
  });

  console.log('DEBUG:', JSON.stringify(debug, null, 2));
  await browser.close();
}

main().catch(console.error);
