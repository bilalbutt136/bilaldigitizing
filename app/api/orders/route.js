import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');
    const supabase = createAdminClient();
    
    const { user, isAdmin } = await getServerAuthUser(request);

    if (action === 'fetchAll') {
      const emailParam = searchParams.get('email');
      const orderIdsParam = searchParams.get('orderIds');
      const targetEmail = (user?.email || emailParam || '').toLowerCase().trim();

      if (!isAdmin && !targetEmail && !orderIdsParam) {
        return NextResponse.json({ orders: [] });
      }
      
      let data = null;
      try {
        let query = supabase.from('orders').select('*, order_files(*), order_messages(*)').order('created_at', { ascending: false });
        if (!isAdmin) {
          if (targetEmail) {
            query = query.ilike('client_email', targetEmail);
          } else if (orderIdsParam) {
            const idList = orderIdsParam.split(',').map(id => id.trim()).filter(Boolean);
            if (idList.length > 0) {
              query = query.in('id', idList);
            } else {
              return NextResponse.json({ orders: [] });
            }
          }
        }
        const res = await query;
        if (res.error) throw res.error;
        data = res.data;
      } catch (nestedErr) {
        console.warn('Nested orders query fallback notice:', nestedErr);
        let fallbackQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!isAdmin) {
          if (targetEmail) {
            fallbackQuery = fallbackQuery.ilike('client_email', targetEmail);
          } else if (orderIdsParam) {
            const idList = orderIdsParam.split(',').map(id => id.trim()).filter(Boolean);
            if (idList.length > 0) {
              fallbackQuery = fallbackQuery.in('id', idList);
            } else {
              return NextResponse.json({ orders: [] });
            }
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
      const { data, error } = await supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ orders: data });
    }

    if (action === 'fetchDetails') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', orderId).single();
        if (orderError || orderData?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const [
        { data: orderFiles },
        { data: revisions },
        { data: messages }
      ] = await Promise.all([
        supabase.from('order_files').select('*').eq('order_id', orderId),
        supabase.from('revisions').select('*').eq('order_id', orderId),
        supabase.from('order_messages').select('*').eq('order_id', orderId)
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

      const updatePayload = { status: newStatus || 'in_progress', updated_at: new Date().toISOString() };
      
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

      const payStatus = extraData?.paymentStatus || extraData?.payment_status || (newStatus === 'in_progress' ? 'paid' : null);
      if (payStatus) {
        updatePayload.payment_status = payStatus;
        if (payStatus === 'paid') {
          updatePayload.paid_at = new Date().toISOString();
        }
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
        .select('client_email, client_name, title, type, service_category')
        .eq('id', payload.order_id)
        .maybeSingle();

      if (!isAdmin) {
        if (orderError || !orderData || orderData?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const nowIso = new Date().toISOString();
      const clientEmail = (orderData?.client_email || user.email).toLowerCase().trim();
      const clientName = orderData?.client_name || user.user_metadata?.full_name || 'Client';
      const orderTitle = orderData?.title || payload.order_title || `Order #${payload.order_id}`;

      const safeMessagePayload = {
        order_id: payload.order_id,
        sender_name: isAdmin ? (payload.sender_name || 'Support') : (user.user_metadata?.full_name || payload.sender_name || clientName),
        sender_role: isAdmin ? 'admin' : 'client',
        is_staff: isAdmin,
        message: payload.message || '',
        attachment: payload.attachment || null,
        is_read: false,
        created_at: nowIso
      };

      const { error } = await supabase.from('order_messages').insert([safeMessagePayload]);
      if (error) throw error;

      // Mirror to messages & conversations for unified real-time chat sync
      try {
        const convId = `order-${payload.order_id}`;
        const { data: existingConv } = await supabase.from('conversations').select('admin_unread_count, client_unread_count, unread_count').eq('id', convId).maybeSingle();

        const newAdminUnread = isAdmin ? 0 : (existingConv?.admin_unread_count || existingConv?.unread_count || 0) + 1;
        const newClientUnread = isAdmin ? (existingConv?.client_unread_count || 0) + 1 : 0;

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
          updated_at: nowIso
        }, { onConflict: 'id' });

        await supabase.from('messages').insert({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          conversation_id: convId,
          sender: isAdmin ? 'admin' : 'client',
          sender_name: safeMessagePayload.sender_name,
          text: safeMessagePayload.message,
          attachment: safeMessagePayload.attachment,
          is_read: false,
          timestamp: nowIso,
          created_at: nowIso
        });
      } catch (convErr) {
        console.warn('Mirror order message to chat notice:', convErr);
      }

      return NextResponse.json({ success: true });
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Orders API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
