import { generateImageUrl, type IGenerateImageUrl } from "@imgproxy/imgproxy-node";
import { env } from "@movies/env/server";

import type { ProxyImageUrls } from "./types/proxy-image";

type ImgproxyOptions = NonNullable<IGenerateImageUrl["options"]>;
type ImgproxyFormat = ImgproxyOptions["format"];

type BuildProxyImageUrlsOptions = {
  width?: number;
  height?: number;
  fill?: boolean;
} & Omit<ImgproxyOptions, "resize" | "size" | "resize_type" | "dpr" | "format">;

function getImgproxySourceUrl(src: string) {
  if (src.startsWith("http")) return src;
  const base = (env.IMGPROXY_BASE_URL ?? "https://image.tmdb.org/t/p/original").replace(/\/$/, "");
  return `${base}${src}`;
}

function escapeSourceUrl(url: string) {
  return url.replace(/%/g, "%25").replace(/\?/g, "%3F").replace(/@/g, "%40");
}

export function buildProxyImageUrls(
  src: string | null | undefined,
  { width, height, fill = false, ...options }: BuildProxyImageUrlsOptions = {},
): ProxyImageUrls {
  if (!src) {
    return { src: "", srcSetAvif: "", srcSetWebp: "" };
  }

  const endpoint = env.IMGPROXY_ENDPOINT;
  const key = env.IMGPROXY_KEY;
  const salt = env.IMGPROXY_SALT;

  // Without endpoint/key/salt we fall back to raw TMDB URLs
  if (!endpoint || !key || !salt) {
    const base = (env.IMGPROXY_BASE_URL ?? "https://image.tmdb.org/t/p/w500").replace(/\/$/, "");
    const url = `${base}${src}`;
    return { src: url, srcSetAvif: `${url} 1x`, srcSetWebp: `${url} 1x` };
  }

  const source = escapeSourceUrl(getImgproxySourceUrl(src));

  function buildUrl(format: ImgproxyFormat, dpr: number) {
    return generateImageUrl({
      endpoint: endpoint!,
      key: key!,
      salt: salt!,
      url: { value: source, displayAs: "plain" },
      options: {
        resize: {
          width,
          height,
          resizing_type: fill ? "fill-down" : "fit",
        },
        format,
        dpr,
        ...options,
      },
    });
  }

  return {
    src: buildUrl("webp", 2),
    srcSetAvif: `${buildUrl("avif", 1)} 1x, ${buildUrl("avif", 2)} 2x`,
    srcSetWebp: `${buildUrl("webp", 1)} 1x, ${buildUrl("webp", 2)} 2x`,
  };
}
