-- ST SINGTO STORE · Theme Runtime
-- ใช้ตารางกลางเดิม public.app_themes ร่วมกับระบบเดิม
-- รันใน Supabase โปรเจกต์ ROOM 04 / Private Vault
-- สคริปต์นี้ทำงานแบบ idempotent และไม่ลบข้อมูลธีมเดิม

create extension if not exists pgcrypto;

create table if not exists public.app_themes (
  id uuid primary key default gen_random_uuid(),
  theme_key text not null unique,
  name text not null,
  description text not null default '',
  background_color text not null default '#090611',
  surface_color text not null default '#151027',
  primary_color text not null default '#b879ff',
  accent_color text not null default '#00e5ff',
  border_style text not null default 'solid',
  button_style text not null default 'solid',
  radius numeric(6,2) not null default 16,
  glow numeric(6,2) not null default 12,
  motion_enabled boolean not null default true,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- คอลัมน์ที่ Theme Studio ใช้สำหรับสีตัวหนังสือ ฟอนต์ และกราฟิกพื้นหลัง
alter table public.app_themes
  add column if not exists text_primary_color text not null default '#FFFFFF',
  add column if not exists text_secondary_color text not null default '#B8A8BB',
  add column if not exists font_body text not null default 'Noto Sans Thai',
  add column if not exists font_heading text not null default 'Chakra Petch',
  add column if not exists graphic_url text not null default '';

update public.app_themes
set
  text_primary_color = coalesce(nullif(text_primary_color, ''), '#FFFFFF'),
  text_secondary_color = coalesce(nullif(text_secondary_color, ''), '#B8A8BB'),
  font_body = coalesce(nullif(font_body, ''), 'Noto Sans Thai'),
  font_heading = coalesce(nullif(font_heading, ''), 'Chakra Petch'),
  graphic_url = coalesce(graphic_url, '')
where
  text_primary_color is null or text_primary_color = ''
  or text_secondary_color is null or text_secondary_color = ''
  or font_body is null or font_body = ''
  or font_heading is null or font_heading = ''
  or graphic_url is null;

create index if not exists app_themes_enabled_order_idx
  on public.app_themes (is_enabled, sort_order);

create or replace function public.touch_app_customization_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_themes_touch_updated_at on public.app_themes;
create trigger app_themes_touch_updated_at
before update on public.app_themes
for each row execute function public.touch_app_customization_updated_at();

alter table public.app_themes enable row level security;

drop policy if exists app_themes_public_read on public.app_themes;
create policy app_themes_public_read
on public.app_themes
for select to anon, authenticated
using (is_enabled = true);

-- Secret Gallery บันทึกธีมผ่าน anon/publishable key ตาม flow เดิมของระบบ
-- หากต้องการล็อกการเขียนภายหลัง ให้ย้าย write ไป protected server route ก่อน

drop policy if exists app_themes_secret_write on public.app_themes;
create policy app_themes_secret_write
on public.app_themes
for all to anon, authenticated
using (true)
with check (true);

notify pgrst, 'reload schema';

-- ตรวจผลหลังรัน
select theme_key, name, is_enabled, sort_order, graphic_url
from public.app_themes
order by sort_order, theme_key;
