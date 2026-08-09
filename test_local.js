import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to local dev server...');
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`[Console Error]:`, msg.text());
  });
  
  try {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    console.log(`Page Title: ${title}`);
    console.log('Successfully connected to local dev server without resource crash!');
  } catch (err) {
    console.error('Error connecting to local server:', err);
  } finally {
    await browser.close();
  }
})();
