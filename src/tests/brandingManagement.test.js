import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('site_branding migration creates a public-read admin-write singleton with realtime support', () => {
  const sql = read('supabase/migrations/20261001000005_site_branding.sql');

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.site_branding/);
  assert.match(sql, /id smallint PRIMARY KEY DEFAULT 1 CHECK \(id = 1\)/);
  for (const column of [
    'app_icon_url',
    'favicon_url',
    'header_logo_url',
    'footer_logo_url',
    'og_image_url',
    'theme_color',
    'updated_at'
  ]) {
    assert.equal(sql.includes(column), true, `migration must include ${column}`);
  }
  assert.match(sql, /site_branding_public_read/);
  assert.match(sql, /site_branding_admin_insert/);
  assert.match(sql, /site_branding_admin_update/);
  assert.match(sql, /TO anon, authenticated/);
  assert.match(sql, /ALTER PUBLICATION supabase_realtime ADD TABLE public\.site_branding/);
});

test('branding server cache and admin API invalidate tagged metadata safely', () => {
  const server = read('src/lib/branding/serverBranding.js');
  const route = read('app/api/admin/branding/route.js');

  assert.match(server, /unstable_cache/);
  assert.match(server, /SITE_BRANDING_TAG = 'site-branding'/);
  assert.match(server, /revalidate: 300/);

  assert.match(route, /getServerAuthUser/);
  assert.match(route, /!user \|\| !isAdmin/);
  assert.match(route, /\.from\('site_branding'\)/);
  assert.match(route, /revalidateTag\(SITE_BRANDING_TAG, 'max'\)/);
  assert.match(route, /revalidateTag\('catalog', 'max'\)/);
  assert.match(route, /revalidatePath\('\/manifest\.webmanifest'\)/);
});

test('root metadata, manifest, header, footer and client catalog all consume live branding', () => {
  const layout = read('app/layout.jsx');
  const manifest = read('app/manifest.js');
  const header = read('src/components/HeaderNav.jsx');
  const footer = read('src/components/public/Footer.jsx');
  const normalize = read('src/lib/catalog/normalizePublicCatalog.js');
  const state = read('src/context/StateContext.jsx');

  assert.match(layout, /export async function generateMetadata/);
  assert.match(layout, /manifest: '\/manifest\.webmanifest'/);
  assert.match(layout, /branding\.favicon_url/);
  assert.match(layout, /branding\.app_icon_url/);
  assert.match(layout, /branding\.og_image_url/);
  assert.match(layout, /brandingToSiteSettings/);

  assert.match(manifest, /branding\.app_icon_url/);
  assert.match(header, /siteSettings\?\.headerLogoUrl/);
  assert.match(footer, /siteSettings\?\.footerLogoUrl/);
  assert.match(normalize, /data\.site_branding/);
  assert.match(normalize, /headerLogoUrl/);
  assert.match(normalize, /footerLogoUrl/);
  assert.match(state, /'site_branding'/);
});

test('admin branding manager provides five drag/drop assets with requested production guidance', () => {
  const source = read('src/components/admin/settings/BrandingAssetManager.jsx');
  const themeSettings = read('src/components/admin/settings/ThemeBrandingSettings.jsx');

  for (const label of [
    'Mobile App / PWA Icon',
    'Browser Favicon',
    'Header Navigation Logo',
    'Footer Logo',
    'Social Share / OG Image'
  ]) {
    assert.equal(source.includes(label), true, `missing UI label: ${label}`);
  }

  assert.match(source, /512 × 512 px/);
  assert.match(source, /20% safe padding/);
  assert.match(source, /48 × 48 px or 64 × 64 px/);
  assert.match(source, /250 × 60 px/);
  assert.match(source, /1200 × 630 px/);
  assert.match(source, /onDrop=/);
  assert.match(source, /Save Changes/);
  assert.match(source, /\/api\/admin\/branding/);
  assert.match(themeSettings, /<BrandingAssetManager \/>/);
});


test('branding upload state is not overwritten by toast-triggered context rerenders', () => {
  const source = read('src/components/admin/settings/BrandingAssetManager.jsx');

  assert.match(source, /const showToastRef = useRef\(showToast\)/);
  assert.match(source, /showToastRef\.current = showToast/);
  assert.match(source, /loadBranding\(\);[\s\S]*?\}, \[\]\);/);
});

test('branding uploads forward admin auth and all branding folders are signed', () => {
  const service = read('src/services/supabaseService.js');
  const signature = read('app/api/cloudinary/signature/route.js');

  assert.match(service, /signatureAuth = await getAuthHeaders/);
  assert.match(service, /signatureHeaders\.Authorization = signatureAuth\.Authorization/);
  assert.match(service, /credentials: 'same-origin'/);
  assert.match(service, /throw lastUploadError/);

  for (const folder of [
    'branding/app-icon',
    'branding/favicon',
    'branding/header-logo',
    'branding/footer-logo',
    'branding/social-share'
  ]) {
    assert.equal(signature.includes("'" + folder + "'"), true, 'signature allowlist must include ' + folder);
  }
});
