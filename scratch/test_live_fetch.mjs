import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('LOG [' + msg.type() + ']:', msg.text()));

  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');
  await page.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 25000 });
  await page.waitForTimeout(2000);

  // Directly call fetchOrderById inside page context to see what it returns!
  const evalResult = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/orders?action=fetchOne&orderId=1208');
      const data = await res.json();
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  console.log('EVAL RESULT:', evalResult.ok, evalResult.data ? Object.keys(evalResult.data) : evalResult.error);

  console.log('Going to notifications...');
  await page.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Clicking notification item...');
  const notifItem = await page.$('div:has-text("Order Files Ready"):has-text("test_patch_artwork")') ||
                    await page.$('div:has-text("Order Files Ready")');
  await notifItem.click();

  // Poll drawer text every 1 second for 15 seconds
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(1000);
    const text = await page.evaluate(() => {
      const d = document.querySelector('.order-tracker-drawer');
      return d ? d.innerText.replace(/\n+/g, ' ').slice(0, 120) : 'NO DRAWER';
    });
    console.log(`Second ${i}: ${text}`);
    if (text && !text.includes('Loading Order') && text !== 'NO DRAWER') {
      console.log('DRAWER LOADED at second', i);
      break;
    }
  }

  await page.screenshot({ path: 'scratch/verification_screenshots/poll_drawer_result.png' });
  await browser.close();
}

test().catch(console.error);
