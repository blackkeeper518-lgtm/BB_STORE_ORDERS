ST SINGTO STORE — NODE SOURCE BUNDLES

ไฟล์ *_NODE_SOURCES.txt รวม source ของโหนด JS ในแต่ละ Project ไว้ในไฟล์เดียว
เพื่อเปิดค้นหาและก๊อปโค้ดทีละ node ได้ง่าย

สำคัญ:
- Bundle นี้ไม่มี connections และไม่ใช่ไฟล์สำหรับ Import เป็น workflow
- ถ้าต้องการทั้ง nodes + connections ให้ใช้ไฟล์ใน n8n-live/PASTE_READY/*_PASTE.json
- ใน bundle ให้ค้นหา `NODE 01`, `NODE 02` หรือ `FILE:` เพื่อเลือกโหนดที่ต้องการ
- ไฟล์ว่างในต้นทางจะถูกแสดงเป็น section ว่างตามรายการจริง
