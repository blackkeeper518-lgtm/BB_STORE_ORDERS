-- BB ONLY / FAST TELEGRAM ROOMS
-- Rule: product text exists in the order table = MAPPED.
-- Empty, box/image-only, or Alien-only data = REVIEW.
-- Queue shows all pending real rows; Today delivery shows only mapped rows from today.

begin;

drop view if exists public.vw_bb_telegram_delivery_today_fast;
drop view if exists public.vw_bb_telegram_delivery_yesterday_after_14_fast;
drop view if exists public.vw_bb_telegram_delivery_queue_fast;
drop view if exists public.vw_bb_telegram_delivery_source_fast;

create view public.vw_bb_telegram_delivery_source_fast as
with base as (
  select to_jsonb(o) as j
  from public.vw_bb_orders_all_v2 o
), prepared as (
  select
    j,
    coalesce(nullif(btrim(j->>'order_number'), ''), nullif(btrim(j->>'upsert_key'), ''), 'NO_ORDER_NUMBER') as order_number_final,
    coalesce(nullif(btrim(j->>'address_display_packer'), ''), nullif(btrim(j->>'addressclean'), ''), nullif(btrim(j->>'full_address'), ''), nullif(btrim(j->>'address_display_primary'), ''), nullif(btrim(j->>'final_address_for_bill'), ''), nullif(concat_ws(' ', j->>'short_address', j->>'district', j->>'amphoe', j->>'province', j->>'zipcode'), '')) as address_final,
    coalesce(nullif(btrim(j->>'final_display_for_packer'), ''), nullif(btrim(j->>'master_display_for_packer'), ''), nullif(btrim(j->>'raw_text'), ''), nullif(btrim(j->>'alias_norm'), ''), nullif(btrim(j->>'alias'), ''), nullif(btrim(j->>'single_cleaned_products'), ''), nullif(btrim(j->>'product_display_for_packer'), ''), nullif(btrim(j->>'product_copy_text'), ''), nullif(btrim(j->>'extracted_product_raw'), ''), nullif(btrim(j->>'display_for_packer'), ''), nullif(btrim(j->>'product_name'), ''), nullif(btrim(j->>'th_name'), ''), nullif(btrim(j->>'sku'), ''), nullif(btrim(j->>'master_sku'), '')) as product_text_final,
    coalesce(
      case when nullif(btrim(j->>'single_cleaned_products'), '') is not null
                 and j->>'single_cleaned_products' !~* '(เบอร์โทร|ที่อยู่|จุดสังเกตุ|จังหวัด|อำเภอ|ตำบล)'
           then btrim(j->>'single_cleaned_products') end,
      nullif(btrim(j->>'raw_text'), ''),
      nullif(btrim(j->>'final_display_for_packer'), ''),
      nullif(btrim(j->>'product_lines'), ''),
      nullif(btrim(j->>'telegram_final_mapped'), ''),
      nullif(btrim(j->>'master_display_for_packer'), '')
    ) as n8n_product_final,
    coalesce(nullif(btrim(j->>'master_qty_display'), ''), nullif(btrim(j->>'quantity'), ''), nullif(btrim(j->>'qty'), ''), nullif(btrim(j->>'extracted_qty'), '')) as quantity_final,
    coalesce(nullif(btrim(j->>'sku'), ''), nullif(btrim(j->>'master_sku'), ''), nullif(btrim(j->>'extracted_sku'), '')) as sku_final,
    coalesce(nullif(btrim(j->>'telegram_status'), ''), nullif(btrim(j->>'telegram_body_status'), ''), nullif(btrim(j->>'delivery_status'), ''), 'PENDING') as telegram_status_final
  from base
), mapped as (
  select
    p.*,
    case when p.product_text_final is null then false
         when p.product_text_final ~* '^(📦|รูปกล่อง|รูปภาพ|image|photo|attachment|sticker)([[:space:]]|$)' then false
         when p.product_text_final ~* '(เอเลี่ยน|alien|product_alien_terms|alien_raw)' then false
         else true end as is_mapped,
    case when p.product_text_final is null then 'REVIEW_EMPTY_PRODUCT'
         when p.product_text_final ~* '^(📦|รูปกล่อง|รูปภาพ|image|photo|attachment|sticker)([[:space:]]|$)' then 'REVIEW_IMAGE_ONLY'
         when p.product_text_final ~* '(เอเลี่ยน|alien|product_alien_terms|alien_raw)' then 'REVIEW_ALIEN'
         else 'MAPPED_FROM_ORDER_TABLE' end as mapping_status_fast
  from prepared p
)
select
  m.j->>'id' as id,
  m.j->>'upsert_key' as upsert_key,
  m.j as source_order_row,
  m.order_number_final as order_number,
  coalesce(nullif(btrim(m.j->>'order_number_display'), ''), m.order_number_final) as order_number_display,
  m.j->>'order_number_raw' as order_number_raw,
  m.j->>'order_time' as order_time,
  m.j->>'order_time_display' as order_time_display,
  m.j->>'order_time_source' as order_time_source,
  (coalesce(m.j->>'order_time', m.j->>'order_message_created_at', m.j->>'facebook_message_created_at', m.j->>'facebook_created_at', m.j->>'fb_created_at', m.j->>'order_close_time_from_chat', m.j->>'occurred_at', m.j->>'created_at'))::timestamptz as source_time,
  ((coalesce(m.j->>'order_time', m.j->>'order_message_created_at', m.j->>'facebook_message_created_at', m.j->>'facebook_created_at', m.j->>'fb_created_at', m.j->>'order_close_time_from_chat', m.j->>'occurred_at', m.j->>'created_at'))::timestamptz at time zone 'Asia/Bangkok')::date as source_date_bkk,
  m.j->>'order_time' as facebook_order_time,
  m.j->>'order_time_display' as facebook_order_time_display,
  m.j->>'order_time_source' as facebook_order_time_source,
  m.j->>'page_name' as page_name,
  m.j->>'facebook_name' as facebook_name,
  coalesce(nullif(btrim(m.j->>'customer_name'), ''), nullif(btrim(m.j->>'facebook_name'), '')) as customer_name,
  coalesce(nullif(btrim(m.j->>'extracted_phone'), ''), nullif(btrim(m.j->>'phone'), '')) as extracted_phone,
  coalesce(nullif(btrim(m.j->>'phone'), ''), nullif(btrim(m.j->>'extracted_phone'), '')) as phone,
  m.j->>'cod_amount' as cod_amount,
  m.j->>'expected_cod' as expected_cod,
  m.address_final as address_for_delivery,
  m.j->>'address_display_packer' as address_display_packer,
  m.j->>'addressclean' as addressclean,
  m.j->>'full_address' as full_address,
  m.j->>'short_address' as short_address,
  m.j->>'district' as district,
  m.j->>'amphoe' as amphoe,
  m.j->>'province' as province,
  m.j->>'zipcode' as zipcode,
  m.j->>'full_chunk_text' as full_chunk_text,
  m.j->>'raw_text_with_phone' as raw_text_with_phone,
  case when m.n8n_product_final is not null then m.n8n_product_final else '🕵️ สินค้าหายตัวเท่ๆ' end as n8n_product_display,
  case when m.n8n_product_final is not null then m.n8n_product_final else '🕵️ สินค้าหายตัวเท่ๆ' end as product_for_delivery,
  m.j->>'raw_text' as raw_product_text,
  m.j->>'alias_norm' as alias_norm,
  m.j->>'alias' as alias_raw,
  m.j->>'single_cleaned_products' as single_cleaned_products,
  m.j->>'product_lines' as product_lines,
  m.j->>'parsed_products' as parsed_products,
  m.j->>'final_display_for_packer' as final_display_for_packer,
  m.j->>'master_display_for_packer' as n8n_master_display_for_packer,
  m.j->>'telegram_final_mapped' as telegram_final_mapped,
  m.j->>'raw_product_evidence' as raw_product_evidence,
  m.j->>'product_evidence' as product_evidence,
  m.j->>'chat_timeline' as chat_timeline,
  m.j->>'normalized_chat_timeline' as normalized_chat_timeline,
  m.quantity_final as quantity_from_order_table,
  m.j->>'quantity' as quantity,
  m.j->>'qty' as qty,
  m.j->>'extracted_qty' as extracted_qty,
  m.j->>'master_qty_display' as master_qty_display,
  m.j->>'primary_quantity' as primary_quantity,
  m.j->>'unit' as unit,
  m.sku_final as sku,
  m.j->>'product_id' as product_id,
  m.j->>'product_name' as product_name,
  m.j->>'th_name' as th_name,
  m.j->>'emoji' as emoji,
  m.j->>'unit_price' as unit_price,
  m.j->>'line_total' as line_total,
  m.j->>'shipping_carrier' as shipping_carrier,
  m.j->>'order_status' as order_status,
  m.j->>'order_stamp' as order_stamp,
  m.j->>'assigned_hashtag' as assigned_hashtag,
  m.j->>'page_id' as page_id,
  m.j->>'thread_id' as thread_id,
  m.j->>'recipient_id' as recipient_id,
  pm.th_name as master_th_name,
  pm.stock_qty as master_stock_qty,
  pm.stock_status as master_stock_status,
  case
    when pm.master_sku is null then '🕵️ สินค้าหายตัวเท่ๆ'
    when coalesce(pm.stock_qty, 0) <= 0 or upper(coalesce(pm.stock_status, '')) like '%OUT%' or upper(coalesce(pm.stock_status, '')) like '%หมด%'
      then format('❌สินค้าหมดแล้วแม่❌ (%s)\n💬 “%s”', coalesce(pm.th_name, m.product_text_final, 'ไม่ระบุสินค้า'), (array[
        'ลูกค้าถามหา แต่น้องสินค้าแอบหลบหลังโกดังอยู่ครับ!',
        'สินค้าตัวนี้ฮอตเกินไป ขายหมดก่อนแอดจะตั้งตัวทัน!',
        'ตอนนี้น้องไปเติมสต๊อก กลับมาเมื่อไหร่จะแจ้งทันที!',
        'ของหมดแบบมีระดับ เหลือไว้แค่ความทรงจำกับยอดขาย!',
        'แอดไม่ได้ลืมสั่ง น้องแค่ขายดีเกินแผนไปนิดเดียว!',
        'สินค้าหายตัวชั่วคราว ลูกค้าจิ้มรอไว้ก่อนได้เลย!',
        'ของหมดแล้วจ้า แต่ความอยากได้ของลูกค้ายังไม่หมดนะ!',
        'น้องสินค้าปิดเทอมชั่วคราว รอเติมสต๊อกแล้วเจอกันใหม่!',
        'สินค้าขอพักร้อนแป๊บ เดี๋ยวกลับมาให้คิดถึง!',
        'ของหมดแล้วแม่ แต่ใจแอดยังเต็มร้อยอยู่เหมือนเดิม!'
      ])[1 + (abs(hashtext(coalesce(pm.master_sku, ''))) % 10)])
    else (array[
      '✅ พร้อมจัด — สายเย็นพร้อมลุย',
      '✅ พร้อมจัด — สายร้อนพร้อมส่ง',
      '✅ พร้อมจัด — สายผลไม้พร้อมแพ็ก',
      '✅ พร้อมจัด — ของอยู่ครบ หยิบได้เลย',
      '✅ พร้อมจัด — สต๊อกพร้อม งานพร้อม'
    ])[1 + (abs(hashtext(coalesce(pm.master_sku, ''))) % 5)] || format(' (%s)', coalesce(pm.th_name, m.product_text_final, 'ไม่ระบุสินค้า'))
  end as master_stock_notice,
  pm.out_of_stock_joke as master_out_of_stock_joke,
  case when coalesce(pm.stock_qty, 1) <= 0 or upper(coalesce(pm.stock_status, '')) in ('OUT_OF_STOCK', '❌ OUT_OF_STOCK') then 'OUT_OF_STOCK' else 'IN_STOCK' end as product_stock_state,
  m.is_mapped,
  m.mapping_status_fast,
  m.telegram_status_final as telegram_status,
  lower(coalesce(m.j->>'telegram_sent', 'false')) in ('true', 't', '1') or upper(m.telegram_status_final) in ('SENT', 'SENT_TO_TELEGRAM', 'DELIVERED') or m.telegram_status_final = 'ไปแล้วไปลับ' as is_sent,
  concat(coalesce(nullif(btrim(m.j->>'sticker_node'), ''), nullif(btrim(m.j->>'status_sticker'), ''), nullif(btrim(m.j->>'order_stamp'), ''), nullif(btrim(m.j->>'order_day_color_emoji'), ''), '🚀'), ' <b>[บิลสมบูรณ์ - ', coalesce(nullif(btrim(m.j->>'order_status'), ''), nullif(btrim(m.j->>'routing_tag'), ''), 'PENDING'), ']</b>') as dynamic_bill_header,
  concat(coalesce(nullif(btrim(m.j->>'sticker_node'), ''), nullif(btrim(m.j->>'status_sticker'), ''), nullif(btrim(m.j->>'order_stamp'), ''), nullif(btrim(m.j->>'order_day_color_emoji'), ''), '🚀'), ' <b>[บิลสมบูรณ์ - ', coalesce(nullif(btrim(m.j->>'order_status'), ''), nullif(btrim(m.j->>'routing_tag'), ''), 'PENDING'), ']</b>') as dressed_bill_header,
  format('%s\n━━━━━━━━━━━━━━━━━━━━\n⏰ <b>เวลาสั่งซื้อ:</b> %s\n🆔 <b>เลขออเดอร์:</b> <code>%s</code>\n📢 <b>ชื่อเพจ:</b> %s\n👤 <b>Facebook:</b> %s\n💰 <b>ยอด COD:</b> <code>%s</code> บาท\n━━━━━━━━━━━━━━━━━━━━\n<code>%s</code>\n<code>%s</code>\n<code>%s</code>\n📦 <b>รายการสินค้า:</b>\n%s\n━━━━━━━━━━━━━━━━━━━━', concat(coalesce(nullif(btrim(m.j->>'sticker_node'), ''), nullif(btrim(m.j->>'status_sticker'), ''), nullif(btrim(m.j->>'order_stamp'), ''), nullif(btrim(m.j->>'order_day_color_emoji'), ''), '🚀'), ' <b>[บิลสมบูรณ์ - ', coalesce(nullif(btrim(m.j->>'order_status'), ''), nullif(btrim(m.j->>'routing_tag'), ''), 'PENDING'), ']</b>'), coalesce(m.j->>'order_time_display', m.j->>'order_time', ''), coalesce(nullif(btrim(m.j->>'order_number_display'), ''), m.order_number_final), coalesce(m.j->>'page_name', ''), coalesce(m.j->>'facebook_name', m.j->>'customer_name', ''), coalesce(m.j->>'cod_amount', ''), coalesce(m.j->>'customer_name', ''), coalesce(m.j->>'extracted_phone', m.j->>'phone', ''), coalesce(m.address_final, 'ไม่ระบุที่อยู่'), coalesce(m.n8n_product_final, '🕵️ สินค้าหายตัวเท่ๆ')) as telegram_message_dynamic,
  m.j->>'telegram_message' as telegram_message,
  m.j->>'telegram_copy_text' as telegram_copy_text
from mapped m
left join public.product_master pm
  on lower(coalesce(pm.master_sku, '')) = lower(m.sku_final);

create view public.vw_bb_telegram_delivery_queue_fast as
select *, 'PENDING_REVIEW_OR_SEND'::text as queue_status
from public.vw_bb_telegram_delivery_source_fast
where not is_sent;

create view public.vw_bb_telegram_delivery_today_fast as
select *, 'TODAY_SEND_READY'::text as queue_status
from public.vw_bb_telegram_delivery_source_fast
where not is_sent
  and source_date_bkk = (now() at time zone 'Asia/Bangkok')::date;

create view public.vw_bb_telegram_delivery_yesterday_after_14_fast as
select *, 'FROM_YESTERDAY_14_TO_TODAY_14_SEND_READY'::text as queue_status
from public.vw_bb_telegram_delivery_source_fast
where not is_sent
  and source_time >= (((now() at time zone 'Asia/Bangkok')::date - 1) + time '14:00:00') at time zone 'Asia/Bangkok'
  and source_time < (((now() at time zone 'Asia/Bangkok')::date) + time '14:00:00') at time zone 'Asia/Bangkok';

commit;
