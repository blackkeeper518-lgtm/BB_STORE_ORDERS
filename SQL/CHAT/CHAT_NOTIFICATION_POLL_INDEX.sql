-- BB_CHAT · index สำหรับ room-list query ที่เรียงตาม occurred_at และ row ID
-- รันใน Supabase โปรเจกต์ BB_CHAT ที่มีตาราง Cust_Chat
-- ไม่ลบ/แก้ข้อมูลเดิม; notification delta ใช้ message_row_id primary key อยู่แล้ว

create index if not exists "Cust_Chat⭐BINARY_xXx_STAR_occurred_at_row_idx"
  on public."Cust_Chat⭐BINARY_xXx_STAR" (occurred_at, message_row_id);

create index if not exists "Pg_Chat⭐BINARY_xXx_STAR_occurred_at_row_idx"
  on public."Pg_Chat⭐BINARY_xXx_STAR" (occurred_at, message_row_id);
