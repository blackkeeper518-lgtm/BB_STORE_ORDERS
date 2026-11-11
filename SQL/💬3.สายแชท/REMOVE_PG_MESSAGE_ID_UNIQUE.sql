-- แก้ 23505 ที่ Pg_Chat writer โดยถอดเฉพาะ unique index ซ้ำซ้อนบน message_id
-- ไม่มีการลบหรือแก้แถวข้อมูล; ux_binary_pg_dedupe_key และตัวกรอง upstream ยังคงทำงาน
-- ตรวจว่าคีย์ที่ node ใช้ใน on_conflict=dedupe_key มี unique index ก่อนเปลี่ยน schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_index AS i
    JOIN pg_class AS idx ON idx.oid = i.indexrelid
    JOIN pg_class AS tbl ON tbl.oid = i.indrelid
    JOIN pg_namespace AS ns ON ns.oid = tbl.relnamespace
    WHERE ns.nspname = 'public'
      AND tbl.relname = 'Pg_Chat⭐BINARY_xXx_STAR'
      AND idx.relname = 'ux_binary_pg_dedupe_key'
      AND i.indisunique
  ) THEN
    RAISE EXCEPTION
      'ไม่พบ unique index ux_binary_pg_dedupe_key บน Pg_Chat; ยังไม่ถอด ux_pg_chat_message_id';
  END IF;
END;
$$;

DROP INDEX IF EXISTS public.ux_pg_chat_message_id;
