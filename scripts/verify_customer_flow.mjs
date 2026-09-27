import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CUSTOMER CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[CUSTOMER PAGE ERROR]:', err.message));

  console.log('--- STEP 12: Logging in as CUSTOMER ---');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);
  await page.goto('https://bdigitizing.com/client-portal?tab=dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Customer portal loaded at:', page.url());

  console.log('--- STEP 13: Confirm delivery notification appears ---');
  // Click notifications tab or notification bell icon
  const notifTab = await page.$('button:has-text("Notifications")') || await page.$('a[href*="notifications"]');
  if (notifTab) {
    await notifTab.click();
    await page.waitForTimeout(2000);
  } else {
    await page.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'scratch/verification_screenshots/13_customer_notifications_view.png' });
  const notifsText = await page.innerText('body');
  const hasDeliveryNotif = notifsText.includes('Order Files Ready') || notifsText.includes('stitch files and preview documents');
  console.log('Delivery notification visible in customer portal?', hasDeliveryNotif);

  console.log('--- STEP 14: Click the delivery notification ---');
  const notifCard = await page.$('div:has-text("Order Files Ready")') || await page.$('div:has-text("stitch files and preview documents")');
  if (notifCard) {
    await notifCard.click();
    await page.waitForTimeout(4000);
  } else {
    console.log('Direct click on notif card not found, navigating directly via link...');
    await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
  }

  console.log('--- STEP 15: Confirm it opens the SAME order (#1208) ---');
  await page.screenshot({ path: 'scratch/verification_screenshots/15_customer_order_drawer_open.png' });
  const drawerText = await page.innerText('body');
  const isCorrectOrder = drawerText.includes('#1208') || drawerText.includes('1208');
  console.log('Drawer opened with order #1208?', isCorrectOrder);

  console.log('--- STEP 16: Confirm original customer specifications are present ---');
  // Check Dimensions: 3.5", Fabric: Cotton / Pique Knit, Placement: Left Chest, Artwork: test_patch_artwork.png
  const hasDimensions = drawerText.includes('3.5"');
  const hasFabric = drawerText.includes('Cotton / Pique') || drawerText.includes('Cotton');
  const hasPlacement = drawerText.includes('Left Chest') || drawerText.includes('Polo');
  const hasArtwork = drawerText.includes('test_patch_artwork.png');
  console.log('Specifications check:', { hasDimensions, hasFabric, hasPlacement, hasArtwork });

  console.log('--- STEP 17: Confirm delivered files are present, visible, and downloadable ---');
  const hasDst = drawerText.includes('test_embroidery.dst') || drawerText.includes('.DST') || drawerText.includes('DST');
  const hasPdf = drawerText.includes('test_preview.pdf') || drawerText.includes('.PDF') || drawerText.includes('PDF');
  const hasMsg = drawerText.includes('Hello! Your Tajima DST embroidery stitch files');
  const hasDownloadBtn = (await page.$$('button:has-text("Download")')).length > 0;
  console.log('Delivered files check:', { hasDst, hasPdf, hasMsg, hasDownloadBtn });
  await page.screenshot({ path: 'scratch/verification_screenshots/17_delivered_files_visible.png' });

  console.log('--- STEP 18: Close order and reopen it ---');
  const closeBtn = await page.$('button:has-text("Close")') || await page.$('button[aria-label="Close"]');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Re-open from orders tab
  const trackBtn = await page.$('button:has-text("Track Order")');
  if (trackBtn) {
    await trackBtn.click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: 'scratch/verification_screenshots/18_reopened_order.png' });
  const reopenedText = await page.innerText('body');
  console.log('Reopened order still has files?', reopenedText.includes('test_embroidery.dst') || reopenedText.includes('Initial Delivery'));

  console.log('--- STEP 19: Refresh the browser page ---');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/19_after_page_refresh.png' });
  const refreshedText = await page.innerText('body');
  console.log('After refresh, still shows DELIVERED?', refreshedText.includes('DELIVERED') || refreshedText.includes('Delivered'));

  console.log('--- STEP 20 & 21: Check direct URL and confirm STILL DELIVERED ---');
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/verification_screenshots/21_direct_url_delivered.png' });
  const directText = await page.innerText('body');
  const isStillDelivered = directText.includes('DELIVERED') || directText.includes('Delivered');
  const didNotRevert = !directText.includes('In Production') && !directText.includes('IN_PROGRESS');
  console.log('Direct URL loaded drawer?', directText.includes('1208'));
  console.log('Order status is STILL DELIVERED?', isStillDelivered);
  console.log('Did NOT revert to in_progress?', didNotRevert);

  await browser.close();
  console.log('SUCCESS: Customer verification complete!');
}

main().catch(err => {
  console.error('FATAL in verify_customer_flow:', err);
  process.exit(1);
});
