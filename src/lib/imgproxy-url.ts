import 'server-only';

import { generateImageUrl, type IGenerateImageUrl } from '@imgproxy/imgproxy-node';

import { env } from '@/env';
import type { ProxyImageUrls } from '@/types/proxy-image';

type ImgproxyOptions = NonNullable<IGenerateImageUrl['options']>;
type ImgproxyFormat = ImgproxyOptions['format'];

type BuildProxyImageUrlsOptions = {
  width?: number;
  height?: number;
  fill?: boolean;
} & Omit<ImgproxyOptions, 'resize' | 'size' | 'resize_type' | 'dpr' | 'format'>;

const imgproxyEndpoint = env.NEXT_PUBLIC_IMGPROXY_ENDPOINT;
const imgproxyBaseUrl = env.NEXT_PUBLIC_IMGPROXY_BASE_URL;
const imgproxyKey = env.IMGPROXY_KEY;
const imgproxySalt = env.IMGPROXY_SALT;

function getImgproxySourceUrl(src: string) {
  if (src.startsWith('http')) {
    return src;
  }

  return `${imgproxyBaseUrl.replace(/\/$/, '')}${src}`;
}

function escapeSourceUrl(url: string) {
  return url.replace(/%/g, '%25').replace(/\?/g, '%3F').replace(/@/g, '%40');
}

export function buildProxyImageUrls(
  src: string,
  { width, height, fill = false, ...options }: BuildProxyImageUrlsOptions = {},
): ProxyImageUrls {
  const source = escapeSourceUrl(getImgproxySourceUrl(src));

  function buildUrl(format: ImgproxyFormat, dpr: number) {
    return generateImageUrl({
      endpoint: imgproxyEndpoint,
      key: imgproxyKey,
      salt: imgproxySalt,
      url: {
        value: source,
        displayAs: 'plain',
      },
      options: {
        resize: {
          width,
          height,
          resizing_type: fill ? 'fill-down' : 'fit',
        },
        format,
        dpr,
        ...options,
      },
    });
  }

  return {
    src: buildUrl('webp', 2),
    srcSetAvif: `${buildUrl('avif', 1)} 1x, ${buildUrl('avif', 2)} 2x`,
    srcSetWebp: `${buildUrl('webp', 1)} 1x, ${buildUrl('webp', 2)} 2x`,
  };
}
