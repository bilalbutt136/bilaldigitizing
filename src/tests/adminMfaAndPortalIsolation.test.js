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

test('server-side admin privileges follow the runtime MFA policy while identity remains available for login flow', () => {
  const auth = read('src/lib/supabase/serverAuth.js');
  const profile = read('app/api/auth/profile/route.js');
  const session = read('app/api/admin/session/route.js');

  assert.match(auth, /const isAdminIdentity = Boolean\(access\?\.isAdmin\)/);
  assert.match(auth, /const mfaEnabled = isAdminIdentity \? await getAdminMfaPolicy\(\) : false/);
  assert.match(auth, /const isAdmin = isAdminIdentity && \(!mfaEnabled \|\| authLevel === 'aal2'\)/);
  assert.match(auth, /mfaRequired: isAdminIdentity && mfaEnabled && authLevel !== 'aal2'/);
  assert.match(profile, /isAdminIdentity \? 'admin'/);
  assert.match(session, /mfaEnabled: Boolean\(mfaEnabled\)/);
  assert.match(session, /mfaVerified: authLevel === 'aal2'/);
  assert.match(session, /adminAuthorized: Boolean\(isAdmin\)/);
  assert.match(session, /authLevel: authLevel \|\| 'aal1'/);
});

test('proxy makes admin and client portals mutually exclusive and protects admin routes with MFA', () => {
  const proxy = read('proxy.js');

  assert.match(proxy, /const CLIENT_PREFIXES = \['\/client', '\/client-portal'\]/);
  assert.match(proxy, /if \(isClientRoute && isAdminIdentity\)/);
  assert.match(proxy, /adminUrl\.pathname = '\/admin-portal'/);
  assert.match(proxy, /supabase\.rpc\('admin_mfa_required'\)/);
  assert.match(proxy, /const mfaEnabled = mfaPolicyResult\?\.error \? true : mfaPolicyResult\?\.data !== false/);
  assert.match(proxy, /if \(mfaEnabled\)/);
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
  assert.match(home, /shouldRenderApp \? '\/secure-admin-login\?mobile=1' : '\/admin-portal'/);
  assert.match(state, /Administrator accounts use the Admin Portal, not the Client Portal/);
  assert.match(state, /Administrator accounts cannot enter the Client Portal/);
});

test('mobile admin uses a compact operations console while desktop keeps the full portal', () => {
  const login = read('src/components/auth/SecureAdminLogin.jsx');
  const adminPortal = read('app/admin-portal/AdminPortalClient.jsx');
  const mobile = read('src/components/admin/MobileAdminConsole.jsx');
  const chat = read('src/components/admin/AdminChatInbox.jsx');

  assert.match(login, /matchMedia\('\(max-width: 900px\)'\)/);
  assert.match(login, /setMfaStage\('mobile-console'\)/);
  assert.match(login, /return <MobileAdminConsole \/>/);
  assert.match(login, /navigate\('\/admin-portal', \{ replace: true \}\)/);

  assert.match(adminPortal, /isMasterAdmin && isMobileViewport/);
  assert.match(adminPortal, /router\.replace\('\/secure-admin-login\?mobile=1'\)/);

  assert.match(mobile, /Orders, chat, alerts & deliveries only/);
  assert.match(mobile, /Full settings, CMS, staff tools and reporting stay on desktop/);
  assert.match(mobile, /AdminChatInbox compactMobile/);
  assert.match(mobile, /Open \/ Deliver/);
  assert.match(mobile, /updateOrderStatus\?\.\(order\.id, 'in_progress'/);
  assert.match(mobile, /markAllNotificationsAsRead/);
  assert.match(mobile, /mobile-admin-console-active/);

  assert.match(chat, /compactMobile = false/);
  assert.match(chat, /compactMobile && activeConversationId \? 'none' : 'flex'/);
  assert.match(chat, /Back to conversations/);
});

test('admin sessions enforce idle reauthentication and database RLS follows the MFA policy', () => {
  const adminPortal = read('app/admin-portal/AdminPortalClient.jsx');
  const settings = read('src/components/admin/settings/AdminSecuritySettings.jsx');
  const migration = read('supabase/migrations/20261001000007_admin_mfa_hardening.sql');
  const policyMigration = read('supabase/migrations/20261002000001_admin_mfa_policy_toggle.sql');

  assert.match(adminPortal, /ADMIN_ACTIVITY_KEY/);
  assert.match(adminPortal, /parseAdminIdleTimeout/);
  assert.match(adminPortal, /router\.replace\('\/secure-admin-login\?reason=idle'\)/);
  assert.match(adminPortal, /window\.setInterval\(checkIdle, 30_000\)/);
  assert.match(settings, /sessionTimeout \|\| '30m'/);

  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.is_admin_identity\(\)/);
  assert.match(migration, /coalesce\(auth\.jwt\(\) ->> 'aal', 'aal1'\) <> 'aal2'/);
  assert.match(migration, /WITH CHECK \(public\.is_admin\(\)\)/);
  assert.match(policyMigration, /CREATE TABLE IF NOT EXISTS public\.admin_security_settings/);
  assert.match(policyMigration, /CREATE OR REPLACE FUNCTION public\.admin_mfa_required\(\)/);
  assert.match(policyMigration, /IF public\.admin_mfa_required\(\)/);
});

test('admin security settings expose an MFA on-off switch backed by the protected policy API', () => {
  const settings = read('src/components/admin/settings/AdminSecuritySettings.jsx');
  const service = read('src/services/adminMfaService.js');
  const route = read('app/api/admin/mfa-policy/route.js');
  const login = read('src/components/auth/SecureAdminLogin.jsx');

  assert.match(settings, /Two-Factor Authentication \(2FA\)/);
  assert.match(settings, /aria-label="Require two-factor authentication for administrators"/);
  assert.match(settings, /updateAdminMfaPolicy\(mfaEnabled\)/);
  assert.match(service, /export async function getAdminMfaPolicy/);
  assert.match(service, /export async function updateAdminMfaPolicy/);
  assert.match(route, /Complete two-factor verification before disabling MFA/);
  assert.match(route, /admin_security_settings/);
  assert.match(login, /policy\.success && policy\.enabled === false/);
});
