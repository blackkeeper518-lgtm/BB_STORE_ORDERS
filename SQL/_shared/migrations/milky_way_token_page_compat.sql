-- ROOM 02 · Meta Page Token compatibility patch
-- แก้ schema ให้ตรงกับ ChatHub / Secret Gallery เวอร์ชันปัจจุบัน
-- ไม่ลบข้อมูลและไม่เปลี่ยน page_id/access_token เดิม

alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
  add column if not exists status_web text not null default 'ON',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ให้สถานะเว็บเริ่มต้นตามสถานะแอปเดิม ถ้ามีค่าอยู่แล้ว
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

notify pgrst, 'reload schema';

-- ตรวจผลหลังรัน
select page_id, page_name, status, status_web, created_at, updated_at
from public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
order by page_name asc;
