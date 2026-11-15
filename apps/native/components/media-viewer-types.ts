export type GalleryMedia = { id: string; title: string; image?: string; video?: string };

export type MediaViewerProps = {
  items: GalleryMedia[];
  index: number;
  setIndex: (value: number) => void;
  close: () => void;
  title: string;
};
