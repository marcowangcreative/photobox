import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import sharp from 'sharp';

const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 82;

// Vercel Pro: allow up to 60s per upload
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const galleryId = req.nextUrl.searchParams.get('gallery_id');

  if (!galleryId) {
    return NextResponse.json({ error: 'gallery_id required' }, { status: 400 });
  }

  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = (photos || []).map(p => {
    const { data } = supabase.storage.from('gallery-photos').getPublicUrl(p.storage_path);
    return { ...p, url: data.publicUrl };
  });

  return NextResponse.json(withUrls);
}

export async function PUT(req: NextRequest) {
  const supabase = createAdminClient();
  const { photo_ids } = await req.json();

  if (!photo_ids?.length) return NextResponse.json({ error: 'photo_ids required' }, { status: 400 });

  const updates = photo_ids.map((id: string, i: number) =>
    supabase.from('photos').update({ sort_order: i }).eq('id', id)
  );

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}

// Single file upload
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const formData = await req.formData();
  const galleryId = formData.get('gallery_id') as string;
  const file = formData.get('file') as File;
  const sortOrder = parseInt(formData.get('sort_order') as string || '0', 10);

  if (!galleryId || !file) {
    return NextResponse.json({ error: 'gallery_id and file required' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    const image = sharp(buffer).rotate();
    const metadata = await image.metadata();

    let processed = image;
    const w = metadata.width || 0;
    const h = metadata.height || 0;
    const longEdge = Math.max(w, h);

    if (longEdge > MAX_LONG_EDGE) {
      processed = w > h
        ? image.resize(MAX_LONG_EDGE, null)
        : image.resize(null, MAX_LONG_EDGE);
    }

    const outputBuffer = await processed
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const outputMeta = await sharp(outputBuffer).metadata();
    const finalW = outputMeta.width || 0;
    const finalH = outputMeta.height || 0;
    const isLandscape = finalW > finalH;

    const storagePath = `${galleryId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('gallery-photos')
      .upload(storagePath, outputBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      });

    if (uploadError) throw uploadError;

    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        gallery_id: galleryId,
        storage_path: storagePath,
        filename: file.name,
        width: finalW,
        height: finalH,
        is_landscape: isLandscape,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    const { data: urlData } = supabase.storage.from('gallery-photos').getPublicUrl(storagePath);

    return NextResponse.json({ ...photo, url: urlData.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, filename: file.name }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { photo_id } = await req.json();

  const { data: photo } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('id', photo_id)
    .single();

  if (photo) {
    await supabase.storage.from('gallery-photos').remove([photo.storage_path]);
    await supabase.from('photos').delete().eq('id', photo_id);
  }

  return NextResponse.json({ success: true });
}
