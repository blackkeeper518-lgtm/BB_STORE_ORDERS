export type ChatWindowMessage = {
  direction?: string;
  occurredAt?: string | null;
};

const MESSENGER_RESPONSE_WINDOW_MS = 24 * 60 * 60 * 1000;

// ใช้เวลาข้อความลูกค้าล่าสุดที่อ่านอยู่แล้ว ไม่ยิง query เพิ่ม
export function isMessengerResponseWindowExpired(
  messages: readonly ChatWindowMessage[],
  now = Date.now(),
): boolean {
  const latestCustomerMessageAt = messages.reduce((latest, message) => {
    if (message.direction !== "inbound" || !message.occurredAt) return latest;
    const timestamp = Date.parse(message.occurredAt);
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest;
  }, Number.NEGATIVE_INFINITY);

  return Number.isFinite(latestCustomerMessageAt)
    && now - latestCustomerMessageAt >= MESSENGER_RESPONSE_WINDOW_MS;
}
