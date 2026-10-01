import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('admin login requires TOTP MFA and only opens the desk at aal2', () => {
  const login = read('src/components/auth/SecureAdminLogin.jsx');
  const mfa = read('src/services/adminMfaService.js');

  assert.match(login, /prepareAdminMfa/);
  assert.match(login, /Protect Your Admin Account/);
  assert.match(login, /Two-Step Verification/);
  assert.match(login, /Enable MFA & Open Admin Desk/);
  assert.match(login, /autoComplete="one-time-code"/);
  assert.match(mfa, /mfa\.enroll/);
  assert.match(mfa, /factorType: 'totp'/);
  assert.match(mfa, /challengeAndVerify/);
  assert.match(mfa, /currentLevel !== 'aal2'/);
});

test('server-side admin privileges require aal2 while identity remains available for login flow', () => {
  const auth = read('src/lib/supabase/serverAuth.js');
  const profile = read('app/api/auth/profile/route.js');
  const session = read('app/api/admin/session/route.js');

  assert.match(auth, /const isAdminIdentity = Boolean\(access\?\.isAdmin\)/);
  assert.match(auth, /const isAdmin = isAdminIdentity && authLevel === 'aal2'/);
  assert.match(auth, /mfaRequired: isAdminIdentity && authLevel !== 'aal2'/);
  assert.match(profile, /isAdminIdentity \? 'admin'/);
  assert.match(session, /mfaVerified: Boolean\(isAdmin\)/);
  assert.match(session, /authLevel: authLevel \|\| 'aal1'/);
});

test('proxy makes admin and client portals mutually exclusive and protects admin routes with MFA', () => {
  const proxy = read('proxy.js');

  assert.match(proxy, /const CLIENT_PREFIXES = \['\/client', '\/client-portal'\]/);
  assert.match(proxy, /if \(isClientRoute && isAdminIdentity\)/);
  assert.match(proxy, /adminUrl\.pathname = '\/admin-portal'/);
  assert.match(proxy, /getAuthenticatorAssuranceLevel/);
  assert.match(proxy, /currentLevel !== 'aal2'/);
  assert.match(proxy, /mfaUrl\.pathname = '\/secure-admin-login'/);
});

test('client portal refuses administrator accounts on web and installed mobile app', () => {
  const client = read('app/client-portal/ClientPortalClient.jsx');
  const home = read('src/components/public/HomePageClient.jsx');
  const state = read('src/context/StateContext.jsx');

  assert.match(client, /const isAdminAccount = Boolean\(isAuthenticated && authUser\?\.role === 'admin'\)/);
  assert.match(client, /navigate\('\/admin-portal', \{ replace: true \}\)/);
  assert.match(client, /if \(isAdminAccount\)/);
  assert.match(home, /shouldRenderApp && isAdminAccount/);
  assert.match(home, /window\.location\.replace\('\/admin-portal'\)/);
  assert.match(state, /Administrator accounts use the Admin Portal, not the Client Portal/);
  assert.match(state, /Administrator accounts cannot enter the Client Portal/);
});

test('admin sessions enforce idle reauthentication and database RLS requires aal2', () => {
  const adminPortal = read('app/admin-portal/AdminPortalClient.jsx');
  const settings = read('src/components/admin/settings/AdminSecuritySettings.jsx');
  const migration = read('supabase/migrations/20261001000006_admin_mfa_hardening.sql');

  assert.match(adminPortal, /ADMIN_ACTIVITY_KEY/);
  assert.match(adminPortal, /parseAdminIdleTimeout/);
  assert.match(adminPortal, /router\.replace\('\/secure-admin-login\?reason=idle'\)/);
  assert.match(adminPortal, /window\.setInterval\(checkIdle, 30_000\)/);
  assert.match(settings, /sessionTimeout \|\| '30m'/);

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.is_admin_identity\(\)/);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'aal', 'aal1'\) <> 'aal2'/);
  assert.match(migration, /WITH CHECK \(public\.is_admin\(\)\)/);
});
