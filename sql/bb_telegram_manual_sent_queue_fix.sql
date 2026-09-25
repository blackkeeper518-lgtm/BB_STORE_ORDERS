-- BB ONLY · MANUAL ARCHIVE BUTTON + DATABASE-DRIVEN QUEUE / HISTORY
-- Run in the BB Supabase project only.
-- No n8n workflow is changed. No order rows are deleted.
-- Requires the existing bb_orders, vw_bb_telegram_manual_room_v1, and
-- bb_orders_sent_history objects.

BEGIN;

ALTER TABLE public.bb_orders
  ADD COLUMN IF NOT EXISTS telegram_status text,
  ADD COLUMN IF NOT EXISTS delivery_state text NOT NULL DEFAULT 'WAITING',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recalled_at timestamptz,
  ADD COLUMN IF NOT EXISTS recall_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_note text;

ALTER TABLE public.bb_orders_sent_history
  ADD COLUMN IF NOT EXISTS upsert_key text,
  ADD COLUMN IF NOT EXISTS page_name text,
  ADD COLUMN IF NOT EXISTS facebook_name text;

-- The manual archive button sets telegram_status='SENT'. Parse values through
-- JSON so this remains safe with boolean/text legacy telegram_sent columns.
CREATE OR REPLACE FUNCTION public.bb_record_sent_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  old_status text := upper(COALESCE(to_jsonb(OLD)->>'telegram_status', ''));
  new_status text := upper(COALESCE(to_jsonb(NEW)->>'telegram_status', ''));
  old_sent_flag boolean := lower(COALESCE(to_jsonb(OLD)->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'ไปแล้วไปลับ');
  new_sent_flag boolean := lower(COALESCE(to_jsonb(NEW)->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'ไปแล้วไปลับ');
  row_json jsonb;
BEGIN
  IF new_status IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     AND old_status NOT IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ') THEN
    NEW.delivery_state := 'SENT';
    NEW.sent_at := COALESCE(NEW.sent_at, now());
    row_json := to_jsonb(NEW);

    INSERT INTO public.bb_orders_sent_history (
      order_key, order_number, sent_at, snapshot, upsert_key, page_name, facebook_name
    ) VALUES (
      NEW.upsert_key,
      row_json->>'order_number',
      NEW.sent_at,
      row_json,
      NEW.upsert_key,
      row_json->>'page_name',
      row_json->>'facebook_name'
    );
  ELSIF new_status IN ('RECALLED', 'RECALL')
        AND (old_status IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ') OR old_sent_flag) THEN
    NEW.delivery_state := 'RECALLED';
    NEW.recalled_at := COALESCE(NEW.recalled_at, now());
    row_json := to_jsonb(NEW);

    UPDATE public.bb_orders_sent_history
       SET delivery_status = 'RECALLED',
           recalled_at = COALESCE(recalled_at, NEW.recalled_at),
           recall_count = GREATEST(COALESCE(recall_count, 0), COALESCE(NULLIF(row_json->>'recall_count', '')::integer, 0))
     WHERE order_key = NEW.upsert_key
       AND delivery_status = 'SENT';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_bb_record_sent_history ON public.bb_orders;
CREATE TRIGGER trg_bb_record_sent_history
BEFORE UPDATE OF telegram_status ON public.bb_orders
FOR EACH ROW
EXECUTE FUNCTION public.bb_record_sent_history();

-- One-time idempotent backfill for orders already marked SENT before this fix.
-- Avoid creating another history entry when order_key/upsert_key or order number
-- already exists. JSON extraction tolerates legacy boolean/text columns.
INSERT INTO public.bb_orders_sent_history (
  order_key, order_number, snapshot, upsert_key, page_name, facebook_name
)
SELECT
  NULLIF(j->>'upsert_key', ''),
  COALESCE(NULLIF(j->>'order_number', ''), NULLIF(j->>'order_number_display', '')),
  j,
  NULLIF(j->>'upsert_key', ''),
  NULLIF(j->>'page_name', ''),
  NULLIF(j->>'facebook_name', '')
FROM (
  SELECT DISTINCT ON (COALESCE(NULLIF(to_jsonb(o)->>'upsert_key', ''), NULLIF(to_jsonb(o)->>'order_number', '')))
    to_jsonb(o) AS j
  FROM public.bb_orders AS o
  WHERE upper(COALESCE(to_jsonb(o)->>'telegram_status', '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     OR upper(COALESCE(to_jsonb(o)->>'delivery_state', '')) = 'SENT'
     OR lower(COALESCE(to_jsonb(o)->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'ไปแล้วไปลับ')
  ORDER BY
    COALESCE(NULLIF(to_jsonb(o)->>'upsert_key', ''), NULLIF(to_jsonb(o)->>'order_number', '')),
    NULLIF(to_jsonb(o)->>'sent_at', '') DESC NULLS LAST,
    NULLIF(to_jsonb(o)->>'updated_at', '') DESC NULLS LAST
) AS existing_sent(j)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.bb_orders_sent_history AS h
  WHERE (NULLIF(existing_sent.j->>'upsert_key', '') IS NOT NULL
         AND (h.order_key = existing_sent.j->>'upsert_key' OR h.upsert_key = existing_sent.j->>'upsert_key'))
     OR (COALESCE(NULLIF(existing_sent.j->>'order_number', ''), NULLIF(existing_sent.j->>'order_number_display', '')) IS NOT NULL
         AND h.order_number = COALESCE(NULLIF(existing_sent.j->>'order_number', ''), NULLIF(existing_sent.j->>'order_number_display', '')))
);

-- Queue omits currently sent orders in SQL. A recalled row is explicitly
-- allowed back in even if a legacy telegram_sent flag remains true.
CREATE OR REPLACE VIEW public.vw_bb_telegram_queue_room_v1 AS
SELECT *
FROM public.vw_bb_telegram_manual_room_v1
WHERE CASE
  WHEN upper(COALESCE(telegram_status, '')) IN ('RECALLED', 'RECALL') THEN false
  WHEN upper(COALESCE(telegram_status, '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ') THEN true
  WHEN upper(COALESCE(delivery_state, '')) = 'RECALLED' THEN false
  ELSE COALESCE(is_sent, false)
END IS NOT TRUE;

-- Persistent history supplies the Sent room; recalled send events stay auditable.
CREATE OR REPLACE VIEW public.vw_bb_telegram_sent_room_v1 AS
SELECT
  COALESCE(NULLIF(h.snapshot->>'id', ''), h.id::text) AS id,
  COALESCE(NULLIF(h.upsert_key, ''), NULLIF(h.order_key, ''), NULLIF(h.snapshot->>'upsert_key', '')) AS upsert_key,
  COALESCE(NULLIF(h.snapshot->>'order_number', ''), h.order_number) AS order_number,
  COALESCE(NULLIF(h.snapshot->>'order_number_display', ''), h.order_number) AS order_number_display,
  h.snapshot->>'order_time_display' AS order_time_display,
  h.snapshot->>'order_time' AS order_time,
  h.sent_at AS source_time,
  h.snapshot->>'created_at' AS created_at,
  h.snapshot->>'updated_at' AS updated_at,
  COALESCE(NULLIF(h.page_name, ''), NULLIF(h.snapshot->>'page_name', '')) AS page_name,
  COALESCE(NULLIF(h.facebook_name, ''), NULLIF(h.snapshot->>'facebook_name', '')) AS facebook_name,
  h.snapshot->>'customer_name' AS customer_name,
  h.snapshot->>'phone' AS phone,
  h.snapshot->>'extracted_phone' AS extracted_phone,
  h.snapshot->>'cod_amount' AS cod_amount,
  h.snapshot->>'address_display_packer' AS address_display_packer,
  h.snapshot->>'addressclean' AS addressclean,
  h.snapshot->>'full_address' AS full_address,
  h.snapshot->>'province' AS province,
  h.snapshot->>'zipcode' AS zipcode,
  COALESCE(
    NULLIF(h.snapshot->>'for_packer_bb_display', ''),
    NULLIF(h.snapshot->>'product_display_for_packer', ''),
    NULLIF(h.snapshot->>'final_display_for_packer', ''),
    NULLIF(h.snapshot->>'master_display_for_packer', ''),
    NULLIF(h.snapshot->>'single_cleaned_products', ''),
    NULLIF(h.snapshot->>'extracted_product_raw', ''),
    NULLIF(h.snapshot->>'sniper_x_text_clean', '')
  ) AS for_packer_bb_display,
  h.snapshot->>'sniper_x_text_clean' AS sniper_x_text_clean,
  h.snapshot->>'normalized_chat_timeline' AS normalized_chat_timeline,
  h.snapshot->>'mapping_status' AS mapping_status,
  h.snapshot->>'stock_notice' AS stock_notice,
  h.snapshot->>'shipping_method' AS shipping_method,
  'true'::text AS telegram_sent,
  h.delivery_status AS telegram_status,
  h.delivery_status AS delivery_state,
  h.sent_at,
  h.recalled_at,
  h.snapshot->>'last_delivery_note' AS last_delivery_note,
  (h.delivery_status = 'SENT') AS is_sent,
  h.delivery_status,
  h.recall_count
FROM public.bb_orders_sent_history AS h;

COMMENT ON VIEW public.vw_bb_telegram_queue_room_v1 IS
  'BB queue room. SQL view excludes current SENT rows; RECALLED orders return to the queue.';
COMMENT ON VIEW public.vw_bb_telegram_sent_room_v1 IS
  'BB persistent send-history room. SENT and RECALLED events remain auditable from bb_orders_sent_history.';

COMMIT;

-- Read-only checks after running:
-- SELECT count(*) AS queue_count FROM public.vw_bb_telegram_queue_room_v1;
-- SELECT count(*) AS history_count FROM public.vw_bb_telegram_sent_room_v1;
-- SELECT upsert_key, order_number, sent_at, recalled_at, delivery_status, page_name, facebook_name
-- FROM public.vw_bb_telegram_sent_room_v1 ORDER BY source_time DESC NULLS LAST LIMIT 20;
-- NOTIFY pgrst, 'reload schema';
-- No SQL is executed by preparing this file.
