import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Disable cache to see 100% fresh live assets
  await page.route('**/*', route => route.continue());
  await page.goto('https://bdigitizing.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const card = page.locator('.hero-showcase-card').first();

  // 1. Initial All/Embroidery
  console.log('1. All tab card header:', await card.locator('div:has-text("LIVE SHOWCASE")').first().innerText());
  await card.screenshot({ path: 'scratch/hero_showcase_emb_real.png' });

  // 2. Vector tab
  const vTab = page.locator('.hero-nav-tab-btn:has-text("Vector Art")').first();
  if (await vTab.count() > 0) {
    await vTab.click();
    await page.waitForTimeout(2000);
    console.log('2. Vector tab card title:', await card.innerText());
    await card.screenshot({ path: 'scratch/hero_showcase_vector_real.png' });
  }

  // 3. Patches tab
  const pTab = page.locator('.hero-nav-tab-btn:has-text("Patches")').first();
  if (await pTab.count() > 0) {
    await pTab.click();
    await page.waitForTimeout(2000);
    console.log('3. Patches tab card title:', await card.innerText());
    await card.screenshot({ path: 'scratch/hero_showcase_patches_real.png' });
  }

  await browser.close();
  console.log('Done capturing real tab screenshots!');
}

main().catch(console.error);
