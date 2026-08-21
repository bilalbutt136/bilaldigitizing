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

  // 1. EMBROIDERY DIGITIZING PROCESS & TIMELINE
  embroidery_process_steps: [
    {
      step: '01',
      title: 'Submit Artwork & Target Fabric Specs',
      desc: 'Upload your logo, rough sketch, or vector file. Select desired placement (Cap, Left Chest, Jacket Back) and specify garment fabric for calibrated push/pull compensation.'
    },
    {
      step: '02',
      title: 'Master Hand Digitizing & Node Pathing',
      desc: 'Our senior digitizers hand-plot each stitch segment (Satin, Tatami, Run) in Wilcom, calculating exact underlay density, trims, and angle paths with zero auto-trace shortcuts.'
    },
    {
      step: '03',
      title: 'Virtual Stitch Simulation & QA Inspection',
      desc: 'Designs undergo 100% digital stitch simulator inspection to verify proper color stop sequences, jump stitch minimization, and thread tension optimization to ensure zero needle breaks.'
    },
    {
      step: '04',
      title: 'Instant Machine File & PDF Production Sheet',
      desc: 'Download commercial-ready machine files (.DST, .PES, .EMB, .EXP) paired with a complete color sequence worksheet, backed by 100% free unlimited stitch revisions.'
    }
  ],
  embroidery_timeline: [
    {
      label: 'Small Logo & Left Chest (Up to 4" x 4")',
      time: '4–12 Hours',
      note: 'Fast turnaround with complete machine file pack'
    },
    {
      label: 'Mid-Size Jacket & Sleeve (Up to 7" x 7")',
      time: '6–12 Hours',
      note: 'Multi-color layering & pull compensation sheet'
    },
    {
      label: 'Full Jacket Back & 3D Puff Foam (12" x 12")',
      time: '8–12 Hours',
      note: 'High-density puff foam & specialty garment pathing'
    },
    {
      label: 'Rush Priority Production Queue',
      time: '2–4 Hours Express',
      note: 'Immediate direct digitizer lane for tight deadlines'
    },
    {
      label: 'Free Unlimited Stitch Revisions',
      time: 'Instant / 2–4 Hours',
      note: 'Complimentary minor tweaks & size calibrations'
    }
  ],

  // 2. VECTOR ART & TRACING PROCESS & TIMELINE
  vector_process_steps: [
    {
      step: '01',
      title: 'Upload Low-Res Logo, Photo or Sketch',
      desc: 'Upload your pixelated JPEG, PNG, mobile photo, rough paper sketch, or legacy bitmap in any resolution or color profile.'
    },
    {
      step: '02',
      title: 'Manual Pen-Tool Redraw & Precision Bezier Curves',
      desc: 'Expert vector artists meticulously redraw every curve, node, contour, and glyph by hand in Adobe Illustrator with ultra-clean geometry.'
    },
    {
      step: '03',
      title: 'Pantone Color Matching & Spot Layer Separation',
      desc: 'Artwork is calibrated to exact Pantone (PMS) spot colors or CMYK/RGB with cleanly organized, named layers ready for screen printing, vinyl cutting, and engraving.'
    },
    {
      step: '04',
      title: 'Master Scalable Files Delivery & Unlimited Edits',
      desc: 'Download high-res, infinitely scalable vector master assets (.AI, .EPS, .SVG, .PDF) plus 300 DPI transparent PNG with full copyright and free unlimited revisions.'
    }
  ],
  vector_timeline: [
    {
      label: 'Simple Clean Logo Redraw (1–3 Colors)',
      time: '4–8 Hours',
      note: 'Crisp vectorization & clean anchor point optimization'
    },
    {
      label: 'Standard Multi-Color Graphic (Up to 8 Colors)',
      time: '6–12 Hours',
      note: 'Pantone color matching & separated layers'
    },
    {
      label: 'Complex Illustration, Crest & Mascot Redraw',
      time: '8–18 Hours',
      note: 'Detailed shading, custom typography & gradients'
    },
    {
      label: 'Rush Priority Vector Lane',
      time: '2–4 Hours Express',
      note: 'Dedicated senior illustrator assigned immediately'
    },
    {
      label: 'Free Lifetime Color & Layer Tweaks',
      time: 'Instant / 2–4 Hours',
      note: 'Zero charge for minor color variants or format re-saves'
    }
  ],

  // 3. CUSTOM PATCHES PROCESS & TIMELINE
  patch_process_steps: [
    {
      step: '01',
      title: 'Submit Artwork & Custom Specs',
      desc: 'Upload your vector logo or sketch. Select patch style (embroidered, woven, or 3D PVC), backing type, border style, and dimensions.'
    },
    {
      step: '02',
      title: 'Free Digital Proof & Sample Approval',
      desc: 'Our master digitizers engineer a precision stitch-path mock-up and digital proof for your approval with unlimited free revisions.'
    },
    {
      step: '03',
      title: 'Precision Machine Production & Hand QA',
      desc: 'Manufactured with high-density Madeira threads and laser-cut edges on commercial Japanese looms, followed by 100% manual inspection.'
    },
    {
      step: '04',
      title: 'Secure Packaging & Express Doorstep Air Delivery',
      desc: 'Carefully packaged with optional retail backer cards and dispatched via express air courier (DHL/FedEx) with door-to-door tracking.'
    }
  ],
  patch_timeline: [
    {
      label: 'Digital Production Proof',
      time: '12–24 Hours',
      note: 'Free unlimited revisions until approved'
    },
    {
      label: 'Sample Run (10–50 Pcs)',
      time: '3–5 Business Days',
      note: 'Fast prototype & club batches'
    },
    {
      label: 'Production Run (100–500 Pcs)',
      time: '5–7 Business Days',
      note: 'Uniform & commercial batch orders'
    },
    {
      label: 'Wholesale Bulk (500+ Pcs)',
      time: '7–10 Business Days',
      note: 'Priority dedicated factory line'
    },
    {
      label: 'Express Doorstep Air Shipping',
      time: '3–5 Days Worldwide',
      note: 'DHL / FedEx with live tracking'
    }
  ]
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
          .select('*')
          .eq('key', key)
          .maybeSingle();

        if (!error && data) {
          const rawContent = data.content !== undefined ? data.content : data.value;
          if (rawContent !== undefined && rawContent !== null) {
            return NextResponse.json({ 
              success: true, 
              key: data.key, 
              content: rawContent, 
              updated_at: data.updated_at 
            });
          }
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

    const payload = {
      key,
      content,
      value: content,
      updated_at: new Date().toISOString()
    };

    let { data, error } = await supabase
      .from('cms_content')
      .upsert(payload, { onConflict: 'key' })
      .select()
      .maybeSingle();

    if (error) {
      // Fallback if one of content/value column is missing in schema
      const simplifiedPayload = { key, content, updated_at: new Date().toISOString() };
      const retry = await supabase.from('cms_content').upsert(simplifiedPayload, { onConflict: 'key' }).select().maybeSingle();
      if (retry.error) {
        return NextResponse.json({ success: false, error: retry.error.message }, { status: 500 });
      }
      data = retry.data;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[CMS API POST Exception]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
