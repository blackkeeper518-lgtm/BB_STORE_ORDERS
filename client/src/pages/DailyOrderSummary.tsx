import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readGenesisOrderHistory } from "@/lib/canonical";
import { Archive, CheckCircle2, Clipboard, Download, ExternalLink, RefreshCw, Search, Send, Sparkles, Store, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function money(value: unknown) {
  const n = Number(String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function productText(row: any) {
  return [row.for_packer_st_display, row.manus_for_packer, row.google_for_packer, row.packer_tag_display, row.order_fibo_product, row.sku]
    .map(value => String(value ?? "").trim()).find(Boolean) || "ไม่มีข้อมูลสินค้า";
}
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " " )}"`; }

export default function DailyOrderSummary() {
  const [date, setDate] = useState(todayBangkok);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState("");
  const query = useQuery({ queryKey: ["genesis-daily-summary", date], queryFn: () => readGenesisOrderHistory(date), refetchInterval: 60_000 });
  const allOrders = query.data?.orders ?? [];
  const needle = search.trim().toLocaleLowerCase();
  const orders = useMemo(() => needle ? allOrders.filter((row: any) => [row.order_number, row.upsert_key, row.customer_name, row.facebook_name, row.phone, row.page_name, row.shipping_carrier, productText(row), row.full_address].some(value => String(value ?? "").toLocaleLowerCase().includes(needle))) : allOrders, [allOrders, needle]);
  const stats = useMemo(() => ({
    total: orders.length,
    cod: orders.reduce((sum: number, row: any) => sum + money(row.cod_amount), 0),
    pages: new Set(orders.map((row: any) => String(row.page_id ?? row.page_name ?? "").trim()).filter(Boolean)).size,
    carriers: new Set(orders.map((row: any) => String(row.shipping_carrier ?? "").trim()).filter(Boolean)).size,
  }), [orders]);
  const copyPhone = async (value: unknown) => {
    const phone = String(value ?? "").trim();
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopied(phone);
    window.setTimeout(() => setCopied(""), 1400);
  };
  const exportCsv = () => {
    if (!orders.length) return;
    const headers = ["order_number", "customer_name", "phone", "full_address", "product", "cod_amount", "page_name", "shipping_carrier", "order_time_display", "upsert_key"];
    const csv = "\uFEFF" + [headers, ...orders.map((row: any) => [row.order_number, row.customer_name, row.phone, row.full_address || row.final_address_for_bill, productText(row), row.cod_amount, row.page_name, row.shipping_carrier, row.order_time_display, row.upsert_key])].map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `genesis-daily-summary-${date}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="st-runtime-room daily-order-summary-room min-h-[calc(100vh-2rem)] space-y-4 bg-[#070716] p-2 text-white sm:p-4 lg:p-6">
    <header className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[radial-gradient(ellipse_at_top_left,_rgba(168,85,247,0.20),_transparent_50%),linear-gradient(120deg,_#120d28,_#09091a)] p-4 shadow-[0_0_22px_rgba(168,85,247,.16)] sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-cyan-200"><Archive className="h-4 w-4" /> ห้องสรุปออเดอร์รายวัน <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" /></div><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">สรุปออเดอร์รายวัน</h1><p className="mt-1 text-xs leading-5 text-violet-100/60">ข้อมูลมาจากห้อง GENESIS · SENT ARCHIVE โดยตรง · เลือกวันแล้วดูยอดรวมกับรายการออเดอร์ได้ทันที</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"><Input aria-label="เลือกวันที่" type="date" value={date} onChange={event => setDate(event.target.value)} className="col-span-2 w-full border-cyan-300/25 bg-[#09091a]/80 text-white [color-scheme:dark] sm:w-40" /><Button variant="outline" onClick={() => void query.refetch()} className="border-cyan-300/25 bg-cyan-400/10 text-cyan-100"><RefreshCw className={`mr-1.5 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button><Button variant="outline" onClick={exportCsv} disabled={!orders.length} className="border-emerald-300/25 bg-emerald-400/10 text-emerald-100"><Download className="mr-1.5 h-4 w-4" />CSV</Button></div>
      </div>
      <div className="relative mt-4 flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-black/25 px-3"><Search className="h-4 w-4 shrink-0 text-cyan-200/70" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาออเดอร์ / ลูกค้า / เบอร์ / เพจ" className="border-0 bg-transparent text-sm text-white placeholder:text-violet-100/35 focus-visible:ring-0" /></div>
      <div className="relative mt-3 flex flex-wrap gap-2"><Link href="/orders"><Button size="sm" variant="outline" className="border-fuchsia-300/25 bg-fuchsia-400/[.07] text-fuchsia-100">เปิดหน้าจัดการออเดอร์</Button></Link><Link href="/mobile-inbox"><Button size="sm" variant="outline" className="border-cyan-300/25 bg-cyan-400/[.07] text-cyan-100">เปิดแอปแชท Mobile Inbox</Button></Link></div>
    </header>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"><SummaryStat icon={CheckCircle2} label="ส่งแล้ว" value={stats.total.toLocaleString("th-TH")} tone="text-emerald-300" /><SummaryStat icon={WalletCards} label="COD รวม" value={`${stats.cod.toLocaleString("th-TH")} ฿`} tone="text-orange-300" /><SummaryStat icon={Store} label="จำนวนเพจ" value={stats.pages.toLocaleString("th-TH")} tone="text-fuchsia-200" /><SummaryStat icon={Send} label="ขนส่ง" value={stats.carriers.toLocaleString("th-TH")} tone="text-cyan-200" /></div>

    {query.isError ? <Card className="rounded-2xl border-rose-400/30 bg-rose-950/20"><CardContent className="p-4 text-sm text-rose-100"><p className="font-semibold">อ่าน GENESIS ไม่สำเร็จ</p><p className="mt-1 break-words text-xs text-rose-100/70">{query.error instanceof Error ? query.error.message : "ตรวจการเชื่อมต่อวิว 🌟GENESIS_xXx_HISTORY"}</p></CardContent></Card> : null}

    <section className="rounded-3xl border border-violet-300/15 bg-[#0b0a1b]/95 shadow-[0_0_18px_rgba(34,211,238,.07)]"><div className="flex items-center justify-between border-b border-violet-300/10 bg-gradient-to-r from-violet-500/[0.08] to-cyan-400/[0.04] px-4 py-3"><div><p className="text-sm font-semibold text-violet-50">รายการของวันที่ {date}</p><p className="text-[10px] text-cyan-100/45">{needle ? `ค้นเจอ ${orders.length} จาก ${allOrders.length} รายการ` : "เรียงจากเวลาสั่งซื้อ ล่าสุดอยู่ด้านบน"}</p></div><Badge className="border-emerald-300/25 bg-emerald-400/10 text-emerald-200">ส่งแล้ว</Badge></div>
      <div className="space-y-2 p-2 sm:p-3">{orders.map((row: any) => { const phone = row.phone || row.extracted_phone || ""; return <article key={row.upsert_key || row.id} className="rounded-2xl border border-violet-200/10 bg-black/20 p-3 transition hover:border-cyan-300/25 hover:bg-cyan-300/[.035]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-mono text-sm font-bold text-cyan-100">{row.order_number || "ไม่พบเลขออเดอร์"}</p><p className="mt-1 truncate text-[10px] text-violet-100/45">{row.order_time_display || "ไม่พบเวลา"} · {row.page_name || "ไม่ระบุเพจ"}</p></div><Badge className="shrink-0 border-orange-300/25 bg-orange-400/10 text-orange-200">฿{money(row.cod_amount).toLocaleString("th-TH")}</Badge></div><p className="mt-3 line-clamp-2 text-xs leading-5 text-violet-50/80">{productText(row)}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]"><span className="text-white">{row.customer_name || row.facebook_name || "ไม่ระบุลูกค้า"}</span>{phone ? <button type="button" onClick={() => void copyPhone(phone)} className="inline-flex items-center gap-1 rounded-lg border border-cyan-300/20 bg-cyan-400/[.06] px-2 py-1 text-cyan-100/75">{phone}{copied === phone ? <CheckCircle2 className="h-3 w-3 text-emerald-300" /> : <Clipboard className="h-3 w-3" />}</button> : null}<span className="text-violet-100/45">{row.shipping_carrier || "ไม่ระบุขนส่ง"}</span></div><p className="mt-2 line-clamp-2 text-[11px] leading-4 text-violet-100/45">{row.full_address || row.final_address_for_bill || "ไม่ระบุที่อยู่"}</p><div className="mt-3 flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[10px] text-emerald-200/70"><CheckCircle2 className="h-3 w-3" />บันทึกในห้องประวัติแล้ว</span>{row.page_id && row.threadId ? <Link href={`/mobile-inbox?page=${encodeURIComponent(row.page_id)}&thread=${encodeURIComponent(row.threadId)}`}><Button size="sm" variant="outline" className="h-7 border-cyan-300/25 bg-cyan-400/[.06] px-2 text-[10px] text-cyan-100"><ExternalLink className="mr-1 h-3 w-3" />เปิดแชท</Button></Link> : null}</div></article>; })}</div>
      {query.isLoading ? <p className="p-8 text-center text-sm text-cyan-100/55">กำลังอ่าน GENESIS…</p> : null}{!query.isLoading && !query.isError && !orders.length ? <p className="p-8 text-center text-sm text-violet-100/55">ไม่พบออเดอร์ในวันที่เลือก</p> : null}
    </section>
  </div>;
}

function SummaryStat({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: string; tone: string }) { return <Card className="rounded-2xl border-violet-300/15 bg-[#0b0a1b] shadow-[0_0_14px_rgba(168,85,247,.06)]"><CardContent className="p-3 sm:p-4"><Icon className={`h-4 w-4 ${tone}`} /><p className={`mt-2 text-lg font-semibold sm:text-2xl ${tone}`}>{value}</p><p className="mt-0.5 text-[10px] text-violet-100/50 sm:text-xs">{label}</p></CardContent></Card>; }
