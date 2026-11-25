-- BB STORE · FULL RECOVERY BUNDLE
-- ================================================================
-- รวม schema ตาราง + functions + indexes/migrations + views + permissions
-- สำหรับกู้โครงสร้าง Supabase ของ ST ในการรันครั้งเดียว
--
-- วิธีใช้:
--   1) ตรวจว่าเป็น Supabase project ของ ST
--   2) รันไฟล์นี้ใน SQL Editor ด้วย database owner/admin
--   3) หลัง schema พร้อม ให้ n8n เริ่มส่งข้อมูลเข้าโต๊ะตาม body ปัจจุบัน
--
-- หมายเหตุ:
--   - ไฟล์นี้ไม่รวม *_rows.sql เพื่อไม่ทับข้อมูลจริง/ไม่โหลด seed ก้อนใหญ่
--   - ไม่รวม ANDROMEDA เป็น active reader
--   - ไม่ลบข้อมูลเดิม และไม่แก้ order/parser/n8n logic
--   - หากรันบนฐานที่มี objects อยู่แล้ว ให้ใช้ฐานว่างหรือรันส่วนที่ยังขาด
-- ================================================================

-- ================================================================
-- SOURCE: SQL/🌍1.สายออเดอร์หลัก (Main Order Pipeline)/🗝️HERMES_ARCHIVE_โต๊ะหลัก.sql
-- ================================================================
create table if not exists public."🗝️HERMES_ARCHIVE" (
  upsert_key text not null,
  bb_express_send_route text null,
  currentthreadtotalbills text null,
  duplicate_count_th text null,
  balloonnotice text null,
  sniperauthorclass text null,
  facebook_name text null,
  "threadId" text null,
  time_th text null,
  customer_id text null,
  tracking_request_same_thai_date text null,
  tracking_request_route_hint text null,
  order_date text null,
  order_time text null,
  order_time_display text null,
  day_of_week text null,
  order_time_source text null,
  page_id text null,
  page_name text null,
  order_number text null,
  cod_amount text null,
  customer_name text null,
  phone text null,
  extracted_phone text null,
  phone_type text null,
  phone_status text null,
  phone_candidates text null,
  rejected_phone_candidates text null,
  address_display_packer text null,
  addressclean text null,
  "finalAddress" text null,
  short_address text null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  order_source_type text null,
  audit_flags text null,
  chat_timeline text null,
  cod_check_status text null,
  shipping_carrier text null,
  assigned_agent text null,
  assigned_hashtag text null,
  original text null,
  "orderItems" text null,
  for_packer_st_display text null,
  sku text null,
  google_for_packer text null,
  manus_for_packer text null,
  final_order_qty text null,
  extracted_text_qty text null,
  qty_display_th text null,
  "darksideBillDataComplete" text null,
  bill_data_complete text null,
  darkside_completeness_status text null,
  darkside_missing_reasons text null,
  bill_data_reason text null,
  bill_signal_source text null,
  bill_quantity_is_blocker text null,
  route_reason_emoji text null,
  route_reason_color text null,
  route_reason_label text null,
  packer_obj text null,
  extracted_text_price text null,
  is_salty_gold text null,
  fibo_score text null,
  fibo_tier text null,
  fibo_badge text null,
  mathematically_price text null,
  final_order_price text null,
  is_vip text null,
  vip_tag text null,
  order_time_ms_reference text null,
  order_time_bkk_iso text null,
  order_time_thai_date text null,
  order_time_thai_clock text null,
  order_time_thai_label text null,
  order_time_contract_locked text null,
  tracking_request_48h text null,
  tracking_request_48h_event text null,
  node2_tracking_request_detected text null,
  node2_tracking_request_48h text null,
  node2_tracking_request_event text null,
  node2_tracking_request_route_hint text null,
  order_hour text null,
  routing_tag text null,
  status_color text null,
  status_color_backup text null,
  routing_tag_backup text null,
  target_room text null,
  is_safety_white text null,
  order_emoji text null,
  life_status text null,
  ghost_column text null,
  order_number_display text null,
  time_slot text null,
  dispatch_target_date text null,
  time_slot_label text null,
  slot_two_layer_key text null,
  packer_tag_display text null,
  cluster_bill_count text null,
  cluster_position text null,
  is_latest_canonical text null,
  canonical_status text null,
  change_status text null,
  changed_fields text null,
  change_note_th text null,
  cluster_has_change text null,
  pair_route text null,
  pair_position text null,
  pair_group_size text null,
  pair_is_paired text null,
  node2_group_is_latest text null,
  node2_group_has_change text null,
  node2_bill_color_decision text null,
  ghost_reflected_to_bb text null,
  ghost_reflection_source text null,
  node2_ghost_old_order text null,
  node2_route_signal text null,
  node2_route_signal_only_for_ghost_red text null,
  full_address text null,
  final_address_for_bill text null,
  address_raw_source_line text null,
  address_selected_system text null,
  address_selected_field text null,
  address_customer_sender text null,
  address_fallback_used text null,
  address_fallback_level text null,
  address_selection_reason text null,
  address_validation_status text null,
  address_validation_complete text null,
  address_usable text null,
  address_capture_status text null,
  address_validation_issues text null,
  address_type text null,
  address_system_1_result text null,
  address_system_2_result text null,
  address_system_3_result text null,
  address_system_4_result text null,
  address_candidates_all text null,
  address_raw_retention text null,
  address_fibo_score text null,
  address_fibo_tier text null,
  address_fibo_badge text null,
  address_fibo_reason text null,
  address_fibo_usable text null,
  address_fibo_complete text null,
  address_fibo_landmark text null,
  address_fibo_issues text null,
  address_fibo_type text null,
  address_fibo_selected_clean text null,
  address_fibo_selected_source text null,
  address_fibo_cleaner text null,
  is_silent_whale text null,
  order_fibo_effective_price text null,
  order_fibo_product text null,
  order_fibo_engine_version text null,
  address_fibo_engine_version text null,
  address_cascade_engine_version text null,
  master_fibo_engine_version text null,
  order_fibo_untouched_by_address text null,
  address_fibo_untouched_by_order text null,
  order_captured text null,
  order_capture_status text null,
  product_quantity_calculation_disabled text null,
  product_items_v5 text null,
  product_items_matched text null,
  product_items_unmatched text null,
  product_map_items text null,
  product_map_result text null,
  product_map_display text null,
  product_map_mapped_display text null,
  product_map_raw text null,
  product_map_primary text null,
  product_map_sku text null,
  product_map_source_line text null,
  product_map_count text null,
  product_map_mapped_count text null,
  product_map_unmapped_count text null,
  product_map_sku_list text null,
  product_map_master_sku_list text null,
  product_map_status text null,
  product_mapping_is_blocker text null,
  mapping_status text null,
  mapping_engine_version text null,
  master_sku text null,
  display_for_packer text null,
  final_display_for_packer text null,
  final_product text null,
  trusted_product text null,
  product_display_candidates text null,
  product_unmatched_raw text null,
  address_candidates text null,
  expected_cod text null,
  telegram_product_display text null,
  telegram_message text null,
  telegram_copy_text text null,
  bill_header_insert_status text null,
  pre_save_change_status text null,
  pre_save_change_reason text null,
  pre_save_change_group_key text null,
  pre_save_change_group_size text null,
  pre_save_change_pair_candidate_count text null,
  pre_save_change_is_pair text null,
  pre_save_change_selected text null,
  pre_save_change_winner_key text null,
  pre_save_change_score text null,
  pre_save_change_fields text null,
  pre_save_change_route_hint text null,
  pre_save_change_selection_source text null,
  pre_save_change_review_required text null,
  customer_change_audit_version text null,
  customer_change_audit_group_key text null,
  customer_change_audit_group_source text null,
  customer_change_audit_group_size text null,
  customer_change_audit_candidate_count text null,
  customer_change_audit_is_current text null,
  customer_change_audit_is_previous text null,
  customer_change_detected text null,
  customer_change_count text null,
  customer_change_fields text null,
  customer_change_type text null,
  customer_change_previous_upsert_key text null,
  customer_change_current_upsert_key text null,
  customer_change_previous_time text null,
  customer_change_current_time text null,
  customer_change_diff_json text null,
  customer_change_admin_footer text null,
  customer_change_admin_footer_text text null,
  customer_change_source_trace text null,
  history_bucket text null,
  history_route_required text null,
  is_current_candidate text null,
  superseded_by_upsert_key text null,
  customer_change_route_hint text null,
  customer_change_footer_route_decision text null,
  customer_change_footer_order_time_source text null,
  sniper_bill_type text null,
  sniper_badge text null,
  sniper_change_color text null,
  sniper_change_reason text null,
  sniper_is_new_bill text null,
  sniper_is_old_bill text null,
  sniper_change_detected text null,
  sniper_change_field_count text null,
  sniper_change_fields text null,
  routing_tag_before_change text null,
  status_color_before_change text null,
  routing_tag_backup_before_change text null,
  status_color_backup_before_change text null,
  history_route_status text null,
  history_route_key text null,
  switch3_route text null,
  four2_route_reason text null,
  four2_route_reason_label text null,
  four2_order_time_source text null,
  four2_selected_by text null,
  four2_change_fields text null,
  four2_change_count text null,
  four2_selected_for_send text null,
  four2_winner_key text null,
  send_eligible text null,
  telegram_bill_send_eligible text null,
  telegram_send_blocked text null,
  telegram_block_reason text null,
  is_ready_to_pack text null,
  should_send_to_packing text null,
  telegram_main_bill text null,
  telegram_message_for_send_final text null,
  telegram_message_with_change_audit text null,
  telegram_change_alert text null,
  telegram_body text null,
  pre_save_change_previous text null,
  pre_save_change_previous_key text null,
  pre_save_change_selected_order_time_display text null,
  pre_save_change_previous_order_time_display text null,
  customer_change_from_order_time_display text null,
  customer_change_to_order_time_display text null,
  audit_selected_order_time_display text null,
  audit_previous_order_time_display text null,
  audit_order_time_source text null,
  customer_change_summary text null,
  customer_product_change_detected text null,
  customer_product_change_label text null,
  customer_product_previous text null,
  customer_product_current text null,
  customer_color_change_detected text null,
  customer_color_previous text null,
  customer_color_current text null,
  customer_quantity_change_detected text null,
  customer_quantity_previous text null,
  customer_quantity_current text null,
  customer_carrier_change_detected text null,
  customer_carrier_previous text null,
  customer_carrier_current text null,
  customer_address_change_detected text null,
  customer_address_change_label text null,
  customer_address_previous text null,
  customer_address_current text null,
  customer_phone_change_detected text null,
  customer_phone_change_label text null,
  customer_phone_previous text null,
  customer_phone_current text null,
  customer_name_change_detected text null,
  customer_name_change_label text null,
  customer_name_previous text null,
  customer_name_current text null,
  customer_cod_change_detected text null,
  customer_cod_previous text null,
  customer_cod_current text null,
  customer_cod_change_amount text null,
  routing_tag_new_bill text null,
  status_color_new_bill text null,
  routing_tag_backup_new_bill text null,
  status_color_backup_new_bill text null,
  telegram_message_for_send_original text null,
  telegram_copy_text_with_change_audit text null,
  routing_tag_old_bill text null,
  status_color_old_bill text null,
  routing_tag_backup_old_bill text null,
  status_color_backup_old_bill text null,
  switch3_route_status text null,
  telegram_sent text null,
  telegram_status text null,
  delivery_state text null,
  delivery_status text null,
  sent_at text null,
  telegram_sent_at text null,
  product_mapping_status text null,
  product_mapping_pass text null,
  product_mapping_reason text null,
  telegram_bill_header text null,
  telegram_bill_body text null,
  message_id text null,
  facebook_tracking_message_id text null,
  tracking_number text null,
  facebook_tracking_message text null,
  chronos_state text null,
  facebook_tracking_sent_at text null,
  facebook_tracking_status text null,
  recipient_psid text null,
  recipient_name text null,
  "currentThreadTotalBills" text null,
  raw_text text null,
  should_should_to_packing text null,
  chat_age_hours numeric(5, 1) null,
  is_within_24h boolean null,
  can_send_standard boolean null,
  messaging_tag_required character varying(50) null,
  tracking_check text null,
  pickup_date text null,
  consignee text null,
  phone_number text null,
  address text null,
  order_phone text null,
  recipient_id text null,
  portal_key text null,
  page_message_time_th text null,
  customer_message_time_th text null,
  customer_latest_message text null,
  page_latest_message text null,
  latest_message text null,
  customer_time_val bigint null default 0,
  page_time_val bigint null default 0,
  send_facebook_route text null,
  "balloonNotice" text null,
  "sniperAuthorClass" text null,
  source_table text null,
  stock_notice text null,
  branch_route text null,
  is_backlog text null,
  telegram_message_web text null,
  telegram_change_alert_web text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  chat_link_key text null,
  source_lane text null,
  constraint "🗝️HERMES_ARCHIVE_pkey" primary key (upsert_key)
) TABLESPACE pg_default;

create index IF not exists hermes_order_time_display_idx on public."🗝️HERMES_ARCHIVE" using btree (order_time_display) TABLESPACE pg_default;

