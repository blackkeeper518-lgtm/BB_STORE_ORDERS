# Command Center Logic ฉบับปัจจุบัน: ห้องกลางและการส่ง Telegram

## สถานะของเอกสารเดิม

เอกสารเดิมที่กำหนดให้ใช้ `telegram_body.text` จาก n8n เป็นข้อความส่งหลัก **ไม่ใช่กติกาปัจจุบันแล้ว** เพราะข้อความดิบจาก n8n บางรายการมีสินค้าไม่ครบ SKU ถูกตัดเหลือรายการแรก หรือจำนวนหลายรายการถูกทำให้เป็นค่าเดียว ห้องกลางจึงต้องสร้างข้อความส่งจากข้อมูลที่ตรวจสอบได้ โดยยังเก็บข้อความดิบไว้สำหรับตรวจย้อนหลังเสมอ

## แหล่งข้อมูลหลัก

BB และ ST ต้องแยกกันเด็ดขาด ทั้งฐานข้อมูล View ตารางคิว และการส่ง Telegram ห้ามใช้ข้อมูลข้ามค่าย

สำหรับรายการสินค้า ลำดับความน่าเชื่อถือปัจจุบันคือ:

```text
single_cleaned_products
→ clean_text ก้อนสรุปออเดอร์จริง
→ raw_text
→ Chat Timeline เฉพาะข้อความยืนยันล่าสุด
```

`single_cleaned_products` เป็นข้อความสินค้าที่ตัดมาจาก `clean_text` และเป็นแหล่งหลักสำหรับจับชื่อสินค้าและจำนวนรายบรรทัด ต้องรักษาข้อความเดิมไว้ ไม่ลบ newline และไม่ใช้ฟิวแต่งที่ถูกสร้างภายหลังมาทับก่อนการแมป

`clean_text` ต้องเก็บทั้งก้อนโดยไม่แก้ไข เพราะใช้เป็นหลักฐานตรวจสอบ เมื่อมี `รายการสินค้า:` ให้ดึงเฉพาะส่วนรายการสินค้าจากก้อนนี้ ไม่เอาชื่อ ที่อยู่ หรือโทรศัพท์มาปนกับสินค้า

ฟิว `telegram_message` และ `telegram_body.text` เป็นข้อมูลดิบจาก n8n ใช้ตรวจย้อนหลังเท่านั้น ไม่ใช่แหล่งหลักสำหรับส่งจริงเมื่อมีการสร้างห้องกลางฉบับใหม่

## กติกาสินค้าและ SKU

ระบบต้องอ่านสินค้าเป็นรายบรรทัด แล้วแมปทีละรายการ:

```text
ซีวอสเขียว 1
เซียร่าเขียว 2
```

ต้องได้:

```text
SEVIOS_GREEN → 1
SIERRA_GREEN → 2
```

และแสดงผล:

```text
🟩 SEVIOS_GREEN(ซีวอสเขียว) 1 คอต
🟩 SIERRA_GREEN(เซียร์ร่าเขียว) 2 คอต
```

ห้ามใช้ SKU รายการแรกเป็นตัวแทนทั้งบิล ห้ามใช้จำนวนรายการแรกกับทุก SKU และห้ามลบ newline ด้วย `.replace(/[\r\n]+/g, " ")`

การแมปต้องรักษา:

```text
sku = SKU ทุกบรรทัด คั่นด้วย newline
extracted_qty = จำนวนทุกบรรทัด คั่นด้วย newline
product_lines = สินค้าแต่งหล่อครบทุกบรรทัด
```

`product_for_delivery` ไม่ใช่แหล่งความจริง หากถูกประกอบจากฟิวหลายชั้น ต้องใช้ `n8n_product_display` ที่สร้างจากแหล่งสินค้าอันดับต้นเท่านั้น

## กติกาจำนวน

จำนวนรวมระดับออเดอร์ให้เชื่อค่าเดียว:

```text
total_quantity
```

ห้ามคำนวณยอดรวมใหม่จาก `quantity`, `qty`, `extracted_qty`, `master_qty_display`, `master_extracted_qty` หรือการนับจำนวนสินค้า

อย่างไรก็ตาม `total_quantity` เป็นจำนวนรวมของออเดอร์ ไม่ใช่จำนวนของแต่ละสินค้า จำนวนรายบรรทัดต้องอ่านจาก `single_cleaned_products` หรือส่วนรายการสินค้าใน `clean_text` แล้วเก็บเป็น newline

```text
total_quantity = จำนวนรวมของบิล
extracted_qty = จำนวนรายบรรทัด
```

`master_qty_display` และ `master_extracted_qty` ใช้ตรวจเทียบได้ แต่ห้ามให้ Node แต่งหล่อใช้สองฟิวนี้ทับจำนวนรายบรรทัด

## กติกาเวลา

Node แรกต้องสร้างฟิวดังนี้:

