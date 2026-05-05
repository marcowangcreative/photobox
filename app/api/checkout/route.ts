import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { gallery_id } = await req.json();

  if (!gallery_id) {
    return NextResponse.json({ error: 'gallery_id required' }, { status: 400 });
  }

  const { data: gallery, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', gallery_id)
    .eq('is_published', true)
    .single();

  if (error || !gallery) {
    return NextResponse.json({ error: 'Gallery not available' }, { status: 404 });
  }

  const amount = gallery.price_cents ?? 54900;
  const origin = req.nextUrl.origin;

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      gallery_id: gallery.id,
      status: 'pending',
      amount_cents: amount,
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amount,
        product_data: {
          name: `Photokase: ${gallery.couple_names}`,
          description: `A curated keepsake box of prints from ${gallery.couple_names}'s gallery.`,
        },
      },
      quantity: 1,
    }],
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    phone_number_collection: { enabled: true },
    success_url: `${origin}/g/${gallery.slug}?order=${order.id}&status=success`,
    cancel_url: `${origin}/g/${gallery.slug}?order=${order.id}&status=cancelled`,
    metadata: {
      order_id: order.id,
      gallery_id: gallery.id,
      gallery_slug: gallery.slug,
    },
  });

  await supabase
    .from('orders')
    .update({ stripe_session_id: session.id })
    .eq('id', order.id);

  return NextResponse.json({ url: session.url });
}
