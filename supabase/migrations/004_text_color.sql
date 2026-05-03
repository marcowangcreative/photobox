-- Per-gallery custom text color (overrides --text, --text-2, --text-accent)
alter table public.galleries add column if not exists text_color text;
