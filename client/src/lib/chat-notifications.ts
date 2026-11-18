import { getSupabase } from "@/lib/canonical";

export type ChatNotification = {
  key: string;
  threadKey: string;
  pageId: string;
  threadId: string;
  pageName: string;
  customerName: string;
  message: string;
  messageId: string | null;
  messageAt: string | null;
  count: number;
  updatedAt: number;
};

export type ChatNotificationState = {
  version: 2;
  initialized: boolean;
  cursorRowId: string | null;
  seenMessageKeys: string[];
  pending: ChatNotification[];
};

export const CHAT_NOTIFICATION_STATE_KEY = "bb-chat-notification-state-v2";
export const CHAT_NOTIFICATION_EVENT = "bb-chat-notifications-updated";
export const CHAT_SOUND_KEY = "nightops-chat-sound-v1";
const CUSTOMER_TABLE = "Cust_Chat⭐BINARY_xXx_STAR";
const PAGE_TABLE = "Pg_Chat⭐BINARY_xXx_STAR";

function stateStorageKey(projectUrl?: string): string {
  const project = projectUrl?.trim().replace(/\/+$/, "").toLowerCase() || "default";
  return `${CHAT_NOTIFICATION_STATE_KEY}:${encodeURIComponent(project)}`;
}

function emptyState(): ChatNotificationState {
  return {
    version: 2,
    initialized: false,
    cursorRowId: null,
    seenMessageKeys: [],
    pending: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readChatNotificationState(projectUrl?: string): ChatNotificationState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(stateStorageKey(projectUrl));
    if (!raw) return emptyState();
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return emptyState();
    const cursorRowId = typeof value.cursorRowId === "string" && /^\d+$/.test(value.cursorRowId)
      ? value.cursorRowId
      : null;
    const seenMessageKeys = Array.isArray(value.seenMessageKeys)
      ? value.seenMessageKeys.filter((item): item is string => typeof item === "string").slice(-5000)
      : [];
    const pending = Array.isArray(value.pending)
      ? value.pending.filter((item): item is ChatNotification =>
          isRecord(item) && typeof item.threadKey === "string" && Number(item.count) > 0,
        )
      : [];
    return {
      version: 2,
      initialized: value.initialized === true && cursorRowId !== null,
      cursorRowId,
      seenMessageKeys,
      pending,
    };
  } catch {
    return emptyState();
  }
}

export function writeChatNotificationState(state: ChatNotificationState, projectUrl?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(stateStorageKey(projectUrl), JSON.stringify(state));
    window.dispatchEvent(new Event(CHAT_NOTIFICATION_EVENT));
  } catch {
    // Notifications continue in memory if storage is unavailable or full.
  }
}

function isCustomerMessage(row: Record<string, unknown>): boolean {
  const source = String(row._source_table ?? "");
  if (source === PAGE_TABLE) return false;
  if (source === CUSTOMER_TABLE) return true;
  const speaker = String(row.speaker ?? row.speaker_type ?? row.source_side ?? "").toLowerCase();
  return /customer|client|inbound|ลูกค้า/.test(speaker);
}

function usableIdentifier(value: unknown): string {
  const raw = String(value ?? "").trim();
  return /^(?:null|undefined)$/i.test(raw) ? "" : raw;
}

function compareRowIds(left: string, right: string): number {
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    const a = BigInt(left);
    const b = BigInt(right);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return left.localeCompare(right, undefined, { numeric: true });
}

function messageKey(row: Record<string, unknown>): string {
  const pageId = String(row.page_id ?? "").trim();
  const threadId = String(row.thread_id ?? row.threadId ?? "").trim();
  const messageId = usableIdentifier(row.message_id);
  const dedupeKey = usableIdentifier(row.dedupe_key);
  const rowId = usableIdentifier(row.message_row_id ?? row.id);
  const identity = messageId || dedupeKey || rowId || `${row.occurred_at ?? row.time ?? ""}|${row.customer_message_text ?? row.message_text ?? row.customer_latest_message ?? ""}`;
  return `${pageId}:${threadId}:${identity}`;
}

export function reconcileChatNotificationRows(
  state: ChatNotificationState,
  rows: Array<Record<string, unknown>>,
  now = Date.now(),
  observedCursorRowId?: string | null,
): { state: ChatNotificationState; newMessageCount: number; changed: ChatNotification[] } {
  const seen = new Set(state.seenMessageKeys);
  const pending = [...state.pending];
  const changed: ChatNotification[] = [];
  let newMessageCount = 0;
  let nextCursorRowId = state.cursorRowId ?? "0";

  for (const row of rows) {
    const rowId = usableIdentifier(row.message_row_id ?? row.id);
    if (/^\d+$/.test(rowId) && compareRowIds(rowId, nextCursorRowId) > 0) nextCursorRowId = rowId;
    if (!isCustomerMessage(row)) continue;
    const pageId = String(row.page_id ?? "").trim();
    const threadId = String(row.thread_id ?? row.threadId ?? "").trim();
    if (!pageId || !threadId) continue;

    const text = String(row.customer_message_text ?? row.message_text ?? row.customer_latest_message ?? row.text ?? "").trim();
    const hasAttachment = Boolean(row.has_attachment || row.attachment_url || row.attachment_urls || row.attachments_raw);
    if (!text && !hasAttachment) continue;

    const eventKey = messageKey(row);
    if (!eventKey || seen.has(eventKey)) continue;
    seen.add(eventKey);
    if (!state.initialized) continue;

    const threadKey = `${pageId}:${threadId}`;
    const existingIndex = pending.findIndex(item => item.threadKey === threadKey);
    const existing = existingIndex >= 0 ? pending[existingIndex] : null;
    const messageId = usableIdentifier(row.message_id) || usableIdentifier(row.dedupe_key) || usableIdentifier(row.id) || null;
    const notification: ChatNotification = {
      key: existing?.key ?? `${threadKey}:${now}`,
      threadKey,
      pageId,
      threadId,
      pageName: String(row.page_name ?? "ไม่ระบุเพจ"),
      customerName: String(row.facebook_name ?? "").trim(),
      message: text || "ส่งไฟล์แนบ",
      messageId,
      messageAt: String(row.occurred_at ?? row.time ?? row.customer_message_time_th ?? "").trim() || null,
      count: (existing?.count ?? 0) + 1,
      updatedAt: now,
    };
    if (existingIndex >= 0) pending[existingIndex] = notification;
    else pending.push(notification);
    changed.push(notification);
    newMessageCount += 1;
  }

  const responseCursor = usableIdentifier(observedCursorRowId);
  if (/^\d+$/.test(responseCursor) && compareRowIds(responseCursor, nextCursorRowId) > 0) nextCursorRowId = responseCursor;
  pending.sort((a, b) => b.updatedAt - a.updatedAt);
  const nextState: ChatNotificationState = {
    version: 2,
    initialized: true,
    cursorRowId: nextCursorRowId,
    seenMessageKeys: Array.from(seen).slice(-5000),
    pending: pending.slice(0, 500),
  };
  return { state: nextState, newMessageCount, changed };
}

