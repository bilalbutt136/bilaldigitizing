import { NextResponse } from 'next/server';

export async function handleUpdateStatus(context) {
  const { payload, supabase, user, isAdmin } = context;
      const { orderId, newStatus, extraData } = payload;
      const rawId = String(orderId || '').trim();
      const cleanId = rawId.replace(/^#+/, '');
      const withHash = `#${cleanId}`;
      const candidateIds = Array.from(new Set([rawId, cleanId, withHash])).filter(Boolean);

      let targetOrder = null;
      const { data: byIn } = await supabase
        .from('orders')
        .select('id, title, client_name, client_email, service_category, service_type, price, status, payment_status, notes, output_file_url, worker_file_url, user_id, created_at, updated_at')
        .in('id', candidateIds)
        .maybeSingle();

      if (byIn) {
        targetOrder = byIn;
      } else if (cleanId.length >= 3) {
        const { data: byIlike } = await supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, price, status, payment_status, notes, output_file_url, worker_file_url, user_id, created_at, updated_at')
          .ilike('id', `%${cleanId}%`)
          .maybeSingle();
        if (byIlike) targetOrder = byIlike;
      }

      if (!isAdmin) {
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const clientEmailMatch = (targetOrder?.client_email || '').toLowerCase().trim() === (user.email || '').toLowerCase().trim();
        const clientUserMatch = targetOrder?.user_id && targetOrder.user_id === user.id;
        if (targetOrder && !clientEmailMatch && !clientUserMatch) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Security check: non-admin clients can only perform legitimate client lifecycle actions
        const allowedClientTransitions = ['completed', 'revision', 'revision_requested', 'cancellation_requested', 'cancelled', 'in_progress'];
        if (newStatus && !allowedClientTransitions.includes(newStatus)) {
          return NextResponse.json({ error: 'Unauthorized status transition.' }, { status: 403 });
        }
      }

      // Update payment_status when admin sets it or when client checkout confirms payment
      let payStatus = null;
      if (isAdmin) {
        payStatus = extraData?.paymentStatus || extraData?.payment_status || (newStatus === 'in_progress' ? 'paid' : null);
      } else if (extraData?.paymentStatus === 'paid' || extraData?.payment_status === 'paid' || targetOrder?.payment_status === 'paid') {
        payStatus = 'paid';
      }

      let resolvedStatus = newStatus || targetOrder?.status || 'in_progress';
      // Never regress delivered or completed orders back to in_progress due to payment status
      if (targetOrder?.status === 'delivered' || targetOrder?.status === 'completed') {
        if (!newStatus || newStatus === 'in_progress') {
          resolvedStatus = targetOrder.status;
        }
      } else if (payStatus === 'paid' && (resolvedStatus === 'awaiting_payment' || resolvedStatus === 'pending_payment' || resolvedStatus === 'submitted' || !resolvedStatus)) {
        resolvedStatus = 'in_progress';
      }
      const updatePayload = { status: resolvedStatus, updated_at: new Date().toISOString() };
      if (payStatus === 'paid') {
        updatePayload.payment_status = 'paid';
        if (!targetOrder?.paid_at) {
          updatePayload.paid_at = new Date().toISOString();
        }
      }

      if (extraData?.deliveryNotes || extraData?.deliveryMessage || extraData?.deliveries || extraData?.uploadedMachineFiles) {
        let existingNotes = {};
        try {
          if (targetOrder?.notes) {
            existingNotes = typeof targetOrder.notes === 'string' ? JSON.parse(targetOrder.notes) : (targetOrder.notes || {});
          }
        } catch {
          existingNotes = { notes: targetOrder?.notes || '' };
        }

        // Non-destructive deep merge: PRESERVE ALL client order specifications & artwork
        const mergedNotes = {
          ...existingNotes,
          notes: existingNotes.notes !== undefined ? existingNotes.notes : (existingNotes.instructions || ''),
          patchStyle: existingNotes.patchStyle || existingNotes.style || null,
          patchBacking: existingNotes.patchBacking || existingNotes.backing || null,
          patchBorderStyle: existingNotes.patchBorderStyle || existingNotes.borderStyle || null,
          patchWidth: existingNotes.patchWidth || existingNotes.width || null,
          patchHeight: existingNotes.patchHeight || existingNotes.height || null,
          patchQuantity: existingNotes.patchQuantity || existingNotes.quantity || null,
          patchItems: Array.isArray(existingNotes.patchItems) ? existingNotes.patchItems : [],
          placementItems: Array.isArray(existingNotes.placementItems) ? existingNotes.placementItems : [],
          uploadedFiles: Array.isArray(existingNotes.uploadedFiles) ? existingNotes.uploadedFiles : []
        };

        if (extraData.deliveryNotes || extraData.deliveryMessage) {
          mergedNotes.deliveryNotes = extraData.deliveryNotes || extraData.deliveryMessage;
        }
        if (extraData.deliveries && Array.isArray(extraData.deliveries)) {
          mergedNotes.deliveries = extraData.deliveries;
        } else if (existingNotes.deliveries && Array.isArray(existingNotes.deliveries)) {
          mergedNotes.deliveries = existingNotes.deliveries;
        }
        if (extraData.uploadedMachineFiles && Array.isArray(extraData.uploadedMachineFiles)) {
          mergedNotes.uploadedMachineFiles = extraData.uploadedMachineFiles;
        } else if (existingNotes.uploadedMachineFiles && Array.isArray(existingNotes.uploadedMachineFiles)) {
          mergedNotes.uploadedMachineFiles = existingNotes.uploadedMachineFiles;
        }
        mergedNotes.deliveryDate = new Date().toISOString();
        updatePayload.notes = JSON.stringify(mergedNotes);
      }

      if (extraData?.outputFileUrl || extraData?.output_file_url) {
        updatePayload.output_file_url = extraData.outputFileUrl || extraData.output_file_url;
      }
      if (extraData?.workerFileUrl || extraData?.worker_file_url) {
        updatePayload.worker_file_url = extraData.workerFileUrl || extraData.worker_file_url;
      }

      if (payStatus) {
        updatePayload.payment_status = payStatus;
      }

      const resolvedId = targetOrder?.id || rawId;
      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .in('id', Array.from(new Set([resolvedId, ...candidateIds])));

      if (error) throw error;

      // Process uploaded machine files & deliveries files for delivery
      const allDeliveryFiles = [
        ...(Array.isArray(extraData?.uploadedMachineFiles) ? extraData.uploadedMachineFiles : []),
        ...(Array.isArray(extraData?.deliveries) ? extraData.deliveries.flatMap(d => Array.isArray(d?.files) ? d.files : (d?.fileUrl || d?.url ? [d] : [])) : [])
      ];

      if (allDeliveryFiles.length > 0) {
        const resolvedOrderId = targetOrder?.id || orderId;
        for (const file of allDeliveryFiles) {
          const fUrl = file.url || file.fileUrl || file.public_url || file.file_url;
          if (!fUrl || file.error) continue;

          const { data: existing } = await supabase
            .from('order_files')
            .select('id')
            .eq('file_url', fUrl)
            .maybeSingle();

          if (!existing) {
            await supabase.from('order_files').insert([{
              order_id: resolvedOrderId,
              file_name: file.name || file.fileName || file.file_name || 'machine_file',
              file_format: (file.format || file.file_format || (file.name || '').split('.').pop() || 'dst').toLowerCase(),
              file_type: 'machine_file',
              bucket_name: 'portfolio-images',
              file_path: file.public_id || fUrl,
              public_url: fUrl,
              file_url: fUrl,
              uploaded_by: 'admin'
            }]);
          }
        }
      }

      // ── Comprehensive status-change notifications + auto-ensure conversation ──
      try {
        const nowIso = new Date().toISOString();
        let clientEmail = (targetOrder?.client_email || extraData?.clientEmail || extraData?.client_email || '').toLowerCase().trim();
        let clientName = targetOrder?.client_name || extraData?.clientName || extraData?.client_name || '';

        // If clientEmail is still missing, lookup in clients table or auth user
        if (!clientEmail) {
          if (targetOrder?.user_id) {
            const { data: cUser } = await supabase.from('clients').select('email, full_name, name').eq('id', targetOrder.user_id).maybeSingle();
            if (cUser?.email) {
              clientEmail = cUser.email.toLowerCase().trim();
              if (!clientName) clientName = cUser.full_name || cUser.name || '';
            }
          }
          if (!clientEmail && user?.email && !isAdmin) {
            clientEmail = user.email.toLowerCase().trim();
            if (!clientName) clientName = user.user_metadata?.full_name || 'Client';
          }
        }
        if (!clientName) clientName = 'Valued Client';
        const resolvedOrderId = targetOrder?.id || rawId;
        const ordTitle = targetOrder?.title || extraData?.title || `Order #${resolvedOrderId}`;

        // Always ensure conversation thread exists
        const convId = `order-${resolvedOrderId}`;
        const { data: existingConv } = await supabase.from('conversations').select('id').eq('id', convId).maybeSingle();
        if (!existingConv) {
          await supabase.from('conversations').insert([{
            id: convId,
            order_id: resolvedOrderId,
            order_title: ordTitle,
            client_email: clientEmail,
            client_name: clientName,
            client_company: 'Studio Client',
            status: 'offline',
            unread_count: 0,
            admin_unread_count: 0,
            client_unread_count: 0,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        }

        const insertNotif = async (notif) => {
          try {
            const notifRecord = {
              id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              user_id: null,
              recipient_role: notif.recipient_role || 'client',
              recipient_email: notif.recipient_email || null,
              title: notif.title,
              message: notif.message || '',
              type: notif.type || 'info',
              link: notif.link || '/client-portal',
              order_id: resolvedOrderId,
              read: false,
              created_at: nowIso,
              updated_at: nowIso
            };

            const { data: existingNotif } = await supabase
              .from('notifications')
              .select('id')
              .eq('id', notifRecord.id)
              .maybeSingle();

            if (existingNotif) {
              return { created: false, record: existingNotif };
            }

            const { error: notifInsertError } = await supabase.from('notifications').insert([notifRecord]);
            if (notifInsertError) {
              if (notifInsertError.code === '23505') {
                return { created: false, record: notifRecord };
              }
              throw notifInsertError;
            }

            // Instant Realtime WebSocket broadcast to connected clients and admins
            try {
              const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
              await liveChannel.send({
                type: 'broadcast',
                event: 'new_notification',
                payload: notifRecord
              });
            } catch (bErr) {
              console.warn('[Realtime Notif Broadcast Notice]:', bErr?.message);
            }

            // High-urgency mobile lock-screen push notification
            try {
              const { dispatchSystemNotificationPush } = await import('../../../../lib/pushService.js');
              dispatchSystemNotificationPush({
                title: notifRecord.title,
                message: notifRecord.message || '',
                link: notifRecord.link || '/client-portal',
                orderId: resolvedOrderId,
                recipientRole: notifRecord.recipient_role || 'client',
                recipientEmail: notifRecord.recipient_email || null
              }).catch(err => console.warn('[Status Push Notice]:', err?.message));
            } catch (error) { logServerCaughtError(error, { operation: 'orders.status_push_setup_failed' }); }

            return { created: true, record: notifRecord };
          } catch (e) {
            console.warn('[insertNotif notice]:', e.message);
            return { created: false, error: e };
          }
        };

        if (newStatus === 'in_progress') {
          // Notification 2: Payment Confirmed
          await insertNotif({
            id: `notif-paid-${resolvedOrderId}-admin`,
            recipient_role: 'admin',
            title: `💳 Payment Confirmed: ${ordTitle}`,
            message: `Order from ${clientName} (${clientEmail}) is now paid and in production.`,
            type: 'success', link: `/admin-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });
          await insertNotif({
            id: `ord-paid-${resolvedOrderId}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `💳 Payment Confirmed - Order Active!`,
            message: `Payment confirmed for "${ordTitle}". Production is underway.`,
            type: 'success', link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

        } else if (newStatus === 'revision' || newStatus === 'revision_requested') {
          await insertNotif({
            id: `notif-rev-${resolvedOrderId}-admin-${Date.now()}`,
            recipient_role: 'admin',
            title: `🔄 Modification Requested: ${ordTitle}`,
            message: `${clientName} has requested modifications. Please review.`,
            type: 'warning', link: `/admin-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

        } else if (newStatus === 'delivered') {
          let targetDeliveries = [];
          try {
            if (targetOrder?.notes) {
              const parsed = typeof targetOrder.notes === 'string' ? JSON.parse(targetOrder.notes) : targetOrder.notes;
              targetDeliveries = Array.isArray(parsed?.deliveries) ? parsed.deliveries : [];
            }
          } catch {}

          const delivNum = extraData?.deliveryNumber ||
            (Array.isArray(extraData?.deliveries) && extraData.deliveries.length > 0
              ? (extraData.deliveries[0]?.deliveryNumber || extraData.deliveries.length)
              : (targetDeliveries.length > 0 ? (targetDeliveries[0]?.deliveryNumber || targetDeliveries.length) : 1));

          const delivNotifId = delivNum > 1 ? `ord-deliv-${resolvedOrderId}-v${delivNum}` : `ord-deliv-${resolvedOrderId}`;
          const delivTitle = delivNum > 1
            ? `📦 Delivery #${delivNum} Ready: ${ordTitle}`
            : `📦 Order Files Ready: ${ordTitle}`;
          const delivMsg = delivNum > 1
            ? `Updated production files (Delivery #${delivNum}) are ready for review and download.`
            : `Your production stitch files and preview documents are ready for inspection and download!`;

          // Client Order Delivered Notification
          const deliveryNotificationResult = await insertNotif({
            id: delivNotifId,
            recipient_role: 'client',
            recipient_email: clientEmail,
            title: delivTitle,
            message: delivMsg,
            type: 'success',
            link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

          // Email trigger to client: only for a newly-created delivery event.
          if (deliveryNotificationResult?.created) {
            try {
              const { sendNotificationEmail } = await import('../../../../lib/emailService.js');
              sendNotificationEmail({
                type: 'ORDER_DELIVERED',
                orderId: resolvedOrderId,
                clientEmail,
                clientName,
                serviceName: targetOrder?.service || targetOrder?.title || 'Custom Digitizing',
                deliveryMessage: extraData?.deliveryNotes || extraData?.deliveryMessage || 'Your production stitch files and preview documents are ready for download.',
                outputFileUrl: extraData?.outputFileUrl || targetOrder?.output_file_url || ''
              }).catch(e => console.warn('[Delivery Email Notice]:', e?.message));
            } catch (emErr) {
              console.warn('[Delivery Email Import Notice]:', emErr?.message);
            }
          }

        } else if (newStatus === 'completed') {
          await insertNotif({
            id: `notif-comp-${resolvedOrderId}-admin-${Date.now()}`,
            recipient_role: 'admin',
            title: `✅ Order Completed: ${ordTitle}`,
            message: `${clientName} approved the delivery. Order is now complete.`,
            type: 'success', link: `/admin-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });
        }
      } catch (notifErr) {
        console.warn('Status change notification notice:', notifErr.message);
      }

      // Fetch and broadcast the updated order so client and admin dashboards immediately sync
      let refreshedOrderRow = null;
      try {
        const { data: latestRow } = await supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)')
          .in('id', candidateIds)
          .maybeSingle();
        refreshedOrderRow = latestRow;
      } catch (fErr) {
        console.warn('Refetch updated order notice:', fErr?.message);
      }

      const broadcastPayload = refreshedOrderRow || { ...targetOrder, ...updatePayload, id: resolvedOrderId };
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: broadcastPayload
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: broadcastPayload, eventType: 'UPDATE' }
        });
      } catch (bErr) {
        console.warn('Realtime updateStatus order broadcast notice:', bErr?.message);
      }

      return NextResponse.json({ success: true, order: broadcastPayload }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
