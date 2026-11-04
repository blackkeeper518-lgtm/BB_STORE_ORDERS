-- BB ONLY · LAB 88 CANDIDATES -> MAPPED LINES
-- Safe read-through view. Does not drop or modify vw_bb_product_extraction_lab88_v2.
-- One JSON candidate becomes one row. Raw candidate evidence is preserved.

CREATE OR REPLACE VIEW public.vw_bb_product_extraction_lab88_v2_mapped_lines AS
WITH candidates AS (
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
    candidate->>'master_sku' AS lab_master_sku,
    candidate->>'th_name' AS lab_th_name,
    candidate->>'master_display' AS lab_master_display,
    (candidate->>'cot_quantity')::numeric AS cot_quantity,
    candidate->>'line_mapping_status' AS lab_line_mapping_status
  FROM public.vw_bb_product_extraction_lab88_v2 AS l
  CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE(l.lab_product_candidates, '[]'::jsonb)
  ) AS e(candidate)
), cleaned AS (
  SELECT
    c.*,
    BTRIM(
      regexp_replace(
        regexp_replace(
          regexp_replace(COALESCE(c.raw_text, ''),
            '[0-9]+[[:space:]]*(คอต|ห่อ|ชิ้น|กล่อง|ลัง)?', '', 'gi'
          ),
          '[[:space:]]+', '', 'g'
        ),
        '[^[:alnum:]ก-๙]+', '', 'g'
      )
    ) AS view_th_name_clean
  FROM candidates AS c
), known_names AS (
  SELECT
    p.master_sku,
    p.th_name AS master_th_name,
    COALESCE(
      NULLIF(BTRIM(p.master_display_for_packer), ''),
      NULLIF(BTRIM(p.display_for_packer), ''),
      p.th_name
    ) AS bb_pack,
    p.th_name AS match_name,
    0 AS match_priority
  FROM public.product_master AS p
  WHERE COALESCE(BTRIM(p.th_name), '') <> ''

  UNION ALL

  SELECT
    p.master_sku,
    p.th_name AS master_th_name,
    COALESCE(
      NULLIF(BTRIM(p.master_display_for_packer), ''),
      NULLIF(BTRIM(p.display_for_packer), ''),
      p.th_name
    ) AS bb_pack,
    BTRIM(a.alias_part) AS match_name,
    1 AS match_priority
  FROM public.product_master AS p
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(p.alias, ''), ',') AS a(alias_part)
  WHERE BTRIM(a.alias_part) <> ''

  UNION ALL

  SELECT
    d.sku AS master_sku,
    COALESCE(d.th_name, p.th_name) AS master_th_name,
    COALESCE(
      NULLIF(BTRIM(d.display_for_packer), ''),
      NULLIF(BTRIM(p.master_display_for_packer), ''),
      NULLIF(BTRIM(p.display_for_packer), ''),
      COALESCE(d.th_name, p.th_name)
    ) AS bb_pack,
    BTRIM(a.alias_part) AS match_name,
    2 AS match_priority
  FROM public.product_alias_dictionary AS d
  LEFT JOIN public.product_master AS p ON p.master_sku = d.sku
  CROSS JOIN LATERAL regexp_split_to_table(COALESCE(d.alias, ''), ',') AS a(alias_part)
  WHERE BTRIM(a.alias_part) <> ''
), resolved AS (
  SELECT
    c.*,
    m.master_sku AS clean_master_sku,
    m.master_th_name,
    m.bb_pack,
    CASE
      WHEN m.master_sku IS NOT NULL THEN 'MATCHED'
      WHEN COALESCE(BTRIM(c.lab_master_sku), '') <> '' THEN 'MATCHED'
      ELSE 'REVIEW_NOT_MATCHED'
    END AS final_mapping_status
  FROM cleaned AS c
  LEFT JOIN LATERAL (
    SELECT n.*
    FROM known_names AS n
    WHERE replace(lower(regexp_replace(COALESCE(n.match_name, ''), '[^[:alnum:]ก-๙]+', '', 'g')), 'os', 'โอเอส')
        = replace(lower(c.view_th_name_clean), 'os', 'โอเอส')
    ORDER BY n.match_priority, LENGTH(n.match_name) DESC, n.master_sku
    LIMIT 1
  ) AS m ON TRUE
)
SELECT
  upsert_key,
  order_number,
  order_time_display,
  lab_source_text,
  stamped_product_text,
  lab_status,
  lab_reason,
  source_line_no,
  raw_text,
  view_th_name_clean,
  COALESCE(clean_master_sku, lab_master_sku) AS master_sku,
  COALESCE(master_th_name, lab_th_name) AS master_th_name,
  COALESCE(bb_pack, lab_master_display, raw_text) AS bb_pack,
  cot_quantity,
  final_mapping_status AS line_mapping_status,
  lab_master_sku,
  lab_th_name,
  lab_master_display,
  lab_line_mapping_status
FROM resolved;

COMMENT ON VIEW public.vw_bb_product_extraction_lab88_v2_mapped_lines IS
  'BB-only read-through mapping view: explodes vw_bb_product_extraction_lab88_v2.lab_product_candidates and resolves clean Thai names to product_master SKU and bb_pack.';
