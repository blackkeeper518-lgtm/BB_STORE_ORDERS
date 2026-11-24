const PAGE_BUSINESS_MAP: Record<string, string> = {
  "103411062505149": "200213502365612",
  "1032290633303246": "200213502365612",
  "1047257891810878": "200213502365612",
  "111414924711459": "200213502365612",
  "113923148350742": "200213502365612",
  "111653921912793": "1577302616063763",
  "1064404466767377": "3106079592877973",
  "1235719106287717": "3106079592877973",
};

export function parseMetaChatLinkKey(value: unknown) {
  const match = String(value ?? "").trim().match(/^([0-9]+)_t_([0-9]+)$/);
  return match ? { pageId: match[1], conversationId: match[2] } : null;
}

export function buildMetaInboxPageUrl(pageIdValue: unknown) {
  const pageId = String(pageIdValue ?? "").trim();
  const businessId = PAGE_BUSINESS_MAP[pageId];
  if (!pageId || !businessId) return "";
  const params = new URLSearchParams({ global_scope_id: businessId, business_id: businessId, page_id: pageId, asset_id: pageId, mailbox_id: pageId });
  return `https://business.facebook.com/latest/inbox/all/?${params.toString()}`;
}

export function buildMetaConversationUrl(chatLinkKey: unknown) {
  const parsed = parseMetaChatLinkKey(chatLinkKey);
  if (!parsed) return "";
  const businessId = PAGE_BUSINESS_MAP[parsed.pageId];
  if (!businessId) return "";
  const params = new URLSearchParams({
    global_scope_id: businessId,
    asset_id: parsed.pageId,
    page_id: parsed.pageId,
    business_id: businessId,
    mailbox_id: parsed.pageId,
    selected_item_id: parsed.conversationId,
    thread_type: "FB_MESSAGE",
  });
  return `https://business.facebook.com/latest/inbox/all/?${params.toString()}`;
}
