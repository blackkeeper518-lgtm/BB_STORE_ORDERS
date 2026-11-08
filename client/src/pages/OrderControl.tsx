// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘
// 🎯 OrderControl : DATA ROUTE RULES
// ⭐⭐⭐V.12.1
// 
// 
// 
// ⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { getActiveCamp, readBbOrderEvidence, readBbOrderEvidenceBatch, readCanonicalOrders } from "@/lib/canonical";
import { getOrderWarnings } from "@/lib/orderWarnings";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CalendarDays,
  Coins,
  Clipboard,
  Clock3,
  Database,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Loader2,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

const baht = new Intl.NumberFormat("th-TH");
type GeneratedSummary = { orderNumber: string; customerName: string; phone: string; address: string; product: string; cod: string; copyText: string };

function money(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${baht.format(value)} ฿`;
}

function timeLabel(value: string | null | undefined) {
  if (!value) return "ไม่ระบุเวลา";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function dateTimeLabel(value: string | null | undefined) {
  if (!value) return "ไม่ระบุวันเวลา";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }).format(date);
}

function bangkokParts(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
}


function orderDisplayParts(value: string | null | undefined) {
  const match = String(value ?? "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? rawYear + 1957 : rawYear > 2400 ? rawYear - 543 : rawYear;
  return { date: `${year.toString().padStart(4, "0")}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`, time: `${match[4].padStart(2, "0")}:${match[5]}` };
}

function bangkokTodayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter(part => part.type !== "literal").map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isSentFromTelegramRoom(order: any) {
  const sentValues = ["1", "true", "t", "sent", "delivered", "sent_to_telegram", "ไปแล้วไปลับ"];
  const fields = [order.telegram_status, order.delivery_status, order.delivery_state].map(value => String(value ?? "").trim().toLowerCase());
  const viewFlag = String(order.drakside_is_sent ?? "").trim().toLowerCase();
  const sentFlag = String(order.telegram_sent ?? "").trim().toLowerCase();
  return fields.some(value => sentValues.includes(value)) || ["1", "true", "t"].includes(viewFlag) || ["1", "true", "t", "sent"].includes(sentFlag);
}

function orderDisplaySortKey(value: string | null | undefined) {
  const parts = orderDisplayParts(value);
  return parts ? Number(parts.date.replaceAll("-", "") + parts.time.replace(":", "")) : 0;
}

function customerHistoryLines(order: any): string[] {
  const parse = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(item => String(item ?? '').trim()).filter(Boolean);
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(item => String(item ?? '').trim()).filter(Boolean);
      } catch { /* plain text timeline */ }
      return value.split('\n').map(line => line.trim()).filter(Boolean);
    }
    return [];
  };
  const normalized = parse(order.normalized_chat_timeline);
  const timeline = parse(order.chat_timeline);
  const lines = normalized.length ? normalized : timeline;
  return Array.from(new Set(lines));
}

function customerHistoryText(order: any): string {
  const lines = customerHistoryLines(order);
  return lines.length ? lines.join('\n') : String(order.telegram_copy_text ?? '');
}

function itemDisplay(item: any) {
  return item.bb_pack_center || item.display_for_packer || item.master_display_for_packer ||
    item.product_name || item.th_name || item.sku || "💬 สินค้าขอพักร้อนแป๊บ เดี๋ยวกลับมาให้คิดถึง!";
}

function orderProductPreview(order: any) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.map((item: any) => {
      const quantity = item.quantity ?? item.qty;
      return itemDisplay(item);
    }).join(" · ");
  }
  return itemDisplay(order);
}

function orderProductQuantity(order: any) {
  if (Array.isArray(order.items) && order.items.length) {
    return order.items.map((item: any) => item.quantity ?? item.qty ?? "—").join(" + ");
  }
  const explicit = order.quantity ?? order.qty ?? order.extracted_qty;
  if (explicit !== undefined && explicit !== null && explicit !== "") return explicit;
  const product = String(order.bb_pack_center ?? "");
  const quantities = Array.from(product.matchAll(/(?:\bx|×|จำนวน)\s*(\d+(?:\.\d+)?)/gi), match => match[1]);
  return quantities.length ? quantities.join(" + ") : "—";
}

function orderAddress(order: any) {
  return order.address_fibo_selected_clean || order.telegram_primary_address || order.address_display_packer || order.rescue_address_normalized || order.full_address || "ไม่ระบุที่อยู่";
}

function orderBillCopyText(order: any) {
  const storedText = String(order?.telegram_copy_text ?? "").trim();
  if (storedText) return storedText;
  const items = Array.isArray(order?.items) && order.items.length
    ? order.items.map((item: any) => itemDisplay(item)).join("\n")
    : itemDisplay(order);
  const cod = order?.cod_amount == null || order.cod_amount === "" ? "" : `${money(order.cod_amount)} บาท`;
  return [order?.order_number, order?.order_time_display, cod, order?.facebook_name || order?.customer_name, order?.phone, orderAddress(order), items]
    .filter(Boolean)
    .join("\n");
}

function orderDnaNodes(order: any, parcelRows: Array<Record<string, any>>, evidence: unknown) {
  const evidenceRows = Array.isArray(evidence) ? evidence : [];
  const hasChat = customerHistoryLines({ ...order, ...(evidence && typeof evidence === "object" ? evidence : {}) }).length > 0 || evidenceRows.length > 0;
  const hasOrder = Boolean(order?.order_number || order?.upsert_key);
  const hasBill = Boolean(String(order?.telegram_copy_text ?? order?.telegram_body_view ?? "").trim() || order?.items?.length || order?.sku || order?.display_for_packer);
  const hasParcel = parcelRows.some(row => String(row.tracking_number ?? "").trim());
  const parcelSent = parcelRows.some(row => /sent|delivered|ส่งแล้ว/i.test(String(row.delivery_status ?? row.parcel_delivery_status ?? row.facebook_tracking_status ?? "")) || Boolean(row.sent_at ?? row.parcel_sent_at));
  const hasCustomer = Boolean(order?.page_id && (order?.thread_id || order?.threadId));
  return [
    { key: "CHAT", label: "มีแชทแล้ว", ok: hasChat, tone: "pink" },
    { key: "ORDER", label: "จับออเดอร์แล้ว", ok: hasOrder, tone: "violet" },
    { key: "BILL", label: "มีใบสรุปแล้ว", ok: hasBill, tone: "magenta" },
    { key: "PARCEL", label: "มีเลขแล้ว", ok: hasParcel, tone: "cyan" },
    { key: "TRACKING", label: hasParcel ? (parcelSent ? "ส่งแล้ว" : "พร้อมส่ง") : "รอเลขพัสดุ", ok: hasParcel, tone: parcelSent ? "green" : "cyan" },
    { key: "CUSTOMER", label: "มีห้องแชท", ok: hasCustomer, tone: "violet" },
  ];
}

function statusFor(order: { is_ready_to_pack: boolean; cod_check_status: string | null; audit_status: string | null; order_status: string | null; telegram_status: string | null; review_status?: string | null }) {
  if (order.review_status === "PASSED") return { label: "ผ่านแล้ว", tone: "neon-status neon-status-cyan", icon: <CheckCircle2 className="h-3 w-3" /> };
  if (order.review_status === "FAILED") return { label: "ไม่ผ่าน", tone: "neon-status neon-status-pink", icon: <AlertTriangle className="h-3 w-3" /> };
  const cod = String(order.cod_check_status ?? "").toUpperCase();
  const audit = `${order.audit_status ?? ""} ${order.order_status ?? ""}`;
  if (cod && cod !== "PASS") return { label: "เช็คยอด", tone: "neon-status neon-status-pink", icon: <AlertTriangle className="h-3 w-3" /> };
  if (!order.is_ready_to_pack || /ตรวจ|unmatch|check|missing|needs/i.test(audit)) return { label: "ต้องตรวจ", tone: "neon-status neon-status-violet", icon: <ShieldAlert className="h-3 w-3" /> };
  if (String(order.telegram_status ?? "").toUpperCase() === "SENT") return { label: "ส่งแล้ว", tone: "neon-status neon-status-cyan", icon: <Send className="h-3 w-3" /> };
  return { label: "แมปแล้ว", tone: "neon-status neon-status-fuchsia", icon: <CheckCircle2 className="h-3 w-3" /> };
}

function StatCard({ label, value, detail, accent, icon, onClick, disabled }: { label: string; value: number | string; detail: string; accent: string; icon: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  const card = <Card className="neon-metric-card rounded-2xl"><CardContent className="flex items-center justify-between p-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/45">{label}</p><p className="mt-2 font-mono text-2xl font-semibold text-white">{typeof value === "number" ? value.toLocaleString("th-TH") : value}</p><p className="mt-1 text-[11px] text-fuchsia-100/35">{detail}</p></div><div className="metric-orb">{icon}</div></CardContent></Card>;
  if (!onClick) return card;
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={`${label}: ${detail}`} title={detail} className="w-full rounded-2xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400 disabled:cursor-wait">{card}</button>;
}

export default function OrderControl() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mapped" | "review" | "cod">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftCustomer, setDraftCustomer] = useState("");
  const [draftProduct, setDraftProduct] = useState("");
  const [draftCod, setDraftCod] = useState("");
  const [showDraftSummary, setShowDraftSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummary | null>(null);
  const [previewText, setPreviewText] = useState("");
  const [flashBusinessCode, setFlashBusinessCode] = useState(() => localStorage.getItem("flash-business-code") || "");
  const [flashSaved, setFlashSaved] = useState(false);
  const [reviewOverrides, setReviewOverrides] = useState<Record<string, "PASSED" | "FAILED">>(() => {
    try { return JSON.parse(localStorage.getItem(`order-review-${getActiveCamp()}`) || "{}"); } catch { return {}; }
  });
  const liveQuery = useQuery({
    queryKey: ["canonical-orders"],
    queryFn: () => readCanonicalOrders(),
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const parcelQueueQuery = trpc.parcels.mappingQueue.useQuery({ status: "all", limit: 500 }, { staleTime: 30_000, refetchInterval: 60_000 });
  const orders = liveQuery.data?.orders ?? [];
  const todayKey = bangkokTodayKey();
  const stats = {
    total: orders.length,
    today: orders.filter((order: any) => {
      const displayDate = orderDisplayParts(order.order_time_display)?.date;
      const sourceDate = displayDate || bangkokParts(order.order_time ?? "")?.date;
      return sourceDate === todayKey;
    }).length,
    mapped: orders.filter((order: any) => order.alien_audit_status === "MATCHED" || order.mapping_status === "MATCHED" || order.mapping_status === "APPROVED").length,
    review: orders.filter((order: any) => statusFor(order).label === "ต้องตรวจ").length,
    codCheck: orders.filter((order: any) => statusFor(order).label === "เช็คยอด").length,
    totalCod: orders.reduce((total: number, order: any) => {
      const rawCod = order.cod_amount;
      const amount = typeof rawCod === "number" ? rawCod : Number(String(rawCod ?? "").replace(/[^\d.-]/g, ""));
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0),
    sentToPacker: orders.filter(isSentFromTelegramRoom).length,
  };
  const summaryMutation = trpc.orders.generateSummary.useMutation({ onSuccess: setGeneratedSummary });

  useEffect(() => {
    if (!selectedNumber && orders[0]) setSelectedNumber(orders[0].order_number);
    if (selectedNumber && orders.length && !orders.some(order => order.order_number === selectedNumber)) setSelectedNumber(orders[0]?.order_number ?? null);
  }, [orders, selectedNumber]);

  const pageOptions = useMemo(() => Array.from(new Set(orders.map((order: any) => String(order.page_name ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "th")), [orders]);
  const searchNeedle = search.trim().toLowerCase();
  const visibleOrders = useMemo(() => orders
    .filter(order => {
      if (searchNeedle && !JSON.stringify(order).toLowerCase().includes(searchNeedle)) return false;
      const parts = orderDisplayParts(order.order_time_display);
      if (!parts) return !dateFrom && !dateTo && !timeFrom && !timeTo && !pageFilter;
      if (dateFrom && parts.date < dateFrom) return false;
      if (dateTo && parts.date > dateTo) return false;
      if (timeFrom && parts.time < timeFrom) return false;
      if (timeTo && parts.time > timeTo) return false;
      if (pageFilter && String(order.page_name ?? "") !== pageFilter) return false;
      if (filter === "all") return true;
      const status = statusFor(order).label;
      if (filter === "mapped") return status === "แมปแล้ว";
      if (filter === "review") return status === "ต้องตรวจ";
      return status === "เช็คยอด";
    })
    .sort((a, b) => orderDisplaySortKey(b.order_time_display) - orderDisplaySortKey(a.order_time_display)), [orders, searchNeedle, filter, dateFrom, dateTo, timeFrom, timeTo, pageFilter]);
  const selectedOrder = orders.find(order => order.order_number === selectedNumber) ?? null;
  const selectedOrderWarnings = selectedOrder ? getOrderWarnings(selectedOrder) : [];
  const selectedParcelRows = useMemo(() => {
    if (!selectedOrder) return [] as Array<Record<string, any>>;
    const normalize = (value: unknown) => String(value ?? "").replace(/\D/g, "");
    const phone = normalize(selectedOrder.phone);
    const orderKeys = [selectedOrder.order_number, selectedOrder.upsert_key].map(value => String(value ?? "").trim().toLowerCase()).filter(Boolean);
    const customer = String(selectedOrder.customer_name || selectedOrder.facebook_name || "").trim().toLowerCase();
    return ((parcelQueueQuery.data ?? []) as Array<Record<string, any>>).filter(row => {
      const rowPhone = normalize(row.phone_number ?? row.order_phone ?? row.matched_phone ?? row.phone);
      const rowKeys = [row.order_number, row.order_number_display, row.upsert_key].map(value => String(value ?? "").trim().toLowerCase());
      const rowCustomer = String(row.consignee ?? row.customer_name ?? row.facebook_name ?? row.recipient_name ?? "").trim().toLowerCase();
      return Boolean((phone && rowPhone && phone === rowPhone) || orderKeys.some(key => key && rowKeys.includes(key)) || (customer && rowCustomer && (customer === rowCustomer || customer.includes(rowCustomer) || rowCustomer.includes(customer))));
    }).slice(0, 8);
  }, [parcelQueueQuery.data, selectedOrder]);
  const selectedEvidenceQuery = useQuery({
    queryKey: ["bb-order-evidence", selectedOrder?.upsert_key],
    queryFn: () => readBbOrderEvidence(String(selectedOrder!.upsert_key)),
    enabled: Boolean(selectedOrder?.upsert_key),
    staleTime: 60_000,
  });
  const reviewOrder = (order: any, status: "PASSED" | "FAILED") => {
    const key = String(order.upsert_key || order.order_number);
    const next = { ...reviewOverrides, [key]: status };
    setReviewOverrides(next);
    localStorage.setItem(`order-review-${getActiveCamp()}`, JSON.stringify(next));
  };
  const orderWithReview = (order: any) => ({ ...order, review_status: reviewOverrides[String(order.upsert_key || order.order_number)] || order.review_status || null });
  const exportOrders = async () => {
    const evidenceRows = await readBbOrderEvidenceBatch(visibleOrders.map((order: any) => String(order.upsert_key ?? "")));
    const evidenceByKey = new Map(evidenceRows.map((row: any) => [String(row.upsert_key), row]));
    const headers = ["วันที่", "เวลา", "ชื่อเพจ", "ชื่อลูกค้า", "เบอร์", "ที่อยู่", "ยอด COD", "สินค้า", "จำนวน", "ประวัติแชท"];
    const rows = visibleOrders.map((raw: any) => {
      const order = orderWithReview({ ...raw, ...(evidenceByKey.get(String(raw.upsert_key ?? "")) ?? {}) });
      const parts = orderDisplayParts(order.order_time_display);
      const dateText = parts?.date || order.order_date || "ไม่ระบุวันที่";
      const timeText = parts?.time || order.time_th || "ไม่ระบุเวลา";
      return [dateText, timeText, order.page_name, order.customer_name, order.phone, orderAddress(order), order.cod_amount, orderProductPreview(order), orderProductQuantity(order), customerHistoryText(order)];
    });
    const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${getActiveCamp().toLowerCase()}-orders-${dateFrom || dateTo || "filtered"}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  const selectedOrderWithReview = selectedOrder ? orderWithReview(selectedOrder) : null;

  const copySummary = async () => {
    if (!selectedOrder) return;
    const summary = orderBillCopyText(selectedOrder);
    await navigator.clipboard?.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const previewSummary = (order: any) => {
    setPreviewText(orderBillCopyText(order));
  };

  const copyGenerated = async () => {
    if (!generatedSummary) return;
    await navigator.clipboard?.writeText(generatedSummary.copyText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="order-control-nebula min-h-[calc(100vh-2rem)] text-white">
    <div className="mx-auto max-w-[1680px] space-y-5 p-3 sm:p-5 lg:p-7">
      <header className="order-control-header relative overflow-hidden rounded-3xl border border-white/10 px-6 py-6 shadow-2xl shadow-black/30 sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-orange-700/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300"><Flame className="h-3.5 w-3.5" /> NIGHTOPS · ORDER CONTROL</div><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">ห้องควบคุมออเดอร์</h1></div>
          <div className="flex flex-wrap items-center gap-2"><Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE DATA</Badge><Badge variant="outline" className="border-orange-500/30 bg-orange-500/5 text-orange-300"><Database className="mr-1.5 h-3 w-3" /> Supabase</Badge><Button variant="outline" size="sm" onClick={exportOrders} disabled={!visibleOrders.length} className="border-emerald-400/20 bg-emerald-400/5 text-emerald-200"><Download className="mr-2 h-3.5 w-3.5" /> Export CSV</Button><Button variant="outline" size="sm" onClick={() => { void liveQuery.refetch(); }} disabled={liveQuery.isFetching} className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${liveQuery.isFetching ? "animate-spin" : ""}`} /> รีเฟรช</Button></div>
        </div>
      </header>

      <Card className="hidden rounded-2xl border-orange-400/20 bg-orange-400/[0.04]"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(251,146,60,0.8)]" /><p className="text-sm font-semibold text-orange-100">FLASH BUSINESS · ศูนย์เช็คสถานะขนส่ง</p></div><p className="mt-1 text-xs text-slate-400">ใส่รหัสธุรกิจไว้เตรียมต่อ Flash API — ค่านี้เก็บใน Browser เครื่องนี้และยังไม่ส่งออกจากหน้าเว็บ</p></div><div className="flex w-full gap-2 sm:w-auto"><Input value={flashBusinessCode} onChange={event => { setFlashBusinessCode(event.target.value); setFlashSaved(false); }} placeholder="Flash Business Code" className="h-9 min-w-0 border-orange-300/20 bg-black/30 font-mono text-xs text-white placeholder:text-slate-600 sm:w-56" /><Button size="sm" variant="outline" onClick={() => { localStorage.setItem("flash-business-code", flashBusinessCode.trim()); setFlashSaved(true); }} className="border-orange-300/30 bg-orange-300/10 text-orange-100 hover:bg-orange-300/20">{flashSaved ? "บันทึกแล้ว" : "บันทึกรหัส"}</Button></div></CardContent></Card>

      <Card className={`hidden rounded-2xl border ${liveQuery.isError ? "border-red-500/30 bg-red-950/20" : liveQuery.isFetching ? "border-amber-400/30 bg-amber-950/10" : "border-emerald-500/25 bg-emerald-950/10"}`}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex items-center gap-3"><div className={`h-3 w-3 rounded-full ${liveQuery.isError ? "bg-red-400" : liveQuery.isFetching ? "animate-pulse bg-amber-300" : "bg-emerald-400"}`} /><div><p className="text-sm font-semibold text-white">{liveQuery.isError ? "บันทึก/อ่านออเดอร์ไม่ครบ" : liveQuery.isFetching ? "กำลังตรวจสอบข้อมูลออเดอร์…" : "สถานะสายออเดอร์พร้อม"}</p></div></div><Badge className={liveQuery.isError ? "border-red-400/30 bg-red-400/10 text-red-300" : liveQuery.isFetching ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"}>{liveQuery.isError ? "INCOMPLETE" : liveQuery.isFetching ? "CHECKING" : "LOADED"}</Badge></CardContent></Card>

      <div className="hidden flex items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/[0.04] px-4 py-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300">ADMIN ORDER SUMMARY</p><p className="mt-1 text-sm font-semibold text-white">สร้างใบสรุปออเดอร์จากข้อความลูกค้า</p></div><Button size="sm" variant="outline" onClick={() => setShowDraftSummary(value => !value)} className="border-orange-400/30 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20">{showDraftSummary ? "ซ่อน" : "＋ เพิ่ม"}</Button></div>
      {showDraftSummary && (
      <Card className="overflow-hidden rounded-3xl border-orange-500/20 bg-[#111116] shadow-2xl shadow-orange-950/10"><CardContent className="p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300"><Sparkles className="h-3.5 w-3.5" /> ADMIN ORDER SUMMARY</div><h2 className="mt-2 text-xl font-semibold text-white">วางที่อยู่ แล้วสร้างใบสรุปออเดอร์</h2><p className="mt-1 text-xs leading-5 text-slate-500">ระบบจะอ่านชื่อ เบอร์โทร ที่อยู่ สินค้า และ COD จากข้อความ แล้วสร้างเลข <span className="font-mono text-orange-300">ORD</span> ให้อัตโนมัติ โดยยังไม่เขียนลงฐานข้อมูลจริง</p></div><Badge variant="outline" className="w-fit border-orange-500/30 bg-orange-500/5 text-orange-200">DRAFT MODE</Badge></div><div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_0.6fr]"><textarea value={draftText} onChange={event => setDraftText(event.target.value)} placeholder={'ก๊อปข้อความลูกค้าหรือที่อยู่มาวางที่นี่…\nเช่น ชื่อ: สมชาย ใจดี\nโทร: 0812345678\nบ้านเลขที่…'} className="min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-600 focus:border-orange-400/50 focus:ring-2 focus:ring-fuchsia-500/20" /><div className="grid content-start gap-3 sm:grid-cols-3 lg:grid-cols-1"><Input value={draftCustomer} onChange={event => setDraftCustomer(event.target.value)} placeholder="ชื่อลูกค้า (ถ้ามี)" className="border-white/10 bg-black/30 text-white placeholder:text-slate-600" /><Input value={draftProduct} onChange={event => setDraftProduct(event.target.value)} placeholder="สินค้า / SKU (ถ้ามี)" className="border-white/10 bg-black/30 text-white placeholder:text-slate-600" /><Input value={draftCod} onChange={event => setDraftCod(event.target.value)} placeholder="COD (ถ้ามี)" className="border-white/10 bg-black/30 text-white placeholder:text-slate-600" /></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-600">{draftText.length.toLocaleString()} ตัวอักษร · แก้ไขข้อมูลได้ก่อนคัดลอก</span><Button disabled={!draftText.trim() || summaryMutation.isPending} onClick={() => summaryMutation.mutate({ rawText: draftText, customerName: draftCustomer, product: draftProduct, cod: draftCod })} className="rounded-xl bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-950/30 hover:from-orange-500 hover:to-red-500"><Sparkles className="mr-2 h-4 w-4" />{summaryMutation.isPending ? "กำลังสรุป…" : "สร้างใบสรุป ORD"}</Button></div>{generatedSummary && <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]"><div className="rounded-2xl border border-orange-400/30 bg-orange-500/[0.04] p-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-lg font-semibold text-orange-200">{generatedSummary.orderNumber}</p><Button size="sm" variant="outline" onClick={copyGenerated} className="border-orange-400/20 bg-orange-500/5 text-orange-200 hover:bg-orange-500/10">{copied ? <Check className="mr-2 h-3.5 w-3.5" /> : <Clipboard className="mr-2 h-3.5 w-3.5" />}{copied ? "คัดลอกแล้ว" : "คัดลอกใบสรุป"}</Button></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-[10px] uppercase tracking-wider text-slate-600">ลูกค้า</p><p className="mt-1 text-slate-200">{generatedSummary.customerName}</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-600">โทร</p><p className="mt-1 font-mono text-slate-300">{generatedSummary.phone || "ไม่ระบุ"}</p></div><div className="sm:col-span-2"><p className="text-[10px] uppercase tracking-wider text-slate-600">ที่อยู่</p><p className="mt-1 leading-6 text-slate-300">{generatedSummary.address || "ไม่ระบุที่อยู่"}</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-600">สินค้า</p><p className="mt-1 text-slate-200">{generatedSummary.product}</p></div><div><p className="text-[10px] uppercase tracking-wider text-slate-600">COD</p><p className="mt-1 text-orange-200">{generatedSummary.cod === "ไม่ระบุ" ? generatedSummary.cod : `${generatedSummary.cod} บาท`}</p></div></div></div><pre className="overflow-auto rounded-2xl border border-white/5 bg-black/40 p-4 font-mono text-xs leading-6 text-slate-400">{generatedSummary.copyText}</pre></div>}</CardContent></Card>
      )}

      {liveQuery.isError ? <Card className="rounded-2xl border-red-500/30 bg-red-950/20"><CardContent className="flex items-start gap-3 p-5 text-sm text-red-200"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" /><div><p className="font-semibold">อ่านข้อมูลจริงไม่สำเร็จ</p><p className="mt-1 text-red-200/70">ตรวจสอบการเชื่อมต่อ Supabase และสิทธิ์อ่านข้อมูล</p><p className="mt-2 rounded-lg border border-red-300/10 bg-black/20 p-2 font-mono text-[11px] leading-5 text-red-100/80">{liveQuery.error.message}</p></div></CardContent></Card> : null}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          <StatCard
            label="🧾 ทุกบิลในคลัง"
            value={liveQuery.isFetching ? "…" : (stats.total ?? 0)}
            detail={liveQuery.isFetching ? "กำลังดึงรายการใหม่…" : liveQuery.isError ? "โหลดไม่สำเร็จ · กดเพื่อลองอีกครั้ง" : "กดเพื่อโหลดข้อมูลล่าสุด · สูงสุด 1,000 รายการ"}
            accent="bg-orange-500/10 text-orange-300"
            icon={<PackageCheck className="h-5 w-5" />}
            onClick={() => { void liveQuery.refetch(); }}
            disabled={liveQuery.isFetching}
          />
          <StatCard label="ออเดอร์วันนี้" value={stats.today} detail="อิงวันประเทศไทย · Asia/Bangkok" accent="bg-cyan-500/10 text-cyan-300" icon={<CalendarDays className="h-5 w-5" />} />
          <StatCard label="ต้องตรวจ" value={stats.review} detail="บิลที่สถานะยังต้องตรวจ" accent="bg-orange-500/10 text-orange-300" icon={<ShieldAlert className="h-5 w-5" />} />
          <StatCard label="ยอดรวม COD" value={money(stats.totalCod)} detail="รวมจากรายการที่โหลด · สูงสุด 1,000 บิล" accent="bg-emerald-500/10 text-emerald-300" icon={<Coins className="h-5 w-5" />} />
          <StatCard label="ส่งแพ็กแล้ว" value={stats.sentToPacker} detail="สถานะส่งสำเร็จจากห้องส่ง Telegram" accent="bg-fuchsia-500/10 text-fuchsia-300" icon={<Send className="h-5 w-5" />} />
        </div>





      {selectedOrder ? <div className="blackbox-action-dock flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300">SELECTED SIGNAL</p><p className="mt-1 font-mono text-xs text-fuchsia-100/70">{selectedOrder.order_number} · {statusFor(selectedOrderWithReview || selectedOrder).label}</p></div><div className="flex flex-wrap gap-2"><Link href={`/order-history?search=${encodeURIComponent(selectedOrder.order_number)}`}><Button size="sm" variant="outline" className="border-cyan-300/35 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"><Clock3 className="mr-2 h-3.5 w-3.5" />ส่งไปห้องประวัติ</Button></Link><Link href={`/telegram-delivery?search=${encodeURIComponent(selectedOrder.order_number)}&room=queue`}><Button size="sm" variant="outline" className="border-fuchsia-300/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20"><Clipboard className="mr-2 h-3.5 w-3.5" />แก้ไขออเดอร์</Button></Link></div></div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)]">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#111116] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><Filter className="ml-1 h-4 w-4 text-slate-500" />{([ ["all", "ทั้งหมด", stats?.total ?? 0], ["mapped", "แมปแล้ว", stats?.mapped ?? 0], ["review", "ต้องตรวจ", stats?.review ?? 0], ["cod", "เช็คยอด", stats?.codCheck ?? 0] ] as const).map(([key, label, count]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-xl px-3 py-2 text-xs transition ${filter === key ? "bg-orange-500 font-semibold text-black" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{label} <span className="ml-1 opacity-60">{count}</span></button>)}</div><div className="relative sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาออเดอร์, ลูกค้า, SKU…" className="h-9 rounded-xl border-white/10 bg-black/20 pl-9 text-sm text-white placeholder:text-slate-600 focus-visible:ring-amber-400" /></div></div>


        <Card className="order-detail-card border-cyan-300/15 bg-[#08070e]/95 shadow-[0_0_24px_rgba(88,225,255,0.045)]">
          {/* DETAIL CARD · แก้หัวการ์ดตรง CardHeader / ขนาดเนื้อหาตรง CardContent */}
          <CardHeader className="order-detail-head border-b border-cyan-300/15"><CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base text-cyan-100"><span><span className="mr-2 text-cyan-300">◈</span>ออเดอร์ที่เลือก <span className="ml-2 text-[10px] font-mono font-normal uppercase tracking-[0.18em] text-cyan-200/60">ORDER DECK · LIVE</span></span><span className="rounded-full border border-emerald-300/25 bg-emerald-400/[0.06] px-2 py-1 text-[9px] font-mono tracking-wider text-emerald-200">AUTO VIEW · READ ONLY</span></CardTitle></CardHeader>
          <CardContent className="space-y-5 p-5">
            {!selectedOrder ? <p className="py-12 text-center text-sm text-slate-500">เลือกออเดอร์เพื่อดูข้อมูล</p> : <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-mono text-base font-semibold text-emerald-200">{directText(selectedOrder.order_number)}</p><p className="mt-1 text-xs text-slate-400">{directText(selectedOrder.customer_name)} · {directText(selectedOrder.phone)} · 📢 {directText(selectedOrder.page_name)}</p></div>
                <div className="flex items-center gap-2">{isSent(selectedOrder) && <span className="rounded-full border border-orange-300/30 bg-orange-400/10 px-3 py-1 text-xs font-semibold text-orange-200">🔥SENT</span>}<span className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/5 px-2 py-1 text-[11px] text-cyan-100"><Clock3 className="h-3.5 w-3.5" />{selectedOrder.order_time_display}</span></div>
              </div>
              {selectedOrderWarnings.length > 0 ? <section className="rounded-2xl border border-rose-300/45 bg-rose-950/20 p-3 sm:p-4" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xs font-bold uppercase tracking-[.18em] text-rose-100">จังหวัดเสี่ยง / งดส่ง</h3><span className="text-[9px] text-slate-400">แสดงตามสัญญาณพื้นที่เท่านั้น</span></div>
                <ul className="mt-2 space-y-1.5">{selectedOrderWarnings.map((warning) => <li key={warning.code} className="flex items-start gap-2 text-xs leading-5 text-rose-100"><span className="shrink-0 rounded border border-rose-200/40 px-1.5 py-0.5 text-[9px] font-bold">งดส่ง</span><span>{warning.message}</span></li>)}</ul>
              </section> : null}
              {/* SUMMARY + SOURCE · สรุปตรวจเร็วแยกจากก้อนออเดอร์แท้ */}
              <div className="grid min-w-0 gap-3 2xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <section className="order-summary-well min-w-0 rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.025] p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">01 / VERIFIED SUMMARY</h3><span className="text-[9px] font-mono text-slate-500">ข้อมูลสำหรับตรวจเร็ว</span></div>
                  <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                    <Info label="ยอด COD" value={money(selectedOrder.cod_amount)} />
                    <Info label="สินค้าสำหรับจัด" value={selectedOrder.final_display_for_packer} />
                    <Info label="ที่อยู่จากข้อมูลกลาง" value={selectedOrder.final_address_for_bill} />
                  </div>
                </section>
                <section className="order-original-well min-w-0 rounded-2xl border border-violet-300/30 bg-violet-500/[0.035] p-3 sm:p-4 shadow-[inset_0_0_24px_rgba(151,75,255,0.045)]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-100">02 / ก้อนออเดอร์แท้</h3><span className="rounded-full border border-violet-300/20 bg-violet-400/[0.07] px-2 py-0.5 text-[9px] font-mono text-violet-200">SOURCE · selectedOrder.original</span></div>
                  <pre className="data-pair-panel max-h-[26rem] min-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-violet-300/20 bg-[#080611]/75 p-3 text-xs leading-5 text-violet-50/90 sm:p-4">{directText(selectedOrder.original) || "ไม่พบก้อนออเดอร์ต้นทางในรายการนี้"}</pre>
                  <p className="mt-2 text-[9px] leading-4 text-slate-500">ข้อมูลดิบจากแถวออเดอร์ · แยกจากสรุปเพื่อเทียบต้นทาง · อ่านอย่างเดียว</p>
                </section>
              </div>
              <div className="grid min-w-0 gap-3 2xl:grid-cols-2">
                <details className="order-source-details min-w-0 rounded-xl border border-emerald-300/20 bg-emerald-400/[0.025] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-emerald-200">03 / CHAT TIMELINE · ประวัติแชท</summary>
                  <pre className="data-pair-panel mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-300/20 bg-black/25 p-3 text-xs leading-5 text-emerald-50/80">{directText(selectedOrder.chat_timeline) || "ไม่มีประวัติแชทในรายการนี้"}</pre>
                </details>
                <details className="order-source-details min-w-0 rounded-xl border border-pink-300/20 bg-pink-400/[0.025] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-pink-200">04 / CHANGE ALERT · อ่านอย่างเดียว</summary>
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-pink-300/20 bg-black/25 p-3 text-xs leading-5 text-pink-50/80">{directText(selectedOrder.telegram_change_alert_web || selectedOrder.telegram_change_alert || "ไม่มี CHANGE ALERT")}</pre>
                </details>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void copySelectedOrder()} className="border-emerald-300/30 bg-emerald-400/5 text-emerald-100 hover:bg-emerald-400/15">{copied ? <Check className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} {copied ? "คัดลอกแล้ว" : "คัดลอกข้อมูลออเดอร์"}</Button>
                <Link href={`/order-history?search=${encodeURIComponent(selectedOrder.upsert_key)}`}><Button variant="outline" className="border-cyan-300/25 bg-cyan-400/5 text-cyan-100"><ExternalLink className="mr-2 h-4 w-4" />ประวัติ</Button></Link>
                <Link href={`/telegram-delivery?search=${encodeURIComponent(selectedOrder.upsert_key)}&room=queue`}><Button variant="outline" className="border-fuchsia-300/25 bg-fuchsia-400/5 text-fuchsia-100"><Send className="mr-2 h-4 w-4" />ส่งไป Telegram</Button></Link>
                <Link href={`/chats?search=${encodeURIComponent(selectedOrder.customer_name ?? selectedOrder.order_number ?? "")}`}><Button variant="outline" className="border-emerald-300/25 bg-emerald-400/5 text-emerald-100"><MessageCircle className="mr-2 h-4 w-4" />ไปห้องแชท</Button></Link>
                <Button type="button" variant="outline" onClick={() => setEditOpen(true)} className="border-pink-300/25 bg-pink-400/5 text-pink-100"><Pencil className="mr-2 h-4 w-4" />EDIT TARGET · แก้ไขออเดอร์</Button>
              </div>
            </>}
          </CardContent>
        </Card>

        <Card className="blackbox-filter-card rounded-2xl"><CardContent className="flex flex-col gap-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-fuchsia-100/80"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-fuchsia-300" />ตัวกรองออเดอร์ <span className="font-normal text-fuchsia-100/35">(เรียงล่าสุดก่อน)</span></div><Button type="button" size="sm" variant="outline" onClick={() => setDateRangeOpen(value => !value)} className="h-8 border-fuchsia-300/20 bg-fuchsia-500/[.06] text-xs text-fuchsia-100/80"><CalendarDays className="mr-1.5 h-3.5 w-3.5" />{dateFrom || dateTo ? `${dateFrom || "เริ่มต้น"} → ${dateTo || "วันนี้"}` : "เลือกช่วงวันที่"}</Button></div>{dateRangeOpen ? <div className="grid gap-2 rounded-xl border border-fuchsia-300/10 bg-black/20 p-2 sm:grid-cols-2"><label className="text-[10px] text-fuchsia-100/45">จากวันที่<input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-fuchsia-300/15 bg-black/30 px-2 text-xs text-white" /></label><label className="text-[10px] text-fuchsia-100/45">ถึงวันที่<input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-fuchsia-300/15 bg-black/30 px-2 text-xs text-white" /></label></div> : null}<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6"><label className="text-[10px] text-fuchsia-100/45">เวลาตั้งแต่<input type="time" value={timeFrom} onChange={event => setTimeFrom(event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-fuchsia-300/15 bg-black/30 px-2 text-xs text-white" /></label><label className="text-[10px] text-fuchsia-100/45">ถึงเวลา<input type="time" value={timeTo} onChange={event => setTimeTo(event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-fuchsia-300/15 bg-black/30 px-2 text-xs text-white" /></label><label className="text-[10px] text-fuchsia-100/45 lg:col-span-2">เพจ<select value={pageFilter} onChange={event => setPageFilter(event.target.value)} className="mt-1 h-9 w-full rounded-xl border border-fuchsia-300/15 bg-black/30 px-2 text-xs text-white"><option value="">ทุกเพจ</option>{pageOptions.map(page => <option key={page} value={page}>{page}</option>)}</select></label></div><div className="flex items-center justify-between gap-2"><p className="text-[11px] text-fuchsia-100/35">พบ {visibleOrders.length.toLocaleString("th-TH")} รายการตามตัวกรอง</p><Button type="button" size="sm" variant="outline" onClick={() => { setDateFrom(""); setDateTo(""); setTimeFrom(""); setTimeTo(""); setPageFilter(""); }} className="h-8 border-fuchsia-300/15 bg-fuchsia-500/[.05] text-xs text-fuchsia-100/70">ล้างตัวกรอง</Button></div></CardContent></Card>

        <Card className="blackbox-queue overflow-hidden rounded-3xl"><CardContent className="p-0"><div className="blackbox-queue-head flex items-center justify-between border-b border-fuchsia-400/15 px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-fuchsia-300">INCOMING QUEUE · BLACKBOX SIGNALS</p><h2 className="mt-1 text-lg font-semibold text-white">รายการออเดอร์</h2></div><span className="neon-count">{liveQuery.isLoading ? "กำลังอ่านข้อมูล…" : `${visibleOrders.length} รายการ`}</span></div><div className="max-h-[650px] overflow-y-auto p-3">{liveQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-fuchsia-100/45"><Loader2 className="h-4 w-4 animate-spin text-fuchsia-300" /> กำลังโหลดออเดอร์…</div> : visibleOrders.length === 0 ? <div className="p-12 text-center text-sm text-fuchsia-100/45"><Search className="mx-auto mb-3 h-7 w-7 text-fuchsia-300/35" />ไม่พบออเดอร์ตามเงื่อนไขนี้</div> : visibleOrders.map(order => { const status = statusFor(orderWithReview(order)); return <button key={order.order_number} onClick={() => setSelectedNumber(order.order_number)} className={`blackbox-order-card group mb-3 flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedNumber === order.order_number ? "is-selected" : ""}`}><div className={`status-beam ${status.label === "เช็คยอด" ? "status-beam-pink" : status.label === "ต้องตรวจ" ? "status-beam-violet" : "status-beam-cyan"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-fuchsia-100/90">{order.order_number}</span><Badge variant="outline" className={`gap-1 px-2 py-0.5 text-[10px] ${status.tone}`}>{status.icon}{status.label}</Badge></div><div className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2"><p className="text-fuchsia-100/60"><span className="text-fuchsia-100/30">วันที่/เวลา:</span> {order.order_time_display || "ไม่ระบุเวลา"}</p><p className="truncate text-fuchsia-100/60"><span className="text-fuchsia-100/30">ชื่อเพจ:</span> {order.page_name || "ไม่ระบุเพจ"}</p><p className="text-fuchsia-100/80"><span className="text-fuchsia-100/30">ลูกค้า:</span> {order.customer_name || "ไม่ระบุชื่อลูกค้า"}</p><p className="font-mono text-fuchsia-100/70"><span className="font-sans text-fuchsia-100/30">เบอร์:</span> {order.phone || "ไม่ระบุเบอร์"}</p><p className="line-clamp-2 text-fuchsia-100/55 sm:col-span-2"><span className="text-fuchsia-100/30">ที่อยู่:</span> {orderAddress(order)}</p><p className="line-clamp-2 font-semibold text-cyan-200 sm:col-span-2"><span className="font-normal text-fuchsia-100/30">สินค้า:</span> {orderProductPreview(order)}</p><p className="text-fuchsia-100/60"><span className="text-fuchsia-100/30">จำนวน:</span> {orderProductQuantity(order)} คอต</p><p className="font-semibold text-pink-200"><span className="font-normal text-fuchsia-100/30">ยอด COD:</span> {money(order.cod_amount)}</p><p className="line-clamp-1 text-fuchsia-100/35 sm:col-span-2"><span className="text-fuchsia-100/30">ประวัติแชท:</span> คลิกออเดอร์เพื่อโหลดหลักฐาน</p></div></div></button>; })}</div></CardContent></Card>

        <Card className="order-inspector-nebula overflow-hidden rounded-3xl border-white/10 shadow-2xl shadow-black/20 xl:sticky xl:top-5 xl:self-start"><CardContent className="p-0">{selectedOrder ? <><div className="flex items-start justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-orange-300">ORDER INSPECTOR</p><h2 className="mt-1 font-mono text-lg font-semibold">{selectedOrder.order_number}</h2></div><button onClick={() => setSelectedNumber(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="ปิดรายละเอียด"><X className="h-4 w-4" /></button></div><div className="space-y-5 p-5"><section className="order-dna-panel rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/[.04] p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-fuchsia-200">ORDER DNA · DATA LINEAGE</p><p className="mt-1 text-[11px] text-fuchsia-100/45">เส้นทางข้อมูลของออเดอร์ใบนี้</p></div><span className="font-mono text-[10px] text-fuchsia-200/55">LIVE TRACE</span></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{orderDnaNodes(selectedOrder, selectedParcelRows, selectedEvidenceQuery.data).map(node => <div key={node.key} className={`order-dna-node order-dna-${node.tone} ${node.ok ? "is-online" : "is-dark"}`}><div className="flex items-center gap-2"><span className="order-dna-lamp" /><span className="font-mono text-[10px] font-bold tracking-wider">{node.key}</span></div><p className="mt-2 text-[11px] leading-4">{node.ok ? `● ${node.label}` : "ไฟดับ · ไม่มีข้อมูล"}</p></div>)}</div><div className="mt-3 flex items-center gap-1 overflow-hidden">{orderDnaNodes(selectedOrder, selectedParcelRows, selectedEvidenceQuery.data).map((node, index, nodes) => <span key={`${node.key}-line`} className="flex min-w-0 flex-1 items-center">{index ? <span className={`h-px flex-1 ${node.ok ? "bg-fuchsia-300/35" : "bg-white/10"}`} /> : null}<span className={`mx-1 h-1.5 w-1.5 shrink-0 rounded-full ${node.ok ? "bg-fuchsia-300 shadow-[0_0_10px_rgba(255,110,216,.9)]" : "bg-slate-700"}`} />{index < nodes.length - 1 ? <span className="h-px flex-1 bg-fuchsia-300/20" /> : null}</span>)}</div></section><div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"><div className="rounded-full bg-emerald-400/10 p-2 text-emerald-300"><CheckCircle2 className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-emerald-200">{statusFor(selectedOrderWithReview || selectedOrder).label}</p><p className="mt-1 text-xs leading-5 text-slate-400">{selectedOrder.audit_flags || selectedOrder.cod_check_status || "สถานะจากข้อมูลจริงในฐานข้อมูล"}</p></div></div><section><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">PRODUCT PAYLOAD</p><div className="space-y-2">{(selectedOrder.items.length ? selectedOrder.items : [{ id: 0, sku: selectedOrder.sku, th_name: selectedOrder.th_name, emoji: selectedOrder.emoji, display_for_packer: selectedOrder.display_for_packer, quantity: selectedOrder.quantity ?? selectedOrder.qty ?? selectedOrder.extracted_qty ?? null, unit_price: selectedOrder.unit_price ?? selectedOrder.alien_unit_prices, expected_cod: selectedOrder.expected_cod }]).map((item, index) => <div key={`${item.id ?? "line"}-${index}`} className="rounded-2xl border border-white/5 bg-black/20 p-3"><div className="flex items-start gap-3"><span className="text-xl">{item.emoji ?? selectedOrder.emoji ?? "📦"}</span><div className="min-w-0 flex-1"><p className="font-mono text-xs font-semibold text-slate-200">{item.sku || "ไม่ระบุ SKU"}</p><p className="mt-1 text-xs text-slate-400">{itemDisplay(item)}</p></div></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><div><p className="text-slate-600">จำนวน</p><p className="mt-1 text-slate-300">{item.quantity != null || item.qty != null ? `${item.quantity ?? item.qty} คอต` : "—"}</p></div><div><p className="text-slate-600">ราคาต่อหน่วย</p><p className="mt-1 text-orange-300">{money(item.unit_price)}</p></div><div><p className="text-slate-600">ยอด COD</p><p className="mt-1 text-orange-300">{money(selectedOrder.cod_amount)}</p></div></div></div>)}</div></section><section><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">CUSTOMER CONTEXT</p><div className="space-y-2 rounded-2xl border border-white/5 bg-black/20 p-4 text-sm"><p className="font-semibold text-slate-100">{selectedOrder.customer_name || "ไม่ระบุชื่อ"}</p><p className="text-slate-400">{selectedOrder.phone || "ไม่ระบุเบอร์โทร"}</p><p className="leading-6 text-slate-400">{orderAddress(selectedOrder)}</p><div className="flex items-center gap-2 pt-2 text-xs text-slate-600"><Clock3 className="h-3.5 w-3.5" /> {selectedOrder.page_name || "ไม่ระบุเพจ"}</div></div></section><section><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300">TRACKING BILL · สายพัสดุ</p>{selectedParcelRows.length ? <div className="space-y-3">{selectedParcelRows.map((row, index) => { const tracking = String(row.tracking_number ?? "").trim(); const drakside = String(row.drakside_tracking_message ?? row.tracking_message ?? row.tracking_copy_text ?? "").trim(); const facebook = String(row.facebook_tracking_message ?? row.facebook_message ?? "").trim(); const bill = String(row.telegram_tracking_message ?? row.manus_for_packer ?? row.telegram_copy_text ?? "").trim(); return <div key={`${tracking}-${index}`} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.04] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-wider text-cyan-200/55">เลขพัสดุ</p><p className="mt-1 font-mono text-lg font-bold text-cyan-100">{tracking || "ยังไม่มีเลข"}</p></div><Badge className="border-cyan-300/25 bg-cyan-300/10 text-cyan-200">{String(row.delivery_status ?? row.parcel_delivery_status ?? "รอส่ง")}</Badge></div>{bill ? <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-xl border border-white/5 bg-black/30 p-3 text-[11px] leading-5 text-amber-100/75">{bill}</pre> : null}<div className="mt-3 grid gap-2 sm:grid-cols-2">{drakside ? <div className="rounded-xl border border-fuchsia-300/15 bg-fuchsia-400/[.04] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-200/70">DRAKSIDE TRACKING MESSAGE</p><p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-fuchsia-100/75">{drakside}</p></div> : null}{facebook ? <div className="rounded-xl border border-blue-300/15 bg-blue-400/[.04] p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200/70">FACEBOOK TRACKING MESSAGE</p><p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] leading-5 text-blue-100/75">{facebook}</p></div> : null}</div></div>})}</div> : <p className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs text-slate-500">ยังไม่พบเลขพัสดุที่จับคู่กับออเดอร์นี้</p>}</section><section><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">CUSTOMER HISTORY · CHAT TIMELINE</p><pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl border border-orange-400/10 bg-black/30 p-4 text-xs leading-5 text-amber-100/70">{selectedEvidenceQuery.isLoading ? "กำลังโหลดประวัติแชท…" : selectedEvidenceQuery.isError ? "โหลดประวัติแชทไม่สำเร็จ" : customerHistoryText({ ...selectedOrder, ...selectedEvidenceQuery.data }) || "ไม่พบ chat_timeline"}</pre></section><div className="grid grid-cols-2 gap-2"><Button onClick={() => reviewOrder(selectedOrder, "PASSED")} variant="outline" className="border-emerald-400/25 bg-emerald-400/10 text-emerald-200"><CheckCircle2 className="mr-2 h-4 w-4" />ผ่าน</Button><Button onClick={() => reviewOrder(selectedOrder, "FAILED")} variant="outline" className="border-red-400/25 bg-red-400/10 text-red-200"><AlertTriangle className="mr-2 h-4 w-4" />ไม่ผ่าน</Button><Button onClick={() => previewSummary(selectedOrder)} variant="outline" className="border-orange-400/20 bg-orange-400/[0.06] text-amber-200 hover:bg-orange-400/10"><Eye className="mr-2 h-4 w-4" />พรีวิว</Button><Button onClick={copySummary} variant="outline" className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white">{copied ? <Check className="mr-2 h-4 w-4 text-emerald-300" /> : <Clipboard className="mr-2 h-4 w-4" />}{copied ? "คัดลอกแล้ว" : "คัดลอกสรุป"}</Button><Button disabled className="bg-gradient-to-r from-orange-600 to-red-600 text-white opacity-70"><Send className="mr-2 h-4 w-4" /> ต่อ Atomic Claim</Button></div></div></> : <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center text-slate-500"><Sparkles className="mb-4 h-8 w-8 text-orange-300/50" /><p className="text-sm">เลือกออเดอร์เพื่อดูรายละเอียด</p><p className="mt-1 text-xs text-slate-600">ข้อมูลจะแสดงจากตารางจริงเท่านั้น</p></div>}</CardContent></Card>

      </div>
<footer className="flex justify-end gap-3 px-2 text-[11px] text-slate-600"><span>{liveQuery.data?.fetchedAt ? `ดึงข้อมูลล่าสุด ${timeLabel(liveQuery.data.fetchedAt)}` : "กำลังรอข้อมูล"}</span></footer>
    </div>
  </div>;
}
