export type OrderDeckContextInput = {
  pageName: string;
  selectedCustomerMessage?: string | null;
};

export type SelectableCustomerMessage = {
  direction: "inbound";
  senderType: "customer";
  source_lane: "🌌BB_CHAT";
  customer_message_text: string;
  [key: string]: unknown;
};

export function isSelectableCustomerMessage(message: unknown): message is SelectableCustomerMessage {
  if (message === null || typeof message !== "object") return false;
  const candidate = message as { direction?: unknown; senderType?: unknown; source_lane?: unknown; customer_message_text?: unknown };
  return candidate.direction === "inbound"
    && candidate.senderType === "customer"
    && candidate.source_lane === "🌌BB_CHAT"
    && typeof candidate.customer_message_text === "string"
    && candidate.customer_message_text.trim().length > 0;
}

export function buildOrderDeckContextMessage(
  input: OrderDeckContextInput,
  importSelectedCustomerMessage = false,
) {
  const selectedCustomerMessage = String(input.selectedCustomerMessage ?? "")
    .trim()
    .slice(0, 2400);

  if (!importSelectedCustomerMessage || !selectedCustomerMessage) {
    return { type: "BB_ORDER_DECK_CONTEXT" as const };
  }

  return {
    type: "BB_ORDER_DECK_CONTEXT" as const,
    importSelectedCustomerMessage: true as const,
    pageName: input.pageName.trim(),
    selectedCustomerMessage,
  };
}
