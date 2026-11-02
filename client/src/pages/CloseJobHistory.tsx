import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readCloseJobCases, saveCloseJobCaseFields, type CloseJobCase } from "@/lib/canonical";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, MessageCircle, RefreshCw, Save, Search, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

function timeLabel(value: string | null | undefined) {
  if (!value) return "ไม่ทราบเวลา";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(date);
}

function CaseFields({ item, onSave, saving }: { item: CloseJobCase; onSave: (value: { caseId: string; branch: string; carrierEmployee: string; area: string }) => void; saving: boolean }) {
  const [branch, setBranch] = useState(item.branch ?? "");
  const [carrierEmployee, setCarrierEmployee] = useState(item.carrier_employee ?? "");
  const [area, setArea] = useState(item.area ?? "");
  useEffect(() => { setBranch(item.branch ?? ""); setCarrierEmployee(item.carrier_employee ?? ""); setArea(item.area ?? ""); }, [item.id, item.branch, item.carrier_employee, item.area]);
  return <form className="mt-3 grid gap-2 rounded-xl border border-cyan-300/10 bg-cyan-300/[.025] p-3 sm:grid-cols-3" onSubmit={event => { event.preventDefault(); onSave({ caseId: item.id, branch, carrierEmployee, area }); }}>
    <label className="grid gap-1 text-[10px] text-cyan-100/55">สาขา<Input value={branch} onChange={event => setBranch(event.target.value)} placeholder="ชื่อสาขา" className="h-8 border-cyan-300/15 bg-black/20 text-xs text-white" /></label>
    <label className="grid gap-1 text-[10px] text-cyan-100/55">พนักงานขนส่ง<Input value={carrierEmployee} onChange={event => setCarrierEmployee(event.target.value)} placeholder="ชื่อพนักงาน/รหัส" className="h-8 border-cyan-300/15 bg-black/20 text-xs text-white" /></label>
    <label className="grid gap-1 text-[10px] text-cyan-100/55">พื้นที่<Input value={area} onChange={event => setArea(event.target.value)} placeholder="เขต / อำเภอ / จังหวัด" className="h-8 border-cyan-300/15 bg-black/20 text-xs text-white" /></label>
    <div className="sm:col-span-3 sm:flex sm:justify-end"><Button type="submit" size="sm" disabled={saving} className="h-8 bg-cyan-500 text-[#07131a] hover:bg-cyan-400"><Save className="mr-1.5 h-3.5 w-3.5" />{saving ? "กำลังบันทึก…" : "บันทึกข้อมูลเคส"}</Button></div>
  </form>;
}

