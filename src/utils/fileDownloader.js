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

  // 2. If it's a data URL, convert to Blob URL to guarantee direct browser download
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
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
    } catch (dataErr) {
      console.warn('[FileDownloader] Data URL conversion error:', dataErr);
    }
  }

  // 3. High-speed, CORS-free server-side proxy URL
  const proxyDownloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}`;

  // 4. Reliable Blob fetch download (forces download without CORS or navigation freeze)
  try {
    const response = await fetch(proxyDownloadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const ext = cleanFilename.split('.').pop()?.toLowerCase() || '';
      const mime = ext === 'pdf' ? 'application/pdf' : (blob.type || 'application/octet-stream');
      const safeBlob = new Blob([blob], { type: mime });
      const blobUrl = window.URL.createObjectURL(safeBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 3000);
      return;
    }
  } catch (fetchErr) {
    console.warn('[FileDownloader] Blob fetch proxy notice, attempting anchor fallback:', fetchErr?.message);
  }

  // 5. Secondary fallback: Direct anchor download tag via proxy
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

  // 6. Tertiary fallback: Direct file fetch as Blob
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

  // 7. Last-resort fallback: Direct navigation
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Opens a PDF document cleanly in a new tab without "Failed to load PDF document" browser errors
 */
export async function openPdfInNewTab(url, filename = 'document.pdf') {
  if (!url) return;

  const cleanFilename = filename || 'document.pdf';

  // 1. If it's a blob URL
  if (url.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
    return;
  }

  // 2. If it's a data URL, convert to Blob URL to avoid top-level window navigation security block
  if (url.startsWith('data:')) {
    try {
      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }, 60000);
      return;
    } catch (dataErr) {
      console.warn('[FileDownloader] PDF data URL conversion error:', dataErr);
    }
  }

  // 3. High-speed server-side stream preview (/api/download?preview=true)
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(cleanFilename)}&preview=true`;

  try {
    const a = document.createElement('a');
    a.href = previewProxyUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 1000);
    return;
  } catch (clickErr) {
    const newTab = window.open(previewProxyUrl, '_blank');
    if (newTab) newTab.opener = null;
  }
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
