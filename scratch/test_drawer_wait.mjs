import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('request', req => {
    if (req.url().includes('orders') || req.url().includes('supabase')) {
      console.log('REQ:', req.method(), req.url());
    }
  });
  page.on('response', resp => {
    if (resp.url().includes('orders') || resp.url().includes('supabase')) {
      console.log('RESP:', resp.status(), resp.url());
    }
  });

  console.log('1. Logging in...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');
  await page.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 25000 });
  await page.waitForTimeout(2000);

  console.log('2. Going to notifications...');
  await page.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('3. Clicking notification for #1208...');
  const notifItem = await page.$('div:has-text("Order Files Ready"):has-text("test_patch_artwork")') ||
                    await page.$('div:has-text("Order Files Ready")');
  if (!notifItem) throw new Error('Notif item not found');
  await notifItem.click();

  console.log('4. Waiting 5 seconds and checking drawer DOM and state...');
  await page.waitForTimeout(5000);

  const debugInfo = await page.evaluate(() => {
    const drawer = document.querySelector('.order-tracker-drawer');
    const backdrop = document.querySelector('.order-tracker-drawer-backdrop');
    return {
      hasDrawer: Boolean(drawer),
      drawerText: drawer ? drawer.innerText.slice(0, 300) : null,
      hasBackdrop: Boolean(backdrop)
    };
  });
  console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));

  await page.screenshot({ path: 'scratch/verification_screenshots/debug_drawer_state.png' });
  await browser.close();
}

test().catch(console.error);
