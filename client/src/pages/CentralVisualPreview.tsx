import { useMemo, useState } from "react";
import {
  ACCENT_PROFILES,
  BACKGROUND_PROFILES,
  CARD_MATERIAL_PROFILES,
  DEFAULT_CENTRAL_VISUAL_PROFILE,
  FRAME_PROFILES,
  type AccentKey,
  type BackgroundKey,
  type CardMaterialKey,
  type CentralVisualProfile,
  type FrameKey,
  resolveCentralVisualTokens,
} from "@/lib/central-visual-contract";
import { resolveDesktopVisualStyle, visualStyleToInlineStyle } from "@/lib/central-visual-adapter";

type SurfaceKind = "panel" | "card" | "raised";

type CentralVisualCardProps = {
  title: string;
  eyebrow: string;
  description: string;
  surface?: SurfaceKind;
  selected?: boolean;
  children?: React.ReactNode;
};

function CentralVisualCard({ title, eyebrow, description, surface = "card", selected = false, children }: CentralVisualCardProps) {
  return (
    <section
      data-visual-surface={surface}
      style={{
        background: surface === "panel" ? "var(--panel-surface)" : surface === "raised" ? "var(--card-surface-raised)" : "var(--card-surface)",
        border: "var(--frame-width) var(--frame-style) color-mix(in srgb, var(--frame-color) calc(var(--frame-opacity) * 100%), transparent)",
        borderRadius: surface === "panel" ? "var(--panel-radius)" : "var(--card-radius)",
        boxShadow: selected ? "0 0 0 1px var(--accent-primary), var(--card-shadow)" : "var(--card-shadow)",
        backdropFilter: "blur(var(--card-blur))",
        padding: surface === "panel" ? "var(--panel-padding)" : "var(--card-padding)",
        transition: "border-color 180ms ease, box-shadow 180ms ease, background 180ms ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "var(--accent-secondary)", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase" }}>{eyebrow}</div>
          <h2 style={{ color: "var(--text-primary)", fontSize: "20px", lineHeight: 1.2, margin: "8px 0 6px" }}>{title}</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.55, margin: 0 }}>{description}</p>
        </div>
        <span style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono, ui-monospace)", fontSize: "11px", whiteSpace: "nowrap" }}>{selected ? "SELECTED" : "LIVE"}</span>
      </div>
      {children ? <div style={{ marginTop: "var(--space-6)" }}>{children}</div> : null}
    </section>
  );
}

function OptionButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--accent-soft)" : "var(--control-surface)",
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--control-border)"}`,
        borderRadius: "var(--control-radius)",
        color: active ? "var(--accent-contrast)" : "var(--text-secondary)",
        cursor: "pointer",
        fontSize: "12px",
        padding: "8px 10px",
      }}
    >
      {children}
    </button>
  );
}

