-- ST SINGTO STORE · PROJECT PERMISSIONS BUNDLE
-- ================================================================
-- ใช้กับ Supabase project ของ ST เท่านั้น
-- ไฟล์นี้จัดสิทธิ์ ไม่สร้าง/ลบข้อมูล และไม่เปิด PUBLIC แบบกว้าง
--
-- หลักการ:
--   1) เว็บ server / n8n ใช้ service_role เป็นทางหลัก
--   2) anon/authenticated อ่านได้เฉพาะข้อมูลที่ browser จำเป็นต้องอ่านเอง
--   3) โต๊ะออเดอร์หลักไม่เปิดให้ anon/authenticated อ่านหรือเขียน
--   4) Chat credentials และ Chat tables ต้องอยู่ใน Chat project เดียวกับ
--      CHAT_SUPABASE_URL ที่ server ใช้งานจริง
--   5) รันด้วยเจ้าของฐานข้อมูลหรือ role ที่มีสิทธิ์ GRANT
--
-- ไม่รวม:
--   - การสร้าง schema/table/view/function
--   - การแก้ order logic, parser, n8n workflow
--   - การเปิดสิทธิ์ให้ PUBLIC
--   - การคืนห้องหรือเปิดสิทธิ์ให้ ANDROMEDA โดยอัตโนมัติ
-- ================================================================

begin;

-- ------------------------------------------------
-- 00 · Common schema access
-- ------------------------------------------------
grant usage on schema public to service_role;

-- ------------------------------------------------
-- 01 · ROOM 01 · Order Core
-- ------------------------------------------------
-- HERMES เป็นโต๊ะหลัก: server/n8n อ่าน สร้าง และแก้สถานะ/ข้อมูลตาม route
-- ไม่มี DELETE เพื่อไม่ลบหลักฐานออเดอร์

grant select, insert, update
on table public."🗝️HERMES_ARCHIVE"
to service_role;

-- ตารางหลักที่ระบบแก้ไขจาก Order Editor ใช้ service_role เท่านั้น
-- (ถ้ามีอยู่ใน project นี้จึงค่อย grant; ช่วยให้ไฟล์ใช้ซ้ำได้โดยไม่พัง)
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    '🌀SINGULARITY_xXx_EXCHANGE',
    '💀THANATOS_xXx_DEATH_NOTE'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 02 · ROOM 01 · Order views used by the web
-- ------------------------------------------------
-- อ่านได้จาก server เท่านั้น; ไม่เปิด anon/authenticated

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    '🌌MULTIVERSE_xXx_NEXUS',
    '🛰️PIONEER_xXx_CAPSULE',
    '🌟GENESIS_xXx_HISTORY',
    '🔸PARADOX_xXx_EXCHANGE',
    '🔮SHADOW_xXx_RECALL',
    '🦅ROGUE_xXx_SHIPPINGz',
    '⛩️VOID_xXx_GATEWAYz',
    '📓DEAD_xXx_NOTE'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ตั้งใจไม่ grant ให้ 🪐ANDROMEDA_xXx_SENT เพราะไม่ใช่ active ST reader
-- และไม่ควรเปิด permission เพื่อกลบ deployment/bundle เก่า

-- ------------------------------------------------
-- 03 · ROOM 02 · Page catalog
-- ------------------------------------------------
-- เว็บอ่าน page catalog และ server จัดการสถานะ/การตั้งค่าเพจ
-- access_token ไม่ถูกเปิดให้ browser role

do $$
begin
  if to_regclass('public."🌈MILKY_WAY_xXx_TOKEN _PAGE"') is not null then
    execute 'grant select, insert, update, delete on table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" to service_role';
  end if;
end
$$;

-- คอลัมน์ compatibility ที่ server ใช้สำหรับสถานะ web
-- รันได้เฉพาะเมื่อ table มีอยู่จริง
 do $$
