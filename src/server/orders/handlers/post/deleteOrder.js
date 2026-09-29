import { NextResponse } from 'next/server';

export async function handleDeleteOrder(context) {
  const { payload, supabase, isAdmin } = context;
      if (!isAdmin) return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
      const { orderId } = payload;
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true });
}
