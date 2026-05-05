export interface Gallery {
  id: string;
  slug: string;
  couple_names: string;
  sneak_peek_label: string;
  is_published: boolean;
  box_color: string | null;
  text_color: string | null;
  sneak_peek_color: string | null;
  felt_color: string | null;
  title_color: string | null;
  paper_color: string | null;
  print_brightness: number | null;
  font_preset: 'editorial' | 'romantic' | 'modern' | null;
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