export default function CentralVisualPreview() {
  const [profile, setProfile] = useState<CentralVisualProfile>(DEFAULT_CENTRAL_VISUAL_PROFILE);
  const tokens = useMemo(() => resolveDesktopVisualStyle(profile), [profile]);
  const inlineStyle = visualStyleToInlineStyle({
    ...tokens,
    "--app-background-layers": BACKGROUND_PROFILES[profile.background].layers.join(", "),
    "--frame-color": ACCENT_PROFILES[profile.accent].primary,
    "--panel-radius": "18px",
    "--panel-padding": "24px",
    "--control-radius": "10px",
    "--space-4": "16px",
    "--space-6": "24px",
    "--font-mono": "ui-monospace, SFMono-Regular, Menlo, monospace",
  });

  const update = <K extends keyof CentralVisualProfile>(key: K, value: CentralVisualProfile[K]) => {
    setProfile(current => ({ ...current, [key]: value }));
  };

  return (
    <main
      data-visual-scope="desktop-app"
      data-visual-room="contract-preview"
      style={{
        ...inlineStyle,
        backgroundColor: "var(--app-canvas)",
        backgroundImage: "var(--app-background-layers)",
        backgroundSize: "var(--app-background-size, auto)",
        color: "var(--text-primary)",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        minHeight: "100vh",
        padding: "32px",
      } as React.CSSProperties}
    >
      <div style={{ margin: "0 auto", maxWidth: "1180px" }}>
        <header style={{ marginBottom: "28px" }}>
          <div style={{ color: "var(--accent-secondary)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.2em" }}>CENTRAL VISUAL SYSTEM · ISOLATED PREVIEW</div>
          <h1 style={{ fontSize: "clamp(30px, 5vw, 54px)", lineHeight: 1, margin: "12px 0" }}>Dark Base + Accent Contract</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "720px", lineHeight: 1.6, margin: 0 }}>หน้านี้เป็น renderer แยกสำหรับตรวจว่า Background, Dark Base, Card Material, Frame และ Accent แยกหน้าที่กันจริง ก่อนต่อเข้าห้องปฏิบัติการ</p>
        </header>

        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "minmax(0, 1fr) 300px" }}>
          <div style={{ display: "grid", gap: "20px" }}>
            <CentralVisualCard eyebrow="ROOM SURFACE" title="Operational preview surface" description="พื้นหลังยังเห็นผ่าน gutter และ card ไม่ถูก accent ย้อมทั้งใบ" surface="panel">
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <CentralVisualCard eyebrow="CARD MATERIAL" title="Balanced card" description={`${CARD_MATERIAL_PROFILES[profile.cardMaterial].label} · ${CARD_MATERIAL_PROFILES[profile.cardMaterial].description}`} selected>
                  <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>ORDER · READ ONLY · 0001</div>
                </CentralVisualCard>
                <CentralVisualCard eyebrow="FRAME + ACCENT" title="State card" description="Frame เปลี่ยนเฉพาะขอบ และ state ยัง semantic" surface="raised">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ background: "color-mix(in srgb, var(--state-success) 16%, transparent)", border: "1px solid var(--state-success)", borderRadius: "var(--radius-pill, 999px)", color: "var(--state-success)", fontSize: "12px", padding: "6px 10px" }}>SUCCESS</span>
                    <span style={{ background: "color-mix(in srgb, var(--state-warning) 16%, transparent)", border: "1px solid var(--state-warning)", borderRadius: "var(--radius-pill, 999px)", color: "var(--state-warning)", fontSize: "12px", padding: "6px 10px" }}>REVIEW</span>
                    <span style={{ background: "color-mix(in srgb, var(--state-danger) 16%, transparent)", border: "1px solid var(--state-danger)", borderRadius: "var(--radius-pill, 999px)", color: "var(--state-danger)", fontSize: "12px", padding: "6px 10px" }}>ERROR</span>
                  </div>
                </CentralVisualCard>
              </div>
            </CentralVisualCard>

            <CentralVisualCard eyebrow="CONTROL / INPUT" title="The contract is inspectable" description="ปุ่มด้านขวาเปลี่ยน profile ในหน้านี้เท่านั้น ไม่เขียน localStorage ไม่แตะ Supabase">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <input aria-label="Preview input" placeholder="Preview input" style={{ background: "var(--control-surface)", border: "1px solid var(--control-border)", borderRadius: "var(--control-radius)", color: "var(--text-primary)", flex: "1 1 240px", minWidth: "0", padding: "11px 12px" }} />
                <button type="button" style={{ background: "var(--accent-primary)", border: 0, borderRadius: "var(--control-radius)", color: "var(--accent-contrast)", cursor: "pointer", fontWeight: 700, padding: "11px 16px" }}>APPLY PREVIEW ONLY</button>
              </div>
            </CentralVisualCard>
          </div>

          <aside style={{ alignSelf: "start", display: "grid", gap: "16px", position: "sticky", top: "20px" }}>
            <CentralVisualCard eyebrow="PROFILE" title="Live controls" description="ปรับเฉพาะ renderer นี้">
              <div style={{ display: "grid", gap: "16px" }}>
                <label style={{ color: "var(--text-secondary)", display: "grid", fontSize: "12px", gap: "8px" }}>Accent <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(Object.keys(ACCENT_PROFILES) as AccentKey[]).map(key => <OptionButton key={key} active={profile.accent === key} onClick={() => update("accent", key)}>{ACCENT_PROFILES[key].label}</OptionButton>)}</span></label>
                <label style={{ color: "var(--text-secondary)", display: "grid", fontSize: "12px", gap: "8px" }}>Background <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(Object.keys(BACKGROUND_PROFILES) as BackgroundKey[]).map(key => <OptionButton key={key} active={profile.background === key} onClick={() => update("background", key)}>{BACKGROUND_PROFILES[key].label}</OptionButton>)}</span></label>
                <label style={{ color: "var(--text-secondary)", display: "grid", fontSize: "12px", gap: "8px" }}>Card material <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(Object.keys(CARD_MATERIAL_PROFILES) as CardMaterialKey[]).map(key => <OptionButton key={key} active={profile.cardMaterial === key} onClick={() => update("cardMaterial", key)}>{CARD_MATERIAL_PROFILES[key].label}</OptionButton>)}</span></label>
                <label style={{ color: "var(--text-secondary)", display: "grid", fontSize: "12px", gap: "8px" }}>Frame <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(Object.keys(FRAME_PROFILES) as FrameKey[]).map(key => <OptionButton key={key} active={profile.frame === key} onClick={() => update("frame", key)}>{FRAME_PROFILES[key].label}</OptionButton>)}</span></label>
              </div>
            </CentralVisualCard>

            <CentralVisualCard eyebrow="TOKEN OUTPUT" title="Current profile" description="ค่าที่ renderer กำลังใช้">
              <pre style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "10px", lineHeight: 1.6, margin: 0, maxHeight: "260px", overflow: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify({ ...profile, tokens: resolveCentralVisualTokens(profile) }, null, 2)}</pre>
            </CentralVisualCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
