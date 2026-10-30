import {
  Archive,
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  FileUp,
  KeyRound,
  MessageCircle,
  PackageCheck,
  RadioTower,
  Send,
  ShieldCheck,
  Skull,
  Sparkles,
  Table2,
  Truck,
  Waypoints,
} from "lucide-react";

const orderSources = [
  {
    icon: "🗝️",
    name: "HERMES_ARCHIVE",
    detail: "ตารางหลักรับออเดอร์ปกติ",
    colors: "⚪ 🟦",
    tone: "cyan",
  },
  {
    icon: "🌀",
    name: "SINGULARITY_xXx_EXCHANGE",
    detail: "ตารางหลักออเดอร์เปลี่ยนของ",
    colors: "🟨 🟠",
    tone: "amber",
  },
  {
    icon: "💀",
    name: "THANATOS_xXx_DEATH_NOTE",
    detail: "ตารางหลักออเดอร์บอททวน",
    colors: "⚫",
    tone: "slate",
  },
];

const parcelStages: Array<{
  icon: string;
  title: string;
  detail: string;
  type: "table" | "view";
}> = [
  {
    icon: "📦",
    title: "parcels",
    detail: "คลังเลขพัสดุเพียงแห่งเดียว · รับไฟล์ขนส่ง",
    type: "table",
  },
  {
    icon: "🔮",
    title: "SHADOW_xXx_RECALL",
    detail: "ดึงเฉพาะเลขที่ยังไม่เป็น 🔥SENT",
    type: "view",
  },
  {
    icon: "🦅",
    title: "ROGUE_xXx_SHIPPINGz",
    detail: "ประกบเลขกับข้อมูลทำบิลจาก ORDERCONTROL",
    type: "view",
  },
  {
    icon: "⛩️",
    title: "VOID_xXx_GATEWAYz",
    detail: "รวมข้อมูล + เลือก Page Token ให้ตรงเพจ",
    type: "view",
  },
];

function ToneBadge({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "amber" | "slate" | "pink";
}) {
  const tones = {
    cyan: "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    amber: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    slate: "border-slate-300/20 bg-slate-400/10 text-slate-100",
    pink: "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function StageCard({
  icon,
  title,
  detail,
  type,
}: {
  icon: string;
  title: string;
  detail: string;
  type: "table" | "view";
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent opacity-60" />
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-xl">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-sm font-semibold tracking-tight text-white">
              {title}
            </h3>
            <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/40">
              {type}
            </span>
          </div>
          <p className="text-xs leading-5 text-slate-300/70">{detail}</p>
        </div>
      </div>
    </div>
  );
}

