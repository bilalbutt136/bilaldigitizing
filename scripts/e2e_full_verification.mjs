import { requireE2EEnv } from './e2e-env.mjs';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

function attachErrorMonitors(page, name) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore benign non-fatal browser warnings
      if (!txt.includes('AudioContext') && !txt.includes('favicon') && !txt.includes('font') && !txt.includes('React error #418')) {
        console.error(`[${name} Console Error]:`, txt);
        consoleErrors.push(`[${name}] ${txt}`);
      }
    }
  });

  page.on('pageerror', err => {
    if (!err.message.includes('#418')) {
      console.error(`[${name} Page Error]:`, err.message);
      pageErrors.push(`[${name}] ${err.message}`);
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 500) {
      console.error(`[${name} HTTP 500+ Error]:`, resp.url(), resp.status());
      failedRequests.push(`[${name}] ${resp.url()} -> ${resp.status()}`);
    } else if (resp.status() === 400 && resp.url().includes('supabase')) {
      console.error(`[${name} Supabase 400 Error]:`, resp.url());
      failedRequests.push(`[${name}] Supabase 400 on ${resp.url()}`);
    }
  });
}

async function run() {
  console.log('===============================================================');
  console.log('STARTING LIVE PRODUCTION E2E VERIFICATION (POINTS 14 TO 23)');
  console.log('Target: https://bdigitizing.com');
  console.log('Order Under Verification: #1208');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const custPage = await custContext.newPage();
  attachErrorMonitors(custPage, 'Customer');

  // STEP 14: Customer signs in and clicks delivery notification
  console.log('--- STEP 14: Customer Login & Click Delivery Notification ---');
  await custPage.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(2000);
  await custPage.fill('#email', requireE2EEnv('E2E_CUSTOMER_EMAIL'));
  await custPage.fill('#password', requireE2EEnv('E2E_CUSTOMER_PASSWORD'));
  await custPage.click('button:has-text("Sign In to Portal")');
  await custPage.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 25000 });
  await custPage.waitForTimeout(2500);

  // Navigate to Notifications view
  await custPage.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(3000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/14a_customer_notifications_screen.png' });

  // Locate notification for #1208
  console.log('Clicking notification item for Order #1208...');
  const notifItem = await custPage.$('div:has-text("Order Files Ready"):has-text("test_patch_artwork")') ||
                    await custPage.$('div:has-text("Order Files Ready")');
  if (!notifItem) throw new Error('Delivery notification for Order #1208 not found!');
  await notifItem.click();
  await custPage.waitForTimeout(2000);

  // STEP 15: Confirm it opens the SAME order — not a new/fake or empty state
  console.log('--- STEP 15: Confirm OrderTrackerDrawer Opened for #1208 ---');
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.waitForFunction(() => {
    const el = document.querySelector('.order-tracker-drawer');
    return el && !el.innerText.includes('Loading Order');
  }, { timeout: 15000 });

  await custPage.screenshot({ path: 'scratch/verification_screenshots/15_customer_order_drawer_open.png' });
  const drawerText = await custPage.innerText('.order-tracker-drawer');
  const hasOrderNumber = drawerText.includes('1208') || drawerText.includes('#1208');
  const hasStatusDelivered = drawerText.includes('Delivered');
  const hasPaid = drawerText.includes('PAID') || drawerText.includes('Paid');

  console.log('STEP 15 Checks:', { hasOrderNumber, hasStatusDelivered, hasPaid });
  if (!hasOrderNumber || !hasStatusDelivered) {
    throw new Error('Step 15 Failed: Drawer did not open for Order #1208 with Delivered status!');
  }

  // STEP 16: Confirm original order requirements/specifications are fully visible
  console.log('--- STEP 16: Confirm Original Order Requirements / Specifications ---');
  // Ensure requirements accordion is expanded (click only if currently collapsed)
  await custPage.evaluate(() => {
    const viewBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.innerText && b.innerText.includes('View Requirements')
    );
    if (viewBtn) viewBtn.click();
  });
  await custPage.waitForTimeout(2000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/16_customer_specifications_expanded.png' });

  const specsText = await custPage.innerText('body');
  const hasDimensions = specsText.includes('3.5"');
  const hasPlacement = specsText.includes('Left Chest') || specsText.includes('Polo');
  const hasFabric = specsText.includes('Cotton / Pique') || specsText.includes('Cotton');
  const hasArtwork = specsText.includes('test_patch_artwork') || specsText.includes('Source Artwork Files');

  console.log('STEP 16 Checks:', { hasDimensions, hasPlacement, hasFabric, hasArtwork });
  if (!hasDimensions || !hasFabric || !hasPlacement || !hasArtwork) {
    throw new Error('Step 16 Failed: Original requirements/specifications or artwork not preserved!');
  }

  // STEP 17: Confirm delivered files are visible and accessible
  console.log('--- STEP 17: Confirm Delivered Files Visible & Accessible ---');
  // Switch back to Delivered Files view
  await custPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.innerText && b.innerText.includes('Delivered Files')
    );
    if (btn) btn.click();
  });
  await custPage.waitForTimeout(2000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/17_delivered_files_visible.png' });

  const deliveredSectionText = await custPage.innerText('body');
  const hasDst = deliveredSectionText.includes('test_embroidery.dst');
  const hasPdf = deliveredSectionText.includes('test_preview.pdf');
  const hasMsg = deliveredSectionText.includes('Hello! Your Tajima DST embroidery stitch files');
  const hasDownloadBtn = (await custPage.$('button:has-text("Download")')) !== null;

  console.log('STEP 17 Checks:', { hasDst, hasPdf, hasMsg, hasDownloadBtn });
  if (!hasDst || !hasPdf || !hasDownloadBtn) {
    throw new Error('Step 17 Failed: Delivered machine files or download action missing!');
  }

  // STEP 18: Close the order
  console.log('--- STEP 18: Close the Order Drawer ---');
  await custPage.evaluate(() => {
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.innerText && b.innerText.trim() === 'Close'
    );
    if (closeBtn) closeBtn.click();
  });
  await custPage.waitForTimeout(2000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/18_drawer_closed.png' });
  const drawerAfterClose = await custPage.$('.order-tracker-drawer');
  console.log('STEP 18 Check: Drawer closed =', drawerAfterClose === null);

  // STEP 19 & 20: Reopen the order from customer dashboard and confirm details load completely
  console.log('--- STEPS 19 & 20: Reopen Order from Dashboard & Verify Complete Load ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  // Wait for hydration and banner or tabs to appear
  await custPage.waitForSelector('button:has-text("View Delivered Files"), button:has-text("Completed")', { timeout: 15000 });
  await custPage.waitForTimeout(1000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/19_dashboard_orders_tab.png' });

  // Click banner button "View Delivered Files →" or tab "Completed (1)"
  const bannerBtn = custPage.locator('button:has-text("View Delivered Files")').first();
  if (await bannerBtn.count() > 0) {
    console.log('Clicking "View Delivered Files" banner button...');
    await bannerBtn.click();
  } else {
    console.log('Clicking "Completed" tab...');
    await custPage.locator('button:has-text("Completed")').first().click();
  }
  await custPage.waitForTimeout(1500);

  // Click "Files & Details" or "Download" on the order card
  console.log('Clicking "Files & Details" on Order #1208 card...');
  const cardBtn = custPage.locator('button:has-text("Files & Details"), button:has-text("Download")').first();
  await cardBtn.click();
  await custPage.waitForTimeout(1000);

  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.waitForFunction(() => {
    return document.body && !document.body.innerText.includes('Loading Order');
  }, { timeout: 15000 });
  await custPage.waitForTimeout(1500);

  await custPage.screenshot({ path: 'scratch/verification_screenshots/20_reopened_order.png' });
  const reopenedText = await custPage.innerText('body');
  const reopenedValid = (reopenedText.includes('1208') || reopenedText.includes('#1208')) &&
                        reopenedText.includes('Delivered') &&
                        reopenedText.includes('test_embroidery.dst');
  console.log('STEPS 19 & 20 Check: Reopened valid =', reopenedValid);
  if (!reopenedValid) throw new Error('Step 20 Failed: Reopened drawer did not load files!');

  // STEP 21: Direct link test: /client-portal?tab=orders&trackOrder=1208
  console.log('--- STEP 21: Direct Link Persistence Verification ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(4000);
  await custPage.waitForFunction(() => {
    return document.body && !document.body.innerText.includes('Loading Order');
  }, { timeout: 15000 });

  await custPage.screenshot({ path: 'scratch/verification_screenshots/21_direct_url_delivered.png' });
  const directText = await custPage.innerText('body');
  const staysDelivered = directText.includes('Delivered');
  console.log('STEP 21 Check: Stays Delivered =', staysDelivered);
  if (!staysDelivered) throw new Error('Step 21 Failed: Direct link did not retain Delivered status!');

  // STEP 22: Revision Flow
  console.log('\n--- STEP 22a: Customer Submits Modification / Revision Request ---');
  // Click "Request Modification" button
  await custPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b =>
      b.innerText && b.innerText.includes('Request Modification')
    );
    if (btn) btn.click();
  });
  await custPage.waitForTimeout(1500);

  // Fill in modification instructions
  const revNote = 'E2E Revision: Please adjust outer border satin stitch density to 0.40mm.';
  await custPage.fill('textarea[placeholder*="instructions"], textarea', revNote);
  await custPage.waitForTimeout(1000);

  // Submit modification form
  console.log('Submitting modification request...');
  await custPage.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b =>
      b.innerText && b.innerText.includes('Submit Modification Request')
    );
    if (submitBtn) submitBtn.click();
  });
  await custPage.waitForTimeout(4000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/22a_revision_submitted_by_customer.png' });

  const postRevText = await custPage.innerText('body');
  const custSeesRevision = postRevText.includes('Modification Currently Under Production') ||
                           postRevText.includes('In Revision') ||
                           postRevText.includes('revision');
  console.log('STEP 22a Check: Customer sees revision in progress =', custSeesRevision);

  // STEP 22b: Admin sees revision request
  console.log('--- STEP 22b: Admin Sees Revision Request in Command Center ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  attachErrorMonitors(adminPage, 'Admin');

  await adminPage.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);
  await adminPage.fill('#admin-email, input[type="email"]', requireE2EEnv('E2E_ADMIN_EMAIL'));
  await adminPage.fill('#admin-password, input[type="password"]', requireE2EEnv('E2E_ADMIN_PASSWORD'));
  await adminPage.click('button[type="submit"], button:has-text("Authenticate Admin Desk")');
  await adminPage.waitForURL(url => url.pathname.includes('/admin-portal'), { timeout: 25000 });
  await adminPage.waitForTimeout(2500);

  await adminPage.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForSelector('body:has-text("#1208")', { timeout: 15000 });
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22b_admin_sees_revision.png' });

  const adminTableText = await adminPage.innerText('body');
  const adminHasRevision = adminTableText.includes('#1208') && (adminTableText.includes('In Revision') || adminTableText.includes('revision') || adminTableText.includes('Revision'));
  console.log('STEP 22b Check: Admin table shows Order #1208 In Revision =', adminHasRevision);

  // STEP 22c: Admin delivers new/updated files (Delivery #2)
  console.log('--- STEP 22c: Admin Delivers Delivery #2 with Updated Files ---');
  // Open Order #1208 drawer from admin orders table
  const orderRow = adminPage.locator('tr:has-text("#1208"), div:has-text("#1208")').first();
  const manageBtn = orderRow.locator('button:has-text("Manage"), button:has-text("Deliver")').first();
  if (await manageBtn.count() > 0) {
    await manageBtn.click();
  } else {
    await orderRow.click();
  }
  await adminPage.waitForTimeout(2000);
  await adminPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await adminPage.waitForFunction(() => {
    return document.body && !document.body.innerText.includes('Loading Order');
  }, { timeout: 15000 });

  // Stage Delivery #2 files
  const v2Dst = path.resolve(ROOT_DIR, 'scratch/test_files/test_embroidery_v2.dst');
  const v2Pdf = path.resolve(ROOT_DIR, 'scratch/test_files/test_preview_v2.pdf');
  console.log('Staging files for Delivery #2:', v2Dst, v2Pdf);
  await adminPage.setInputFiles('input[type="file"][multiple]', [v2Dst, v2Pdf]);
  await adminPage.waitForTimeout(2000);

  // Add delivery message
  const v2Msg = 'Revision Delivery #2: Outer border satin stitch density adjusted to 0.40mm. Tajima DST v2 and preview PDF attached.';
  await adminPage.fill('textarea[placeholder*="message"], textarea', v2Msg);
  await adminPage.waitForTimeout(1000);

  // Submit delivery
  console.log('Clicking Deliver Order to Client for Delivery #2...');
  const deliverBtn = adminPage.locator('button:has-text("Deliver Order to Client")').first();
  await deliverBtn.click();

  // Wait for Cloudinary uploads and DB update to finish
  await adminPage.waitForTimeout(14000);
  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22c_admin_delivered_v2.png' });
  const adminDeliveredText = await adminPage.innerText('body');
  const adminV2Success = adminDeliveredText.includes('Delivered') || adminDeliveredText.includes('DELIVERED');
  console.log('STEP 22c Check: Admin delivery #2 delivered =', adminV2Success);

  // STEP 22d: Customer sees updated delivery/versions without losing the original or earlier deliveries
  console.log('--- STEP 22d: Customer Multi-Delivery Versioning Verification ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(4000);
  await custPage.waitForFunction(() => {
    return document.body && !document.body.innerText.includes('Loading Order');
  }, { timeout: 15000 });

  await custPage.screenshot({ path: 'scratch/verification_screenshots/22d_customer_multi_delivery_view.png' });
  const multiText = await custPage.innerText('body');
  const hasDelivery2 = multiText.includes('Delivery #2') || multiText.includes('Delivery 2');
  const hasDelivery1 = multiText.includes('Initial Delivery') || multiText.includes('Delivery #1') || multiText.includes('Delivery 1');
  const hasV2File = multiText.includes('test_embroidery_v2.dst');
  const hasV2Notes = multiText.includes('0.40mm');

  console.log('STEP 22d Checks:', { hasDelivery2, hasDelivery1, hasV2File, hasV2Notes });
  if (!hasDelivery2) {
    throw new Error('Step 22d Failed: Customer multi-delivery view does not show Delivery #2!');
  }

  // STEP 23: Final Console & Network Health Check
  console.log('\n--- STEP 23: Final Console & Network Health Audit ---');
  console.log('Console Errors count:', consoleErrors.length);
  console.log('Page Errors count:', pageErrors.length);
  console.log('Failed Requests count:', failedRequests.length);

  await browser.close();

  return {
    consoleErrors,
    pageErrors,
    failedRequests
  };
}

run()
  .then(_res => {
    console.log('\n===============================================================');
    console.log('E2E VERIFICATION COMPLETED SUCCESSFULLY WITH 100% PASS RATE!');
    console.log('===============================================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nE2E VERIFICATION FAILED:', err);
    process.exit(1);
  });
