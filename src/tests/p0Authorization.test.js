import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { canAccessOfferRecord } from '../lib/offers/authorization.js';

describe('P0 Authentication & Authorization Regression Coverage', () => {
  test('offer ownership is limited to the owning customer or a verified admin', () => {
    const offer = {
      id: 'offer-1',
      client_email: 'owner@example.com',
      customer_id: 'owner-id'
    };

    assert.equal(
      canAccessOfferRecord(offer, {
        user: { id: 'owner-id', email: 'owner@example.com' },
        isAdmin: false
      }),
      true
    );

    assert.equal(
      canAccessOfferRecord(offer, {
        user: { id: 'attacker-id', email: 'attacker@example.com' },
        isAdmin: false
      }),
      false
    );

    assert.equal(
      canAccessOfferRecord(offer, {
        user: { id: 'admin-id', email: 'admin@example.com' },
        isAdmin: true
      }),
      true
    );

    assert.equal(canAccessOfferRecord(offer, { user: null, isAdmin: false }), false);
  });

  test('chat conversations require authentication and enforce ownership on mutations', () => {
    const source = fs.readFileSync('app/api/chat/conversations/route.js', 'utf8');

    assert.match(source, /if \(!user\?\.email\)/);
    assert.match(source, /canAccessConversation\(supabase, \{ user, isAdmin \}, conversationId\)/);
    assert.match(source, /Cannot create a conversation for another account/);
    assert.match(source, /if \(!isAdmin\) \{\s*return NextResponse\.json\(\{ error: 'Admin access required\.'/s);
    assert.equal(source.includes('requestedEmail || authEmail'), false);
  });

  test('offers require authentication and never trust a browser supplied fallback offer', () => {
    const source = fs.readFileSync('app/api/offers/route.js', 'utf8');

    assert.match(source, /if \(!user\?\.email\)/);
    assert.match(source, /canAccessOfferRecord/);
    assert.match(source, /query = query\.ilike\('client_email', user\.email\.toLowerCase\(\)\.trim\(\)\)/);
    assert.equal(source.includes('fallbackOffer'), false);
    assert.equal(source.includes('clientOffer'), false);
    assert.equal(source.includes('const targetOrderId = isAdmin ? (orderId || offer.order_id) : offer.order_id;'), true);
  });

  test('orders fetchAll derives customer and worker scope only from verified server identity', () => {
    const source = fs.readFileSync('app/api/orders/route.js', 'utf8');

    assert.match(source, /if \(!user\?\.email\) \{\s*return NextResponse\.json\(\{ error: 'Authentication required\.'/s);
    assert.match(source, /targetWorkerId = workerData\?\.id \|\| user\.id/);
    assert.match(source, /targetEmail = user\.email\.toLowerCase\(\)\.trim\(\)/);
    assert.equal(source.includes('effectiveUser'), false);
    assert.equal(source.includes('orderIdsParam'), false);
    assert.equal(source.includes('userIdParam'), false);
    assert.equal(source.includes("from('clients').select('email, user_id')"), false);
  });

  test('worker privilege checks never use editable user_metadata for role or status', () => {
    const login = fs.readFileSync('app/api/worker/login/route.js', 'utf8');
    const session = fs.readFileSync('app/api/worker/session/route.js', 'utf8');
    const portal = fs.readFileSync('app/(worker-portal)/portal/page.jsx', 'utf8');
    const stateContext = fs.readFileSync('src/context/StateContext.jsx', 'utf8');
    const serverAuth = fs.readFileSync('src/lib/supabase/serverAuth.js', 'utf8');
    const p0Migration = fs.readFileSync('supabase/migrations/20260929000002_p0_worker_profile_authorization_hardening.sql', 'utf8');

    for (const source of [login, session, portal, serverAuth]) {
      assert.equal(source.includes("user_metadata?.role === 'admin'"), false);
      assert.equal(source.includes('user_metadata?.worker_status'), false);
      assert.equal(source.includes('user_metadata?.status'), false);
    }

    assert.match(login, /resolveTrustedUserAccess/);
    assert.match(login, /app_metadata:/);
    assert.match(session, /getServerAuthUser/);
    assert.equal(portal.includes(".from('worker_profiles')"), false);
    assert.equal(portal.includes(".from('workers')"), false);
    assert.match(portal, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(serverAuth, /user\.app_metadata\?\.role === 'admin'/);

    assert.equal(stateContext.includes("sbUser?.user_metadata?.role === 'worker'"), false);
    assert.equal(stateContext.includes("parsed?.role === 'worker'"), false);
    assert.match(stateContext, /sbUser\?\.app_metadata\?\.role === 'worker'/);

    assert.match(p0Migration, /DROP POLICY IF EXISTS "worker_profiles_insert_all"/);
    assert.match(p0Migration, /DROP POLICY IF EXISTS "worker_profiles_update_own"/);
    assert.match(p0Migration, /REVOKE INSERT, UPDATE, DELETE ON TABLE public\.worker_profiles FROM authenticated/);
    assert.match(p0Migration, /DROP POLICY IF EXISTS "Allow public and service access to custom_offers"/);
    assert.match(p0Migration, /lower\(client_email\) = public\.current_user_email\(\)/);
    assert.match(p0Migration, /REVOKE ALL ON TABLE public\.custom_offers FROM anon/);
  });
});
