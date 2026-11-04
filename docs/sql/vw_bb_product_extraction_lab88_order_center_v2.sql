-- BB ONLY · LAB 88 ORDER CENTER
-- A single raw_text candidate may contain both real product lines and bot replies.
-- This view splits raw_text by newline first, then keeps only product-like lines.
-- Mapped Lines remains the untouched evidence source.

CREATE OR REPLACE VIEW public.vw_bb_product_extraction_lab88_order_center_v2 AS
WITH raw_lines AS (
  SELECT
    m.upsert_key,
    m.order_number,
    m.order_time_display,
    m.lab_source_text,
    m.lab_status,
    m.lab_reason,
    m.source_line_no,
    m.bb_pack,
    m.master_sku,
    m.master_th_name,
    m.cot_quantity AS candidate_quantity,
    m.line_mapping_status,
    BTRIM(piece.line_text) AS product_line_text,
    BTRIM(
      regexp_replace(
        regexp_replace(BTRIM(piece.line_text), '[[:space:]]*\(คอตละ[^)]*\)', '', 'gi'),
        '[[:space:]]*[xX×][[:space:]]*[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?[[:space:]]*$',
        '', 'gi'
      )
    ) AS display_line_text
  FROM public.vw_bb_product_extraction_lab88_v2_mapped_lines AS m
  CROSS JOIN LATERAL regexp_split_to_table(
    COALESCE(m.raw_text, ''), E'\\r?\\n+'
  ) AS piece(line_text)
), filtered_lines AS (
  SELECT
    r.*,
    COALESCE(
      NULLIF((regexp_match(r.product_line_text, '([0-9]+)[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)', 'i'))[1], '')::numeric,
      NULLIF((regexp_match(r.product_line_text, '[xX×][[:space:]]*([0-9]+)', 'i'))[1], '')::numeric,
      r.candidate_quantity,
      1::numeric
    ) AS quantity_line
  FROM raw_lines AS r
  WHERE COALESCE(r.product_line_text, '') <> ''
    AND NOT r.product_line_text ~* '(ได้รับข้อมูลครบถ้วน|จัดการแพ็ค|ถ่ายวิดีโอ|Button[[:space:]]*[0-9]+|แอดไลน์|ก้อนที่|เรียบร้อยเจ้าค่ะ|นายท่าน|ก่อนเปิดกล่อง|รบกวนอัดคลิป|หากพัสดุ|สรุปยอด|ทีมงานจะดูแล|ส่งหลังจากก้อนแรก)'
    AND NOT (
      COALESCE(NULLIF(BTRIM(r.master_sku), ''), '') = ''
      AND r.product_line_text ~* '^[[:space:]]*[0-9]+([/.-][0-9]+)?[[:space:]]+หมู่'
    )
    AND (
      COALESCE(NULLIF(BTRIM(r.master_sku), ''), '') <> ''
      OR r.product_line_text ~* '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)'
      OR r.product_line_text ~* '[xX×][[:space:]]*[0-9]+'
      OR r.product_line_text ~ '[🟩🟥🟨🟦🟢🔴🟣🟠🟪🟫]'
    )
), grouped AS (
  SELECT
    f.upsert_key,
    MAX(f.order_number) AS order_number,
    MAX(f.order_time_display) AS order_time_display,
    MAX(f.lab_source_text) AS lab_source_text,
    MAX(f.lab_status) AS lab_status,
    MAX(f.lab_reason) AS lab_reason,
    COUNT(*)::integer AS product_line_count,
    SUM(f.quantity_line)::numeric AS total_cot_quantity,
    COUNT(*) FILTER (WHERE UPPER(COALESCE(f.line_mapping_status, '')) = 'MATCHED')::integer AS matched_product_line_count,
    STRING_AGG(
      CASE WHEN NULLIF(BTRIM(f.master_sku), '') IS NOT NULL THEN COALESCE(NULLIF(BTRIM(f.bb_pack), ''), f.display_line_text) ELSE f.display_line_text END
      || ' x ' || f.quantity_line::text || ' คอต',
      E'\n' ORDER BY f.source_line_no NULLS LAST
    ) AS product_center,
    STRING_AGG(COALESCE(NULLIF(BTRIM(f.master_sku), ''), 'RAW_EVIDENCE') || ' x ' || f.quantity_line::text || ' คอต', E'\n' ORDER BY f.source_line_no NULLS LAST) AS sku_quantity_center,
    STRING_AGG(COALESCE(NULLIF(BTRIM(f.master_th_name), ''), f.display_line_text) || ' x ' || f.quantity_line::text || ' คอต', E'\n' ORDER BY f.source_line_no NULLS LAST) AS thai_name_quantity_center,
    STRING_AGG(f.quantity_line::text, E'\n' ORDER BY f.source_line_no NULLS LAST) AS quantity_center,
    STRING_AGG(f.product_line_text, E'\n' ORDER BY f.source_line_no NULLS LAST) AS raw_product_center,
    STRING_AGG(COALESCE(f.line_mapping_status, 'REVIEW_NOT_MATCHED'), E'\n' ORDER BY f.source_line_no NULLS LAST) AS mapping_status_center
  FROM filtered_lines AS f
  GROUP BY f.upsert_key
)
SELECT
  g.upsert_key,
  g.order_number,
  g.order_time_display,
  g.lab_source_text,
  g.lab_status,
  g.lab_reason,
  g.product_line_count,
  g.total_cot_quantity,
  g.matched_product_line_count,
  g.product_center AS bb_pack_center,
  g.sku_quantity_center,
  g.thai_name_quantity_center,
  g.quantity_center,
  g.raw_product_center,
  g.mapping_status_center,
  CASE
    WHEN g.product_line_count > 0 AND g.product_line_count = g.matched_product_line_count THEN 'PASS'
    WHEN g.product_line_count > 0 THEN 'REVIEW_MASTER_MATCH'
    ELSE 'REVIEW_NO_PRODUCT'
  END AS center_status
FROM grouped AS g;

COMMENT ON VIEW public.vw_bb_product_extraction_lab88_order_center_v2 IS
  'BB Lab 88 order center: splits mixed raw candidate text into lines before filtering bot narrative, preserving real product lines and quantities.';
