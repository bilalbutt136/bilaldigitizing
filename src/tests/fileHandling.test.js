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
    const filename = 'embroidery_worksheet.pdf';
    const attachmentDisposition = `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
    assert.ok(attachmentDisposition.startsWith('attachment;'));
    assert.ok(attachmentDisposition.includes(encodeURIComponent(filename)));

    const inlineDisposition = `inline; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
    assert.ok(inlineDisposition.startsWith('inline;'));
  });
});
