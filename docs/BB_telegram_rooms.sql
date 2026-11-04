-- BB ONLY — TELEGRAM MIDDLE ROOM FROM LAB 88 + LAB 99
--
-- Deliberately independent from the missing web central view.
-- Order details/source text: Lab 99.
-- Product candidates: Lab 88, using the existing matching/formatting logic.
-- Every Lab 88 order is retained, including review/unmapped rows.
-- Do not run for ST.

BEGIN;

CREATE SCHEMA IF NOT EXISTS dk;

-- Remove the old dependency chain without CASCADE.
-- The old middle view points to the old delivery view, so the middle
-- must be removed before its old parent can be replaced.
DROP VIEW IF EXISTS public.vw_bb_telegram_queue_from_lab88;
DROP VIEW IF EXISTS public.drakside_telagram_delivery_bb_pro;
DROP VIEW IF EXISTS public.vw_telegram_delivery_queue_bb;
DROP VIEW IF EXISTS dk.drakside_telagram_delivery_bb_pro;
DROP VIEW IF EXISTS public."dk_DARKSIDEMARKETING_TELAGRAM_bb";

-- The middle room is the source. The delivery room is created separately.
CREATE VIEW public."dk_DARKSIDEMARKETING_TELAGRAM_bb" AS
WITH lab99_by_order AS (
  SELECT
    l.order_number::text AS order_number,
    MAX(to_jsonb(l)->>'upsert_key') AS upsert_key,
    MAX(to_jsonb(l)->>'page_id') AS page_id,
    MAX(to_jsonb(l)->>'page_name') AS page_name,
    MAX(to_jsonb(l)->>'facebook_name') AS facebook_name,
    MAX(COALESCE(to_jsonb(l)->>'threadId', to_jsonb(l)->>'thread_id')) AS thread_id,
    MAX(to_jsonb(l)->>'created_at') AS created_at,
    MAX(to_jsonb(l)->>'updated_at') AS updated_at,
    MAX(to_jsonb(l)->>'order_time_display') AS order_time_display,
    MAX(to_jsonb(l)->>'customer_name') AS customer_name,
    MAX(COALESCE(to_jsonb(l)->>'phone', to_jsonb(l)->>'extracted_phone')) AS phone,
    MAX(to_jsonb(l)->>'extracted_phone') AS extracted_phone,
    MAX(to_jsonb(l)->>'address_display_packer') AS address_display_packer,
    MAX(to_jsonb(l)->>'addressclean') AS addressclean,
    MAX(to_jsonb(l)->>'full_address') AS full_address,
    MAX(to_jsonb(l)->>'telegram_message') AS telegram_message,
    (jsonb_agg(to_jsonb(l)->'normalized_chat_timeline')
      FILTER (WHERE to_jsonb(l)->'normalized_chat_timeline' IS NOT NULL))->0
      AS normalized_chat_timeline,
    MAX(to_jsonb(l)->>'lab_source_text') AS lab_source_text,
    MAX(to_jsonb(l)->>'source_payload_text') AS source_payload_text,
    MAX(COALESCE(to_jsonb(l)->>'cod_amount_text', to_jsonb(l)->>'cod_amount',
      to_jsonb(l)->>'cod',
      (regexp_match(COALESCE(to_jsonb(l)->>'lab_source_text',''),
       '(?:ยอดรวมCOD|COD)[[:space:]]*:?[[:space:]]*\[?([0-9,]+)'))[1])) AS cod_amount_text,
    MAX(COALESCE(to_jsonb(l)->>'shipping_carrier',
      (regexp_match(COALESCE(to_jsonb(l)->>'lab_source_text',''),
       'ขนส่ง[[:space:]]*:[[:space:]]*([^\n]+)'))[1])) AS shipping_carrier,
    COUNT(*)::integer AS lab99_item_count,
    jsonb_agg(to_jsonb(l) ORDER BY COALESCE(to_jsonb(l)->>'line_no_text','')) AS lab99_items_json,
    string_agg(DISTINCT NULLIF(BTRIM(to_jsonb(l)->>'source_payload_text'), ''),
      E'\n--- LAB99 SOURCE PAYLOAD ---\n') AS lab99_source_payload_text,
    string_agg(NULLIF(BTRIM(to_jsonb(l)->>'raw_product_text'), ''), E'\n'
      ORDER BY COALESCE(to_jsonb(l)->>'line_no_text',''))
      FILTER (WHERE NULLIF(BTRIM(to_jsonb(l)->>'raw_product_text'), '') IS NOT NULL)
      AS lab99_raw_product_lines,
    COUNT(*) FILTER (WHERE COALESCE(to_jsonb(l)->>'lab99_status','')='RAW_ITEM_FOUND')::integer
      AS lab99_raw_item_count,
    COUNT(*) FILTER (WHERE COALESCE(to_jsonb(l)->>'lab99_status','')<>'RAW_ITEM_FOUND')::integer
      AS lab99_review_count,
    MAX(to_jsonb(l)->>'lab_status') AS lab_status,
    MAX(to_jsonb(l)->>'lab_reason') AS lab_reason
  FROM public.vw_bb_draksidemarketing_extraction_lab99_pro AS l
  GROUP BY l.order_number
), lab88_by_order AS (
  SELECT
    l.order_number::text AS order_number,
    MAX(COALESCE(to_jsonb(l)->>'upsert_key', x.value->>'upsert_key', l.upsert_key::text)) AS upsert_key,
    jsonb_agg(DISTINCT to_jsonb(l)) AS lab88_full_room_rows_json,
    MAX(COALESCE(to_jsonb(l)->>'page_id', x.value->>'page_id')) AS page_id,
    MAX(COALESCE(to_jsonb(l)->>'page_name', x.value->>'page_name')) AS page_name,
    MAX(COALESCE(to_jsonb(l)->>'facebook_name', x.value->>'facebook_name')) AS facebook_name,
    MAX(COALESCE(to_jsonb(l)->>'threadId', to_jsonb(l)->>'thread_id', x.value->>'threadId', x.value->>'thread_id')) AS thread_id,
    MAX(COALESCE(to_jsonb(l)->>'created_at', x.value->>'created_at')) AS created_at,
    MAX(COALESCE(to_jsonb(l)->>'updated_at', x.value->>'updated_at')) AS updated_at,
    MAX(COALESCE(to_jsonb(l)->>'order_time_display', x.value->>'order_time_display')) AS order_time_display,
    MAX(COALESCE(to_jsonb(l)->>'customer_name', x.value->>'customer_name')) AS customer_name,
    MAX(COALESCE(to_jsonb(l)->>'phone', to_jsonb(l)->>'extracted_phone', x.value->>'phone', x.value->>'extracted_phone')) AS phone,
    MAX(COALESCE(to_jsonb(l)->>'extracted_phone', x.value->>'extracted_phone')) AS extracted_phone,
    MAX(COALESCE(to_jsonb(l)->>'address_display_packer', x.value->>'address_display_packer')) AS address_display_packer,
    MAX(COALESCE(to_jsonb(l)->>'addressclean', x.value->>'addressclean')) AS addressclean,
    MAX(COALESCE(to_jsonb(l)->>'full_address', x.value->>'full_address')) AS full_address,
    MAX(COALESCE(to_jsonb(l)->>'telegram_message', x.value->>'telegram_message')) AS telegram_message,
    MAX(COALESCE(to_jsonb(l)->>'cod_amount_text', to_jsonb(l)->>'cod_amount', x.value->>'cod_amount_text', x.value->>'cod_amount')) AS cod_amount_text,
    MAX(COALESCE(to_jsonb(l)->>'shipping_carrier', x.value->>'shipping_carrier')) AS shipping_carrier,
    MAX(COALESCE(to_jsonb(l)->>'stock_notice', x.value->>'stock_notice')) AS stock_notice,
    MAX(COALESCE(to_jsonb(l)->>'out_of_stock_joke', x.value->>'out_of_stock_joke')) AS out_of_stock_joke,
    MAX(COALESCE(to_jsonb(l)->>'lab_source_text', x.value->>'lab_source_text')) AS lab_source_text,
    MAX(COALESCE(to_jsonb(l)->>'sniper_x_text_clean', x.value->>'sniper_x_text_clean')) AS sniper_x_text_clean,
    MAX(COALESCE(to_jsonb(l)->>'display_for_ku', to_jsonb(l)->>'display_for_packer', x.value->>'display_for_ku')) AS display_for_ku,
    COALESCE(
      jsonb_agg(x.value ORDER BY COALESCE(x.value->>'line_no',''))
        FILTER (WHERE x.value IS NOT NULL),
      '[]'::jsonb
    ) AS lab_product_candidates_json,
    string_agg(NULLIF(BTRIM(x.value->>'raw_text'), ''), E'\n'
      ORDER BY COALESCE(x.value->>'line_no',''))
      FILTER (WHERE NULLIF(BTRIM(x.value->>'raw_text'), '') IS NOT NULL)
      AS lab_product_raw_text
  FROM public.vw_bb_product_extraction_lab88 AS l
  LEFT JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(l.lab_product_candidates)='array'
      THEN l.lab_product_candidates ELSE '[]'::jsonb END
  ) AS x(value) ON true
  GROUP BY l.order_number
)
SELECT
  COALESCE(l99.upsert_key, l88.upsert_key) AS upsert_key,
  COALESCE(l99.order_number, l88.order_number) AS order_number,
  COALESCE(l99.page_id, l88.page_id) AS page_id,
  COALESCE(l99.page_name, l88.page_name) AS page_name,
  COALESCE(l99.facebook_name, l88.facebook_name) AS facebook_name,
  COALESCE(l99.thread_id, l88.thread_id) AS thread_id,
  COALESCE(l99.created_at, l88.created_at) AS created_at,
  COALESCE(l99.updated_at, l88.updated_at) AS updated_at,
  COALESCE(l99.order_time_display, l88.order_time_display) AS order_time_display,
  COALESCE(l99.customer_name, l88.customer_name) AS customer_name,
  COALESCE(l99.phone, l88.phone) AS phone,
  COALESCE(l99.extracted_phone, l88.extracted_phone) AS extracted_phone,
  COALESCE(l99.address_display_packer, l88.address_display_packer) AS address_display_packer,
  COALESCE(l99.addressclean, l88.addressclean) AS addressclean,
  COALESCE(l99.full_address, l88.full_address) AS full_address,
  COALESCE(l99.telegram_message, l88.telegram_message) AS telegram_message,
  l99.normalized_chat_timeline,
  COALESCE(l99.cod_amount_text, l88.cod_amount_text) AS cod_amount_text,
  COALESCE(l99.shipping_carrier, l88.shipping_carrier) AS shipping_carrier,
  l88.lab_source_text AS lab88_lab_source_text,
  l88.lab88_full_room_rows_json,
  l99.lab_source_text AS lab99_lab_source_text,
  l99.source_payload_text AS lab99_source_payload_text,
  l99.lab99_item_count,
  l99.lab99_items_json,
  l99.lab99_raw_product_lines,
  l99.lab99_raw_item_count,
  l99.lab99_review_count,
  l99.lab_status AS lab99_status,
  l99.lab_reason AS lab99_reason,
  COALESCE(l88.lab_product_candidates_json, '[]'::jsonb) AS lab_product_candidates_json,
  COALESCE(l88.lab_product_candidates_json::text, '[]') AS lab_product_candidates_text,
  l88.lab_product_raw_text,
  CASE WHEN l88.order_number IS NULL THEN 'LAB99_ONLY_NO_LAB88_PRODUCT'
       WHEN l99.lab99_review_count > 0 THEN 'LAB99_ORDER_LAB99_REVIEW'
       ELSE 'LAB99_ORDER_LAB88_ATTACHED' END::text AS telegram_room_status,
  'BB'::text AS telegram_camp,
  'LAB99 order details + LAB88 product candidates'::text AS telegram_source_route
