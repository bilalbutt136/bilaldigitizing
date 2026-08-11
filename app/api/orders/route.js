import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch {}
          });
        },
      },
    }
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, isAdmin: false };
  
  // Check admin status using the service role client
  const adminClient = createAdminClient();
  const { data: adminData } = await adminClient.from('admins').select('email').eq('email', user.email.toLowerCase()).maybeSingle();
  return { user, isAdmin: !!adminData };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const orderId = searchParams.get('orderId');
    const supabase = createAdminClient();
    
    const { user, isAdmin } = await getAuthenticatedUser();

    if (action === 'fetchAll') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      
      let query = supabase.from('orders').select('*, order_files(*)').order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('client_email', user.email);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ orders: data });
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
        if (orderError || orderData?.client_email !== user.email) {
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
    
    const { user, isAdmin } = await getAuthenticatedUser();

    if (action === 'createOrder') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { primaryDbRow, orderFiles } = payload;
      
      const mappedDbRow = {
        id: primaryDbRow.id,
        title: primaryDbRow.title || 'Service Order',
        client_name: primaryDbRow.clientName || 'Valued Client',
        client_email: user.email,
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
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, newStatus, extraData } = payload;
      
      const updatePayload = { status: newStatus };
      if (extraData?.outputFileUrl) {
        updatePayload.output_file_url = extraData.outputFileUrl;
      }

      const { error } = await supabase.from('orders').update(updatePayload).eq('id', orderId);
      if (error) throw error;
      
      // Process uploaded machine files for admin delivery
      if (extraData?.uploadedMachineFiles && Array.isArray(extraData.uploadedMachineFiles)) {
        for (const file of extraData.uploadedMachineFiles) {
          if (!file.url || file.error) continue;
          
          // Check if file already exists in DB to prevent duplicates
          const { data: existing } = await supabase
            .from('order_files')
            .select('id')
            .eq('file_url', file.url)
            .single();
            
          if (!existing) {
            await supabase.from('order_files').insert([{
              order_id: orderId,
              file_name: file.name || 'machine_file',
              file_format: file.format || file.name?.split('.').pop() || 'unknown',
              file_type: 'machine_file',
              bucket_name: 'cloudinary',
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
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', payload.order_id).single();
        if (orderError || orderData?.client_email !== user.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      const { error } = await supabase.from('order_messages').insert([payload]);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    if (action === 'requestRevision') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId, instructions } = payload;
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', orderId).single();
        if (orderError || orderData?.client_email !== user.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      await supabase.from('revisions').insert([{ order_id: orderId, details: instructions, status: 'pending' }]);
      await supabase.from('orders').update({ status: 'revision_requested' }).eq('id', orderId);
      return NextResponse.json({ success: true });
    }

    if (action === 'cancelOrder') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId } = payload;
      if (!isAdmin) {
        const { data: orderData, error: orderError } = await supabase.from('orders').select('client_email').eq('id', orderId).single();
        if (orderError || orderData?.client_email !== user.email) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      }
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'deleteOrder') {
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
