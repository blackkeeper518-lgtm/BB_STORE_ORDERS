-- ⚡ ZEUS_PERFECT_ORDERS
-- Delete sent rows older than 72 hours from HERMES and SINGULARITY.
-- Uses order_time_display as Bangkok local time, matching the upstream display value.
-- GENESIS is a view over MULTIVERSE, so deleted source rows disappear from GENESIS too.
-- Unsent rows and rows with an unrecognized time format are kept.
-- This script schedules the purge; it does NOT delete rows immediately.

create extension if not exists pg_cron;

-- Parse display times such as 03/11/69 09:02:01 or 03/11/2569 09:02:01.
-- Also accepts local ISO display values such as 2026-11-03 09:02:01.
create or replace function public.bb_order_display_time(p_value text)
returns timestamp without time zone
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  v text := btrim(p_value);
  parts text[];
  y integer;
  m integer;
  d integer;
  hh integer;
  mi integer;
  ss integer;
begin
  if v is null or v = '' then
    return null;
  end if;

  -- Local ISO display value: YYYY-MM-DD HH:MI[:SS].
  parts := regexp_match(v, '^(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?');
  if parts is not null then
    y := parts[1]::integer;
    m := parts[2]::integer;
    d := parts[3]::integer;
    hh := parts[4]::integer;
    mi := parts[5]::integer;
    ss := coalesce(parts[6], '0')::integer;
    return make_timestamp(y, m, d, hh, mi, ss::double precision);
  end if;

  -- Thai display value: DD/MM/YY or DD/MM/YYYY plus HH:MI[:SS].
  parts := regexp_match(v, '^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?');
  if parts is null then
    return null;
  end if;

  d := parts[1]::integer;
  m := parts[2]::integer;
  y := parts[3]::integer;
  if length(parts[3]) = 2 then
    -- Buddhist Era short year: 69 means 2026.
    y := 1957 + y;
  elsif y > 2400 then
    y := y - 543;
  end if;
  hh := parts[4]::integer;
  mi := parts[5]::integer;
  ss := coalesce(parts[6], '0')::integer;

  return make_timestamp(y, m, d, hh, mi, ss::double precision);
exception
  when others then
    return null;
end;
$$;

create or replace function public.bb_purge_main_sent_orders_3days()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  cutoff timestamp without time zone := (now() at time zone 'Asia/Bangkok') - interval '3 days';
  deleted_rows bigint := 0;
  affected_rows bigint;
begin
  delete from public."🗝️HERMES_ARCHIVE" h
  where public.bb_order_display_time(h.order_time_display) < cutoff
    and (
      lower(btrim(coalesce(h.telegram_sent, ''))) = any (array['true', 't', '1', 'yes'])
      or upper(btrim(coalesce(h.telegram_status, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
      or upper(btrim(coalesce(h.delivery_status, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
      or upper(btrim(coalesce(h.delivery_state, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
    );
  get diagnostics affected_rows = row_count;
  deleted_rows := deleted_rows + affected_rows;

  delete from public."🌀SINGULARITY_xXx_EXCHANGE" s
  where public.bb_order_display_time(s.order_time_display) < cutoff
    and (
      lower(btrim(coalesce(s.telegram_sent, ''))) = any (array['true', 't', '1', 'yes'])
      or upper(btrim(coalesce(s.telegram_status, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
      or upper(btrim(coalesce(s.delivery_status, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
      or upper(btrim(coalesce(s.delivery_state, ''))) = any (array['SENT', 'DELIVERED', 'SENT_TO_TELEGRAM'])
    );
  get diagnostics affected_rows = row_count;
  deleted_rows := deleted_rows + affected_rows;

  return deleted_rows;
end;
$$;

revoke all on function public.bb_order_display_time(text) from public, anon, authenticated;
revoke all on function public.bb_purge_main_sent_orders_3days() from public, anon, authenticated;

-- Replace the previous job if it exists, then run daily at 06:45 UTC = 13:45 Thailand.
select cron.unschedule(jobid)
from cron.job
where jobname = 'purge-main-sent-orders-after-3-days';

select cron.schedule(
  'purge-main-sent-orders-after-3-days',
  '45 6 * * *',
  'select public.bb_purge_main_sent_orders_3days();'
);
