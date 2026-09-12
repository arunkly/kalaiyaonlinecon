export type GalleryItem = {
  slug: string;
  title: string;
  place: string;
  archived?: boolean;
  blurb: string;
  tone: string;
};

export const gallery: GalleryItem[] = [];
