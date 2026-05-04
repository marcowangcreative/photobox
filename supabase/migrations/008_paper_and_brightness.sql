-- Per-gallery photo paper (frame) color and top-print brightness
alter table public.galleries add column if not exists paper_color text;
alter table public.galleries add column if not exists print_brightness real;