create index IF not exists hermes_telegram_status_idx on public."🗝️HERMES_ARCHIVE" using btree (telegram_status, delivery_status, delivery_state) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/🌍1.สายออเดอร์หลัก (Main Order Pipeline)/🌀SINGULARITY_xXx_EXCHANGE.sql
create table if not exists public."🌀SINGULARITY_xXx_EXCHANGE" (
  upsert_key text not null,
  bb_express_send_route text null,
  currentthreadtotalbills text null,
  duplicate_count_th text null,
  balloonnotice text null,
  sniperauthorclass text null,
  facebook_name text null,
  "threadId" text null,
  time_th text null,
  customer_id text null,
  tracking_request_same_thai_date text null,
  tracking_request_route_hint text null,
  order_date text null,
  order_time text null,
  order_time_display text null,
  day_of_week text null,
  order_time_source text null,
  page_id text null,
  page_name text null,
  order_number text null,
  cod_amount text null,
  customer_name text null,
  phone text null,
  extracted_phone text null,
  phone_type text null,
  phone_status text null,
  phone_candidates text null,
  rejected_phone_candidates text null,
  address_display_packer text null,
  addressclean text null,
  "finalAddress" text null,
  short_address text null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  order_source_type text null,
  audit_flags text null,
  chat_timeline text null,
  cod_check_status text null,
  shipping_carrier text null,
  assigned_agent text null,
  assigned_hashtag text null,
  original text null,
  "orderItems" text null,
  for_packer_st_display text null,
  sku text null,
  google_for_packer text null,
  manus_for_packer text null,
  final_order_qty text null,
  extracted_text_qty text null,
  qty_display_th text null,
  "darksideBillDataComplete" text null,
  bill_data_complete text null,
  darkside_completeness_status text null,
  darkside_missing_reasons text null,
  bill_data_reason text null,
  bill_signal_source text null,
  bill_quantity_is_blocker text null,
  route_reason_emoji text null,
  route_reason_color text null,
  route_reason_label text null,
  packer_obj text null,
  extracted_text_price text null,
  is_salty_gold text null,
  fibo_score text null,
  fibo_tier text null,
  fibo_badge text null,
  mathematically_price text null,
  final_order_price text null,
  is_vip text null,
  vip_tag text null,
  order_time_ms_reference text null,
  order_time_bkk_iso text null,
  order_time_thai_date text null,
  order_time_thai_clock text null,
  order_time_thai_label text null,
  order_time_contract_locked text null,
  tracking_request_48h text null,
  tracking_request_48h_event text null,
  node2_tracking_request_detected text null,
  node2_tracking_request_48h text null,
  node2_tracking_request_event text null,
  node2_tracking_request_route_hint text null,
  order_hour text null,
  routing_tag text null,
  status_color text null,
  status_color_backup text null,
  routing_tag_backup text null,
  target_room text null,
  is_safety_white text null,
  order_emoji text null,
  life_status text null,
  ghost_column text null,
  order_number_display text null,
  time_slot text null,
  dispatch_target_date text null,
  time_slot_label text null,
  slot_two_layer_key text null,
  packer_tag_display text null,
  cluster_bill_count text null,
  cluster_position text null,
  is_latest_canonical text null,
  canonical_status text null,
  change_status text null,
  changed_fields text null,
  change_note_th text null,
  cluster_has_change text null,
  pair_route text null,
  pair_position text null,
  pair_group_size text null,
  pair_is_paired text null,
  node2_group_is_latest text null,
  node2_group_has_change text null,
  node2_bill_color_decision text null,
  ghost_reflected_to_bb text null,
  ghost_reflection_source text null,
  node2_ghost_old_order text null,
  node2_route_signal text null,
  node2_route_signal_only_for_ghost_red text null,
  full_address text null,
  final_address_for_bill text null,
  address_raw_source_line text null,
  address_selected_system text null,
  address_selected_field text null,
  address_customer_sender text null,
  address_fallback_used text null,
  address_fallback_level text null,
  address_selection_reason text null,
  address_validation_status text null,
  address_validation_complete text null,
  address_usable text null,
  address_capture_status text null,
  address_validation_issues text null,
  address_type text null,
  address_system_1_result text null,
  address_system_2_result text null,
  address_system_3_result text null,
  address_system_4_result text null,
  address_candidates_all text null,
  address_raw_retention text null,
  address_fibo_score text null,
  address_fibo_tier text null,
  address_fibo_badge text null,
  address_fibo_reason text null,
  address_fibo_usable text null,
  address_fibo_complete text null,
  address_fibo_landmark text null,
  address_fibo_issues text null,
  address_fibo_type text null,
  address_fibo_selected_clean text null,
  address_fibo_selected_source text null,
  address_fibo_cleaner text null,
  is_silent_whale text null,
  order_fibo_effective_price text null,
  order_fibo_product text null,
  order_fibo_engine_version text null,
  address_fibo_engine_version text null,
  address_cascade_engine_version text null,
  master_fibo_engine_version text null,
  order_fibo_untouched_by_address text null,
  address_fibo_untouched_by_order text null,
  order_captured text null,
  order_capture_status text null,
  product_quantity_calculation_disabled text null,
  product_items_v5 text null,
  product_items_matched text null,
  product_items_unmatched text null,
  product_map_items text null,
  product_map_result text null,
  product_map_display text null,
  product_map_mapped_display text null,
  product_map_raw text null,
  product_map_primary text null,
  product_map_sku text null,
  product_map_source_line text null,
  product_map_count text null,
  product_map_mapped_count text null,
  product_map_unmapped_count text null,
  product_map_sku_list text null,
  product_map_master_sku_list text null,
  product_map_status text null,
  product_mapping_is_blocker text null,
  mapping_status text null,
  mapping_engine_version text null,
  master_sku text null,
  display_for_packer text null,
  final_display_for_packer text null,
  final_product text null,
  trusted_product text null,
  product_display_candidates text null,
  product_unmatched_raw text null,
  address_candidates text null,
  expected_cod text null,
  telegram_product_display text null,
  telegram_message text null,
  telegram_copy_text text null,
  bill_header_insert_status text null,
  pre_save_change_status text null,
  pre_save_change_reason text null,
  pre_save_change_group_key text null,
  pre_save_change_group_size text null,
  pre_save_change_pair_candidate_count text null,
  pre_save_change_is_pair text null,
  pre_save_change_selected text null,
  pre_save_change_winner_key text null,
  pre_save_change_score text null,
  pre_save_change_fields text null,
  pre_save_change_route_hint text null,
  pre_save_change_selection_source text null,
  pre_save_change_review_required text null,
  customer_change_audit_version text null,
  customer_change_audit_group_key text null,
  customer_change_audit_group_source text null,
  customer_change_audit_group_size text null,
  customer_change_audit_candidate_count text null,
  customer_change_audit_is_current text null,
  customer_change_audit_is_previous text null,
  customer_change_detected text null,
  customer_change_count text null,
  customer_change_fields text null,
  customer_change_type text null,
  customer_change_previous_upsert_key text null,
  customer_change_current_upsert_key text null,
  customer_change_previous_time text null,
  customer_change_current_time text null,
  customer_change_diff_json text null,
  customer_change_admin_footer text null,
  customer_change_admin_footer_text text null,
  customer_change_source_trace text null,
  history_bucket text null,
  history_route_required text null,
  is_current_candidate text null,
  superseded_by_upsert_key text null,
  customer_change_route_hint text null,
  customer_change_footer_route_decision text null,
  customer_change_footer_order_time_source text null,
  sniper_bill_type text null,
  sniper_badge text null,
  sniper_change_color text null,
  sniper_change_reason text null,
  sniper_is_new_bill text null,
  sniper_is_old_bill text null,
  sniper_change_detected text null,
  sniper_change_field_count text null,
  sniper_change_fields text null,
  routing_tag_before_change text null,
  status_color_before_change text null,
  routing_tag_backup_before_change text null,
  status_color_backup_before_change text null,
  history_route_status text null,
  history_route_key text null,
  switch3_route text null,
  four2_route_reason text null,
  four2_route_reason_label text null,
  four2_order_time_source text null,
  four2_selected_by text null,
  four2_change_fields text null,
  four2_change_count text null,
  four2_selected_for_send text null,
  four2_winner_key text null,
  send_eligible text null,
  telegram_bill_send_eligible text null,
  telegram_send_blocked text null,
  telegram_block_reason text null,
  is_ready_to_pack text null,
  should_send_to_packing text null,
  telegram_main_bill text null,
  telegram_message_for_send_final text null,
  telegram_message_with_change_audit text null,
  telegram_change_alert text null,
  telegram_body text null,
  pre_save_change_previous text null,
  pre_save_change_previous_key text null,
  pre_save_change_selected_order_time_display text null,
  pre_save_change_previous_order_time_display text null,
  customer_change_from_order_time_display text null,
  customer_change_to_order_time_display text null,
  audit_selected_order_time_display text null,
  audit_previous_order_time_display text null,
  audit_order_time_source text null,
  customer_change_summary text null,
  customer_product_change_detected text null,
  customer_product_change_label text null,
  customer_product_previous text null,
  customer_product_current text null,
  customer_color_change_detected text null,
  customer_color_previous text null,
  customer_color_current text null,
  customer_quantity_change_detected text null,
  customer_quantity_previous text null,
  customer_quantity_current text null,
  customer_carrier_change_detected text null,
  customer_carrier_previous text null,
  customer_carrier_current text null,
  customer_address_change_detected text null,
  customer_address_change_label text null,
  customer_address_previous text null,
  customer_address_current text null,
  customer_phone_change_detected text null,
  customer_phone_change_label text null,
  customer_phone_previous text null,
  customer_phone_current text null,
  customer_name_change_detected text null,
  customer_name_change_label text null,
  customer_name_previous text null,
  customer_name_current text null,
  customer_cod_change_detected text null,
  customer_cod_previous text null,
  customer_cod_current text null,
  customer_cod_change_amount text null,
  routing_tag_new_bill text null,
  status_color_new_bill text null,
  routing_tag_backup_new_bill text null,
  status_color_backup_new_bill text null,
  telegram_message_for_send_original text null,
  telegram_copy_text_with_change_audit text null,
  routing_tag_old_bill text null,
  status_color_old_bill text null,
  routing_tag_backup_old_bill text null,
  status_color_backup_old_bill text null,
  switch3_route_status text null,
  telegram_sent text null,
  telegram_status text null,
  delivery_state text null,
  delivery_status text null,
  sent_at text null,
  telegram_sent_at text null,
  product_mapping_status text null,
  product_mapping_pass text null,
  product_mapping_reason text null,
  telegram_bill_header text null,
  telegram_bill_body text null,
  message_id text null,
  facebook_tracking_message_id text null,
  tracking_number text null,
  facebook_tracking_message text null,
  chronos_state text null,
  facebook_tracking_sent_at text null,
  facebook_tracking_status text null,
  recipient_psid text null,
  recipient_name text null,
  "currentThreadTotalBills" text null,
  raw_text text null,
  should_should_to_packing text null,
  chat_age_hours numeric(5, 1) null,
  is_within_24h boolean null,
  can_send_standard boolean null,
  messaging_tag_required character varying(50) null,
  tracking_check text null,
  pickup_date text null,
  consignee text null,
  phone_number text null,
  address text null,
  order_phone text null,
  recipient_id text null,
  portal_key text null,
  page_message_time_th text null,
  customer_message_time_th text null,
  customer_latest_message text null,
  page_latest_message text null,
  latest_message text null,
  customer_time_val bigint null default 0,
  page_time_val bigint null default 0,
  send_facebook_route text null,
  "balloonNotice" text null,
  "sniperAuthorClass" text null,
  source_table text null,
  stock_notice text null,
  branch_route text null,
  is_backlog text null,
  telegram_message_web text null,
  telegram_change_alert_web text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  chat_link_key text null,
  source_lane text null,
  constraint "🌀SINGULARITY_xXx_EXCHANGE_pkey" primary key (upsert_key)
) TABLESPACE pg_default;

create index IF not exists singularity_order_time_display_idx on public."🌀SINGULARITY_xXx_EXCHANGE" using btree (order_time_display) TABLESPACE pg_default;

create index IF not exists singularity_telegram_status_idx on public."🌀SINGULARITY_xXx_EXCHANGE" using btree (telegram_status, delivery_status, delivery_state) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/🌍1.สายออเดอร์หลัก (Main Order Pipeline)/💀THANATOS_xXx_DEATH_NOTE.sql
create table if not exists public."💀THANATOS_xXx_DEATH_NOTE" (
  upsert_key text not null,
  bb_express_send_route text null,
  currentthreadtotalbills text null,
  duplicate_count_th text null,
  balloonnotice text null,
  sniperauthorclass text null,
  facebook_name text null,
  "threadId" text null,
  time_th text null,
  customer_id text null,
  tracking_request_same_thai_date text null,
  tracking_request_route_hint text null,
  order_date text null,
  order_time text null,
  order_time_display text null,
  day_of_week text null,
  order_time_source text null,
  page_id text null,
  page_name text null,
  order_number text null,
  cod_amount text null,
  customer_name text null,
  phone text null,
  extracted_phone text null,
  phone_type text null,
  phone_status text null,
  phone_candidates text null,
  rejected_phone_candidates text null,
  address_display_packer text null,
  addressclean text null,
  "finalAddress" text null,
  short_address text null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  order_source_type text null,
  audit_flags text null,
  chat_timeline text null,
  cod_check_status text null,
  shipping_carrier text null,
  assigned_agent text null,
  assigned_hashtag text null,
  original text null,
  "orderItems" text null,
  for_packer_st_display text null,
  sku text null,
  google_for_packer text null,
  manus_for_packer text null,
  final_order_qty text null,
  extracted_text_qty text null,
  qty_display_th text null,
  "darksideBillDataComplete" text null,
  bill_data_complete text null,
  darkside_completeness_status text null,
  darkside_missing_reasons text null,
  bill_data_reason text null,
  bill_signal_source text null,
  bill_quantity_is_blocker text null,
  route_reason_emoji text null,
  route_reason_color text null,
  route_reason_label text null,
  packer_obj text null,
  extracted_text_price text null,
  is_salty_gold text null,
  fibo_score text null,
  fibo_tier text null,
  fibo_badge text null,
  mathematically_price text null,
  final_order_price text null,
  is_vip text null,
  vip_tag text null,
  order_time_ms_reference text null,
  order_time_bkk_iso text null,
  order_time_thai_date text null,
  order_time_thai_clock text null,
  order_time_thai_label text null,
  order_time_contract_locked text null,
  tracking_request_48h text null,
  tracking_request_48h_event text null,
  node2_tracking_request_detected text null,
  node2_tracking_request_48h text null,
  node2_tracking_request_event text null,
  node2_tracking_request_route_hint text null,
  order_hour text null,
  routing_tag text null,
  status_color text null,
  status_color_backup text null,
  routing_tag_backup text null,
  target_room text null,
  is_safety_white text null,
  order_emoji text null,
  life_status text null,
  ghost_column text null,
  order_number_display text null,
  time_slot text null,
  dispatch_target_date text null,
  time_slot_label text null,
  slot_two_layer_key text null,
  packer_tag_display text null,
  cluster_bill_count text null,
  cluster_position text null,
  is_latest_canonical text null,
  canonical_status text null,
  change_status text null,
  changed_fields text null,
  change_note_th text null,
  cluster_has_change text null,
  pair_route text null,
  pair_position text null,
  pair_group_size text null,
  pair_is_paired text null,
  node2_group_is_latest text null,
  node2_group_has_change text null,
  node2_bill_color_decision text null,
  ghost_reflected_to_bb text null,
  ghost_reflection_source text null,
  node2_ghost_old_order text null,
  node2_route_signal text null,
  node2_route_signal_only_for_ghost_red text null,
  full_address text null,
  final_address_for_bill text null,
  address_raw_source_line text null,
  address_selected_system text null,
  address_selected_field text null,
  address_customer_sender text null,
  address_fallback_used text null,
  address_fallback_level text null,
  address_selection_reason text null,
  address_validation_status text null,
  address_validation_complete text null,
  address_usable text null,
  address_capture_status text null,
  address_validation_issues text null,
  address_type text null,
  address_system_1_result text null,
  address_system_2_result text null,
  address_system_3_result text null,
  address_system_4_result text null,
  address_candidates_all text null,
  address_raw_retention text null,
  address_fibo_score text null,
  address_fibo_tier text null,
  address_fibo_badge text null,
  address_fibo_reason text null,
  address_fibo_usable text null,
  address_fibo_complete text null,
  address_fibo_landmark text null,
  address_fibo_issues text null,
  address_fibo_type text null,
  address_fibo_selected_clean text null,
  address_fibo_selected_source text null,
  address_fibo_cleaner text null,
  is_silent_whale text null,
  order_fibo_effective_price text null,
  order_fibo_product text null,
  order_fibo_engine_version text null,
  address_fibo_engine_version text null,
  address_cascade_engine_version text null,
  master_fibo_engine_version text null,
  order_fibo_untouched_by_address text null,
  address_fibo_untouched_by_order text null,
  order_captured text null,
  order_capture_status text null,
  product_quantity_calculation_disabled text null,
  product_items_v5 text null,
  product_items_matched text null,
  product_items_unmatched text null,
  product_map_items text null,
  product_map_result text null,
  product_map_display text null,
  product_map_mapped_display text null,
  product_map_raw text null,
  product_map_primary text null,
  product_map_sku text null,
  product_map_source_line text null,
  product_map_count text null,
  product_map_mapped_count text null,
  product_map_unmapped_count text null,
  product_map_sku_list text null,
  product_map_master_sku_list text null,
  product_map_status text null,
  product_mapping_is_blocker text null,
  mapping_status text null,
  mapping_engine_version text null,
  master_sku text null,
  display_for_packer text null,
  final_display_for_packer text null,
  final_product text null,
  trusted_product text null,
  product_display_candidates text null,
  product_unmatched_raw text null,
  address_candidates text null,
  expected_cod text null,
  telegram_product_display text null,
  telegram_message text null,
  telegram_copy_text text null,
  bill_header_insert_status text null,
  pre_save_change_status text null,
  pre_save_change_reason text null,
  pre_save_change_group_key text null,
  pre_save_change_group_size text null,
  pre_save_change_pair_candidate_count text null,
  pre_save_change_is_pair text null,
  pre_save_change_selected text null,
  pre_save_change_winner_key text null,
  pre_save_change_score text null,
  pre_save_change_fields text null,
  pre_save_change_route_hint text null,
  pre_save_change_selection_source text null,
  pre_save_change_review_required text null,
  customer_change_audit_version text null,
  customer_change_audit_group_key text null,
  customer_change_audit_group_source text null,
  customer_change_audit_group_size text null,
  customer_change_audit_candidate_count text null,
  customer_change_audit_is_current text null,
  customer_change_audit_is_previous text null,
  customer_change_detected text null,
  customer_change_count text null,
  customer_change_fields text null,
  customer_change_type text null,
  customer_change_previous_upsert_key text null,
  customer_change_current_upsert_key text null,
  customer_change_previous_time text null,
  customer_change_current_time text null,
  customer_change_diff_json text null,
  customer_change_admin_footer text null,
  customer_change_admin_footer_text text null,
  customer_change_source_trace text null,
  history_bucket text null,
  history_route_required text null,
  is_current_candidate text null,
  superseded_by_upsert_key text null,
  customer_change_route_hint text null,
  customer_change_footer_route_decision text null,
  customer_change_footer_order_time_source text null,
  sniper_bill_type text null,
  sniper_badge text null,
  sniper_change_color text null,
  sniper_change_reason text null,
  sniper_is_new_bill text null,
  sniper_is_old_bill text null,
  sniper_change_detected text null,
  sniper_change_field_count text null,
  sniper_change_fields text null,
  routing_tag_before_change text null,
  status_color_before_change text null,
  routing_tag_backup_before_change text null,
  status_color_backup_before_change text null,
  history_route_status text null,
  history_route_key text null,
  switch3_route text null,
  four2_route_reason text null,
  four2_route_reason_label text null,
  four2_order_time_source text null,
  four2_selected_by text null,
  four2_change_fields text null,
  four2_change_count text null,
  four2_selected_for_send text null,
  four2_winner_key text null,
  send_eligible text null,
  telegram_bill_send_eligible text null,
  telegram_send_blocked text null,
  telegram_block_reason text null,
  is_ready_to_pack text null,
  should_send_to_packing text null,
  telegram_main_bill text null,
  telegram_message_for_send_final text null,
  telegram_message_with_change_audit text null,
  telegram_change_alert text null,
  telegram_body text null,
  pre_save_change_previous text null,
  pre_save_change_previous_key text null,
  pre_save_change_selected_order_time_display text null,
  pre_save_change_previous_order_time_display text null,
  customer_change_from_order_time_display text null,
  customer_change_to_order_time_display text null,
  audit_selected_order_time_display text null,
  audit_previous_order_time_display text null,
  audit_order_time_source text null,
  customer_change_summary text null,
  customer_product_change_detected text null,
  customer_product_change_label text null,
  customer_product_previous text null,
  customer_product_current text null,
  customer_color_change_detected text null,
  customer_color_previous text null,
  customer_color_current text null,
  customer_quantity_change_detected text null,
  customer_quantity_previous text null,
  customer_quantity_current text null,
  customer_carrier_change_detected text null,
  customer_carrier_previous text null,
  customer_carrier_current text null,
  customer_address_change_detected text null,
  customer_address_change_label text null,
  customer_address_previous text null,
  customer_address_current text null,
  customer_phone_change_detected text null,
  customer_phone_change_label text null,
  customer_phone_previous text null,
  customer_phone_current text null,
  customer_name_change_detected text null,
  customer_name_change_label text null,
  customer_name_previous text null,
  customer_name_current text null,
  customer_cod_change_detected text null,
  customer_cod_previous text null,
  customer_cod_current text null,
  customer_cod_change_amount text null,
  routing_tag_new_bill text null,
  status_color_new_bill text null,
  routing_tag_backup_new_bill text null,
  status_color_backup_new_bill text null,
  telegram_message_for_send_original text null,
  telegram_copy_text_with_change_audit text null,
  routing_tag_old_bill text null,
  status_color_old_bill text null,
  routing_tag_backup_old_bill text null,
  status_color_backup_old_bill text null,
  switch3_route_status text null,
  telegram_sent text null,
  telegram_status text null,
  delivery_state text null,
  delivery_status text null,
  sent_at text null,
  telegram_sent_at text null,
  product_mapping_status text null,
  product_mapping_pass text null,
  product_mapping_reason text null,
  telegram_bill_header text null,
  telegram_bill_body text null,
  message_id text null,
  facebook_tracking_message_id text null,
  tracking_number text null,
  facebook_tracking_message text null,
  chronos_state text null,
  facebook_tracking_sent_at text null,
  facebook_tracking_status text null,
  recipient_psid text null,
  recipient_name text null,
  "currentThreadTotalBills" text null,
  raw_text text null,
  should_should_to_packing text null,
  chat_age_hours numeric(5, 1) null,
  is_within_24h boolean null,
  can_send_standard boolean null,
  messaging_tag_required character varying(50) null,
  tracking_check text null,
  pickup_date text null,
  consignee text null,
  phone_number text null,
  address text null,
  order_phone text null,
  recipient_id text null,
  portal_key text null,
  page_message_time_th text null,
  customer_message_time_th text null,
  customer_latest_message text null,
  page_latest_message text null,
  latest_message text null,
  customer_time_val bigint null default 0,
  page_time_val bigint null default 0,
  send_facebook_route text null,
  "balloonNotice" text null,
  "sniperAuthorClass" text null,
  source_table text null,
  stock_notice text null,
  branch_route text null,
  is_backlog text null,
  telegram_message_web text null,
  telegram_change_alert_web text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  chat_link_key text null,
  source_lane text null,
  constraint "💀THANATOS_xXx_DEATH_NOTE_pkey" primary key (upsert_key)
) TABLESPACE pg_default;

