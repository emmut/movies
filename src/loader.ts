import { env } from './env';

// Docs: https://imagekit.io/docs/image-transformation
type ImageKitLoaderProps = {
  src: string;
  width: number;
  quality: number;
};

export default function imageKitLoader({
  src,
  width,
  quality,
}: ImageKitLoaderProps) {
  console.log(env.NEXT_PUBLIC_IMAGEKIT_ID);
  const params = [`w-${width}`, `q-${quality || 80}`];
  return `https://ik.imagekit.io/${env.NEXT_PUBLIC_IMAGEKIT_ID}/${src}?tr=${params.join(',')}`;
}
