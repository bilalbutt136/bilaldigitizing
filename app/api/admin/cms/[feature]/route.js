import { NextResponse } from 'next/server';
import { createClient } from '../../../../../src/lib/supabase/server';

export async function POST(request, { params }) {
  try {
    const { feature } = await params;
    const data = await request.json();
    const supabase = await createClient();

    const upsertCatalogData = async (tableName, payload) => {
      await supabase.from(tableName).delete().neq('id', 0);
      if (payload && payload.length > 0) {
        const cleanData = payload.map(item => {
          const { id, ...rest } = item;
          return rest;
        });
        const { error } = await supabase.from(tableName).insert(cleanData);
        if (error) throw error;
      }
      return true;
    };

    switch (feature) {
      case 'hero':
        await supabase.from('hero_content').delete().neq('id', 0);
        if (data.length > 0) {
          const { error } = await supabase.from('hero_content').insert(
            data.map(({ id, ...rest }) => rest)
          );
          if (error) throw error;
        }
        break;
      
      case 'portfolio':
        await supabase.from('portfolio_samples').delete().neq('id', 0);
        if (data.length > 0) {
          const { error } = await supabase.from('portfolio_samples').insert(
            data.map(({ id, ...rest }) => rest)
          );
          if (error) throw error;
        }
        break;

      case 'sewouts':
        await supabase.from('sew_outs').delete().neq('id', 0);
        if (data.length > 0) {
          const { error } = await supabase.from('sew_outs').insert(
            data.map(({ id, ...rest }) => rest)
          );
          if (error) throw error;
        }
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
