# วิธีใส่ไฟล์ BB Store

1. แตก ZIP แล้วเข้าโฟลเดอร์ `BB_STORE_ORDERS_UPDATE`
2. คัดลอกโฟลเดอร์/ไฟล์ข้างในไปทับที่ root ของ repository บน GitHub
3. ลบไฟล์ตาม `DELETE_FILES_TH.txt` ด้วย เพราะการอัปโหลด ZIP ไม่ลบไฟล์เก่าให้อัตโนมัติ
4. เปิด Supabase โปรเจกต์ Tracking & Messenger แล้วรัน `sql/bb-close-job-history.sql` หนึ่งครั้ง
5. ที่ `/secret-gallery` ใส่ Main Order URL + Anon/Publishable Key และ Tracking URL + Anon/Publishable Key แยกกัน

อย่าใส่ service-role, secret, Page Token หรือ Gateway Token ในหน้าเว็บ

ถ้าจะให้ server ส่งแชท/อ่าน token ได้เต็มที่ ให้ตั้ง Environment ใน Render แยกเป็น `ORDER_SUPABASE_URL`, `ORDER_SUPABASE_SERVICE_ROLE_KEY`, `TRACKING_SUPABASE_URL`, `TRACKING_SUPABASE_SERVICE_ROLE_KEY` (ถ้ายังไม่ตั้ง จะลองใช้ `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` เดิมเป็นทางสำรอง)

ไม่มีการเพิ่ม n8n node ในชุดนี้
