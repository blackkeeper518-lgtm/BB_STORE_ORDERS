import { ExternalLink, PackageSearch, RefreshCw } from "lucide-react";
import { useState } from "react";

const FLASH_WIDGET_URL = "https://www.flashexpress.co.th/fle/widget-tracking";
const FLASH_TRACKING_URL = "https://www.flashexpress.co.th/fle/tracking";

export default function BBTracking() {
  const [widgetVersion, setWidgetVersion] = useState(0);
  const [widgetLoading, setWidgetLoading] = useState(true);

  const refreshWidget = () => {
    setWidgetLoading(true);
    setWidgetVersion(value => value + 1);
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <header className="rounded-2xl border border-cyan-300/20 bg-[#0d1426]/90 p-5 shadow-[0_0_35px_rgba(34,211,238,.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.24em] text-cyan-300/70">BB TRACKING · FLASH EXPRESS</p>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white"><PackageSearch className="h-6 w-6 text-cyan-300" />เช็กเลขพัสดุ</h1>
            <p className="mt-2 text-sm text-white/55">ตรวจสอบสถานะพัสดุ Flash Express จากหน้าเมนูหลักของ BB STORE</p>
          </div>
          <a href={FLASH_TRACKING_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"><ExternalLink className="h-4 w-4" />เปิดหน้า Flash โดยตรง</a>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>{widgetLoading ? "กำลังโหลด Flash Tracking…" : "Flash Tracking พร้อมใช้งาน"}</span>
          <button type="button" onClick={refreshWidget} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-100" aria-label="รีเฟรช Flash Tracking">
            <RefreshCw className={`h-3.5 w-3.5 ${widgetLoading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </div>
        <iframe key={widgetVersion} src={FLASH_WIDGET_URL} title="Flash Express Tracking" className="block h-[520px] w-full border-0" scrolling="auto" loading="lazy" onLoad={() => setWidgetLoading(false)} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100/70">
        <RefreshCw className="h-4 w-4 shrink-0 text-amber-300" />
        หากช่องด้านบนไม่แสดง แปลว่า Flash ป้องกันการฝัง iframe ให้กด “เปิดหน้า Flash โดยตรง” แทนครับ
      </div>
    </section>
  );
}
