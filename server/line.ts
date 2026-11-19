import { supabaseGet, supabasePost, type ChatSupabaseCredentials } from "./supabase";

export type LineConversation = {
  key: string;
  lineUserId: string;
  conversationId: string;
  oaId: string;
  oaName: string;
  displayName: string;
  profilePictureUrl: string | null;
  latestDirection: "inbound" | "outbound";
  latestAt: string | null;
  preview: string;
  messageCount: number;
};

export type LineMessage = {
  id: string;
  lineUserId: string;
  conversationId: string;
  oaId: string;
  text: string;
  direction: "inbound" | "outbound";
  messageType: string;
  occurredAt: string | null;
  messageId: string | null;
  mediaUrl: string | null;
  stickerUrl: string | null;
  stickerId: string | null;
};

export type LineConnectionStatus = {
  configured: boolean;
  connected: boolean;
  botName: string | null;
  pictureUrl: string | null;
  channelId: string | null;
  oaId: string | null;
  error: string | null;
};

type LineChannel = { channel_id: string; channel_name: string; oa_id: string; channel_access_token: string };

function text(value: unknown) { return value == null ? "" : String(value); }
function timestamp(row: Record<string, unknown>) { return text(row.created_at || row.occurred_at || row.timestamp || row.time) || null; }
function userId(row: Record<string, unknown>) { return text(row.line_user_id || row.user_id || row.customer_id); }
function oaId(row: Record<string, unknown>) { return text(row.destination || row.oa_id || row.channel_oa_id); }
function conversationId(row: Record<string, unknown>) { return text(row.conversation_id || `line_${userId(row)}`); }
function messageText(row: Record<string, unknown>) { return text(row.message_text || row.text || row.content || (row.message as Record<string, unknown> | undefined)?.text); }
function direction(row: Record<string, unknown>): "inbound" | "outbound" {
  const value = text(row.direction || row.speaker || row.source).toLowerCase();
  return value.includes("out") || value.includes("page") || value.includes("admin") ? "outbound" : "inbound";
}

function rawMessage(row: Record<string, unknown>) {
  const raw = row.raw_event ?? row.raw_payload;
  if (!raw || typeof raw !== "object") return {} as Record<string, unknown>;
  const root = raw as Record<string, unknown>;
  return root.message && typeof root.message === "object" ? root.message as Record<string, unknown> : root;
}

function stickerUrl(stickerId: string) {
  return stickerId ? `https://stickershop.line-scdn.net/stickershop/v1/sticker/${encodeURIComponent(stickerId)}/android/sticker.png` : "";
}

async function fetchLineContentDataUrl(messageId: string, token: string) {
  if (!messageId || !token) return null;
  try {
    const response = await fetch(`https://api-data.line.me/v2/bot/message/${encodeURIComponent(messageId)}/content`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 6_000_000) return null;
    return `data:${response.headers.get("content-type") || "image/jpeg"};base64,${bytes.toString("base64")}`;
  } catch { return null; }
}

