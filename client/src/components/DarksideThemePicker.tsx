import { Check, Filter, Palette, Search, Volume2, VolumeX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useGlobalThemeRuntime, type GlobalTheme } from "@/contexts/GlobalThemeRuntime";
import { tacticalAudio } from "@/lib/darkside-skin-engine";

export function DarksideThemePicker() {
  const { theme, themes, selectTheme, muted, setMuted } = useGlobalThemeRuntime();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => ["all", ...Array.from(new Set(themes.map(item => item.category))).sort()], [themes]);
  const visible = useMemo(() => themes.filter(item => (category === "all" || item.category === category) && `${item.name} ${item.description} ${item.themeKey}`.toLowerCase().includes(query.toLowerCase())), [themes, query, category]);
  const choose = (next: GlobalTheme) => { selectTheme(next); setOpen(false); };
  return <>
    <button type="button" className="darkside-theme-trigger" onClick={() => setOpen(true)} aria-label={`เปิด Theme Picker · ${theme.name}`}><Palette size={14} /><span>{theme.name}</span><i style={{ background: theme.primary }} /></button>
    {open ? <div className="darkside-picker-backdrop" role="presentation" onClick={() => setOpen(false)}><section className="darkside-theme-picker" role="dialog" aria-modal="true" aria-labelledby="darkside-picker-title" onClick={event => event.stopPropagation()}>
      <header className="darkside-picker-header"><div><span className="darkside-kicker">DARKSIDE // SKIN ENGINE</span><h2 id="darkside-picker-title">Theme Picker <small>{themes.length}/40 READY</small></h2></div><div className="darkside-picker-actions"><button type="button" onClick={() => setMuted(!muted)} title={muted ? "เปิดเสียง" : "ปิดเสียง"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><button type="button" onClick={() => setOpen(false)} aria-label="ปิด"><X size={18} /></button></div></header>
      <div className="darkside-picker-toolbar"><label><Search size={14} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาสกิน / วัสดุ / คีย์…" /></label><div className="darkside-category-tabs"><Filter size={13} />{categories.map(item => <button type="button" key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item === "all" ? "ทั้งหมด" : item}</button>)}</div></div>
      <div className="darkside-theme-grid">{visible.map(item => <button type="button" key={item.themeKey} className={`darkside-theme-card ${theme.themeKey === item.themeKey ? "is-active" : ""}`} onClick={() => choose(item)}><span className="darkside-swatch" style={{ background: `linear-gradient(135deg, ${item.bg}, ${item.surface} 55%, ${item.primary})`, borderColor: item.accent }}><i style={{ background: item.primary }} /><b style={{ background: item.accent }} /><em style={{ borderColor: item.accent, borderRadius: item.frame === "cut-corner" ? 0 : item.radius }} /></span><span className="darkside-theme-card-copy"><strong>{item.name}</strong><small>{item.material.toUpperCase()} · {item.frame.toUpperCase()}</small></span><span className="darkside-theme-card-meta"><span>{item.category}</span>{theme.themeKey === item.themeKey ? <Check size={14} /> : null}</span></button>)}</div>
      {!visible.length ? <div className="darkside-picker-empty">ไม่พบสกินที่ตรงกับคำค้น</div> : null}
      <footer className="darkside-picker-footer"><span>ACTIVE <b>{theme.themeKey}</b></span><span>CONTRAST <b>{document.documentElement.dataset.skinContrast ?? "guarded"}</b></span><span>AUDIO <b>{muted ? "MUTED" : "ARMED"}</b></span></footer>
    </section></div> : null}
  </>;
}

export function DarksideThemePreview({ skin }: { skin: GlobalTheme }) { return <span className="darkside-inline-preview" style={{ background: skin.surface, borderColor: skin.accent, color: skin.textPrimary }}><i style={{ background: skin.primary }} />{skin.name}</span>; }
