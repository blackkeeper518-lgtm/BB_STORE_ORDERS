export type OrderDeckContextInput = {
  pageName: string;
  selectedCustomerMessage?: string | null;
};

export type SelectableCustomerMessage = {
  direction: "inbound";
  senderType: "customer";
  source_lane: "🌌ST_CHAT";
  customer_message_text: string;
  [key: string]: unknown;
};

export function isBBChatCustomerMessage(message: unknown): message is Record<string, unknown> {
  if (message === null || typeof message !== "object") return false;
  const candidate = message as { direction?: unknown; senderType?: unknown; source_lane?: unknown };
  return candidate.direction === "inbound"
    && candidate.senderType === "customer"
    && candidate.source_lane === "🌌ST_CHAT";
}

export function getLatestBBChatCustomerMessage(messages: readonly unknown[]): unknown {
  // Canonical chat messages are chronologically sorted; keep the newest customer row even when its text is blank.
  let latest: unknown = null;
  for (const message of messages) {
    if (isBBChatCustomerMessage(message)) latest = message;
  }
  return latest;
}

export function getSelectedOrderMessageText(
  selection: { threadKey?: string | null; text?: unknown } | null | undefined,
  activeThreadKey: string | null | undefined,
): string {
  if (!selection || !activeThreadKey || selection.threadKey !== activeThreadKey) return "";
  return String(selection.text ?? "");
}

export function isSelectableCustomerMessage(message: unknown): message is SelectableCustomerMessage {
  if (!isBBChatCustomerMessage(message)) return false;
  return typeof message.customer_message_text === "string"
    && message.customer_message_text.trim().length > 0;
}

export function isImportableLatestCustomerMessage(message: unknown): message is SelectableCustomerMessage {
  if (!isBBChatCustomerMessage(message)) return false;
  const text = String(message.customer_message_text ?? "").trim();
  const mediaPlaceholder = /^\[?(?:รูปภาพ|ภาพ|สติกเกอร์|สติ๊กเกอร์|ไฟล์แนบ|วิดีโอ|วีดีโอ)\]?$/iu.test(text)
    || /^(?:ส่งรูปภาพ|ส่งสติกเกอร์)$/iu.test(text);
  return text.length > 0 && /[\p{L}\p{N}]/u.test(text) && !mediaPlaceholder;
}

export function getImportableLatestCustomerMessage(messages: readonly unknown[]): { id: string; text: string } | null {
  const message = getLatestBBChatCustomerMessage(messages);
  if (!isImportableLatestCustomerMessage(message)) return null;
  const text = message.customer_message_text.trim();
  return {
    id: String(message.id ?? message.messageId ?? `${message.occurredAt ?? ""}:${text}`),
    text,
  };
}

export function buildOrderDeckContextMessage(
  input: OrderDeckContextInput,
  importSelectedCustomerMessage = false,
  clearSelectedCustomerMessage = false,
) {
  const pageName = input.pageName.trim();
  const selectedCustomerMessage = String(input.selectedCustomerMessage ?? "")
    .trim()
    .slice(0, 2400);

  if (clearSelectedCustomerMessage) return { type: "ST_ORDER_DECK_CONTEXT" as const, pageName, clearSelectedCustomerMessage: true as const };
  if (!importSelectedCustomerMessage || !selectedCustomerMessage) return { type: "ST_ORDER_DECK_CONTEXT" as const, pageName };

  return {
    type: "ST_ORDER_DECK_CONTEXT" as const,
    importSelectedCustomerMessage: true as const,
    pageName,
    selectedCustomerMessage,
  };
}