create index IF not exists thanatos_order_time_display_idx on public."💀THANATOS_xXx_DEATH_NOTE" using btree (order_time_display) TABLESPACE pg_default;

create index IF not exists thanatos_telegram_status_idx on public."💀THANATOS_xXx_DEATH_NOTE" using btree (telegram_status, delivery_status, delivery_state) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/🌍1.สายออเดอร์หลัก (Main Order Pipeline)/🌍GALACTIC_GATEWAY_TOKEN.sql
create table if not exists public."🌍GALACTIC_GATEWAY_TOKEN" (
  page_id text not null,
  page_name text null,
  access_token text null,
  brand_name text null,
  app_identity text null,
  admin_name text null,
  status text null,
  page_label text null,
  "assigned_Hashtag" text null,
  portal_key text null,
  constraint galactic_gateway_token_pkey primary key (page_id)
) TABLESPACE pg_default;

-- ================================================================
-- ================================================================
-- SOURCE: SQL/🛒product_master/FUNCTION_ลิ้งสต๊อก.sql
-- ================================================================
CREATE OR REPLACE FUNCTION public.fn_auto_link_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    final_joke TEXT;
    clean_th_name TEXT;
    variants_json JSONB;
    variant_count INTEGER;
    random_index INTEGER;
    selected_header TEXT;
BEGIN
    -- สกัดชื่อภาษาไทยสแตนด์บายรอ
    clean_th_name := COALESCE(TRIM(NEW.th_name), 'สินค้า');

    -- 🟢 สเตปที่ 1: สายมีของ (stock_qty > 0) 👉 เปิดลอจิกลักไก่สุ่มข้อความ 1 จาก 5 แบบในตาราง
    IF COALESCE(NEW.stock_qty, 0) > 0 THEN
        NEW.stock_status := '✅ INSTOCK';
        NEW.status := 'ACTIVE';

        -- ดึงค่า JSON จากคอลัมน์ normal_header_variants ออกมาเช็ก
        variants_json := NEW.normal_header_variants::JSONB;

        -- 🎯 ตรรกะนักสุ่มขวัญใจคนวางระบบ:
        -- เช็กก่อนว่ามีข้อมูลอาร์เรย์ฝังอยู่ไหม ถ้ามีและไม่ว่าง สั่งลุยสุ่มตัวเลขดัชนีทันที!
        IF variants_json IS NOT NULL AND JSONB_ARRAY_LENGTH(variants_json) > 0 THEN
            variant_count := JSONB_ARRAY_LENGTH(variants_json);
            -- ใช้พลังสุ่มเลขคณิตศาสตร์ของเบส (0 ถึง จำนวนข้อความลบหนึ่ง)
            random_index := FLOOR(RANDOM() * variant_count)::INTEGER;
            -- สอยเอาเฉพาะข้อความเสียวใส้ชิ้นที่เลือกออกมาแบนๆ เพียวๆ ตัวเดียว!
            selected_header := variants_json->>random_index;
            NEW.stock_notice := TRIM(selected_header);
        ELSE
            -- 🛡️ ตัวดักระบบว่างเปล่า: ถ้าในตารางปล่อยว่างไว้ ให้ดีดกลับรางสายสินค้าหลักตามใจพี่
            NEW.stock_notice := CASE
                WHEN UPPER(TRIM(NEW.category)) IN ('COLD', 'COOL') THEN '🧊 สายเย็นรถแช่ · คุมอุณหภูมิระดับพรีเมียม แข็งเป๊กยันปลายทาง'
                WHEN UPPER(TRIM(NEW.category)) = 'SWEET' THEN '🍬 [สายหวานพรีเมียม · หวานกำลังดี แพ็กให้ดีถึงมือ]'
                WHEN UPPER(TRIM(NEW.category)) = 'FRUIT' THEN '🥭 สายผลไม้ · ส่งไวระเบิด คัดสดๆ ไม่สดคัดทิ้ง'
                WHEN UPPER(TRIM(NEW.category)) = 'HOT' THEN '🚀 สายร้อนพร้อมบวก · เคลียร์ทางให้หน่อย รถแรงกำลังจะไป'
                ELSE '🚀 [บิลสมบูรณ์]'
            END;
        END IF;

        -- 🔥 [จุดเชื่อมต่อความเทพ] บังคับให้หัวบิลหลักดึงข้อความสายเพรียวลมหนาวที่สุ่มได้ไปใช้งานทันที
        NEW.chosen_header := NEW.stock_notice;

    ELSE
        -- ❌ สเตปที่ 2: สายสินค้าหมด (stock_qty = 0) 👉 บังคับดีดป้ายแดงเตือนภัย+ดึงมุกไดนามิกชื่อไทยชนคีย์เหมือนเดิม
        NEW.stock_qty := 0;
        NEW.stock_status := '❌ OUT_OF_STOCK';
        NEW.status := 'OUT_OF_STOCK';

        final_joke := TRIM(NEW.out_of_stock_joke);

        IF NULLIF(final_joke, '') IS NOT NULL THEN
            NEW.stock_notice := '❌ สินค้าหมดแล้วแม่' || E'\n' || final_joke;
        ELSE
            NEW.stock_notice := '❌ สินค้าหมดแล้วแม่' || E'\n' || '💬 ' || clean_th_name || ' หมดเกลี้ยง! แอบหนีไปเดินสยามกับคนคุยใหม่ละ';
        END IF;

        -- 🔥 [จุดเชื่อมต่อความเทพ] บังคับให้หัวบิลหลักสลับมาใช้มุกของหมดแม่ไปแสดงผลบนเว็บและส่งออก
        NEW.chosen_header := NEW.stock_notice;
    END IF;

    -- อัปเดตเวลาการแก้ไขล่าสุด
    NEW.updated_at := timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- SOURCE: SQL/🛒product_master/🛒product_master.sql.sql
-- ================================================================
create table if not exists public."🛒product_master" (
  id bigint generated by default as identity not null,
  emoji text null,
  master_sku text not null,
  th_name text null,
  name_standard text null,
  brand text null,
  category text null,
  variant text null,
  unit_price numeric(10, 2) null default 0,
  stock_qty integer null default 0,
  stock_status text null default 'INSTOCK'::text,
  alias text null,
  status text null default 'ACTIVE'::text,
  display_for_packer text null,
  admin_assigned text null,
  assigned_hashtag text null,
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  master_display_for_packer text null,
  out_of_stock_joke text null,
  stock_notice text null,
  shipping_carrier text null,
  shipping_lane text null,
  normal_header_variants jsonb not null default '[]'::jsonb,
  master_stock_notice text null,
  for_packer_st_display text null,
  "telegramHeader" text null,
  "newBillHeader" text null,
  product_camp text null,
  chosen_header text null,
  header_cool jsonb null default '[]'::jsonb,
  header_hot jsonb null default '[]'::jsonb,
  header_fruit jsonb null default '[]'::jsonb,
  header_sweet jsonb null default '[]'::jsonb,
  constraint product_master_pkey primary key (id),
  constraint product_master_sku_key unique (master_sku)
) TABLESPACE pg_default;

create trigger trg_auto_link_product_stock BEFORE INSERT
or
update OF stock_qty,
category,
out_of_stock_joke,
th_name,
normal_header_variants on "🛒product_master" for EACH row
execute FUNCTION fn_auto_link_product_stock ();




