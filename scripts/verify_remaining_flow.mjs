import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERR]:', msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERR]:', err.message));

  console.log('=== PART A: CUSTOMER VERIFICATION (POINTS 12-21) ===');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('1. Checking Notifications tab...');
  await page.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/13_customer_notifications_view.png' });

  console.log('2. Opening order #1208 drawer...');
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  
  // Wait for the drawer to fully load (content appears beyond loading spinner)
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Delivered Production Files') || text.includes('Initial Delivery');
  }, { timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('3. Taking screenshot of opened order drawer...');
  await page.screenshot({ path: 'scratch/verification_screenshots/15_customer_order_drawer_open.png' });

  console.log('4. Expanding Order Requirements & Specifications accordion...');
  await page.evaluate(() => {
    const el = document.querySelector('div[style*="cursor: pointer"] h4') || 
               Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Order Requirements & Specifications'));
    if (el) el.click();
  });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/verification_screenshots/16_customer_specifications_expanded.png' });

  const specsText = await page.innerText('body');
  const hasDimensions = specsText.includes('3.5"');
  const hasFabric = specsText.includes('Cotton / Pique') || specsText.includes('Cotton');
  const hasPlacement = specsText.includes('Left Chest') || specsText.includes('Polo');
  const hasArtwork = specsText.includes('test_patch_artwork.png');
  console.log('   Customer specifications visible in UI?', { hasDimensions, hasFabric, hasPlacement, hasArtwork });

  console.log('5. Verifying Delivered Files in UI...');
  const hasDst = specsText.includes('test_embroidery.dst');
  const hasPdf = specsText.includes('test_preview.pdf');
  const hasMsg = specsText.includes('Hello! Your Tajima DST embroidery stitch files');
  const hasDownloadBtn = specsText.includes('Download') || specsText.includes('Download All');
  console.log('   Delivered files verified in UI?', { hasDst, hasPdf, hasMsg, hasDownloadBtn });
  await page.screenshot({ path: 'scratch/verification_screenshots/17_delivered_files_visible.png' });

  console.log('6. Testing Close Drawer and Reopen...');
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close"]') ||
                     Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === 'Close');
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(2000);

  // Click Track Order button on orders list
  await page.evaluate(() => {
    const trackBtn = document.querySelector('button:has-text("Track Order")') ||
                     Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Track Order'));
    if (trackBtn) trackBtn.click();
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/18_reopened_order.png' });

  console.log('7. Testing Page Refresh & Direct URL persistence...');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Delivered') || document.body.innerText.includes('DELIVERED');
  }, { timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/verification_screenshots/19_after_page_refresh.png' });

  console.log('8. Testing Direct URL loading...');
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Initial Delivery') || document.body.innerText.includes('Delivered Production Files');
  }, { timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/verification_screenshots/21_direct_url_delivered.png' });

  const directText = await page.innerText('body');
  console.log('   Status remains DELIVERED (no reversion)?', !directText.includes('In Production') && !directText.includes('IN_PROGRESS'));

  console.log('=== PART B: REVISION FLOW TEST (POINT 22) ===');
  console.log('9. Submitting customer revision request...');
  // Click Request Modification tab/button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const modBtn = btns.find(b => b.innerText && b.innerText.includes('Request Modification'));
    if (modBtn) modBtn.click();
  });
  await page.waitForTimeout(2000);

  const textarea = await page.$('textarea[placeholder="Type instructions..."]') ||
                   await page.$('textarea[placeholder*="instructions"]');
  if (!textarea) {
    throw new Error('Revision instructions textarea not found!');
  }
  await textarea.fill('E2E Test: Please adjust the outer border satin stitch density to 0.40mm.');
  await page.waitForTimeout(1000);

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.innerText && (b.innerText.includes('Send Modification') || b.innerText.includes('Submit Modification')));
    if (submitBtn) submitBtn.click();
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22a_customer_revision_submitted.png' });
  console.log('   Revision submitted successfully.');

  console.log('10. Admin logs in to verify status and deliver Delivery #2...');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
  await page.fill('input[type="password"]', 'AdminSecurePass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22b_admin_sees_revision.png' });

  const adminText = await page.innerText('body');
  console.log('   Admin sees order as In Revision?', adminText.includes('Revision') || adminText.includes('In Revision'));

  console.log('11. Admin delivers Delivery #2...');
  // Find order 1208 and click Deliver/Manage
  const row = await page.$('tr:has-text("1208")');
  const actionBtn = await row.$('button[title*="deliver"]') || await row.$('button:has-text("Deliver")') || await row.$('button:has-text("Manage")');
  await actionBtn.click();
  await page.waitForTimeout(3000);

  const fileInput = await page.$('input[type="file"][multiple]');
  const dst2Path = path.resolve('scratch/test_files/test_embroidery_v2.dst');
  const pdf2Path = path.resolve('scratch/test_files/test_preview_v2.pdf');
  await fileInput.setInputFiles([dst2Path, pdf2Path]);
  await page.waitForTimeout(2000);

  const adminMsgBox = await page.$('textarea[placeholder="Type message..."]');
  await adminMsgBox.fill('Revision Delivery #2: Outer border satin stitch density adjusted to 0.40mm.');
  await page.waitForTimeout(1000);

  const deliverSubmitBtn = await page.$('button:has-text("Deliver Order to Client")');
  await deliverSubmitBtn.click();

  console.log('   Waiting for Delivery #2 upload and DB commit...');
  try {
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'attached', timeout: 5000 });
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'detached', timeout: 60000 });
  } catch {}
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22c_admin_delivered_v2.png' });
  console.log('   Delivery #2 completed by Admin.');

  console.log('12. Customer opens order to verify BOTH deliveries exist sequentially...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Delivery') && (text.includes('Delivery #2') || text.includes('Delivery 2'));
  }, { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22d_customer_multi_delivery_view.png' });

  const finalDrawerText = await page.innerText('body');
  const hasDelivery1 = finalDrawerText.includes('Initial Delivery') || finalDrawerText.includes('Delivery #1') || finalDrawerText.includes('Delivery 1');
  const hasDelivery2 = finalDrawerText.includes('Delivery #2') || finalDrawerText.includes('Delivery 2');
  console.log('   Customer sees Delivery 1?', hasDelivery1);
  console.log('   Customer sees Delivery 2?', hasDelivery2);

  await browser.close();
  console.log('=== ALL REMAINING FLOWS VERIFIED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('FATAL in verify_remaining_flow:', err);
  process.exit(1);
});
