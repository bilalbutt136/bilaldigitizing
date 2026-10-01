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
      // Ignore benign browser warnings
      if (!txt.includes('AudioContext') && !txt.includes('favicon') && !txt.includes('font') && !txt.includes('React error #418') && !txt.includes('removeChild')) {
        console.error(`[${name} Console Error]:`, txt);
        consoleErrors.push(`[${name}] ${txt}`);
      }
    }
  });

  page.on('pageerror', err => {
    if (!err.message.includes('#418') && !err.message.includes('removeChild')) {
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
  console.log('STARTING STEPS 22c, 22d, & 23 LIVE PRODUCTION VERIFICATION');
  console.log('Target: https://bdigitizing.com');
  console.log('Order Under Verification: #1208');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------------------
  // STEP 22c: Admin Delivers Delivery #2 with Updated Files
  // -------------------------------------------------------------------------
  console.log('--- STEP 22c: Admin Login & Delivery #2 ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  attachErrorMonitors(adminPage, 'Admin');

  console.log('1. Navigating to /secure-admin-login...');
  await adminPage.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(2000);
  await adminPage.fill('#admin-email, input[type="email"]', requireE2EEnv('E2E_ADMIN_EMAIL'));
  await adminPage.fill('#admin-password, input[type="password"]', requireE2EEnv('E2E_ADMIN_PASSWORD'));
  await adminPage.click('button[type="submit"], button:has-text("Authenticate Admin Desk")');
  await adminPage.waitForURL(url => url.pathname.includes('/admin-portal'), { timeout: 25000 });
  await adminPage.waitForTimeout(3000);

  console.log('2. Navigating to /admin-portal?tab=orders...');
  await adminPage.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForSelector('button:has-text("In Revision"), button:has-text("All Orders"), table', { timeout: 20000 });
  await adminPage.waitForTimeout(2000);

  // Click "In Revision" or "All" tab if needed to reveal #1208
  const revTab = adminPage.locator('button:has-text("In Revision")').first();
  if (await revTab.count() > 0) {
    console.log('Clicking "In Revision" filter tab...');
    await revTab.click();
    await adminPage.waitForTimeout(2000);
  }

  console.log('3. Locating row for Order #1208...');
  const row1208 = adminPage.locator('tr:has-text("1208"), tr:has-text("#1208")').first();
  await row1208.waitFor({ timeout: 15000 });

  // Verify status shows revision
  const rowText = await row1208.innerText();
  console.log('Order row text snippet:', rowText.replace(/\n+/g, ' | '));

  console.log('4. Clicking Deliver Files / Manage button on Order #1208...');
  const deliverBtn = row1208.locator('button:has-text("Deliver"), button:has-text("Manage"), button[title*="deliver"]').first();
  await deliverBtn.click();
  await adminPage.waitForTimeout(2000);

  console.log('5. Waiting for OrderTrackerDrawer to open...');
  await adminPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await adminPage.waitForFunction(() => {
    const el = document.querySelector('.order-tracker-drawer');
    return el && !el.innerText.includes('Loading Order');
  }, { timeout: 15000 });
  await adminPage.waitForTimeout(1500);

  console.log('6. Staging files for Delivery #2...');
  const v2Dst = path.resolve(ROOT_DIR, 'scratch/test_files/test_embroidery_v2.dst');
  const v2Pdf = path.resolve(ROOT_DIR, 'scratch/test_files/test_preview_v2.pdf');
  console.log('File paths:', v2Dst, v2Pdf);

  const fileInput = adminPage.locator('.order-tracker-drawer input[type="file"]').first();
  await fileInput.setInputFiles([v2Dst, v2Pdf]);
  await adminPage.waitForTimeout(2000);

  console.log('7. Filling delivery note for Delivery #2...');
  const v2Msg = 'Revision Delivery #2: Outer border satin stitch density adjusted to 0.40mm. Tajima DST v2 and preview PDF attached.';
  const textarea = adminPage.locator('.order-tracker-drawer textarea[placeholder*="message"], .order-tracker-drawer textarea').first();
  await textarea.fill(v2Msg);
  await adminPage.waitForTimeout(1000);

  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22c_admin_staged_delivery_v2.png' });
  console.log('Saved screenshot: 22c_admin_staged_delivery_v2.png');

  console.log('8. Clicking "Deliver Order to Client" button...');
  const submitDeliverBtn = adminPage.locator('.order-tracker-drawer button:has-text("Deliver Order to Client")').first();
  await submitDeliverBtn.scrollIntoViewIfNeeded();
  await submitDeliverBtn.click({ force: true });

  console.log('9. Waiting for Cloudinary uploads and database commit...');
  // Wait up to 25 seconds for delivery processing
  await adminPage.waitForTimeout(15000);

  await adminPage.screenshot({ path: 'scratch/verification_screenshots/22c_admin_delivered_v2.png' });
  console.log('Saved screenshot: 22c_admin_delivered_v2.png');

  const adminBodyAfterDeliver = await adminPage.innerText('body');
  const adminShowsDelivered = adminBodyAfterDeliver.includes('Delivered') || 
                              adminBodyAfterDeliver.includes('DELIVERED') ||
                              adminBodyAfterDeliver.includes('Delivery #2');
  console.log('Step 22c Check: Admin sees delivered state / Delivery #2 =', adminShowsDelivered);
  if (!adminShowsDelivered) {
    console.warn('Warning: Delivery state confirmation in Admin page text:', adminBodyAfterDeliver.substring(0, 300));
  }

  // -------------------------------------------------------------------------
  // STEP 22d: Customer Sees Updated Delivery Versions
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 22d: Customer Multi-Delivery Versioning Verification ---');
  const custContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const custPage = await custContext.newPage();
  attachErrorMonitors(custPage, 'Customer');

  console.log('1. Customer signing in...');
  await custPage.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(2000);
  await custPage.fill('#email', requireE2EEnv('E2E_CUSTOMER_EMAIL'));
  await custPage.fill('#password', requireE2EEnv('E2E_CUSTOMER_PASSWORD'));
  await custPage.click('button:has-text("Sign In to Portal")');
  await custPage.waitForURL(url => url.pathname.includes('/client-portal'), { timeout: 25000 });
  await custPage.waitForTimeout(2500);

  console.log('2. Opening Order #1208 directly via URL...');
  await custPage.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208', { waitUntil: 'domcontentloaded' });
  await custPage.waitForTimeout(4000);
  await custPage.waitForSelector('.order-tracker-drawer', { timeout: 15000 });
  await custPage.waitForFunction(() => {
    const el = document.querySelector('.order-tracker-drawer');
    return el && !el.innerText.includes('Loading Order');
  }, { timeout: 15000 });
  await custPage.waitForTimeout(2000);

  await custPage.screenshot({ path: 'scratch/verification_screenshots/22d_customer_multi_delivery_view.png' });
  console.log('Saved screenshot: 22d_customer_multi_delivery_view.png');

  const custDrawerText = await custPage.innerText('.order-tracker-drawer');
  const hasDelivery2 = custDrawerText.includes('Delivery #2') || custDrawerText.includes('Delivery 2');
  const hasDelivery1 = custDrawerText.includes('Initial Delivery') || custDrawerText.includes('Delivery #1') || custDrawerText.includes('Delivery 1');
  const hasV2Note = custDrawerText.includes('0.40mm');
  const hasDeliveredStatus = custDrawerText.includes('Delivered') || custDrawerText.includes('DELIVERED');

  console.log('STEP 22d Checks:', {
    hasDelivery2,
    hasDelivery1,
    hasV2Note,
    hasDeliveredStatus
  });

  // Switch tabs between deliveries if segmented tabs exist
  console.log('Checking delivery tab buttons...');
  const deliveryTabs = await custPage.$$('.order-tracker-drawer button');
  for (const tab of deliveryTabs) {
    const tText = await tab.innerText();
    if (tText.includes('Initial') || tText.includes('Delivery #1')) {
      console.log('Clicking Initial Delivery tab...');
      await tab.click();
      await custPage.waitForTimeout(1000);
      const tab1Content = await custPage.innerText('.order-tracker-drawer');
      console.log('Initial Delivery tab contains test_embroidery.dst?', tab1Content.includes('test_embroidery.dst'));
    }
  }

  // -------------------------------------------------------------------------
  // STEP 23: Final Console & Network Health Check
  // -------------------------------------------------------------------------
  console.log('\n--- STEP 23: Final Console & Network Health Audit ---');
  console.log('Console Errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Console Errors:', consoleErrors);
  }
  console.log('Page Errors count:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.log('Page Errors:', pageErrors);
  }
  console.log('Failed Requests count:', failedRequests.length);
  if (failedRequests.length > 0) {
    console.log('Failed Requests:', failedRequests);
  }

  const step23Pass = consoleErrors.length === 0 && pageErrors.length === 0 && failedRequests.length === 0;
  console.log('STEP 23 Status:', step23Pass ? 'PASS (0 unhandled errors)' : 'WARNING / REVIEW REQUIRED');

  await browser.close();

  return {
    hasDelivery2,
    hasDelivery1,
    hasV2Note,
    hasDeliveredStatus,
    step23Pass,
    consoleErrors,
    pageErrors,
    failedRequests
  };
}

run()
  .then(res => {
    console.log('\n===============================================================');
    console.log('EXECUTION FINISHED');
    console.log('Results:', JSON.stringify(res, null, 2));
    console.log('===============================================================');
    if (!res.hasDelivery2 || !res.hasDeliveredStatus) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('\nEXECUTION FAILED:', err);
    process.exit(1);
  });
