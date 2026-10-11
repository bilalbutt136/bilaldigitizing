import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getMonthlyProgress, prepareMonthlyDelivery } from '../utils/monthlyProgress.js';
const bundle = (quota=10) => ({monthlyBundle:{planId:'embroidery-'+quota, designs:quota, paymentType:'one_time', autoRenew:false, durationDays:30}, deliveries:[]});
const make = (id, count=1) => ({id, files:[{url:'https://example.test/'+id+'.dst'}], monthlyDesignCount:count, deliveryNumber:1});

test('monthly progress starts 0/N and shows remaining without inventing deliveries',()=>{
  const info = getMonthlyProgress(bundle(25));
  assert.deepEqual([info.delivered,info.remaining,info.complete], [0,25,false]);
  assert.equal(getMonthlyProgress({},null),null);
});
test('one counted delivery moves the total; duplicate delivery ID never adds extra credit',()=>{
  const base=bundle(10);
  const one=prepareMonthlyDelivery(base,make('d-001'),1,null);
  assert.equal(one.progress.delivered,1);
  assert.equal(one.progress.remaining,9);
  assert.throws(()=>prepareMonthlyDelivery({...base,deliveries:one.deliveries},make('d-001'),1,null),/already been counted/);
  const dupList={...base,deliveries:[make('d-001'),make('d-001'),make('d-002',2)]};
  assert.equal(getMonthlyProgress(dupList).delivered,3);
});
test('revised delivery does not consume quota; last delivery automatically completes',()=>{
  const base=bundle(10);
  const revision=prepareMonthlyDelivery(base,make('revision'),0,null);
  assert.equal(revision.progress.delivered,0);
  const first=prepareMonthlyDelivery({...base,deliveries:revision.deliveries},make('first'),9,null);
  const final=prepareMonthlyDelivery({...base,deliveries:first.deliveries},make('final'),1,null);
  assert.equal(final.progress.delivered,10);
  assert.equal(final.progress.remaining,0);
  assert.equal(final.progress.complete,true);
  assert.throws(()=>prepareMonthlyDelivery({...base,deliveries:final.deliveries},make('extra'),1,null),/already completed/);
});
test('overages, invalid counts, empty file deliveries and expired periods are rejected',()=>{
  const base=bundle(10);
  assert.throws(()=>prepareMonthlyDelivery(base,make('over'),11,null),/exceeds/);
  assert.throws(()=>prepareMonthlyDelivery(base,make('fraction'),1.5,null),/exceeds/);
  assert.throws(()=>prepareMonthlyDelivery(base,{id:'empty',files:[]},1,null),/Attach completed/);
  assert.throws(()=>prepareMonthlyDelivery(base,make('late'),1,'2020-01-01T00:00:00Z'),/period has ended/);
});
test('server requires staff, paid bundle and optimistic concurrency for monthly deliveries',()=>{
  const server=fs.readFileSync('src/server/orders/handlers/post/updateStatus.js','utf8');
  const worker=fs.readFileSync('src/server/orders/handlers/post/adminReviewWorker.js','utf8');
  assert.match(server,/!isAdmin/);
  assert.match(server,/monthlyDeliveryId/);
  assert.match(server,/targetOrder\?\.payment_status/);
  assert.match(server,/prepareMonthlyDelivery/);
  assert.match(server,/updateQuery\.eq\('updated_at', targetOrder\.updated_at\)/);
  assert.match(server,/monthlyDelivery\.progress\.complete \? 'completed' : 'in_progress'/);
  assert.match(worker,/use the Order Delivery Desk to send and count finished designs/);
});
test('customer and admin progress display, count selector and canonical order refresh exist',()=>{
  const ui=fs.readFileSync('src/components/customer/OrderTrackerDrawer.jsx','utf8');
  const state=fs.readFileSync('src/context/StateContext.jsx','utf8');
  const mapper=fs.readFileSync('src/services/supabaseService.js','utf8');
  assert.match(ui,/Monthly Design Plan/);
  assert.match(ui,/aria-label="Monthly designs delivered"/);
  assert.match(ui,/monthlyDeliveryCount/);
  assert.match(ui,/0 — Revision only/);
  assert.match(ui,/monthlyDeliveryId: newDeliveryItem\.id/);
  assert.match(mapper,/monthlyProgress: getMonthlyProgress/);
  assert.match(state,/serverSavedOrder = mapDatabaseOrderToClientOrder/);
});
