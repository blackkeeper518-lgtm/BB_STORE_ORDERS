import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCamp, readParcelMappingQueue } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Clipboard,
  ExternalLink,
  FileUp,
  ArrowUpRight,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  Radar,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type QueueFilter = "all" | "ready" | "over24" | "over48" | "sent";
type OrbitLane = "waiting" | "send" | "expired" | "sent";
type ParcelMappingRow = {
  tracking_number?: string | null;
  matched_phone?: string | null;
  recipient_name?: string | null;
  parcel_address?: string | null;
  pickup_date?: string | null;
  parcel_delivery_status?: string | null;
  parcel_sent_at?: string | null;
  page_name?: string | null;
  order_number?: string | null;
  order_number_display?: string | null;
  order_time_display?: string | null;
  cod_amount?: string | number | null;
  shipping_carrier?: string | null;
  manus_for_packer?: string | null;
  facebook_tracking_message?: string | null;
  drakside_tracking_message?: string | null;
  facebook_tracking_status?: string | null;
  parcel_status_emoji?: string | null;
  send_facebook_route?: string | null;
  customer_message_time_th?: string | null;
  customer_latest_message?: string | null;
  page_latest_message?: string | null;
  can_send_standard?: boolean | string | number | null;
  is_within_24h?: boolean | string | number | null;
  page_id?: string | null;
  thread_id?: string | null;
  threadId?: string | null;
  chat_link_key?: string | null;
};

const flashTrackingUrl = "https://www.flashexpress.co.th/fle/tracking";
const warpDriveUrl = "https://warpdrivetracking.vercel.app/";
const customerLookupUrl = "https://bbstorefullv-1.vercel.app/";
const money = new Intl.NumberFormat("th-TH");
const filters: QueueFilter[] = ["all", "ready", "over24", "over48", "sent"];

