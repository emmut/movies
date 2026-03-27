import { type ImageLoaderProps } from "next/image";

export default ({ src, width, quality }: ImageLoaderProps) => {
  const params = new URLSearchParams({ src, width: String(width) });
  if (quality) params.set("quality", String(quality));
  return `/api/image?${params}`;
};
