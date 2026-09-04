import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Helper extracting filename and extension
function extractFileMetadata(filename, fileUrl) {
  const cleanUrl = (fileUrl || '').split('?')[0];
  const ext = (filename.split('.').pop() || cleanUrl.split('.').pop() || 'bin').toLowerCase();
  const base = filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 60);
  return { ext, base, sanitizedName: `${base}.${ext}` };
}

// MIME dictionary matching app/api/download/route.js
const MIME_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  dst: 'application/octet-stream',
  pes: 'application/octet-stream',
  emb: 'application/octet-stream',
  ai: 'application/postscript',
  eps: 'application/postscript',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

describe('File Handling & Universal Storage Pipeline', () => {
  test('correctly resolves PDF documents with application/pdf MIME', () => {
    const meta = extractFileMetadata('Sample_Worksheet.pdf', 'https://xyzref.supabase.co/storage/v1/object/public/order-files/worksheet.pdf');
    assert.equal(meta.ext, 'pdf');
    assert.equal(meta.sanitizedName, 'Sample_Worksheet.pdf');
    assert.equal(MIME_TYPES[meta.ext], 'application/pdf');
  });

  test('correctly resolves images (.png, .jpg, .webp)', () => {
    const pngMeta = extractFileMetadata('Company Logo #1.png', 'https://res.cloudinary.com/demo/image/upload/sample.png');
    assert.equal(pngMeta.ext, 'png');
    assert.equal(pngMeta.sanitizedName, 'Company_Logo__1.png');
    assert.equal(MIME_TYPES[pngMeta.ext], 'image/png');

    const jpgMeta = extractFileMetadata('artwork_photo.jpg', null);
    assert.equal(MIME_TYPES[jpgMeta.ext], 'image/jpeg');
  });

  test('correctly resolves archive and binary files (.zip, .dst, .pes, .emb, .ai)', () => {
    const zipMeta = extractFileMetadata('client_bundle.zip', null);
    assert.equal(zipMeta.ext, 'zip');
    assert.equal(MIME_TYPES[zipMeta.ext], 'application/zip');

    const dstMeta = extractFileMetadata('jacket_back_stitch.dst', null);
    assert.equal(dstMeta.ext, 'dst');
    assert.equal(MIME_TYPES[dstMeta.ext], 'application/octet-stream');

    const aiMeta = extractFileMetadata('vector_source.ai', null);
    assert.equal(aiMeta.ext, 'ai');
    assert.equal(MIME_TYPES[aiMeta.ext], 'application/postscript');
  });

  test('decodes base64 data URLs accurately without corrupting buffer bytes', () => {
    const rawContent = 'Hello PDF & Embroidery Machine File Data';
    const base64Data = Buffer.from(rawContent).toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64Data}`;

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    assert.ok(match);
    assert.equal(match[1], 'application/pdf');

    const decodedBuffer = Buffer.from(match[2], 'base64');
    assert.equal(decodedBuffer.toString('utf-8'), rawContent);
  });

  test('formats Content-Disposition correctly for inline preview and download attachment', () => {
    const filename = 'Turbide Avocat Print.pdf';
    const safeAscii = filename.replace(/["\r\n\\]/g, '').replace(/[^\x20-\x7E]/g, '_');
    const utf8Encoded = encodeURIComponent(filename);
    const attachmentDisposition = `attachment; filename="${safeAscii}"; filename*=UTF-8''${utf8Encoded}`;
    assert.ok(attachmentDisposition.startsWith('attachment;'));
    assert.ok(attachmentDisposition.includes('filename*=UTF-8\'\'Turbide%20Avocat%20Print.pdf'));

    const inlineDisposition = `inline; filename="${safeAscii}"; filename*=UTF-8''${utf8Encoded}`;
    assert.ok(inlineDisposition.startsWith('inline;'));
  });

  test('correctly parses Range header and slices buffer for Chromium PDFium', () => {
    const totalBytes = 1000;
    const dummyBuffer = Buffer.alloc(totalBytes, 0x41); // 'A' repeated
    const rangeHeader = 'bytes=100-199';
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    assert.ok(match);

    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    assert.equal(start, 100);
    assert.equal(end, 199);

    const chunk = dummyBuffer.subarray(start, end + 1);
    assert.equal(chunk.byteLength, 100);
    assert.equal(`bytes ${start}-${end}/${totalBytes}`, 'bytes 100-199/1000');
  });

  test('validates generated PDF binary structure with %PDF header and %%EOF trailer', () => {
    const validPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\n0000000000 65535 f\ntrailer<</Size 1/Root 1 0 R>>\nstartxref\n50\n%%EOF';
    const buf = Buffer.from(validPdf);
    assert.ok(buf.toString('utf-8').startsWith('%PDF-'));
    assert.ok(buf.toString('utf-8').includes('%%EOF'));
  });

  test('safely parses stringified JSON in filename and extracts real filename', () => {
    const rawJsonFilename = JSON.stringify({
      file_id: 'upload-12345',
      file_url: 'https://xyz.supabase.co/storage/v1/object/public/client-uploads/invoice.pdf',
      file_name: 'Custom_Quotation_Turbide.pdf',
      file_size: 154200,
      mime_type: 'application/pdf'
    });

    let resolvedName = rawJsonFilename;
    if (typeof resolvedName === 'string' && resolvedName.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(resolvedName);
        resolvedName = parsed.file_name || parsed.name || 'document.pdf';
      } catch {}
    }
    resolvedName = resolvedName.replace(/[/\\?%*:|"<>]/g, '_').trim();

    assert.equal(resolvedName, 'Custom_Quotation_Turbide.pdf');
    assert.ok(!resolvedName.includes('{'));
    assert.ok(!resolvedName.includes('"'));
  });

  test('safely sanitizes illegal filesystem characters from download filenames', () => {
    const dirtyName = 'Turbide: Invoice/Quotation *FINAL* <v1.2>.pdf';
    const cleanName = dirtyName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    assert.equal(cleanName, 'Turbide_ Invoice_Quotation _FINAL_ _v1.2_.pdf');
    assert.ok(!cleanName.includes(':'));
    assert.ok(!cleanName.includes('/'));
    assert.ok(!cleanName.includes('*'));
    assert.ok(!cleanName.includes('<'));
    assert.ok(!cleanName.includes('>'));
  });

  test('unwraps nested /api/download proxy URLs cleanly', () => {
    function unwrapProxyUrl(rawUrl) {
      if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
      let current = rawUrl.trim();
      let iterations = 0;
      while (iterations < 5 && current.includes('/api/download?')) {
        try {
          const qIndex = current.indexOf('?');
          const params = new URLSearchParams(current.substring(qIndex + 1));
          const inner = params.get('url');
          if (inner && inner !== current) {
            current = decodeURIComponent(inner).trim();
            iterations++;
          } else {
            break;
          }
        } catch {
          break;
        }
      }
      return current;
    }

    const directUrl = 'https://res.cloudinary.com/df2k7p7jx/image/upload/v1787938128/artwork/agmpwusnzygi4micdqnp.pdf';
    const singleProxy = `/api/download?url=${encodeURIComponent(directUrl)}&filename=test.pdf`;
    const doubleProxy = `/api/download?url=${encodeURIComponent(singleProxy)}&filename=test.pdf`;

    assert.equal(unwrapProxyUrl(directUrl), directUrl);
    assert.equal(unwrapProxyUrl(singleProxy), directUrl);
    assert.equal(unwrapProxyUrl(doubleProxy), directUrl);
  });

  test('generates valid PDF binary wrapping JPEG image data', () => {
    // Minimal JPEG header simulation with SOF0 marker
    // Marker 0xFF 0xC0, length 0x00 0x11 (17), precision 8, height 600 (0x02 0x58), width 800 (0x03 0x20)
    const dummyJpeg = Buffer.from([
      0xFF, 0xD8, // SOI
      0xFF, 0xC0, // SOF0
      0x00, 0x11, // length 17
      0x08,       // precision
      0x02, 0x58, // height: 600
      0x03, 0x20, // width: 800
      0x03,       // components
      0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xD9  // EOI
    ]);

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

    const dims = getJpegDimensions(dummyJpeg);
    assert.equal(dims.width, 800);
    assert.equal(dims.height, 600);

    const pdfBuffer = wrapJpegToPdf(dummyJpeg);
    const pdfString = pdfBuffer.toString('utf-8');
    assert.ok(pdfString.startsWith('%PDF-1.4'));
    assert.ok(pdfString.includes('/DCTDecode'));
    assert.ok(pdfString.includes('/Width 800 /Height 600'));
    assert.ok(pdfString.includes('%%EOF'));
  });
});
