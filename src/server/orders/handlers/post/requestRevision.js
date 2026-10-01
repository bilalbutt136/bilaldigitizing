import { NextResponse } from 'next/server';

export async function handleRequestRevision(context) {
  const { payload, supabase, user, isAdmin } = context;
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

      // Revision requests use dedicated order notifications. Do not create
      // or increment Inbox conversations unless an actual chat message is sent.


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

      const revBroadcast = { ...orderData, status: 'revision', id: canonicalOrderId };
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: revBroadcast
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: revBroadcast, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.revision_broadcast_failed' }); }

      return NextResponse.json({ success: true, order: revBroadcast }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
