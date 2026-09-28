import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('HTTP ERROR:', resp.status(), resp.url());
  });

  console.log('1. Navigating to login...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('2. Filling credentials...');
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');

  console.log('3. Waiting for redirect to /client-portal...');
  await page.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('Current URL after login:', page.url());

  console.log('4. Testing fetchOne for 1208 in browser session...');
  const result = await page.evaluate(async () => {
    const res = await fetch('/api/orders?action=fetchOne&orderId=1208');
    const status = res.status;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    return { status, body };
  });
  console.log('FETCH RESULT FOR 1208:', JSON.stringify(result, null, 2));

  await browser.close();
}

test().catch(console.error);
