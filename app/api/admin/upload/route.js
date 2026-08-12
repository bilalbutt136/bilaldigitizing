import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'artwork';
    // We will use portfolio-images since it is public and supports public URLs natively
    const bucket = formData.get('bucket') || 'portfolio-images'; 

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent overwriting
    const fileExt = file.name.split('.').pop();
    const uniqueFilename = `${folder}/${uuidv4()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[Supabase Upload Error]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFilename);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      public_id: uniqueFilename,
    });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
