import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');
    const supabase = createAdminClient();

    if (action === 'fetchAll') {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ orders: data });
    }
    
    if (action === 'fetchPending') {
      const { data, error } = await supabase.from('orders').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ orders: data });
    }

    if (action === 'fetchDetails') {
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

    if (action === 'createOrder') {
      const { primaryDbRow, orderFiles } = payload;
      
      const mappedDbRow = {
        id: primaryDbRow.id,
        title: primaryDbRow.title || 'Service Order',
        client_name: primaryDbRow.clientName || 'Valued Client',
        client_email: primaryDbRow.clientEmail || '',
        service_category: primaryDbRow.serviceCategory || primaryDbRow.type || 'Digitizing',
        service_type: primaryDbRow.type,
        fabric_type: primaryDbRow.fabricType || null,
        requested_formats: primaryDbRow.requestedFormats || ['dst'],
        is_rush: primaryDbRow.isRush || false,
        price: primaryDbRow.price || 15.00,
        notes: JSON.stringify({
          notes: primaryDbRow.notes,
          patchStyle: primaryDbRow.patchStyle,
          patchBacking: primaryDbRow.patchBacking,
          patchBorderStyle: primaryDbRow.patchBorderStyle,
          patchWidth: primaryDbRow.patchWidth,
          patchHeight: primaryDbRow.patchHeight,
          patchQuantity: primaryDbRow.patchQuantity,
          patchItems: primaryDbRow.patchItems,
          placementItems: primaryDbRow.placementItems
        })
      };

      const { data: insertedOrder, error: orderErr } = await supabase.from('orders').insert([mappedDbRow]).select();
      if (orderErr) {
        console.error("Order Insert Error:", orderErr);
        throw orderErr;
      }
      
      if (orderFiles && orderFiles.length > 0) {
        for (let file of orderFiles) {
          await supabase.from('order_files').insert([file]);
        }
      }
      return NextResponse.json({ success: true, order: insertedOrder[0] });
    }

    if (action === 'updateStatus') {
      const { orderId, newStatus } = payload;
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'addMessage') {
      const { error } = await supabase.from('order_messages').insert([payload]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    if (action === 'requestRevision') {
      const { orderId, instructions } = payload;
      await supabase.from('revisions').insert([{ order_id: orderId, details: instructions, status: 'pending' }]);
      await supabase.from('orders').update({ status: 'revision_requested' }).eq('id', orderId);
      return NextResponse.json({ success: true });
    }

    if (action === 'cancelOrder') {
      const { orderId } = payload;
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteOrder') {
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
