import { Resend } from 'resend';
import type { Order, Gallery } from './types';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.ORDER_EMAIL_FROM || 'Photobox <orders@box.marcowang.com>';
const NOTIFICATION_TO = process.env.ORDER_NOTIFICATION_EMAIL;

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function shippingBlock(o: Order) {
  const lines = [
    o.shipping_name,
    o.shipping_address_line1,
    o.shipping_address_line2,
    [o.shipping_city, o.shipping_state, o.shipping_postal_code].filter(Boolean).join(', '),
    o.shipping_country,
  ].filter(Boolean);
  return lines.join('\n');
}

export async function sendOrderNotificationEmail(order: Order, gallery: Gallery) {
  if (!resend || !NOTIFICATION_TO) return;
  const subject = `New order — ${gallery.couple_names} — ${dollars(order.amount_cents)}`;
  const text = [
    `New order received.`,
    ``,
    `Gallery: ${gallery.couple_names} (/g/${gallery.slug})`,
    `Amount:  ${dollars(order.amount_cents)}`,
    `Order ID: ${order.id}`,
    ``,
    `Customer:`,
    `  ${order.customer_name || '—'}`,
    `  ${order.customer_email || '—'}`,
    ``,
    `Ship to:`,
    shippingBlock(order).split('\n').map(l => `  ${l}`).join('\n'),
  ].join('\n');

  try {
    await resend.emails.send({ from: FROM, to: NOTIFICATION_TO, subject, text });
  } catch (err) {
    console.error('[email] notification failed', err);
  }
}

export async function sendCustomerReceiptEmail(order: Order, gallery: Gallery) {
  if (!resend || !order.customer_email) return;
  const subject = `Your Photobox order — ${gallery.couple_names}`;
  const text = [
    `Thanks for your order!`,
    ``,
    `We're putting together your curated print box from ${gallery.couple_names}'s gallery.`,
    `It will ship to:`,
    ``,
    shippingBlock(order),
    ``,
    `Total: ${dollars(order.amount_cents)}`,
    `Order ID: ${order.id}`,
    ``,
    `You'll get another email with tracking once it's on the way.`,
  ].join('\n');

  try {
    await resend.emails.send({ from: FROM, to: order.customer_email, subject, text });
  } catch (err) {
    console.error('[email] receipt failed', err);
  }
}
