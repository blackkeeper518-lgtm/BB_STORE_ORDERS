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
    <div className="cosmic-stage min-h-full space-y-5 p-3 text-white sm:p-5 lg:p-7">
      <span className="cosmic-corner tl" /><span className="cosmic-corner br" />
      <header className="blackbox-hero cyber-glow relative overflow-hidden rounded-3xl border border-fuchsia-400/20 p-6 sm:p-8">
        <div className="hero-scanline" /><div className="hero-orbit" /><div className="hero-planet" />
        <div className="relative z-10 max-w-3xl">
          <p className="orbit-kicker flex items-center gap-2 text-cyan-200/80"><Database className="h-4 w-4 text-cyan-300" /> ORBITAL ORDER CONTROL · N8N / SUPABASE</p>
          <h1 className="cyber-title mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">ข้อมูลออเดอร์ <span className="text-fuchsia-300">//</span> COMMAND DECK</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/75">ศูนย์ควบคุมออเดอร์จาก n8n โดยตรง · ตรวจเส้นทางสินค้า ลูกค้า COD และสถานะการส่งในจอเดียว</p>
          <div className="mt-5 flex flex-wrap items-center gap-3"><span className="live-chip"><span className="live-dot" /> LIVE ORDER STREAM</span><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">HERMES ARCHIVE · SECURE LINK</span></div>
        </div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching} className="relative z-10 border-cyan-300/30 bg-cyan-400/5 text-cyan-100 shadow-[0_0_20px_rgba(88,239,255,0.08)] hover:border-cyan-200/60 hover:bg-cyan-400/10">
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> รีเฟรช
        </Button>
      </header>

      <div className="signal-ticker rounded-xl"><span>✦ HERMES ARCHIVE // ORDER SIGNAL // COD VERIFIED // PRODUCT MAP ONLINE // TELEGRAM ROUTE READY // </span></div>

      <div className="relative cyber-grid rounded-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา order / ลูกค้า / เบอร์ / SKU จาก Supabase" className="h-12 rounded-2xl border-cyan-300/20 bg-[#0d0a18]/90 pl-11 text-white shadow-[0_0_24px_rgba(88,239,255,0.06)] placeholder:text-slate-500 focus-visible:border-fuchsia-300/60 focus-visible:ring-fuchsia-400/20" />
      </div>

      {query.error ? <Card className="border-pink-400/30 bg-pink-950/20 shadow-[0_0_24px_rgba(255,70,190,0.1)]"><CardContent className="p-5 text-sm text-pink-200">อ่านข้อมูลไม่สำเร็จ: {query.error instanceof Error ? query.error.message : String(query.error)}</CardContent></Card> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="overflow-hidden border-violet-400/20 bg-[#10091b]/90 shadow-[0_0_28px_rgba(151,75,255,0.08)]">
          <CardHeader className="border-b border-violet-300/15 bg-violet-500/[0.04]"><CardTitle className="flex items-center justify-between text-base text-violet-100"><span><span className="mr-2 text-emerald-300">✦</span>รายการออเดอร์</span><span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-mono font-normal text-emerald-200">{orders.length} SIGNALS</span></CardTitle></CardHeader>
          <CardContent className="max-h-[72vh] space-y-2 overflow-auto p-3">
            {query.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังอ่านข้อมูลจาก Supabase…</p> : null}
            {!query.isLoading && !query.error && orders.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</p> : null}
            {orders.map((row) => <button key={row.upsert_key} type="button" onClick={() => setSelectedKey(row.upsert_key)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedOrder?.upsert_key === row.upsert_key ? "border-pink-300/60 bg-gradient-to-r from-fuchsia-500/15 to-emerald-400/5 shadow-[inset_3px_0_#ff5acb,0_0_18px_rgba(255,90,203,0.1)]" : "border-white/5 bg-black/15 hover:border-cyan-300/30 hover:bg-cyan-400/[0.04]"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm text-cyan-200">{directText(row.order_number)}</span><span className="text-xs text-violet-200/60">{row.order_time_display}</span></div>
              <p className="mt-2 text-sm text-white">{directText(row.customer_name)}</p>
              <p className="mt-1 truncate font-mono text-[10px] text-cyan-100/35">{row.upsert_key}</p>
              <p className="mt-2 line-clamp-2 text-xs text-emerald-100/65">{directText(row.final_display_for_packer)}</p>
            </button>)}
          </CardContent>
        </Card>

        <Card className="border-fuchsia-400/20 bg-[#10091b]/90 shadow-[0_0_28px_rgba(255,75,197,0.07)]">
          <CardHeader className="border-b border-fuchsia-300/15 bg-fuchsia-500/[0.04]"><CardTitle className="text-base text-fuchsia-100"><span className="mr-2 text-fuchsia-300">◈</span>ข้อมูลจาก n8n <span className="ml-2 text-[10px] font-mono font-normal uppercase tracking-[0.18em] text-cyan-200/50">DECODED PAYLOAD</span></CardTitle></CardHeader>
          <CardContent className="space-y-5 p-5">
            {!selectedOrder ? <p className="py-12 text-center text-sm text-slate-500">เลือกออเดอร์เพื่อดูข้อมูล</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-mono text-lg font-semibold text-emerald-200">{directText(selectedOrder.order_number)}</p><p className="mt-1 break-all font-mono text-xs text-cyan-100/40">upsert_key: {selectedOrder.upsert_key}</p></div>
                <span className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100 shadow-[0_0_16px_rgba(88,239,255,0.08)]"><Clock3 className="h-4 w-4" />{selectedOrder.order_time_display}</span>
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
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">telegram_message · field ส่งเดียว (อ่านอย่างเดียว)</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-300/25 bg-emerald-400/[0.03] p-4 text-xs leading-5 text-emerald-50/80 shadow-[inset_0_0_24px_rgba(62,227,181,0.04)]">{directText(selectedOrder.telegram_message)}</pre></section>
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-200/60">ก้อนออเดอร์ต้นทาง</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-violet-300/15 bg-black/20 p-4 text-xs leading-5 text-slate-300">{directText(selectedOrder.original)}</pre></section>
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