FROM lab99_by_order AS l99
FULL OUTER JOIN lab88_by_order AS l88
  ON l88.order_number = l99.order_number;

CREATE VIEW public.vw_bb_telegram_queue_from_lab88 AS
SELECT *
FROM public."dk_DARKSIDEMARKETING_TELAGRAM_bb";

COMMENT ON VIEW public."dk_DARKSIDEMARKETING_TELAGRAM_bb" IS
  'BB Telegram middle room combines Lab 99 order details and full Lab 88 room/candidate backup data. Lab 88 and Lab 99 source views remain untouched.';

COMMIT;

-- -----------------------------------------------------------------------------
-- Read-only checks after installation
-- -----------------------------------------------------------------------------
-- 1) Lab 88 order count versus Telegram middle count:
-- SELECT
--   (SELECT COUNT(*) FROM public.vw_bb_product_extraction_lab88) AS lab88_rows,
--   (SELECT COUNT(*) FROM dk.drakside_telagram_delivery_bb_pro) AS telegram_rows;
--
-- 2) Inspect product block and Lab 99 payload:
-- SELECT
--   order_number,
--   lab_product_candidates_text,
--   lab99_source_payload_text,
--   telegram_room_status
-- FROM public.drakside_telagram_delivery_bb_pro
-- ORDER BY order_time_display;
--
-- 3) Confirm rows from Lab 88 are not dropped:
-- SELECT l.order_number
-- FROM public.vw_bb_product_extraction_lab88 AS l
-- LEFT JOIN dk.drakside_telagram_delivery_bb_pro AS t
--   ON t.order_number = l.order_number
-- WHERE t.order_number IS NULL;

