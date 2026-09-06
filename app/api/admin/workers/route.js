import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Both Admins and Workers can view the list of workers
    if (!isAdmin && !isWorker) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();
    let workers = [];

    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) {
        workers = data;
      }
    } catch (err) {
      console.warn('workers table query fallback notice:', err?.message);
    }

    // If workers table is empty or missing, also check clients with role='worker'
    if (workers.length === 0) {
      try {
        const { data: clientWorkers } = await supabase
          .from('clients')
          .select('id, name, email, role, created_at')
          .eq('role', 'worker');

        if (clientWorkers && clientWorkers.length > 0) {
          workers = clientWorkers.map(c => ({
            id: c.id,
            name: c.name || c.email.split('@')[0],
            email: c.email,
            specialty: 'Embroidery Digitizer',
            status: 'active',
            created_at: c.created_at
          }));
        }
      } catch {}
    }

    return NextResponse.json({ success: true, workers });
  } catch (error) {
    console.error('[Admin Workers API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, payload } = body;
    const supabase = createAdminClient();

    if (action === 'createWorker') {
      const { email, name, phone, specialty } = payload;
      const cleanEmail = (email || '').toLowerCase().trim();
      const cleanName = (name || '').trim();

      if (!cleanEmail || !cleanName) {
        return NextResponse.json({ error: 'Worker name and valid email are required.' }, { status: 400 });
      }

      // Check if worker already exists
      const { data: existingWorker } = await supabase
        .from('workers')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingWorker) {
        return NextResponse.json({ error: 'A digitizer worker with this email already exists.' }, { status: 400 });
      }

      // Find user id from auth.users or clients if already registered
      let userId = null;
      try {
        const { data: authUserData } = await supabase.auth.admin.listUsers();
        const matched = authUserData?.users?.find(u => u.email?.toLowerCase().trim() === cleanEmail);
        if (matched) userId = matched.id;
      } catch {}

      const workerRecord = {
        name: cleanName,
        email: cleanEmail,
        phone: phone || null,
        specialty: specialty || 'Embroidery Digitizer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (userId) {
        workerRecord.id = userId;
      }

      const { data: newWorker, error: insertErr } = await supabase
        .from('workers')
        .insert([workerRecord])
        .select()
        .single();

      if (insertErr) throw insertErr;

      // Also set role='worker' on clients table if client record exists
      try {
        await supabase
          .from('clients')
          .update({ role: 'worker' })
          .eq('email', cleanEmail);
      } catch {}

      return NextResponse.json({ success: true, worker: newWorker });
    }

    if (action === 'updateWorkerStatus') {
      const { workerId, status } = payload;
      const { data: updatedWorker, error: updateErr } = await supabase
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', workerId)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, worker: updatedWorker });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Workers API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
