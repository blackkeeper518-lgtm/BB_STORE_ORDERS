-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
-- BB ONLY · dk_DARKSIDEMARKETING_TELAGRAM_bb
-- ห้องกลางสำหรับหน้า Orders / Telegram
-- ออเดอร์จาก bb_orders · สินค้าและหัวบิลจาก LAB View
-- ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘

CREATE OR REPLACE VIEW public.dk_DARKSIDEMARKETING_TELAGRAM_bb AS
SELECT
  -- KEY หลัก
  o.upsert_key,
  o.order_number,
  o.order_number_display,
  o.order_date,
  o.order_time_display,
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
  o.district,
  o.amphoe,
  o.province,
  o.zipcode,

  -- สถานะออเดอร์
  o.cod_amount,
  o.order_status,
  o.lock_status,
  o.shipping_carrier,
  o.telegram_sent,
  o.telegram_sent_at,

  -- สินค้าจาก LAB เท่านั้น
  lab.bb_pack_center,
  lab.stock_notice,
  lab.telegram_pretty,
  lab.center_status,
  lab.total_cot_quantity

FROM public.bb_orders AS o
LEFT JOIN public.vw_bb_product_extraction_lab88_order_center_v2 AS lab
  ON lab.upsert_key = o.upsert_key;

COMMENT ON VIEW public.dk_DARKSIDEMARKETING_TELAGRAM_bb IS
  'BB central room: order fields from bb_orders; product and bill fields from LAB order center.';