export function markChatNotificationsRead(state: ChatNotificationState, threadKey?: string): ChatNotificationState {
  return {
    ...state,
    pending: threadKey ? state.pending.filter(item => item.threadKey !== threadKey) : [],
  };
}

export function countUnreadChatMessages(state: ChatNotificationState): number {
  return state.pending.reduce((total, item) => total + Math.max(0, Number(item.count) || 0), 0);
}

function readSoundSettings(): { enabled: boolean; volume: number; tone?: string; soundKey?: string } {
  if (typeof window === "undefined") return { enabled: true, volume: 0.35 };
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(CHAT_SOUND_KEY) || "{}");
    if (!isRecord(value)) return { enabled: true, volume: 0.35 };
    const volume = Number(value.volume);
    return {
      enabled: value.enabled !== false,
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0.02, volume)) : 0.35,
      tone: typeof value.tone === "string" ? value.tone : undefined,
      soundKey: typeof value.soundKey === "string" ? value.soundKey : undefined,
    };
  } catch {
    return { enabled: true, volume: 0.35 };
  }
}

export function isChatNotificationSoundEnabled(): boolean {
  return readSoundSettings().enabled;
}

export function setChatNotificationSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAT_SOUND_KEY, JSON.stringify({ ...readSoundSettings(), enabled }));
  } catch {
    // Keep the in-memory control usable when local storage is unavailable.
  }
}

export function setChatNotificationSound(soundKey: string, volume?: number): void {
  if (typeof window === "undefined") return;
  try {
    const current = readSoundSettings();
    window.localStorage.setItem(CHAT_SOUND_KEY, JSON.stringify({ ...current, soundKey, volume: volume ?? current.volume, enabled: true }));
    window.dispatchEvent(new StorageEvent("storage", { key: CHAT_SOUND_KEY }));
  } catch {
    // Keep the current sound when storage is unavailable.
  }
}

let customSoundUrl = "";
let customSoundKey = "";
let customSoundExpiresAt = 0;

async function playConfiguredSound(settings: ReturnType<typeof readSoundSettings>): Promise<boolean> {
  if (!settings.soundKey) return false;
  const api = getSupabase("vault");
  if (!api) return false;
  try {
    let url = customSoundKey === settings.soundKey && customSoundExpiresAt > Date.now() ? customSoundUrl : "";
    if (!url) {
      const result = await api.from("app_sounds").select("sound_key,storage_bucket,storage_path,volume").eq("sound_key", settings.soundKey).eq("is_enabled", true).maybeSingle();
      const row = result.data as { storage_bucket?: string | null; storage_path?: string | null; volume?: number | null } | null;
      if (result.error || !row?.storage_path) return false;
      const signed = await api.storage.from(row.storage_bucket || "chat-sounds").createSignedUrl(row.storage_path, 300);
      if (signed.error || !signed.data?.signedUrl) return false;
      url = signed.data.signedUrl;
      customSoundKey = settings.soundKey; customSoundUrl = url; customSoundExpiresAt = Date.now() + 240_000;
    }
    const audio = new Audio(url);
    audio.volume = settings.volume;
    await audio.play();
    return true;
  } catch { return false; }
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextCtor = window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext ??= new AudioContextCtor();
  return audioContext;
}

export async function unlockChatNotificationAudio(): Promise<void> {
  const context = getAudioContext();
  if (!context || context.state === "running") return;
  try {
    await context.resume();
  } catch {
    // The browser may still require another direct user gesture.
  }
}

export function playChatNotificationSound(): void {
  const settings = readSoundSettings();
  if (!settings.enabled) return;
  void playConfiguredSound(settings).then(played => { if (!played) playSynthNotificationSound(settings); });
}

function playSynthNotificationSound(settings: ReturnType<typeof readSoundSettings>): void {
  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    if (context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    const frequency = settings.tone === "bell" ? 880 : settings.tone === "pop" ? 520 : 740;
    oscillator.type = settings.tone === "pop" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(settings.volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.29);
  };

  if (context.state === "suspended") {
    void context.resume().then(play).catch(() => undefined);
  } else {
    play();
  }
}
