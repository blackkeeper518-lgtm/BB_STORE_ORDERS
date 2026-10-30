ไฟล์หน้าคู่มือระบบ Darkside

ไฟล์หลัก:
client/src/pages/SystemManual.tsx

ไฟล์เชื่อม route:
client/src/App.tsx

ไฟล์เมนู:
client/src/components/DashboardLayout.tsx

Route:
/system-manual

ถ้าย้ายไปโปรเจกต์อื่น ให้:
1. คัดลอก SystemManual.tsx ไปที่ client/src/pages/
2. เพิ่ม import SystemManual from "./pages/SystemManual";
3. เพิ่ม <Route path={"/system-manual"} component={SystemManual} />
4. เพิ่มเมนู path /system-manual ใน DashboardLayout
