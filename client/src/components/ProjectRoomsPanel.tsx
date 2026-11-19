import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type RoomDefinition = { table: string; label: string; serverOnly?: boolean };
type ProjectDefinition = { rooms: RoomDefinition[] };
type SavedProject = { url?: unknown; anonKey?: unknown; label?: unknown };
type PublicProject = { url: string; anonKey: string; label: string };
type ProjectAccess =
  | { kind: "ready"; project: PublicProject }
  | { kind: "missing" }
  | { kind: "unsafe" };
type RoomState = {
  kind: "idle" | "loading" | "ready" | "error" | "missing" | "unsafe" | "server";
  detail?: string;
};

const PROJECT_CONFIG_KEY = "drak-supabase-config-v2";

const PROJECTS: ProjectDefinition[] = [
  {
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
    rooms: [
      { table: "app_chat_frames", label: "กรอบแชท" },
      { table: "app_customization_selections", label: "การปรับแต่งแอป" },
      { table: "app_sounds", label: "เสียงแจ้งเตือน" },
      { table: "app_themes", label: "ธีมแอป" },
      { table: "sales_script_cards", label: "Script Cards" },
    ],
  },
];

const ALL_ROOMS = PROJECTS.flatMap((project, projectIndex) =>
  project.rooms.map(room => ({ ...room, projectIndex, id: `${projectIndex}:${room.table}` })),
);

function readSavedProjects(): SavedProject[] {
  try {
    if (typeof window === "undefined") return [];
    const saved = JSON.parse(window.localStorage.getItem(PROJECT_CONFIG_KEY) || "{}");
    return Array.isArray(saved?.projects) ? saved.projects : [];
  } catch {
    return [];
  }
}

