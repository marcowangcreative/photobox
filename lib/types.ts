export interface Gallery {
  id: string;
  slug: string;
  couple_names: string;
  sneak_peek_label: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  gallery_id: string;
  storage_path: string;
  filename: string;
  width: number | null;
  height: number | null;
  is_landscape: boolean;
  sort_order: number;
  created_at: string;
  // Computed client-side
  url?: string;
}

export interface GalleryWithPhotos extends Gallery {
  photos: Photo[];
}
