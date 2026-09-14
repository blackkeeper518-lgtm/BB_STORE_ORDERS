import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearSupabaseConfig, getActiveCamp, getSupabase, getSupabaseConfig, saveSupabaseConfig, setActiveCamp, type Camp } from "@/lib/canonical";
import { CheckCircle2, Database, Loader2, LockKeyhole, XCircle } from "lucide-react";

type RoomStatus = "idle" | "testing" | "ok" | "error";
type RoomCheck = { name: string; label: string; status: RoomStatus; detail: string };

const roomDefinitions = [
  { name: "canonical_orders", label: "ห้องแม่ออเดอร์" },
  { name: "canonical_order_items", label: "ห้องรายการสินค้า" },
  { name: "chat_customer_messages", label: "ห้องแชทลูกค้า" },
  { name: "chat_page_messages", label: "ห้องแชทจากเพจ" },
  { name: "product_master", label: "ห้องสินค้า Master" },
  { name: "inventory", label: "ห้องคลัง StockRoom" },
  { name: "product_aliases", label: "ห้อง Alias" },
  { name: "product_map_master", label: "ห้อง Product Map Master" },
  { name: "page_tokens_vault", label: "ห้อง Token (ไม่อ่านจากหน้าเว็บ)" },
  { name: "vw_orders_web_all_fields", label: "View หน้าบ้าน" },
  { name: "vw_orders_web_chat", label: "View ห้อง Chat" },
];

function freshChecks(): RoomCheck[] {
  return roomDefinitions.map(room => ({ ...room, status: "idle", detail: "ยังไม่ได้ตรวจ" }));
}

