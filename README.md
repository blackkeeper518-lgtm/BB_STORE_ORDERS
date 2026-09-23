# BB Stock Room Patch

แพ็กเกจนี้เป็นแพตช์เฉพาะหน้า `StockRoom.tsx` ของ `BB_STORE_ORDERS`

สิ่งที่แก้:

- เอาข้อความอธิบาย `product_master / inventory / Alias` ใต้หัวเรื่องออก
- เอาปุ่มลัดไปห้องแมปสินค้าออก
- คงตารางสินค้า, SKU, Display Master, ราคากลาง, คงเหลือ, สถานะ และปุ่มมีของ/ไม่มีของไว้เหมือนเดิม
- ปุ่มสถานะเขียนกลับตาราง `inventory` จริงผ่าน logic เดิมของ BB

วิธีใช้:

1. แตก ZIP
2. อัปโหลด `client/src/pages/StockRoom.tsx` ทับไฟล์เดิมในรีโพ BB
3. ใช้ลิงก์:
   `https://github.com/blackkeeper518-lgtm/BB_STORE_ORDERS/upload/main`
4. Commit เช่น `Clean BB stock room header`
