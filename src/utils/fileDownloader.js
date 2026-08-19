/**
 * Universal File Downloader & PDF Viewer Utility
 * Solves cross-origin download issues and Cloudinary PDF preview errors
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
 * Downloads any file (PDF, Image, DST, PES, EMB, AI, ZIP) directly to user's device
 */
export async function downloadFileDirectly(url, filename = 'download') {
  if (!url) return;

  const downloadUrl = getCleanCloudinaryDownloadUrl(url);

  try {
    // Attempt 1: Fetch as Blob and trigger standard download anchor
    const response = await fetch(downloadUrl, { mode: 'cors' });
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
    console.warn('[FileDownloader] Blob download fallback to direct anchor:', err.message);
  }

  // Attempt 2: Fallback to direct anchor navigation
  try {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename || 'download';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1500);
  } catch (fallbackErr) {
    window.open(downloadUrl, '_blank');
  }
}

/**
 * Opens a PDF document cleanly in a new tab without "Failed to load PDF document" browser errors
 */
export async function openPdfInNewTab(url, filename = 'document.pdf') {
  if (!url) return;

  try {
    // Fetch the binary buffer as PDF Blob to bypass CORS / CDN header issues
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const newTab = window.open(blobUrl, '_blank', 'noopener,noreferrer');
      if (!newTab) {
        // Pop-up blocked fallback
        window.location.href = blobUrl;
      }
      return;
    }
  } catch (err) {
    console.warn('[FileDownloader] PDF blob open fallback:', err.message);
  }

  // Direct open fallback
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
