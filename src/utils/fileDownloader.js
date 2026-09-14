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
 * Unwraps nested /api/download?url=... proxies to avoid double encoding loops
 */
export function unwrapProxyUrl(rawUrl) {
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

/**
 * Downloads any file (PDF, Image, DST, PES, EMB, AI, EPS, ZIP, CDR, DOC) directly to user's device
 * Uses server-side proxy to eliminate CORS, then Blob URL anchor to guarantee browser save
 */
export async function downloadFileDirectly(url, filename = 'download') {
  if (!url) return;

  let resolvedUrl = unwrapProxyUrl(url);
  let cleanFilename = filename || 'download';

  // If url is a JSON object or stringified JSON
  if (typeof resolvedUrl === 'string' && resolvedUrl.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(resolvedUrl);
      if (parsed.file_url || parsed.url) {
        resolvedUrl = parsed.file_url || parsed.url;
        cleanFilename = parsed.file_name || parsed.name || cleanFilename;
      }
    } catch {}
  }

  // If filename is stringified JSON
  if (typeof cleanFilename === 'string' && cleanFilename.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanFilename);
      cleanFilename = parsed.file_name || parsed.name || parsed.filename || 'download';
    } catch {}
  }

  cleanFilename = String(cleanFilename || 'download')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure extension for PDFs
  const isPdf = resolvedUrl.toLowerCase().includes('.pdf') || 
                resolvedUrl.toLowerCase().includes('application/pdf') || 
                cleanFilename.toLowerCase().endsWith('.pdf');

  if (isPdf && !cleanFilename.toLowerCase().endsWith('.pdf')) {
    cleanFilename += '.pdf';
  }

  // 1. If it's already a local blob URL
  if (resolvedUrl.startsWith('blob:')) {
    try {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = resolvedUrl;
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
  if (resolvedUrl.startsWith('data:')) {
    try {
      const parts = resolvedUrl.split(',');
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

  // 3. High-speed, CORS-free server-side proxy URL with explicit download flag
  const proxyDownloadUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(cleanFilename)}&download=true`;

  // 4. Reliable Blob fetch download (forces download without CORS or navigation freeze)
  try {
    const response = await fetch(proxyDownloadUrl);
    if (response.ok) {
      const blob = await response.blob();
      // Force application/octet-stream so browser treats as binary download, not viewable asset
      const safeBlob = new Blob([blob], { type: 'application/octet-stream' });
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
      }, 4000);
      return;
    }
  } catch (fetchErr) {
    console.warn('[FileDownloader] Blob fetch proxy notice, attempting iframe fallback:', fetchErr?.message);
  }

  // 5. Secondary fallback: Hidden iframe download via server-side proxy
  // This triggers instant browser file download on desktop/Android without opening a blank tab
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = proxyDownloadUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 30000);
    return;
  } catch (err) {
    console.warn('[FileDownloader] Proxy iframe error, trying direct anchor:', err);
  }

  // 6. Tertiary fallback: Direct anchor download tag via proxy
  try {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = proxyDownloadUrl;
    a.download = cleanFilename;
    a.target = '_self';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 2000);
    return;
  } catch (err) {
    console.warn('[FileDownloader] Proxy anchor error, trying direct fetch:', err);
  }

  // 7. Quaternary fallback: Direct file fetch as Blob
  try {
    const directUrl = getCleanCloudinaryDownloadUrl(resolvedUrl);
    const response = await fetch(directUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const safeBlob = new Blob([blob], { type: 'application/octet-stream' });
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
      }, 2000);
      return;
    }
  } catch (err) {
    console.warn('[FileDownloader] Direct fetch error:', err.message);
  }

  // 8. Last-resort fallback: Direct navigation
  window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Opens any file (PDF, image, artwork, machine file) directly in a new browser tab to view/inspect
 */
export function openFileInNewTab(url, filename = '') {
  if (!url) return;

  const resolvedUrl = unwrapProxyUrl(url);
  let cleanName = filename || 'preview';

  if (typeof resolvedUrl === 'string' && resolvedUrl.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(resolvedUrl);
      if (parsed.file_url || parsed.url) {
        cleanName = parsed.file_name || parsed.name || cleanName;
      }
    } catch {}
  }

  // Use preview=true proxy so all files (including PDFs, cross-origin images, SVG) render inline without CORS blocks
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(cleanName)}&preview=true`;

  try {
    const newTab = window.open(previewProxyUrl, '_blank', 'noopener,noreferrer');
    if (!newTab) {
      // If popup blocker intervened, trigger via anchor tag
      const a = document.createElement('a');
      a.href = previewProxyUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 1000);
    }
  } catch (openErr) {
    window.location.href = previewProxyUrl;
  }
}

export const openFileDirectly = openFileInNewTab;

/**
 * Opens a PDF document cleanly in a new tab without "Failed to load PDF document" browser errors
 */
export async function openPdfInNewTab(url, filename = 'document.pdf') {
  if (!url) return;

  let resolvedUrl = unwrapProxyUrl(url);
  let cleanFilename = filename || 'document.pdf';

  if (typeof resolvedUrl === 'string' && resolvedUrl.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(resolvedUrl);
      if (parsed.file_url || parsed.url) {
        resolvedUrl = parsed.file_url || parsed.url;
        cleanFilename = parsed.file_name || parsed.name || cleanFilename;
      }
    } catch {}
  }

  if (typeof cleanFilename === 'string' && cleanFilename.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanFilename);
      cleanFilename = parsed.file_name || parsed.name || parsed.filename || 'document.pdf';
    } catch {}
  }

  cleanFilename = String(cleanFilename || 'document.pdf')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanFilename.toLowerCase().endsWith('.pdf')) {
    cleanFilename += '.pdf';
  }

  // 1. If it's a blob URL
  if (resolvedUrl.startsWith('blob:')) {
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
    return;
  }

  // 2. If it's a data URL, convert to Blob URL to avoid top-level window navigation security block
  if (resolvedUrl.startsWith('data:')) {
    try {
      const parts = resolvedUrl.split(',');
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
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(resolvedUrl)}&filename=${encodeURIComponent(cleanFilename)}&preview=true`;

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
  openFileInNewTab,
  openFileDirectly,
  getCleanCloudinaryDownloadUrl,
  getCleanCloudinaryViewUrl
};
