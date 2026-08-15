import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'hero-showcase';
    const bucket = formData.get('bucket') || 'portfolio-images';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename to prevent overwriting
    const originalName = file.name || 'image.png';
    const fileExt = originalName.split('.').pop() || 'png';
    const uniqueFilename = `${folder}/${uuidv4()}.${fileExt}`;

    // Try upload to Supabase Storage
    let { error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: file.type || 'image/png',
        cacheControl: '3600',
        upsert: true
      });

    // If bucket not found, create bucket and retry
    if (error && (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('bucket'))) {
      try {
        await supabase.storage.createBucket(bucket, { public: true });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueFilename, buffer, {
            contentType: file.type || 'image/png',
            cacheControl: '3600',
            upsert: true
          });
        error = retry.error;
      } catch (bucketErr) {
        console.warn('Bucket creation attempt warning:', bucketErr);
      }
    }

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
