import { type ImageLoaderProps } from "next/image";
import { generateUrl } from "@imgproxy/imgproxy-js-core";
import { env } from "@/env";

const imgproxyEndpoint = env.NEXT_PUBLIC_IMGPROXY_ENDPOINT;
const imgproxyBaseUrl = env.NEXT_PUBLIC_IMGPROXY_BASE_URL;

export default ({ src, width, quality }: ImageLoaderProps) => {
  const fullSrc = new URL(src, imgproxyBaseUrl).toString();
  const escapedSrc = fullSrc.replace("%", "%25").replace("?", "%3F").replace("@", "%40");

  const path = generateUrl(
    { value: escapedSrc, type: "plain" },
    { width, quality },
  );

  return `${imgproxyEndpoint}/unsafe${path}`;
}
