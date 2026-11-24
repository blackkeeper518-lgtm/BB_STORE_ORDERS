-- DEDUPE append-only chat rows by provider message_id
-- Run this separately in EACH Chat Supabase project that owns:
--   public."Cust_Chat⭐BINARY_xXx_STAR"
--   public."Pg_Chat⭐BINARY_xXx_STAR"
-- Requires message_row_id from the append-only chat migration.
-- First run the read-only preview queries; then run the transaction below.

-- PREVIEW: duplicate keys and extra rows to be removed (Customer)
select message_id, count(*) as row_count, count(*) - 1 as duplicate_rows
from public."Cust_Chat⭐BINARY_xXx_STAR"
where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
group by message_id
having count(*) > 1
order by duplicate_rows desc;

-- PREVIEW: message IDs that exist in BOTH source tables (inspect; per-table indexes cannot enforce cross-table uniqueness)
select message_id, count(*) as copies_across_tables
from (
  select message_id from public."Cust_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
  union all
  select message_id from public."Pg_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
) as both_sides
group by message_id
having count(*) > 1
order by copies_across_tables desc;

-- PREVIEW: duplicate keys and extra rows to be removed (Page)
select message_id, count(*) as row_count, count(*) - 1 as duplicate_rows
from public."Pg_Chat⭐BINARY_xXx_STAR"
where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
group by message_id
having count(*) > 1
order by duplicate_rows desc;

begin;

-- Empty IDs are not provider IDs; normalize them to NULL so they do not collide.
update public."Cust_Chat⭐BINARY_xXx_STAR"
set message_id = null
where message_id is not null and lower(btrim(message_id)) in ('', 'null', 'undefined');

update public."Pg_Chat⭐BINARY_xXx_STAR"
set message_id = null
where message_id is not null and lower(btrim(message_id)) in ('', 'null', 'undefined');

-- Keep the earliest physical row for each message_id; remove later copies.
with ranked as (
  select message_row_id,
         row_number() over (partition by message_id order by message_row_id asc) as rn
  from public."Cust_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('null', 'undefined')
)
delete from public."Cust_Chat⭐BINARY_xXx_STAR" as chat
using ranked
where chat.message_row_id = ranked.message_row_id and ranked.rn > 1;

with ranked as (
  select message_row_id,
         row_number() over (partition by message_id order by message_row_id asc) as rn
  from public."Pg_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('null', 'undefined')
)
delete from public."Pg_Chat⭐BINARY_xXx_STAR" as chat
using ranked
where chat.message_row_id = ranked.message_row_id and ranked.rn > 1;

-- Guard against future duplicates. Multiple NULL message_id values remain allowed.
create unique index if not exists "Cust_Chat⭐BINARY_xXx_STAR_message_id_uidx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (message_id);

create unique index if not exists "Pg_Chat⭐BINARY_xXx_STAR_message_id_uidx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (message_id);

commit;

-- REQUIRED n8n writer setting for EVERY node inserting these chat tables:
-- URL query:   on_conflict=message_id
-- Prefer:      resolution=ignore-duplicates,return=representation
-- This makes repeated pulls idempotent instead of creating another row.
-- If the flow does not send on_conflict + Prefer, the unique index still
-- prevents duplicates but the duplicate insert will return a conflict error.