function isPublicAnonKey(value: string): boolean {
  const key = value.trim();
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

function resolveProject(project?: SavedProject): ProjectAccess {
  if (!project?.url || !project?.anonKey) return { kind: "missing" };
  const url = String(project.url).trim().replace(/\/+$/, "");
  const anonKey = String(project.anonKey)
    .trim()
    .replace(/^Bearer\s+/i, "")
    .replace(/^['"]|['"]$/g, "")
    .replace(/[\r\n\t\s]+/g, "");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: "unsafe" };
  }
  if (
    parsed.protocol !== "https:" ||
    !parsed.hostname.endsWith(".supabase.co") ||
    !isPublicAnonKey(anonKey)
  ) {
    return { kind: "unsafe" };
  }
  return {
    kind: "ready",
    project: { url, anonKey, label: String(project.label || "") },
  };
}

function initialRoomState(room: RoomDefinition, access: ProjectAccess): RoomState {
  if (room.serverOnly) return { kind: "server" };
  if (access.kind === "missing") return { kind: "missing" };
  if (access.kind === "unsafe") return { kind: "unsafe" };
  return { kind: "idle" };
}

function stateLabel(state: RoomState): string {
  switch (state.kind) {
    case "server": return "Server only";
    case "missing": return "ยังไม่เชื่อม";
    case "unsafe": return "ใช้ anon/public key";
    case "loading": return "กำลังตรวจ";
    case "ready": return "อ่านได้";
    case "error": return state.detail || "อ่านไม่ได้";
    default: return "ยังไม่ตรวจ";
  }
}

function stateClass(state: RoomState): string {
  switch (state.kind) {
    case "server": return "border-violet-300/25 bg-violet-400/10 text-violet-200";
    case "ready": return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
    case "error":
    case "unsafe": return "border-rose-300/30 bg-rose-400/10 text-rose-200";
    case "loading": return "border-cyan-300/25 bg-cyan-400/10 text-cyan-100";
    default: return "border-white/10 bg-white/[0.035] text-white/45";
  }
}

export default function ProjectRoomsPanel() {
  const [expanded, setExpanded] = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>(readSavedProjects);
  const [states, setStates] = useState<Record<string, RoomState>>({});
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const runIdRef = useRef(0);
  const accessByProject = useMemo(
    () => PROJECTS.map((_, index) => resolveProject(savedProjects[index])),
    [savedProjects],
  );
  const configuredCount = accessByProject.filter(access => access.kind === "ready").length;
  const checkedStates = ALL_ROOMS.filter(room => {
    const state = states[room.id];
    return !room.serverOnly && (state?.kind === "ready" || state?.kind === "error");
  });
  const readableCount = checkedStates.filter(room => states[room.id]?.kind === "ready").length;

  useEffect(() => {
    const refreshProjects = () => setSavedProjects(readSavedProjects());
    window.addEventListener("storage", refreshProjects);
    window.addEventListener("focus", refreshProjects);
    return () => {
      window.removeEventListener("storage", refreshProjects);
      window.removeEventListener("focus", refreshProjects);
      runIdRef.current += 1;
    };
  }, []);

  const checkRooms = async () => {
    const requestId = ++runIdRef.current;
    const freshProjects = readSavedProjects();
    setSavedProjects(freshProjects);
    const freshAccess = PROJECTS.map((_, index) => resolveProject(freshProjects[index]));
    const startingStates: Record<string, RoomState> = {};
    for (const room of ALL_ROOMS) startingStates[room.id] = initialRoomState(room, freshAccess[room.projectIndex]);
    setStates(startingStates);
    setChecking(true);
    setLastChecked(null);

    const queue = ALL_ROOMS.filter(room =>
      !room.serverOnly && freshAccess[room.projectIndex].kind === "ready",
    );
    if (!queue.length) {
      setChecking(false);
      setLastChecked(Date.now());
      return;
    }

    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const room = queue[cursor++];
        const access = freshAccess[room.projectIndex];
        if (access.kind !== "ready") continue;
        const query = new URLSearchParams({ select: "*", limit: "0" });
        try {
          const response = await fetch(
            `${access.project.url}/rest/v1/${encodeURIComponent(room.table)}?${query.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              headers: {
                apikey: access.project.anonKey,
                Authorization: `Bearer ${access.project.anonKey}`,
                Accept: "application/json",
              },
            },
          );
          if (requestId !== runIdRef.current) return;
          if (!response.ok) {
            let detail = `HTTP ${response.status}`;
            try {
              const body = await response.json();
              detail = String(body?.message || body?.code || detail).slice(0, 96);
            } catch {
              // Keep the short HTTP status if the endpoint returned no JSON error body.
            }
            setStates(current => ({ ...current, [room.id]: { kind: "error", detail } }));
          } else {
            setStates(current => ({ ...current, [room.id]: { kind: "ready" } }));
          }
        } catch {
          if (requestId !== runIdRef.current) return;
          setStates(current => ({ ...current, [room.id]: { kind: "error", detail: "เชื่อมต่อไม่ได้" } }));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(6, queue.length) }, () => worker()));
    if (requestId !== runIdRef.current) return;
    setChecking(false);
    setLastChecked(Date.now());
  };

  const summary = checking
    ? "กำลังตรวจสถานะ 4 โปรเจกต์…"
    : configuredCount === 0
      ? `ยังไม่เชื่อมโปรเจกต์ · ${PROJECTS.length} โปรเจกต์ · ${ALL_ROOMS.length} ตาราง`
      : lastChecked !== null
        ? `${readableCount}/${checkedStates.length} ตารางอ่านได้ · ${configuredCount}/4 โปรเจกต์`
        : `ยังไม่ตรวจ · ${ALL_ROOMS.length} ตาราง · ${configuredCount}/4 โปรเจกต์พร้อมตรวจ`;

  return (
    <section className="w-full max-w-[1180px] overflow-hidden rounded-[26px] border border-fuchsia-400/25 bg-[radial-gradient(circle_at_90%_0%,rgba(217,70,239,.14),transparent_38%),linear-gradient(135deg,#0b0812,#111023_58%,#07121a)] shadow-[0_0_40px_rgba(168,85,247,.1)]">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="secret-gallery-project-rooms"
        onClick={() => setExpanded(value => !value)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-white/[0.025] sm:px-5"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-200 shadow-[0_0_20px_rgba(217,70,239,.12)]">
          <Database className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200/75">
            <Sparkles className="h-3.5 w-3.5" /> DATA ROOMS · PROJECTS 1–4
          </span>
          <span className="mt-1 block truncate text-xs text-white/65 sm:text-sm">{summary}</span>
        </span>
        <span className="shrink-0 text-fuchsia-100/65" aria-hidden="true">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {expanded ? (
        <div id="secret-gallery-project-rooms" className="border-t border-fuchsia-300/15 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-cyan-200/55">DATABASE CONTROL · PRIVATE VIEW</p>
              <h2 className="mt-1 flex items-center gap-2 text-base font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-200" /> สถานะห้อง / ตาราง
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-white/45">ตรวจแบบอ่านอย่างเดียว · ไม่ดึงแถวข้อมูล · ไม่แสดง key · ตาราง token ตรวจจากฝั่ง Server เท่านั้น</p>
            </div>
            <button
              type="button"
              onClick={() => void checkRooms()}
              disabled={checking}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/55 hover:bg-cyan-300/15 disabled:cursor-wait disabled:opacity-60"
            >
              {checking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {checking ? "กำลังตรวจ…" : lastChecked ? "ตรวจสถานะอีกครั้ง" : "ตรวจสถานะ"}
            </button>
          </div>

          <div className="grid max-h-[min(68vh,720px)] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
            {PROJECTS.map((project, projectIndex) => {
              const access = accessByProject[projectIndex];
              const projectRooms = ALL_ROOMS.filter(room => room.projectIndex === projectIndex);
              const checkable = projectRooms.filter(room => !room.serverOnly && access.kind === "ready");
              const checked = checkable.filter(room => states[room.id]?.kind === "ready" || states[room.id]?.kind === "error");
              const ready = checked.filter(room => states[room.id]?.kind === "ready").length;
              const projectTitle = access.kind === "ready" && access.project.label
                ? access.project.label
                : `PROJECT ${projectIndex + 1}`;
              const projectStatus = access.kind === "missing"
                ? "ยังไม่เชื่อม"
                : access.kind === "unsafe"
                  ? "ตรวจ key ไม่ผ่าน"
                  : checking
                    ? "กำลังตรวจ"
                    : lastChecked !== null
                      ? `${ready}/${checked.length} อ่านได้`
                      : `${project.rooms.length} ตาราง`;

              return (
                <article key={projectIndex} className="overflow-hidden rounded-2xl border border-white/[0.09] bg-black/20">
                  <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.025] px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-cyan-200/55">PROJECT {projectIndex + 1}</p>
                      <h3 className="mt-0.5 truncate text-sm font-semibold text-white">{projectTitle}</h3>
                    </div>
                    <span className="shrink-0 rounded-full border border-fuchsia-200/15 bg-fuchsia-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-fuchsia-100/80">{projectStatus}</span>
                  </header>
                  <div className="grid gap-1.5 p-2.5">
                    {project.rooms.map(room => {
                      const id = `${projectIndex}:${room.table}`;
                      const state = states[id] || initialRoomState(room, access);
                      return (
                        <div key={id} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-white/[0.055] bg-white/[0.018] px-2.5 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-white/85" title={room.label}>{room.label}</p>
                            <code className="block truncate text-[9px] text-cyan-100/40" title={room.table}>{room.table}</code>
                          </div>
                          <span className={`inline-flex max-w-[125px] shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${stateClass(state)}`} title={state.detail}>
                            {state.kind === "error" || state.kind === "unsafe" ? <ShieldAlert className="h-3 w-3" /> : state.kind === "loading" ? <LoaderCircle className="h-3 w-3 animate-spin" /> : state.kind === "ready" ? <ShieldCheck className="h-3 w-3" /> : null}
                            <span className="truncate">{stateLabel(state)}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
