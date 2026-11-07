BB_STORE_ORDERS · n8n BILL AUDIT V1

การใช้งานไฟล์
1. แตก ZIP นี้ไว้ที่โฟลเดอร์รากของ repo BB_STORE_ORDERS และเลือก Replace/Overwrite เมื่อ Windows ถาม
2. ไฟล์ใน client/ ให้ Order Control และ Telegram อ่านคำเตือนจาก balloonnotice ที่ n8n สร้างเท่านั้น ไม่มีการตรวจซ้ำฝั่งเว็บ
3. เปิดไฟล์ n8n-live/👑BB_ORDER_SYSTEMS/👑BB_ORDER_09.js แล้วคัดลอกโค้ดทั้งไฟล์ไปแทนโค้ดเดิมใน Code node BILL BUILDER1 / BB_ORDER_09 จากนั้น Save และทดสอบ workflow

พฤติกรรมที่เปลี่ยน
- ตรวจค่าที่ BILL BUILDER1 พิมพ์จริงในบิล: customer_name, extracted_phone, ที่อยู่ที่ bestAddress เลือก, รายการสินค้า, COD, completeness signal, Bot Review/cancelled item และ 20 จังหวัด/รหัสพื้นที่เสี่ยงที่ผู้ใช้ระบุ
- เพิ่ม/รีเฟรชข้อความ ⚠️ BILL_AUDIT: ในฟิลด์เดิม balloonnotice เท่านั้น; ไม่มีคอลัมน์ฐานข้อมูลใหม่
- คำเตือนเป็นข้อมูลให้คนตรวจ ไม่เปลี่ยน bb_express_send_route, send_eligible, telegram_send_blocked หรือข้อความ telegram_message และไม่ใส่คำเตือนลงบิลที่ส่งถึงลูกค้า
- ถ้าข้อมูลถูกแก้แล้วรัน node ซ้ำ marker BILL_AUDIT เก่าจะถูกล้างเมื่อไม่พบคำเตือนอีก
- ไม่มี duplicate check เพิ่ม ตามที่แจ้งว่า 1 บิล / 1 วัน / 1 คน และ upstream คัดออเดอร์ไว้แล้ว

หลังทับไฟล์เว็บ
จาก PowerShell ที่โฟลเดอร์ repo:
  corepack pnpm build
  git status --short
  git add client/src/lib/orderWarnings.ts client/src/lib/canonical.ts client/src/pages/OrderControl.tsx client/src/lib/TelegramDeliveryRoom.tsx n8n-live/👑BB_ORDER_SYSTEMS/👑BB_ORDER_09.js
  git commit -m "⭐⭐⭐V1"

ถ้า corepack ใช้ไม่ได้ หรือยังไม่มี Node.js ให้ข้าม build ในเครื่องได้ เพราะได้ตรวจ build ผ่านใน Sandbox แล้ว; หลัง commit/push ให้ Render build ตามปกติ

หมายเหตุ: การคัดลอกไฟล์ n8n ลง repo ไม่ได้อัปเดต instance n8n โดยอัตโนมัติ ต้องวางโค้ดใน Code node แล้ว Save/Activate ตาม workflow ของคุณก่อน
