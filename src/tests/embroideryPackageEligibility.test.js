import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { requiredEmbroideryRank, embroideryRankFromPlacement, eligibleEmbroideryTiers, chooseEmbroideryTier } from '../utils/embroiderySizeEligibility.js';

const tiers = [
 { id: 'basic', display_order: 1, price: 10, title: 'Basic' },
 { id: 'medium', display_order: 2, price: 20, title: 'Medium' },
 { id: 'full', display_order: 3, price: 30, title: 'Full Back' }
];

test('small sizes allow any package, 7 inch requires second+, 12 inch requires third+',()=>{
 assert.equal(requiredEmbroideryRank('cap'),1);
 assert.equal(requiredEmbroideryRank('left-chest'),1);
 assert.equal(requiredEmbroideryRank('sleeve'),2);
 assert.equal(requiredEmbroideryRank('jacket-back'),3);
 assert.deepEqual(eligibleEmbroideryTiers(tiers,1).map(t=>t.id),['basic','medium','full']);
 assert.deepEqual(eligibleEmbroideryTiers(tiers,2).map(t=>t.id),['medium','full']);
 assert.deepEqual(eligibleEmbroideryTiers(tiers,3).map(t=>t.id),['full']);
 assert.equal(chooseEmbroideryTier(tiers,2,tiers[0])?.id,'medium');
 assert.equal(chooseEmbroideryTier(tiers,3,tiers[0])?.id,'full');
 assert.equal(chooseEmbroideryTier(tiers,1,tiers[2])?.id,'full');
 assert.equal(chooseEmbroideryTier(tiers,2,tiers[2])?.id,'full');
 assert.equal(chooseEmbroideryTier(tiers,3,tiers[1])?.id,'full');
});

test('custom artwork uses max dimension and blocks invalid/oversize inputs',()=>{
 for(const [a,b,rank] of [['4','3',1],['4.01','4',2],['7','2',2],['7.01','1',3],['9','12',3],['12','12',3],['12.01','3',null],['','4',null],['foo','3',null],['0','3',null],['3','Infinity',null],['-1','2',null]]){
  assert.equal(requiredEmbroideryRank('custom',a,b),rank,a+'x'+b);
 }
 assert.deepEqual(eligibleEmbroideryTiers(tiers,null),[]);
 assert.equal(chooseEmbroideryTier(tiers,3,[...tiers][0]).id,'full');
 assert.equal(chooseEmbroideryTier(tiers,3,null)?.id,'full');
 assert.equal(chooseEmbroideryTier(tiers.slice(0,2),3,tiers[0]),null);
});

test('server recognizes only valid placement labels and enforces same capacity rule',()=>{
 assert.equal(embroideryRankFromPlacement('Cap / Hat (Up to 2.5")'),1);
 assert.equal(embroideryRankFromPlacement('Left Chest (Up to 4")'),1);
 assert.equal(embroideryRankFromPlacement('Jacket Front / Sleeve (Up to 7")'),2);
 assert.equal(embroideryRankFromPlacement('Full Jacket Back (Up to 12")'),3);
 assert.equal(embroideryRankFromPlacement('4" × 7" (Custom)'),2);
 assert.equal(embroideryRankFromPlacement('4" × 12" (Custom)'),3);
 assert.equal(embroideryRankFromPlacement('12.5" × 2" (Custom)'),null);
 assert.equal(embroideryRankFromPlacement('left-chest'),null);
 assert.equal(embroideryRankFromPlacement(''),null);
 const server=fs.readFileSync('src/server/orders/handlers/post/createOrder.js','utf8');
 assert.match(server,/isEmbroideryOrderTierEligible\(primaryDbRow\.placement, liveTier\)/);
 assert.match(server,/\.select\('id,service_type,title,price,is_active,display_order,sort_order'\)/);
});

test('order UI auto-promotes without downgrading manually selected premium tiers',()=>{
 const src=fs.readFileSync('src/components/customer/StreamlinedOrderFlow.jsx','utf8');
 assert.match(src,/chooseEmbroideryTier\(currentServiceTiers, minEmbroideryRank, requestedTier\)/);
 assert.match(src,/setSelectedTierId\(currentTierKey\)/);
 assert.match(src,/disabled=\{!allowed\}/);
 assert.match(src,/Size & Package Mismatch/);
 assert.match(src,/bdigi-package-options/);
 assert.match(src,/aria-pressed=\{active\}/);
 assert.match(src,/Too small/);
 assert.match(src,/Smaller packages are locked/);
});
