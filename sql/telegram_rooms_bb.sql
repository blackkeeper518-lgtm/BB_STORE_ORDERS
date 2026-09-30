-- TELEGRAM ROOMS · BB
-- คงชื่อ public.bb_orders_sent_history เดิม
-- รันใน Supabase ของ BB เท่านั้น

-- BB: เติมคอลัมน์สำหรับหน้าเว็บในตารางประวัติเดิม
-- =========================================================
ALTER TABLE public.bb_orders_sent_history
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS telegram_message_id text,
  ADD COLUMN IF NOT EXISTS telegram_message_text text,
  ADD COLUMN IF NOT EXISTS telegram_room text DEFAULT 'BB_SENT_HISTORY',
  ADD COLUMN IF NOT EXISTS queue_status text DEFAULT 'SENT',
  ADD COLUMN IF NOT EXISTS order_day_color_emoji text,
  ADD COLUMN IF NOT EXISTS time_slot_label text,
  ADD COLUMN IF NOT EXISTS ghost_column text,
  ADD COLUMN IF NOT EXISTS status_color text,
  ADD COLUMN IF NOT EXISTS routing_tag text;

CREATE OR REPLACE VIEW public.vw_bb_telegram_web_queue AS
SELECT o.*,
  'BB_SEND'::text AS telegram_room,
  'QUEUE'::text AS queue_status
FROM public.bb_orders o
WHERE lower(COALESCE(o.telegram_sent, 'false')) NOT IN
  ('true','t','1','sent','delivered','sent_to_telegram','ไปแล้วไปลับ')
  AND upper(COALESCE(o.telegram_status, '')) NOT IN ('SENT','DELIVERED','SENT_TO_TELEGRAM')
  AND upper(COALESCE(o.delivery_state, '')) NOT IN ('SENT','DELIVERED');

CREATE OR REPLACE VIEW public.vw_bb_telegram_web_history AS
SELECT
  h.id AS history_id,
  h.order_key AS upsert_key,
  h.order_number,
  h.sent_at,
  h.recalled_at,
  h.recall_count,
  h.delivery_status,
  h.telegram_chat_id,
  h.telegram_message_id,
  h.telegram_message_text,
  h.telegram_room,
  h.queue_status,
  h.order_day_color_emoji,
  h.time_slot_label,
  h.ghost_column,
  h.status_color,
  h.routing_tag,
  h.snapshot
FROM public.bb_orders_sent_history h;


-- ตรวจจำนวนห้อง BB
SELECT 'BB_SEND' AS room, COUNT(*) AS rows FROM public.vw_bb_telegram_web_queue
UNION ALL
SELECT 'BB_SENT_HISTORY', COUNT(*) FROM public.vw_bb_telegram_web_history;
