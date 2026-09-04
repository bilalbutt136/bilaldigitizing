/**
 * Universal File Downloader & PDF Viewer Utility
 * Supports all Embroidery (.DST, .PES, .EMB, .EXP, .JEF, .OFM, .PXF, .VP3),
 * Vector (.AI, .EPS, .CDR, .SVG, .PDF), Patches, and Document files across desktop & mobile.
 */

export function getCleanCloudinaryDownloadUrl(url) {
  if (!url) return '';
  if (typeof url !== 'string') return String(url);

  // If Cloudinary URL, insert fl_attachment to force direct attachment delivery
  if (url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/fl_attachment')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}

export function getCleanCloudinaryViewUrl(url) {
  if (!url) return '';
  if (typeof url !== 'string') return String(url);
  return url;
}

/**
 * Downloads any file (PDF, Image, DST, PES, EMB, AI, EPS, ZIP, CDR, DOC) directly to user's device
 * Uses server-side proxy to eliminate CORS, then Blob URL anchor to guarantee browser save
 */
export async function downloadFileDirectly(url, filename = 'download') {
  if (!url) return;

  const cleanFilename = filename || 'download';

  // 1. If it's already a local blob URL
  if (url.startsWith('blob:')) {
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1000);
      return;
    } catch (e) {
      console.warn('[FileDownloader] Blob direct anchor error:', e);
    }
  }

  // 2. High-speed, CORS-free server-side proxy URL
  const proxyDownloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}`;

  // 3. Reliable Blob fetch download (forces download without CORS or navigation freeze)
  try {
    const response = await fetch(proxyDownloadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 2000);
      return;
    }
  } catch (fetchErr) {
    console.warn('[FileDownloader] Blob fetch proxy notice, attempting anchor fallback:', fetchErr?.message);
  }

  // 4. Secondary fallback: Direct anchor download tag via proxy
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = proxyDownloadUrl;
    a.download = cleanFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 2000);
    return;
  } catch (err) {
    console.warn('[FileDownloader] Proxy anchor error, trying direct fetch:', err);
  }

  // 5. Tertiary fallback: Direct file fetch as Blob
  try {
    const directUrl = getCleanCloudinaryDownloadUrl(url);
    const response = await fetch(directUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 2000);
      return;
    }
  } catch (err) {
    console.warn('[FileDownloader] Direct fetch error:', err.message);
  }

  // 6. Last-resort fallback: Direct navigation
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens a PDF document cleanly in a new tab without "Failed to load PDF document" browser errors
 */
export async function openPdfInNewTab(url, filename = 'document.pdf') {
  if (!url) return;

  const cleanFilename = filename || 'document.pdf';

  // 1. If it's a blob/data URL
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. High-speed server-side stream preview (/api/download?preview=true)
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}&preview=true`;
  const newTab = window.open(previewProxyUrl, '_blank', 'noopener,noreferrer');
  if (newTab) return;

  // 3. Fallback to blob fetch if pop-up was blocked
  try {
    const response = await fetch(previewProxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch (err) {
    console.warn('[FileDownloader] PDF blob open fallback:', err.message);
  }

  // 4. Fallback direct open
  window.open(url, '_blank', 'noopener,noreferrer');
}

// Backward compatibility alias
export const triggerFileDownload = downloadFileDirectly;
export default {
  downloadFileDirectly,
  triggerFileDownload,
  openPdfInNewTab,
  getCleanCloudinaryDownloadUrl,
  getCleanCloudinaryViewUrl
};
