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
 * Extracts width and height from JPEG buffer by scanning SOF markers
 */
function getJpegDimensions(buffer) {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    if (marker >= 0xC0 && marker <= 0xC3 && marker !== 0xC4) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return { width: 612, height: 792 };
}

/**
 * Wraps a raw JPEG image buffer into a 100% compliant PDF-1.4 binary
 * Enables immediate viewing in Chrome PDFium and PDF readers with zero distortion
 */
function wrapJpegToPdf(jpegBuffer) {
  const { width, height } = getJpegDimensions(jpegBuffer);
  const pageWidth = Math.max(width, 100);
  const pageHeight = Math.max(height, 100);

  const obj1 = '<< /Type /Catalog /Pages 3 0 R >>';
  const obj2 = '<< /Type /Outlines /Count 0 >>';
  const obj3 = '<< /Type /Pages /Count 1 /Kids [4 0 R] >>';
  const obj4 = `<< /Type /Page /Parent 3 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 5 0 R /Resources << /XObject << /Im1 6 0 R >> >> >>`;
  const contentStream = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im1 Do Q`;
  const obj5 = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
  const imageHeader = `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`;
  const imageFooter = '\nendstream';

  const parts = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
  const offsets = [];
  let currentOffset = parts[0].length;

  function pushObj(num, bodyBuffer) {
    offsets.push(currentOffset);
    const head = Buffer.from(`${num} 0 obj\n`);
    const tail = Buffer.from('\nendobj\n');
    parts.push(head, bodyBuffer, tail);
    currentOffset += head.length + bodyBuffer.length + tail.length;
  }

  pushObj(1, Buffer.from(obj1));
  pushObj(2, Buffer.from(obj2));
  pushObj(3, Buffer.from(obj3));
  pushObj(4, Buffer.from(obj4));
  pushObj(5, Buffer.from(obj5));

  offsets.push(currentOffset);
  const imgHead = Buffer.from(`6 0 obj\n${imageHeader}`);
  const imgTail = Buffer.from(`${imageFooter}\nendobj\n`);
  parts.push(imgHead, jpegBuffer, imgTail);
  currentOffset += imgHead.length + jpegBuffer.length + imgTail.length;

  const xrefOffset = currentOffset;
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  xref += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(Buffer.from(xref));

  return Buffer.concat(parts);
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

    // 0. Unwrap any nested proxy URLs (e.g. /api/download?url=/api/download?url=...)
    let unwrapCount = 0;
    while (unwrapCount < 5 && typeof fileUrl === 'string' && fileUrl.includes('/api/download?')) {
      try {
        const qIndex = fileUrl.indexOf('?');
        const sp = new URLSearchParams(fileUrl.substring(qIndex + 1));
        const innerUrl = sp.get('url');
        const innerFilename = sp.get('filename');
        if (innerUrl && innerUrl !== fileUrl) {
          fileUrl = decodeURIComponent(innerUrl).trim();
          if (innerFilename && (!filename || filename === 'file')) {
            filename = innerFilename;
          }
          unwrapCount++;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    // Auto-deserialize if fileUrl itself was passed as a JSON serialized string
    if (fileUrl.startsWith('{')) {
      try {
        const parsed = JSON.parse(fileUrl);
        if (parsed.file_url || parsed.url) {
          fileUrl = (parsed.file_url || parsed.url).trim();
          if (!filename || filename === 'file') {
            filename = parsed.file_name || parsed.name || filename;
          }
        }
      } catch {}
    }

    // Auto-deserialize if filename was passed as a JSON serialized string
    if (typeof filename === 'string' && filename.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(filename);
        filename = parsed.file_name || parsed.name || parsed.filename || 'file';
      } catch {}
    }

    // Sanitize filename of filesystem-illegal characters
    filename = String(filename).replace(/[/\\?%*:|"<>]/g, '_').trim() || 'file';

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
        const candidateBuckets = [
          'client-uploads',
          'finished-packages',
          'admin-deliveries',
          'chat-attachments',
          'deliveries',
          'order-files',
          'portfolio-images',
          'customer-assets',
          'orders'
        ];
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
          const cleanKey = fileUrl.replace(/^\/+/, '');
          const testPaths = [
            cleanKey,
            `artwork/${cleanKey}`,
            `orders/${cleanKey}`,
            `chat-attachments/${cleanKey}`,
            `deliveries/${cleanKey}`,
            cleanKey.replace(/\s+/g, '_'),
            `artwork/${cleanKey.replace(/\s+/g, '_')}`
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

        // If not in storage buckets directly, search database tables for matching file asset
        if (!resolvedBlob) {
          // Search orders table
          const { data: orderRows } = await supabase
            .from('orders')
            .select('artwork_url, title')
            .or(`id.eq.${fileUrl},file_path.eq.${fileUrl},artwork_url.ilike.%${fileUrl}%`)
            .limit(1);

          if (orderRows?.[0]?.artwork_url) {
            fileUrl = orderRows[0].artwork_url;
            if (!filename || filename === 'file') {
              filename = `${(orderRows[0].title || 'Artwork').replace(/\s+/g, '_')}.${fileUrl.split('.').pop()?.split('?')[0] || 'pdf'}`;
            }
          }

          // Search order_files table
          if (!fileUrl.startsWith('http')) {
            const { data: ofRows } = await supabase
              .from('order_files')
              .select('public_url, file_url, file_name')
              .or(`file_path.ilike.%${fileUrl}%,file_name.ilike.%${fileUrl}%`)
              .limit(1);

            if (ofRows?.[0]?.public_url || ofRows?.[0]?.file_url) {
              fileUrl = ofRows[0].public_url || ofRows[0].file_url;
              if (!filename || filename === 'file') filename = ofRows[0].file_name || filename;
            }
          }

          // Search messages table
          if (!fileUrl.startsWith('http')) {
            const { data: msgRows } = await supabase
              .from('messages')
              .select('attachment, attachment_url')
              .or(`attachment.ilike.%${fileUrl}%,attachment_url.ilike.%${fileUrl}%`)
              .limit(3);

            if (msgRows && msgRows.length > 0) {
              for (const row of msgRows) {
                if (row.attachment_url && row.attachment_url.startsWith('http')) {
                  fileUrl = row.attachment_url;
                  break;
                }
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
        }

        if (resolvedBlob) {
          const arrayBuf = await resolvedBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const ext = (resolvedName.split('.').pop() || 'pdf').toLowerCase();
          const mime = (ext === 'pdf' || resolvedBlob.type === 'application/pdf') ? 'application/pdf' : (resolvedBlob.type || MIME_TYPES[ext] || 'application/octet-stream');
          if (!resolvedName.includes('.')) resolvedName = `${resolvedName}.${ext}`;
          return createBinaryResponse(buffer, mime, isPreview ? 'inline' : 'attachment', resolvedName, request, isHead);
        }

        // If fileUrl still cannot be resolved to an HTTP URL and was not in storage, report clear 404
        if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://') && !fileUrl.startsWith('//')) {
          return NextResponse.json({ error: 'File asset could not be located in storage or database.' }, { status: 404 });
        }
      } catch (lookupErr) {
        console.warn('[Download Proxy] Supabase lookup note:', lookupErr?.message);
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
    let response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Handle Cloudinary PDF ACL 401: Cloudinary blocks direct raw PDF requests by default,
    // but delivers the rendered .jpg or .png version with 200 OK.
    if (!response.ok && (fetchUrl.includes('cloudinary.com') || response.status === 401)) {
      if (fetchUrl.toLowerCase().includes('.pdf')) {
        const jpgUrl = fetchUrl.replace(/\.pdf(\?.*)?$/i, '.jpg$1');
        const jpgRes = await fetch(jpgUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (jpgRes.ok) {
          const jpgBuf = Buffer.from(await jpgRes.arrayBuffer());
          // If a PDF was requested (preview mode or .pdf filename), wrap the JPEG into a valid PDF-1.4 binary
          if (ext === 'pdf' || filename.toLowerCase().endsWith('.pdf') || isPreview) {
            const pdfBuf = wrapJpegToPdf(jpgBuf);
            const pdfFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
            return createBinaryResponse(pdfBuf, 'application/pdf', disposition, pdfFilename, request, isHead);
          } else {
            return createBinaryResponse(jpgBuf, 'image/jpeg', disposition, filename, request, isHead);
          }
        }
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Remote storage server returned HTTP ${response.status}` }, { status: response.status });
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
