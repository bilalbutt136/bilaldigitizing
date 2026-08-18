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
      if (!user) {
        return NextResponse.json({ orders: [] });
      }
      
      let data = null;
      try {
        let query = supabase.from('orders').select('*, order_files(*), order_messages(*)').order('created_at', { ascending: false });
        if (!isAdmin) {
          query = query.ilike('client_email', user.email.toLowerCase().trim());
        }
        const res = await query;
        if (res.error) throw res.error;
        data = res.data;
      } catch (nestedErr) {
        console.warn('Nested orders query fallback notice:', nestedErr);
        let fallbackQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!isAdmin) {
          fallbackQuery = fallbackQuery.ilike('client_email', user.email.toLowerCase().trim());
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
      return NextResponse.json({ success: true, order: insertedOrder[0] });
    }

    if (action === 'updateStatus') {
      const { orderId, newStatus, extraData } = payload;
      const rawId = String(orderId || '').trim();
      const cleanId = rawId.replace(/^#+/, '');
      const withHash = `#${cleanId}`;

      const { data: targetOrder } = await supabase
        .from('orders')
        .select('id, client_email, status, payment_status')
        .or(`id.eq."${rawId}",id.eq."${cleanId}",id.eq."${withHash}"`)
        .maybeSingle();

      if (!isAdmin) {
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (targetOrder && (targetOrder.client_email || '').toLowerCase().trim() !== (user.email || '').toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }

      const updatePayload = { status: newStatus || 'in_progress', updated_at: new Date().toISOString() };
      
      const payStatus = extraData?.paymentStatus || extraData?.payment_status || (newStatus === 'in_progress' ? 'paid' : null);
      if (payStatus) {
        updatePayload.payment_status = payStatus;
        if (payStatus === 'paid') {
          updatePayload.paid_at = new Date().toISOString();
        }
      }

      if (extraData?.outputFileUrl) {
        updatePayload.output_file_url = extraData.outputFileUrl;
      }

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .or(`id.eq."${rawId}",id.eq."${cleanId}",id.eq."${withHash}"`);

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
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', orderId).single();
        if (orderError || orderData?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      await supabase.from('revisions').insert([{ order_id: orderId, details: instructions, status: 'pending' }]);
      await supabase.from('orders').update({ status: 'revision_requested', updated_at: new Date().toISOString() }).eq('id', orderId);
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
