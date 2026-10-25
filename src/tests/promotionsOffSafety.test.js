import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizePublicCatalog } from '../lib/catalog/normalizePublicCatalog.js';
import { getActivePromotion, getServiceDiscountPercent, calculateOrderPricing } from '../utils/promoUtils.js';

const historical = [{ id: 'old', status: 'active', discountPercent: 20, serviceDiscounts: { embroidery:20,vector:10,patch:5 }}];
const config = [
 { key:'site_settings', value:{ promotions:[{id:'old',status:'paused'}], promotionsEnabled:false, announcement:{enabled:false,text:''},service_discounts:{embroidery:0,vector:0,patch:0,enabled:false} } },
 { key:'promotions', value:historical },
 { key:'announcement', value:{ enabled:true,text:'20% OFF' } },
 { key:'service_discounts', value:{embroidery:20,vector:10,patch:5,enabled:true} },
 { key:'promoCodes', value:[{code:'SAVE20',isActive:true}] }
];
test('all site promotions are disabled by default even with stale active records',()=>{
 const publicData=normalizePublicCatalog({site_config:config});
 const settings=publicData.siteSettings;
 assert.equal(settings.promotionsEnabled,false);
 assert.equal(settings.announcement.enabled,false);
 assert.equal(settings.service_discounts.enabled,false);
 assert.equal(settings.promoCodes.every(code=>code.isActive===false),true);
 assert.deepEqual(settings.promotions,[{id:'old',status:'paused'}], 'canonical site_settings must win over stale flat config');
 assert.equal(getActivePromotion(historical,settings),null);
 assert.equal(getServiceDiscountPercent('embroidery',historical[0],settings),0);
 const quote=calculateOrderPricing({service:'embroidery',unitPrice:10,quantity:2,activePromo:historical[0],siteSettings:settings,customPromoPercent:20});
 assert.equal(quote.promoDiscountPercent,0);
 assert.equal(quote.promoDiscountAmount,0);
 assert.equal(quote.totalPrice,20);
});
test('unspecified master switch stops legacy discounts but preserves an explicitly enabled custom top message',()=>{
 const settings=normalizePublicCatalog({site_config:[{key:'promotions',value:historical},{key:'announcement',value:{enabled:true,text:'Studio hours updated'}}]}).siteSettings;
 assert.equal(settings.promotionsEnabled,false);
 assert.equal(settings.announcement.enabled,true);
 assert.equal(settings.announcement.text,'Studio hours updated');
 assert.equal(settings.service_discounts.enabled,false);
});
test('paused promotions stay paused and deletion persists after confirmation',()=>{
 const admin=fs.readFileSync('src/components/admin/PromotionsManager.jsx','utf8');
 assert.match(admin,/Turn OFF All Promotions/);
 assert.match(admin,/promotionsEnabled: false/);
 assert.match(admin,/promotions\.map\(p => \(\{ \.\.\.p, status: 'paused' \}\)\)/);
 assert.match(admin,/promoCodes: \(siteSettings\?\.promoCodes/);
 assert.match(admin,/await updateSiteSettings\(\{\s*promotions: updated/);
 assert.match(admin,/setPromotions\(updated\)/);
 assert.match(admin,/!window\.confirm\('Delete this promotion permanently\?'\)/);
 assert.doesNotMatch(admin,/Activate the first promotion with these service rates/);
 assert.doesNotMatch(admin,/Create an initial active promotion/);
});
test('top ticker visibility is independently controlled from discount campaign and pricing',()=>{
 const announcement=fs.readFileSync('src/components/public/AnnouncementBar.jsx','utf8');
 const core=fs.readFileSync('src/components/public/CoreServicesOrderSection.jsx','utf8');
 assert.match(announcement,/rawAnnouncement\?\.enabled === true/);
 assert.doesNotMatch(announcement,/siteSettings\?\.promotionsEnabled !== true/);
 assert.match(core,/getActivePromotion\(siteSettings\?\.promotions, siteSettings\)/);
});