export default function CloseJobHistory() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const casesQuery = useQuery({ queryKey: ["bb-close-job-history"], queryFn: () => readCloseJobCases(), refetchInterval: 60_000 });
  const saveFields = useMutation({ mutationFn: saveCloseJobCaseFields, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bb-close-job-history"] }) });
  const cases = casesQuery.data ?? [];
  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return cases;
    return cases.filter(item => [item.customer_name, item.page_name, item.area, item.branch, item.carrier_employee, item.tracking_number, item.order_number, item.message_text].some(value => String(value ?? "").toLocaleLowerCase().includes(needle)));
  }, [cases, search]);

  const openChat = (pageId: string, threadId: string) => {
    if (!pageId || !threadId) return;
    setLocation(`/chats?page_id=${encodeURIComponent(pageId)}&thread_id=${encodeURIComponent(threadId)}`);
  };

  return <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col gap-4 text-white">
    <header className="shrink-0 rounded-2xl border border-fuchsia-300/30 bg-[#100c19] p-5 shadow-[0_0_22px_rgba(217,70,239,.12)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">BB STORE · CASE HISTORY</p>
          <h1 className="mt-1 text-xl font-semibold">ประวัติเคสแชทและขนส่ง</h1>
          <p className="mt-1 text-xs text-fuchsia-100/55">จับ “ปิดงาน”, “ยกเลิก”, “ไม่เอาแล้ว” และ “สั่งแล้วไม่รับ” จากแชททั้งสองฝั่ง</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void casesQuery.refetch()} className="border-cyan-300/25 bg-cyan-300/5 text-cyan-100 hover:bg-cyan-300/10">
          <RefreshCw className={`mr-2 h-4 w-4 ${casesQuery.isFetching ? "animate-spin" : ""}`} />รีเฟรช
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-1.5 text-fuchsia-100">ทั้งหมด {cases.length} รายการ</span>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-amber-100">แสดง {filtered.length} รายการ</span>
        <span className="text-[10px] text-white/35">ตรวจข้อความใหม่ทุก 1 นาที</span>
      </div>
    </header>

    <div className="relative shrink-0">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-fuchsia-100/35" />
      <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้า สาขา พนักงาน หรือเลขพัสดุ…" className="border-fuchsia-300/15 bg-[#100d15] pl-10 text-white placeholder:text-fuchsia-100/35" />
    </div>

    <section className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-fuchsia-300/10 bg-[#100d15]/90 p-3">
      {casesQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-fuchsia-100/55"><RefreshCw className="h-4 w-4 animate-spin" />กำลังค้นประวัติ…</div> : null}
      {casesQuery.isError ? <div className="mx-auto max-w-2xl rounded-2xl border border-amber-300/25 bg-amber-300/[.06] p-5 text-sm leading-6 text-amber-100"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />ยังเปิดคลังประวัติไม่ได้</p><p className="mt-2 text-xs text-amber-100/70">ต้องติดตั้ง view และตารางบันทึกช่องเคสใน Supabase ก่อน แล้วค่อยรีเฟรชหน้านี้</p><p className="mt-2 break-all rounded-lg bg-black/20 p-2 font-mono text-[10px]">sql/bb-close-job-history.sql</p><p className="mt-2 text-[10px] text-amber-100/45">{casesQuery.error.message}</p></div> : null}
      {!casesQuery.isLoading && !casesQuery.isError && filtered.length === 0 ? <div className="p-12 text-center text-sm text-fuchsia-100/50"><AlertTriangle className="mx-auto mb-3 h-7 w-7 text-fuchsia-300/45" />{cases.length ? "ไม่พบรายการที่ตรงคำค้น" : "ยังไม่พบข้อความที่เข้าหมวดที่ตั้งไว้"}</div> : null}
      <div className="space-y-3">
        {filtered.map(item => <article key={item.id} className="rounded-2xl border border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-300/[.05] to-cyan-300/[.025] p-4 transition hover:border-fuchsia-300/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-sm font-semibold text-white">{item.customer_name || "ไม่ระบุชื่อลูกค้า"}</h2>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] text-amber-100">{item.case_type || "ควรตรวจสอบ"}</span>
                <span className="text-[10px] text-fuchsia-100/50">{item.speaker_type === "page" ? "ข้อความจากเพจ/ร้าน" : "ข้อความจากลูกค้า"}</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-cyan-100/55">{item.page_name || "ไม่ระบุเพจ"} · พื้นที่: {item.area || "ยังไม่ระบุ"}</p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-1.5 text-[10px] text-white/45"><Clock3 className="h-3.5 w-3.5" />{timeLabel(item.occurred_at)}</div>
          </div>
          <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-white/[.07] bg-black/20 p-3 text-sm leading-6 text-fuchsia-50/85">{item.message_text}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-[10px]">
              {item.tracking_number ? <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-300/20 bg-emerald-300/[.06] px-2 py-1 font-mono text-emerald-100"><Truck className="h-3 w-3" />{item.tracking_number}</span> : null}
              {item.order_number ? <span className="rounded-lg border border-cyan-300/15 bg-cyan-300/[.05] px-2 py-1 text-cyan-100/75">ออเดอร์ {item.order_number}</span> : null}
              {!item.tracking_number && !item.order_number ? <span className="text-white/35">ยังไม่มีเลขพัสดุ/ออเดอร์ในแถวนั้น</span> : null}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => openChat(item.page_id, item.conversation_key)} disabled={!item.page_id || !item.conversation_key} className="h-8 border-cyan-300/20 text-cyan-100 hover:bg-cyan-300/10">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />เปิดแชทต้นทาง
            </Button>
          </div>
          <CaseFields item={item} onSave={value => saveFields.mutate(value)} saving={saveFields.isPending} />
          {saveFields.isError ? <p className="mt-2 text-[10px] text-rose-200">บันทึกไม่สำเร็จ: {saveFields.error.message}</p> : null}
        </article>)}
      </div>
    </section>
    <p className="shrink-0 px-1 text-[10px] leading-4 text-white/35">แสดงพื้นที่จากข้อมูลที่มีในแถวแชท หากไม่มีเขต/อำเภอ/จังหวัดจะแสดงว่ายังไม่ระบุ · เป็นรายการให้ตรวจสอบ ไม่ใช่ข้อสรุปว่าใครทุจริต</p>
  </div>;
}
