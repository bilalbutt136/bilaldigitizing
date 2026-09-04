import { NextResponse } from 'next/server';
import { validateSafeUrl } from '../../../src/lib/urlValidator';
import { createAdminClient } from '../../../src/lib/supabase/admin';

const MIME_TYPES = {
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
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  psd: 'image/vnd.adobe.photoshop',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  cdr: 'application/octet-stream',
  dxf: 'application/dxf',
  plt: 'application/octet-stream',
  txt: 'text/plain',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'file';
    const isPreview = searchParams.get('preview') === 'true';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL parameter' }, { status: 400 });
    }

    const ext = (filename.split('.').pop() || fileUrl.split('.').pop()?.split('?')[0] || 'pdf').toLowerCase();
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Ensure filename has proper extension
    if (!filename.includes('.')) {
      filename = `${filename}.${ext}`;
    }

    const disposition = isPreview ? 'inline' : 'attachment';

    // 1. Direct Support for Data URLs (Local/Fallback base64 assets)
    if (fileUrl.startsWith('data:')) {
      const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const dataMime = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': dataMime || contentType,
            'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
            'Content-Length': String(buffer.byteLength),
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 2. Direct Supabase Storage Object Resolution via Service Role Client
    // Matches URLs like: .../storage/v1/object/public/{bucket}/{path} or .../storage/v1/object/sign/{bucket}/{path}
    const supabaseMatch = fileUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (supabaseMatch) {
      try {
        const bucket = supabaseMatch[1];
        const rawPath = supabaseMatch[2].split('?')[0];
        const cleanPath = decodeURIComponent(rawPath);

        const supabase = createAdminClient();
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(cleanPath);

        if (!downloadError && fileBlob) {
          const arrayBuffer = await fileBlob.arrayBuffer();
          const detectedType = fileBlob.type || contentType;
          return new NextResponse(Buffer.from(arrayBuffer), {
            status: 200,
            headers: {
              'Content-Type': detectedType,
              'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
              'Content-Length': String(arrayBuffer.byteLength),
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (supabaseErr) {
        console.warn('[Download Proxy] Supabase admin download fallback:', supabaseErr?.message);
      }
    }

    // 3. Clean and Validate Remote URL for SSRF Safety
    let fetchUrl = fileUrl;
    if (fetchUrl.startsWith('//')) {
      fetchUrl = `https:${fetchUrl}`;
    }

    const validation = validateSafeUrl(fetchUrl);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Access to this URL is blocked.' }, { status: 403 });
    }
    fetchUrl = validation.sanitizedUrl;

    // 4. Fetch the Remote File Server-Side (bypassing browser CORS completely)
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      // If direct fetch fails, redirect as fallback
      return NextResponse.redirect(fetchUrl);
    }

    const arrayBuffer = await response.arrayBuffer();
    const serverContentType = response.headers.get('content-type') || contentType;

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': serverContentType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    console.error('[Download Proxy Error]', err);
    return NextResponse.json({ error: 'Download failed: ' + err.message }, { status: 500 });
  }
}
