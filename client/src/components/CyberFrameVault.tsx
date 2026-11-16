import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CYBER_FRAME_OPTIONS, readCyberFrame, saveCyberFrame } from "@/lib/cyber-frame";
import "@/styles/cyber-frames.css";

type CyberFrameVaultProps = { onSaved?: (id: string) => void };

export function CyberFrameVault({ onSaved }: CyberFrameVaultProps) {
  const saved = readCyberFrame();
  const [draft, setDraft] = useState(saved || "f03");
  const [confirmed, setConfirmed] = useState(saved || "");
  const selected = useMemo(
    () => CYBER_FRAME_OPTIONS.find(option => option.id === draft) ?? CYBER_FRAME_OPTIONS[2],
    [draft],
  );

  const confirmSelection = () => {
    saveCyberFrame(selected.id);
    setConfirmed(selected.id);
    onSaved?.(selected.id);
  };

  return (
    <Card className="neon-card overflow-hidden rounded-3xl border-cyan-300/25 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,.14),transparent_42%),linear-gradient(135deg,rgba(8,20,38,.96),rgba(22,8,38,.94))]">
      <CardHeader className="border-b border-cyan-300/10">
        <CardTitle className="flex items-center gap-2 text-sm text-white">
          <Sparkles className="h-4 w-4 text-cyan-300" /> CYBER FRAME VAULT · 40 แบบ
        </CardTitle>
        <p className="text-xs leading-5 text-cyan-100/55">เลือกกรอบ ดูตัวอย่าง แล้วกดยืนยัน ระบบจะจำเฉพาะรหัสกรอบ ไม่ต้องคัดลอก CSS</p>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
          {CYBER_FRAME_OPTIONS.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => setDraft(option.id)}
              aria-pressed={draft === option.id}
              className={`rounded-xl border p-2 text-left transition ${draft === option.id ? "border-cyan-300/75 bg-cyan-300/10 shadow-[0_0_16px_rgba(34,211,238,.18)]" : "border-white/10 bg-black/20 hover:border-fuchsia-300/45 hover:bg-fuchsia-500/[0.06]"}`}
            >
              <div className={`cyber-frame-card cyber-frame-${option.id} flex h-16 items-end justify-between rounded-lg p-2`} style={{ ["--glow" as string]: "0.8", ["--speed" as string]: "1", ["--radius" as string]: "10px" }}>
                <span className="font-mono text-[10px] text-white/80">{option.id.toUpperCase()}</span>
                <span className="text-[9px] text-cyan-100/50">PREVIEW</span>
              </div>
              <p className="mt-2 truncate text-[10px] font-semibold text-white/80">{option.name}</p>
            </button>
          ))}
        </div>
        <div className="flex min-h-[250px] flex-col rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className={`cyber-frame-card cyber-frame-${selected.id} flex min-h-[182px] flex-1 flex-col justify-between p-5`} style={{ ["--glow" as string]: "1", ["--speed" as string]: "1", ["--radius" as string]: "16px" }}>
            <div>
              <p className="font-mono text-[10px] tracking-[0.25em] text-cyan-200">FRAME {selected.id.toUpperCase()}</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{selected.name}</h3>
              <p className="mt-1 text-xs leading-5 text-white/60">{selected.description}</p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/45"><span>CYBER FRAME VAULT</span><span>VISUAL ONLY</span></div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-[10px] text-emerald-300/75">{confirmed ? `ใช้งานอยู่ · ${confirmed.toUpperCase()}` : "ยังไม่ได้ยืนยันแบบใหม่"}</span>
            <Button type="button" onClick={confirmSelection} className="h-8 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-3 text-[10px] font-semibold text-[#06101e]">
              <Check className="mr-1.5 h-3.5 w-3.5" /> ยืนยันและใช้ {selected.id.toUpperCase()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
