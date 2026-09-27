import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');
    const supabase = createAdminClient();
    
    const { user, isAdmin, isWorker, workerData } = await getServerAuthUser(request);

    if (action === 'fetchAll') {
      const emailParam = searchParams.get('email');
      const clientEmailFilter = searchParams.get('clientEmail');
      const workerIdParam = searchParams.get('workerId');
      
      const configuredAdmins = [
        process.env.MASTER_ADMIN_EMAIL,
        process.env.ADMIN_EMAIL,
        process.env.NEXT_PUBLIC_ADMIN_EMAIL
      ].filter(Boolean).map(e => e.toLowerCase().trim());

      let targetEmail = null;
      let targetWorkerId = null;

      if (isAdmin) {
        // Admin sees all orders across the studio by default.
        // Optional filter by client or worker
        const requestedFilter = (clientEmailFilter || emailParam || '').toLowerCase().trim();
        const isSelfAdmin = requestedFilter && (
          (user?.email && requestedFilter === user.email.toLowerCase().trim()) ||
          configuredAdmins.includes(requestedFilter)
        );
        if (requestedFilter && !isSelfAdmin) {
          targetEmail = requestedFilter;
        }
        if (workerIdParam) {
          targetWorkerId = workerIdParam;
        }
      } else if (isWorker) {
        // Worker only sees orders assigned to their worker_id
        targetWorkerId = workerData?.id || user.id;
      } else if (user?.email) {
        targetEmail = user.email.toLowerCase().trim();
      }

      // If unauthenticated, return empty orders immediately to prevent cross-account leaks
      if (!isAdmin && !isWorker && !user) {
        return NextResponse.json({ orders: [] });
      }
      
      let data = null;
      try {
        let query = supabase.from('orders').select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)').order('created_at', { ascending: false });
        if (isAdmin) {
          if (targetWorkerId) {
            query = query.eq('worker_id', targetWorkerId);
          } else if (targetEmail) {
            query = query.ilike('client_email', targetEmail);
          }
        } else if (isWorker) {
          query = query.eq('worker_id', targetWorkerId);
        } else if (user) {
          // Authenticated customer: strictly isolate to their own user_id or email
          const safeEmail = (user.email || '').toLowerCase().trim();
          if (user.id && safeEmail) {
            query = query.or(`user_id.eq.${user.id},client_email.ilike.${safeEmail}`);
          } else if (user.id) {
            query = query.eq('user_id', user.id);
          } else if (safeEmail) {
            query = query.ilike('client_email', safeEmail);
          }
        }
        const res = await query;
        if (res.error) throw res.error;
        data = res.data;
      } catch (nestedErr) {
        console.warn('Nested orders query fallback notice:', nestedErr);
        let fallbackQuery = supabase.from('orders').select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, output_file_url, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at)').order('created_at', { ascending: false });
        if (isAdmin) {
          if (targetWorkerId) {
            fallbackQuery = fallbackQuery.eq('worker_id', targetWorkerId);
          } else if (targetEmail) {
            fallbackQuery = fallbackQuery.ilike('client_email', targetEmail);
          }
        } else if (isWorker) {
          fallbackQuery = fallbackQuery.eq('worker_id', targetWorkerId);
        } else if (user) {
          const safeEmail = (user.email || '').toLowerCase().trim();
          if (user.id && safeEmail) {
            fallbackQuery = fallbackQuery.or(`user_id.eq.${user.id},client_email.ilike.${safeEmail}`);
          } else if (user.id) {
            fallbackQuery = fallbackQuery.eq('user_id', user.id);
          } else if (safeEmail) {
            fallbackQuery = fallbackQuery.ilike('client_email', safeEmail);
          }
        }
        const fallbackRes = await fallbackQuery;
        if (fallbackRes.error) throw fallbackRes.error;
        data = fallbackRes.data;
      }

      return NextResponse.json({ orders: data || [] });
    }
    
    if (action === 'fetchPending') {
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { data, error } = await supabase.from('orders').select('id, title, client_name, client_email, service_category, price, status, payment_status, is_rush, artwork_url, image_url, notes, created_at').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ orders: data });
    }

    if (action === 'fetchOne' || action === 'fetchDetails') {
      if (!user && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const rawOrderId = String(orderId || searchParams.get('id') || '').trim();
      if (!rawOrderId) return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });

      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      // Fetch the full order row
      let orderRow = null;
      const { data: byIn } = await supabase
        .from('orders')
        .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at')
        .in('id', candidateIds)
        .maybeSingle();

      if (byIn) {
        orderRow = byIn;
      } else if (cleanOrdId.length >= 3) {
        const { data: byIlike } = await supabase
          .from('orders')
          .select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_files, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, output_file_url, notes, created_at, updated_at')
          .ilike('id', `%${cleanOrdId}%`)
          .maybeSingle();
        if (byIlike) orderRow = byIlike;
      }

      if (!orderRow) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Authorization guard
      if (!isAdmin) {
        const isClientOwner = (orderRow.client_email?.toLowerCase().trim() === user?.email?.toLowerCase().trim()) || (orderRow.user_id && orderRow.user_id === user?.id);
        const isAssignedWorker = isWorker && (orderRow.worker_id === user?.id || orderRow.worker_id === workerData?.id);
        if (!isClientOwner && !isAssignedWorker) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      // Fetch related order_files
      let orderFilesList = [];
      try {
        const { data: filesData } = await supabase
          .from('order_files')
          .select('id, file_name, file_format, file_type, public_url, file_url, file_path, uploaded_by, created_at')
          .in('order_id', Array.from(new Set([orderRow.id, ...candidateIds])));
        if (Array.isArray(filesData)) orderFilesList = filesData;
      } catch (fErr) {
        console.warn('order_files query notice:', fErr?.message);
      }

      // Fetch related revisions
      let revisionsList = [];
      try {
        const { data: revData, error: revErr } = await supabase
          .from('revisions')
          .select('*')
          .in('order_id', Array.from(new Set([orderRow.id, ...candidateIds])))
          .order('created_at', { ascending: false });
        if (!revErr && Array.isArray(revData)) {
          revisionsList = revData.map(r => ({
            ...r,
            instructions: r.instructions || r.details || r.note || r.notes || '',
            note: r.note || r.notes || r.instructions || r.details || ''
          }));
        }
      } catch (rErr) {
        console.warn('revisions query notice:', rErr?.message);
      }

      // Parse notes JSON safely and hydrate deliveries and specifications
      let parsedNotes = {};
      try {
        if (orderRow.notes) {
          parsedNotes = typeof orderRow.notes === 'string' ? JSON.parse(orderRow.notes) : orderRow.notes;
        }
      } catch {
        parsedNotes = { notes: orderRow.notes || '' };
      }

      const hydratedOrder = {
        ...orderRow,
        customerNotes: parsedNotes.notes || parsedNotes.instructions || '',
        patchStyle: parsedNotes.patchStyle || null,
        patchBacking: parsedNotes.patchBacking || null,
        patchBorderStyle: parsedNotes.patchBorderStyle || null,
        patchWidth: parsedNotes.patchWidth || null,
        patchHeight: parsedNotes.patchHeight || null,
        patchQuantity: parsedNotes.patchQuantity || null,
        patchItems: Array.isArray(parsedNotes.patchItems) ? parsedNotes.patchItems : [],
        placementItems: Array.isArray(parsedNotes.placementItems) ? parsedNotes.placementItems : [],
        clientUploadedFiles: Array.isArray(parsedNotes.uploadedFiles) ? parsedNotes.uploadedFiles : [],
        deliveries: Array.isArray(parsedNotes.deliveries) ? parsedNotes.deliveries : [],
        uploadedMachineFiles: Array.isArray(parsedNotes.uploadedMachineFiles) ? parsedNotes.uploadedMachineFiles : [],
        deliveryNotes: parsedNotes.deliveryNotes || '',
        deliveryDate: parsedNotes.deliveryDate || null,
        order_files: orderFilesList,
        orderFiles: orderFilesList,
        revisions: revisionsList
      };

      return NextResponse.json({ 
        order: hydratedOrder,
        orderFiles: orderFilesList, 
        revisions: revisionsList, 
        messages: [] 
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Orders API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload } = data;
    const supabase = createAdminClient();
    
    const { user, isAdmin } = await getServerAuthUser(request);

    if (action === 'createOrder') {
      const { primaryDbRow, orderFiles } = payload;
      const clientEmail = (user?.email || primaryDbRow.clientEmail || primaryDbRow.email || '').toLowerCase().trim();
      
      if (!clientEmail) {
        return NextResponse.json({ error: 'Client email is required to submit an order' }, { status: 400 });
      }

      // Enforce minimum 50 pieces for custom patch orders
      const orderType = String(primaryDbRow.type || primaryDbRow.serviceCategory || '').toLowerCase();
      if (orderType.includes('patch')) {
        const patchQty = parseInt(primaryDbRow.patchQuantity || primaryDbRow.quantity, 10);
        const patchItems = Array.isArray(primaryDbRow.patchItems) ? primaryDbRow.patchItems : [];
        if (patchItems.length > 0) {
          const invalidItem = patchItems.find(p => !p.quantity || parseInt(p.quantity, 10) < 50);
          if (invalidItem) {
            return NextResponse.json({ error: 'Minimum order requirement for Custom Patches is 50 pieces per item.' }, { status: 400 });
          }
        } else if (!isNaN(patchQty) && patchQty < 50) {
          return NextResponse.json({ error: 'Minimum order requirement for Custom Patches is 50 pieces.' }, { status: 400 });
        }
      }
      
      const primaryArtworkUrl = 
        primaryDbRow.artworkUrl || 
        primaryDbRow.image_url || 
        primaryDbRow.logo || 
        (orderFiles && orderFiles[0]?.public_url) || 
        (orderFiles && orderFiles[0]?.file_url) || 
        null;

      // Enforce safe status and pricing validation (recognizing wallet-paid orders)
      const inputPayStatus = String(primaryDbRow.payment_status || primaryDbRow.paymentStatus || '').toLowerCase().trim();
      const isInputPaid = inputPayStatus === 'paid' || inputPayStatus === 'completed' || inputPayStatus === 'wallet';
      const safePaymentStatus = isInputPaid ? 'paid' : (isAdmin ? (primaryDbRow.paymentStatus || 'pending') : 'pending');
      const safeStatus = isInputPaid ? 'in_progress' : (isAdmin ? (primaryDbRow.status || 'submitted') : 'submitted');

      const mappedDbRow = {
        id: primaryDbRow.id || `ord-${Date.now()}`,
        title: primaryDbRow.title || 'Service Order',
        client_name: primaryDbRow.clientName || user?.user_metadata?.full_name || 'Valued Client',
        client_email: clientEmail,
        service_category: primaryDbRow.serviceCategory || primaryDbRow.type || 'Embroidery Digitizing',
        service_type: primaryDbRow.type || 'digitizing',
        fabric_type: primaryDbRow.fabricType || null,
        requested_formats: primaryDbRow.requestedFormats || ['dst'],
        is_rush: Boolean(primaryDbRow.isRush),
        price: parseFloat(primaryDbRow.price || 15.00),
        cost: parseFloat(primaryDbRow.price || 15.00),
        status: safeStatus,
        payment_status: safePaymentStatus,
        artwork_url: primaryArtworkUrl,
        image_url: primaryArtworkUrl,
        logo: primaryArtworkUrl,
        user_id: user?.id || null,
        discount_amount: primaryDbRow.discount_amount !== undefined ? parseFloat(primaryDbRow.discount_amount || 0) : 0.00,
        applied_promo_code: primaryDbRow.applied_promo_code || primaryDbRow.promoCode || null,
        base_price: primaryDbRow.base_price !== undefined ? parseFloat(primaryDbRow.base_price || primaryDbRow.price || 0) : null,
        discount_breakdown: primaryDbRow.discount_breakdown || null,
        notes: JSON.stringify({
          notes: primaryDbRow.notes || '',
          patchStyle: primaryDbRow.patchStyle,
          patchBacking: primaryDbRow.patchBacking,
          patchBorderStyle: primaryDbRow.patchBorderStyle,
          patchWidth: primaryDbRow.patchWidth,
          patchHeight: primaryDbRow.patchHeight,
          patchQuantity: primaryDbRow.patchQuantity,
          patchItems: primaryDbRow.patchItems || [],
          placementItems: primaryDbRow.placementItems || [],
          uploadedFiles: orderFiles || []
        })
      };

      let insertedOrder = null;
      let { data: orderData, error: orderErr } = await supabase.from('orders').insert([mappedDbRow]).select();
      if (orderErr) {
        // If discount columns are not yet in the DB schema, safely fallback without them
        if (orderErr.message && (orderErr.message.includes('discount_') || orderErr.message.includes('applied_promo_') || orderErr.message.includes('base_price'))) {
          console.warn('[Orders API] Retrying order insert without discount columns:', orderErr.message);
          const { discount_amount, applied_promo_code, base_price, discount_breakdown, ...legacyDbRow } = mappedDbRow;
          const retryRes = await supabase.from('orders').insert([legacyDbRow]).select();
          if (retryRes.error) {
            console.error("Order Insert Error after retry:", retryRes.error);
            throw retryRes.error;
          }
          insertedOrder = retryRes.data;
        } else {
          console.error("Order Insert Error:", orderErr);
          throw orderErr;
        }
      } else {
        insertedOrder = orderData;
      }
      
      if (orderFiles && orderFiles.length > 0) {
        for (let file of orderFiles) {
          if (!file.file_url && !file.public_url) continue;
          try {
            await supabase.from('order_files').insert([{
              order_id: mappedDbRow.id,
              file_name: file.file_name || file.name || 'artwork_file',
              file_format: file.file_format || file.format || file.file_name?.split('.').pop() || 'png',
              file_type: 'client_artwork',
              bucket_name: file.bucket_name || 'client-uploads',
              file_path: file.file_path || file.public_url || file.file_url,
              public_url: file.public_url || file.file_url,
              file_url: file.file_url || file.public_url,
              uploaded_by: 'client'
            }]);
          } catch (fileInsertErr) {
            console.warn('order_files insert notice:', fileInsertErr);
          }
        }
      }


      // Auto-create inbox conversation thread so client always sees an entry
      try {
        const convId = `order-${mappedDbRow.id}`;
        const { data: existingConv } = await supabase.from('conversations').select('id').eq('id', convId).maybeSingle();
        if (!existingConv) {
          await supabase.from('conversations').insert([{
            id: convId,
            order_id: mappedDbRow.id,
            order_title: mappedDbRow.title,
            client_email: clientEmail,
            client_name: mappedDbRow.client_name,
            client_company: 'Studio Client',
            status: 'offline',
            unread_count: 1,
            admin_unread_count: 1,
            client_unread_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        }
      } catch (convErr) {
        console.warn('Auto-create conversation notice:', convErr.message);
      }

      // Automatically create notifications in public.notifications (Order Placed - Notification 1)
      try {
        const nowIso = new Date().toISOString();
        const isFromOffer = primaryDbRow?.source === 'custom_offer' || 
                            payload?.source === 'custom_offer' || 
                            Boolean(payload?.offerId) || 
                            Boolean(payload?.offer_id) || 
                            Boolean(primaryDbRow?.offerId) || 
                            Boolean(primaryDbRow?.offer_id) ||
                            (typeof primaryDbRow?.notes === 'string' && primaryDbRow.notes.includes('custom_offer'));

        const notifsToInsert = [
          {
            id: `notif-ord-${mappedDbRow.id}-admin`,
            user_id: user?.id || null,
            recipient_role: 'admin',
            recipient_email: null,
            title: `🚨 New Order: ${mappedDbRow.title}`,
            message: `Received from ${mappedDbRow.client_name} (${clientEmail}) — ${mappedDbRow.service_category}. Price: $${mappedDbRow.price}`,
            type: 'info',
            link: `/admin-portal?tab=orders&trackOrder=${mappedDbRow.id}`,
            order_id: mappedDbRow.id,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }
        ];

        // Only insert the "Order Placed" notification for direct orders, NOT when originating from a custom offer
        // (for custom offers, client already received the offer notification, avoiding redundant 3rd notification)
        if (!isFromOffer) {
          notifsToInsert.push({
            id: `ord-created-${mappedDbRow.id}`,
            user_id: user?.id || null,
            recipient_role: 'client',
            recipient_email: clientEmail,
            title: `🎉 Order Placed Successfully!`,
            message: `Your order "${mappedDbRow.title}" has been received. Our team will begin production shortly.`,
            type: 'success',
            link: `/client-portal?tab=orders&trackOrder=${mappedDbRow.id}`,
            order_id: mappedDbRow.id,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          });
        }

        await supabase.from('notifications').upsert(notifsToInsert, { onConflict: 'id' });

        // Broadcast to Realtime WebSocket channel so active clients and admins receive it instantly
        try {
          const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
          for (const notifItem of notifsToInsert) {
            await liveChannel.send({
              type: 'broadcast',
              event: 'new_notification',
              payload: notifItem
            });
          }
        } catch (bErr) {
          console.warn('[Realtime Order Notif Broadcast Notice]:', bErr?.message);
        }
      } catch (notifErr) {
        console.warn('Auto notification insert notice:', notifErr.message);
      }

      // Guaranteed email notifications for new order
      try {
        const { sendNotificationEmail } = await import('../../../src/lib/emailService');
        await sendNotificationEmail({
          type: 'NEW_ORDER',
          orderId: mappedDbRow.id,
          clientEmail: mappedDbRow.client_email,
          clientName: mappedDbRow.client_name,
          serviceName: mappedDbRow.service_category || mappedDbRow.title,
          amount: mappedDbRow.price,
          orderDetails: {
            ...mappedDbRow,
            dimensions: primaryDbRow?.patchWidth && primaryDbRow?.patchHeight ? `${primaryDbRow.patchWidth}" × ${primaryDbRow.patchHeight}"` : (primaryDbRow?.dimensions || 'Standard'),
            placement: primaryDbRow?.placement || primaryDbRow?.patchStyle || 'Chest / Cap',
            instructions: primaryDbRow?.notes || ''
          }
        });
      } catch (e) {
        console.warn('[Order Email Direct Dispatch Error]:', e?.message);
      }

      // High-urgency mobile lock-screen push notifications for new order
      try {
        const { dispatchOrderPush } = await import('../../../src/lib/pushService.js');
        dispatchOrderPush({
          orderId: mappedDbRow.id,
          clientName: mappedDbRow.client_name,
          serviceName: mappedDbRow.service_category || mappedDbRow.title,
          status: 'submitted',
          role: 'admin'
        }).catch(err => console.warn('[Admin Order Push Notice]:', err?.message));

        if (clientEmail) {
          dispatchOrderPush({
            orderId: mappedDbRow.id,
            clientName: mappedDbRow.client_name,
            serviceName: mappedDbRow.service_category || mappedDbRow.title,
            status: 'submitted',
            role: 'client',
            recipientEmail: clientEmail
          }).catch(err => console.warn('[Client Order Push Notice]:', err?.message));
        }
      } catch (pushErr) {
        console.warn('[Order Push Service Import Notice]:', pushErr?.message);
      }

      return NextResponse.json({ success: true, order: insertedOrder[0] });
    }

    if (action === 'updateStatus') {
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
        if (targetOrder && (targetOrder.client_email || '').toLowerCase().trim() !== (user.email || '').toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Security check: non-admin clients can only perform legitimate client lifecycle actions
        const allowedClientTransitions = ['completed', 'revision', 'revision_requested', 'cancellation_requested', 'cancelled'];
        if (newStatus && !allowedClientTransitions.includes(newStatus)) {
          const isCurrentlyPaid = targetOrder?.payment_status === 'paid';
          if (!isCurrentlyPaid && (newStatus === 'in_progress' || extraData?.paymentStatus === 'paid' || extraData?.payment_status === 'paid')) {
            return NextResponse.json({ error: 'Unauthorized status transition. Unpaid orders cannot be moved to in_progress directly.' }, { status: 403 });
          }
        }
      }

      // Only administrators can directly override payment_status via updateStatus API
      let payStatus = null;
      if (isAdmin) {
        payStatus = extraData?.paymentStatus || extraData?.payment_status || (newStatus === 'in_progress' ? 'paid' : null);
      } else if (targetOrder?.payment_status === 'paid') {
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

            await supabase.from('notifications').upsert([notifRecord], { onConflict: 'id' });

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
              const { dispatchSystemNotificationPush } = await import('../../../src/lib/pushService.js');
              dispatchSystemNotificationPush({
                title: notifRecord.title,
                message: notifRecord.message || '',
                link: notifRecord.link || '/client-portal',
                orderId: resolvedOrderId,
                recipientRole: notifRecord.recipient_role || 'client',
                recipientEmail: notifRecord.recipient_email || null
              }).catch(err => console.warn('[Status Push Notice]:', err?.message));
            } catch (pErr) {}
          } catch (e) { console.warn('[insertNotif notice]:', e.message); }
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
          await insertNotif({
            id: delivNotifId,
            recipient_role: 'client',
            recipient_email: clientEmail,
            title: delivTitle,
            message: delivMsg,
            type: 'success',
            link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

          // Email trigger to client
          try {
            const { sendNotificationEmail } = await import('../../../src/lib/emailService.js');
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

      return NextResponse.json({ success: true });
    }
    
    if (action === 'requestRevision') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, instructions } = payload;
      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);
      
      let orderData = null;
      const { data: byIn } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (byIn) {
        orderData = byIn;
      } else if (cleanOrdId.length >= 3) {
        const { data: byIlike } = await supabase
          .from('orders')
          .select('id, client_email, client_name, user_id, title, status, notes')
          .ilike('id', `%${cleanOrdId}%`)
          .maybeSingle();
        if (byIlike) orderData = byIlike;
      }

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const canonicalOrderId = orderData.id;

      if (!isAdmin) {
        const isClientOwner = (orderData?.client_email?.toLowerCase().trim() === user.email?.toLowerCase().trim()) || (orderData?.user_id && orderData.user_id === user.id);
        if (!isClientOwner) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      if (orderData?.status === 'completed') {
        return NextResponse.json({ error: 'This order has already been completed and approved. Modifications are not available on completed orders.' }, { status: 400 });
      }
      if (orderData?.status === 'cancelled') {
        return NextResponse.json({ error: 'Cannot request modifications on a cancelled order.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const clientEmail = (orderData?.client_email || user.email || '').toLowerCase().trim();
      const clientName = orderData?.client_name || user.user_metadata?.full_name || 'Client';
      const ordTitle = orderData?.title || `Order #${canonicalOrderId}`;

      // Use 'revision' as canonical status (not 'revision_requested') for UI consistency
      const revPayload = { 
        order_id: canonicalOrderId, 
        requested_by: clientName,
        note: instructions || '',
        notes: instructions || '',
        status: 'pending',
        created_at: nowIso
      };

      try {
        await supabase.from('revisions').insert([revPayload]);
      } catch (insertRevErr) {
        console.warn('Revision insert notice:', insertRevErr?.message);
      }

      let updatedNotesStr = orderData.notes;
      try {
        let notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
        const existingRevs = Array.isArray(notesObj.revisions) ? notesObj.revisions : [];
        notesObj.revisions = [
          {
            id: `rev_${Date.now()}`,
            note: instructions || '',
            notes: instructions || '',
            details: instructions || '',
            createdAt: nowIso,
            requestedBy: clientName
          },
          ...existingRevs
        ];
        updatedNotesStr = JSON.stringify(notesObj);
      } catch {}

      await supabase.from('orders').update({ 
        status: 'revision', 
        notes: updatedNotesStr,
        updated_at: nowIso 
      }).in('id', candidateIds);

      // Ensure conversation thread
      const convId = `order-${canonicalOrderId}`;
      const { data: existingConv } = await supabase.from('conversations').select('id, unread_admin_count').eq('id', convId).maybeSingle();
      if (!existingConv) {
        await supabase.from('conversations').insert([{
          id: convId, order_id: canonicalOrderId, order_title: ordTitle,
          client_email: clientEmail, client_name: clientName,
          client_company: 'Studio Client', status: 'offline',
          unread_admin_count: 1, unread_client_count: 0,
          created_at: nowIso, updated_at: nowIso
        }]).catch(() => {});
      } else {
        // Bump admin unread
        await supabase.from('conversations').update({ unread_admin_count: (existingConv?.unread_admin_count || 0) + 1, updated_at: nowIso }).eq('id', convId).catch(() => {});
      }

      // Admin: modification requested
      try {
        await supabase.from('notifications').insert([{
          id: `notif-rev-${orderId}-admin-${Date.now()}`,
          user_id: user?.id || null,
          recipient_role: 'admin',
          recipient_email: null,
          title: `🔄 Modification Requested: ${ordTitle}`,
          message: instructions ? `${clientName}: "${instructions.slice(0, 120)}"` : `${clientName} requested modifications.`,
          type: 'warning',
          link: `/admin-portal?tab=orders&trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Revision admin notification notice:', notifErr.message);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'requestCancellation') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, reason } = payload;
      const cleanReason = String(reason || '').trim();
      if (!cleanReason) {
        return NextResponse.json({ error: 'A cancellation reason is required.' }, { status: 400 });
      }

      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, payment_status, price, cost, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (!isAdmin) {
        const isClientOwner = (orderData?.client_email?.toLowerCase().trim() === user.email?.toLowerCase().trim()) || (orderData?.user_id && orderData.user_id === user.id);
        if (!isClientOwner) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const curStatus = (orderData.status || '').toLowerCase();
      if (curStatus === 'delivered' || curStatus === 'completed') {
        return NextResponse.json({ error: 'Delivered or completed orders cannot be cancelled.' }, { status: 400 });
      }
      if (curStatus === 'cancelled') {
        return NextResponse.json({ error: 'This order is already cancelled.' }, { status: 400 });
      }
      if (curStatus === 'cancellation_requested') {
        return NextResponse.json({ error: 'Cancellation request has already been submitted and is awaiting administrator review.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const clientName = orderData.client_name || user.user_metadata?.full_name || 'Client';
      const clientEmail = (orderData.client_email || user.email || '').toLowerCase().trim();
      const canonicalOrderId = orderData.id;

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancelRecord = {
        id: `cancel_${Date.now()}`,
        reason: cleanReason,
        requested_by: clientName,
        requested_by_email: clientEmail,
        requested_at: nowIso,
        status: 'pending',
        previous_status: orderData.status || 'in_progress',
        amount: parseFloat(orderData.price || orderData.cost || 0)
      };

      notesObj.cancellation = cancelRecord;
      notesObj.cancellations = [cancelRecord, ...(Array.isArray(notesObj.cancellations) ? notesObj.cancellations : [])];

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'cancellation_requested',
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', canonicalOrderId);

      if (updateErr) throw updateErr;

      // Admin Notification
      try {
        await supabase.from('notifications').insert([{
          id: `notif-cancel-${cleanOrdId}-${Date.now()}`,
          recipient_role: 'admin',
          recipient_email: null,
          title: `⚠️ Cancellation Requested: ${orderData.title || '#' + cleanOrdId}`,
          message: `${clientName} (${clientEmail}) requested cancellation for Order #${cleanOrdId}. Reason: "${cleanReason.slice(0, 120)}"`,
          type: 'warning',
          order_id: cleanOrdId,
          link: `/admin-portal?tab=orders&trackOrder=${cleanOrdId}`,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Admin cancellation notification error:', notifErr.message);
      }

      return NextResponse.json({ success: true, status: 'cancellation_requested', cancellation: cancelRecord });
    }

    if (action === 'approveCancellation') {
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      }
      const { orderId, adminNote } = payload;
      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, payment_status, price, cost, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancellation = notesObj.cancellation || {};
      
      // Idempotency check: Never allow duplicate refund or double processing
      if (cancellation.refund_issued === true) {
        return NextResponse.json({ error: 'A wallet refund has already been issued for this order cancellation.' }, { status: 400 });
      }

      const canonicalOrderId = orderData.id;
      const nowIso = new Date().toISOString();
      const pStatus = (orderData.payment_status || '').toLowerCase();
      const isPaid = pStatus === 'paid' || pStatus === 'completed' || pStatus === 'wallet';
      const refundAmount = parseFloat(orderData.price || orderData.cost || cancellation.amount || 0);

      let refundSuccess = false;
      let finalBalance = null;

      if (isPaid && refundAmount > 0) {
        const clientEmail = (orderData.client_email || '').toLowerCase().trim();
        let clientRecord = null;
        if (orderData.user_id) {
          const { data: byId } = await supabase.from('clients').select('id, email, wallet_balance, name').eq('id', orderData.user_id).maybeSingle();
          if (byId) clientRecord = byId;
        }
        if (!clientRecord && clientEmail) {
          const { data: byEmail } = await supabase.from('clients').select('id, email, wallet_balance, name').ilike('email', clientEmail).maybeSingle();
          if (byEmail) clientRecord = byEmail;
        }

        if (clientRecord) {
          const currentBal = parseFloat(clientRecord.wallet_balance || 0);
          finalBalance = parseFloat((currentBal + refundAmount).toFixed(2));
          await supabase.from('clients').update({ wallet_balance: finalBalance, updated_at: nowIso }).eq('id', clientRecord.id);

          await supabase.from('transactions').insert([{
            user_id: clientRecord.id,
            client_email: clientEmail,
            type: 'refund',
            amount: refundAmount,
            payment_method: 'Studio Wallet Refund',
            description: `Refund for Cancelled Order #${cleanOrdId} (+ $${refundAmount.toFixed(2)})`,
            created_at: nowIso
          }]);
          refundSuccess = true;
        }
      }

      cancellation.status = 'approved';
      cancellation.resolved_at = nowIso;
      cancellation.admin_note = (adminNote || '').trim();
      if (refundSuccess) {
        cancellation.refund_issued = true;
        cancellation.refund_amount = refundAmount;
        cancellation.refunded_at = nowIso;
      }
      notesObj.cancellation = cancellation;

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: isPaid ? 'refunded' : orderData.payment_status,
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', canonicalOrderId);

      if (updateErr) throw updateErr;

      // Customer Notification
      if (orderData.client_email) {
        try {
          const refundText = refundSuccess 
            ? ` $${refundAmount.toFixed(2)} has been credited to your Studio Wallet.` 
            : '';
          await supabase.from('notifications').insert([{
            id: `notif-approved-cancel-${cleanOrdId}-${Date.now()}`,
            recipient_role: 'client',
            recipient_email: orderData.client_email.toLowerCase().trim(),
            title: `✕ Order #${cleanOrdId} Cancellation Approved`,
            message: `Your cancellation request for Order #${cleanOrdId} was approved.${refundText}`,
            type: 'info',
            order_id: cleanOrdId,
            link: `/client-portal?tab=orders&trackOrder=${cleanOrdId}`,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Customer cancel notification error:', notifErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        status: 'cancelled',
        refundIssued: refundSuccess,
        refundAmount: refundSuccess ? refundAmount : 0,
        newBalance: finalBalance
      });
    }

    if (action === 'rejectCancellation') {
      if (!user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      }
      const { orderId, rejectionReason } = payload;
      const rawOrderId = String(orderId || '').trim();
      const cleanOrdId = rawOrderId.replace(/^#+/, '');
      const withHash = `#${cleanOrdId}`;
      const candidateIds = Array.from(new Set([rawOrderId, cleanOrdId, withHash])).filter(Boolean);

      const { data: orderData } = await supabase
        .from('orders')
        .select('id, client_email, client_name, user_id, title, status, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (!orderData) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      let notesObj = {};
      try {
        notesObj = typeof orderData.notes === 'string' && orderData.notes.trim().startsWith('{')
          ? JSON.parse(orderData.notes)
          : (typeof orderData.notes === 'object' && orderData.notes ? orderData.notes : {});
      } catch {
        notesObj = {};
      }

      const cancellation = notesObj.cancellation || {};
      const revertStatus = cancellation.previous_status || 'in_progress';
      const cleanRejection = String(rejectionReason || 'Cancellation request declined by studio operations. Order remains active in production.').trim();

      cancellation.status = 'rejected';
      cancellation.resolved_at = new Date().toISOString();
      cancellation.admin_rejection_reason = cleanRejection;
      notesObj.cancellation = cancellation;

      const nowIso = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: revertStatus,
          notes: JSON.stringify(notesObj),
          updated_at: nowIso
        })
        .eq('id', orderData.id);

      if (updateErr) throw updateErr;

      // Customer Notification
      if (orderData.client_email) {
        try {
          await supabase.from('notifications').insert([{
            id: `notif-rejected-cancel-${cleanOrdId}-${Date.now()}`,
            recipient_role: 'client',
            recipient_email: orderData.client_email.toLowerCase().trim(),
            title: `ℹ Cancellation Declined: Order #${cleanOrdId}`,
            message: `Your cancellation request for Order #${cleanOrdId} was declined. Reason: "${cleanRejection}". Work continues in ${revertStatus}.`,
            type: 'warning',
            order_id: cleanOrdId,
            link: `/client-portal?tab=orders&trackOrder=${cleanOrdId}`,
            read: false,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        } catch (notifErr) {
          console.warn('Customer reject notification error:', notifErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        status: revertStatus,
        rejectionReason: cleanRejection
      });
    }

    if (action === 'cancelOrder') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId } = payload;
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', orderId).single();
        if (orderError || orderData?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      const { error } = await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteOrder') {
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      const { orderId } = payload;
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'assignWorker') {
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      const { orderId, workerId, workerName, workerEmail, instructions, payoutAmount } = payload;
      
      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, client_name, client_email, notes, worker_payout, quoted_price, quoted_price_pkr')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      const nowIso = new Date().toISOString();
      const payoutVal = payoutAmount !== undefined ? (parseFloat(payoutAmount) || 0) : (targetOrder.worker_payout || 0);

      const updatePayload = {
        worker_id: workerId,
        worker_status: 'Pending_Worker_Acceptance',
        status: 'assigned',
        worker_assigned_at: nowIso,
        worker_payment_status: 'Unpaid',
        updated_at: nowIso
      };

      if (payoutVal > 0) {
        updatePayload.worker_payout = payoutVal;
        updatePayload.quoted_price_pkr = payoutVal;
        updatePayload.quoted_price = payoutVal;
      }

      if (instructions) {
        updatePayload.admin_worker_feedback = instructions;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // Dispatch notification to Worker to review and enter quote in PKR
      try {
        await supabase.from('notifications').insert([{
          id: `notif-assign-${orderId}-${Date.now()}`,
          user_id: workerId,
          recipient_role: 'worker',
          recipient_email: workerEmail || null,
          title: `🎯 New Task Assigned: ${targetOrder.title || orderId}`,
          message: instructions ? `Admin note: "${instructions.slice(0, 80)}" — Please review requirements and enter your PKR quote to accept.` : 'Please inspect the order specifications and input your quote (PKR) to accept the job.',
          type: 'info',
          link: `/worker?trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Worker assignment notification notice:', notifErr.message);
      }

      return NextResponse.json({ success: true, worker_status: 'Pending_Worker_Acceptance', worker_payout: payoutVal });
    }

    if (action === 'workerBidAndAccept') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, quotedPrice, notes } = payload;

      const { data: targetOrder, error: orderFetchErr } = await supabase
        .from('orders')
        .select('id, title, status, worker_id, client_name, client_email')
        .eq('id', orderId)
        .maybeSingle();

      if (orderFetchErr || !targetOrder) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }

      if (!isAdmin) {
        const { isWorker, workerData } = await getServerAuthUser(request);
        const currentWorkerId = workerData?.id || user.id;
        if (targetOrder.worker_id && targetOrder.worker_id !== currentWorkerId && targetOrder.worker_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden: You are not the assigned worker for this order.' }, { status: 403 });
        }
      }

      const pkrAmount = parseFloat(quotedPrice);
      if (isNaN(pkrAmount) || pkrAmount <= 0) {
        return NextResponse.json({ error: 'A valid quote in PKR (greater than 0) is required to accept this job.' }, { status: 400 });
      }

      const nowIso = new Date().toISOString();
      const updatePayload = {
        quoted_price: pkrAmount,
        quoted_price_pkr: pkrAmount,
        worker_payout: pkrAmount,
        worker_status: 'In_Progress',
        status: 'in_progress',
        worker_payment_status: 'Unpaid',
        worker_accepted_at: nowIso,
        updated_at: nowIso
      };

      if (notes) {
        updatePayload.worker_bid_notes = notes;
      }

      const { error: updateErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId);

      if (updateErr) throw updateErr;

      // Also record or update worker_earnings in pending state
      try {
        await supabase.from('worker_earnings').upsert([{
          worker_id: targetOrder.worker_id,
          order_id: orderId,
          order_number: String(targetOrder.id),
          amount: pkrAmount,
          status: 'pending',
          notes: `Accepted quote: Rs. ${pkrAmount.toLocaleString()} PKR`,
          created_at: nowIso,
          updated_at: nowIso
        }], { onConflict: 'order_id' });
      } catch (earnErr) {
        console.warn('Worker earnings upsert notice:', earnErr?.message);
      }

      // Notify Admin that worker has submitted PKR quote and accepted
      try {
        await supabase.from('notifications').insert([{
          id: `notif-bid-${orderId}-${Date.now()}`,
          recipient_role: 'admin',
          title: `⚡ Job Accepted: ${targetOrder.title || orderId}`,
          message: `Worker accepted the job with a quote of Rs. ${pkrAmount.toLocaleString()} PKR. Order is now In Progress.`,
          type: 'info',
          link: `/admin-portal?tab=orders&trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Admin notification notice:', notifErr?.message);
      }

      return NextResponse.json({ 
        success: true, 
        worker_status: 'In_Progress', 
        quoted_price_pkr: pkrAmount 
      });
    }

    if (action === 'workerSubmitUpload') {
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
        const { isWorker, workerData } = await getServerAuthUser(request);
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

      return NextResponse.json({ success: true, worker_status: 'Review Pending' });
    }

    if (action === 'adminReviewWorker') {
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
            const { dispatchSystemNotificationPush } = await import('../../../src/lib/pushService.js');
            dispatchSystemNotificationPush({
              title: `📦 Order Files Ready: ${ordTitle}`,
              message: `Your production stitch files are ready for download.`,
              link: `/client-portal?tab=orders&trackOrder=${orderId}`,
              orderId,
              recipientRole: 'client',
              recipientEmail: clientEmail
            }).catch(() => {});
          } catch {}

          // Delivery Email to client
          try {
            const { sendNotificationEmail } = await import('../../../src/lib/emailService.js');
            sendNotificationEmail({
              type: 'ORDER_DELIVERED',
              orderId,
              clientEmail,
              clientName,
              serviceName: targetOrder.service || targetOrder.title || 'Custom Digitizing',
              deliveryMessage: 'Your production stitch files are ready for inspection and download.',
              outputFileUrl: targetOrder.worker_file_url || ''
            }).catch(() => {});
          } catch {}
        } catch (clientNotifErr) {
          console.warn('[adminReviewWorker client notif error]:', clientNotifErr.message);
        }

        return NextResponse.json({ success: true, worker_status: 'Completed', status: 'delivered' });
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

        return NextResponse.json({ success: true, worker_status: 'Revisions Needed' });
      } else {
        return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Orders API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
