import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://bdigitizing.com/login?redirect=/client-portal', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const forms = await page.$$eval('form', fs => fs.map(f => ({ name: f.name, id: f.id, text: f.innerText.slice(0, 100) })));
  console.log('Forms:', forms);
  
  const inputs = await page.$$eval('input', is => is.map(i => ({ name: i.name, type: i.type, id: i.id, placeholder: i.placeholder })));
  console.log('Inputs:', inputs);

  const buttons = await page.$$eval('button', bs => bs.map(b => ({ text: b.innerText.trim(), type: b.type })));
  console.log('Buttons:', buttons);

  await browser.close();
}

main().catch(console.error);
