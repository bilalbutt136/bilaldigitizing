import { NextResponse } from 'next/server';

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
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  cdr: 'application/octet-stream',
  dxf: 'application/dxf',
  plt: 'application/octet-stream',
  txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
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
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Ensure filename has proper extension
    if (!filename.includes('.')) {
      filename = `${filename}.${ext}`;
    }

    // Clean URL if needed
    let fetchUrl = fileUrl;
    if (fetchUrl.startsWith('//')) {
      fetchUrl = `https:${fetchUrl}`;
    }

    // Fetch the remote file server-side (bypassing browser CORS completely)
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
    const disposition = isPreview ? 'inline' : 'attachment';

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
