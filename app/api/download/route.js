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

/**
 * Formats Content-Disposition header conforming to RFC 6266 and RFC 5987
 */
function formatContentDisposition(disposition, filename) {
  const safeAscii = filename.replace(/["\r\n\\]/g, '').replace(/[^\x20-\x7E]/g, '_');
  const utf8Encoded = encodeURIComponent(filename).replace(/['()]/g, escape).replace(/\*/g, '%2A');
  return `${disposition}; filename="${safeAscii}"; filename*=UTF-8''${utf8Encoded}`;
}

/**
 * Creates binary response handling RFC 7233 Range headers (crucial for Chrome PDFium)
 */
function createBinaryResponse(buffer, contentType, disposition, filename, request, isHead = false) {
  const totalSize = buffer.byteLength;
  const contentDisposition = formatContentDisposition(disposition, filename);
  const commonHeaders = {
    'Content-Type': contentType,
    'Content-Disposition': contentDisposition,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition'
  };

  if (isHead) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        ...commonHeaders,
        'Content-Length': String(totalSize)
      }
    });
  }

  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

      if (start < totalSize && end < totalSize && start <= end) {
        const chunk = buffer.subarray(start, end + 1);
        return new NextResponse(chunk, {
          status: 206,
          headers: {
            ...commonHeaders,
            'Content-Range': `bytes ${start}-${end}/${totalSize}`,
            'Content-Length': String(chunk.byteLength)
          }
        });
      } else {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      ...commonHeaders,
      'Content-Length': String(totalSize)
    }
  });
}

/**
 * Core handler resolving file and returning binary response
 */
async function handleFileRequest(request, isHead = false) {
  try {
    const { searchParams } = new URL(request.url);
    let fileUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'file';
    const isPreview = searchParams.get('preview') === 'true';

    if (!fileUrl) {
      return NextResponse.json({ error: 'Missing file URL parameter' }, { status: 400 });
    }

    fileUrl = fileUrl.trim();

    // 1. Direct Support for Data URLs (Local/Fallback base64 assets)
    if (fileUrl.startsWith('data:')) {
      const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const dataMime = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = filename.split('.').pop()?.toLowerCase() || (dataMime.includes('pdf') ? 'pdf' : 'bin');
        if (!filename.includes('.')) filename = `${filename}.${ext}`;
        return createBinaryResponse(buffer, dataMime || MIME_TYPES[ext] || 'application/octet-stream', isPreview ? 'inline' : 'attachment', filename, request, isHead);
      }
    }

    // 2. Resolve Non-HTTP URLs (Legacy database filenames, relative paths, or storage keys)
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://') && !fileUrl.startsWith('//')) {
      try {
        const supabase = createAdminClient();
        const candidateBuckets = ['client-uploads', 'finished-packages', 'order-files', 'portfolio-images'];
        let resolvedBlob = null;
        let resolvedName = filename;

        // Check if fileUrl has bucket prefix like "client-uploads/artwork/..."
        const parts = fileUrl.split('/');
        if (candidateBuckets.includes(parts[0])) {
          const b = parts[0];
          const p = parts.slice(1).join('/');
          const { data } = await supabase.storage.from(b).download(p);
          if (data) resolvedBlob = data;
        }

        // Try downloading across candidate buckets and common folder paths
        if (!resolvedBlob) {
          const testPaths = [
            fileUrl,
            `artwork/${fileUrl}`,
            `orders/${fileUrl}`,
            `chat-attachments/${fileUrl}`,
            fileUrl.replace(/\s+/g, '_'),
            `artwork/${fileUrl.replace(/\s+/g, '_')}`
          ];

          for (const b of candidateBuckets) {
            for (const p of testPaths) {
              const { data } = await supabase.storage.from(b).download(p);
              if (data) {
                resolvedBlob = data;
                break;
              }
            }
            if (resolvedBlob) break;
          }
        }

        // Search messages table if attachment has serialized JSON with URL
        if (!resolvedBlob) {
          const { data: msgRows } = await supabase
            .from('messages')
            .select('attachment')
            .ilike('attachment', `%${fileUrl.replace(/\.[^.]+$/, '')}%`)
            .limit(3);

          if (msgRows && msgRows.length > 0) {
            for (const row of msgRows) {
              if (row.attachment && row.attachment.includes('"url"')) {
                try {
                  const parsed = JSON.parse(row.attachment);
                  if (parsed.url && parsed.url.startsWith('http')) {
                    fileUrl = parsed.url;
                    if (parsed.name) resolvedName = parsed.name;
                    break;
                  }
                } catch {}
              }
            }
          }
        }

        if (resolvedBlob) {
          const arrayBuf = await resolvedBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const ext = (resolvedName.split('.').pop() || 'pdf').toLowerCase();
          const mime = (ext === 'pdf' || resolvedBlob.type === 'application/pdf') ? 'application/pdf' : (resolvedBlob.type || MIME_TYPES[ext] || 'application/octet-stream');
          if (!resolvedName.includes('.')) resolvedName = `${resolvedName}.${ext}`;
          return createBinaryResponse(buffer, mime, isPreview ? 'inline' : 'attachment', resolvedName, request, isHead);
        }
      } catch (lookupErr) {
        console.warn('[Download Proxy] Supabase relative path resolution note:', lookupErr?.message);
      }
    }

    const ext = (filename.split('.').pop() || fileUrl.split('.').pop()?.split('?')[0] || 'pdf').toLowerCase();
    let contentType = MIME_TYPES[ext] || 'application/octet-stream';
    if (!filename.includes('.')) filename = `${filename}.${ext}`;
    const disposition = isPreview ? 'inline' : 'attachment';

    // 3. Direct Supabase Storage Object Resolution via Service Role Client
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
          const detectedType = (ext === 'pdf' || fileBlob.type === 'application/pdf') ? 'application/pdf' : (fileBlob.type || contentType);
          return createBinaryResponse(Buffer.from(arrayBuffer), detectedType, disposition, filename, request, isHead);
        }
      } catch (supabaseErr) {
        console.warn('[Download Proxy] Supabase admin download fallback:', supabaseErr?.message);
      }
    }

    // 4. Clean and Validate Remote URL for SSRF Safety
    let fetchUrl = fileUrl;
    if (fetchUrl.startsWith('//')) {
      fetchUrl = `https:${fetchUrl}`;
    }

    const validation = validateSafeUrl(fetchUrl);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || 'Access to this URL is blocked.' }, { status: 403 });
    }
    fetchUrl = validation.sanitizedUrl;

    // 5. Fetch Remote File Server-Side (bypassing browser CORS completely)
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.redirect(fetchUrl);
    }

    const arrayBuffer = await response.arrayBuffer();
    const serverContentType = (ext === 'pdf' || response.headers.get('content-type')?.includes('pdf'))
      ? 'application/pdf'
      : (response.headers.get('content-type') || contentType);

    return createBinaryResponse(Buffer.from(arrayBuffer), serverContentType, disposition, filename, request, isHead);
  } catch (err) {
    console.error('[Download Proxy Error]', err);
    return NextResponse.json({ error: 'Download failed: ' + err.message }, { status: 500 });
  }
}

export async function GET(request) {
  return handleFileRequest(request, false);
}

export async function HEAD(request) {
  return handleFileRequest(request, true);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Authorization',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges, Content-Disposition',
      'Access-Control-Max-Age': '86400'
    }
  });
}
