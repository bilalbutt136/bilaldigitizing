import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getMonthlyProgress, prepareMonthlySubmission, prepareMonthlyDelivery } from '../utils/monthlyProgress.js';

const base = quota => ({monthlyBundle:{planId:'embroidery-'+quota,designs:quota,paymentType:'one_time',durationDays:30},monthlyDesigns:[],deliveries:[]});
const art = number => ({url:'https://res.cloudinary.com/sample/image/upload/v1/monthly-designs/design'+number+'.png',name:'design'+number+'.png'});
const finished = (id, target) => ({id,monthlyDesignId:target,files:[{url:'https://example.com/out.dst'}]});

test('monthly plan starts with zero uploads and requires no deliveries',()=>{
 const p=getMonthlyProgress(base(25));assert.deepEqual([p.uploaded,p.delivered,p.remaining],[0,0,25]);
 assert.equal(getMonthlyProgress({}),null);
});
test('customer uploads use one design slot each, block the 11th, and do not deliver automatically',()=>{
 let n=base(10);
 for(let i=1;i<=10;i++) {
  const updated=prepareMonthlySubmission(n,art(i),'Design '+i,null,'artwork_'+i+'00000');
  n={...n,monthlyDesigns:updated.designs};
  assert.equal(updated.progress.uploaded,i);assert.equal(updated.progress.delivered,0);
 }
 assert.equal(getMonthlyProgress(n).remaining,0);
 assert.throws(()=>prepareMonthlySubmission(n,art(11),'Eleventh',null,'artwork_110000'),/All plan design slots/);
});
test('admin delivery changes only linked design status and revision does not double-count',()=>{
 const b=base(10),a=prepareMonthlySubmission(b,art(1),'Logo',null,'design_001');
 const n={...b,monthlyDesigns:a.designs};
 const d=prepareMonthlyDelivery(n,finished('delivery_1','design_001'),'design_001',null);
 assert.equal(d.progress.uploaded,1);assert.equal(d.progress.delivered,1);
 const revision=prepareMonthlyDelivery({...n,deliveries:d.deliveries},finished('delivery_2','design_001'),'design_001',null);
 assert.equal(revision.progress.uploaded,1);assert.equal(revision.progress.delivered,1);
 assert.equal(revision.progress.designs[0].status,'Delivered');
 assert.throws(()=>prepareMonthlyDelivery({...n,deliveries:revision.deliveries},finished('delivery_2','design_001'),'design_001',null),/already been sent/);
 assert.throws(()=>prepareMonthlyDelivery(n,finished('another','missing'),'missing',null),/Select a submitted design/);
});
test('10 submitted and 10 linked deliveries complete the plan while revisions remain possible',()=>{
 let n=base(10);
 for(let i=1;i<=10;i++){n={...n,monthlyDesigns:prepareMonthlySubmission(n,art(i),'Design',null,'design_'+i+'000').designs};}
 for(let i=1;i<=10;i++){n={...n,deliveries:prepareMonthlyDelivery(n,finished('done_'+i,'design_'+i+'000'),'design_'+i+'000',null).deliveries};}
 const p=getMonthlyProgress(n);assert.equal(p.complete,true);assert.equal(p.delivered,10);
 const revision=prepareMonthlyDelivery(n,finished('revision_done','design_1000'),'design_1000',null);
 assert.equal(revision.progress.delivered,10);
 assert.equal(revision.progress.uploaded,10);
 assert.equal(revision.progress.complete,true);
});
test('untrusted files, duplicate client IDs and expired uploads fail safely',()=>{
 const b=base(10);
 assert.throws(()=>prepareMonthlySubmission(b,{url:'https://evil.test/x.png',name:'x.png'},'',null,'artwork_00001'),/valid artwork/);
 const a=prepareMonthlySubmission(b,art(1),'New',null,'artwork_00001');
 assert.throws(()=>prepareMonthlySubmission({...b,monthlyDesigns:a.designs},art(2),'New',null,'artwork_00001'),/already submitted/);
 assert.throws(()=>prepareMonthlySubmission(b,art(1),'New','2020-01-01T00:00:00Z','artwork_00001'),/plan has ended/);
});
test('server authorizes customer, checks payment and uses CAS for concurrent upload',()=>{
 const x=fs.readFileSync('src/server/orders/handlers/post/submitMonthlyDesign.js','utf8');
 assert.match(x,/!owner && !isAdmin/);assert.match(x,/payment_status/);
 assert.match(x,/prepareMonthlySubmission/);assert.match(x,/\.eq\('updated_at', order\.updated_at\)/);
 assert.match(x,/status: 'in_progress'/);
 const delivery=fs.readFileSync('src/server/orders/handlers/post/updateStatus.js','utf8');
 assert.match(delivery,/extraData\.monthlyDesignId/);
 assert.match(delivery,/monthlyDelivery\.progress\.complete \? 'completed' : 'in_progress'/);
});
test('customer and admin have upload tracker and revision-safe specific design selection',()=>{
 const ui=fs.readFileSync('src/components/customer/OrderTrackerDrawer.jsx','utf8');
 const mapper=fs.readFileSync('src/services/supabaseService.js','utf8');
 assert.match(ui,/Upload Design #/);
 assert.match(ui,/aria-label="Monthly design upload quota"/);
 assert.match(ui,/id="monthly-design-target"/);
 assert.match(ui,/submitMonthlyDesign/);
 assert.match(ui,/monthlyDeliverDesignId/);
 assert.match(mapper,/monthlyProgress: getMonthlyProgress/);
});

test('existing pre-upload-tracker deliveries keep their used monthly credits',()=>{
 const old={...base(10),deliveries:[
  {id:'previous_1',monthlyDesignCount:3,files:[{url:'https://example.com/a.dst'}]},
  {id:'previous_1',monthlyDesignCount:3,files:[{url:'https://example.com/a.dst'}]}
 ]};
 const info=getMonthlyProgress(old);
 assert.equal(info.uploaded,3);assert.equal(info.delivered,3);assert.equal(info.remaining,7);
 const added=prepareMonthlySubmission(old,art(4),'Next Design',null,'new_design_0001');
 assert.equal(added.progress.uploaded,4);assert.equal(added.progress.remaining,6);
});
test('monthly upload folder is signed and visible order status uses uploaded, not deliveries, as quota',()=>{
 const signature=fs.readFileSync('app/api/cloudinary/signature/route.js','utf8');
 const customer=fs.readFileSync('src/components/customer/CustomerDashboard.jsx','utf8');
 assert.match(signature,/monthly-designs/);
 assert.match(customer,/monthlyProgress\.uploaded/);
});
