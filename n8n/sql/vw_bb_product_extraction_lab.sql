-- BB ONLY · PRODUCT EXTRACTION LAB
-- Read-only view. It never updates, moves, or deletes orders.
-- BB rule: product lines are normally below รายการสินค้า and contain คอต/emoji.

DROP VIEW IF EXISTS public.vw_bb_product_extraction_lab;

CREATE VIEW public.vw_bb_product_extraction_lab AS
WITH order_source AS (
  SELECT
    o.upsert_key,
    o.order_number,
    o.order_time_display,
    COALESCE(NULLIF(BTRIM(o.sniper_x_text_clean), ''), NULLIF(BTRIM(o.clean_text), ''), '') AS source_text,
    COALESCE(NULLIF(BTRIM(o.for_packer_bb_display), ''), NULLIF(BTRIM(o.single_cleaned_products), ''), '') AS stamped_product_text
  FROM public.bb_orders o
), candidate_lines AS (
  SELECT
    s.*,
    line_no::int AS source_line_no,
    BTRIM(line_text) AS candidate_text
  FROM order_source s
  CROSS JOIN LATERAL regexp_split_to_table(s.source_text, E'\\r?\\n') WITH ORDINALITY AS x(line_text, line_no)
  WHERE BTRIM(line_text) <> ''
    AND BTRIM(line_text) !~* '(รายการสินค้า|ขนส่ง|สถานะ|เลขออเดอร์|เวลาสั่งซื้อ|ยอดรวม|จัดส่ง|ขอบคุณ|พร้อมส่ง|COD)'
    AND BTRIM(line_text) ~* '(คอต|คอต\\.|🍉|🫐|🥭|🍇|🍊|🍍|🟥|🟧|🟨|🟩|🟦|🟪|🟫|🟣|🔴|🟢|🟡)'
), enriched AS (
  SELECT
    c.*,
    COALESCE((regexp_match(c.candidate_text, '(?i)([0-9]+(?:\\.[0-9]+)?)\\s*คอต'))[1]::numeric, 0) AS cot_quantity,
    pm.master_sku,
    pm.th_name,
    COALESCE(NULLIF(BTRIM(pm.master_display_for_packer), ''), NULLIF(BTRIM(pm.display_for_packer), '')) AS master_display,
    CASE WHEN pm.master_sku IS NULL THEN 'REVIEW_NOT_MATCHED' ELSE 'MATCHED' END AS line_mapping_status
  FROM candidate_lines c
  LEFT JOIN LATERAL (
    SELECT p.*
    FROM public.product_master p
    WHERE c.candidate_text ILIKE '%' || p.master_sku || '%'
       OR (NULLIF(BTRIM(p.alias), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.alias || '%')
       OR (NULLIF(BTRIM(p.th_name), '') IS NOT NULL AND c.candidate_text ILIKE '%' || p.th_name || '%')
    ORDER BY CASE WHEN c.candidate_text ILIKE '%' || p.master_sku || '%' THEN 0 ELSE 1 END,
             LENGTH(p.master_sku) DESC
    LIMIT 1
  ) pm ON TRUE
)
SELECT
  upsert_key,
  order_number,
  order_time_display,
  'BB_BOTTOM_PRODUCT_BLOCK'::text AS lab_extraction_mode,
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
  COUNT(candidate_text)::int AS lab_product_line_count,
  COALESCE(SUM(cot_quantity), 0) AS lab_total_cot,
  COUNT(*) FILTER (WHERE line_mapping_status = 'MATCHED')::int AS lab_matched_line_count,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ALIEN_NO_BB_PRODUCT_LINES'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'REVIEW_MASTER_MATCH'
    WHEN COUNT(*) FILTER (WHERE cot_quantity <= 0) > 0 THEN 'REVIEW_COT_MISSING'
    ELSE 'PASS'
  END AS lab_status,
  CASE
    WHEN COUNT(candidate_text) = 0 THEN 'ไม่พบบล็อกสินค้าหลังรายการสินค้า หรือไม่มีคอต/อีโมจิสินค้า'
    WHEN COUNT(*) FILTER (WHERE line_mapping_status <> 'MATCHED') > 0 THEN 'มีสินค้าอย่างน้อยหนึ่งบรรทัดยังชน Master ไม่ได้'
    ELSE 'จับบรรทัดสินค้าและจำนวนคอตได้ครบ'
  END AS lab_reason
FROM enriched
GROUP BY upsert_key, order_number, order_time_display, source_text, stamped_product_text;

COMMENT ON VIEW public.vw_bb_product_extraction_lab IS 'BB read-only product extraction lab; source remains bb_orders.';
