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
      const orderIdsParam = searchParams.get('orderIds');
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

      // Guest order ID lookup: sanitize and cap to max 10 IDs
      let parsedOrderIds = [];
      if (orderIdsParam) {
        parsedOrderIds = orderIdsParam
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length >= 3 && id.length <= 100)
          .slice(0, 10);
      }

      if (!isAdmin && !isWorker && !targetEmail && parsedOrderIds.length === 0) {
        return NextResponse.json({ orders: [] });
      }
      
      let data = null;
      try {
        let query = supabase.from('orders').select('id, title, client_name, client_email, service_category, service_type, fabric_type, requested_formats, is_rush, price, cost, status, payment_status, artwork_url, image_url, logo, user_id, worker_id, worker_status, worker_file_url, worker_file_name, worker_notes, worker_payout, worker_payout_status, admin_worker_feedback, worker_assigned_at, worker_submitted_at, worker_reviewed_at, paid_at, delivery_notes, notes, created_at, updated_at, order_files(id, file_name, file_format, file_type, public_url, file_url, uploaded_by, created_at), order_messages(id, message, sender_name, sender_role, is_staff, attachment_url, created_at)').order('created_at', { ascending: false });
        if (targetWorkerId) {
          query = query.eq('worker_id', targetWorkerId);
        } else if (targetEmail) {
          query = query.ilike('client_email', targetEmail);
        } else if (!isAdmin && parsedOrderIds.length > 0) {
          query = query.in('id', parsedOrderIds);
        }
        const res = await query;
        if (res.error) throw res.error;
        data = res.data;
      } catch (nestedErr) {
        console.warn('Nested orders query fallback notice:', nestedErr);
        let fallbackQuery = supabase.from('orders').select('id, title, client_name, client_email, service_category, service_type, is_rush, price, status, payment_status, artwork_url, image_url, worker_id, worker_status, worker_payout, worker_payout_status, notes, created_at, updated_at').order('created_at', { ascending: false });
        if (targetWorkerId) {
          fallbackQuery = fallbackQuery.eq('worker_id', targetWorkerId);
        } else if (targetEmail) {
          fallbackQuery = fallbackQuery.ilike('client_email', targetEmail);
        } else if (!isAdmin && parsedOrderIds.length > 0) {
          fallbackQuery = fallbackQuery.in('id', parsedOrderIds);
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

    if (action === 'fetchDetails') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email, worker_id').eq('id', orderId).single();
        const isClientOwner = orderData?.client_email?.toLowerCase().trim() === user.email.toLowerCase().trim();
        const isAssignedWorker = isWorker && (orderData?.worker_id === user.id || orderData?.worker_id === workerData?.id);

        if (orderError || (!isClientOwner && !isAssignedWorker)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const [
        { data: orderFiles },
        { data: revisions },
        { data: messages }
      ] = await Promise.all([
        supabase.from('order_files').select('id, file_name, file_format, file_type, public_url, file_url, file_path, uploaded_by, created_at').eq('order_id', orderId),
        supabase.from('revisions').select('id, order_id, instructions, requested_by, status, created_at').eq('order_id', orderId),
        supabase.from('order_messages').select('id, order_id, message, text, sender_name, sender_role, is_staff, attachment_url, attachments, created_at').eq('order_id', orderId)
      ]);
      return NextResponse.json({ orderFiles, revisions, messages });
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

      const { data: insertedOrder, error: orderErr } = await supabase.from('orders').insert([mappedDbRow]).select();
      if (orderErr) {
        console.error("Order Insert Error:", orderErr);
        throw orderErr;
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
            status: 'online',
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

      // Automatically create notifications in public.notifications
      try {
        const nowIso = new Date().toISOString();
        await supabase.from('notifications').insert([
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
          },
          {
            id: `notif-ord-${mappedDbRow.id}-client`,
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
          }
        ]);
      } catch (notifErr) {
        console.warn('Auto notification insert notice:', notifErr.message);
      }

      // Non-blocking asynchronous email notifications for new order
      try {
        const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
        fetch(`${siteBase}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
          })
        }).catch(err => console.warn('[Orders Route Email Dispatch Notice]:', err?.message));
      } catch (e) {
        console.warn('[Order Email Async Dispatch Error]:', e?.message);
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
        .select('id, client_email, status, payment_status, notes')
        .in('id', candidateIds)
        .maybeSingle();

      if (byIn) {
        targetOrder = byIn;
      } else if (cleanId.length >= 3) {
        const { data: byIlike } = await supabase
          .from('orders')
          .select('id, client_email, status, payment_status, notes')
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
      }

      const payStatus = extraData?.paymentStatus || extraData?.payment_status || (newStatus === 'in_progress' ? 'paid' : null);
      let resolvedStatus = newStatus || 'in_progress';
      if (payStatus === 'paid' && (resolvedStatus === 'awaiting_payment' || resolvedStatus === 'pending_payment' || resolvedStatus === 'submitted' || !resolvedStatus)) {
        resolvedStatus = 'in_progress';
      }
      const updatePayload = { status: resolvedStatus, updated_at: new Date().toISOString() };
      
      if (extraData?.deliveryNotes || extraData?.deliveryMessage) {
        let existingNotes = {};
        try {
          if (targetOrder?.notes) {
            existingNotes = typeof targetOrder.notes === 'string' ? JSON.parse(targetOrder.notes) : targetOrder.notes;
          }
        } catch {
          existingNotes = { notes: targetOrder?.notes || '' };
        }
        existingNotes.deliveryNotes = extraData.deliveryNotes || extraData.deliveryMessage;
        existingNotes.deliveryDate = new Date().toISOString();
        updatePayload.notes = JSON.stringify(existingNotes);
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
      
      // Process uploaded machine files for admin delivery
      if (extraData?.uploadedMachineFiles && Array.isArray(extraData.uploadedMachineFiles)) {
        const resolvedOrderId = targetOrder?.id || orderId;
        for (const file of extraData.uploadedMachineFiles) {
          if (!file.url || file.error) continue;
          
          const { data: existing } = await supabase
            .from('order_files')
            .select('id')
            .eq('file_url', file.url)
            .maybeSingle();
            
          if (!existing) {
            await supabase.from('order_files').insert([{
              order_id: resolvedOrderId,
              file_name: file.name || 'machine_file',
              file_format: file.format || file.name?.split('.').pop() || 'unknown',
              file_type: 'machine_file',
              bucket_name: 'portfolio-images',
              file_path: file.public_id || file.url,
              public_url: file.url,
              file_url: file.url,
              uploaded_by: 'admin'
            }]);
          }
        }
      }

      // ── Comprehensive status-change notifications + auto-ensure conversation ──
      try {
        const nowIso = new Date().toISOString();
        const clientEmail = (targetOrder?.client_email || '').toLowerCase().trim();
        const clientName = targetOrder?.client_name || 'Client';
        const resolvedOrderId = targetOrder?.id || rawId;
        const ordTitle = targetOrder?.title || `Order #${resolvedOrderId}`;

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
            status: 'online',
            unread_count: 0,
            admin_unread_count: 0,
            client_unread_count: 0,
            created_at: nowIso,
            updated_at: nowIso
          }]);
        }

        const insertNotif = async (notif) => {
          try {
            await supabase.from('notifications').insert([{
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
            }]);
          } catch (e) { console.warn('[insertNotif notice]:', e.message); }
        };

        if (newStatus === 'in_progress') {
          await insertNotif({
            id: `notif-paid-${resolvedOrderId}-admin-${Date.now()}`,
            recipient_role: 'admin',
            title: `💳 Payment Confirmed: ${ordTitle}`,
            message: `Order from ${clientName} (${clientEmail}) is now paid and in production.`,
            type: 'success', link: `/admin-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });
          await insertNotif({
            id: `notif-paid-${resolvedOrderId}-client-${Date.now()}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `✅ Payment Confirmed — Production Started!`,
            message: `Your order "${ordTitle}" is now in production. We'll notify you when files are ready.`,
            type: 'success', link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

        } else if (newStatus === 'delivered') {
          await insertNotif({
            id: `notif-deliv-${resolvedOrderId}-client-${Date.now()}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `📦 Files Ready: ${ordTitle}`,
            message: `Your production files are ready! Review and approve, or request modifications.`,
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
          await insertNotif({
            id: `notif-rev-${resolvedOrderId}-client-${Date.now()}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `🔄 Modification Request Submitted`,
            message: `Your modification request for "${ordTitle}" has been sent to our team.`,
            type: 'info', link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

        } else if (newStatus === 'completed') {
          await insertNotif({
            id: `notif-comp-${resolvedOrderId}-admin-${Date.now()}`,
            recipient_role: 'admin',
            title: `✅ Order Completed: ${ordTitle}`,
            message: `${clientName} approved the delivery. Order is now complete.`,
            type: 'success', link: `/admin-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });
          await insertNotif({
            id: `notif-comp-${resolvedOrderId}-client-${Date.now()}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `🎉 Order Complete — Thank You!`,
            message: `Your order "${ordTitle}" is complete. Download your files anytime from your portal.`,
            type: 'success', link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });

        } else if (newStatus === 'cancelled') {
          await insertNotif({
            id: `notif-cancel-${resolvedOrderId}-client-${Date.now()}`,
            recipient_role: 'client', recipient_email: clientEmail,
            title: `❌ Order Cancelled: ${ordTitle}`,
            message: `Your order has been cancelled. Contact support if you have questions.`,
            type: 'error', link: `/client-portal?tab=orders&trackOrder=${resolvedOrderId}`
          });
        }
      } catch (notifErr) {
        console.warn('Status change notification notice:', notifErr.message);
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'addMessage') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('client_email, client_name, title, type, service_category, worker_id, user_id')
        .eq('id', payload.order_id)
        .maybeSingle();

      const isAssignedWorker = Boolean(
        isWorker && (
          (orderData?.worker_id && orderData.worker_id === user.id) ||
          (orderData?.worker_id && workerData?.id && orderData.worker_id === workerData.id)
        )
      );

      const isOrderClient = Boolean(
        user.email && (
          (orderData?.client_email && orderData.client_email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
          (orderData?.user_id && orderData.user_id === user.id)
        )
      );

      if (!isAdmin && !isAssignedWorker && !isOrderClient) {
        if (orderError || !orderData) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Unauthorized: You are not assigned or owner of this order.' }, { status: 403 });
      }

      const nowIso = new Date().toISOString();
      const clientEmail = (orderData?.client_email || user.email || '').toLowerCase().trim();
      const clientName = orderData?.client_name || user.user_metadata?.full_name || 'Client';
      const orderTitle = orderData?.title || payload.order_title || `Order #${payload.order_id}`;

      const senderRole = isAdmin ? 'admin' : (isAssignedWorker ? 'worker' : 'client');
      const senderName = isAdmin 
        ? (payload.sender_name || 'Production Admin')
        : (isAssignedWorker 
            ? (payload.sender_name || workerData?.name || user.user_metadata?.full_name || 'Assigned Digitizer')
            : (payload.sender_name || user.user_metadata?.full_name || clientName)
          );

      const safeMessagePayload = {
        order_id: payload.order_id,
        sender: senderRole,
        sender_name: senderName,
        sender_role: senderRole,
        is_staff: isAdmin,
        message: payload.message || payload.text || '',
        attachment: payload.attachment || payload.attachment_name || null,
        attachment_url: payload.attachment_url || payload.attachmentUrl || null,
        attachment_name: payload.attachment_name || payload.attachmentName || null,
        attachment_size: payload.attachment_size || payload.attachmentSize || null,
        is_read: false,
        created_at: nowIso
      };

      const { data: insertedMsg, error: insertErr } = await supabase
        .from('order_messages')
        .insert([safeMessagePayload])
        .select()
        .single();
      if (insertErr) throw insertErr;

      // Mirror to messages & conversations for unified real-time chat sync
      try {
        const convId = `order-${payload.order_id}`;
        const { data: existingConv } = await supabase
          .from('conversations')
          .select('admin_unread_count, client_unread_count, unread_count')
          .eq('id', convId)
          .maybeSingle();

        const newAdminUnread = isAdmin ? 0 : ((existingConv?.admin_unread_count || 0) + 1);
        const newClientUnread = isAdmin ? ((existingConv?.client_unread_count || 0) + 1) : 0;

        await supabase.from('conversations').upsert({
          id: convId,
          order_id: payload.order_id,
          order_title: orderTitle,
          client_email: clientEmail,
          client_name: clientName,
          status: 'online',
          unread_count: newAdminUnread,
          admin_unread_count: newAdminUnread,
          client_unread_count: newClientUnread,
          last_message: safeMessagePayload.message,
          last_message_time: nowIso,
          updated_at: nowIso
        }, { onConflict: 'id' });

        await supabase.from('messages').insert({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: convId,
          thread_id: convId,
          sender: senderRole,
          sender_name: senderName,
          text: safeMessagePayload.message,
          attachment: safeMessagePayload.attachment,
          attachment_url: safeMessagePayload.attachment_url,
          attachment_name: safeMessagePayload.attachment_name,
          is_read: false,
          timestamp: nowIso,
          created_at: nowIso
        });
      } catch (convErr) {
        console.warn('Mirror order message to chat notice:', convErr);
      }

      return NextResponse.json({ success: true, message: insertedMsg || safeMessagePayload });
    }

    if (action === 'fetchOrderMessages') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const orderId = payload.orderId || payload.order_id;
      if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('client_email, user_id, worker_id')
        .eq('id', orderId)
        .maybeSingle();

      if (orderError || !orderData) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const isAssignedWorker = Boolean(
        isWorker && (
          (orderData.worker_id && orderData.worker_id === user.id) ||
          (orderData.worker_id && workerData?.id && orderData.worker_id === workerData.id)
        )
      );

      const isOrderClient = Boolean(
        user.email && (
          (orderData.client_email && orderData.client_email.toLowerCase().trim() === user.email.toLowerCase().trim()) ||
          (orderData.user_id && orderData.user_id === user.id)
        )
      );

      if (!isAdmin && !isAssignedWorker && !isOrderClient) {
        return NextResponse.json({ error: 'Unauthorized to view messages for this order' }, { status: 403 });
      }

      const { data: msgs, error: msgsErr } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (msgsErr) throw msgsErr;
      return NextResponse.json({ success: true, messages: msgs || [] });
    }
    
    if (action === 'requestRevision') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, instructions } = payload;
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, client_email, client_name, title, status')
        .eq('id', orderId)
        .maybeSingle();

      if (!isAdmin) {
        if (orderError || !orderData || orderData?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
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
      const ordTitle = orderData?.title || `Order #${orderId}`;

      // Use 'revision' as canonical status (not 'revision_requested') for UI consistency
      await supabase.from('revisions').insert([{ 
        order_id: orderId, 
        details: instructions, 
        status: 'pending',
        created_at: nowIso
      }]);
      await supabase.from('orders').update({ 
        status: 'revision', 
        updated_at: nowIso 
      }).eq('id', orderId);

      // Ensure conversation thread
      const convId = `order-${orderId}`;
      const { data: existingConv } = await supabase.from('conversations').select('id').eq('id', convId).maybeSingle();
      if (!existingConv) {
        await supabase.from('conversations').insert([{
          id: convId, order_id: orderId, order_title: ordTitle,
          client_email: clientEmail, client_name: clientName,
          client_company: 'Studio Client', status: 'online',
          unread_count: 1, admin_unread_count: 1, client_unread_count: 0,
          created_at: nowIso, updated_at: nowIso
        }]).catch(() => {});
      } else {
        // Bump admin unread
        await supabase.from('conversations').update({ admin_unread_count: (existingConv?.admin_unread_count || 0) + 1, updated_at: nowIso }).eq('id', convId).catch(() => {});
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

      // Client: submission confirmation
      try {
        await supabase.from('notifications').insert([{
          id: `notif-rev-${orderId}-client-${Date.now()}`,
          user_id: user?.id || null,
          recipient_role: 'client',
          recipient_email: clientEmail,
          title: `🔄 Modification Request Submitted`,
          message: `Your modification request for "${ordTitle}" has been sent to our digitizer team.`,
          type: 'info',
          link: `/client-portal?tab=orders&trackOrder=${orderId}`,
          order_id: orderId,
          read: false,
          created_at: nowIso,
          updated_at: nowIso
        }]);
      } catch (notifErr) {
        console.warn('Revision client notification notice:', notifErr.message);
      }

      return NextResponse.json({ success: true });
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

      // Post a message to order_messages so Admin sees submission in Discussion tab
      try {
        const fileListText = allFiles.length > 1
          ? `${allFiles.length} files submitted: ${allFiles.map(f => f.name).join(', ')}`
          : `File submitted: ${resolvedName}`;
        const submitMsgText = `✅ Production files delivered for review. ${fileListText}${notes ? `\n\nProduction notes: ${notes}` : ''}`;
        await supabase.from('order_messages').insert([{
          order_id: orderId,
          sender: 'worker',
          sender_name: 'Assigned Artist',
          sender_role: 'worker',
          is_staff: false,
          message: submitMsgText,
          is_read: false,
          created_at: nowIso
        }]);
        // Mirror to conversations unread count
        const convId = `order-${orderId}`;
        await supabase.from('conversations').upsert({
          id: convId,
          order_id: orderId,
          last_message: submitMsgText,
          last_message_time: nowIso,
          admin_unread_count: 1,
          updated_at: nowIso
        }, { onConflict: 'id' });
      } catch (msgErr) {
        console.warn('Worker submit order_messages notice:', msgErr.message);
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

        // Notify client that files are ready & worker that upload is approved
        try {
          await supabase.from('notifications').insert([
            {
              id: `notif-deliv-${orderId}-client-${Date.now()}`,
              recipient_role: 'client',
              recipient_email: targetOrder.client_email,
              title: `📦 Files Ready: ${targetOrder.title || orderId}`,
              message: `Your production files are ready! Review and download your digitized files.`,
              type: 'success',
              link: `/client-portal?tab=orders&trackOrder=${orderId}`,
              order_id: orderId,
              read: false,
              created_at: nowIso,
              updated_at: nowIso
            },
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

        // Post approval message to order Discussion thread
        try {
          await supabase.from('order_messages').insert([{
            order_id: orderId,
            sender: 'admin',
            sender_name: 'Production Manager',
            sender_role: 'admin',
            is_staff: true,
            message: '✅ Quality inspection passed. Your production files have been approved and delivered to the client. Great work!',
            is_read: false,
            created_at: nowIso
          }]);
        } catch (msgErr) {
          console.warn('Approval order_messages notice:', msgErr.message);
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

        // Post revision feedback to order_messages so worker sees it in Discussion tab
        try {
          const revMsgText = `🔄 **Revision Required**\n\n${feedbackNotes || 'Admin has requested modifications. Please review the requirements and submit updated files.'}`;
          await supabase.from('order_messages').insert([{
            order_id: orderId,
            sender: 'admin',
            sender_name: 'Production Manager',
            sender_role: 'admin',
            is_staff: true,
            message: revMsgText,
            is_read: false,
            created_at: nowIso
          }]);
          // Mirror to conversations so worker gets notification
          const convId = `order-${orderId}`;
          await supabase.from('conversations').upsert({
            id: convId,
            order_id: orderId,
            last_message: revMsgText,
            last_message_time: nowIso,
            updated_at: nowIso
          }, { onConflict: 'id' });
        } catch (msgErr) {
          console.warn('Revision order_messages notice:', msgErr.message);
        }

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