export default function SystemManual() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070912] text-slate-100">
      <div className="pointer-events-none fixed inset-0 opacity-60 [background-image:radial-gradient(circle_at_12%_8%,rgba(24,185,255,.16),transparent_28%),radial-gradient(circle_at_88%_20%,rgba(194,74,255,.13),transparent_26%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:auto,auto,32px_32px,32px_32px]" />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
        <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#0d1425]/85 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
                <BookOpen className="h-4 w-4" /> DARKSIDE SYSTEM MANUAL ·
                OPERATIONS MAP
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                คู่มือเส้นทางข้อมูล
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/75 sm:text-base">
                แยกหน้าที่ของออเดอร์ เลขพัสดุ Token และประวัติให้ชัดเจน
                เพื่อไม่ให้ข้อมูลข้ามห้องหรือปนกันโดยไม่ตั้งใจ
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
              <ToneBadge tone="cyan">
                <KeyRound className="mr-1.5 h-3.5 w-3.5" /> 🌍
                GALACTIC_GATEWAY_TOKEN
              </ToneBadge>
              <ToneBadge tone="pink">
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> 2 SYSTEM LANES
              </ToneBadge>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-5">
            <Database className="h-5 w-5 text-cyan-300" />
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-cyan-200/55">
              Order System
            </p>
            <p className="mt-1 text-lg font-semibold text-white">ออเดอร์หลัก</p>
            <p className="mt-1 text-xs leading-5 text-slate-300/60">
              รับออเดอร์ แยกสี ทำบิล และคุมคิวส่ง
            </p>
          </div>
          <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.045] p-5">
            <MessageCircle className="h-5 w-5 text-fuchsia-300" />
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-fuchsia-200/55">
              Chat System
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              แชทลูกค้า/เพจ
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-300/60">
              ข้อความอยู่ในห้องแชท ไม่ผูกซ้ำกับบิล
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5">
            <Truck className="h-5 w-5 text-amber-300" />
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-amber-200/55">
              Parcel System
            </p>
            <p className="mt-1 text-lg font-semibold text-white">เลขพัสดุ</p>
            <p className="mt-1 text-xs leading-5 text-slate-300/60">
              รับเลขจากไฟล์ขนส่งและส่งกลับลูกค้า
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-fuchsia-300/15 bg-[#100c1c]/85 p-5 shadow-xl shadow-fuchsia-950/10 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/70">
                LANE 00 · CHAT CORE
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                สายแชทต้นทาง · 2 ห้องแยกกัน
              </h2>
            </div>
            <ToneBadge tone="pink">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> CHAT SYSTEM
            </ToneBadge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <StageCard
              icon="💬"
              title="chat_customer_messages"
              detail="ห้องข้อความที่ลูกค้าส่งเข้ามา เก็บ message_id, thread_id, customer_id, message และเวลา"
              type="table"
            />
            <StageCard
              icon="📣"
              title="chat_page_messages"
              detail="ห้องข้อความที่เพจ/ระบบส่งออก แยกจากข้อความลูกค้า เพื่อไม่ให้ประวัติซ้ำหรือปนกัน"
              type="table"
            />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">
                สิ่งที่สองห้องแชททำ
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                เก็บประวัติสนทนา · กันซ้ำด้วย message_id/dedupe_key ·
                อัปเดตอายุแชทและสิทธิ์ส่ง
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-5 w-5 text-fuchsia-300/60 lg:block" />
            <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] p-4">
              <p className="text-sm font-semibold text-fuchsia-100">
                ส่งข้ามเฉพาะ Signal
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ToneBadge tone="pink">chat_age_hours</ToneBadge>
                <ToneBadge tone="pink">send_facebook_route</ToneBadge>
                <ToneBadge tone="pink">thread_id</ToneBadge>
                <ToneBadge tone="pink">page_id</ToneBadge>
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-2xl border border-red-300/15 bg-red-400/[0.04] p-4 text-xs leading-5 text-red-100/75">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <span>
              <strong className="text-red-200">กฎแยกห้อง:</strong>{" "}
              แชทไม่เก็บซ้ำเป็นออเดอร์, ไม่สร้างเลขพัสดุ, ไม่ยัด
              COD/ที่อยู่/สินค้าเข้าแชท
              และสายออเดอร์ไม่ดึงประวัติแชททั้งก้อนมาปน
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#0b1020]/80 p-5 shadow-xl shadow-black/20 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
                LANE 01 · ORDER CORE
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                สายออเดอร์หลัก
              </h2>
            </div>
            <ToneBadge tone="cyan">🌍 ใช้ Token เดียวทั้งโปรเจกต์</ToneBadge>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {orderSources.map(source => (
              <div
                key={source.name}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{source.icon}</span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-white">
                      {source.name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-300/65">
                      {source.detail}
                    </p>
                    <ToneBadge tone={source.tone as "cyan" | "amber" | "slate"}>
                      {source.colors}
                    </ToneBadge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.035] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200/60">
              <RadioTower className="h-4 w-4" /> MAIN ORDER PIPELINE ·
              ใช้โค้ดอย่างระมัดระวัง
            </div>
            <div className="grid gap-3 xl:grid-cols-[1.1fr_auto_1.25fr_auto_1.25fr_auto_1.1fr] xl:items-center">
              <StageCard
                icon="🌍"
                title="GALACTIC_GATEWAY_TOKEN"
                detail="ตารางปล่อย Token ให้โฟร์ n8n"
                type="table"
              />
              <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300/55 xl:block" />
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="font-mono text-sm font-semibold text-white">
                  รับออเดอร์แยกตามสี
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-300/65">
                  ⚪ 🟦 → HERMES_ARCHIVE
                  <br />
                  🟨 🟠 → SINGULARITY_xXx_EXCHANGE
                </p>
              </div>
              <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300/55 xl:block" />
              <StageCard
                icon="🌌"
                title="MULTIVERSE_xXx_NEXUS"
                detail="วิวรวม 4 สี + ดึงหัวบิลจาก product_master"
                type="view"
              />
              <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300/55 xl:block" />
              <StageCard
                icon="🛰️"
                title="PIONEER_xXx_CAPSULE"
                detail="คิวส่งออเดอร์รวม ⚪ 🟦 🟨 🟠"
                type="view"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300/65">
              <ArrowDown className="hidden h-4 w-4 text-cyan-300/60 sm:block" />
              <span>ส่งต่อเข้า</span>
              <span className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-1 font-mono text-fuchsia-100">
                ANDROMEDA_xXx_SENT
              </span>
              <span>→ ส่งแล้วเด้งออกจากวิวส่ง →</span>
              <span className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-2 py-1 font-mono text-violet-100">
                GENESIS_xXx_HISTORY
              </span>
            </div>
          </div>
          <div className="my-6 flex items-center gap-3 text-cyan-200/40">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-300/20" />
            <Waypoints className="h-5 w-5" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-300/20" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StageCard
              icon="🌌"
              title="MULTIVERSE_xXx_NEXUS"
              detail="วิวกลางรวม ⚪ 🟦 🟨 🟠 และดึง stock_notice จาก product_master"
              type="view"
            />
            <StageCard
              icon="🛒"
              title="product_master"
              detail="แสดงสินค้าในเว็บ และเป็นแหล่งหัวบิลไดนามิก"
              type="table"
            />
            <StageCard
              icon="🛰️"
              title="PIONEER_xXx_CAPSULE"
              detail="วิวคิวส่ง Telegram รวมเฉพาะรายการที่ยังไม่ส่ง"
              type="view"
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StageCard
              icon="🪐"
              title="ANDROMEDA_xXx_SENT"
              detail="วิวห้องส่ง Telegram รวมทุกสี ⚪ 🟦 🟨 🟠"
              type="view"
            />
            <StageCard
              icon="🌟"
              title="GENESIS_xXx_HISTORY"
              detail="วิวบันทึกมรณะ/ออเดอร์จบสถานะ"
              type="view"
            />
            <StageCard
              icon="💀"
              title="THANATOS_xXx_DEATH_NOTE"
              detail="ตารางบอททวน ⚫ สำหรับตรวจสอบซ้ำ"
              type="table"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4 text-xs text-amber-100/80">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              <strong className="text-amber-200">เขียนกลับตามสี:</strong> ⚪ 🟦
              → HERMES_ARCHIVE · 🟨 🟠 → SINGULARITY_xXx_EXCHANGE
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-amber-300/15 bg-[#100f1a]/85 p-5 shadow-xl shadow-black/20 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/70">
                LANE 02 · PARCEL RETURN
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                สายเลขพัสดุ
              </h2>
            </div>
            <ToneBadge tone="amber">
              <FileUp className="mr-1.5 h-3.5 w-3.5" /> ไฟล์ขนส่ง → parcels
            </ToneBadge>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-4">
            {parcelStages.map((stage, index) => (
              <div key={stage.title} className="relative">
                <StageCard {...stage} />
                {index < parcelStages.length - 1 ? (
                  <ArrowRight className="absolute -right-3 top-9 z-10 hidden h-5 w-5 text-amber-300/60 lg:block" />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[0.045] p-5">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-fuchsia-300" />
                <p className="font-mono text-sm font-semibold text-white">
                  page_tokens_vault
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                เก็บ Token ของแต่ละเพจ สำหรับเลือกเส้นทางส่งกลับให้ถูกห้อง
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-6 w-6 text-fuchsia-300/60 lg:block" />
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.045] p-5">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-cyan-300" />
                <p className="font-mono text-sm font-semibold text-white">
                  ส่งกลับห้องแชทลูกค้า
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                VOID รวมเลข + ของทำบิล + Token แล้วให้ n8n ยิงส่ง
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-4 text-xs text-emerald-100/80 sm:flex-row sm:items-center">
            <PackageCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <strong className="text-emerald-200">
                ส่งสำเร็จแล้วอัปเดตกลับที่ parcels เท่านั้น:
              </strong>
              <code className="ml-2 rounded bg-black/30 px-2 py-1 text-[11px] text-emerald-100">
                delivery_status = '🔥SENT'
              </code>
              <code className="ml-2 rounded bg-black/30 px-2 py-1 text-[11px] text-emerald-100">
                sent_at = NOW()
              </code>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-red-300/15 bg-red-400/[0.035] p-6">
            <div className="flex items-center gap-3">
              <Skull className="h-5 w-5 text-red-300" />
              <h2 className="text-lg font-semibold text-white">
                📓 DEAD_xXx_NOTE
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300/70">
              บันทึกสำเร็จหลังส่งเลขแล้ว เก็บชื่อ ลูกค้า เพจ เลขพัสดุ เวลา
              และผลการส่งไว้เป็นประวัติ ไม่ใช่แหล่งคิวที่ต้องส่งซ้ำ
            </p>
          </div>
          <div className="rounded-[2rem] border border-violet-300/15 bg-violet-400/[0.035] p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">
                กฎกันข้อมูลตีกัน
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300/70">
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                parcels เป็นเจ้าของเลขพัสดุและสถานะส่ง
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                ORDERCONTROL เป็นเจ้าของข้อมูลทำบิล
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                ทุก View อ่านสถานะจากต้นทาง ไม่สร้างสำเนาสถานะเอง
              </li>
            </ul>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-5 text-xs text-slate-400/60">
          <span className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> DARKSIDE
            OPERATIONS MAP
          </span>
          <span>คู่มือภายใน · อัปเดตตามโครงสร้างปัจจุบัน</span>
        </footer>
      </div>
    </main>
  );
}
