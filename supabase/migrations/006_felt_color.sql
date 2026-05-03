-- Per-gallery box interior "felt" color (overrides --tray-grad-1/2/3)
alter table public.galleries add column if not exists felt_color text;
