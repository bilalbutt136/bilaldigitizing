import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { sendWorkerApplicationReceivedEmail } from '../../../../src/lib/workerPortalEmails';

export async function POST(request) {
  try {
    const body = await request.json();
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

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanName = (name || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return NextResponse.json({ 
        error: 'Full name, email address, and password are required.' 
      }, { status: 400 });
    }

    if (cleanPass.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long.' 
      }, { status: 400 });
    }

    const adminClient = (hasServiceRole && supabaseAdmin) ? supabaseAdmin : createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 });
    }

    // Check if worker profile already exists with this email
    const { data: existingProfile } = await adminClient
      .from('worker_profiles')
      .select('id, email, status')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      const existingStatus = (existingProfile.status || '').toLowerCase();
      if (existingStatus === 'pending') {
        return NextResponse.json({ 
          error: 'Your application is currently under review. You will be notified once approved.' 
        }, { status: 409 });
      }
      if (existingStatus === 'active') {
        return NextResponse.json({ 
          error: 'An active digitizer account with this email already exists. Please log in directly.' 
        }, { status: 409 });
      }
      return NextResponse.json({ 
        error: `An application with this email already exists (Status: ${existingProfile.status}).` 
      }, { status: 409 });
    }

    // Create user in Supabase Auth
    let authUserId = null;
    try {
      const { data: authCreateData, error: authCreateErr } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPass,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          name: cleanName,
          role: 'worker',
          worker_status: 'Pending'
        }
      });

      if (authCreateErr) {
        // If user already exists in auth, check if we can retrieve their ID
        if (authCreateErr.message?.toLowerCase().includes('already') || authCreateErr.status === 422) {
          const { data: usersList } = await adminClient.auth.admin.listUsers();
          const found = usersList?.users?.find(u => u.email?.toLowerCase().trim() === cleanEmail);
          if (found) {
            authUserId = found.id;
            // Update their password and metadata
            await adminClient.auth.admin.updateUserById(found.id, {
              password: cleanPass,
              user_metadata: {
                ...found.user_metadata,
                full_name: cleanName,
                name: cleanName,
                role: 'worker',
                worker_status: 'Pending'
              }
            });
          } else {
            throw authCreateErr;
          }
        } else {
          throw authCreateErr;
        }
      } else if (authCreateData?.user) {
        authUserId = authCreateData.user.id;
      }
    } catch (authErr) {
      console.error('[Worker Register Auth Error]:', authErr);
      return NextResponse.json({ 
        error: authErr.message || 'Failed to create worker authentication credentials.' 
      }, { status: 400 });
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Could not generate worker user identifier.' }, { status: 500 });
    }

    // Insert into worker_profiles table
    const profileRecord = {
      id: authUserId,
      name: cleanName,
      email: cleanEmail,
      phone: phone || null,
      experience_years: parseInt(experience_years, 10) || 1,
      primary_software: primary_software || 'Wilcom EmbroideryStudio',
      portfolio_sample_url: portfolio_sample_url || null,
      portfolio_file_name: portfolio_file_name || null,
      bio: bio || null,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileErr } = await adminClient
      .from('worker_profiles')
      .upsert([profileRecord], { onConflict: 'id' });

    if (profileErr) {
      console.error('[Worker Profile Insert Error]:', profileErr.message);
      // Don't fail silently; ensure we retry or log clearly
    }

    // Also insert or update workers directory for immediate compatibility
    try {
      await adminClient
        .from('workers')
        .upsert([{
          id: authUserId,
          name: cleanName,
          email: cleanEmail,
          phone: phone || null,
          specialty: primary_software || 'Embroidery Digitizer',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
    } catch (wErr) {
      console.warn('[Workers Directory Upsert Notice]:', wErr.message);
    }

    // Trigger EMAIL 1: Application Received Notification via Resend
    try {
      await sendWorkerApplicationReceivedEmail({
        to: cleanEmail,
        name: cleanName
      });
    } catch (emailErr) {
      console.warn('[Worker Register Email 1 Notice]:', emailErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Your application has been received and is under review.',
      workerId: authUserId
    });
  } catch (error) {
    console.error('[Worker Register API Exception]:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
