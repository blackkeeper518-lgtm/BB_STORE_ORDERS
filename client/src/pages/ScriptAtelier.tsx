import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, FilePlus2, ImagePlus, Loader2, PanelRight, Plus, Save, Search, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase, readStockProducts, type StockProduct } from "@/lib/canonical";

type ScriptBlock = { type: "image"; url: string; path?: string; caption?: string };
type ScriptCard = {
  id: string;
  sku: string;
  title: string;
  subtitle: string;
  script_text: string;
  ai_context: string;
  ai_instruction: string;
  blocks_json: ScriptBlock[];
  status: string;
  version: number;
  updated_at: string;
  created_at: string;
};

const emptyDraft = (sku = ""): ScriptCard => ({ id: "", sku, title: "", subtitle: "", script_text: "", ai_context: "", ai_instruction: "", blocks_json: [], status: "DRAFT", version: 1, updated_at: "", created_at: "" });
function errorText(error: unknown) { return error instanceof Error ? error.message : String((error as any)?.message ?? error ?? "เกิดข้อผิดพลาด"); }
function stockFor(card: ScriptCard, stock: StockProduct[]) { return stock.find(item => item.sku.toLowerCase() === card.sku.toLowerCase()); }
function copyText(text: string) { void navigator.clipboard?.writeText(text); }

