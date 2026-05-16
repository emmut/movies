import type { ImgHTMLAttributes } from "react";

import type { ProxyImageUrls } from "../types/proxy-image";

type ImageProxyProps = ImgHTMLAttributes<HTMLImageElement> & {
  urls?: ProxyImageUrls | null;
  alt: string;
};

export function ImageProxy({ urls, alt, ...imgProps }: ImageProxyProps) {
  if (!urls?.src) {
    return <img alt={alt} {...imgProps} />;
  }

  return (
    <picture>
      <source srcSet={urls.srcSetAvif} type="image/avif" />
      <source srcSet={urls.srcSetWebp} type="image/webp" />
      <img alt={alt} src={urls.src} {...imgProps} />
    </picture>
  );
}
