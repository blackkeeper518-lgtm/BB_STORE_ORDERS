-- FIX BB TELEGRAM HISTORY ROOM
-- รันใน Supabase ของ BB เท่านั้น
-- ปลอดภัย: เพิ่มเฉพาะคอลัมน์ที่ยังไม่มี แล้วสร้างวิวประวัติใหม่

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

SELECT 'BB_SENT_HISTORY' AS room, COUNT(*) AS rows
FROM public.vw_bb_telegram_web_history;