export default function ScriptAtelier() {
  const [cards, setCards] = useState<ScriptCard[]>([]);
  const [stock, setStock] = useState<StockProduct[]>([]);
  const [selected, setSelected] = useState<ScriptCard | null>(null);
  const [draft, setDraft] = useState<ScriptCard>(emptyDraft());
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [skuQuery, setSkuQuery] = useState("");
  const [skuOpen, setSkuOpen] = useState(false);
  const [draggingImage, setDraggingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const api = getSupabase();

  const load = async () => {
    if (!api) { setError("ยังไม่ได้เชื่อม Supabase ของโปรเจกต์ส่งเลข ไปที่ /secret-gallery/connect ก่อน"); setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const [scriptResult, stockRows] = await Promise.all([
        api.from("sales_script_cards").select("*").order("updated_at", { ascending: false }),
        readStockProducts(),
      ]);
      if (scriptResult.error) throw scriptResult.error;
      setCards((scriptResult.data ?? []).map((row: any) => ({ ...row, blocks_json: Array.isArray(row.blocks_json) ? row.blocks_json : [] })));
      setStock(stockRows);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const skuMatches = useMemo(() => {
    const query = skuQuery.trim().toLowerCase();
    if (!query) return [];
    return stock.filter(item => `${item.sku} ${item.thName} ${item.label}`.toLowerCase().includes(query)).slice(0, 10);
  }, [skuQuery, stock]);

  const visible = useMemo(() => cards.filter(card => {
    const product = stockFor(card, stock);
    const haystack = `${card.sku} ${card.title} ${card.subtitle} ${card.script_text} ${product?.thName ?? ""}`.toLowerCase();
    return (!search.trim() || haystack.includes(search.toLowerCase().trim())) && (filter === "ALL" || card.status === filter);
  }), [cards, filter, search, stock]);

  const openCard = (card: ScriptCard) => { setSelected(card); setDraft({ ...card, blocks_json: [...card.blocks_json] }); setEditing(false); setMessage(""); };
  const createCard = () => { const next = emptyDraft(); setSelected(next); setDraft(next); setSkuQuery(""); setSkuOpen(false); setEditing(true); setMessage(""); };
  const closePanel = () => { if (!saving) { setSelected(null); setEditing(false); } };
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closePanel(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); });

  const save = async () => {
    if (!api || !draft.sku.trim() || !draft.title.trim() || !draft.script_text.trim()) { setError("ต้องมี SKU ชื่อสคริปต์ และเนื้อหาสคริปต์ก่อนบันทึก"); return; }
    setSaving(true); setError("");
    try {
      const payload = { sku: draft.sku.trim(), title: draft.title.trim(), subtitle: draft.subtitle, script_text: draft.script_text, ai_context: draft.ai_context, ai_instruction: draft.ai_instruction, blocks_json: draft.blocks_json, status: draft.status || "DRAFT", version: draft.version || 1, updated_at: new Date().toISOString() };
      const result = draft.id ? await api.from("sales_script_cards").update(payload).eq("id", draft.id).select("*").single() : await api.from("sales_script_cards").insert(payload).select("*").single();
      if (result.error) throw result.error;
      const saved = { ...result.data, blocks_json: Array.isArray(result.data.blocks_json) ? result.data.blocks_json : [] } as ScriptCard;
      setCards(current => draft.id ? current.map(card => card.id === saved.id ? saved : card) : [saved, ...current]);
      setSelected(saved); setDraft(saved); setEditing(false); setMessage("บันทึกแล้ว");
    } catch (e) { setError(errorText(e)); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!api || !draft.id || !window.confirm("ลบ Script Card นี้หรือไม่?")) return;
    setSaving(true); try { const result = await api.from("sales_script_cards").delete().eq("id", draft.id); if (result.error) throw result.error; setCards(current => current.filter(card => card.id !== draft.id)); closePanel(); } catch (e) { setError(errorText(e)); } finally { setSaving(false); }
  };
  const uploadImage = async (file: File) => {
    if (!api || !file) return;
    setSaving(true); setError("");
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${draft.sku || "draft"}/${crypto.randomUUID()}-${safe}`;
      const result = await api.storage.from("sales-script-images").upload(path, file, { upsert: false, contentType: file.type });
      if (result.error) throw result.error;
      const publicUrl = api.storage.from("sales-script-images").getPublicUrl(path).data.publicUrl;
      setDraft(current => ({ ...current, blocks_json: [...current.blocks_json, { type: "image", url: publicUrl, path, caption: file.name }] }));
      setMessage("เพิ่มภาพในฉบับร่างแล้ว กดบันทึกเพื่อเก็บถาวร");
    } catch (e) { setError(errorText(e)); } finally { setSaving(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingImage(false);
    const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith("image/"));
    if (files.length) void Promise.all(files.map(uploadImage));
  };
  const product = selected ? stockFor(draft, stock) : undefined;
  const aiPayload = selected ? `ข้อมูลสินค้าจากโต๊ะสต๊อกเดิม:\nSKU: ${product?.sku ?? draft.sku}\nชื่อ: ${product?.thName ?? ""}\nราคา: ${product?.price ?? ""}\nสถานะ: ${product?.stockStatus ?? ""}\n\nสคริปต์ต้นฉบับ:\n${draft.script_text}\n\nบริบทสำหรับ AI:\n${draft.ai_context}\n\nกติกาการตอบ:\n${draft.ai_instruction}` : "";

  return <div className="script-atelier min-h-full rounded-[2rem] p-4 text-white sm:p-6">
    <header className="script-atelier-hero mb-5 overflow-hidden rounded-[2rem] border p-5 sm:p-7"><div className="relative z-10 flex flex-wrap items-end justify-between gap-5"><div><p className="script-kicker"><Sparkles className="h-3.5 w-3.5" /> BB SCRIPT ATELIER</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">คลังงานเขียนที่ขายด้วยความรู้สึก</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-fuchsia-100/65">เก็บสคริปต์ยาวแบบต้นฉบับ ผูกกับ SKU จากโต๊ะสต๊อกเดิม ใส่ภาพได้ และเปิดอ่านในแผงขวาแบบ Notion</p></div><Button onClick={createCard} className="script-primary"><Plus className="h-4 w-4" />สร้าง Script Card</Button></div></header>
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-fuchsia-300/15 bg-[#12091c]/80 p-3"><label className="script-search"><Search className="h-4 w-4" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหา SKU ชื่อ หรือข้อความในสคริปต์..." /></label><select className="script-select" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">ทุกสถานะ</option><option value="DRAFT">DRAFT</option><option value="ACTIVE">ACTIVE</option><option value="ARCHIVED">ARCHIVED</option></select><span className="ml-auto text-xs text-fuchsia-100/45">{visible.length} การ์ด · สต๊อกอ้างอิง {stock.length} รายการ</span></div>
    {error && <div className="mb-4 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}
    {loading ? <div className="script-empty"><Loader2 className="h-6 w-6 animate-spin" />กำลังเปิดคลัง Script...</div> : visible.length ? <div className="script-card-grid">{visible.map(card => { const item = stockFor(card, stock); const cover = card.blocks_json.find(block => block.type === "image"); return <button type="button" key={card.id} onClick={() => openCard(card)} className="script-card text-left"><div className="script-card-cover">{cover ? <img src={cover.url} alt={cover.caption || card.title} /> : <div className="script-card-orbit"><Sparkles /></div>}<span className={`script-status script-status-${card.status.toLowerCase()}`}>{card.status}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold tracking-[.12em] text-fuchsia-200/55">{item?.emoji || "✦"} {card.sku}</p><h2 className="mt-2 text-xl font-semibold text-white">{card.title}</h2><p className="mt-1 text-sm text-fuchsia-100/60">{card.subtitle || item?.thName || "ยังไม่มีคำโปรย"}</p></div><span className="rounded-full border border-fuchsia-300/15 px-2 py-1 text-[10px] text-fuchsia-100/55">v{card.version}</span></div><p className="mt-4 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-slate-200/75">{card.script_text}</p><div className="mt-4 flex items-center justify-between text-[11px] text-fuchsia-100/40"><span>{card.blocks_json.length} ภาพประกอบ</span><span className="inline-flex items-center gap-1"><PanelRight className="h-3.5 w-3.5" />เปิดแผงอ่าน</span></div></div></button>; })}</div> : <div className="script-empty"><FilePlus2 className="h-8 w-8 text-fuchsia-300" /><p>ยังไม่มี Script Card</p><Button onClick={createCard} variant="outline" className="border-fuchsia-300/25 text-fuchsia-100">สร้างใบแรก</Button></div>}
    {selected && <><button type="button" aria-label="ปิดแผงรายละเอียด" onClick={closePanel} className="script-drawer-backdrop" /><aside className="script-drawer"><div className="flex items-center justify-between border-b border-fuchsia-300/15 p-4"><div><p className="script-kicker">SCRIPT DETAIL</p><p className="mt-1 text-xs text-fuchsia-100/45">{draft.sku || "ยังไม่เลือก SKU"}</p></div><button type="button" onClick={closePanel} className="script-icon-button" aria-label="ปิด"><X className="h-5 w-5" /></button></div><div className="flex-1 overflow-y-auto p-5">{editing ? <div className="space-y-4"><label className="script-field">SKU อ้างอิง · พิมพ์ 1–2 ตัวอักษรแล้วเลือก
<div className="relative">
<input value={draft.sku} onChange={event => { const value = event.target.value; setDraft({ ...draft, sku: value }); setSkuQuery(value); setSkuOpen(true); }} onFocus={() => { setSkuQuery(draft.sku); setSkuOpen(true); }} onBlur={() => window.setTimeout(() => setSkuOpen(false), 150)} placeholder="เช่น SI หรือ VESS" autoComplete="off" />
{skuOpen && skuQuery.trim() && <div className="script-sku-suggestions">{skuMatches.length ? skuMatches.map(item => <button type="button" key={item.sku} onMouseDown={event => event.preventDefault()} onClick={() => { setDraft(current => ({ ...current, sku: item.sku })); setSkuQuery(item.sku); setSkuOpen(false); }} className="script-sku-option"><span className="script-sku-emoji">{item.emoji || "✦"}</span><span><b>{item.sku}</b><small>{item.thName || item.label}</small></span></button>) : <div className="script-sku-empty">ไม่พบ SKU นี้ในโต๊ะสินค้าเดิม</div>}</div>}
</div>
<small className="script-field-hint">เลือกเพื่อผูกข้อมูลอ้างอิงเท่านั้น ไม่เช็ก IN_STOCK / OUT_OF_STOCK และไม่กันการเขียนสคริปต์</small>
</label><label className="script-field">ชื่อสคริปต์<input value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="เช่น เปิดซองเดียว..." /></label><label className="script-field">คำโปรย<input value={draft.subtitle} onChange={event => setDraft({ ...draft, subtitle: event.target.value })} placeholder="ประโยคสั้นบนการ์ด" /></label><label className="script-field">สถานะ<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option>DRAFT</option><option>ACTIVE</option><option>ARCHIVED</option></select></label><label className="script-field">สคริปต์ต้นฉบับ<textarea className="script-editor" value={draft.script_text} onChange={event => setDraft({ ...draft, script_text: event.target.value })} placeholder="วางสคริปต์ยาวของจาร์ยตรงนี้..." /></label><label className="script-field">บริบทสำหรับ AI<textarea value={draft.ai_context} onChange={event => setDraft({ ...draft, ai_context: event.target.value })} placeholder="โทน ความรู้สึก กลุ่มลูกค้า และสิ่งที่ AI ควรเข้าใจ" /></label><label className="script-field">กติกาการตอบของ AI<textarea value={draft.ai_instruction} onChange={event => setDraft({ ...draft, ai_instruction: event.target.value })} placeholder="วิธีใช้สคริปต์ ห้ามพูดอะไร และวิธีจบแชท" /></label><div><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={event => { const files = Array.from(event.target.files ?? []); if (files.length) void Promise.all(files.map(uploadImage)); }} /><div className={`script-dropzone ${draggingImage ? "is-dragging" : ""}`} onDragEnter={event => { event.preventDefault(); setDraggingImage(true); }} onDragOver={event => event.preventDefault()} onDragLeave={event => { if (event.currentTarget === event.target) setDraggingImage(false); }} onDrop={handleImageDrop}><ImagePlus className="h-5 w-5" /><div><b>โยนภาพลงตรงนี้ได้เลย</b><small>ลากรูปมาวาง หรือกดเลือกหลายภาพจากเครื่อง</small></div><Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="border-cyan-300/25 text-cyan-100"><ImagePlus className="h-4 w-4" />เลือกภาพ</Button></div><div className="mt-3 grid grid-cols-2 gap-2">{draft.blocks_json.map((block, index) => <div key={`${block.url}-${index}`} className="relative overflow-hidden rounded-xl border border-fuchsia-300/15"><img src={block.url} alt={block.caption || "ภาพประกอบ"} className="aspect-square w-full object-cover" /><button type="button" onClick={() => setDraft(current => ({ ...current, blocks_json: current.blocks_json.filter((_, i) => i !== index) }))} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3 w-3" /></button></div>)}</div></div></div> : <div><div className="mb-5"><p className="script-kicker">{draft.status} · VERSION {draft.version}</p><h2 className="mt-2 text-3xl font-semibold text-white">{draft.title || "ยังไม่มีชื่อสคริปต์"}</h2><p className="mt-2 text-sm text-fuchsia-100/55">{draft.subtitle}</p></div><div className="script-reader">{draft.script_text || "ยังไม่มีเนื้อหาสคริปต์"}</div>{draft.blocks_json.map((block, index) => <figure key={`${block.url}-${index}`} className="my-5 overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-black/20"><img src={block.url} alt={block.caption || "ภาพประกอบ"} className="w-full object-contain" /><figcaption className="p-2 text-center text-xs text-fuchsia-100/45">{block.caption}</figcaption></figure>)}<div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/[.04] p-4"><p className="script-kicker text-cyan-200">ข้อมูลสำหรับ AI</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cyan-50/70">{draft.ai_context || "ยังไม่มีบริบท AI"}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-cyan-50/70">{draft.ai_instruction || "ยังไม่มีกติกา AI"}</p></div></div>}</div><div className="border-t border-fuchsia-300/15 p-4"><div className="flex flex-wrap gap-2">{editing ? <><Button onClick={() => void save()} disabled={saving} className="script-primary"><Save className="h-4 w-4" />{saving ? "กำลังบันทึก" : "บันทึกการ์ด"}</Button><Button variant="outline" onClick={() => { setEditing(false); if (draft.id) setDraft(cards.find(card => card.id === draft.id) || draft); }} className="border-fuchsia-300/20 text-fuchsia-100">ยกเลิก</Button></> : <><Button onClick={() => setEditing(true)} className="script-primary">แก้ไขสคริปต์</Button><Button variant="outline" onClick={() => copyText(draft.script_text)} className="border-fuchsia-300/20 text-fuchsia-100"><Copy className="h-4 w-4" />คัดลอกสคริปต์</Button><Button variant="outline" onClick={() => copyText(aiPayload)} className="border-cyan-300/20 text-cyan-100"><Sparkles className="h-4 w-4" />คัดลอกให้ AI</Button></>}{draft.id && <Button variant="ghost" onClick={() => void remove()} className="ml-auto text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></Button>}</div>{message && <p className="mt-2 text-xs text-emerald-300">{message}</p>}</div></aside></>}
  </div>;
}
