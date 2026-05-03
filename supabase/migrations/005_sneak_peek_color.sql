-- Per-gallery sneak peek (lid sub-label) text color (overrides --text-muted)
alter table public.galleries add column if not exists sneak_peek_color text;