async function mediaForRow(row: Record<string, unknown>, token: string) {
  const raw = rawMessage(row);
  const messageType = text(row.message_type || row.type || raw.type).toLowerCase();
  const messageId = text(row.line_message_id || row.message_id || row.event_id || raw.id);
  const provider = raw.contentProvider && typeof raw.contentProvider === "object" ? raw.contentProvider as Record<string, unknown> : {};
  const directMedia = [row.media_url, row.image_url, row.attachment_url, row.content_url, row.file_url, raw.originalContentUrl, provider.originalContentUrl].map(text).find(value => /^https?:\/\//i.test(value)) || "";
  const stickerId = text(row.sticker_id || raw.stickerId || (raw.sticker && typeof raw.sticker === "object" ? (raw.sticker as Record<string, unknown>).stickerId : ""));
  if (stickerId) return { mediaUrl: null, stickerUrl: stickerUrl(stickerId), stickerId };
  if (directMedia) return { mediaUrl: directMedia, stickerUrl: null, stickerId: null };
  if (["image", "video", "audio", "file"].includes(messageType)) return { mediaUrl: await fetchLineContentDataUrl(messageId, token), stickerUrl: null, stickerId: null };
  return { mediaUrl: null, stickerUrl: null, stickerId: null };
}

async function readLineChannel(oa: string | undefined, credentials?: ChatSupabaseCredentials) {
  const query = new URLSearchParams({ select: "channel_id,channel_name,oa_id,channel_access_token", is_active: "eq.true", limit: "1" });
  if (oa) query.set("oa_id", `eq.${oa}`);
  const rows = await supabaseGet<LineChannel[]>(`line_channels?${query.toString()}`, "chat", credentials);
  return rows[0] ?? null;
}

async function fetchLineProfile(lineUser: string, oa: string, credentials?: ChatSupabaseCredentials) {
  const channel = await readLineChannel(oa, credentials).catch(() => null);
  const token = channel?.channel_access_token?.trim() || process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return null;
  try {
    const response = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUser)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const body = await response.json() as Record<string, unknown>;
    return { displayName: text(body.displayName) || lineUser, profilePictureUrl: text(body.pictureUrl) || null };
  } catch { return null; }
}

