import { LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

export type ProjectRoom = { table: string; label: string; serverOnly?: boolean };
export type ProjectRoomState = {
  kind: "idle" | "loading" | "ready" | "error" | "missing" | "unsafe" | "server";
  detail?: string;
};
export type ProjectRoomStates = Record<string, ProjectRoomState>;

export const PROJECT_ROOM_GROUPS: { title: string; rooms: ProjectRoom[] }[] = [
  {
    title: "ROOM 01 · ORDER CORE",
    rooms: [
      { table: "thailand_address_master", label: "ฐานที่อยู่ไทย" },
      { table: "🌀SINGULARITY_xXx_EXCHANGE", label: "Chat / Exchange" },
      { table: "🌌MULTIVERSE_xXx_NEXUS", label: "Telegram Nexus" },
      { table: "🌍GALACTIC_GATEWAY_TOKEN", label: "Gateway Token", serverOnly: true },
      { table: "🌟GENESIS_xXx_HISTORY", label: "ประวัติรายการ" },
      { table: "💀THANATOS_xXx_DEATH_NOTE", label: "Death Note" },
      { table: "🔸PARADOX_xXx_EXCHANGE", label: "Order Exchange" },
      { table: "🗝️HERMES_ARCHIVE", label: "Order Control" },
      { table: "🛒product_master", label: "Product Master" },
      { table: "🛰️PIONEER_xXx_CAPSULE", label: "Pioneer Capsule" },
      { table: "🪐ANDROMEDA_xXx_SENT", label: "Andromeda Sent" },
    ],
  },
  {
    title: "ROOM 02 · CHAT CORE",
    rooms: [
      { table: "Cust_Chat⭐BINARY_xXx_STAR", label: "Customer Chat" },
      { table: "Pg_Chat⭐BINARY_xXx_STAR", label: "Page Chat" },
      { table: "delivery_pre_send_checks", label: "ตรวจสอบก่อนส่ง" },
      { table: "delivery_red_zone_provinces", label: "จังหวัดพื้นที่เสี่ยง" },
      { table: "delivery_telegram_urgent_queue", label: "คิว Telegram ด่วน" },
      { table: "line_channels", label: "LINE Channels" },
      { table: "line_messages", label: "LINE Messages" },
      { table: "🌈MILKY_WAY_xXx_TOKEN _PAGE", label: "Milky Way Token Page", serverOnly: true },
      { table: "🌓VAGABOND_xXx_DISMISS", label: "Vagabond Dismiss" },
      { table: "🌠BINARY_xXx_MATRIX", label: "Binary Matrix" },
      { table: "🏴‍☠️SIRIUS_xXx_CRASH", label: "Sirius Crash" },
    ],
  },
  {
    title: "ROOM 03 · PARCEL RETURN",
    rooms: [
      { table: "page_tokens_vault", label: "Page Tokens Vault", serverOnly: true },
      { table: "parcels", label: "พัสดุ" },
      { table: "sales_script_cards", label: "Script Cards" },
      { table: "thailand_address_master", label: "ฐานที่อยู่ไทย" },
      { table: "⛩️VOID_xXx_GATEWAYz", label: "Void Gateway" },
      { table: "📓DEAD_xXx_NOTE", label: "Dead Note" },
      { table: "🔮SHADOW_xXx_RECALL", label: "Shadow Recall" },
      { table: "🛒product_master", label: "Product Master" },
      { table: "🦅ROGUE_xXx_SHIPPINGz", label: "Rogue Shipping" },
      { table: "🧿BB_xXx_ORDERCONTROL", label: "BB Order Control" },
    ],
  },
  {
    title: "ROOM 04 · PRIVATE VAULT",
    rooms: [
      { table: "🛒product_master", label: "Product Master · คลังสินค้า" },
      { table: "app_chat_frames", label: "กรอบแชท" },
      { table: "app_customization_selections", label: "การปรับแต่งแอป" },
      { table: "app_sounds", label: "เสียงแจ้งเตือน" },
      { table: "app_themes", label: "ธีมแอป" },
      { table: "sales_script_cards", label: "Script Cards" },
    ],
  },
];

export function projectRoomStatusKey(projectIndex: number, table: string): string {
  return `${projectIndex}:${table}`;
}

export function isPublicSupabaseAnonKey(value: string): boolean {
  const key = value.trim().replace(/^Bearer\s+/i, "").replace(/^['"]|['"]$/g, "").replace(/[\r\n\t\s]+/g, "");
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  try {
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, "=")));
    return payload.role === "anon";
  } catch {
    return false;
  }
}

