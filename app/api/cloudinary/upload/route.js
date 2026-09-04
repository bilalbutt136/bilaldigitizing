import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { checkRateLimit, getRateLimitHeaders } from '../../../../src/lib/rateLimit';
import { v4 as uuidv4 } from 'uuid';

const MIME_MAP = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  psd: 'image/vnd.adobe.photoshop',
  pdf: 'application/pdf',
  dst: 'application/octet-stream',
  pes: 'application/octet-stream',
  emb: 'application/octet-stream',
  exp: 'application/octet-stream',
  jef: 'application/octet-stream',
  ofm: 'application/octet-stream',
  pxf: 'application/octet-stream',
  vp3: 'application/octet-stream',
  hus: 'application/octet-stream',
  xxx: 'application/octet-stream',
  art: 'application/octet-stream',
  ai: 'application/postscript',
  eps: 'application/postscript',
  cdr: 'application/octet-stream',
  dxf: 'application/dxf',
  plt: 'application/octet-stream',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'msi', 'com', 'scr', 'pif', 'php', 'cgi', 'pl', 'jar', 'apk'
]);

const ALLOWED_BUCKETS = new Set([
  'portfolio-images', 'order-files', 'chat-attachments', 'media-library', 'media-gallery',
  'customer-assets', 'admin-deliveries', 'deliveries', 'client-uploads', 'orders'
]);

const PUBLIC_UPLOAD_BUCKETS = new Set([
  'client-uploads', 'chat-attachments', 'order-files', 'customer-assets', 'orders',
  'admin-deliveries', 'finished-packages', 'portfolio-images', 'deliveries'
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);

    // Apply rate limiting on unauthenticated guest file uploads
    if (!user) {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : 'guest-uploader';
      const rateCheck = checkRateLimit(`upload-${ip}`, 30, 60000); // 30 uploads / min
      if (!rateCheck.success) {
        return NextResponse.json(
          { success: false, error: 'Upload rate limit reached. Please wait a moment before trying again.' },
          { status: 429, headers: getRateLimitHeaders(rateCheck) }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get('file');
    let folder = (formData.get('folder') || 'uploads').toString().replace(/[^a-zA-Z0-9_\-\/]/g, '');
    let bucket = (formData.get('bucket') || 'client-uploads').toString().trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No valid file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'File size exceeds maximum limit of 50MB.' }, { status: 400 });
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      bucket = 'client-uploads';
    }

    // If unauthenticated, only permit public submission buckets
    if (!user && !PUBLIC_UPLOAD_BUCKETS.has(bucket)) {
      return NextResponse.json({ success: false, error: 'Authentication required for this storage target.' }, { status: 401 });
    }

    const originalName = file.name || 'file.png';
    const fileExt = (originalName.split('.').pop() || '').toLowerCase();

    if (BLOCKED_EXTENSIONS.has(fileExt)) {
      return NextResponse.json({
        success: false,
        error: `Executable script and binary files (.${fileExt}) are not permitted for security reasons.`
      }, { status: 400 });
    }

    const resolvedContentType = (file.type && file.type !== 'application/octet-stream')
      ? file.type
      : (MIME_MAP[fileExt] || 'application/octet-stream');

    const supabase = createAdminClient();

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate safe, clean unique filename preserving base name and extension
    const sanitizedBase = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 60) || 'file';

    const uniqueFilename = `${folder}/${Date.now()}-${uuidv4().substring(0, 8)}-${sanitizedBase}.${fileExt || 'bin'}`;

    // Upload to Supabase Storage with correct content type and cache control
    let { error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, {
        contentType: resolvedContentType,
        cacheControl: '31536000',
        upsert: true
      });

    // If bucket does not exist, automatically provision bucket with 50MB and public read
    if (error && (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('bucket'))) {
      try {
        await supabase.storage.createBucket(bucket, {
          public: true,
          fileSizeLimit: 52428800
        });
        const retry = await supabase.storage
          .from(bucket)
          .upload(uniqueFilename, buffer, {
            contentType: resolvedContentType,
            cacheControl: '31536000',
            upsert: true
          });
        error = retry.error;
      } catch (bucketErr) {
        console.warn('Storage bucket auto-creation notice:', bucketErr?.message);
      }
    }

    if (error) {
      console.error('[Storage Upload Error]', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Get permanent public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uniqueFilename);

    if (!publicUrlData?.publicUrl) {
      return NextResponse.json({ success: false, error: 'Failed to generate public URL for uploaded file.' }, { status: 500 });
    }

    const fileId = `file-${Date.now()}-${uuidv4().substring(0, 8)}`;
    return NextResponse.json({
      success: true,
      file_id: fileId,
      id: fileId,
      url: publicUrlData.publicUrl,
      secure_url: publicUrlData.publicUrl,
      file_url: publicUrlData.publicUrl,
      public_id: uniqueFilename,
      filename: originalName,
      file_name: originalName,
      name: originalName,
      size: file.size,
      file_size: file.size,
      contentType: resolvedContentType,
      mime_type: resolvedContentType,
      format: fileExt,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Upload API Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
