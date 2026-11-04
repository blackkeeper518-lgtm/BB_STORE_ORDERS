-- BB ONLY · REMOVE LEGACY TELEGRAM WARNING MARKERS
-- Run in BB Supabase only.

UPDATE public.bb_orders
SET telegram_warning_label = NULL,
    telegram_warning_text = NULL,
    telegram_warning_level = NULL
WHERE concat_ws(' ',
  telegram_warning_label,
  telegram_warning_text,
  telegram_warning_level,
  alert_title,
  alert_text,
  warn_text,
  alert_reason
) ~ '(🌻|✅[[:space:]]*ข้อมูลครบ|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)';

-- ตรวจว่าป้ายเก่าถูกล้างแล้ว
SELECT upsert_key, order_number, telegram_warning_label, telegram_warning_text, telegram_warning_level
FROM public.bb_orders
WHERE concat_ws(' ', telegram_warning_label, telegram_warning_text, telegram_warning_level)
      ~ '(🌻|ข้อมูลครบ|ครบหมด|พร้อมยิงแฟลช)';
