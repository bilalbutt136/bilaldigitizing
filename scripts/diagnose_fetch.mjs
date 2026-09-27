import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG [' + msg.type() + ']:', msg.text()));
  page.on('request', req => {
    if (req.url().includes('orders')) console.log('REQUEST:', req.url(), req.headers());
  });
  page.on('response', async resp => {
    if (reqUrl(resp.url()).includes('orders')) {
      console.log('RESPONSE:', resp.url(), resp.status());
      try {
        const json = await resp.json();
        console.log('RESPONSE JSON keys:', Object.keys(json), json.order ? 'HAS ORDER' : 'NO ORDER');
      } catch {}
    }
  });

  function reqUrl(u) { return u; }

  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');
  await page.waitForURL(url => url.pathname === '/client-portal', { timeout: 25000 });
  await page.waitForTimeout(3000);

  console.log('Testing direct fetch in browser context...');
  const res = await page.evaluate(async () => {
    const r = await fetch('/api/orders?action=fetchOne&orderId=1208');
    const status = r.status;
    const body = await r.json().catch(e => ({ error: e.message }));
    return { status, body };
  });
  console.log('DIRECT EVAL FETCH RESULT:', JSON.stringify(res, null, 2));

  console.log('Checking orders in state or window...');
  const stateCheck = await page.evaluate(() => {
    // Check if #1208 is rendered in DOM
    const hasOrderInDom = Boolean(document.querySelector('body')?.innerText?.includes('1208'));
    return { hasOrderInDom };
  });
  console.log('STATE CHECK:', stateCheck);

  await browser.close();
}

test().catch(console.error);
