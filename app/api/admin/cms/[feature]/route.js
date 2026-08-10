import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../src/lib/supabase/admin';

export async function POST(request, { params }) {
  try {
    const { feature } = await params;
    const data = await request.json();
    const supabase = createAdminClient();

    const upsertCatalogData = async (tableName, payload) => {
      await supabase.from(tableName).delete().not('id', 'is', null);
      if (payload && payload.length > 0) {
        const { error } = await supabase.from(tableName).insert(payload);
        if (error) throw error;
      }
      return true;
    };

    switch (feature) {
      case 'hero':
        await upsertCatalogData('hero_content', data);
        break;
      
      case 'portfolio':
        await upsertCatalogData('portfolio', data);
        break;

      case 'sewouts':
        await upsertCatalogData('sew_outs', data);
        break;

      case 'team':
        await upsertCatalogData('digitizers', data);
        break;

      case 'faqs':
        await upsertCatalogData('faqs', data);
        break;

      case 'testimonials':
        await upsertCatalogData('testimonials', data);
        break;

      case 'globals':
        if (Array.isArray(data)) {
          for (let item of data) {
            const { error } = await supabase
              .from('cms_content')
              .upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
            if (error) throw error;
          }
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown feature' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[CMS API] Error saving CMS data:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
