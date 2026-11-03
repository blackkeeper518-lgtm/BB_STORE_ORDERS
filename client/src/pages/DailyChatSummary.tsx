import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getActiveCamp, readDailyParcels } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Download, PackageSearch, RefreshCw, Search, ShieldAlert, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
function threeDayStartBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000));
}
function pickupDateKey(value: unknown) {
  const raw = String(value ?? "").trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const thai = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (thai) {
    let year = Number(thai[3]);
    if (year < 100) year += 1957;
    else if (year > 2400) year -= 543;
    return `${year}-${thai[2].padStart(2, "0")}-${thai[1].padStart(2, "0")}`;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
}
function dateLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? raw
    : new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }).format(parsed);
}
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`; }
function codNumber(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DailyChatSummary() {
  const [date, setDate] = useState(todayBangkok);
  const [search, setSearch] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState("");
  const camp = getActiveCamp();
  const query = useQuery({
    queryKey: ["daily-flash-parcels", camp, date],
    queryFn: () => readDailyParcels(date, ""),
    refetchInterval: 60_000,
  });
  const authQuery = trpc.auth.me.useQuery();
  const purgeMutation = trpc.parcels.purgeExpired.useMutation({
    onSuccess: result => {
      setConfirmOpen(false);
      setPurgeMessage(`ลบรายการเกิน 3 วันแล้ว ${result.deleted.toLocaleString("th-TH")} แถว`);
      void query.refetch();
    },
  });
  const parcels = useMemo(() => (query.data?.parcels ?? [])
    .filter((parcel: any) => pickupDateKey(parcel.pickup_date) === date)
    .filter((parcel: any) => JSON.stringify(parcel).toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a: any, b: any) => String(b.pickup_date ?? "").localeCompare(String(a.pickup_date ?? ""))),
  [query.data?.parcels, date, search]);
  const stats = useMemo(() => ({
    total: parcels.length,
    withTracking: parcels.filter((row: any) => String(row.tracking_number ?? "").trim()).length,
    pending: parcels.filter((row: any) => !String(row.delivery_status ?? "").trim() || /pending|รอ/i.test(String(row.delivery_status))).length,
    cod: parcels.reduce((sum: number, row: any) => sum + codNumber(row.cod_amount), 0),
  }), [parcels]);
  const exportCsv = () => {
    if (!parcels.length) return;
    const headers = ["pickup_date", "tracking_number", "consignee", "phone_number", "address", "cod_amount", "order_number", "order_phone", "delivery_status", "sent_at"];
    const csv = "\uFEFF" + [headers, ...parcels.map((row: any) => headers.map(key => row[key] ?? ""))]
      .map(row => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${camp.toLowerCase()}-flash-parcels-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="min-h-[calc(100vh-2rem)] space-y-5 p-2 text-white sm:p-4 lg:p-6">
    <header className="rounded-3xl border border-orange-500/20 bg-[#100c19] p-6 shadow-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300"><CalendarDays className="h-4 w-4" /> FLASH PARCELS · {camp}</div>
          <h1 className="mt-3 text-3xl font-semibold">สรุปออเดอร์รายวัน · Flash</h1>
          <p className="mt-2 text-sm text-orange-100/55">ข้อมูลจากตาราง parcels · คอลัมน์จริงจากไฟล์ Flash · Tracking &amp; Messenger</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {authQuery.data?.role === "admin" ? <AlertDialog open={confirmOpen} onOpenChange={open => { if (!purgeMutation.isPending) setConfirmOpen(open); }}>
            <AlertDialogTrigger asChild><Button variant="outline" className="border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"><Trash2 className="mr-2 h-4 w-4" />ลบเกิน 3 วัน</Button></AlertDialogTrigger>
            <AlertDialogContent className="border-red-400/25 bg-[#100c19] text-white">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-100">ยืนยันลบพัสดุเกิน 3 วัน?</AlertDialogTitle>
                <AlertDialogDescription className="text-orange-100/70">จะลบแถวเก่าใน parcels ถาวร รวมเลขพัสดุและที่อยู่ และกู้คืนไม่ได้ แถวที่วันที่ว่างหรืออ่านไม่ออกจะไม่ถูกลบ</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={purgeMutation.isPending} className="border-white/15 bg-white/5 text-white">ยกเลิก</AlertDialogCancel>
                <Button variant="destructive" disabled={purgeMutation.isPending} onClick={() => purgeMutation.mutate({ confirmation: "DELETE_PARCELS_OLDER_THAN_3_DAYS" })}>{purgeMutation.isPending ? "กำลังลบ…" : "ยืนยันลบถาวร"}</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog> : null}
          <Input type="date" min={threeDayStartBangkok()} max={todayBangkok()} value={date} onChange={event => setDate(event.target.value)} className="w-40 border-orange-400/20 bg-black/20 text-white" />
          <Button variant="outline" onClick={exportCsv} disabled={!parcels.length} className="border-emerald-400/20 bg-emerald-400/5 text-emerald-200"><Download className="mr-2 h-4 w-4" />Export รายวัน</Button>
          <Button variant="outline" onClick={() => query.refetch()} className="border-orange-400/20 bg-orange-400/5 text-orange-100"><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button>
        </div>
      </div>
    </header>

    {purgeMessage ? <div role="status" className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">{purgeMessage}</div> : null}
    {purgeMutation.error ? <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-100">ลบไม่สำเร็จ: {purgeMutation.error.message}</div> : null}
    {query.isError ? <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">โหลดตาราง parcels ไม่สำเร็จ: {String(query.error)}</div> : null}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="พัสดุวันที่เลือก" value={stats.total.toLocaleString("th-TH")} icon={<PackageSearch />} />
      <Stat label="มีเลขพัสดุ" value={stats.withTracking.toLocaleString("th-TH")} tone="text-emerald-300" icon={<Truck />} />
      <Stat label="รออัปเดตสถานะ" value={stats.pending.toLocaleString("th-TH")} tone="text-amber-300" icon={<RefreshCw />} />
      <Stat label="COD รวม" value={`${stats.cod.toLocaleString("th-TH")} ฿`} tone="text-orange-300" icon={<ShieldAlert />} />
    </div>

    <Card className="rounded-3xl border-orange-500/15 bg-[#100d15]">
      <CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>รายการ Flash · {date}</CardTitle><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-100/30" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาเลขพัสดุ / ชื่อ / เบอร์ / ออเดอร์" className="border-orange-500/15 bg-black/20 pl-9 text-white" /></div></div></CardHeader>
      <CardContent>
        <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="border-b border-orange-500/10 text-orange-100/40"><tr><th className="p-3">วันที่รับ</th><th className="p-3">เลขพัสดุ</th><th className="p-3">ผู้รับ</th><th className="p-3">เบอร์โทร</th><th className="p-3">ที่อยู่</th><th className="p-3">COD</th><th className="p-3">เลขออเดอร์</th><th className="p-3">สถานะ</th></tr></thead>
          <tbody>{parcels.map((row: any) => <tr key={String(row.id ?? row.tracking_number)} className="border-b border-orange-500/[0.06] align-top">
            <td className="whitespace-nowrap p-3 text-orange-100/65">{dateLabel(row.pickup_date)}</td>
            <td className="p-3 font-mono font-semibold text-amber-200">{row.tracking_number || "—"}</td>
            <td className="p-3 font-medium text-white">{row.consignee || "—"}</td>
            <td className="p-3 text-orange-100/65">{row.phone_number || "—"}</td>
            <td className="max-w-sm whitespace-pre-wrap p-3 text-orange-100/65">{row.address || "—"}</td>
            <td className="whitespace-nowrap p-3 text-orange-200">{row.cod_amount ? `${codNumber(row.cod_amount).toLocaleString("th-TH")} ฿` : "—"}</td>
            <td className="p-3 font-mono text-orange-100/65">{row.order_number || "—"}</td>
            <td className="p-3"><Badge className={/sent|delivered|สำเร็จ|ส่งแล้ว/i.test(String(row.delivery_status ?? "")) ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}>{row.delivery_status || "รอสถานะ"}</Badge></td>
          </tr>)}</tbody>
        </table></div>
        {query.isLoading ? <p className="p-8 text-center text-sm text-orange-100/40">กำลังโหลดรายการ Flash…</p> : null}
        {!query.isLoading && !query.isError && !parcels.length ? <p className="p-8 text-center text-sm text-orange-100/40">ไม่พบพัสดุของวันที่เลือก</p> : null}
      </CardContent>
    </Card>
  </div>;
}

function Stat({ label, value, tone = "text-white", icon }: { label: string; value: number | string; tone?: string; icon: React.ReactNode }) {
  return <Card className="rounded-2xl border-orange-500/15 bg-[#100d15]"><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-xl bg-orange-500/10 p-2.5 ${tone}`}>{icon}</div><div><p className={`text-2xl font-semibold ${tone}`}>{value}</p><p className="text-xs text-orange-100/45">{label}</p></div></CardContent></Card>;
}
