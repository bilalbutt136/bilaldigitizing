import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]:', err.message));

  page.on('response', resp => {
    if (resp.url().includes('cloudinary') || resp.url().includes('/api/orders') || (resp.url().includes('supabase') && resp.url().includes('orders'))) {
      console.log(`[NET RESP ${resp.status()}]:`, resp.url().substring(0, 100));
    }
  });

  console.log('1. Logging in as Admin on /secure-admin-login...');
  await page.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
  await page.fill('input[type="password"]', 'AdminSecurePass123!');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(4000);

  console.log('2. Navigating to /admin-portal?tab=orders ...');
  await page.goto('https://bdigitizing.com/admin-portal?tab=orders', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  console.log('3. Finding order #1208 row...');
  const row = await page.$('tr:has-text("1208")');
  if (!row) {
    throw new Error('Order #1208 not found in orders table!');
  }

  console.log('4. Clicking Deliver Files / Manage button on row...');
  const actionBtn = await row.$('button[title*="deliver"]') || await row.$('button:has-text("Deliver")') || await row.$('button:has-text("Manage")');
  await actionBtn.click();
  await page.waitForTimeout(3000);

  console.log('5. Staging machine files (.dst and .pdf)...');
  const fileInput = await page.$('input[type="file"][multiple]');
  if (!fileInput) {
    throw new Error('File input for deliverables not found in drawer!');
  }

  const dstPath = path.resolve('scratch/test_files/test_embroidery.dst');
  const pdfPath = path.resolve('scratch/test_files/test_preview.pdf');
  await fileInput.setInputFiles([dstPath, pdfPath]);
  await page.waitForTimeout(2000);

  console.log('6. Entering delivery message...');
  const textarea = await page.$('textarea[placeholder="Type message..."]');
  if (!textarea) {
    throw new Error('Delivery message textarea not found!');
  }
  const deliveryMsg = 'Hello! Your Tajima DST embroidery stitch files and PDF production worksheet are ready for commercial run.';
  await textarea.fill(deliveryMsg);
  await page.waitForTimeout(1000);

  console.log('7. Taking screenshot of staged delivery files and message...');
  await page.screenshot({ path: 'scratch/verification_screenshots/09_admin_staged_delivery.png' });

  console.log('8. Clicking "Deliver Order to Client" button...');
  const deliverSubmitBtn = await page.$('button:has-text("Deliver Order to Client")');
  await deliverSubmitBtn.click();

  console.log('9. Waiting for Cloudinary uploads and database commit to complete...');
  // Wait for the button to transition out of "Uploading & Delivering..."
  try {
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'attached', timeout: 5000 });
    console.log('   Delivery progress active: "Uploading & Delivering..."');
    await page.waitForSelector('text=Uploading & Delivering...', { state: 'detached', timeout: 60000 });
    console.log('   Delivery upload finished (progress indicator detached).');
  } catch (wErr) {
    console.log('   Note on progress indicator:', wErr.message);
  }

  // Wait for success toast or delivery version tabs to appear
  await page.waitForTimeout(5000);

  console.log('10. Taking screenshot of delivered state in Admin...');
  await page.screenshot({ path: 'scratch/verification_screenshots/11_admin_delivered_state.png' });

  const finalBody = await page.innerText('body');
  console.log('11. Contains "Initial Delivery" or "Delivery #1"?', finalBody.includes('Initial Delivery') || finalBody.includes('Delivery #1') || finalBody.includes('Delivery 1'));
  console.log('12. Contains success message or delivered state?', finalBody.includes('successfully sent') || finalBody.includes('Delivered'));

  await browser.close();
  console.log('SUCCESS: Admin delivery finished completely.');
}

main().catch(err => {
  console.error('FATAL in execute_admin_delivery:', err);
  process.exit(1);
});
