import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';

// Default built-in fallback content for standard CMS keys
const DEFAULT_CMS_CONTENT = {
  placement_options: [
    { id: 'left_chest', label: 'Left Chest', standard_width: 3.5, standard_height: 3.0, unit: 'inches' },
    { id: 'right_chest', label: 'Right Chest', standard_width: 3.5, standard_height: 3.0, unit: 'inches' },
    { id: 'cap_front', label: 'Cap / Hat Front (Low Profile)', standard_width: 4.5, standard_height: 2.25, unit: 'inches' },
    { id: 'cap_side', label: 'Cap Side / Back Arc', standard_width: 2.5, standard_height: 1.25, unit: 'inches' },
    { id: 'jacket_back', label: 'Full Jacket Back / Hoodie', standard_width: 10.5, standard_height: 10.5, unit: 'inches' },
    { id: 'sleeve', label: 'Sleeve / Cuff Placement', standard_width: 3.0, standard_height: 3.0, unit: 'inches' },
    { id: 'custom', label: 'Custom Dimension Placement', standard_width: 4.0, standard_height: 4.0, unit: 'inches' }
  ],
  format_options: [
    { key: 'dst', label: 'Tajima (.DST)', type: 'Commercial' },
    { key: 'pes', label: 'Brother / Bernina (.PES)', type: 'Home & Pro' },
    { key: 'emb', label: 'Wilcom Source (.EMB)', type: 'Master Source' },
    { key: 'pdf', label: 'Production Worksheet (.PDF)', type: 'Spec Sheet' },
    { key: 'exp', label: 'Melco (.EXP)', type: 'Commercial' },
    { key: 'jef', label: 'Janome (.JEF)', type: 'Home' },
    { key: 'ai', label: 'Adobe Illustrator (.AI)', type: 'Vector' },
    { key: 'svg', label: 'Scalable Vector (.SVG)', type: 'Vector' },
    { key: 'eps', label: 'Encapsulated PostScript (.EPS)', type: 'Vector' }
  ],
  apparel_size_chart: {
    tshirt: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
    hoodie: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
    hat: ['One Size Fits Most', 'Snapback Adjustable', 'Fitted 7 1/4', 'Fitted 7 3/8', 'Fitted 7 1/2']
  },
  process_steps: [
    { step: 1, title: 'Upload Artwork & Specs', desc: 'Submit your logo or sketch with target dimensions and fabric details.' },
    { step: 2, title: 'Master Digitizing & QC', desc: 'Our senior digitizers path stitch nodes and optimize stitch density.' },
    { step: 3, title: 'Virtual Stitch Simulation', desc: 'Color sequences, thread trims, and push-pull compensation are reviewed.' },
    { step: 4, title: 'Instant Delivery & Download', desc: 'Production-ready machine files (.DST, .PES, .EMB) and PDF worksheet are unlocked.' }
  ],
  patch_timeline: {
    digital_proof: '2-4 Hours',
    sample_batch: '2-3 Business Days',
    production_batch: '4-7 Business Days',
    express_dispatch: 'FedEx / DHL 2-Day Air'
  }
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      // Return all default fallback keys or list
      return NextResponse.json({ success: true, keys: Object.keys(DEFAULT_CMS_CONTENT) });
    }

    const supabase = createAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('cms_content')
          .select('key, content, updated_at')
          .eq('key', key)
          .maybeSingle();

        if (!error && data?.content) {
          return NextResponse.json({ 
            success: true, 
            key: data.key, 
            content: data.content, 
            updated_at: data.updated_at 
          });
        }
      } catch (dbErr) {
        console.warn(`[CMS API] Database query warning for key "${key}":`, dbErr.message);
      }
    }

    // Fallback to built-in content if database record does not exist
    const fallbackContent = DEFAULT_CMS_CONTENT[key] || null;
    return NextResponse.json({ 
      success: true, 
      key, 
      content: fallbackContent,
      isFallback: true 
    });
  } catch (error) {
    console.error('[CMS API GET Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { key, content } = body;

    if (!key || content === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required parameters: key, content' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase admin is not configured.' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('cms_content')
      .upsert({
        key,
        content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[CMS API POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