export async function checkLineConnection(oa?: string, credentials?: ChatSupabaseCredentials): Promise<LineConnectionStatus> {
  const channel = await readLineChannel(oa, credentials).catch(() => null);
  const token = channel?.channel_access_token?.trim() || process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return { configured: false, connected: false, botName: null, pictureUrl: null, channelId: channel?.channel_id ?? null, oaId: channel?.oa_id ?? oa ?? null, error: "ยังไม่มี LINE Channel ในตาราง line_channels หรือ LINE_CHANNEL_ACCESS_TOKEN บน Render" };
  try {
    const response = await fetch("https://api.line.me/v2/bot/info", { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) return { configured: true, connected: false, botName: null, pictureUrl: null, channelId: channel?.channel_id ?? null, oaId: channel?.oa_id ?? oa ?? null, error: `LINE Token ใช้งานไม่ได้ (${response.status})` };
    return { configured: true, connected: true, botName: text(body.displayName) || channel?.channel_name || null, pictureUrl: text(body.pictureUrl) || null, channelId: text(body.basicId || body.channelId || channel?.channel_id) || null, oaId: channel?.oa_id ?? oa ?? null, error: null };
  } catch (error) {
    return { configured: true, connected: false, botName: null, pictureUrl: null, channelId: channel?.channel_id ?? null, oaId: channel?.oa_id ?? oa ?? null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readRows(credentials?: ChatSupabaseCredentials) {
  const query = new URLSearchParams({ select: "*", order: "created_at.desc", limit: "5000" });
  return supabaseGet<Array<Record<string, unknown>>>(`line_messages?${query.toString()}`, "chat", credentials);
}

export async function fetchLineConversations(credentials?: ChatSupabaseCredentials): Promise<LineConversation[]> {
  const rows = await readRows(credentials);
  const configuredChannels = await supabaseGet<Array<{ oa_id: string; is_active: boolean; status?: string | null }>>("line_channels?select=oa_id,is_active,status&limit=500", "chat", credentials).catch(() => []);
  const enabledOas = new Set(configuredChannels.filter(channel => channel.is_active !== false && String(channel.status ?? "ON").toUpperCase() !== "OFF").map(channel => channel.oa_id));
  const hasConfiguredChannels = configuredChannels.length > 0;
  const channelCache = new Map<string, LineChannel | null>();
  const channelFor = async (oa: string) => {
    if (!oa) return null;
    if (!channelCache.has(oa)) channelCache.set(oa, await readLineChannel(oa, credentials).catch(() => null));
    return channelCache.get(oa) ?? null;
  };
  const map = new Map<string, LineConversation>();
  for (const row of rows) {
    const lineUserId = userId(row);
    if (!lineUserId) continue;
    const conversation = conversationId(row);
    const channelOaId = oaId(row);
    if (hasConfiguredChannels && (!channelOaId || !enabledOas.has(channelOaId))) continue;
    const key = `${channelOaId}:${conversation}`;
    const occurredAt = timestamp(row);
    const current = map.get(key) ?? { key, lineUserId, conversationId: conversation, oaId: channelOaId, oaName: channelOaId, displayName: text(row.display_name || row.customer_name || lineUserId), profilePictureUrl: text(row.profile_picture_url) || null, latestDirection: direction(row), latestAt: occurredAt, preview: messageText(row), messageCount: 0 };
    current.messageCount += 1;
    if (!current.latestAt && occurredAt) current.latestAt = occurredAt;
    if (!current.preview) current.preview = messageText(row);
    if (text(row.display_name || row.customer_name)) current.displayName = text(row.display_name || row.customer_name);
    if (occurredAt && (!current.latestAt || occurredAt >= current.latestAt)) current.latestDirection = direction(row);
    map.set(key, current);
  }
  const conversations = Array.from(map.values());
  await Promise.all(conversations.map(async conversation => {
    const channel = await channelFor(conversation.oaId);
    if (channel?.channel_name) conversation.oaName = channel.channel_name;
  }));
  await Promise.all(conversations.map(async conversation => {
    if (conversation.displayName !== conversation.lineUserId && conversation.profilePictureUrl) return;
    const profile = await fetchLineProfile(conversation.lineUserId, conversation.oaId, credentials);
    if (profile) { conversation.displayName = profile.displayName; conversation.profilePictureUrl = profile.profilePictureUrl; }
  }));
  return conversations.sort((a, b) => String(b.latestAt || "").localeCompare(String(a.latestAt || "")));
}

export async function fetchLineMessages(conversationKey: string, lineUser: string, oa: string, credentials?: ChatSupabaseCredentials): Promise<LineMessage[]> {
  const query = new URLSearchParams({ select: "*", line_user_id: `eq.${lineUser}`, order: "created_at.asc", limit: "1000" });
  if (oa) query.set("destination", `eq.${oa}`);
  const rows = await supabaseGet<Array<Record<string, unknown>>>(`line_messages?${query.toString()}`, "chat", credentials);
  const channel = await readLineChannel(oa, credentials).catch(() => null);
  const token = channel?.channel_access_token?.trim() || process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || "";
  return Promise.all(rows.map(async (row, index) => ({
    id: text(row.id || row.line_message_id || row.event_id || `${conversationKey}-${index}`),
    lineUserId: userId(row),
    conversationId: conversationId(row),
    oaId: oaId(row),
    text: messageText(row),
    direction: direction(row),
    messageType: text(row.message_type || row.type || "text"),
    occurredAt: timestamp(row),
    messageId: text(row.line_message_id || row.message_id || row.event_id) || null,
    ...(await mediaForRow(row, token)),
  })));
}

export async function sendLineText(lineUserId: string, message: string, oa: string | undefined, credentials?: ChatSupabaseCredentials) {
  const channel = await readLineChannel(oa, credentials).catch(() => null);
  const token = channel?.channel_access_token?.trim() || process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("ยังไม่มี Token ของ LINE OA นี้ในตาราง line_channels");
  const response = await fetch("https://api.line.me/v2/bot/message/push", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: message }] }) });
  if (!response.ok) throw new Error(`LINE ส่งข้อความไม่สำเร็จ (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const now = new Date().toISOString();
  try { await supabasePost("line_messages", { channel: "line", destination: oa || channel?.oa_id || null, conversation_id: `line_${lineUserId}`, line_user_id: lineUserId, message_type: "text", message_text: message, direction: "outbound", timestamp: now, created_at: now }, "chat", "return=minimal", credentials); } catch (error) { console.error("[line] sent but audit write failed", error); }
  return { ok: true, line_user_id: lineUserId, text: message, sent_at: now };
}
