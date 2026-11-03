แพตช์ BB Store · PARADOX + Telegram

1) เปิด SQL Editor ของโปรเจกต์ ZEUS / Main Order แล้วรัน `sql/bb_paradox_exchange_view.sql` ก่อน
   - แยกออเดอร์สีส้ม 🟠 ที่ส่ง/บันทึกแล้วไป `🔸 PARADOX_xXx_EXCHANGE`
   - คงสีเหลือง 🟨 ใน `🌟 GENESIS_xXx_HISTORY` และกันสีส้มออกจาก GENESIS
   - ไม่ย้ายหรือลบแถวในตารางต้นทาง
2) วางทับไฟล์ตาม path ใน ZIP ที่ root ของ repository แล้ว push/deploy เว็บ
3) หน้า Telegram ขอ 38 คอลัมน์ที่ใช้จริงจาก PIONEER/GENESIS แทนการดึง 330 คอลัมน์; ประวัติแชทโหลดเฉพาะเมื่อเปิดบิล และให้เลือก source table ถูกฝั่ง
4) ไม่แก้ `MULTIVERSE` เพื่อไม่กระทบ n8n; Telegram ยังอ่าน `stock_notice` เป็นหัวบิลลำดับแรก
5) Telegram hotfix ป้องกันหน้าแตกเมื่อคิวว่าง/ยังไม่ได้เลือกบิล

ตรวจแล้ว: `pnpm check`, `pnpm build`, `git diff --check` ผ่าน
