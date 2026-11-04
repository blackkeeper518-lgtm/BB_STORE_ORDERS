แพตช์ห้อง Telegram Delivery · 03/11/2026

วิธีวาง: แตก ZIP แล้วเข้าโฟลเดอร์ BB_STORE_ORDERS_rooms_patch_2026-11-03_latest จากนั้นวางทับไฟล์ตาม path ใน repository

ไฟล์หน้าที่ใช้งานจริงคือ client/src/pages/TelegramDeliveryRoom.tsx (route /telegram-delivery) — ZIP นี้ไม่ใส่ไฟล์ซ้ำ/เก่าที่ client/src/lib/TelegramDeliveryRoom.tsx

สิ่งที่แก้: เอาป้าย “ใหม่สุดอยู่บน” ออก, เพิ่มปุ่มดูเฉพาะบิลมีเตือนพร้อมจำนวนบิลและรายละเอียดเตือน, เอากล่องกฎ/ข้อความอธิบายยาวออก, และให้คิวรีเฟรชทุก 30 วินาที

หลังอัปขึ้น GitHub ให้รอ Render deploy สำเร็จ แล้ว hard refresh หน้าเว็บ (Ctrl+Shift+R)