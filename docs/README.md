# BB direct-table read patch

**ฐานที่แพตช์นี้ตรงกับ:** `5638e3da1fd52188f253bd816b2117a66bf972f4`

แพตช์ปรับเฉพาะฝั่ง BB ใน 3 ไฟล์:

- `client/src/lib/canonical.ts` — หน้า Orders และ Telegram อ่านจาก `public.bb_orders` โดยตรงด้วยรายการคอลัมน์ที่จำเป็น แทนการอ่านผ่าน central views; ใช้ `for_packer_bb_display` เป็นฟิลด์สินค้าเดียว
- `client/src/pages/OrderControl.tsx` — นำช่องสินค้า fallback ออก และโหลดหลักฐานแชทเฉพาะออเดอร์ที่เลือกหรือเมื่อกด export
- `client/src/pages/TelegramDeliveryRoom.tsx` — ใช้ direct Telegram query และโหลดหลักฐานแชทเฉพาะรายการที่เปิดดู

## ขอบเขตความปลอดภัย

- ไม่แก้หรือเขียน SQL/migration
- ไม่ลบ ไม่ bulk-update และไม่ย้ายแถวออเดอร์
- ไม่แตะ ST และไม่ cross-join BB/ST
- อัปเดตสถานะส่งเกิดเฉพาะเมื่อผู้ใช้สั่งใน Telegram Room ผ่าน logic เดิม; แพตช์นี้เปลี่ยนเฉพาะทางอ่าน
- การคงสถานะ `SENT` ข้าม upsert ยังต้องอาศัย trigger/migration ฝั่งฐานข้อมูลที่ deploy อยู่แล้ว

## ใช้งาน

ถ้า repo อยู่ที่ commit ฐานข้างต้น ใช้ไฟล์ `BB_DIRECT_SOURCE.patch`:

```bash
git apply BB_DIRECT_SOURCE.patch
```

หรือแตก ZIP แล้ววาง 3 ไฟล์ตาม path ที่อยู่ใน ZIP ทับไฟล์เดิม โดยตรวจ diff ก่อน commit/push

## ตรวจสอบ

- `pnpm test`: ผ่าน 11 tests; 2 live/credential tests ถูก skip ตามค่าเริ่มต้น
- `pnpm build`: ผ่าน
- `pnpm check`: ยังล้มจาก 2 TypeScript errors ที่มีอยู่แล้วในไฟล์อื่นของ commit นี้ (`DashboardLayout.tsx` เปรียบเทียบ Camp=`BB` กับ `ST`; `ParcelMapping.tsx` มี ST ใน map ที่ประกาศ `Record<"BB", string>`). ไม่มี error ใหม่จากไฟล์ที่แพตช์
- ยังไม่ได้ deploy หรือ push และไม่มีการเรียก API/ฐานข้อมูลจริงในงานนี้
