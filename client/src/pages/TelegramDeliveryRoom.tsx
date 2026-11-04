import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getActiveCamp,
  markBbOrderSentByKey,
  readTelegramDeliveryOrders,
  searchThailandPostalMaster,
  updateBbOrderByKey,
  type PostalMasterMatch,
} from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, Database, MapPin, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

type OrderRow = Record<string, any> & { upsert_key: string; order_time_display: string };
type Room = "queue" | "sent";

function displayRaw(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function sourceTableOf(row: OrderRow): "🗝️HERMES_ARCHIVE" | "🌀SINGULARITY_xXx_EXCHANGE" {
  if (row.source_table === "🗝️HERMES_ARCHIVE" || row.source_table === "🌀SINGULARITY_xXx_EXCHANGE") return row.source_table;
  throw new Error(`ไม่พบ source_table สำหรับ upsert_key=${row.upsert_key}`);
}

function isTheftRisk(row: OrderRow) {
  const evidence = [row.audit_flags, row.raw_text].map(displayRaw).join(" ");
  return /พื้นที่เสี่ยงสูง|RISK\s*AREA|สินค้าโดนขโมย/i.test(evidence);
}

function postalAddressText(row: PostalMasterMatch) {
  return [
    row.district ? `ต.${row.district}` : "",
    row.amphoe ? `อ.${row.amphoe}` : "",
    row.province ? `จ.${row.province}` : "",
    row.zipcode || "",
  ].filter(Boolean).join(" ");
}

function Value({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{displayRaw(value)}</p></div>;
}

export default function TelegramDeliveryRoom() {
  const [room, setRoom] = useState<Room>(() => new URLSearchParams(window.location.search).get("room") === "sent" ? "sent" : "queue");
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const [selectedKey, setSelectedKey] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [postalResults, setPostalResults] = useState<PostalMasterMatch[]>([]);
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalMessage, setPostalMessage] = useState("");

  const query = useQuery({
    queryKey: ["telegram-display-room", getActiveCamp(), room, search],
    queryFn: () => readTelegramDeliveryOrders(search, room),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const orders = (query.data?.orders ?? []) as unknown as OrderRow[];
  const selectedOrder = orders.find((row) => row.upsert_key === selectedKey) ?? orders[0] ?? null;

  useEffect(() => {
    if (!selectedOrder) {
      setSelectedKey("");
      return;
    }
    if (!orders.some((row) => row.upsert_key === selectedKey)) setSelectedKey(selectedOrder.upsert_key);
  }, [orders, selectedKey, selectedOrder]);

  async function markSelectedSent() {
    if (!selectedOrder?.upsert_key) {
      setStatusMessage("อัปเดตไม่ได้: ไม่พบ upsert_key");
      return;
    }
    setStatusSaving(true);
    setStatusMessage("");
    try {
      await markBbOrderSentByKey(selectedOrder.upsert_key, sourceTableOf(selectedOrder));
      setStatusMessage(`บันทึกสถานะ SENT สำหรับ ${selectedOrder.upsert_key} แล้ว`);
      await query.refetch();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setStatusSaving(false);
    }
  }

  async function returnSelectedToQueue() {
    if (!selectedOrder?.upsert_key) {
      setStatusMessage("อัปเดตไม่ได้: ไม่พบ upsert_key");
      return;
    }
    if (!window.confirm("ยืนยันเปลี่ยนสถานะรายการนี้กลับเป็น PENDING?")) return;
    setStatusSaving(true);
    setStatusMessage("");
    try {
      await updateBbOrderByKey(selectedOrder.upsert_key, {
        telegram_sent: "false",
        telegram_status: "PENDING",
        delivery_status: "PENDING",
        delivery_state: "PENDING",
        sent_at: null,
        telegram_sent_at: null,
      }, sourceTableOf(selectedOrder));
      setStatusMessage(`บันทึกสถานะ PENDING สำหรับ ${selectedOrder.upsert_key} แล้ว`);
      setRoom("queue");
      await query.refetch();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setStatusSaving(false);
    }
  }

  async function checkAddress() {
    if (!addressQuery.trim()) {
      setPostalResults([]);
      setPostalMessage("พิมพ์ที่อยู่หรือรหัสไปรษณีย์ก่อน");
      return;
    }
    setPostalLoading(true);
    setPostalMessage("");
    try {
      const results = await searchThailandPostalMaster(addressQuery);
      setPostalResults(results);
      if (!results.length) setPostalMessage("ไม่พบพื้นที่หรือรหัสไปรษณีย์ที่ตรงกัน");
    } catch (error) {
      setPostalResults([]);
      setPostalMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPostalLoading(false);
    }
  }

  async function copyAddress(row: PostalMasterMatch) {
    const address = postalAddressText(row);
    if (!address) return;
    await navigator.clipboard?.writeText(address);
    setPostalMessage(`คัดลอกที่อยู่แล้ว: ${address}`);
  }

  return <div className="min-h-full space-y-5 text-white">
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-cyan-300/15 bg-[#0b1218] p-6 shadow-2xl shadow-cyan-950/15">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><Database className="h-4 w-4" /> N8N · SUPABASE DATA VIEW</p>
        <h1 className="mt-3 text-3xl font-semibold">ข้อมูล Telegram</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-100/60">เว็บแสดง payload ที่ n8n เตรียมไว้ · ไม่สร้าง แก้ หรือตรวจข้อความ Telegram · upsert_key เป็นคีย์เดียว · order_time_display เป็นเวลาออเดอร์</p>
      </div>
      <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching} className="border-cyan-300/20 bg-cyan-400/5 text-cyan-100"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button>
    </header>

    <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
      <Card className="border-white/10 bg-[#101116]">
        <CardHeader className="space-y-3 border-b border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4 text-cyan-300" />{room === "sent" ? "ประวัติ SENT" : "รายการจาก n8n"}</CardTitle><Button size="sm" variant="outline" onClick={() => { setRoom(room === "sent" ? "queue" : "sent"); setSelectedKey(""); }} className="border-cyan-300/20 bg-cyan-400/5 text-cyan-100">{room === "sent" ? "ดูรายการหลัก" : "ประวัติ SENT"}</Button></div>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา upsert_key หรือข้อมูลในแถว" className="border-white/10 bg-black/20 pl-9 text-white placeholder:text-slate-600" /></div>
          <p className="text-xs text-slate-500">{orders.length} รายการ · ดึงข้อมูลล่าสุด {query.data?.fetchedAt ? new Date(query.data.fetchedAt).toLocaleTimeString("th-TH") : "—"}</p>
        </CardHeader>
        <CardContent className="max-h-[72vh] space-y-2 overflow-auto p-3">
          {query.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังอ่านข้อมูล…</p> : null}
          {query.error ? <p className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200">อ่านข้อมูลไม่สำเร็จ: {query.error instanceof Error ? query.error.message : String(query.error)}</p> : null}
          {!query.isLoading && !query.error && orders.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบรายการ</p> : null}
          {orders.map((row) => <button key={row.upsert_key} type="button" onClick={() => setSelectedKey(row.upsert_key)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedOrder?.upsert_key === row.upsert_key ? "border-cyan-300/40 bg-cyan-400/10" : "border-white/5 bg-black/15 hover:border-white/15"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm text-cyan-100">{row.order_number}</span><span className="text-xs text-slate-400">{row.order_time_display}</span></div>
            <p className="mt-2 text-sm text-white">{row.customer_name}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-slate-500">{row.upsert_key}</p>
            {isTheftRisk(row) ? <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-rose-300/25 bg-rose-400/10 px-2 py-1 text-[10px] text-rose-200"><AlertTriangle className="h-3 w-3" />พื้นที่เสี่ยงโดนขโมย</span> : null}
          </button>)}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-white/10 bg-[#101116]">
          <CardHeader className="border-b border-white/10"><CardTitle className="text-base">ข้อมูลที่ n8n เตรียมไว้</CardTitle></CardHeader>
          <CardContent className="space-y-4 p-5">
            {!selectedOrder ? <p className="py-10 text-center text-sm text-slate-500">เลือกแถวเพื่อดูข้อมูล</p> : <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-mono text-lg font-semibold text-cyan-100">{selectedOrder.order_number}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">upsert_key: {selectedOrder.upsert_key}</p></div>
                <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{selectedOrder.order_time_display}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Value label="ลูกค้า" value={selectedOrder.customer_name} />
                <Value label="เบอร์โทร" value={selectedOrder.phone} />
                <Value label="เพจ" value={selectedOrder.page_name} />
                <Value label="COD" value={selectedOrder.cod_amount} />
                <Value label="สินค้า n8n" value={selectedOrder.telegram_product_display} />
                <Value label="สถานะ Telegram" value={selectedOrder.telegram_status} />
                <Value label="ที่อยู่ที่ n8n เตรียม" value={selectedOrder.address_fibo_selected_clean} />
                <Value label="พื้นที่/จังหวัด" value={selectedOrder.province} />
                <Value label="telegram_change_alert" value={selectedOrder.telegram_change_alert} />
              </div>
              {isTheftRisk(selectedOrder) ? <p className="flex items-center gap-2 rounded-xl border border-rose-300/25 bg-rose-500/10 p-3 text-sm text-rose-100"><AlertTriangle className="h-4 w-4" />พบข้อความระบุพื้นที่เสี่ยงโดนขโมยในข้อมูลกลาง</p> : null}
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">telegram_message · field ส่งเดียวจาก n8n</p><pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-emerald-300/20 bg-black/20 p-4 text-xs leading-5 text-slate-200">{displayRaw(selectedOrder.telegram_message_web || selectedOrder.telegram_message)}</pre></section>
              <section><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">ก้อนออเดอร์ต้นทาง</p><pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-slate-300">{displayRaw(selectedOrder.original)}</pre></section>
              <div className="flex flex-wrap gap-2">
                {room === "queue" ? <Button onClick={() => void markSelectedSent()} disabled={statusSaving} className="bg-emerald-600/80 text-white"><CheckCircle2 className="mr-2 h-4 w-4" />{statusSaving ? "กำลังบันทึก…" : "เขียนสถานะ SENT"}</Button> : <Button onClick={() => void returnSelectedToQueue()} disabled={statusSaving} variant="outline" className="border-amber-300/25 bg-amber-400/5 text-amber-100">{statusSaving ? "กำลังบันทึก…" : "เปลี่ยนกลับเป็น PENDING"}</Button>}
              </div>
              {statusMessage ? <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-300">{statusMessage}</p> : null}
            </>}
          </CardContent>
        </Card>

        <Card className="border-cyan-300/15 bg-[#0c1418]">
          <CardHeader className="border-b border-cyan-300/10"><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><MapPin className="h-4 w-4" />ตรวจที่อยู่ / รหัสไปรษณีย์</CardTitle></CardHeader>
          <CardContent className="space-y-3 p-5">
            <p className="text-xs leading-5 text-cyan-100/50">เครื่องมือนี้ใช้ค้นพื้นที่และคัดลอกที่อยู่จากฐานไปรษณีย์ ไม่เปลี่ยนข้อมูลออเดอร์อัตโนมัติ</p>
            <div className="flex flex-col gap-2 sm:flex-row"><Input value={addressQuery} onChange={(event) => setAddressQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void checkAddress(); } }} placeholder="พิมพ์ที่อยู่หรือรหัสไปรษณีย์" className="border-cyan-300/20 bg-black/20 text-white" /><Button onClick={() => void checkAddress()} disabled={postalLoading} className="bg-cyan-700/70 text-white">{postalLoading ? "กำลังค้น…" : "ตรวจพื้นที่"}</Button></div>
            {postalMessage ? <p className="text-xs text-cyan-100/70">{postalMessage}</p> : null}
            <div className="max-h-56 space-y-2 overflow-auto">{postalResults.map((row, index) => <div key={`${row.zipcode}-${row.district}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/10 bg-black/15 p-3"><div><p className="text-sm text-cyan-100">{[row.district, row.amphoe, row.province].filter(Boolean).join(" · ")}</p><p className="mt-1 font-mono text-xs text-slate-400">{row.zipcode}</p></div><Button size="sm" variant="outline" onClick={() => void copyAddress(row)} className="border-cyan-300/20 text-cyan-100">คัดลอกที่อยู่</Button></div>)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>;
}
