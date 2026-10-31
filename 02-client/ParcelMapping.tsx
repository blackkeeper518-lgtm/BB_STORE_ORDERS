import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCamp } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import {
  Check,
  Clipboard,
  ExternalLink,
  FileUp,
  PackageSearch,
  RefreshCw,
  Radar,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type QueueFilter = "all" | "ready" | "over24" | "over48" | "sent";
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
  facebook_tracking_status?: string | null;
  send_facebook_route?: string | null;
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
    );
}
function rowStatus(row: ParcelMappingRow): QueueFilter {
  if (isSent(row)) return "sent";
  const age = ageHours(row);
  if (age != null && age >= 48) return "over48";
  if (age != null && age >= 24) return "over24";
  return "ready";
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
function buildCustomerMessage(row: ParcelMappingRow) {
  const tracking = clean(row.tracking_number) || "ไม่พบเลขพัสดุ";
  const carrier = clean(row.shipping_carrier) || "⚡FLASH EXPRESS";
  const orderDate =
    clean(row.order_time_display) || clean(row.pickup_date) || "-";
  const product = clean(row.manus_for_packer) || "สินค้าทั่วไป";
  const page = clean(row.page_name) || "ทางร้าน";
  return [
    `📌 แจ้งเลขพัสดุจัดส่ง 🚚: ${tracking}`,
    `🙏 หนูขอแจ้งเลขให้นะคะพี่ ${carrier}`,
    `🗓️ วันที่สั่งซื้อ: ${orderDate}`,
    "",
    "📦 รายการสินค้า:",
    product,
    `💰 ยอดเก็บเงินปลายทาง (COD): ${formatCod(row.cod_amount)} บาท`,
    "",
    "⏰ (เลขพัสดุจะเริ่มเช็คสถานะการเดินทางได้ช่วงเย็นๆ นะคะพี่ 💕)",
    "",
    "เพื่อความสบายใจ พี่สามารถแกะก่อนรับได้นะคะ",
    "แต่ต้องถ่ายคลิปไว้นะคะ มีปัญหาร้านเรา รับผิดชอบให้ค่ะ",
    `ขอบพระคุณที่อุดหนุน ${page} ❤️ ค่ะพี่`,
  ].join("\n");
}

export default function ParcelMapping() {
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ParcelMappingRow | null>(null);
  const [copied, setCopied] = useState("");
  const activeCamp = getActiveCamp();
  const queueQuery = trpc.parcels.mappingQueue.useQuery(
    { status: "all", limit: 300 },
    { staleTime: 15_000 }
  );
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

  async function copyMessage(row: ParcelMappingRow) {
    await navigator.clipboard.writeText(buildCustomerMessage(row));
    const key = clean(row.tracking_number);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1600);
  }

  return (
    <div className="blackbox-room min-h-full space-y-5 text-white">
      <header className="blackbox-hero relative overflow-hidden rounded-3xl border border-fuchsia-400/30 p-6 shadow-2xl shadow-fuchsia-950/30 sm:p-8">
        <div className="hero-scanline" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="live-chip">
              <Radar className="h-3.5 w-3.5" /> PARCEL RADAR · LIVE SIGNAL
            </p>
            <h1 className="cyber-title mt-4 text-3xl font-semibold sm:text-4xl">
              ห้องควบคุมเลขพัสดุ
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-fuchsia-100/65">
              ดึงจากสายส่งเลขเดิม แสดงข้อมูลจับคู่และตัวอย่างข้อความ โดยไม่ยิง
              Messenger ซ้ำกับ workflow หลัก
            </p>
          </div>
          <div className="bb-clock-panel rounded-2xl border px-4 py-3 text-xs">
            <span className="bb-running-light mr-2 inline-block h-2 w-2 rounded-full" />
            {activeCamp} · PIPELINE LINK ONLINE
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {filters.map(item => {
            const meta = statusMeta(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${meta.className} ${filter === item ? "ring-2 ring-fuchsia-300/50" : ""}`}
              >
                <p className="text-xs opacity-70">
                  {meta.icon} {meta.label}
                </p>
                <p className="mt-2 text-2xl font-black">
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
            className="border-fuchsia-300/25 text-fuchsia-100"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            เว็บเช็กเลขลูกค้า
          </Button>
          <Button
            onClick={() => void queueQuery.refetch()}
            variant="outline"
            className="border-cyan-300/25 text-cyan-100"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${queueQuery.isFetching ? "animate-spin" : ""}`}
            />
            รีเฟรชคิว
          </Button>
        </div>
        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3">
          <Search className="h-4 w-4 text-cyan-300" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="ค้นในคิว: เลข / ชื่อ / เบอร์ / ออเดอร์"
            className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="blackbox-queue overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="flex items-center gap-2 text-fuchsia-100">
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
                  className="trace-row rounded-2xl border border-cyan-300/10 bg-black/20 p-4 transition hover:border-cyan-300/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">
                        FLASH TRACKING
                      </p>
                      <p className="mt-1 break-all font-mono text-lg font-bold tracking-wide text-cyan-200">
                        {clean(row.tracking_number) || "ไม่มีเลขพัสดุ"}
                      </p>
                    </div>
                    <Badge variant="outline" className={meta.className}>
                      {meta.icon} {meta.label}
                      {age != null && status !== "sent"
                        ? ` · ${age.toFixed(1)} ชม.`
                        : ""}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm sm:grid-cols-2">
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
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    <Button
                      onClick={() => setSelected(row)}
                      className="bb-send-button"
                    >
                      ดูข้อความที่จะส่ง
                    </Button>
                    <Button
                      onClick={() => void copyMessage(row)}
                      variant="outline"
                      className="border-cyan-300/25 text-cyan-100"
                    >
                      {copied === clean(row.tracking_number) ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Clipboard className="mr-2 h-4 w-4" />
                      )}
                      {copied === clean(row.tracking_number)
                        ? "คัดลอกแล้ว"
                        : "คัดลอกข้อความ"}
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
                      className="text-white/55 hover:text-white"
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

        <Card className="blackbox-queue rounded-3xl xl:sticky xl:top-4 xl:h-fit">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <CardTitle className="text-fuchsia-100">ORDER INSPECTOR</CardTitle>
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
          <CardContent className="space-y-4 p-4">
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
                <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
                    MESSAGE PREVIEW
                  </p>
                  <p className="mt-2 break-all font-mono text-lg font-bold text-cyan-100">
                    {clean(selected.tracking_number)}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {clean(selected.recipient_name)} ·{" "}
                    {clean(selected.shipping_carrier) || "FLASH EXPRESS"}
                  </p>
                </div>
                <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl border border-fuchsia-300/15 bg-black/35 p-4 text-sm leading-7 text-fuchsia-50">
                  {buildCustomerMessage(selected)}
                </pre>
                <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3 text-xs leading-5 text-amber-100/70">
                  การ์ดนี้ไม่ส่ง Messenger โดยตรง เพื่อป้องกันการยิงซ้ำกับ
                  ⛩️VOID_xXx_GATEWAYz และ workflow หลัก
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 text-[10px] text-white/25">
        <span>SHADOW → ROGUE → VOID · public.parcels</span>
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
