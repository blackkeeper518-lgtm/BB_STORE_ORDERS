-- PRIVATE VAULT · ภาพและสคริปต์สำหรับแอดมิน
-- รันใน Supabase SQL Editor ของโปรเจกต์ที่หน้า /script-atelier ใช้งานอยู่
-- หน้าเว็บใช้ public anon/publishable key จึงมี policy สำหรับ anon และ authenticated

create extension if not exists pgcrypto;

create table if not exists public.sales_script_cards (
  id uuid primary key default gen_random_uuid(),
  -- คอลัมน์ legacy ที่หน้าเดิมอาจบังคับใช้ แต่ไม่ได้แสดงใน Private Vault
  sku text not null default '',
  title text not null,
  subtitle text not null default '',
  script_text text not null,
  ai_context text not null default '',
  ai_instruction text not null default '',
  blocks_json jsonb not null default '[]'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales_script_cards enable row level security;

create index if not exists sales_script_cards_updated_at_idx
  on public.sales_script_cards (updated_at desc);

create index if not exists sales_script_cards_status_idx
  on public.sales_script_cards (status);

-- ให้รันซ้ำได้โดยไม่ชนชื่อ policy
 drop policy if exists "private vault read scripts" on public.sales_script_cards;
 drop policy if exists "private vault insert scripts" on public.sales_script_cards;
 drop policy if exists "private vault update scripts" on public.sales_script_cards;
 drop policy if exists "private vault delete scripts" on public.sales_script_cards;

create policy "private vault read scripts"
  on public.sales_script_cards
  for select
  to anon, authenticated
  using (true);

create policy "private vault insert scripts"
  on public.sales_script_cards
  for insert
  to anon, authenticated
  with check (true);

create policy "private vault update scripts"
  on public.sales_script_cards
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "private vault delete scripts"
  on public.sales_script_cards
  for delete
  to anon, authenticated
  using (true);

-- คลังภาพต้นฉบับ เช่น ภาพโพสต์ 1080x1350
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-script-images',
  'sales-script-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

 drop policy if exists "private vault read images" on storage.objects;
 drop policy if exists "private vault upload images" on storage.objects;
 drop policy if exists "private vault update images" on storage.objects;
 drop policy if exists "private vault delete images" on storage.objects;

create policy "private vault read images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'sales-script-images');

create policy "private vault upload images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'sales-script-images'
    and name like 'script-art/%'
  );

create policy "private vault update images"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'sales-script-images' and name like 'script-art/%')
  with check (bucket_id = 'sales-script-images' and name like 'script-art/%');

create policy "private vault delete images"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'sales-script-images' and name like 'script-art/%');

-- ตรวจผลหลังรัน
select id, title, status, version, updated_at
from public.sales_script_cards
order by updated_at desc
limit 10;

select id, name, public, file_size_limit
from storage.buckets
where id = 'sales-script-images';
