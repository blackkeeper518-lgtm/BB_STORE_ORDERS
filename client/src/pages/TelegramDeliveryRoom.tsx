import { supabasePatch } from "./supabase";

type DeliveryInput = { orderId: number; orderNumber?: string; chatId?: string; message: string; camp: "BB" | "ST" };

function envFor(camp: "BB" | "ST") {
  const prefix = camp === "BB" ? "BB" : "ST";
  return {
    token: process.env[`${prefix}_TELEGRAM_BOT_TOKEN`] || process.env.TELEGRAM_BOT_TOKEN || "",
    defaultChatId: process.env[`${prefix}_TELEGRAM_DEFAULT_CHAT_ID`] || process.env.TELEGRAM_DEFAULT_CHAT_ID || "",
    orderTable: camp === "BB" ? "bb_orders" : "st_orders",
  };
}

/** Sends Telegram and persists the result in the existing order row.
 * The BB SQL trigger owns telegram_status/telegram_status_label defaults and backups;
 * this endpoint only writes the delivery result into those existing columns.
 */
export async function sendTelegramDelivery(input: DeliveryInput) {
  const env = envFor(input.camp);
  const chatId = String(input.chatId || env.defaultChatId).trim();
  if (!env.token) throw new Error(`${input.camp}_TELEGRAM_BOT_TOKEN is not configured on the server`);
  if (!chatId) throw new Error("ไม่มี Telegram chat id ของออเดอร์ และไม่ได้ตั้งค่า default chat id");

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: input.message, disable_web_page_preview: true }),
    });
    const payload = await response.json() as { ok?: boolean; result?: { message_id?: number }; description?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.description || `Telegram HTTP ${response.status}`);

    await supabasePatch(`${env.orderTable}?id=eq.${encodeURIComponent(String(input.orderId))}`, {
      telegram_sent: true,
      telegram_status: "SENT",
      telegram_status_label: "ไปแล้วไปลับ",
      telegram_status_slogan: "ไปแล้วไม่กลับ — ค่อยแวะมาใหม่",
      telegram_sent_at: new Date().toISOString(),
      telegram_message: input.message,
      telegram_copy_text: input.message,
      telegram_body: { status: "SENT", order_number: input.orderNumber || null, chat_id: chatId, telegram_message_id: payload.result?.message_id ?? null, sent_at: new Date().toISOString(), message: input.message },
    });
    return { ok: true, status: "SENT", telegramMessageId: payload.result?.message_id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      await supabasePatch(`${env.orderTable}?id=eq.${encodeURIComponent(String(input.orderId))}`, {
        telegram_sent: false,
        telegram_status: "FAILED",
        telegram_status_label: "ส่งไม่สำเร็จ",
        telegram_status_slogan: message,
        telegram_message: input.message,
        telegram_copy_text: input.message,
        telegram_body: { status: "FAILED", order_number: input.orderNumber || null, chat_id: chatId, error: message, failed_at: new Date().toISOString(), message: input.message },
      });
    } catch (statusError) {
      console.error("[Telegram delivery status] failed:", statusError);
    }
    throw new Error(message);
  }
}
