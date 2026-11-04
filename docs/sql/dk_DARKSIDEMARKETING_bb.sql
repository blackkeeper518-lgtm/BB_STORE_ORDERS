-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
-- BB ONLY · dk_DARKSIDEMARKETING_bb
-- ห้องกลางสำหรับหน้า Orders / เว็บกลาง
-- ออเดอร์และประวัติจาก bb_orders · สินค้าและหัวบิลจาก LAB View
-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

CREATE OR REPLACE VIEW public.dk_DARKSIDEMARKETING_bb AS
SELECT
  -- KEY และเวลา
  o.upsert_key,
  o.order_number,
  o.order_number_display,
  o.order_date,
  o.order_time,
  o.order_time_display,
  o.time_th,

  -- ช่องทางและลูกค้า
  o.page_name,
  o.facebook_name,
  o.customer_name,
  o.phone,
  o.extracted_phone,

  -- ที่อยู่ เอาเฉพาะชุดที่ใช้งานจริง
  o.address_display_packer,
  o.final_address_for_bill,
  o.short_address,
  o.full_address,
  o.address_line_1,
  o.address_line_2,
  o.addressclean,
  o.district,
  o.amphoe,
  o.province,
  o.zipcode,

  -- สถานะออเดอร์และยอด
  o.cod_amount,
  o.expected_cod,
  o.order_status,
  o.audit_flags,
  o.is_ready_to_pack,
  o.cod_check_status,
  o.lock_status,
  o.shipping_carrier,
  o.telegram_sent,
  o.telegram_sent_at,
  o.telegram_status,

  -- ประวัติแชทและหลักฐานจากโต๊ะหลัก
  o.normalized_chat_timeline,
  o.chat_timeline,
  o.raw_text_with_phone_timed,
  o.sniper_x_text_clean,

  -- สินค้าจาก LAB เท่านั้น
  lab.bb_pack_center,
  lab.stock_notice,
  lab.telegram_pretty,
  lab.center_status,
  lab.total_cot_quantity,
  lab.product_line_count,
  lab.quantity_center,
  lab.mapping_status_center

FROM public.bb_orders AS o
LEFT JOIN public.vw_bb_product_extraction_lab88_order_center_v2 AS lab
  ON lab.upsert_key = o.upsert_key;

COMMENT ON VIEW public.dk_DARKSIDEMARKETING_bb IS
  'BB central web room: order fields and chat evidence from bb_orders; product and bill fields from LAB order center.';