type ProjectRoomsPanelProps = {
  projectIndex: number;
  statuses: ProjectRoomStates;
  configured: boolean;
  busy: boolean;
  onCheck: () => void;
};

function labelFor(state: ProjectRoomState): string {
  switch (state.kind) {
    case "server": return state.detail || "ตรวจจาก Server เท่านั้น";
    case "missing": return "ยังไม่ตั้งค่า";
    case "unsafe": return state.detail || "ใช้ anon/public key เท่านั้น";
    case "loading": return "กำลังตรวจ…";
    case "ready": return state.detail || "อ่านได้";
    case "error": return state.detail || "อ่านไม่ได้";
    default: return "ยังไม่ตรวจ";
  }
}

function colorFor(state: ProjectRoomState): string {
  switch (state.kind) {
    case "ready": return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
    case "server": return "border-violet-300/25 bg-violet-400/10 text-violet-200";
    case "loading": return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
    case "error":
    case "unsafe": return "border-rose-300/30 bg-rose-400/10 text-rose-200";
    default: return "border-white/10 bg-white/[0.035] text-white/45";
  }
}

export default function ProjectRoomsPanel({ projectIndex, statuses, configured, busy, onCheck }: ProjectRoomsPanelProps) {
  const group = PROJECT_ROOM_GROUPS[projectIndex];
  if (!group) return null;
  const checkable = group.rooms.filter(room => !room.serverOnly);
  const checked = checkable.filter(room => {
    const kind = statuses[projectRoomStatusKey(projectIndex, room.table)]?.kind;
    return kind === "ready" || kind === "error";
  });
  const ready = checked.filter(room => statuses[projectRoomStatusKey(projectIndex, room.table)]?.kind === "ready").length;
  const summary = busy
    ? "กำลังตรวจ"
    : !configured
      ? "รอการเชื่อมต่อ"
      : checked.length
        ? `${ready}/${checked.length} ตารางอ่านได้`
        : `${group.rooms.length} ห้อง · ยังไม่ตรวจ`;

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-white/[0.09] bg-black/20">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-100/60">{group.title} · ROOM LIST</p>
          <p className="mt-0.5 text-[10px] text-white/45">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onCheck}
          disabled={!configured || busy}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-cyan-300/25 bg-cyan-400/10 px-2.5 text-[9px] font-semibold text-cyan-100 transition hover:border-cyan-200/55 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {busy ? "กำลังตรวจ…" : "ตรวจห้องของ Room " + String(projectIndex + 1).padStart(2, "0")}
        </button>
      </header>
      <div className="grid max-h-72 gap-1.5 overflow-y-auto p-2.5 sm:grid-cols-2">
        {group.rooms.map(room => {
          const id = projectRoomStatusKey(projectIndex, room.table);
          const state = statuses[id] || (room.serverOnly
            ? { kind: "server" as const }
            : configured
              ? { kind: "idle" as const }
              : { kind: "missing" as const });
          return (
            <div key={id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/[0.055] bg-white/[0.018] px-2.5 py-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-white/85" title={room.label}>{room.label}</p>
                <code className="block truncate text-[8px] text-cyan-100/40" title={room.table}>{room.table}</code>
              </div>
              <span className={`inline-flex max-w-[138px] shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${colorFor(state)}`} title={state.detail}>
                {state.kind === "error" || state.kind === "unsafe" ? <ShieldAlert className="h-3 w-3" /> : state.kind === "loading" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : state.kind === "ready" || state.kind === "server" ? <ShieldCheck className="h-3 w-3" /> : null}
                <span className="truncate">{labelFor(state)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
