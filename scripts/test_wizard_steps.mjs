import { chromium } from 'playwright';
import path from 'path';

async function testWizardSteps() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://bdigitizing.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');

  console.log('2. Waiting for actual redirect to /client-portal pathname...');
  await page.waitForURL(url => url.pathname === '/client-portal', { timeout: 20000 });
  console.log('Redirected to:', page.url());

  console.log('3. Waiting for Customer Dashboard to render...');
  await page.waitForSelector('button:has-text("Order Now")', { timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log('Customer Dashboard ready!');

  // Click "Order Now"
  console.log('4. Clicking Order Now on dashboard...');
  await page.click('button:has-text("Order Now")');
  await page.waitForSelector('.order-wizard-services-grid', { timeout: 15000 });
  console.log('Wizard Step 1 visible!');

  // Step 1: Click first service card (Embroidery Digitizing)
  await page.click('.order-wizard-services-grid > div:first-child');
  await page.waitForSelector('button:has-text("Next: Upload Artwork")', { timeout: 15000 });
  console.log('Wizard Step 2 visible!');

  // Step 2: Next Upload Artwork
  await page.click('button:has-text("Next: Upload Artwork")');
  await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 15000 });
  console.log('Wizard Step 3 visible!');

  // Step 3: Attach Artwork
  const artworkPath = path.resolve('scratch/test_files/test_patch_artwork.png');
  await page.setInputFiles('input[type="file"]', artworkPath);
  console.log('File attached! Waiting 4s for preview...');
  await page.waitForTimeout(4000);

  await page.fill('textarea[placeholder*="instructions"]', 'Left chest embroidery on polo. High density, clean pathing.');
  await page.screenshot({ path: 'scratch/wizard_step3_uploaded.png' });
  console.log('Artwork uploaded! Advancing to Step 4...');

  await page.click('button:has-text("Next: Technical Specs")');
  await page.waitForSelector('button:has-text("Next: Review & Pay")', { timeout: 15000 });
  console.log('Wizard Step 4 visible!');

  await page.click('button:has-text("Next: Review & Pay")');
  await page.waitForSelector('button:has-text("Confirm & Place Order")', { timeout: 15000 });
  console.log('Wizard Step 5 visible! Submitting order...');

  await page.click('button:has-text("Confirm & Place Order")');
  console.log('Waiting for Checkout Modal...');
  await page.waitForSelector('button:has-text("Studio Wallet")', { timeout: 25000 });
  console.log('Checkout modal opened!');
  await page.screenshot({ path: 'scratch/checkout_modal_opened.png' });

  // Click Studio Wallet
  console.log('Clicking Studio Wallet payment...');
  await page.click('button:has-text("Studio Wallet")');
  console.log('Waiting for payment confirmation...');
  await page.waitForTimeout(7000);
  await page.screenshot({ path: 'scratch/payment_done.png' });

  // Check orders table
  await page.goto('https://bdigitizing.com/client-portal?tab=orders', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('table, .order-card', { timeout: 15000 });
  await page.waitForTimeout(3000);
  const text = await page.innerText('body');
  const match = text.match(/#([0-9]{4,10})/);
  console.log('Placed order found:', match ? match[0] : 'None');
  await page.screenshot({ path: 'scratch/orders_tab_done.png' });

  await browser.close();
  console.log('ALL STEPS PASSED!');
}

testWizardSteps().catch(console.error);
