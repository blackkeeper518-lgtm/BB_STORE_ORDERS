import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readBlackboxRoom } from "@/lib/canonical";
import { Activity, ArrowDownRight, ArrowRight, Bot, CalendarDays, ChevronRight, CircleDot, Clock3, ExternalLink, History, MessageCircle, Radio, RefreshCw, Search, ShieldAlert, Skull, Sparkles, Waypoints, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

function money(value: unknown) { const n = Number(value); return Number.isFinite(n) ? `${n.toLocaleString("th-TH", { maximumFractionDigits: 2 })} ฿` : "—"; }
function text(value: unknown, fallback = "—") { const valueText = String(value ?? "").trim(); return valueText || fallback; }
function statusTone(status: string) {
  if (/SUMMARY|BOT/i.test(status)) return "border-pink-300/45 bg-pink-500/15 text-pink-100";
  if (/DUPLICATE/i.test(status)) return "border-fuchsia-300/45 bg-fuchsia-500/15 text-fuchsia-100";
  return "border-violet-200/20 bg-violet-500/10 text-violet-100/75";
}
function statusLabel(status: string) {
  if (/SUMMARY|BOT/i.test(status)) return "บอทสรุป · ต้องเทียบ";
  if (/DUPLICATE/i.test(status)) return "ลายเซ็นซ้ำ · รอผ่า";
  return "ประวัติ · เฝ้าดู";
}
function extractChange(row: any) {
  const decisionMinutes = row.change_decision_minutes || row.decision_minutes || row.change_elapsed_minutes;
  const from = row.changed_from || row.product_before || row.previous_product || row.original_product;
  const to = row.changed_to || row.product_after || row.new_product || row.replacement_product;
  if (from || to) return { from: text(from, "รอบแรก"), to: text(to, "รายการล่าสุด"), changed: true, decisionMinutes };
  const raw = text(row.lab_product_display_text, "ยังไม่มี master_display_for_packer ใน Lab 88");
  const match = raw.match(/(?:เปลี่ยนจาก|จาก)\s*(.+?)\s*(?:เป็น|ไปเป็น|→|ถัดไป)\s*(.+?)(?:\n|$)/i);
  if (match) return { from: match[1].trim(), to: match[2].trim(), changed: true, decisionMinutes };
  return { from: "รายการเดิม", to: raw, changed: false, decisionMinutes };
}
function shortTime(value: unknown) {
  return text(value, "—");
}
function routeValue(row: any) {
  return text(row.bb_express_send_route || row.ST_express_send_route || row.route_reason_emoji || row.source_gate_color, "ไม่ระบุ");
}
function routeLabel(route: string) {
  const labels: Record<string, string> = {
    "⚪": "⚪ ขาว · ผ่านรอบ",
    "⚫": "⚫ ดำ · ต้องตรวจ",
    "⬛": "⬛ ดำ · ต้องตรวจ",
    "🔴": "🔴 แดง · ห้ามส่งซ้ำ",
    "🟥": "🟥 แดง 48 ชม.",
    "👻": "👻 ผี · ตกรอบ",
  };
  return labels[route] || route;
}
function orderVerdict(row: any) {
  if (row.darksideBillDataComplete === true || row.bill_data_complete === true || /^(?:COMPLETE|WHITE_READY)$/i.test(String(row.darkside_completeness_status || row.source_gate_status || ""))) {
    return { label: "✅ ออเดอร์ดี · ข้อมูลครบ", tone: "border-emerald-300/35 bg-emerald-500/10 text-emerald-100" };
  }
  if (row.phone_status === "OK" || row.phone || row.extracted_phone) {
    return { label: "📦 พบสัญญาณออเดอร์", tone: "border-cyan-300/35 bg-cyan-500/10 text-cyan-100" };
  }
  return { label: "⚠️ ต้องตรวจข้อมูล", tone: "border-amber-300/35 bg-amber-500/10 text-amber-100" };
}
function missingReasonText(value: unknown) {
  if (Array.isArray(value)) return value.map(item => text(item, "")).filter(Boolean).join(" · ");
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(item => text(item, "")).filter(Boolean).join(" · ");
    if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
  } catch {
    // n8n may persist this field as plain text instead of JSON.
  }
  return raw;
}
function reasonText(row: any) {
  const missing = missingReasonText(row.darkside_missing_reasons);
  return text(row.bill_data_reason || row.route_reason_label || row.alert_reason || row.reason || row.decision_reason || missing || row.last_chat_text, "ไม่พบเหตุผลจาก n8n");
}
function evidenceText(row: any) {
  return [
    row.customer_message_text || row.customer_latest_message,
    row.page_message_text || row.page_latest_message,
    row.original,
    Array.isArray(row.chat_timeline) ? row.chat_timeline.join("\n") : row.chat_timeline,
  ].filter(Boolean).join("\n\n");
}

