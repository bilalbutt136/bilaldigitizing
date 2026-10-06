const endpoints = [
  'https://bdigitizing.com/',
  'https://bdigitizing.com/pricing',
  'https://bdigitizing.com/services/embroidery-digitizing',
  'https://bdigitizing.com/services/vector-tracing',
  'https://bdigitizing.com/custom-patches',
  'https://bdigitizing.com/portfolio',
  'https://bdigitizing.com/portal/login',
  'https://bdigitizing.com/order',
  'https://bdigitizing.com/api/health',
  'https://bdigitizing.com/api/cms',
  'https://bdigitizing.com/api/catalog?action=fetchAll'
];

async function checkAll() {
  console.log('Testing live production endpoints at https://bdigitizing.com ...');
  let allOk = true;
  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const isSuccess = res.status >= 200 && res.status < 400;
      console.log(`${isSuccess ? '✅ [PASS]' : '❌ [FAIL]'} ${res.status}: ${url}`);
      if (!isSuccess) allOk = false;
    } catch (e) {
      console.error(`❌ [ERROR] ${url}: ${e.message}`);
      allOk = false;
    }
  }
  if (!allOk) {
    console.error('Some endpoints failed verification.');
    process.exit(1);
  } else {
    console.log('All endpoints passed verification!');
  }
}

checkAll();
