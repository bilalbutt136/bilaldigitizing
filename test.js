
const key = 'cd14fcea-a2fe-4b9e-bd27-156ee291851f';
const methods = ['card', 'apple_pay', 'google_pay', 'cashapp', 'paypal', 'dollarpay_paypal', 'taptapup_paypal', 'dollarpay_cashapp', 'dollarpay_card', 'dollarpay_apple_pay', 'dollarpay_google_pay'];
async function run() {
  for (let m of methods) {
    const res = await fetch('https://www.boltpayouts.xyz/api/create-payment', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({ amount: 15, username: 'test@test.com', method: m })
    });
    const data = await res.json().catch(()=>({}));
    console.log(m, '=>', data.paymentUrl ? 'URL: ' + data.paymentUrl.substring(0,40) : (data.invoice ? 'INVOICE' : data));
  }
}
run();