export default function ConnectSupabase() {
  const camp: Camp = getActiveCamp();
  const existing = getSupabaseConfig(camp);
  const [url, setUrl] = useState(existing?.url || "");
  const [anonKey, setAnonKey] = useState(existing?.anonKey || "");
  const [table, setTable] = useState(existing?.orderTable || "vw_bb_orders_all_v2");
  const [status, setStatus] = useState<RoomStatus>("idle");
  const [message, setMessage] = useState("");
  const [checks, setChecks] = useState<RoomCheck[]>(freshChecks);

  const test = async () => {
    setStatus("testing");
    setMessage("");
    setChecks(freshChecks().map(check => ({ ...check, status: "testing", detail: "กำลังตรวจ…" })));
    try {
      const cleanUrl = url.trim().replace(/\/$/, "");
      const cleanKey = anonKey.trim();
      if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cleanUrl)) throw new Error("Supabase URL ต้องเป็นรูปแบบ https://ชื่อโปรเจกต์.supabase.co");
      if (!cleanKey) throw new Error("กรุณาวาง Anon/Publishable Key ก่อน");
      if (/service_role|secret/i.test(cleanKey)) throw new Error("ห้ามใช้ service-role หรือ secret key ในหน้าเว็บ ให้ใช้ Anon/Publishable Key");

      saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey, orderTable: table.trim() || "vw_bb_orders_all_v2" }, camp);
      const api = getSupabase();
      if (!api) throw new Error("สร้าง Supabase client ไม่สำเร็จ");

      const nextChecks = await Promise.all(checks.map(async check => {
        if (check.name === "page_tokens_vault") return { ...check, status: "idle" as const, detail: "เก็บไว้ฝั่ง server ไม่อ่าน Token จากหน้าเว็บ" };
        const { count, error } = await api.from(check.name).select("*", { count: "exact", head: true });
        if (error) return { ...check, status: "error" as const, detail: error.message };
        return { ...check, status: "ok" as const, detail: `${count ?? 0} แถว · อ่านได้` };
      }));
      const okCount = nextChecks.filter(check => check.status === "ok").length;
      const errorCount = nextChecks.filter(check => check.status === "error").length;
      setChecks(nextChecks);
      setStatus(errorCount ? "error" : "ok");
      setMessage(`บันทึกค่าไว้ใน browser เครื่องนี้แล้ว · ผ่าน ${okCount} ห้อง${errorCount ? ` · ขาด/อ่านไม่ได้ ${errorCount} ห้อง` : ""}`);
    } catch (error) {
      setStatus("error");
      setChecks(freshChecks().map(check => ({ ...check, status: "error", detail: "ยังไม่ได้ตรวจเพราะค่าการเชื่อมต่อไม่ผ่าน" })));
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const clear = () => {
    clearSupabaseConfig(camp);
    setUrl("");
    setAnonKey("");
    setTable("vw_bb_orders_all_v2");
    setStatus("idle");
    setMessage("ล้างค่าการเชื่อมต่อออกจาก browser เครื่องนี้แล้ว");
    setChecks(freshChecks());
  };


  return <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4"><Card className="w-full max-w-3xl rounded-3xl border-cyan-400/20 bg-[#100c19] cyber-glow"><CardHeader><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300"><Database className="h-4 w-4" /> MANUS3 · CONNECT</div><CardTitle className="text-2xl text-white">เชื่อมต่อฐานของค่ายนี้</CardTitle><p className="text-sm leading-6 text-violet-100/55">Deployment นี้เชื่อมต่อเฉพาะฐานข้อมูลของค่ายนี้เท่านั้น</p></CardHeader><CardContent className="space-y-5"><label className="block text-xs text-violet-100/60">SUPABASE URL<Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-project.supabase.co" className="mt-1 border-cyan-400/20 bg-black/30 text-white" /></label><label className="block text-xs text-violet-100/60">SUPABASE ANON KEY<textarea value={anonKey} onChange={e => setAnonKey(e.target.value)} placeholder="eyJ... หรือ sb_publishable_..." className="mt-1 min-h-28 w-full rounded-xl border border-cyan-400/20 bg-black/30 p-3 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-cyan-400/20" /></label><label className="block text-xs text-violet-100/60">TABLE NAME หลัก<Input value={table} onChange={e => setTable(e.target.value)} className="mt-1 border-cyan-400/20 bg-black/30 font-mono text-white" /></label><div className="grid gap-2 sm:grid-cols-2"><Button onClick={test} disabled={status === "testing"} className="w-full bg-gradient-to-r from-cyan-500 to-fuchsia-600 text-white">{status === "testing" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}เชื่อมต่อค่าย {camp} และกวาดสถานะ</Button><Button type="button" variant="outline" onClick={clear} className="w-full border-red-400/20 bg-red-400/5 text-red-200">ล้างค่าค่าย {camp}</Button></div>{status !== "idle" && <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${status === "ok" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : status === "error" ? "border-red-400/25 bg-red-400/10 text-red-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"}`}>{status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : status === "error" ? <XCircle className="mt-0.5 h-4 w-4" /> : <Loader2 className="mt-0.5 h-4 w-4 animate-spin" />}<span>{status === "testing" ? "กำลังกวาดสถานะห้อง…" : message}</span></div>}<div className="rounded-2xl border border-violet-400/15 bg-black/20 p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-violet-100"><LockKeyhole className="h-4 w-4 text-cyan-300" />สถานะห้องของ Deployment นี้</div><div className="grid gap-2 sm:grid-cols-2">{checks.map(check => <div key={check.name} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"><div className="min-w-0"><p className="font-mono text-xs text-violet-100">{check.name}</p><p className="mt-1 text-[11px] text-violet-100/45">{check.label}</p><p className="mt-1 break-words text-[11px] text-violet-100/35">{check.detail}</p></div><span className={`shrink-0 text-xs font-semibold ${check.status === "ok" ? "text-emerald-300" : check.status === "error" ? "text-red-300" : check.status === "testing" ? "text-cyan-300" : "text-violet-100/35"}`}>{check.status === "ok" ? "เชื่อมแล้ว" : check.status === "error" ? "ไม่พบ/อ่านไม่ได้" : check.status === "testing" ? "กำลังตรวจ" : check.name === "page_tokens_vault" ? "ล็อกไว้" : "ยังไม่ตรวจ"}</span></div>)}</div></div></CardContent></Card></div>;
}
