-- คลังเหตุการณ์ปิดงานอัตโนมัติจากประวัติแชทเดิม
-- ไม่แก้/ลบข้อความต้นทาง และไม่สรุปว่าใครกระทำผิด
-- Apply ใน Supabase SQL Editor ของโปรเจกต์ที่ ChatHub ใช้อยู่

create or replace view public.vw_bb_close_job_cases
with (security_invoker = true) as
with source_rows as (
  select 'customer'::text as source_side, to_jsonb(m) as row_data
  from public.chat_customer_messages as m
  union all
  select 'page'::text as source_side, to_jsonb(m) as row_data
  from public.chat_page_messages as m
), normalized as (
  select
    source_side,
    coalesce(row_data->>'id', row_data->>'source_message_id', row_data->>'dedupe_key', '') as source_id,
    coalesce(row_data->>'page_id', row_data->>'pageId', '') as page_id,
    coalesce(row_data->>'page_name', row_data->>'pageName', '') as page_name,
    coalesce(row_data->>'thread_id', row_data->>'conversation_key', row_data->>'conversation_id', '') as conversation_key,
    coalesce(row_data->>'customer_id', row_data->>'sender_id', '') as customer_id,
    coalesce(row_data->>'customer_name', row_data->>'sender_name', row_data->>'facebook_name', '') as customer_name,
    case
      when source_side = 'page' or lower(coalesce(row_data->>'speaker_type', row_data->>'speaker', '')) in ('page', 'admin', 'business', 'outbound') then 'page'
      else 'customer'
    end as speaker_type,
    coalesce(row_data->>'occurred_at', row_data->>'time', row_data->>'created_at', row_data->>'synced_at', '') as occurred_at,
    coalesce(row_data->>'message_text', row_data->>'message_raw', row_data->>'text', '') as message_text,
    regexp_replace(coalesce(row_data->>'message_text', row_data->>'message_raw', row_data->>'text', ''), '[[:space:]]+', '', 'g') as normalized_message,
    coalesce(
      nullif(row_data->>'delivery_area', ''), nullif(row_data->>'service_area', ''),
      nullif(row_data->>'shipping_area', ''), nullif(row_data->>'route_area', ''),
      nullif(row_data->>'delivery_zone', ''), nullif(row_data->>'shipping_zone', ''),
      nullif(row_data->>'route', ''), nullif(row_data->>'area', ''),
      nullif(concat_ws(' / ', nullif(row_data->>'district', ''), nullif(row_data->>'amphoe', ''), nullif(row_data->>'province', '')), ''), ''
    ) as area,
    coalesce(nullif(row_data->>'branch_name', ''), nullif(row_data->>'store_branch', ''), nullif(row_data->>'branch', ''), '') as branch,
    coalesce(nullif(row_data->>'carrier_employee', ''), nullif(row_data->>'delivery_staff_name', ''), nullif(row_data->>'driver_name', ''), nullif(row_data->>'courier_name', ''), nullif(row_data->>'shipping_staff', ''), nullif(row_data->>'rider_name', ''), '') as carrier_employee,
    coalesce(row_data->>'tracking_number', row_data->>'parcel_tracking_number', '') as tracking_number,
    coalesce(row_data->>'order_number', row_data->>'order_number_display', '') as order_number
  from source_rows
)
select
  md5(concat_ws('|', source_side, source_id, page_id, conversation_key, speaker_type, occurred_at, message_text)) as id,
  page_id,
  page_name,
  conversation_key,
  customer_id,
  customer_name,
  speaker_type,
  occurred_at,
  message_text,
  tracking_number,
  order_number,
  case
    when normalized_message ilike '%ปิดงาน%' then 'ปิดงาน'
    when normalized_message ilike '%ยกเลิก%' or normalized_message ilike '%ไม่เอาแล้ว%' then 'ยกเลิก / ไม่เอาแล้ว'
    when normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ' then 'สั่งแล้วไม่รับ'
  end as case_type,
  area,
  branch,
  carrier_employee
from normalized
where normalized_message ilike '%ปิดงาน%'
   or normalized_message ilike '%ยกเลิก%'
   or normalized_message ilike '%ไม่เอาแล้ว%'
   or normalized_message ~ 'สั่ง.{0,16}แล้วไม่รับ';

grant select on public.vw_bb_close_job_cases to anon, authenticated;
comment on view public.vw_bb_close_job_cases is
  'Auto-detected close-job, cancellation, no-longer-wanted, and order-refusal messages from both chat tables; includes available area fields; read-only.';

-- Editable case details are kept separately from source chat messages.
create table if not exists public.bb_delivery_case_notes (
  case_id text primary key,
  branch text not null default '',
  carrier_employee text not null default '',
  area text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.bb_delivery_case_notes enable row level security;
drop policy if exists bb_delivery_case_notes_read on public.bb_delivery_case_notes;
create policy bb_delivery_case_notes_read on public.bb_delivery_case_notes for select to anon, authenticated using (true);
drop policy if exists bb_delivery_case_notes_insert on public.bb_delivery_case_notes;
create policy bb_delivery_case_notes_insert on public.bb_delivery_case_notes for insert to anon, authenticated with check (true);
drop policy if exists bb_delivery_case_notes_update on public.bb_delivery_case_notes;
create policy bb_delivery_case_notes_update on public.bb_delivery_case_notes for update to anon, authenticated using (true) with check (true);
grant select on public.bb_delivery_case_notes to anon, authenticated;
grant insert (case_id, branch, carrier_employee, area, updated_at) on public.bb_delivery_case_notes to anon, authenticated;
grant update (branch, carrier_employee, area, updated_at) on public.bb_delivery_case_notes to anon, authenticated;
