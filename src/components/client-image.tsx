import type { ProxyImageUrls } from '@/types/proxy-image';

type ClientImageProps = {
  imageUrls?: ProxyImageUrls;
  fallbackSrc: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export default function ClientImage({
  imageUrls,
  fallbackSrc,
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
}: ClientImageProps) {
  return (
    <picture>
      {imageUrls && <source srcSet={imageUrls.srcSetAvif} type="image/avif" />}
      {imageUrls && <source srcSet={imageUrls.srcSetWebp} type="image/webp" />}
      <img
        src={imageUrls?.src ?? fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
      />
    </picture>
  );
}
