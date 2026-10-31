# DK DRAKSIDE — ParcelMapping Packet

แพ็กนี้จัดตามลำดับการวางจริงในโปรเจกต์ `BB_STORE_ORDERS`

## ลำดับวางไฟล์

### 1) Backend ก่อน

นำไฟล์นี้ไปแทนที่ไฟล์เดิม:

```text
01-server/supabase.ts
→ server/supabase.ts
```

```text
01-server/routers.ts
→ server/routers.ts
```

Backend จะเพิ่ม tRPC endpoint:

```text
parcels.mappingQueue
```

อ่านข้อมูลจาก:

```text
🦅ROGUE_xXx_SHIPPINGz
📓DEAD_xXx_NOTE
```

และไม่ส่ง `access_token` ไปหน้าเว็บ

### 2) หน้าเว็บทีหลัง

นำไฟล์นี้ไปแทนที่ไฟล์เดิม:

```text
02-client/ParcelMapping.tsx
→ client/src/pages/ParcelMapping.tsx
```

หน้าใหม่จะเป็น:

```text
PARCEL RADAR
├── ทั้งหมด
├── 🟢 พร้อมส่ง
├── 🟡 เกิน 24 ชม.
├── 🔴 เกิน 48 ชม.
├── 🔥 ส่งแล้ว
├── ORDER INSPECTOR
└── MESSAGE PREVIEW
```

### 3) ไฟล์ patch รวม

ถ้าต้องการใช้ patch แทนการคัดลอกไฟล์ ให้ใช้:

```text
03-patch/PARCEL-MAPPING.patch
```

รันจาก root repository:

```bash
git apply 03-patch/PARCEL-MAPPING.patch
```

## ปุ่มที่เชื่อมไว้แล้ว

```text
เปิด WarpDrive โยนไฟล์
https://warpdrivetracking.vercel.app/

เว็บเช็กเลขลูกค้า
https://bbstorefullv-1.vercel.app/

เปิด FLASH
https://www.flashexpress.co.th/fle/tracking
```

## ข้อควรระวัง

- ห้ามนำ `access_token` ไปใส่ใน React/client
- ห้ามเปิดปุ่มส่ง Messenger ตรงจากหน้า ParcelMapping
- การส่งจริงยังให้ n8n ผ่าน `⛩️VOID_xXx_GATEWAYz` ทำงาน
- `delivery_status = '🔥SENT'` ต้องเกิดหลังส่งสำเร็จเท่านั้น
- ต้อง deploy backend พร้อม frontend เพราะหน้าเว็บเรียก `parcels.mappingQueue`

## ตรวจหลังวางไฟล์

```bash
pnpm run build
pnpm run check
```

ถ้า `pnpm run check` เจอ error ใน `OrderHistory.tsx` เดิมที่เรียก `query.data?.total` ให้แยกจากแพ็กนี้ เพราะไม่เกี่ยวกับ ParcelMapping.
