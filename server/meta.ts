import { createHmac, timingSafeEqual } from "node:crypto";
import { getChatSupabaseConfig, type ChatSupabaseCredentials } from "./supabase";

export type MetaAttachment = { type: string; url?: string; payload?: Record<string, unknown> };

const CHAT_PAGE_TOKEN_TABLE = "🌈MILKY_WAY_xXx_TOKEN _PAGE";

async function pageToken(pageId: string, credentials?: ChatSupabaseCredentials) {
  let supabaseUrl: string;
  let serviceRoleKey: string;
  if (credentials) {
    const resolved = getChatSupabaseConfig(credentials);
    supabaseUrl = resolved.baseUrl;
    serviceRoleKey = resolved.key;
  } else {
    const configuredUrl = process.env.CHAT_SUPABASE_URL?.trim();
    if (!configuredUrl) throw new Error("Page token lookup failed: CHAT_SUPABASE_URL is not configured");
    serviceRoleKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
    if (!serviceRoleKey) throw new Error("Page token lookup failed: CHAT_SUPABASE_SERVICE_ROLE_KEY is not configured");
    const resolved = getChatSupabaseConfig({ url: configuredUrl, serviceRoleKey });
    supabaseUrl = resolved.baseUrl;
    serviceRoleKey = resolved.key;
  }
  const headers = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };
  try {
    // The Chat page-token vault is keyed by page_id and belongs to the Chat project only.
    const params = new URLSearchParams({ select: "page_id,page_name,access_token", page_id: `eq.${pageId}`, limit: "1" });
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(CHAT_PAGE_TOKEN_TABLE)}?${params}`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`);
    const rows = await response.json() as Array<Record<string, unknown>>;
    const row = rows[0];
    const token = row?.access_token;
    return typeof token === "string" && token.trim() ? token.trim() : undefined;
  } catch (error) {
    throw new Error(`Page token lookup failed: CHAT: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function verifyMetaSignature(rawBody: string, signature: string | undefined) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`);
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function sendMetaMessage(input: { pageId: string; portalKey?: string; chatLinkKey?: string; recipientId: string; text?: string; imageUrl?: string; stickerId?: string }, credentials?: ChatSupabaseCredentials) {
  const accessToken = await pageToken(input.pageId, credentials);
  if (!accessToken) throw new Error(`No Meta page token configured for page ${input.pageId}`);
  const text = input.text?.trim() || "";
  const imageUrl = input.imageUrl?.trim() || "";
  const stickerId = input.stickerId?.trim() || "";
  const contentCount = [Boolean(text), Boolean(imageUrl), Boolean(stickerId)].filter(Boolean).length;
  if (contentCount === 0) throw new Error("Message text, image, or sticker is required");
  if (contentCount > 1) throw new Error("META_PAYLOAD_CONFLICT: ส่งได้ทีละชนิดเท่านั้น กรุณาเลือกข้อความ รูปภาพ หรือสติกเกอร์อย่างใดอย่างหนึ่ง");
  if (imageUrl && !/^https:\/\//i.test(imageUrl)) throw new Error("META_IMAGE_URL_INVALID: รูปภาพต้องเป็น HTTPS URL ที่ Meta เข้าถึงได้");
  const message: Record<string, unknown> = text ? { text } : imageUrl ? { attachment: { type: "image", payload: { url: imageUrl, is_reusable: false } } } : { sticker_id: stickerId };
  const response = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(input.pageId)}/messages?access_token=${encodeURIComponent(accessToken)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ recipient: { id: input.recipientId }, messaging_type: "RESPONSE", message }),
  });
  const responseText = await response.text();
  let result: { message_id?: string; recipient_id?: string; error?: { message?: string; code?: number; error_subcode?: number; fbtrace_id?: string } } = {};
  try {
    result = JSON.parse(responseText) as typeof result;
  } catch {
    if (!response.ok) {
      throw new Error(`META_SEND_FAILED: Meta returned HTTP ${response.status}: ${responseText.slice(0, 500) || "ไม่มีรายละเอียด"}`);
    }
  }
  if (!response.ok) {
    const message = result.error?.message || `Meta Send API returned HTTP ${response.status}`;
    if (result.error?.code === 10 || /another app|currently controlling|ควบคุมเธรด|แอพอื่นกำลังควบคุม/i.test(message)) {
      throw new Error(`META_THREAD_CONTROL_CONFLICT: ${message}`);
    }
    if (result.error?.code === -1 && result.error?.error_subcode === 2018012) {
      throw new Error(`META_TRANSIENT_INTERNAL: ${message} (code=-1, subcode=2018012${result.error?.fbtrace_id ? `, trace=${result.error.fbtrace_id}` : ""})`);
    }
    const diagnostics = [result.error?.code != null ? `code=${result.error.code}` : "", result.error?.error_subcode != null ? `subcode=${result.error.error_subcode}` : "", result.error?.fbtrace_id ? `trace=${result.error.fbtrace_id}` : ""].filter(Boolean).join(", ");
    throw new Error(`META_SEND_FAILED: ${message}${diagnostics ? ` (${diagnostics})` : ""}`);
  }
  return result;
}

export function extractMetaMessages(body: any) {
  const events: Array<{ providerMessageId?: string; pageId: string; threadId: string; senderId: string; text?: string; attachments?: MetaAttachment[]; occurredAt: Date }> = [];
  if (body?.object !== "page" && body?.object !== "instagram") return events;
  for (const entry of Array.isArray(body.entry) ? body.entry : []) {
    const pageId = String(entry.id ?? "");
    for (const event of Array.isArray(entry.messaging) ? entry.messaging : []) {
      const message = event.message;
      if (!message || message.is_echo) continue;
      const senderId = String(event.sender?.id ?? "");
      if (!pageId || !senderId) continue;
      events.push({
        providerMessageId: message.mid ? String(message.mid) : undefined,
        pageId,
        threadId: senderId,
        senderId,
        text: message.text ? String(message.text) : undefined,
        attachments: Array.isArray(message.attachments) ? message.attachments.map((attachment: any) => ({ type: String(attachment.type ?? "file"), url: attachment.payload?.url ? String(attachment.payload.url) : undefined, payload: attachment.payload })) : undefined,
        occurredAt: new Date(Number(event.timestamp) || Date.now()),
      });
    }
  }
  return events;
}
