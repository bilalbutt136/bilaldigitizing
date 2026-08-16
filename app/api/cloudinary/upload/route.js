import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf',
  'dst', 'pes', 'emb', 'exp', 'jef', 'ai', 'eps', 'zip'
]);

const ALLOWED_BUCKETS = new Set([
  'portfolio-images', 'order-files', 'chat-attachments', 'media-library', 'customer-assets'
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication required to upload files.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    let folder = (formData.get('folder') || 'uploads').toString().replace(/[^a-zA-Z0-9_-]/g, '');
    let bucket = (formData.get('bucket') || 'portfolio-images').toString().trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No valid file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'File size exceeds maximum limit of 25MB.' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      bucket = 'portfolio-images';
    }

    const originalName = file.name || 'file.png';
    const fileExt = (originalName.split('.').pop() || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json({ success: false, error: `Unsupported file format (.${fileExt}).` }, { status: 400 });
    }

    const supabase = createAdminClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe unique filename
    const uniqueFilename = `${folder}/${uuidv4()}.${fileExt}`;

    // Try upload to Supabase Storage
    let { error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: file.type || 'application/octet-stream',
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
            contentType: file.type || 'application/octet-stream',
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
      filename: originalName,
      size: file.size
    });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
