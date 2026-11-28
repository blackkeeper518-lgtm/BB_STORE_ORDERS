import { useEffect, useMemo, useState } from "react";
import { Check, Eye, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/canonical";
import { useGlobalThemeRuntime } from "@/contexts/GlobalThemeRuntime";
import { CYBER_FRAME_OPTIONS, CYBER_FRAME_V2_OPTIONS } from "@/lib/cyber-frame";
import {
  ATMOSPHERES,
  CARD_STYLES,
  DEFAULT_APPEARANCE,
  applyAppearance,
  appearanceCssVars,
  persistAppearance,
  readAppliedAppearance,
  readDraftAppearance,
  resetAppearanceInSupabase,
  resetDraftAppearance,
  resetGlobalAppearance,
  resetRoomAppearance,
  saveDraftAppearance,
  syncAppliedAppearances,
  type AppearanceSelection,
  type AtmosphereKey,
  type CardStyleKey,
} from "@/lib/appearance-runtime";
import { THEME_LAB_ROOMS, type ThemeLabRoom } from "@/lib/theme-lab";
import "@/styles/cyber-frames.css";

type FrameChoice = { key: string; label: string; description: string };
const BUILTIN_FRAMES: FrameChoice[] = [
  ...CYBER_FRAME_OPTIONS.map(item => ({ key: item.id, label: item.name, description: item.description })),
  ...CYBER_FRAME_V2_OPTIONS.map(item => ({ key: item.id, label: item.name, description: item.description })),
];

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="grid gap-1 text-[11px] text-cyan-100/65"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-9 rounded-lg border border-cyan-300/20 bg-black/35 px-2 text-xs text-white outline-none focus:border-cyan-200/65">{children}</select></label>;
}

function PreviewStage({ selection, themeName, frameName }: { selection: AppearanceSelection; themeName: string; frameName: string }) {
  const atmosphere = ATMOSPHERES.find(item => item.key === selection.atmosphereKey) ?? ATMOSPHERES[0];
  const cardStyle = CARD_STYLES.find(item => item.key === selection.cardStyleKey) ?? CARD_STYLES[0];
  const vars = appearanceCssVars(selection);
  return <div className="relative overflow-hidden rounded-2xl border border-cyan-300/20 p-3" style={{ background: atmosphere.background }}>
    <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 0 1px, transparent 1.5px), radial-gradient(circle at 80% 65%, #7dd3fc 0 1px, transparent 1.5px)", backgroundSize: "115px 92px, 170px 130px" }} />
    <div className="relative mb-3 flex items-center justify-between text-[9px] uppercase tracking-[.2em] text-cyan-100/65"><span>PREVIEW DRAFT</span><span className="flex items-center gap-1 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> NO APPLY YET</span></div>
    <div className={`relative min-h-[220px] overflow-hidden border border-cyan-200/25 p-4 ${selection.frameKey && selection.frameKey.startsWith("f") ? `cyber-frame-card cyber-frame-${selection.frameKey}` : ""}`} style={{ ...vars, background: `rgba(8,14,28,${vars["--appearance-card-opacity"]?.replace(".", "0.") ?? ".82"})`, backdropFilter: `blur(${vars["--appearance-card-blur"]})`, borderRadius: vars["--appearance-card-radius"], boxShadow: vars["--appearance-card-shadow"] }}>
      <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[9px] tracking-[.2em] text-cyan-200/55">ROOM APPEARANCE CONTRACT</p><h3 className="mt-2 text-lg font-semibold text-white">{themeName || "Theme fallback"}</h3><p className="mt-1 text-xs text-white/55">{atmosphere.label} · {cardStyle.label} · {frameName}</p></div><span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[9px] text-emerald-200">SAFE PREVIEW</span></div>
      <div className="mt-8 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[10px] text-white/40">ธุรกิจยังเป็น source-of-truth เดิม</p><p className="mt-1 text-sm text-white/80">ออเดอร์ · แชท · สต็อก · tracking</p></div><div className="rounded-xl border border-cyan-200/15 bg-cyan-300/[.06] p-3"><p className="text-[10px] text-cyan-100/50">กรอบและพื้นหลังเป็น visual layer</p><p className="mt-1 text-sm text-cyan-100/85">{frameName} · {cardStyle.description}</p></div></div>
    </div>
  </div>;
}