-- ================================================================
-- SOURCE: SQL/thailand_address_master/thailand_address_master.sql
-- ================================================================
create table if not exists public.thailand_address_master (
  id bigint generated by default as identity not null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  district_code text null,
  amphoe_code text null,
  province_code text null,
  admin_assigned text null,
  assigned_hashtag text null,
  constraint thailand_address_master_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_thailand_address_master_zipcode on public.thailand_address_master using btree (zipcode) TABLESPACE pg_default;

create index IF not exists idx_thailand_address_master_district on public.thailand_address_master using btree (district) TABLESPACE pg_default;

create index IF not exists idx_thailand_address_master_amphoe on public.thailand_address_master using btree (amphoe) TABLESPACE pg_default;

create index IF not exists idx_thailand_address_master_province on public.thailand_address_master using btree (province) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/parcels/parcels.sql
-- ================================================================
create table if not exists public.parcels (
   id bigserial not null,
  pickup_date text null,
  tracking_number text not null,
  consignee text null,
  phone_number text null,
  address text null,
  cod_amount text null,
  order_phone text null,
  order_number text null,
  delivery_status text null,
  sent_at text null,
  upsert_key text null,
  recipient_id text null,
  facebook_tracking_status text null,
  facebook_tracking_sent_at text null,
  message_id text null,
  portal_key text null,
  page_name text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  drakside_tracking_message text null,
  chat_link_key text null,
  bkk_cutoff_route text null,
  phone_candidates jsonb null,
  matched_phone text null,
  page_id text null,
  fb_tracking_message_for_web text null,
  ds_tracking_message_for_web text null,
  order_time_display text null,
  recipient_name text null,
  chat_age_hours text null,
  send_facebook_route text null,
  source_lane text null,
  constraint parcels_pkey primary key (tracking_number),
  constraint parcels_id_key unique (id)
) TABLESPACE pg_default;

create index IF not exists parcels_phone_number_idx on public.parcels using btree (phone_number) TABLESPACE pg_default;

-- กติกาหลักของสายส่งเลข: มี sent_at แล้วถือว่าส่งเลขสำเร็จเสมอ
UPDATE public.parcels
SET parcel_status_emoji = '⚡SENT'
WHERE NULLIF(btrim(sent_at), '') IS NOT NULL
  AND COALESCE(btrim(parcel_status_emoji), '') <> '⚡SENT';

CREATE OR REPLACE FUNCTION public.enforce_parcel_sent_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NULLIF(btrim(NEW.sent_at), '') IS NOT NULL THEN
    NEW.parcel_status_emoji := '⚡SENT';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS parcels_sent_status_guard ON public.parcels;
CREATE TRIGGER parcels_sent_status_guard
BEFORE INSERT OR UPDATE OF sent_at ON public.parcels
FOR EACH ROW
EXECUTE FUNCTION public.enforce_parcel_sent_status();


-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/page_tokens_vault.sql
-- ================================================================
create table if not exists public.page_tokens_vault (
  page_id text not null,
  page_name text null,
  access_token text null,
  brand_name text null,
  app_identity text null,
  admin_name text null,
  "Sheets_name" text null,
  sheets_id text null,
  spread_sheets_id text null,
  status text null,
  warehouse text null,
  page_label text null,
  "assigned_Hashtag" text null,
  constraint page_tokens_vault_pkey primary key (page_id)
) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/🧿BB_xXx_ORDERCONTROL.sql
-- ================================================================
create table if not exists public."🧿BB_xXx_ORDERCONTROL" (
  upsert_key text not null,
  page_id text not null,
  "threadId" text null,
  customer_id text null,
  page_name text null,
  facebook_name text null,
  customer_name text null,
  phone text null,
  extracted_phone text null,
  order_number text null,
  order_number_display text null,
  order_date text null,
  order_time timestamp with time zone null,
  order_time_display text null,
  time_th text null,
  cod_amount numeric(12, 2) null,
  shipping_carrier text null,
  address_display_packer text null,
  addressclean text null,
  district text null,
  amphoe text null,
  province text null,
  zipcode text null,
  sku text null,
  manus_for_packer text null,
  telegram_copy_text text null,
  order_status text null,
  delivery_state text null,
  delivery_status text null,
  carton_count smallint null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  assigned_agent text null,
  chat_age_hours numeric(5, 1) null,
  is_within_24h boolean null,
  can_send_standard boolean null,
  messaging_tag_required character varying(50) null,
  facebook_tracking_status text null,
  facebook_tracking_sent_at text null,
  message_id text null,
  target_room text null,
  tracking_check text null,
  recipient_id text null,
  recipient_name text null,
  page_message_time_th text null,
  customer_message_time_th text null,
  customer_latest_message text null,
  page_latest_message text null,
  latest_message text null,
  customer_time_val bigint null default 0,
  page_time_val bigint null default 0,
  bb_express_send_route text null default '⚪'::text,
  is_safety_white boolean null default true,
  order_hour integer null default 0,
  send_facebook_route text null,
  sent_at timestamp without time zone null,
  portal_key text null,
  original text null,
  telegram_message text null,
  assigned_hashtag text null,
  conversation_id text null,
  thread_id text null default ''::text,
  provider_message_id text null,
  message_text text null,
  message_raw text null,
  sniper_x_text_clean text null,
  speaker text null,
  is_sent boolean null default false,
  dedupe_key text null,
  conversation_key text null,
  sync_status text null default 'READY_TO_SAVE'::text,
  "time" timestamp with time zone null,
  occurred_at timestamp with time zone null default now(),
  message_time_display text null,
  has_attachment boolean null default false,
  attachment_type text null,
  attachment_url text null,
  attachment_urls jsonb null default '[]'::jsonb,
  attachments_raw jsonb null default '[]'::jsonb,
  sticker_url text null,
  shares_link text null,
  customer_chat_age_hours numeric null,
  is_24h_window_valid boolean null default true,
  chat_page_messages text null,
  id text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  drakside_tracking_message text null,
  access_token text null,
  bkk_cutoff_route text null,
  "customerMessageTimeTh" text null,
  tracking_number text null,
  chat_link_key text null,
  m text null,
  phone_candidates jsonb null,
  pager_message_time_th text null,
  admin_tracking_number text null,
  admin_tracking_carrier text null,
  admin_tracking_found boolean null,
  admin_tracking_source text null,
  has_tracking_notice boolean null,
  already_sent boolean null,
  "sendFacebookRoute" text null,
  route_source text null,
  signature_status text null,
  address text null,
  consignee text null,
  pickup_date text null,
  phone_number text null,
  order_phone text null,
  matched_phone text null,
  already_sent_source text null,
  recipient_psid text null,
  raw_payload jsonb null,
  cutoff_is_permanent boolean null,
  duplicate_in_current_batch boolean null,
  cutoff_processed_at timestamp without time zone null,
  cutoff_reason_text text null,
  cutoff_reasons jsonb null,
  cutoff_record_status text null,
  order_delivery_status text null,
  parcel_address text null,
  parcel_row_id text null,
  queue_status text null,
  fb_tracking_message_for_web text null,
  ds_tracking_message_for_web text null,
  "dedupeKey" text null,
  time_slot_label text null,
  source_lane text null,
  constraint "🧿BB_xXx_ORDERCONTROL_pkey" primary key (upsert_key),
  constraint ordercontrol_message_id_key unique (message_id)
) TABLESPACE pg_default;

create index IF not exists ordercontrol_phone_digits_idx on public."🧿BB_xXx_ORDERCONTROL" using btree (
  regexp_replace(
    COALESCE(phone, ''::text),
    '[^0-9]'::text,
    ''::text,
    'g'::text
  )
) TABLESPACE pg_default
where
  (
    NULLIF(
      btrim(
        regexp_replace(
          COALESCE(phone, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        )
      ),
      ''::text
    ) is not null
  );

create unique INDEX IF not exists st_ordercontrol_dedupe_key_uidx on public."🧿BB_xXx_ORDERCONTROL" using btree (dedupe_key) TABLESPACE pg_default;

create unique INDEX IF not exists st_ordercontrol_chat_link_key_uidx on public."🧿BB_xXx_ORDERCONTROL" using btree (chat_link_key) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/💬3.สายแชท/Cust_Chat⭐BINARY_xXx_STAR.sql
-- ================================================================
create table if not exists public."Cust_Chat⭐BINARY_xXx_STAR" (
  id bigint generated by default as identity not null,
  chat_link_key text null,
  page_id text not null,
  page_name text null,
  portal_key text null,
  assigned_agent text null,
  assigned_hashtag text null,
  conversation_id text null,
  thread_id text not null default ''::text,
  customer_id text null,
  customer_name text null,
  recipient_id text null,
  recipient_name text null,
  message_id text null,
  speaker text null,
  is_sent boolean null default false,
  "time" timestamp with time zone null,
  time_th text null,
  message_time_display text null,
  created_at timestamp with time zone not null default now(),
  has_attachment boolean null default false,
  attachment_type text null,
  attachment_url text null,
  attachment_urls jsonb not null default '[]'::jsonb,
  attachments_raw jsonb not null default '[]'::jsonb,
  sticker_url text null,
  shares_link text null,
  chat_age_hours numeric null,
  is_within_24h boolean null default true,
  can_send_standard boolean null default true,
  is_24h_window_valid boolean null default true,
  messaging_tag_required text null,
  dedupe_key text null,
  sync_status text null default 'READY_TO_SAVE'::text,
  "threadId" text null,
  occurred_at timestamp with time zone null default now(),
  customer_chat_age_hours text null,
  send_facebook_route text null,
  message_text text null,
  drakside_tracking_message text null,
  tracking_number text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  upsert_key text null,
  order_number text null,
  order_number_display text null,
  order_time_display text null,
  customer_latest_message text null,
  customer_message_time_th text null,
  page_latest_message text null,
  page_message_time_th text null,
  order_time text null,
  cod_amount numeric(12, 2) null,
  phone text null,
  pager_message_time_th text null,
  manus_for_packer text null,
  facebook_name text null,
  profile_picture_url text null,
  shipping_carrier text null
) TABLESPACE pg_default;

create unique INDEX IF not exists ux_cust_chat_message_id on public."Cust_Chat⭐BINARY_xXx_STAR" using btree (message_id) TABLESPACE pg_default
where
  (NULLIF(btrim(message_id), ''::text) is not null);

create index IF not exists ix_cust_chat_phone on public."Cust_Chat⭐BINARY_xXx_STAR" using btree (phone) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/💬3.สายแชท/Pg_Chat⭐BINARY_xXx_STAR.sql
-- ================================================================
create table if not exists public."Pg_Chat⭐BINARY_xXx_STAR" (
  id bigint generated by default as identity not null,
  chat_link_key text null,
  page_id text not null,
  page_name text null,
  portal_key text null,
  assigned_agent text null,
  assigned_hashtag text null,
  conversation_id text null,
  thread_id text not null default ''::text,
  customer_id text null,
  customer_name text null,
  recipient_id text null,
  recipient_name text null,
  message_id text null,
  speaker text null,
  is_sent boolean null default false,
  "time" timestamp with time zone null,
  time_th text null,
  message_time_display text null,
  created_at timestamp with time zone not null default now(),
  has_attachment boolean null default false,
  attachment_type text null,
  attachment_url text null,
  attachment_urls jsonb not null default '[]'::jsonb,
  attachments_raw jsonb not null default '[]'::jsonb,
  sticker_url text null,
  shares_link text null,
  chat_age_hours numeric null,
  is_within_24h boolean null default true,
  can_send_standard boolean null default true,
  is_24h_window_valid boolean null default true,
  messaging_tag_required text null,
  dedupe_key text null,
  sync_status text null default 'READY_TO_SAVE'::text,
  "threadId" text null,
  occurred_at timestamp with time zone null default now(),
  customer_chat_age_hours text null,
  send_facebook_route text null,
  message_text text null,
  drakside_tracking_message text null,
  tracking_number text null,
  parcel_status_emoji text null,
  facebook_tracking_message text null,
  upsert_key text null,
  order_number text null,
  order_number_display text null,
  order_time_display text null,
  time_slot_label text null,
  customer_latest_message text null,
  customer_message_time_th text null,
  page_latest_message text null,
  page_message_time_th text null,
  order_time text null,
  cod_amount numeric(12, 2) null,
  phone text null,
  pager_message_time_th text null,
  manus_for_packer text null,
  facebook_name text null,
  profile_picture_url text null,
  shipping_carrier text null
) TABLESPACE pg_default;

-- Pg writer ใช้ dedupe_key เป็นคีย์ upsert; ไม่สร้าง unique message_id ซ้อนอีกชั้น
create index IF not exists ix_pg_chat_phone on public."Pg_Chat⭐BINARY_xXx_STAR" using btree (phone) TABLESPACE pg_default;


-- ================================================================
-- SOURCE: SQL/💬3.สายแชท/🌈MILKY_WAY_xXx_TOKEN _PAGE.sql
create table if not exists public."🌈MILKY_WAY_xXx_TOKEN _PAGE" (
  page_id text not null,
  page_name text null,
  access_token text null,
  brand_name text null,
  app_identity text null,
  admin_name text null,
  "Sheets_name" text null,
  sheets_id text null,
  spread_sheets_id text null,
  status text null,
  warehouse text null,
  page_label text null,
  "assigned_Hashtag" text null,
  portal_key text null,
  constraint milky_way_token_page_pkey primary key (page_id)
) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/💬3.สายแชท/🏴_☠️SIRIUS_xXx_CRASH.sql
-- ================================================================
create table if not exists public."🏴‍☠️SIRIUS_xXx_CRASH" (
  case_id text not null,
  branch text not null default ''::text,
  carrier_employee text not null default ''::text,
  area text not null default ''::text,
  updated_at timestamp with time zone not null default now(),
  constraint bb_delivery_case_notes_pkey primary key (case_id)
) TABLESPACE pg_default;

-- ================================================================
-- SOURCE: SQL/migrations/app_customization.sql
-- ================================================================
-- ROOM 04 · APP CUSTOMIZATION VAULT
-- Run this in the ROOM 04 Supabase project.
-- Existing tables are preserved; missing columns are added safely.

create extension if not exists pgcrypto;

-- 1) Chat frames -------------------------------------------------------------
create table if not exists public.app_chat_frames (
  id uuid primary key default gen_random_uuid(),
  frame_key text not null unique,
  name text not null,
  description text not null default '',
  base_frame_key text,
  border_color text,
  accent_color text,
  border_width numeric(6,2),
  glow numeric(6,2),
  animation text,
  custom_css text not null default '',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_chat_frames
  add column if not exists base_frame_key text,
  add column if not exists border_color text,
  add column if not exists accent_color text,
  add column if not exists border_width numeric(6,2),
  add column if not exists glow numeric(6,2),
  add column if not exists animation text,
  add column if not exists custom_css text not null default '',
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 2) Themes ------------------------------------------------------------------
create table if not exists public.app_themes (
  id uuid primary key default gen_random_uuid(),
  theme_key text not null unique,
  name text not null,
  description text not null default '',
  background_color text not null default '#090611',
  surface_color text not null default '#151027',
  primary_color text not null default '#b879ff',
  accent_color text not null default '#00e5ff',
  border_style text not null default 'solid',
  button_style text not null default 'solid',
  radius numeric(6,2) not null default 16,
  glow numeric(6,2) not null default 12,
  motion_enabled boolean not null default true,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_themes
  add column if not exists description text not null default '',
  add column if not exists background_color text not null default '#090611',
  add column if not exists surface_color text not null default '#151027',
  add column if not exists primary_color text not null default '#b879ff',
  add column if not exists accent_color text not null default '#00e5ff',
  add column if not exists border_style text not null default 'solid',
  add column if not exists button_style text not null default 'solid',
  add column if not exists radius numeric(6,2) not null default 16,
  add column if not exists glow numeric(6,2) not null default 12,
  add column if not exists motion_enabled boolean not null default true,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 3) Sounds ------------------------------------------------------------------
create table if not exists public.app_sounds (
  id uuid primary key default gen_random_uuid(),
  sound_key text not null unique,
  name text not null,
  description text not null default '',
  event_type text not null default 'custom',
  storage_bucket text,
  storage_path text,
  mime_type text,
  volume numeric(5,4) not null default 0.35,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  version integer not null default 1,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_sounds
  add column if not exists description text not null default '',
  add column if not exists event_type text not null default 'custom',
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists volume numeric(5,4) not null default 0.35,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists sort_order integer not null default 0,
  add column if not exists version integer not null default 1,
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- 4) Current selections ------------------------------------------------------
-- One active value per app/scope/type. Examples:
--   app_key=BB_STORE_ORDERS, scope_key=global, asset_type=theme, asset_key=theme-005
--   app_key=BB_STORE_ORDERS, scope_key=line:Uxxxx, asset_type=frame, asset_key=f03
create table if not exists public.app_customization_selections (
  id uuid primary key default gen_random_uuid(),
  app_key text not null default 'BB_STORE_ORDERS',
  scope_key text not null default 'global',
  asset_type text not null check (asset_type in ('theme','frame','sound','image','background','other')),
  asset_key text not null,
  is_active boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_customization_selection_unique unique (app_key, scope_key, asset_type)
);

create index if not exists app_chat_frames_enabled_order_idx
  on public.app_chat_frames (is_enabled, sort_order);
create index if not exists app_themes_enabled_order_idx
  on public.app_themes (is_enabled, sort_order);
create index if not exists app_sounds_enabled_event_order_idx
  on public.app_sounds (is_enabled, event_type, sort_order);
create index if not exists app_customization_selection_lookup_idx
  on public.app_customization_selections (app_key, scope_key, asset_type, is_active);

-- Shared updated_at trigger. Existing installations may already have this.
create or replace function public.touch_app_customization_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_chat_frames_touch_updated_at on public.app_chat_frames;
create trigger app_chat_frames_touch_updated_at
before update on public.app_chat_frames
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_themes_touch_updated_at on public.app_themes;
create trigger app_themes_touch_updated_at
before update on public.app_themes
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_sounds_touch_updated_at on public.app_sounds;
create trigger app_sounds_touch_updated_at
before update on public.app_sounds
for each row execute function public.touch_app_customization_updated_at();

drop trigger if exists app_customization_selections_touch_updated_at on public.app_customization_selections;
create trigger app_customization_selections_touch_updated_at
before update on public.app_customization_selections
for each row execute function public.touch_app_customization_updated_at();

-- Read access for the app. Keep write access restricted if the app writes via
-- a protected server route. The existing project policies are not overwritten.
alter table public.app_chat_frames enable row level security;
alter table public.app_themes enable row level security;
alter table public.app_sounds enable row level security;
alter table public.app_customization_selections enable row level security;

drop policy if exists app_chat_frames_public_read on public.app_chat_frames;
create policy app_chat_frames_public_read on public.app_chat_frames
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_themes_public_read on public.app_themes;
create policy app_themes_public_read on public.app_themes
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_sounds_public_read on public.app_sounds;
create policy app_sounds_public_read on public.app_sounds
for select to anon, authenticated using (is_enabled = true);

drop policy if exists app_customization_selections_public_read on public.app_customization_selections;
create policy app_customization_selections_public_read on public.app_customization_selections
for select to anon, authenticated using (is_active = true);

-- The current Secret Gallery uses the ROOM 04 anon/publishable key from the
-- browser. These policies make its add/edit/toggle buttons functional.
-- If the project later moves writes behind an authenticated server route,
-- remove these four public-write policies and grant writes only to that role.
drop policy if exists app_chat_frames_secret_write on public.app_chat_frames;
create policy app_chat_frames_secret_write on public.app_chat_frames
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_themes_secret_write on public.app_themes;
create policy app_themes_secret_write on public.app_themes
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_sounds_secret_write on public.app_sounds;
create policy app_sounds_secret_write on public.app_sounds
for all to anon, authenticated using (true) with check (true);

drop policy if exists app_customization_selections_secret_write on public.app_customization_selections;
create policy app_customization_selections_secret_write on public.app_customization_selections
for all to anon, authenticated using (true) with check (true);

notify pgrst, 'reload schema';


-- ================================================================
-- SOURCE: SQL/migrations/line_channels.sql
-- ================================================================
-- LINE OA channels for ROOM 02 Chat Core.
-- Tokens are server-only secrets. Do not expose this table through anon/authenticated roles.
create table if not exists public.line_channels (
  id bigint generated by default as identity primary key,
  channel_id text not null unique,
  channel_name text not null,
  oa_id text not null unique,
  channel_access_token text not null,
  channel_secret text,
  is_active boolean not null default true,
  status text not null default 'ON',
  status_web text not null default 'ON',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.line_channels add column if not exists status text not null default 'ON';
alter table public.line_channels add column if not exists status_web text not null default 'ON';

alter table public.line_channels enable row level security;
alter table public.line_channels force row level security;

drop policy if exists line_channels_service_role_only on public.line_channels;
create policy line_channels_service_role_only
on public.line_channels
for all
to service_role
using (true)
with check (true);

revoke all on public.line_channels from anon, authenticated;
grant all on public.line_channels to service_role;

-- Example only; replace values before running.
-- insert into public.line_channels (channel_id, channel_name, oa_id, channel_access_token, channel_secret)
-- values ('2009895812', 'BB STORE', 'U7abbb0356ee92548feac19124976abd3', 'CHANNEL_ACCESS_TOKEN', 'CHANNEL_SECRET');


-- ================================================================
-- SOURCE: SQL/📸private vault/sales_script_cards.sql
-- ================================================================
-- PRIVATE VAULT · ภาพและสคริปต์สำหรับแอดมิน
-- รันใน Supabase SQL Editor ของโปรเจกต์ที่หน้า /script-atelier ใช้งานอยู่
-- หน้าเว็บใช้ public anon/publishable key จึงมี policy สำหรับ anon และ authenticated

create extension if not exists pgcrypto;

create table if not exists public.sales_script_cards (
  id uuid primary key default gen_random_uuid(),
  -- คอลัมน์ legacy ที่หน้าเดิมอาจบังคับใช้ แต่ไม่ได้แสดงใน Private Vault
  sku text not null default '',
  title text not null,
  subtitle text not null default '',
  script_text text not null,
  ai_context text not null default '',
  ai_instruction text not null default '',
  blocks_json jsonb not null default '[]'::jsonb,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sales_script_cards enable row level security;

create index if not exists sales_script_cards_updated_at_idx
  on public.sales_script_cards (updated_at desc);

create index if not exists sales_script_cards_status_idx
  on public.sales_script_cards (status);

-- ให้รันซ้ำได้โดยไม่ชนชื่อ policy
 drop policy if exists "private vault read scripts" on public.sales_script_cards;
 drop policy if exists "private vault insert scripts" on public.sales_script_cards;
 drop policy if exists "private vault update scripts" on public.sales_script_cards;
 drop policy if exists "private vault delete scripts" on public.sales_script_cards;

create policy "private vault read scripts"
  on public.sales_script_cards
  for select
  to anon, authenticated
  using (true);

create policy "private vault insert scripts"
  on public.sales_script_cards
  for insert
  to anon, authenticated
  with check (true);

create policy "private vault update scripts"
  on public.sales_script_cards
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "private vault delete scripts"
  on public.sales_script_cards
  for delete
  to anon, authenticated
  using (true);

-- คลังภาพต้นฉบับ เช่น ภาพโพสต์ 1080x1350
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-script-images',
  'sales-script-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

 drop policy if exists "private vault read images" on storage.objects;
 drop policy if exists "private vault upload images" on storage.objects;
 drop policy if exists "private vault update images" on storage.objects;
 drop policy if exists "private vault delete images" on storage.objects;

create policy "private vault read images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'sales-script-images');

create policy "private vault upload images"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'sales-script-images'
    and name like 'script-art/%'
  );

create policy "private vault update images"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'sales-script-images' and name like 'script-art/%')
  with check (bucket_id = 'sales-script-images' and name like 'script-art/%');

create policy "private vault delete images"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'sales-script-images' and name like 'script-art/%');

-- ตรวจผลหลังรัน
select id, title, status, version, updated_at
from public.sales_script_cards
order by updated_at desc
limit 10;

select id, name, public, file_size_limit
from storage.buckets
where id = 'sales-script-images';


-- ================================================================
-- SOURCE: SQL/migrations/milky_way_token_page_compat.sql
-- ================================================================
-- ROOM 02 · Meta Page Token compatibility patch
-- แก้ schema ให้ตรงกับ ChatHub / Secret Gallery เวอร์ชันปัจจุบัน
-- ไม่ลบข้อมูลและไม่เปลี่ยน page_id/access_token เดิม

alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
  add column if not exists status_web text not null default 'ON',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ให้สถานะเว็บเริ่มต้นตามสถานะแอปเดิม ถ้ามีค่าอยู่แล้ว
update public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
set status_web = case
  when upper(coalesce(status, 'ON')) in ('ON', 'OFF') then upper(coalesce(status, 'ON'))
  else 'ON'
end
where status_web is null or status_web not in ('ON', 'OFF');

create or replace function public.touch_milky_way_token_page_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists milky_way_token_page_touch_updated_at
on public."🌈MILKY_WAY_xXx_TOKEN _PAGE";

create trigger milky_way_token_page_touch_updated_at
before update on public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
for each row
execute function public.touch_milky_way_token_page_updated_at();

notify pgrst, 'reload schema';

-- ตรวจผลหลังรัน
select page_id, page_name, status, status_web, created_at, updated_at
from public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
order by page_name asc;


-- ================================================================
-- SOURCE: SQL/migrations/line_messages_columns.sql
-- ================================================================
-- Columns used by the n8n LINE normalizer.
alter table public.line_messages
  add column if not exists channel text,
  add column if not exists source text,
  add column if not exists oa_id text,
  add column if not exists conversation_id text,
  add column if not exists event_id text,
  add column if not exists event_type text,
  add column if not exists event_timestamp bigint,
  add column if not exists line_user_id text,
  add column if not exists user_id text,
  add column if not exists source_type text,
  add column if not exists group_id text,
  add column if not exists room_id text,
  add column if not exists line_message_id text,
  add column if not exists message_id text,
  add column if not exists message_type text,
  add column if not exists message_text text,
  add column if not exists text text,
  add column if not exists direction text,
  add column if not exists speaker text,
  add column if not exists reply_token text,
  add column if not exists display_name text,
  add column if not exists profile_picture_url text,
  add column if not exists raw_event jsonb,
  add column if not exists raw_payload jsonb,
  add column if not exists is_message_event boolean,
  add column if not exists created_at timestamptz default now();

create index if not exists line_messages_line_user_idx
  on public.line_messages (line_user_id);
create index if not exists line_messages_destination_idx
  on public.line_messages (destination);
create index if not exists line_messages_conversation_idx
  on public.line_messages (conversation_id);

