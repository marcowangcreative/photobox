import { createAdminClient, getPhotoUrl } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import PhotoGallery from '@/components/PhotoGallery';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: gallery } = await supabase
    .from('galleries')
    .select('couple_names')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!gallery) return { title: 'Gallery Not Found' };

  return {
    title: `${gallery.couple_names} — Prints`,
    description: `${gallery.couple_names} wedding gallery`,
    openGraph: {
      title: `${gallery.couple_names} — Prints`,
      description: 'Open the box to see the prints.',
    },
  };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: gallery } = await supabase
    .from('galleries')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!gallery) notFound();

  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', gallery.id)
    .order('sort_order', { ascending: true });

  const photosWithUrls = (photos || []).map(p => ({
    ...p,
    url: getPhotoUrl(p.storage_path),
  }));

  return (
    <PhotoGallery
      coupleNames={gallery.couple_names}
      sneakPeekLabel={gallery.sneak_peek_label}
      photos={photosWithUrls}
      galleryUrl={`${process.env.NEXT_PUBLIC_SITE_URL}/g/${slug}`}
      gridStyle={gallery.grid_style || 'stacked'}
    />
  );
}
