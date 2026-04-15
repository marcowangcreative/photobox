import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side (public, read-only for published galleries)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side (admin, full access)
export function createAdminClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Get public URL for a storage path
export function getPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('gallery-photos')
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

// Generate a URL-safe slug from couple names
export function generateSlug(coupleNames: string): string {
  return coupleNames
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 6);
}
