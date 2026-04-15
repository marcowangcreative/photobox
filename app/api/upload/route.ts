import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import sharp from 'sharp';

const MAX_LONG_EDGE = 2400;
const JPEG_QUALITY = 82;

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const formData = await req.formData();
  const galleryId = formData.get('gallery_id') as string;
  const files = formData.getAll('files') as File[];

  if (!galleryId || !files.length) {
    return NextResponse.json({ error: 'gallery_id and files required' }, { status: 400 });
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('photos')
    .select('sort_order')
    .eq('gallery_id', galleryId)
    .order('sort_order', { ascending: false })
    .limit(1);

  let sortOrder = (existing?.[0]?.sort_order ?? -1) + 1;
  const results = [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Process with Sharp - resize and get dimensions
      const image = sharp(buffer).rotate(); // auto-rotate based on EXIF
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

      // Upload to storage
      const storagePath = `${galleryId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(storagePath, outputBuffer, {
          contentType: 'image/jpeg',
          cacheControl: '31536000',
        });

      if (uploadError) throw uploadError;

      // Insert DB record
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          gallery_id: galleryId,
          storage_path: storagePath,
          filename: file.name,
          width: finalW,
          height: finalH,
          is_landscape: isLandscape,
          sort_order: sortOrder++,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      results.push(photo);
    } catch (err: any) {
      results.push({ error: err.message, filename: file.name });
    }
  }

  return NextResponse.json({ uploaded: results });
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
