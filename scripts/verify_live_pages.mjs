const urls = [
  'https://bdigitizing.com/',
  'https://bdigitizing.com/portfolio',
  'https://bdigitizing.com/services/embroidery-digitizing',
  'https://bdigitizing.com/services/vector-tracing',
  'https://bdigitizing.com/order',
  'https://bdigitizing.com/client-portal',
  'https://bdigitizing.com/admin'
];

async function testAll() {
  console.log('Testing live production pages on https://bdigitizing.com...\n');
  let allHealthy = true;

  for (const url of urls) {
    const start = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    const duration = Date.now() - start;
    const hasOldRef = text.includes('qkgvgrscjlijajuzouke');
    const isOk = res.status === 200 && !hasOldRef;

    console.log(`[${isOk ? 'PASS' : 'FAIL'}] ${url}`);
    console.log(`       Status: ${res.status} | Time: ${duration}ms | Length: ${text.length} bytes | HasOldRef: ${hasOldRef}`);

    if (!isOk) allHealthy = false;
  }

  console.log(`\nOverall Result: ${allHealthy ? 'ALL PAGES HEALTHY & VERIFIED' : 'ISSUES DETECTED'}`);
}

testAll().catch(console.error);