```text
order_time_source = FACEBOOK_MESSAGE_CREATED_TIME
order_time = เวลา UTC จาก Facebook
order_time_display = เวลาไทยสำหรับแสดงผล
```

การตัดรอบใช้ `order_time` จาก Facebook เป็นหลัก ไม่ใช้เวลาที่บันทึกเข้า DB หรือ `created_at` เป็นตัวหลัก

การแสดงผลใช้:

```text
order_time_display
```

การคัดรอบ 14:00 ใช้ `order_time` แปลงเป็น Asia/Bangkok แล้วจึงเปรียบเทียบช่วงเวลา

## กติกาที่อยู่และข้อมูลบิล

ที่อยู่ให้เลือกจากข้อมูลเต็มตามลำดับสำรอง โดยไม่ตัดส่วนสำคัญ:

```text
address_display_packer
→ addressclean
→ full_address
→ address_display_primary
→ final_address_for_bill
→ short_address + district + amphoe + province + zipcode
```

COD ใช้ `cod_amount` ค่าเดียวเท่านั้น ไม่รวมยอดจากหลายฟิว

ฟิว `raw_text_with_phone` และ `display_for_ku` ใช้เป็นข้อมูลสำรองสำหรับตรวจ/คัดลอก ไม่ใช่แหล่งหลักในการแมปสินค้า เพราะมีชื่อ ที่อยู่ และโทรศัพท์รวมอยู่ด้วย

## กติกา Header และข้อความส่ง

หัวบิลยังคงรูปแบบเดิม:

```html
🚀 <b>[บิลสมบูรณ์ - 🎯ORDER_SNIPER_X]</b>
```

สามารถเก็บหัวที่แต่งแล้วใน:

```text
dressed_bill_header
```

แต่ไม่แก้ `telegram_message` ดิบจาก n8n

ข้อความส่งจริงสร้างเป็น:

```text
telegram_message_dynamic
```

โดยประกอบจาก:

```text
order_time_display
order_number_display
page_name
facebook_name
customer_name
extracted_phone
address_for_delivery
cod_amount
n8n_product_display
```

ถ้าไม่พบสินค้า ให้เก็บออเดอร์ไว้และแสดง:

```text
🕵️ สินค้าหายตัวเท่ๆ
```

ห้ามเดาสินค้าจากชื่อหรือที่อยู่ และห้ามทิ้งออเดอร์

## ห้องกลาง BB

ห้องกลาง BB ต้องดึงจาก:

```sql
vw_bb_orders_all_v2
```

แล้วค่อยสร้าง View คิว:

```text
vw_bb_telegram_delivery_source_fast
vw_bb_telegram_delivery_queue_fast
vw_bb_telegram_delivery_today_fast
vw_bb_telegram_delivery_yesterday_after_14_fast
```

ต้องเก็บข้อมูลดิบทั้งแถวไว้ใน:

```text
source_order_row
```

เพื่อให้แต่งหล่อภายหลังได้โดยไม่เสียข้อมูลต้นฉบับ

## ห้องกลาง ST

ST ใช้โครงสร้างเดียวกัน แต่ต้องใช้เฉพาะ:

```text
vw_st_orders_all_v2
vw_st_telegram_...
```

ห้ามใช้ View ตาราง หรือ product master ของ BB ร่วมกับ ST

## สถานะการส่ง

ก่อนส่ง:

```text
telegram_sent = false
```

ส่งสำเร็จจาก Webhook เท่านั้นจึงบันทึก:

```text
telegram_sent = true
telegram_status = SENT
```

ส่งไม่สำเร็จต้องไม่เปลี่ยนสถานะ และออเดอร์ต้องอยู่ในคิวต่อ

ถ้าไม่มี `chat_id` จริง หรือยังเป็น:

```text
REPLACE_WITH_TELEGRAM_CHAT_ID
```

ห้ามยิง Webhook และห้ามบันทึก SENT

## ลำดับการทำงานฉบับเดียว

```text
Facebook message
→ Node แรกสร้าง clean_text และ single_cleaned_products
→ BB_ORDERS_MAP แมป SKU/จำนวนทีละบรรทัด
→ BB_MASTER เติมข้อมูล master โดยไม่ทับจำนวน
→ vw_bb_orders_all_v2
→ ห้องกลางแต่งหล่อ
→ telegram_message_dynamic
→ ห้องคิว Telegram
→ Webhook ส่งจริง
→ สำเร็จแล้วจึง mark SENT
```

หลักจำง่าย:

```text
ข้อมูลดิบเก็บไว้
สินค้าอ่านจาก single_cleaned_products
จำนวนรวมเชื่อ total_quantity
จำนวนรายบรรทัดอ่านจากรายการสินค้า
เวลาเชื่อ Facebook order_time
ข้อความส่งจริงใช้ telegram_message_dynamic
BB และ ST แยกกันตลอด
```
