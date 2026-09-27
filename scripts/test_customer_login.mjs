import { chromium } from 'playwright';

async function testCustomerLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('response', resp => {
    if (resp.url().includes('/api/') || resp.url().includes('supabase')) {
      console.log('NETWORK:', resp.status(), resp.url());
    }
  });

  console.log('Navigating to login...');
  await page.goto('https://bdigitizing.com/login?redirect=/client-portal', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('Filling form...');
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  
  console.log('Clicking Sign In to Portal...');
  await page.click('button:has-text("Sign In to Portal")');

  console.log('Waiting 8 seconds for login to process...');
  await page.waitForTimeout(8000);

  console.log('Final URL:', page.url());
  const text = await page.innerText('body');
  console.log('Is on client portal?', page.url().includes('/client-portal'));
  console.log('Page text includes Customer Dashboard?', text.includes('Dashboard') || text.includes('Orders') || text.includes('Overview'));

  await page.screenshot({ path: 'scratch/customer_login_result.png' });
  console.log('Screenshot saved to scratch/customer_login_result.png');

  await browser.close();
}

testCustomerLogin().catch(console.error);
