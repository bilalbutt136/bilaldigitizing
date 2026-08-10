import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../src/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: assets, error } = await supabase
      .from('media_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('[CMS Media API] Error fetching media:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, url, public_id, category, type, size } = data;
    const supabase = createAdminClient();

    const { data: insertedRow, error } = await supabase
      .from('media_assets')
      .insert([{ name, url, public_id, category, type, size }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, asset: insertedRow });
  } catch (error) {
    console.error('[CMS Media API] Error inserting media:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CMS Media API] Error deleting media:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
