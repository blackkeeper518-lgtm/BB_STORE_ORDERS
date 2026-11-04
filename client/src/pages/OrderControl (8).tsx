// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// IMPORTS · รายการเครื่องมือของห้องออเดอร์
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { orderTimeSortKey, readCanonicalOrders } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, CheckCircle2, Clock3, Database, Download, ExternalLink, MessageCircle, Pencil, RefreshCw, Search, Send, ShoppingCart, WalletCards, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

type CanonicalOrderRow = Record<string, any> & {
  upsert_key: string;
  order_time_display: string;
};

// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// FORMATTERS · ฟังก์ชันแปลงค่าก่อนนำไปแสดงบนการ์ด
// money       = ยอด COD
// directText  = ช่องว่างให้แสดงเป็นขีด
// numeric     = ใช้รวมยอดเงิน
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
function money(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString("th-TH")} บาท` : String(value);
}

function directText(value: unknown) {
  return value == null || value === "" ? "—" : String(value);
}

function numeric(value: unknown) {
  const amount = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function truthy(value: unknown) {
  return value === true || ["true", "t", "1", "yes", "พร้อมส่ง", "ส่งได้", "pass"].includes(String(value ?? "").trim().toLowerCase());
}

function buildOrderCopyText(order: CanonicalOrderRow) {
  const orderNumber = directText(order.order_number_display || order.order_number);
  const orderTimePretty = directText(order.order_time_display);
  const codForDisplay = numeric(order.cod_amount);
  const customer = directText(order.customer_name || order.facebook_name);
  const phone = directText(order.phone || order.extracted_phone);
  const finalAddress = directText(order.final_address_for_bill || order.address_display_packer || order.full_address || order.addressclean);
  const productInfo = { best: directText(order.final_display_for_packer || order.telegram_product_display || order.final_product || order.sku) };
  return [orderNumber, orderTimePretty, codForDisplay ? `${codForDisplay.toLocaleString("th-TH")} บาท` : "", customer, phone, finalAddress, productInfo.best].filter(Boolean).join("\n");
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

function exportOrdersCsv(rows: CanonicalOrderRow[]) {
  const columns = ["order_number", "order_time_display", "page_name", "customer_name", "phone", "final_address_for_bill", "final_display_for_packer", "cod_amount", "delivery_status", "sent_at"];
  const csv = [columns, ...rows.map((row) => columns.map((column) => row[column]))].map((line) => line.map(csvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bb-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ⫘ BUSINESS DAY · “วันนี้” ของร้านตัดรอบ 14:00 น. ไม่ใช่วันปฏิทิน
// รอบปัจจุบัน: เมื่อวาน 14:00 → วันนี้ 14:00 (Asia/Bangkok)
function isToday(row: CanonicalOrderRow) {
  const now = new Date();
  const bkk = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(now);
  const part = (name: string) => Number(bkk.find((item) => item.type === name)?.value ?? 0);
  const todayCutoffUtc = Date.UTC(part("year"), part("month") - 1, part("day"), 7, 0, 0);
  const end = now.getTime() >= todayCutoffUtc ? todayCutoffUtc + 24 * 60 * 60 * 1000 : todayCutoffUtc;
  const start = end - 24 * 60 * 60 * 1000;
  const raw = row.order_time_display;
  const valueKey = orderTimeSortKey(raw);
  return valueKey >= orderTimeSortKey(new Date(start)) && valueKey < orderTimeSortKey(new Date(end));
}

function isSent(row: CanonicalOrderRow) {
  return String(row.delivery_status ?? "").trim().toUpperCase().replace(/^🔥\s*/, "") === "SENT" && Boolean(String(row.sent_at ?? "").trim());
}

// สถานะส่งได้: แก้เงื่อนไขตรงนี้ได้ ถ้ากติกา n8n เปลี่ยน
function canSend(row: CanonicalOrderRow) {
  return !isSent(row) && (truthy(row.is_ready_to_pack) || truthy(row.send_eligible) || truthy(row.telegram_bill_send_eligible) || String(row.cod_check_status ?? "").toUpperCase() === "PASS");
}

// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// MAIN ROOM · โครงหลักของหน้า Order Control
// แหล่งข้อมูล: readCanonicalOrders() → 🗝️HERMES_ARCHIVE
// ถ้าจะเปลี่ยนพื้นหลัง/ระยะห่าง/ขนาดหน้า ให้แก้ className ในส่วนนี้
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
export default function OrderControl() {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [pageFilter, setPageFilter] = useState("ทั้งหมด");
  const [selectedKey, setSelectedKey] = useState("");
  const [clock, setClock] = useState(() => new Date());
  const [copied, setCopied] = useState(false);
  const query = useQuery({
    queryKey: ["canonical-orders", search, fromDate, untilDate],
    queryFn: () => readCanonicalOrders(search, fromDate || null, untilDate || null),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  // ⫘ ORDER SORT · ใช้ CENTRAL ORDER CLOCK เรียงล่าสุดไว้บนสุดเสมอ
  const rawOrders = [...((query.data?.orders ?? []) as CanonicalOrderRow[])].sort((a, b) => orderTimeSortKey(b.order_time_display) - orderTimeSortKey(a.order_time_display));
  const pageNames = Array.from(new Set(rawOrders.map((row) => String(row.page_name ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "th"));
  const orders = pageFilter === "ทั้งหมด" ? rawOrders : rawOrders.filter((row) => String(row.page_name ?? "").trim() === pageFilter);
  const selectedOrder = orders.find((row) => row.upsert_key === selectedKey) ?? orders[0] ?? null;
  const todayOrders = orders.filter(isToday);
  const sentOrders = orders.filter(isSent);
  const sendableOrders = orders.filter(canSend);
  const blockedOrders = orders.filter((row) => !isSent(row) && !canSend(row));
  const totalCod = orders.reduce((sum, row) => sum + numeric(row.cod_amount), 0);
  const todayCod = todayOrders.reduce((sum, row) => sum + numeric(row.cod_amount), 0);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedOrder) {
      setSelectedKey("");
      return;
    }
    if (selectedKey !== selectedOrder.upsert_key && !orders.some((row) => row.upsert_key === selectedKey)) {
      setSelectedKey(selectedOrder.upsert_key);
    }
  }, [orders, selectedKey, selectedOrder]);

  async function copySelectedOrder() {
    if (!selectedOrder) return;
    await navigator.clipboard.writeText(buildOrderCopyText(selectedOrder));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="cosmic-stage min-h-full space-y-3 p-2 text-white sm:p-3 lg:p-4">
      <span className="cosmic-corner tl" /><span className="cosmic-corner br" />
      <header className="blackbox-hero cyber-glow relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-fuchsia-400/20 p-4 sm:p-5">
        <div className="hero-scanline" />
        <div className="relative z-10 max-w-3xl">
          <p className="orbit-kicker flex items-center gap-2 text-cyan-200/80"><Database className="h-3.5 w-3.5 text-cyan-300" /> ORBITAL ORDER CONTROL · N8N / SUPABASE</p>
          <h1 className="cyber-title mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">ข้อมูลออเดอร์ <span className="text-fuchsia-300">//</span> COMMAND DECK</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300/75">ศูนย์ควบคุมออเดอร์จาก n8n · เห็นต้นทาง สถานะ และเวลาจริงในจอเดียว</p>
          <div className="mt-3 flex flex-wrap items-center gap-2"><span className="live-chip"><span className="live-dot" /> LIVE ORDER STREAM</span><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">HERMES ARCHIVE · SECURE LINK</span></div>
        </div>
        <div className="central-clock hero-clock relative z-10"><span className="central-clock-label">CENTRAL ORDER CLOCK · BANGKOK</span><strong>{clock.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong><span className="central-clock-date">{clock.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span><small>เวลาไทย · order_time_display</small></div>
        <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching} className="relative z-10 border-cyan-300/30 bg-cyan-400/5 text-cyan-100 shadow-[0_0_20px_rgba(88,239,255,0.08)] hover:border-cyan-200/60 hover:bg-cyan-400/10">
          <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> รีเฟรช
        </Button>
      </header>

      <div className="signal-ticker rounded-xl"><span>✦ HERMES ARCHIVE // ORDER SIGNAL // COD VERIFIED // PRODUCT MAP ONLINE // TELEGRAM ROUTE READY // </span></div>

      {/* ⫘ SUMMARY CARDS · การ์ดสรุปยอดด้านบน: แก้สี/ขนาดที่ component Metric ด้านล่าง */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric icon={ShoppingCart} label="ออเดอร์ทั้งหมด" value={orders.length} suffix="รายการ" tone="pink" />
        <Metric icon={CalendarDays} label="ออเดอร์วันนี้" value={todayOrders.length} suffix="รายการ · รอบ 14:00" tone="violet" />
        <Metric icon={WalletCards} label="ยอด COD ทั้งหมด" value={money(totalCod)} tone="cyan" />
        <Metric icon={WalletCards} label="ยอด COD วันนี้" value={`${money(todayCod)} · รอบ 14:00`} tone="green" />
        <Metric icon={CheckCircle2} label="ส่งแล้ว" value={sentOrders.length} suffix="รายการ" tone="green" />
        <Metric icon={Send} label="ส่งได้" value={sendableOrders.length} suffix="รายการ" tone="cyan" />
        <Metric icon={XCircle} label="ส่งไม่ได้ / ต้องตรวจ" value={blockedOrders.length} suffix="รายการ" tone="pink" />
      </section>

      {/* ⫘ SEARCH BAR · ช่องค้นหา: ค้นจากข้อมูลแถวใน HERMES */}
      <div className="relative cyber-grid rounded-2xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/70" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา order / ลูกค้า / เบอร์ / SKU จาก Supabase" className="h-12 rounded-2xl border-cyan-300/20 bg-[#0d0a18]/90 pl-11 text-white shadow-[0_0_24px_rgba(88,239,255,0.06)] placeholder:text-slate-500 focus-visible:border-fuchsia-300/60 focus-visible:ring-fuchsia-400/20" />
      </div>

      <div className="order-filter-bar flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-300/15 bg-[#0d0a18]/80 p-2">
        <label className="filter-field"><span>ตั้งแต่</span><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
        <label className="filter-field"><span>ถึง</span><input type="date" value={untilDate} onChange={(event) => setUntilDate(event.target.value)} /></label>
        <label className="filter-field"><span>เพจ</span><select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}><option value="ทั้งหมด">ทุกเพจ</option>{pageNames.map((page) => <option key={page} value={page}>{page}</option>)}</select></label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => exportOrdersCsv(orders)} className="border-cyan-300/30 bg-cyan-400/5 text-cyan-100 hover:bg-cyan-400/15"><Download className="mr-2 h-4 w-4" />เอ็กซ์พอร์ต {orders.length} รายการ</Button>
          <Button type="button" variant="outline" onClick={() => { setFromDate(""); setUntilDate(""); setPageFilter("ทั้งหมด"); }} className="border-violet-300/25 bg-violet-400/5 text-violet-100 hover:bg-violet-400/15">ล้างตัวเลือก</Button>
        </div>
      </div>

      {query.error ? <Card className="border-pink-400/30 bg-pink-950/20 shadow-[0_0_24px_rgba(255,70,190,0.1)]"><CardContent className="p-5 text-sm text-pink-200">อ่านข้อมูลไม่สำเร็จ: {query.error instanceof Error ? query.error.message : String(query.error)}</CardContent></Card> : null}

      {/* ⫘ WORKBENCH · ซ้ายรายการออเดอร์ / ขวารายละเอียดออเดอร์ */}
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Card className="overflow-hidden border-violet-400/20 bg-[#10091b]/90 shadow-[0_0_28px_rgba(151,75,255,0.08)]">
          <CardHeader className="border-b border-violet-300/15 bg-violet-500/[0.04]"><CardTitle className="flex items-center justify-between text-base text-violet-100"><span><span className="mr-2 text-emerald-300">✦</span>รายการออเดอร์</span><span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-mono font-normal text-emerald-200">{orders.length} SIGNALS</span></CardTitle></CardHeader>
          {/* รายการการ์ดซ้าย: ลด/เพิ่มความสูงที่ max-h และระยะห่างที่ p-3 */}
          <CardContent className="max-h-[72vh] space-y-2 overflow-auto p-3">
            {query.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังอ่านข้อมูลจาก Supabase…</p> : null}
            {!query.isLoading && !query.error && orders.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบข้อมูล</p> : null}
            {/* การ์ด 1 ใบ · คอลัมน์ที่ใช้: order_number, customer_name, phone, page_name, order_time_display, final_display_for_packer, delivery_status, sent_at */}
            {orders.map((row) => <button key={row.upsert_key} type="button" onClick={() => setSelectedKey(row.upsert_key)} className={`order-list-card w-full rounded-2xl border p-3 text-left transition ${selectedOrder?.upsert_key === row.upsert_key ? "border-pink-300/60 bg-gradient-to-r from-fuchsia-500/15 to-emerald-400/5 shadow-[inset_3px_0_#ff5acb,0_0_18px_rgba(255,90,203,0.1)]" : "border-white/5 bg-black/15 hover:border-cyan-300/30 hover:bg-cyan-400/[0.04]"}`}>
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-sm text-cyan-200">{directText(row.order_number)}</span>{isSent(row) ? <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-2 py-0.5 text-[10px] font-semibold text-orange-200">🔥SENT</span> : <span className="rounded-full border border-cyan-300/20 px-2 py-0.5 text-[10px] text-cyan-200">รอส่ง</span>}</div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="text-white">{directText(row.customer_name)}</span><span className="font-mono text-emerald-200/80">{directText(row.phone)}</span></div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-violet-200/60"><span>📢 {directText(row.page_name)}</span><span>{row.order_time_display}</span></div>
              <div className="order-card-copy-preview mt-2 whitespace-pre-line line-clamp-4 text-[11px] leading-4 text-emerald-100/75">{buildOrderCopyText(row)}</div>
            </button>)}
          </CardContent>
        </Card>

        <Card className="border-fuchsia-400/20 bg-[#10091b]/90 shadow-[0_0_28px_rgba(255,75,197,0.07)]">
          {/* DETAIL CARD · แก้หัวการ์ดตรง CardHeader / ขนาดเนื้อหาตรง CardContent */}
          <CardHeader className="border-b border-fuchsia-300/15 bg-fuchsia-500/[0.04]"><CardTitle className="text-base text-fuchsia-100"><span className="mr-2 text-fuchsia-300">◈</span>ข้อมูลจาก n8n <span className="ml-2 text-[10px] font-mono font-normal uppercase tracking-[0.18em] text-cyan-200/50">DECODED PAYLOAD</span></CardTitle></CardHeader>
          <CardContent className="space-y-5 p-5">
            {!selectedOrder ? <p className="py-12 text-center text-sm text-slate-500">เลือกออเดอร์เพื่อดูข้อมูล</p> : <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-mono text-base font-semibold text-emerald-200">{directText(selectedOrder.order_number)}</p><p className="mt-1 text-xs text-slate-400">{directText(selectedOrder.customer_name)} · {directText(selectedOrder.phone)} · 📢 {directText(selectedOrder.page_name)}</p></div>
                <div className="flex items-center gap-2">{isSent(selectedOrder) && <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200">🔥SENT</span>}<span className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-2 py-1 text-[11px] text-cyan-100"><Clock3 className="h-3.5 w-3.5" />{selectedOrder.order_time_display}</span></div>
              </div>
              {/* FIELD GRID · ช่องข้อมูลสำคัญที่เห็นทันทีบนการ์ดขวา */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="COD" value={money(selectedOrder.cod_amount)} />
                <Info label="สินค้าสำหรับจัด" value={selectedOrder.final_display_for_packer} />
                <Info label="เส้นทางที่ n8n ระบุ" value={selectedOrder.route_reason_label || "⚪ [COMPLETENESS] สินค้าและที่อยู่ผ่านเกณฑ์"} />
              </div>
              {/* ADDRESS · ที่อยู่จาก final_address_for_bill; ถ้าเปลี่ยนคอลัมน์ให้แก้ตรง value นี้ */}
              <Info label="ที่อยู่จากข้อมูลกลาง" value={selectedOrder.final_address_for_bill} />
              <div className="grid gap-3 lg:grid-cols-2">
                <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-200/70">ก้อนออเดอร์ต้นทาง</p><pre className="data-pair-panel max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-violet-300/15 bg-black/20 p-4 text-xs leading-5 text-slate-300">{directText(selectedOrder.original)}</pre></section>
                <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">chat_timeline · ประวัติแชท</p><pre className="data-pair-panel max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-300/25 bg-emerald-400/[0.03] p-4 text-xs leading-5 text-emerald-50/80 shadow-[inset_0_0_24px_rgba(62,227,181,0.04)]">{directText(selectedOrder.chat_timeline)}</pre></section>
              </div>
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-pink-200">telegram_change_alert / telegram_change_alert_web · อ่านอย่างเดียว</p><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-pink-300/25 bg-pink-400/[0.03] p-4 text-xs leading-5 text-pink-50/80 shadow-[inset_0_0_24px_rgba(255,90,203,0.04)]">{directText(selectedOrder.telegram_change_alert_web || selectedOrder.telegram_change_alert || "ไม่มี CHANGE ALERT")}</pre></section>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void copySelectedOrder()} className="border-emerald-300/30 bg-emerald-400/5 text-emerald-100 hover:bg-emerald-400/15">{copied ? <Check className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} {copied ? "คัดลอกแล้ว" : "คัดลอกข้อมูลออเดอร์"}</Button>
                <Link href={`/order-history?search=${encodeURIComponent(selectedOrder.upsert_key)}`}><Button variant="outline" className="border-cyan-300/25 bg-cyan-400/5 text-cyan-100"><ExternalLink className="mr-2 h-4 w-4" />ประวัติ</Button></Link>
                <Link href={`/telegram-delivery?search=${encodeURIComponent(selectedOrder.upsert_key)}&room=queue`}><Button variant="outline" className="border-fuchsia-300/25 bg-fuchsia-400/5 text-fuchsia-100"><Send className="mr-2 h-4 w-4" />ส่งไป Telegram</Button></Link>
                <Link href={`/chats?search=${encodeURIComponent(selectedOrder.customer_name ?? selectedOrder.order_number ?? "")}`}><Button variant="outline" className="border-emerald-300/25 bg-emerald-400/5 text-emerald-100"><MessageCircle className="mr-2 h-4 w-4" />ไปห้องแชท</Button></Link>
                <Link href={`/telegram-delivery?search=${encodeURIComponent(selectedOrder.upsert_key)}&room=queue&edit=1`}><Button variant="outline" className="border-pink-300/25 bg-pink-400/5 text-pink-100"><Pencil className="mr-2 h-4 w-4" />แก้ไขข้อมูลส่ง</Button></Link>
              </div>
            </>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// SMALL COMPONENTS · การ์ดช่องข้อมูลและการ์ดตัวเลข
// Info: กล่องข้อมูล 1 ช่อง · แก้หน้าตาที่ className บรรทัดนี้
// Metric: การ์ดสรุปด้านบน · เปลี่ยน tone ได้เป็น pink/violet/cyan/green
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{directText(value)}</p></div>;
}

function Metric({ icon: Icon, label, value, suffix, tone }: { icon: typeof ShoppingCart; label: string; value: string | number; suffix?: string; tone: "pink" | "violet" | "cyan" | "green" }) {
  return <div className={`signal-metric signal-${tone}`}><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300/65">{label}</p><p className="mt-2 text-xl font-semibold tracking-tight text-white">{value} <span className="text-[10px] font-normal text-slate-300/55">{suffix}</span></p></div><span className="metric-icon"><Icon /></span></div></div>;
}
