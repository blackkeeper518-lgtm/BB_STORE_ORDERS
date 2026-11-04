-- BB Store: delete parcels older than the latest 3 Bangkok calendar days.
-- Run once in the Tracking & Messenger Supabase project's SQL Editor.
-- It deletes eligible old rows immediately, then runs daily at 01:00 Bangkok time.
-- Blank or unrecognized pickup_date values are deliberately preserved.

create extension if not exists pg_cron;

create or replace function public.bb_parcel_pickup_day(p_value text)
returns date
language plpgsql
immutable
set search_path = pg_catalog, public
as $$
declare
  parts text[];
  y integer;
  m integer;
  d integer;
begin
  if p_value is null or btrim(p_value) = '' then
    return null;
  end if;

  -- ISO date or timestamp, e.g. 2026-11-03 or 2026-11-03T10:15:00Z.
  parts := regexp_match(btrim(p_value), '^(\d{4})-(\d{1,2})-(\d{1,2})');
  if parts is not null then
    y := parts[1]::integer;
    m := parts[2]::integer;
    d := parts[3]::integer;
    return make_date(y, m, d);
  end if;

  -- Thai/Flash date, e.g. 03/11/69, 03/11/2026, or 03/11/2569.
  parts := regexp_match(btrim(p_value), '^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})');
  if parts is not null then
    d := parts[1]::integer;
    m := parts[2]::integer;
    y := parts[3]::integer;
    if length(parts[3]) = 2 then
      -- Thai short year: 69 means 2026.
      y := 1957 + y;
    elsif y > 2400 then
      -- Buddhist Era year: 2569 means 2026.
      y := y - 543;
    end if;
    return make_date(y, m, d);
  end if;

  return null;
exception
  when others then
    -- Keep malformed dates rather than risk deleting the wrong parcel/address.
    return null;
end;
$$;

create or replace function public.bb_purge_old_parcels_3day()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  deleted_rows bigint;
  keep_from date := (now() at time zone 'Asia/Bangkok')::date - 2;
begin
  delete from public.parcels as p
  where public.bb_parcel_pickup_day(p.pickup_date) < keep_from;

  get diagnostics deleted_rows = row_count;
  return deleted_rows;
end;
$$;

revoke all on function public.bb_parcel_pickup_day(text) from public, anon, authenticated;
revoke all on function public.bb_purge_old_parcels_3day() from public, anon, authenticated;
grant execute on function public.bb_purge_old_parcels_3day() to service_role;

-- Replace an existing job with the same name; safe to rerun this setup script.
select cron.unschedule(jobid)
from cron.job
where jobname = 'bb-purge-parcels-older-than-3-days';

-- Supabase pg_cron uses UTC: 18:00 UTC = 01:00 the next day in Thailand.
select cron.schedule(
  'bb-purge-parcels-older-than-3-days',
  '0 18 * * *',
  'select public.bb_purge_old_parcels_3day();'
);

-- Delete existing expired parcels now; the result is the number of rows removed.
select public.bb_purge_old_parcels_3day() as deleted_existing_old_rows;
