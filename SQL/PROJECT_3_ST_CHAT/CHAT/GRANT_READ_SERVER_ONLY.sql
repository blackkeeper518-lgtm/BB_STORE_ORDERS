-- ST_CHAT · READ ACCESS FOR BB STORE WEB (SERVER-ONLY)
-- ใช้กับโปรเจกต์แชทที่เว็บอ่านผ่าน server-backed client
-- ไม่เปิด anon/authenticated เพราะจะเปิดข้อมูลลูกค้าทั้งฐานต่อสาธารณะ
-- ไม่แตะ page token และไม่ให้ role เว็บเขียนข้อมูล

begin;

-- ให้ server role อ่าน schema และข้อมูลแชทที่เว็บต้องใช้
-- service_role เป็น role ฝั่ง server เท่านั้น ห้ามนำ key ไปไว้ใน browser

grant usage on schema public to service_role;

grant select on table
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR"
to service_role;

grant select on table
  public."🌓VAGABOND_xXx_DISMISS"
to service_role;

-- อ่านรายชื่อเพจ/สถานะได้ แต่ไม่ grant access_token ให้ browser
-- ตารางนี้ให้ server ใช้เท่านั้น และควรอ่านเฉพาะคอลัมน์ที่จำเป็นใน query

grant select on table
  public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
to service_role;

-- ยืนยันว่า public roles ไม่มีสิทธิ์เขียนแชท
revoke insert, update, delete, references, trigger
on table
  public."Cust_Chat⭐BINARY_xXx_STAR",
  public."Pg_Chat⭐BINARY_xXx_STAR",
  public."🌓VAGABOND_xXx_DISMISS",
  public."🌈MILKY_WAY_xXx_TOKEN _PAGE"
from anon, authenticated;

commit;

-- สำคัญ:
-- 1) ไม่ต้อง GRANT SELECT ให้ anon/authenticated สำหรับตารางแชท
-- 2) เว็บต้องเรียก /api/trpc หรือ server relay ที่ใช้ CHAT_SUPABASE_SERVICE_ROLE_KEY
-- 3) ห้าม select access_token ส่งกลับ client
-- 4) ถ้าเว็บยังเปิดห้องไม่ได้หลังรันชุดนี้ ให้ตรวจ project status/quota
--    และตรวจว่า CHAT_SUPABASE_URL ชี้ฐานเดียวกับที่รัน SQL
