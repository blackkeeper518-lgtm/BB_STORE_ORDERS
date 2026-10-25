import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, readChatMessages } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import { Check, Clipboard, ExternalLink, PackageSearch, Phone, Radar, Search, Send, UserRound, WalletCards } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type ParcelRow = {
  id?: unknown;
  pickup_date?: unknown;
  tracking_number?: unknown;
  consignee?: unknown;
  phone_number?: unknown;
  cod_amount?: unknown;
  [key: string]: unknown;
};
type ActionState = { kind: "success" | "error"; text: string };
type MessengerTarget = { pageId: string; threadId: string; recipientId: string; pageName: string; customerName: string };

const flashTrackingUrl = "https://www.flashexpress.co.th/fle/tracking";
const money = new Intl.NumberFormat("th-TH");

function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D/g, "");
}
function normalizePhone(value: unknown) {
  const digits = digitsOnly(value);
  return digits.startsWith("66") ? `0${digits.slice(2)}` : digits;
}
function valueOf(row: ParcelRow, key: keyof ParcelRow) {
  return row[key] == null ? "" : String(row[key]).trim();
}
function formatCod(value: unknown) {
  if (value == null || String(value).trim() === "") return "ไม่ระบุ";
  const amount = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? money.format(amount) : String(value);
}
function parcelKey(row: ParcelRow) {
  const id = valueOf(row, "id");
  return id || `${valueOf(row, "tracking_number")}|${valueOf(row, "pickup_date")}|${valueOf(row, "phone_number")}`;
}
function buildCustomerMessage(row: ParcelRow) {
  const name = valueOf(row, "consignee") || "คุณลูกค้า";
  const tracking = valueOf(row, "tracking_number");
  const cod = row.cod_amount;
  const lines = [
    `สวัสดีค่ะ ${name} 🙏`,
    "น้องขอแจ้งเลขพัสดุให้นะคะ",
    `📦 เลขพัสดุ: ${tracking}`,
    "🚚 ขนส่ง: ⚡ FLASH EXPRESS",
  ];
  if (row.pickup_date) lines.push(`🗓️ วันที่รับเข้าระบบขนส่ง: ${valueOf(row, "pickup_date")}`);
  if (cod != null && String(cod).trim()) lines.push(`💰 ยอดเก็บเงินปลายทาง (COD): ${formatCod(cod)} บาท`);
  lines.push("", "เพื่อความสบายใจ พี่แกะเช็กก่อนรับได้นะคะ อย่าลืมถ่ายคลิปตอนแกะไว้ค่ะ", "ขอบพระคุณที่อุดหนุนค่ะ ❤️");
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
  if (candidates.length === 0) throw new Error("ไม่พบห้องแชทที่ยืนยันเบอร์นี้และไม่พบ Customer PSID — เช็กเบอร์/ออเดอร์ก่อนครับ");
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
  if (!latestInboundMs) throw new Error("ตรวจไม่พบข้อความขาเข้าล่าสุด จึงยืนยันหน้าต่าง Messenger 24 ชั่วโมงไม่ได้ — ระบบยังไม่ส่งครับ");
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
  const [phoneInput, setPhoneInput] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const [sendingKey, setSendingKey] = useState("");
  const [actions, setActions] = useState<Record<string, ActionState>>({});
  const sendTracking = trpc.parcels.sendTracking.useMutation();
  const threadsQuery = trpc.orders.threads.useQuery(undefined, { enabled: false, staleTime: 15_000 });
  const activeCamp = getActiveCamp();
  const parcelQuery = trpc.parcels.findByPhone.useQuery(
    { phone: lookupPhone },
    { enabled: Boolean(lookupPhone), staleTime: 10_000, refetchOnWindowFocus: false },
  );
  const parcels = useMemo(() => (parcelQuery.data ?? []) as ParcelRow[], [parcelQuery.data]);

  function lookup(e?: FormEvent) {
    e?.preventDefault();
    const phone = normalizePhone(phoneInput);
    if (phone.length !== 10) {
      setNotice("ใส่เบอร์โทร 10 หลักก่อนครับ");
      setLookupPhone("");
      return;
    }
    setNotice("");
    setActions({});
    setCopiedKey("");
    if (phone === lookupPhone) void parcelQuery.refetch();
    else setLookupPhone(phone);
  }

  async function copyTracking(row: ParcelRow) {
    const tracking = valueOf(row, "tracking_number");
    if (!tracking) return;
    const key = parcelKey(row);
    try {
      await navigator.clipboard.writeText(tracking);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1500);
    } catch {
      setNotice("คัดลอกไม่ได้ ลองอนุญาต Clipboard ในเบราว์เซอร์ก่อนครับ");
    }
  }

  async function sendParcel(row: ParcelRow) {
    const key = parcelKey(row);
    const phone = valueOf(row, "phone_number");
    if (!phone) {
      setActions((current) => ({ ...current, [key]: { kind: "error", text: "แถวนี้ไม่มี phone_number จึงหาระบบแชทไม่ได้" } }));
      return;
    }
    setSendingKey(key);
    setActions((current) => { const next = { ...current }; delete next[key]; return next; });
    try {
      const threadsResult = await threadsQuery.refetch();
      const target = await resolveMessengerTarget(phone, threadsResult.data ?? []);
      const result = await sendTracking.mutateAsync({
        pageId: target.pageId,
        threadId: target.threadId,
        recipientId: target.recipientId,
        text: buildCustomerMessage(row),
      });
      const messageId = (result as any)?.message_id;
      setActions((current) => ({
        ...current,
        [key]: { kind: "success", text: `ส่ง Messenger สำเร็จ · ${target.pageName}${messageId ? ` · ${messageId}` : ""}` },
      }));
    } catch (error) {
      setActions((current) => ({ ...current, [key]: { kind: "error", text: error instanceof Error ? error.message : String(error) } }));
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
            <p className="live-chip"><Radar className="h-3.5 w-3.5" /> PARCEL RADAR · PHONE DIRECT</p>
            <h1 className="cyber-title mt-4 text-3xl font-semibold sm:text-4xl">เปิดแถวพัสดุด้วยเบอร์</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-fuchsia-100/65">ใส่เบอร์ลูกค้า ระบบเทียบกับ <code>phone_number</code> โดยตรง ถ้ามีเลขนี้ก็ยกแถวนั้นขึ้นมาเลย ไม่ต้องไล่ดูทั้งตาราง</p>
          </div>
          <div className="bb-clock-panel rounded-2xl border px-4 py-3 text-xs"><span className="bb-running-light mr-2 inline-block h-2 w-2 rounded-full" />{activeCamp} · PARCELS ONLINE</div>
        </div>
        <form onSubmit={lookup} className="relative mt-6 flex flex-col gap-3 rounded-2xl border border-cyan-300/20 bg-black/30 p-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-200/60" />
            <Input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="กรอกเบอร์โทร เช่น 0967435961"
              aria-label="เบอร์โทรลูกค้า"
              className="h-12 border-cyan-300/20 bg-slate-950/70 pl-11 font-mono text-lg tracking-wider text-white placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-white/30 focus-visible:ring-cyan-300/40"
            />
          </div>
          <Button type="submit" disabled={parcelQuery.isFetching} className="h-12 min-w-44 bb-send-button">
            <Search className={`mr-2 h-4 w-4 ${parcelQuery.isFetching ? "animate-pulse" : ""}`} />{parcelQuery.isFetching ? "กำลังเปิดแถว…" : "เปิดแถวจากเบอร์"}
          </Button>
        </form>
        <p className="relative mt-2 text-xs text-cyan-100/45">ค้นเฉพาะเบอร์โทรแบบตรงตัว · ไม่ค้นชื่อ/ที่อยู่/เลขพัสดุ · แสดง 5 ช่องหลัก</p>
      </header>

      {notice ? <div className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-3 text-sm text-amber-100">{notice}</div> : null}
      {parcelQuery.isError ? <div className="rounded-2xl border border-red-300/25 bg-red-400/5 p-4 text-sm text-red-200">ดึงแถวจากเบอร์นี้ไม่สำเร็จ: {parcelQuery.error.message}</div> : null}

      {!lookupPhone ? <Card className="blackbox-queue rounded-3xl"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><PackageSearch className="mb-3 h-9 w-9 text-cyan-300/55" /><p className="text-white/75">กรอกเบอร์แล้วกดเปิดแถวได้เลยครับ</p><p className="mt-2 text-xs text-white/35">ระบบจะดึงเฉพาะแถวที่ phone_number ตรงกัน</p></CardContent></Card> : null}
      {parcelQuery.isLoading || (parcelQuery.isFetching && parcels.length === 0) ? <Card className="blackbox-queue rounded-3xl"><CardContent className="p-12 text-center text-sm text-cyan-100/60">กำลังดึงแถวจาก parcels…</CardContent></Card> : null}
      {lookupPhone && parcelQuery.isSuccess && parcels.length === 0 ? <Card className="blackbox-queue rounded-3xl"><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><Phone className="mb-3 h-8 w-8 text-amber-300/60" /><p className="text-lg font-semibold text-white/80">ไม่พบเบอร์ {lookupPhone}</p><p className="mt-2 max-w-md text-sm text-white/45">ตรวจจากคอลัมน์ <code>phone_number</code> ในตาราง <code>parcels</code> เท่านั้นครับ</p></CardContent></Card> : null}

      {parcels.length > 0 ? <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1"><div><h2 className="text-lg font-semibold text-fuchsia-100">เจอ {parcels.length.toLocaleString("th-TH")} แถว</h2><p className="text-xs text-white/40">เบอร์ {lookupPhone} · เรียงจาก pickup_date ล่าสุด</p></div><Badge variant="outline" className="border-cyan-300/25 text-cyan-100">phone_number exact match</Badge></div>
        {parcels.map((row) => {
          const key = parcelKey(row);
          const action = actions[key];
          return <Card key={key} className="blackbox-queue overflow-hidden rounded-3xl border-cyan-300/15">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-white/5 pb-4">
              <div><CardTitle className="flex items-center gap-2 text-fuchsia-100"><UserRound className="h-4 w-4 text-cyan-300" />{valueOf(row, "consignee") || "ไม่ระบุชื่อผู้รับ"}</CardTitle><p className="mt-1 text-xs text-white/40">วันที่รับเข้าระบบ · {valueOf(row, "pickup_date") || "ไม่ระบุ"}</p></div>
              <Badge variant="outline" className="border-fuchsia-300/25 text-fuchsia-100">FLASH</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[0.035] p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">ผู้รับ</p><p className="mt-1 text-base font-semibold text-white">{valueOf(row, "consignee") || "ไม่ระบุ"}</p>
                <div className="mt-4 flex items-center gap-2 text-cyan-100"><Phone className="h-4 w-4" /><span className="font-mono font-semibold">{valueOf(row, "phone_number") || "ไม่ระบุเบอร์"}</span></div>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.035] p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">ยอดเก็บเงินปลายทาง · COD</p><p className="mt-1 text-xl font-bold text-amber-200">{formatCod(row.cod_amount)}{row.cod_amount != null && String(row.cod_amount).trim() ? " บาท" : ""}</p>
                <p className="mt-3 text-xs text-white/40">เวลารับเข้าระบบขนส่ง</p><p className="mt-1 text-sm text-white/80">{valueOf(row, "pickup_date") || "ไม่ระบุ"}</p>
              </div>

              <div className="rounded-2xl border border-cyan-300/35 bg-cyan-400/[0.06] p-4 shadow-[0_0_26px_rgba(34,211,238,0.08)] sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/55">TRACKING NUMBER</p><Badge variant="outline" className="border-cyan-300/25 text-cyan-100">แยกช่อง · คัดลอกได้</Badge></div>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="break-all font-mono text-2xl font-extrabold tracking-wide text-cyan-100">{valueOf(row, "tracking_number") || "ไม่มีเลขพัสดุ"}</p><Button onClick={() => void copyTracking(row)} disabled={!valueOf(row, "tracking_number")} className="bb-send-button shrink-0"><Clipboard className="mr-2 h-4 w-4" />{copiedKey === key ? "คัดลอกแล้ว" : "คัดลอกเลขพัสดุ"}</Button></div>
              </div>

              <div className="flex flex-wrap gap-2 sm:col-span-2"><Button onClick={() => void sendParcel(row)} disabled={sendingKey === key || action?.kind === "success"} className="bb-send-button"><Send className="mr-2 h-4 w-4" />{sendingKey === key ? "กำลังส่ง…" : action?.kind === "success" ? "ส่งแล้ว" : "ส่งเลขให้ลูกค้า"}</Button><Button onClick={() => window.open(flashTrackingUrl, "_blank", "noopener,noreferrer")} variant="outline" className="border-fuchsia-300/25 text-fuchsia-100"><ExternalLink className="mr-2 h-4 w-4" />เปิด FLASH</Button></div>
              {action ? <p className={`rounded-xl border p-3 text-xs leading-5 sm:col-span-2 ${action.kind === "success" ? "border-emerald-300/25 bg-emerald-400/5 text-emerald-200" : "border-amber-300/25 bg-amber-400/5 text-amber-100"}`}>{action.text}</p> : null}
            </CardContent>
          </Card>;
        })}
      </section> : null}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-2 text-[10px] text-white/25"><span>PARCELS · exact lookup จาก phone_number · 5 ช่องหลัก</span><span>Page token อยู่ฝั่ง server · ส่ง Messenger เฉพาะ admin และตรวจหน้าต่าง 24 ชั่วโมง</span></footer>
    </div>
  );
}
