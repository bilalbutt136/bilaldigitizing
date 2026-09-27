import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://bdigitizing.com/login');
  await page.fill('#email', 'testtest@gmail.com');
  await page.fill('#password', 'CustomerPass123!');
  await page.click('button:has-text("Sign In to Portal")');
  await page.waitForURL(url => url.pathname.includes('/client-portal'));
  await page.goto('https://bdigitizing.com/client-portal?tab=orders&trackOrder=1208');
  await page.waitForTimeout(3000);

  console.log('Clicking Order Requirements button...');
  const reqBtn = page.locator('.order-tracker-drawer button:has-text("Order Requirements")').first();
  console.log('Button found:', await reqBtn.count());
  await reqBtn.click();
  await page.waitForTimeout(2000);

  const text = await page.innerText('.order-tracker-drawer');
  console.log('Contains Target Fabric:', text.includes('Target Fabric'));
  console.log('Contains Cotton / Pique:', text.includes('Cotton / Pique'));
  console.log('Contains Dimensions:', text.includes('Dimensions'));
  console.log('Contains 3.5":', text.includes('3.5"'));
  console.log('Contains Left Chest:', text.includes('Left Chest'));
  console.log('Contains test_patch_artwork:', text.includes('test_patch_artwork'));

  await page.screenshot({ path: 'scratch/verification_screenshots/test_req_click.png' });
  await browser.close();
})();
