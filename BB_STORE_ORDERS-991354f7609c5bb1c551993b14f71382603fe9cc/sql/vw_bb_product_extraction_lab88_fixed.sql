-- BB ONLY · PRODUCT EXTRACTION LAB 88 · FIXED + EXPLODED LINES
-- Keeps the original bottom-product-block logic and supports admin-person orders.
-- Raw evidence is read-only and never overwritten.

-- Do not DROP: web views depend on lab88_lines.
-- CREATE OR REPLACE preserves those dependencies and updates the logic in place.
CREATE OR REPLACE VIEW public.vw_bb_product_extraction_lab88 AS
WITH order_source AS (
  SELECT
    o.upsert_key,
    o.order_number,
    o.order_time_display,
    COALESCE(NULLIF(BTRIM(o.sniper_x_text_clean), ''), NULLIF(BTRIM(o.clean_text), ''), '') AS source_text,
    COALESCE(NULLIF(BTRIM(o.for_packer_bb_display), ''), NULLIF(BTRIM(o.single_cleaned_products), ''), '') AS stamped_product_text
  FROM public.bb_orders AS o
), master_names AS (
  SELECT
    p.master_sku,
    p.th_name AS master_th_name,
    p.master_display_for_packer,
    p.display_for_packer,
    p.alias,
    lower(
      regexp_replace(
        regexp_replace(COALESCE(p.th_name, ''), '[[:space:]]+', '', 'g'),
        '[^[:alnum:]ก-๙]+', '', 'g'
      )
    ) AS master_th_name_clean
  FROM public.product_master AS p
  WHERE COALESCE(BTRIM(p.th_name), '') <> ''
), raw_lines AS (
  SELECT
    s.*,
    x.line_no::integer AS source_line_no,
    BTRIM(x.line_text) AS line_text
  FROM order_source AS s
  CROSS JOIN LATERAL regexp_split_to_table(s.source_text, E'\r?\n') WITH ORDINALITY AS x(line_text, line_no)
), order_bounds AS (
  SELECT
    upsert_key,
    MAX(source_line_no) AS max_line_no,
    COALESCE(
      MAX(source_line_no) FILTER (WHERE line_text ~* '(รายการสินค้า|รายการสินค้าสำหรับจัดของ|สินค้า:)'),
      1
    ) AS last_product_header_line_no
  FROM raw_lines
  GROUP BY upsert_key
), bottom_lines AS (
  SELECT r.*
  FROM raw_lines AS r
  JOIN order_bounds AS b ON b.upsert_key = r.upsert_key
  WHERE r.source_line_no >= GREATEST(
    1,
    b.last_product_header_line_no,
    b.max_line_no - 24
  )
), candidate_lines AS (
  SELECT
    s.upsert_key,
    s.order_number,
    s.order_time_display,
    s.source_text,
    s.stamped_product_text,
    s.source_line_no,
    BTRIM(y.token) AS candidate_text
  FROM bottom_lines AS s
  CROSS JOIN LATERAL unnest(string_to_array(s.line_text, '+')) AS y(token)
  WHERE BTRIM(y.token) <> ''
    AND BTRIM(y.token) !~* '(รายการสินค้า|ขนส่ง|สถานะ|เลขออเดอร์|เวลาสั่งซื้อ|ยอดรวม|จัดส่ง|ขอบคุณ|พร้อมส่ง|COD|LINE\s*:|ไลน์\s*:|https?://|www\.|@[A-Za-z0-9_]+|หนูได้ส่งข้อมูลออเดอร์|ทีมงานจะตรวจสอบ|เก็บเงินปลายทาง|ที่อยู่จัดส่ง)'
    AND (
      BTRIM(y.token) ~* '(คอต|ห่อ|ชิ้น|กล่อง|ลัง|🍉|🫐|🥭|🍇|🍊|🍍|🟥|🟧|🟨|🟩|🟦|🟪|🟫|🟣|🔴|🟢|🟡)'
      -- Keep an unknown human-admin product line as raw evidence, e.g. "คาเขียว 1".
      OR BTRIM(y.token) ~* '(^|\s)[0-9]{1,2}\s*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?$'
      OR EXISTS (
        SELECT 1
        FROM public.product_master AS p
        WHERE (
          (NULLIF(BTRIM(p.master_sku), '') IS NOT NULL AND BTRIM(y.token) ILIKE '%' || p.master_sku || '%')
          OR (NULLIF(BTRIM(p.alias), '') IS NOT NULL AND BTRIM(y.token) ILIKE '%' || p.alias || '%')
          OR (NULLIF(BTRIM(p.th_name), '') IS NOT NULL AND BTRIM(y.token) ILIKE '%' || p.th_name || '%')
          OR replace(lower(regexp_replace(regexp_replace(COALESCE(p.th_name, ''), '[[:space:]]+', '', 'g'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
             = replace(lower(regexp_replace(regexp_replace(BTRIM(y.token), '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?', '', 'gi'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
        )
        AND BTRIM(y.token) ~ '[0-9]'
      )
      OR EXISTS (
        SELECT 1
        FROM public.product_alias_dictionary AS d
        WHERE BTRIM(y.token) ILIKE '%' || d.alias || '%'
          AND BTRIM(y.token) ~ '[0-9]'
      )
    )
), enriched AS (
  SELECT
    c.upsert_key,
    c.order_number,
    c.order_time_display,
    c.source_text,
    c.stamped_product_text,
    c.source_line_no,
    c.candidate_text,
    BTRIM(
      regexp_replace(
        regexp_replace(
          regexp_replace(COALESCE(c.candidate_text, ''),
            '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?', '', 'gi'
          ),
          '[[:space:]]+', '', 'g'
        ),
        '[^[:alnum:]ก-๙]+', '', 'g'
      )
    ) AS view_th_name_clean,
    COALESCE(
      (regexp_match(c.candidate_text, '([0-9]+(?:\.[0-9]+)?)\s*(?:คอต|ห่อ|ชิ้น|กล่อง|ลัง)'))[1]::numeric,
      (regexp_match(c.candidate_text, '[^0-9]([0-9]+(?:\.[0-9]+)?)\s*$'))[1]::numeric,
      (regexp_match(c.candidate_text, '^\s*([0-9]+(?:\.[0-9]+)?)\s+'))[1]::numeric,
      1::numeric
    ) AS cot_quantity,
    pm.master_sku,
    pm.th_name AS master_th_name,
    pm.th_name,
    COALESCE(
      NULLIF(BTRIM(pm.master_display_for_packer), ''),
      NULLIF(BTRIM(pm.display_for_packer), ''),
      BTRIM(c.candidate_text)
    ) AS master_display,
    CASE WHEN pm.master_sku IS NULL THEN 'REVIEW_NOT_MATCHED' ELSE 'MATCHED' END AS line_mapping_status
  FROM candidate_lines AS c
  LEFT JOIN LATERAL (
    SELECT
      p.master_sku,
      p.th_name AS master_th_name,
      p.th_name,
      p.master_display_for_packer,
      p.display_for_packer,
      p.alias,
      p.match_name,
      p.match_priority
    FROM (
      SELECT
        pm.master_sku,
        pm.th_name,
        pm.master_display_for_packer,
        pm.display_for_packer,
        pm.alias,
        pm.th_name AS match_name,
        0 AS match_priority
      FROM public.product_master AS pm
      UNION ALL
      SELECT
        pm.master_sku,
        pm.th_name,
        pm.master_display_for_packer,
        pm.display_for_packer,
        pm.alias,
        BTRIM(a.alias_part) AS match_name,
        1 AS match_priority
      FROM public.product_master AS pm
      CROSS JOIN LATERAL regexp_split_to_table(COALESCE(pm.alias, ''), ',') AS a(alias_part)
      WHERE BTRIM(a.alias_part) <> ''
      UNION ALL
      SELECT
        d.sku AS master_sku,
        COALESCE(d.th_name, pm.th_name) AS th_name,
        COALESCE(d.display_for_packer, pm.master_display_for_packer) AS master_display_for_packer,
        COALESCE(d.display_for_packer, pm.display_for_packer) AS display_for_packer,
        d.alias,
        BTRIM(a.alias_part) AS match_name,
        2 AS match_priority
      FROM public.product_alias_dictionary AS d
      LEFT JOIN public.product_master AS pm ON pm.master_sku = d.sku
      CROSS JOIN LATERAL regexp_split_to_table(COALESCE(d.alias, ''), ',') AS a(alias_part)
      WHERE BTRIM(a.alias_part) <> ''
    ) AS p
    WHERE (
         replace(lower(regexp_replace(regexp_replace(COALESCE(p.match_name, ''), '[[:space:]]+', '', 'g'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
           = replace(lower(regexp_replace(regexp_replace(COALESCE(c.candidate_text, ''), '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?', '', 'gi'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
         OR c.candidate_text ILIKE '%' || p.master_sku || '%'
       OR (NULLIF(BTRIM(p.match_name), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.match_name || '%')
    )
    ORDER BY CASE WHEN replace(lower(regexp_replace(regexp_replace(COALESCE(p.match_name, ''), '[[:space:]]+', '', 'g'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
                       = replace(lower(regexp_replace(regexp_replace(COALESCE(c.candidate_text, ''), '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?', '', 'gi'), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส') THEN 0
                  WHEN c.candidate_text ILIKE '%' || p.master_sku || '%' THEN 1 ELSE 2 END,
             p.match_priority,
             LENGTH(p.match_name) DESC,
             LENGTH(p.master_sku) DESC
    LIMIT 1
  ) AS pm ON TRUE
), all_candidates AS (
  SELECT
    s.upsert_key,
    s.order_number,
    s.order_time_display,
    s.source_text,
    s.stamped_product_text,
    NULL::integer AS source_line_no,
    NULL::text AS candidate_text,
    NULL::text AS view_th_name_clean,
    NULL::numeric AS cot_quantity,
    NULL::text AS master_sku,
    NULL::text AS master_th_name,
    NULL::text AS th_name,
    NULL::text AS master_display,
    'NO_CANDIDATES'::text AS line_mapping_status
  FROM order_source AS s
  WHERE NOT EXISTS (
    SELECT 1 FROM enriched AS e WHERE e.upsert_key = s.upsert_key
  )
  UNION ALL
  SELECT
    upsert_key,
    order_number,
    order_time_display,
    source_text,
    stamped_product_text,
    source_line_no,
    candidate_text,
    view_th_name_clean,
    cot_quantity,
    master_sku,
    master_th_name,
    th_name,
    master_display,
    line_mapping_status
  FROM enriched
)
SELECT
  upsert_key,
  order_number,
  order_time_display,
  'bb_BOTTOM_PRODUCT_BLOCK'::text AS lab_extraction_mode,
  source_text AS lab_source_text,
  stamped_product_text,
  COALESCE(jsonb_agg(jsonb_build_object(
    'source_line_no', source_line_no,
    'raw_text', candidate_text,
    'view_th_name_clean', view_th_name_clean,
    'cot_quantity', cot_quantity,
    'master_sku', master_sku,
    'master_th_name', master_th_name,
    'th_name', th_name,
    'master_display', master_display,
    'bb_pack', master_display,
    'line_mapping_status', line_mapping_status
  ) ORDER BY source_line_no) FILTER (WHERE candidate_text IS NOT NULL), '[]'::jsonb) AS lab_product_candidates,
  COUNT(candidate_text)::integer AS lab_product_line_count,
  COALESCE(SUM(cot_quantity), 0::numeric) AS lab_total_cot,
  COUNT(*) FILTER (WHERE line_mapping_status = 'MATCHED')::integer AS lab_matched_line_count,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ALIEN_NO_BB_PRODUCT_LINES'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'REVIEW_MASTER_MATCH'
    WHEN COUNT(*) FILTER (WHERE cot_quantity <= 0) > 0 THEN 'REVIEW_COT_MISSING'
    ELSE 'PASS'
  END AS lab_status,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ไม่พบบล็อกสินค้า'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'มีสินค้าชน Master ไม่ได้'
    ELSE 'จับบรรทัดสินค้าและจำนวนคอตได้ครบ'
  END AS lab_reason
FROM all_candidates
GROUP BY
  upsert_key,
  order_number,
  order_time_display,
  source_text,
  stamped_product_text;

-- Exploded form: one mapped/raw product line per row for the web and inspection room.
CREATE OR REPLACE VIEW public.vw_bb_product_extraction_lab88_lines AS
SELECT
  l.upsert_key,
  l.order_number,
  l.order_time_display,
  l.lab_source_text,
  l.stamped_product_text,
  l.lab_status,
  l.lab_reason,
  (candidate->>'source_line_no')::integer AS source_line_no,
  candidate->>'raw_text' AS raw_text,
  (candidate->>'cot_quantity')::numeric AS cot_quantity,
  candidate->>'master_sku' AS master_sku,
  candidate->>'th_name' AS th_name,
  candidate->>'master_display' AS master_display,
  candidate->>'line_mapping_status' AS line_mapping_status,
  candidate->>'view_th_name_clean' AS view_th_name_clean,
  candidate->>'master_th_name' AS master_th_name,
  candidate->>'bb_pack' AS bb_pack
FROM public.vw_bb_product_extraction_lab88 AS l
CROSS JOIN LATERAL jsonb_array_elements(l.lab_product_candidates) AS e(candidate);

COMMENT ON VIEW public.vw_bb_product_extraction_lab88 IS
  'BB-only bottom product extraction Lab; corrected grouping and preserved candidate JSON.';
COMMENT ON VIEW public.vw_bb_product_extraction_lab88_lines IS
  'BB-only exploded Lab lines; one raw/mapped product candidate per row.';
