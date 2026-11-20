const META_TRANSIENT_MARKER = /META_TRANSIENT_INTERNAL/i;
const META_INTERNAL_CODE = /code\s*=\s*-1/i;
const META_INTERNAL_SUBCODE = /(?:error_)?subcode\s*=\s*2018012/i;
const META_TRACE_ID = /\b(?:trace|fbtrace_id)\s*[=:]\s*([a-z\d_-]+)/i;

export function metaTransientSendNotice(message: string): string | null {
  const isKnownTransient = META_TRANSIENT_MARKER.test(message)
    || (META_INTERNAL_CODE.test(message) && META_INTERNAL_SUBCODE.test(message));
  if (!isKnownTransient) return null;

  const traceId = message.match(META_TRACE_ID)?.[1];
  return [
    "Meta error (#-1 / 2018012): ผลการส่งยังไม่ยืนยัน",
    "ตรวจข้อความใน Meta Business Suite ก่อนส่งซ้ำ",
    traceId ? `trace: ${traceId}` : "",
  ].filter(Boolean).join(" · ");
}
