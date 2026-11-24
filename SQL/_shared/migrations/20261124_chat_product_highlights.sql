-- Shared Order Deck product highlights.
-- Apply once to each app's VAULT Supabase project (BB and ST).
-- The app server accesses this table with its VAULT service-role key; browser roles
-- have no direct access to the configuration rows.
create table if not exists public.chat_product_highlights (
  app_key text primary key check (app_key in ('BB_STORE_ORDERS', 'ST_SINGTO_STORE')),
  product_names jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint chat_product_highlights_product_names_array check (
    jsonb_typeof(product_names) = 'array'
    and jsonb_array_length(product_names) <= 30
  )
);

alter table public.chat_product_highlights enable row level security;
revoke all on table public.chat_product_highlights from anon, authenticated;
grant all on table public.chat_product_highlights to service_role;

create or replace function public.touch_chat_product_highlights_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chat_product_highlights_touch_updated_at on public.chat_product_highlights;
create trigger chat_product_highlights_touch_updated_at
before update on public.chat_product_highlights
for each row execute function public.touch_chat_product_highlights_updated_at();

notify pgrst, 'reload schema';
