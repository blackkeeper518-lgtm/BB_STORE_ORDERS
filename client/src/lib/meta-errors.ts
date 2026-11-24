export function isTransientMetaInternal(message: string) {
  return /META_TRANSIENT_INTERNAL|subcode\s*=\s*2018012|code\s*=\s*-1\s*[,;].*subcode\s*=\s*2018012/i.test(message);
}

export function getMetaTraceId(message: string) {
  return message.match(/(?:trace|fbtrace_id)\s*=\s*([a-z0-9_-]+)/i)?.[1] ?? null;
}