-- BB ONLY — LIGHT TELEGRAM DELIVERY BILL
--
-- Middle room:
--   dk.drakside_telagram_delivery_bb_pro
--
-- This delivery view is intentionally lightweight.
-- It does not expose SELECT * or the full Lab 99 source payload.
-- Product candidates still come from Lab 88 through the middle room.
-- Lab 99 payload remains in the middle room for audit, not in the sender payload.
-- Do not run for ST.

BEGIN;

-- The middle room is the parent and must remain intact.
-- Drop only the sender views, in child-before-parent order.
DROP VIEW IF EXISTS public.drakside_telagram_delivery_bb_pro;
DROP VIEW IF EXISTS dk.drakside_telagram_delivery_bb_pro;

CREATE VIEW dk.drakside_telagram_delivery_bb_pro AS
WITH middle AS (
  SELECT
    m,
    to_jsonb(m) AS j,
    COALESCE(
      NULLIF(BTRIM(m.lab99_lab_source_text), ''),
      NULLIF(BTRIM(m.lab88_lab_source_text), ''),
      (
        SELECT NULLIF(BTRIM(x->>'lab_source_text'), '')
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(m.lab_product_candidates_json) = 'array'
              THEN m.lab_product_candidates_json
            ELSE '[]'::jsonb
          END
        ) AS q(x)
        WHERE NULLIF(BTRIM(x->>'lab_source_text'), '') IS NOT NULL
        ORDER BY COALESCE(x->>'line_no', '')
        LIMIT 1
      )
    ) AS lab_source_text
  FROM public."dk_DARKSIDEMARKETING_TELAGRAM_bb" AS m
), current_stock_by_order AS (
  SELECT
    m.order_number,
    string_agg(DISTINCT NULLIF(BTRIM(p.stock_notice), ''), E'\n') AS current_stock_notice
  FROM public."dk_DARKSIDEMARKETING_TELAGRAM_bb" AS m
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(m.lab_product_candidates_json) = 'array'
        THEN m.lab_product_candidates_json
      ELSE '[]'::jsonb
    END
  ) AS item(x)
  JOIN public.product_master_bill AS p
    ON p.master_sku = COALESCE(item.x->>'master_sku', item.x->>'sku')
  GROUP BY m.order_number
), prepared AS (
  SELECT
    COALESCE(NULLIF(BTRIM(j->>'upsert_key'), ''), NULLIF(BTRIM(j->>'order_key'), ''))::text AS upsert_key,
    COALESCE(NULLIF(BTRIM(j->>'order_number'), ''), NULLIF(BTRIM(j->>'order_no'), ''))::text AS order_number,
    COALESCE(
      NULLIF(BTRIM(j->>'page_id'), ''),
      NULLIF(BTRIM(j->>'pageId'), ''),
      NULLIF(BTRIM((regexp_match(COALESCE(j->>'lab99_source_payload_text', ''), '"page_id"[[:space:]]*:[[:space:]]*"([^"]+)"'))[1]), '')
    )::text AS page_id,
    COALESCE(
      NULLIF(BTRIM(j->>'page_name'), ''),
      NULLIF(BTRIM(j->>'pageName'), ''),
      NULLIF(BTRIM((regexp_match(COALESCE(j->>'lab99_source_payload_text', ''), '"page_name"[[:space:]]*:[[:space:]]*"([^"]+)"'))[1]), '')
    )::text AS page_name,
    COALESCE(
      NULLIF(BTRIM(j->>'facebook_name'), ''),
      NULLIF(BTRIM(j->>'facebookName'), ''),
      NULLIF(BTRIM((regexp_match(COALESCE(j->>'lab99_source_payload_text', ''), '"facebook_name"[[:space:]]*:[[:space:]]*"([^"]+)"'))[1]), '')
    )::text AS facebook_name,
    COALESCE(
      NULLIF(BTRIM(j->>'thread_id'), ''),
      NULLIF(BTRIM(j->>'threadId'), ''),
      NULLIF(BTRIM((regexp_match(COALESCE(j->>'lab99_source_payload_text', ''), '"thread_id"[[:space:]]*:[[:space:]]*"([^"]+)"'))[1]), '')
    )::text AS thread_id,
    COALESCE(
      NULLIF(BTRIM(j->>'customer_name'), ''),
      NULLIF(BTRIM(j->>'customerName'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, '(?:👤[[:space:]]*ชื่อ|ชื่อ)[[:space:]]*:[[:space:]]*([^\n]+)'))[1]), ''),
      NULLIF(BTRIM((
        SELECT regexp_replace(l.line_text, '(?:\+?66|0)[0-9][0-9 -]{7,}', '', 'g')
        FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
          WITH ORDINALITY AS l(line_text, line_no)
        WHERE l.line_text ~ '(?:\+?66|0)[0-9][0-9 -]{7,}'
        ORDER BY l.line_no
        LIMIT 1
      )), '')
    )::text AS customer_name,
    COALESCE(
      NULLIF(BTRIM(j->>'phone'), ''),
      NULLIF(BTRIM(j->>'telephone'), ''),
      NULLIF(BTRIM(j->>'phone_number'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, '(?:เบอร์โทรศัพท์|เบอร์|โทรศัพท์)[[:space:]]*:[[:space:]]*([0-9][0-9 -]{7,})'))[1]), ''),
      NULLIF(BTRIM((
        SELECT (regexp_match(l.line_text, '((?:\+?66|0)[0-9][0-9 -]{7,})'))[1]
        FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
          WITH ORDINALITY AS l(line_text, line_no)
        WHERE l.line_text ~ '(?:\+?66|0)[0-9][0-9 -]{7,}'
        ORDER BY l.line_no
        LIMIT 1
      )), '')
    )::text AS phone,
    COALESCE(
      NULLIF(BTRIM(j->>'address_display_packer'), ''),
      NULLIF(BTRIM(j->>'addressclean'), ''),
      NULLIF(BTRIM(j->>'full_address'), ''),
      NULLIF(BTRIM(j->>'address'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, '(?:ที่อยู่จัดส่ง|ที่อยู่)[[:space:]]*:[[:space:]]*([^\n]+)'))[1]), ''),
      (
        SELECT NULLIF(string_agg(BTRIM(l.line_text), ' ' ORDER BY l.line_no), '')
        FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
          WITH ORDINALITY AS l(line_text, line_no)
        WHERE l.line_no > COALESCE((
          SELECT MIN(c.line_no)
          FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
            WITH ORDINALITY AS c(line_text, line_no)
          WHERE c.line_text ~ '(?:\+?66|0)[0-9][0-9 -]{7,}'
        ), 0)
          AND l.line_no < COALESCE((
            SELECT MIN(h.line_no)
            FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
              WITH ORDINALITY AS h(line_text, line_no)
            WHERE h.line_text ~* '(รายการสินค้า|สินค้า:|📦)'
          ), 2147483647)
          AND l.line_text ~ '[0-9A-Za-zก-๙]'
          AND l.line_text !~* '(COD|ยอดรวม|ขนส่ง|รายการสินค้า|สินค้า:|เวลาสั่งซื้อ|https?://)'
      )
    )::text AS address_text,
    COALESCE(
      NULLIF(BTRIM(j->>'cod_amount'), ''),
      NULLIF(BTRIM(j->>'cod'), ''),
      NULLIF(BTRIM(j->>'total_cod'), ''),
      NULLIF(BTRIM(j->>'total'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, '(?:ยอดรวมCOD|COD)[[:space:]]*:?[[:space:]]*\[?([0-9,]+)'))[1]), '')
    )::text AS cod_amount_text,
    COALESCE(
      NULLIF(BTRIM(j->>'shipping_carrier'), ''),
      NULLIF(BTRIM(j->>'carrier'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, 'ขนส่ง[[:space:]]*:[[:space:]]*([^\n]+)'))[1]), ''),
      '⚡FLASH EXPRESS'
    )::text AS shipping_carrier,
    COALESCE(NULLIF(BTRIM(cs.current_stock_notice), ''), NULLIF(BTRIM(j->>'stock_notice'), ''), '✅ พร้อมจัด')::text AS stock_notice,
    NULLIF(BTRIM(j->>'out_of_stock_joke'), '')::text AS out_of_stock_joke,
    NULLIF(BTRIM(j->>'telegram_message'), '')::text AS telegram_message_source,
    NULLIF(BTRIM(j->>'sniper_x_text_clean'), '')::text AS sniper_x_text_clean,
    COALESCE(NULLIF(BTRIM(j->>'display_for_ku'), ''), NULLIF(BTRIM(j->>'display_for_packer'), ''))::text AS display_for_ku,
    COALESCE(NULLIF(BTRIM(j->>'order_time_display'), ''), NULLIF(BTRIM(j->>'order_created_at'), ''), NULLIF(BTRIM(j->>'created_at'), ''))::text AS order_time_text,
    COALESCE(NULLIF(BTRIM(j->>'order_number_displayed'), ''), NULLIF(BTRIM(j->>'order_number'), ''), NULLIF(BTRIM(j->>'order_no'), ''))::text AS order_number_displayed,
    COALESCE(
      NULLIF(BTRIM(j->>'address_display_packer'), ''),
      NULLIF(BTRIM(j->>'addressclean'), ''),
      NULLIF(BTRIM(j->>'full_address'), ''),
      NULLIF(BTRIM(j->>'address'), ''),
      NULLIF(BTRIM((regexp_match(mid.lab_source_text, '(?:ที่อยู่จัดส่ง|ที่อยู่)[[:space:]]*:[[:space:]]*([^\n]+)'))[1]), ''),
      (
        SELECT NULLIF(string_agg(BTRIM(l.line_text), ' ' ORDER BY l.line_no), '')
        FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
          WITH ORDINALITY AS l(line_text, line_no)
        WHERE l.line_no > COALESCE((
          SELECT MIN(c.line_no)
          FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
            WITH ORDINALITY AS c(line_text, line_no)
          WHERE c.line_text ~ '(?:\+?66|0)[0-9][0-9 -]{7,}'
        ), 0)
          AND l.line_no < COALESCE((
            SELECT MIN(h.line_no)
            FROM regexp_split_to_table(COALESCE(mid.lab_source_text, ''), E'\\r?\\n')
              WITH ORDINALITY AS h(line_text, line_no)
            WHERE h.line_text ~* '(รายการสินค้า|สินค้า:|📦)'
          ), 2147483647)
          AND l.line_text ~ '[0-9A-Za-zก-๙]'
          AND l.line_text !~* '(COD|ยอดรวม|ขนส่ง|รายการสินค้า|สินค้า:|เวลาสั่งซื้อ|https?://)'
      )
    )::text AS address_display_packer,
    COALESCE(j->'lab_product_candidates_json', j->'lab_product_candidates', '[]'::jsonb) AS lab_product_candidates_json,
    COALESCE(j->>'lab_product_candidates_text', j->>'display_for_ku', j->>'sniper_x_text_clean', '') AS lab_product_candidates_text,
    CASE
      WHEN jsonb_typeof(COALESCE(j->'lab_product_candidates_json', j->'lab_product_candidates', '[]'::jsonb)) = 'array'
      THEN COALESCE(
        (
          SELECT string_agg(
            CASE
              WHEN NULLIF(BTRIM(x->>'master_display_for_packer'), '') IS NOT NULL
                THEN NULLIF(BTRIM(x->>'master_display_for_packer'), '')
              WHEN NULLIF(BTRIM(x->>'product_id'), '') IS NULL
                THEN NULLIF(BTRIM(x->>'raw_text'), '')
              ELSE COALESCE(
                NULLIF(BTRIM(x->>'bb_pack'), ''),
                NULLIF(BTRIM(x->>'master_display'), ''),
                NULLIF(BTRIM(x->>'raw_text'), '')
              )
            END, E'\n' ORDER BY COALESCE(x->>'line_no', '')
          )
          FROM jsonb_array_elements(COALESCE(j->'lab_product_candidates_json', j->'lab_product_candidates', '[]'::jsonb)) AS q(x)
        ),
        NULLIF(BTRIM(j->>'display_for_ku'), ''),
        NULLIF(BTRIM(j->>'sniper_x_text_clean'), ''),
        NULLIF(BTRIM(j->>'telegram_message'), '')
      )
      ELSE COALESCE(j->>'display_for_ku', j->>'sniper_x_text_clean', j->>'telegram_message', '')
    END::text AS lab_product_display_text,
    j->>'telegram_room_status' AS telegram_room_status,
    j->>'telegram_camp' AS telegram_camp,
    j
  FROM middle AS mid
  LEFT JOIN current_stock_by_order AS cs
    ON cs.order_number = COALESCE(j->>'order_number', j->>'order_no')
)
SELECT
  p.upsert_key,
  p.order_number,
  p.page_id,
  p.page_name,
  p.facebook_name,
  p.thread_id,
  p.customer_name,
  p.phone,
  p.address_text,
  p.cod_amount_text,
  p.shipping_carrier,
  p.stock_notice,
  p.out_of_stock_joke,
  p.telegram_message_source AS source_telegram_message,
  concat(
    '🚀 <b>[', COALESCE(p.stock_notice, ''), ' - 🎯ORDER_SNIPER_X]</b>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '⏰ <b>เวลาสั่งซื้อ:</b> ', COALESCE(p.order_time_text, ''), E'\n',
    '🆔 <b>เลขออเดอร์:</b> <code>', COALESCE(p.order_number_displayed, p.order_number, ''), '</code>', E'\n',
    '📢 <b>ชื่อเพจ:</b> ', COALESCE(p.page_name, ''), E'\n',
    '👤 <b>Facebook:</b> ', COALESCE(p.facebook_name, ''), E'\n',
    '💰 <b>ยอด COD:</b> <code>', COALESCE(p.cod_amount_text, ''), '</code> บาท', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '<code>', COALESCE(p.customer_name, ''), '</code>', E'\n',
    '<code>', COALESCE(p.phone, ''), '</code>', E'\n',
    '<code>', COALESCE(p.address_display_packer, p.address_text, ''), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '📦 <b>รายการสินค้า:</b>', E'\n',
    '<code>', COALESCE(p.lab_product_display_text, p.lab_product_candidates_text, p.display_for_ku, p.sniper_x_text_clean, 'ยังไม่มีรายการสินค้า'), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '🚚 <b>ขนส่ง:</b> ⚡FLASH EXPRESS'
  )::text AS telegram_message,
  p.sniper_x_text_clean,
  p.display_for_ku,
  p.order_time_text,
  p.order_time_text AS order_time_display,
  p.order_number_displayed,
  p.address_display_packer,

  -- Lab 88 product block: the only product payload sent to Telegram.
  p.lab_product_candidates_json,
  p.lab_product_candidates_text,
  p.lab_product_display_text,
  p.lab_product_display_text AS master_display_for_packer,
  p.stock_notice::text AS stock_notice_and_bill_header,
  p.stock_notice::text AS bill_header_text,

  -- Compact bill for the sender node.
  jsonb_build_object(
    'camp', 'BB',
    'upsert_key', p.upsert_key,
    'order_number', p.order_number,
    'order_number_displayed', p.order_number_displayed,
    'page_name', p.page_name,
    'facebook_name', p.facebook_name,
    'customer_name', p.customer_name,
    'phone', p.phone,
    'address', p.address_text,
    'cod_amount', p.cod_amount_text,
    'shipping_carrier', p.shipping_carrier,
    'order_time_display', p.order_time_text,
    'stock_notice', p.stock_notice,
    'bill_header_text', p.stock_notice,
    'source_telegram_message', p.telegram_message_source,
    'master_display_for_packer', p.lab_product_display_text,
    'sniper_x_text_clean', p.sniper_x_text_clean,
    'display_for_ku', p.display_for_ku,
    'lab_product_candidates', p.lab_product_candidates_json
  ) AS telegram_bill_json,

  concat(
    '🚀 <b>[', COALESCE(p.stock_notice, ''), ' - 🎯ORDER_SNIPER_X]</b>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '⏰ <b>เวลาสั่งซื้อ:</b> ', COALESCE(p.order_time_text, ''), E'\n',
    '🆔 <b>เลขออเดอร์:</b> <code>', COALESCE(p.order_number_displayed, p.order_number, ''), '</code>', E'\n',
    '📢 <b>ชื่อเพจ:</b> ', COALESCE(p.page_name, ''), E'\n',
    '👤 <b>Facebook:</b> ', COALESCE(p.facebook_name, ''), E'\n',
    '💰 <b>ยอด COD:</b> <code>', COALESCE(p.cod_amount_text, ''), '</code> บาท', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '<code>', COALESCE(p.customer_name, ''), '</code>', E'\n',
    '<code>', COALESCE(p.phone, ''), '</code>', E'\n',
    '<code>', COALESCE(p.address_display_packer, p.address_text, ''), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '📦 <b>รายการสินค้า:</b>', E'\n',
    '<code>', COALESCE(p.lab_product_display_text, p.lab_product_candidates_text, p.display_for_ku, p.sniper_x_text_clean, p.telegram_message_source, 'ยังไม่มีรายการสินค้า'), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '🚚 <b>ขนส่ง:</b> ⚡FLASH EXPRESS'
  )::text AS telegram_bill_text,

  -- Same bill with a descriptive name for the Telegram sender node.
  concat(
    '🚀 <b>[', COALESCE(p.stock_notice, ''), ' - 🎯ORDER_SNIPER_X]</b>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '⏰ <b>เวลาสั่งซื้อ:</b> ', COALESCE(p.order_time_text, ''), E'\n',
    '🆔 <b>เลขออเดอร์:</b> <code>', COALESCE(p.order_number_displayed, p.order_number, ''), '</code>', E'\n',
    '📢 <b>ชื่อเพจ:</b> ', COALESCE(p.page_name, ''), E'\n',
    '👤 <b>Facebook:</b> ', COALESCE(p.facebook_name, ''), E'\n',
    '💰 <b>ยอด COD:</b> <code>', COALESCE(p.cod_amount_text, ''), '</code> บาท', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '<code>', COALESCE(p.customer_name, ''), '</code>', E'\n',
    '<code>', COALESCE(p.phone, ''), '</code>', E'\n',
    '<code>', COALESCE(p.address_display_packer, p.address_text, ''), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '📦 <b>รายการสินค้า:</b>', E'\n',
    '<code>', COALESCE(p.lab_product_display_text, p.lab_product_candidates_text, p.display_for_ku, p.sniper_x_text_clean, p.telegram_message_source, 'ยังไม่มีรายการสินค้า'), '</code>', E'\n',
    '━━━━━━━━━━━━━━━━━━━━', E'\n',
    '🚚 <b>ขนส่ง:</b> ⚡FLASH EXPRESS'
  )::text AS telegram_message_html,

  p.telegram_room_status,
  'BB'::text AS telegram_camp,
  'dk_DARKSIDEMARKETING_TELAGRAM_bb → LAB88 candidates → light bill'::text AS delivery_source_route,
  'WAITING'::text AS delivery_status
