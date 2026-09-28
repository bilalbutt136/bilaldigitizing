import { NextResponse } from 'next/server';
import { createClient } from '../../../../src/lib/supabase/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { sendWorkerApplicationReceivedEmail } from '../../../../src/lib/workerPortalEmails';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkDistributedRateLimit(`worker-register:${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: rateLimit.unavailable ? 'Registration service is temporarily unavailable.' : 'Too many registration attempts. Please wait before trying again.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      email,
      password,
      phone,
      experience_years,
      primary_software,
      portfolio_sample_url,
      portfolio_file_name,
      bio
    } = body;

    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanName = String(name || '').trim().slice(0, 120);
    const cleanPass = String(password || '');

    if (!cleanName || !cleanEmail || !cleanPass) {
      return NextResponse.json({
        error: 'Full name, email address, and password are required.'
      }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (cleanPass.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long.'
      }, { status: 400 });
    }

    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();

    const { data: existingProfile, error: profileLookupError } = await adminClient
      .from('worker_profiles')
      .select('id, email, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (profileLookupError) {
      console.warn('[Worker Register] Existing profile lookup notice:', profileLookupError.message);
    }

    if (existingProfile) {
      return NextResponse.json({
        error: 'An application or worker account with this email already exists. Please sign in or contact support.'
      }, { status: 409 });
    }

    // Use the normal Supabase signup path. This never overwrites an existing
    // Auth user's password and respects the project's email-confirmation policy.
    const supabaseServer = await createClient();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
    const signUpOptions = {
      data: {
        full_name: cleanName,
        name: cleanName,
        role: 'worker_applicant',
        worker_status: 'Pending'
      }
    };
    if (siteUrl) {
      signUpOptions.emailRedirectTo = `${siteUrl}/auth/callback?next=/worker-login`;
    }

    const { data: authData, error: authErr } = await supabaseServer.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: signUpOptions
    });

    if (authErr) {
      console.warn('[Worker Register Auth Notice]:', authErr.message);
      return NextResponse.json({
        error: 'Unable to create this application. If you already have an account, please sign in instead.'
      }, { status: 400 });
    }

    const createdUser = authData?.user;
    if (!createdUser || (Array.isArray(createdUser.identities) && createdUser.identities.length === 0)) {
      // Supabase intentionally obscures duplicate-email registration details.
      // Never try to "recover" by resetting that existing user's password.
      if (authData?.session) {
        await supabaseServer.auth.signOut().catch(() => {});
      }
      return NextResponse.json({
        error: 'An account with this email already exists. Please sign in instead.'
      }, { status: 409 });
    }

    if (authData?.session) {
      // A pending worker application should not automatically become an active session.
      await supabaseServer.auth.signOut().catch(() => {});
    }

    const authUserId = createdUser.id;
    const nowIso = new Date().toISOString();

    const profileRecord = {
      id: authUserId,
      name: cleanName,
      email: cleanEmail,
      phone: phone ? String(phone).trim().slice(0, 50) : null,
      experience_years: Math.max(0, Math.min(Number.parseInt(experience_years, 10) || 1, 80)),
      primary_software: String(primary_software || 'Wilcom EmbroideryStudio').trim().slice(0, 120),
      portfolio_sample_url: portfolio_sample_url || null,
      portfolio_file_name: portfolio_file_name ? String(portfolio_file_name).slice(0, 255) : null,
      bio: bio ? String(bio).slice(0, 3000) : null,
      status: 'Pending',
      created_at: nowIso,
      updated_at: nowIso
    };

    const { error: profileErr } = await adminClient
      .from('worker_profiles')
      .insert([profileRecord]);

    if (profileErr) {
      console.error('[Worker Profile Insert Error]:', profileErr.message);
      // Roll back the newly-created Auth identity if the application record
      // could not be created, avoiding orphaned worker-applicant accounts.
      await adminClient.auth.admin.deleteUser(authUserId).catch(() => {});
      return NextResponse.json({ error: 'Unable to save worker application.' }, { status: 500 });
    }

    try {
      await adminClient
        .from('workers')
        .upsert([{
          id: authUserId,
          name: cleanName,
          email: cleanEmail,
          phone: phone ? String(phone).trim().slice(0, 50) : null,
          specialty: String(primary_software || 'Embroidery Digitizer').trim().slice(0, 120),
          status: 'pending',
          created_at: nowIso,
          updated_at: nowIso
        }], { onConflict: 'id' });
    } catch (workerDirectoryError) {
      console.warn('[Workers Directory Upsert Notice]:', workerDirectoryError?.message);
    }

    try {
      await sendWorkerApplicationReceivedEmail({
        to: cleanEmail,
        name: cleanName
      });
    } catch (emailErr) {
      console.warn('[Worker Register Email Notice]:', emailErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Your application has been received and is under review. Please verify your email if prompted.',
      workerId: authUserId
    });
  } catch (error) {
    console.error('[Worker Register API Exception]:', error);
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
