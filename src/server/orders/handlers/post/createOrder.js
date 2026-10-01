import { NextResponse, after } from 'next/server';
import { logServerCaughtError } from '../../../../lib/observability/apiObservability.js';

export async function handleCreateOrder(context) {
  const { payload, supabase, user, isAdmin } = context;
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

      // Resolve valid UUID user_id referencing auth.users(id)
      const isValidUuid = typeof user?.id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
      let assignedUserId = isValidUuid ? user.id : null;
      if (!assignedUserId && clientEmail) {
        try {
          const { data: clientLookup } = await supabase.from('clients').select('user_id').ilike('email', clientEmail).maybeSingle();
          if (clientLookup?.user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientLookup.user_id)) {
            assignedUserId = clientLookup.user_id;
          }
        } catch (error) { logServerCaughtError(error, { operation: 'orders.client_identity_lookup_failed' }); }
      }

      // Generate collision-free order ID
      // Rely on the database primary-key constraint for collision detection.
      // A duplicate insert is retried below, avoiding an extra preflight SELECT on every order.
      let assignedId = primaryDbRow.id || `#${Math.floor(10000 + Math.random() * 90000)}`;

      const mappedDbRow = {
        id: assignedId,
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
        user_id: assignedUserId,
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
        // If unique constraint violation on id, retry with a fresh unique ID
        if (orderErr.code === '23505' || orderErr.message?.includes('duplicate key') || orderErr.message?.includes('orders_pkey')) {
          console.warn('[Orders API] Retrying order insert with fresh unique ID due to key collision');
          mappedDbRow.id = `#${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;
          const retryPk = await supabase.from('orders').insert([mappedDbRow]).select();
          if (!retryPk.error && retryPk.data) {
            orderErr = null;
            insertedOrder = retryPk.data;
          } else {
            orderErr = retryPk.error;
          }
        }
        // If foreign key constraint violation on user_id, retry with user_id: null
        if (orderErr && (orderErr.code === '23503' || orderErr.message?.includes('orders_user_id_fkey') || orderErr.message?.includes('foreign key'))) {
          console.warn('[Orders API] Retrying order insert with user_id: null due to foreign key mismatch');
          mappedDbRow.user_id = null;
          const retryFk = await supabase.from('orders').insert([mappedDbRow]).select();
          if (!retryFk.error && retryFk.data) {
            orderErr = null;
            insertedOrder = retryFk.data;
          } else {
            orderErr = retryFk.error;
          }
        }
      }

      if (orderErr) {
        // If discount columns are not yet in the DB schema, safely fallback without them
        if (orderErr.message && (orderErr.message.includes('discount_') || orderErr.message.includes('applied_promo_') || orderErr.message.includes('base_price'))) {
          console.warn('[Orders API] Retrying order insert without discount columns:', orderErr.message);
          const { discount_amount: _discount_amount, applied_promo_code: _applied_promo_code, base_price: _base_price, discount_breakdown: _discount_breakdown, ...legacyDbRow } = mappedDbRow;
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
      } else if (!insertedOrder) {
        insertedOrder = orderData;
      }

      if (orderFiles && orderFiles.length > 0) {
        const fileRows = orderFiles
          .filter(file => file && (file.file_url || file.public_url))
          .map(file => ({
            order_id: mappedDbRow.id,
            file_name: file.file_name || file.name || 'artwork_file',
            file_format: file.file_format || file.format || file.file_name?.split('.').pop() || 'png',
            file_type: 'client_artwork',
            bucket_name: file.bucket_name || 'client-uploads',
            file_path: file.file_path || file.public_url || file.file_url,
            public_url: file.public_url || file.file_url,
            file_url: file.file_url || file.public_url,
            uploaded_by: 'client'
          }));

        if (fileRows.length > 0) {
          const { error: fileInsertErr } = await supabase
            .from('order_files')
            .upsert(fileRows, { onConflict: 'order_id,file_type,file_url', ignoreDuplicates: true });
          if (fileInsertErr) console.warn('order_files batch upsert notice:', fileInsertErr.message);
        }
      }


      // Orders and chat are separate concerns. A direct order should create
      // order/notification records only; Inbox threads are created when someone
      // actually starts a conversation or sends a message.


      const finalOrder = (Array.isArray(insertedOrder) && insertedOrder.length > 0)
        ? insertedOrder[0]
        : (insertedOrder && typeof insertedOrder === 'object' && !Array.isArray(insertedOrder))
          ? insertedOrder
          : mappedDbRow;

      // Non-critical fan-out must not hold the order-creation response open.
      after(async () => {
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
        const { sendNotificationEmail } = await import('../../../../lib/emailService.js');
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
        const { dispatchOrderPush } = await import('../../../../lib/pushService.js');
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

      // Broadcast order_updated & order_change to Realtime WebSocket channel for instant cross-tab & dashboard sync
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: finalOrder
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: finalOrder, eventType: 'INSERT' }
        });
      } catch (bOrdErr) {
        console.warn('[Realtime Order Broadcast Notice]:', bOrdErr?.message);
      }
      });

      return NextResponse.json({ success: true, order: finalOrder }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
