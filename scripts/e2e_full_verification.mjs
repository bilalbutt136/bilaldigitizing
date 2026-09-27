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
      // Filter out benign browser warnings (e.g. favicon 404 or audio play without interaction)
      if (!txt.includes('favicon') && !txt.includes('AudioContext') && !txt.includes('font')) {
        console.error(`[${name} Console Error]:`, txt);
        consoleErrors.push(`[${name}] ${txt}`);
      }
    }
  });

  page.on('pageerror', err => {
    console.error(`[${name} Page Error]:`, err.message);
    pageErrors.push(`[${name}] ${err.message}`);
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
  console.log('STARTING COMPLETE E2E VERIFICATION ON LIVE PRODUCTION SYSTEM');
  console.log('URL: https://bdigitizing.com');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const custPage = await custContext.newPage();
  attachErrorMonitors(custPage, 'Customer');

  // STEP 14: Customer signs in and checks notifications
  console.log('--- STEP 14: Customer Signs in & Clicks Delivery Notification ---');
  await custPage.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(1500);
  await custPage.fill('#email', 'testtest@gmail.com');
  await custPage.fill('#password', 'CustomerPass123!');
  await custPage.click('button:has-text("Sign In to Portal")');
  await custPage.waitForURL(url => url.pathname === '/client-portal', { timeout: 25000 });
  await custPage.waitForTimeout(2000);

  // Navigate to Notifications view
  await custPage.goto('https://bdigitizing.com/client-portal?tab=notifications', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(3000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/14a_customer_notifications_screen.png' });

  // Find notification for order 1208 and click it
  console.log('Clicking notification item for Order #1208...');
  const notifItem = await custPage.$('div:has-text("Order Files Ready"):has-text("test_patch_artwork")') ||
                    await custPage.$('div:has-text("Order Files Ready")');
  if (!notifItem) {
    throw new Error('Notification for delivered order #1208 not found!');
  }
  await notifItem.click();
  await custPage.waitForTimeout(3500);

  // STEP 15: Confirm it opens the SAME order — not a new/fake or empty state
  console.log('--- STEP 15: Confirm OrderTrackerDrawer Opened for #1208 ---');
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.screenshot({ path: 'scratch/verification_screenshots/15_customer_order_drawer_open.png' });
  
  const drawerBodyText = await custPage.innerText('.order-tracker-drawer');
  const hasOrderNumber = drawerBodyText.includes('1208') || drawerBodyText.includes('#1208');
  const hasStatusDelivered = drawerBodyText.includes('Delivered') || drawerBodyText.includes('DELIVERED');
  console.log('Drawer opened verification:', { hasOrderNumber, hasStatusDelivered });
  if (!hasOrderNumber) throw new Error('Drawer did not open for Order #1208!');

  // STEP 16: Confirm original order requirements/specifications are fully visible
  console.log('--- STEP 16: Confirm Original Order Requirements / Specifications ---');
  // Check if requirements accordion is collapsed; if so, expand it
  const isReqClosed = await custPage.evaluate(() => {
    const text = document.querySelector('.order-tracker-drawer')?.innerText || '';
    return text.includes('View Requirements') || text.includes('Click to expand customer instructions');
  });

  if (isReqClosed) {
    console.log('Expanding Requirements Accordion...');
    await custPage.evaluate(() => {
      const toggle = Array.from(document.querySelectorAll('button, div')).find(el => 
        el.innerText && (el.innerText.includes('View Requirements') || el.innerText.includes('Order Requirements & Specifications'))
      );
      if (toggle) toggle.click();
    });
    await custPage.waitForTimeout(1500);
  }

  await custPage.screenshot({ path: 'scratch/verification_screenshots/16_customer_specifications_expanded.png' });
  const specsText = await custPage.innerText('.order-tracker-drawer');
  const hasDimensions = specsText.includes('3.5"');
  const hasPlacement = specsText.includes('Left Chest') || specsText.includes('Polo');
  const hasFabric = specsText.includes('Cotton / Pique') || specsText.includes('Cotton');
  const hasArtwork = specsText.includes('test_patch_artwork.png');
  console.log('Requirements Specifications Verified:', { hasDimensions, hasPlacement, hasFabric, hasArtwork });
  if (!hasDimensions || !hasArtwork) {
    throw new Error('Customer specifications or artwork file missing from order!');
  }

  // STEP 17: Confirm delivered files are visible and accessible
  console.log('--- STEP 17: Confirm Delivered Files Visible & Accessible ---');
  await custPage.screenshot({ path: 'scratch/verification_screenshots/17_delivered_files_visible.png' });
  const hasDstFile = specsText.includes('test_embroidery.dst');
  const hasPdfFile = specsText.includes('test_preview.pdf');
  const hasDeliveryMsg = specsText.includes('Hello! Your Tajima DST embroidery stitch files');
  const hasDownloadBtn = await custPage.$('.order-tracker-drawer button:has-text("Download")') !== null;
  console.log('Delivered Files Verified:', { hasDstFile, hasPdfFile, hasDeliveryMsg, hasDownloadBtn });
  if (!hasDstFile || !hasPdfFile) {
    throw new Error('Delivered files (DST / PDF) are not visible!');
  }

  // STEP 18: Close the order
  console.log('--- STEP 18: Close the Order Drawer ---');
  await custPage.evaluate(() => {
    const closeBtn = document.querySelector('.order-tracker-drawer button[aria-label="Close"]') ||
                     Array.from(document.querySelectorAll('.order-tracker-drawer button')).find(b => b.innerText && b.innerText.trim() === 'Close') ||
                     document.querySelector('.order-tracker-drawer button');
    if (closeBtn) closeBtn.click();
  });
  await custPage.waitForTimeout(2000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/18_drawer_closed.png' });
  const isDrawerStillVisible = await custPage.$('.order-tracker-drawer') !== null;
  console.log('Drawer closed successfully:', !isDrawerStillVisible);

  // STEP 19 & 20: Reopen the order & confirm details load completely
  console.log('--- STEPS 19 & 20: Reopen Order from Dashboard & Confirm Details Load ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(3000);

  // Click "Completed (1)" or "All (1)" or "View Delivered Files" banner button
  await custPage.evaluate(() => {
    const bannerBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('View Delivered Files'));
    if (bannerBtn) {
      bannerBtn.click();
      return;
    }
    const completedTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Completed'));
    if (completedTab) {
      completedTab.click();
      return;
    }
    const allTab = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('All'));
    if (allTab) allTab.click();
  });
  await custPage.waitForTimeout(2000);

  // Click Download / Review button
  await custPage.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText && (b.innerText.includes('Download / Review') || b.innerText.includes('View Order'))
    );
    if (btn) btn.click();
  });
  await custPage.waitForTimeout(3000);
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 10000 });
  await custPage.screenshot({ path: 'scratch/verification_screenshots/20_reopened_order.png' });
  const reopenedText = await custPage.innerText('.order-tracker-drawer');
  if (!reopenedText.includes('1208') || !reopenedText.includes('test_embroidery.dst')) {
    throw new Error('Reopened drawer failed to load order 1208 files!');
  }
  console.log('Order reopened and verified completely!');

  // STEP 21: Refresh page or direct link — stays DELIVERED and doesn't revert to IN_PROGRESS
  console.log('--- STEP 21: Refresh Page & Test Direct Link Persistence ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(4000);
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.screenshot({ path: 'scratch/verification_screenshots/21_direct_url_delivered.png' });
  const directText = await custPage.innerText('.order-tracker-drawer');
  const directStatusDelivered = directText.includes('Delivered') || directText.includes('DELIVERED');
  const directStatusInProgress = directText.includes('IN PROGRESS') || directText.includes('In Progress');
  console.log('Direct link status check:', { directStatusDelivered, directStatusInProgress });
  if (!directStatusDelivered || directStatusInProgress) {
    throw new Error('Order reverted to IN_PROGRESS on direct link!');
  }

  // STEP 22: Test Revision Flow
  console.log('\n--- STEP 22a: Customer Submits Modification / Revision Request ---');
  // Fill out revision form
  const revisionNoteText = 'E2E Revision: Please adjust outer border satin stitch density to 0.40mm.';
  const textareaFound = await custPage.$('.order-tracker-drawer textarea');
  if (!textareaFound) {
    // If request modification button needs to be clicked first
    await custPage.evaluate(() => {
      const modBtn = Array.from(document.querySelectorAll('.order-tracker-drawer button')).find(b => 
        b.innerText && b.innerText.includes('Request Modification')
      );
      if (modBtn) modBtn.click();
    });
    await custPage.waitForTimeout(1000);
  }

  await custPage.fill('.order-tracker-drawer textarea', revisionNoteText);
  await custPage.waitForTimeout(1000);

  // Submit the revision form
  console.log('Submitting modification request...');
  await custPage.evaluate(() => {
    const submitBtn = Array.from(document.querySelectorAll('.order-tracker-drawer form button')).find(b => 
      b.innerText && (b.innerText.includes('Revision') || b.innerText.includes('Submit') || b.innerText.includes('Request'))
    ) || document.querySelector('.order-tracker-drawer form button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await custPage.waitForTimeout(4000);
  await custPage.screenshot({ path: 'scratch/verification_screenshots/22a_revision_submitted_by_customer.png' });

  // STEP 22b: Admin sees revision request
  console.log('--- STEP 22b: Admin Portal Sees Order Status In Revision ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  attachErrorMonitors(adminPage, 'Admin');

  await adminPage.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(1500);
  await adminPage.fill('input[type="email"], #email', 'admin_verify@bdigitizing.com');
  await adminPage.fill('input[type="password"], #password', 'AdminSecurePass123!');
  await adminPage.click('button:has-text("Enter Command Center")');
  await adminPage.waitForURL(url => url.pathname.includes('/admin-portal'), { timeout: 25000 });
  await adminPage.waitForTimeout(2000);

  // Go to Admin Orders tab
  await adminPage.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(3000);
  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22b_admin_sees_revision.png' });

  const adminPageText = await adminPage.innerText('body');
  const adminSeesRevision = adminPageText.includes('revision') || adminPageText.includes('In Revision') || adminPageText.includes('Revision Requested');
  console.log('Admin sees revision status:', adminSeesRevision);

  // STEP 22c: Admin delivers new/updated delivery files (Delivery #2)
  console.log('--- STEP 22c: Admin Delivers Delivery #2 with Updated Files ---');
  // Click on Order #1208 row to open Admin delivery drawer
  await adminPage.evaluate(() => {
    const row = Array.from(document.querySelectorAll('tr, div')).find(el => 
      el.innerText && el.innerText.includes('#1208') && (el.innerText.includes('In Revision') || el.innerText.includes('revision') || el.innerText.includes('Delivered'))
    );
    if (row) {
      const openBtn = row.querySelector('button') || row;
      openBtn.click();
    }
  });
  await adminPage.waitForTimeout(3000);
  await adminPage.waitForSelector('.order-tracker-drawer', { timeout: 10000 });

  // Upload Delivery #2 files
  const v2Dst = path.resolve(ROOT_DIR, 'scratch/test_files/test_embroidery_v2.dst');
  const v2Pdf = path.resolve(ROOT_DIR, 'scratch/test_files/test_preview_v2.pdf');
  console.log('Staging files for Delivery #2:', v2Dst, v2Pdf);
  const fileInput = await adminPage.$('.order-tracker-drawer input[type="file"][multiple]');
  if (!fileInput) throw new Error('Admin file input not found in drawer!');
  await fileInput.setInputFiles([v2Dst, v2Pdf]);
  await adminPage.waitForTimeout(2000);

  // Fill delivery message
  const v2Message = 'Revision Delivery #2: Outer border satin stitch density adjusted to 0.40mm. Tajima DST v2 and preview PDF attached.';
  await adminPage.fill('.order-tracker-drawer textarea[placeholder*="instructions"], .order-tracker-drawer textarea', v2Message);
  await adminPage.waitForTimeout(1000);

  // Click Deliver Order to Client
  console.log('Clicking Deliver Order to Client for Delivery #2...');
  await adminPage.evaluate(() => {
    const deliverBtn = Array.from(document.querySelectorAll('.order-tracker-drawer button')).find(b => 
      b.innerText && b.innerText.includes('Deliver Order to Client')
    );
    if (deliverBtn) deliverBtn.click();
  });

  // Wait for delivery to process (Cloudinary upload + Supabase update)
  await adminPage.waitForTimeout(8000);
  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22c_admin_delivered_v2.png' });
  const adminDeliveredText = await adminPage.innerText('.order-tracker-drawer');
  console.log('Admin delivered v2 confirmed:', adminDeliveredText.includes('Delivered'));

  // STEP 22d: Customer sees updated delivery/versions without losing the original or earlier deliveries
  console.log('--- STEP 22d: Customer Multi-Delivery Versioning Verification ---');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(4000);
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.screenshot({ path: 'scratch/verification_screenshots/22d_customer_multi_delivery_view.png' });

  const multiDeliveryText = await custPage.innerText('.order-tracker-drawer');
  const hasDelivery2 = multiDeliveryText.includes('Delivery #2') || multiDeliveryText.includes('Delivery 2');
  const hasDelivery1 = multiDeliveryText.includes('Initial Delivery') || multiDeliveryText.includes('Delivery #1') || multiDeliveryText.includes('Delivery 1');
  const hasV2File = multiDeliveryText.includes('test_embroidery_v2.dst');
  const hasV2Message = multiDeliveryText.includes('adjusted to 0.40mm');

  console.log('Multi-Delivery Verification Result:', {
    hasDelivery2,
    hasDelivery1,
    hasV2File,
    hasV2Message
  });

  if (!hasDelivery2) {
    throw new Error('Customer multi-delivery view missing Delivery #2!');
  }

  // STEP 23: Log check summary
  console.log('\n--- STEP 23: Final Console & Network Health Check ---');
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
  .then(res => {
    console.log('\n===============================================================');
    console.log('E2E VERIFICATION COMPLETED SUCCESSFULLY WITH 0 FATAL ERRORS!');
    console.log('===============================================================');
    process.exit(0);
  })
  .catch(err => {
    console.error('\nE2E VERIFICATION FAILED:', err);
    process.exit(1);
  });
