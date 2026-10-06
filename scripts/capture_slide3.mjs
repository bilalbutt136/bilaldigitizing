import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://bdigitizing.com', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click 3rd dot
  const dots = page.locator('.hero-showcase-card span');
  const count = await dots.count();
  for (let i = 0; i < count; i++) {
    const el = dots.nth(i);
    const style = await el.getAttribute('style');
    if (style && style.includes('cursor: pointer')) {
      // Find the 3rd clickable dot
      // Actually, let's just click the chevron right button twice
      break;
    }
  }

  const nextBtn = page.locator('button[title="Next Showcase Image"]').first();
  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    await page.waitForTimeout(600);
    await nextBtn.click();
    await page.waitForTimeout(600);
  }

  const card = page.locator('.hero-showcase-card').first();
  await card.screenshot({ path: 'scratch/slide_embroidery_third.png' });
  await browser.close();
  console.log('Done capturing third slide!');
}

main().catch(console.error);
