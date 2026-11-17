import {
  Archive,
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Download,
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
    detail: "ตารางหลักสำหรับจัดเก็บออเดอร์ทั่วไปในเส้นทางสีขาวและสีน้ำเงิน",
    colors: "⚪ 🟦",
    tone: "cyan",
  },
  {
    icon: "🌀",
    name: "SINGULARITY_xXx_EXCHANGE",
    detail: "ตารางหลักสำหรับจัดเก็บออเดอร์เปลี่ยนหรือเคลมสินค้าในเส้นทางสีเหลืองและสีส้ม",
    colors: "🟨 🟠",
    tone: "amber",
  },
  {
    icon: "💀",
    name: "THANATOS_xXx_DEATH_NOTE",
    detail: "ตารางหลักสำหรับจัดเก็บรายการที่ระบบบอทส่งกลับมาตรวจสอบซ้ำในเส้นทางสีดำ",
    colors: "⚫",
    tone: "slate",
  },
];

const livePipelines = [
  { icon: "💬", name: "👑BB_CHAT", detail: "สายแชท เก็บและส่งต่อเหตุการณ์สนทนาของลูกค้าและเพจ", tone: "pink" as const },
  { icon: "🧾", name: "👑BB_ORDER_SYSTEMS", detail: "ออเดอร์หลัก รับและประกอบข้อมูลออเดอร์ สินค้า COD และคีย์กลาง", tone: "cyan" as const },
  { icon: "📦", name: "👑BB_EXPRESS_ORDERS", detail: "ส่งออเดอร์เข้าแพ็ก เตรียมข้อมูลสินค้า จำนวน และ COD ให้ฝ่ายแพ็ก", tone: "amber" as const },
  { icon: "📡", name: "👑BB_SIGNALS", detail: "สายสัญญาณออเดอร์และแชทล่าสุดสำหรับส่งต่อสถานะการทำงาน", tone: "slate" as const },
  { icon: "🚚", name: "👑BB_TRACK", detail: "สายส่งเลข ดึงเลขจาก parcels จับคู่กับออเดอร์ และสร้างข้อความแจ้งเลข", tone: "amber" as const },
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
    detail: "ตารางศูนย์กลางสำหรับรับและจัดเก็บข้อมูลเลขพัสดุจากไฟล์ของผู้ให้บริการขนส่ง",
    type: "table",
  },
  {
    icon: "🔮",
    title: "SHADOW_xXx_RECALL",
    detail: "วิวที่คัดเลือกเฉพาะรายการซึ่งยังไม่ได้บันทึกสถานะการส่งสำเร็จ",
    type: "view",
  },
  {
    icon: "🦅",
    title: "ROGUE_xXx_SHIPPINGz",
    detail: "วิวที่รวมเลขพัสดุกับข้อมูลออเดอร์ที่จำเป็นต่อการจัดทำข้อความส่ง",
    type: "view",
  },
  {
    icon: "⛩️",
    title: "VOID_xXx_GATEWAYz",
    detail: "วิวปลายทางที่รวมข้อมูลและเลือกโทเคนของเพจให้ตรงกับผู้รับข้อความ",
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
                แผนผังสถาปัตยกรรมข้อมูลและกระบวนการปฏิบัติงาน
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300/75 sm:text-base">
                เอกสารอ้างอิงสำหรับแสดงเส้นทางข้อมูล เจ้าของข้อมูล และหน้าที่ของตารางและวิว
                ในระบบออเดอร์ ระบบแชท และระบบส่งเลขพัสดุ เพื่อป้องกันการใช้ข้อมูลข้ามขอบเขต
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
              รับข้อมูลออเดอร์ แยกเส้นทางตามสถานะสี จัดเตรียมข้อมูลสำหรับส่ง และควบคุมคิวการดำเนินงาน
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
              จัดเก็บข้อความลูกค้าและเพจแยกจากข้อมูลออเดอร์ เพื่อป้องกันการบันทึกข้อมูลซ้ำ
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5">
            <Truck className="h-5 w-5 text-amber-300" />
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-amber-200/55">
              Parcel System
            </p>
            <p className="mt-1 text-lg font-semibold text-white">เลขพัสดุ</p>
            <p className="mt-1 text-xs leading-5 text-slate-300/60">
              รับข้อมูลเลขพัสดุ ประกอบข้อมูลที่จำเป็น และส่งกลับไปยังแชทของลูกค้า
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-emerald-300/15 bg-[#091916]/85 p-5 shadow-xl shadow-emerald-950/10 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                LIVE ARCHITECTURE · FIVE LANES
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">โครงสร้าง 5 สายของระบบปัจจุบัน</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/70">
                แต่ละสายแยกหน้าที่กันชัดเจน และใช้ <code className="rounded bg-black/30 px-1.5 py-0.5 text-emerald-200">chat_link_key</code> เป็นคีย์กลางเดียวกันเมื่อจำเป็นต้องเชื่อมข้อมูล
              </p>
            </div>
            <ToneBadge tone="cyan"><KeyRound className="mr-1.5 h-3.5 w-3.5" /> SHARED KEY · chat_link_key</ToneBadge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {livePipelines.map((lane, index) => (
              <div key={lane.name} className="relative rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-xl">{lane.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-emerald-300/55">0{index + 1}</p>
                    <p className="mt-0.5 break-words font-mono text-sm font-semibold text-white">{lane.name}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-300/65">{lane.detail}</p>
                <div className="mt-3"><ToneBadge tone={lane.tone}>chat_link_key เดียวกัน</ToneBadge></div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.045] p-4">
              <p className="text-sm font-semibold text-fuchsia-100">แหล่งข้อมูลแชท</p>
              <p className="mt-1 text-xs leading-5 text-slate-300/65">BB_CHAT เป็นสายเหตุการณ์สนทนา ไม่ใช่แหล่งเลขพัสดุ</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
              <p className="text-sm font-semibold text-cyan-100">แหล่งข้อมูลออเดอร์</p>
              <p className="mt-1 text-xs leading-5 text-slate-300/65">BB_ORDER_SYSTEMS เป็นแหล่งข้อมูลหลักของลูกค้า สินค้า และ COD</p>
            </div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4">
              <p className="text-sm font-semibold text-amber-100">แหล่งข้อมูลเลขพัสดุ</p>
              <p className="mt-1 text-xs leading-5 text-slate-300/65">BB_TRACK ใช้เลขจาก parcels และจับคู่กับออเดอร์ด้วยข้อมูลที่กำหนด</p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-fuchsia-300/15 bg-[#100c1c]/85 p-5 shadow-xl shadow-fuchsia-950/10 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/70">
                LANE 00 · CHAT CORE
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                สายแชทต้นทางและการจัดเก็บข้อความแยกตามผู้ส่ง
              </h2>
            </div>
            <ToneBadge tone="pink">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> CHAT SYSTEM
            </ToneBadge>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <StageCard
              icon="🌠"
              title="🌠BINARY_xXx_MATRIX"
              detail="วิวรวม Cust/Pg chat ด้วย UNION ALL; ChatHub อ่านจากวิวนี้เพียงจุดเดียว โดย message_text เป็นเนื้อหารายข้อความและ source_side แยกผู้ส่ง"
              type="view"
            />
            <StageCard
              icon="💬"
              title="Cust_Chat⭐BINARY_xXx_STAR"
              detail="ตารางต้นทางข้อความขาเข้าจากลูกค้า; message_text เป็นเนื้อหาหลัก, thread_id/chat_link_key เชื่อมห้อง และ phone ใช้ค้นหา ไม่ใช่คีย์กันซ้ำ"
              type="table"
            />
            <StageCard
              icon="📣"
              title="Pg_Chat⭐BINARY_xXx_STAR"
              detail="ตารางต้นทางข้อความขาออกจากเพจ แยกจากข้อความลูกค้า; message_text เป็นเนื้อหาหลัก และ message_id ใช้ระบุข้อความ"
              type="table"
            />
            <StageCard
              icon="🌓"
              title="🌓VAGABOND_xXx_DISMISS"
              detail="วิวสรุปข้อความเคสปิดงาน/ยกเลิก พร้อมข้อมูลพื้นที่และผู้ขนส่งที่พบจากแถวข้อความ"
              type="view"
            />
            <StageCard
              icon="🏴‍☠️"
              title="🏴‍☠️SIRIUS_xXx_CRASH"
              detail="ตารางเก็บบันทึกหรือสถานะที่ดูแลต่อสำหรับเคส โดย case_id ใช้เชื่อมกับเคสจากวิว"
              type="table"
            />
            <StageCard
              icon="🌈"
              title="🌈MILKY_WAY_xXx_TOKEN _PAGE"
              detail="คลัง Meta Page Token keyed ด้วย page_id; อ่านเฉพาะฝั่ง server ด้วย CHAT service-role และไม่เปิด token ให้ browser"
              type="table"
            />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold text-white">
                ขอบเขตการทำงานของระบบแชท
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                จัดเก็บประวัติสนทนา ป้องกันข้อความซ้ำด้วย message_id หรือ dedupe_key
                และคำนวณข้อมูลอายุแชทกับสิทธิ์การส่งตามเงื่อนไขของระบบ
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-5 w-5 text-fuchsia-300/60 lg:block" />
            <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/[0.06] p-4">
              <p className="text-sm font-semibold text-fuchsia-100">
                ข้อมูลสัญญาณที่อนุญาตให้ระบบอื่นใช้งาน
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
              <strong className="text-red-200">หลักเกณฑ์การแยกข้อมูล:</strong>{" "}
              ระบบแชทไม่ทำหน้าที่จัดเก็บออเดอร์หรือสร้างเลขพัสดุ และไม่ควรนำ COD ที่อยู่ หรือรายละเอียดสินค้า
              มาบันทึกซ้ำในตารางข้อความ ส่วนระบบออเดอร์จะไม่ดึงประวัติแชททั้งหมดมาปนเป็นข้อมูลออเดอร์
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
                สายงานออเดอร์หลัก
              </h2>
            </div>
            <ToneBadge tone="cyan">🌍 ใช้โทเคนตามขอบเขตโครงการ</ToneBadge>
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
              เส้นทางประมวลผลออเดอร์หลัก
            </div>
            <div className="grid gap-3 xl:grid-cols-[1.1fr_auto_1.25fr_auto_1.25fr_auto_1.1fr] xl:items-center">
              <StageCard
                icon="🌍"
                title="GALACTIC_GATEWAY_TOKEN"
                detail="ตารางสำหรับจัดเก็บและจัดการโทเคนที่กระบวนการ n8n ใช้เชื่อมต่อระบบ"
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
                detail="วิวศูนย์กลางที่รวมออเดอร์ทั้งสี่เส้นทาง และเชื่อมข้อมูลสินค้าจาก product_master ตามโครงสร้างที่กำหนด"
                type="view"
              />
              <ArrowRight className="mx-auto hidden h-5 w-5 text-cyan-300/55 xl:block" />
              <StageCard
                icon="🛰️"
                title="PIONEER_xXx_CAPSULE"
                detail="วิวคิวสำหรับจัดเรียงออเดอร์ทั้งสี่เส้นทางก่อนส่งต่อไปยังกระบวนการ Telegram"
                type="view"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300/65">
              <ArrowDown className="hidden h-4 w-4 text-cyan-300/60 sm:block" />
              <span>ส่งต่อไปยัง</span>
              <span className="rounded-lg border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-1 font-mono text-fuchsia-100">
                ANDROMEDA_xXx_SENT
              </span>
              <span>→ เมื่อส่งสำเร็จ ระบบจะนำรายการออกจากคิวส่ง →</span>
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
              detail="วิวศูนย์กลางสำหรับรวมข้อมูลออเดอร์และข้อมูลสินค้าที่ผ่านการประมวลผลจากต้นทาง"
              type="view"
            />
            <StageCard
              icon="🛒"
              title="product_master"
              detail="ตารางข้อมูลสินค้าและสถานะสต๊อกสำหรับการแสดงผลในระบบที่ได้รับอนุญาต"
              type="table"
            />
            <StageCard
              icon="🛰️"
              title="PIONEER_xXx_CAPSULE"
              detail="วิวคิวส่ง Telegram ที่คัดเฉพาะรายการซึ่งยังไม่มีสถานะส่งสำเร็จ"
              type="view"
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StageCard
              icon="🪐"
              title="ANDROMEDA_xXx_SENT"
              detail="วิวสำหรับรายการที่ผ่านกระบวนการส่ง Telegram ของทั้งสี่เส้นทาง"
              type="view"
            />
            <StageCard
              icon="🌟"
              title="GENESIS_xXx_HISTORY"
              detail="วิวประวัติถาวรสำหรับออเดอร์ที่ดำเนินการเสร็จสิ้นและไม่อยู่ในคิวส่ง"
              type="view"
            />
            <StageCard
              icon="💀"
              title="THANATOS_xXx_DEATH_NOTE"
              detail="ตารางสำหรับจัดเก็บรายการที่ต้องทบทวนหรือตรวจสอบสถานะออเดอร์ซ้ำ"
              type="table"
            />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-4 text-xs text-amber-100/80">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-300" />
            <span>
              <strong className="text-amber-200">หลักการเขียนข้อมูลกลับ:</strong>{" "}
              ระบบต้องเขียนกลับไปยังตารางต้นทางตามเส้นทางที่กำหนด โดยสีขาวและสีน้ำเงินเขียนไปที่ HERMES_ARCHIVE
              ส่วนสีเหลืองและสีส้มเขียนไปที่ SINGULARITY_xXx_EXCHANGE
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
                สายงานเลขพัสดุและการแจ้งกลับลูกค้า
              </h2>
            </div>
            <ToneBadge tone="amber">
              <FileUp className="mr-1.5 h-3.5 w-3.5" /> ไฟล์ขนส่งเข้าสู่ parcels
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
                  🌈MILKY_WAY_xXx_TOKEN _PAGE
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                จัดเก็บ Meta Page Token ตาม page_id สำหรับ server ใช้ส่งข้อความกลับ ห้ามอ่านหรือเก็บ token ใน browser
              </p>
            </div>
            <ArrowRight className="mx-auto hidden h-6 w-6 text-fuchsia-300/60 lg:block" />
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.045] p-5">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-cyan-300" />
                <p className="font-mono text-sm font-semibold text-white">
                  ส่งเลขพัสดุกลับไปยังแชทลูกค้า
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                VOID รวมเลขพัสดุ ข้อมูลออเดอร์ และโทเคนเพจ จากนั้นส่งต่อให้ n8n ดำเนินการเรียก API
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-col items-start gap-3 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-4 text-xs text-emerald-100/80 sm:flex-row sm:items-center">
            <PackageCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <strong className="text-emerald-200">
                เมื่อส่งสำเร็จ ให้ปรับปรุงสถานะกลับที่ parcels เท่านั้น:
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

        <section className="mt-8 rounded-[2rem] border border-fuchsia-300/15 bg-[#100d1b]/90 p-5 shadow-xl shadow-fuchsia-950/10 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300/70">
                DARKSIDE SIGNAL MANUAL · N8N DECIDES
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                ระบบบ้าน ๆ แต่ทรงพลัง · คู่มืออีโมจิและฟิวด์ไดนามิก
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/70">
                n8n เป็นผู้คัดและคำนวณสถานะทั้งหมด ส่วนหน้าเว็บทำหน้าที่อ่านค่าที่คำนวณเสร็จแล้วมาแสดงผลเท่านั้น
                ห้ามสร้างสถานะซ้ำจากเวลา ชื่อออเดอร์ หรือการเดาในหน้าเว็บ
              </p>
            </div>
            <ToneBadge tone="pink">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" /> อ่านฟิวด์ตรง ๆ
            </ToneBadge>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              ["⚪", "WHITE · ออเดอร์ใหม่", "(13 items) กลุ่มที่ผ่าน Switch แรกและไปต่อได้"],
              ["🔴", "RED · ขอเลขเกิน 48 ชม.", "(14 items) ลูกค้าขอเลขเกิน 48 ชั่วโมง เป็นสถานะที่ n8n คัดไว้"],
              ["🟥", "DARK RED · ขอเลขใน 48 ชม.", "ส่งสัญญาณให้ยิงเลขหาลูกค้าทันที"],
              ["⚫", "BLACK · บอททวน/ไม่สมบูรณ์", "(4 items) packer_obj ขาดข้อมูล จึงเป็นออเดอร์บอททวน"],
              ["👻", "GHOST · วันเก่า", "(6 items) ออเดอร์จากวันเก่าที่ไม่ผ่าน Switch แรก"],
              ["💌", "TRACKING_REQUEST1", "ดักเลขพัสดุที่ส่งแล้วและคำขอเลข เพื่อกันการส่งซ้ำ"],
            ].map(([emoji, title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{emoji}</span>
                  <p className="text-sm font-semibold text-white">{title}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-300/65">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-red-300/15 bg-red-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">🔺 DARKSIDE LV7 · คัดบิล</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                ตรวจว่า packer_obj สมบูรณ์หรือไม่ ออเดอร์ที่ดึงขึ้นมาทุกใบยังเป็นออเดอร์ ไม่มีการทิ้งเป็นขยะ
                เพียงแต่บริบทของใบสมบูรณ์กับใบที่ต้องทวนต่างกัน
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-red-100/80">
                packer_obj → ⚪ / ⚫
              </code>
            </div>
            <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">🛡️ THE GOD GATEKEEPER V.1</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                จาก Switch แรกมีเพียง ⚪ ที่ผ่านไปยังด่านถัดไป ส่วนสถานะ 🔴/🟥/⚫/👻 ถูก n8n แยกเหตุผลและเส้นทางไว้แล้ว
                จากนั้นจึงตรวจวันที่และรอบส่งของออเดอร์สีขาว ส่วน marker ว่ามีคู่และลำดับคู่จะถูกเตรียมไว้ให้ Switch 2 แยกต่อ
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-cyan-100/80">
                Switch 1: ⚪ เท่านั้นที่ผ่านต่อ
                <br />
                1/2 · 2/2 · 1/3 · 2/3 · 3/3 = 💞 PAIRED
                <br />
                ใบเดียวจริง = 💔 SINGLE
              </code>
            </div>
            <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">💌 TRACKING_REQUEST1</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                ดักทั้งเลขพัสดุที่ส่งไปแล้วและคำขอเลขจากลูกค้า ถ้าไม่สกัดสัญญาณนี้ออก อาจถูกมองเป็นก้อนออเดอร์และส่งเลขซ้ำ
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-amber-100/80">
                tracking sent / customer asks tracking
              </code>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">👑 MASTER ADDRESS CASCADE 3 SYSTEMS</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                โหนดคัดฟิวด์ที่อยู่ด้วยคะแนนฟิโบ โดยผ่าฟิวด์ที่อยู่แต่ละส่วนออกมากางให้เห็นอย่างโปร่งใส
                แล้วให้คะแนนตามข้อมูลที่พบ ไม่ใช่การตัดสินจากข้อความรวมก้อนเดียว
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-emerald-100/80">
                address fields → แยกส่วน → FIBO score
              </code>
            </div>
            <div className="rounded-2xl border border-yellow-300/15 bg-yellow-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">✨🌟 TELEGRAM_GOLDEN_TOP1</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                โหนดตัดฟิวด์สินค้าและทำแมปสินค้าตั้งแต่ต้นทาง แม้ข้อมูลจะมาหลายรูปแบบก็ผ่าข้อความเป็นบรรทัด
                พลิกซ้าย พลิกขวา และจัดรูปใหม่จนหาแมปสินค้าได้ โดยไม่ผูกกับสินค้าชนิดใดชนิดหนึ่ง
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-yellow-100/80">
                product fields → หั่นบรรทัด → map ทุกชนิด
              </code>
            </div>
            <div className="rounded-2xl border border-pink-300/15 bg-pink-400/[0.045] p-5">
              <p className="font-mono text-sm font-semibold text-white">🔀 SWITCH 2 · PAIR ROUTE</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                แยกออเดอร์ใบเดียวกับออเดอร์ที่มีคู่จาก marker ที่ THE GOD GATEKEEPER V.1 เตรียมไว้ให้
                หน้าที่ของ Switch 2 คือแยกเส้นทางตาม marker ไม่ใช่คำนวณคู่ใหม่ในหน้าเว็บ
              </p>
              <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-pink-100/80">
                pair marker → 💞 PAIRED / 💔 SINGLE
              </code>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-sky-300/15 bg-sky-400/[0.045] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
                  BILL CONSTRUCTION · CHANGE AUDIT
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">หัวใจความเท่ของระบบ: สร้างบิลและเห็นการเปลี่ยนแปลง</h3>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/70">
                  สายบนประกอบข้อความบิลสำหรับกลุ่มแพ็ก แล้วบันทึกผลลงโต๊ะหลักและโต๊ะแชท ส่วนสายล่างดูแลคู่จริงและหลักฐานการเปลี่ยนข้อมูล
                  โดยไม่ลบประวัติเดิม
                </p>
              </div>
              <ToneBadge tone="cyan"><Archive className="mr-1.5 h-3.5 w-3.5" /> เก็บหลักฐานครบ</ToneBadge>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-sky-300/15 bg-black/20 p-5">
                <p className="font-mono text-sm font-semibold text-white">💫 BILL_HEADER_INJECTOR1 · สายบน</p>
                <p className="mt-2 text-xs leading-5 text-slate-300/65">
                  ประกอบและจัดรูปฟิวด์ <code className="rounded bg-black/30 px-1 text-sky-100">telegram_message</code>
                  ให้พร้อมส่งเข้ากลุ่มแพ็ก เช่น เวลา เลขออเดอร์ เพจ Facebook COD ที่อยู่ สินค้า และขนส่ง
                </p>
                <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-sky-100/80">
                  telegram_message → กลุ่มแพ็ก
                  <br />
                  main table + chat table
                </code>
              </div>
              <div className="rounded-2xl border border-pink-300/15 bg-pink-400/[0.045] p-5">
                <p className="font-mono text-sm font-semibold text-white">💞 PAIRED · สายล่าง</p>
                <p className="mt-2 text-xs leading-5 text-slate-300/65">
                  ดูแลกลุ่มคนมีคู่ตาม marker ที่ Gatekeeper ทำไว้ ไม่ได้เดาคู่จากหน้าเว็บเอง
                  ใบเดียวและใบที่มีคู่จึงถูกส่งไปคนละเส้นทางตามผลของ n8n
                </p>
                <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-pink-100/80">
                  pair marker → lower lane
                </code>
              </div>
              <div className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.045] p-5">
                <p className="font-mono text-sm font-semibold text-white">🪐 BILL BUILDER</p>
                <p className="mt-2 text-xs leading-5 text-slate-300/65">
                  รุ่น Clean Audit เปรียบเทียบครั้งเดียว สร้างบิลครั้งเดียว และตัดสินสีครั้งเดียว
                  พร้อมตัดข้อความ Audit เก่าท้ายบิล เพื่อไม่ให้ข้อมูลเก่าปะปนกับบิลปัจจุบัน
                </p>
                <code className="mt-3 block rounded-xl bg-black/30 p-3 text-[11px] text-violet-100/80">
                  compare once → build once → color once
                </code>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.045] p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
                    DYNAMIC PRODUCT TABLE · BILL HEADER
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">หัวบิลไดนามิกจากโต๊ะสินค้า</h3>
                  <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-300/70">
                    หัวบิลไม่ได้เขียนตายตัวในเว็บ แต่ดึงตรงจากฟิวด์และลิงก์ของโต๊ะสินค้า
                    จึงเปลี่ยนได้ตามสินค้า แคมเปญ หรือสถานะสต็อกโดยไม่ต้องแก้โค้ดหน้าเว็บ
                  </p>
                </div>
                <ToneBadge tone="cyan">SOURCE OF TRUTH · PRODUCT TABLE</ToneBadge>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold text-emerald-100">สิ่งที่สายบิลอ่านตรง ๆ</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-300/70">
                    <li>• หัวบิลสินค้าและข้อความประกอบ เช่น 🐧 / 🗯️</li>
                    <li>• <code className="rounded bg-black/30 px-1 text-emerald-100">telegram_message</code> สำหรับรายละเอียดออเดอร์ส่งกลุ่มแพ็ก</li>
                    <li>• ข้อความสินค้าหมด เช่น ❌ / 💬 เมื่อโต๊ะสินค้าส่งสัญญาณมา</li>
                    <li>• ลิงก์หรือภาพจากโต๊ะสินค้าโดยตรง</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="font-semibold text-emerald-100">หลักการแสดงผล</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-300/70">
                    <li>• เว็บอ่านและแสดงฟิวด์ไดนามิกตรง ๆ</li>
                    <li>• ไม่ hardcode หัวบิลหรือข้อความสินค้าหมด</li>
                    <li>• ไม่ตัดสินเองว่าสินค้าหมดหรือพร้อมแพ็ก</li>
                    <li>• เปลี่ยนหัวบิลได้โดยแก้ที่โต๊ะสินค้า/n8n เท่านั้น</li>
                  </ul>
                </div>
              </div>
              <code className="mt-4 block rounded-xl bg-black/30 p-3 text-[11px] leading-5 text-emerald-100/80">
                product table → dynamic header / stock message / link
                <br />
                order fields → telegram_message → packing room
              </code>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.045] p-5">
                <p className="font-mono text-sm font-semibold text-white">📌 PRE-SAVE CHANGE AUDIT1</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300/70">
                  <li>• จัดกลุ่มตาม threadId และรักษาทุกแถวไว้เป็นหลักฐาน</li>
                  <li>• ตรวจคู่จริงจากที่อยู่และสินค้า และใช้ winner จากโหนดโฟร์หลักเมื่อมี</li>
                  <li>• เปรียบเทียบสินค้า/ที่อยู่/เบอร์/ชื่อ/COD ระหว่างใบก่อนหน้าและปัจจุบัน</li>
                  <li>• สร้างฟิวด์ Audit โดยไม่ลบแถว และไม่ทับ switch3_route, target_room หรือ four1_decision</li>
                  <li>• ไม่อ่าน chat_timeline เพื่อประกอบที่อยู่หรือเบอร์</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[0.045] p-5">
                <p className="font-mono text-sm font-semibold text-white">💟 CUSTOMER CHANGE AUDIT FOOTER</p>
                <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-300/70">
                  <li>• จับเฉพาะ threadId เดียวกัน แล้วเทียบใบก่อนหน้ากับใบปัจจุบัน</li>
                  <li>• ตรวจสินค้า/จำนวน/COD/เบอร์/ชื่อ/ที่อยู่/ขนส่ง และบอกเวลาเปลี่ยน</li>
                  <li>• ลำดับที่อยู่: telegram_primary_address → rescue_address → ค่าเดิม</li>
                  <li>• เก็บ raw source line และ source field พร้อมสร้างข้อความท้ายบิลสำหรับแอดมิน</li>
                  <li>• ใช้ marker จริงและ chat_timeline เป็นหลักฐานเลือก candidate โดยไม่เติม debug fields ลง JSON root</li>
                  <li>• ไม่ลบข้อมูลเก่า และคืนทุกแถวกลับครบ</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-sm font-semibold text-white">🎨 CHANGE / GROUP DECISION SIGNALS</p>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400/60">audit layer</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["🟠", "ใบเปลี่ยนข้อมูลเก่า", "บันทึกเก็บไว้เป็นหลักฐาน"],
                  ["🟨", "ใบเปลี่ยนข้อมูลล่าสุด", "เข้าแพ็ก"],
                  ["🟦", "ใบชนะในกลุ่ม Facebook", "winner ของกลุ่มนั้น"],
                  ["⚪", "ผ่านตลอด", "เส้นทางที่ผ่านได้เสมอ"],
                  ["⬛", "ใบที่แพ้ในกลุ่ม", "เก็บไว้เป็นหลักฐาน ไม่ใช่ใบชนะ"],
                ].map(([emoji, title, detail]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{emoji}</span>
                      <p className="text-xs font-semibold text-white">{title}</p>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-4 text-slate-300/60">{detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-5 text-slate-400/65">
                หมายเหตุ: ชุดสีนี้เป็นสัญญาณชั้น Change Audit/การตัดสินภายในกลุ่ม Facebook
                แยกจาก <code className="rounded bg-black/30 px-1 text-slate-200">⚫</code> ของ Switch แรกที่หมายถึงบอททวนหรือบิลไม่สมบูรณ์
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-400/[0.045] p-5">
            <div className="flex items-center gap-3">
              <RadioTower className="h-5 w-5 text-violet-300" />
              <p className="font-semibold text-white">🧬 FIBO · คะแนนความสมบูรณ์ของข้อมูล</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-300/65">
              หลังผ่านด่านคัดบิล ระบบใช้คะแนนและระดับฟิโบช่วยตัดสินความพร้อมของข้อมูลตั้งแต่ที่อยู่ไปจนถึงสินค้า
              เช่น <code className="rounded bg-black/30 px-1.5 py-0.5 text-violet-100">fibo_score</code>,
              <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5 text-violet-100">fibo_tier</code> และ
              <code className="ml-1 rounded bg-black/30 px-1.5 py-0.5 text-violet-100">fibo_badge</code>
              เป็นผลจาก n8n ไม่ใช่ค่าที่หน้าเว็บควรคำนวณใหม่
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-xs font-semibold text-fuchsia-100">bb_express_send_route</p>
              <p className="mt-1 text-xs leading-5 text-slate-300/65">
                ฟิวด์เส้นทางที่ n8n คัดจาก packer_obj เช่น ⚪/⚫ ห้ามหน้าเว็บเปลี่ยนความหมายเอง
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-xs font-semibold text-fuchsia-100">packer_obj</p>
              <p className="mt-1 text-xs leading-5 text-slate-300/65">
                วัตถุข้อมูลต้นทางสำหรับตรวจความครบถ้วน เช่น COD สินค้า จำนวน ลูกค้า ที่อยู่ และสถานะบิล
                ขาดฟิวด์เดียวก็เปลี่ยนสัญญาณความสมบูรณ์ได้
              </p>
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
              จัดเก็บประวัติการส่งเลขพัสดุที่เสร็จสิ้น รวมถึงข้อมูลผู้รับ เพจ เลขพัสดุ เวลา
              และผลการส่ง โดยไม่ทำหน้าที่เป็นคิวสำหรับส่งซ้ำ
            </p>
          </div>
          <div className="rounded-[2rem] border border-violet-300/15 bg-violet-400/[0.035] p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-violet-300" />
              <h2 className="text-lg font-semibold text-white">
                หลักเกณฑ์การกำหนดเจ้าของข้อมูล
              </h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300/70">
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                parcels เป็นแหล่งข้อมูลหลักของเลขพัสดุและสถานะการส่ง
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                ORDERCONTROL เป็นแหล่งข้อมูลหลักของข้อมูลที่ใช้จัดทำบิล
              </li>
              <li className="flex gap-2">
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-violet-300" />
                ทุกวิวต้องอ่านสถานะจากแหล่งข้อมูลต้นทาง และไม่สร้างสำเนาสถานะที่ขัดแย้งกัน
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-cyan-300/15 bg-cyan-400/[0.035] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-cyan-300" />
                <h2 className="text-lg font-semibold text-white">คู่มือแอดมิน · ติดตั้ง BB STORE Inbox เป็นแอป</h2>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300/70">
                เปิด Mobile Inbox ผ่าน Chrome บน Android หรือ Safari บน iPhone แล้วเพิ่มไว้ที่หน้าจอหลัก
                ไม่ต้องติดตั้งจาก Play Store หรือ App Store
              </p>
            </div>
            <ToneBadge tone="cyan">PWA · MOBILE INBOX</ToneBadge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">Android · Chrome</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                เปิดลิงก์ → กด “ติดตั้งแอป” หากมีปุ่ม หรือเมนู ⋮ → “ติดตั้งแอป” / “เพิ่มไปยังหน้าจอหลัก”
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">iPhone · Safari</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                เปิดด้วย Safari → Share → “เพิ่มไปยังหน้าจอโฮม” → “เพิ่ม”
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-semibold text-white">การใช้งาน</p>
              <p className="mt-2 text-xs leading-5 text-slate-300/65">
                เลือกเพจ แตะห้อง ตอบข้อความ ส่งภาพได้สูงสุด 4 ภาพ และใช้ปุ่มย้อนกลับเพื่อกลับหน้ารวม
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100/75">
            หากไม่เห็นรูปโปรไฟล์ ระบบจะแสดงอักษรแรกของ facebook_name แทนตามข้อมูลจริง ไม่ต้องอัปโหลดรูปแทนลูกค้าเอง
          </p>
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