export function AppearanceControlRoom() {
  const { themes } = useGlobalThemeRuntime();
  const [room, setRoom] = useState<ThemeLabRoom>("warp-drive");
  const [draft, setDraft] = useState<AppearanceSelection>(() => readDraftAppearance("warp-drive"));
  const [applied, setApplied] = useState<AppearanceSelection>(() => readAppliedAppearance("warp-drive"));
  const [customFrames, setCustomFrames] = useState<FrameChoice[]>([]);
  const [notice, setNotice] = useState("Draft ยังไม่เปลี่ยนระบบจริง");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const api = getSupabase("vault");
    if (!api) return;
    void syncAppliedAppearances(api).then(synced => {
      if (!cancelled && synced) {
        setApplied(readAppliedAppearance(room));
        setDraft(readDraftAppearance(room));
      }
    });
    void api.from("app_chat_frames").select("frame_key,name,description").eq("is_enabled", true).order("sort_order", { ascending: true }).then(result => {
      if (!cancelled && !result.error) setCustomFrames((result.data ?? []).map(row => ({ key: String(row.frame_key), label: String(row.name), description: String(row.description ?? "") })));
    });
    return () => { cancelled = true; };
  }, [room]);

  const frameChoices = useMemo(() => [...BUILTIN_FRAMES, ...customFrames.filter(item => !BUILTIN_FRAMES.some(builtin => builtin.key === item.key))], [customFrames]);
  const selectedTheme = themes.find(theme => theme.themeKey === draft.themeKey);
  const selectedFrame = frameChoices.find(frame => frame.key === draft.frameKey);
  const changeRoom = (next: ThemeLabRoom) => { setRoom(next); setApplied(readAppliedAppearance(next)); setDraft(readDraftAppearance(next)); setNotice("โหลด Draft ของห้องนี้แล้ว · ยังไม่ Apply"); };
  const update = <K extends keyof AppearanceSelection>(key: K, value: AppearanceSelection[K]) => { setDraft(current => ({ ...current, [key]: value })); setNotice("มี Draft ใหม่ · ยังไม่เปลี่ยนระบบจริง"); };
  const previewDraft = () => { saveDraftAppearance(room, draft); setNotice("Preview Draft แล้ว · ค่านี้ยังไม่ถูก Apply"); };
  const apply = async () => {
    const api = getSupabase("vault");
    if (!api) { setNotice("ยังเชื่อม ROOM 04 ไม่ได้ · ยังไม่ Apply"); return; }
    setBusy(true);
    setNotice("กำลังบันทึก Applied state ลง Supabase…");
    const saved = await persistAppearance(api, room, draft);
    if (saved) {
      applyAppearance(room, draft);
      setApplied(draft);
      setNotice(`Apply ให้ ${THEME_LAB_ROOMS.find(item => item.key === room)?.label ?? room} แล้ว · บันทึกใน Supabase`);
    } else setNotice("บันทึก Supabase ไม่สำเร็จ · ค่าปัจจุบันยังไม่ถูกเปลี่ยน");
    setBusy(false);
  };
  const resetDraft = () => { resetDraftAppearance(room); setDraft(applied); setNotice("Reset Draft แล้ว · กลับไปค่าที่ใช้งานอยู่"); };
  const resetRoom = async () => {
    const api = getSupabase("vault");
    if (!api) { setNotice("ยังเชื่อม ROOM 04 ไม่ได้ · ยังไม่ Reset"); return; }
    setBusy(true);
    const cleared = await resetAppearanceInSupabase(api, room);
    if (cleared) { resetRoomAppearance(room); const next = readAppliedAppearance(room); setApplied(next); setDraft(next); setNotice("คืนค่า Room Default แล้ว · ใช้ fallback ต่อชั้น"); }
    else setNotice("Reset Supabase ไม่สำเร็จ · ค่าปัจจุบันยังไม่ถูกเปลี่ยน");
    setBusy(false);
  };
  const resetGlobal = async () => {
    const api = getSupabase("vault");
    if (!api) { setNotice("ยังเชื่อม ROOM 04 ไม่ได้ · ยังไม่ Reset"); return; }
    setBusy(true);
    const cleared = await resetAppearanceInSupabase(api, "global");
    if (cleared) { resetGlobalAppearance(); setApplied(DEFAULT_APPEARANCE); setDraft(DEFAULT_APPEARANCE); setNotice("คืนค่า Global Default แล้ว · baseline เดิมยังอยู่"); }
    else setNotice("Reset Supabase ไม่สำเร็จ · ค่าปัจจุบันยังไม่ถูกเปลี่ยน");
    setBusy(false);
  };
  return <section className="appearance-control-room overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#07101c]/90 shadow-[0_0_45px_rgba(34,211,238,.08)]">
    <header className="border-b border-cyan-300/15 bg-cyan-400/[.04] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.28em] text-cyan-300/80">APPEARANCE ARCHITECTURE · DRAFT FIRST</p><h2 className="mt-1 text-xl font-semibold text-white">ศูนย์ควบคุมหน้าตาระบบ</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-cyan-100/60">แยก Atmosphere, Theme, Card Style และ Frame ออกจากกัน · เลือกแล้ว Preview ได้ทันที แต่ระบบจริงเปลี่ยนเมื่อกด Apply เท่านั้น</p></div><span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/[.06] px-3 py-1.5 text-[10px] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> SUPABASE · DRAFT LOCAL</span></div></header>
    <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]"><div className="space-y-4"><SelectField label="ห้องที่กำลังปรับ" value={room} onChange={value => changeRoom(value as ThemeLabRoom)}><option value="">เลือกห้อง</option>{THEME_LAB_ROOMS.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</SelectField>
      <div className="grid gap-3 sm:grid-cols-2"><SelectField label="Atmosphere · บรรยากาศ" value={draft.atmosphereKey} onChange={value => update("atmosphereKey", value as AtmosphereKey)}>{ATMOSPHERES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</SelectField><SelectField label="Theme · สีและ identity" value={draft.themeKey ?? "inherit"} onChange={value => update("themeKey", value === "inherit" ? null : value)}><option value="inherit">ใช้ Theme fallback / global</option>{themes.map(theme => <option key={theme.themeKey} value={theme.themeKey}>{theme.name}</option>)}</SelectField><SelectField label="Card Style · วัสดุการ์ด" value={draft.cardStyleKey} onChange={value => update("cardStyleKey", value as CardStyleKey)}>{CARD_STYLES.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</SelectField><SelectField label="Frame / Border · ขอบการ์ด" value={draft.frameKey ?? "none"} onChange={value => update("frameKey", value === "none" ? null : value)}><option value="none">ไม่กำหนด · ใช้ค่าเดิมของห้อง</option>{frameChoices.map(frame => <option key={frame.key} value={frame.key}>{frame.label} · {frame.key}</option>)}</SelectField></div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/55"><p><span className="text-cyan-200">Applied อยู่:</span> {applied.atmosphereKey} · {applied.themeKey ?? "inherit"} · {applied.cardStyleKey} · {applied.frameKey ?? "default"}</p><p className="mt-1"><span className="text-amber-200">Draft อยู่:</span> {draft.atmosphereKey} · {draft.themeKey ?? "inherit"} · {draft.cardStyleKey} · {draft.frameKey ?? "default"}</p></div>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={previewDraft} disabled={busy} className="border-cyan-300/30 text-cyan-100"><Eye className="mr-1.5 h-4 w-4" /> Preview Draft</Button><Button type="button" onClick={apply} disabled={busy} className="bg-emerald-400 text-[#04120d] hover:bg-emerald-300"><Check className="mr-1.5 h-4 w-4" /> Apply ให้ห้อง</Button><Button type="button" variant="outline" onClick={resetDraft} disabled={busy} className="border-amber-300/25 text-amber-100"><RotateCcw className="mr-1.5 h-4 w-4" /> Reset Draft</Button><Button type="button" variant="outline" onClick={resetRoom} disabled={busy} className="border-rose-300/25 text-rose-100">Restore Room Default</Button><Button type="button" variant="outline" onClick={resetGlobal} disabled={busy} className="border-fuchsia-300/25 text-fuchsia-100">Restore Global Default</Button></div>
      <p role="status" className="min-h-5 text-xs text-cyan-100/70">{notice}</p></div><PreviewStage selection={draft} themeName={selectedTheme?.name ?? "Theme fallback / global"} frameName={selectedFrame?.label ?? "Room default frame"} /></div>
  </section>;
}
