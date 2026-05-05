-- Per-gallery font pairing preset (editorial | romantic | modern)
alter table public.galleries add column if not exists font_preset text;
