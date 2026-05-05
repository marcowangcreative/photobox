import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase';
import { sendOrderNotificationEmail, sendCustomerReceiptEmail } from '@/lib/email';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing webhook signature/secret' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret);
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: 'No order_id in session metadata' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ship = session.collected_information?.shipping_details;
  const addr = ship?.address;

  const update = {
    status: 'paid' as const,
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
    customer_email: session.customer_details?.email ?? null,
    customer_name: session.customer_details?.name ?? null,
    shipping_name: ship?.name ?? session.customer_details?.name ?? null,
    shipping_address_line1: addr?.line1 ?? null,
    shipping_address_line2: addr?.line2 ?? null,
    shipping_city: addr?.city ?? null,
    shipping_state: addr?.state ?? null,
    shipping_postal_code: addr?.postal_code ?? null,
    shipping_country: addr?.country ?? null,
  };

  const { data: order, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', orderId)
    .select()
    .single();

  if (error || !order) {
    console.error('[webhook] failed to update order', error);
    return NextResponse.json({ error: 'Order update failed' }, { status: 500 });
  }

  const { data: gallery } = await supabase
    .from('galleries')
    .select('*')
    .eq('id', order.gallery_id)
    .single();

  if (gallery) {
    await Promise.all([
      sendOrderNotificationEmail(order, gallery),
      sendCustomerReceiptEmail(order, gallery),
    ]);
  }

  return NextResponse.json({ received: true });
}
