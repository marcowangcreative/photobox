-- Per-gallery custom box color (overrides --tray-outer and --lid-bg)
alter table public.galleries add column if not exists box_color text;
