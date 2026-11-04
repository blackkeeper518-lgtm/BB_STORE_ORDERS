import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readCanonicalOrders, updateBbOrderByKey } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Database, FilePenLine, RefreshCw, Save, Search, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type OrderRow = Record<string, any> & { upsert_key: string; order_time_display: string };
type FormState = { customer_name: string; phone: string; full_address: string; final_display_for_packer: string; cod_amount: string; telegram_message: string };

function text(value: unknown) { return value == null ? "" : String(value); }
function formFrom(row: OrderRow | null): FormState {
  return {
    customer_name: text(row?.customer_name),
    phone: text(row?.phone || row?.extracted_phone),
    full_address: text(row?.final_address_for_bill || row?.full_address || row?.address_display_packer),
    final_display_for_packer: text(row?.final_display_for_packer || row?.telegram_product_display || row?.sku),
    cod_amount: text(row?.cod_amount),
    telegram_message: text(row?.telegram_message),
  };
}

export default function OrderEditor() {
  const initialKey = new URLSearchParams(window.location.search).get("key") || new URLSearchParams(window.location.search).get("search") || "";
  const [search, setSearch] = useState(initialKey);
  const [selectedKey, setSelectedKey] = useState(initialKey);
  const [form, setForm] = useState<FormState>(formFrom(null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["order-editor-orders", search], queryFn: () => readCanonicalOrders(search), refetchOnWindowFocus: false });
  const orders = (query.data?.orders ?? []) as OrderRow[];
  const selected = orders.find((row) => row.upsert_key === selectedKey) ?? orders[0] ?? null;

  useEffect(() => { if (selected && selected.upsert_key !== selectedKey) setSelectedKey(selected.upsert_key); }, [selected, selectedKey]);
  useEffect(() => { setForm(formFrom(selected)); setMessage(""); }, [selected?.upsert_key]);
  const dirtyLabel = useMemo(() => selected ? `กำลังแก้ไข ${selected.order_number || selected.upsert_key}` : "ยังไม่ได้เลือกออเดอร์", [selected]);
  const setField = (field: keyof FormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  async function save() {
    if (!selected) return;
    setSaving(true); setMessage("");
    try {
      await updateBbOrderByKey(selected.upsert_key, {
        customer_name: form.customer_name,
        phone: form.phone,
        extracted_phone: form.phone,
        full_address: form.full_address,
        final_address_for_bill: form.full_address,
        address_display_packer: form.full_address,
        final_display_for_packer: form.final_display_for_packer,
        cod_amount: form.cod_amount === "" ? null : Number(form.cod_amount.replace(/,/g, "")),
        telegram_message: form.telegram_message,
        updated_at: new Date().toISOString(),
      });
      setMessage("บันทึกการแก้ไขแล้ว · ข้อมูลต้นฉบับในแชทยังคงอยู่");
      await query.refetch();
    } catch (error) {
      setMessage(`บันทึกไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    } finally { setSaving(false); }
  }

  return <div className="cosmic-stage min-h-full space-y-5 p-3 text-white sm:p-5 lg:p-7">
    <header className="blackbox-hero cyber-glow relative overflow-hidden rounded-3xl border border-emerald-300/20 p-6 sm:p-8"><div className="hero-scanline" /><div className="hero-orbit" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5"><div><p className="orbit-kicker flex items-center gap-2 text-emerald-300"><FilePenLine className="h-4 w-4" /> ORDER EDITOR · HERMES ARCHIVE</p><h1 className="cyber-title mt-3 text-3xl font-semibold sm:text-4xl">ห้องแก้ไขออเดอร์</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300/70">แก้ข้อมูลที่ใช้จัดและส่ง โดยแยกจากข้อความแชทต้นฉบับ และบันทึกลงออเดอร์ด้วย upsert_key เดิม</p></div><div className="live-chip"><ShieldCheck className="h-3.5 w-3.5" /> MANUAL OVERRIDE</div></div>
    </header>
    <div className="grid gap-5 xl:grid-cols-[minmax(280px,.7fr)_minmax(0,1.3fr)]">
      <section className="rounded-3xl border border-violet-300/20 bg-[#10091b]/90 shadow-[0_0_30px_rgba(151,75,255,.08)]"><div className="border-b border-violet-300/15 p-5"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-300/60" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา Order / ลูกค้า / เบอร์" className="border-cyan-300/20 bg-black/25 pl-9 text-white placeholder:text-slate-500" /></div><p className="mt-3 text-xs text-violet-100/45">พบ {orders.length.toLocaleString("th-TH")} รายการ · เลือกรายการเพื่อแก้ไข</p></div><div className="max-h-[65vh] space-y-2 overflow-auto p-3">{query.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังอ่านออเดอร์…</p> : orders.map((row) => <button key={row.upsert_key} type="button" onClick={() => setSelectedKey(row.upsert_key)} className={`w-full rounded-2xl border p-4 text-left ${selected?.upsert_key === row.upsert_key ? "border-emerald-300/60 bg-emerald-400/10 shadow-[inset_3px_0_#55f2bd]" : "border-white/5 bg-black/15 hover:border-cyan-300/30"}`}><div className="flex justify-between gap-2"><span className="font-mono text-sm text-cyan-200">{row.order_number || row.upsert_key}</span><span className="text-[10px] text-violet-100/45">{row.order_time_display}</span></div><p className="mt-2 text-sm text-white">{row.customer_name || "ไม่ระบุชื่อ"}</p><p className="mt-1 truncate font-mono text-[10px] text-slate-500">{row.upsert_key}</p></button>)}{!query.isLoading && !orders.length ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบออเดอร์</p> : null}</div></section>
      <section className="rounded-3xl border border-emerald-300/20 bg-[#0d1518]/90 shadow-[0_0_30px_rgba(62,227,181,.07)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-300/15 p-5"><div><p className="text-[10px] uppercase tracking-[.2em] text-emerald-300/70">EDIT TARGET</p><h2 className="mt-1 text-lg font-semibold text-white">{dirtyLabel}</h2></div><Button variant="outline" onClick={() => void query.refetch()} className="border-cyan-300/25 bg-cyan-400/5 text-cyan-100"><RefreshCw className="mr-2 h-4 w-4" />รีเฟรช</Button></div><div className="space-y-4 p-5">{selected ? <><div className="grid gap-4 sm:grid-cols-2"><Field label="ชื่อลูกค้า" value={form.customer_name} onChange={(value) => setField("customer_name", value)} /><Field label="เบอร์โทร" value={form.phone} onChange={(value) => setField("phone", value)} /><Field label="COD" value={form.cod_amount} onChange={(value) => setField("cod_amount", value)} /><Field label="สินค้า / SKU สำหรับจัด" value={form.final_display_for_packer} onChange={(value) => setField("final_display_for_packer", value)} /></div><TextField label="ที่อยู่สำหรับบิล / จัดส่ง" value={form.full_address} onChange={(value) => setField("full_address", value)} /><TextField label="telegram_message · ข้อความส่ง" value={form.telegram_message} onChange={(value) => setField("telegram_message", value)} /><div className="flex flex-wrap items-center gap-3"><Button onClick={() => void save()} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-black hover:from-emerald-400 hover:to-cyan-500"><Save className="mr-2 h-4 w-4" />{saving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}</Button><Link href={`/orders?search=${encodeURIComponent(selected.upsert_key)}`}><Button variant="outline" className="border-violet-300/25 bg-violet-400/5 text-violet-100"><ArrowLeft className="mr-2 h-4 w-4" />กลับ Order Control</Button></Link></div>{message ? <p className={`rounded-xl border p-3 text-sm ${message.startsWith("บันทึกไม่") ? "border-pink-300/30 bg-pink-400/10 text-pink-100" : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"}`}>{message}</p> : null}<p className="flex items-center gap-2 text-xs text-slate-500"><Database className="h-3.5 w-3.5" />แก้ด้วย upsert_key: {selected.upsert_key} · ต้นฉบับแชทไม่ถูกลบ</p></> : <p className="p-10 text-center text-sm text-slate-500">เลือกออเดอร์จากด้านซ้ายก่อน</p>}</div></section>
    </div>
  </div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs text-emerald-100/60">{label}<Input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 border-emerald-300/15 bg-black/25 text-white" /></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-xs text-emerald-100/60">{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-28 w-full resize-y rounded-xl border border-emerald-300/15 bg-black/25 p-3 text-sm leading-6 text-white outline-none focus:border-cyan-300/50" /></label>; }
