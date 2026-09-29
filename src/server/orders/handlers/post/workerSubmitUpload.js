import { NextResponse } from 'next/server';
import { getServerAuthUser } from '../../../../lib/supabase/serverAuth';

export async function handleWorkerSubmitUpload(context) {
  const { request, payload, supabase, user, isAdmin } = context;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, workerFileUrl, workerFileName, fileUrl: legacyFileUrl, fileName: legacyFileName, format, notes, workerFiles } = payload;

      // Support both new (workerFileUrl/workerFiles) and legacy (fileUrl/fileName) param names
      const primaryFileUrl = workerFileUrl || legacyFileUrl;
      const primaryFileName = workerFileName || legacyFileName;

      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, worker_id, client_name, client_email')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (!isAdmin) {
        const { isWorker: _isWorker, workerData } = await getServerAuthUser(request);
        const currentWorkerId = workerData?.id || user.id;
        if (targetOrder.worker_id && targetOrder.worker_id !== currentWorkerId && targetOrder.worker_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden: You are not assigned to this order.' }, { status: 403 });
        }
      }

      const nowIso = new Date().toISOString();

      // Build the full files array (new multi-file support + legacy single-file fallback)
      let allFiles = [];
      if (Array.isArray(workerFiles) && workerFiles.length > 0) {
        allFiles = workerFiles;
      } else if (primaryFileUrl) {
        allFiles = [{ url: primaryFileUrl, name: primaryFileName || (typeof primaryFileUrl === 'string' ? primaryFileUrl.split('/').pop() : 'file') }];
      }

      const resolvedName = (allFiles[0]?.name) || primaryFileName || (typeof primaryFileUrl === 'string' ? primaryFileUrl.split('/').pop() : 'digitized_stitch_file');
      const resolvedFormat = format || (resolvedName.includes('.') ? resolvedName.split('.').pop() : 'dst');

      const updatePayload = {
        worker_status: 'Review Pending',
        worker_file_url: allFiles[0]?.url || primaryFileUrl,
        worker_file_name: resolvedName,
        worker_files: allFiles,
        worker_notes: notes || '',
        worker_submitted_at: nowIso,
        updated_at: nowIso
      };

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // Insert ALL uploaded files into order_files
      try {
        const fileInserts = allFiles.map(f => ({
          order_id: orderId,
          file_name: f.name || f.url?.split('/').pop() || 'digitized_file',
          file_format: (f.name || '').split('.').pop() || resolvedFormat,
          file_type: 'worker_upload',
          bucket_name: 'worker-uploads',
          file_path: f.url,
          public_url: f.url,
          file_url: f.url,
          uploaded_by: 'worker'
        }));
        if (fileInserts.length > 0) {
          await supabase.from('order_files').insert(fileInserts);
        }
      } catch (fileErr) {
        console.warn('order_files worker upload insert notice:', fileErr.message);
      }

      // Dispatch notification to Admin
      try {
        await supabase.from('notifications').insert([{
          id: `notif-worker-sub-${orderId}-${Date.now()}`,
          recipient_role: 'admin',
          recipient_email: null,
          title: `🔍 Digitizer Files Ready for Review: ${targetOrder.title || orderId}`,
          message: `Worker uploaded ${allFiles.length} file(s) on Order #${orderId}. Ready for studio inspection.`,
          type: 'info',
          link: `/admin-portal?tab=orders&trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Worker upload admin notification notice:', notifErr.message);
      }

      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...targetOrder, ...updatePayload, id: orderId }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...targetOrder, ...updatePayload, id: orderId }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.worker_upload_broadcast_failed' }); }

      return NextResponse.json({ success: true, worker_status: 'Review Pending' }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
