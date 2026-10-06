import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://bdigitizing.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1. All tab (Embroidery)
  const card = await page.locator('.hero-showcase-card').first();
  if (card) {
    await card.screenshot({ path: 'scratch/hero_showcase_emb.png' });
  }

  // 2. Vector tab
  const vectorTab = await page.locator('button:has-text("Vector")').first();
  if (vectorTab) {
    await vectorTab.click();
    await page.waitForTimeout(1000);
    await card.screenshot({ path: 'scratch/hero_showcase_vector.png' });
  }

  // 3. Patches tab
  const patchTab = await page.locator('button:has-text("Patches")').first();
  if (patchTab) {
    await patchTab.click();
    await page.waitForTimeout(1000);
    await card.screenshot({ path: 'scratch/hero_showcase_patches.png' });
  }

  console.log('Saved all screenshots!');
  await browser.close();
}

main().catch(console.error);
