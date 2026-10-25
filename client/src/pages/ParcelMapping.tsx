import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readChatMessages } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import { Check, Clipboard, ExternalLink, MapPin, PackageSearch, Phone, Radar, RefreshCw, Search, Send, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

type SearchMode = "auto" | "phone" | "name" | "tracking" | "address";
type ParcelRow = {
  tracking_number: string | null;
  pickup_date: string | null;
  consignee: string | null;
  phone_number: string | null;
  address: string | null;
  cod_amount: string | number | null;
};
type SearchRequest = { term: string; mode: SearchMode };
type ActionState = { kind: "success" | "error"; text: string };
type MessengerTarget = { pageId: string; threadId: string; recipientId: string; pageName: string; customerName: string };

const searchModes: { key: SearchMode; label: string; placeholder: string }[] = [
  { key: "auto", label: "อัตโนมัติ", placeholder: "เบอร์ / ชื่อ / เลขพัสดุ / ที่อยู่" },
  { key: "phone", label: "เบอร์โทร", placeholder: "เช่น 0812345678" },
  { key: "name", label: "ชื่อผู้รับ", placeholder: "พิมพ์ชื่อผู้รับ" },
  { key: "tracking", label: "เลขพัสดุ", placeholder: "เช่น TH123456789" },
  { key: "address", label: "ที่อยู่", placeholder: "พิมพ์บางส่วนของที่อยู่" },
];

const flashTrackingUrl = "https://www.flashexpress.co.th/fle/tracking";
const money = new Intl.NumberFormat("th-TH");

function normalizePhone(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.startsWith("66") ? `0${digits.slice(2)}` : digits;
}

function formatCod(value: ParcelRow["cod_amount"]) {
  if (value == null || String(value).trim() === "") return "ไม่ระบุ";
  const amount = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? money.format(amount) : String(value);
}

function parcelKey(row: ParcelRow) {
  return `${String(row.tracking_number ?? "").trim()}|${String(row.pickup_date ?? "").trim()}`;
}

function buildCustomerMessage(row: ParcelRow) {
  const name = String(row.consignee ?? "").trim() || "คุณลูกค้า";
  const lines = [
    `สวัสดีค่ะ ${name} 🙏`,
    "น้องขอแจ้งเลขพัสดุให้นะคะ",
    `📦 เลขพัสดุ: ${String(row.tracking_number ?? "").trim()}`,
    "🚚 ขนส่ง: ⚡ FLASH EXPRESS",
  ];
  if (row.pickup_date) lines.push(`🗓️ วันที่รับเข้าระบบขนส่ง: ${row.pickup_date}`);
  if (row.cod_amount != null && String(row.cod_amount).trim()) {
    lines.push(`💰 ยอดเก็บเงินปลายทาง (COD): ${formatCod(row.cod_amount)} บาท`);
  }
  lines.push(
    "",
    "เพื่อความสบายใจ พี่แกะเช็กก่อนรับได้นะคะ อย่าลืมถ่ายคลิปตอนแกะไว้ค่ะ",
    "ขอบพระคุณที่อุดหนุนค่ะ ❤️",
  );
  return lines.join("\n");
}


async function resolveMessengerTarget(phoneValue: unknown, threads: any[]): Promise<MessengerTarget> {
  const phone = normalizePhone(phoneValue);
  if (phone.length < 9) throw new Error("เบอร์ผู้รับไม่ครบ จึงระบุห้องแชทไม่ได้");

  const matches = threads.filter((thread: any) => {
    const sameOrderPhone = (thread.orders ?? []).some((order: any) => {
      const orderPhone = normalizePhone(order.extracted_phone || order.phone || order.customer_phone_current || order.clean_phone);
      return orderPhone && orderPhone === phone;
    });
    return sameOrderPhone && thread.pageId && thread.threadId && thread.customerId;
  });

  const unique = new Map<string, any>();
  for (const thread of matches) {
    const key = `${thread.pageId}:${thread.threadId}:${thread.customerId}`;
    if (!unique.has(key)) unique.set(key, thread);
  }
  const candidates = Array.from(unique.values());
  if (candidates.length === 0) {
    throw new Error("ไม่พบห้องแชทที่ยืนยันเบอร์นี้และไม่พบ Customer PSID — เช็กเบอร์/ออเดอร์ก่อนครับ");
  }
  if (candidates.length > 1) {
    const pages = candidates.map((item) => String(item.pageName || item.pageId)).join(", ");
    throw new Error(`เบอร์นี้พบหลายห้องแชท (${pages}) เพื่อกันส่งผิดคน ระบบยังไม่ส่งครับ`);
  }

  const thread = candidates[0];
  const messages = await readChatMessages(String(thread.pageId), String(thread.threadId));
  const latestInboundMs = messages
    .filter((message: any) => message.direction === "inbound")
    .map((message: any) => new Date(String(message.occurredAt ?? "")).getTime())
    .filter(Number.isFinite)
    .reduce((latest: number, current: number) => Math.max(latest, current), 0);

  if (!latestInboundMs) {
    throw new Error("ตรวจไม่พบข้อความขาเข้าล่าสุด จึงยืนยันหน้าต่าง Messenger 24 ชั่วโมงไม่ได้ — ระบบยังไม่ส่งครับ");
  }
  const ageMs = Date.now() - latestInboundMs;
  if (ageMs < -5 * 60 * 1000 || ageMs > 24 * 60 * 60 * 1000) {
    throw new Error("ลูกค้าทักล่าสุดเกิน 24 ชั่วโมงแล้ว ปุ่มนี้ส่งแบบมาตรฐานไม่ได้ครับ ใช้ workflow ที่มีแท็กส่งนอกหน้าต่างแทน");
  }

  return {
    pageId: String(thread.pageId),
    threadId: String(thread.threadId),
    recipientId: String(thread.customerId),
    pageName: String(thread.pageName || "ไม่ระบุเพจ"),
    customerName: String(thread.customerName || "ไม่ระบุชื่อ"),
  };
}

export default function ParcelMapping() {
  const [term, setTerm] = useState("");
  const [mode, setMode] = useState<SearchMode>("auto");
  const [submitted, setSubmitted] = useState<SearchRequest | null>(null);
  const [notice, setNotice] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [sendingKey, setSendingKey] = useState("");
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const sendReply = trpc.parcels.sendTracking.useMutation();
  const threadsQuery = trpc.orders.threads.useQuery(undefined, { enabled: false, staleTime: 15_000 });
  const activeCamp = getActiveCamp();

  const query = trpc.parcels.quickSearch.useQuery(
    { term: submitted?.term ?? "", mode: submitted?.mode ?? "auto", limit: 150 },
    { enabled: Boolean(submitted?.term), staleTime: 15_000 },
  );
  const parcels = useMemo(() => query.data ?? [], [query.data]);

  function runSearch() {
    const value = term.trim();
    if (!value) {
      setNotice("ใส่เบอร์ ชื่อ เลขพัสดุ หรือที่อยู่ก่อนครับ");
      setSubmitted(null);
      return;
    }
    setNotice("");
    setActions({});
    const next = { term: value, mode };
    if (submitted?.term === value && submitted.mode === mode) void query.refetch();
    setSubmitted(next);
  }

  async function copyMessage(row: ParcelRow) {
    try {
      await navigator.clipboard.writeText(buildCustomerMessage(row));
      const key = parcelKey(row);
      setCopiedKey(key);
      setNotice("คัดลอกข้อความแจ้งเลขพัสดุแล้วครับ");
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch (error) {
      setNotice(`คัดลอกไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function sendParcel(row: ParcelRow) {
    const key = parcelKey(row);
    if (!row.phone_number) {
      setActions((current) => ({ ...current, [key]: { kind: "error", text: "ไม่มีเบอร์ผู้รับใน parcels จึงหาระบบแชทไม่ได้" } }));
      return;
    }
    setSendingKey(key);
    setActions((current) => { const next = { ...current }; delete next[key]; return next; });
    try {
      const threadsResult = await threadsQuery.refetch();
      const target = await resolveMessengerTarget(row.phone_number, threadsResult.data ?? []);
      const result = await sendReply.mutateAsync({
        pageId: target.pageId,
        threadId: target.threadId,
        recipientId: target.recipientId,
        text: buildCustomerMessage(row),
      });
      const messageId = (result as any)?.message_id;
      setActions((current) => ({
        ...current,
        [key]: {
          kind: "success",
          text: `ส่ง Messenger สำเร็จ · ${target.pageName}${messageId ? ` · ${messageId}` : ""}`,
        },
      }));
    } catch (error) {
      setActions((current) => ({
        ...current,
        [key]: { kind: "error", text: error instanceof Error ? error.message : String(error) },
      }));
    } finally {
      setSendingKey("");
    }
  }

  return (
    <div className="blackbox-room min-h-full space-y-5 text-white">
      <header className="blackbox-hero relative overflow-hidden rounded-3xl border border-fuchsia-400/30 p-6 shadow-2xl shadow-fuchsia-950/30 sm:p-8">
        <div className="hero-scanline" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="live-chip"><Radar className="h-3.5 w-3.5" /> PARCEL RADAR · DIRECT SEARCH</p>
            <h1 className="cyber-title mt-4 text-3xl font-semibold sm:text-4xl">ห้องค้นหาและส่งเลขพัสดุ</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-fuchsia-100/65">
              ค้นจาก parcels โดยตรง เจอแล้วส่ง Messenger ได้ทันที ไม่ต้องนำเข้า Excel หรือรอแมปเลข
            </p>
          </div>
          <div className="bb-clock-panel rounded-2xl border px-4 py-3 text-xs">
            <span className="bb-running-light mr-2 inline-block h-2 w-2 rounded-full" />{activeCamp} · PARCEL LINK ONLINE
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="signal-metric signal-violet"><p className="text-[10px] uppercase tracking-[0.16em] opacity-65">ผลค้นหาปัจจุบัน</p><p className="mt-2 text-2xl font-bold text-white">{parcels.length.toLocaleString("th-TH")}</p></div>
          <div className="signal-metric signal-cyan"><p className="text-[10px] uppercase tracking-[0.16em] opacity-65">แหล่งข้อมูล</p><p className="mt-2 text-lg font-bold text-white">public.parcels</p></div>
          <div className="signal-metric signal-pink"><p className="text-[10px] uppercase tracking-[0.16em] opacity-65">Messenger</p><p className="mt-2 text-sm font-bold text-white">เช็กหน้าต่าง 24 ชม.</p></div>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="blackbox-queue rounded-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-fuchsia-100"><Search className="h-4 w-4 text-cyan-300" /> QUICK SEARCH</CardTitle>
            <p className="text-xs leading-5 text-white/45">ค้นชื่อ เบอร์ เลขพัสดุ หรือที่อยู่จากโต๊ะ parcels</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {searchModes.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${mode === item.key ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]" : "border-white/10 bg-black/20 text-white/45 hover:border-white/25 hover:text-white/80"}`}
                >{item.label}</button>
              ))}
            </div>
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") runSearch(); }}
              placeholder={searchModes.find((item) => item.key === mode)?.placeholder}
              className="border-fuchsia-400/25 bg-black/35 text-white placeholder:text-white/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={runSearch} disabled={query.isFetching} className="bb-send-button"><Search className="mr-2 h-4 w-4" />ค้นหา</Button>
              <Button onClick={() => submitted && void query.refetch()} disabled={!submitted || query.isFetching} variant="outline" className="border-cyan-300/25 text-cyan-100"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button>
            </div>
            {notice ? <p className="rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-3 text-xs leading-5 text-cyan-100">{notice}</p> : null}
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-3 text-[11px] leading-5 text-amber-100/65">
              ส่ง Messenger ได้เมื่อพบห้องที่เบอร์ตรงและลูกค้าทักเข้ามาภายใน 24 ชั่วโมง หากเบอร์ซ้ำหลายห้องหรือเกินเวลา ระบบจะหยุดก่อนส่งเพื่อกันส่งผิดคน/ผิดนโยบาย
            </div>
          </CardContent>
        </Card>

        <Card className="blackbox-queue overflow-hidden rounded-3xl">
          <CardHeader className="border-b border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-fuchsia-100"><PackageSearch className="h-4 w-4 text-cyan-300" /> PARCEL RESULTS · {parcels.length}</CardTitle>
              {submitted ? <Badge variant="outline" className="border-cyan-300/25 text-cyan-100">ค้น: {submitted.term}</Badge> : null}
            </div>
          </CardHeader>
          <CardContent className="max-h-[760px] space-y-3 overflow-auto p-3 sm:p-4">
            {query.isError ? (
              <div className="rounded-2xl border border-red-300/25 bg-red-400/5 p-4 text-sm text-red-200">
                ค้นข้อมูลไม่สำเร็จ: {(query.error as { message?: string } | null)?.message ?? String(query.error)}
                <p className="mt-2 text-xs text-red-100/60">รันไฟล์ PARCEL_QUICK_SEARCH_RPC.sql และตรวจสิทธิ์ RLS สำหรับผู้ใช้หน้าเว็บครับ</p>
              </div>
            ) : null}
            {query.isLoading ? <p className="p-12 text-center text-sm text-cyan-100/60">กำลังค้นโต๊ะ parcels…</p> : null}
            {!submitted && !query.isLoading ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-white/40">
                <PackageSearch className="mb-3 h-9 w-9 text-cyan-300/45" />
                <p>พิมพ์เบอร์ ชื่อ เลขพัสดุ หรือที่อยู่ แล้วกดค้นหา</p>
                <p className="mt-1 text-xs text-white/25">ไม่ต้องอัปโหลดไฟล์และไม่ต้องรอแมป</p>
              </div>
            ) : null}
            {submitted && !query.isLoading && !query.isError && parcels.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center text-center text-white/40">
                <PackageSearch className="mb-3 h-8 w-8 text-fuchsia-300/40" />
                <p>ไม่พบพัสดุ ลองค้นด้วยข้อมูลอีกแบบครับ</p>
              </div>
            ) : null}
            {parcels.map((row) => {
              const key = parcelKey(row);
              const action = actions[key];
              const isSending = sendingKey === key;
              return (
                <article key={key} className="trace-row rounded-2xl border border-cyan-300/10 bg-black/20 p-4 transition hover:border-cyan-300/25">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">FLASH TRACKING</p>
                      <p className="mt-1 break-all font-mono text-lg font-bold tracking-wide text-cyan-200">{row.tracking_number || "ไม่มีเลขพัสดุ"}</p>
                    </div>
                    <Badge variant="outline" className="border-fuchsia-300/30 bg-fuchsia-300/5 text-fuchsia-100">FLASH EXPRESS</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm sm:grid-cols-2">
                    <p className="flex items-start gap-2 text-white/80"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span>{row.consignee || "ไม่ระบุชื่อผู้รับ"}</span></p>
                    <p className="flex items-start gap-2 text-white/80"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span>{row.phone_number || "ไม่ระบุเบอร์"}</span></p>
                    <p className="flex items-start gap-2 text-white/70 sm:col-span-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span className="break-words">{row.address || "ไม่ระบุที่อยู่"}</span></p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                    <span>รับเข้าระบบ: {row.pickup_date || "ไม่ระบุ"}</span>
                    <span>COD: {formatCod(row.cod_amount)}{row.cod_amount != null && String(row.cod_amount).trim() ? " บาท" : ""}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
                    <Button onClick={() => void sendParcel(row)} disabled={isSending || Boolean(actions[key]?.kind === "success")} className="bb-send-button">
                      <Send className="mr-2 h-4 w-4" />{isSending ? "กำลังส่ง…" : actions[key]?.kind === "success" ? "ส่งแล้ว" : "ส่งให้ลูกค้า"}
                    </Button>
                    <Button onClick={() => void copyMessage(row)} variant="outline" className="border-cyan-300/25 text-cyan-100">
                      {copiedKey === key ? <Check className="mr-2 h-4 w-4" /> : <Clipboard className="mr-2 h-4 w-4" />}{copiedKey === key ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
                    </Button>
                    <Button onClick={() => window.open(flashTrackingUrl, "_blank", "noopener,noreferrer")} variant="ghost" className="text-white/45 hover:text-white">
                      <ExternalLink className="mr-2 h-4 w-4" />เปิด FLASH
                    </Button>
                  </div>
                  {action ? <p className={`mt-3 rounded-xl border p-3 text-xs leading-5 ${action.kind === "success" ? "border-emerald-300/25 bg-emerald-400/5 text-emerald-200" : "border-amber-300/25 bg-amber-400/5 text-amber-100"}`}>{action.text}</p> : null}
                </article>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 text-[10px] text-white/25">
        <span>DIRECT PARCEL SEARCH · public.parcels · ไม่มีการจับคู่คิวล่วงหน้า</span>
        <span>Page token ใช้บน server เท่านั้น · Messenger ส่งผ่าน admin tRPC</span>
      </footer>
    </div>
  );
}
