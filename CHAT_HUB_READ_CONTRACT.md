# ChatHub Read Contract — Protocol v5

เอกสารนี้กำหนดเส้นทางอ่านของ ChatHub: อ่านจาก `public."🌠BINARY_xXx_MATRIX"` เพียงวิวเดียว ซึ่งเป็นจุดรวมข้อมูลจากตารางข้อความลูกค้าและข้อความเพจตามที่ระบบต้นทางเปิดเผย หน้าเว็บมีหน้าที่แสดงสัญญาณที่ได้รับ ไม่สร้างข้อมูลสถานะหรือเติมค่าทดแทนเอง

## กติกาการอ่าน

1. อ่าน Matrix ด้วย `select=*` เพื่อรับทุกคอลัมน์ที่วิวเปิดเผย ห้าม hardcode รายชื่อคอลัมน์เสริมใน query เพราะฟิลด์ที่ไม่มีในแต่ละแหล่งต้องไม่ทำให้การอ่านทั้งห้องล้ม
2. ใช้ `page_id` และ `thread_id` เพื่อกรองห้อง และใช้ `chat_link_key` เป็นคีย์บริบทเมื่อมีค่า
3. ใช้ `speaker` แยกฝั่งข้อความ และ `message_text` เป็นข้อความของแต่ละ bubble; ไม่ใช้ `message_raw` หรือฟิลด์สรุปล่าสุดมาแทนข้อความรายข้อความ
4. `customer_latest_message` กับ `page_latest_message` เป็นข้อมูลสรุปแยกคนละฝั่ง ห้ามรวมเป็นค่าเดียวหรือใช้แทน `message_text`
5. ใช้ `occurred_at` จัดลำดับ/จำกัดช่วงข้อมูล; เวลาอ่านง่ายใช้ `time_th` หรือ `message_time_display` เมื่อมี
6. ฟิลด์เสริม เช่น `delivery_status`, `parcel_status_emoji`, `time_slot_label` เป็นสัญญาณ display-only: ถ้ามีค่าให้แสดงตามค่าจริง ถ้าไม่มีหรือว่างให้ไม่แสดง ห้ามสร้าง default, สถานะรอ, join, backfill หรือยัดฟิลด์ลงตารางลูกค้าเพื่อให้ป้ายขึ้น
7. การเปลี่ยน query นี้ไม่เปลี่ยนการคำนวณ COD, Order DNA, workflow/n8n, การส่งข้อความ หรือการตั้งค่าการ polling
8. เรียก Supabase ผ่าน protected server tRPC ด้วย Chat credentials ของโปรเจกต์ Chat เท่านั้น; ห้าม fallback ไป Main, Tracking หรือ Parcel
9. Page token อ่านแยกจาก `🌈MILKY_WAY_xXx_TOKEN _PAGE` ฝั่ง server เท่านั้น ห้ามนำ token vault เข้ามาใน Matrix response หรือส่ง access token ไป browser

## Protocol v5 change

ยกเลิก explicit column list สำหรับ Matrix read แล้วใช้ `select=*`. การมีหรือไม่มีคอลัมน์เสริมจึงไม่เป็นเงื่อนไขให้ query หลักผ่าน/ไม่ผ่าน; UI อ่านค่าที่ Matrix ส่งมา และซ่อนป้ายเมื่อไม่มีค่าจริง.