FROM prepared AS p;

COMMENT ON VIEW dk.drakside_telagram_delivery_bb_pro IS
  'BB Telegram sender source room. Lightweight bill assembled from the Telegram middle room.';

-- Sender queue: use upsert_key as the primary key and omit orders already
-- marked SENT by the BB workflow after a successful Telegram send.
CREATE VIEW public.vw_telegram_delivery_queue_bb AS
SELECT
  d.*,
  COALESCE(NULLIF(BTRIM(d.upsert_key), ''), NULLIF(BTRIM(d.order_number), ''))
    AS delivery_state_key
FROM dk.drakside_telagram_delivery_bb_pro AS d
WHERE COALESCE(NULLIF(BTRIM(d.upsert_key), ''), NULLIF(BTRIM(d.order_number), '')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.bb_orders AS o
    WHERE COALESCE(NULLIF(BTRIM(o.upsert_key::text), ''), NULLIF(BTRIM(o.order_number::text), ''))
          = COALESCE(NULLIF(BTRIM(d.upsert_key), ''), NULLIF(BTRIM(d.order_number), ''))
      AND (
        UPPER(COALESCE(to_jsonb(o)->>'telegram_status', '')) = 'SENT'
        OR LOWER(COALESCE(to_jsonb(o)->>'telegram_sent', '')) IN ('true', 't', '1')
      )
  );

COMMENT ON VIEW public.vw_telegram_delivery_queue_bb IS
  'BB sender queue; excludes orders whose bb_orders.telegram_status is SENT or telegram_sent is true.';

-- Keep the familiar sender-view name for the BB website/n8n, but point it at
-- the filtered queue so sent orders leave the room.
CREATE VIEW public.drakside_telagram_delivery_bb_pro AS
SELECT * FROM public.vw_telegram_delivery_queue_bb;

COMMENT ON VIEW public.drakside_telagram_delivery_bb_pro IS
  'BB Telegram sender room alias; contains only eligible, not-yet-sent orders.';

COMMIT;

-- -----------------------------------------------------------------------------
-- Read-only checks
-- -----------------------------------------------------------------------------
-- SELECT COUNT(*) FROM dk.drakside_telagram_delivery_bb_pro;
-- SELECT order_number, customer_name, cod_amount_text,
--        lab_product_candidates_text, telegram_bill_text
-- FROM public.drakside_telagram_delivery_bb_pro
-- ORDER BY order_time_display;
