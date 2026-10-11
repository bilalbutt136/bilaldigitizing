import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeMonthlyBundleConfig,
  findPublishedMonthlyBundle,
  MONTHLY_DESIGN_LIMITS
} from '../utils/monthlyBundles.js';

const read = (path) => fs.readFileSync(path, 'utf8');

test('monthly catalog exposes only 10/25/50/100 for embroidery and vector; no invented prices', () => {
  const plans = normalizeMonthlyBundleConfig(null);
  assert.equal(plans.length, 8);
  assert.deepEqual(MONTHLY_DESIGN_LIMITS, [10,25,50,100]);
  assert.equal(plans.filter(p=>p.active).length, 0);
  assert.equal(findPublishedMonthlyBundle(null,'embroidery',10),null);
});
test('published prices are validated and selected by service and count', () => {
  const input = {plans:[
    {service:'embroidery',designs:10,price:75.5,active:true,title:'Studio 10'},
    {service:'vector',designs:100,price:250,active:true,title:'Vector 100'},
    {service:'patch',designs:25,price:15,active:true},
    {service:'embroidery',designs:25,price:'',active:true},
    {service:'vector',designs:10,price:0,active:true}
  ]};
  assert.equal(findPublishedMonthlyBundle(input,'embroidery',10)?.price,75.5);
  assert.equal(findPublishedMonthlyBundle(input,'vector',100)?.price,250);
  assert.equal(findPublishedMonthlyBundle(input,'vector',10),null);
  assert.equal(findPublishedMonthlyBundle(input,'patch',25),null);
  assert.equal(findPublishedMonthlyBundle(input,'embroidery',25),null);
  assert.equal(findPublishedMonthlyBundle(input,'embroidery',12),null);
});
test('monthly order form removes old service tabs and preserves regular checkout', () => {
  const s=read('src/components/customer/StreamlinedOrderFlow.jsx');
  assert.match(s,/Regular Order/);
  assert.match(s,/Monthly Plan/);
  assert.doesNotMatch(s,/className="bdigi-service-switch"/);
  assert.match(s,/className="bdigi-monthly-grid"/);
  assert.match(s,/isMonthlyMode \? monthlyQuote : calculatePricing\(\)/);
  assert.match(s,/!isMonthlyMode && uploadedFiles\.length === 0/);
  assert.match(s,/source: isMonthlyMode \? 'monthly_design_bundle' : 'direct_order_desk'/);
  assert.match(s,/monthly_plan_id: isMonthlyMode \? monthlyPlan\.id/);
  assert.match(s,/No auto-renewal/);
});
test('admin plan editor and API require admin identity, server verifies published price', () => {
  const editor=read('src/components/admin/MonthlyBundlesEditor.jsx');
  const api=read('app/api/monthly-bundles/route.js');
  const order=read('src/server/orders/handlers/post/createOrder.js');
  const shell=read('src/components/admin/StudioServicesManager.jsx');
  assert.match(editor,/Save Monthly Plans/);
  assert.match(editor,/MONTHLY_DESIGN_LIMITS/);
  assert.match(shell,/MonthlyBundlesEditor/);
  assert.match(api,/getServerAuthUser/);
  assert.match(api,/!user \|\| !isAdmin/);
  assert.match(api,/plans\.filter\(item => item\.active\)/);
  assert.match(order,/findPublishedMonthlyBundle/);
  assert.match(order,/Monthly plan price changed/);
  assert.match(order,/source === 'monthly_design_bundle'/);
  assert.match(order,/usageTracking: 'managed_by_studio'/);
});
