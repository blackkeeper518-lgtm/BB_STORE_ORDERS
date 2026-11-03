import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readGenesisOrderHistory } from "@/lib/canonical";
import { Archive, ExternalLink, RefreshCw, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

export default function OrderHistory() {
  const [date, setDate] = useState(todayBangkok);
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["genesis-order-history", date],
    queryFn: () => readGenesisOrderHistory(date),
    refetchInterval: 60_000,
  });
  const allOrders = query.data?.orders ?? [];
  const needle = search.trim().toLocaleLowerCase();
  const orders = needle
    ? allOrders.filter((order: any) => [
        order.order_number, order.upsert_key, order.customer_name, order.facebook_name,
        order.phone, order.page_name, order.sku, order.product_display, order.full_address,
      ].some((value) => String(value ?? "").toLocaleLowerCase().includes(needle)))
    : allOrders;
  const codTotal = orders.reduce((sum: number, order: any) => sum + (Number(order.cod_amount) || 0), 0);

  return <div className="min-h-[calc(100vh-2rem)] space-y-5 bg-[#070716] p-2 text-white sm:p-4 lg:p-6">
    <header className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[radial-gradient(ellipse_at_top_left,_rgba(168,85,247,0.20),_transparent_50%),linear-gradient(120deg,_#120d28,_#09091a)] p-5 shadow-[0_0_18px_rgba(168,85,247,.18),0_0_42px_rgba(34,211,238,.08)] sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"><Archive className="h-4 w-4" /> GENESIS · SENT ARCHIVE <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" /></div>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">คลังบิลส่งแล้ว</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-violet-100/65">อ่านจาก 🌟GENESIS_xXx_HISTORY เท่านั้น · ใช้ order_time_display เป็นเวลาออเดอร์ · สีส้มอยู่ PARADOX</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input aria-label="เลือกวันที่ออเดอร์" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-40 border-cyan-300/25 bg-[#09091a]/80 text-white [color-scheme:dark]" />
          <Button variant="outline" onClick={() => void query.refetch()} className="border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100 hover:bg-fuchsia-400/20">
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช
          </Button>
        </div>
      </div>
      <div className="relative mt-5 flex max-w-2xl items-center gap-2 rounded-2xl border border-cyan-300/20 bg-black/20 px-3">
        <Search className="h-4 w-4 shrink-0 text-cyan-200/70" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขออเดอร์ / ชื่อลูกค้า / เบอร์ / สินค้า / ที่อยู่" className="border-0 bg-transparent text-white placeholder:text-violet-100/35 focus-visible:ring-0" />
      </div>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="บิลส่งแล้ว · วันที่เลือก" value={allOrders.length.toLocaleString("th-TH")} tone="text-cyan-200" />
      <Stat label="รายการที่ค้นเจอ" value={orders.length.toLocaleString("th-TH")} tone="text-fuchsia-200" />
      <Stat label="ยอด COD ในผลลัพธ์" value={`${codTotal.toLocaleString("th-TH")} ฿`} tone="text-violet-100" />
    </div>

    {query.isError ? <Card className="rounded-2xl border-rose-400/30 bg-rose-950/20"><CardContent className="p-5 text-sm text-rose-100">
      <p className="font-semibold">อ่านประวัติจาก GENESIS ไม่สำเร็จ</p>
      <p className="mt-1 break-words text-rose-100/70">{query.error instanceof Error ? query.error.message : "ตรวจการเชื่อมต่อ Supabase และวิว 🌟GENESIS_xXx_HISTORY"}</p>
      <p className="mt-2 text-xs text-rose-100/55">ห้องนี้ไม่สลับไปอ่านโต๊ะอื่นอัตโนมัติ</p>
    </CardContent></Card> : null}

    <Card className="overflow-hidden rounded-3xl border-violet-300/15 bg-[#0b0a1b]/95 shadow-[0_0_18px_rgba(34,211,238,.07)]">
      <CardHeader className="border-b border-violet-300/10 bg-gradient-to-r from-violet-500/[0.08] to-cyan-400/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base text-violet-50">🔥 SENT · GENESIS</CardTitle>
          <span className="text-xs text-cyan-100/55">เรียงด้วย order_time_display · โหลดสูงสุด 1,000 บิลต่อวัน</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-xs">
            <thead className="border-b border-cyan-300/10 bg-black/20 text-cyan-100/55">
              <tr><th className="p-3">ออเดอร์ / สถานะ</th><th className="p-3">ลูกค้า / ที่อยู่</th><th className="p-3">สินค้า</th><th className="p-3">COD</th><th className="p-3">เพจ / ขนส่ง</th><th className="p-3">เวลาออเดอร์</th><th className="p-3">แชท</th></tr>
            </thead>
            <tbody>
              {orders.map((order: any) => <tr key={order.upsert_key || order.id} className="border-b border-violet-200/[0.06] align-top transition-colors hover:bg-cyan-300/[0.035]">
                <td className="p-3"><p className="font-semibold text-cyan-100">{order.order_number || "—"}</p><p className="mt-1 font-mono text-[10px] text-violet-100/40">{order.upsert_key || ""}</p><Badge className="mt-2 border-orange-300/25 bg-orange-400/10 text-orange-200">🔥SENT</Badge></td>
                <td className="p-3"><p className="font-medium text-white">{order.customer_name || "ไม่ระบุชื่อ"}</p><p className="mt-1 text-cyan-100/65">{order.phone || "ไม่ระบุเบอร์"}</p><p className="mt-1 max-w-xs text-violet-100/50">{order.full_address || "ไม่ระบุที่อยู่"}</p></td>
                <td className="max-w-xs whitespace-pre-wrap p-3 text-violet-50/80">{order.product_display || "ไม่มีข้อมูลสินค้าใน GENESIS"}</td>
                <td className="p-3"><Badge className="border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100">{Number(order.cod_amount ?? 0).toLocaleString("th-TH")} บาท</Badge></td>
                <td className="p-3"><p className="text-cyan-100/80">{order.page_name || "—"}</p><p className="mt-1 text-violet-100/50">{order.shipping_carrier || "—"}</p></td>
                <td className="whitespace-nowrap p-3 font-mono text-cyan-100/70">{order.order_time_display || "—"}</td>
                <td className="p-3">{order.page_id && order.thread_id ? <Link href={`/chats?page_id=${encodeURIComponent(order.page_id)}&thread_id=${encodeURIComponent(order.thread_id)}`}><Button size="sm" variant="outline" className="border-cyan-300/25 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/15"><ExternalLink className="mr-1 h-3.5 w-3.5" />เปิดแชท</Button></Link> : <span className="text-violet-100/40">ไม่มีคีย์แชท</span>}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {query.isLoading ? <p className="p-8 text-center text-sm text-cyan-100/55">กำลังอ่านประวัติจาก GENESIS…</p> : null}
        {!query.isLoading && !query.isError && !orders.length ? <p className="p-8 text-center text-sm text-violet-100/55">ไม่พบออเดอร์ส่งแล้วในวันที่เลือก</p> : null}
      </CardContent>
    </Card>
  </div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <Card className="rounded-2xl border-violet-300/15 bg-[#0b0a1b] shadow-[0_0_14px_rgba(168,85,247,.06)]"><CardContent className="p-4"><p className={`text-2xl font-semibold ${tone}`}>{value}</p><p className="mt-1 text-xs text-violet-100/50">{label}</p></CardContent></Card>;
}
