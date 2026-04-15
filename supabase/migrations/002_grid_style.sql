-- Add grid_style column to galleries
alter table public.galleries add column if not exists grid_style text default 'stacked';
