import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, generateSlug } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('galleries')
    .select('*, photos(count)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { couple_names, sneak_peek_label, custom_slug } = body;

  if (!couple_names) {
    return NextResponse.json({ error: 'couple_names required' }, { status: 400 });
  }

  const slug = custom_slug
    ? custom_slug.toLowerCase().replace(/[^a-z0-9]+/g, '').replace(/(^-|-$)/g, '')
    : generateSlug(couple_names);

  const { data, error } = await supabase
    .from('galleries')
    .insert({
      slug,
      couple_names,
      sneak_peek_label: sneak_peek_label || 'sneak peeks',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('galleries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = createAdminClient();
  const { id } = await req.json();

  // Delete storage files first
  const { data: photos } = await supabase
    .from('photos')
    .select('storage_path')
    .eq('gallery_id', id);

  if (photos?.length) {
    await supabase.storage
      .from('gallery-photos')
      .remove(photos.map(p => p.storage_path));
  }

  const { error } = await supabase
    .from('galleries')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
