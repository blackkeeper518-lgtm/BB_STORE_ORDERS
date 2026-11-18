import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/canonical";
import { Pencil, Play, Plus, Save, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import "@/styles/cyber-frames.css";

type AssetType = "frame" | "theme" | "sound";
type Row = Record<string, any>;
const TABLES: Record<AssetType, { table: string; key: string; label: string }> = {
  frame: { table: "app_chat_frames", key: "frame_key", label: "กรอบแชท" },
  theme: { table: "app_themes", key: "theme_key", label: "ธีม" },
  sound: { table: "app_sounds", key: "sound_key", label: "เสียง" },
};
const emptyDraft = (type: AssetType): Row => type === "frame"
  ? { frame_key: "", name: "", description: "", base_frame_key: "", border_color: "#00e5ff", accent_color: "#ff00d9", border_width: 1, glow: 12, animation: "", custom_css: "", is_enabled: true, sort_order: 0 }
  : type === "theme"
    ? { theme_key: "", name: "", description: "", background_color: "#090611", surface_color: "#151027", primary_color: "#b879ff", accent_color: "#00e5ff", border_style: "solid", button_style: "solid", radius: 16, glow: 12, motion_enabled: true, is_enabled: true, sort_order: 0 }
    : { sound_key: "", name: "", description: "", event_type: "custom", storage_bucket: "chat-sounds", storage_path: "", mime_type: "", volume: 0.35, is_enabled: true, sort_order: 0 };

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-[11px] text-white/55"><span>{label}</span><Input type={type} value={value ?? ""} onChange={event => onChange(event.target.value)} className="h-8 border-white/10 bg-black/20 text-xs text-white" /></label>;
}

function FramePreview({ draft, compact = false }: { draft: Row; compact?: boolean }) {
  const key = String(draft.frame_key || "f03").toLowerCase().match(/^f\d+$/)?.[0] || "f03";
  const cssVars = {
    "--panel": "#101527",
    "--cyan": draft.border_color || "#00e5ff",
    "--pink": draft.accent_color || "#ff00d9",
    "--purple": "#a855f7",
    "--lime": "#8cff00",
    "--glow": String(Math.max(0.1, Number(draft.glow) || 12) / 12),
    "--radius": `${Math.max(0, Number(draft.radius) || 16)}px`,
    "--speed": "1",
  } as CSSProperties;
  return <div className="rounded-2xl border border-white/10 bg-[#080b14] p-3">
    <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">LIVE PREVIEW · ขนาดจริง</p>
    <div className={`cyber-frame-card cyber-frame-${key} ${compact ? "min-h-[182px]" : "min-h-[230px]"} flex flex-col justify-between`} style={{ ...cssVars, borderWidth: `${Math.max(1, Number(draft.border_width) || 1)}px` }}>
      <div className="content">
        <div className="topline"><span>BB CHAT · {key.toUpperCase()}</span><span className="online">ONLINE</span></div>
        <p className="track">{draft.name || "ชื่อลูกค้าตัวอย่าง"}</p>
        <p className="carrier">{draft.description || "ตัวอย่างข้อความล่าสุดจากลูกค้า จะแสดงในกรอบนี้"}</p>
      </div>
      <div className="bottom"><span>LAST MESSAGE</span><strong>09:41</strong><small>ข้อความใหม่</small></div>
    </div>
  </div>;
}

