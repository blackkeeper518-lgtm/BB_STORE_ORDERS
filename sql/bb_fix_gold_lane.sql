-- BB ONLY · FIX GOLD PRODUCTS TO HOT LANE
-- Run after bb_stamp_telegram_header_by_product_lane.sql

UPDATE public.bb_orders
SET telegram_header_type = 'HOT',
    telegram_header = public.bb_header_for_product(
      coalesce(for_packer_bb_display, single_cleaned_products, product_name, sku, ''),
      upsert_key
    )
WHERE lower(coalesce(for_packer_bb_display, single_cleaned_products, product_name, sku, ''))
      ~ '(mond_gold|gold|yellow|ม่อนทอง|ทอง|เหลือง)';

SELECT upsert_key, order_number, for_packer_bb_display, telegram_header_type, telegram_header
FROM public.bb_orders
WHERE lower(coalesce(for_packer_bb_display, single_cleaned_products, product_name, sku, ''))
      ~ '(mond_gold|gold|yellow|ม่อนทอง|ทอง|เหลือง)'
ORDER BY order_time DESC NULLS LAST
LIMIT 30;
