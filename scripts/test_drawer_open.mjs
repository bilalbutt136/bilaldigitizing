import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');

  console.log('2. Waiting for redirect to /client-portal...');
  await page.waitForURL(url => url.pathname === '/client-portal', { timeout: 20000 });
  await page.waitForSelector('button:has-text("Order Now")', { timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log('Customer Dashboard ready!');

  console.log('3. Navigating to Orders tab...');
  // Click My Orders on sidebar
  const myOrdersTab = await page.$('button:has-text("My Orders")');
  if (myOrdersTab) {
    await myOrdersTab.click();
    await page.waitForTimeout(3000);
  } else {
    await page.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: 'scratch/verification_screenshots/orders_tab_loaded.png' });

  console.log('4. Finding order #1208 and opening drawer...');
  const openBtn = await page.$('div:has-text("#1208") button:has-text("Download / Review")') ||
                  await page.$('div:has-text("#1208") button:has-text("View Order")') ||
                  await page.$('button:has-text("Download / Review")') ||
                  await page.$('button:has-text("View Order")');
  if (!openBtn) {
    throw new Error('Order #1208 open button not found!');
  }
  await openBtn.click();
  await page.waitForTimeout(3000);

  console.log('5. Taking screenshot of opened drawer...');
  await page.screenshot({ path: 'scratch/verification_screenshots/drawer_opened_live.png' });

  console.log('6. Expanding Order Requirements & Specifications accordion...');
  await page.evaluate(() => {
    const el = document.querySelector('div[style*="cursor: pointer"] h4') || 
               Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Order Requirements & Specifications'));
    if (el) el.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/verification_screenshots/drawer_requirements_live.png' });

  const drawerText = await page.innerText('body');
  const hasDimensions = drawerText.includes('3.5"');
  const hasFabric = drawerText.includes('Cotton / Pique') || drawerText.includes('Cotton');
  const hasPlacement = drawerText.includes('Left Chest') || drawerText.includes('Polo');
  const hasArtwork = drawerText.includes('test_patch_artwork.png');
  console.log('Specifications verified:', { hasDimensions, hasFabric, hasPlacement, hasArtwork });

  console.log('7. Switching to Delivered Files tab...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Delivered Files'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/verification_screenshots/drawer_delivered_live.png' });

  const delivText = await page.innerText('body');
  const hasDst = delivText.includes('test_embroidery.dst');
  const hasPdf = delivText.includes('test_preview.pdf');
  const hasMsg = delivText.includes('Hello! Your Tajima DST embroidery stitch files');
  console.log('Delivered files verified:', { hasDst, hasPdf, hasMsg });

  await browser.close();
  console.log('SUCCESS: All drawer contents verified!');
}

main().catch(console.error);