export function CustomizationAdmin({ defaultType = "frame" }: { defaultType?: AssetType }) {
  const [type, setType] = useState<AssetType>(defaultType);
  const [rows, setRows] = useState<Row[]>([]);
  const [draft, setDraft] = useState<Row>(() => emptyDraft(defaultType));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const config = TABLES[type];
  const api = useMemo(() => getSupabase("vault"), []);

  const load = async () => {
    if (!api) { setNotice("ยังไม่ได้เชื่อม ROOM 04"); return; }
    setBusy(true);
    const result = await api.from(config.table).select("*").order("sort_order", { ascending: true });
    if (result.error) setNotice(`โหลดไม่สำเร็จ: ${result.error.message}`);
    else setRows((result.data ?? []) as Row[]);
    setBusy(false);
  };
  useEffect(() => { setDraft(emptyDraft(type)); setEditing(false); void load(); }, [type]);

  const save = async () => {
    if (!api) return setNotice("ยังไม่ได้เชื่อม ROOM 04");
    const key = config.key;
    if (!String(draft[key] ?? "").trim() || !String(draft.name ?? "").trim()) return setNotice("กรอก Key และชื่อก่อนบันทึก");
    setBusy(true); setNotice("");
    const payload = { ...draft, [key]: String(draft[key]).trim(), name: String(draft.name).trim(), updated_by: "secret-gallery" };
    const result = await api.from(config.table).upsert(payload, { onConflict: key });
    if (result.error) setNotice(`บันทึกไม่สำเร็จ: ${result.error.message}`);
    else { setNotice(`บันทึก ${payload.name} แล้ว`); setEditing(false); await load(); }
    setBusy(false);
  };

  const toggle = async (row: Row) => {
    if (!api) return;
    setBusy(true);
    const result = await api.from(config.table).update({ is_enabled: !row.is_enabled, updated_by: "secret-gallery" }).eq(config.key, row[config.key]);
    if (result.error) setNotice(`เปลี่ยนสถานะไม่สำเร็จ: ${result.error.message}`); else await load();
    setBusy(false);
  };

  const key = config.key;
  return <section className="mt-4 rounded-2xl border border-cyan-300/15 bg-black/20 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">ROOM 04 · SETTING CONTROL</p><h3 className="text-sm font-semibold text-white">เพิ่ม/แก้ไข {config.label}</h3></div><div className="flex gap-1">{(Object.keys(TABLES) as AssetType[]).map(item => <Button key={item} type="button" variant="outline" onClick={() => setType(item)} className={`h-8 border-white/10 px-2 text-[10px] ${type === item ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100" : "text-white/55"}`}>{TABLES[item].label}</Button>)}<Button type="button" onClick={() => { setDraft(emptyDraft(type)); setEditing(true); setNotice(""); }} className="h-8 bg-cyan-500 px-2 text-[10px] text-black"><Plus className="mr-1 h-3.5 w-3.5" />เพิ่มใหม่</Button></div></div>
    {notice ? <p className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-400/5 p-2 text-xs text-cyan-100/80">{notice}</p> : null}
    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{rows.map(row => <div key={row[key]} className={`rounded-xl border p-2 ${row.is_enabled === false ? "border-white/5 opacity-45" : "border-white/10"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block truncate text-xs text-white">{row.name}</strong><span className="font-mono text-[10px] text-cyan-200/50">{row[key]}</span></div><button type="button" onClick={() => void toggle(row)} title="เปิด/ปิด" className="text-cyan-200">{row.is_enabled === false ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}</button></div>{type === "frame" ? <div className="mt-2"><FramePreview draft={row} compact /></div> : null}<p className="mt-1 line-clamp-2 text-[10px] text-white/45">{row.description || "ไม่มีคำอธิบาย"}</p>{type === "sound" && row.storage_path ? <button type="button" className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-amber-300/25 py-1 text-[10px] text-amber-200" onClick={async () => { const signed = await api?.storage.from(row.storage_bucket || "chat-sounds").createSignedUrl(row.storage_path, 3600); const url = signed?.data?.signedUrl; if (url) { const audio = new Audio(url); audio.volume = Math.max(0, Math.min(1, Number(row.volume) || 0.35)); void audio.play(); } }}><Play className="h-3 w-3" />ทดลองเล่น</button> : null}<Button type="button" variant="outline" onClick={() => { setDraft({ ...emptyDraft(type), ...row }); setEditing(true); setNotice(""); }} className="mt-2 h-7 w-full border-white/10 text-[10px] text-white/70"><Pencil className="mr-1 h-3 w-3" />แก้ไข</Button></div>)}</div>
    {editing ? <div className={`mt-4 grid gap-4 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.04] p-3 ${type === "frame" ? "lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]" : ""}`}><div><div className="mb-2 flex items-center justify-between"><strong className="text-xs text-cyan-100">แบบฟอร์มบันทึก {config.label}</strong><button type="button" onClick={() => setEditing(false)} className="text-white/50"><X className="h-4 w-4" /></button></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Field label={key} value={draft[key]} onChange={value => setDraft({ ...draft, [key]: value })} /><Field label="ชื่อ" value={draft.name} onChange={value => setDraft({ ...draft, name: value })} /><Field label="คำอธิบาย" value={draft.description} onChange={value => setDraft({ ...draft, description: value })} /><Field label="ลำดับ" type="number" value={draft.sort_order} onChange={value => setDraft({ ...draft, sort_order: Number(value) })} />{type === "frame" ? <><Field label="สีขอบ" type="color" value={draft.border_color} onChange={value => setDraft({ ...draft, border_color: value })} /><Field label="สี Accent" type="color" value={draft.accent_color} onChange={value => setDraft({ ...draft, accent_color: value })} /><Field label="ความหนาขอบ" type="number" value={draft.border_width} onChange={value => setDraft({ ...draft, border_width: Number(value) })} /><Field label="Glow" type="number" value={draft.glow} onChange={value => setDraft({ ...draft, glow: Number(value) })} /></> : type === "theme" ? <><Field label="สีพื้น" type="color" value={draft.background_color} onChange={value => setDraft({ ...draft, background_color: value })} /><Field label="สี Panel" type="color" value={draft.surface_color} onChange={value => setDraft({ ...draft, surface_color: value })} /><Field label="สี Primary" type="color" value={draft.primary_color} onChange={value => setDraft({ ...draft, primary_color: value })} /><Field label="สี Accent" type="color" value={draft.accent_color} onChange={value => setDraft({ ...draft, accent_color: value })} /><Field label="Radius" type="number" value={draft.radius} onChange={value => setDraft({ ...draft, radius: Number(value) })} /><Field label="Glow" type="number" value={draft.glow} onChange={value => setDraft({ ...draft, glow: Number(value) })} /></> : <><Field label="Event type" value={draft.event_type} onChange={value => setDraft({ ...draft, event_type: value })} /><Field label="Storage bucket" value={draft.storage_bucket} onChange={value => setDraft({ ...draft, storage_bucket: value })} /><Field label="Storage path" value={draft.storage_path} onChange={value => setDraft({ ...draft, storage_path: value })} /><Field label="Volume" type="number" value={draft.volume} onChange={value => setDraft({ ...draft, volume: Number(value) })} /></>}</div><label className="mt-3 flex items-center gap-2 text-xs text-white/70"><input type="checkbox" checked={draft.is_enabled !== false} onChange={event => setDraft({ ...draft, is_enabled: event.target.checked })} /> เปิดให้เลือกใช้งาน</label><Button type="button" onClick={() => void save()} disabled={busy} className="mt-3 bg-emerald-500 text-black"><Save className="mr-2 h-4 w-4" />{busy ? "กำลังบันทึก…" : "บันทึกลง ROOM 04"}</Button></div>{type === "frame" ? <FramePreview draft={draft} /> : null}</div> : null}
  </section>;
}
