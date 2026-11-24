import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerProjectConnection } from "@/components/ServerProjectConnection";
import { Database, LockKeyhole } from "lucide-react";

export default function ConnectSupabase() {
  return <div className="flex min-h-[calc(100vh-2rem)] w-full flex-col items-center justify-start gap-4 p-3 sm:p-5 lg:p-8">
    <Card className="w-full max-w-[1180px] rounded-3xl border-orange-500/25 bg-[#120b07] cyber-glow">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300"><Database className="h-4 w-4" /> MAIN ORDER · SERVER CONNECTION</div>
        <CardTitle className="text-2xl text-white">การเชื่อมต่อฐานออเดอร์หลัก</CardTitle>
        <p className="text-sm leading-6 text-orange-100/55">ค่าเก่าที่บันทึกไว้ใน browser จะคงเดิมเป็นข้อมูลสำรอง แต่ไม่ถูกอ่าน ส่ง หรือใช้เชื่อมต่อ · การทำงานใช้ Server environment เท่านั้น</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-orange-400/15 bg-black/20 p-3 text-xs leading-5 text-orange-100/70"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /><span>ต้องกำหนด ORDER_SUPABASE_URL และ ORDER_SUPABASE_SERVICE_ROLE_KEY บน server deployment ก่อนใช้งานจริง ห้ามใส่ service-role key ใน frontend</span></div>
        <ServerProjectConnection project="main" title="ORDER / MAIN · Supabase" description="ตรวจ relation ที่ใช้จริงจากฝั่ง Server โดยไม่ดึงข้อมูลแถวหรือเปิดเผย credentials" />
      </CardContent>
    </Card>
  </div>;
}
