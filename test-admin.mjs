import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3001/');
  await page.waitForTimeout(3000);
  
  console.log('Navigating to /admin-portal...');
  await page.goto('http://localhost:3001/admin-portal');
  await page.waitForTimeout(2000);
  
  if (page.url().includes('login')) {
    console.log('Logging in...');
    // The admin login might actually be /secure-admin-login
    await page.goto('http://localhost:3001/secure-admin-login');
    await page.waitForTimeout(1000);
    // Fill credentials if any, or just let's check if the admin page itself crashes if we bypass
    // Usually we can't easily bypass. But wait, we can just render the component in a test page.
  }
  
  await browser.close();
})();
