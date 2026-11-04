-- BB ONLY · READ-ONLY TRUTH CHECK
-- Run after vw_bb_product_extraction_lab88_order_center_v2 exists.
-- This script never updates, deletes, or overwrites data.

-- ============================================================
-- CHECK 1: Lab summary vs exploded mapped lines vs order center
-- Expected: zero rows from the mismatch query below.
-- ============================================================
WITH lab AS (
  SELECT
    l.upsert_key,
    l.order_number,
    COALESCE(l.lab_product_line_count, 0)::integer AS lab_line_count,
    COALESCE(
      NULLIF(regexp_replace(COALESCE(l.lab_total_cot::text, ''), '[^0-9.\\-]', '', 'g'), '')::numeric,
      0::numeric
    ) AS lab_total_cot
  FROM public.vw_bb_product_extraction_lab88_v2 AS l
), mapped_raw AS (
  SELECT
    m.*,
    BTRIM(piece.line_text) AS product_line_text
  FROM public.vw_bb_product_extraction_lab88_v2_mapped_lines AS m
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(m.raw_text, ''), E'\\r?\\n+') AS piece(line_text)
), mapped AS (
  SELECT
    m.upsert_key,
    COUNT(*)::integer AS mapped_line_count,
    COALESCE(SUM(COALESCE(NULLIF((regexp_match(m.product_line_text, '([0-9]+)[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)', 'i'))[1], '')::numeric, NULLIF((regexp_match(m.product_line_text, '[xX×][[:space:]]*([0-9]+)', 'i'))[1], '')::numeric, m.cot_quantity, 1::numeric)), 0::numeric) AS mapped_total_cot,
    COUNT(*) FILTER (WHERE UPPER(COALESCE(m.line_mapping_status, '')) = 'MATCHED')::integer AS matched_line_count
  FROM mapped_raw AS m
  WHERE NOT (
    COALESCE(m.product_line_text, '') ~* '(ได้รับข้อมูลครบถ้วน|จัดการแพ็ค|ถ่ายวิดีโอ|Button[[:space:]]*[0-9]+|แอดไลน์|ก้อนที่|เรียบร้อยเจ้าค่ะ|นายท่าน|ก่อนเปิดกล่อง|รบกวนอัดคลิป|หากพัสดุ|สรุปยอด|ทีมงานจะดูแล|ส่งหลังจากก้อนแรก)'
  )
  AND NOT (
    COALESCE(NULLIF(BTRIM(m.master_sku), ''), '') = ''
    AND COALESCE(m.product_line_text, '') ~* '^[[:space:]]*[0-9]+([/.-][0-9]+)?[[:space:]]+หมู่'
  )
  AND COALESCE(m.product_line_text, '') <> ''
  AND (COALESCE(NULLIF(BTRIM(m.master_sku), ''), '') <> '' OR m.product_line_text ~* '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)' OR m.product_line_text ~* '[xX×][[:space:]]*[0-9]+' OR m.product_line_text ~ '[🟩🟥🟨🟦🟢🔴🟣🟠🟪🟫]')
  GROUP BY m.upsert_key
), center AS (
  SELECT
    c.upsert_key,
    c.product_line_count,
    c.total_cot_quantity,
    c.matched_product_line_count,
    c.center_status
  FROM public.vw_bb_product_extraction_lab88_order_center_v2 AS c
)
SELECT
  COALESCE(lab.upsert_key, mapped.upsert_key, center.upsert_key) AS upsert_key,
  COALESCE(lab.order_number, center.upsert_key) AS order_number,
  lab.lab_line_count,
  mapped.mapped_line_count,
  center.product_line_count AS center_line_count,
  lab.lab_total_cot,
  mapped.mapped_total_cot,
  center.total_cot_quantity AS center_total_cot,
  mapped.matched_line_count,
  center.matched_product_line_count,
  center.center_status,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN lab.upsert_key IS NULL THEN 'MISSING_IN_LAB' END,
    CASE WHEN mapped.upsert_key IS NULL THEN 'MISSING_EXPLODED_LINES' END,
    CASE WHEN center.upsert_key IS NULL THEN 'MISSING_ORDER_CENTER' END,
    CASE WHEN COALESCE(mapped.mapped_line_count, 0) <> COALESCE(center.product_line_count, 0) THEN 'LINE_COUNT_MISMATCH_LINES_VS_CENTER' END,
    CASE WHEN COALESCE(mapped.mapped_total_cot, 0) <> COALESCE(center.total_cot_quantity, 0) THEN 'QTY_MISMATCH_LINES_VS_CENTER' END
  ], NULL) AS truth_flags
