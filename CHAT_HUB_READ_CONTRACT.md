# ChatHub Read Contract — Protocol v6

เอกสารนี้กำหนดเส้นทางอ่านของ ChatHub: อ่านจากตารางต้นทางสองฝั่งโดยตรง คือ `public."Cust_Chat⭐BINARY_xXx_STAR"` (ข้อความลูกค้า) และ `public."Pg_Chat⭐BINARY_xXx_STAR"` (ข้อความเพจ) แล้วรวมเป็นห้องด้วย `page_id + thread_id` โดยไม่ใช้ชื่อหรือข้อมูลจากบิลมาแทนข้อมูล Facebook

## กติกาการอ่าน

1. อ่านทั้งสองตารางด้วย `select=*` และติด `_source_table` ให้ทุกแถว เพื่อคงต้นทางจริง
2. ใช้ `page_id` และ `thread_id` เป็นคีย์ห้อง; แถวที่ขาดคีย์ใดคีย์หนึ่งจะไม่สร้างเป็นห้องว่าง
3. ใช้ `speaker` แยกฝั่งข้อความ; ถ้าไม่มีค่าให้ใช้ `_source_table` เป็นค่าเริ่มต้น (`customer` หรือ `page`)
4. ใช้ `message_text` เป็นข้อความของแต่ละ bubble; ไม่ใช้ `message_raw` หรือฟิลด์สรุปล่าสุดมาแทน
5. ชื่อบนป้ายห้องใช้ `facebook_name` จาก Facebook API เท่านั้น ห้ามใช้ `customer_name`, `recipient_name` หรือชื่อในบิลเป็น fallback
6. `customer_latest_message` กับ `page_latest_message` เป็นข้อมูลสรุปแยกคนละฝั่ง ห้ามรวมเป็นค่าเดียวหรือใช้แทน `message_text`
7. ใช้ `occurred_at` จัดลำดับ/จำกัดช่วงข้อมูล; เวลาอ่านง่ายใช้ `time_th` หรือ `message_time_display` เมื่อมี
8. ฟิลด์เสริม เช่น `delivery_status`, `parcel_status_emoji`, `time_slot_label` เป็น display-only: ถ้ามีค่าให้แสดงตามจริง ถ้าไม่มีให้ซ่อน ห้ามสร้าง default, join หรือ backfill
9. การเปลี่ยน query นี้ไม่เปลี่ยนการคำนวณ COD, Order DNA, workflow/n8n, การส่งข้อความ หรือ polling
10. เรียก Supabase ผ่าน protected server tRPC ด้วย Chat credentials เท่านั้น; ห้าม fallback ไป Main, Tracking หรือ Parcel
11. Page token อ่านแยกจาก `🌈MILKY_WAY_xXx_TOKEN _PAGE` ฝั่ง server เท่านั้น ห้ามส่ง access token ไป browser

`🌠BINARY_xXx_MATRIX` ยังเก็บไว้เป็นวัตถุฐานข้อมูล/เครื่องมือตรวจสอบได้ แต่ไม่ใช่เส้นอ่านหลักของ ChatHub ใน protocol นี้
