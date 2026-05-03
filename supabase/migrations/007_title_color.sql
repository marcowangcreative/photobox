-- Per-gallery grid-view title color (overrides --title)
alter table public.galleries add column if not exists title_color text;
