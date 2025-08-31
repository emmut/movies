import { env } from './env';

type LoaderProps = {
  src: string;
  width: number;
  quality: number;
};

// Docs: https://developers.cloudflare.com/images/transform-images
export default function cloudflareLoader({ src, width, quality }: LoaderProps) {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];
  return `https://${env.NEXT_PUBLIC_BASE_URL}/cdn-cgi/image/${params.join(',')}/${src}`;
}
