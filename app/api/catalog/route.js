import { NextResponse } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const supabase = await createClient();

    if (action === 'fetchAll') {
      const [
        { data: services },
        { data: pricing_cards },
        { data: patch_cards },
        { data: store_products },
        { data: pricing_tiers }
      ] = await Promise.all([
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('patch_cards').select('*').order('sort_order', { ascending: true }),
        supabase.from('store_products').select('*').order('sort_order', { ascending: true }),
        supabase.from('pricing_tiers').select('*').order('display_order', { ascending: true })
      ]);
      return NextResponse.json({ services, pricing_cards, patch_cards, store_products, pricing_tiers });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Catalog API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { action, payload, tableName } = data;
    const supabase = await createClient();

    if (action === 'upsert') {
      const { error } = await supabase.from(tableName).upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }
    
    if (action === 'delete') {
      const { error } = await supabase.from(tableName).delete().eq('id', payload.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'upsertMany') {
      await supabase.from(tableName).delete().neq('id', 0);
      if (payload && payload.length > 0) {
        const cleanData = payload.map(item => {
          const { id, ...rest } = item;
          return rest;
        });
        const { error } = await supabase.from(tableName).insert(cleanData);
        if (error) throw error;
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('[Catalog API POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
