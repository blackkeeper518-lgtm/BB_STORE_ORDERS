import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { RefreshCw, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";

type QueueStatus = "all" | "sent";
type QueueRow = Record<string, unknown>;

const displayFields = [
  ["tracking_number", "เลขพัสดุ"],
  ["consignee", "ผู้รับ"],
  ["phone_number", "เบอร์โทร"],
  ["page_name", "เพจ"],
  ["portal_key", "พอร์ทัล"],
  ["pickup_date", "วันที่รับ"],
  ["cod_amount", "COD"],
  ["delivery_status", "สถานะพัสดุ"],
  ["sent_at", "เวลาส่ง"],
] as const;

function value(row: QueueRow, key: string) {
  const raw = row[key];
  return raw === null || raw === undefined || String(raw).trim() === "" ? "—" : String(raw);
}

function statusTone(status: unknown) {
  const normalized = String(status ?? "").toUpperCase();
  if (["🔥SENT", "SENT", "SUCCESS", "COMPLETED", "DELIVERED", "SENT_TO_TELEGRAM"].includes(normalized)) return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (normalized === "PENDING" || !normalized) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return "border-white/10 bg-white/5 text-slate-300";
}

export default function ParcelMapping() {
  const [status, setStatus] = useState<QueueStatus>("all");
  const [search, setSearch] = useState("");
  const query = trpc.parcels.mappingQueue.useQuery(
    { status, limit: 300 },
    { refetchInterval: 30_000 },
  );

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const source = Array.isArray(query.data) ? query.data : [];
    if (!needle) return source;
    return source.filter((row) => JSON.stringify(row).toLowerCase().includes(needle));
  }, [query.data, search]);

  const activeCount = rows.filter((row) => !String(row.delivery_status ?? "").toUpperCase().includes("SENT")).length;
  const sentCount = rows.length - activeCount;

  return (
    <div className="min-h-[calc(100vh-2rem)] bg-[#09090b] text-white">
      <div className="mx-auto max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-7">
        <header className="rounded-3xl border border-cyan-400/20 bg-[#111116] px-6 py-6 shadow-2xl shadow-cyan-950/10 sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                <Truck className="h-3.5 w-3.5" /> PARCEL QUEUE · VIEW ONLY
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">คิวพัสดุ</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">หน้านี้อ่านข้อมูลจาก View ที่เตรียมไว้แล้วเท่านั้น ไม่สร้าง mapping และไม่เขียนข้อมูลซ้ำ</p>
            </div>
            <Badge className="w-fit border border-cyan-400/30 bg-cyan-400/10 text-cyan-200">SHADOW → DEAD · รีเฟรช 30 วินาที</Badge>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-white/10 bg-[#111116]"><CardContent className="p-4"><p className="text-xs text-slate-500">รายการที่แสดง</p><p className="mt-1 text-2xl font-semibold">{rows.length}</p></CardContent></Card>
          <Card className="border-cyan-400/20 bg-[#111116]"><CardContent className="p-4"><p className="text-xs text-slate-500">คิวพร้อมทำงาน</p><p className="mt-1 text-2xl font-semibold text-cyan-200">{activeCount}</p></CardContent></Card>
          <Card className="border-emerald-400/20 bg-[#111116]"><CardContent className="p-4"><p className="text-xs text-slate-500">ประวัติส่งแล้ว</p><p className="mt-1 text-2xl font-semibold text-emerald-200">{sentCount}</p></CardContent></Card>
        </div>

        <Card className="border-white/10 bg-[#111116]
        "><CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขพัสดุ ชื่อ เบอร์ หรือเพจ" className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-slate-600" /></div>
          <div className="flex flex-wrap gap-2">
            {(["all", "sent"] as QueueStatus[]).map((item) => <Button key={item} size="sm" variant={status === item ? "default" : "outline"} onClick={() => setStatus(item)} className={status === item ? "bg-cyan-500 text-black hover:bg-cyan-400" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}>{item === "all" ? "ทั้งหมด" : "ส่งแล้ว"}</Button>)}
            <Button size="sm" variant="outline" onClick={() => query.refetch()} className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"><RefreshCw className={`mr-2 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button>
          </div>
        </CardContent></Card>

        {query.isError ? <Card className="border-red-400/20 bg-red-400/5"><CardContent className="p-4 text-sm text-red-200">ดึงคิวไม่สำเร็จ: {query.error.message}</CardContent></Card> : null}
        {query.isLoading ? <Card className="border-white/10 bg-[#111116]"><CardContent className="p-8 text-center text-sm text-slate-500">กำลังอ่านคิวจาก Supabase…</CardContent></Card> : null}
        {!query.isLoading && !query.isError && rows.length === 0 ? <Card className="border-white/10 bg-[#111116]"><CardContent className="p-10 text-center text-sm text-slate-500">ไม่พบรายการใน View นี้</CardContent></Card> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map((row, index) => <Card key={String(row.id ?? row.parcel_row_id ?? row.tracking_number ?? index)} className="border-white/10 bg-[#111116]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-mono text-lg font-semibold text-cyan-200">{value(row, "tracking_number")}</p><p className="mt-1 text-sm text-slate-300">{value(row, "consignee")}</p></div>
                <Badge className={statusTone(row.delivery_status)}>{value(row, "delivery_status")}</Badge>
              </div>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                {displayFields.slice(1).map(([key, label]) => <div key={key} className="min-w-0"><p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-200">{value(row, key)}</p></div>)}
              </div>
            </CardContent>
          </Card>)}
        </div>
      </div>
    </div>
  );
}
