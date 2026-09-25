-- BB ONLY · PERMANENT SENT STATUS + ONE DRAKSIDE DELIVERY VIEW
-- Uses the existing vw_bb_orders_all_v2 only. Bill-builder routing is deferred.
-- Creates/updates only public.drakside_telagram_delivery_pro; no existing view,
-- room, lab object, or bb_orders row is dropped or bulk-updated.

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
  ADD COLUMN IF NOT EXISTS facebook_name text,
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'SENT';

-- Keep the legacy telegram_sent storage type intact for existing rooms and n8n.
-- Text status fields remain text; the frontend also safely normalizes old values.
CREATE OR REPLACE FUNCTION public.bb_record_sent_history()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  row_json jsonb;
  old_status text := upper(COALESCE(to_jsonb(OLD)->>'telegram_status', ''));
  new_status text := upper(COALESCE(to_jsonb(NEW)->>'telegram_status', ''));
  new_state text := upper(COALESCE(to_jsonb(NEW)->>'delivery_state', ''));
  new_sent_flag boolean := lower(COALESCE(to_jsonb(NEW)->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'sent_to_telegram', 'ไปแล้วไปลับ');
  history_sent_at timestamptz;
BEGIN
  -- Once an order has an archive record, later imports cannot unset its SENT state.
  SELECT h.sent_at
    INTO history_sent_at
    FROM public.bb_orders_sent_history AS h
   WHERE (NULLIF(NEW.upsert_key::text, '') IS NOT NULL
          AND (h.upsert_key = NEW.upsert_key::text OR h.order_key = NEW.upsert_key::text
               OR h.snapshot->>'upsert_key' = NEW.upsert_key::text))
      OR (NULLIF(NEW.order_number::text, '') IS NOT NULL
          AND h.order_number = NEW.order_number::text)
      OR (NULLIF(NEW.id::text, '') IS NOT NULL
          AND h.snapshot->>'id' = NEW.id::text)
   ORDER BY h.sent_at ASC
   LIMIT 1;

  IF FOUND THEN
    NEW.telegram_status := 'SENT';
    NEW.delivery_state := 'SENT';
    NEW.sent_at := COALESCE(history_sent_at, NEW.sent_at, now());
    RETURN NEW;
  END IF;

  IF new_status IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     OR new_state IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     OR new_sent_flag THEN
    NEW.telegram_status := 'SENT';
    NEW.delivery_state := 'SENT';
    NEW.sent_at := COALESCE(NEW.sent_at, now());
    row_json := to_jsonb(NEW);

    INSERT INTO public.bb_orders_sent_history (
      order_key, order_number, sent_at, snapshot, upsert_key, page_name,
      facebook_name, delivery_status
    ) VALUES (
      NULLIF(NEW.upsert_key::text, ''),
      NULLIF(NEW.order_number::text, ''),
      NEW.sent_at,
      row_json,
      NULLIF(NEW.upsert_key::text, ''),
      row_json->>'page_name',
      row_json->>'facebook_name',
      'SENT'
    );
  ELSIF new_status IN ('RECALLED', 'RECALL')
        AND old_status IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ') THEN
    -- Keep old recall writes from moving a sent order back into the queue.
    NEW.telegram_status := 'SENT';
    NEW.delivery_state := 'SENT';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_bb_record_sent_history ON public.bb_orders;
CREATE TRIGGER trg_bb_record_sent_history
BEFORE INSERT OR UPDATE ON public.bb_orders
FOR EACH ROW
EXECUTE FUNCTION public.bb_record_sent_history();

-- Idempotent backfill into the archive table only. The source order rows are
-- read-only here and are never deleted or bulk-updated.
INSERT INTO public.bb_orders_sent_history (
  order_key, order_number, snapshot, upsert_key, page_name, facebook_name,
  delivery_status
)
SELECT
  NULLIF(j->>'upsert_key', ''),
  COALESCE(NULLIF(j->>'order_number', ''), NULLIF(j->>'order_number_display', '')),
  j,
  NULLIF(j->>'upsert_key', ''),
  NULLIF(j->>'page_name', ''),
  NULLIF(j->>'facebook_name', ''),
  'SENT'
FROM (
  SELECT DISTINCT ON (COALESCE(NULLIF(to_jsonb(o)->>'upsert_key', ''), NULLIF(to_jsonb(o)->>'order_number', ''), to_jsonb(o)->>'id'))
    to_jsonb(o) AS j
  FROM public.bb_orders AS o
  WHERE upper(COALESCE(to_jsonb(o)->>'telegram_status', '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     OR upper(COALESCE(to_jsonb(o)->>'delivery_state', '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
     OR lower(COALESCE(to_jsonb(o)->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'sent_to_telegram', 'ไปแล้วไปลับ')
  ORDER BY
    COALESCE(NULLIF(to_jsonb(o)->>'upsert_key', ''), NULLIF(to_jsonb(o)->>'order_number', ''), to_jsonb(o)->>'id'),
    NULLIF(to_jsonb(o)->>'sent_at', '') ASC NULLS LAST,
    NULLIF(to_jsonb(o)->>'updated_at', '') ASC NULLS LAST
) AS existing_sent(j)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.bb_orders_sent_history AS h
  WHERE (NULLIF(existing_sent.j->>'upsert_key', '') IS NOT NULL
         AND (h.order_key = existing_sent.j->>'upsert_key' OR h.upsert_key = existing_sent.j->>'upsert_key'
              OR h.snapshot->>'upsert_key' = existing_sent.j->>'upsert_key'))
     OR (COALESCE(NULLIF(existing_sent.j->>'order_number', ''), NULLIF(existing_sent.j->>'order_number_display', '')) IS NOT NULL
         AND h.order_number = COALESCE(NULLIF(existing_sent.j->>'order_number', ''), NULLIF(existing_sent.j->>'order_number_display', '')))
     OR (NULLIF(existing_sent.j->>'id', '') IS NOT NULL AND h.snapshot->>'id' = existing_sent.j->>'id')
);

-- Single stable BB view for the queue and sent-history tab. This reads the
-- existing order view only; bill-builder data can be routed later by the owner.
CREATE OR REPLACE VIEW public.drakside_telagram_delivery_pro AS
WITH source_orders AS (
  SELECT o.*, to_jsonb(o) AS drakside_order_json
  FROM public.vw_bb_orders_all_v2 AS o
)
SELECT
  o.*,
  COALESCE(NULLIF(o.drakside_order_json->>'order_time', ''), NULLIF(o.drakside_order_json->>'created_at', '')) AS drakside_source_time,
  (
    lower(COALESCE(o.drakside_order_json->>'telegram_sent', '')) IN ('true', '1', 't', 'sent', 'delivered', 'sent_to_telegram', 'ไปแล้วไปลับ')
    OR upper(COALESCE(o.drakside_order_json->>'telegram_status', '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
    OR upper(COALESCE(o.drakside_order_json->>'delivery_state', '')) IN ('SENT', 'DELIVERED', 'SENT_TO_TELEGRAM', 'ไปแล้วไปลับ')
    OR EXISTS (
      SELECT 1
      FROM public.bb_orders_sent_history AS h
      WHERE (NULLIF(o.drakside_order_json->>'upsert_key', '') IS NOT NULL
             AND (h.upsert_key = o.drakside_order_json->>'upsert_key'
                  OR h.order_key = o.drakside_order_json->>'upsert_key'
                  OR h.snapshot->>'upsert_key' = o.drakside_order_json->>'upsert_key'))
         OR (NULLIF(o.drakside_order_json->>'order_number', '') IS NOT NULL
             AND h.order_number = o.drakside_order_json->>'order_number')
         OR (NULLIF(o.drakside_order_json->>'id', '') IS NOT NULL
             AND h.snapshot->>'id' = o.drakside_order_json->>'id')
    )
  ) AS drakside_is_sent,
  'BB'::text AS drakside_camp
FROM source_orders AS o
;

COMMENT ON VIEW public.drakside_telagram_delivery_pro IS
  'BB delivery/backup queue source; reads vw_bb_orders_all_v2 only. Bill-builder routing is deferred.';

COMMIT;

-- Read-only checks to run after applying (does not modify data):
-- SELECT count(*) FROM public.drakside_telagram_delivery_pro;
-- SELECT order_number, telegram_status, drakside_is_sent, drakside_camp
-- FROM public.drakside_telagram_delivery_pro ORDER BY drakside_source_time DESC LIMIT 20;
-- This migration does not drop any view/table and does not delete or bulk-update orders.
