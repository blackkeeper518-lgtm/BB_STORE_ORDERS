import { ArrowRight, Check, CirclePlay, MessageCircle, Smartphone, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useGlobalThemeRuntime, type GlobalTheme } from "@/contexts/GlobalThemeRuntime";
import { tacticalAudio } from "@/lib/darkside-skin-engine";

function PreviewCard({ skin, active, onSelect }: { skin: GlobalTheme; active: boolean; onSelect: () => void }) {
  const [tab, setTab] = useState<"chat" | "status">("chat");
  return <article className={`skin-preview-card skin-preview-${skin.material} ${active ? "is-active" : ""}`} style={{ "--preview-bg": skin.bg, "--preview-surface": skin.surface, "--preview-primary": skin.primary, "--preview-accent": skin.accent, "--preview-text": skin.textPrimary, "--preview-muted": skin.textSecondary } as React.CSSProperties}>
    <div className="skin-preview-top"><div><span className="skin-preview-kicker">{skin.category}</span><h2>{skin.name}</h2></div><span className="skin-preview-index">{String(skin.preset + 1).padStart(2, "0")}</span></div>
    <div className="skin-preview-device"><div className="skin-preview-notch" /><div className="skin-preview-device-head"><span><i />DARKSIDE INBOX</span><small>12:08</small></div><div className="skin-preview-tabs"><button className={tab === "chat" ? "is-active" : ""} onClick={() => setTab("chat")}>CHAT ROOM</button><button className={tab === "status" ? "is-active" : ""} onClick={() => setTab("status")}>STATUS</button></div>{tab === "chat" ? <div className="skin-preview-chat"><div className="skin-preview-message incoming">สวัสดีค่ะ สนใจรับกี่คอตดีคะ?<small>ลูกค้า · 12:06</small></div><div className="skin-preview-message outgoing">รับ 1 คอต เก็บเงินปลายทางค่ะ<small>เพจ · 12:07 ✓✓</small></div><div className="skin-preview-composer"><span>พิมพ์ข้อความ…</span><b><ArrowRight size={13} /></b></div></div> : <div className="skin-preview-status"><div><span>UNREAD</span><strong>08</strong></div><div><span>ORDERS</span><strong>23</strong></div><div><span>SYNC</span><strong>LIVE</strong></div></div>}</div>
    <div className="skin-preview-meta"><span className="skin-preview-material">{skin.material.toUpperCase()}</span><span>{skin.frame} · blur {skin.blur}px</span><button type="button" onClick={() => { tacticalAudio.play("click", skin); onSelect(); }}>{active ? <><Check size={13} /> ACTIVE</> : "USE SKIN"}</button></div>
  </article>;
}

export default function SkinPackPreview() {
  const { themes, theme, selectTheme, connected } = useGlobalThemeRuntime();
  const examples = useMemo(() => { const wanted = ["Glassmorphism", "Cyber HUD", "OLED Stealth", "Holo Gradient"]; const selected = wanted.flatMap(category => themes.filter(item => item.category === category)).slice(0, 6); return selected.length ? selected : themes.slice(0, 6); }, [themes]);
  return <main className="skin-pack-preview-page"><header className="skin-pack-preview-header"><div><span className="skin-pack-brand"><Smartphone size={15} /> DARKSIDE // MOBILE SKIN PACK</span><h1>เลือกบรรยากาศ<br /><em>ก่อนลงสนามจริง</em></h1><p>ตัวอย่างการแสดงผลบนมือถือจาก Supabase skin config จริง · {connected ? "LIVE FROM SUPABASE" : "LOCAL FALLBACK"}</p></div><div className="skin-pack-preview-actions"><span><MessageCircle size={14} /> {themes.length} skins ready</span><span><Volume2 size={14} /> audio armed</span></div></header><section className="skin-pack-preview-grid">{examples.map(item => <PreviewCard key={item.themeKey} skin={item} active={item.themeKey === theme.themeKey} onSelect={() => selectTheme(item)} />)}</section><footer className="skin-pack-preview-footer"><span>ACTIVE PACK · <b>{theme.name}</b></span><button type="button" onClick={() => window.history.back()}><CirclePlay size={14} /> กลับเข้าแอป</button></footer></main>;
}
