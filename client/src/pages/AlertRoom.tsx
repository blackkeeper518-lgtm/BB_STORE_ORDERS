import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readBbAlertRoom } from "@/lib/canonical";
import { Activity, ArrowDownRight, ArrowRight, Bot, CalendarDays, ChevronRight, CircleDot, Clock3, ExternalLink, History, MessageCircle, Radio, RefreshCw, Search, ShieldAlert, Sparkles, Waypoints, Zap } from "lucide-react";
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
  const raw = text(row.for_packer_bb_display || row.sniper_x_text_clean, "ยังไม่มีหลักฐานสินค้า");
  const match = raw.match(/(?:เปลี่ยนจาก|จาก)\s*(.+?)\s*(?:เป็น|ไปเป็น|→|ถัดไป)\s*(.+?)(?:\n|$)/i);
  if (match) return { from: match[1].trim(), to: match[2].trim(), changed: true, decisionMinutes };
  return { from: "รายการเดิม", to: raw, changed: false, decisionMinutes };
}
function shortTime(value: unknown) {
  const raw = text(value, "");
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(date);
}

export default function AlertRoom() {
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const query = useQuery({ queryKey: ["bb-alert-room", search], queryFn: () => readBbAlertRoom(search), refetchInterval: 30_000 });
  const rows = query.data ?? [];
  const botCount = rows.filter((r: any) => r.is_bot_summary).length;
  const duplicateCount = rows.filter((r: any) => Number(r.duplicate_signature_count) > 1).length;
  const people = useMemo(() => new Set(rows.map((r: any) => r.person_key).filter(Boolean)).size, [rows]);
  const hotRows = rows.filter((r: any) => r.is_bot_summary || Number(r.duplicate_signature_count) > 1).slice(0, 5);

  return <div className="blackbox-room min-h-full space-y-5 p-2 text-white sm:p-4 lg:p-6">
    <header className="blackbox-hero relative overflow-hidden rounded-[2rem] border border-fuchsia-300/25 bg-[#13091d]/90 p-5 shadow-[0_0_70px_rgba(215,45,220,.12)] sm:p-7">
      <div className="hero-scanline" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-fuchsia-300"><ShieldAlert className="h-4 w-4" /> BLACKBOX ROOM <span className="text-cyan-300/80">/ ORDER TRACE</span></div>
          <h1 className="mt-3 font-mono text-3xl font-semibold tracking-tight text-white sm:text-5xl">ห้องแกะรอยออเดอร์</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-fuchsia-100/60">ทุกออเดอร์มีรอยเท้า · ทุกการเปลี่ยนสินค้ามีลูกศร · ไม่มีหลักฐานชิ้นไหนถูกลบทิ้ง</p>
        </div>
        <div className="flex items-center gap-2"><div className="live-chip"><span className="live-dot" />LIVE · 30s</div><Button variant="outline" onClick={() => query.refetch()} className="border-fuchsia-300/35 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20"><RefreshCw className={query.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />สแกนใหม่</Button></div>
      </div>
      <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SignalMetric icon={<Radio />} label="รายการในห้อง" value={rows.length} color="pink" hint="หลักฐานที่ยังมองเห็น" />
        <SignalMetric icon={<Waypoints />} label="เส้นทางลูกค้า" value={people} color="violet" hint="กลุ่มตัวตนที่ระบบพบ" />
        <SignalMetric icon={<Bot />} label="รอยมือบอท" value={botCount} color="cyan" hint="ข้อความสรุปที่ต้องเทียบ" />
        <SignalMetric icon={<Zap />} label="จุดร้อน" value={duplicateCount} color="fuchsia" hint="ลายเซ็นที่กำลังซ้อน" />
      </div>
    </header>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 rounded-[1.75rem] border border-fuchsia-300/20 bg-[#0f0919]/90 shadow-[0_0_40px_rgba(141,50,220,.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fuchsia-300/10 p-5 sm:p-6"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300"><History className="h-4 w-4" /> TRACE TABLE · รอยเท้าเรียงเวลา</div><p className="mt-1 text-xs text-fuchsia-100/40">ดูว่าเข้าจากเพจไหน เมื่อไหร่ และสินค้าเดินจากอะไรไปอะไร</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-fuchsia-100/35" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาเพจ / ชื่อ / Order / COD" className="border-fuchsia-300/20 bg-black/30 pl-9 text-white placeholder:text-fuchsia-100/25" /></div></div>
        {query.isError ? <p className="m-5 rounded-xl border border-pink-400/30 bg-pink-400/10 p-4 text-sm text-pink-100">อ่าน Blackbox ไม่สำเร็จ: {String(query.error)}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[1240px] text-left text-xs"><thead className="border-b border-fuchsia-300/10 bg-fuchsia-500/[.03] text-[10px] uppercase tracking-[.13em] text-fuchsia-100/40"><tr><th className="p-4">รอยสัญญาณ</th><th className="p-4">เพจ / Order</th><th className="p-4">วันที่ · เวลา</th><th className="p-4">เปลี่ยนสินค้า · เดิม → ใหม่</th><th className="p-4">COD / ประวัติ</th><th className="p-4">เหตุผลที่ห้องสะดุด</th><th className="p-4">ทางต่อ</th></tr></thead><tbody>{rows.map((row: any, index: number) => { const target = String(row.order_number || row.upsert_key || row.id || ""); const q = encodeURIComponent(target); const change = extractChange(row); const status = String(row.alert_status ?? ""); return <tr key={`${row.id}-${row.upsert_key}-${index}`} className="trace-row align-top"><td className="p-4"><Badge className={statusTone(status)}><CircleDot className="mr-1.5 inline h-3 w-3" />{statusLabel(status)}</Badge><p className="mt-2 font-mono text-[10px] text-fuchsia-100/35">#{String(row.id ?? row.upsert_key ?? "—").slice(0, 16)}</p></td><td className="p-4"><p className="flex items-center gap-2 font-semibold text-white"><span className="page-orb" />{text(row.page_name, "ไม่ระบุเพจ")}</p><p className="mt-2 text-fuchsia-100/75">{text(row.customer_name || row.facebook_name, "ไม่ระบุชื่อ")}</p><p className="mt-1 font-mono text-[10px] text-cyan-200/60">{text(row.phone, "เบอร์ไม่ครบ / ไม่พบ")}</p><p className="mt-1 font-mono text-[10px] text-fuchsia-100/40">{target || "—"}</p></td><td className="p-4"><div className="flex items-start gap-2 text-fuchsia-100/75"><CalendarDays className="mt-0.5 h-3.5 w-3.5 text-cyan-300" /><span>{shortTime(row.order_time_display || row.last_chat_at || row.created_at)}</span></div><p className="mt-2 flex items-center gap-2 text-[10px] text-fuchsia-100/35"><Clock3 className="h-3 w-3" />{text(row.chat_message_count, "0")} ข้อความในรอยทาง</p></td><td className="p-4"><div className={`change-route ${change.changed ? "is-changed" : ""}`}><div className="route-node"><span className="route-kicker">รอบแรก</span><span>{change.from}</span></div><div className="neon-arrow"><ArrowRight className="h-5 w-5" /><span>{change.changed ? "เปลี่ยน" : "คงเดิม"}</span>{change.decisionMinutes ? <small>{change.decisionMinutes} นาที</small> : null}</div><div className="route-node route-destination"><span className="route-kicker">ล่าสุด</span><span>{change.to}</span></div></div></td><td className="p-4"><p className="font-mono text-sm font-semibold text-amber-200">{money(row.cod_value)}</p><p className="mt-2 text-cyan-200">{text(row.customer_bill_count, "0")} บิล</p><p className="mt-1 text-[10px] text-fuchsia-100/35">รวมลูกค้า {money(row.customer_cod_total)}</p></td><td className="max-w-xs p-4 text-fuchsia-100/65"><p>{row.is_bot_summary ? "ข้อความนี้มีรอยมือบอท ต้องเทียบกับแชทก่อนส่ง" : Number(row.duplicate_signature_count) > 1 ? `ลายเซ็นเดียวกัน ${row.duplicate_signature_count} รายการ · อาจเป็นการยิงซ้ำ` : "ยังไม่พบจุดร้อน · เก็บไว้เป็นประวัติ"}</p><p className="mt-2 line-clamp-2 text-[10px] text-cyan-100/45">{text(row.last_chat_text, "ไม่มีแชทล่าสุด")}</p></td><td className="p-4"><div className="flex min-w-36 flex-col gap-1.5"><Link href={`/telegram-delivery?room=queue&search=${q}`}><Button size="sm" variant="outline" className="border-fuchsia-300/30 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20">เข้าคิวรอส่ง <ChevronRight className="ml-auto h-3.5 w-3.5" /></Button></Link><Link href={`/telegram-delivery?room=queue&search=${q}`}><Button size="sm" variant="outline" className="border-cyan-300/30 bg-cyan-500/10 text-cyan-100">เปิดหลักฐาน <ExternalLink className="ml-auto h-3.5 w-3.5" /></Button></Link></div></td></tr>; })}</tbody></table>{!query.isFetching && rows.length === 0 && <div className="p-14 text-center"><Sparkles className="mx-auto h-7 w-7 text-fuchsia-300/50" /><p className="mt-3 text-sm text-fuchsia-100/60">ห้องเงียบ แต่ประตูยังเปิดอยู่</p><p className="mt-1 text-xs text-fuchsia-100/30">ยังไม่มีรอยออเดอร์ที่ตรงกับคำค้นนี้</p></div>}</div>}
      </div>

      <aside className="blackbox-console relative overflow-hidden rounded-[1.75rem] border border-cyan-300/25 bg-[#0b101d]/90 p-5 shadow-[0_0_45px_rgba(46,210,255,.09)]"><div className="console-grid" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-300">SIGNAL CONSOLE</p><h2 className="mt-1 text-xl font-semibold text-white">นาฟิกาความร้อน</h2></div><Activity className="h-5 w-5 text-cyan-300" /></div><div className="radar-wrap mt-6"><div className="radar"><div className="radar-sweep" /><span className="radar-blip blip-one" /><span className="radar-blip blip-two" /><span className="radar-blip blip-three" /><span className="radar-core" /></div><div className="radar-label label-top">LIVE TRACE</div><div className="radar-label label-bottom">BLACKBOX / BB</div></div><div className="mt-6 space-y-3"><ConsoleSignal tone="pink" icon={<ArrowDownRight />} title="รอยมือบอท" value={botCount} detail="ต้องเทียบข้อความกับคำสั่งซื้อ" /><ConsoleSignal tone="violet" icon={<Waypoints />} title="เส้นทางซ้อน" value={duplicateCount} detail="ลายเซ็นสินค้า + COD ชนกัน" /><ConsoleSignal tone="cyan" icon={<MessageCircle />} title="แชทที่ตามได้" value={rows.reduce((sum: number, r: any) => sum + Number(r.chat_message_count || 0), 0)} detail="ข้อความในเส้นทางทั้งหมด" /></div><div className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-400/[.05] p-4"><p className="flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-cyan-300"><Radio className="h-3.5 w-3.5" /> HOT FEED</p>{hotRows.length ? <div className="mt-3 space-y-3">{hotRows.slice(0, 3).map((row: any, index: number) => <div key={`${row.id}-hot`} className="flex gap-3 border-l border-fuchsia-300/40 pl-3"><span className="font-mono text-[10px] text-fuchsia-300/60">0{index + 1}</span><div><p className="text-xs text-fuchsia-50">{text(row.page_name, "UNKNOWN PAGE")}</p><p className="mt-1 text-[10px] text-cyan-100/45">{row.is_bot_summary ? "บอทสรุป · รอเทียบ" : "ลายเซ็นซ้ำ · รอผ่า"}</p></div></div>)}</div> : <p className="mt-3 text-xs text-cyan-100/45">ไม่มีจุดร้อน · ระบบกำลังเฝ้าประตู</p>}</div></div></aside>
    </section>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-fuchsia-300/15 bg-fuchsia-500/[.04] p-4 text-xs text-fuchsia-100/55"><ShieldAlert className="h-4 w-4 text-fuchsia-300" /><span>BLACKBOX ไม่ฟันธงว่าแถวไหนเป็นบิลจริง — มันเปิดรอยทางให้คนผ่าเอง: แชท, เพจ, เวลา, สินค้า และ COD ต้องมองพร้อมกัน</span></div>
  </div>;
}

function SignalMetric({ icon, label, value, color, hint }: { icon: React.ReactNode; label: string; value: number; color: string; hint: string }) { return <div className={`signal-metric signal-${color}`}><div className="flex items-center justify-between"><span className="metric-icon">{icon}</span><span className="font-mono text-2xl font-semibold">{value.toLocaleString("th-TH")}</span></div><p className="mt-3 text-xs font-semibold text-white/85">{label}</p><p className="mt-1 text-[10px] text-white/35">{hint}</p></div>; }
function ConsoleSignal({ icon, title, value, detail, tone }: { icon: React.ReactNode; title: string; value: number; detail: string; tone: string }) { return <div className={`console-signal tone-${tone}`}><div className="console-signal-icon">{icon}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-white/85">{title}</p><span className="font-mono text-sm text-white">{value}</span></div><p className="mt-1 text-[10px] text-white/35">{detail}</p><div className="signal-bar mt-2"><span style={{ width: `${Math.min(100, Math.max(8, value * 18))}%` }} /></div></div></div>; }
