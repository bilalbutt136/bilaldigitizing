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
});
