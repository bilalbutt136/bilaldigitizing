import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://bdigitizing.com', { waitUntil: 'networkidle' });
  const card = page.locator('.hero-showcase-card').first();
  await card.hover();
  await page.waitForTimeout(500);

  const nextBtn = card.locator('button[title="Next Showcase Image"]');

  // Slide 1
  let title = await card.locator('div:has-text("LIVE SHOWCASE") + div').innerText();
  let imgSrc = await card.locator('img').first().getAttribute('src');
  console.log('Slide 1:', title, imgSrc);

  // Click next -> Slide 2
  await nextBtn.click();
  await page.waitForTimeout(500);
  title = await card.locator('div:has-text("LIVE SHOWCASE") + div').innerText();
  imgSrc = await card.locator('img').first().getAttribute('src');
  console.log('Slide 2:', title, imgSrc);

  // Click next -> Slide 3
  await nextBtn.click();
  await page.waitForTimeout(500);
  title = await card.locator('div:has-text("LIVE SHOWCASE") + div').innerText();
  imgSrc = await card.locator('img').first().getAttribute('src');
  console.log('Slide 3:', title, imgSrc);

  await card.screenshot({ path: 'scratch/slide_3_verified.png' });
  await browser.close();
}

main().catch(console.error);
