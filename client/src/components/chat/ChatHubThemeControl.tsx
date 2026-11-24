import { Button } from "@/components/ui/button";
import type { CyberTheme } from "@/lib/theme-lab";
import { CYBER_THEME_PRESETS } from "@/lib/theme-lab";
import { Check, Palette, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

type ChatHubThemeControlProps = {
  theme: CyberTheme;
  onSelect: (theme: CyberTheme) => void;
};

export function ChatHubThemeControl({ theme, onSelect }: ChatHubThemeControlProps) {
  const [open, setOpen] = useState(false);

  const choose = (preset: CyberTheme) => {
    onSelect({ ...theme, ...preset, preset: preset.preset });
    setOpen(false);
  };

  return <>
    <Button
      type="button"
      size="sm"
      variant="outline"
      aria-label={`เปลี่ยนธีมห้องแชท · ${theme.name}`}
      aria-expanded={open}
      onClick={() => setOpen(true)}
      className="chat-tool-action h-8 px-2 sm:px-3"
    >
      <Palette className="h-3.5 w-3.5 sm:mr-1.5" />
      <span className="hidden sm:inline">ธีม</span>
    </Button>
    {open && typeof document !== "undefined" ? createPortal(
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
        role="presentation"
        onClick={() => setOpen(false)}
      >
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-hub-theme-title"
          className="w-full max-w-md rounded-2xl border border-orange-300/30 bg-[#100b07] p-4 text-orange-50 shadow-2xl shadow-orange-950/50"
          onClick={event => event.stopPropagation()}
        >
          <div className="mobile-inbox-theme-panel-head mb-3">
            <div>
              <strong id="chat-hub-theme-title">ธีมห้องแชท</strong>
              <small>เปลี่ยนทั้งพื้นหลังและสีบับเบิ้ล · ใช้ร่วมกับ Mobile Inbox</small>
            </div>
            <button type="button" aria-label="ปิดตัวเลือกธีม" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>
          <div className="mobile-inbox-theme-grid">
            {CYBER_THEME_PRESETS.map(preset => {
              const active = theme.name === preset.name && theme.bg === preset.bg && theme.surface === preset.surface && theme.primary === preset.primary && theme.accent === preset.accent;
              return <button
                type="button"
                key={preset.name}
                className={`mobile-inbox-theme-swatch ${active ? "is-active" : ""}`}
                style={{ "--swatch-bg": preset.bg, "--swatch-primary": preset.primary, "--swatch-accent": preset.accent } as React.CSSProperties}
                aria-pressed={active}
                onClick={() => choose(preset)}
              >
                <span className="mobile-inbox-theme-swatch-light" />
                <span>{preset.name}</span>
                {active ? <Check aria-hidden="true" /> : null}
              </button>;
            })}
          </div>
        </section>
      </div>,
      document.body,
    ) : null}
  </>;
}
