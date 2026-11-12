'use client';

import { LoaderCircle } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';

import ClientImage from '@/components/client-image';
import type { ProxyImageUrls } from '@/types/proxy-image';

export function GalleryImage({ imageUrls, alt }: { imageUrls: ProxyImageUrls; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  async function handleLoad(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    try {
      await image.decode();
      setStatus('ready');
    } catch {
      // A loaded image can still be displayed if decoding is unsupported.
      setStatus(image.naturalWidth > 0 ? 'ready' : 'error');
    }
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      aria-busy={status === 'loading'}
    >
      {status === 'loading' && (
        <output className="absolute inset-0 flex items-center justify-center text-white/60">
          <LoaderCircle
            className="size-7 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="sr-only">Loading {alt}</span>
        </output>
      )}
      {status === 'error' && (
        <output className="absolute text-sm text-zinc-400">Unable to load image</output>
      )}
      <ClientImage
        imageUrls={imageUrls}
        fallbackSrc={imageUrls.src}
        alt={alt}
        className={`h-full w-full object-contain transition-opacity duration-150 motion-reduce:transition-none ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
        eager
        fetchPriority="auto"
        onLoad={handleLoad}
        onError={() => setStatus('error')}
      />
    </div>
  );
}
