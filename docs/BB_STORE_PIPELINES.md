# BB STORE · ผังสายงานหลัก

**แหล่งอ้างอิง:** ผังที่เจ้าของระบบให้ไว้เมื่อ 2026-11-02  
**ข้อสำคัญ:** ใช้ชื่อ table/view ตามจริง รวม emoji และตัวพิมพ์เล็ก-ใหญ่ ห้ามสลับสองสายงานนี้

## ขอบเขตโปรเจกต์ Supabase

สองสายงานอยู่คนละอีเมลและคนละ Supabase project จึงห้ามเอารายชื่อตารางของโปรเจกต์หนึ่งไปตัดสินว่าอีกโปรเจกต์มีตารางเก่า

- **Main Order Pipeline** ใช้โปรเจกต์หลักตามผังด้านล่าง
- **Tracking & Messenger Pipeline** ใช้โปรเจกต์พัสดุ ตาม schema ที่เจ้าของส่งจาก Supabase/Gist; ตารางแกนคือ `parcels`, `🧿BB_xXx_ORDERCONTROL`, `page_tokens_vault`, `chat_customer_messages` และ `chat_page_messages`; views คือ `🔮SHADOW_xXx_RECALL`, `🦅ROGUE_xXx_SHIPPINGz`, `⛩️VOID_xXx_GATEWAYz`, `📓DEAD_xXx_NOTE`
- การเชื่อมข้อมูลข้ามโปรเจกต์ทำ SQL join ข้ามกันตรง ๆ ไม่ได้ ต้องมีจุดเชื่อมที่ตั้งใจทำไว้ ห้ามย้าย Token หรือเดา project URL ใน client

รายชื่อ relation ใน Gist ที่ได้รับวันที่ 2026-11-02 เป็นของ **Tracking & Messenger project** เท่านั้น และใช้เป็นหลักฐาน schema ปัจจุบันของโปรเจกต์นั้น

## 1. สายออเดอร์หลัก (Main Order Pipeline)

สายรับออเดอร์ แยกตามสี ดึงข้อมูลสินค้า/หัวบิล จัดคิวแพ็ก และส่งแจ้งเตือน Telegram

```text
[table 🌍 GALACTIC_GATEWAY_TOKEN] (ปล่อย Token ให้ n8n)
                  │
                  ▼
          [รับออเดอร์แยกตามสี]
           ├── ⚪ 🟦 ──► [table 🗝️ HERMES_ARCHIVE]
           └── 🟨 🟠 ──► [table 🌀 SINGULARITY_xXx_EXCHANGE]
                  │
                  ▼
     [view 🌌 MULTIVERSE_xXx_NEXUS]
       รวม ⚪🟦🟨🟠 + join หัวบิลจาก [table 🛒 product_master]
                  │
                  ▼
     [view 🛰️ PIONEER_xXx_CAPSULE] (คิวออเดอร์เตรียมแพ็ก)
                  │
                  ▼
       [view 🪐 ANDROMEDA_xXx_SENT] ──► ส่งข้อมูลเข้า Telegram
                  │                         ส่งแล้วออกจากคิวส่ง
                  ▼
       [view 🌟 GENESIS_xXx_HISTORY] (log ออเดอร์ที่จบสถานะ)
                  ▲
                  │ ตรวจทวน
       [table 💀 THANATOS_xXx_DEATH_NOTE] (ออเดอร์สีดำ/บอททวน)
```

### หน้าที่

- `🌍 GALACTIC_GATEWAY_TOKEN` — ด่านปล่อย Token ให้ n8n ใช้ทำ automation
- `🗝️ HERMES_ARCHIVE` — ออเดอร์ปกติสีขาว ⚪ และน้ำเงิน 🟦
- `🌀 SINGULARITY_xXx_EXCHANGE` — ออเดอร์เคลม/เปลี่ยนของ สีเหลือง 🟨 และส้ม 🟠
- `💀 THANATOS_xXx_DEATH_NOTE` — ตารางหลักของออเดอร์สีดำ ⚫ สำหรับบอทตรวจทวน
- `🌌 MULTIVERSE_xXx_NEXUS` — รวมออเดอร์ ⚪🟦🟨🟠 และ join หัวบิลจาก `🛒 product_master`
- `🛰️ PIONEER_xXx_CAPSULE` — คิวเตรียมแพ็กออเดอร์ทุกสี
- `🪐 ANDROMEDA_xXx_SENT` — วิวส่งข้อมูล Telegram; เมื่อส่งแล้วรายการออกจากวิวส่ง
- `🌟 GENESIS_xXx_HISTORY` — log สถานะและประวัติออเดอร์ที่จบแล้ว

### Mapping ห้องเว็บที่ตกลงใช้ตอนนี้

