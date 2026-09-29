'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';

const failedChatImageUrls = new Set();

function normalizeChatImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';

  if (url.startsWith('data:image/') || url.startsWith('blob:') || url.startsWith('/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : '';
  } catch {
    return '';
  }
}

function ChatAttachmentImage({
  src,
  alt = 'Attachment preview',
  compact = false,
  className = ''
}) {
  const normalizedSrc = React.useMemo(() => normalizeChatImageUrl(src), [src]);
  const [failed, setFailed] = React.useState(
    () => !normalizedSrc || failedChatImageUrls.has(normalizedSrc)
  );

  React.useEffect(() => {
    setFailed(!normalizedSrc || failedChatImageUrls.has(normalizedSrc));
  }, [normalizedSrc]);

  const handleError = React.useCallback(() => {
    if (normalizedSrc) failedChatImageUrls.add(normalizedSrc);
    setFailed(true);
  }, [normalizedSrc]);

  const classes = [
    failed ? 'customer-chat-image-fallback' : 'customer-chat-attachment-image',
    compact ? 'is-compact' : '',
    className
  ].filter(Boolean).join(' ');

  if (failed) {
    return (
      <div className={classes} role="img" aria-label={alt + ' unavailable'}>
        <ImageOff size={compact ? 14 : 22} />
        {!compact && <span>Preview unavailable</span>}
      </div>
    );
  }

  return (
    <img
      className={classes}
      src={normalizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}

export default React.memo(ChatAttachmentImage);
