create table public.parcels (
  id bigserial not null,
  pickup_date text null,
  tracking_number text null,
  consignee text null,
  phone_number text null,
  address text null,
  cod_amount text null,
  order_phone text null,
  order_number text null,
  delivery_status text null,
  sent_at text null,
  upsert_key text null,
  recipient_id text null,
  facebook_tracking_status text null,
  facebook_tracking_sent_at text null,
  message_id text null,
  portal_key text null,
  page_name text null,
  chat_age_hours text null,
  send_facebook_route text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  drakside_tracking_message text null,
  chat_link_key text null,
  bkk_cutoff_route text null,
  phone_candidates jsonb null,
  constraint parcels_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists parcels_phone_number_idx on public.parcels using btree (phone_number) TABLESPACE pg_default;

create unique INDEX IF not exists parcels_tracking_number_uq on public.parcels using btree (tracking_number) TABLESPACE pg_default
where
  (
    (tracking_number is not null)
    and (btrim(tracking_number) <> ''::text)
  );