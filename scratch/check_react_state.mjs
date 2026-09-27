import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');
  await page.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 25000 });
  await page.waitForTimeout(3000);

  // Check what React fiber or localStorage or window contains
  const data = await page.evaluate(async () => {
    // Let's see what orders API returns for current user
    const ordersRes = await fetch('/api/orders?action=fetchAll');
    const ordersJson = await ordersRes.json();
    return {
      ordersCount: ordersJson.orders?.length,
      orders: ordersJson.orders?.map(o => ({
        id: o.id,
        title: o.title,
        status: o.status,
        client_name: o.client_name,
        clientName: o.clientName,
        price: o.price
      }))
    };
  });

  console.log('CLIENT ORDERS DATA:', JSON.stringify(data, null, 2));
  await browser.close();
}

test().catch(console.error);
