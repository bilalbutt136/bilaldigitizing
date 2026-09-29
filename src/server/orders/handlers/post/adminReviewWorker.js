import { NextResponse } from 'next/server';

export async function handleAdminReviewWorker(context) {
  const { payload, supabase, isAdmin } = context;
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      const { orderId, decision, feedbackNotes } = payload;

      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, worker_id, worker_file_url, worker_file_name, client_name, client_email')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      const nowIso = new Date().toISOString();

      if (decision === 'approve') {
        // Approve & Deliver to Client
        const updatePayload = {
          worker_status: 'Completed',
          worker_reviewed_at: nowIso,
          status: 'delivered',
          worker_payment_status: 'Unpaid',
          worker_payout_status: 'pending',
          updated_at: nowIso
        };

        const { error: updateErr } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', orderId);

        if (updateErr) throw updateErr;

        // Auto-insert file into order_files as machine_file for client access if not already present
        if (targetOrder.worker_file_url) {
          try {
            await supabase.from('order_files').insert([{
              order_id: orderId,
              file_name: targetOrder.worker_file_name || 'production_machine_file',
              file_format: targetOrder.worker_file_name?.split('.').pop() || 'dst',
              file_type: 'machine_file',
              bucket_name: 'worker-uploads',
              file_path: targetOrder.worker_file_url,
              public_url: targetOrder.worker_file_url,
              file_url: targetOrder.worker_file_url,
              uploaded_by: 'admin'
            }]);
          } catch (fileErr) {
            console.warn('Auto machine_file promotion notice:', fileErr.message);
          }
        }

        // Notify worker that upload is approved
        try {
          await supabase.from('notifications').insert([
            {
              id: `notif-appr-${orderId}-worker-${Date.now()}`,
              user_id: targetOrder.worker_id,
              recipient_role: 'worker',
              title: `✅ Work Approved: ${targetOrder.title || orderId}`,
              message: `Admin approved your digitizing upload. Order delivered to client!`,
              type: 'success',
              link: `/worker?trackOrder=${orderId}`,
              order_id: orderId,
              read: false,
              created_at: nowIso,
              updated_at: nowIso
            }
          ]);
        } catch (notifErr) {
          console.warn('Approval notifications notice:', notifErr.message);
        }

        // Notify client that order is delivered and production files are ready
        try {
          const clientEmail = (targetOrder.client_email || '').toLowerCase().trim();
          const clientName = targetOrder.client_name || 'Client';
          const ordTitle = targetOrder.title || `Order #${orderId}`;

          const clientNotifRecord = {
            id: `ord-deliv-${orderId}`,
            recipient_role: 'client',
            recipient_email: clientEmail,
            title: `📦 Order Files Ready: ${ordTitle}`,
            message: `Your production stitch files are ready for inspection and download!`,
            type: 'success',
            link: `/client-portal?tab=orders&trackOrder=${orderId}`,
            order_id: orderId,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          };

          await supabase.from('notifications').upsert([clientNotifRecord], { onConflict: 'id' });

          try {
            const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
            await liveChannel.send({
              type: 'broadcast',
              event: 'new_notification',
              payload: clientNotifRecord
            });
          } catch (bErr) {
            console.warn('[Realtime Notif Broadcast Notice]:', bErr?.message);
          }

          // Push notification to client mobile / web
          try {
            const { dispatchSystemNotificationPush } = await import('../../../../lib/pushService.js');
            dispatchSystemNotificationPush({
              title: `📦 Order Files Ready: ${ordTitle}`,
              message: `Your production stitch files are ready for download.`,
              link: `/client-portal?tab=orders&trackOrder=${orderId}`,
              orderId,
              recipientRole: 'client',
              recipientEmail: clientEmail
            }).catch((error) => { logServerCaughtError(error, { operation: 'orders.delivery_async_dispatch_failed' }); });
          } catch (error) { logServerCaughtError(error, { operation: 'orders.delivery_push_setup_failed' }); }

          // Delivery Email to client
          try {
            const { sendNotificationEmail } = await import('../../../../lib/emailService.js');
            sendNotificationEmail({
              type: 'ORDER_DELIVERED',
              orderId,
              clientEmail,
              clientName,
              serviceName: targetOrder.service || targetOrder.title || 'Custom Digitizing',
              deliveryMessage: 'Your production stitch files are ready for inspection and download.',
              outputFileUrl: targetOrder.worker_file_url || ''
            }).catch((error) => { logServerCaughtError(error, { operation: 'orders.delivery_async_dispatch_failed' }); });
          } catch (error) { logServerCaughtError(error, { operation: 'orders.delivery_email_setup_failed' }); }
        } catch (clientNotifErr) {
          console.warn('[adminReviewWorker client notif error]:', clientNotifErr.message);
        }

        try {
          const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
          await liveChannel.send({
            type: 'broadcast',
            event: 'order_updated',
            payload: { ...targetOrder, ...orderUpdatePayload, id: orderId }
          });
          await liveChannel.send({
            type: 'broadcast',
            event: 'order_change',
            payload: { order: { ...targetOrder, ...orderUpdatePayload, id: orderId }, eventType: 'UPDATE' }
          });
        } catch (error) { logServerCaughtError(error, { operation: 'orders.review_approved_broadcast_failed' }); }

        return NextResponse.json({ success: true, worker_status: 'Completed', status: 'delivered' }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else if (decision === 'revision') {
        // Send back for revision
        const updatePayload = {
          worker_status: 'Revisions Needed',
          admin_worker_feedback: feedbackNotes || 'Modifications requested by Admin.',
          worker_reviewed_at: nowIso,
          updated_at: nowIso
        };

        const { error: updateErr } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', orderId);

        if (updateErr) throw updateErr;

        // Notify worker
        try {
          await supabase.from('notifications').insert([{
            id: `notif-worker-rev-${orderId}-${Date.now()}`,
            user_id: targetOrder.worker_id,
            recipient_role: 'worker',
            title: `🔄 Revisions Needed: ${targetOrder.title || orderId}`,
            message: feedbackNotes ? `Admin notes: "${feedbackNotes}"` : 'Please review admin modifications and submit updated files.',
            type: 'warning',
            link: `/worker?trackOrder=${orderId}`,
            order_id: orderId,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Worker revision notification notice:', notifErr.message);
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
        } catch (error) { logServerCaughtError(error, { operation: 'orders.review_revision_broadcast_failed' }); }

        return NextResponse.json({ success: true, worker_status: 'Revisions Needed' }, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      } else {
        return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
      }
}