begin
  if to_regclass('public."🌈MILKY_WAY_xXx_TOKEN _PAGE"') is not null then
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists status_web text not null default ''ON''';
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists created_at timestamptz not null default now()';
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists updated_at timestamptz not null default now()';
  end if;
end
$$;

-- ------------------------------------------------
-- 04 · ROOM 04 · Product Master
-- ------------------------------------------------
-- Browser ต้องอ่าน catalog ผ่าน anon/publishable key
-- จำกัดเฉพาะ status = ACTIVE และไม่ให้ browser เขียน/ลบสินค้า

grant usage on schema public to anon, authenticated;
grant select on table public."🛒product_master" to anon, authenticated;

alter table public."🛒product_master" enable row level security;

drop policy if exists product_master_web_read_active
on public."🛒product_master";

create policy product_master_web_read_active
on public."🛒product_master"
for select
to anon, authenticated
using (status = 'ACTIVE');

-- service_role ใช้สำหรับงาน admin/server โดยไม่เปิด write ให้ browser
 grant select, insert, update on table public."🛒product_master" to service_role;

-- ------------------------------------------------
-- 05 · Address master / read-only browser data
-- ------------------------------------------------
-- ใช้ autocomplete ที่อยู่เท่านั้น ไม่มีข้อมูลลูกค้า

do $$
begin
  if to_regclass('public.thailand_address_master') is not null then
    execute 'grant select on table public.thailand_address_master to anon, authenticated';
  end if;
end
$$;

-- ------------------------------------------------
-- 06 · Parcel data
-- ------------------------------------------------
-- Server อ่าน/เขียน parcel mapping; browser ไม่อ่านโต๊ะดิบโดยตรง

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'parcels',
    '🧿BB_xXx_ORDERCONTROL'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 07 · ROOM 02 · Chat source tables
-- ------------------------------------------------
-- ใช้เมื่อ tables เหล่านี้อยู่ใน Supabase project เดียวกับ server Chat config.
-- Chat อ่านจาก Cust/Pg โดยใช้ page_id + thread_id
-- ไม่เปิด anon/authenticated ให้เห็นข้อมูลแชท

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'Cust_Chat⭐BINARY_xXx_STAR',
    'Pg_Chat⭐BINARY_xXx_STAR',
    '🌓VAGABOND_xXx_DISMISS',
    '🏴‍☠️SIRIUS_xXx_CRASH'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- Page token/config ต้องให้ server จัดการได้ แต่ไม่เปิด access_token ให้ browser

do $$
begin
  if to_regclass('public.line_channels') is not null then
    execute 'grant select, insert, update, delete on table public.line_channels to service_role';
  end if;
  if to_regclass('public.line_messages') is not null then
    execute 'grant select, insert on table public.line_messages to service_role';
  end if;
end
$$;

-- ------------------------------------------------
-- 08 · UI customization / public read-only assets
-- ------------------------------------------------
-- เฉพาะข้อมูลธีม/กรอบ/เสียงที่ถูกเปิดใช้งาน; write อยู่ใน server/admin policy เดิม

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'app_themes',
    'app_chat_frames',
    'app_sounds',
    'app_customization_selections'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select on table public.%I to anon, authenticated', relation_name);
    end if;
  end loop;
end
$$;

-- Server/admin จัดการ customization ได้โดยไม่เปิด write ให้ browser
 do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'app_themes',
    'app_chat_frames',
    'app_sounds',
    'app_customization_selections'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update, delete on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 09 · Verification report
-- ------------------------------------------------
commit;

notify pgrst, 'reload schema';

-- ตรวจสิทธิ์สำคัญหลังรัน
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and (
    table_name in (
      '🗝️HERMES_ARCHIVE',
      '🛒product_master',
      '🌈MILKY_WAY_xXx_TOKEN _PAGE',
      'Cust_Chat⭐BINARY_xXx_STAR',
      'Pg_Chat⭐BINARY_xXx_STAR'
    )
    or table_name in ('thailand_address_master', 'parcels')
  )
  and grantee in ('service_role', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- ตรวจ RLS ของ product_master
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = '🛒product_master';
