export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function chatPathForDevice(query = ""): string {
  const suffix = query ? (query.startsWith("?") ? query : `?${query}`) : "";
  return `${isMobileDevice() ? "/mobile-inbox" : "/chats"}${suffix}`;
}