-- Ask PostgREST to reload its schema cache immediately.
notify pgrst, 'reload schema';


-- ================================================================
-- SOURCE: SQL/20261114_chat_append_history.sql
-- ================================================================
-- CHAT APPEND-ONLY HISTORY
-- สาเหตุ: chat_link_key เป็น PRIMARY KEY จึงเก็บได้เพียง 1 แถวต่อห้อง
-- chat_link_key ต้องซ้ำได้ เพราะเป็นคีย์ของห้อง ไม่ใช่คีย์ของข้อความ
-- รันใน Supabase โปรเจกต์ BB_CHAT หลังสำรองข้อมูลแล้ว

-- เปลี่ยน primary key ของ Cust จาก chat_link_key เป็นแถวข้อความถาวร
alter table public."Cust_Chat⭐BINARY_xXx_STAR"
  add column if not exists message_row_id bigint generated by default as identity;

do $$
declare
  pk_name text;
begin
  select con.conname into pk_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace ns on ns.oid = rel.relnamespace
  where ns.nspname = 'public'
    and rel.relname = 'Cust_Chat⭐BINARY_xXx_STAR'
    and con.contype = 'p';
  if pk_name is not null then
    execute format('alter table public."Cust_Chat⭐BINARY_xXx_STAR" drop constraint %I', pk_name);
  end if;
end $$;

alter table public."Cust_Chat⭐BINARY_xXx_STAR"
  add constraint "Cust_Chat⭐BINARY_xXx_STAR_message_pkey" primary key (message_row_id);

-- ทำแบบเดียวกันกับฝั่งเพจ เพื่อให้แต่ละข้อความเป็นคนละแถว
alter table public."Pg_Chat⭐BINARY_xXx_STAR"
  add column if not exists message_row_id bigint generated by default as identity;

do $$
declare
  pk_name text;
begin
  select con.conname into pk_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace ns on ns.oid = rel.relnamespace
  where ns.nspname = 'public'
    and rel.relname = 'Pg_Chat⭐BINARY_xXx_STAR'
    and con.contype = 'p';
  if pk_name is not null then
    execute format('alter table public."Pg_Chat⭐BINARY_xXx_STAR" drop constraint %I', pk_name);
  end if;
end $$;

alter table public."Pg_Chat⭐BINARY_xXx_STAR"
  add constraint "Pg_Chat⭐BINARY_xXx_STAR_message_pkey" primary key (message_row_id);

create index if not exists "Cust_Chat⭐BINARY_xXx_STAR_room_idx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (chat_link_key, thread_id, occurred_at);
create index if not exists "Pg_Chat⭐BINARY_xXx_STAR_room_idx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (chat_link_key, thread_id, occurred_at);
create index if not exists "Cust_Chat⭐BINARY_xXx_STAR_message_idx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (message_id)
  where message_id is not null;
create index if not exists "Pg_Chat⭐BINARY_xXx_STAR_message_idx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (message_id)
  where message_id is not null;

commit;

-- สำคัญใน n8n:
-- 1) node รับข้อความใหม่ต้องใช้ INSERT ไม่ใช่ UPDATE
-- 2) ห้ามใช้ chat_link_key เป็น filter ของ UPDATE
-- 3) ถ้าต้องแก้ข้อความเดิม ให้ใช้ message_id เป็น filter
-- 4) chat_link_key ใช้รวม/ค้นหาห้องเท่านั้น


-- ================================================================
-- SOURCE: SQL/20261117_chat_profile_picture.sql
-- ================================================================
-- Store the real Messenger profile picture URL emitted by BB_CHAT.
-- The URL comes from Meta's User Profile API and may expire; n8n refreshes it on later syncs.
alter table public."Cust_Chat⭐BINARY_xXx_STAR"
  add column if not exists profile_picture_url text null;

alter table public."Pg_Chat⭐BINARY_xXx_STAR"
  add column if not exists profile_picture_url text null;


-- ================================================================
-- SOURCE: SQL/CHAT/CHAT_PER_MESSAGE_FIELDS.sql
-- ================================================================
-- Per-message text contract for the two source-of-truth chat tables.
-- Cust rows store customer_message_text; Pg rows store page_message_text.
-- Keep message_text for backwards compatibility with existing readers.

ALTER TABLE public."Cust_Chat⭐BINARY_xXx_STAR"
  ADD COLUMN IF NOT EXISTS customer_message_text text;

ALTER TABLE public."Pg_Chat⭐BINARY_xXx_STAR"
  ADD COLUMN IF NOT EXISTS page_message_text text;


-- ================================================================
-- SOURCE: SQL/CHAT/CHAT_MESSAGE_ID_DEDUPE.sql
-- ================================================================
-- DEDUPE append-only chat rows by provider message_id
-- Run this separately in EACH Chat Supabase project that owns:
--   public."Cust_Chat⭐BINARY_xXx_STAR"
--   public."Pg_Chat⭐BINARY_xXx_STAR"
-- Requires message_row_id from the append-only chat migration.
-- First run the read-only preview queries; then run the transaction below.

-- PREVIEW: duplicate keys and extra rows to be removed (Customer)
select message_id, count(*) as row_count, count(*) - 1 as duplicate_rows
from public."Cust_Chat⭐BINARY_xXx_STAR"
where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
group by message_id
having count(*) > 1
order by duplicate_rows desc;

-- PREVIEW: message IDs that exist in BOTH source tables (inspect; per-table indexes cannot enforce cross-table uniqueness)
select message_id, count(*) as copies_across_tables
from (
  select message_id from public."Cust_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
  union all
  select message_id from public."Pg_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
) as both_sides
group by message_id
having count(*) > 1
order by copies_across_tables desc;

-- PREVIEW: duplicate keys and extra rows to be removed (Page)
select message_id, count(*) as row_count, count(*) - 1 as duplicate_rows
from public."Pg_Chat⭐BINARY_xXx_STAR"
where message_id is not null and lower(btrim(message_id)) not in ('', 'null', 'undefined')
group by message_id
having count(*) > 1
order by duplicate_rows desc;

-- Empty IDs are not provider IDs; normalize them to NULL so they do not collide.
update public."Cust_Chat⭐BINARY_xXx_STAR"
set message_id = null
where message_id is not null and lower(btrim(message_id)) in ('', 'null', 'undefined');

update public."Pg_Chat⭐BINARY_xXx_STAR"
set message_id = null
where message_id is not null and lower(btrim(message_id)) in ('', 'null', 'undefined');

-- Keep the earliest physical row for each message_id; remove later copies.
with ranked as (
  select message_row_id,
         row_number() over (partition by message_id order by message_row_id asc) as rn
  from public."Cust_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('null', 'undefined')
)
delete from public."Cust_Chat⭐BINARY_xXx_STAR" as chat
using ranked
where chat.message_row_id = ranked.message_row_id and ranked.rn > 1;

with ranked as (
  select message_row_id,
         row_number() over (partition by message_id order by message_row_id asc) as rn
  from public."Pg_Chat⭐BINARY_xXx_STAR"
  where message_id is not null and lower(btrim(message_id)) not in ('null', 'undefined')
)
delete from public."Pg_Chat⭐BINARY_xXx_STAR" as chat
using ranked
where chat.message_row_id = ranked.message_row_id and ranked.rn > 1;

-- Guard against future duplicates. Multiple NULL message_id values remain allowed.
create unique index if not exists "Cust_Chat⭐BINARY_xXx_STAR_message_id_uidx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (message_id);

create unique index if not exists "Pg_Chat⭐BINARY_xXx_STAR_message_id_uidx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (message_id);

commit;

-- REQUIRED n8n writer setting for EVERY node inserting these chat tables:
-- URL query:   on_conflict=message_id
-- Prefer:      resolution=ignore-duplicates,return=representation
-- This makes repeated pulls idempotent instead of creating another row.
-- If the flow does not send on_conflict + Prefer, the unique index still
-- prevents duplicates but the duplicate insert will return a conflict error.


-- ================================================================
-- SOURCE: SQL/CHAT/CHAT_NOTIFICATION_POLL_INDEX.sql
-- ================================================================
-- BB_CHAT · index สำหรับ room-list query ที่เรียงตาม occurred_at และ row ID
-- รันใน Supabase โปรเจกต์ BB_CHAT ที่มีตาราง Cust_Chat
-- ไม่ลบ/แก้ข้อมูลเดิม; notification delta ใช้ message_row_id primary key อยู่แล้ว

create index if not exists "Cust_Chat⭐BINARY_xXx_STAR_occurred_at_row_idx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (occurred_at, message_row_id);

create index if not exists "Pg_Chat⭐BINARY_xXx_STAR_occurred_at_row_idx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (occurred_at, message_row_id);


-- ================================================================
-- SOURCE: SQL/💬3.สายแชท/INDEX.sql
-- ================================================================
CREATE INDEX IF NOT EXISTS ix_cust_chat_phone
ON public."Cust_Chat⭐BINARY_xXx_STAR" (phone);

CREATE INDEX IF NOT EXISTS ix_pg_chat_phone
ON public."Pg_Chat⭐BINARY_xXx_STAR" (phone);


-- ช่วยค้นข้อความตามห้อง แต่อนุญาตให้หลายข้อความใช้ chat_link_key เดียวกัน

CREATE INDEX IF NOT EXISTS ix_chat_customer_chat_link_key
ON public."Cust_Chat⭐BINARY_xXx_STAR" (chat_link_key);

CREATE INDEX IF NOT EXISTS ix_chat_page_chat_link_key
ON public."Pg_Chat⭐BINARY_xXx_STAR" (chat_link_key);

-- ================================================================
-- SOURCE: SQL/🛒product_master/add_admin_availability.sql
-- ================================================================
-- Run this in the ROOM 04 (Private Vault) Supabase SQL Editor before deploying the app change.
-- This separates the admin-facing availability toggle from physical stock quantity.
-- Existing rows remain NULL and continue to derive their display state from stock_status/stock_qty.

ALTER TABLE public."🛒product_master"
  ADD COLUMN IF NOT EXISTS admin_availability text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'product_master_admin_availability_check'
      AND conrelid = 'public."🛒product_master"'::regclass
  ) THEN
    ALTER TABLE public."🛒product_master"
      ADD CONSTRAINT product_master_admin_availability_check
      CHECK (admin_availability IS NULL OR admin_availability IN ('IN_STOCK', 'OUT_OF_STOCK'));
  END IF;
END
$$;

COMMENT ON COLUMN public."🛒product_master".admin_availability IS
  'Admin UI availability override; does not replace physical stock_qty or stock-triggered dynamic bill headers.';


-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/parcels/FUNCTION_get_parcel_by_phone_v2.sql
-- ================================================================
-- ค้นหาพัสดุจาก phone_number หรือ order_phone
-- รันไฟล์นี้ทั้งชุดใน Supabase SQL Editor

create or replace function public.FUNCTION_get_parcel_by_phone_v2(search_phone text)
returns json
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_phone text;
  result_records json;
begin
  normalized_phone :=
    pg_catalog.regexp_replace(
      coalesce(search_phone, ''),
      '[^0-9]',
      '',
      'g'
    );

  if pg_catalog.length(normalized_phone) <> 10 then
    return pg_catalog.json_build_object(
      'success', false,
      'reason', 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก'
    );
  end if;

  select coalesce(
    pg_catalog.json_agg(
      pg_catalog.to_jsonb(q)
      order by q.pickup_date desc nulls last, q.id desc
    ),
    '[]'::json
  )
  into result_records
  from (
    select
      id,
      pickup_date,
      tracking_number,
      consignee,
      cod_amount
    from public.parcels
    where
      pg_catalog.regexp_replace(
        coalesce(phone_number::text, ''),
        '[^0-9]',
        '',
        'g'
      ) = normalized_phone
      or pg_catalog.regexp_replace(
        coalesce(order_phone::text, ''),
        '[^0-9]',
        '',
        'g'
      ) = normalized_phone
    order by pickup_date desc nulls last, id desc
    limit 50
  ) as q;

  if pg_catalog.json_array_length(result_records) = 0 then
    return pg_catalog.json_build_object(
      'success', false,
      'reason', 'ไม่พบข้อมูลพัสดุ'
    );
  end if;

  return pg_catalog.json_build_object(
    'success', true,
    'data', result_records
  );
end;
$$;


-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/parcels/FUNCTION_search_parcels_quick.sql
-- ================================================================




-- Search parcels for the admin room.
-- Called through the authenticated server procedure using Supabase service_role.
-- SECURITY INVOKER preserves the role/RLS of the caller; do not grant anon access.

