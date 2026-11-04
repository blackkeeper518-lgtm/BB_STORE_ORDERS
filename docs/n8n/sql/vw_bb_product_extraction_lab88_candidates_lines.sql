-- BB ONLY · EXPLODE LAB 88 CANDIDATES
-- Read-through view: does not drop or modify vw_bb_product_extraction_lab88.
-- Uses the mapped result already stored in lab_product_candidates.

CREATE OR REPLACE VIEW public.vw_bb_product_extraction_lab88_candidates_lines AS
SELECT
  l.upsert_key,
  l.order_number,
  l.order_time_display,
  l.lab_extraction_mode,
  l.lab_source_text,
  l.stamped_product_text,
  l.lab_status,
  l.lab_reason,
  (candidate->>'source_line_no')::integer AS source_line_no,
  candidate->>'raw_text' AS raw_text,
  candidate->>'view_th_name_clean' AS view_th_name_clean,
  candidate->>'master_sku' AS master_sku,
  candidate->>'master_th_name' AS master_th_name,
  candidate->>'th_name' AS th_name,
  candidate->>'bb_pack' AS bb_pack,
  candidate->>'master_display' AS master_display,
  (candidate->>'cot_quantity')::numeric AS cot_quantity,
  candidate->>'line_mapping_status' AS line_mapping_status
FROM public.vw_bb_product_extraction_lab88 AS l
CROSS JOIN LATERAL jsonb_array_elements(
  COALESCE(l.lab_product_candidates, '[]'::jsonb)
) AS e(candidate);

COMMENT ON VIEW public.vw_bb_product_extraction_lab88_candidates_lines IS
  'BB-only read-through exploded lines from vw_bb_product_extraction_lab88.lab_product_candidates; preserves the Lab mapping and bb_pack result.';
