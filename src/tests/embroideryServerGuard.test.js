import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isEmbroideryOrderTierEligible } from '../utils/embroiderySizeEligibility.js';

const tier = rank=>({id:'tier-'+rank,price:rank*10,display_order:rank});

test('server eligibility rejects 12-inch designs on first or second package',()=>{
 assert.equal(isEmbroideryOrderTierEligible('Full Jacket Back (Up to 12")',tier(1)),false);
 assert.equal(isEmbroideryOrderTierEligible('Full Jacket Back (Up to 12")',tier(2)),false);
 assert.equal(isEmbroideryOrderTierEligible('Full Jacket Back (Up to 12")',tier(3)),true);
});

test('server eligibility requires medium+ for 7-inch, allows premium for smaller',()=>{
 assert.equal(isEmbroideryOrderTierEligible('Jacket Front / Sleeve (Up to 7")',tier(1)),false);
 assert.equal(isEmbroideryOrderTierEligible('Jacket Front / Sleeve (Up to 7")',tier(2)),true);
 assert.equal(isEmbroideryOrderTierEligible('Jacket Front / Sleeve (Up to 7")',tier(3)),true);
 assert.equal(isEmbroideryOrderTierEligible('Left Chest (Up to 4")',tier(3)),true);
});

test('server eligibility rejects invalid or oversized custom placement',()=>{
 assert.equal(isEmbroideryOrderTierEligible('12.1" × 4" (Custom)',tier(3)),false);
 assert.equal(isEmbroideryOrderTierEligible('7" × 4" (Custom)',tier(1)),false);
 assert.equal(isEmbroideryOrderTierEligible('7" × 4" (Custom)',tier(2)),true);
 assert.equal(isEmbroideryOrderTierEligible('12" × 7" (Custom)',tier(3)),true);
 for(const p of ['','unknown','Full Jacket Back','4inch']) assert.equal(isEmbroideryOrderTierEligible(p,tier(1)),false);
});

test('createOrder verifies against live DB tier before trusting quote',()=>{
 const server=fs.readFileSync('src/server/orders/handlers/post/createOrder.js','utf8');
 assert.match(server,/isEmbroideryOrderTierEligible\(primaryDbRow\.placement, liveTier\)/);
 assert.match(server,/\.select\('id,service_type,title,price,is_active,display_order,sort_order'\)/);
 assert.match(server,/status: 409/);
 assert.match(server,/primaryDbRow.type === 'embroidery' && !isAdmin/);
});
