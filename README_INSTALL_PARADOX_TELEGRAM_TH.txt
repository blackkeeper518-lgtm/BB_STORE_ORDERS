แพตช์ BB Store · PARADOX + Telegram hotfix

1) เปิด SQL Editor ของโปรเจกต์ ZEUS / Main Order แล้วรัน `sql/bb_paradox_exchange_view.sql` ก่อน
   - แยกเฉพาะสีส้ม 🟠 ที่ส่ง/บันทึกแล้วไป `🔸 PARADOX_xXx_EXCHANGE`
   - คงสีเหลือง 🟨 ใน `🌟 GENESIS_xXx_HISTORY` และกันสีส้มออกจาก GENESIS
   - ไม่ย้ายหรือลบแถวในตารางต้นทาง
2) วางทับไฟล์ตาม path ใน ZIP ที่ root ของ repository แล้ว push/deploy เว็บ
3) ห้องประวัติเปลี่ยนของจะอ่าน `PARADOX` อย่างเดียว; ไม่ต้องเพิ่ม n8n node สำหรับ view นี้ เพราะ view ใช้สถานะที่ workflow บันทึกใน SINGULARITY อยู่แล้ว
4) Telegram hotfix ป้องกันหน้าแตกเมื่อคิวว่าง/ยังไม่ได้เลือกบิล

ตรวจแล้ว: `pnpm check`, `pnpm build`, `git diff --check` ผ่าน
