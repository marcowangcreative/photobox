-- Galleries
create table public.galleries (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  couple_names text not null,
  sneak_peek_label text default 'sneak peeks',
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Photos
create table public.photos (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid references public.galleries(id) on delete cascade not null,
  storage_path text not null,
  filename text not null,
  width integer,
  height integer,
  is_landscape boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Indexes
create index idx_photos_gallery on public.photos(gallery_id, sort_order);
create index idx_galleries_slug on public.galleries(slug);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('gallery-photos', 'gallery-photos', true);

-- Storage policy: public read
create policy "Public read gallery photos" on storage.objects
  for select using (bucket_id = 'gallery-photos');

-- Storage policy: authenticated upload
create policy "Auth upload gallery photos" on storage.objects
  for insert with check (bucket_id = 'gallery-photos' and auth.role() = 'authenticated');

-- Storage policy: authenticated delete
create policy "Auth delete gallery photos" on storage.objects
  for delete using (bucket_id = 'gallery-photos' and auth.role() = 'authenticated');

-- RLS
alter table public.galleries enable row level security;
alter table public.photos enable row level security;

-- Public can read published galleries
create policy "Public read published galleries" on public.galleries
  for select using (is_published = true);

-- Public can read photos of published galleries
create policy "Public read photos" on public.photos
  for select using (
    exists (select 1 from public.galleries where id = gallery_id and is_published = true)
  );

-- Authenticated full access
create policy "Auth full access galleries" on public.galleries
  for all using (auth.role() = 'authenticated');

create policy "Auth full access photos" on public.photos
  for all using (auth.role() = 'authenticated');

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger galleries_updated_at
  before update on public.galleries
  for each row execute function update_updated_at();
