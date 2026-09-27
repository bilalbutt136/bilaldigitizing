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

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map((b, i) => `${i}: "${b.innerText.replace(/\n/g, ' ')}"`);
  });
  console.log('Buttons:\n', buttons.join('\n'));

  console.log('\nTrying to click button containing "Order Requirements"...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Order Requirements'));
    console.log('btn found:', !!btn);
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  const textAfter = await page.innerText('body');
  console.log('After click:');
  console.log('Contains Target Fabric:', textAfter.includes('Target Fabric'));
  console.log('Contains Cotton / Pique:', textAfter.includes('Cotton / Pique'));
  console.log('Contains Placement:', textAfter.includes('Placement'));
  console.log('Contains Left Chest:', textAfter.includes('Left Chest'));

  await page.screenshot({ path: 'scratch/verification_screenshots/debug_req_click.png' });
  await browser.close();
})();
