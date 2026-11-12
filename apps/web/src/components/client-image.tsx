import type { ReactEventHandler } from 'react';

import type { ProxyImageUrls } from '@/types/proxy-image';

type ClientImageProps = {
  imageUrls?: ProxyImageUrls;
  fallbackSrc: string;
  alt: string;
  className?: string;
  /** Load eagerly with high priority — for above-the-fold images (LCP). */
  eager?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: ReactEventHandler<HTMLImageElement>;
  onError?: ReactEventHandler<HTMLImageElement>;
};

export default function ClientImage({
  imageUrls,
  fallbackSrc,
  alt,
  className,
  eager = false,
  fetchPriority,
  onLoad,
  onError,
}: ClientImageProps) {
  return (
    <picture>
      {imageUrls && <source srcSet={imageUrls.srcSetAvif} type="image/avif" />}
      {imageUrls && <source srcSet={imageUrls.srcSetWebp} type="image/webp" />}
      <img
        src={imageUrls?.src ?? fallbackSrc}
        alt={alt}
        className={className}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={fetchPriority ?? (eager ? 'high' : undefined)}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
    </picture>
  );
}