export default function BlackboxRoom() {
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const query = useQuery({ queryKey: ["blackbox-room", search], queryFn: () => readBlackboxRoom(search), refetchInterval: 30_000 });
  const rows = query.data ?? [];
  const botCount = rows.filter((r: any) => r.is_bot_summary).length;
  const duplicateCount = rows.filter((r: any) => Number(r.duplicate_signature_count) > 1).length;
  const completeCount = rows.filter((row: any) => orderVerdict(row).label.startsWith("✅")).length;
  const reviewCount = rows.length - completeCount;
  const evidenceCount = rows.filter((row: any) => Boolean(evidenceText(row))).length;
  const hotRows = rows.filter((r: any) => routeValue(r) === "⚫" || routeValue(r) === "⬛").slice(0, 5);

  return <div className="blackbox-receive-room blackbox-room min-h-full space-y-5 p-2 text-white sm:p-4 lg:p-6">
    <header className="blackbox-hero relative overflow-hidden rounded-[2rem] border border-fuchsia-300/25 bg-[#13091d]/90 p-5 shadow-[0_0_70px_rgba(215,45,220,.12)] sm:p-7">
      <div className="hero-scanline" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-fuchsia-300"><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-fuchsia-300/35 bg-fuchsia-400/10"><Skull className="h-4 w-4" /></span><span>BLACKBOX ROOM</span><span className="text-cyan-300/80">· THANATOS</span></div>
          <h1 className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white sm:text-5xl">ห้องตรวจออเดอร์</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-fuchsia-100/60">ออเดอร์ที่ n8n ส่งมาให้คนตรวจต่อ · ดูว่าออเดอร์ครบไหม เข้ามาเพราะอะไร และมีหลักฐานอะไรบ้าง</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-fuchsia-100/65"><span className="rounded-full border border-cyan-300/20 bg-cyan-400/[.06] px-3 py-1">ข้อมูลจาก n8n</span><span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/[.06] px-3 py-1">เว็บไม่ตัดสินแทนระบบ</span><span className="rounded-full border border-emerald-300/20 bg-emerald-400/[.06] px-3 py-1">อัปเดตทุก 30 วิ</span></div>
        </div>
        <div className="flex items-center gap-2"><div className="live-chip"><span className="live-dot" />LIVE · 30s</div><Button variant="outline" onClick={() => query.refetch()} className="border-fuchsia-300/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20"><RefreshCw className={query.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />สแกนใหม่</Button></div>
      </div>
      <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalMetric icon={<Skull />} label="⚫ ในห้องดำ" value={rows.length} color="pink" hint="รายการที่ n8n route มา" />
        <SignalMetric icon={<CircleDot />} label="✅ ออเดอร์ดี" value={completeCount} color="violet" hint="ข้อมูลครบจาก n8n" />
        <SignalMetric icon={<ShieldAlert />} label="⚠️ ต้องตรวจ" value={reviewCount} color="cyan" hint="มีจุดให้เปิดดูต่อ" />
        <SignalMetric icon={<Sparkles />} label="📎 มีหลักฐาน" value={evidenceCount} color="fuchsia" hint="แชท / บิล / ข้อความต้นทาง" />
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 rounded-[1.75rem] border border-fuchsia-300/20 bg-[#0f0919]/90 shadow-[0_0_40px_rgba(141,50,220,.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fuchsia-300/10 p-5 sm:p-6"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300"><History className="h-4 w-4" /> THANATOS LOG · บัญชีดำ</div><p className="mt-1 text-xs text-fuchsia-100/40">ดูว่าออเดอร์เข้าบัญชีดำเพราะอะไร มีหลักฐานอะไร และควรตรวจจุดไหนต่อ</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-fuchsia-100/35" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเพจ / ชื่อ / Order / COD" className="border-fuchsia-300/20 bg-black/30 pl-9 text-white placeholder:text-fuchsia-100/25" /></div></div>
        {query.isError ? <p className="m-5 rounded-xl border border-pink-400/30 bg-pink-400/10 p-4 text-sm text-pink-100">อ่าน Blackbox ไม่สำเร็จ: {String(query.error)}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1240px] text-left text-xs"><thead className="border-b border-fuchsia-300/10 bg-fuchsia-500/[.03] text-[10px] uppercase tracking-[.13em] text-fuchsia-100/40"><tr><th className="p-4">รอยสัญญาณ / ออเดอร์</th><th className="p-4">เพจ / Order</th><th className="p-4">วันที่ · เวลา</th><th className="p-4">หลักฐาน / เหตุผลที่เข้าบัญชีดำ</th><th className="p-4">COD / ประวัติ</th><th className="p-4">เหตุผลที่ห้องสะดุด</th><th className="p-4">ทางต่อ</th></tr></thead><tbody>{rows.map((row: any, index: number) => { const target = String(row.order_number || row.upsert_key || row.id || ""); const q = encodeURIComponent(target); const status = String(row.alert_status ?? ""); const route = routeValue(row); const verdict = orderVerdict(row); return <tr key={`${row.id}-${row.upsert_key}-${index}`} className="trace-row align-top"><td className="p-4"><Badge className={verdict.tone}><CircleDot className="mr-1.5 inline h-3 w-3" />{verdict.label}</Badge><p className="mt-2 text-3xl leading-none" title="เส้นทางจาก n8n">{route}</p><p className="mt-1 font-mono text-[10px] text-fuchsia-100/35">#{String(row.id ?? row.upsert_key ?? "—").slice(0, 16)}</p></td><td className="p-4"><p className="flex items-center gap-2 font-semibold text-white"><span className="page-orb" />{text(row.page_name, "ไม่ระบุเพจ")}</p><p className="mt-2 text-fuchsia-100/75">{text(row.customer_name || row.facebook_name, "ไม่ระบุชื่อ")}</p><p className="mt-1 font-mono text-[10px] text-cyan-200/60">{text(row.phone, "เบอร์ไม่ครบ / ไม่พบ")}</p><p className="mt-1 font-mono text-[10px] text-fuchsia-100/40">{target || "—"}</p></td><td className="p-4"><div className="flex items-start gap-2 text-fuchsia-100/75"><CalendarDays className="mt-0.5 h-3.5 w-3.5 text-cyan-300" /><span>{shortTime(row.order_time_display)}</span></div><p className="mt-1 text-[10px] text-cyan-100/45">เวลาจากบิล: {shortTime(row.order_time_display)}</p><p className="mt-2 flex items-center gap-2 text-[10px] text-fuchsia-100/35"><Clock3 className="h-3 w-3" />{text(row.chat_message_count, "0")} ข้อความในรอยทาง</p></td><td className="p-4"><div className="rounded-xl border border-rose-300/15 bg-rose-400/[.04] p-3"><p className="font-semibold text-rose-100">{reasonText(row)}</p><p className="mt-2 text-[10px] text-cyan-100/50">n8n: {text(row.darkside_completeness_status || row.source_gate_status, "ไม่ระบุ")}</p></div></td><td className="p-4"><p className="font-mono text-sm font-semibold text-amber-200">{money(row.cod_amount ?? row.cod_value ?? row.expected_cod ?? row.final_order_price)}</p><p className="mt-2 text-cyan-200">เบอร์: {text(row.phone || row.extracted_phone, "ไม่พบ")}</p><p className="mt-1 text-[10px] text-fuchsia-100/35">phone_status: {text(row.phone_status, "ไม่ระบุ")} · {text(row.order_source_type, "ไม่ระบุแหล่งที่มา")}</p></td><td className="max-w-xs p-4 text-fuchsia-100/65"><p>{row.is_bot_summary ? "ข้อความนี้มีรอยมือบอท ต้องเทียบกับแชทก่อนส่ง" : Number(row.duplicate_signature_count) > 1 ? `ลายเซ็นเดียวกัน ${row.duplicate_signature_count} รายการ · อาจเป็นการยิงซ้ำ` : "ตรวจจากสัญญาณและฟิว route ของ n8n"}</p><details className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[.04] p-2"><summary className="cursor-pointer text-[10px] font-semibold text-cyan-100">เปิดหลักฐานต้นทาง</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-5 text-cyan-50/70">{evidenceText(row) || "ไม่มีข้อความต้นทางในแถวนี้"}</pre></details></td><td className="p-4"><div className="flex min-w-36 flex-col gap-1.5"><Link href={`/telegram-delivery?room=queue&search=${q}`}><Button size="sm" variant="outline" className="border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20">เข้าคิวรอส่ง <ChevronRight className="ml-auto h-3.5 w-3.5" /></Button></Link><Link href={`/telegram-delivery?room=queue&search=${q}`}><Button size="sm" variant="outline" className="border-cyan-300/30 bg-cyan-500/10 text-cyan-100">เปิดหลักฐาน <ExternalLink className="ml-auto h-3.5 w-3.5" /></Button></Link></div></td></tr>; })}</tbody></table>{!query.isFetching && rows.length === 0 && <div className="p-14 text-center"><Sparkles className="mx-auto h-7 w-7 text-fuchsia-300/50" /><p className="mt-3 text-sm text-fuchsia-100/60">ห้องเงียบ แต่ประตูยังเปิดอยู่</p><p className="mt-1 text-xs text-fuchsia-100/30">ยังไม่มีรอยออเดอร์ที่ตรงกับคำค้นนี้</p></div>}</div>}
      </div>

      <aside className="blackbox-console relative overflow-hidden rounded-[1.75rem] border border-cyan-300/25 bg-[#0b101d]/90 p-5 shadow-[0_0_45px_rgba(46,210,255,.09)]"><div className="console-grid" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-300">SIGNAL CONSOLE</p><h2 className="mt-1 text-xl font-semibold text-white">นาฟิกาความร้อน</h2></div><Activity className="h-5 w-5 text-cyan-300" /></div><div className="radar-wrap mt-6"><div className="radar"><div className="radar-sweep" /><span className="radar-blip blip-one" /><span className="radar-blip blip-two" /><span className="radar-blip blip-three" /><span className="radar-core" /></div><div className="radar-label label-top">LIVE TRACE</div><div className="radar-label label-bottom">BLACKBOX / ST</div></div><div className="mt-6 space-y-3"><ConsoleSignal tone="pink" icon={<ArrowDownRight />} title="รอยมือบอท" value={botCount} detail="ต้องเทียบข้อความกับคำสั่งซื้อ" /><ConsoleSignal tone="violet" icon={<Waypoints />} title="เส้นทางซ้อน" value={duplicateCount} detail="ลายเซ็นสินค้า + COD ชนกัน" /><ConsoleSignal tone="cyan" icon={<MessageCircle />} title="แชทที่ตามได้" value={rows.reduce((sum: number, r: any) => sum + Number(r.chat_message_count || 0), 0)} detail="ข้อความในเส้นทางทั้งหมด" /></div><div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/[.05] p-4"><p className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-cyan-300"><Radio className="h-3.5 w-3.5" /> HOT FEED</p>{hotRows.length ? <div className="mt-3 space-y-3">{hotRows.slice(0, 3).map((row: any, index: number) => <div key={`${row.id}-hot`} className="flex gap-3 border-l border-fuchsia-300/40 pl-3"><span className="font-mono text-[10px] text-fuchsia-300/60">0{index + 1}</span><div><p className="text-xs text-fuchsia-50">{text(row.page_name, "UNKNOWN PAGE")}</p><p className="mt-1 text-[10px] text-cyan-100/45">{row.is_bot_summary ? "บอทสรุป · รอเทียบ" : "ลายเซ็นซ้ำ · รอผ่า"}</p></div></div>)}</div> : <p className="mt-3 text-xs text-cyan-100/45">ไม่มีจุดร้อน · ระบบกำลังเฝ้าประตู</p>}</div></div></aside>
    </section>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-fuchsia-300/15 bg-fuchsia-500/[.04] p-4 text-xs text-fuchsia-100/55"><ShieldAlert className="h-4 w-4 text-fuchsia-300" /><span>BLACKBOX ไม่ใช่ห้องประวัติเปลี่ยนของ — มันคือ Death Note สำหรับออเดอร์ที่ต้องเฝ้าระวัง โดยเปิดหลักฐานให้คนตรวจต่อ</span></div>
  </div>;
}

function SignalMetric({ icon, label, value, color, hint }: { icon: React.ReactNode; label: string; value: number; color: string; hint: string }) { return <div className={`signal-metric signal-${color}`}><div className="flex items-center justify-between"><span className="metric-icon">{icon}</span><span className="font-mono text-2xl font-semibold">{value.toLocaleString("th-TH")}</span></div><p className="mt-3 text-xs font-semibold text-white/85">{label}</p><p className="mt-1 text-[10px] text-white/35">{hint}</p></div>; }
function ConsoleSignal({ icon, title, value, detail, tone }: { icon: React.ReactNode; title: string; value: number; detail: string; tone: string }) { return <div className={`console-signal tone-${tone}`}><div className="console-signal-icon">{icon}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-white/85">{title}</p><span className="font-mono text-sm text-white">{value}</span></div><p className="mt-1 text-[10px] text-white/35">{detail}</p><div className="signal-bar mt-2"><span style={{ width: `${Math.min(100, Math.max(8, value * 18))}%` }} /></div></div></div>; }
