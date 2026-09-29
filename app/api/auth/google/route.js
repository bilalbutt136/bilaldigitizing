import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';

const GOOGLE_CLIENT_ID = (
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '421520521310-7appibeh1m7cdd90iid17lsq8thlq2oc.apps.googleusercontent.com'
).trim();

async function verifyGoogleAccessToken(accessToken) {
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    { cache: 'no-store' }
  );

  if (!tokenInfoRes.ok) {
    throw new Error('Google access token is invalid or expired.');
  }

  const tokenInfo = await tokenInfoRes.json();
  const tokenAudience = String(
    tokenInfo.aud ||
    tokenInfo.audience ||
    tokenInfo.issued_to ||
    tokenInfo.azp ||
    ''
  ).trim();

  if (!tokenAudience || tokenAudience !== GOOGLE_CLIENT_ID) {
    throw new Error('Google token was not issued for this application.');
  }

  if (Number(tokenInfo.expires_in || 0) <= 0) {
    throw new Error('Google access token has expired.');
  }

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store'
  });

  if (!userInfoRes.ok) {
    throw new Error('Unable to verify Google account identity.');
  }

  const userInfo = await userInfoRes.json();
  const email = String(userInfo?.email || '').toLowerCase().trim();
  const verified = userInfo?.email_verified === true || userInfo?.verified_email === true;

  if (!email || !verified) {
    throw new Error('Google account email is missing or not verified.');
  }

  const tokenEmail = String(tokenInfo.email || '').toLowerCase().trim();
  if (tokenEmail && tokenEmail !== email) {
    throw new Error('Google token identity mismatch.');
  }

  return {
    ...userInfo,
    email
  };
}

async function POST_impl(request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkDistributedRateLimit(`google-auth:${ip}`, 20, 5 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.unavailable ? 'Authentication service is temporarily unavailable.' : 'Too many Google sign-in attempts. Please wait and try again.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { accessToken } = await request.json().catch(() => ({}));
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'A valid Google access token is required.' }, { status: 400 });
    }

    let userInfo;
    try {
      userInfo = await verifyGoogleAccessToken(accessToken.trim());
    } catch (verificationError) {
      return NextResponse.json(
        { success: false, error: verificationError.message || 'Google identity verification failed.' },
        { status: 401 }
      );
    }

    const email = userInfo.email;
    const name = String(userInfo.name || userInfo.given_name || email.split('@')[0]).trim().slice(0, 120);
    const avatarUrl = typeof userInfo.picture === 'string' ? userInfo.picture : null;

    const supabase = createAdminClient();

    let role = 'customer';
    const { data: adminRow, error: adminLookupError } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (adminLookupError) {
      console.warn('[Google Auth API] Admin lookup notice:', adminLookupError.message);
    }
    if (adminRow) role = 'admin';

    let authUserId = null;
    const { data: createdUser, error: createAuthErr } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        name,
        avatar_url: avatarUrl,
        role
      }
    });

    if (!createAuthErr && createdUser?.user) {
      authUserId = createdUser.user.id;
    } else {
      const { data: usersList, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (usersError) {
        throw new Error('Unable to resolve authenticated Google user.');
      }
      const matchedUser = usersList?.users?.find(u => String(u.email || '').toLowerCase() === email);
      if (!matchedUser) {
        throw createAuthErr || new Error('Unable to resolve authenticated Google user.');
      }
      authUserId = matchedUser.id;

      await supabase.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          ...matchedUser.user_metadata,
          full_name: name,
          name,
          avatar_url: avatarUrl || matchedUser.user_metadata?.avatar_url || null,
          role
        }
      });
    }

    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    let clientRecord = existingClient;
    if (!existingClient) {
      const { data: inserted, error: insertError } = await supabase
        .from('clients')
        .insert([{
          id: authUserId,
          name,
          email,
          role,
          avatar_url: avatarUrl,
          wallet_balance: 0,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .maybeSingle();

      if (insertError) {
        console.warn('[Google Auth API] Client insert notice:', insertError.message);
      } else if (inserted) {
        clientRecord = inserted;
      }
    } else {
      await supabase
        .from('clients')
        .update({
          avatar_url: avatarUrl || existingClient.avatar_url,
          last_login: new Date().toISOString()
        })
        .eq('email', email);
    }

    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    const tokenHash = linkData?.properties?.hashed_token || null;
    if (linkErr || !tokenHash) {
      console.error('[Google Auth API] Session link generation failed:', linkErr?.message);
      return NextResponse.json({ success: false, error: 'Unable to establish a secure application session.' }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      token_hash: tokenHash,
      user: {
        id: authUserId,
        email,
        name: clientRecord?.name || name,
        role,
        wallet_balance: Number.parseFloat(clientRecord?.wallet_balance || 0),
        avatar_url: avatarUrl || clientRecord?.avatar_url || null,
        source: 'google_oauth'
      }
    });
  } catch (error) {
    console.error('[Google Auth API POST Error]', error);
    return NextResponse.json({ error: 'Internal authentication error.' }, { status: 500 });
  }
}

export const POST = withApiObservability(POST_impl);
