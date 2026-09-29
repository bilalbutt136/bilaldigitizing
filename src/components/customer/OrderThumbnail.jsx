'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';
import { normalizeOrderImageUrl } from '../../utils/orderImageUtils';

const failedImageUrls = new Set();

const OrderThumbnail = React.memo(function OrderThumbnail({
  src,
  alt = 'Order artwork',
  width = 48,
  height = 48,
  borderRadius = 10,
  border = '1px solid var(--border-color)',
  style,
  className,
  eager = false
}) {
  const normalizedSrc = React.useMemo(() => normalizeOrderImageUrl(src), [src]);
  const [failed, setFailed] = React.useState(
    () => !normalizedSrc || failedImageUrls.has(normalizedSrc)
  );

  React.useEffect(() => {
    setFailed(!normalizedSrc || failedImageUrls.has(normalizedSrc));
  }, [normalizedSrc]);

  const handleError = React.useCallback(() => {
    if (normalizedSrc) {
      failedImageUrls.add(normalizedSrc);
    }
    setFailed(true);
  }, [normalizedSrc]);

  const sharedStyle = {
    width,
    height,
    borderRadius,
    border,
    flexShrink: 0,
    ...style
  };

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        data-order-image-fallback="true"
        style={{
          ...sharedStyle,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          color: '#94a3b8',
          overflow: 'hidden'
        }}
      >
        <ImageOff size={Math.max(14, Math.min(Number(width) || 48, Number(height) || 48) * 0.38)} />
      </div>
    );
  }

  return (
    <img
      className={className}
      src={normalizedSrc}
      alt={alt}
      onError={handleError}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={{
        ...sharedStyle,
        objectFit: 'cover'
      }}
    />
  );
});

export default OrderThumbnail;
