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
  print_brightness: number | null;
  font_preset: 'editorial' | 'romantic' | 'modern' | null;
  price_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  gallery_id: string;
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled' | 'refunded';
  amount_cents: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
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