CREATE OR REPLACE FUNCTION public.search_parcels_quick(
  p_search text,
  p_mode text DEFAULT 'auto',
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  tracking_number text,
  pickup_date text,
  consignee text,
  phone_number text,
  address text,
  cod_amount text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  WITH args AS (
    SELECT
      NULLIF(pg_catalog.btrim(COALESCE(p_search, '')), '') AS term,
      pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g') AS digits,
      CASE
        WHEN pg_catalog.left(
          pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g'),
          2
        ) = '66'
        THEN '0' || pg_catalog.substr(
          pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g'),
          3
        )
        ELSE pg_catalog.regexp_replace(COALESCE(p_search, ''), '[^0-9]', '', 'g')
      END AS local_digits,
      pg_catalog.lower(COALESCE(p_mode, 'auto')) AS mode,
      GREATEST(1, LEAST(COALESCE(p_limit, 100), 200)) AS row_limit
  )
  SELECT
    p.tracking_number::text,
    p.pickup_date::text,
    p.consignee::text,
    p.phone_number::text,
    p.address::text,
    p.cod_amount::text
  FROM public.parcels AS p
  CROSS JOIN args AS a
  WHERE a.term IS NOT NULL
    AND (
      (
        a.mode = 'tracking'
        AND COALESCE(p.tracking_number::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode = 'name'
        AND COALESCE(p.consignee::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode = 'phone'
        AND a.digits <> ''
        AND (
          pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
            LIKE '%' || a.digits || '%'
          OR pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
            LIKE '%' || a.local_digits || '%'
        )
      )
      OR (
        a.mode = 'address'
        AND COALESCE(p.address::text, '') ILIKE '%' || a.term || '%'
      )
      OR (
        a.mode NOT IN ('tracking', 'name', 'phone', 'address')
        AND (
          COALESCE(p.tracking_number::text, '') ILIKE '%' || a.term || '%'
          OR COALESCE(p.consignee::text, '') ILIKE '%' || a.term || '%'
          OR COALESCE(p.address::text, '') ILIKE '%' || a.term || '%'
          OR (
            a.digits <> ''
            AND (
              pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
                LIKE '%' || a.digits || '%'
              OR pg_catalog.regexp_replace(COALESCE(p.phone_number::text, ''), '[^0-9]', '', 'g')
                LIKE '%' || a.local_digits || '%'
            )
          )
        )
      )
    )
  ORDER BY p.pickup_date DESC NULLS LAST, p.tracking_number
  LIMIT (SELECT row_limit FROM args);
$function$;

REVOKE ALL ON FUNCTION public.search_parcels_quick(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_parcels_quick(text, text, integer) TO service_role;

NOTIFY pgrst, 'reload schema';


-- ================================================================
-- SOURCE: SQL/📦2.สายงานเลขพัสดุและการแจ้งกลับลูกค้า/parcels/FUNCTION_parcel_drop_anon_insert.sql
-- ================================================================
grant usage on schema public to anon;
grant insert on table public.parcels to anon;

alter table public.parcels enable row level security;

drop policy if exists parcel_drop_anon_insert on public.parcels;

create policy parcel_drop_anon_insert
on public.parcels
for insert
to anon
with check (
  nullif(btrim(coalesce(tracking_number::text, '')), '') is not null
  and nullif(btrim(coalesce(consignee::text, '')), '') is not null
  and nullif(regexp_replace(coalesce(phone_number::text, ''), '[^0-9]', '', 'g'), '') is not null
  and nullif(btrim(coalesce(address::text, '')), '') is not null
);



-- กู้สิทธิ์เขียนสำหรับ Warp Drive / Parcel Drop
-- เว็บใช้ Supabase publishable/anon key และเรียก public.parcels.insert(...)
-- SQL นี้เปิดเฉพาะ INSERT ให้ anon ไม่เปิด SELECT/UPDATE/DELETE

alter table public.parcels enable row level security;

grant insert on table public.parcels to anon;

-- Identity/serial id ต้องใช้สิทธิ์ sequence ตอน INSERT โดยไม่ส่ง id เอง
 do $$
declare
  seq_name text;
begin
  select pg_get_serial_sequence('public.parcels', 'id') into seq_name;
  if seq_name is not null then
    execute format('grant usage, select on sequence %s to anon', seq_name);
  end if;
end $$;

drop policy if exists parcels_insert_from_parcel_drop on public.parcels;

create policy parcels_insert_from_parcel_drop
on public.parcels
for insert
to anon
with check (
  nullif(btrim(tracking_number), '') is not null
  and nullif(btrim(consignee), '') is not null
  and nullif(btrim(phone_number), '') is not null
  and nullif(btrim(address), '') is not null
);

commit;

-- ตั้งใจไม่ให้ anon อ่านข้อมูลกลับ:
-- revoke select, update, delete on table public.parcels from anon;
-- หากโปรเจกต์นี้เคยเปิดสิทธิ์เหล่านี้ไว้และต้องการปิด ให้รัน 3 บรรทัดด้านบนแยกต่างหาก



-- ================================================================
-- SOURCE: SQL/views/combined_views.sql
-- ================================================================
-- รวม Views ระบบ DARKSIDE ตามลำดับการพึ่งพาเดิม
-- ไม่ได้แก้ไขเงื่อนไขหรือลอจิกของแต่ละ View
BEGIN;

-- คีย์กลางสำหรับเชื่อม 3 อีเมล / 3 สาย / 3 โปรเจค
ALTER TABLE public."🗝️HERMES_ARCHIVE"
  ADD COLUMN IF NOT EXISTS chat_link_key text;
ALTER TABLE public."🌀SINGULARITY_xXx_EXCHANGE"
  ADD COLUMN IF NOT EXISTS chat_link_key text;

create view public."🌌MULTIVERSE_xXx_NEXUS"
with
  (security_invoker = true) as
select
  h.upsert_key,
  h.chat_link_key,
  h.bb_express_send_route,
  h.currentthreadtotalbills as "currentThreadTotalBills",
  h.duplicate_count_th,
  h.balloonnotice as "balloonNotice",
  h.sniperauthorclass as "sniperAuthorClass",
  h.facebook_name,
  h."threadId",
  h.time_th,
  h.customer_id,
  h.tracking_request_same_thai_date,
  h.tracking_request_route_hint,
  h.order_date,
  h.order_time,
  h.order_time_display,
  h.day_of_week,
  h.order_time_source,
  h.page_id,
  h.page_name,
  h.order_number,
  h.cod_amount,
  h.customer_name,
  h.phone,
  h.extracted_phone,
  h.phone_type,
  h.phone_status,
  h.phone_candidates,
  h.rejected_phone_candidates,
  h.address_display_packer,
  h.addressclean,
  h."finalAddress",
  h.short_address,
  h.district,
  h.amphoe,
  h.province,
  h.zipcode,
  h.order_source_type,
  h.audit_flags,
  h.chat_timeline,
  h.cod_check_status,
  h.shipping_carrier,
  h.assigned_agent,
  h.assigned_hashtag,
  h.original,
  h."orderItems",
  h.for_packer_st_display,
  h.sku,
  h.google_for_packer,
  h.manus_for_packer,
  h.final_order_qty,
  h.extracted_text_qty,
  h.qty_display_th,
  h."darksideBillDataComplete",
  h.bill_data_complete,
  h.darkside_completeness_status,
  h.darkside_missing_reasons,
  h.bill_data_reason,
  h.bill_signal_source,
  h.bill_quantity_is_blocker,
  h.route_reason_emoji,
  h.route_reason_color,
  h.route_reason_label,
  h.packer_obj,
  h.extracted_text_price,
  h.is_salty_gold,
  h.fibo_score,
  h.fibo_tier,
  h.fibo_badge,
  h.mathematically_price,
  h.final_order_price,
  h.is_vip,
  h.vip_tag,
  h.order_time_ms_reference,
  h.order_time_bkk_iso,
  h.order_time_thai_date,
  h.order_time_thai_clock,
  h.order_time_thai_label,
  h.order_time_contract_locked,
  h.tracking_request_48h,
  h.tracking_request_48h_event,
  h.node2_tracking_request_detected,
  h.node2_tracking_request_48h,
  h.node2_tracking_request_event,
  h.node2_tracking_request_route_hint,
  h.product_items_v5,
  h.product_map_sku_list,
  h.product_map_master_sku_list,
  h.order_fibo_product,
  h.packer_tag_display,
  h.final_product,
  h.final_display_for_packer,
  h.telegram_product_display,
  h.telegram_message,
  h.telegram_main_bill,
  h.telegram_copy_text,
  h.telegram_body,
  h.telegram_change_alert,
  h.telegram_change_alert as telegram_change_alert_web,
  h.telegram_message as telegram_message_web,
  h.customer_change_diff_json,
  h.customer_change_admin_footer,
  h.customer_change_admin_footer_text,
  h.customer_change_audit_group_key,
  h.customer_change_audit_is_current,
  h.customer_change_current_time,
  h.customer_change_current_upsert_key,
  h.customer_change_previous_time,
  h.customer_change_previous_upsert_key,
  h.pre_save_change_group_key,
  h.pre_save_change_selected,
  h.customer_address_current,
  h.customer_address_previous,
  h.customer_name_current,
  h.customer_name_previous,
  h.customer_phone_current,
  h.customer_phone_previous,
  h.customer_product_current,
  h.customer_product_previous,
  '🗝️HERMES_ARCHIVE'::text as source_table,
  pm_header.stock_notice,
  h.order_number_display,
  h.full_address,
  h.final_address_for_bill,
  h.address_fibo_selected_clean,
  h.is_ready_to_pack,
  h.send_eligible,
  h.telegram_bill_send_eligible,
  h.telegram_status,
  h.delivery_state,
  h.delivery_status,
  h.telegram_sent,
  h.telegram_sent_at,
  h.sent_at,
  h.life_status,
  h.status_color,
  h.routing_tag,
  h.product_mapping_status,
  h.mapping_status,
  h.telegram_message_for_send_final,
  h.customer_change_summary,
  h.raw_text,
  h.recipient_id,
  h.expected_cod,
  h.telegram_bill_header
from
  "🗝️HERMES_ARCHIVE" h
  left join lateral (
    select
      string_agg(
        distinct NULLIF(btrim(pm.stock_notice), ''::text),
        '
'::text
        order by
          (NULLIF(btrim(pm.stock_notice), ''::text))
      ) as stock_notice
    from
      "🛒product_master" pm
    where
      NULLIF(btrim(pm.master_sku), ''::text) is not null
      and NULLIF(btrim(pm.stock_notice), ''::text) is not null
      and (
        exists (
          select
            1
          from
            unnest(
              array[
                to_jsonb(h.*) ->> 'sku'::text,
                to_jsonb(h.*) ->> 'manus_for_packer'::text,
                to_jsonb(h.*) ->> 'google_for_packer'::text,
                to_jsonb(h.*) ->> 'final_product'::text,
                to_jsonb(h.*) ->> 'final_display_for_packer'::text,
                to_jsonb(h.*) ->> 'display_for_packer'::text,
                to_jsonb(h.*) ->> 'for_packer_st_display'::text,
                to_jsonb(h.*) ->> 'telegram_product_display'::text
              ]
            ) source_value (value)
            cross join lateral regexp_split_to_table(
              upper(COALESCE(source_value.value, ''::text)),
              '[^A-Z0-9_]+'::text
            ) sku_token (value)
          where
            sku_token.value = upper(btrim(pm.master_sku))
        )
      )
  ) pm_header on true
union all
select
  s.upsert_key,
  s.chat_link_key,
  s.bb_express_send_route,
  s."currentThreadTotalBills",
  s.duplicate_count_th,
  s.balloonnotice as "balloonNotice",
  s.sniperauthorclass as "sniperAuthorClass",
  s.facebook_name,
  s."threadId",
  s.time_th,
  s.customer_id,
  s.tracking_request_same_thai_date,
  s.tracking_request_route_hint,
  s.order_date,
  s.order_time,
  s.order_time_display,
  s.day_of_week,
  s.order_time_source,
  s.page_id,
  s.page_name,
  s.order_number,
  s.cod_amount,
  s.customer_name,
  s.phone,
  s.extracted_phone,
  s.phone_type,
  s.phone_status,
  s.phone_candidates,
  s.rejected_phone_candidates,
  s.address_display_packer,
  s.addressclean,
  s."finalAddress",
  s.short_address,
  s.district,
  s.amphoe,
  s.province,
  s.zipcode,
  s.order_source_type,
  s.audit_flags,
  s.chat_timeline,
  s.cod_check_status,
  s.shipping_carrier,
  s.assigned_agent,
  s.assigned_hashtag,
  s.original,
  s."orderItems",
  s.for_packer_st_display,
  s.sku,
  s.google_for_packer,
  s.manus_for_packer,
  s.final_order_qty,
  s.extracted_text_qty,
  s.qty_display_th,
  s."darksideBillDataComplete",
  s.bill_data_complete,
  s.darkside_completeness_status,
  s.darkside_missing_reasons,
  s.bill_data_reason,
  s.bill_signal_source,
  s.bill_quantity_is_blocker,
  s.route_reason_emoji,
  s.route_reason_color,
  s.route_reason_label,
  s.packer_obj,
  s.extracted_text_price,
  s.is_salty_gold,
  s.fibo_score,
  s.fibo_tier,
  s.fibo_badge,
  s.mathematically_price,
  s.final_order_price,
  s.is_vip,
  s.vip_tag,
  s.order_time_ms_reference,
  s.order_time_bkk_iso,
  s.order_time_thai_date,
  s.order_time_thai_clock,
  s.order_time_thai_label,
  s.order_time_contract_locked,
  s.tracking_request_48h,
  s.tracking_request_48h_event,
  s.node2_tracking_request_detected,
  s.node2_tracking_request_48h,
  s.node2_tracking_request_event,
  s.node2_tracking_request_route_hint,
  s.product_items_v5,
  s.product_map_sku_list,
  s.product_map_master_sku_list,
  s.order_fibo_product,
  s.packer_tag_display,
  s.final_product,
  s.final_display_for_packer,
  s.telegram_product_display,
  s.telegram_message,
  s.telegram_main_bill,
  s.telegram_copy_text,
  s.telegram_body,
  s.telegram_change_alert,
  s.telegram_change_alert as telegram_change_alert_web,
  s.telegram_message as telegram_message_web,
  s.customer_change_diff_json,
  s.customer_change_admin_footer,
  s.customer_change_admin_footer_text,
  s.customer_change_audit_group_key,
  s.customer_change_audit_is_current,
  s.customer_change_current_time,
  s.customer_change_current_upsert_key,
  s.customer_change_previous_time,
  s.customer_change_previous_upsert_key,
  s.pre_save_change_group_key,
  s.pre_save_change_selected,
  s.customer_address_current,
  s.customer_address_previous,
  s.customer_name_current,
  s.customer_name_previous,
  s.customer_phone_current,
  s.customer_phone_previous,
  s.customer_product_current,
  s.customer_product_previous,
  '🌀SINGULARITY_xXx_EXCHANGE'::text as source_table,
  pm_header.stock_notice,
  s.order_number_display,
  s.full_address,
  s.final_address_for_bill,
  s.address_fibo_selected_clean,
  s.is_ready_to_pack,
  s.send_eligible,
  s.telegram_bill_send_eligible,
  s.telegram_status,
  s.delivery_state,
  s.delivery_status,
  s.telegram_sent,
  s.telegram_sent_at,
  s.sent_at,
  s.life_status,
  s.status_color,
  s.routing_tag,
  s.product_mapping_status,
  s.mapping_status,
  s.telegram_message_for_send_final,
  s.customer_change_summary,
  s.raw_text,
  s.recipient_id,
  s.expected_cod,
  s.telegram_bill_header
from
  "🌀SINGULARITY_xXx_EXCHANGE" s
  left join lateral (
    select
      string_agg(
        distinct NULLIF(btrim(pm.stock_notice), ''::text),
        '
'::text
        order by
          (NULLIF(btrim(pm.stock_notice), ''::text))
      ) as stock_notice
    from
      "🛒product_master" pm
    where
      NULLIF(btrim(pm.master_sku), ''::text) is not null
      and NULLIF(btrim(pm.stock_notice), ''::text) is not null
      and (
        exists (
          select
            1
          from
            unnest(
              array[
                to_jsonb(s.*) ->> 'sku'::text,
                to_jsonb(s.*) ->> 'manus_for_packer'::text,
                to_jsonb(s.*) ->> 'google_for_packer'::text,
                to_jsonb(s.*) ->> 'final_product'::text,
                to_jsonb(s.*) ->> 'final_display_for_packer'::text,
                to_jsonb(s.*) ->> 'display_for_packer'::text,
                to_jsonb(s.*) ->> 'for_packer_st_display'::text,
                to_jsonb(s.*) ->> 'telegram_product_display'::text
              ]
            ) source_value (value)
            cross join lateral regexp_split_to_table(
              upper(COALESCE(source_value.value, ''::text)),
              '[^A-Z0-9_]+'::text
            ) sku_token (value)
          where
            sku_token.value = upper(btrim(pm.master_sku))
        )
      )
  ) pm_header on true;

  create view public."🛰️PIONEER_xXx_CAPSULE"
with
  (security_invoker = true) as
select
  upsert_key,
  chat_link_key,
  bb_express_send_route,
  "currentThreadTotalBills",
  duplicate_count_th,
  "balloonNotice",
  "sniperAuthorClass",
  facebook_name,
  "threadId",
  time_th,
  customer_id,
  tracking_request_same_thai_date,
  tracking_request_route_hint,
  order_date,
  order_time,
  order_time_display,
  day_of_week,
  order_time_source,
  page_id,
  page_name,
  order_number,
  cod_amount,
  customer_name,
  phone,
  extracted_phone,
  phone_type,
  phone_status,
  phone_candidates,
  rejected_phone_candidates,
  address_display_packer,
  address_fibo_selected_clean,
  addressclean,
  "finalAddress",
   full_address,
  short_address,
  district,
  amphoe,
  province,
  zipcode,
  order_source_type,
  audit_flags,
  chat_timeline,
  cod_check_status,
  shipping_carrier,
  assigned_agent,
  assigned_hashtag,
  original,
  "orderItems",
  for_packer_st_display,
  sku,
  google_for_packer,
  manus_for_packer,
  final_order_qty,
  extracted_text_qty,
  qty_display_th,
  "darksideBillDataComplete",
  bill_data_complete,
  darkside_completeness_status,
  darkside_missing_reasons,
  bill_data_reason,
  bill_signal_source,
  bill_quantity_is_blocker,
  route_reason_emoji,
  route_reason_color,
  route_reason_label,
  packer_obj,
  extracted_text_price,
  is_salty_gold,
  fibo_score,
  fibo_tier,
  fibo_badge,
  mathematically_price,
  final_order_price,
  is_vip,
  vip_tag,
  order_time_ms_reference,
  order_time_bkk_iso,
  order_time_thai_date,
  order_time_thai_clock,
  order_time_thai_label,
  order_time_contract_locked,
  tracking_request_48h,
  tracking_request_48h_event,
  node2_tracking_request_detected,
  node2_tracking_request_48h,
  node2_tracking_request_event,
  node2_tracking_request_route_hint,
  product_items_v5,
  product_map_sku_list,
  product_map_master_sku_list,
  order_fibo_product,
  packer_tag_display,
  final_product,
  final_display_for_packer,
  telegram_product_display,
  telegram_message,
  telegram_main_bill,
  telegram_copy_text,
  telegram_body,
  telegram_change_alert,
  customer_change_diff_json,
  customer_change_admin_footer,
  customer_change_admin_footer_text,
  customer_change_audit_group_key,
  customer_change_audit_is_current,
  customer_change_current_time,
  customer_change_current_upsert_key,
  customer_change_previous_time,
  customer_change_previous_upsert_key,
  pre_save_change_group_key,
  pre_save_change_selected,
  customer_address_current,
  customer_address_previous,
  customer_name_current,
  customer_name_previous,
  customer_phone_current,
  customer_phone_previous,
  customer_product_current,
  customer_product_previous,
  source_table,
  stock_notice,
  telegram_change_alert_web,
  telegram_message_web,
  order_number_display,
  final_address_for_bill,
  is_ready_to_pack,
  send_eligible,
  telegram_bill_send_eligible,
  telegram_status,
  delivery_state,
  delivery_status,
  telegram_sent,
  telegram_sent_at,
  sent_at,
  life_status,
  status_color,
  routing_tag,
  product_mapping_status,
  mapping_status,
  telegram_message_for_send_final,
  customer_change_summary,
  raw_text,
  recipient_id,
  expected_cod,
  telegram_bill_header
from
  "🌌MULTIVERSE_xXx_NEXUS" c
where
  (
    lower(btrim(COALESCE(telegram_sent, ''::text))) <> all (
      array['true'::text, 't'::text, '1'::text, 'yes'::text]
    )
  )
  and (
    upper(btrim(COALESCE(telegram_status, ''::text))) <> all (
      array[
          'SENT🔥'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  )
  and (
    upper(btrim(COALESCE(delivery_status, ''::text))) <> all (
      array[
             'SENT🔥'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  )
  and (
    upper(btrim(COALESCE(delivery_state, ''::text))) <> all (
      array[
           'SENT🔥'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  );

  create view public."🪐ANDROMEDA_xXx_SENT" as
select
  upsert_key,
  chat_link_key,
  bb_express_send_route,
  "currentThreadTotalBills",
  duplicate_count_th,
  "balloonNotice",
  "sniperAuthorClass",
  facebook_name,
  "threadId",
  time_th,
  customer_id,
  tracking_request_same_thai_date,
  tracking_request_route_hint,
  order_date,
  order_time,
  order_time_display,
  day_of_week,
  order_time_source,
  page_id,
  page_name,
  order_number,
  cod_amount,
  customer_name,
  phone,
  extracted_phone,
  phone_type,
  phone_status,
  phone_candidates,
  rejected_phone_candidates,
  address_display_packer,
  addressclean,
  "finalAddress",
    full_address,
  short_address,
  district,
  amphoe,
  province,
  zipcode,
  order_source_type,
  audit_flags,
  chat_timeline,
  cod_check_status,
  shipping_carrier,
  assigned_agent,
  assigned_hashtag,
  original,
  "orderItems",
  for_packer_st_display,
  sku,
  google_for_packer,
  manus_for_packer,
  final_order_qty,
  extracted_text_qty,
  qty_display_th,
  "darksideBillDataComplete",
  bill_data_complete,
  darkside_completeness_status,
  darkside_missing_reasons,
  bill_data_reason,
  bill_signal_source,
  bill_quantity_is_blocker,
  route_reason_emoji,
  route_reason_color,
  route_reason_label,
  packer_obj,
  extracted_text_price,
  is_salty_gold,
  fibo_score,
  fibo_tier,
  fibo_badge,
  mathematically_price,
  final_order_price,
  is_vip,
  vip_tag,
  order_time_ms_reference,
  order_time_bkk_iso,
  order_time_thai_date,
  order_time_thai_clock,
  order_time_thai_label,
  order_time_contract_locked,
  tracking_request_48h,
  tracking_request_48h_event,
  node2_tracking_request_detected,
  node2_tracking_request_48h,
  node2_tracking_request_event,
  node2_tracking_request_route_hint,
  product_items_v5,
  product_map_sku_list,
  product_map_master_sku_list,
  order_fibo_product,
  packer_tag_display,
  final_product,
  final_display_for_packer,
  telegram_product_display,
  telegram_message,
  telegram_main_bill,
  telegram_copy_text,
  telegram_body,
  telegram_change_alert,
  customer_change_diff_json,
  customer_change_admin_footer,
  customer_change_admin_footer_text,
  customer_change_audit_group_key,
  customer_change_audit_is_current,
  customer_change_current_time,
  customer_change_current_upsert_key,
  customer_change_previous_time,
  customer_change_previous_upsert_key,
  pre_save_change_group_key,
  pre_save_change_selected,
  customer_address_current,
  customer_address_previous,
  customer_name_current,
  customer_name_previous,
  customer_phone_current,
  customer_phone_previous,
  customer_product_current,
  customer_product_previous,
  source_table,
  stock_notice,
    telegram_change_alert_web,
  telegram_message_web
from
  "🛰️PIONEER_xXx_CAPSULE" c;
  create view public."🌟GENESIS_xXx_HISTORY"
with
  (security_invoker = true) as
select
  upsert_key,
  chat_link_key,
  bb_express_send_route,
  "currentThreadTotalBills",
  duplicate_count_th,
  "balloonNotice",
  "sniperAuthorClass",
  facebook_name,
  "threadId",
  time_th,
  customer_id,
  tracking_request_same_thai_date,
  tracking_request_route_hint,
  order_date,
  order_time,
  order_time_display,
  day_of_week,
  order_time_source,
  page_id,
  page_name,
  order_number,
  cod_amount,
  customer_name,
  phone,
  extracted_phone,
  phone_type,
  phone_status,
  phone_candidates,
  rejected_phone_candidates,
  address_display_packer,
  addressclean,
  "finalAddress",
  full_address,
  short_address,
  district,
  amphoe,
  province,
  zipcode,
  order_source_type,
  audit_flags,
  chat_timeline,
  cod_check_status,
  shipping_carrier,
  assigned_agent,
  assigned_hashtag,
  original,
  "orderItems",
  for_packer_st_display,
  sku,
  google_for_packer,
  manus_for_packer,
  final_order_qty,
  extracted_text_qty,
  qty_display_th,
  "darksideBillDataComplete",
  bill_data_complete,
  darkside_completeness_status,
  darkside_missing_reasons,
  bill_data_reason,
  bill_signal_source,
  bill_quantity_is_blocker,
  route_reason_emoji,
  route_reason_color,
  route_reason_label,
  packer_obj,
  extracted_text_price,
  is_salty_gold,
  fibo_score,
  fibo_tier,
  fibo_badge,
  mathematically_price,
  final_order_price,
  is_vip,
  vip_tag,
  order_time_ms_reference,
  order_time_bkk_iso,
  order_time_thai_date,
  order_time_thai_clock,
  order_time_thai_label,
  order_time_contract_locked,
  tracking_request_48h,
  tracking_request_48h_event,
  node2_tracking_request_detected,
  node2_tracking_request_48h,
  node2_tracking_request_event,
  node2_tracking_request_route_hint,
  product_items_v5,
  product_map_sku_list,
  product_map_master_sku_list,
  order_fibo_product,
  packer_tag_display,
  final_product,
  final_display_for_packer,
  telegram_product_display,
  telegram_message,
  telegram_main_bill,
  telegram_copy_text,
  telegram_body,
  telegram_change_alert,
  customer_change_diff_json,
  customer_change_admin_footer,
  customer_change_admin_footer_text,
  customer_change_audit_group_key,
  customer_change_audit_is_current,
  customer_change_current_time,
  customer_change_current_upsert_key,
  customer_change_previous_time,
  customer_change_previous_upsert_key,
  pre_save_change_group_key,
  pre_save_change_selected,
  customer_address_current,
  customer_address_previous,
  customer_name_current,
  customer_name_previous,
  customer_phone_current,
  customer_phone_previous,
  customer_product_current,
  customer_product_previous,
  source_table,
  stock_notice,
  order_number_display,
  final_address_for_bill,
  address_fibo_selected_clean,
  is_ready_to_pack,
  send_eligible,
  telegram_bill_send_eligible,
  telegram_status,
  delivery_state,
  delivery_status,
  telegram_sent,
  telegram_sent_at,
  sent_at,
  life_status,
  status_color,
  routing_tag,
  product_mapping_status,
  mapping_status,
  telegram_message_for_send_final,
  customer_change_summary,
  raw_text,
  recipient_id,
  expected_cod,
  telegram_bill_header
from
  "🌌MULTIVERSE_xXx_NEXUS" c
where
  (
    (
      lower(btrim(COALESCE(telegram_sent, ''::text))) = any (
        array['true'::text, 't'::text, '1'::text, 'yes'::text]
      )
    )
    or (
      upper(btrim(COALESCE(telegram_status, ''::text))) = any (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
    or (
      upper(btrim(COALESCE(delivery_status, ''::text))) = any (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
    or (
      upper(btrim(COALESCE(delivery_state, ''::text))) = any (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
  )
  and not (
    btrim(COALESCE(source_table, ''::text)) = '🌀SINGULARITY_xXx_EXCHANGE'::text
    and btrim(COALESCE(bb_express_send_route, ''::text)) = '🟠'::text
  );

  create view public."🔸PARADOX_xXx_EXCHANGE"
with
  (security_invoker = true) as
select
  upsert_key,
  chat_link_key,
  bb_express_send_route,
  "currentThreadTotalBills",
  duplicate_count_th,
  balloonnotice,
  sniperauthorclass,
  facebook_name,
  "threadId",
  time_th,
  customer_id,
  tracking_request_same_thai_date,
  tracking_request_route_hint,
  order_date,
  order_time,
  order_time_display,
  day_of_week,
  order_time_source,
  page_id,
  page_name,
  order_number,
  cod_amount,
  customer_name,
  phone,
  extracted_phone,
  phone_type,
  phone_status,
  phone_candidates,
  rejected_phone_candidates,
  address_display_packer,
  addressclean,
  "finalAddress",
  short_address,
  district,
  amphoe,
  province,
  zipcode,
  order_source_type,
  audit_flags,
  chat_timeline,
  cod_check_status,
  shipping_carrier,
  assigned_agent,
  assigned_hashtag,
  original,
  "orderItems",
  for_packer_st_display,
  sku,
  google_for_packer,
  manus_for_packer,
  final_order_qty,
  extracted_text_qty,
  qty_display_th,
  "darksideBillDataComplete",
  bill_data_complete,
  darkside_completeness_status,
  darkside_missing_reasons,
  bill_data_reason,
  bill_signal_source,
  bill_quantity_is_blocker,
  route_reason_emoji,
  route_reason_color,
  route_reason_label,
  packer_obj,
  extracted_text_price,
  is_salty_gold,
  fibo_score,
  fibo_tier,
  fibo_badge,
  mathematically_price,
  final_order_price,
  is_vip,
  vip_tag,
  order_time_ms_reference,
  order_time_bkk_iso,
  order_time_thai_date,
  order_time_thai_clock,
  order_time_thai_label,
  order_time_contract_locked,
  tracking_request_48h,
  tracking_request_48h_event,
  node2_tracking_request_detected,
  node2_tracking_request_48h,
  node2_tracking_request_event,
  node2_tracking_request_route_hint,
  order_hour,
  routing_tag,
  status_color,
  status_color_backup,
  routing_tag_backup,
  target_room,
  is_safety_white,
  order_emoji,
  life_status,
  ghost_column,
  order_number_display,
  time_slot,
  dispatch_target_date,
  time_slot_label,
  slot_two_layer_key,
  packer_tag_display,
  cluster_bill_count,
  cluster_position,
  is_latest_canonical,
  canonical_status,
  change_status,
  changed_fields,
  change_note_th,
  cluster_has_change,
  pair_route,
  pair_position,
  pair_group_size,
  pair_is_paired,
  node2_group_is_latest,
  node2_group_has_change,
  node2_bill_color_decision,
  ghost_reflected_to_bb,
  ghost_reflection_source,
  node2_ghost_old_order,
  node2_route_signal,
  node2_route_signal_only_for_ghost_red,
  full_address,
  final_address_for_bill,
  address_raw_source_line,
  address_selected_system,
  address_selected_field,
  address_customer_sender,
  address_fallback_used,
  address_fallback_level,
  address_selection_reason,
  address_validation_status,
  address_validation_complete,
  address_usable,
  address_capture_status,
  address_validation_issues,
  address_type,
  address_system_1_result,
  address_system_2_result,
  address_system_3_result,
  address_system_4_result,
  address_candidates_all,
  address_raw_retention,
  address_fibo_score,
  address_fibo_tier,
  address_fibo_badge,
  address_fibo_reason,
  address_fibo_usable,
  address_fibo_complete,
  address_fibo_landmark,
  address_fibo_issues,
  address_fibo_type,
  address_fibo_selected_clean,
  address_fibo_selected_source,
  address_fibo_cleaner,
  is_silent_whale,
  order_fibo_effective_price,
  order_fibo_product,
  order_fibo_engine_version,
  address_fibo_engine_version,
  address_cascade_engine_version,
  master_fibo_engine_version,
  order_fibo_untouched_by_address,
  address_fibo_untouched_by_order,
  order_captured,
  order_capture_status,
  product_quantity_calculation_disabled,
  product_items_v5,
  product_items_matched,
  product_items_unmatched,
  product_map_items,
  product_map_result,
  product_map_display,
  product_map_mapped_display,
  product_map_raw,
  product_map_primary,
  product_map_sku,
  product_map_source_line,
  product_map_count,
  product_map_mapped_count,
  product_map_unmapped_count,
  product_map_sku_list,
  product_map_master_sku_list,
  product_map_status,
  product_mapping_is_blocker,
  mapping_status,
  mapping_engine_version,
  master_sku,
  display_for_packer,
  final_display_for_packer,
  final_product,
  trusted_product,
  product_display_candidates,
  product_unmatched_raw,
  address_candidates,
  expected_cod,
  telegram_product_display,
  telegram_message,
  telegram_copy_text,
  bill_header_insert_status,
  pre_save_change_status,
  pre_save_change_reason,
  pre_save_change_group_key,
  pre_save_change_group_size,
  pre_save_change_pair_candidate_count,
  pre_save_change_is_pair,
  pre_save_change_selected,
  pre_save_change_winner_key,
  pre_save_change_score,
  pre_save_change_fields,
  pre_save_change_route_hint,
  pre_save_change_selection_source,
  pre_save_change_review_required,
  customer_change_audit_version,
  customer_change_audit_group_key,
  customer_change_audit_group_source,
  customer_change_audit_group_size,
  customer_change_audit_candidate_count,
  customer_change_audit_is_current,
  customer_change_audit_is_previous,
  customer_change_detected,
  customer_change_count,
  customer_change_fields,
  customer_change_type,
  customer_change_previous_upsert_key,
  customer_change_current_upsert_key,
  customer_change_previous_time,
  customer_change_current_time,
  customer_change_diff_json,
  customer_change_admin_footer,
  customer_change_admin_footer_text,
  customer_change_source_trace,
  history_bucket,
  history_route_required,
  is_current_candidate,
  superseded_by_upsert_key,
  customer_change_route_hint,
  customer_change_footer_route_decision,
  customer_change_footer_order_time_source,
  sniper_bill_type,
  sniper_badge,
  sniper_change_color,
  sniper_change_reason,
  sniper_is_new_bill,
  sniper_is_old_bill,
  sniper_change_detected,
  sniper_change_field_count,
  sniper_change_fields,
  routing_tag_before_change,
  status_color_before_change,
  routing_tag_backup_before_change,
  status_color_backup_before_change,
  history_route_status,
  history_route_key,
  switch3_route,
  four2_route_reason,
  four2_route_reason_label,
  four2_order_time_source,
  four2_selected_by,
  four2_change_fields,
  four2_change_count,
  four2_selected_for_send,
  four2_winner_key,
  send_eligible,
  telegram_bill_send_eligible,
  telegram_send_blocked,
  telegram_block_reason,
  is_ready_to_pack,
  should_send_to_packing,
  telegram_main_bill,
  telegram_message_for_send_final,
  telegram_message_with_change_audit,
  telegram_change_alert,
  telegram_body,
  pre_save_change_previous,
  pre_save_change_previous_key,
  pre_save_change_selected_order_time_display,
  pre_save_change_previous_order_time_display,
  customer_change_from_order_time_display,
  customer_change_to_order_time_display,
  audit_selected_order_time_display,
  audit_previous_order_time_display,
  audit_order_time_source,
  customer_change_summary,
  customer_product_change_detected,
  customer_product_change_label,
  customer_product_previous,
  customer_product_current,
  customer_color_change_detected,
  customer_color_previous,
  customer_color_current,
  customer_quantity_change_detected,
  customer_quantity_previous,
  customer_quantity_current,
  customer_carrier_change_detected,
  customer_carrier_previous,
  customer_carrier_current,
  customer_address_change_detected,
  customer_address_change_label,
  customer_address_previous,
  customer_address_current,
  customer_phone_change_detected,
  customer_phone_change_label,
  customer_phone_previous,
  customer_phone_current,
  customer_name_change_detected,
  customer_name_change_label,
  customer_name_previous,
  customer_name_current,
  customer_cod_change_detected,
  customer_cod_previous,
  customer_cod_current,
  customer_cod_change_amount,
  routing_tag_new_bill,
  status_color_new_bill,
  routing_tag_backup_new_bill,
  status_color_backup_new_bill,
  telegram_message_for_send_original,
  telegram_copy_text_with_change_audit,
  routing_tag_old_bill,
  status_color_old_bill,
  routing_tag_backup_old_bill,
  status_color_backup_old_bill,
  switch3_route_status,
  telegram_sent,
  telegram_status,
  delivery_state,
  delivery_status,
  sent_at,
  telegram_sent_at,
  product_mapping_status,
  product_mapping_pass,
  product_mapping_reason,
  telegram_bill_header,
  telegram_bill_body,
  currentthreadtotalbills,
  raw_text,
  should_should_to_packing,
  chat_age_hours,
  is_within_24h,
  can_send_standard,
  messaging_tag_required,
  message_id,
  tracking_check,
  pickup_date,
  tracking_number,
  consignee,
  phone_number,
  address,
  order_phone,
  recipient_id,
  facebook_tracking_status,
  facebook_tracking_sent_at,
  portal_key,
  recipient_name,
  page_message_time_th,
  customer_message_time_th,
  customer_latest_message,
  page_latest_message,
  latest_message,
  customer_time_val,
  page_time_val,
  send_facebook_route,
  "balloonNotice",
  is_backlog,
  branch_route,
  telegram_message_web,
  telegram_change_alert_web
from
  "🌀SINGULARITY_xXx_EXCHANGE" s
where
  btrim(COALESCE(bb_express_send_route, ''::text)) = '🟠'::text
  and (
    (
      lower(btrim(COALESCE(telegram_sent, ''::text))) = any (
        array['true'::text, 't'::text, '1'::text, 'yes'::text]
      )
    )
    or (
      upper(btrim(COALESCE(telegram_status, ''::text))) = any (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
    or (
      upper(btrim(COALESCE(delivery_status, ''::text))) = any (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
    or (
      upper(btrim(COALESCE(delivery_state, ''::text))) = any (
        array[
          '🔥SENT'::text,
          'SENT'::text,
          'DELIVERED'::text,
          'SENT_TO_TELEGRAM'::text
        ]
      )
    )
  );

COMMIT;


-- ================================================================
-- SOURCE: SQL/views/parcel_delivery_views_combined.sql
-- ================================================================
-- BB STORE ORDERS · Parcel Delivery Views
-- รวมจากไฟล์แนบ pasted_content_2.txt
-- ลำดับ dependency: SHADOW -> ROGUE -> VOID -> DEAD
-- คง logic ของ SQL เดิม ไม่ได้เพิ่มเงื่อนไขทางธุรกิจ

-- 1. SHADOW · จับคู่พัสดุกับออเดอร์
create view public."🔮SHADOW_xXx_RECALL" as
select
  p.id,
  m.portal_key,
  m.page_name,
  p.pickup_date,
  p.tracking_number,
  p.consignee,
  p.phone_number,
  p.address,
  p.cod_amount,
  p.delivery_status,
  p.sent_at,
  m.parcel_status_emoji,
  m.upsert_key
from
  parcels p
  join lateral (
    select
      ord.portal_key,
      ord.page_name,
      ord.parcel_status_emoji,
      ord.upsert_key
    from
      "🧿BB_xXx_ORDERCONTROL" ord
    where
      NULLIF(btrim(ord.portal_key), ''::text) is not null
      and (
        NULLIF(btrim(p.upsert_key), ''::text) is not null
        and btrim(ord.upsert_key) = btrim(p.upsert_key)
        or NULLIF(btrim(p.order_number), ''::text) is not null
        and NULLIF(btrim(ord.order_number), ''::text) is not null
        and btrim(ord.order_number) = btrim(p.order_number)
        or NULLIF(btrim(p.portal_key), ''::text) is not null
        and btrim(ord.portal_key) = btrim(p.portal_key)
        or regexp_replace(
          COALESCE(p.phone_number, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        ) <> ''::text
        and regexp_replace(
          COALESCE(ord.phone, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        ) = regexp_replace(
          COALESCE(p.phone_number, ''::text),
          '[^0-9]'::text,
          ''::text,
          'g'::text
        )
      )
    order by
      (
        case
          when NULLIF(btrim(p.upsert_key), ''::text) is not null
          and btrim(ord.upsert_key) = btrim(p.upsert_key) then 0
          when NULLIF(btrim(p.order_number), ''::text) is not null
          and NULLIF(btrim(ord.order_number), ''::text) is not null
          and btrim(ord.order_number) = btrim(p.order_number) then 1
          when NULLIF(btrim(p.portal_key), ''::text) is not null
          and btrim(ord.portal_key) = btrim(p.portal_key) then 2
          else 3
        end
      ),
      (
        case
          when NULLIF(btrim(p.pickup_date), ''::text) is not null
          and ord.order_time is not null then abs(
            EXTRACT(
              epoch
              from
                p.pickup_date::timestamp with time zone - ord.order_time
            )
          )
          else null::numeric
        end
      ),
      ord.order_time desc nulls last,
      ord.updated_at desc nulls last,
      ord.upsert_key
    limit
      1
  ) m on true
where
  p.pickup_date::timestamp without time zone >= (now() - '2 days'::interval)
  and (
    p.delivery_status is null
    or btrim(p.delivery_status) = ''::text
    or upper(btrim(p.delivery_status)) = 'PENDING'::text
  )
  and (
    upper(btrim(COALESCE(p.delivery_status, ''::text))) <> all (
      array[
        'SENT'::text,
        'DELIVERED'::text,
        '🔥SENT'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  );

  -- 2. ROGUE · คิวพัสดุรอส่งเลข
create view public."🦅ROGUE_xXx_SHIPPINGz" as
select
  pcl.tracking_number,
  pcl.phone_number as matched_phone,
  COALESCE(
    NULLIF(btrim(ord.customer_name), ''::text),
    NULLIF(btrim(ord.facebook_name), ''::text)
  ) as recipient_name,
  pcl.address as parcel_address,
  ord.sku,
  ord.cod_amount,
  ord.upsert_key,
  ord.page_id,
  ord."threadId",
  ord.customer_id,
  ord.message_id,
  jsonb_build_object('id', ord.message_id) as m,
  ord.shipping_carrier,
  ord.facebook_tracking_status,
  ord.order_number,
  ord.order_number_display,
  ord.order_time_display,
  pcl.id as parcel_row_id,
  pcl.pickup_date,
  pcl.delivery_status,
  pcl.sent_at,
  ord.page_name,
  ord.portal_key,
  ord.facebook_name,
  ord.customer_name,
  ord.phone,
  ord.extracted_phone,
  ord.order_date,
  ord.order_time,
  ord.time_th,
  ord.address_display_packer,
  ord.addressclean,
  ord.district,
  ord.amphoe,
  ord.province,
  ord.zipcode,
  ord.manus_for_packer,
  ord.telegram_copy_text,
  ord.delivery_state,
  ord.delivery_status as order_delivery_status,
  ord.carton_count,
  ord.created_at,
  ord.updated_at,
  ord.assigned_agent,
  ord.facebook_tracking_sent_at,
  ord.target_room,
  ord.chat_age_hours,
  ord.is_within_24h,
  ord.can_send_standard,
  ord.messaging_tag_required,
  ord.customer_latest_message,
  ord.customer_message_time_th,
  ord.page_latest_message,
  ord.page_message_time_th,
  ord.send_facebook_route,
  ord.parcel_status_emoji,
  ord.facebook_tracking_message,
  ord.drakside_tracking_message,
  ord.dedupe_key
from
  "🔮SHADOW_xXx_RECALL" pcl
  join "🧿BB_xXx_ORDERCONTROL" ord on ord.upsert_key = pcl.upsert_key
where
  NULLIF(btrim(pcl.tracking_number), ''::text) is not null
  and (
    ord.facebook_tracking_status is null
    or (
      upper(btrim(ord.facebook_tracking_status)) <> all (
        array[
          'SENT'::text,
          'DELIVERED'::text,
          '🔥SENT'::text,
          'SENT_TO_TELEGRAM'::text,
          'SUCCESS'::text,
          'COMPLETED'::text
        ]
      )
    )
  )
  and not (
    COALESCE(ord.page_latest_message, ''::text) ~~* '%แจ้งเลขพัสดุจัดส่ง%'::text
    or COALESCE(ord.page_latest_message, ''::text) ~~* '%เลขพัสดุจะเริ่มเช็คสถานะ%'::text
  );


  -- 3. VOID · ประตูส่งเลขไป Facebook
create view public."⛩️VOID_xXx_GATEWAYz" as
select
  pulse.upsert_key,
  pulse.page_id,
  pulse."threadId",
  pulse.customer_id,
  pulse.page_name,
  pulse.portal_key,
  pulse.facebook_name,
  pulse.customer_name,
  pulse.phone,
  pulse.extracted_phone,
  pulse.order_number,
  pulse.order_number_display,
  pulse.order_date,
  pulse.order_time,
  pulse.order_time_display,
  pulse.time_th,
  pulse.cod_amount,
  pulse.shipping_carrier,
  pulse.address_display_packer,
  pulse.addressclean,
  pulse.district,
  pulse.amphoe,
  pulse.province,
  pulse.zipcode,
  pulse.sku,
  pulse.manus_for_packer,
  pulse.telegram_copy_text,
  pulse.delivery_state,
  pulse.delivery_status,
  pulse.sent_at,
  pulse.order_delivery_status,
  pulse.carton_count,
  pulse.created_at,
  pulse.updated_at,
  pulse.assigned_agent,
  pulse.chat_age_hours,
  pulse.is_within_24h,
  pulse.can_send_standard,
  pulse.messaging_tag_required,
  pulse.facebook_tracking_status,
  pulse.facebook_tracking_sent_at,
  pulse.message_id,
  pulse.target_room,
  pulse.customer_latest_message,
  pulse.customer_message_time_th,
  pulse.page_latest_message,
  pulse.page_message_time_th,
  pulse.parcel_row_id,
  pulse.tracking_number,
  pulse.matched_phone,
  pulse.pickup_date,
  pulse.parcel_address,
  pulse.m,
  pulse.recipient_name,
  pulse.send_facebook_route,
  pulse.parcel_status_emoji,
  pulse.facebook_tracking_message,
  pulse.drakside_tracking_message,
  page_map.access_token
from
  "🦅ROGUE_xXx_SHIPPINGz" pulse
  left join page_tokens_vault page_map on page_map.page_id = pulse.page_id
where
  NULLIF(btrim(pulse.tracking_number), ''::text) is not null
  and NULLIF(btrim(page_map.access_token), ''::text) is not null
  and (
    upper(
      btrim(
        COALESCE(pulse.facebook_tracking_status, ''::text)
      )
    ) <> all (
      array[
        '🔥SENT'::text,
        'SENT'::text,
        'SUCCESS'::text,
        'COMPLETED'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  )
  and (
    upper(btrim(COALESCE(pulse.delivery_status, ''::text))) <> all (
      array[
        '🔥SENT'::text,
        'SENT'::text,
        'SUCCESS'::text,
        'COMPLETED'::text,
        'DELIVERED'::text,
        'SENT_TO_TELEGRAM'::text
      ]
    )
  );


  -- 4. DEAD · ประวัติส่งเลขแล้ว
create view public."📓DEAD_xXx_NOTE" as
select
  parcel.id as parcel_row_id,
  parcel.tracking_number,
  parcel.consignee as flash_consignee,
  parcel.phone_number as matched_phone,
  parcel.pickup_date,
  parcel.cod_amount as parcel_cod_amount,
  parcel.address as parcel_address,
  parcel.delivery_status,
  parcel.sent_at,
  ord.upsert_key,
  ord.page_id,
  ord."threadId",
  ord.customer_id,
  ord.page_name,
  ord.portal_key,
  ord.facebook_name,
  ord.customer_name,
  ord.phone,
  ord.extracted_phone,
  ord.order_number,
  ord.order_number_display,
  ord.order_date,
  ord.order_time,
  ord.order_time_display,
  ord.time_th,
  ord.cod_amount,
  ord.shipping_carrier,
  ord.address_display_packer,
  ord.addressclean,
  ord.district,
  ord.amphoe,
  ord.province,
  ord.zipcode,
  ord.sku,
  ord.manus_for_packer,
  ord.telegram_copy_text,
  ord.carton_count,
  ord.created_at,
  ord.updated_at,
  ord.assigned_agent,
  ord.chat_age_hours,
  ord.is_within_24h,
  ord.can_send_standard,
  ord.messaging_tag_required,
  ord.facebook_tracking_status,
  ord.facebook_tracking_sent_at,
  ord.delivery_state,
  ord.delivery_status as order_delivery_status,
  ord.message_id,
  ord.send_facebook_route,
  ord.target_room,
  ord.parcel_status_emoji,
  ord.facebook_tracking_message
from
  parcels parcel
  left join "🧿BB_xXx_ORDERCONTROL" ord on regexp_replace(
    COALESCE(ord.phone, ''::text),
    '[^0-9]'::text,
    ''::text,
    'g'::text
  ) = regexp_replace(
    COALESCE(parcel.phone_number, ''::text),
    '[^0-9]'::text,
    ''::text,
    'g'::text
  )
where
  NULLIF(btrim(parcel.tracking_number), ''::text) is not null
  and (
    (
      upper(btrim(COALESCE(parcel.delivery_status, ''::text))) = any (
        array[
          '🔥SENT'::text,
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
    or (
      upper(
        btrim(COALESCE(ord.facebook_tracking_status, ''::text))
      ) = any (
        array[
          '🔥SENT'::text,
          'SENT'::text,
          'SUCCESS'::text,
          'COMPLETED'::text,
          'DELIVERED'::text
        ]
      )
    )
  );


-- ================================================================
-- SOURCE: SQL/migrations/ST_PROJECT_PERMISSIONS_ALL.sql
-- ================================================================
-- BB STORE · PROJECT PERMISSIONS BUNDLE
-- ================================================================
-- ใช้กับ Supabase project ของ ST เท่านั้น
-- ไฟล์นี้จัดสิทธิ์ ไม่สร้าง/ลบข้อมูล และไม่เปิด PUBLIC แบบกว้าง
--
-- หลักการ:
--   1) เว็บ server / n8n ใช้ service_role เป็นทางหลัก
--   2) anon/authenticated อ่านได้เฉพาะข้อมูลที่ browser จำเป็นต้องอ่านเอง
--   3) โต๊ะออเดอร์หลักไม่เปิดให้ anon/authenticated อ่านหรือเขียน
--   4) Chat credentials และ Chat tables ต้องอยู่ใน Chat project เดียวกับ
--      CHAT_SUPABASE_URL ที่ server ใช้งานจริง
--   5) รันด้วยเจ้าของฐานข้อมูลหรือ role ที่มีสิทธิ์ GRANT
--
-- ไม่รวม:
--   - การสร้าง schema/table/view/function
--   - การแก้ order logic, parser, n8n workflow
--   - การเปิดสิทธิ์ให้ PUBLIC
--   - การคืนห้องหรือเปิดสิทธิ์ให้ ANDROMEDA โดยอัตโนมัติ
-- ================================================================

-- ------------------------------------------------
-- 00 · Common schema access
-- ------------------------------------------------
grant usage on schema public to service_role;

-- ------------------------------------------------
-- 01 · ROOM 01 · Order Core
-- ------------------------------------------------
-- HERMES เป็นโต๊ะหลัก: server/n8n อ่าน สร้าง และแก้สถานะ/ข้อมูลตาม route
-- ไม่มี DELETE เพื่อไม่ลบหลักฐานออเดอร์

grant select, insert, update
on table public."🗝️HERMES_ARCHIVE"
to service_role;

-- ตารางหลักที่ระบบแก้ไขจาก Order Editor ใช้ service_role เท่านั้น
-- (ถ้ามีอยู่ใน project นี้จึงค่อย grant; ช่วยให้ไฟล์ใช้ซ้ำได้โดยไม่พัง)
do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    '🌀SINGULARITY_xXx_EXCHANGE',
    '💀THANATOS_xXx_DEATH_NOTE'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 02 · ROOM 01 · Order views used by the web
-- ------------------------------------------------
-- อ่านได้จาก server เท่านั้น; ไม่เปิด anon/authenticated

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    '🌌MULTIVERSE_xXx_NEXUS',
    '🛰️PIONEER_xXx_CAPSULE',
    '🌟GENESIS_xXx_HISTORY',
    '🔸PARADOX_xXx_EXCHANGE',
    '🔮SHADOW_xXx_RECALL',
    '🦅ROGUE_xXx_SHIPPINGz',
    '⛩️VOID_xXx_GATEWAYz',
    '📓DEAD_xXx_NOTE'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ตั้งใจไม่ grant ให้ 🪐ANDROMEDA_xXx_SENT เพราะไม่ใช่ active ST reader
-- และไม่ควรเปิด permission เพื่อกลบ deployment/bundle เก่า

-- ------------------------------------------------
-- 03 · ROOM 02 · Page catalog
-- ------------------------------------------------
-- เว็บอ่าน page catalog และ server จัดการสถานะ/การตั้งค่าเพจ
-- access_token ไม่ถูกเปิดให้ browser role

do $$
begin
  if to_regclass('public."🌈MILKY_WAY_xXx_TOKEN _PAGE"') is not null then
    execute 'grant select, insert, update, delete on table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" to service_role';
  end if;
end
$$;

-- คอลัมน์ compatibility ที่ server ใช้สำหรับสถานะ web
-- รันได้เฉพาะเมื่อ table มีอยู่จริง
 do $$
begin
  if to_regclass('public."🌈MILKY_WAY_xXx_TOKEN _PAGE"') is not null then
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists status_web text not null default ''ON''';
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists created_at timestamptz not null default now()';
    execute 'alter table public."🌈MILKY_WAY_xXx_TOKEN _PAGE" add column if not exists updated_at timestamptz not null default now()';
  end if;
end
$$;

-- ------------------------------------------------
-- 04 · ROOM 04 · Product Master
-- ------------------------------------------------
-- Browser ต้องอ่าน catalog ผ่าน anon/publishable key
-- จำกัดเฉพาะ status = ACTIVE และไม่ให้ browser เขียน/ลบสินค้า

grant usage on schema public to anon, authenticated;
grant select on table public."🛒product_master" to anon, authenticated;

alter table public."🛒product_master" enable row level security;

drop policy if exists product_master_web_read_active
on public."🛒product_master";

create policy product_master_web_read_active
on public."🛒product_master"
for select
to anon, authenticated
using (status = 'ACTIVE');

-- service_role ใช้สำหรับงาน admin/server โดยไม่เปิด write ให้ browser
 grant select, insert, update on table public."🛒product_master" to service_role;

-- ------------------------------------------------
-- 05 · Address master / read-only browser data
-- ------------------------------------------------
-- ใช้ autocomplete ที่อยู่เท่านั้น ไม่มีข้อมูลลูกค้า

do $$
begin
  if to_regclass('public.thailand_address_master') is not null then
    execute 'grant select on table public.thailand_address_master to anon, authenticated';
  end if;
end
$$;

-- ------------------------------------------------
-- 06 · Parcel data
-- ------------------------------------------------
-- Server อ่าน/เขียน parcel mapping; browser ไม่อ่านโต๊ะดิบโดยตรง

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'parcels',
    '🧿BB_xXx_ORDERCONTROL'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 07 · ROOM 02 · Chat source tables
-- ------------------------------------------------
-- ใช้เมื่อ tables เหล่านี้อยู่ใน Supabase project เดียวกับ server Chat config.
-- Chat อ่านจาก Cust/Pg โดยใช้ page_id + thread_id
-- ไม่เปิด anon/authenticated ให้เห็นข้อมูลแชท

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'Cust_Chat⭐BINARY_xXx_STAR',
    'Pg_Chat⭐BINARY_xXx_STAR',
    '🏴‍☠️SIRIUS_xXx_CRASH'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- Page token/config ต้องให้ server จัดการได้ แต่ไม่เปิด access_token ให้ browser

do $$
begin
  if to_regclass('public.line_channels') is not null then
    execute 'grant select, insert, update, delete on table public.line_channels to service_role';
  end if;
  if to_regclass('public.line_messages') is not null then
    execute 'grant select, insert on table public.line_messages to service_role';
  end if;
end
$$;

-- ------------------------------------------------
-- 08 · UI customization / public read-only assets
-- ------------------------------------------------
-- เฉพาะข้อมูลธีม/กรอบ/เสียงที่ถูกเปิดใช้งาน; write อยู่ใน server/admin policy เดิม

do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'app_themes',
    'app_chat_frames',
    'app_sounds',
    'app_customization_selections'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select on table public.%I to anon, authenticated', relation_name);
    end if;
  end loop;
end
$$;

-- Server/admin จัดการ customization ได้โดยไม่เปิด write ให้ browser
 do $$
declare
  relation_name text;
begin
  foreach relation_name in array array[
    'app_themes',
    'app_chat_frames',
    'app_sounds',
    'app_customization_selections'
  ] loop
    if to_regclass(format('public.%I', relation_name)) is not null then
      execute format('grant select, insert, update, delete on table public.%I to service_role', relation_name);
    end if;
  end loop;
end
$$;

-- ------------------------------------------------
-- 09 · Verification report
-- ------------------------------------------------
commit;

notify pgrst, 'reload schema';

-- ตรวจสิทธิ์สำคัญหลังรัน
select
  grantee,
  table_schema,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and (
    table_name in (
      '🗝️HERMES_ARCHIVE',
      '🛒product_master',
      '🌈MILKY_WAY_xXx_TOKEN _PAGE',
      'Cust_Chat⭐BINARY_xXx_STAR',
      'Pg_Chat⭐BINARY_xXx_STAR'
    )
    or table_name in ('thailand_address_master', 'parcels')
  )
  and grantee in ('service_role', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- ตรวจ RLS ของ product_master
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = '🛒product_master';


-- ================================================================
-- END OF ST RECOVERY BUNDLE
-- ================================================================
notify pgrst, 'reload schema';
