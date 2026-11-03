import { Input } from "@/components/ui/input";
import { readTelegramSentHistory } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, RefreshCw, Search, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

function text(row: Record<string, any>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "-";
}

function money(value: unknown) {
  if (value === null || value === undefined || String(value).trim() === "") return "-";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toLocaleString("th-TH")} บาท` : String(value);
}

export default function TelegramSentHistory() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["telegram-sent-history", search],
    queryFn: () => readTelegramSentHistory(search),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  const orders = (query.data?.orders ?? []) as Array<Record<string, any>>;

  return (
    <div className="min-h-full space-y-5 text-white">
      <header className="rounded-3xl border border-emerald-300/25 bg-[#081713] p-6 shadow-2xl shadow-emerald-950/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300"><Send className="mr-2 inline h-4 w-4" />TELEGRAM SENT HISTORY</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">ประวัติ Telegram · ส่งสำเร็จ</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-100/65">ห้องประวัติแยกสำหรับรายการ Telegram ที่ส่งสำเร็จและผ่านการบันทึกเป็นประวัติดี อ่านจาก GENESIS โดยตรง ไม่รวมคิว PIONEER หรือรายการปฏิบัติการของ ANDROMEDA</p>
          </div>
          <div className="flex flex-wrap items-start justify-end gap-2">
            <Link href="/telegram-delivery"><button type="button" className="rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-2 text-xs text-fuchsia-100 hover:bg-fuchsia-400/20">กลับห้อง Telegram</button></Link>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-200/60">SOURCE ROOM</p>
            <p className="mt-1 font-mono text-xs text-emerald-100">🌟GENESIS_xXx_HISTORY</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-200/45" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขออเดอร์ เบอร์โทร ชื่อลูกค้า หรือ upsert_key" className="border-emerald-300/20 bg-black/25 pl-9 text-white placeholder:text-emerald-100/30" /></div>
          <button type="button" onClick={() => void query.refetch()} className="inline-flex items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-400/20"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.06] p-4"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-2xl font-semibold text-white">{orders.length}</p><p className="text-xs text-emerald-100/55">รายการส่งสำเร็จที่อ่านได้</p></div>
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] p-4"><Clock3 className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-sm font-semibold text-white">{query.data?.fetchedAt ? new Date(query.data.fetchedAt).toLocaleTimeString("th-TH") : "-"}</p><p className="text-xs text-cyan-100/55">เวลาอ่านข้อมูลล่าสุด</p></div>
        <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.06] p-4"><Send className="h-5 w-5 text-violet-300" /><p className="mt-3 text-sm font-semibold text-white">GENESIS</p><p className="text-xs text-violet-100/55">แหล่งประวัติดีที่ส่งสำเร็จ</p></div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-emerald-300/15 bg-[#0b1512] shadow-xl shadow-emerald-950/10">
        <div className="border-b border-white/10 px-5 py-4"><h2 className="text-base font-semibold text-emerald-50">รายการที่ส่ง Telegram สำเร็จ</h2><p className="mt-1 text-xs text-emerald-100/45">ระบบแสดงข้อมูลตามที่บันทึกจากห้องต้นทาง โดยไม่สร้างข้อความหรือสถานะขึ้นใหม่</p></div>
        {query.isLoading ? <p className="p-10 text-center text-sm text-emerald-100/50">กำลังอ่านประวัติการส่งสำเร็จ...</p> : null}
        {!query.isLoading && query.error ? <p className="p-10 text-center text-sm text-rose-200">อ่านประวัติไม่สำเร็จ: {query.error instanceof Error ? query.error.message : String(query.error)}</p> : null}
        {!query.isLoading && !query.error && !orders.length ? <p className="p-10 text-center text-sm text-emerald-100/50">ยังไม่พบรายการในห้องประวัติส่งสำเร็จ</p> : null}
        <div className="divide-y divide-white/[0.07]">
          {orders.map((row, index) => {
            const key = text(row, "upsert_key", "order_number", "id") || String(index);
            return <article key={key} className="grid gap-4 px-5 py-4 transition hover:bg-emerald-300/[0.04] md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
              <div><div className="flex items-center gap-2"><span className="font-mono text-sm text-emerald-200">{text(row, "order_number", "order_number_display", "upsert_key")}</span><span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">🔥SENT</span></div><p className="mt-1 text-xs text-white/55">upsert_key: {text(row, "upsert_key")}</p></div>
              <div><p className="text-sm text-white">{text(row, "customer_name", "master_customer_name", "facebook_name")}</p><p className="mt-1 text-xs text-white/45">{text(row, "phone", "extracted_phone", "master_customer_phone")}</p></div>
              <div><p className="text-sm text-amber-100">{money(row.cod_amount)}</p><p className="mt-1 text-xs text-white/45">{text(row, "order_time_display", "order_time", "sent_at")}</p></div>
              <div className="text-xs text-emerald-200/70">ส่งสำเร็จแล้ว</div>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
