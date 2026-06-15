-- Per-gallery box exterior texture overlay. null = smooth, 'linen' = woven linen.
alter table public.galleries add column if not exists box_texture text;
