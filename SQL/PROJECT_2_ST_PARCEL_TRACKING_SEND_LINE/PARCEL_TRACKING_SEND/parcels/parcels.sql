create table public.parcels (
   id bigserial not null,
  pickup_date text null,
  tracking_number text not null,
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
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  drakside_tracking_message text null,
  chat_link_key text null,
  bkk_cutoff_route text null,
  phone_candidates jsonb null,
  matched_phone text null,
  page_id text null,
  fb_tracking_message_for_web text null,
  ds_tracking_message_for_web text null,
  order_time_display text null,
  recipient_name text null,
  chat_age_hours text null,
  send_facebook_route text null,
  source_lane text null,
  constraint parcels_pkey primary key (tracking_number),
  constraint parcels_id_key unique (id)
) TABLESPACE pg_default;

create index IF not exists parcels_phone_number_idx on public.parcels using btree (phone_number) TABLESPACE pg_default;

-- กติกาหลักของสายส่งเลข: มี sent_at แล้วถือว่าส่งเลขสำเร็จเสมอ
UPDATE public.parcels
SET parcel_status_emoji = '⚡SENT'
WHERE NULLIF(btrim(sent_at), '') IS NOT NULL
  AND COALESCE(btrim(parcel_status_emoji), '') <> '⚡SENT';

CREATE OR REPLACE FUNCTION public.enforce_parcel_sent_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NULLIF(btrim(NEW.sent_at), '') IS NOT NULL THEN
    NEW.parcel_status_emoji := '⚡SENT';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS parcels_sent_status_guard ON public.parcels;
CREATE TRIGGER parcels_sent_status_guard
BEFORE INSERT OR UPDATE OF sent_at ON public.parcels
FOR EACH ROW
EXECUTE FUNCTION public.enforce_parcel_sent_status();
