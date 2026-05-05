import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const galleryId = req.nextUrl.searchParams.get('gallery_id');

  let query = supabase
    .from('orders')
    .select('*, gallery:galleries(slug, couple_names)')
    .order('created_at', { ascending: false });

  if (galleryId) query = query.eq('gallery_id', galleryId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  const body = await req.json();
  const { id, status, notes } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (status === 'fulfilled') update.fulfilled_at = new Date().toISOString();
  if (notes !== undefined) update.notes = notes;

  const { data, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
