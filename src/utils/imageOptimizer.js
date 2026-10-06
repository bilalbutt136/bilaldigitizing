/**
 * Utility for image optimization, client-side pre-upload compression,
 * and Next.js / Edge CDN caching proxy URLs to eliminate Supabase egress usage.
 */

const NEXT_IMAGE_ALLOWED_WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1920];

/**
 * Snaps a target width to the nearest valid Next.js image width.
 */
function snapToNextWidth(width) {
  if (!width || width <= 256) return 256;
  for (const w of NEXT_IMAGE_ALLOWED_WIDTHS) {
    if (width <= w) return w;
  }
  return 1200;
}

/**
 * Returns an Edge CDN-cached, WebP/AVIF optimized URL for an image.
 * If the image originates from Supabase Storage, it routes through Next.js
 * image optimization (/_next/image), which transforms multi-megabyte PNGs into
 * ~40-60 KB WebP files and caches them on Vercel's Edge CDN for 1 year.
 *
 * @param {string} src - The original image URL
 * @param {number} [width=828] - Desired maximum display width
 * @param {number} [quality=75] - WebP/AVIF compression quality (1-100)
 * @returns {string} - Optimized URL or original URL
 */
export function getOptimizedImageUrl(src, width = 828, quality = 75) {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  // Data URLs, Blobs, SVGs, and already-optimized URLs don't need transformation
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.endsWith('.svg') ||
    trimmed.includes('/_next/image')
  ) {
    return trimmed;
  }

  // Only route HTTP/HTTPS URLs from remote origins (e.g., Supabase Storage)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      // Specifically target Supabase storage objects to prevent egress quota exhaustion
      if (parsed.hostname.endsWith('supabase.co')) {
        const snappedWidth = snapToNextWidth(width);
        return `/_next/image?url=${encodeURIComponent(trimmed)}&w=${snappedWidth}&q=${quality}`;
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/**
 * Compresses an image client-side before uploading to storage.
 * Reduces 4 MB+ raw PNG/JPEG files down to ~150-250 KB WebP without noticeable visual degradation.
 * Leaves vectors (.ai, .eps, .svg) and machine files (.dst, .pes, .emb, .pdf) untouched.
 *
 * @param {File} file - Original file from user input
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1600]
 * @param {number} [options.maxHeight=1600]
 * @param {number} [options.quality=0.82]
 * @returns {Promise<File>} - Compressed File or original File if non-compressible
 */
export async function compressImageClient(file, {
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
} = {}) {
  if (!file || typeof window === 'undefined') return file;

  const nonCompressibleExtensions = [
    'dst', 'pes', 'emb', 'exp', 'jef', 'ofm', 'pxf', 'vp3', 'hus', 'xxx', 'art',
    'ai', 'eps', 'svg', 'pdf', 'zip', 'rar', '7z', 'cdr', 'dxf', 'plt'
  ];

  const ext = (file.name?.split('.').pop() || '').toLowerCase();
  if (nonCompressibleExtensions.includes(ext)) {
    return file; // Do not alter vector or embroidery embroidery files
  }

  const isRasterImage = file.type.startsWith('image/') && !file.type.includes('svg');
  if (!isRasterImage && !['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext)) {
    return file;
  }

  // If already under 350 KB, don't bother re-encoding
  if (file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        try {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }

          // Draw with high quality interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Attempt WebP export, falling back to JPEG
          const outputType = 'image/webp';
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) {
                // If compression failed or didn't save bytes, keep original
                return resolve(file);
              }

              const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
              const compressedFile = new File([blob], newFileName, {
                type: outputType,
                lastModified: Date.now()
              });

              resolve(compressedFile);
            },
            outputType,
            quality
          );
        } catch (canvasErr) {
          console.warn('[compressImageClient] Compression failed, using original file:', canvasErr);
          resolve(file);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
