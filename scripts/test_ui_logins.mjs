import { chromium } from 'playwright';

async function testLogins() {
  console.log('Testing Playwright logins on https://bdigitizing.com ...');
  const browser = await chromium.launch({ headless: true });
  
  // 1. Customer Login
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    console.log('1. Navigating to customer login...');
    await page.goto('https://bdigitizing.com/login?redirect=/client-portal', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    console.log('Filling customer login credentials...');
    await page.fill('input[name="email"]', 'testtest@gmail.com');
    await page.fill('input[name="password"]', 'CustomerPass123!');
    await page.click('form[name="loginForm"] button[type="submit"]');
    
    console.log('Waiting for redirection to client portal...');
    await page.waitForURL('**/client-portal**', { timeout: 15000 });
    console.log('Customer portal URL:', page.url());
    
    await page.waitForTimeout(3000);
    const text = await page.innerText('body');
    const isCustomerDash = text.includes('Orders') || text.includes('Overview') || text.includes('New Order') || text.includes('Wallet');
    console.log('Customer Dashboard loaded successfully:', isCustomerDash);
    await context.close();
  } catch (err) {
    console.error('Customer login failed:', err.message);
  }

  // 2. Admin Login
  try {
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    console.log('\n2. Navigating to admin login...');
    await adminPage.goto('https://bdigitizing.com/secure-admin-login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await adminPage.waitForTimeout(2000);

    console.log('Filling admin credentials...');
    await adminPage.fill('input[type="email"]', 'admin_verify@bdigitizing.com');
    await adminPage.fill('input[type="password"]', 'AdminSecurePass123!');
    await adminPage.click('button[type="submit"]');

    console.log('Waiting for redirection to admin portal...');
    await adminPage.waitForURL('**/admin-portal**', { timeout: 15000 });
    console.log('Admin portal URL:', adminPage.url());

    await adminPage.waitForTimeout(3000);
    const adminText = await adminPage.innerText('body');
    const isAdminDash = adminText.includes('Admin') || adminText.includes('Orders') || adminText.includes('Production') || adminText.includes('Digitizing');
    console.log('Admin Dashboard loaded successfully:', isAdminDash);
    await adminContext.close();
  } catch (err) {
    console.error('Admin login failed:', err.message);
  }

  await browser.close();
  console.log('\nLogin tests finished.');
}

testLogins().catch(console.error);
