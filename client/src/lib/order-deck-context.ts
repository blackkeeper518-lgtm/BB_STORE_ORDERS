export type OrderDeckContextInput = {
  pageName: string;
  selectedCustomerMessage?: string | null;
};

export function isSelectableCustomerMessage(message: { direction?: unknown; senderType?: unknown }): boolean {
  return message.direction === "inbound" && message.senderType === "customer";
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
