-- BB SCRIPT ATELIER
-- รันใน Supabase โปรเจกต์สายส่งเลข
-- ตารางนี้เก็บเฉพาะสคริปต์และรูป ไม่สร้าง/แก้ตารางสินค้าเดิม

create extension if not exists pgcrypto;

create table if not exists public.sales_script_cards (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  title text not null,
  subtitle text not null default '',
  script_text text not null default '',
  ai_context text not null default '',
  ai_instruction text not null default '',
  blocks_json jsonb not null default '[]'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_script_cards_sku_idx on public.sales_script_cards (lower(sku));
create index if not exists sales_script_cards_status_idx on public.sales_script_cards (status);
create index if not exists sales_script_cards_updated_idx on public.sales_script_cards (updated_at desc);

create or replace function public.sales_script_cards_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sales_script_cards_touch_updated_at on public.sales_script_cards;
create trigger sales_script_cards_touch_updated_at
before update on public.sales_script_cards
for each row execute function public.sales_script_cards_touch_updated_at();

alter table public.sales_script_cards enable row level security;

drop policy if exists sales_script_cards_select on public.sales_script_cards;
drop policy if exists sales_script_cards_insert on public.sales_script_cards;
drop policy if exists sales_script_cards_update on public.sales_script_cards;
drop policy if exists sales_script_cards_delete on public.sales_script_cards;

-- โปรเจกต์นี้ใช้ anon key ภายในห้องระบบเดิม จึงเปิดเฉพาะตาราง Script Atelier
-- ภายหลังถ้ามีระบบ login ค่อยเปลี่ยน policy เป็น authenticated ได้
create policy sales_script_cards_select on public.sales_script_cards for select to anon, authenticated using (true);
create policy sales_script_cards_insert on public.sales_script_cards for insert to anon, authenticated with check (true);
create policy sales_script_cards_update on public.sales_script_cards for update to anon, authenticated using (true) with check (true);
create policy sales_script_cards_delete on public.sales_script_cards for delete to anon, authenticated using (true);

grant select, insert, update, delete on public.sales_script_cards to anon, authenticated;

-- Storage bucket สำหรับรูปใน Script Card
insert into storage.buckets (id, name, public)
values ('sales-script-images', 'sales-script-images', true)
on conflict (id) do update set public = true;

drop policy if exists sales_script_images_read on storage.objects;
drop policy if exists sales_script_images_insert on storage.objects;
drop policy if exists sales_script_images_update on storage.objects;
drop policy if exists sales_script_images_delete on storage.objects;

create policy sales_script_images_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'sales-script-images');

create policy sales_script_images_insert on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'sales-script-images');

create policy sales_script_images_update on storage.objects
for update to anon, authenticated
using (bucket_id = 'sales-script-images')
with check (bucket_id = 'sales-script-images');

create policy sales_script_images_delete on storage.objects
for delete to anon, authenticated
using (bucket_id = 'sales-script-images');

-- ตรวจหลังรัน:
-- select id, sku, title, status, version, updated_at from public.sales_script_cards order by updated_at desc;
-- select id, name, public from storage.buckets where id = 'sales-script-images';