function clean(value: unknown) {
  return String(value ?? "").trim();
}
function formatCod(value: ParcelMappingRow["cod_amount"]) {
  const amount = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? money.format(amount) : "ไม่ระบุ";
}
function parseDate(value: unknown) {
  const timestamp = Date.parse(clean(value));
  return Number.isFinite(timestamp) ? timestamp : null;
}
function ageHours(row: ParcelMappingRow) {
  const timestamp = parseDate(row.pickup_date);
  return timestamp == null
    ? null
    : Math.max(0, (Date.now() - timestamp) / 36e5);
}
function isSent(row: ParcelMappingRow) {
  return [row.parcel_delivery_status, row.facebook_tracking_status]
    .map(value => clean(value).toUpperCase())
    .some(value =>
      [
        "🔥SENT",
        "SENT",
        "SUCCESS",
        "COMPLETED",
        "DELIVERED",
        "SENT_TO_TELEGRAM",
      ].includes(value)
    ) || clean(row.page_latest_message).includes("📌 แจ้งเลขพัสดุจัดส่ง");
}
function asBool(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
}
function parcelStatusEmoji(row: ParcelMappingRow) {
  return clean(row.parcel_status_emoji);
}
function orbitLane(row: ParcelMappingRow): OrbitLane {
  const status = parcelStatusEmoji(row);
  if (status.includes("🔥")) return "sent";
  if (status.includes("🔴")) return "expired";
  if (status.includes("🟡")) return "send";
  if (status.includes("🟢")) return "waiting";
  if (isSent(row)) return "sent";
  if (!clean(row.customer_message_time_th || row.customer_latest_message)) return "waiting";
  if (clean(row.send_facebook_route).toUpperCase() === "BLOCK_FB_EXPIRED" || (row.can_send_standard != null && !asBool(row.can_send_standard))) return "expired";
  return "send";
}
function orbitMeta(lane: OrbitLane) {
  return {
    waiting: { icon: "🛰️", label: "WAITING ORBIT", sub: "ยังไม่พบสัญญาณลูกค้า", color: "border-violet-300/25 bg-violet-300/[.06] text-violet-100" },
    send: { icon: "🚀", label: "SEND GATE", sub: "พร้อมส่งตามหน้าต่างแชท", color: "border-emerald-300/25 bg-emerald-300/[.06] text-emerald-100" },
    expired: { icon: "🕳️", label: "EXPIRED VAULT", sub: "เกินหน้าต่างส่ง", color: "border-amber-300/25 bg-amber-300/[.06] text-amber-100" },
    sent: { icon: "🔥", label: "🔥SENT", sub: "TRACKING SIGNAL CONFIRMED", color: "border-fuchsia-300/25 bg-fuchsia-300/[.06] text-fuchsia-100" },
  }[lane];
}
function rowStatus(row: ParcelMappingRow): QueueFilter {
  const status = parcelStatusEmoji(row);
  if (status.includes("🔥")) return "sent";
  if (status.includes("🔴")) return "over48";
  if (status.includes("🟡")) return "over24";
  if (status.includes("🟢")) return "ready";
  if (isSent(row)) return "sent";
  const age = ageHours(row);
  if (age != null && age >= 48) return "over48";
  if (age != null && age >= 24) return "over24";
  return "ready";
}
function messageToCopy(row: ParcelMappingRow) {
  return clean(row.facebook_tracking_message) || clean(row.drakside_tracking_message);
}
function statusMeta(status: QueueFilter) {
  return {
    all: {
      label: "ทั้งหมด",
      icon: "📦",
      className: "border-white/15 bg-white/[0.04] text-white",
    },
    ready: {
      label: "พร้อมส่ง",
      icon: "🟢",
      className: "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100",
    },
    over24: {
      label: "เกิน 24 ชม.",
      icon: "🟡",
      className: "border-amber-300/30 bg-amber-300/[0.08] text-amber-100",
    },
    over48: {
      label: "เกิน 48 ชม.",
      icon: "🔴",
      className: "border-red-300/30 bg-red-300/[0.08] text-red-100",
    },
    sent: {
      label: "ส่งแล้ว",
      icon: "🔥",
      className: "border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100",
    },
  }[status];
}
export default function ParcelMapping() {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ParcelMappingRow | null>(null);
  const [copied, setCopied] = useState("");
  const [sendGateOpen, setSendGateOpen] = useState(false);
  const activeCamp = getActiveCamp();
  const queueQuery = useQuery({
    queryKey: ["parcel-mapping-queue", activeCamp],
    queryFn: () => readParcelMappingQueue("all", 300),
    staleTime: 15_000,
  });
  const rows = useMemo(
    () => (queueQuery.data ?? []) as ParcelMappingRow[],
    [queueQuery.data]
  );
  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      const statusMatches = filter === "all" || rowStatus(row) === filter;
      const haystack = [
        row.tracking_number,
        row.recipient_name,
        row.matched_phone,
        row.order_number,
        row.page_name,
      ]
        .map(clean)
        .join(" ")
        .toLowerCase();
      return statusMatches && (!term || haystack.includes(term));
    });
  }, [filter, rows, search]);
  const counts = useMemo(
    () =>
      Object.fromEntries(
        filters.map(item => [
          item,
          item === "all"
            ? rows.length
            : rows.filter(row => rowStatus(row) === item).length,
        ])
      ) as Record<QueueFilter, number>,
    [rows]
  );
  const orbitLanes: OrbitLane[] = ["waiting", "send", "expired", "sent"];
  const sendGateRows = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter(row => orbitLane(row) === "send").filter(row => {
      const key = clean(row.chat_link_key) || `${clean(row.page_id)}:${clean(row.thread_id || row.threadId)}` || clean(row.page_name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rows]);

  function chatHref(row: ParcelMappingRow) {
    const key = clean(row.chat_link_key);
    const separator = key.includes("_") ? "_" : key.includes(":") ? ":" : "";
    const separatorIndex = separator ? key.indexOf(separator) : -1;
    const keyPageId = separatorIndex >= 0 ? key.slice(0, separatorIndex) : "";
    const keyThreadId = separatorIndex >= 0 ? key.slice(separatorIndex + 1) : "";
    const pageId = clean(row.page_id) || clean(keyPageId);
    const threadId = clean(row.thread_id || row.threadId) || clean(keyThreadId);
    if (pageId && threadId && typeof window !== "undefined") {
      window.sessionStorage.setItem(`darkside-send-gate:${pageId}:${threadId}`, JSON.stringify({
        tracking_number: row.tracking_number,
        order_number: row.order_number,
        order_number_display: row.order_number_display,
        shipping_carrier: row.shipping_carrier,
        facebook_tracking_message: row.facebook_tracking_message,
        drakside_tracking_message: row.drakside_tracking_message,
      }));
    }
    return pageId && threadId ? `/chats?page_id=${encodeURIComponent(pageId)}&thread_id=${encodeURIComponent(threadId)}` : "";
  }

  async function copyMessage(row: ParcelMappingRow) {
    const message = messageToCopy(row);
    if (!message) return;
    await navigator.clipboard.writeText(message);
    const key = `message:${clean(row.tracking_number)}`;
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }
  async function copyValue(value: unknown, key: string) {
    const text = clean(value);
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="cosmic-stage blackbox-room min-h-full space-y-5 bg-[radial-gradient(ellipse_at_12%_0%,rgba(88,28,135,.22),transparent_34%),radial-gradient(ellipse_at_92%_28%,rgba(8,145,178,.14),transparent_32%)] p-2 text-white sm:space-y-6 sm:p-4 lg:p-6">
      <header className="blackbox-hero relative overflow-hidden rounded-3xl border border-fuchsia-300/45 bg-[radial-gradient(ellipse_at_top_left,rgba(168,85,247,.20),transparent_45%),radial-gradient(ellipse_at_80%_30%,rgba(34,211,238,.15),transparent_38%),linear-gradient(135deg,#090b20,#11112b_55%,#071a2c)] p-4 shadow-[0_0_18px_rgba(217,70,239,.18),0_18px_60px_rgba(2,6,23,.62)] sm:p-6">
        <div className="hero-scanline" />
        <div className="cosmic-corner tl" />
        <div className="cosmic-corner br" />
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-planet" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="live-chip">
              <Radar className="h-3.5 w-3.5" /> PARCEL RADAR · LIVE SIGNAL
            </p>
            <p className="orbit-kicker mt-2">DK DRAKSIDE · SPACE VAULT / SECTOR 07</p>
            <h1 className="cyber-title mt-2 text-2xl font-semibold sm:text-3xl">
              ห้องควบคุมเลขพัสดุ
            </h1>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-fuchsia-100/65">
              ดึงจากสายส่งเลขเดิม แสดงข้อมูลจับคู่และตัวอย่างข้อความ โดยไม่ยิง
              Messenger ซ้ำกับ workflow หลัก
            </p>
          </div>
          <div className="bb-clock-panel rounded-2xl border border-cyan-200/35 bg-slate-950/55 px-4 py-3 text-xs text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,.13)] backdrop-blur-md">
            <span className="bb-running-light mr-2 inline-block h-2 w-2 rounded-full" />
            {activeCamp} · PIPELINE LINK ONLINE
          </div>
        </div>
        <div className="signal-ticker relative mt-6">
          <span>SHADOW RECALL // ROGUE MATCH // VOID GATEWAY // TELEGRAM LINK STANDBY // FLASH EXPRESS // TRACKING CAPSULES IN ORBIT //</span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
          {filters.map(item => {
            const meta = statusMeta(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-2xl border p-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.07)] transition duration-200 hover:-translate-y-0.5 hover:brightness-125 ${meta.className} ${filter === item ? "ring-2 ring-fuchsia-200/80 shadow-[0_0_10px_rgba(232,121,249,.45),0_0_28px_rgba(34,211,238,.16)]" : ""}`}
              >
                <p className="flex items-center gap-1.5 text-xs font-semibold opacity-95">
                  <span>{meta.icon}</span> {meta.label}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,.22)] sm:text-3xl">
                  {counts[item].toLocaleString("th-TH")}
                </p>
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              window.open(warpDriveUrl, "_blank", "noopener,noreferrer")
            }
            className="bb-send-button"
          >
            <FileUp className="mr-2 h-4 w-4" />
            เปิด WarpDrive โยนไฟล์
          </Button>
          <Button
            onClick={() =>
              window.open(customerLookupUrl, "_blank", "noopener,noreferrer")
            }
            variant="outline"
            className="border-fuchsia-200/45 bg-fuchsia-950/25 text-fuchsia-50 shadow-[0_0_14px_rgba(217,70,239,.10)] hover:bg-fuchsia-900/35"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            เว็บเช็กเลขลูกค้า
          </Button>
          <Button
            onClick={() => void queueQuery.refetch()}
            variant="outline"
            className="border-cyan-200/45 bg-cyan-950/25 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,.10)] hover:bg-cyan-900/35"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${queueQuery.isFetching ? "animate-spin" : ""}`}
            />
            รีเฟรชคิว
          </Button>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-cyan-200/30 bg-slate-950/70 px-3 shadow-[inset_0_0_18px_rgba(34,211,238,.06),0_0_20px_rgba(34,211,238,.08)] backdrop-blur-md focus-within:border-cyan-200/65 focus-within:shadow-[0_0_18px_rgba(34,211,238,.16)]">
          <Search className="h-4 w-4 shrink-0 text-cyan-200 drop-shadow-[0_0_7px_rgba(34,211,238,.8)]" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="ค้นในคิว: เลข / ชื่อ / เบอร์ / ออเดอร์"
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-slate-300/65"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} className="rounded-md p-1 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="ล้างการค้นหา">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {orbitLanes.map(lane => {
          const meta = orbitMeta(lane);
          const laneCount = rows.filter(row => orbitLane(row) === lane).length;
          return (
            <button key={lane} type="button" onClick={() => lane === "send" ? setSendGateOpen(true) : setFilter(lane === "sent" ? "sent" : lane === "expired" ? "over24" : "all")} className={`group rounded-2xl border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.08)] transition duration-200 hover:-translate-y-1 hover:brightness-125 hover:shadow-[0_0_28px_rgba(77,218,255,.20)] ${meta.color}`}>
              <div className="flex items-start justify-between gap-2"><span className="text-xl drop-shadow-[0_0_9px_rgba(255,255,255,.45)]">{meta.icon}</span><span className="font-mono text-3xl font-black tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,.24)]">{laneCount}</span></div>
              <p className="mt-3 text-[11px] font-extrabold tracking-[.14em]">{meta.label}</p>
              <p className="mt-1 text-xs opacity-90">{meta.sub}</p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full w-2/3 rounded-full bg-current opacity-90 transition group-hover:w-full" /></div>
            </button>
          );
        })}
      </section>

      {sendGateOpen ? <div className="fixed inset-0 z-[80] bg-[#03040b]/70 backdrop-blur-sm" onClick={() => setSendGateOpen(false)}>
        <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-emerald-300/25 bg-[#09131a]/[.98] shadow-[-18px_0_60px_rgba(16,185,129,.18)]" onClick={event => event.stopPropagation()}>
          <div className="border-b border-emerald-300/15 bg-gradient-to-r from-emerald-400/[.10] via-cyan-400/[.05] to-transparent p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-mono font-semibold uppercase tracking-[.22em] text-emerald-300">SEND GATE // CHANNEL MAP</p><h2 className="mt-2 text-xl font-semibold text-white">ห้องที่พร้อมส่ง</h2><p className="mt-1 text-xs leading-5 text-emerald-100/55">เลือกห้องที่แมฟแล้วเพื่อเปิดบทสนทนาต้นทางโดยตรง</p></div><button type="button" onClick={() => setSendGateOpen(false)} className="rounded-xl border border-emerald-300/20 p-2 text-emerald-100/55 hover:bg-emerald-300/10 hover:text-white" aria-label="ปิด SEND GATE"><X className="h-4 w-4" /></button></div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-200/65"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6fffe0]" />{sendGateRows.length} CHANNELS MAPPED · CLICK CARD TO ENTER CHAT</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="grid gap-2 sm:grid-cols-2">
            {sendGateRows.map((row, index) => { const href = chatHref(row); return <article key={`${clean(row.page_name)}-${clean(row.tracking_number)}-${index}`} className="group rounded-2xl border border-emerald-300/15 bg-emerald-300/[.035] p-3 transition hover:-translate-y-0.5 hover:border-emerald-200/50 hover:bg-emerald-300/[.08]">
              <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{clean(row.page_name) || "ไม่ระบุเพจ"}</p><p className="mt-1 truncate font-mono text-[9px] text-emerald-200/50">{clean(row.chat_link_key) || `${clean(row.page_id)}_${clean(row.thread_id || row.threadId)}` || "NO CHAT KEY"}</p></div><span className="shrink-0 rounded-md border border-emerald-300/20 bg-emerald-300/[.08] px-1.5 py-0.5 text-[9px] text-emerald-200">🟢 OPEN</span></div>
              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] text-cyan-100/60"><span>ลูกค้า · {clean(row.recipient_name) || "—"}</span><span>เลข · {clean(row.tracking_number) || "—"}</span></div>
              {href ? <a href={href} onClick={() => setSendGateOpen(false)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-300/25 bg-cyan-400/[.07] px-2.5 py-2 text-[10px] font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-400/[.15]"><MessageCircle className="h-3.5 w-3.5" />เข้าแชทห้องนี้<ArrowUpRight className="h-3.5 w-3.5" /></a> : <p className="mt-3 rounded-lg border border-amber-300/15 bg-amber-300/[.04] px-2 py-1.5 text-[9px] text-amber-100/60">ยังไม่มี chat_link_key สำหรับเปิดห้อง</p>}
            </article>; })}
            {!sendGateRows.length ? <div className="col-span-full rounded-2xl border border-emerald-300/15 bg-black/20 p-8 text-center text-sm text-emerald-100/50"><MessageCircle className="mx-auto mb-2 h-7 w-7 text-emerald-300/40" />ยังไม่มีห้องที่แมฟใน SEND GATE</div> : null}
          </div></div>
        </aside>
      </div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="blackbox-queue overflow-hidden rounded-3xl border border-cyan-200/20 shadow-[0_0_26px_rgba(34,211,238,.08),0_18px_45px_rgba(2,6,23,.42)]">
          <CardHeader className="border-b border-cyan-200/15 bg-gradient-to-r from-cyan-400/[.08] via-fuchsia-400/[.06] to-transparent">
            <CardTitle className="flex items-center gap-2 text-fuchsia-50 drop-shadow-[0_0_8px_rgba(232,121,249,.35)]">
              <PackageSearch className="h-4 w-4 text-cyan-300" /> PARCEL QUEUE ·{" "}
              {visibleRows.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[780px] space-y-3 overflow-auto p-3 sm:p-4">
            {queueQuery.isLoading ? (
              <p className="p-12 text-center text-sm text-cyan-100/60">
                กำลังดึงคิวจากสายส่งเลข…
              </p>
            ) : null}
            {queueQuery.isError ? (
              <p className="rounded-2xl border border-red-300/25 bg-red-400/5 p-4 text-sm text-red-200">
                ดึงคิวไม่สำเร็จ: {queueQuery.error.message}
              </p>
            ) : null}
            {!queueQuery.isLoading && visibleRows.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center text-white/40">
                <PackageSearch className="mb-3 h-8 w-8 text-cyan-300/45" />
                <p>ไม่พบรายการในสถานะนี้</p>
              </div>
            ) : null}
            {visibleRows.map((row, index) => {
              const key = `${clean(row.tracking_number)}-${index}`;
              const status = rowStatus(row);
              const meta = statusMeta(status);
              const age = ageHours(row);
              return (
                <article
                  key={key}
                  className="trace-row rounded-2xl border border-cyan-200/20 bg-[linear-gradient(125deg,rgba(8,47,73,.30),rgba(15,23,42,.62)_50%,rgba(76,29,149,.16))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.055)] transition duration-200 hover:border-cyan-200/50 hover:shadow-[0_0_22px_rgba(34,211,238,.12)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button type="button" onClick={() => void copyValue(row.tracking_number, `tracking:${clean(row.tracking_number)}`)} disabled={!clean(row.tracking_number)} className="group/tracking text-left disabled:cursor-default">
                        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/65">
                          <span>FLASH TRACKING</span><Clipboard className="h-3 w-3 text-cyan-300/60 transition group-hover/tracking:text-cyan-200" />
                        </p>
                        <p className="mt-1 break-all font-mono text-lg font-bold tracking-wide text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,.30)] group-hover/tracking:text-white sm:text-xl">
                          {clean(row.tracking_number) || "ไม่มีเลขพัสดุ"}
                        </p>
                        {copied === `tracking:${clean(row.tracking_number)}` ? <span className="text-[10px] text-emerald-300">คัดลอกเลขแล้ว</span> : null}
                      </button>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Badge variant="outline" className={meta.className}>
                        {isSent(row) ? "🔥SENT" : `${meta.icon} ${meta.label}`}
                        {age != null && status !== "sent" ? ` · ${age.toFixed(1)} ชม.` : ""}
                      </Badge>
                      {isSent(row) ? <span className="font-mono text-[8px] tracking-[.12em] text-fuchsia-200/65">TRACKING SIGNAL CONFIRMED</span> : null}
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1.5 rounded-xl border border-white/10 bg-slate-950/45 p-2.5 text-xs shadow-[inset_0_0_18px_rgba(148,163,184,.035)] sm:grid-cols-2">
                    <p className="text-white/85">
                      👤 {clean(row.recipient_name) || "ไม่ระบุชื่อผู้รับ"}
                    </p>
                    <p className="text-white/70">
                      📞 {clean(row.matched_phone) || "ไม่ระบุเบอร์"}
                    </p>
                    <p className="text-white/60 sm:col-span-2">
                      🧾{" "}
                      {clean(row.order_number_display || row.order_number) ||
                        "ไม่พบเลขออเดอร์"}{" "}
                      · {clean(row.page_name) || "ไม่ระบุเพจ"}
                    </p>
                    <p className="text-white/55 sm:col-span-2">
                      📅 {clean(row.pickup_date) || "ไม่ระบุวันที่"} · COD{" "}
                      {formatCod(row.cod_amount)} บาท
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {[
                      ["FACEBOOK TRACKING MESSAGE", row.facebook_tracking_message, "facebook"],
                      ["DRAKSIDE TRACKING MESSAGE", row.drakside_tracking_message, "drakside"],
                    ].map(([label, value, kind]) => clean(value) ? (
                      <div key={kind} className="rounded-xl border border-fuchsia-200/25 bg-[linear-gradient(145deg,rgba(112,26,117,.15),rgba(15,23,42,.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[10px] font-bold tracking-[0.14em] text-fuchsia-100/85">{label}</p>
                          <button type="button" onClick={() => void copyValue(value, `${kind}:${clean(row.tracking_number)}`)} className="rounded-md p-1 text-fuchsia-200/60 transition hover:bg-fuchsia-200/10 hover:text-fuchsia-100" aria-label={`คัดลอก ${label}`}>
                            {copied === `${kind}:${clean(row.tracking_number)}` ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Clipboard className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-5 text-fuchsia-50">{clean(value)}</pre>
                      </div>
                    ) : null)}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    <Button onClick={() => void copyValue(row.facebook_tracking_message, `facebook:${clean(row.tracking_number)}`)} disabled={!clean(row.facebook_tracking_message)} className="bb-send-button">
                      {copied === `facebook:${clean(row.tracking_number)}` ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                      {copied === `facebook:${clean(row.tracking_number)}` ? "Facebook คัดลอกแล้ว" : "Facebook ข้อความ"}
                    </Button>
                    <Button onClick={() => void copyValue(row.drakside_tracking_message, `drakside:${clean(row.tracking_number)}`)} disabled={!clean(row.drakside_tracking_message)} variant="outline" className="border-fuchsia-200/45 bg-fuchsia-950/20 text-fuchsia-50 hover:bg-fuchsia-900/35">
                      {copied === `drakside:${clean(row.tracking_number)}` ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}
                      {copied === `drakside:${clean(row.tracking_number)}` ? "Drakside คัดลอกแล้ว" : "Drakside ข้อความ"}
                    </Button>
                    <Button
                      onClick={() => void copyMessage(row)}
                      variant="outline"
                      className="border-cyan-200/45 bg-cyan-950/20 text-cyan-50 hover:bg-cyan-900/35"
                    >
                      {copied === `message:${clean(row.tracking_number)}` ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Clipboard className="mr-2 h-4 w-4" />
                      )}
                      {copied === `message:${clean(row.tracking_number)}`
                        ? "คัดลอกแล้ว"
                        : "คัดลอกรวม"}
                    </Button>
                    <Button
                      onClick={() =>
                        window.open(
                          flashTrackingUrl,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                      variant="ghost"
                      className="text-slate-200/80 hover:bg-white/10 hover:text-white"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      เปิด FLASH
                    </Button>
                  </div>
                </article>
              );
            })}
          </CardContent>
        </Card>

        <Card className="blackbox-queue rounded-3xl border border-fuchsia-200/20 shadow-[0_0_26px_rgba(217,70,239,.08),0_18px_45px_rgba(2,6,23,.42)] xl:sticky xl:top-4 xl:h-fit">
          <CardHeader className="flex flex-row items-center justify-between border-b border-fuchsia-200/15 bg-gradient-to-r from-fuchsia-400/[.09] via-cyan-400/[.04] to-transparent">
            <CardTitle className="text-fuchsia-50 drop-shadow-[0_0_8px_rgba(232,121,249,.35)]">ORDER INSPECTOR</CardTitle>
            {selected ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelected(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            {!selected ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-white/35">
                <PackageSearch className="mb-3 h-9 w-9 text-cyan-300/40" />
                <p>เลือกเลขพัสดุเพื่อดูข้อความจริง</p>
                <p className="mt-1 text-xs">
                  หน้านี้เป็น Preview เท่านั้น การส่งจริงยังคงให้ n8n ทำงาน
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-cyan-200/35 bg-[linear-gradient(135deg,rgba(8,145,178,.13),rgba(15,23,42,.48)_62%,rgba(126,34,206,.12))] p-3 shadow-[0_0_20px_rgba(34,211,238,.08)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/85">
                    MESSAGE PREVIEW
                  </p>
                  <p className="mt-2 break-all font-mono text-lg font-bold text-cyan-50 drop-shadow-[0_0_8px_rgba(34,211,238,.28)]">
                    {clean(selected.tracking_number)}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-white/65">
                    <p>ชื่อผู้รับ · {clean(selected.recipient_name) || "—"}</p>
                    <p>เพจ · {clean(selected.page_name) || "—"}</p>
                    <p>เบอร์โทร · {clean(selected.matched_phone) || "—"}</p>
                    <p>ขนส่ง · {clean(selected.shipping_carrier) || "FLASH EXPRESS"}</p>
                    <p>เลขออเดอร์ · {clean(selected.order_number_display || selected.order_number) || "—"}</p>
                    <p className="font-semibold text-cyan-200">สถานะ · {isSent(selected) ? "🔥SENT" : clean(selected.parcel_status_emoji) || "รอตรวจ"}</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    ["facebook_tracking_message", selected.facebook_tracking_message],
                    ["drakside_tracking_message", selected.drakside_tracking_message],
                  ].map(([label, value]) => clean(value) ? (
                    <div key={label}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-100/85">{label}</p>
                      <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl border border-fuchsia-200/25 bg-slate-950/65 p-4 text-sm leading-7 text-fuchsia-50 shadow-[inset_0_0_18px_rgba(217,70,239,.06)]">{clean(value)}</pre>
                    </div>
                  ) : null)}
                  {!clean(selected.facebook_tracking_message) && !clean(selected.drakside_tracking_message) ? (
                    <p className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4 text-sm text-amber-100/70">แถวนี้ยังไม่มีข้อความจาก n8n ใน 2 คอลัมน์</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/70">
                  การ์ดนี้ไม่ส่ง Messenger โดยตรง เพื่อป้องกันการยิงซ้ำกับ
                  ⛩️VOID_xXx_GATEWAYz และ workflow หลัก
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-slate-950/25 px-3 py-2 text-[10px] text-slate-300/65">
        <span>🔮 SHADOW → 🦅 ROGUE → ⛩️ VOID · n8n-owned tracking pipeline</span>
        <span>
          Page token อยู่ฝั่ง server/n8n เท่านั้น ·{" "}
          {queueQuery.dataUpdatedAt
            ? `อัปเดต ${new Date(queueQuery.dataUpdatedAt).toLocaleTimeString("th-TH")}`
            : "ยังไม่อัปเดต"}
        </span>
      </footer>
    </div>
  );
}
