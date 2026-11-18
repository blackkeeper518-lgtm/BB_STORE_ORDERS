import { supabaseGet, supabasePost, type ChatSupabaseCredentials } from "./supabase";

export type LineConversation = {
  key: string;
  lineUserId: string;
  conversationId: string;
  displayName: string;
  latestAt: string | null;
  preview: string;
  messageCount: number;
};

export type LineMessage = {
  id: string;
  lineUserId: string;
  conversationId: string;
  text: string;
  direction: "inbound" | "outbound";
  messageType: string;
  occurredAt: string | null;
  messageId: string | null;
};

export type LineConnectionStatus = {
  configured: boolean;
  connected: boolean;
  botName: string | null;
  channelId: string | null;
  error: string | null;
};

function text(value: unknown) { return value == null ? "" : String(value); }
function timestamp(row: Record<string, unknown>) { return text(row.created_at || row.occurred_at || row.timestamp || row.time) || null; }
function userId(row: Record<string, unknown>) { return text(row.line_user_id || row.user_id || row.destination || row.customer_id); }
function conversationId(row: Record<string, unknown>) { return text(row.conversation_id || `line_${userId(row)}`); }
function messageText(row: Record<string, unknown>) { return text(row.message_text || row.text || row.content || (row.message as Record<string, unknown> | undefined)?.text); }
function direction(row: Record<string, unknown>): "inbound" | "outbound" {
  const value = text(row.direction || row.speaker || row.source).toLowerCase();
  return value.includes("out") || value.includes("page") || value.includes("admin") ? "outbound" : "inbound";
}

export async function checkLineConnection(): Promise<LineConnectionStatus> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return { configured: false, connected: false, botName: null, channelId: null, error: "ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN บน Render" };
  try {
    const response = await fetch("https://api.line.me/v2/bot/info", { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) return { configured: true, connected: false, botName: null, channelId: null, error: `LINE Token ใช้งานไม่ได้ (${response.status})` };
    return { configured: true, connected: true, botName: text(body.displayName) || null, channelId: text(body.basicId || body.channelId) || null, error: null };
  } catch (error) {
    return { configured: true, connected: false, botName: null, channelId: null, error: error instanceof Error ? error.message : String(error) };
  }
}

async function readRows(credentials?: ChatSupabaseCredentials) {
  const query = new URLSearchParams({ select: "*", order: "created_at.desc", limit: "5000" });
  return supabaseGet<Array<Record<string, unknown>>>(`line_messages?${query.toString()}`, "chat", credentials);
}

export async function fetchLineConversations(credentials?: ChatSupabaseCredentials): Promise<LineConversation[]> {
  const rows = await readRows(credentials);
  const map = new Map<string, LineConversation>();
  for (const row of rows) {
    const lineUserId = userId(row);
    if (!lineUserId) continue;
    const conversation = conversationId(row);
    const key = conversation || `line_${lineUserId}`;
    const occurredAt = timestamp(row);
    const current = map.get(key) ?? { key, lineUserId, conversationId: conversation, displayName: text(row.display_name || row.customer_name || lineUserId), latestAt: occurredAt, preview: messageText(row), messageCount: 0 };
    current.messageCount += 1;
    if (!current.latestAt && occurredAt) current.latestAt = occurredAt;
    if (!current.preview) current.preview = messageText(row);
    if (text(row.display_name || row.customer_name)) current.displayName = text(row.display_name || row.customer_name);
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => String(b.latestAt || "").localeCompare(String(a.latestAt || "")));
}

export async function fetchLineMessages(conversationId: string, credentials?: ChatSupabaseCredentials): Promise<LineMessage[]> {
  const query = new URLSearchParams({ select: "*", conversation_id: `eq.${conversationId}`, order: "created_at.asc", limit: "1000" });
  const rows = await supabaseGet<Array<Record<string, unknown>>>(`line_messages?${query.toString()}`, "chat", credentials);
  return rows.map((row, index) => ({
    id: text(row.id || row.line_message_id || row.event_id || `${conversationId}-${index}`),
    lineUserId: userId(row),
    conversationId: conversationId(row),
    text: messageText(row),
    direction: direction(row),
    messageType: text(row.message_type || row.type || "text"),
    occurredAt: timestamp(row),
    messageId: text(row.line_message_id || row.message_id || row.event_id) || null,
  }));
}

export async function sendLineText(lineUserId: string, message: string, credentials?: ChatSupabaseCredentials) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN บน Render");
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to: lineUserId, messages: [{ type: "text", text: message }] }),
  });
  if (!response.ok) throw new Error(`LINE ส่งข้อความไม่สำเร็จ (${response.status}): ${(await response.text()).slice(0, 300)}`);
  const now = new Date().toISOString();
  try {
    await supabasePost("line_messages", {
      channel: "line",
      conversation_id: `line_${lineUserId}`,
      line_user_id: lineUserId,
      message_type: "text",
      message_text: message,
      direction: "outbound",
      timestamp: now,
      created_at: now,
    }, "chat", "return=minimal", credentials);
  } catch (error) {
    console.error("[line] sent but audit write failed", error);
  }
  return { ok: true, line_user_id: lineUserId, text: message, sent_at: now };
}
