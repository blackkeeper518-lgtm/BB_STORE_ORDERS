-- BB ONLY · PRODUCT EXTRACTION LAB 88 · FIXED + EXPLODED LINES
-- Keeps the original bottom-product-block logic.
-- Raw evidence is read-only and never overwritten.

DROP VIEW IF EXISTS public.vw_bb_product_extraction_lab88_lines;
DROP VIEW IF EXISTS public.vw_bb_product_extraction_lab88;

CREATE VIEW public.vw_bb_product_extraction_lab88 AS
WITH order_source AS (
  SELECT
    o.upsert_key,
    o.order_number,
    o.order_time_display,
    COALESCE(NULLIF(BTRIM(o.sniper_x_text_clean), ''), NULLIF(BTRIM(o.clean_text), ''), '') AS source_text,
    COALESCE(NULLIF(BTRIM(o.for_packer_bb_display), ''), NULLIF(BTRIM(o.single_cleaned_products), ''), '') AS stamped_product_text
  FROM public.bb_orders AS o
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
    AND BTRIM(y.token) ~* '(คอต|🍉|🫐|🥭|🍇|🍊|🍍|🟥|🟧|🟨|🟩|🟦|🟪|🟫|🟣|🔴|🟢|🟡)'
), enriched AS (
  SELECT
    c.upsert_key,
    c.order_number,
    c.order_time_display,
    c.source_text,
    c.stamped_product_text,
    c.source_line_no,
    c.candidate_text,
    COALESCE((regexp_match(c.candidate_text, '([0-9]+(?:\.[0-9]+)?)\s*คอต'))[1]::numeric, 1::numeric) AS cot_quantity,
    pm.master_sku,
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
      p.th_name,
      p.master_display_for_packer,
      p.display_for_packer,
      p.alias
    FROM public.product_master AS p
    WHERE c.candidate_text ILIKE '%' || p.master_sku || '%'
       OR (NULLIF(BTRIM(p.alias), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.alias || '%')
       OR (NULLIF(BTRIM(p.th_name), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.th_name || '%')
    ORDER BY CASE WHEN c.candidate_text ILIKE '%' || p.master_sku || '%' THEN 0 ELSE 1 END,
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
    NULL::numeric AS cot_quantity,
    NULL::text AS master_sku,
    NULL::text AS th_name,
    NULL::text AS master_display,
    'NO_CANDIDATES'::text AS line_mapping_status
  FROM order_source AS s
  WHERE NOT EXISTS (
    SELECT 1 FROM enriched AS e WHERE e.upsert_key = s.upsert_key
  )
  UNION ALL
  SELECT * FROM enriched
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
    'cot_quantity', cot_quantity,
    'master_sku', master_sku,
    'th_name', th_name,
    'master_display', master_display,
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
CREATE VIEW public.vw_bb_product_extraction_lab88_lines AS
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
  candidate->>'line_mapping_status' AS line_mapping_status
FROM public.vw_bb_product_extraction_lab88 AS l
CROSS JOIN LATERAL jsonb_array_elements(l.lab_product_candidates) AS e(candidate);

COMMENT ON VIEW public.vw_bb_product_extraction_lab88 IS
  'BB-only bottom product extraction Lab; corrected grouping and preserved candidate JSON.';
COMMENT ON VIEW public.vw_bb_product_extraction_lab88_lines IS
  'BB-only exploded Lab lines; one raw/mapped product candidate per row.';
