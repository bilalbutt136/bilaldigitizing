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
 * Downloads any file (PDF, Image, DST, PES, EMB, AI, EPS, ZIP, CDR) directly to user's device
 */
export async function downloadFileDirectly(url, filename = 'download') {
  if (!url) return;

  // 1. If it's already a local blob / data URL
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || 'download';
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

  // 2. High-speed, CORS-free server-side proxy download (/api/download)
  const proxyDownloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'download')}`;

  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = proxyDownloadUrl;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 2000);
    return;
  } catch (err) {
    console.warn('[FileDownloader] Proxy anchor error, trying direct fetch:', err);
  }

  // 3. Fallback: Fetch as Blob and trigger standard download anchor
  try {
    const directUrl = getCleanCloudinaryDownloadUrl(url);
    const response = await fetch(directUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = filename || 'download';
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

  // 4. Last-resort fallback: Direct navigation
  window.open(url, '_blank');
}

/**
 * Opens a PDF document cleanly in a new tab without "Failed to load PDF document" browser errors
 */
export async function openPdfInNewTab(url, filename = 'document.pdf') {
  if (!url) return;

  // 1. If it's a blob/data URL
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  // 2. High-speed server-side stream preview (/api/download?preview=true)
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename || 'document.pdf')}&preview=true`;
  const newTab = window.open(previewProxyUrl, '_blank', 'noopener,noreferrer');
  if (newTab) return;

  // 3. Fallback to blob fetch if pop-up blocked
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      window.location.href = blobUrl;
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
