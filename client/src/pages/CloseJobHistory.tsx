import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readCloseJobCases, saveCloseJobCaseFields, type CloseJobCase } from "@/lib/canonical";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, MessageCircle, RefreshCw, Save, Search, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type CaseFilter = "all" | "close" | "cancel" | "refusal";

function timeLabel(value: string | null | undefined) {
  if (!value) return "ไม่ทราบเวลา";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

function caseKind(value: string) {
  if (value === "ปิดงาน") return "close";
  if (value.startsWith("ยกเลิก")) return "cancel";
  if (value === "สั่งแล้วไม่รับ") return "refusal";
  return "other";
}

function caseTone(value: string) {
  const kind = caseKind(value);
  if (kind === "close") return "border-cyan-200/50 bg-cyan-300/15 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,.18)]";
  if (kind === "cancel") return "border-fuchsia-200/50 bg-fuchsia-300/15 text-fuchsia-50 shadow-[0_0_14px_rgba(217,70,239,.16)]";
  return "border-amber-200/50 bg-amber-300/15 text-amber-50 shadow-[0_0_14px_rgba(251,191,36,.16)]";
}

function CaseFields({ item, onSave, saving }: { item: CloseJobCase; onSave: (value: { caseId: string; branch: string; carrierEmployee: string; area: string }) => void; saving: boolean }) {
  const [branch, setBranch] = useState(item.branch ?? "");
  const [carrierEmployee, setCarrierEmployee] = useState(item.carrier_employee ?? "");
  const [area, setArea] = useState(item.area ?? "");
  useEffect(() => { setBranch(item.branch ?? ""); setCarrierEmployee(item.carrier_employee ?? ""); setArea(item.area ?? ""); }, [item.id, item.branch, item.carrier_employee, item.area]);
  return <form className="mt-3 grid gap-2 rounded-xl border border-cyan-200/20 bg-cyan-300/[.055] p-3 sm:grid-cols-3" onSubmit={event => { event.preventDefault(); onSave({ caseId: item.id, branch, carrierEmployee, area }); }}>
    <label className="grid gap-1 text-[10px] text-cyan-50/70">สาขา<Input value={branch} onChange={event => setBranch(event.target.value)} placeholder="ชื่อสาขา" className="h-8 border-cyan-200/25 bg-[#080f20]/70 text-xs text-white" /></label>
    <label className="grid gap-1 text-[10px] text-cyan-50/70">พนักงานขนส่ง<Input value={carrierEmployee} onChange={event => setCarrierEmployee(event.target.value)} placeholder="ชื่อพนักงาน/รหัส" className="h-8 border-cyan-200/25 bg-[#080f20]/70 text-xs text-white" /></label>
    <label className="grid gap-1 text-[10px] text-cyan-50/70">พื้นที่<Input value={area} onChange={event => setArea(event.target.value)} placeholder="เขต / อำเภอ / จังหวัด" className="h-8 border-cyan-200/25 bg-[#080f20]/70 text-xs text-white" /></label>
    <div className="sm:col-span-3 sm:flex sm:justify-end"><Button type="submit" size="sm" disabled={saving} className="h-8 bg-gradient-to-r from-cyan-300 to-blue-300 font-semibold text-[#07101e] shadow-[0_0_16px_rgba(34,211,238,.26)] hover:brightness-110"><Save className="mr-1.5 h-3.5 w-3.5" />{saving ? "กำลังบันทึก…" : "บันทึกข้อมูลเคส"}</Button></div>
  </form>;
}

export default function CloseJobHistory() {
  const [search, setSearch] = useState("");
  const [caseFilter, setCaseFilter] = useState<CaseFilter>("all");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const casesQuery = useQuery({ queryKey: ["bb-close-job-history"], queryFn: () => readCloseJobCases(), refetchInterval: 60_000 });
  const saveFields = useMutation({ mutationFn: saveCloseJobCaseFields, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bb-close-job-history"] }) });
  const cases = casesQuery.data ?? [];
  const counts = useMemo(() => ({
    close: cases.filter(item => caseKind(item.case_type) === "close").length,
    cancel: cases.filter(item => caseKind(item.case_type) === "cancel").length,
    refusal: cases.filter(item => caseKind(item.case_type) === "refusal").length,
  }), [cases]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return cases.filter(item => {
      if (caseFilter !== "all" && caseKind(item.case_type) !== caseFilter) return false;
      if (!needle) return true;
      return [item.customer_name, item.page_name, item.area, item.branch, item.carrier_employee, item.tracking_number, item.order_number, item.message_text].some(value => String(value ?? "").toLocaleLowerCase().includes(needle));
    });
  }, [cases, search, caseFilter]);
  const filters: Array<{ id: CaseFilter; label: string; count: number; active: string }> = [
    { id: "all", label: "ทั้งหมด", count: cases.length, active: "border-white/70 bg-white/15 text-white" },
    { id: "close", label: "ปิดงาน", count: counts.close, active: "border-cyan-200/70 bg-cyan-300/20 text-cyan-50" },
    { id: "cancel", label: "ยกเลิก / ไม่เอาแล้ว", count: counts.cancel, active: "border-fuchsia-200/70 bg-fuchsia-300/20 text-fuchsia-50" },
    { id: "refusal", label: "สั่งแล้วไม่รับ", count: counts.refusal, active: "border-amber-200/70 bg-amber-300/20 text-amber-50" },
  ];
  const openChat = (pageId: string, threadId: string) => {
    if (!pageId || !threadId) return;
    setLocation(`/chats?page_id=${encodeURIComponent(pageId)}&thread_id=${encodeURIComponent(threadId)}`);
  };

  return <div className="relative mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-4 text-white">
    <div aria-hidden="true" className="pointer-events-none absolute -inset-x-12 -top-12 h-72 bg-[radial-gradient(ellipse_at_15%_15%,rgba(34,211,238,.20),transparent_44%),radial-gradient(ellipse_at_85%_22%,rgba(217,70,239,.18),transparent_42%),radial-gradient(ellipse_at_50%_100%,rgba(59,130,246,.12),transparent_50%)] blur-2xl" />
    <header className="relative shrink-0 overflow-hidden rounded-3xl border border-cyan-200/40 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,.20),transparent_35%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,.17),transparent_45%),linear-gradient(125deg,rgba(8,17,42,.98),rgba(20,10,38,.97))] p-5 shadow-[0_0_32px_rgba(34,211,238,.15),0_0_64px_rgba(217,70,239,.10)] sm:p-6">
      <div className="absolute right-8 top-8 h-1.5 w-1.5 animate-pulse rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,.7)]" />
      <div className="absolute right-20 top-16 h-1 w-1 rounded-full bg-fuchsia-100 shadow-[0_0_10px_3px_rgba(217,70,239,.7)]" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100"><Sparkles className="h-4 w-4 text-fuchsia-200" /> BB STORE · ORBITAL CASE ARCHIVE</p>
          <h1 className="mt-2 bg-gradient-to-r from-cyan-100 via-white to-fuchsia-200 bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl">ประวัติปิดงาน · ยกเลิก · ลูกค้าไม่รับ</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-cyan-50/75">เจอคำว่า “ปิดงาน”, “ยกเลิก”, “ไม่เอาแล้ว” หรือ “สั่งแล้วไม่รับ” ในแชทเมื่อไร เก็บไว้ให้เปิดดูย้อนหลังได้</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void casesQuery.refetch()} className="border-cyan-100/40 bg-cyan-200/10 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,.16)] hover:bg-cyan-200/20">
          <RefreshCw className={`mr-2 h-4 w-4 ${casesQuery.isFetching ? "animate-spin" : ""}`} />รีเฟรช
        </Button>
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/20 bg-white/[.08] px-3 py-2"><p className="text-[10px] text-white/65">ทั้งหมด</p><p className="mt-0.5 text-xl font-black text-white">{cases.length}</p></div>
        <div className="rounded-xl border border-cyan-200/30 bg-cyan-300/[.10] px-3 py-2"><p className="text-[10px] text-cyan-50/80">ปิดงาน</p><p className="mt-0.5 text-xl font-black text-cyan-100">{counts.close}</p></div>
        <div className="rounded-xl border border-fuchsia-200/30 bg-fuchsia-300/[.10] px-3 py-2"><p className="text-[10px] text-fuchsia-50/80">ยกเลิก / ไม่เอาแล้ว</p><p className="mt-0.5 text-xl font-black text-fuchsia-100">{counts.cancel}</p></div>
        <div className="rounded-xl border border-amber-200/30 bg-amber-300/[.10] px-3 py-2"><p className="text-[10px] text-amber-50/80">สั่งแล้วไม่รับ</p><p className="mt-0.5 text-xl font-black text-amber-100">{counts.refusal}</p></div>
      </div>
      <p className="relative mt-3 text-[10px] text-white/55">อัปเดตอัตโนมัติทุก 1 นาที · แสดงรายการให้ตรวจสอบ ไม่ฟันธงว่าใครผิด</p>
    </header>

    <section className="relative shrink-0 rounded-2xl border border-white/15 bg-[#0a1021]/90 p-3 shadow-[0_0_24px_rgba(34,211,238,.07)]">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-100/60" />
        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้า เพจ สาขา พนักงาน หรือเลขพัสดุ…" className="border-cyan-100/20 bg-black/35 pl-10 text-white placeholder:text-cyan-50/35 focus-visible:ring-cyan-300/30" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map(filter => <button key={filter.id} type="button" onClick={() => setCaseFilter(filter.id)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${caseFilter === filter.id ? filter.active : "border-white/10 bg-white/[.03] text-white/65 hover:border-white/30 hover:text-white"}`}>
          {filter.label}<span className="ml-2 rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">{filter.count}</span>
        </button>)}
        <span className="ml-auto self-center text-[10px] text-white/50">แสดง {filtered.length} รายการ</span>
      </div>
    </section>

    <section className="relative min-h-0 flex-1 overflow-y-auto rounded-2xl border border-cyan-200/20 bg-[linear-gradient(145deg,rgba(8,15,31,.96),rgba(16,9,28,.95))] p-3 shadow-[inset_0_0_24px_rgba(59,130,246,.04)]">
      {casesQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-cyan-50/70"><RefreshCw className="h-4 w-4 animate-spin" />กำลังค้นประวัติ…</div> : null}
      {casesQuery.isError ? <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200/35 bg-amber-300/[.10] p-5 text-sm leading-6 text-amber-50 shadow-[0_0_24px_rgba(251,191,36,.08)]"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />ยังเปิดคลังประวัติไม่ได้</p><p className="mt-2 text-xs text-amber-50/75">ใส่ Tracking project ใน Secret Gallery แล้วติดตั้ง SQL นี้ในโปรเจกต์ Tracking ก่อนรีเฟรช</p><p className="mt-2 break-all rounded-lg bg-black/25 p-2 font-mono text-[10px]">sql/bb-close-job-history.sql</p><p className="mt-2 text-[10px] text-amber-50/55">{casesQuery.error.message}</p></div> : null}
      {!casesQuery.isLoading && !casesQuery.isError && filtered.length === 0 ? <div className="p-12 text-center text-sm text-cyan-50/60"><AlertTriangle className="mx-auto mb-3 h-7 w-7 text-fuchsia-200/70" />{cases.length ? "ไม่พบรายการที่ตรงตัวกรอง" : "ยังไม่พบข้อความที่เข้าหมวดที่ตั้งไว้"}</div> : null}
      <div className="space-y-3">
        {filtered.map(item => <article key={item.id} className="group rounded-2xl border border-cyan-100/20 bg-[radial-gradient(ellipse_at_top_right,rgba(217,70,239,.08),transparent_42%),linear-gradient(130deg,rgba(34,211,238,.055),rgba(15,23,42,.62),rgba(147,51,234,.045))] p-4 shadow-[0_0_18px_rgba(34,211,238,.055)] transition hover:border-cyan-100/40 hover:shadow-[0_0_24px_rgba(34,211,238,.12)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-bold text-white">{item.customer_name || "ไม่ระบุชื่อลูกค้า"}</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${caseTone(item.case_type || "")}`}>{item.case_type || "ควรตรวจสอบ"}</span>
                <span className="text-[10px] text-cyan-50/55">{item.speaker_type === "page" ? "ข้อความจากเพจ/ร้าน" : "ข้อความจากลูกค้า"}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-cyan-50/65">{item.page_name || "ไม่ระบุเพจ"} · พื้นที่: {item.area || "ยังไม่ระบุ"}</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/65"><Clock3 className="h-3.5 w-3.5 text-cyan-200" />{timeLabel(item.occurred_at)}</div>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-cyan-100/15 bg-[#050914]/65 p-3 text-sm leading-6 text-white/90">{item.message_text}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-[10px]">
              {item.tracking_number ? <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/30 bg-emerald-300/[.10] px-2 py-1 font-mono text-emerald-100"><Truck className="h-3 w-3" />{item.tracking_number}</span> : null}
              {item.order_number ? <span className="rounded-lg border border-cyan-100/20 bg-cyan-300/[.07] px-2 py-1 text-cyan-50/85">ออเดอร์ {item.order_number}</span> : null}
              {!item.tracking_number && !item.order_number ? <span className="text-white/45">ยังไม่มีเลขพัสดุ/ออเดอร์ในแถวนั้น</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => openChat(item.page_id, item.conversation_key)} disabled={!item.page_id || !item.conversation_key} className="h-8 border-cyan-100/25 bg-cyan-300/[.06] text-cyan-50 hover:bg-cyan-300/15">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />เปิดแชทต้นทาง
            </Button>
          </div>
          <CaseFields item={item} onSave={value => saveFields.mutate(value)} saving={saveFields.isPending} />
          {saveFields.isError ? <p className="mt-2 text-[10px] text-rose-200">บันทึกไม่สำเร็จ: {saveFields.error.message}</p> : null}
        </article>)}
      </div>
    </section>
    <p className="relative shrink-0 px-1 text-[10px] leading-4 text-white/45">พื้นที่จากข้อมูลที่มีในแถวแชท · ถ้าไม่มีเขต/อำเภอ/จังหวัดจะแสดงว่ายังไม่ระบุ · เป็นรายการให้ตรวจสอบ ไม่ใช่ข้อสรุปว่าใครทุจริต</p>
  </div>;
}
