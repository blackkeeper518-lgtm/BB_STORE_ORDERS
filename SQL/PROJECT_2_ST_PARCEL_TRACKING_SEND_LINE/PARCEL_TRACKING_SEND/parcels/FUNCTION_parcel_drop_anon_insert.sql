grant usage on schema public to anon;
grant insert on table public.parcels to anon;

alter table public.parcels enable row level security;

drop policy if exists parcel_drop_anon_insert on public.parcels;

create policy parcel_drop_anon_insert
on public.parcels
for insert
to anon
with check (
  nullif(btrim(coalesce(tracking_number::text, '')), '') is not null
  and nullif(btrim(coalesce(consignee::text, '')), '') is not null
  and nullif(regexp_replace(coalesce(phone_number::text, ''), '[^0-9]', '', 'g'), '') is not null
  and nullif(btrim(coalesce(address::text, '')), '') is not null
);



-- กู้สิทธิ์เขียนสำหรับ Warp Drive / Parcel Drop
-- เว็บใช้ Supabase publishable/anon key และเรียก public.parcels.insert(...)
-- SQL นี้เปิดเฉพาะ INSERT ให้ anon ไม่เปิด SELECT/UPDATE/DELETE

begin;

alter table public.parcels enable row level security;

grant insert on table public.parcels to anon;

-- Identity/serial id ต้องใช้สิทธิ์ sequence ตอน INSERT โดยไม่ส่ง id เอง
 do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.parcels', 'id') into seq_name;
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to anon', seq_name);
  end if;
end $$;

drop policy if exists parcels_insert_from_parcel_drop on public.parcels;

create policy parcels_insert_from_parcel_drop
on public.parcels
for insert
to anon
with check (
  nullif(btrim(tracking_number), '') is not null
  and nullif(btrim(consignee), '') is not null
  and nullif(btrim(phone_number), '') is not null
  and nullif(btrim(address), '') is not null
);

commit;

-- ตั้งใจไม่ให้ anon อ่านข้อมูลกลับ:
-- revoke select, update, delete on table public.parcels from anon;
-- หากโปรเจกต์นี้เคยเปิดสิทธิ์เหล่านี้ไว้และต้องการปิด ให้รัน 3 บรรทัดด้านบนแยกต่างหาก

