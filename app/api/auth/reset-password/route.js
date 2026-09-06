import { NextResponse } from 'next/server';
import { createClient } from '../../../../src/lib/supabase/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, code, tokenHash, accessToken } = body;

    if (!password || password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 6 characters long.' 
      }, { status: 400 });
    }

    const supabaseServer = await createClient();
    const supabaseAdmin = createAdminClient();

    // 1. If code was passed, exchange for session first
    if (code) {
      try {
        await supabaseServer.auth.exchangeCodeForSession(code);
      } catch (cErr) {
        console.warn('[Server Reset Password Code Exchange Notice]:', cErr?.message);
      }
    }

    // 2. If tokenHash was passed, verify OTP first
    if (tokenHash) {
      try {
        await supabaseServer.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
      } catch (tErr) {
        console.warn('[Server Reset Password TokenHash Notice]:', tErr?.message);
      }
    }

    // 3. Try updating password via current server session
    const { data: userData, error: userError } = await supabaseServer.auth.getUser();
    if (!userError && userData?.user) {
      const { error: updateErr } = await supabaseServer.auth.updateUser({ password });
      if (!updateErr) {
        return NextResponse.json({ success: true, message: 'Password updated successfully.' });
      }
    }

    // 4. If an accessToken was passed from client
    if (accessToken && supabaseAdmin) {
      const { data: tokenUser, error: tokenErr } = await supabaseAdmin.auth.getUser(accessToken);
      if (!tokenErr && tokenUser?.user) {
        const { error: adminUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(tokenUser.user.id, {
          password
        });
        if (!adminUpdateErr) {
          return NextResponse.json({ success: true, message: 'Password updated successfully.' });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Auth session expired or missing. Please request a new password reset link.'
    }, { status: 401 });

  } catch (error) {
    console.error('[Server Reset Password Error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error.' 
    }, { status: 500 });
  }
}
