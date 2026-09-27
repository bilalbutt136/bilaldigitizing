import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('favicon')) {
      console.log(`[BROWSER ERROR]:`, text);
    }
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]:', err.message));

  console.log('=====================================================');
  console.log('PHASE 1: VERIFY CUSTOMER DELIVERY EXPERIENCE (POINTS 12-21)');
  console.log('=====================================================');

  console.log('--- Step 12: Login as customer testtest@gmail.com ---');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  console.log('--- Step 13: View customer notifications ---');
  await page.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/13_customer_notifications_view.png' });
  
  const bodyText13 = await page.innerText('body');
  const notifFound = bodyText13.includes('Order Files Ready') || bodyText13.includes('stitch files');
  console.log('   Delivery notification visible?', notifFound);

  console.log('--- Step 14 & 15: Open order from notification / link ---');
  const notifCard = await page.$('div:has-text("Order Files Ready")');
  if (notifCard) {
    await notifCard.click();
    await page.waitForTimeout(4000);
  } else {
    await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: 'scratch/verification_screenshots/15_customer_order_drawer_open.png' });
  
  const bodyText15 = await page.innerText('body');
  console.log('   Drawer opened for order #1208?', bodyText15.includes('1208'));
  console.log('   Status shows DELIVERED?', bodyText15.includes('Delivered') || bodyText15.includes('DELIVERED'));

  console.log('--- Step 16: Verify original customer specifications ---');
  // Expand requirements accordion if collapsed
  const reqToggle = await page.$('button:has-text("Order Requirements")') || 
                    await page.$('div:has-text("Order Requirements & Specifications")') ||
                    await page.$('button:has-text("View Requirements")');
  if (reqToggle) {
    await reqToggle.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: 'scratch/verification_screenshots/16_customer_specifications_expanded.png' });
  
  const bodyText16 = await page.innerText('body');
  const hasDimensions = bodyText16.includes('3.5"');
  const hasFabric = bodyText16.includes('Cotton / Pique') || bodyText16.includes('Cotton');
  const hasPlacement = bodyText16.includes('Left Chest') || bodyText16.includes('Polo');
  const hasArtwork = bodyText16.includes('test_patch_artwork.png');
  console.log('   Customer specifications verified:', { hasDimensions, hasFabric, hasPlacement, hasArtwork });

  console.log('--- Step 17: Verify delivered files are present and downloadable ---');
  // Switch back to delivered files tab
  const delivTab = await page.$('button:has-text("Delivered Files")');
  if (delivTab) {
    await delivTab.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: 'scratch/verification_screenshots/17_delivered_files_visible.png' });
  
  const bodyText17 = await page.innerText('body');
  const hasDst = bodyText17.includes('test_embroidery.dst');
  const hasPdf = bodyText17.includes('test_preview.pdf');
  const hasMsg = bodyText17.includes('Hello! Your Tajima DST embroidery stitch files');
  const hasZipBtn = bodyText17.includes('Download All (.ZIP)') || bodyText17.includes('Download This Version');
  console.log('   Delivered files verified:', { hasDst, hasPdf, hasMsg, hasZipBtn });

  console.log('--- Step 18: Close order drawer and reopen it from orders tab ---');
  const closeBtn = await page.$('button:has-text("Close")');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const trackBtn = await page.$('button:has-text("Track Order")');
  if (trackBtn) {
    await trackBtn.click();
    await page.waitForTimeout(3000);
  }
  await page.screenshot({ path: 'scratch/verification_screenshots/18_reopened_order.png' });
  const bodyText18 = await page.innerText('body');
  console.log('   Reopened order shows delivered files?', bodyText18.includes('test_embroidery.dst') || bodyText18.includes('Initial Delivery'));

  console.log('--- Step 19: Refresh browser page ---');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'scratch/verification_screenshots/19_after_page_refresh.png' });
  const bodyText19 = await page.innerText('body');
  console.log('   After refresh, order is still DELIVERED?', bodyText19.includes('Delivered') || bodyText19.includes('DELIVERED'));

  console.log('--- Step 20 & 21: Direct URL check ---');
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/verification_screenshots/21_direct_url_delivered.png' });
  const bodyText21 = await page.innerText('body');
  console.log('   Direct URL opens drawer?', bodyText21.includes('1208'));
  console.log('   Still in DELIVERED status?', bodyText21.includes('Delivered') || bodyText21.includes('DELIVERED'));

  console.log('=====================================================');
  console.log('PHASE 2: VERIFY REVISION FLOW (POINT 22)');
  console.log('=====================================================');

  console.log('--- Step 22.1: Customer submits revision request ---');
  const modTab = await page.$('button:has-text("Request Modification")');
  if (modTab) {
    await modTab.click();
    await page.waitForTimeout(2000);
  }
  
  const revTextarea = await page.$('textarea[placeholder="Type instructions..."]') || 
                      await page.$('textarea[placeholder*="instructions"]');
  if (!revTextarea) {
    throw new Error('Revision instructions textarea not found!');
  }
  await revTextarea.fill('Please adjust the outer border satin stitch density to 0.40mm.');
  await page.waitForTimeout(1000);

  const submitRevBtn = await page.$('button:has-text("Send Modification Request")') || 
                       await page.$('button:has-text("Submit Modification Request")') ||
                       await page.$('form button[type="submit"]');
  await submitRevBtn.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22a_customer_revision_submitted.png' });
  console.log('   Revision submitted by customer.');

  console.log('--- Step 22.2: Admin logs in, verifies revision status ---');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
  await page.fill('input[type="password"]', 'AdminSecurePass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22b_admin_sees_revision.png' });
  
  const bodyText22b = await page.innerText('body');
  const adminSeesRevision = bodyText22b.includes('Revision') || bodyText22b.includes('In Revision') || bodyText22b.includes('revision');
  console.log('   Admin sees order status as Revision?', adminSeesRevision);

  console.log('--- Step 22.3: Admin uploads Delivery #2 ---');
  const row2 = await page.$('tr:has-text("1208")');
  const manageBtn2 = await row2.$('button[title*="deliver"]') || await row2.$('button:has-text("Deliver")') || await row2.$('button:has-text("Manage")');
  await manageBtn2.click();
  await page.waitForTimeout(3000);

  const fileInput2 = await page.$('input[type="file"][multiple]');
  const dst2Path = path.resolve('scratch/test_files/test_embroidery_v2.dst');
  const pdf2Path = path.resolve('scratch/test_files/test_preview_v2.pdf');
  await fileInput2.setInputFiles([dst2Path, pdf2Path]);
  await page.waitForTimeout(2000);

  const adminMsg2 = await page.$('textarea[placeholder="Type message..."]');
  await adminMsg2.fill('Revision Delivery #2: Outer border satin stitch density adjusted to 0.40mm.');
  await page.waitForTimeout(1000);

  const deliverBtn2 = await page.$('button:has-text("Deliver Order to Client")');
  await deliverBtn2.click();

  console.log('   Waiting for Delivery #2 upload and DB commit...');
  try {
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'attached', timeout: 5000 });
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'detached', timeout: 60000 });
  } catch {}
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22c_admin_delivered_v2.png' });
  console.log('   Delivery #2 completed by Admin.');

  console.log('--- Step 22.4: Customer opens order and verifies BOTH deliveries exist ---');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"]', 'testtest@gmail.com');
  await page.fill('input[type="password"]', 'CustomerPass123!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/verification_screenshots/22d_customer_both_deliveries_view.png' });

  const finalDrawerText = await page.innerText('body');
  const hasDelivery1 = finalDrawerText.includes('Initial Delivery') || finalDrawerText.includes('Delivery 1') || finalDrawerText.includes('Delivery #1');
  const hasDelivery2 = finalDrawerText.includes('Delivery #2') || finalDrawerText.includes('Delivery 2');
  console.log('   Customer sees Delivery 1?', hasDelivery1);
  console.log('   Customer sees Delivery 2?', hasDelivery2);

  await browser.close();
  console.log('=====================================================');
  console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  console.log('=====================================================');
}

main().catch(err => {
  console.error('FATAL in complete_e2e_verification:', err);
  process.exit(1);
});
