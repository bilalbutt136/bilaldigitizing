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
  await page.waitForTimeout(2000);

  const testResult = await page.evaluate(async () => {
    const res = await fetch('/api/orders?action=fetchOne&orderId=1208');
    const json = await res.json();
    const ord = json.order;
    
    // Check if ord has everything
    return {
      id: ord.id,
      title: ord.title,
      status: ord.status,
      client_name: ord.client_name,
      clientName: ord.clientName,
      price: ord.price,
      deliveries: ord.deliveries,
      notes: typeof ord.notes,
      keys: Object.keys(ord)
    };
  });

  console.log('API FETCH ONE RESULT:', JSON.stringify(testResult, null, 2));
  await browser.close();
}

test().catch(console.error);