- **Order Control:** อ่าน `🗝️HERMES_ARCHIVE` ชั่วคราว โดยเลือกคอลัมน์ที่มีอยู่จริงและจำเป็นกับบิล/ลูกค้า/เวลา/สินค้า/COD/สถานะ
- **Telegram:** อ่าน `🌌MULTIVERSE_xXx_NEXUS`
- **ประวัติเปลี่ยนของ:** ใช้ `🌀SINGULARITY_xXx_EXCHANGE`; หน้าปัจจุบันคงไว้ก่อนและค่อยปรับชื่อ/หน้าจอภายหลัง
- **ประวัติปิดงาน/ยกเลิก/สั่งแล้วไม่รับ:** อ่านแชทจาก Tracking project และใช้ `vw_bb_close_job_cases` กับ `bb_delivery_case_notes`
- เมนู `Alien Learning · อนุมัติ Alias` ถูกแทนด้วยประวัติเคส เพราะ `product_map_master` ไม่อยู่ใน schema ปัจจุบัน; หน้าเดิมยังไม่ลบ และ `/aliases` พาไปหน้าประวัติเคส
- **Secret Gallery:** เก็บ Anon/Publishable Key แยกเป็น Main Order และ Tracking & Messenger; ฝั่งแชท/พัสดุ/ประวัติเคสเลือก Tracking อัตโนมัติ
- **Server:** ใช้ `ORDER_SUPABASE_URL` + `ORDER_SUPABASE_SERVICE_ROLE_KEY` สำหรับสายออเดอร์ และ `TRACKING_SUPABASE_URL` + `TRACKING_SUPABASE_SERVICE_ROLE_KEY` สำหรับ token/งาน Tracking; ห้ามใส่ service-role หรือ Page Token ใน browser
- ห้ามทำ SQL join ข้ามโปรเจกต์หรือย้าย token มาฝั่ง browser

## 2. สายส่งเลขพัสดุและส่งแชทลูกค้า (Tracking & Messenger Pipeline)

สายรับไฟล์เลขพัสดุจากขนส่ง ประกอบข้อมูลบิลและ Token เพจ แล้วส่งเลขกลับเข้า Messenger

SQL `sql/bb-close-job-history.sql` ต้องติดตั้งใน **Tracking & Messenger project** เท่านั้น เพราะอ่าน `chat_customer_messages` และ `chat_page_messages` และสร้าง `vw_bb_close_job_cases`/`bb_delivery_case_notes` ที่นั่น

```text
[ไฟล์ขนส่งอัปโหลด]
          │
          ▼
[table parcels] (แหล่งเก็บเลขพัสดุหลัก)
          │
          ▼
[view 🔮 SHADOW_xXx_RECALL] (เลขพร้อมใช้/standby)
          │
          ▼
[view 🦅 ROGUE_xXx_SHIPPINGz]
  join ข้อมูลบิลจาก [table 🧿 BB_xXx_ORDERCONTROL]
          │
          ▼
[view ⛩️ VOID_xXx_GATEWAYz]
  join Token เพจจาก [table page_tokens_vault]
          │
          ├──► ส่งเลขพัสดุกลับห้องแชทลูกค้า
          │
          ▼
[table parcels] อัปเดต delivery_status = '🔥SENT' และ sent_at
          │
          ▼
รายการที่ส่งแล้วออกจาก operational views
          │
          ▼
[view 📓 DEAD_xXx_NOTE] (ประวัติการส่งเลขพัสดุที่เสร็จแล้ว)
```

### หน้าที่

- `parcels` — ตารางหลักเก็บเลขพัสดุจากไฟล์ Raw Data ของขนส่ง
- `🧿 BB_xXx_ORDERCONTROL` — ข้อมูลออเดอร์ที่ต้องใช้จัดทำข้อความส่งพัสดุ เช่น ชื่อและข้อมูลลูกค้า
- `page_tokens_vault` — Token ของแต่ละเพจสำหรับเรียก API ส่งข้อความ
- `🔮 SHADOW_xXx_RECALL` — วิวดึงเลขพัสดุที่พร้อมใช้งานจาก `parcels`
- `🦅 ROGUE_xXx_SHIPPINGz` — รวมเลขพัสดุกับข้อมูลบิลจาก `🧿 BB_xXx_ORDERCONTROL`
- `⛩️ VOID_xXx_GATEWAYz` — รวมข้อมูลส่งพัสดุกับ Token จาก `page_tokens_vault` เพื่อยิงข้อความกลับห้องลูกค้า
- หลังส่งสำเร็จ ให้อัปเดต `parcels.delivery_status = '🔥SENT'` และ `sent_at`; รายการที่ส่งแล้วต้องออกจากทุกคิวปฏิบัติงาน
- `📓 DEAD_xXx_NOTE` — ประวัติการส่งเลขพัสดุที่สำเร็จแล้ว

## กติกาก่อนแก้ระบบ

1. สองสายงานนี้แยกกัน: สายออเดอร์หลักใช้ `🗝️ HERMES_ARCHIVE`, `🌀 SINGULARITY_xXx_EXCHANGE` และ `🌟 GENESIS_xXx_HISTORY`; สาย Tracking ใช้ `parcels`, `🔮 SHADOW_xXx_RECALL`, `🦅 ROGUE_xXx_SHIPPINGz`, `⛩️ VOID_xXx_GATEWAYz` และ `📓 DEAD_xXx_NOTE` อย่าสลับ archive หรือ history ข้ามสาย
2. n8n และ Supabase tables/views ที่เตรียมไว้เป็นเจ้าของข้อมูลและสถานะ ระบบหน้าเว็บควรอ่าน/แสดงผลและเรียกทางส่งที่กำหนด ห้ามทำ pipeline ซ้ำใน browser
3. อย่าแก้ชื่อ table/view, เงื่อนไขสี, การ join, เงื่อนไขส่งแล้วเด้งออกจากคิว หรือ schema โดยไม่ตรวจ workflow ที่ใช้อยู่และได้รับคำสั่งชัดเจน
4. ห้ามเปิดเผย Page Token หรือ Token ของระบบใน client/browser; ใช้การเชื่อมต่อที่กำหนดไว้และรักษาแต่ละ project/camp แยกกัน
5. ก่อนแตะ flow ให้ตรวจ schema จริงและไฟล์/workflow n8n ที่เกี่ยวข้อง อย่าอนุมานจากชื่ออย่างเดียว