FROM lab
FULL OUTER JOIN mapped USING (upsert_key)
FULL OUTER JOIN center USING (upsert_key)
WHERE lab.upsert_key IS NULL
   OR mapped.upsert_key IS NULL
   OR center.upsert_key IS NULL
   OR COALESCE(mapped.mapped_line_count, 0) <> COALESCE(center.product_line_count, 0)
   OR COALESCE(mapped.mapped_total_cot, 0) <> COALESCE(center.total_cot_quantity, 0)
ORDER BY order_number;

-- ============================================================
-- CHECK 2: duplicate source lines or suspicious zero quantities
-- Expected: no duplicate source_line_no per order and no zero quantity.
-- ============================================================
SELECT
  m.upsert_key,
  m.order_number,
  m.source_line_no,
  COUNT(*) AS duplicate_line_count,
  STRING_AGG(COALESCE(m.raw_text, ''), E'\n' ORDER BY m.source_line_no) AS raw_texts
FROM public.vw_bb_product_extraction_lab88_v2_mapped_lines AS m
GROUP BY m.upsert_key, m.order_number, m.source_line_no
HAVING COUNT(*) > 1
    OR BOOL_OR(COALESCE(m.cot_quantity, 0) <= 0)
ORDER BY m.order_number, m.source_line_no;

-- ============================================================
-- CHECK 3: every exploded line, including raw fallback evidence
-- Use this to inspect an order with 2 or 3 products.
-- ============================================================
SELECT
  m.upsert_key,
  m.order_number,
  m.source_line_no,
  m.raw_text,
  m.master_sku,
  m.master_th_name,
  m.bb_pack,
  m.cot_quantity,
  m.line_mapping_status
FROM public.vw_bb_product_extraction_lab88_v2_mapped_lines AS m
ORDER BY m.source_line_no NULLS LAST;

-- ============================================================
-- CHECK 4: final center row for the same order
-- ============================================================
SELECT
  c.upsert_key,
  c.order_number,
  c.product_line_count,
  c.total_cot_quantity,
  c.matched_product_line_count,
  c.bb_pack_center,
  c.quantity_center,
  c.raw_product_center,
  c.mapping_status_center,
  c.center_status
FROM public.vw_bb_product_extraction_lab88_order_center_v2 AS c
ORDER BY c.order_time_display DESC NULLS LAST;

-- If you want one order only, add this filter to Check 3 or Check 4:
-- WHERE upsert_key = 'BB_01_ORD-...'

-- ============================================================
-- CHECK 5: narrative/bot/address lines intentionally excluded
-- These remain in mapped_lines as raw evidence but do not enter bb_pack_center.
-- ============================================================
SELECT
  m.upsert_key,
  m.order_number,
  m.source_line_no,
  m.raw_text,
  CASE
    WHEN COALESCE(m.raw_text, '') ~* '(ได้รับข้อมูลครบถ้วน|จัดการแพ็ค|ถ่ายวิดีโอ|Button[[:space:]]*[0-9]+|แอดไลน์|ก้อนที่|เรียบร้อยเจ้าค่ะ|นายท่าน|ก่อนเปิดกล่อง|รบกวนอัดคลิป|หากพัสดุ|สรุปยอด|ทีมงานจะดูแล|ส่งหลังจากก้อนแรก)' THEN 'BOT_OR_NARRATIVE'
    WHEN COALESCE(NULLIF(BTRIM(m.master_sku), ''), '') = ''
     AND COALESCE(m.raw_text, '') ~* '^[[:space:]]*[0-9]+([/.-][0-9]+)?[[:space:]]+หมู่' THEN 'ADDRESS_LINE'
    ELSE 'NOT_EXCLUDED'
  END AS exclusion_reason
FROM public.vw_bb_product_extraction_lab88_v2_mapped_lines AS m
WHERE COALESCE(m.raw_text, '') ~* '(ได้รับข้อมูลครบถ้วน|จัดการแพ็ค|ถ่ายวิดีโอ|Button[[:space:]]*[0-9]+|แอดไลน์|ก้อนที่|เรียบร้อยเจ้าค่ะ|นายท่าน|ก่อนเปิดกล่อง|รบกวนอัดคลิป|หากพัสดุ|สรุปยอด|ทีมงานจะดูแล|ส่งหลังจากก้อนแรก)'
   OR (
     COALESCE(NULLIF(BTRIM(m.master_sku), ''), '') = ''
     AND COALESCE(m.raw_text, '') ~* '^[[:space:]]*[0-9]+([/.-][0-9]+)?[[:space:]]+หมู่'
   )
ORDER BY m.order_number, m.source_line_no;
