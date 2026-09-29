import { NextResponse } from 'next/server';

export async function handleCancelOrder(context) {
  const { payload, supabase, user, isAdmin } = context;
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { orderId } = payload;
      let orderData = null;
      if (!isAdmin) {
        const { data: ord, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (orderError || ord?.client_email?.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        orderData = ord;
      }
      const { error } = await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;

      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_updated',
          payload: { ...(orderData || {}), id: orderId, status: 'cancelled' }
        });
        await liveChannel.send({
          type: 'broadcast',
          event: 'order_change',
          payload: { order: { ...(orderData || {}), id: orderId, status: 'cancelled' }, eventType: 'UPDATE' }
        });
      } catch (error) { logServerCaughtError(error, { operation: 'orders.cancel_broadcast_failed' }); }

      return NextResponse.json({ success: true }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
}
