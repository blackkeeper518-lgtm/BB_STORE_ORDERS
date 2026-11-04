import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readCanonicalOrders } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { Clock3, Database, ExternalLink, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

type CanonicalOrderRow = Record<string, any> & {
  upsert_key: string;
  order_time_display: string;
};

function money(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("th-TH")} บาท` : String(value);
}

function directText(value: unknown) {
  return value == null || value === "" ? "—" : String(value);
}

export default function OrderControl() {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const query = useQuery({
    queryKey: ["canonical-orders", search],
    queryFn: () => readCanonicalOrders(search),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const orders = (query.data?.orders ?? []) as CanonicalOrderRow[];
  const selectedOrder = orders.find((row) => row.upsert_key === selectedKey) ?? orders[0] ?? null;

  useEffect(() => {
    if (!selectedOrder) {
      setSelectedKey("");
      return;
    }
    if (selectedKey !== selectedOrder.upsert_key && !orders.some((row) => row.upsert_key === selectedKey)) {
      setSelectedKey(selectedOrder.upsert_key);
    }
  }, [orders, selectedKey, selectedOrder]);

  return (
    <div className="min-h-full space-y-5 bg-[#09090b] p-3 text-white sm:p-5 lg:p-7">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-white/10 bg-[#111116] p-6 shadow-2xl shadow-black/30">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300"><Database className="h-4 w-4" /> CANONICAL DATA · N8N / SUPABASE</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">ข้อมูลออเดอร์</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">แสดงค่าที่ n8n เตรียมไว้โดยตรง · คีย์หลักคือ upsert_key · เวลาออเดอร์ใช้ order_time_display</p>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching} className="border-white/15 bg-white/5 text-white hover:bg-white/10">
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> รีเฟรช
        </Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาข้อมูลจาก Supabase" className="border-white/10 bg-[#111116] pl-9 text-white placeholder:text-slate-600" />
      </div>

      {query.error ? <Card className="border-red-500/30 bg-red-950/20"><CardContent className="p-5 text-sm text-red-200">อ่านข้อมูลไม่สำเร็จ: {query.error instanceof Error ? query.error.message : String(query.error)}</CardContent></Card> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="overflow-hidden border-white/10 bg-[#111116]">
          <CardHeader className="border-b border-white/10"><CardTitle className="text-base">รายการออเดอร์ <span className="ml-2 text-sm font-normal text-slate-500">{orders.length}</span></CardTitle></CardHeader>
          <CardContent className="max-h-[72vh] space-y-2 overflow-auto p-3">
            {query.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังอ่านข้อมูลจาก Supabase…</p> : null}
            {!query.isLoading && !query.error && orders.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</p> : null}
            {orders.map((row) => <button key={row.upsert_key} type="button" onClick={() => setSelectedKey(row.upsert_key)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedOrder?.upsert_key === row.upsert_key ? "border-orange-300/50 bg-orange-400/10" : "border-white/5 bg-black/15 hover:border-white/15"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm text-orange-200">{directText(row.order_number)}</span><span className="text-xs text-slate-400">{row.order_time_display}</span></div>
              <p className="mt-2 text-sm text-white">{directText(row.customer_name)}</p>
              <p className="mt-1 truncate font-mono text-[10px] text-slate-500">{row.upsert_key}</p>
              <p className="mt-2 line-clamp-2 text-xs text-slate-400">{directText(row.final_display_for_packer)}</p>
            </button>)}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111116]">
          <CardHeader className="border-b border-white/10"><CardTitle className="text-base">ข้อมูลจาก n8n</CardTitle></CardHeader>
          <CardContent className="space-y-5 p-5">
            {!selectedOrder ? <p className="py-12 text-center text-sm text-slate-500">เลือกออเดอร์เพื่อดูข้อมูล</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-mono text-lg font-semibold text-orange-200">{directText(selectedOrder.order_number)}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">upsert_key: {selectedOrder.upsert_key}</p></div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100"><Clock3 className="h-4 w-4" />{selectedOrder.order_time_display}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="ชื่อผู้รับ" value={selectedOrder.customer_name} />
                <Info label="เบอร์โทร" value={selectedOrder.phone} />
                <Info label="ชื่อเพจ" value={selectedOrder.page_name} />
                <Info label="COD" value={money(selectedOrder.cod_amount)} />
                <Info label="สินค้าสำหรับจัด" value={selectedOrder.final_display_for_packer} />
                <Info label="สถานะจาก n8n" value={selectedOrder.audit_flags} />
                <Info label="สถานะ Telegram จาก n8n" value={selectedOrder.telegram_status} />
                <Info label="เส้นทางที่ n8n ระบุ" value={selectedOrder.route_reason_label} />
              </div>
              <Info label="ที่อยู่จากข้อมูลกลาง" value={selectedOrder.final_address_for_bill} />
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">telegram_message · field ส่งเดียว (อ่านอย่างเดียว)</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-300/20 bg-black/20 p-4 text-xs leading-5 text-slate-200">{directText(selectedOrder.telegram_message)}</pre></section>
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">ก้อนออเดอร์ต้นทาง</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-300">{directText(selectedOrder.original)}</pre></section>
              <div className="flex flex-wrap gap-2">
                <Link href={`/order-history?search=${encodeURIComponent(selectedOrder.upsert_key)}`}><Button variant="outline" className="border-cyan-300/25 bg-cyan-400/5 text-cyan-100"><ExternalLink className="mr-2 h-4 w-4" />ประวัติ</Button></Link>
                <Link href={`/telegram-delivery?search=${encodeURIComponent(selectedOrder.upsert_key)}&room=queue`}><Button variant="outline" className="border-fuchsia-300/25 bg-fuchsia-400/5 text-fuchsia-100"><ExternalLink className="mr-2 h-4 w-4" />ข้อมูลส่ง Telegram</Button></Link>
              </div>
            </>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{directText(value)}</p></div>;
}
