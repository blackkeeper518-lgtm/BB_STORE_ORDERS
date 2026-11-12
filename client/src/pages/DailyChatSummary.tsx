import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readDailyTrackingHistory } from "@/lib/canonical";
import { CalendarDays, Check, Clipboard, Download, RefreshCw, Search, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function dateLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? raw : new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }).format(parsed);
}
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " " )}"`; }
function codNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function productText(order: any) {
  return [order.telegram_product_display, order.manus_for_packer, order.for_packer_st_display, order.order_fibo_product, order.google_for_packer, order.packer_tag_display, order.sku]
    .map(value => String(value ?? "").trim()).find(Boolean) || "ไม่มีข้อมูลสินค้าใน DEAD";
}

export default function DailyChatSummary() {
  const [date, setDate] = useState(todayBangkok);
  const [search, setSearch] = useState("");
  const [copiedPhone, setCopiedPhone] = useState("");
  const query = useQuery({
    queryKey: ["daily-tracking-sent", date],
    queryFn: () => readDailyTrackingHistory(date),
    refetchInterval: 60_000,
  });
  const allSent = query.data?.orders ?? [];
  const needle = search.trim().toLocaleLowerCase();
  const sentOrders = useMemo(() => (needle ? allSent.filter((order: any) => [
    order.order_number, order.upsert_key, order.customer_name, order.facebook_name, order.phone, order.page_name, productText(order), order.full_address,
  ].some(value => String(value ?? "").toLocaleLowerCase().includes(needle))) : allSent), [allSent, needle]);
  const stats = useMemo(() => ({
    total: sentOrders.length,
    withProduct: sentOrders.filter((row: any) => productText(row) !== "ไม่มีข้อมูลสินค้าใน DEAD").length,
    pages: new Set(sentOrders.map((row: any) => String(row.page_id ?? row.page_name ?? "").trim()).filter(Boolean)).size,
    cod: sentOrders.reduce((sum: number, row: any) => sum + codNumber(row.cod_amount), 0),
  }), [sentOrders]);
  const exportCsv = () => {
    if (!sentOrders.length) return;
    const headers = ["order_number", "customer_name", "phone", "full_address", "product", "cod_amount", "page_name", "drakside_tracking_message", "sent_at", "upsert_key"];
    const csv = "\uFEFF" + [headers, ...sentOrders.map((row: any) => [row.order_number, row.customer_name, row.phone, row.full_address || row.parcel_address, productText(row), row.cod_amount, row.page_name, row.drakside_tracking_message, row.facebook_tracking_sent_at || row.sent_at || row.pickup_date, row.upsert_key])]
      .map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `genesis-sent-${date}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  const copyPhone = async (value: unknown) => {
    const phone = String(value ?? "").trim();
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    window.setTimeout(() => setCopiedPhone(""), 1600);
  };

  return <div className="min-h-[calc(100vh-2rem)] space-y-5 bg-[#070716] p-2 text-white sm:p-4 lg:p-6">
      <header className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,211,238,0.18),_transparent_50%),linear-gradient(120deg,_#0b1428,_#09091a)] p-5 shadow-[0_0_24px_rgba(34,211,238,.12)] sm:p-6">
      <div className="relative flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"><CalendarDays className="h-4 w-4" /> DAILY SENT · DEAD <Send className="h-3.5 w-3.5 text-emerald-300" /></div><h1 className="mt-3 text-2xl font-semibold sm:text-3xl">สรุปส่งเลขแล้วรายวัน</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-cyan-100/60">นับจากวิว 📓DEAD_xXx_NOTE เฉพาะการส่งเลขพัสดุ ไม่รวมยอดส่ง Telegram จาก GENESIS</p></div><div className="flex flex-wrap gap-2"><Input aria-label="เลือกวันที่ส่ง" type="date" value={date} onChange={event => setDate(event.target.value)} className="w-40 border-cyan-300/25 bg-[#09091a]/80 text-white [color-scheme:dark]" /><Button variant="outline" onClick={exportCsv} disabled={!sentOrders.length} className="border-emerald-400/25 bg-emerald-400/10 text-emerald-100"><Download className="mr-2 h-4 w-4" />Export ส่งแล้ว</Button><Button variant="outline" onClick={() => void query.refetch()} className="border-cyan-400/25 bg-cyan-400/10 text-cyan-100"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button></div></div>
      <div className="relative mt-5 flex max-w-2xl items-center gap-2 rounded-2xl border border-cyan-300/20 bg-black/20 px-3"><Search className="h-4 w-4 shrink-0 text-cyan-200/70" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาเลขออเดอร์ / ชื่อลูกค้า / เบอร์ / สินค้า / ที่อยู่" className="border-0 bg-transparent text-white placeholder:text-cyan-100/35 focus-visible:ring-0" /></div>
    </header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="ส่งแล้ววันนี้" value={stats.total.toLocaleString("th-TH")} tone="text-emerald-300" /><Stat label="มีข้อมูลสินค้า" value={stats.withProduct.toLocaleString("th-TH")} tone="text-cyan-200" /><Stat label="จำนวนเพจ" value={stats.pages.toLocaleString("th-TH")} tone="text-fuchsia-200" /><Stat label="COD รวม" value={`${stats.cod.toLocaleString("th-TH")} ฿`} tone="text-orange-300" /></div>
    {query.isError ? <Card className="rounded-2xl border-rose-400/30 bg-rose-950/20"><CardContent className="p-5 text-sm text-rose-100"><p className="font-semibold">อ่านประวัติ ⚡SENT ไม่สำเร็จ</p><p className="mt-1 break-words text-rose-100/70">{query.error instanceof Error ? query.error.message : "ตรวจการเชื่อมต่อวิว DEAD"}</p></CardContent></Card> : null}
    <Card className="overflow-hidden rounded-3xl border-cyan-300/15 bg-[#0b0a1b]/95 shadow-[0_0_18px_rgba(34,211,238,.07)]"><CardHeader className="border-b border-cyan-300/10 bg-gradient-to-r from-cyan-500/[0.08] to-emerald-400/[0.04]"><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="text-base text-cyan-50">⚡SENT · DEAD · {date}</CardTitle><span className="text-xs text-cyan-100/55">แสดงเฉพาะประวัติส่งเลขแล้ว</span></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[1400px] text-left text-xs"><thead className="border-b border-cyan-300/10 bg-black/20 text-cyan-100/55"><tr><th className="p-3">ออเดอร์ / สถานะ</th><th className="p-3">ลูกค้า / เบอร์</th><th className="p-3">สินค้า</th><th className="p-3">COD</th><th className="p-3">เพจ</th><th className="p-3">Drakside Tracking Message</th><th className="p-3">เวลาส่ง</th></tr></thead><tbody>{sentOrders.map((order: any) => { const phone = order.phone || order.extracted_phone || ""; return <tr key={order.upsert_key || order.id} className="border-b border-cyan-200/[0.06] align-top transition-colors hover:bg-cyan-300/[0.035]"><td className="p-3"><p className="font-semibold text-cyan-100">{order.order_number || "—"}</p><p className="mt-1 max-w-[240px] break-all font-mono text-[10px] text-cyan-100/35">{order.upsert_key || ""}</p><Badge className="mt-2 border-emerald-300/25 bg-emerald-400/10 text-emerald-200">⚡SENT</Badge></td><td className="p-3"><p className="font-medium text-white">{order.customer_name || "ไม่ระบุชื่อ"}</p><button type="button" onClick={() => void copyPhone(phone)} disabled={!phone} className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-cyan-300/20 bg-cyan-400/[.06] px-1.5 py-1 text-cyan-100/75 hover:bg-cyan-400/[.14] disabled:opacity-40"><span>{phone || "ไม่ระบุเบอร์"}</span>{copiedPhone === phone ? <Check className="h-3 w-3 text-emerald-300" /> : <Clipboard className="h-3 w-3" />}</button><p className="mt-1 max-w-xs text-cyan-100/45">{order.full_address || order.final_address_for_bill || order.parcel_address || "ไม่ระบุที่อยู่"}</p></td><td className="max-w-xs whitespace-pre-wrap p-3 text-cyan-50/80"><p>{productText(order)}</p><p className="mt-2 text-[10px] text-cyan-100/40">สินค้าในบรรทัดที่ 2 · จากข้อมูลออเดอร์</p></td><td className="p-3"><Badge className="border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100">{codNumber(order.cod_amount).toLocaleString("th-TH")} บาท</Badge></td><td className="p-3 text-cyan-100/80">{order.page_name || "—"}</td><td className="max-w-[420px] whitespace-pre-wrap p-3 text-cyan-50/75">{order.drakside_tracking_message || "—"}</td><td className="whitespace-nowrap p-3 font-mono text-emerald-100/75">{dateLabel(order.facebook_tracking_sent_at || order.sent_at || order.pickup_date || order.order_time_display)}</td></tr>; })}</tbody></table></div>{query.isLoading ? <p className="p-8 text-center text-sm text-cyan-100/55">กำลังอ่านประวัติ ⚡SENT…</p> : null}{!query.isLoading && !query.isError && !sentOrders.length ? <p className="p-8 text-center text-sm text-cyan-100/55">ไม่พบรายการ ⚡SENT ในวันที่เลือก</p> : null}</CardContent></Card>
  </div>;
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) { return <Card className="rounded-2xl border-cyan-300/15 bg-[#0b0a1b] shadow-[0_0_14px_rgba(34,211,238,.06)]"><CardContent className="p-4"><p className={`text-2xl font-semibold ${tone}`}>{value}</p><p className="mt-1 text-xs text-cyan-100/50">{label}</p></CardContent></Card>; }
