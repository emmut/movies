import type { ProxyImageUrls } from '@/types/proxy-image';

type ClientImageProps = {
  imageUrls?: ProxyImageUrls;
  fallbackSrc: string;
  alt: string;
  className?: string;
  /** Load eagerly with high priority — for above-the-fold images (LCP). */
  eager?: boolean;
};

export default function ClientImage({
  imageUrls,
  fallbackSrc,
  alt,
  className,
  eager = false,
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
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
      />
    </picture>
  );
}
