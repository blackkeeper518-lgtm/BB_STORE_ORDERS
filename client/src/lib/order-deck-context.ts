export type ChatMessageForOrderDeck = {
  direction?: unknown;
  text?: unknown;
  occurredAt?: unknown;
  id?: unknown;
  messageId?: unknown;
};

export function selectLatestCustomerMessageTexts(
  messages: readonly ChatMessageForOrderDeck[],
  limit = 20,
): string[] {
  const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit) || 20));
  return messages
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.direction === "inbound" && String(message.text ?? "").trim())
    .sort((left, right) => {
      const leftTime = Date.parse(String(left.message.occurredAt ?? ""));
      const rightTime = Date.parse(String(right.message.occurredAt ?? ""));
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
        return leftTime - rightTime;
      }
      return left.index - right.index;
    })
    .slice(-safeLimit)
    .map(({ message }) => String(message.text ?? "").trim());
}

export function buildOrderDeckContextMessage(input: {
  pageId: string;
  pageName: string;
  threadId: string;
  customerName: string;
  customerPhone: string;
  customerMessages: readonly string[];
}, importCustomerMessages = false) {
  const pageContext = {
    type: "BB_ORDER_DECK_CONTEXT" as const,
    pageName: input.pageName,
    importCustomerMessages,
  };
  if (!importCustomerMessages) return pageContext;

  return {
    ...pageContext,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerMessages: [...input.customerMessages].slice(-20),
  };
}
