-- ROOM 01 + ROOM 02 · Permissions and schema compatibility
-- ใช้ไฟล์นี้เป็นไฟล์รวมสำหรับเว็บ ST เมื่อย้าย/ตั้งค่าฐานข้อมูลใหม่
-- ไม่ลบข้อมูล ไม่เปิด access_token ให้ anon/authenticated
--
-- ตารางที่เว็บต้องใช้:
--   ROOM 01: public."🗝️HERMES_ARCHIVE"
--   ROOM 02: public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
--
-- หมายเหตุ:
--   1) รันด้วยเจ้าของฐานข้อมูลหรือ role ที่มีสิทธิ์ ALTER/GRANT
--   2) เว็บฝั่ง server ใช้ service_role
--   3) ถ้าเปลี่ยนชื่อตาราง ให้แก้ชื่อในไฟล์นี้ทั้งสองจุดก่อนรัน

begin;

-- service_role ต้องเข้า schema public ได้ก่อนจึงจะอ่าน relation ได้
grant usage on schema public to service_role;

-- ROOM 02 · ทำให้ schema ที่หน้าเว็บเรียกใช้ตรงกัน
alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
  add column if not exists status_web text not null default 'ON',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ถ้าค่าเว็บยังว่าง ให้เริ่มจากสถานะแอปเดิม
update public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
set status_web = case
  when upper(coalesce(status, 'ON')) in ('ON', 'OFF') then upper(coalesce(status, 'ON'))
  else 'ON'
end
where status_web is null or status_web not in ('ON', 'OFF');

create or replace function public.touch_milky_way_token_page_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists milky_way_token_page_touch_updated_at
on public."🌈MILKY_WAY_xXx_TOKEN _PAGE";

create trigger milky_way_token_page_touch_updated_at
before update on public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
for each row
execute function public.touch_milky_way_token_page_updated_at();

-- ROOM 02 · server อ่านข้อมูลเพจได้เท่านั้น
grant select on table public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
to service_role;

-- ROOM 01 · Order Control อ่านข้อมูล และเขียนสถานะส่งกลับต้นทาง
grant select, insert, update on table public."🗝️HERMES_ARCHIVE"
to service_role;

commit;

-- ให้ PostgREST โหลด schema cache ใหม่ทันที
notify pgrst, 'reload schema';

-- ตรวจผล: ต้องเห็น service_role / SELECT ที่ทั้งสองตาราง
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('🗝️HERMES_ARCHIVE', '🌈MILKY_WAY_xXx_TOKEN _PAGE')
  and grantee = 'service_role'
order by table_name, privilege_type;

-- ตรวจคอลัมน์ที่หน้าเว็บเรียกจาก ROOM 02
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = '🌈MILKY_WAY_xXx_TOKEN _PAGE'
  and column_name in ('page_id', 'page_name', 'status', 'status_web', 'created_at', 'updated_at')
order by ordinal_position;
