import { NextResponse } from 'next/server';
import { createAdminClient } from '/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');
    const supabase = createAdminClient();

    if (action === 'fetchContent' && key) {
      const { data, error } = await supabase.from('cms_content').select('value').eq('key', key).single();
      if (error && error.code !== 'PGRST116') throw error; // ignore no rows found error
      return NextResponse.json({ content: data ? data.value : null });
    }

    return NextResponse.json({ error: 'Unknown action or missing key' }, { status: 400 });
  } catch (error) {
    console.error('[CMS API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
