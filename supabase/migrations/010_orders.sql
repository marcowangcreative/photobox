-- Per-gallery price (cents) + orders table

alter table public.galleries add column if not exists price_cents integer default 54900;

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid references public.galleries(id) on delete restrict not null,
  status text not null default 'pending', -- pending | paid | fulfilled | cancelled | refunded
  amount_cents integer not null,
  currency text not null default 'usd',

  stripe_session_id text unique,
  stripe_payment_intent_id text unique,

  customer_email text,
  customer_name text,

  shipping_name text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text,

  notes text,

  created_at timestamptz default now(),
  paid_at timestamptz,
  fulfilled_at timestamptz
);

create index if not exists idx_orders_gallery on public.orders(gallery_id, created_at desc);
create index if not exists idx_orders_status on public.orders(status, created_at desc);
create index if not exists idx_orders_stripe_session on public.orders(stripe_session_id);

alter table public.orders enable row level security;

-- Only service role / authenticated may read or modify orders.
create policy "Auth full access orders" on public.orders
  for all using (auth.role() = 'authenticated');
