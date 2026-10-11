import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { THEME_PRESETS, isValidBrandPreset } from '../utils/themePresets.js';

function luminance(hex) {
  const c = String(hex).match(/^#([a-f0-9]{6})$/i)?.[1];
  assert.ok(c, 'expected 6-digit HEX ' + hex);
  const rgb = [0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);
  const linear=rgb.map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
  return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('8 unique premium identities with solid and gradient treatments',()=>{
  assert.equal(THEME_PRESETS.length,8);
  assert.equal(new Set(THEME_PRESETS.map(p=>p.id)).size,8);
  for(const p of THEME_PRESETS){
    assert.equal(isValidBrandPreset(p.id),true);
    assert.match(p.name,/^[a-z\s]+$/i);
    for(const mode of ['light','dark']) {
      const t=p.tokens[mode];
      for(const role of ['--color-primary','--color-secondary','--color-surface','--color-background',
        '--color-text-primary','--color-action-start','--color-action-end','--hero-bg']){
        assert.ok(t[role],p.id+' '+mode+' '+role);
      }
      assert.ok(ratio(t['--color-text-primary'],t['--color-background'])>=4.5,p.id+' '+mode+' text on background');
      assert.ok(ratio(t['--color-text-primary'],t['--color-surface'])>=4.5,p.id+' '+mode+' text on surface');
      assert.ok(ratio(t['--color-primary'],t['--color-background'])>=4.5,p.id+' '+mode+' primary on background');
      for (const point of ['--color-action-start','--color-action-end']){
        assert.ok(ratio(t[point],'#FFFFFF')>=4.5,p.id+' '+mode+' action endpoint '+point);
      }
    }
  }
});
test('admin palettes remain local previews until explicit server save',()=>{
  const gallery=fs.readFileSync('src/components/admin/settings/BrandPaletteGallery.jsx','utf8');
  const admin=fs.readFileSync('src/components/admin/settings/ThemeBrandingSettings.jsx','utf8');
  const state=fs.readFileSync('src/context/StateContext.jsx','utf8');
  const dropdown=fs.readFileSync('src/components/common/UserMenuDropdown.jsx','utf8');
  assert.match(gallery,/Apply to Website/);
  assert.match(gallery,/onSelect=\{setSelectedId\}/);
  assert.match(gallery,/themeFinish: selectedFinish/);
  assert.match(gallery,/customBrandColors: null/);
  assert.match(gallery,/await updateSiteSettings/);
  assert.match(admin,/<BrandPaletteGallery/);
  assert.match(state,/siteSettings\?\.themeFinish/);
  assert.match(state,/Could not save settings in Supabase/);
  assert.doesNotMatch(dropdown,/showThemePicker/);
});
test('server write verifies Supabase errors and forces fresh catalog on Realtime',()=>{
 const api=fs.readFileSync('app/api/admin/homepage/route.js','utf8');
 const context=fs.readFileSync('src/context/StateContext.jsx','utf8');
 const service=fs.readFileSync('src/services/supabaseService.js','utf8');
 assert.match(api,/publicSave\.error \|\| editorSave\.error/);
 assert.match(api,/!user \|\| !isAdmin/);
 assert.match(context,/fetchCatalogFromSupabase\(\{ force: true \}\)/);
 assert.match(service,/force: Boolean\(options\.force\)/);
});

test('public brand sync transmits only allowlisted colors and revalidates every page',()=>{
  const route=fs.readFileSync('app/api/brand-theme/route.js','utf8');
  const state=fs.readFileSync('src/context/StateContext.jsx','utf8');
  const save=fs.readFileSync('app/api/admin/homepage/route.js','utf8');
  assert.match(route,/withApiObservability/);
  assert.match(route,/\.eq\('key', 'site_settings'\)/);
  assert.match(route,/Cache-Control': 'no-store/);
  assert.match(route,/safeColor/);
  assert.doesNotMatch(route,/metaPixelId|notificationSoundUrl|admin_notification_email/);
  assert.match(state,/fetch\('\/api\/brand-theme'/);
  assert.match(state,/setInterval\(checkLiveBrand, 30000\)/);
  assert.match(save,/revalidateTag\('catalog', 'max'\)/);
});
